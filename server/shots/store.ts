import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { computeNextRunAt, isRunDue } from './schedule.js';
import type {
  CreateShotJobInput,
  LegacyBackupSummaryItem,
  ShotJobRecord,
  ShotNotificationConfig,
  ShotRetention,
  ShotRun,
  ShotSchedule,
  ShotSummary,
  ShotTargetHostId,
  UpdateShotJobInput,
} from './types.js';

type JobRow = {
  id: string;
  friendly_name: string;
  description: string | null;
  tags_json: string;
  target_host_id: ShotTargetHostId;
  source_path: string;
  destination_path: string;
  max_depth: number | null;
  exclude_patterns_json: string;
  schedule_json: string;
  retention_json: string;
  notifications_json: string;
  enabled: number;
  created_at: string;
  updated_at: string;
  next_run_at: string | null;
};

type RunRow = {
  id: string;
  job_id: string;
  status: ShotRun['status'];
  started_at: string | null;
  completed_at: string | null;
  archive_path: string | null;
  size_bytes: number | null;
  file_count: number | null;
  error_message: string | null;
};

type RunPatch = {
  status?: ShotRun['status'];
  started_at?: string | null;
  completed_at?: string | null;
  archive_path?: string | null;
  size_bytes?: number | null;
  file_count?: number | null;
  error_message?: string | null;
};

type TableInfoRow = {
  name: string;
};

function getDefaultDbPath() {
  if (process.env.SHOTS_DB_PATH) {
    return process.env.SHOTS_DB_PATH;
  }

  if (process.cwd() === '/app') {
    return '/app/data/shots.db';
  }

  return join(process.cwd(), 'data', 'shots.db');
}

function parseJson<T>(value: string): T {
  return JSON.parse(value) as T;
}

function formatJob(row: JobRow, lastRun: ShotRun | null): ShotJobRecord {
  return {
    id: row.id,
    friendly_name: row.friendly_name,
    description: row.description ?? undefined,
    tags: parseJson<string[]>(row.tags_json),
    target_host_id: row.target_host_id,
    source_path: row.source_path,
    destination_path: row.destination_path,
    max_depth: row.max_depth,
    exclude_patterns: parseJson<string[]>(row.exclude_patterns_json),
    schedule: parseJson<ShotSchedule>(row.schedule_json),
    retention: parseJson<ShotRetention>(row.retention_json),
    notifications: parseJson<ShotNotificationConfig>(row.notifications_json),
    enabled: Boolean(row.enabled),
    created_at: row.created_at,
    updated_at: row.updated_at,
    next_run_at: row.next_run_at,
    last_run: lastRun,
  };
}

function formatRun(row: RunRow): ShotRun {
  return {
    id: row.id,
    job_id: row.job_id,
    status: row.status,
    started_at: row.started_at ?? undefined,
    completed_at: row.completed_at ?? undefined,
    archive_path: row.archive_path ?? undefined,
    size_bytes: row.size_bytes ?? undefined,
    file_count: row.file_count ?? undefined,
    error_message: row.error_message ?? undefined,
  };
}

function scheduleLabel(schedule: ShotSchedule) {
  switch (schedule.type) {
    case 'manual':
      return 'manual';
    case 'hourly':
      return `hourly:${schedule.minute.toString().padStart(2, '0')}`;
    case 'daily':
      return `daily:${schedule.hour.toString().padStart(2, '0')}:${schedule.minute
        .toString()
        .padStart(2, '0')}`;
    case 'weekly':
      return `weekly:${schedule.day_of_week}`;
    case 'cron':
      return schedule.cron_expression;
  }
}

function normalizeJobInput(input: CreateShotJobInput | UpdateShotJobInput) {
  const schedule = input.schedule ?? { type: 'manual' as const };
  const retention = input.retention ?? {};
  const notifications = input.notifications ?? {
    channels: ['browser'],
    events: ['backup_failed', 'backup_success'],
  };

  return {
    description: input.description ?? null,
    tags: input.tags ?? [],
    target_host_id: input.target_host_id ?? 'laptop',
    max_depth: input.max_depth ?? null,
    exclude_patterns: input.exclude_patterns ?? [],
    schedule,
    retention,
    notifications,
    enabled: input.enabled ?? true,
    next_run_at: input.enabled === false ? null : computeNextRunAt(schedule),
  };
}

export class ShotsStore {
  private db: DatabaseSync;

  constructor(dbPath = getDefaultDbPath()) {
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new DatabaseSync(dbPath);
    this.db.exec('PRAGMA foreign_keys = ON');
    this.migrate();
  }

  private migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS shot_jobs (
        id TEXT PRIMARY KEY,
        friendly_name TEXT NOT NULL,
        description TEXT,
        tags_json TEXT NOT NULL,
        target_host_id TEXT NOT NULL DEFAULT 'laptop',
        source_path TEXT NOT NULL,
        destination_path TEXT NOT NULL,
        max_depth INTEGER,
        exclude_patterns_json TEXT NOT NULL,
        schedule_json TEXT NOT NULL,
        retention_json TEXT NOT NULL,
        notifications_json TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        next_run_at TEXT
      );

      CREATE TABLE IF NOT EXISTS shot_runs (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL,
        status TEXT NOT NULL,
        started_at TEXT,
        completed_at TEXT,
        archive_path TEXT,
        size_bytes INTEGER,
        file_count INTEGER,
        error_message TEXT,
        FOREIGN KEY(job_id) REFERENCES shot_jobs(id) ON DELETE CASCADE
      );
    `);

    const jobColumns = this.db
      .prepare('PRAGMA table_info(shot_jobs)')
      .all() as TableInfoRow[];

    if (!jobColumns.some((column) => column.name === 'target_host_id')) {
      this.db.exec(
        "ALTER TABLE shot_jobs ADD COLUMN target_host_id TEXT NOT NULL DEFAULT 'laptop'",
      );
    }
  }

  private getLastRun(jobId: string) {
    const row = this.db
      .prepare(
        `
          SELECT id, job_id, status, started_at, completed_at, archive_path, size_bytes, file_count, error_message
          FROM shot_runs
          WHERE job_id = ?
          ORDER BY COALESCE(started_at, completed_at) DESC, id DESC
          LIMIT 1
        `,
      )
      .get(jobId) as RunRow | undefined;

    return row ? formatRun(row) : null;
  }

  listJobs() {
    const rows = this.db
      .prepare(
        `
          SELECT
            id, friendly_name, description, tags_json, target_host_id, source_path, destination_path,
            max_depth, exclude_patterns_json, schedule_json, retention_json,
            notifications_json, enabled, created_at, updated_at, next_run_at
          FROM shot_jobs
          ORDER BY friendly_name COLLATE NOCASE
        `,
      )
      .all() as JobRow[];

    return rows.map((row) => formatJob(row, this.getLastRun(row.id)));
  }

  getJob(id: string) {
    const row = this.db
      .prepare(
        `
          SELECT
            id, friendly_name, description, tags_json, target_host_id, source_path, destination_path,
            max_depth, exclude_patterns_json, schedule_json, retention_json,
            notifications_json, enabled, created_at, updated_at, next_run_at
          FROM shot_jobs
          WHERE id = ?
        `,
      )
      .get(id) as JobRow | undefined;

    if (!row) {
      return null;
    }

    return formatJob(row, this.getLastRun(row.id));
  }

  createJob(input: CreateShotJobInput) {
    const id = randomUUID();
    const now = new Date().toISOString();
    const normalized = normalizeJobInput(input);

    this.db
      .prepare(
        `
          INSERT INTO shot_jobs (
            id, friendly_name, description, tags_json, target_host_id, source_path, destination_path,
            max_depth, exclude_patterns_json, schedule_json, retention_json,
            notifications_json, enabled, created_at, updated_at, next_run_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        id,
        input.friendly_name,
        normalized.description,
        JSON.stringify(normalized.tags),
        normalized.target_host_id,
        input.source_path,
        input.destination_path,
        normalized.max_depth,
        JSON.stringify(normalized.exclude_patterns),
        JSON.stringify(normalized.schedule),
        JSON.stringify(normalized.retention),
        JSON.stringify(normalized.notifications),
        normalized.enabled ? 1 : 0,
        now,
        now,
        normalized.next_run_at,
      );

    return this.getJob(id);
  }

  updateJob(id: string, input: UpdateShotJobInput) {
    const existing = this.getJob(id);
    if (!existing) {
      return null;
    }

    const merged = {
      ...existing,
      ...input,
      tags: input.tags ?? existing.tags,
      target_host_id: input.target_host_id ?? existing.target_host_id,
      exclude_patterns: input.exclude_patterns ?? existing.exclude_patterns,
      schedule: input.schedule ?? existing.schedule,
      retention: input.retention ?? existing.retention,
      notifications: input.notifications ?? existing.notifications,
      enabled: input.enabled ?? existing.enabled,
    };

    const normalized = normalizeJobInput(merged);
    const now = new Date().toISOString();

    this.db
      .prepare(
        `
          UPDATE shot_jobs
          SET
            friendly_name = ?,
            description = ?,
            tags_json = ?,
            target_host_id = ?,
            source_path = ?,
            destination_path = ?,
            max_depth = ?,
            exclude_patterns_json = ?,
            schedule_json = ?,
            retention_json = ?,
            notifications_json = ?,
            enabled = ?,
            updated_at = ?,
            next_run_at = ?
          WHERE id = ?
        `,
      )
      .run(
        merged.friendly_name,
        normalized.description,
        JSON.stringify(normalized.tags),
        normalized.target_host_id,
        merged.source_path,
        merged.destination_path,
        normalized.max_depth,
        JSON.stringify(normalized.exclude_patterns),
        JSON.stringify(normalized.schedule),
        JSON.stringify(normalized.retention),
        JSON.stringify(normalized.notifications),
        normalized.enabled ? 1 : 0,
        now,
        normalized.next_run_at,
        id,
      );

    return this.getJob(id);
  }

  deleteJob(id: string) {
    const result = this.db.prepare('DELETE FROM shot_jobs WHERE id = ?').run(id);
    return result.changes > 0;
  }

  listRuns(jobId: string) {
    const rows = this.db
      .prepare(
        `
          SELECT id, job_id, status, started_at, completed_at, archive_path, size_bytes, file_count, error_message
          FROM shot_runs
          WHERE job_id = ?
          ORDER BY COALESCE(started_at, completed_at) DESC, id DESC
        `,
      )
      .all(jobId) as RunRow[];

    return rows.map(formatRun);
  }

  getRun(id: string) {
    const row = this.db
      .prepare(
        `
          SELECT id, job_id, status, started_at, completed_at, archive_path, size_bytes, file_count, error_message
          FROM shot_runs
          WHERE id = ?
        `,
      )
      .get(id) as RunRow | undefined;

    return row ? formatRun(row) : null;
  }

  getActiveRun(jobId: string) {
    const row = this.db
      .prepare(
        `
          SELECT id, job_id, status, started_at, completed_at, archive_path, size_bytes, file_count, error_message
          FROM shot_runs
          WHERE job_id = ? AND status IN ('queued', 'running')
          ORDER BY COALESCE(started_at, completed_at) DESC, id DESC
          LIMIT 1
        `,
      )
      .get(jobId) as RunRow | undefined;

    return row ? formatRun(row) : null;
  }

  createRun(jobId: string, status: ShotRun['status'] = 'queued') {
    const job = this.getJob(jobId);
    if (!job) {
      return null;
    }

    const run: ShotRun = {
      id: randomUUID(),
      job_id: jobId,
      status,
      started_at: new Date().toISOString(),
    };

    this.db
      .prepare(
        `
          INSERT INTO shot_runs (
            id, job_id, status, started_at, completed_at, archive_path, size_bytes, file_count, error_message
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        run.id,
        run.job_id,
        run.status,
        run.started_at ?? null,
        null,
        null,
        null,
        null,
        null,
      );

    return run;
  }

  updateRun(id: string, patch: RunPatch) {
    const current = this.getRun(id);
    if (!current) {
      return null;
    }

    const next = {
      status: patch.status ?? current.status,
      started_at: patch.started_at === undefined ? current.started_at ?? null : patch.started_at,
      completed_at:
        patch.completed_at === undefined ? current.completed_at ?? null : patch.completed_at,
      archive_path:
        patch.archive_path === undefined ? current.archive_path ?? null : patch.archive_path,
      size_bytes: patch.size_bytes === undefined ? current.size_bytes ?? null : patch.size_bytes,
      file_count: patch.file_count === undefined ? current.file_count ?? null : patch.file_count,
      error_message:
        patch.error_message === undefined ? current.error_message ?? null : patch.error_message,
    };

    this.db
      .prepare(
        `
          UPDATE shot_runs
          SET
            status = ?,
            started_at = ?,
            completed_at = ?,
            archive_path = ?,
            size_bytes = ?,
            file_count = ?,
            error_message = ?
          WHERE id = ?
        `,
      )
      .run(
        next.status,
        next.started_at,
        next.completed_at,
        next.archive_path,
        next.size_bytes,
        next.file_count,
        next.error_message,
        id,
      );

    return this.getRun(id);
  }

  updateJobNextRunAt(id: string, nextRunAt: string | null) {
    const now = new Date().toISOString();

    this.db
      .prepare(
        `
          UPDATE shot_jobs
          SET next_run_at = ?, updated_at = ?
          WHERE id = ?
        `,
      )
      .run(nextRunAt, now, id);

    return this.getJob(id);
  }

  computeNextRunAtForJob(id: string, fromDate = new Date()) {
    const job = this.getJob(id);
    if (!job || !job.enabled) {
      return null;
    }

    return computeNextRunAt(job.schedule, fromDate);
  }

  listDueJobs(now = new Date()) {
    return this.listJobs().filter((job) => {
      if (!job.enabled || job.schedule.type === 'manual') {
        return false;
      }

      if (!isRunDue(job.next_run_at, now)) {
        return false;
      }

      return this.getActiveRun(job.id) === null;
    });
  }

  getSummary(): ShotSummary {
    const jobs = this.listJobs();
    const now = new Date();

    let healthyJobs = 0;
    let runningJobs = 0;
    let overdueJobs = 0;
    let failedJobs = 0;

    for (const job of jobs) {
      const lastRun = job.last_run;
      const isRunning = lastRun?.status === 'running' || lastRun?.status === 'queued';
      const isFailed = lastRun?.status === 'failed' || lastRun?.status === 'warning';
      const isOverdue =
        job.enabled &&
        job.schedule.type !== 'manual' &&
        isRunDue(job.next_run_at, now) &&
        !isRunning;

      if (isRunning) {
        runningJobs += 1;
        continue;
      }

      if (isFailed) {
        failedJobs += 1;
        continue;
      }

      if (isOverdue) {
        overdueJobs += 1;
        continue;
      }

      healthyJobs += 1;
    }

    return {
      total_jobs: jobs.length,
      healthy_jobs: healthyJobs,
      running_jobs: runningJobs,
      overdue_jobs: overdueJobs,
      failed_jobs: failedJobs,
    };
  }

  listLegacyBackups(): LegacyBackupSummaryItem[] {
    return this.listJobs().map((job) => {
      const lastRun = job.last_run;
      const isRunning = lastRun?.status === 'running' || lastRun?.status === 'queued';
      const isFailed = lastRun?.status === 'failed' || lastRun?.status === 'warning';
      const isOverdue =
        job.enabled &&
        job.schedule.type !== 'manual' &&
        isRunDue(job.next_run_at, new Date());

      return {
        id: job.id,
        name: job.friendly_name,
        target_id: job.source_path,
        policy: scheduleLabel(job.schedule),
        status: isFailed || isOverdue ? 'degraded' : isRunning ? 'degraded' : 'online',
        last_success: lastRun?.status === 'success' ? lastRun.completed_at : undefined,
        next_scheduled: job.next_run_at ?? undefined,
      };
    });
  }
}

let store: ShotsStore | null = null;

export function getShotsStore() {
  if (!store) {
    store = new ShotsStore();
  }

  return store;
}

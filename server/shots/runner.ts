import { spawn } from 'node:child_process';
import {
  copyFile,
  lstat,
  mkdir,
  opendir,
  readdir,
  readlink,
  rm,
  stat,
  symlink,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { matchesGlob } from 'node:path';
import { emitNotification } from '../notifications/service.js';
import { executeRemoteRun, hasRemoteRunnerConfigured } from './remote-runner.js';
import { computeNextRunAt } from './schedule.js';
import { getShotsStore } from './store.js';
import { tryRealpath, validateShotPath } from './paths.js';
import type { ShotJobRecord, ShotRun } from './types.js';

type BackupEntry = {
  relativePath: string;
  type: 'file' | 'directory' | 'symlink';
};

type Manifest = {
  job_id: string;
  friendly_name: string;
  source_path: string;
  destination_path: string;
  start_time: string;
  end_time: string;
  excludes_used: string[];
  max_depth: number | null;
  archive_path: string;
  size_bytes: number;
  file_count: number;
  status: ShotRun['status'];
  error_message?: string;
};

function timestampForFilename(date = new Date()) {
  return date.toISOString().replaceAll(':', '-');
}

function shouldExclude(relativePath: string, patterns: string[]) {
  const normalized = relativePath.replaceAll(path.sep, '/');

  return patterns.some((pattern) => {
    const trimmed = pattern.trim();
    if (!trimmed) {
      return false;
    }

    const normalizedPattern = trimmed.replaceAll(path.sep, '/');
    return (
      matchesGlob(normalized, normalizedPattern) ||
      matchesGlob(path.posix.basename(normalized), normalizedPattern) ||
      normalized === normalizedPattern ||
      normalized.startsWith(`${normalizedPattern}/`)
    );
  });
}

async function collectEntries(
  rootPath: string,
  relativePath: string,
  depth: number,
  maxDepth: number | null,
  excludePatterns: string[],
): Promise<{ entries: BackupEntry[]; fileCount: number }> {
  const currentPath = path.join(rootPath, relativePath);
  const currentStat = await lstat(currentPath, { bigint: false });

  if (relativePath !== '' && shouldExclude(relativePath, excludePatterns)) {
    return { entries: [], fileCount: 0 };
  }

  if (currentStat.isFile()) {
    return {
      entries: [{ relativePath, type: 'file' }],
      fileCount: 1,
    };
  }

  if (currentStat.isSymbolicLink()) {
    return {
      entries: [{ relativePath, type: 'symlink' }],
      fileCount: 1,
    };
  }

  if (!currentStat.isDirectory()) {
    return { entries: [], fileCount: 0 };
  }

  const entries: BackupEntry[] = relativePath ? [{ relativePath, type: 'directory' }] : [];
  let fileCount = 0;

  if (maxDepth !== null && depth >= maxDepth) {
    return { entries, fileCount };
  }

  const dir = await opendir(currentPath);

  for await (const dirent of dir) {
    const childRelativePath = relativePath ? path.join(relativePath, dirent.name) : dirent.name;
    const child = await collectEntries(rootPath, childRelativePath, depth + 1, maxDepth, excludePatterns);
    entries.push(...child.entries);
    fileCount += child.fileCount;
  }

  return { entries, fileCount };
}

async function materializeSnapshot(
  sourcePath: string,
  tempRoot: string,
  entries: BackupEntry[],
) {
  await mkdir(tempRoot, { recursive: true });

  for (const entry of entries) {
    const sourceEntryPath = path.join(sourcePath, entry.relativePath);
    const destinationEntryPath = path.join(tempRoot, entry.relativePath);

    if (entry.type === 'directory') {
      await mkdir(destinationEntryPath, { recursive: true });
      continue;
    }

    await mkdir(path.dirname(destinationEntryPath), { recursive: true });

    if (entry.type === 'symlink') {
      const linkTarget = await readlink(sourceEntryPath);
      await symlink(linkTarget, destinationEntryPath);
      continue;
    }

    const sourceRealPath = tryRealpath(sourceEntryPath);
    await copyFile(sourceRealPath, destinationEntryPath);
  }
}

function runTar(snapshotDir: string, archivePath: string) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn('tar', ['-czf', archivePath, '-C', snapshotDir, '.'], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderr.trim() || `tar exited with code ${code}`));
    });
  });
}

type RetentionTarget = {
  archivePath: string;
  manifestPath: string;
  mtimeMs: number;
};

async function collectRetentionTargets(jobDestinationDir: string) {
  const entries = await readdir(jobDestinationDir, { withFileTypes: true });
  const archives = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.tar.gz'));
  const targets: RetentionTarget[] = [];

  for (const archive of archives) {
    const archivePath = path.join(jobDestinationDir, archive.name);
    const manifestPath = path.join(
      jobDestinationDir,
      archive.name.replace(/\.tar\.gz$/, '.manifest.json'),
    );
    const archiveStats = await stat(archivePath);

    targets.push({
      archivePath,
      manifestPath,
      mtimeMs: archiveStats.mtimeMs,
    });
  }

  targets.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return targets;
}

async function applyRetention(job: ShotJobRecord) {
  const jobDestinationDir = path.join(job.destination_path, job.id);
  const targets = await collectRetentionTargets(jobDestinationDir);
  const removalPaths = new Set<string>();

  if (job.retention.keep_count !== undefined && job.retention.keep_count !== null) {
    for (const target of targets.slice(job.retention.keep_count)) {
      removalPaths.add(target.archivePath);
      removalPaths.add(target.manifestPath);
    }
  }

  if (job.retention.max_age_days !== undefined && job.retention.max_age_days !== null) {
    const cutoff = Date.now() - job.retention.max_age_days * 24 * 60 * 60 * 1000;

    for (const target of targets) {
      if (target.mtimeMs < cutoff) {
        removalPaths.add(target.archivePath);
        removalPaths.add(target.manifestPath);
      }
    }
  }

  await Promise.all(
    [...removalPaths].map(async (targetPath) => {
      await rm(targetPath, { force: true });
    }),
  );
}

export async function executeShotRun(runId: string) {
  const store = getShotsStore();
  const run = store.getRun(runId);

  if (!run) {
    throw new Error(`Run ${runId} not found`);
  }

  const job = store.getJob(run.job_id);
  if (!job) {
    throw new Error(`Job ${run.job_id} not found`);
  }

  const startedAt = new Date().toISOString();
  store.updateRun(run.id, { status: 'running', started_at: startedAt, error_message: null });
  await emitNotification({
    source: 'shots',
    event_key: 'backup_started',
    title: `Backup started: ${job.friendly_name}`,
    message: `Backup job ${job.friendly_name} started for ${job.source_path}.`,
    severity: 'info',
    channels: job.notifications.events.includes('backup_started') ? job.notifications.channels : [],
  });

  const jobDestinationDir = path.join(job.destination_path, job.id);
  const timestamp = timestampForFilename(new Date(startedAt));
  const archivePath = path.join(jobDestinationDir, `${timestamp}.tar.gz`);
  const manifestPath = path.join(jobDestinationDir, `${timestamp}.manifest.json`);
  const snapshotDir = path.join(jobDestinationDir, `.tmp-${run.id}`);

  try {
    if (hasRemoteRunnerConfigured(job.target_host_id)) {
      const remoteResult = await executeRemoteRun(job);
      const completedAt = remoteResult.completed_at ?? new Date().toISOString();

      store.updateRun(run.id, {
        status: remoteResult.status === 'warning' ? 'warning' : 'success',
        completed_at: completedAt,
        archive_path: remoteResult.archive_path ?? job.destination_path,
        size_bytes: remoteResult.size_bytes ?? 0,
        file_count: remoteResult.file_count ?? 0,
        error_message: remoteResult.error_message ?? null,
      });
      store.updateJobNextRunAt(job.id, computeNextRunAt(job.schedule, new Date(completedAt)));
      await emitNotification({
        source: 'shots',
        event_key: 'backup_success',
        title: `Backup succeeded: ${job.friendly_name}`,
        message: `Backup completed successfully on ${job.target_host_id}. ${
          remoteResult.file_count ?? 0
        } files archived to ${remoteResult.archive_path ?? job.destination_path}.`,
        severity: remoteResult.status === 'warning' ? 'warning' : 'success',
        channels: job.notifications.events.includes('backup_success') ? job.notifications.channels : [],
      });
      return;
    }

    const sourcePathError = validateShotPath(job.source_path, 'source');
    if (sourcePathError) {
      throw new Error(sourcePathError);
    }

    const destinationPathError = validateShotPath(job.destination_path, 'destination');
    if (destinationPathError) {
      throw new Error(destinationPathError);
    }

    await mkdir(jobDestinationDir, { recursive: true });

    const { entries, fileCount } = await collectEntries(
      job.source_path,
      '',
      0,
      job.max_depth ?? null,
      job.exclude_patterns,
    );

    await materializeSnapshot(job.source_path, snapshotDir, entries);
    await runTar(snapshotDir, archivePath);

    const archiveStats = await stat(archivePath);
    const completedAt = new Date().toISOString();

    const manifest: Manifest = {
      job_id: job.id,
      friendly_name: job.friendly_name,
      source_path: job.source_path,
      destination_path: job.destination_path,
      start_time: startedAt,
      end_time: completedAt,
      excludes_used: job.exclude_patterns,
      max_depth: job.max_depth ?? null,
      archive_path: archivePath,
      size_bytes: archiveStats.size,
      file_count: fileCount,
      status: 'success',
    };

    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

    store.updateRun(run.id, {
      status: 'success',
      completed_at: completedAt,
      archive_path: archivePath,
      size_bytes: archiveStats.size,
      file_count: fileCount,
      error_message: null,
    });
    store.updateJobNextRunAt(job.id, computeNextRunAt(job.schedule, new Date(completedAt)));
    await emitNotification({
      source: 'shots',
      event_key: 'backup_success',
      title: `Backup succeeded: ${job.friendly_name}`,
      message: `Backup completed successfully. ${fileCount} files archived to ${archivePath}.`,
      severity: 'success',
      channels: job.notifications.events.includes('backup_success') ? job.notifications.channels : [],
    });

    await applyRetention(job);
  } catch (error) {
    const completedAt = new Date().toISOString();
    store.updateRun(run.id, {
      status: 'failed',
      completed_at: completedAt,
      error_message: error instanceof Error ? error.message : 'Unknown backup failure',
    });

    const manifest: Manifest = {
      job_id: job.id,
      friendly_name: job.friendly_name,
      source_path: job.source_path,
      destination_path: job.destination_path,
      start_time: startedAt,
      end_time: completedAt,
      excludes_used: job.exclude_patterns,
      max_depth: job.max_depth ?? null,
      archive_path,
      size_bytes: 0,
      file_count: 0,
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Unknown backup failure',
    };

    try {
      await mkdir(jobDestinationDir, { recursive: true });
      await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    } catch {
      // Ignore manifest-write failures during error handling.
    }

    await emitNotification({
      source: 'shots',
      event_key: 'backup_failed',
      title: `Backup failed: ${job.friendly_name}`,
      message: error instanceof Error ? error.message : 'Unknown backup failure',
      severity: 'error',
      channels: job.notifications.events.includes('backup_failed') ? job.notifications.channels : [],
    });

    throw error;
  } finally {
    await rm(snapshotDir, { recursive: true, force: true });
  }
}

export function startShotRun(runId: string) {
  void executeShotRun(runId).catch((error) => {
    console.error(`Shot run ${runId} failed:`, error);
  });
}

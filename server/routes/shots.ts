import { Router } from 'express';
import { validateShotPath } from '../shots/paths.js';
import { hasRemoteRunnerConfigured } from '../shots/remote-runner.js';
import { startShotRun } from '../shots/runner.js';
import { getShotsStore } from '../shots/store.js';
import type {
  CreateShotJobInput,
  ShotNotificationConfig,
  ShotSchedule,
  ShotTargetHostId,
  UpdateShotJobInput,
} from '../shots/types.js';

const router = Router();

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isValidSchedule(value: unknown): value is ShotSchedule {
  if (!isObject(value) || typeof value.type !== 'string') {
    return false;
  }

  switch (value.type) {
    case 'manual':
      return true;
    case 'hourly':
      return Number.isInteger(value.minute) && value.minute >= 0 && value.minute <= 59;
    case 'daily':
      return (
        Number.isInteger(value.hour) &&
        value.hour >= 0 &&
        value.hour <= 23 &&
        Number.isInteger(value.minute) &&
        value.minute >= 0 &&
        value.minute <= 59
      );
    case 'weekly':
      return (
        Number.isInteger(value.day_of_week) &&
        value.day_of_week >= 0 &&
        value.day_of_week <= 6 &&
        Number.isInteger(value.hour) &&
        value.hour >= 0 &&
        value.hour <= 23 &&
        Number.isInteger(value.minute) &&
        value.minute >= 0 &&
        value.minute <= 59
      );
    case 'cron':
      return typeof value.cron_expression === 'string' && value.cron_expression.trim().length > 0;
    default:
      return false;
  }
}

function isValidNotifications(value: unknown): value is ShotNotificationConfig {
  if (!isObject(value) || !Array.isArray(value.channels) || !Array.isArray(value.events)) {
    return false;
  }

  return true;
}

function validatePath(path: string, kind: 'source' | 'destination') {
  return validateShotPath(path, kind);
}

function shouldValidatePathsLocally(targetHostId: ShotTargetHostId) {
  return targetHostId === 'laptop' && !hasRemoteRunnerConfigured(targetHostId);
}

function isValidTargetHostId(value: unknown): value is ShotTargetHostId {
  return value === 'laptop' || value === 'cm4';
}

function parseJobInput(body: unknown, partial = false): CreateShotJobInput | UpdateShotJobInput {
  if (!isObject(body)) {
    throw new Error('Request body must be an object');
  }

  const output: UpdateShotJobInput = {};
  const targetHostId = body.target_host_id;
  let normalizedTargetHostId: ShotTargetHostId = 'laptop';
  if (targetHostId !== undefined) {
    if (!isValidTargetHostId(targetHostId)) {
      throw new Error('target_host_id must be one of: laptop, cm4');
    }
    normalizedTargetHostId = targetHostId;
  }

  if ('friendly_name' in body) {
    if (typeof body.friendly_name !== 'string' || body.friendly_name.trim().length === 0) {
      throw new Error('friendly_name is required');
    }
    output.friendly_name = body.friendly_name.trim();
  } else if (!partial) {
    throw new Error('friendly_name is required');
  }

  if ('source_path' in body) {
    if (typeof body.source_path !== 'string') {
      throw new Error('source_path must be a string');
    }
    if (shouldValidatePathsLocally(normalizedTargetHostId)) {
      const error = validatePath(body.source_path, 'source');
      if (error) {
        throw new Error(error);
      }
    }
    output.source_path = body.source_path;
  } else if (!partial) {
    throw new Error('source_path is required');
  }

  if ('destination_path' in body) {
    if (typeof body.destination_path !== 'string') {
      throw new Error('destination_path must be a string');
    }
    if (shouldValidatePathsLocally(normalizedTargetHostId)) {
      const error = validatePath(body.destination_path, 'destination');
      if (error) {
        throw new Error(error);
      }
    }
    output.destination_path = body.destination_path;
  } else if (!partial) {
    throw new Error('destination_path is required');
  }

  if ('target_host_id' in body) {
    if (!isValidTargetHostId(body.target_host_id)) {
      throw new Error('target_host_id must be one of: laptop, cm4');
    }
    output.target_host_id = body.target_host_id;
  } else if (!partial) {
    output.target_host_id = normalizedTargetHostId;
  }

  if ('description' in body) {
    if (body.description !== undefined && body.description !== null && typeof body.description !== 'string') {
      throw new Error('description must be a string');
    }
    output.description = body.description ?? undefined;
  }

  if ('tags' in body) {
    if (!Array.isArray(body.tags) || body.tags.some((value) => typeof value !== 'string')) {
      throw new Error('tags must be an array of strings');
    }
    output.tags = body.tags;
  }

  if ('exclude_patterns' in body) {
    if (
      !Array.isArray(body.exclude_patterns) ||
      body.exclude_patterns.some((value) => typeof value !== 'string')
    ) {
      throw new Error('exclude_patterns must be an array of strings');
    }
    output.exclude_patterns = body.exclude_patterns;
  }

  if ('max_depth' in body) {
    if (body.max_depth !== null && body.max_depth !== undefined && !Number.isInteger(body.max_depth)) {
      throw new Error('max_depth must be an integer or null');
    }
    output.max_depth = body.max_depth as number | null | undefined;
  }

  if ('enabled' in body) {
    if (typeof body.enabled !== 'boolean') {
      throw new Error('enabled must be a boolean');
    }
    output.enabled = body.enabled;
  }

  if ('schedule' in body) {
    if (!isValidSchedule(body.schedule)) {
      throw new Error('schedule is invalid');
    }
    output.schedule = body.schedule;
  }

  if ('retention' in body) {
    if (!isObject(body.retention)) {
      throw new Error('retention must be an object');
    }
    output.retention = {
      keep_count:
        body.retention.keep_count === undefined
          ? undefined
          : body.retention.keep_count === null
            ? null
            : Number(body.retention.keep_count),
      max_age_days:
        body.retention.max_age_days === undefined
          ? undefined
          : body.retention.max_age_days === null
            ? null
            : Number(body.retention.max_age_days),
    };
  }

  if ('notifications' in body) {
    if (!isValidNotifications(body.notifications)) {
      throw new Error('notifications are invalid');
    }
    output.notifications = body.notifications;
  }

  return output;
}

router.get('/jobs', (_req, res) => {
  res.json({ jobs: getShotsStore().listJobs() });
});

router.post('/jobs', (req, res) => {
  try {
    const input = parseJobInput(req.body) as CreateShotJobInput;
    const job = getShotsStore().createJob(input);
    res.status(201).json({ job });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

router.put('/jobs/:id', (req, res) => {
  try {
    const input = parseJobInput(req.body, true);
    const job = getShotsStore().updateJob(req.params.id, input);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ job });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

router.delete('/jobs/:id', (req, res) => {
  const deleted = getShotsStore().deleteJob(req.params.id);

  if (!deleted) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.status(204).send();
});

router.post('/jobs/:id/run', (req, res) => {
  const store = getShotsStore();
  const activeRun = store.getActiveRun(req.params.id);

  if (activeRun) {
    return res.status(409).json({ error: 'Job already has an active run', run: activeRun });
  }

  const run = store.createRun(req.params.id);

  if (!run) {
    return res.status(404).json({ error: 'Job not found' });
  }

  startShotRun(run.id);
  res.status(202).json({ run });
});

router.get('/jobs/:id/runs', (req, res) => {
  res.json({ runs: getShotsStore().listRuns(req.params.id) });
});

router.get('/summary', (_req, res) => {
  res.json(getShotsStore().getSummary());
});

export { router as shotsRouter };

import type { ShotJobRecord } from './types.js';

type RemoteRunResult = {
  status: 'success' | 'failed' | 'warning';
  archive_path?: string;
  manifest_path?: string;
  size_bytes?: number;
  file_count?: number;
  error_message?: string | null;
  completed_at?: string;
};

type RemoteRunRequest = {
  job_id: string;
  friendly_name: string;
  source_path: string;
  destination_path: string;
  exclude_patterns: string[];
  max_depth: number | null;
  retention: {
    keep_count?: number | null;
    max_age_days?: number | null;
  };
};

type RunnerConfig = {
  baseUrl: string;
  token: string;
};

function getBaseUrlForTarget(targetHostId: ShotJobRecord['target_host_id']) {
  if (targetHostId === 'laptop') {
    return process.env.LAPTOP_SHOTS_RUNNER_URL ?? 'http://laptop-exporter:9100';
  }

  if (targetHostId === 'cm4') {
    return process.env.CM4_SHOTS_RUNNER_URL ?? 'http://192.168.6.38:9100';
  }

  return null;
}

function getTokenForTarget(targetHostId: ShotJobRecord['target_host_id']) {
  if (targetHostId === 'laptop') {
    return process.env.LAPTOP_SHOTS_RUNNER_TOKEN ?? '';
  }

  if (targetHostId === 'cm4') {
    return process.env.CM4_SHOTS_RUNNER_TOKEN ?? '';
  }

  return '';
}

function normalizeBaseUrl(url: string) {
  const trimmed = url.trim().replace(/\/+$/, '');
  if (!trimmed) {
    throw new Error('Remote runner URL is not configured');
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  return `http://${trimmed}`;
}

function getRunnerConfig(targetHostId: ShotJobRecord['target_host_id']): RunnerConfig | null {
  const baseUrl = getBaseUrlForTarget(targetHostId);
  if (!baseUrl) {
    return null;
  }

  const token = getTokenForTarget(targetHostId).trim();
  if (!token) {
    return null;
  }

  return {
    baseUrl: normalizeBaseUrl(baseUrl),
    token,
  };
}

export function hasRemoteRunnerConfigured(targetHostId: ShotJobRecord['target_host_id']) {
  return getRunnerConfig(targetHostId) !== null;
}

export async function executeRemoteRun(job: ShotJobRecord) {
  const config = getRunnerConfig(job.target_host_id);
  if (!config) {
    throw new Error(`No remote runner configured for target host ${job.target_host_id}`);
  }

  const requestBody: RemoteRunRequest = {
    job_id: job.id,
    friendly_name: job.friendly_name,
    source_path: job.source_path,
    destination_path: job.destination_path,
    exclude_patterns: job.exclude_patterns,
    max_depth: job.max_depth ?? null,
    retention: job.retention,
  };

  const response = await fetch(`${config.baseUrl}/shots/run-job`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${config.token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(30 * 60 * 1000),
  });

  const payload = (await response.json().catch(() => null)) as RemoteRunResult | { error?: string } | null;

  if (!response.ok) {
    const message =
      payload && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : `Remote runner returned ${response.status}`;
    throw new Error(message);
  }

  return payload as RemoteRunResult;
}

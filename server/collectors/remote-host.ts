/**
 * Fetches metrics from remote host exporters (CM4)
 */

const CM4_URL = 'http://192.168.6.38:9100/metrics';
const TIMEOUT_MS = 5000;

export interface RemoteMetrics {
  cpu_pct: number;
  ram_pct: number;
  disk_pct: number;
  temp_c: number | null;
  uptime_s: number;
}

export interface RemoteHostData {
  metrics: RemoteMetrics;
  containers: Array<{
    id: string;
    name: string;
    image: string;
    status: string;
    running: boolean;
  }>;
  logs: Record<string, string>;
  collected_at: string;
}

export async function fetchCM4Metrics(): Promise<RemoteHostData | null> {
  try {
    const response = await fetch(CM4_URL, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Failed to fetch CM4 metrics:', error);
  }
  return null;
}

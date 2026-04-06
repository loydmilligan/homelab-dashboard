/**
 * Fetches metrics from host exporters.
 */

const TIMEOUT_MS = 5000;

export interface RemoteMetrics {
  cpu_pct: number;
  ram_pct: number;
  ram_total_mb?: number;
  ram_used_mb?: number;
  disk_pct: number;
  temp_c: number | null;
  ambient_temp_c?: number | null;
  surface_temp_c?: number | null;
  temp_source?: string | null;
  uptime_s: number;
  top_cpu?: Array<{
    user: string;
    pid: string;
    cpu_pct: number;
    mem_pct: number;
    command: string;
  }>;
  top_mem?: Array<{
    user: string;
    pid: string;
    cpu_pct: number;
    mem_pct: number;
    command: string;
  }>;
  disks?: Array<{
    filesystem: string;
    size: string;
    used: string;
    available: string;
    use_pct: number;
    mount: string;
  }>;
}

export interface RemoteHostData {
  metrics: RemoteMetrics;
  exporter_version?: string;
  container_name?: string;
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

export async function fetchHostMetrics(url: string): Promise<RemoteHostData | null> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error(`Failed to fetch host metrics from ${url}:`, error);
  }
  return null;
}

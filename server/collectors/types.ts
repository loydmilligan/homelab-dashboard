// Shared types for collectors

export type Status = 'online' | 'offline' | 'degraded' | 'unknown';

export interface Metrics {
  cpu_pct?: number;
  ram_pct?: number;
  ram_total_mb?: number;
  ram_used_mb?: number;
  disk_pct?: number;
  uptime_s?: number;
  temp_c?: number | null;
  ambient_temp_c?: number | null;
  surface_temp_c?: number | null;
  temp_source?: string | null;
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

export interface Host {
  id: string;
  name: string;
  role: string;
  status: Status;
  address?: {
    ip?: string;
    dns?: string[];
  };
  tags?: string[];
  links?: Record<string, string>;
  metrics?: Metrics;
  exporter_info?: {
    version: string;
    container: string;
  };
}

export interface Service {
  id: string;
  name: string;
  host_id: string;
  category: string;
  status: Status;
  url?: string;
  depends_on?: string[];
  exposes?: string[];
  backup_policy?: string;
  check_ids?: string[];
  container_status?: string;
  response_ms?: number;
  last_check?: string;
}

export interface DashboardState {
  hosts: Host[];
  services: Service[];
  network_devices: unknown[];
  access_paths: unknown[];
  iot_hubs: unknown[];
  devices: unknown[];
  checks: unknown[];
  backups: unknown[];
  generated_at: string;
}

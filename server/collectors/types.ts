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
  check_type?: 'http' | 'tcp' | 'docker';
  check_target?: string;
  depends_on?: string[];
  exposes?: string[];
  backup_policy?: string;
  check_ids?: string[];
  container_status?: string;
  container_name?: string;
  response_ms?: number;
  last_check?: string;
}

export interface IoTHub {
  id: string;
  name: string;
  host_id: string;
  protocol: string;
  status: Status;
  device_count?: number;
  last_seen?: string;
}

export interface Device {
  id: string;
  name: string;
  hub_id: string;
  type: string;
  area?: string;
  status: Status;
  last_seen?: string;
  attributes?: {
    battery_pct?: number | null;
    value?: string;
    unit?: string | null;
    device_class?: string;
    [key: string]: unknown;
  };
}

export interface SecretRecord {
  id: string;
  name: string;
  type: 'api_key' | 'token' | 'password' | 'credential' | 'certificate';
  service: string;
  scope: Array<'laptop' | 'cm4'>;
  targets?: string[];
  source?: string;
  last_rotated?: string;
  rotation_policy_days?: number;
  notes?: string;
  status?: 'present' | 'missing';
}

export interface NotificationChannelSummary {
  channel: 'browser' | 'ntfy' | 'smtp';
  enabled: boolean;
  configured: boolean;
  status: Status;
}

export interface NotificationSummary {
  status: Status;
  enabled_channels: number;
  ready_channels: number;
  misconfigured_channels: number;
  channels: NotificationChannelSummary[];
}

export interface DashboardState {
  hosts: Host[];
  services: Service[];
  network_devices: unknown[];
  access_paths: unknown[];
  iot_hubs: IoTHub[];
  devices: Device[];
  checks: unknown[];
  backups: unknown[];
  secrets: SecretRecord[];
  notification_summary?: NotificationSummary;
  generated_at: string;
}

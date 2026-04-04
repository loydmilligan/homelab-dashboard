// Core data types matching the design doc schema

export type Status = 'online' | 'offline' | 'degraded' | 'unknown';

export interface Address {
  ip?: string;
  dns?: string[];
}

export interface Metrics {
  cpu_pct?: number;
  ram_pct?: number;
  disk_pct?: number;
  uptime_s?: number;
  temp_c?: number | null;
}

export interface Host {
  id: string;
  name: string;
  role: string;
  status: Status;
  address?: Address;
  tags?: string[];
  links?: Record<string, string>;
  metrics?: Metrics;
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

export interface NetworkDevice {
  id: string;
  name: string;
  type: 'router' | 'switch' | 'ap' | 'dns' | 'proxy' | 'tunnel' | 'vpn';
  status: Status;
  endpoint?: string;
  dependent_services?: string[];
  notes?: string;
}

export interface AccessPath {
  id: string;
  name: string;
  type: 'cloudflare-tunnel' | 'tailscale' | 'wireguard' | 'direct';
  status: Status;
  endpoint?: string;
  services?: string[];
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
    [key: string]: unknown;
  };
}

export interface Check {
  id: string;
  name: string;
  target_id: string;
  type: 'http' | 'tcp' | 'ping' | 'custom';
  status: Status;
  last_check?: string;
  response_ms?: number;
}

export interface Backup {
  id: string;
  name: string;
  target_id: string;
  policy: string;
  status: Status;
  last_success?: string;
  next_scheduled?: string;
}

export interface DiagramNode {
  id: string;
  kind: 'host' | 'service' | 'hub' | 'network' | 'access';
  label: string;
  x?: number;
  y?: number;
}

export interface DiagramEdge {
  from: string;
  to: string;
  type: 'hosts' | 'depends' | 'exposes' | 'connects';
}

export interface Diagram {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

// Full state object
export interface DashboardState {
  hosts: Host[];
  services: Service[];
  network_devices: NetworkDevice[];
  access_paths: AccessPath[];
  iot_hubs: IoTHub[];
  devices: Device[];
  checks: Check[];
  backups: Backup[];
  diagram?: Diagram;
  generated_at: string;
}

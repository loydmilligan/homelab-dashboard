import type { DashboardState } from '../types/inventory';

const API_URL = '/api/state';
const STATIC_URL = '/state.json';

const DEFAULT_STATE: DashboardState = {
  hosts: [],
  services: [],
  network_devices: [],
  access_paths: [],
  iot_hubs: [],
  devices: [],
  checks: [],
  backups: [],
  secrets: [],
  generated_at: new Date().toISOString(),
};

function normalizeState(data: unknown): DashboardState {
  if (!data || typeof data !== 'object') {
    return DEFAULT_STATE;
  }
  const obj = data as Record<string, unknown>;
  return {
    hosts: Array.isArray(obj.hosts) ? obj.hosts as DashboardState['hosts'] : [],
    services: Array.isArray(obj.services) ? obj.services as DashboardState['services'] : [],
    network_devices: Array.isArray(obj.network_devices) ? obj.network_devices as DashboardState['network_devices'] : [],
    access_paths: Array.isArray(obj.access_paths) ? obj.access_paths as DashboardState['access_paths'] : [],
    iot_hubs: Array.isArray(obj.iot_hubs) ? obj.iot_hubs as DashboardState['iot_hubs'] : [],
    devices: Array.isArray(obj.devices) ? obj.devices as DashboardState['devices'] : [],
    checks: Array.isArray(obj.checks) ? obj.checks as DashboardState['checks'] : [],
    backups: Array.isArray(obj.backups) ? obj.backups as DashboardState['backups'] : [],
    secrets: Array.isArray(obj.secrets) ? obj.secrets as DashboardState['secrets'] : [],
    generated_at: typeof obj.generated_at === 'string' ? obj.generated_at : new Date().toISOString(),
  };
}

export async function fetchState(): Promise<DashboardState> {
  // Try the live API first - single attempt with short timeout
  try {
    const response = await fetch(API_URL, {
      signal: AbortSignal.timeout(3000)
    });
    if (response.ok) {
      const data = await response.json();
      return normalizeState(data);
    }
  } catch {
    // Continue to fallback
  }

  // Fallback to static file
  try {
    const response = await fetch(STATIC_URL);
    if (response.ok) {
      const data = await response.json();
      return normalizeState(data);
    }
  } catch {
    // Continue to default
  }

  return DEFAULT_STATE;
}

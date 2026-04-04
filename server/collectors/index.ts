/**
 * Main collector - orchestrates all data collection
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { load } from 'js-yaml';
import { collectLocalMetrics } from './local-metrics.js';
import { collectDockerContainers } from './docker.js';
import { checkServiceHealth } from './health-checks.js';
import type { DashboardState, Host, Service } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const INVENTORY_DIR = join(__dirname, '..', '..', 'inventory');

interface InventoryFile {
  hosts?: Host[];
  services?: Service[];
  network_devices?: unknown[];
  access_paths?: unknown[];
  iot_hubs?: unknown[];
  devices?: unknown[];
  backups?: unknown[];
}

function loadYaml<T>(filename: string): T {
  const filepath = join(INVENTORY_DIR, filename);
  if (!existsSync(filepath)) {
    console.warn(`Warning: ${filename} not found`);
    return {} as T;
  }
  const content = readFileSync(filepath, 'utf-8');
  return load(content) as T;
}

export async function collectState(): Promise<DashboardState> {
  // Load inventory
  const hostsFile = loadYaml<InventoryFile>('hosts.yaml');
  const servicesFile = loadYaml<InventoryFile>('services.yaml');
  const networkFile = loadYaml<InventoryFile>('network.yaml');
  const iotFile = loadYaml<InventoryFile>('iot.yaml');
  const backupsFile = loadYaml<InventoryFile>('backups.yaml');

  const hosts = hostsFile.hosts ?? [];
  const services = servicesFile.services ?? [];

  // Collect local metrics for laptop
  const localMetrics = await collectLocalMetrics();

  // Update laptop host with real metrics
  const laptopHost = hosts.find(h => h.id === 'laptop');
  if (laptopHost) {
    laptopHost.status = 'online';
    laptopHost.metrics = {
      cpu_pct: localMetrics.cpu,
      ram_pct: localMetrics.ram,
      disk_pct: localMetrics.disk,
      uptime_s: localMetrics.uptime,
      temp_c: localMetrics.temp,
    };
  }

  // Collect Docker container status
  const containers = await collectDockerContainers();

  // Update services with Docker status
  for (const service of services) {
    if (service.host_id === 'laptop') {
      const container = containers.find(c =>
        c.name.toLowerCase().includes(service.id.toLowerCase()) ||
        service.id.toLowerCase().includes(c.name.toLowerCase())
      );
      if (container) {
        service.status = container.running ? 'online' : 'offline';
        service.container_status = container.status;
      }
    }
  }

  // Run health checks for services with URLs
  const healthResults = await checkServiceHealth(services);
  for (const result of healthResults) {
    const service = services.find(s => s.id === result.id);
    if (service) {
      service.status = result.healthy ? 'online' : 'offline';
      service.response_ms = result.responseMs;
      service.last_check = result.timestamp;
    }
  }

  return {
    hosts,
    services,
    network_devices: networkFile.network_devices ?? [],
    access_paths: networkFile.access_paths ?? [],
    iot_hubs: iotFile.iot_hubs ?? [],
    devices: iotFile.devices ?? [],
    checks: [],
    backups: backupsFile.backups ?? [],
    generated_at: new Date().toISOString(),
  };
}

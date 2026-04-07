/**
 * Main collector - orchestrates all data collection
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { load } from 'js-yaml';
import { collectDockerContainers } from './docker.js';
import { checkServiceHealth } from './health-checks.js';
import { collectHomeAssistantIot } from './home-assistant.js';
import { getLaptopMqttThermalReading } from './mqtt-thermal.js';
import { fetchHostMetrics } from './remote-host.js';
import { collectSecretInventory } from './secrets.js';
import type { DashboardState, Host, IoTHub, NotificationSummary, Service } from './types.js';
import { emitNotification } from '../notifications/service.js';
import { getNotificationsStore } from '../notifications/store.js';
import { getShotsStore } from '../shots/store.js';

// Track previous service statuses to detect transitions and avoid repeated alerts
const previousServiceStatuses = new Map<string, string>();

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
  secrets?: unknown[];
}

const LAPTOP_EXPORTER_URL = process.env.LAPTOP_EXPORTER_URL ?? 'http://laptop-exporter:9100/metrics';
const CM4_EXPORTER_URL = process.env.CM4_EXPORTER_URL ?? 'http://192.168.6.38:9100/metrics';

function findMatchingContainer(service: Service, containers: Awaited<ReturnType<typeof collectDockerContainers>>) {
  const requestedName = service.container_name?.toLowerCase();
  const serviceId = service.id.toLowerCase();

  return containers.find((container) => {
    const containerName = container.name.toLowerCase();
    const composeService = container.composeService?.toLowerCase();

    if (requestedName) {
      return containerName === requestedName || composeService === requestedName;
    }

    return (
      containerName.includes(serviceId) ||
      serviceId.includes(containerName) ||
      composeService === serviceId
    );
  });
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

function collectNotificationSummary(): NotificationSummary {
  const settings = getNotificationsStore().getSettings();

  const channels: NotificationSummary['channels'] = [
    {
      channel: 'browser',
      enabled: settings.browser.enabled,
      configured: settings.browser.enabled,
      status: settings.browser.enabled ? 'online' : 'unknown',
    },
    {
      channel: 'ntfy',
      enabled: settings.ntfy.enabled,
      configured: Boolean(settings.ntfy.server_url && settings.ntfy.topic),
      status: !settings.ntfy.enabled ? 'unknown' : settings.ntfy.server_url && settings.ntfy.topic ? 'online' : 'degraded',
    },
    {
      channel: 'smtp',
      enabled: settings.smtp.enabled,
      configured: Boolean(
        settings.smtp.host &&
        settings.smtp.port &&
        settings.smtp.from_email &&
        settings.smtp.to_emails.length > 0,
      ),
      status: !settings.smtp.enabled
        ? 'unknown'
        : settings.smtp.host &&
            settings.smtp.port &&
            settings.smtp.from_email &&
            settings.smtp.to_emails.length > 0
          ? 'online'
          : 'degraded',
    },
  ];

  const enabledChannels = channels.filter((channel) => channel.enabled);
  const readyChannels = enabledChannels.filter((channel) => channel.configured);
  const misconfiguredChannels = enabledChannels.filter((channel) => !channel.configured);

  return {
    status:
      misconfiguredChannels.length > 0
        ? 'degraded'
        : readyChannels.length > 0
          ? 'online'
          : 'unknown',
    enabled_channels: enabledChannels.length,
    ready_channels: readyChannels.length,
    misconfigured_channels: misconfiguredChannels.length,
    channels,
  };
}

export async function collectState(): Promise<DashboardState> {
  // Load inventory
  const hostsFile = loadYaml<InventoryFile>('hosts.yaml');
  const servicesFile = loadYaml<InventoryFile>('services.yaml');
  const networkFile = loadYaml<InventoryFile>('network.yaml');
  const iotFile = loadYaml<InventoryFile>('iot.yaml');
  const backupsFile = loadYaml<InventoryFile>('backups.yaml');
  const runtimeBackups = getShotsStore().listLegacyBackups();
  const secrets = collectSecretInventory(INVENTORY_DIR);
  const notificationSummary = collectNotificationSummary();

  const hosts = hostsFile.hosts ?? [];
  const services = servicesFile.services ?? [];
  const laptopThermal = getLaptopMqttThermalReading();

  // Fetch laptop metrics from local exporter
  const laptopData = await fetchHostMetrics(LAPTOP_EXPORTER_URL);
  const laptopHost = hosts.find(h => h.id === 'laptop');
  if (laptopHost && laptopData) {
    laptopHost.status = 'online';
    laptopHost.metrics = {
      cpu_pct: laptopData.metrics.cpu_pct,
      ram_pct: laptopData.metrics.ram_pct,
      ram_total_mb: laptopData.metrics.ram_total_mb,
      ram_used_mb: laptopData.metrics.ram_used_mb,
      disk_pct: laptopData.metrics.disk_pct,
      uptime_s: laptopData.metrics.uptime_s,
      temp_c: laptopThermal?.surface_temp_c ?? laptopData.metrics.temp_c,
      ambient_temp_c: laptopThermal?.ambient_temp_c ?? laptopData.metrics.ambient_temp_c,
      surface_temp_c: laptopThermal?.surface_temp_c ?? laptopData.metrics.surface_temp_c,
      temp_source: laptopThermal?.sensor ?? laptopData.metrics.temp_source,
      top_cpu: laptopData.metrics.top_cpu,
      top_mem: laptopData.metrics.top_mem,
      disks: laptopData.metrics.disks,
    };
    if (laptopData.exporter_version || laptopData.container_name) {
      laptopHost.exporter_info = {
        version: laptopData.exporter_version ?? 'unknown',
        container: laptopData.container_name ?? 'laptop-exporter',
      };
    }
  } else if (laptopHost) {
    laptopHost.status = 'degraded';
  }

  // Fetch CM4 metrics from remote exporter
  const cm4Data = await fetchHostMetrics(CM4_EXPORTER_URL);
  const cm4Host = hosts.find(h => h.id === 'cm4');
  if (cm4Host && cm4Data) {
    cm4Host.status = 'online';
    cm4Host.metrics = {
      cpu_pct: cm4Data.metrics.cpu_pct,
      ram_pct: cm4Data.metrics.ram_pct,
      ram_total_mb: cm4Data.metrics.ram_total_mb,
      ram_used_mb: cm4Data.metrics.ram_used_mb,
      disk_pct: cm4Data.metrics.disk_pct,
      uptime_s: cm4Data.metrics.uptime_s,
      temp_c: cm4Data.metrics.temp_c,
      ambient_temp_c: cm4Data.metrics.ambient_temp_c,
      surface_temp_c: cm4Data.metrics.surface_temp_c,
      temp_source: cm4Data.metrics.temp_source,
      top_cpu: cm4Data.metrics.top_cpu,
      top_mem: cm4Data.metrics.top_mem,
      disks: cm4Data.metrics.disks,
    };
    if (cm4Data.exporter_version || cm4Data.container_name) {
      cm4Host.exporter_info = {
        version: cm4Data.exporter_version ?? 'unknown',
        container: cm4Data.container_name ?? 'cm4-exporter',
      };
    }
    // Update CM4 services with container status
    for (const service of services) {
      if (service.host_id === 'cm4') {
        const container = cm4Data.containers.find(c =>
          c.name.toLowerCase().includes(service.id.toLowerCase()) ||
          service.id.toLowerCase().includes(c.name.toLowerCase())
        );
        if (container) {
          service.status = container.running ? 'online' : 'offline';
          service.container_name = container.name;
          service.container_status = container.status;
        }
      }
    }
  } else if (cm4Host) {
    cm4Host.status = 'offline';
  }

  // Collect Docker container status
  const containers = await collectDockerContainers();

  // Update services with Docker status
  for (const service of services) {
    if (service.host_id === 'laptop') {
      const container = findMatchingContainer(service, containers);
      if (!container) {
        if (service.check_type === 'docker' || service.container_name) {
          service.status = 'offline';
          service.container_status = 'container not found';
        }
        continue;
      }

      service.container_name = container.name;
      service.status = container.running ? 'online' : 'offline';
      service.container_status = container.status;
    }
  }

  // Run health checks for services with URLs
  const healthResults = await checkServiceHealth(services);
  for (const result of healthResults) {
    const service = services.find(s => s.id === result.id);
    if (service) {
      service.status = result.healthy ? 'online' : 'offline';
      service.response_ms = result.responseMs ?? undefined;
      service.last_check = result.timestamp;
    }
  }

  // Detect service status transitions and emit notifications
  const hostNames = new Map(hosts.map(h => [h.id, h.name]));
  for (const service of services) {
    const prev = previousServiceStatuses.get(service.id);
    const curr = service.status;
    if (prev !== undefined && prev !== curr) {
      const hostLabel = hostNames.get(service.host_id) ?? service.host_id;
      if (curr === 'offline') {
        emitNotification({
          source: 'wapps',
          event_key: `service_down_${service.id}`,
          title: `Service Down: ${service.name}`,
          message: `${service.name} on ${hostLabel} is offline`,
          severity: 'error',
          channels: ['browser', 'ntfy'],
        }).catch((err) => console.error('Failed to emit service-down notification:', err));
      } else if (prev === 'offline' && curr === 'online') {
        emitNotification({
          source: 'wapps',
          event_key: `service_recovered_${service.id}`,
          title: `Service Recovered: ${service.name}`,
          message: `${service.name} on ${hostLabel} is back online`,
          severity: 'success',
          channels: ['browser', 'ntfy'],
        }).catch((err) => console.error('Failed to emit service-recovered notification:', err));
      }
    }
    previousServiceStatuses.set(service.id, curr);
  }

  const haIot = await collectHomeAssistantIot((iotFile.iot_hubs ?? []) as IoTHub[]);

  return {
    hosts,
    services,
    network_devices: networkFile.network_devices ?? [],
    access_paths: networkFile.access_paths ?? [],
    iot_hubs: haIot.iot_hubs,
    devices: haIot.devices.length > 0 ? haIot.devices : (iotFile.devices ?? []),
    checks: [],
    backups: runtimeBackups.length > 0 ? runtimeBackups : backupsFile.backups ?? [],
    secrets,
    notification_summary: notificationSummary,
    generated_at: new Date().toISOString(),
  };
}

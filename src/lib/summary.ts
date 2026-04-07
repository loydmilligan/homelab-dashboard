import type { AccessPath, Backup, DashboardState, Host, SecretRecord, Service, Status } from '../types/inventory';

export type SummaryProvenance = 'live' | 'inventory' | 'mixed' | 'inferred';

export interface SummaryMetric {
  id: string;
  label: string;
  value: string;
  detail: string;
  status: Status;
  provenance: SummaryProvenance;
}

export interface SummaryIndicator {
  id: string;
  label: string;
  value: string;
  status: Status;
  provenance: SummaryProvenance;
  note: string;
}

export interface DashboardSummary {
  generatedAt: string;
  overallStatus: Status;
  overallLabel: string;
  overallDetail: string;
  metrics: SummaryMetric[];
  indicators: SummaryIndicator[];
  hostPressure: Host[];
  degradedHosts: Host[];
  degradedServices: Service[];
  degradedAccessPaths: AccessPath[];
  degradedBackups: Backup[];
  rotationRiskSecrets: SecretRecord[];
  provenanceNote: string;
}

function statusRank(status: Status) {
  switch (status) {
    case 'offline':
      return 4;
    case 'degraded':
      return 3;
    case 'unknown':
      return 2;
    case 'online':
    default:
      return 1;
  }
}

function combineStatuses(statuses: Status[]): Status {
  if (statuses.length === 0) {
    return 'unknown';
  }

  return statuses.reduce((worst, current) =>
    statusRank(current) > statusRank(worst) ? current : worst,
  );
}

function countByStatus<T extends { status: Status }>(items: T[]) {
  return {
    online: items.filter((item) => item.status === 'online').length,
    degraded: items.filter((item) => item.status === 'degraded').length,
    offline: items.filter((item) => item.status === 'offline').length,
    unknown: items.filter((item) => item.status === 'unknown').length,
  };
}

function hostUnderPressure(host: Host) {
  const metrics = host.metrics;
  if (!metrics) {
    return false;
  }

  return (
    (metrics.cpu_pct ?? 0) >= 85 ||
    (metrics.ram_pct ?? 0) >= 85 ||
    (metrics.disk_pct ?? 0) >= 90 ||
    (metrics.surface_temp_c ?? metrics.temp_c ?? 0) >= 75
  );
}

function getBackupFreshness(backup: Backup, now: Date) {
  if (!backup.last_success) {
    return 'stale';
  }

  const lastSuccess = new Date(backup.last_success);
  const ageMs = now.getTime() - lastSuccess.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  if (ageDays > 3) {
    return 'stale';
  }
  if (ageDays > 1.5) {
    return 'degraded';
  }
  return 'fresh';
}

function getRotationRisk(secret: SecretRecord, now: Date): 'ok' | 'due' | 'overdue' | 'unknown' {
  if (!secret.last_rotated || !secret.rotation_policy_days) {
    return 'unknown';
  }

  const lastRotated = new Date(secret.last_rotated);
  const ageDays = (now.getTime() - lastRotated.getTime()) / (1000 * 60 * 60 * 24);
  const remaining = secret.rotation_policy_days - ageDays;

  if (remaining < 0) {
    return 'overdue';
  }
  if (remaining < 14) {
    return 'due';
  }
  return 'ok';
}

function findAccessPath(state: DashboardState, name: string) {
  return state.access_paths.find((path) => path.name.toLowerCase().includes(name.toLowerCase()));
}

export function deriveDashboardSummary(state: DashboardState): DashboardSummary {
  const now = new Date(state.generated_at);
  const hostCounts = countByStatus(state.hosts);
  const serviceCounts = countByStatus(state.services);
  const backupCounts = countByStatus(state.backups);

  const hostPressure = state.hosts.filter(hostUnderPressure);
  const degradedHosts = state.hosts.filter((host) => host.status !== 'online');
  const degradedServices = state.services.filter((service) => service.status !== 'online');
  const degradedAccessPaths = state.access_paths.filter((path) => path.status !== 'online');
  const degradedBackups = state.backups.filter((backup) => backup.status !== 'online');
  const staleBackups = state.backups.filter((backup) => getBackupFreshness(backup, now) !== 'fresh');
  const rotationRiskSecrets = state.secrets.filter((secret) => {
    const risk = getRotationRisk(secret, now);
    return risk === 'due' || risk === 'overdue' || secret.status === 'missing';
  });
  const notificationSummary = state.notification_summary;
  const readyNotificationChannels = notificationSummary?.ready_channels ?? 0;
  const enabledNotificationChannels = notificationSummary?.enabled_channels ?? 0;
  const degradedNotificationChannels = notificationSummary?.misconfigured_channels ?? 0;

  const overallStatus = combineStatuses([
    combineStatuses(state.hosts.map((host) => host.status)),
    combineStatuses(state.services.map((service) => service.status)),
    degradedBackups.length > 0 ? 'degraded' : 'online',
  ]);

  const metrics: SummaryMetric[] = [
    {
      id: 'hosts',
      label: 'Hosts',
      value: `${hostCounts.online}/${state.hosts.length}`,
      detail: hostCounts.degraded + hostCounts.offline > 0
        ? `${hostCounts.degraded + hostCounts.offline} need attention`
        : 'All reporting healthy',
      status: hostCounts.degraded + hostCounts.offline > 0 ? 'degraded' : hostCounts.online > 0 ? 'online' : 'unknown',
      provenance: 'live',
    },
    {
      id: 'wapps',
      label: 'Wapps',
      value: `${serviceCounts.online}/${state.services.length}`,
      detail: serviceCounts.degraded + serviceCounts.offline > 0
        ? `${serviceCounts.degraded + serviceCounts.offline} unhealthy`
        : 'Health checks and containers aligned',
      status: serviceCounts.degraded + serviceCounts.offline > 0 ? 'degraded' : serviceCounts.online > 0 ? 'online' : 'unknown',
      provenance: 'live',
    },
    {
      id: 'shots',
      label: 'Shots',
      value: `${state.backups.length - staleBackups.length}/${state.backups.length}`,
      detail: staleBackups.length > 0 ? `${staleBackups.length} stale or degraded` : 'Recent successes look healthy',
      status: staleBackups.length > 0 || backupCounts.degraded + backupCounts.offline > 0 ? 'degraded' : state.backups.length > 0 ? 'online' : 'unknown',
      provenance: 'mixed',
    },
    {
      id: 'pressure',
      label: 'Host Pressure',
      value: hostPressure.length.toString(),
      detail: hostPressure.length > 0 ? 'CPU, RAM, disk, or thermal pressure detected' : 'No hot hosts right now',
      status: hostPressure.length > 0 ? 'degraded' : 'online',
      provenance: 'inferred',
    },
    {
      id: 'access',
      label: 'Access Paths',
      value: `${state.access_paths.length - degradedAccessPaths.length}/${state.access_paths.length}`,
      detail: degradedAccessPaths.length > 0 ? `${degradedAccessPaths.length} degraded or unknown` : 'Configured paths look stable',
      status: degradedAccessPaths.length > 0 ? 'degraded' : state.access_paths.length > 0 ? 'online' : 'unknown',
      provenance: 'inventory',
    },
  ];

  const cloudflarePath = findAccessPath(state, 'cloudflare');
  const tailscalePath = findAccessPath(state, 'tailscale');

  const indicators: SummaryIndicator[] = [
    {
      id: 'cloudflare',
      label: 'Cloudflare',
      value: cloudflarePath?.status ?? 'unknown',
      status: cloudflarePath?.status ?? 'unknown',
      provenance: cloudflarePath ? 'inventory' : 'unknown' as SummaryProvenance,
      note: cloudflarePath ? 'Currently inventory-backed access status' : 'Path not configured',
    },
    {
      id: 'tailscale',
      label: 'Tailscale',
      value: tailscalePath?.status ?? 'unknown',
      status: tailscalePath?.status ?? 'unknown',
      provenance: tailscalePath ? 'inventory' : 'unknown' as SummaryProvenance,
      note: tailscalePath ? 'Currently inventory-backed access status' : 'Path not configured',
    },
    {
      id: 'backups',
      label: 'Backup Freshness',
      value: staleBackups.length === 0 ? 'fresh' : `${staleBackups.length} stale`,
      status: staleBackups.length === 0 ? 'online' : 'degraded',
      provenance: 'mixed',
      note: 'Driven by backup summary state and last-success timestamps',
    },
    {
      id: 'crets',
      label: 'Secret Hygiene',
      value: rotationRiskSecrets.length === 0 ? 'stable' : `${rotationRiskSecrets.length} risks`,
      status: rotationRiskSecrets.length === 0 ? 'online' : 'degraded',
      provenance: 'mixed',
      note: 'Metadata-backed rotation and env presence checks',
    },
    {
      id: 'pressure',
      label: 'Pressure',
      value: hostPressure.length === 0 ? 'normal' : `${hostPressure.length} hot`,
      status: hostPressure.length === 0 ? 'online' : 'degraded',
      provenance: 'inferred',
      note: 'Derived from host CPU, RAM, disk, and temperature thresholds',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      value:
        enabledNotificationChannels === 0
          ? 'not set'
          : degradedNotificationChannels > 0
            ? `${readyNotificationChannels}/${enabledNotificationChannels} ready`
            : `${readyNotificationChannels} ready`,
      status: notificationSummary?.status ?? 'unknown',
      provenance: 'mixed',
      note:
        enabledNotificationChannels === 0
          ? 'App-wide channels exist but none are enabled yet'
          : degradedNotificationChannels > 0
            ? `${degradedNotificationChannels} enabled channel needs configuration`
            : 'App-wide delivery channels are configured and ready',
    },
  ];

  const overallLabel =
    overallStatus === 'online'
      ? 'Operational'
      : overallStatus === 'degraded'
        ? 'Attention Needed'
        : overallStatus === 'offline'
          ? 'Major Issues'
          : 'Signal Incomplete';

  const overallDetail =
    overallStatus === 'online'
      ? 'Core hosts, services, and backups look healthy.'
      : `${degradedHosts.length} hosts, ${degradedServices.length} services, ${degradedBackups.length} backups need review.`;

  return {
    generatedAt: state.generated_at,
    overallStatus,
    overallLabel,
    overallDetail,
    metrics,
    indicators,
    hostPressure,
    degradedHosts,
    degradedServices,
    degradedAccessPaths,
    degradedBackups,
    rotationRiskSecrets,
    provenanceNote:
      'Summary surfaces combine live telemetry with some inventory-backed and inferred signals. Inventory-backed items are labeled in their indicators.',
  };
}

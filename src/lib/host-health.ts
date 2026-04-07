import type { Host, Metrics, Status } from '../types/inventory';

export interface MetricThreshold {
  warn: number;
  critical: number;
}

export interface HostMetricHealth {
  label: string;
  value?: number | null;
  status: Status;
  detail: string;
  thresholds: MetricThreshold;
}

const CPU_THRESHOLDS: MetricThreshold = { warn: 80, critical: 90 };
const RAM_THRESHOLDS: MetricThreshold = { warn: 80, critical: 90 };
const DISK_THRESHOLDS: MetricThreshold = { warn: 85, critical: 92 };
const SURFACE_TEMP_THRESHOLDS: MetricThreshold = { warn: 65, critical: 75 };
const INTERNAL_TEMP_THRESHOLDS: MetricThreshold = { warn: 75, critical: 85 };

function classifyMetric(value: number | null | undefined, thresholds: MetricThreshold): Status {
  if (value == null) {
    return 'unknown';
  }

  if (value >= thresholds.critical) {
    return 'offline';
  }

  if (value >= thresholds.warn) {
    return 'degraded';
  }

  return 'online';
}

function tempThresholds(metrics?: Metrics): MetricThreshold {
  return metrics?.surface_temp_c != null ? SURFACE_TEMP_THRESHOLDS : INTERNAL_TEMP_THRESHOLDS;
}

function primaryTemp(metrics?: Metrics) {
  return metrics?.surface_temp_c ?? metrics?.temp_c;
}

export function getCpuHealth(host: Host): HostMetricHealth {
  const value = host.metrics?.cpu_pct;
  return {
    label: 'CPU',
    value,
    status: classifyMetric(value, CPU_THRESHOLDS),
    detail: `Warn at ${CPU_THRESHOLDS.warn}% · critical at ${CPU_THRESHOLDS.critical}%`,
    thresholds: CPU_THRESHOLDS,
  };
}

export function getRamHealth(host: Host): HostMetricHealth {
  const value = host.metrics?.ram_pct;
  return {
    label: 'RAM',
    value,
    status: classifyMetric(value, RAM_THRESHOLDS),
    detail: `Warn at ${RAM_THRESHOLDS.warn}% · critical at ${RAM_THRESHOLDS.critical}%`,
    thresholds: RAM_THRESHOLDS,
  };
}

export function getDiskHealth(host: Host): HostMetricHealth {
  const value = host.metrics?.disk_pct;
  return {
    label: 'Disk',
    value,
    status: classifyMetric(value, DISK_THRESHOLDS),
    detail: `Warn at ${DISK_THRESHOLDS.warn}% · critical at ${DISK_THRESHOLDS.critical}%`,
    thresholds: DISK_THRESHOLDS,
  };
}

export function getTempHealth(host: Host): HostMetricHealth {
  const value = primaryTemp(host.metrics);
  const thresholds = tempThresholds(host.metrics);
  const sourceLabel = host.metrics?.surface_temp_c != null ? 'surface probe' : 'internal sensor';

  return {
    label: 'Temp',
    value,
    status: classifyMetric(value, thresholds),
    detail: `${sourceLabel} · warn at ${thresholds.warn}C · critical at ${thresholds.critical}C`,
    thresholds,
  };
}

export function getHostHealthSignals(host: Host) {
  return {
    cpu: getCpuHealth(host),
    ram: getRamHealth(host),
    disk: getDiskHealth(host),
    temp: getTempHealth(host),
  };
}

export function isHostUnderPressure(host: Host) {
  const { cpu, ram, disk, temp } = getHostHealthSignals(host);
  return [cpu, ram, disk, temp].some((metric) => metric.status === 'degraded' || metric.status === 'offline');
}


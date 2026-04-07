import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveDashboardSummary } from '../src/lib/summary.ts';
import type { DashboardState } from '../src/types/inventory.ts';

function createState(overrides: Partial<DashboardState> = {}): DashboardState {
  return {
    hosts: [
      {
        id: 'laptop',
        name: 'Laptop',
        role: 'primary',
        status: 'online',
        metrics: {
          cpu_pct: 22,
          ram_pct: 48,
          disk_pct: 63,
          temp_c: 51,
        },
      },
    ],
    services: [
      {
        id: 'grafana',
        name: 'Grafana',
        host_id: 'laptop',
        category: 'monitoring',
        status: 'online',
      },
    ],
    network_devices: [],
    access_paths: [
      {
        id: 'cf',
        name: 'Cloudflare Tunnel',
        type: 'cloudflare-tunnel',
        status: 'online',
      },
      {
        id: 'ts',
        name: 'Tailscale',
        type: 'tailscale',
        status: 'online',
      },
    ],
    iot_hubs: [],
    devices: [],
    checks: [],
    backups: [
      {
        id: 'shots-1',
        name: 'Nightly Backup',
        target_id: 'laptop',
        policy: 'daily',
        status: 'online',
        last_success: '2026-04-07T10:00:00.000Z',
      },
    ],
    secrets: [],
    notification_summary: {
      status: 'online',
      enabled_channels: 2,
      ready_channels: 2,
      misconfigured_channels: 0,
      channels: [
        { channel: 'browser', enabled: true, configured: true, status: 'online' },
        { channel: 'ntfy', enabled: true, configured: true, status: 'online' },
        { channel: 'smtp', enabled: false, configured: false, status: 'unknown' },
      ],
    },
    generated_at: '2026-04-07T12:00:00.000Z',
    ...overrides,
  };
}

test('marks stale backups as degraded in KPI and indicator surfaces', () => {
  const state = createState({
    backups: [
      {
        id: 'shots-1',
        name: 'Nightly Backup',
        target_id: 'laptop',
        policy: 'daily',
        status: 'online',
        last_success: '2026-04-03T00:00:00.000Z',
      },
    ],
  });

  const summary = deriveDashboardSummary(state);
  const shotsMetric = summary.metrics.find((metric) => metric.id === 'shots');
  const backupIndicator = summary.indicators.find((indicator) => indicator.id === 'backups');

  assert.ok(shotsMetric);
  assert.equal(shotsMetric.status, 'degraded');
  assert.match(shotsMetric.detail, /stale or degraded/);

  assert.ok(backupIndicator);
  assert.equal(backupIndicator.status, 'degraded');
  assert.equal(backupIndicator.value, '1 stale');
});

test('surfaces degraded access paths as an inventory-backed KPI', () => {
  const state = createState({
    access_paths: [
      {
        id: 'cf',
        name: 'Cloudflare Tunnel',
        type: 'cloudflare-tunnel',
        status: 'online',
      },
      {
        id: 'ts',
        name: 'Tailscale',
        type: 'tailscale',
        status: 'degraded',
      },
    ],
  });

  const summary = deriveDashboardSummary(state);
  const accessMetric = summary.metrics.find((metric) => metric.id === 'access');

  assert.ok(accessMetric);
  assert.equal(accessMetric.status, 'degraded');
  assert.equal(accessMetric.provenance, 'inventory');
  assert.equal(accessMetric.value, '1/2');
  assert.match(accessMetric.detail, /1 degraded or unknown/);
});

test('shows notification readiness as degraded when enabled channels are misconfigured', () => {
  const state = createState({
    notification_summary: {
      status: 'degraded',
      enabled_channels: 2,
      ready_channels: 1,
      misconfigured_channels: 1,
      channels: [
        { channel: 'browser', enabled: true, configured: true, status: 'online' },
        { channel: 'ntfy', enabled: true, configured: false, status: 'degraded' },
        { channel: 'smtp', enabled: false, configured: false, status: 'unknown' },
      ],
    },
  });

  const summary = deriveDashboardSummary(state);
  const notificationsIndicator = summary.indicators.find((indicator) => indicator.id === 'notifications');

  assert.ok(notificationsIndicator);
  assert.equal(notificationsIndicator.status, 'degraded');
  assert.equal(notificationsIndicator.value, '1/2 ready');
  assert.match(notificationsIndicator.note, /1 enabled channel needs configuration/);
});

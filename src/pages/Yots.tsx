import { useMemo, useState } from 'react';
import { useStatePolling } from '../hooks/useStatePolling';
import { Card } from '../components/Card';
import { StatusChip } from '../components/StatusChip';
import { PageHero } from '../components/PageHero';
import type { Device, IoTHub } from '../types/inventory';

const EMPTY_HUBS: IoTHub[] = [];
const EMPTY_DEVICES: Device[] = [];

type GroupBy = 'area' | 'type' | 'hub';

const deviceIcons: Record<string, string> = {
  light: '💡',
  sensor: '📡',
  contact: '🚪',
  climate: '🌡️',
  temperature: '🌡️',
  humidity: '💧',
  motion: '🏃',
  safety: '🚨',
  switch: '🔘',
  button: '🔲',
  plug: '🔌',
  lock: '🔒',
  camera: '📷',
  speaker: '🔊',
};

const hubIcons: Record<string, string> = {
  zigbee: '📶',
  mqtt: '📨',
  zwave: '🌊',
  wifi: '📡',
  bluetooth: '🔵',
};

const deviceTypeLabels: Record<string, string> = {
  contact: 'Doors',
  motion: 'Motion',
  temperature: 'Temperature',
  humidity: 'Humidity',
  safety: 'Safety',
  sensor: 'Sensors',
};

function BatteryIndicator({ level }: { level: number }) {
  let color = 'text-green-400';
  let icon = '🔋';
  if (level < 20) {
    color = 'text-red-400';
    icon = '🪫';
  } else if (level < 50) {
    color = 'text-amber-400';
  }

  return (
    <span className={`text-sm ${color}`} title={`Battery: ${level}%`}>
      {icon} {level}%
    </span>
  );
}

function HubCard({ hub, deviceCount }: { hub: IoTHub; deviceCount: number }) {
  return (
    <Card className="transition-colors hover:border-gray-600">
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{hubIcons[hub.protocol] || '🔗'}</span>
          <div>
            <h3 className="text-lg font-medium text-gray-100">{hub.name}</h3>
            <p className="text-sm capitalize text-gray-500">{hub.protocol}</p>
          </div>
        </div>
        <StatusChip status={hub.status} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-gray-500">Devices</div>
          <div className="text-xl font-semibold text-gray-200">{deviceCount}</div>
        </div>
        {hub.last_seen && (
          <div>
            <div className="text-xs text-gray-500">Last Seen</div>
            <div className="text-sm text-gray-300">
              {new Date(hub.last_seen).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function DeviceCard({ device }: { device: Device }) {
  const battery = device.attributes?.battery_pct;
  const lastSeen = device.last_seen;
  const value = device.attributes?.value;

  return (
    <Card className="transition-colors hover:border-gray-600">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{deviceIcons[device.type] || '📱'}</span>
          <div>
            <h4 className="font-medium text-gray-200">{device.name}</h4>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="capitalize">{device.type}</span>
              {device.area && (
                <>
                  <span>•</span>
                  <span className="capitalize">{device.area.replace(/-/g, ' ')}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <StatusChip status={device.status} size="sm" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-gray-800 pt-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-500">Value</div>
          <div className="mt-1 text-sm text-gray-200">{value ?? 'No reading'}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-500">Battery</div>
          <div className="mt-1 text-sm text-gray-200">
            {typeof battery === 'number' ? <BatteryIndicator level={battery} /> : 'Mains / N/A'}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>{device.attributes?.device_class ?? 'entity'}</span>
        <span>{lastSeen ? new Date(lastSeen).toLocaleTimeString() : 'No heartbeat'}</span>
      </div>
    </Card>
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <h3 className="text-lg font-medium capitalize text-gray-200">{title.replace(/-/g, ' ')}</h3>
      <span className="text-sm text-gray-500">({count})</span>
    </div>
  );
}

export function Yots() {
  const { state, loading, error } = useStatePolling();
  const [groupBy, setGroupBy] = useState<GroupBy>('area');
  const [showLowBatteryOnly, setShowLowBatteryOnly] = useState(false);
  const hubs = state?.iot_hubs ?? EMPTY_HUBS;
  const devices = state?.devices ?? EMPTY_DEVICES;

  const hubMap = useMemo(() => {
    return new Map(hubs.map((hub) => [hub.id, hub]));
  }, [hubs]);

  const filteredDevices = useMemo(() => {
    if (!showLowBatteryOnly) {
      return devices;
    }
    return devices.filter((device) => {
      const battery = device.attributes?.battery_pct;
      return typeof battery === 'number' && battery < 30;
    });
  }, [devices, showLowBatteryOnly]);

  const groupedDevices = useMemo(() => {
    const groups = new Map<string, Device[]>();
    for (const device of filteredDevices) {
      let key: string;
      switch (groupBy) {
        case 'area':
          key = device.area || 'Unassigned';
          break;
        case 'type':
          key = device.type;
          break;
        case 'hub':
          key = hubMap.get(device.hub_id)?.name || device.hub_id;
          break;
      }
      const existing = groups.get(key) ?? [];
      existing.push(device);
      groups.set(key, existing);
    }

    return new Map([...groups.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  }, [filteredDevices, groupBy, hubMap]);

  const deviceCountPerHub = useMemo(() => {
    const counts = new Map<string, number>();
    for (const device of devices) {
      counts.set(device.hub_id, (counts.get(device.hub_id) ?? 0) + 1);
    }
    return counts;
  }, [devices]);

  const lowBatteryCount = useMemo(() => {
    return devices.filter((device) => {
      const battery = device.attributes?.battery_pct;
      return typeof battery === 'number' && battery < 30;
    }).length;
  }, [devices]);

  const activeOpenCount = useMemo(() => {
    return devices.filter((device) => {
      const value = `${device.attributes?.value ?? ''}`.toLowerCase();
      return value === 'active' || value === 'open' || value === 'detected';
    }).length;
  }, [devices]);

  const staleCount = useMemo(() => {
    const now = Date.now();
    const staleMs = 6 * 60 * 60 * 1000;

    return devices.filter((device) => {
      if (!device.last_seen) {
        return true;
      }
      return now - new Date(device.last_seen).getTime() > staleMs;
    }).length;
  }, [devices]);

  const devicesByType = useMemo(() => {
    const counts = new Map<string, number>();
    for (const device of devices) {
      counts.set(device.type, (counts.get(device.type) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [devices]);

  const priorityDevices = useMemo(() => {
    const priorityOrder = {
      contact: 0,
      motion: 1,
      safety: 2,
      temperature: 3,
      humidity: 4,
      sensor: 5,
    } as const;

    return [...filteredDevices]
      .sort((a, b) => {
        const aBattery = typeof a.attributes?.battery_pct === 'number' ? a.attributes.battery_pct : 101;
        const bBattery = typeof b.attributes?.battery_pct === 'number' ? b.attributes.battery_pct : 101;
        const aPriority = priorityOrder[a.type as keyof typeof priorityOrder] ?? 99;
        const bPriority = priorityOrder[b.type as keyof typeof priorityOrder] ?? 99;

        if (aBattery !== bBattery) {
          return aBattery - bBattery;
        }

        return aPriority - bPriority;
      })
      .slice(0, 6);
  }, [filteredDevices]);

  if (loading) {
    return <div className="text-gray-400">Loading...</div>;
  }

  if (error || !state) {
    return (
      <div className="text-red-400">
        Failed to load state: {error?.message ?? 'Unknown error'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="Yots"
        subtitle="Home Assistant-backed room state, doors, motion, environmentals, and the batteries that will bite later."
        iconKey="yots"
        iconClassName="bg-gradient-to-br from-emerald-500/30 via-lime-500/20 to-yellow-400/20 text-emerald-100"
        accentClassName="before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-gradient-to-b before:from-emerald-400 before:to-yellow-400"
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {lowBatteryCount > 0 && (
            <button
              onClick={() => setShowLowBatteryOnly(!showLowBatteryOnly)}
              className={`rounded px-3 py-1 text-sm transition-colors ${
                showLowBatteryOnly
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-800 text-amber-400 hover:bg-gray-700'
              }`}
            >
              🪫 Low Battery ({lowBatteryCount})
            </button>
          )}

          <div className="flex items-center gap-1 rounded-lg bg-gray-800 p-1">
            {(['area', 'type', 'hub'] as GroupBy[]).map((option) => (
              <button
                key={option}
                onClick={() => setGroupBy(option)}
                className={`rounded px-3 py-1 text-sm capitalize transition-colors ${
                  groupBy === option
                    ? 'bg-gray-700 text-gray-100'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="text-center">
          <div className="text-3xl font-bold text-gray-100">{hubs.length}</div>
          <div className="text-sm text-gray-400">Hubs</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-gray-100">{activeOpenCount}</div>
          <div className="text-sm text-gray-400">Active / Open</div>
        </Card>
        <Card className="text-center">
          <div className={`text-3xl font-bold ${lowBatteryCount > 0 ? 'text-amber-400' : 'text-gray-100'}`}>
            {lowBatteryCount}
          </div>
          <div className="text-sm text-gray-400">Low Battery</div>
        </Card>
        <Card className="text-center">
          <div className={`text-3xl font-bold ${staleCount > 0 ? 'text-red-400' : 'text-gray-100'}`}>
            {staleCount}
          </div>
          <div className="text-sm text-gray-400">Stale / Missing</div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-100">Attention Queue</h3>
              <p className="text-sm text-gray-500">
                Doors, motion, and battery-sensitive entities first.
              </p>
            </div>
            <span className="text-sm text-gray-500">{priorityDevices.length} shown</span>
          </div>

          <div className="space-y-3">
            {priorityDevices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-950/50 px-4 py-3"
              >
                <div>
                  <div className="text-sm font-medium text-gray-100">{device.name}</div>
                  <div className="text-xs text-gray-500">
                    {(device.area ?? 'unassigned').replace(/-/g, ' ')} • {deviceTypeLabels[device.type] ?? device.type}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-300">{device.attributes?.value ?? 'No reading'}</span>
                  <StatusChip status={device.status} size="sm" />
                </div>
              </div>
            ))}

            {priorityDevices.length === 0 && (
              <div className="text-sm text-gray-500">No current attention items.</div>
            )}
          </div>
        </Card>

        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-100">Device Mix</h3>
            <p className="text-sm text-gray-500">
              What Home Assistant is currently feeding into Yots.
            </p>
          </div>

          <div className="space-y-3">
            {devicesByType.map(([type, count]) => (
              <div key={type}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-gray-300">{deviceTypeLabels[type] ?? type}</span>
                  <span className="text-gray-500">{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-lime-300"
                    style={{ width: `${devices.length === 0 ? 0 : (count / devices.length) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {hubs.length > 0 && (
        <div>
          <SectionHeader title="Hubs" count={hubs.length} />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {hubs.map((hub) => (
              <HubCard
                key={hub.id}
                hub={hub}
                deviceCount={deviceCountPerHub.get(hub.id) ?? 0}
              />
            ))}
          </div>
        </div>
      )}

      {groupedDevices.size > 0 && (
        <div className="space-y-6">
          {Array.from(groupedDevices.entries()).map(([groupName, groupDevices]) => (
            <div key={groupName}>
              <SectionHeader title={groupName} count={groupDevices.length} />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {groupDevices.map((device) => (
                  <DeviceCard key={device.id} device={device} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {devices.length === 0 && (
        <div className="py-8 text-center text-gray-500">
          No Home Assistant entities are flowing into Yots yet.
          <div className="mt-2 text-sm">
            Check <code className="rounded bg-gray-800 px-2 py-0.5">HA_HOST</code>,{' '}
            <code className="rounded bg-gray-800 px-2 py-0.5">HA_PORT</code>, and{' '}
            <code className="rounded bg-gray-800 px-2 py-0.5">HA_LONG_LIVED_ACCESS_TOKEN</code>.
          </div>
        </div>
      )}
    </div>
  );
}

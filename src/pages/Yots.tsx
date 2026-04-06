import { useState, useMemo } from 'react';
import { useStatePolling } from '../hooks/useStatePolling';
import { Card } from '../components/Card';
import { StatusChip } from '../components/StatusChip';
import { PageHero } from '../components/PageHero';
import type { IoTHub, Device } from '../types/inventory';

const EMPTY_HUBS: IoTHub[] = [];
const EMPTY_DEVICES: Device[] = [];

type GroupBy = 'area' | 'type' | 'hub';

const deviceIcons: Record<string, string> = {
  light: '💡',
  sensor: '📡',
  contact: '🚪',
  climate: '🌡️',
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
    <Card className="hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{hubIcons[hub.protocol] || '🔗'}</span>
          <div>
            <h3 className="text-lg font-medium text-gray-100">{hub.name}</h3>
            <p className="text-sm text-gray-500 capitalize">{hub.protocol}</p>
          </div>
        </div>
        <StatusChip status={hub.status} />
      </div>

      <div className="grid grid-cols-2 gap-4 mt-3">
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

  return (
    <Card className="hover:border-gray-600 transition-colors">
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

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-800">
        {typeof battery === 'number' && <BatteryIndicator level={battery} />}
        {lastSeen && (
          <span className="text-xs text-gray-500">
            Last seen: {new Date(lastSeen).toLocaleTimeString()}
          </span>
        )}
        {!battery && !lastSeen && <span className="text-xs text-gray-600">—</span>}
      </div>
    </Card>
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <h3 className="text-lg font-medium text-gray-200 capitalize">{title.replace(/-/g, ' ')}</h3>
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

  // Build hub map
  const hubMap = useMemo(() => {
    return new Map(hubs.map((hub) => [hub.id, hub]));
  }, [hubs]);

  // Filter devices
  const filteredDevices = useMemo(() => {
    if (!showLowBatteryOnly) return devices;
    return devices.filter((device) => {
      const battery = device.attributes?.battery_pct;
      return typeof battery === 'number' && battery < 30;
    });
  }, [devices, showLowBatteryOnly]);

  // Group devices
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
    // Sort groups alphabetically
    return new Map([...groups.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  }, [filteredDevices, groupBy, hubMap]);

  // Count devices per hub
  const deviceCountPerHub = useMemo(() => {
    const counts = new Map<string, number>();
    for (const device of devices) {
      const current = counts.get(device.hub_id) ?? 0;
      counts.set(device.hub_id, current + 1);
    }
    return counts;
  }, [devices]);

  // Count low battery devices
  const lowBatteryCount = useMemo(() => {
    return devices.filter((device) => {
      const battery = device.attributes?.battery_pct;
      return typeof battery === 'number' && battery < 30;
    }).length;
  }, [devices]);

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
        subtitle="IoT hubs, device presence, battery signals, and lightweight room-level awareness."
        iconKey="yots"
        iconClassName="bg-gradient-to-br from-emerald-500/30 via-lime-500/20 to-yellow-400/20 text-emerald-100"
        accentClassName="before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-gradient-to-b before:from-emerald-400 before:to-yellow-400"
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Low Battery Filter */}
          {lowBatteryCount > 0 && (
            <button
              onClick={() => setShowLowBatteryOnly(!showLowBatteryOnly)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                showLowBatteryOnly
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-800 text-amber-400 hover:bg-gray-700'
              }`}
            >
              🪫 Low Battery ({lowBatteryCount})
            </button>
          )}

          {/* Group By Toggle */}
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
            {(['area', 'type', 'hub'] as GroupBy[]).map((option) => (
              <button
                key={option}
                onClick={() => setGroupBy(option)}
                className={`px-3 py-1 text-sm rounded transition-colors capitalize ${
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

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="text-3xl font-bold text-gray-100">{hubs.length}</div>
          <div className="text-sm text-gray-400">Hubs</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-gray-100">{devices.length}</div>
          <div className="text-sm text-gray-400">Devices</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-green-400">
            {devices.filter((d) => d.status === 'online').length}
          </div>
          <div className="text-sm text-gray-400">Online</div>
        </Card>
        <Card className="text-center">
          <div className={`text-3xl font-bold ${lowBatteryCount > 0 ? 'text-amber-400' : 'text-gray-400'}`}>
            {lowBatteryCount}
          </div>
          <div className="text-sm text-gray-400">Low Battery</div>
        </Card>
      </div>

      {/* IoT Hubs */}
      {hubs.length > 0 && (
        <div>
          <SectionHeader title="Hubs" count={hubs.length} />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* Devices */}
      {groupedDevices.size > 0 && (
        <div className="space-y-6">
          {Array.from(groupedDevices.entries()).map(([groupName, groupDevices]) => (
            <div key={groupName}>
              <SectionHeader title={groupName} count={groupDevices.length} />
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {groupDevices.map((device) => (
                  <DeviceCard key={device.id} device={device} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {devices.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No devices configured.
          <div className="text-sm mt-2">
            Add devices to <code className="bg-gray-800 px-2 py-0.5 rounded">inventory/iot.yaml</code>
          </div>
        </div>
      )}
    </div>
  );
}

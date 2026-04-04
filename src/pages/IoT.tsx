import { useStatePolling } from '../hooks/useStatePolling';
import { Card, CardHeader } from '../components/Card';
import { StatusChip } from '../components/StatusChip';
import type { Device, IoTHub } from '../types/inventory';

function DeviceRow({ device }: { device: Device }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-800/50 last:border-0">
      <div>
        <span className="text-gray-200 text-sm">{device.name}</span>
        <span className="text-gray-500 text-xs ml-2">{device.type}</span>
        {device.area && (
          <span className="text-gray-600 text-xs ml-2">• {device.area}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {device.attributes?.battery_pct != null && (
          <span className="text-xs text-gray-500">
            🔋 {device.attributes.battery_pct}%
          </span>
        )}
        <StatusChip status={device.status} size="sm" />
      </div>
    </div>
  );
}

function HubCard({ hub, devices }: { hub: IoTHub; devices: Device[] }) {
  const hubDevices = devices.filter((d) => d.hub_id === hub.id);

  return (
    <Card>
      <CardHeader
        title={hub.name}
        subtitle={`${hub.protocol} • ${hubDevices.length} devices`}
        action={<StatusChip status={hub.status} />}
      />
      {hubDevices.length > 0 && (
        <div className="mt-2">
          {hubDevices.map((device) => (
            <DeviceRow key={device.id} device={device} />
          ))}
        </div>
      )}
    </Card>
  );
}

export function IoT() {
  const { state, loading, error } = useStatePolling();

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

  // Group devices by area for summary
  const devicesByArea = new Map<string, number>();
  for (const device of state.devices) {
    const area = device.area ?? 'unassigned';
    devicesByArea.set(area, (devicesByArea.get(area) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-100">IoT Hubs & Devices</h2>

      {/* Summary */}
      <div className="flex flex-wrap gap-3 text-sm">
        <span className="text-gray-400">
          Hubs: <span className="text-gray-100">{state.iot_hubs.length}</span>
        </span>
        <span className="text-gray-400">
          Devices: <span className="text-gray-100">{state.devices.length}</span>
        </span>
        <span className="text-gray-400">|</span>
        {Array.from(devicesByArea.entries()).map(([area, count]) => (
          <span key={area} className="text-gray-500">
            {area}: {count}
          </span>
        ))}
      </div>

      {/* Hubs with Devices */}
      <div className="grid md:grid-cols-2 gap-4">
        {state.iot_hubs.map((hub) => (
          <HubCard key={hub.id} hub={hub} devices={state.devices} />
        ))}
      </div>
    </div>
  );
}

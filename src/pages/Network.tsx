import { useStatePolling } from '../hooks/useStatePolling';
import { Card, CardHeader } from '../components/Card';
import { StatusChip } from '../components/StatusChip';

export function Network() {
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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-100">Network & Access</h2>

      {/* Network Devices */}
      <div>
        <h3 className="text-lg font-medium text-gray-300 mb-3">Network Devices</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {state.network_devices.map((device) => (
            <Card key={device.id}>
              <CardHeader
                title={device.name}
                subtitle={device.type}
                action={<StatusChip status={device.status} size="sm" />}
              />
              {device.endpoint && (
                <div className="text-sm text-gray-400">
                  Endpoint: <span className="text-gray-300">{device.endpoint}</span>
                </div>
              )}
              {device.notes && (
                <div className="text-xs text-gray-500 mt-2">{device.notes}</div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Access Paths */}
      <div>
        <h3 className="text-lg font-medium text-gray-300 mb-3">External Access</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {state.access_paths.map((path) => (
            <Card key={path.id}>
              <CardHeader
                title={path.name}
                subtitle={path.type}
                action={<StatusChip status={path.status} size="sm" />}
              />
              {path.endpoint && (
                <div className="text-sm text-gray-400 mb-2">
                  Endpoint: <span className="text-gray-300">{path.endpoint}</span>
                </div>
              )}
              {path.services && path.services.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {path.services.map((svc) => (
                    <span
                      key={svc}
                      className="px-2 py-0.5 text-xs rounded bg-gray-800 text-gray-400"
                    >
                      {svc}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

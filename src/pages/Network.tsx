import { useStatePolling } from '../hooks/useStatePolling';
import { Card, CardHeader } from '../components/Card';
import { StatusChip } from '../components/StatusChip';
import { UnderConstruction } from '../components/UnderConstruction';

export function Network() {
  const { state, loading } = useStatePolling();

  if (loading || !state) {
    return <div className="text-gray-400">Loading...</div>;
  }

  return (
    <UnderConstruction title="Network & Access">
      <div className="grid md:grid-cols-2 gap-4">
        {state.network_devices.slice(0, 2).map((device) => (
          <Card key={device.id}>
            <CardHeader
              title={device.name}
              subtitle={device.type}
              action={<StatusChip status={device.status} size="sm" />}
            />
          </Card>
        ))}
        {state.access_paths.slice(0, 2).map((path) => (
          <Card key={path.id}>
            <CardHeader
              title={path.name}
              subtitle={path.type}
              action={<StatusChip status={path.status} size="sm" />}
            />
          </Card>
        ))}
      </div>
    </UnderConstruction>
  );
}

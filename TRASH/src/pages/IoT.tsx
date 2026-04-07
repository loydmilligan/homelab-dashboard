import { useStatePolling } from '../hooks/useStatePolling';
import { Card, CardHeader } from '../components/Card';
import { StatusChip } from '../components/StatusChip';
import { UnderConstruction } from '../components/UnderConstruction';

export function IoT() {
  const { state, loading } = useStatePolling();

  if (loading || !state) {
    return <div className="text-gray-400">Loading...</div>;
  }

  return (
    <UnderConstruction title="IoT Hubs & Devices">
      <div className="grid md:grid-cols-2 gap-4">
        {state.iot_hubs.map((hub) => (
          <Card key={hub.id}>
            <CardHeader
              title={hub.name}
              subtitle={`${hub.protocol} • ${hub.device_count ?? 0} devices`}
              action={<StatusChip status={hub.status} />}
            />
          </Card>
        ))}
      </div>
    </UnderConstruction>
  );
}

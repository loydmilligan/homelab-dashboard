import { useStatePolling } from '../hooks/useStatePolling';
import { Card } from '../components/Card';
import { StatusChip } from '../components/StatusChip';
import { UnderConstruction } from '../components/UnderConstruction';
import type { Service } from '../types/inventory';

function ServiceRow({ service, hostName }: { service: Service; hostName: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-gray-100">{service.name}</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">
            {service.category}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-0.5">{hostName}</div>
      </div>
      <StatusChip status={service.status} size="sm" />
    </div>
  );
}

export function Services() {
  const { state, loading } = useStatePolling();

  if (loading || !state) {
    return <div className="text-gray-400">Loading...</div>;
  }

  const hostMap = new Map(state.hosts.map((h) => [h.id, h.name]));

  return (
    <UnderConstruction title="Services">
      <Card>
        {state.services.slice(0, 5).map((service) => (
          <ServiceRow
            key={service.id}
            service={service}
            hostName={hostMap.get(service.host_id) ?? service.host_id}
          />
        ))}
      </Card>
    </UnderConstruction>
  );
}

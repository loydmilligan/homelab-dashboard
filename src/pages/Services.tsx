import { useStatePolling } from '../hooks/useStatePolling';
import { Card } from '../components/Card';
import { StatusChip } from '../components/StatusChip';
import type { Service } from '../types/inventory';

function ServiceRow({ service, hostName }: { service: Service; hostName: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {service.url ? (
            <a
              href={service.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-100 hover:text-blue-400 transition-colors"
            >
              {service.name}
            </a>
          ) : (
            <span className="text-gray-100">{service.name}</span>
          )}
          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">
            {service.category}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          {hostName}
          {service.depends_on && service.depends_on.length > 0 && (
            <span className="ml-2">
              → {service.depends_on.join(', ')}
            </span>
          )}
        </div>
      </div>
      <StatusChip status={service.status} size="sm" />
    </div>
  );
}

export function Services() {
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

  // Group services by host
  const hostMap = new Map(state.hosts.map((h) => [h.id, h.name]));
  const servicesByHost = new Map<string, Service[]>();

  for (const service of state.services) {
    const hostId = service.host_id;
    if (!servicesByHost.has(hostId)) {
      servicesByHost.set(hostId, []);
    }
    servicesByHost.get(hostId)!.push(service);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-100">Services</h2>

      {/* Summary */}
      <div className="flex gap-4 text-sm">
        <span className="text-gray-400">
          Total: <span className="text-gray-100">{state.services.length}</span>
        </span>
        <span className="text-green-400">
          Online: {state.services.filter((s) => s.status === 'online').length}
        </span>
        <span className="text-red-400">
          Offline: {state.services.filter((s) => s.status === 'offline').length}
        </span>
      </div>

      {/* Services by Host */}
      {Array.from(servicesByHost.entries()).map(([hostId, services]) => (
        <Card key={hostId}>
          <h3 className="text-lg font-medium text-gray-100 mb-3">
            {hostMap.get(hostId) ?? hostId}
          </h3>
          <div>
            {services.map((service) => (
              <ServiceRow
                key={service.id}
                service={service}
                hostName={hostMap.get(service.host_id) ?? service.host_id}
              />
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

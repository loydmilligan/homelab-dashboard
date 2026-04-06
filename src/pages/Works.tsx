import { useMemo } from 'react';
import { useStatePolling } from '../hooks/useStatePolling';
import { Card } from '../components/Card';
import { StatusChip } from '../components/StatusChip';
import { PageHero } from '../components/PageHero';
import type { AccessPath, Host, NetworkDevice, Service } from '../types/inventory';

const EMPTY_SERVICES: Service[] = [];
const EMPTY_HOSTS: Host[] = [];

const deviceIcons: Record<string, string> = {
  router: '🌐',
  switch: '🔀',
  ap: '📶',
  dns: '🔍',
  proxy: '🔄',
  tunnel: '🚇',
  vpn: '🔐',
};

const accessIcons: Record<string, string> = {
  'cloudflare-tunnel': '☁️',
  tailscale: '🔗',
  wireguard: '🛡️',
  direct: '➡️',
};

function HostBadge({ host }: { host: Host | undefined }) {
  if (!host) {
    return (
      <span className="rounded-full border border-gray-700 px-2 py-0.5 text-xs text-gray-500">
        unmapped host
      </span>
    );
  }

  return (
    <span className="rounded-full border border-gray-700 px-2 py-0.5 text-xs text-gray-300">
      {host.name}
    </span>
  );
}

function NetworkDeviceCard({ device }: { device: NetworkDevice }) {
  return (
    <Card className="transition-colors hover:border-gray-600">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{deviceIcons[device.type] || '🖥️'}</span>
          <div>
            <h3 className="text-lg font-medium text-gray-100">{device.name}</h3>
            <p className="text-sm capitalize text-gray-500">{device.type}</p>
          </div>
        </div>
        <StatusChip status={device.status} />
      </div>

      {device.endpoint && (
        <div className="mb-2">
          <span className="text-xs text-gray-500">Endpoint: </span>
          <span className="font-mono text-sm text-gray-300">{device.endpoint}</span>
        </div>
      )}

      {device.notes && <div className="text-sm text-gray-500">{device.notes}</div>}

      {device.dependent_services && device.dependent_services.length > 0 && (
        <div className="mt-3 border-t border-gray-800 pt-3">
          <div className="mb-1 text-xs text-gray-500">Dependent Services:</div>
          <div className="flex flex-wrap gap-1">
            {device.dependent_services.map((svc) => (
              <span
                key={svc}
                className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-400"
              >
                {svc}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function AccessPathCard({ path, services }: { path: AccessPath; services: string[] }) {
  return (
    <Card className="transition-colors hover:border-gray-600">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{accessIcons[path.type] || '🔗'}</span>
          <div>
            <h3 className="text-lg font-medium text-gray-100">{path.name}</h3>
            <p className="text-sm capitalize text-gray-500">{path.type.replace(/-/g, ' ')}</p>
          </div>
        </div>
        <StatusChip status={path.status} />
      </div>

      {path.endpoint && (
        <div className="mb-2">
          <span className="text-xs text-gray-500">Endpoint: </span>
          <a
            href={`https://${path.endpoint}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            {path.endpoint}
          </a>
        </div>
      )}

      {services.length > 0 && (
        <div className="mt-3 border-t border-gray-800 pt-3">
          <div className="mb-1 text-xs text-gray-500">Exposes Services:</div>
          <div className="flex flex-wrap gap-1">
            {services.map((svc) => (
              <span
                key={svc}
                className="rounded bg-green-900/30 px-2 py-0.5 text-xs text-green-400"
              >
                {svc}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function RouteCard({
  path,
  services,
  hostsById,
}: {
  path: AccessPath;
  services: Service[];
  hostsById: Map<string, Host>;
}) {
  return (
    <Card>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{accessIcons[path.type] || '🔗'}</span>
            <h3 className="text-lg font-medium text-gray-100">{path.name}</h3>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {path.type.replace(/-/g, ' ')}
            {path.endpoint ? ` • ${path.endpoint}` : ''}
          </p>
        </div>
        <StatusChip status={path.status} size="sm" />
      </div>

      <div className="space-y-3">
        {services.map((service) => (
          <div
            key={`${path.id}-${service.id}`}
            className="rounded-lg border border-gray-800 bg-gray-950/50 px-4 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-gray-100">{service.name}</div>
                <div className="text-xs text-gray-500">{service.category}</div>
              </div>
              <div className="flex items-center gap-2">
                <HostBadge host={hostsById.get(service.host_id)} />
                <StatusChip status={service.status} size="sm" />
              </div>
            </div>
            {service.depends_on && service.depends_on.length > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                Depends on: {service.depends_on.join(', ')}
              </div>
            )}
          </div>
        ))}

        {services.length === 0 && (
          <div className="text-sm text-gray-500">No services mapped to this route yet.</div>
        )}
      </div>
    </Card>
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <h3 className="text-lg font-medium text-gray-200">{title}</h3>
      <span className="text-sm text-gray-500">({count})</span>
    </div>
  );
}

export function Works() {
  const { state, loading, error } = useStatePolling();
  const services = state?.services ?? EMPTY_SERVICES;
  const hosts = state?.hosts ?? EMPTY_HOSTS;

  const serviceNames = useMemo(() => {
    return new Map(services.map((service) => [service.id, service.name]));
  }, [services]);

  const serviceMap = useMemo(() => {
    return new Map(services.map((service) => [service.id, service]));
  }, [services]);

  const hostsById = useMemo(() => {
    return new Map(hosts.map((host) => [host.id, host]));
  }, [hosts]);

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

  const { network_devices, access_paths } = state;
  const allItems = [...network_devices, ...access_paths];
  const onlineCount = allItems.filter((item) => item.status === 'online').length;
  const exposedServices = access_paths.flatMap((path) => path.services ?? []);
  const directlyExposedServices = exposedServices
    .map((serviceId) => serviceMap.get(serviceId))
    .filter((service): service is Service => Boolean(service));
  const mappedRoutes = access_paths.filter((path) => (path.services?.length ?? 0) > 0);
  const dependentServiceCount = network_devices.reduce(
    (count, device) => count + (device.dependent_services?.length ?? 0),
    0,
  );

  return (
    <div className="space-y-6">
      <PageHero
        title="Works"
        subtitle="Reachability, exposure routes, and the curated network map that keeps the laptop and CM4 usable."
        iconKey="works"
        iconClassName="bg-gradient-to-br from-indigo-500/30 via-sky-500/20 to-cyan-400/20 text-indigo-100"
        accentClassName="before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-gradient-to-b before:from-indigo-400 before:to-cyan-400"
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="text-center">
          <div className="text-3xl font-bold text-gray-100">{mappedRoutes.length}</div>
          <div className="text-sm text-gray-400">Mapped Routes</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-gray-100">{directlyExposedServices.length}</div>
          <div className="text-sm text-gray-400">Exposed Services</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-green-400">{onlineCount}</div>
          <div className="text-sm text-gray-400">Online Paths</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-gray-100">{dependentServiceCount}</div>
          <div className="text-sm text-gray-400">Infra Dependencies</div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-100">Exposure Routes</h3>
            <p className="text-sm text-gray-500">
              How external access lands on services and which host actually carries them.
            </p>
          </div>
          <div className="space-y-4">
            {mappedRoutes.map((path) => (
              <RouteCard
                key={path.id}
                path={path}
                services={(path.services ?? [])
                  .map((serviceId) => serviceMap.get(serviceId))
                  .filter((service): service is Service => Boolean(service))}
                hostsById={hostsById}
              />
            ))}
            {mappedRoutes.length === 0 && (
              <div className="text-sm text-gray-500">No access paths are mapped to services yet.</div>
            )}
          </div>
        </Card>

        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-100">Infrastructure Impact</h3>
            <p className="text-sm text-gray-500">
              Shared network components and how many services they take down with them.
            </p>
          </div>
          <div className="space-y-3">
            {network_devices.map((device) => (
              <div
                key={device.id}
                className="rounded-lg border border-gray-800 bg-gray-950/50 px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{deviceIcons[device.type] || '🖥️'}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-100">{device.name}</div>
                      <div className="text-xs text-gray-500">{device.endpoint ?? device.type}</div>
                    </div>
                  </div>
                  <StatusChip status={device.status} size="sm" />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>Dependent services</span>
                  <span>{device.dependent_services?.length ?? 0}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {network_devices.length > 0 && (
        <div>
          <SectionHeader title="Network Devices" count={network_devices.length} />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {network_devices.map((device) => (
              <NetworkDeviceCard key={device.id} device={device} />
            ))}
          </div>
        </div>
      )}

      {access_paths.length > 0 && (
        <div>
          <SectionHeader title="Access Paths" count={access_paths.length} />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {access_paths.map((path) => (
              <AccessPathCard
                key={path.id}
                path={path}
                services={(path.services ?? []).map((id) => serviceNames.get(id) ?? id)}
              />
            ))}
          </div>
        </div>
      )}

      {network_devices.length === 0 && access_paths.length === 0 && (
        <div className="py-8 text-center text-gray-500">
          No network devices or access paths configured.
          <div className="mt-2 text-sm">
            Add devices to <code className="rounded bg-gray-800 px-2 py-0.5">inventory/network.yaml</code>
          </div>
        </div>
      )}
    </div>
  );
}

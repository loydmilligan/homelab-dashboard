import { useMemo } from 'react';
import { useStatePolling } from '../hooks/useStatePolling';
import { Card } from '../components/Card';
import { StatusChip } from '../components/StatusChip';
import { PageHero } from '../components/PageHero';
import type { NetworkDevice, AccessPath } from '../types/inventory';

const EMPTY_SERVICES: Array<{ id: string; name: string }> = [];

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
  wireguard: '🛡���',
  direct: '➡️',
};

function NetworkDeviceCard({ device }: { device: NetworkDevice }) {
  return (
    <Card className="hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{deviceIcons[device.type] || '🖥️'}</span>
          <div>
            <h3 className="text-lg font-medium text-gray-100">{device.name}</h3>
            <p className="text-sm text-gray-500 capitalize">{device.type}</p>
          </div>
        </div>
        <StatusChip status={device.status} />
      </div>

      {device.endpoint && (
        <div className="mb-2">
          <span className="text-xs text-gray-500">Endpoint: </span>
          <span className="text-sm text-gray-300 font-mono">{device.endpoint}</span>
        </div>
      )}

      {device.notes && (
        <div className="text-sm text-gray-500">{device.notes}</div>
      )}

      {device.dependent_services && device.dependent_services.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-800">
          <div className="text-xs text-gray-500 mb-1">Dependent Services:</div>
          <div className="flex flex-wrap gap-1">
            {device.dependent_services.map((svc) => (
              <span
                key={svc}
                className="px-2 py-0.5 text-xs rounded bg-gray-800 text-gray-400"
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
    <Card className="hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{accessIcons[path.type] || '🔗'}</span>
          <div>
            <h3 className="text-lg font-medium text-gray-100">{path.name}</h3>
            <p className="text-sm text-gray-500 capitalize">{path.type.replace(/-/g, ' ')}</p>
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
        <div className="mt-3 pt-3 border-t border-gray-800">
          <div className="text-xs text-gray-500 mb-1">Exposes Services:</div>
          <div className="flex flex-wrap gap-1">
            {services.map((svc) => (
              <span
                key={svc}
                className="px-2 py-0.5 text-xs rounded bg-green-900/30 text-green-400"
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

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <h3 className="text-lg font-medium text-gray-200">{title}</h3>
      <span className="text-sm text-gray-500">({count})</span>
    </div>
  );
}

export function Works() {
  const { state, loading, error } = useStatePolling();
  const services = state?.services ?? EMPTY_SERVICES;

  // Build service name map from access path service IDs
  const serviceNames = useMemo(() => {
    return new Map(services.map((service) => [service.id, service.name]));
  }, [services]);

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

  // Count statuses
  const allItems = [...network_devices, ...access_paths];
  const onlineCount = allItems.filter((i) => i.status === 'online').length;
  const offlineCount = allItems.filter((i) => i.status === 'offline').length;

  return (
    <div className="space-y-6">
      <PageHero
        title="Works"
        subtitle="Network devices, access paths, and exposure routes that keep the downsized homelab reachable."
        iconKey="works"
        iconClassName="bg-gradient-to-br from-indigo-500/30 via-sky-500/20 to-cyan-400/20 text-indigo-100"
        accentClassName="before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-gradient-to-b before:from-indigo-400 before:to-cyan-400"
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="text-3xl font-bold text-gray-100">{network_devices.length}</div>
          <div className="text-sm text-gray-400">Devices</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-gray-100">{access_paths.length}</div>
          <div className="text-sm text-gray-400">Access Paths</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-green-400">{onlineCount}</div>
          <div className="text-sm text-gray-400">Online</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-red-400">{offlineCount}</div>
          <div className="text-sm text-gray-400">Offline</div>
        </Card>
      </div>

      {/* Network Devices */}
      {network_devices.length > 0 && (
        <div>
          <SectionHeader title="Network Devices" count={network_devices.length} />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {network_devices.map((device) => (
              <NetworkDeviceCard key={device.id} device={device} />
            ))}
          </div>
        </div>
      )}

      {/* Access Paths */}
      {access_paths.length > 0 && (
        <div>
          <SectionHeader title="Access Paths" count={access_paths.length} />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <div className="text-center text-gray-500 py-8">
          No network devices or access paths configured.
          <div className="text-sm mt-2">
            Add devices to <code className="bg-gray-800 px-2 py-0.5 rounded">inventory/network.yaml</code>
          </div>
        </div>
      )}
    </div>
  );
}

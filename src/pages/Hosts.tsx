import { useStatePolling } from '../hooks/useStatePolling';
import { Card } from '../components/Card';
import { StatusChip } from '../components/StatusChip';
import type { Host } from '../types/inventory';

function formatUptime(seconds?: number): string {
  if (!seconds) return 'Unknown';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

function MetricBar({ label, value, warn = 80, critical = 90 }: {
  label: string;
  value?: number;
  warn?: number;
  critical?: number;
}) {
  const pct = value ?? 0;
  let color = 'bg-green-500';
  if (pct >= critical) color = 'bg-red-500';
  else if (pct >= warn) color = 'bg-amber-500';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-300">{pct}%</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function InfoTooltip({ info }: { info: { version: string; container: string } }) {
  return (
    <div className="group relative inline-block ml-2">
      <span className="cursor-help text-gray-500 hover:text-gray-300 text-sm">ⓘ</span>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 rounded-lg text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
        <div>Container: {info.container}</div>
        <div>Version: {info.version}</div>
      </div>
    </div>
  );
}

function HostCard({ host }: { host: Host }) {
  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-100">
              {host.name}
              {host.exporter_info && <InfoTooltip info={host.exporter_info} />}
            </h3>
            <p className="text-sm text-gray-400">{host.role}</p>
          </div>
        </div>
        <StatusChip status={host.status} />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <div className="text-xs text-gray-500">IP</div>
          <div className="text-sm text-gray-300 font-mono">{host.address?.ip ?? 'N/A'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Uptime</div>
          <div className="text-sm text-gray-300">{formatUptime(host.metrics?.uptime_s)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Temp</div>
          <div className="text-sm text-gray-300">
            {host.metrics?.temp_c != null ? `${host.metrics.temp_c}°C` : 'N/A'}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <MetricBar label="CPU" value={host.metrics?.cpu_pct} />
        <MetricBar label="RAM" value={host.metrics?.ram_pct} />
        <MetricBar label="Disk" value={host.metrics?.disk_pct} />
      </div>

      {host.tags && host.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {host.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs rounded bg-gray-800 text-gray-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}

export function Hosts() {
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
      <h2 className="text-2xl font-semibold text-gray-100">Hosts</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.hosts.map((host) => (
          <HostCard key={host.id} host={host} />
        ))}
      </div>
    </div>
  );
}

import { useStatePolling } from '../hooks/useStatePolling';
import { StatusDot } from '../components/StatusChip';

export function Wallboard() {
  const { state, loading, error } = useStatePolling();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-2xl text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-2xl text-red-400">
          Failed to load: {error?.message ?? 'Unknown error'}
        </div>
      </div>
    );
  }

  const hostsOnline = state.hosts.filter((h) => h.status === 'online').length;
  const servicesOnline = state.services.filter((s) => s.status === 'online').length;
  const devicesOnline = state.devices.filter((d) => d.status === 'online').length;

  const allHealthy =
    hostsOnline === state.hosts.length &&
    servicesOnline === state.services.length;

  return (
    <div className="h-screen flex flex-col p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-gray-100">Homelab</h1>
        <div className="flex items-center gap-3">
          <StatusDot status={allHealthy ? 'online' : 'degraded'} size="lg" />
          <span className="text-2xl text-gray-300">
            {allHealthy ? 'All Systems Operational' : 'Issues Detected'}
          </span>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatBox
          label="Hosts"
          value={hostsOnline}
          total={state.hosts.length}
          healthy={hostsOnline === state.hosts.length}
        />
        <StatBox
          label="Services"
          value={servicesOnline}
          total={state.services.length}
          healthy={servicesOnline === state.services.length}
        />
        <StatBox
          label="IoT Devices"
          value={devicesOnline}
          total={state.devices.length}
          healthy={devicesOnline === state.devices.length}
        />
        <StatBox
          label="Backups"
          value={state.backups.filter((b) => b.status === 'online').length}
          total={state.backups.length}
          healthy={state.backups.every((b) => b.status === 'online')}
        />
      </div>

      {/* Host Cards */}
      <div className="grid grid-cols-2 gap-6 flex-1">
        {state.hosts.map((host) => (
          <div
            key={host.id}
            className="rounded-xl border border-gray-800 bg-gray-900/50 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-100">{host.name}</h2>
              <StatusDot status={host.status} size="lg" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <MetricDisplay label="CPU" value={host.metrics?.cpu_pct} />
              <MetricDisplay label="RAM" value={host.metrics?.ram_pct} />
              <MetricDisplay label="Disk" value={host.metrics?.disk_pct} />
            </div>
            <div className="mt-4 text-gray-500">
              {state.services.filter((s) => s.host_id === host.id).length} services
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 text-center text-gray-600">
        Updated: {new Date(state.generated_at).toLocaleTimeString()}
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  total,
  healthy,
}: {
  label: string;
  value: number;
  total: number;
  healthy: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 text-center">
      <div
        className={`text-5xl font-bold ${
          healthy ? 'text-green-400' : 'text-amber-400'
        }`}
      >
        {value}/{total}
      </div>
      <div className="text-xl text-gray-400 mt-2">{label}</div>
    </div>
  );
}

function MetricDisplay({ label, value }: { label: string; value?: number }) {
  const pct = value ?? 0;
  let color = 'text-green-400';
  if (pct >= 90) color = 'text-red-400';
  else if (pct >= 80) color = 'text-amber-400';

  return (
    <div className="text-center">
      <div className={`text-3xl font-bold ${color}`}>{pct}%</div>
      <div className="text-gray-500">{label}</div>
    </div>
  );
}

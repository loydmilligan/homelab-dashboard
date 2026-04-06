import { useStatePolling } from '../hooks/useStatePolling';
import { Card, StatCard } from '../components/Card';
import { StatusChip } from '../components/StatusChip';
import { PageHero } from '../components/PageHero';

export function Overview() {
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

  const hostsOnline = state.hosts.filter((h) => h.status === 'online').length;
  const servicesOnline = state.services.filter((s) => s.status === 'online').length;
  const hubsOnline = state.iot_hubs.filter((h) => h.status === 'online').length;
  const devicesOnline = state.devices.filter((d) => d.status === 'online').length;

  const backupsOk = state.backups.filter((b) => b.status === 'online').length;
  const backupsTotal = state.backups.length;

  return (
    <div className="space-y-6">
      <PageHero
        title="Overview"
        subtitle="Shost's control-room summary for hosts, Wapps health, Yots activity, and Shots backup status."
        iconKey="overview"
        iconClassName="bg-gradient-to-br from-cyan-500/30 via-sky-500/20 to-lime-400/20 text-cyan-200"
        accentClassName="before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-gradient-to-b before:from-cyan-400 before:to-lime-400"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Hosts"
          value={`${hostsOnline}/${state.hosts.length}`}
          status={hostsOnline === state.hosts.length ? 'ok' : 'warn'}
        />
        <StatCard
          label="Services"
          value={`${servicesOnline}/${state.services.length}`}
          status={servicesOnline === state.services.length ? 'ok' : 'warn'}
        />
        <StatCard
          label="IoT Hubs"
          value={`${hubsOnline}/${state.iot_hubs.length}`}
          status={hubsOnline === state.iot_hubs.length ? 'ok' : 'warn'}
        />
        <StatCard
          label="Devices"
          value={`${devicesOnline}/${state.devices.length}`}
          status={devicesOnline === state.devices.length ? 'ok' : 'warn'}
        />
      </div>

      {/* Quick Status */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-lg font-medium text-gray-100 mb-3">Hosts</h3>
          <div className="space-y-2">
            {state.hosts.map((host) => (
              <div key={host.id} className="flex items-center justify-between">
                <div>
                  <span className="text-gray-100">{host.name}</span>
                  <span className="text-gray-500 text-sm ml-2">{host.role}</span>
                </div>
                <StatusChip status={host.status} size="sm" />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-medium text-gray-100 mb-3">Backups</h3>
          <div className="mb-3">
            <span className="text-2xl font-bold text-gray-100">
              {backupsOk}/{backupsTotal}
            </span>
            <span className="text-gray-400 ml-2">healthy</span>
          </div>
          <div className="space-y-2">
            {state.backups.map((backup) => (
              <div key={backup.id} className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">{backup.name}</span>
                <StatusChip status={backup.status} size="sm" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Access Paths */}
      <Card>
        <h3 className="text-lg font-medium text-gray-100 mb-3">External Access</h3>
        <div className="flex flex-wrap gap-3">
          {state.access_paths.map((path) => (
            <div
              key={path.id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50"
            >
              <StatusChip status={path.status} label={path.name} size="sm" />
            </div>
          ))}
        </div>
      </Card>

      <p className="text-xs text-gray-600">
        Last updated: {new Date(state.generated_at).toLocaleString()}
      </p>
    </div>
  );
}

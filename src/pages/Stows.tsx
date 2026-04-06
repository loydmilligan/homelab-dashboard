import { useMemo } from 'react';
import { useStatePolling } from '../hooks/useStatePolling';
import { Card } from '../components/Card';
import { PageHero } from '../components/PageHero';
import type { Host, DiskInfo } from '../types/inventory';

function DiskBar({ disk }: { disk: DiskInfo }) {
  let color = 'bg-green-500';
  if (disk.use_pct >= 90) color = 'bg-red-500';
  else if (disk.use_pct >= 80) color = 'bg-amber-500';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-300 font-mono">{disk.mount}</span>
        <span className={`${disk.use_pct >= 90 ? 'text-red-400' : disk.use_pct >= 80 ? 'text-amber-400' : 'text-gray-300'}`}>
          {disk.use_pct}%
        </span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${disk.use_pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{disk.used} / {disk.size}</span>
        <span>{disk.available} free</span>
      </div>
    </div>
  );
}

function HostDisksCard({ host }: { host: Host }) {
  const disks = host.metrics?.disks ?? [];

  if (disks.length === 0) {
    return null;
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-100">{host.name}</h3>
        <span className={`px-2 py-0.5 text-xs rounded ${
          host.status === 'online' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
        }`}>
          {host.status}
        </span>
      </div>
      <div className="space-y-4">
        {disks.map((disk, i) => (
          <DiskBar key={i} disk={disk} />
        ))}
      </div>
    </Card>
  );
}

function CacheCard() {
  // Mock data - would come from backend in production
  const caches = [
    { name: 'Docker Images', size: '4.2 GB', path: '/var/lib/docker' },
    { name: 'APT Cache', size: '512 MB', path: '/var/cache/apt' },
    { name: 'NPM Cache', size: '1.1 GB', path: '~/.npm' },
    { name: 'Pip Cache', size: '340 MB', path: '~/.cache/pip' },
  ];

  return (
    <Card>
      <h3 className="text-lg font-medium text-gray-100 mb-4">Cache Analysis</h3>
      <div className="space-y-3">
        {caches.map((cache) => (
          <div key={cache.name} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
            <div>
              <div className="text-sm text-gray-200">{cache.name}</div>
              <div className="text-xs text-gray-500 font-mono">{cache.path}</div>
            </div>
            <div className="text-sm text-gray-300">{cache.size}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function CleanupCard() {
  const recommendations = [
    { name: 'Unused Docker Images', command: 'docker image prune -a', savings: '~2.1 GB' },
    { name: 'Old Log Files', command: 'journalctl --vacuum-size=100M', savings: '~500 MB' },
    { name: 'APT Cache', command: 'apt-get clean', savings: '~340 MB' },
  ];

  return (
    <Card>
      <h3 className="text-lg font-medium text-gray-100 mb-4">Cleanup Recommendations</h3>
      <div className="space-y-3">
        {recommendations.map((rec) => (
          <div key={rec.name} className="p-3 bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-200">{rec.name}</span>
              <span className="text-sm text-green-400">{rec.savings}</span>
            </div>
            <code className="text-xs text-gray-500 font-mono">{rec.command}</code>
          </div>
        ))}
      </div>
    </Card>
  );
}

function NetworkSharesCard() {
  // Mock data - would come from inventory
  const shares = [
    { name: 'Media Share', host: 'nas', path: '/media', status: 'mounted' },
    { name: 'Backups Share', host: 'nas', path: '/backups', status: 'mounted' },
  ];

  return (
    <Card>
      <h3 className="text-lg font-medium text-gray-100 mb-4">Network Shares</h3>
      <div className="space-y-2">
        {shares.map((share) => (
          <div key={share.name} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
            <div>
              <div className="text-sm text-gray-200">{share.name}</div>
              <div className="text-xs text-gray-500 font-mono">{share.host}:{share.path}</div>
            </div>
            <span className={`px-2 py-0.5 text-xs rounded ${
              share.status === 'mounted' ? 'bg-green-900/30 text-green-400' : 'bg-gray-700 text-gray-400'
            }`}>
              {share.status}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function Stows() {
  const { state, loading, error } = useStatePolling();

  // Calculate total storage stats
  const storageStats = useMemo(() => {
    if (!state?.hosts) return { total: 0, used: 0, critical: 0 };

    let criticalCount = 0;
    for (const host of state.hosts) {
      const disks = host.metrics?.disks ?? [];
      for (const disk of disks) {
        if (disk.use_pct >= 90) criticalCount++;
      }
    }

    return { critical: criticalCount };
  }, [state?.hosts]);

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

  // Get hosts with disk info
  const hostsWithDisks = state.hosts.filter((h) => h.metrics?.disks && h.metrics.disks.length > 0);

  return (
    <div className="space-y-6">
      <PageHero
        title="Stows"
        subtitle="Storage surfaces, disk pressure, cache opportunities, and share visibility for a leaner homelab footprint."
        iconKey="stows"
        iconClassName="bg-gradient-to-br from-orange-500/30 via-amber-500/20 to-emerald-400/20 text-orange-100"
        accentClassName="before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-gradient-to-b before:from-orange-400 before:to-emerald-400"
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="text-3xl font-bold text-gray-100">{hostsWithDisks.length}</div>
          <div className="text-sm text-gray-400">Hosts</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-gray-100">
            {hostsWithDisks.reduce((acc, h) => acc + (h.metrics?.disks?.length ?? 0), 0)}
          </div>
          <div className="text-sm text-gray-400">Drives</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-gray-100">2</div>
          <div className="text-sm text-gray-400">Network Shares</div>
        </Card>
        <Card className="text-center">
          <div className={`text-3xl font-bold ${storageStats.critical > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {storageStats.critical}
          </div>
          <div className="text-sm text-gray-400">Critical</div>
        </Card>
      </div>

      {/* Host Disks */}
      <div>
        <h3 className="text-lg font-medium text-gray-200 mb-4">Storage by Host</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {hostsWithDisks.map((host) => (
            <HostDisksCard key={host.id} host={host} />
          ))}
        </div>
      </div>

      {/* Cache & Cleanup */}
      <div className="grid md:grid-cols-2 gap-4">
        <CacheCard />
        <CleanupCard />
      </div>

      {/* Network Shares */}
      <div className="grid md:grid-cols-2 gap-4">
        <NetworkSharesCard />
      </div>

      {hostsWithDisks.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No disk information available.
          <div className="text-sm mt-2">
            Disk metrics are collected from host exporters.
          </div>
        </div>
      )}
    </div>
  );
}

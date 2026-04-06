import { useState, useMemo } from 'react';
import { useStatePolling } from '../hooks/useStatePolling';
import { Card } from '../components/Card';
import { StatusChip } from '../components/StatusChip';
import { HostDetailModal } from '../components/HostDetailModal';
import { PageHero } from '../components/PageHero';
import type { Host } from '../types/inventory';

const EMPTY_HOSTS: Host[] = [];

function formatUptime(seconds?: number): string {
  if (!seconds) return 'Unknown';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

function formatHostTemperature(host: Host): string {
  const surface = host.metrics?.surface_temp_c;
  if (surface != null) return `${surface}°C`;
  const internal = host.metrics?.temp_c;
  if (internal != null) return `${internal}°C`;
  return 'N/A';
}

function MetricBar({ label, value, warn = 80, critical = 90 }: {
  label: string;
  value?: number;
  warn?: number;
  critical?: number;
}) {
  const hasValue = value != null;
  const pct = value ?? 0;
  let color = 'bg-green-500';
  if (pct >= critical) color = 'bg-red-500';
  else if (pct >= warn) color = 'bg-amber-500';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-300">{hasValue ? `${pct}%` : 'N/A'}</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: hasValue ? `${pct}%` : '0%' }}
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

function HostCard({ host, onClick }: { host: Host; onClick: () => void }) {
  return (
    <Card className="cursor-pointer hover:border-gray-600 transition-colors">
      <div onClick={onClick}>
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
            <div className="text-sm text-gray-300">{formatHostTemperature(host)}</div>
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
      </div>
    </Card>
  );
}

function TagFilter({
  allTags,
  selectedTags,
  onToggle
}: {
  allTags: string[];
  selectedTags: Set<string>;
  onToggle: (tag: string) => void;
}) {
  if (allTags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-400">Filter:</span>
      {allTags.map((tag) => (
        <button
          key={tag}
          onClick={() => onToggle(tag)}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            selectedTags.has(tag)
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          {tag}
        </button>
      ))}
      {selectedTags.size > 0 && (
        <button
          onClick={() => onToggle('__clear_all__')}
          className="px-2 py-1 text-xs text-gray-500 hover:text-gray-300"
        >
          Clear
        </button>
      )}
    </div>
  );
}

export function Hosts() {
  const { state, loading, error, refresh } = useStatePolling();
  const [selectedHost, setSelectedHost] = useState<Host | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const hosts = state?.hosts ?? EMPTY_HOSTS;

  const handleSaveHost = async (hostId: string, updates: { name?: string; tags?: string[]; links?: Record<string, string> }) => {
    const response = await fetch(`/api/hosts/${hostId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error('Failed to save host');
    }
    // Refresh state and update selected host
    await refresh();
    setSelectedHost(null);
  };

  // Extract all unique tags from hosts
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    hosts.forEach((host) => {
      host.tags?.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [hosts]);

  // Filter hosts by selected tags
  const filteredHosts = useMemo(() => {
    if (selectedTags.size === 0) return hosts;
    return hosts.filter((host) =>
      host.tags?.some((tag) => selectedTags.has(tag))
    );
  }, [hosts, selectedTags]);

  const toggleTag = (tag: string) => {
    if (tag === '__clear_all__') {
      setSelectedTags(new Set());
      return;
    }
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

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
      <PageHero
        title="Hosts"
        subtitle="Physical machines, exporter reachability, and resource pressure across the laptop and CM4."
        iconKey="hosts"
        iconClassName="bg-gradient-to-br from-blue-500/30 via-cyan-500/20 to-teal-400/20 text-blue-200"
        accentClassName="before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-gradient-to-b before:from-blue-400 before:to-teal-400"
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <TagFilter
          allTags={allTags}
          selectedTags={selectedTags}
          onToggle={toggleTag}
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHosts.map((host) => (
          <HostCard
            key={host.id}
            host={host}
            onClick={() => setSelectedHost(host)}
          />
        ))}
      </div>

      {filteredHosts.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No hosts match the selected filters
        </div>
      )}

      {selectedHost && (
        <HostDetailModal
          host={selectedHost}
          onClose={() => setSelectedHost(null)}
          onSave={handleSaveHost}
        />
      )}
    </div>
  );
}

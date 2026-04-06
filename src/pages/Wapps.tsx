import { useState, useMemo } from 'react';
import { useStatePolling } from '../hooks/useStatePolling';
import { Card } from '../components/Card';
import { StatusChip } from '../components/StatusChip';
import { PageHero } from '../components/PageHero';
import type { Service, Host } from '../types/inventory';

type GroupBy = 'host' | 'category';

interface ServiceCardProps {
  service: Service;
  hostName: string;
  onRestart: () => void;
  onStop: () => void;
  onStart: () => void;
  actionLoading: string | null;
}

function ServiceCard({
  service,
  hostName,
  onRestart,
  onStop,
  onStart,
  actionLoading,
}: ServiceCardProps) {
  const isLoading = actionLoading === service.id;
  const isRunning = service.status === 'online';

  return (
    <Card className="hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium text-gray-100">{service.name}</h3>
            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">
              {service.category}
            </span>
          </div>
          <div className="text-sm text-gray-500">{hostName}</div>
        </div>
        <StatusChip status={service.status} />
      </div>

      {/* Container Status */}
      {service.container_status && (
        <div className="text-xs text-gray-500 mb-2">
          Container: {service.container_status}
        </div>
      )}

      {/* Health Check */}
      {service.response_ms !== undefined && (
        <div className="text-xs text-gray-500 mb-2">
          Response: {service.response_ms}ms
          {service.last_check && (
            <span className="ml-2">
              (checked {new Date(service.last_check).toLocaleTimeString()})
            </span>
          )}
        </div>
      )}

      {/* URL Link */}
      {service.url && (
        <a
          href={service.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 mb-2"
        >
          Open UI
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      )}

      {/* External Exposure */}
      {service.exposes && service.exposes.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {service.exposes.map((domain) => (
            <a
              key={domain}
              href={`https://${domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-2 py-0.5 rounded bg-green-900/30 text-green-400 hover:bg-green-900/50"
            >
              {domain}
            </a>
          ))}
        </div>
      )}

      {/* Dependencies */}
      {service.depends_on && service.depends_on.length > 0 && (
        <div className="text-xs text-gray-500 mb-2">
          Depends on: {service.depends_on.join(', ')}
        </div>
      )}

      {/* Tags */}
      {service.tags && service.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {service.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs rounded bg-gray-800 text-gray-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-800">
        {isRunning ? (
          <>
            <button
              onClick={onRestart}
              disabled={isLoading}
              className="px-3 py-1 text-xs rounded bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Restarting...' : 'Restart'}
            </button>
            <button
              onClick={onStop}
              disabled={isLoading}
              className="px-3 py-1 text-xs rounded bg-red-600/20 text-red-400 hover:bg-red-600/30 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Stopping...' : 'Stop'}
            </button>
          </>
        ) : (
          <button
            onClick={onStart}
            disabled={isLoading}
            className="px-3 py-1 text-xs rounded bg-green-600/20 text-green-400 hover:bg-green-600/30 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Starting...' : 'Start'}
          </button>
        )}
      </div>
    </Card>
  );
}

function GroupHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <h3 className="text-lg font-medium text-gray-200">{title}</h3>
      <span className="text-sm text-gray-500">({count})</span>
    </div>
  );
}

export function Wapps() {
  const { state, loading, error, refresh } = useStatePolling();
  const [groupBy, setGroupBy] = useState<GroupBy>('host');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const hostMap = useMemo(() => {
    if (!state?.hosts) return new Map<string, Host>();
    return new Map(state.hosts.map((h) => [h.id, h]));
  }, [state?.hosts]);

  // Extract all unique tags
  const allTags = useMemo(() => {
    if (!state?.services) return [];
    const tags = new Set<string>();
    state.services.forEach((s) => {
      s.tags?.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [state?.services]);

  // Filter services by tags
  const filteredServices = useMemo(() => {
    if (!state?.services) return [];
    if (selectedTags.size === 0) return state.services;
    return state.services.filter((s) =>
      s.tags?.some((tag) => selectedTags.has(tag))
    );
  }, [state?.services, selectedTags]);

  // Group services
  const groupedServices = useMemo(() => {
    const groups = new Map<string, Service[]>();
    for (const service of filteredServices) {
      const key = groupBy === 'host'
        ? hostMap.get(service.host_id)?.name ?? service.host_id
        : service.category;
      const existing = groups.get(key) ?? [];
      existing.push(service);
      groups.set(key, existing);
    }
    return groups;
  }, [filteredServices, groupBy, hostMap]);

  const toggleTag = (tag: string) => {
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

  const performAction = async (serviceId: string, action: 'restart' | 'stop' | 'start') => {
    setActionLoading(serviceId);
    try {
      const response = await fetch(`/api/containers/${serviceId}/${action}`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`Failed to ${action} container`);
      }
      // Refresh state after action
      setTimeout(() => {
        refresh();
      }, 2000);
    } catch (err) {
      console.error(`Error performing ${action}:`, err);
    } finally {
      setActionLoading(null);
    }
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
        title="Wapps"
        subtitle="Companion services, containers, health checks, and entry points, with live control actions where available."
        iconKey="wapps"
        iconClassName="bg-gradient-to-br from-amber-500/35 via-orange-500/20 to-sky-400/20 text-amber-100"
        accentClassName="before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-gradient-to-b before:from-amber-400 before:to-sky-400"
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Tag Filter */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-400">Filter:</span>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    selectedTags.has(tag)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Group By Toggle */}
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setGroupBy('host')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                groupBy === 'host'
                  ? 'bg-gray-700 text-gray-100'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              By Host
            </button>
            <button
              onClick={() => setGroupBy('category')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                groupBy === 'category'
                  ? 'bg-gray-700 text-gray-100'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              By Category
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="text-3xl font-bold text-gray-100">{state.services.length}</div>
          <div className="text-sm text-gray-400">Total Services</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-green-400">
            {state.services.filter((s) => s.status === 'online').length}
          </div>
          <div className="text-sm text-gray-400">Online</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-red-400">
            {state.services.filter((s) => s.status === 'offline').length}
          </div>
          <div className="text-sm text-gray-400">Offline</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-amber-400">
            {state.services.filter((s) => s.status === 'degraded').length}
          </div>
          <div className="text-sm text-gray-400">Degraded</div>
        </Card>
      </div>

      {/* Grouped Services */}
      {Array.from(groupedServices.entries()).map(([groupName, services]) => (
        <div key={groupName}>
          <GroupHeader title={groupName} count={services.length} />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                hostName={hostMap.get(service.host_id)?.name ?? service.host_id}
                onRestart={() => performAction(service.id, 'restart')}
                onStop={() => performAction(service.id, 'stop')}
                onStart={() => performAction(service.id, 'start')}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        </div>
      ))}

      {filteredServices.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No services match the selected filters
        </div>
      )}
    </div>
  );
}

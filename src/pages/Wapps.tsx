import { useState, useMemo } from 'react';
import { useStatePolling } from '../hooks/useStatePolling';
import { Card } from '../components/Card';
import { StatusChip } from '../components/StatusChip';
import { PageHero } from '../components/PageHero';
import type { Service, Host } from '../types/inventory';

type GroupBy = 'host' | 'category';

// ─── Service Form Modal ───────────────────────────────────────────────────────

interface ServiceFormState {
  id: string;
  name: string;
  host_id: string;
  category: string;
  url: string;
  check_type: string;
  check_target: string;
  container_name: string;
  tags: string;
  exposes: string;
}

const EMPTY_FORM: ServiceFormState = {
  id: '', name: '', host_id: 'laptop', category: '',
  url: '', check_type: '', check_target: '',
  container_name: '', tags: '', exposes: '',
};

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function serviceToForm(s: Service): ServiceFormState {
  return {
    id: s.id,
    name: s.name,
    host_id: s.host_id,
    category: s.category,
    url: s.url ?? '',
    check_type: s.check_type ?? '',
    check_target: s.check_target ?? '',
    container_name: s.container_name ?? '',
    tags: s.tags?.join(', ') ?? '',
    exposes: s.exposes?.join(', ') ?? '',
  };
}

function formToPayload(f: ServiceFormState) {
  return {
    id: f.id || slugify(f.name),
    name: f.name,
    host_id: f.host_id,
    category: f.category,
    url: f.url || undefined,
    check_type: f.check_type || undefined,
    check_target: f.check_target || undefined,
    container_name: f.container_name || undefined,
    tags: f.tags ? f.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
    exposes: f.exposes ? f.exposes.split(',').map(e => e.trim()).filter(Boolean) : undefined,
  };
}

interface ServiceFormModalProps {
  mode: 'add' | 'edit';
  initial: ServiceFormState;
  hosts: Host[];
  onSave: (payload: ReturnType<typeof formToPayload>) => Promise<void>;
  onClose: () => void;
}

function ServiceFormModal({ mode, initial, hosts, onSave, onClose }: ServiceFormModalProps) {
  const [form, setForm] = useState<ServiceFormState>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof ServiceFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  // Auto-slug the id when name changes on add
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setForm(f => ({ ...f, name, ...(mode === 'add' ? { id: slugify(name) } : {}) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.host_id || !form.category) {
      setError('Name, host, and category are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(formToPayload(form));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-blue-500';
  const labelCls = 'block text-xs text-gray-400 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-base font-semibold text-gray-100">
            {mode === 'add' ? 'Add Service' : `Edit: ${initial.name}`}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Name *</label>
              <input className={inputCls} value={form.name} onChange={handleNameChange} placeholder="My Service" />
            </div>
            <div>
              <label className={labelCls}>ID {mode === 'add' ? '(auto)' : ''}</label>
              <input
                className={inputCls + (mode === 'edit' ? ' opacity-50 cursor-not-allowed' : '')}
                value={form.id}
                onChange={set('id')}
                readOnly={mode === 'edit'}
                placeholder="my-service"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Host *</label>
              <select className={inputCls} value={form.host_id} onChange={set('host_id')}>
                {hosts.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Category *</label>
              <input className={inputCls} value={form.category} onChange={set('category')} placeholder="apps" />
            </div>
          </div>
          <div>
            <label className={labelCls}>URL</label>
            <input className={inputCls} value={form.url} onChange={set('url')} placeholder="http://localhost:8080" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Check Type</label>
              <select className={inputCls} value={form.check_type} onChange={set('check_type')}>
                <option value="">None</option>
                <option value="http">HTTP</option>
                <option value="tcp">TCP</option>
                <option value="docker">Docker</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>
                {form.check_type === 'docker' ? 'Container Name' : 'Check Target'}
              </label>
              {form.check_type === 'docker' ? (
                <input className={inputCls} value={form.container_name} onChange={set('container_name')} placeholder="my-container" />
              ) : (
                <input className={inputCls} value={form.check_target} onChange={set('check_target')} placeholder="host:port or URL" />
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Tags (comma-separated)</label>
              <input className={inputCls} value={form.tags} onChange={set('tags')} placeholder="tag1, tag2" />
            </div>
            <div>
              <label className={labelCls}>Exposes (domains, comma-sep)</label>
              <input className={inputCls} value={form.exposes} onChange={set('exposes')} placeholder="app.example.com" />
            </div>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-1.5 text-sm rounded bg-gray-800 text-gray-300 hover:bg-gray-700">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50">
              {saving ? 'Saving…' : mode === 'add' ? 'Add Service' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Service Card ─────────────────────────────────────────────────────────────

interface ServiceCardProps {
  service: Service;
  hostName: string;
  onRestart: () => void;
  onStop: () => void;
  onStart: () => void;
  onEdit: () => void;
  onDelete: () => void;
  actionLoading: string | null;
}

function ServiceCard({ service, hostName, onRestart, onStop, onStart, onEdit, onDelete, actionLoading }: ServiceCardProps) {
  const isLoading = actionLoading === service.id;
  const isRunning = service.status === 'online';
  const hasContainerControl = service.host_id === 'laptop' && Boolean(service.container_name);

  return (
    <Card className="hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium text-gray-100 truncate">{service.name}</h3>
            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 shrink-0">
              {service.category}
            </span>
          </div>
          <div className="text-sm text-gray-500">{hostName}</div>
        </div>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          <StatusChip status={service.status} />
          <button
            onClick={onEdit}
            title="Edit service"
            className="p-1 text-gray-600 hover:text-gray-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            title="Delete service"
            className="p-1 text-gray-600 hover:text-red-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {service.container_status && (
        <div className="text-xs text-gray-500 mb-2">Container: {service.container_status}</div>
      )}

      {service.response_ms !== undefined && (
        <div className="text-xs text-gray-500 mb-2">
          Response: {service.response_ms}ms
          {service.last_check && (
            <span className="ml-2">(checked {new Date(service.last_check).toLocaleTimeString()})</span>
          )}
        </div>
      )}

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

      {service.exposes && service.exposes.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {service.exposes.map((domain) => (
            <a key={domain} href={`https://${domain}`} target="_blank" rel="noopener noreferrer"
              className="text-xs px-2 py-0.5 rounded bg-green-900/30 text-green-400 hover:bg-green-900/50">
              {domain}
            </a>
          ))}
        </div>
      )}

      {service.depends_on && service.depends_on.length > 0 && (
        <div className="text-xs text-gray-500 mb-2">Depends on: {service.depends_on.join(', ')}</div>
      )}

      {service.tags && service.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {service.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 text-xs rounded bg-gray-800 text-gray-400">{tag}</span>
          ))}
        </div>
      )}

      {hasContainerControl && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-800">
          {isRunning ? (
            <>
              <button onClick={onRestart} disabled={isLoading}
                className="px-3 py-1 text-xs rounded bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 disabled:opacity-50 transition-colors">
                {isLoading ? 'Restarting...' : 'Restart'}
              </button>
              <button onClick={onStop} disabled={isLoading}
                className="px-3 py-1 text-xs rounded bg-red-600/20 text-red-400 hover:bg-red-600/30 disabled:opacity-50 transition-colors">
                {isLoading ? 'Stopping...' : 'Stop'}
              </button>
            </>
          ) : (
            <button onClick={onStart} disabled={isLoading}
              className="px-3 py-1 text-xs rounded bg-green-600/20 text-green-400 hover:bg-green-600/30 disabled:opacity-50 transition-colors">
              {isLoading ? 'Starting...' : 'Start'}
            </button>
          )}
        </div>
      )}
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export function Wapps() {
  const { state, loading, error, refresh } = useStatePolling();
  const [groupBy, setGroupBy] = useState<GroupBy>('host');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal state
  const [modal, setModal] = useState<
    { mode: 'add'; initial: ServiceFormState } |
    { mode: 'edit'; initial: ServiceFormState; id: string } |
    null
  >(null);

  const hostMap = useMemo(() => {
    if (!state?.hosts) return new Map<string, Host>();
    return new Map(state.hosts.map((h) => [h.id, h]));
  }, [state?.hosts]);

  const allTags = useMemo(() => {
    if (!state?.services) return [];
    const tags = new Set<string>();
    state.services.forEach((s) => s.tags?.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [state?.services]);

  const filteredServices = useMemo(() => {
    if (!state?.services) return [];
    if (selectedTags.size === 0) return state.services;
    return state.services.filter((s) => s.tags?.some((tag) => selectedTags.has(tag)));
  }, [state?.services, selectedTags]);

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
      if (next.has(tag)) next.delete(tag); else next.add(tag);
      return next;
    });
  };

  const performAction = async (serviceId: string, action: 'restart' | 'stop' | 'start') => {
    const service = state?.services.find((s) => s.id === serviceId);
    const target = service?.container_name ?? serviceId;
    setActionLoading(serviceId);
    try {
      await fetch(`/api/containers/${encodeURIComponent(target)}/${action}`, { method: 'POST' });
      setTimeout(refresh, 2000);
    } catch (err) {
      console.error(`Error performing ${action}:`, err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSave = async (payload: ReturnType<typeof formToPayload>) => {
    if (modal?.mode === 'edit') {
      const res = await fetch(`/api/services/${encodeURIComponent(modal.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to update service');
      }
    } else {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to add service');
      }
    }
    refresh();
  };

  const handleDelete = async (service: Service) => {
    if (!window.confirm(`Delete "${service.name}"? This removes it from the inventory.`)) return;
    await fetch(`/api/services/${encodeURIComponent(service.id)}`, { method: 'DELETE' });
    refresh();
  };

  if (loading) return <div className="text-gray-400">Loading...</div>;
  if (error || !state) return <div className="text-red-400">Failed to load state: {error?.message ?? 'Unknown error'}</div>;

  return (
    <div className="space-y-6">
      {modal && (
        <ServiceFormModal
          mode={modal.mode}
          initial={modal.initial}
          hosts={state.hosts}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      <PageHero
        title="Wapps"
        subtitle="Companion services, containers, health checks, and entry points, with live control actions where available."
        iconKey="wapps"
        iconClassName="bg-gradient-to-br from-amber-500/35 via-orange-500/20 to-sky-400/20 text-amber-100"
        accentClassName="before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-gradient-to-b before:from-amber-400 before:to-sky-400"
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-400">Filter:</span>
              {allTags.map((tag) => (
                <button key={tag} onClick={() => toggleTag(tag)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    selectedTags.has(tag) ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}>
                  {tag}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
            {(['host', 'category'] as GroupBy[]).map((g) => (
              <button key={g} onClick={() => setGroupBy(g)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  groupBy === g ? 'bg-gray-700 text-gray-100' : 'text-gray-400 hover:text-gray-200'
                }`}>
                By {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => setModal({ mode: 'add', initial: EMPTY_FORM })}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-600/30 transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Service
        </button>
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
                onEdit={() => setModal({ mode: 'edit', initial: serviceToForm(service), id: service.id })}
                onDelete={() => handleDelete(service)}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        </div>
      ))}

      {filteredServices.length === 0 && (
        <div className="text-center text-gray-500 py-8">No services match the selected filters</div>
      )}
    </div>
  );
}

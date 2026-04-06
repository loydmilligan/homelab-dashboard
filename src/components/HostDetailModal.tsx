import { useState } from 'react';
import type { Host } from '../types/inventory';

interface Props {
  host: Host;
  onClose: () => void;
  onSave?: (hostId: string, updates: HostUpdates) => Promise<void>;
}

interface HostUpdates {
  name?: string;
  tags?: string[];
  links?: Record<string, string>;
}

function formatUptime(seconds?: number): string {
  if (!seconds) return 'Unknown';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatTemperature(value?: number | null): string {
  return value != null ? `${value}°C` : 'N/A';
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

export function HostDetailModal({ host, onClose, onSave }: Props) {
  const metrics = host.metrics;
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Edit state
  const [editName, setEditName] = useState(host.name);
  const [editTags, setEditTags] = useState(host.tags?.join(', ') ?? '');
  const [editLinks, setEditLinks] = useState<Array<{ name: string; url: string }>>(
    Object.entries(host.links ?? {}).map(([name, url]) => ({ name, url }))
  );

  const handleSave = async () => {
    if (!onSave) return;

    setSaving(true);
    setSaveError(null);
    try {
      const updates: HostUpdates = {
        name: editName,
        tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
        links: Object.fromEntries(editLinks.filter(l => l.name && l.url).map(l => [l.name, l.url])),
      };
      await onSave(host.id, updates);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save:', err);
      setSaveError(err instanceof Error ? err.message : 'Failed to save host');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditName(host.name);
    setEditTags(host.tags?.join(', ') ?? '');
    setEditLinks(Object.entries(host.links ?? {}).map(([name, url]) => ({ name, url })));
    setSaveError(null);
    setIsEditing(false);
  };

  const addLink = () => {
    setEditLinks([...editLinks, { name: '', url: '' }]);
  };

  const removeLink = (index: number) => {
    setEditLinks(editLinks.filter((_, i) => i !== index));
  };

  const updateLink = (index: number, field: 'name' | 'url', value: string) => {
    const updated = [...editLinks];
    updated[index][field] = value;
    setEditLinks(updated);
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-xl font-semibold text-gray-100 bg-gray-800 border border-gray-600 rounded px-2 py-1 w-full max-w-xs"
              />
            ) : (
              <h2 className="text-xl font-semibold text-gray-100">{host.name}</h2>
            )}
            <p className="text-sm text-gray-400">{host.role}</p>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-sm rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 text-sm rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
              >
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 text-2xl leading-none ml-2"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {saveError && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {saveError}
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Status</div>
              <div className={`text-sm font-medium ${
                host.status === 'online' ? 'text-green-400' :
                host.status === 'offline' ? 'text-red-400' :
                host.status === 'degraded' ? 'text-amber-400' : 'text-gray-400'
              }`}>
                {host.status}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">IP Address</div>
              <div className="text-sm text-gray-300 font-mono">{host.address?.ip ?? 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Uptime</div>
              <div className="text-sm text-gray-300">{formatUptime(metrics?.uptime_s)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Temperature</div>
              <div className="text-sm text-gray-300">{formatTemperature(metrics?.surface_temp_c ?? metrics?.temp_c)}</div>
            </div>
          </div>

          {(metrics?.surface_temp_c != null || metrics?.ambient_temp_c != null || metrics?.temp_source) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Surface Probe</div>
                <div className="text-sm text-gray-300">{formatTemperature(metrics?.surface_temp_c)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Ambient Probe</div>
                <div className="text-sm text-gray-300">{formatTemperature(metrics?.ambient_temp_c)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Temp Source</div>
                <div className="text-sm text-gray-300">{metrics?.temp_source ?? 'N/A'}</div>
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Tags</div>
            {isEditing ? (
              <input
                type="text"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="tag1, tag2, tag3"
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-gray-200"
              />
            ) : host.tags && host.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {host.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs rounded bg-gray-800 text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No tags</div>
            )}
          </div>

          {/* Resource Usage */}
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-3">Resource Usage</div>
            <div className="space-y-4">
              <MetricBar label="CPU" value={metrics?.cpu_pct} />
              <div>
                <MetricBar label="RAM" value={metrics?.ram_pct} />
                {metrics?.ram_total_mb && (
                  <div className="text-xs text-gray-500 mt-1">
                    {metrics.ram_used_mb ?? 0} MB / {metrics.ram_total_mb} MB
                  </div>
                )}
              </div>
              <MetricBar label="Disk" value={metrics?.disk_pct} />
            </div>
          </div>

          {/* Top CPU Processes */}
          {metrics?.top_cpu && metrics.top_cpu.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-3">Top CPU Processes</div>
              <div className="bg-gray-800/50 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-700">
                      <th className="px-3 py-2">Command</th>
                      <th className="px-3 py-2 text-right">CPU %</th>
                      <th className="px-3 py-2 text-right">MEM %</th>
                      <th className="px-3 py-2">User</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    {metrics.top_cpu.map((proc, i) => (
                      <tr key={i} className="border-b border-gray-700/50 last:border-0">
                        <td className="px-3 py-2 font-mono text-xs truncate max-w-[200px]">{proc.command}</td>
                        <td className="px-3 py-2 text-right">{proc.cpu_pct.toFixed(1)}</td>
                        <td className="px-3 py-2 text-right">{proc.mem_pct.toFixed(1)}</td>
                        <td className="px-3 py-2 text-gray-400">{proc.user}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Top Memory Processes */}
          {metrics?.top_mem && metrics.top_mem.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-3">Top Memory Processes</div>
              <div className="bg-gray-800/50 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-700">
                      <th className="px-3 py-2">Command</th>
                      <th className="px-3 py-2 text-right">MEM %</th>
                      <th className="px-3 py-2 text-right">CPU %</th>
                      <th className="px-3 py-2">User</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    {metrics.top_mem.map((proc, i) => (
                      <tr key={i} className="border-b border-gray-700/50 last:border-0">
                        <td className="px-3 py-2 font-mono text-xs truncate max-w-[200px]">{proc.command}</td>
                        <td className="px-3 py-2 text-right">{proc.mem_pct.toFixed(1)}</td>
                        <td className="px-3 py-2 text-right">{proc.cpu_pct.toFixed(1)}</td>
                        <td className="px-3 py-2 text-gray-400">{proc.user}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Disk Breakdown */}
          {metrics?.disks && metrics.disks.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-3">Disk Breakdown</div>
              <div className="bg-gray-800/50 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-700">
                      <th className="px-3 py-2">Mount</th>
                      <th className="px-3 py-2 text-right">Size</th>
                      <th className="px-3 py-2 text-right">Used</th>
                      <th className="px-3 py-2 text-right">Avail</th>
                      <th className="px-3 py-2 text-right">Use %</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    {metrics.disks.map((disk, i) => (
                      <tr key={i} className="border-b border-gray-700/50 last:border-0">
                        <td className="px-3 py-2 font-mono text-xs">{disk.mount}</td>
                        <td className="px-3 py-2 text-right">{disk.size}</td>
                        <td className="px-3 py-2 text-right">{disk.used}</td>
                        <td className="px-3 py-2 text-right">{disk.available}</td>
                        <td className={`px-3 py-2 text-right ${
                          disk.use_pct >= 90 ? 'text-red-400' :
                          disk.use_pct >= 80 ? 'text-amber-400' : ''
                        }`}>
                          {disk.use_pct}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Links */}
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Links</div>
            {isEditing ? (
              <div className="space-y-2">
                {editLinks.map((link, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={link.name}
                      onChange={(e) => updateLink(i, 'name', e.target.value)}
                      placeholder="Name"
                      className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-gray-200"
                    />
                    <input
                      type="text"
                      value={link.url}
                      onChange={(e) => updateLink(i, 'url', e.target.value)}
                      placeholder="URL"
                      className="flex-[2] bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-gray-200"
                    />
                    <button
                      onClick={() => removeLink(i)}
                      className="px-3 py-2 text-red-400 hover:bg-gray-800 rounded"
                    >
                      &times;
                    </button>
                  </div>
                ))}
                <button
                  onClick={addLink}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  + Add Link
                </button>
              </div>
            ) : host.links && Object.keys(host.links).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {Object.entries(host.links).map(([name, url]) => (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-sm rounded bg-gray-800 text-blue-400 hover:bg-gray-700 transition-colors"
                  >
                    {name} &rarr;
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No links</div>
            )}
          </div>

          {/* Exporter Info */}
          {host.exporter_info && (
            <div className="text-xs text-gray-500 pt-4 border-t border-gray-800">
              Exporter: {host.exporter_info.container} (v{host.exporter_info.version})
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

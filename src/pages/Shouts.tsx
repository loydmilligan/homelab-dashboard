import { useEffect, useState } from 'react';
import { Card, CardHeader } from '../components/Card';
import { PageHero } from '../components/PageHero';
import type { NotificationEventRecord, NotificationSettings } from '../types/notifications';

const SEVERITY_STYLES: Record<string, string> = {
  info: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  success: 'bg-green-500/10 text-green-300 border-green-500/20',
  warning: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  error: 'bg-red-500/10 text-red-300 border-red-500/20',
};

const DEFAULT_SETTINGS: NotificationSettings = {
  browser: { enabled: false },
  ntfy: { enabled: false, server_url: '', topic: '', token: '' },
  smtp: { enabled: false, host: '', port: 587, secure: false, username: '', password: '', from_email: '', to_emails: [] },
};

function formatRelative(isoString: string) {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function Shouts() {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [events, setEvents] = useState<NotificationEventRecord[]>([]);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [testingNotification, setTestingNotification] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadAll() {
    try {
      const [settingsRes, eventsRes] = await Promise.all([
        fetch('/api/notifications/settings'),
        fetch('/api/notifications/events?limit=30'),
      ]);
      if (settingsRes.ok) {
        const data = (await settingsRes.json()) as { settings: NotificationSettings };
        setSettings(data.settings);
      }
      if (eventsRes.ok) {
        const data = (await eventsRes.json()) as { events: NotificationEventRecord[] };
        setEvents(data.events);
      }
    } catch {
      setError('Failed to load notification data');
    } finally {
      setLoadingSettings(false);
    }
  }

  useEffect(() => {
    void loadAll();
    const interval = setInterval(() => {
      fetch('/api/notifications/events?limit=30')
        .then((r) => r.json())
        .then((data: { events: NotificationEventRecord[] }) => setEvents(data.events))
        .catch(() => null);
    }, 15_000);
    return () => clearInterval(interval);
  }, []);

  async function saveSettings() {
    setSavingSettings(true);
    setError(null);
    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error('Failed to save settings');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSavingSettings(false);
    }
  }

  async function sendTest() {
    setTestingNotification(true);
    setTestResult(null);
    try {
      const response = await fetch('/api/notifications/test', { method: 'POST' });
      const data = (await response.json().catch(() => null)) as { channelResults?: Array<{ channel: string; success: boolean }> } | null;
      const summary = data?.channelResults
        ?.map((r) => `${r.channel}: ${r.success ? 'ok' : 'failed'}`)
        .join(', ') ?? 'sent';
      setTestResult(summary);
      void loadAll();
    } catch {
      setTestResult('Failed to send test');
    } finally {
      setTestingNotification(false);
    }
  }

  async function markAllRead() {
    await fetch('/api/notifications/events/read-all', { method: 'POST' });
    void loadAll();
  }

  function updateNtfy(field: string, value: string | boolean) {
    setSettings((s) => ({ ...s, ntfy: { ...s.ntfy, [field]: value } }));
  }

  function updateSmtp(field: string, value: string | number | boolean | string[]) {
    setSettings((s) => ({ ...s, smtp: { ...s.smtp, [field]: value } }));
  }

  const unreadCount = events.filter((e) => !e.read_at).length;

  return (
    <div className="space-y-6">
      <PageHero
        title="Shouts"
        subtitle="Configure notification channels and review recent alerts from across the homelab."
        iconKey="shouts"
        iconClassName="bg-gradient-to-br from-violet-500/30 via-purple-500/20 to-pink-400/20 text-violet-100"
        accentClassName="before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-gradient-to-b before:from-violet-400 before:to-pink-400"
      />

      {error ? <div className="text-red-400 text-sm">{error}</div> : null}

      {/* ── Channels ── */}
      <div>
        <h2 className="text-base font-semibold text-gray-300 mb-3">Channels</h2>

        <div className="space-y-4">
          {/* Browser */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-100">Browser</div>
                <div className="text-xs text-gray-500 mt-0.5">In-app notification bell</div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={settings.browser.enabled}
                  onChange={(e) => setSettings((s) => ({ ...s, browser: { enabled: e.target.checked } }))}
                />
                Enabled
              </label>
            </div>
          </Card>

          {/* ntfy */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-medium text-gray-100">ntfy</div>
                <div className="text-xs text-gray-500 mt-0.5">Push via ntfy.sh or self-hosted</div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={settings.ntfy.enabled}
                  onChange={(e) => updateNtfy('enabled', e.target.checked)}
                />
                Enabled
              </label>
            </div>
            {settings.ntfy.enabled ? (
              <div className="grid md:grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-xs text-gray-400">Server URL</span>
                  <input
                    className="w-full rounded bg-gray-950 px-3 py-2 text-sm text-gray-100"
                    value={settings.ntfy.server_url ?? ''}
                    onChange={(e) => updateNtfy('server_url', e.target.value)}
                    placeholder="https://ntfy.sh"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-gray-400">Topic</span>
                  <input
                    className="w-full rounded bg-gray-950 px-3 py-2 text-sm text-gray-100"
                    value={settings.ntfy.topic ?? ''}
                    onChange={(e) => updateNtfy('topic', e.target.value)}
                    placeholder="homelab-alerts"
                  />
                </label>
                <label className="space-y-1 md:col-span-2">
                  <span className="text-xs text-gray-400">Token (optional)</span>
                  <input
                    type="password"
                    className="w-full rounded bg-gray-950 px-3 py-2 text-sm text-gray-100"
                    value={settings.ntfy.token ?? ''}
                    onChange={(e) => updateNtfy('token', e.target.value)}
                    placeholder="tk_..."
                  />
                </label>
              </div>
            ) : null}
          </Card>

          {/* SMTP */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-medium text-gray-100">Email (SMTP)</div>
                <div className="text-xs text-gray-500 mt-0.5">Send alerts as email</div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={settings.smtp.enabled}
                  onChange={(e) => updateSmtp('enabled', e.target.checked)}
                />
                Enabled
              </label>
            </div>
            {settings.smtp.enabled ? (
              <div className="grid md:grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-xs text-gray-400">Host</span>
                  <input className="w-full rounded bg-gray-950 px-3 py-2 text-sm text-gray-100" value={settings.smtp.host ?? ''} onChange={(e) => updateSmtp('host', e.target.value)} placeholder="smtp.example.com" />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-gray-400">Port</span>
                  <input className="w-full rounded bg-gray-950 px-3 py-2 text-sm text-gray-100" value={settings.smtp.port ?? ''} onChange={(e) => updateSmtp('port', Number(e.target.value))} placeholder="587" />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-gray-400">Username</span>
                  <input className="w-full rounded bg-gray-950 px-3 py-2 text-sm text-gray-100" value={settings.smtp.username ?? ''} onChange={(e) => updateSmtp('username', e.target.value)} />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-gray-400">Password</span>
                  <input type="password" className="w-full rounded bg-gray-950 px-3 py-2 text-sm text-gray-100" value={settings.smtp.password ?? ''} onChange={(e) => updateSmtp('password', e.target.value)} />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-gray-400">From Email</span>
                  <input className="w-full rounded bg-gray-950 px-3 py-2 text-sm text-gray-100" value={settings.smtp.from_email ?? ''} onChange={(e) => updateSmtp('from_email', e.target.value)} placeholder="shost@example.com" />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-gray-400">To Emails (comma-separated)</span>
                  <input
                    className="w-full rounded bg-gray-950 px-3 py-2 text-sm text-gray-100"
                    value={settings.smtp.to_emails.join(', ')}
                    onChange={(e) => updateSmtp('to_emails', e.target.value.split(',').map((v) => v.trim()).filter(Boolean))}
                    placeholder="you@example.com"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input type="checkbox" checked={settings.smtp.secure ?? false} onChange={(e) => updateSmtp('secure', e.target.checked)} />
                  TLS
                </label>
              </div>
            ) : null}
          </Card>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => { void saveSettings(); }}
            disabled={savingSettings || loadingSettings}
            className="rounded-md bg-violet-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {savingSettings ? 'Saving...' : 'Save Channels'}
          </button>
          <button
            type="button"
            onClick={() => { void sendTest(); }}
            disabled={testingNotification}
            className="rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-300 disabled:opacity-50"
          >
            {testingNotification ? 'Sending...' : 'Send Test'}
          </button>
          {testResult ? <span className="self-center text-sm text-gray-400">{testResult}</span> : null}
        </div>
      </div>

      {/* ── Recent Events ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-300">
            Recent Events
            {unreadCount > 0 ? (
              <span className="ml-2 rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-300">{unreadCount} new</span>
            ) : null}
          </h2>
          {unreadCount > 0 ? (
            <button type="button" onClick={() => { void markAllRead(); }} className="text-xs text-gray-500 hover:text-gray-300">
              Mark all read
            </button>
          ) : null}
        </div>

        <Card>
          <CardHeader title="" subtitle="" action={null} />
          {events.length === 0 ? (
            <div className="text-gray-500 py-4 text-sm text-center">No events yet. Events will appear here when notifications fire.</div>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className={`rounded-lg border px-3 py-2.5 ${SEVERITY_STYLES[event.severity] ?? SEVERITY_STYLES.info} ${event.read_at ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{event.title}</div>
                      <div className="text-xs mt-0.5 opacity-80">{event.message}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-xs opacity-60">{formatRelative(event.created_at)}</div>
                      <div className="text-xs opacity-50">{event.source}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

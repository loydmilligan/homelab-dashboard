import { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { PageHero } from '../components/PageHero';
import type { NotificationSettings } from '../types/notifications';

type Theme = 'dark' | 'light' | 'system';

export function Settings() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    const root = document.documentElement;
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('light-mode', !prefersDark);
    } else {
      root.classList.toggle('light-mode', theme === 'light');
    }
  }, [theme]);

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const response = await fetch('/api/notifications/settings');
      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { settings: NotificationSettings };
      setNotificationSettings(payload.settings);
    })();
  }, []);

  async function saveNotifications() {
    if (!notificationSettings) {
      return;
    }

    const response = await fetch('/api/notifications/settings', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(notificationSettings),
    });

    setSaveMessage(response.ok ? 'Notification settings saved.' : 'Failed to save notification settings.');
  }

  async function sendTestNotification() {
    const response = await fetch('/api/notifications/test', { method: 'POST' });
    const payload = (await response.json().catch(() => null)) as
      | {
          channelResults?: Array<{ channel: string; attempted: boolean; success: boolean; detail?: string }>;
        }
      | null;

    if (!response.ok && response.status !== 207) {
      setSaveMessage('Failed to send test notification.');
      return;
    }

    if (payload?.channelResults) {
      const summary = payload.channelResults
        .map((result) => {
          const state = !result.attempted ? 'skipped' : result.success ? 'ok' : 'failed';
          return `${result.channel}:${state}${result.detail ? ` (${result.detail})` : ''}`;
        })
        .join(' | ');
      setSaveMessage(summary);
      return;
    }

    setSaveMessage('Test notification queued.');
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="Settings"
        subtitle="Shost appearance and interface preferences. Keep the control surface simple, visible, and local-first."
        iconKey="settings"
        iconClassName="bg-gradient-to-br from-slate-500/30 via-blue-500/20 to-cyan-400/20 text-slate-100"
        accentClassName="before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-gradient-to-b before:from-slate-300 before:to-cyan-400"
      />

      <Card>
        <h3 className="text-lg font-medium text-gray-100 mb-4">General</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Theme</label>
            <div className="flex gap-2">
              {(['dark', 'light', 'system'] as Theme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
                    theme === t
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {notificationSettings ? (
        <Card>
          <h3 className="text-lg font-medium text-gray-100 mb-4">Notifications</h3>
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-4">
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-100">Browser</div>
                  <div className="text-xs text-gray-500">This does not send anything externally. It controls the in-app Alerts feed plus browser push popups when permission is granted.</div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.browser.enabled}
                  onChange={(event) =>
                    setNotificationSettings((current) =>
                      current ? { ...current, browser: { enabled: event.target.checked } } : current,
                    )
                  }
                />
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-gray-800 bg-gray-950/40 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-100">ntfy</div>
                  <div className="text-xs text-gray-500">App-wide push delivery for any feature that emits notification events.</div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.ntfy.enabled}
                  onChange={(event) =>
                    setNotificationSettings((current) =>
                      current ? { ...current, ntfy: { ...current.ntfy, enabled: event.target.checked } } : current,
                    )
                  }
                />
              </div>
              <input className="w-full rounded bg-gray-900 px-3 py-2 text-sm text-gray-100" placeholder="Server URL, e.g. https://ntfy.mattmariani.com" value={notificationSettings.ntfy.server_url ?? ''} onChange={(event) => setNotificationSettings((current) => current ? { ...current, ntfy: { ...current.ntfy, server_url: event.target.value } } : current)} />
              <input className="w-full rounded bg-gray-900 px-3 py-2 text-sm text-gray-100" placeholder="Topic, e.g. shost-nots" value={notificationSettings.ntfy.topic ?? ''} onChange={(event) => setNotificationSettings((current) => current ? { ...current, ntfy: { ...current.ntfy, topic: event.target.value } } : current)} />
              <input className="w-full rounded bg-gray-900 px-3 py-2 text-sm text-gray-100" placeholder="Token" value={notificationSettings.ntfy.token ?? ''} onChange={(event) => setNotificationSettings((current) => current ? { ...current, ntfy: { ...current.ntfy, token: event.target.value } } : current)} />
              <div className="text-xs text-gray-500">Use either a token or username/password credentials. The token is enough for your setup.</div>
            </div>

            <div className="space-y-3 rounded-lg border border-gray-800 bg-gray-950/40 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-100">SMTP Email</div>
                  <div className="text-xs text-gray-500">Works for Gmail app-password SMTP or any other relay. For Gmail, use port 587 with TLS unchecked, or port 465 with TLS checked.</div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.smtp.enabled}
                  onChange={(event) =>
                    setNotificationSettings((current) =>
                      current ? { ...current, smtp: { ...current.smtp, enabled: event.target.checked } } : current,
                    )
                  }
                />
              </div>
              <input className="w-full rounded bg-gray-900 px-3 py-2 text-sm text-gray-100" placeholder="SMTP host" value={notificationSettings.smtp.host ?? ''} onChange={(event) => setNotificationSettings((current) => current ? { ...current, smtp: { ...current.smtp, host: event.target.value } } : current)} />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="w-full rounded bg-gray-900 px-3 py-2 text-sm text-gray-100"
                  placeholder="Port"
                  value={notificationSettings.smtp.port ?? ''}
                  onChange={(event) =>
                    setNotificationSettings((current) => {
                      if (!current) return current;
                      const port = Number(event.target.value) || undefined;
                      const secure = port === 587 ? false : current.smtp.secure;
                      return { ...current, smtp: { ...current.smtp, port, secure } };
                    })
                  }
                />
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input type="checkbox" checked={Boolean(notificationSettings.smtp.secure)} onChange={(event) => setNotificationSettings((current) => current ? { ...current, smtp: { ...current.smtp, secure: event.target.checked } } : current)} />
                  Use TLS
                </label>
              </div>
              <input className="w-full rounded bg-gray-900 px-3 py-2 text-sm text-gray-100" placeholder="SMTP username" value={notificationSettings.smtp.username ?? ''} onChange={(event) => setNotificationSettings((current) => current ? { ...current, smtp: { ...current.smtp, username: event.target.value } } : current)} />
              <input className="w-full rounded bg-gray-900 px-3 py-2 text-sm text-gray-100" placeholder="SMTP password or app password" type="password" value={notificationSettings.smtp.password ?? ''} onChange={(event) => setNotificationSettings((current) => current ? { ...current, smtp: { ...current.smtp, password: event.target.value } } : current)} />
              <input className="w-full rounded bg-gray-900 px-3 py-2 text-sm text-gray-100" placeholder="From email" value={notificationSettings.smtp.from_email ?? ''} onChange={(event) => setNotificationSettings((current) => current ? { ...current, smtp: { ...current.smtp, from_email: event.target.value } } : current)} />
              <input className="w-full rounded bg-gray-900 px-3 py-2 text-sm text-gray-100" placeholder="To emails, comma-separated" value={notificationSettings.smtp.to_emails.join(', ')} onChange={(event) => setNotificationSettings((current) => current ? { ...current, smtp: { ...current.smtp, to_emails: event.target.value.split(',').map((value) => value.trim()).filter(Boolean) } } : current)} />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button onClick={() => { void saveNotifications(); }} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">Save Notifications</button>
              <button onClick={() => { void sendTestNotification(); }} className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-200">Send Test</button>
              {saveMessage ? <span className="text-sm text-gray-400">{saveMessage}</span> : null}
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

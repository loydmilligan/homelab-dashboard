import { useEffect, useMemo, useState } from 'react';
import type { NotificationEventRecord } from '../types/notifications';

function colorForSeverity(severity: NotificationEventRecord['severity']) {
  if (severity === 'success') return 'text-green-300 border-green-500/30';
  if (severity === 'warning') return 'text-amber-300 border-amber-500/30';
  if (severity === 'error') return 'text-red-300 border-red-500/30';
  return 'text-sky-300 border-sky-500/30';
}

export function AppNotifications() {
  const [events, setEvents] = useState<NotificationEventRecord[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const seen = new Set<string>();

    async function refresh() {
      const response = await fetch('/api/notifications/events?limit=10&unread=true');
      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { events: NotificationEventRecord[] };
      if (cancelled) {
        return;
      }

      setEvents(payload.events);

      if (window.Notification?.permission === 'granted') {
        for (const event of payload.events) {
          if (seen.has(event.id)) {
            continue;
          }

          seen.add(event.id);
          new Notification(event.title, {
            body: event.message,
          });
        }
      }
    }

    void refresh();
    const interval = setInterval(() => {
      void refresh();
    }, 10000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const unreadCount = useMemo(() => events.filter((event) => !event.read_at).length, [events]);

  async function requestPermission() {
    if (!window.Notification) {
      return;
    }

    await Notification.requestPermission();
  }

  async function markAllRead() {
    await fetch('/api/notifications/events/read-all', { method: 'POST' });
    setEvents((current) => current.map((event) => ({ ...event, read_at: new Date().toISOString() })));
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200"
        >
          Alerts {unreadCount > 0 ? `(${unreadCount})` : ''}
        </button>
        <button
          type="button"
          onClick={() => {
            void requestPermission();
          }}
          className="rounded-md border border-gray-700 bg-gray-900 px-2 py-1.5 text-xs text-gray-400"
        >
          Browser
        </button>
      </div>

      {open ? (
        <div className="absolute right-0 mt-2 w-[26rem] rounded-xl border border-gray-800 bg-gray-950/95 p-3 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-100">App Notifications</div>
            <button
              type="button"
              onClick={() => {
                void markAllRead();
              }}
              className="text-xs text-gray-400 hover:text-gray-200"
            >
              Mark all read
            </button>
          </div>
          <div className="space-y-2">
            {events.length === 0 ? (
              <div className="text-sm text-gray-500">No unread notifications.</div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className={`rounded-lg border bg-gray-900/80 p-3 ${colorForSeverity(event.severity)}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-gray-100">{event.title}</div>
                    <div className="text-[11px] text-gray-500">
                      {new Date(event.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="mt-1 text-sm text-gray-300">{event.message}</div>
                  <div className="mt-2 text-[11px] text-gray-500">
                    {event.source} via {event.channels.join(', ') || 'in-app'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

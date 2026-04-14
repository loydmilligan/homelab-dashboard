import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { EmitNotificationInput, NotificationEventRecord, NotificationSettings } from './types.js';

type NotificationRow = {
  id: string;
  source: string;
  event_key: string;
  title: string;
  message: string;
  severity: NotificationEventRecord['severity'];
  channels_json: string;
  created_at: string;
  read_at: string | null;
};

const DEFAULT_SETTINGS: NotificationSettings = {
  browser: { enabled: true },
  ntfy: { enabled: false },
  smtp: { enabled: false, secure: true, port: 465, to_emails: [] },
};

function getDefaultDbPath() {
  if (process.env.NOTIFICATIONS_DB_PATH) {
    return process.env.NOTIFICATIONS_DB_PATH;
  }

  if (process.cwd() === '/app') {
    return '/app/data/notifications.db';
  }

  return join(process.cwd(), 'data', 'notifications.db');
}

function parseJson<T>(value: string): T {
  return JSON.parse(value) as T;
}

function normalizeOptionalSecret(value: string | undefined) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function mergeSecretValue(nextValue: string | undefined, currentValue: string | undefined) {
  return normalizeOptionalSecret(nextValue) ?? currentValue;
}

function formatEvent(row: NotificationRow): NotificationEventRecord {
  return {
    id: row.id,
    source: row.source,
    event_key: row.event_key,
    title: row.title,
    message: row.message,
    severity: row.severity,
    channels: parseJson(row.channels_json),
    created_at: row.created_at,
    read_at: row.read_at ?? undefined,
  };
}

export class NotificationsStore {
  private db: DatabaseSync;

  constructor(dbPath = getDefaultDbPath()) {
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new DatabaseSync(dbPath);
    this.migrate();
    this.ensureDefaults();
  }

  private migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notification_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        settings_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS notification_events (
        id TEXT PRIMARY KEY,
        source TEXT NOT NULL,
        event_key TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        severity TEXT NOT NULL,
        channels_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        read_at TEXT
      );
    `);
  }

  private ensureDefaults() {
    const existing = this.db
      .prepare('SELECT settings_json FROM notification_settings WHERE id = 1')
      .get() as { settings_json: string } | undefined;

    if (!existing) {
      this.db
        .prepare(
          'INSERT INTO notification_settings (id, settings_json, updated_at) VALUES (1, ?, ?)',
        )
        .run(JSON.stringify(DEFAULT_SETTINGS), new Date().toISOString());
    }
  }

  getSettings() {
    const row = this.db
      .prepare('SELECT settings_json FROM notification_settings WHERE id = 1')
      .get() as { settings_json: string };

    return parseJson<NotificationSettings>(row.settings_json);
  }

  getPublicSettings() {
    const settings = this.getSettings();

    return {
      browser: settings.browser,
      ntfy: {
        ...settings.ntfy,
        token: undefined,
        password: undefined,
        has_token: Boolean(settings.ntfy.token),
        has_password: Boolean(settings.ntfy.password),
      },
      smtp: {
        ...settings.smtp,
        password: undefined,
        has_password: Boolean(settings.smtp.password),
      },
    };
  }

  saveSettings(settings: NotificationSettings) {
    const current = this.getSettings();
    const merged: NotificationSettings = {
      browser: settings.browser,
      ntfy: {
        ...settings.ntfy,
        token: mergeSecretValue(settings.ntfy.token, current.ntfy.token),
        password: mergeSecretValue(settings.ntfy.password, current.ntfy.password),
      },
      smtp: {
        ...settings.smtp,
        password: mergeSecretValue(settings.smtp.password, current.smtp.password),
      },
    };
    const updatedAt = new Date().toISOString();

    this.db
      .prepare('UPDATE notification_settings SET settings_json = ?, updated_at = ? WHERE id = 1')
      .run(JSON.stringify(merged), updatedAt);

    return this.getPublicSettings();
  }

  createEvent(input: EmitNotificationInput) {
    const event: NotificationEventRecord = {
      id: randomUUID(),
      source: input.source,
      event_key: input.event_key,
      title: input.title,
      message: input.message,
      severity: input.severity ?? 'info',
      channels: input.channels,
      created_at: new Date().toISOString(),
    };

    this.db
      .prepare(
        `
          INSERT INTO notification_events (
            id, source, event_key, title, message, severity, channels_json, created_at, read_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)
        `,
      )
      .run(
        event.id,
        event.source,
        event.event_key,
        event.title,
        event.message,
        event.severity,
        JSON.stringify(event.channels),
        event.created_at,
      );

    return event;
  }

  listEvents(limit = 50, unreadOnly = false) {
    const rows = this.db
      .prepare(
        `
          SELECT id, source, event_key, title, message, severity, channels_json, created_at, read_at
          FROM notification_events
          ${unreadOnly ? 'WHERE read_at IS NULL' : ''}
          ORDER BY created_at DESC
          LIMIT ?
        `,
      )
      .all(limit) as NotificationRow[];

    return rows.map(formatEvent);
  }

  markRead(id: string) {
    this.db
      .prepare('UPDATE notification_events SET read_at = ? WHERE id = ?')
      .run(new Date().toISOString(), id);
  }

  markAllRead() {
    this.db
      .prepare('UPDATE notification_events SET read_at = ? WHERE read_at IS NULL')
      .run(new Date().toISOString());
  }
}

let store: NotificationsStore | null = null;

export function getNotificationsStore() {
  if (!store) {
    store = new NotificationsStore();
  }

  return store;
}

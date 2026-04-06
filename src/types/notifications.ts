export type NotificationChannel = 'browser' | 'ntfy' | 'smtp';
export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error';

export interface NotificationSettings {
  browser: {
    enabled: boolean;
  };
  ntfy: {
    enabled: boolean;
    server_url?: string;
    topic?: string;
    token?: string;
    username?: string;
    password?: string;
  };
  smtp: {
    enabled: boolean;
    host?: string;
    port?: number;
    secure?: boolean;
    username?: string;
    password?: string;
    from_email?: string;
    to_emails: string[];
  };
}

export interface NotificationEventRecord {
  id: string;
  source: string;
  event_key: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  channels: NotificationChannel[];
  created_at: string;
  read_at?: string;
}

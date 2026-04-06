export type NotificationChannel = 'browser' | 'ntfy' | 'smtp';
export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error';

export interface BrowserChannelSettings {
  enabled: boolean;
}

export interface NtfyChannelSettings {
  enabled: boolean;
  server_url?: string;
  topic?: string;
  token?: string;
  username?: string;
  password?: string;
}

export interface SmtpChannelSettings {
  enabled: boolean;
  host?: string;
  port?: number;
  secure?: boolean;
  username?: string;
  password?: string;
  from_email?: string;
  to_emails: string[];
}

export interface NotificationSettings {
  browser: BrowserChannelSettings;
  ntfy: NtfyChannelSettings;
  smtp: SmtpChannelSettings;
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

export interface EmitNotificationInput {
  source: string;
  event_key: string;
  title: string;
  message: string;
  severity?: NotificationSeverity;
  channels: NotificationChannel[];
}

export interface NotificationDeliveryResult {
  channel: NotificationChannel;
  attempted: boolean;
  success: boolean;
  detail?: string;
}

import nodemailer from 'nodemailer';
import { getNotificationsStore } from './store.js';
import type {
  EmitNotificationInput,
  NotificationDeliveryResult,
  NotificationSettings,
} from './types.js';

function normalizeNtfyServerUrl(serverUrl: string) {
  const trimmed = serverUrl.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

async function sendNtfy(settings: NotificationSettings, title: string, message: string, tags: string) {
  if (!settings.ntfy.enabled || !settings.ntfy.server_url || !settings.ntfy.topic) {
    return;
  }

  const serverUrl = normalizeNtfyServerUrl(settings.ntfy.server_url);
  const topic = settings.ntfy.topic.trim();
  const url = new URL(encodeURIComponent(topic), serverUrl.endsWith('/')
    ? serverUrl
    : `${serverUrl}/`);

  const headers: Record<string, string> = {
    Title: title,
    Tags: tags,
  };

  if (settings.ntfy.token) {
    headers.Authorization = `Bearer ${settings.ntfy.token}`;
  } else if (settings.ntfy.username && settings.ntfy.password) {
    headers.Authorization = `Basic ${Buffer.from(
      `${settings.ntfy.username}:${settings.ntfy.password}`,
    ).toString('base64')}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: message,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`ntfy delivery failed with status ${response.status}: ${body}`);
  }
}

async function sendSmtp(settings: NotificationSettings, title: string, message: string) {
  if (
    !settings.smtp.enabled ||
    !settings.smtp.host ||
    !settings.smtp.port ||
    !settings.smtp.username ||
    !settings.smtp.password ||
    !settings.smtp.from_email ||
    settings.smtp.to_emails.length === 0
  ) {
    return;
  }

  const transporter = nodemailer.createTransport({
    host: settings.smtp.host,
    port: settings.smtp.port,
    secure: settings.smtp.secure ?? settings.smtp.port === 465,
    auth: {
      user: settings.smtp.username,
      pass: settings.smtp.password,
    },
  });

  await transporter.sendMail({
    from: settings.smtp.from_email,
    to: settings.smtp.to_emails.join(', '),
    subject: title,
    text: message,
  });
}

export async function emitNotification(input: EmitNotificationInput) {
  const store = getNotificationsStore();
  const settings = store.getSettings();
  const enabledChannels = input.channels.filter((channel) => {
    if (channel === 'browser') return settings.browser.enabled;
    if (channel === 'ntfy') return settings.ntfy.enabled;
    if (channel === 'smtp') return settings.smtp.enabled;
    return false;
  });

  const event = store.createEvent({ ...input, channels: enabledChannels });
  const tags = `${input.source},${input.severity ?? 'info'}`;

  const channelResults: NotificationDeliveryResult[] = [];

  if (enabledChannels.includes('ntfy')) {
    try {
      await sendNtfy(settings, input.title, input.message, tags);
      channelResults.push({ channel: 'ntfy', attempted: true, success: true });
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unknown ntfy error';
      channelResults.push({ channel: 'ntfy', attempted: true, success: false, detail });
      console.error('ntfy notification delivery failed:', detail);
    }
  } else {
    channelResults.push({ channel: 'ntfy', attempted: false, success: false, detail: 'Channel disabled or not requested' });
  }

  if (enabledChannels.includes('smtp')) {
    try {
      await sendSmtp(settings, input.title, input.message);
      channelResults.push({ channel: 'smtp', attempted: true, success: true });
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unknown SMTP error';
      channelResults.push({ channel: 'smtp', attempted: true, success: false, detail });
      console.error('SMTP notification delivery failed:', detail);
    }
  } else {
    channelResults.push({ channel: 'smtp', attempted: false, success: false, detail: 'Channel disabled or not requested' });
  }

  channelResults.push({
    channel: 'browser',
    attempted: enabledChannels.includes('browser'),
    success: enabledChannels.includes('browser'),
    detail: enabledChannels.includes('browser')
      ? 'Stored for in-app feed and browser push polling'
      : 'Channel disabled or not requested',
  });

  return { event, channelResults };
}

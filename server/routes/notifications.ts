import { Router } from 'express';
import { emitNotification } from '../notifications/service.js';
import { getNotificationsStore } from '../notifications/store.js';
import type { NotificationSettings } from '../notifications/types.js';

const router = Router();

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseSettings(body: unknown): NotificationSettings {
  if (!isObject(body) || !isObject(body.browser) || !isObject(body.ntfy) || !isObject(body.smtp)) {
    throw new Error('Invalid settings payload');
  }

  return {
    browser: {
      enabled: Boolean(body.browser.enabled),
    },
    ntfy: {
      enabled: Boolean(body.ntfy.enabled),
      server_url: typeof body.ntfy.server_url === 'string' ? body.ntfy.server_url : undefined,
      topic: typeof body.ntfy.topic === 'string' ? body.ntfy.topic : undefined,
      token: typeof body.ntfy.token === 'string' ? body.ntfy.token : undefined,
      username: typeof body.ntfy.username === 'string' ? body.ntfy.username : undefined,
      password: typeof body.ntfy.password === 'string' ? body.ntfy.password : undefined,
    },
    smtp: {
      enabled: Boolean(body.smtp.enabled),
      host: typeof body.smtp.host === 'string' ? body.smtp.host : undefined,
      port: body.smtp.port === undefined || body.smtp.port === null ? undefined : Number(body.smtp.port),
      secure: body.smtp.secure === undefined ? undefined : Boolean(body.smtp.secure),
      username: typeof body.smtp.username === 'string' ? body.smtp.username : undefined,
      password: typeof body.smtp.password === 'string' ? body.smtp.password : undefined,
      from_email: typeof body.smtp.from_email === 'string' ? body.smtp.from_email : undefined,
      to_emails: Array.isArray(body.smtp.to_emails)
        ? body.smtp.to_emails.filter((value): value is string => typeof value === 'string')
        : [],
    },
  };
}

router.get('/settings', (_req, res) => {
  res.json({ settings: getNotificationsStore().getPublicSettings() });
});

router.put('/settings', (req, res) => {
  try {
    const settings = parseSettings(req.body);
    res.json({ settings: getNotificationsStore().saveSettings(settings) });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid settings' });
  }
});

router.get('/events', (req, res) => {
  const limit = Number(req.query.limit ?? 20);
  const unreadOnly = req.query.unread === 'true';
  res.json({ events: getNotificationsStore().listEvents(limit, unreadOnly) });
});

router.post('/events/:id/read', (req, res) => {
  getNotificationsStore().markRead(req.params.id);
  res.status(204).send();
});

router.post('/events/read-all', (_req, res) => {
  getNotificationsStore().markAllRead();
  res.status(204).send();
});

router.post('/test', async (_req, res) => {
  const result = await emitNotification({
    source: 'app',
    event_key: 'notification_test',
    title: 'Shost notification test',
    message: 'Test event delivered through the configured app-wide notification channels.',
    severity: 'info',
    channels: ['browser', 'ntfy', 'smtp'],
  });

  const failedChannels = result.channelResults.filter((channel) => channel.attempted && !channel.success);
  res.status(failedChannels.length > 0 ? 207 : 202).json(result);
});

export { router as notificationsRouter };

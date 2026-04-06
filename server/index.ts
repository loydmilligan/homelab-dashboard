/**
 * Homelab Dashboard Backend
 *
 * Collects real metrics from:
 * - Local system (CPU, RAM, temp, disk)
 * - Docker containers
 * - Remote hosts (CM4)
 * - Service health checks
 */

import express from 'express';
import cors from 'cors';
import Docker from 'dockerode';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { load, dump } from 'js-yaml';
import { collectState } from './collectors/index.js';
import { fetchHostMetrics } from './collectors/remote-host.js';
import { notificationsRouter } from './routes/notifications.js';
import { servicesRouter } from './routes/services.js';
import { shotsRouter } from './routes/shots.js';
import { getShotsScheduler } from './shots/scheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const INVENTORY_DIR = join(__dirname, '..', 'inventory');

const PORT = process.env.PORT || 3090;
const docker = new Docker({ socketPath: '/var/run/docker.sock' });
const CM4_EXPORTER_URL = process.env.CM4_EXPORTER_URL ?? 'http://192.168.6.38:9100/metrics';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/backups', shotsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/services', servicesRouter);

// Serve current state
app.get('/api/state', async (_req, res) => {
  try {
    const state = await collectState();
    res.json(state);
  } catch (error) {
    console.error('Error collecting state:', error);
    res.status(500).json({ error: 'Failed to collect state' });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

function decodeDockerLogBuffer(logs: Buffer) {
  return logs
    .toString('utf8')
    .split('\n')
    .map((line) => line.slice(8))
    .join('\n');
}

// Container actions
app.post('/api/containers/:name/restart', async (req, res) => {
  const { name } = req.params;
  try {
    const containers = await docker.listContainers({ all: true });
    const target = containers.find(c =>
      c.Names.some(n => n.replace(/^\//, '') === name)
    );
    if (!target) {
      return res.status(404).json({ error: 'Container not found' });
    }
    const container = docker.getContainer(target.Id);
    await container.restart();
    res.json({ success: true, message: `Container ${name} restarted` });
  } catch (error) {
    console.error(`Error restarting container ${name}:`, error);
    res.status(500).json({ error: 'Failed to restart container' });
  }
});

app.post('/api/containers/:name/stop', async (req, res) => {
  const { name } = req.params;
  try {
    const containers = await docker.listContainers({ all: true });
    const target = containers.find(c =>
      c.Names.some(n => n.replace(/^\//, '') === name)
    );
    if (!target) {
      return res.status(404).json({ error: 'Container not found' });
    }
    const container = docker.getContainer(target.Id);
    await container.stop();
    res.json({ success: true, message: `Container ${name} stopped` });
  } catch (error) {
    console.error(`Error stopping container ${name}:`, error);
    res.status(500).json({ error: 'Failed to stop container' });
  }
});

app.post('/api/containers/:name/start', async (req, res) => {
  const { name } = req.params;
  try {
    const containers = await docker.listContainers({ all: true });
    const target = containers.find(c =>
      c.Names.some(n => n.replace(/^\//, '') === name)
    );
    if (!target) {
      return res.status(404).json({ error: 'Container not found' });
    }
    const container = docker.getContainer(target.Id);
    await container.start();
    res.json({ success: true, message: `Container ${name} started` });
  } catch (error) {
    console.error(`Error starting container ${name}:`, error);
    res.status(500).json({ error: 'Failed to start container' });
  }
});

// Get container logs
app.get('/api/containers/:name/logs', async (req, res) => {
  const { name } = req.params;
  const tail = parseInt(req.query.tail as string) || 100;
  try {
    const containers = await docker.listContainers({ all: true });
    const target = containers.find(c =>
      c.Names.some(n => n.replace(/^\//, '') === name)
    );
    if (!target) {
      return res.status(404).json({ error: 'Container not found' });
    }
    const container = docker.getContainer(target.Id);
    const logs = await container.logs({
      stdout: true,
      stderr: true,
      tail,
      timestamps: true,
    });
    const logText = decodeDockerLogBuffer(logs);
    res.json({ logs: logText });
  } catch (error) {
    console.error(`Error getting logs for ${name}:`, error);
    res.status(500).json({ error: 'Failed to get container logs' });
  }
});

app.get('/api/services/:id/logs', async (req, res) => {
  const { id } = req.params;
  const tail = parseInt(req.query.tail as string) || 100;

  try {
    const state = await collectState();
    const service = state.services.find((entry) => entry.id === id);

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    if (!service.container_name) {
      return res.status(409).json({ error: 'Service does not expose container logs' });
    }

    if (service.host_id === 'cm4') {
      const remote = await fetchHostMetrics(CM4_EXPORTER_URL);
      if (!remote) {
        return res.status(502).json({ error: 'Failed to reach CM4 exporter' });
      }

      const logs = remote.logs?.[service.container_name];
      if (typeof logs !== 'string') {
        return res.status(404).json({ error: 'Remote container logs not available' });
      }

      const logLines = logs.split('\n').filter(Boolean);
      res.json({ logs: logLines.slice(-tail).join('\n') });
      return;
    }

    const containers = await docker.listContainers({ all: true });
    const target = containers.find((container) =>
      container.Names.some((name) => name.replace(/^\//, '') === service.container_name)
    );

    if (!target) {
      return res.status(404).json({ error: 'Container not found' });
    }

    const container = docker.getContainer(target.Id);
    const logs = await container.logs({
      stdout: true,
      stderr: true,
      tail,
      timestamps: true,
    });

    res.json({ logs: decodeDockerLogBuffer(logs) });
  } catch (error) {
    console.error(`Error getting logs for service ${id}:`, error);
    res.status(500).json({ error: 'Failed to get service logs' });
  }
});

// Update host metadata
app.patch('/api/hosts/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const hostsPath = join(INVENTORY_DIR, 'hosts.yaml');
    const content = readFileSync(hostsPath, 'utf-8');
    const data = load(content) as { hosts: Array<Record<string, unknown>> };

    const hostIndex = data.hosts.findIndex((h) => h.id === id);
    if (hostIndex === -1) {
      return res.status(404).json({ error: 'Host not found' });
    }

    // Apply updates
    if (updates.name !== undefined) {
      data.hosts[hostIndex].name = updates.name;
    }
    if (updates.tags !== undefined) {
      data.hosts[hostIndex].tags = updates.tags;
    }
    if (updates.links !== undefined) {
      data.hosts[hostIndex].links = updates.links;
    }

    // Write back to file
    const yamlContent = dump(data, { lineWidth: -1 });
    writeFileSync(hostsPath, `# Homelab Hosts Inventory\n# Edit this file to add/modify hosts\n\n${yamlContent}`);

    res.json({ success: true, host: data.hosts[hostIndex] });
  } catch (error) {
    console.error(`Error updating host ${id}:`, error);
    res.status(500).json({ error: 'Failed to update host' });
  }
});

app.listen(PORT, () => {
  console.log(`Dashboard backend running on http://localhost:${PORT}`);
  console.log(`  GET   /api/state - Full state with metrics`);
  console.log(`  GET   /api/health - Health check`);
  console.log(`  GET   /api/services/:id/logs - Get service logs (local or remote)`);
  console.log(`  PATCH /api/hosts/:id - Update host metadata`);
  console.log(`  POST  /api/containers/:name/restart - Restart container`);
  console.log(`  POST  /api/containers/:name/stop - Stop container`);
  console.log(`  POST  /api/containers/:name/start - Start container`);
  console.log(`  GET   /api/containers/:name/logs - Get container logs`);
});

getShotsScheduler().start();

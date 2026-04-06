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
import { notificationsRouter } from './routes/notifications.js';
import { shotsRouter } from './routes/shots.js';
import { getShotsScheduler } from './shots/scheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const INVENTORY_DIR = join(__dirname, '..', 'inventory');

const PORT = process.env.PORT || 3090;
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/backups', shotsRouter);
app.use('/api/notifications', notificationsRouter);

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
    // Parse docker logs format (remove header bytes)
    const logText = logs.toString('utf8')
      .split('\n')
      .map(line => line.slice(8)) // Remove 8-byte header
      .join('\n');
    res.json({ logs: logText });
  } catch (error) {
    console.error(`Error getting logs for ${name}:`, error);
    res.status(500).json({ error: 'Failed to get container logs' });
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
  console.log(`  PATCH /api/hosts/:id - Update host metadata`);
  console.log(`  POST  /api/containers/:name/restart - Restart container`);
  console.log(`  POST  /api/containers/:name/stop - Stop container`);
  console.log(`  POST  /api/containers/:name/start - Start container`);
  console.log(`  GET   /api/containers/:name/logs - Get container logs`);
});

getShotsScheduler().start();

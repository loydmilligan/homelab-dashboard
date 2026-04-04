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
import { collectState } from './collectors/index.js';

const PORT = process.env.PORT || 3090;

const app = express();
app.use(cors());

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

app.listen(PORT, () => {
  console.log(`Dashboard backend running on http://localhost:${PORT}`);
  console.log(`  GET /api/state - Full state with metrics`);
  console.log(`  GET /api/health - Health check`);
});

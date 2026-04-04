# Quickstart Guide

**Document Version:** 1.0.0
**Last Updated:** 2026-04-04

## Prerequisites

- Node.js 20+
- Docker and Docker Compose
- Git

## Local Development

```bash
# Clone repository
git clone https://github.com/loydmilligan/homelab-dashboard.git
cd homelab-dashboard

# Install dependencies
npm install

# Start backend (terminal 1)
npm run server

# Start frontend dev server (terminal 2)
npm run dev

# Open http://localhost:3088
```

## Production Deployment

```bash
# Build and deploy
npm run build
docker compose up -d --build

# Verify
curl http://localhost:3088/api/health
```

## Deploy CM4 Exporter

```bash
# Copy to CM4
scp -r agent/ mmariani@192.168.6.38:~/cm4-exporter/

# SSH and start
ssh mmariani@192.168.6.38
cd ~/cm4-exporter/agent
EXPORTER_VERSION=$(git rev-parse --short HEAD) docker compose up -d --build
```

## Configuration

Edit YAML files in `inventory/`:
- `hosts.yaml` - Servers and devices
- `services.yaml` - Running services
- `network.yaml` - Network devices
- `iot.yaml` - IoT hubs and devices
- `backups.yaml` - Backup status

## Accessing Externally

Configure Cloudflare tunnel to point to `192.168.4.217:3088`

Add hostname to `vite.config.ts`:
```ts
allowedHosts: ['yourdomain.com']
```

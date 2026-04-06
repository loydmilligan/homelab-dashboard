# Deployment Guide

**Document Version:** 1.0.0
**Last Updated:** 2026-04-04

## Overview

There are two deployment types:
1. **Main Dashboard** - Frontend + Backend + laptop exporter on laptop
2. **Host Exporters** - Metrics agents on remote hosts (CM4, etc.)

---

## Main Dashboard Deployment

### When Required
- Any change to `src/`, `server/`, `inventory/`, `vite.config.ts`
- Dependency updates (`package.json`)
- Configuration changes

### Prerequisites
- Docker and Docker Compose installed
- Port 3088 available
- Git repository up to date

### Step-by-Step Process

```bash
# 1. Navigate to project
cd ~/Projects/homelab-dashboard

# 2. Pull latest changes (if working with remote)
git pull

# 3. Build frontend (generates build number)
npm run build

# 4. Deploy with Docker Compose
docker compose up -d --build

# 5. Restart frontend to pick up new static files and refresh backend DNS
docker compose restart frontend

# 6. Get build number for verification
git rev-parse --short HEAD
```

### Post-Deployment Verification
1. Open dashboard URL (http://localhost:3088 or shost.mattmariani.com)
2. Check footer for build number (format: `B000001`)
3. Verify API is responding: `curl http://localhost:3088/api/health`
4. Verify laptop exporter is responding: `curl http://localhost:9101/health`
5. **Report build number in chat for testing confirmation**

### Rollback
```bash
git checkout <previous-commit>
npm run build
docker compose up -d --build
docker compose restart frontend
```

---

## Host Exporter Deployment (CM4, etc.)

### When Required
- Changes to `agent/exporter.py`
- Changes to `agent/Dockerfile` or `agent/docker-compose.yml`
- Adding new metrics or fixing parsing issues

### Prerequisites
- SSH access to target host (e.g., `mmariani@192.168.6.38`)
- Docker installed on target host

### Step-by-Step Process

```bash
# 1. Navigate to project
cd ~/Projects/homelab-dashboard

# 2. Get exporter version (use git commit)
EXPORTER_VERSION=$(git rev-parse --short HEAD)
echo "Deploying exporter version: $EXPORTER_VERSION"

# 3. Copy agent files to remote host
scp -r agent/ mmariani@192.168.6.38:~/cm4-exporter/

# 4. SSH to remote host and deploy
ssh mmariani@192.168.6.38 << 'EOF'
cd ~/cm4-exporter/agent
docker compose down
docker compose up -d --build
docker compose logs --tail 20
EOF

# 5. Verify exporter is running
curl http://192.168.6.38:9100/health
```

### Post-Deployment Verification
1. Check exporter health: `curl http://192.168.6.38:9100/health`
2. Check shots runner health: `curl http://192.168.6.38:9100/shots/health`
3. Verify the CM4 `.env` includes `SHOTS_RUNNER_TOKEN` and `SHOTS_DEST_HOST_PATH`
4. Verify the dashboard backend environment includes matching `CM4_SHOTS_RUNNER_TOKEN`
5. Check metrics: `curl http://192.168.6.38:9100/metrics | head -20`
6. Verify in dashboard - host should show updated metrics
7. Check tooltip on host card for exporter version

### Adding New Hosts
1. Copy `agent/` directory to new host
2. Add a collector URL for the new host in the backend collector
3. Add host to `inventory/hosts.yaml`
4. Redeploy main dashboard

---

## Build Number Format

- **Dashboard:** sequential ID like `B000406`
- **Exporter:** `<git-short-hash>` (shown in host tooltip)

---

## Troubleshooting

### Dashboard not updating
```bash
docker compose down
docker compose up -d --build
```

### Exporter not responding
```bash
ssh mmariani@192.168.6.38 "cd ~/cm4-exporter/agent && docker compose logs"
```

### API errors
```bash
docker logs homelab-backend
```

# Architecture

**Document Version:** 1.0.0
**Last Updated:** 2026-04-04

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Laptop                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   nginx     │  │   Backend   │  │   Docker Daemon     │  │
│  │  (frontend) │──│   (API)     │──│   (containers)      │  │
│  │   :3088     │  │   :3090     │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
          │                 │
          │                 │ HTTP polling
          ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                         CM4                                  │
│  ┌─────────────────────┐  ┌─────────────────────────────┐   │
│  │   cm4-exporter      │  │   Docker containers         │   │
│  │   :9100             │  │   (HA, Z2M, etc.)          │   │
│  └─────────────────────┘  └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Components

### Frontend (nginx container)
- **Tech:** React + TypeScript + Tailwind CSS
- **Build:** Vite
- **Port:** 3088
- **Serves:** Static files from `/dist`
- **Proxy:** `/api/*` → backend:3090

### Backend (Node.js container)
- **Tech:** Express + TypeScript
- **Port:** 3090 (internal)
- **Responsibilities:**
  - Collect local system metrics (systeminformation)
  - Query Docker for container status
  - Fetch remote host metrics (CM4 exporter)
  - Run HTTP health checks on services
  - Serve merged state as JSON

### CM4 Exporter (Python container)
- **Tech:** Python 3 + http.server
- **Port:** 9100
- **Responsibilities:**
  - System metrics (CPU, RAM, disk, temp)
  - Docker container status
  - Container logs (last 100 lines each)
  - Cached responses (60s)

## Data Flow

1. **Frontend** polls `/api/state` every 30 seconds
2. **Backend** collects:
   - Local metrics via systeminformation
   - Docker containers via Docker socket
   - CM4 metrics via HTTP to 192.168.6.38:9100
   - Service health via HTTP checks
3. **Backend** merges with YAML inventory
4. **Backend** returns unified JSON state
5. **Frontend** renders state

## File Structure

```
homelab-dashboard/
├── agent/                 # CM4 exporter
│   ├── exporter.py
│   ├── Dockerfile
│   └── docker-compose.yml
├── server/                # Backend API
│   ├── index.ts
│   └── collectors/
│       ├── local-metrics.ts
│       ├── docker.ts
│       ├── remote-host.ts
│       └── health-checks.ts
├── src/                   # Frontend
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   └── types/
├── inventory/             # YAML config
│   ├── hosts.yaml
│   ├── services.yaml
│   └── ...
├── docker-compose.yml     # Production deployment
├── Dockerfile.backend
└── nginx.conf
```

## Security Considerations

- Docker socket mounted read-only
- No authentication yet (internal network only)
- Cloudflare tunnel for external access
- No secrets in repository
- CORS enabled for local development

## Scaling

To add a new host:
1. Deploy exporter to new host
2. Add host to `inventory/hosts.yaml`
3. Add collector URL to `server/collectors/remote-host.ts`
4. Redeploy backend

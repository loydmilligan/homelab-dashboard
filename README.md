# Shost

A castable, at-a-glance homelab dashboard built to support a hardware downsizing migration from a larger Proxmox plus multi-Pi setup to a simpler CM4 plus laptop setup.

**Document Version:** 2.0.0

## Features

- **Live Metrics:** CPU, RAM, Disk, Temperature, Uptime
- **Multi-Host:** Monitor laptop and CM4 from single dashboard
- **Lower Overhead Goal:** Consolidate observability and control into one app instead of running a separate container for each tool
- **Castable:** Fullscreen wallboard mode for TV/Chromecast
- **Theme:** Dark/Light/System mode toggle
- **Docker:** Production deployment via Docker Compose

## Product Direction

Shost is a personal, pragmatic control surface for a resource-constrained homelab.

It is meant to replace or absorb jobs that would otherwise be spread across separate tools such as:
- Portainer
- Dozzle
- Uptime Kuma
- backup tooling
- Grafana

The priority is operational usefulness with low runtime overhead, not enterprise polish or public SaaS-grade security.

## Quick Start

```bash
# Install dependencies
npm install

# Development
npm run server &  # Start backend
npm run dev       # Start frontend

# Production
npm run build
docker compose up -d --build
```

Open http://localhost:3088

## Documentation

| Document | Description |
|----------|-------------|
| [QUICKSTART.md](docs/QUICKSTART.md) | Getting started guide |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deployment processes |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design |
| [ROADMAP.md](docs/ROADMAP.md) | Feature planning |
| [SHOTS_RUNNER_PLAN.md](docs/SHOTS_RUNNER_PLAN.md) | Host-side backup runner plan |
| [CHANGELOG.md](docs/CHANGELOG.md) | Version history |
| [CLAUDE.md](CLAUDE.md) | AI coding instructions |

## Architecture

```
Laptop (192.168.4.217)          CM4 (192.168.6.38)
┌─────────────────────┐         ┌─────────────────┐
│ nginx    :3088      │         │ exporter :9100  │
│ backend  :3090      │◄────────│ Docker          │
│ exporter :9101      │         │ HA, Z2M, etc.   │
│ Docker              │         │                 │
└─────────────────────┘         └─────────────────┘
```

## Screens

| Route | Status |
|-------|--------|
| `/` | Overview (MVP) |
| `/hosts` | **Live** - Metrics + Exporter info |
| `/wapps` | **Live** - Services, containers, health, and links |
| `/works` | **Live** - Network devices and access paths |
| `/yots` | **Live** - IoT hubs, devices, and battery signals |
| `/stows` | **Live** - Storage surfaces and cleanup cues |
| `/shots` | **Live** - Backup jobs, manual runs, retention, and notifications |
| `/tracs` | **Live** - Container logs and traces |
| `/crets` | Inventory-backed - Secret metadata and rotation cues |
| `/settings` | **Live** - Theme toggle |
| `/wallboard` | **Live** - TV mode |

## Naming Guide

Shost uses branded IA names in the UI while keeping technical internals descriptive in code and data models.

| Brand | Meaning |
|-------|---------|
| `Wapps` | Services, containers, health checks, and links |
| `Works` | Network devices, access paths, and reachability |
| `Yots` | IoT hubs, devices, battery state, and presence |
| `Stows` | Storage, shares, and cleanup opportunities |
| `Shots` | Backups, snapshots, and retention |
| `Tracs` | Logs and runtime traces |
| `Crets` | Secret inventory and rotation metadata |

## External Access

Dashboard accessible via Cloudflare tunnel at `shost.mattmariani.com`

## License

Private

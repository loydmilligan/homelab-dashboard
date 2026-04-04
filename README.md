# Homelab Dashboard

A castable, at-a-glance monitoring dashboard for homelab infrastructure.

**Document Version:** 1.0.0

## Features

- **Live Metrics:** CPU, RAM, Disk, Temperature, Uptime
- **Multi-Host:** Monitor laptop and CM4 from single dashboard
- **Castable:** Fullscreen wallboard mode for TV/Chromecast
- **Theme:** Dark/Light/System mode toggle
- **Docker:** Production deployment via Docker Compose

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
| [CHANGELOG.md](docs/CHANGELOG.md) | Version history |
| [CLAUDE.md](CLAUDE.md) | AI coding instructions |

## Architecture

```
Laptop (192.168.4.217)          CM4 (192.168.6.38)
┌─────────────────────┐         ┌─────────────────┐
│ nginx    :3088      │         │ exporter :9100  │
│ backend  :3090      │◄────────│ Docker          │
│ Docker              │         │ HA, Z2M, etc.   │
└─────────────────────┘         └─────────────────┘
```

## Screens

| Route | Status |
|-------|--------|
| `/` | Overview (MVP) |
| `/hosts` | **Live** - Metrics + Exporter info |
| `/services` | Under Construction |
| `/network` | Under Construction |
| `/iot` | Under Construction |
| `/logs` | Under Construction |
| `/settings` | **Live** - Theme toggle |
| `/wallboard` | **Live** - TV mode |

## External Access

Dashboard accessible via Cloudflare tunnel at `shost.mattmariani.com`

## License

Private

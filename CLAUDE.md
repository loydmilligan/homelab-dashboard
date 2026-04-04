# Homelab Dashboard

A simple, castable, at-a-glance dashboard for homelab infrastructure.

## Quick Start

```bash
# Install dependencies
npm install

# Generate state.json from inventory
npm run generate

# Start dev server
npm run dev
# Open http://localhost:3080
```

## Project Structure

```
homelab-dashboard/
├── inventory/           # YAML inventory files (edit these)
│   ├── hosts.yaml
│   ├── services.yaml
│   ├── network.yaml
│   ├── iot.yaml
│   └── backups.yaml
├── public/
│   └── state.json       # Generated from inventory
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Route pages
│   ├── hooks/           # React hooks
│   ├── lib/             # Utilities
│   └── types/           # TypeScript types
├── scripts/
│   └── generate-state.ts
└── docker-compose.yml
```

## Key Concepts

### Inventory Files (YAML)
Source of truth for infrastructure metadata. Edit these to add hosts, services, devices.

### State (JSON)
Generated from inventory. The dashboard fetches this file and renders it.

### Polling
Dashboard polls `/state.json` every 30 seconds.

## Routes

| Route | Description |
|-------|-------------|
| `/` | Overview with stats |
| `/hosts` | Host cards with metrics |
| `/services` | Services grouped by host |
| `/network` | Network devices and access paths |
| `/iot` | IoT hubs and devices |
| `/wallboard` | Fullscreen TV/cast mode |

## Workflow

1. Edit inventory YAML files
2. Run `npm run generate` to update state.json
3. Dashboard auto-refreshes

## Production Deployment

```bash
# Build static files
npm run build

# Start with Docker
docker compose up -d
# Open http://localhost:3080
```

## Adding Live Data (Future)

The architecture supports adding live data sources. Create adapters that:
1. Fetch data from external APIs (Docker, Uptime Kuma, etc.)
2. Merge with inventory data
3. Write to state.json

The dashboard doesn't need to change - it just reads state.json.

## Design Principles

1. **Inventory-driven**: All infrastructure defined in YAML
2. **Static-first**: No backend required for basic operation
3. **Castable**: `/wallboard` route designed for TV display
4. **Extensible**: Clean separation between data and presentation

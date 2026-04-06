# Shost — Multi-Agent Coding Instructions

**Document Version:** 2.0.0
**Last Updated:** 2026-04-04

> This document is for Claude Code.
> It must stay aligned with `agents.md`.

## Alignment Rule

`CLAUDE.md` and `agents.md` are paired control documents.

When updating one of them:
- update the other in the same change
- keep section order and guidance aligned unless there is a tool-specific reason not to
- call out any intentional differences explicitly in both files
- treat drift between the two files as repo debt that should be fixed before moving on

Before closing work that changes either file, verify:
- both files were reviewed
- both files still describe the same workflow and project priorities
- any new policy added to one is reflected in the other

## Project Context

Shost is a personal homelab dashboard built during a hardware downsizing migration from a larger Proxmox plus multi-Pi setup to a simpler, more resource-constrained setup centered on a CM4 and a laptop.

The project exists to consolidate observability and control into one app so the homelab can run fewer off-the-shelf containers.

Shost is intended to replace or absorb responsibilities that would otherwise be handled by separate tools such as:
- Portainer
- Dozzle
- Uptime Kuma
- backup tooling
- Grafana

This project is intentionally pragmatic and personal:
- function is more important than polish
- local operability is more important than enterprise-grade hardening
- reducing container count, memory use, and CPU use is a primary product goal
- dashboards should help explain current resource usage and justify consolidation decisions

## Product Priorities

Prioritize work that supports the downsized homelab model:
- fewer always-on containers
- lower idle memory and CPU usage
- simpler deployment and maintenance
- visibility into host, container, service, and backup health
- replacing external dashboard/observability utilities with native Shost features where reasonable

When choosing between solutions, prefer:
1. fewer moving parts
2. lower runtime overhead
3. directness and maintainability
4. acceptable UX over perfect architecture

Avoid adding heavyweight dependencies or whole subsystems unless they clearly reduce overall homelab complexity.

## Security Posture

This is a personal, mostly local project.

Security still matters, but the expected posture is intentionally lighter than for public or multi-tenant software:
- authentication is not a near-term priority
- local-network assumptions are acceptable
- rough edges are acceptable if the tool is effective and understandable
- do not introduce unnecessary auth, RBAC, or enterprise security ceremony unless explicitly requested

Still maintain basic hygiene:
- do not commit secrets
- keep Docker socket mounts read-only where possible
- avoid obviously unsafe defaults that create needless risk

## UI and UX Guidance

Function comes first, but the UI should still feel intentional and informative.

The preferred visual direction includes:
- strong use of color to signal state and guide attention
- depth, shadows, contrast, and layered surfaces
- shiny, shimmering, or highlighted treatments when they help explain next steps
- interfaces that make it obvious what matters now and what a user should do next

Do not optimize for minimalism if it hides meaning.
Do not add visual flourish that obscures information density or system status.

## Tech Stack

- Frontend: React + TypeScript + Tailwind CSS + Vite
- Backend: Express + TypeScript
- Exporters: Python
- Deployment: Docker Compose

## Repository Structure

```text
homelab-dashboard/
├── agent/           # CM4 exporter (Python)
├── server/          # Backend API (TypeScript)
├── src/             # Frontend (React)
├── inventory/       # YAML configuration
├── docs/            # Documentation
├── shots/           # Companion backup workstream
├── agents.md
└── CLAUDE.md
```

## Key Files

- `server/collectors/index.ts` - Main state assembly
- `server/index.ts` - API routes and host/container actions
- `agent/exporter.py` - Remote host metrics exporter
- `src/App.tsx` - Current route map
- `src/components/Layout.tsx` - Main navigation
- `src/pages/Hosts.tsx` - Highest-signal implemented screen
- `inventory/*.yaml` - Source of truth for configured entities

## Working Style

Before adding new features:
- stabilize the repo
- reduce drift between docs and implementation
- prefer getting to a known-good baseline over expanding scope

When making product or structural decisions:
- ask the user when the decision will materially affect information architecture, naming, data model direction, or migration scope
- otherwise make the smallest reasonable assumption and proceed

When cleaning up:
- remove stale routes, page names, and docs once replacements are confirmed
- distinguish clearly between live telemetry, inventory-backed data, and mock data
- prefer one clear path per concept instead of parallel experiments left in-tree

## Deployment Processes

### Main Dashboard Deployment

Use when changing `src/`, `server/`, `inventory/`, or app configuration.

```bash
cd ~/Projects/homelab-dashboard
npm run build
docker compose up -d --build
docker compose restart frontend
```

Post-deploy checks:
- verify footer build number
- verify `/api/health`
- verify key pages load

### Host Exporter Deployment

Use when changing `agent/`.

```bash
EXPORTER_VERSION=$(git rev-parse --short HEAD)
scp -r agent/ mmariani@192.168.6.38:~/cm4-exporter/
ssh mmariani@192.168.6.38 "cd ~/cm4-exporter/agent && EXPORTER_VERSION=$EXPORTER_VERSION docker compose up -d --build"
```

Post-deploy checks:
- verify exporter health on `:9100`
- verify CM4 metrics appear in the dashboard

## Versioning

### App Version
- format: `YYYYMMDDHHMM-<git-short-hash>`
- displayed in UI footer
- generated at build time in `vite.config.ts`

### Document Version
- format: `MAJOR.MINOR.PATCH`
- update when document guidance changes materially

### Exporter Version
- format: `<git-short-hash>`
- passed via `EXPORTER_VERSION`
- displayed in host tooltip

## Commit and Review Guidance

- commit format: `<type>: <description>`
- preferred types: `feat`, `fix`, `docs`, `refactor`, `chore`
- keep cleanup and feature work separate when practical
- if changing `agents.md` or `CLAUDE.md`, mention the alignment update in the commit message or summary

## Common Tasks

### Add New Host
1. Add to `inventory/hosts.yaml`
2. Deploy exporter to host if it is remotely monitored
3. Add collector URL to `server/collectors/remote-host.ts` if needed
4. Verify state in dashboard

### Add New Service
1. Add to `inventory/services.yaml`
2. Confirm container matching and health check behavior
3. Verify it appears correctly in UI

### Stabilize Repo Before New Phase
1. Reconcile docs with implementation
2. Normalize route and page naming
3. Remove stale files and placeholders that are no longer canonical
4. Verify build, lint, and smoke checks
5. Commit a known-good baseline

## SSH Access

- CM4: `mmariani@192.168.6.38`
- Laptop: local runtime

## Ports

| Service | Port |
|---------|------|
| Dashboard (nginx) | 3088 |
| Backend API | 3090 |
| CM4 Exporter | 9100 |

## Verification Checklist

After meaningful changes:
- [ ] `CLAUDE.md` and `agents.md` still match in intent and workflow
- [ ] `npm run build` passes
- [ ] `npm run lint` passes if the changed area is covered
- [ ] `/api/health` responds
- [ ] key routes load without obvious errors
- [ ] docs reflect the real current product state

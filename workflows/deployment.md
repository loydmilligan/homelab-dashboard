# Deployment Workflow

**Document Version:** 2.0.0
**Last Updated:** 2026-04-06

This workflow is the active source of truth for deploying Shost.

## Scope

There are two deployment paths:

1. Main dashboard deployment
2. Host exporter deployment

## Development Mode

Use development mode for frontend and backend iteration.

```bash
npm run dev
npm run server
```

If both are needed together, use:

```bash
npm run dev:all
```

## Production Mode

Use production mode when validating deployable changes or updating the live stack.

```bash
npm run build
docker compose up -d --build
docker compose restart frontend
```

## Main Dashboard Deployment

Run this when changing `src/`, `server/`, `inventory/`, `vite.config.ts`, `package.json`, or app configuration.

```bash
cd ~/Projects/homelab-dashboard
npm run build
docker compose up -d --build
docker compose restart frontend
```

Post-deploy checks:

- verify the footer build number changed
- verify `curl http://localhost:3088/api/health`
- verify key routes load
- run the relevant checks from `workflows/testing-and-verification.md`

## Host Exporter Deployment

Run this when changing `agent/`.

```bash
cd ~/Projects/homelab-dashboard
EXPORTER_VERSION=$(git rev-parse --short HEAD)
scp -r agent/ mmariani@192.168.6.38:~/cm4-exporter/
ssh mmariani@192.168.6.38 "cd ~/cm4-exporter/agent && EXPORTER_VERSION=$EXPORTER_VERSION docker compose up -d --build"
```

Post-deploy checks:

- verify exporter health on `:9100`
- verify Shots runner health when relevant
- verify CM4 metrics appear in the dashboard

## Rollback

Use the smallest rollback needed.

```bash
git checkout <previous-commit>
npm run build
docker compose up -d --build
docker compose restart frontend
```

If only the exporter changed, redeploy the previous exporter revision instead of rolling back the whole dashboard.

## Notes

- Deployment steps belong here, not in roadmap or planning docs.
- If the real deployment procedure changes, update this file and the AI control docs in the same change.

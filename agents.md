# Homelab Dashboard — AI Agent Instructions

**Document Version:** 1.0.0
**Last Updated:** 2026-04-04

> This document is for non-Claude AI coding agents. It mirrors CLAUDE.md.

## Project Overview

Homelab Dashboard is a castable, at-a-glance monitoring dashboard for homelab infrastructure.

**Tech Stack:**
- Frontend: React + TypeScript + Tailwind CSS + Vite
- Backend: Express + TypeScript
- Exporters: Python
- Deployment: Docker Compose

## Repository Structure

```
homelab-dashboard/
├── agent/           # CM4 exporter (Python)
├── server/          # Backend API (TypeScript)
├── src/             # Frontend (React)
├── inventory/       # YAML configuration
├── docs/            # Documentation
└── docker-compose.yml
```

## Key Files

- `server/collectors/index.ts` - Main data collection
- `src/pages/Hosts.tsx` - Hosts display
- `inventory/hosts.yaml` - Host definitions
- `agent/exporter.py` - Remote host metrics

---

## Deployment Processes

### Main Dashboard Deployment

**When Required:** Changes to `src/`, `server/`, `inventory/`, config files

```bash
cd ~/Projects/homelab-dashboard
npm run build
docker compose up -d --build
docker compose restart frontend
```

**Post-deploy:** Report build number (`git rev-parse --short HEAD`) in chat.

### Host Exporter Deployment

**When Required:** Changes to `agent/`

```bash
EXPORTER_VERSION=$(git rev-parse --short HEAD)
scp -r agent/ mmariani@192.168.6.38:~/cm4-exporter/
ssh mmariani@192.168.6.38 "cd ~/cm4-exporter/agent && EXPORTER_VERSION=$EXPORTER_VERSION docker compose up -d --build"
```

---

## Versioning

### App Version
- Format: `YYYYMMDDHHMM-<git-short-hash>`
- Displayed in UI footer
- Generated at build time in `vite.config.ts`

### Document Version
- Format: `MAJOR.MINOR.PATCH`
- Include at top of each document
- Update when document content changes

### Exporter Version
- Format: `<git-short-hash>`
- Passed via `EXPORTER_VERSION` env var
- Displayed in host tooltip

---

## Security Processes

### Pre-Commit Security Review

Before committing, verify:

1. **No secrets in code:**
   ```bash
   git diff --cached | grep -iE "(password|secret|api_key|token)"
   ```

2. **No sensitive files staged:**
   ```bash
   git status | grep -E "\.(env|pem|key|credentials)"
   ```

3. **Docker socket is read-only:**
   Check all docker-compose files use `:ro` for socket mounts

4. **No hardcoded IPs/credentials:**
   Review any new configuration files

### Security Considerations

- Docker socket mounted read-only in all containers
- No authentication implemented yet (internal network only)
- Cloudflare tunnel provides external access control
- Inventory files contain IPs but no credentials
- Exporter runs in container with limited access

### Files to Never Commit

- `.env` files with secrets
- `*.pem`, `*.key` files
- `credentials.json`
- API keys or tokens

---

## Coding Standards

### TypeScript
- Use strict mode
- Define interfaces for all data structures
- Use `type` for unions, `interface` for objects

### React
- Functional components only
- Use hooks for state/effects
- Keep components under 200 lines

### Commits
- Format: `<type>: <description>`
- Types: feat, fix, docs, refactor, chore

---

## Common Tasks

### Add New Host

1. Add to `inventory/hosts.yaml`
2. Deploy exporter to host
3. Add URL to `server/collectors/remote-host.ts`
4. Redeploy backend

### Add New Service

1. Add to `inventory/services.yaml`
2. Redeploy backend (for health checks)

### Fix Exporter Parsing

1. Edit `agent/exporter.py`
2. Redeploy to affected host
3. Verify in dashboard

---

## SSH Access

- **CM4:** `mmariani@192.168.6.38`
- **Laptop:** Local (192.168.4.217)

---

## Ports

| Service | Port |
|---------|------|
| Dashboard (nginx) | 3088 |
| Backend API | 3090 (internal) |
| CM4 Exporter | 9100 |

---

## Testing Checklist

After deployment:
- [ ] Build number updated in footer
- [ ] API health check passes
- [ ] Hosts show live metrics
- [ ] Exporter tooltip shows version
- [ ] No console errors

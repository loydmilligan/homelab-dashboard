# Shost — Multi-Agent Coding Instructions

**Document Version:** 2.1.0
**Last Updated:** 2026-04-06

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

### Repo Surface Rules

- active operational workflows live in `workflows/`
- prioritization and roadmap material lives in `docs/prio/`
- retained historical material lives in `ARCHIVE/`
- removed or pending-deletion material lives in `TRASH/`

Use this rule to decide whether a process gets its own file:
- if the process is recurring, cross-file, or requires verification/ownership/hand-off steps, give it a dedicated file in `workflows/`
- if the guidance is short repo policy or agent behavior, keep it in `CLAUDE.md` and `agents.md`

Do not treat `docs/prio/` items as the active execution source of truth without first confirming they are still current.

When a cleanup move is made:
- update references in README and control docs
- leave a short explanation in the destination area if the move would otherwise be confusing
- prefer moving inactive material into `ARCHIVE/` or `TRASH/` instead of leaving ambiguous duplicates in active folders

## Deployment Processes

See [workflows/deployment.md](/home/loydmilligan/Projects/homelab-dashboard/workflows/deployment.md).

## Versioning

### App Version
- format: `YYYYMMDDHHMM-<git-short-hash>`
- displayed in UI footer
- generated at build time in `vite.config.ts`

### Document Version
- format: `MAJOR.MINOR.PATCH`
- use `PATCH` for minor doc/process clarifications
- use `MINOR` for meaningful process or policy changes
- use `MAJOR` only when the document's governance or intent changes substantially
- update `Last Updated` when a process-bearing document changes materially
- follow `workflows/versioning-and-changelog.md` for repo-wide rules

### Exporter Version
- format: `<git-short-hash>`
- passed via `EXPORTER_VERSION`
- displayed in host tooltip

### Repo Changelog
- `docs/CHANGELOG.md` must keep an `Unreleased` section for working tree and not-yet-committed changes
- dated release sections are only for committed repo states
- do not present an uncommitted cleanup or doc pass as a released version
- when a change materially affects product behavior, repo workflows, or active repo structure, decide whether it belongs in the changelog before closing the task

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
4. Run the verification workflow in `workflows/testing-and-verification.md`
5. Update document versions and `docs/CHANGELOG.md` using `workflows/versioning-and-changelog.md`
6. Commit a known-good baseline

### Update Documentation
1. Update the active doc content
2. Update `Document Version` and `Last Updated` using `workflows/versioning-and-changelog.md`
3. Update `README.md`, `CLAUDE.md`, and `agents.md` if document locations or operating rules changed
4. Move superseded material to `ARCHIVE/` or `TRASH/` instead of leaving duplicate active copies

### Update Changelog
1. Add in-progress changes to `docs/CHANGELOG.md` under `Unreleased`
2. Only create or extend a dated release section for a committed repo state
3. Keep changelog scope to user-visible behavior, important fixes, workflow changes, and meaningful repo-structure changes
4. Verify changelog claims match what is actually committed

### Process Review
1. Capture process friction with `/add_process_issue`
2. Review the queue in `workflows/process-issue-log.md`
3. Run the review loop in `workflows/process-review.md`
4. Update `CLAUDE.md`, `agents.md`, and any affected workflow files together

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
- [ ] the relevant workflow docs in `workflows/` still match how the repo is actually being operated
- [ ] document versions and `Last Updated` values were adjusted where required
- [ ] `docs/CHANGELOG.md` uses `Unreleased` for uncommitted work and does not claim a release that has not been committed
- [ ] `npm run build` passes
- [ ] `npm run lint` passes if the changed area is covered
- [ ] `/api/health` responds
- [ ] key routes load without obvious errors
- [ ] docs reflect the real current product state

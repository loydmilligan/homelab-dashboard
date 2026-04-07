# Changelog

**Document Version:** 1.3.0
**Last Updated:** 2026-04-07

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Consolidated planning backlog in `docs/prio/CONSOLIDATED_BACKLOG.md`
- Canonical single roadmap doc covering remaining work across prior roadmap, phase-plan, runner-plan, and staged idea sources
- Archived superseded planning-source docs under `ARCHIVE/docs/prio/`
- Concrete Sprint 01 implementation plan for the Overview + Wallboard summary-surface initiative
- Shared summary derivation and reusable summary-surface components for Overview and Wallboard
- Notification readiness summary in `/api/state`
- Summary derivation tests via `npm test`
- Wapps CRUD support for service inventory changes
- Service down and recovery notifications
- Home Assistant, secrets, and MQTT thermal collectors
- Shots runtime store, scheduler, runs, retention, and notifications
- Shots page with backup job management UI
- Workflow docs for deployment, documentation management, testing, repo hygiene, and process review
- Process issue log and `/add_process_issue` command support for Claude

### Changed
- Refined Overview and Wallboard around the shared Sprint 01 summary surface with KPI strips, state indicators, provenance labeling, and improved smaller-width / cast-oriented layout
- Refreshed `docs/prio/CURRENT_STATE_INVENTORY.md` to match the current implemented product surface
- Rewrote `docs/prio/ROADMAP.md` to remove implemented features and restate partially implemented areas based on current reality
- Restructured `docs/prio/ROADMAP.md` into a metadata-backed backlog with effort estimates, benefit estimates, cross-cutting tags, and a draft 10-sprint plan
- Expanded `docs/prio/ROADMAP.md` to define an explicit Overview + Wallboard initiative with KPI, state-indicator, suggested-action, RSS, Chromecast, and external-controller roadmap items
- Moved roadmap and other planning material into `docs/prio/`
- Moved superseded design material into `ARCHIVE/`
- Moved dead legacy pages and other inactive files into `TRASH/`
- Clarified repo rules for active, archived, and trash surfaces in `README.md`, `CLAUDE.md`, and `agents.md`
- Updated host inventory naming toward `CM4`
- Cleaned up service inventory checks and removed runtime-only status fields from persisted inventory

### Fixed
- CM4 CPU sampling for exporter-backed metrics
- Thermal reader service to use the venv Python path
- Paho MQTT callback API compatibility
- Non-executable file permission normalization across the repo

## [0.1.0] - 2026-04-04

### Added
- Initial MVP release
- Hosts page with live metrics (CPU, RAM, Disk, Temp, Uptime)
- CM4 exporter agent for remote host metrics
- Settings page with dark/light/system theme toggle
- Overview page with summary stats
- Branded IA direction for Wapps, Works, Yots, Stows, Shots, Tracs, and Crets
- Docker Compose production deployment
- Cloudflare tunnel support (shost.mattmariani.com)
- Build number display in UI footer
- Exporter version tooltip on host cards
- YAML-based inventory system
- API backend with health checks
- Polling-based state updates (30s interval)

### Infrastructure
- Vite + React + TypeScript frontend
- Express backend with systeminformation
- Docker Compose with nginx + backend services
- CM4 Python exporter agent

### Documentation
- CLAUDE.md with build instructions
- DEPLOYMENT.md with deployment processes
- ROADMAP.md with feature planning
- ARCHITECTURE.md with system design

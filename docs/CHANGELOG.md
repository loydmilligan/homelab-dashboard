# Changelog

**Document Version:** 1.0.0

All notable changes to this project will be documented in this file.

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

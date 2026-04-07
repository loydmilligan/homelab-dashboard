# Shost — Roadmap

**Document Version:** 2.1.0
**Last Updated:** 2026-04-05

> Archived snapshot of the roadmap before it was rewritten into the canonical single roadmap on 2026-04-06.
> The active roadmap now lives in `docs/prio/ROADMAP.md`.

> See `PHASE-PLANS.md` for detailed implementation plans with branch workflow.

---

## MVP (Complete)
- [x] Hosts page with live metrics (CPU, RAM, Disk, Temp, Uptime)
- [x] CM4 exporter agent
- [x] Laptop exporter agent in main compose stack
- [x] Basic navigation and layout
- [x] Settings page with theme toggle
- [x] Cloudflare tunnel access
- [x] Build number in UI footer
- [x] Exporter version tooltip on hosts
- [x] Docker Compose production deployment

---

## Phase 0: Bug Fixes & Prep

### Known Issues
- [x] **CM4 CPU showing 0%** - Exporter CPU sampling corrected

### Navigation Prep
- [ ] Add Stows page placeholder (storage management)
- [ ] Add Shots page placeholder (backups - separate agent)

---

## Phase 1: Core Screens

### Hosts Enhancements
- [x] Detail modal for hosts with editing capability
- [x] Tags field for hosts (filtering, notifications routing)
- [x] RAM drilldown - top processes using memory
- [x] CPU drilldown - top processes using CPU
- [x] Disk drilldown - per-mount breakdown and live usage details
- [x] Exporter-backed host metrics for both laptop and CM4
- [ ] External laptop thermal probe ingestion and calibration
- [ ] Host warning thresholds for laptop heat and resource pressure

### Wapps (Services)
- [ ] Live container status from Docker
- [ ] Service health checks (HTTP)
- [ ] Service grouping by host and category
- [ ] Links to service UIs
- [ ] Container restart/stop actions
- [ ] Tags field for services (categories, filtering)

### Works (Network & Access)
- [ ] Router status and metrics
- [ ] Switch port status
- [ ] Cloudflare Tunnel status
- [ ] Tailscale device list
- [ ] DNS resolution checks

### Yots (IoT)
- [ ] Zigbee2MQTT device list
- [ ] Device last-seen status
- [ ] Battery levels for sensors
- [ ] MQTT broker status
- [ ] Device count by area/room

### Tracs (Logs & Traces)
- [ ] Container log streaming
- [ ] Log filtering by service
- [ ] Log level filtering (error, warn, info)
- [ ] Time range selection
- [ ] Search functionality

### Stows (Storage)
- [ ] Detailed drive info by host
- [ ] Disk usage breakdown
- [ ] Cache analysis and cleanup recommendations
- [ ] Network shares section
- [ ] AI-assisted drive cleanup suggestions

### Shots (Backups)
> See `shots/` directory and `SHOTS_RUNNER_PLAN.md`.
- [x] Backup jobs UI and runtime store
- [x] Manual runs, retention, and notifications
- [ ] Host-side `shots-runner` integration
- [ ] Per-host backup targets including CM4

### Crets (Secrets)
- [ ] Secrets management interface
- [ ] Secure storage integration
- [ ] Secret rotation tracking
- [ ] Access audit logging

---

## Phase 2: Integrations

### OpenRouter Integration
- [ ] API connection setup
- [ ] Usage tracking
- [ ] Cost monitoring
- [ ] Model selection preferences
- [ ] Rate limit visibility

### ntfy Integration
- [ ] Notification history
- [ ] Topic management
- [ ] Send test notifications
- [ ] Alert routing configuration
- [ ] Tag-based notification routing

### n8n Integration
- [ ] Workflow status
- [ ] Execution history
- [ ] Error alerts
- [ ] Trigger workflows from dashboard

### Home Assistant Integration
- [ ] Entity state display
- [ ] Automation status
- [ ] Scene control
- [ ] Device tracking
- [ ] Energy monitoring

### MQTT Integration
- [ ] Topic browser
- [ ] Message inspector
- [ ] Publish test messages
- [ ] Subscription management

---

## Phase 3: Enhanced Dashboard

### Dashboard Widgets
- [ ] Customizable widget layout
- [ ] Widget library (clock, weather, calendar)
- [ ] Drag-and-drop arrangement
- [ ] Widget size options
- [ ] Per-widget refresh rates

### Wallboard Improvements
- [ ] Auto-rotation between views
- [ ] Configurable rotation timing
- [ ] Playlist management
- [ ] Now playing / media widget
- [ ] Calendar integration

### Alerting
- [ ] Alert rules configuration
- [ ] Alert history
- [ ] Acknowledgment workflow
- [ ] Escalation policies
- [ ] Integration with ntfy

---

## Phase 4: Advanced Features

### Flow Diagram
- [ ] Visual topology view
- [ ] Service dependency mapping
- [ ] Network flow visualization
- [ ] Interactive node details
- [ ] Auto-layout options

### Multi-Host Support
- [ ] Additional host agents
- [ ] Host discovery
- [ ] Cross-host metrics
- [ ] Unified container view

---

## Technical Debt
- [ ] Production build optimization
- [ ] Authentication/authorization
- [ ] API rate limiting
- [ ] Caching layer
- [ ] Unit tests
- [ ] E2E tests
- [ ] Performance monitoring

---

## Navigation Structure

```text
Overview | Hosts | Wapps | Works | Yots | Stows | Shots | Tracs | Crets | Settings
                                      ↑       ↑       ↑       ↑
                                   Services  Network  IoT   Logs/Secrets
```

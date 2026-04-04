# Homelab Dashboard Roadmap

**Document Version:** 1.1.0
**Last Updated:** 2026-04-04

## MVP (Complete)
- [x] Hosts page with live metrics (CPU, RAM, Disk, Temp, Uptime)
- [x] CM4 exporter agent
- [x] Basic navigation and layout
- [x] Settings page with theme toggle
- [x] Cloudflare tunnel access
- [x] Build number in UI footer
- [x] Exporter version tooltip on hosts
- [x] Docker Compose production deployment

## Known Issues
- [ ] **CM4 CPU showing 0%** - Parser needs fix in exporter

## Phase 1: Core Screens

### Hosts Enhancements
- [ ] Detail modal for hosts with editing capability
- [ ] Tags field for hosts (filtering, notifications routing)
- [ ] RAM drilldown - top processes using memory
- [ ] CPU drilldown - top processes using CPU
- [ ] Disk drilldown - cache clearing suggestions, available space details

### Services Page
- [ ] Live container status from Docker
- [ ] Service health checks (HTTP)
- [ ] Service grouping by host and category
- [ ] Links to service UIs
- [ ] Container restart/stop actions
- [ ] Tags field for services (categories, filtering)

### Network Page
- [ ] Router status and metrics
- [ ] Switch port status
- [ ] Cloudflare Tunnel status
- [ ] Tailscale device list
- [ ] DNS resolution checks

### IoT Page
- [ ] Zigbee2MQTT device list
- [ ] Device last-seen status
- [ ] Battery levels for sensors
- [ ] MQTT broker status
- [ ] Device count by area/room

### Logs Page
- [ ] Container log streaming
- [ ] Log filtering by service
- [ ] Log level filtering (error, warn, info)
- [ ] Time range selection
- [ ] Search functionality

### Disks Page (NEW)
- [ ] Detailed drive info by host
- [ ] Disk usage breakdown
- [ ] Cache analysis and cleanup recommendations
- [ ] Network shares section
- [ ] Backup status integration
- [ ] AI-assisted drive cleanup suggestions

### Secrets Page (NEW)
- [ ] Secrets management interface
- [ ] Secure storage integration
- [ ] Secret rotation tracking
- [ ] Access audit logging

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

## Phase 4: Advanced Features

### Backup Monitoring
- [ ] Backup job status
- [ ] Last success/failure times
- [ ] Storage usage tracking
- [ ] Retention policy display
- [ ] Manual backup triggers

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

## Technical Debt
- [ ] Production build optimization
- [ ] Authentication/authorization
- [ ] API rate limiting
- [ ] Caching layer
- [ ] Unit tests
- [ ] E2E tests
- [ ] Performance monitoring

# Homelab Dashboard Roadmap

## MVP (Complete)
- [x] Hosts page with live metrics (CPU, RAM, Disk, Temp, Uptime)
- [x] CM4 exporter agent
- [x] Basic navigation and layout
- [x] Settings page with theme toggle
- [x] Cloudflare tunnel access

## Phase 1: Core Screens

### Services Page
- [ ] Live container status from Docker
- [ ] Service health checks (HTTP)
- [ ] Service grouping by host and category
- [ ] Links to service UIs
- [ ] Container restart/stop actions

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

- [ ] Production build with backend
- [ ] Docker Compose for full stack
- [ ] Authentication/authorization
- [ ] API rate limiting
- [ ] Caching layer
- [ ] Unit tests
- [ ] E2E tests

# Shost — Phase Implementation Plans

**Document Version:** 1.1.0
**Last Updated:** 2026-04-05

> This document provides detailed implementation plans for each phase of Shost development.
> Each phase ends with an integration phase. Work is done in feature branches, merged before moving to the next item.

---

## Branch Workflow

```bash
# For each feature/item:
git checkout main
git pull origin main
git checkout -b phase-X/feature-name

# Work on feature...
# When complete:
git add -A
git commit -m "feat: description"
git checkout main
git merge phase-X/feature-name
git push origin main
git branch -d phase-X/feature-name
```

---

## Navigation Structure (Target)

``` 
Overview | Hosts | Wapps | Works | Yots | Stows | Shots | Tracs | Crets | Settings
                                      ↑       ↑       ↑       ↑
                                   Services  Network  IoT   Logs/Secrets
```

**Naming note:** Shost uses branded IA names in the UI. Internal code, types, and inventory may continue using descriptive names like `services`, `network`, `iot`, `logs`, and `secrets` where that is clearer.

**Note:** Shots page is being built by a separate agent. This plan reserves the menu slot but does not implement the page.

---

## Phase 0: Bug Fixes & Prep

**Branch prefix:** `phase-0/`

### 0.1 Fix CM4 CPU 0% Bug
**Branch:** `phase-0/fix-cm4-cpu`
**Files:** `agent/exporter.py`

**Problem:** CM4 CPU metrics showing 0%

**Tasks:**
- [x] Replace naive CPU parser with sampled `/proc/stat` deltas
- [x] Redeploy exporter-compatible code path
- [x] Verify CPU shows non-zero in dashboard

**Acceptance:**
- [x] CM4 CPU shows realistic percentage (not 0%)
- [x] No regression on other metrics

---

### 0.2 Add Stows & Shots Menu Placeholders
**Branch:** `phase-0/nav-placeholders`
**Files:** `src/components/Layout.tsx`, `src/App.tsx`, `src/pages/Stows.tsx`, `src/pages/Shots.tsx`

**Tasks:**
- [ ] Create `src/pages/Stows.tsx` with UnderConstruction
- [ ] Create `src/pages/Shots.tsx` with UnderConstruction + note "Built by separate agent"
- [ ] Add routes to App.tsx
- [ ] Add nav items to Layout.tsx (after Yots, before Tracs)
- [ ] Deploy and verify navigation works

**Acceptance:**
- Both pages accessible from nav
- Stows shows "Under Construction"
- Shots shows placeholder message

---

### Phase 0 Integration
**Branch:** `phase-0/integration`

- [ ] Run full test checklist
- [ ] Verify all pages load
- [ ] Verify CM4 metrics working
- [ ] Update ROADMAP.md (mark bug fixed)
- [ ] Deploy to production

---

## Phase 1: Core Screens

**Branch prefix:** `phase-1/`

### 1.1 Hosts Enhancements

#### 1.1.1 Host Detail Modal
**Branch:** `phase-1/host-detail-modal`
**Files:** `src/pages/Hosts.tsx`, `src/components/HostDetailModal.tsx`

**Tasks:**
- [x] Create HostDetailModal component
- [x] Show all host fields: name, role, IP, DNS, tags
- [x] Show all metrics with labels
- [x] Show uptime formatted (days, hours, minutes)
- [x] Add close button and backdrop click to close
- [x] Wire click handler on host cards

**Acceptance:**
- [x] Clicking host card opens modal
- [x] Modal shows complete host information
- [x] Modal closes on backdrop click or X button

#### 1.1.2 Host Tags & Filtering
**Branch:** `phase-1/host-tags`
**Files:** `inventory/hosts.yaml`, `src/types/inventory.ts`, `src/pages/Hosts.tsx`

**Tasks:**
- [x] Add `tags: string[]` to host schema
- [x] Update inventory/hosts.yaml with example tags
- [x] Add tag chips display on host cards
- [x] Add filter bar with tag toggles
- [x] Filter hosts by selected tags

**Acceptance:**
- [x] Tags display on host cards
- [x] Filter bar shows all available tags
- [x] Selecting tag filters host list

#### 1.1.3 Host Metric Drilldowns
**Branch:** `phase-1/host-drilldowns`
**Files:** `agent/exporter.py`, `server/collectors/remote-host.ts`, `src/components/HostDetailModal.tsx`

**Tasks:**
- [x] Extend exporter to collect top processes (CPU, RAM)
- [x] Add top CPU and top RAM process collections to exporter response
- [x] Display top 5 CPU consumers in modal
- [x] Display top 5 RAM consumers in modal
- [x] Add disk breakdown (per mount point)
- [x] Add laptop exporter to main compose stack
- [x] Route laptop and CM4 host collection through exporter-backed metrics
- [ ] Ingest RP2040 external thermal probe JSON for laptop host
- [ ] Calibrate external surface temperature offset and warning thresholds

**Acceptance:**
- [x] Modal shows top processes by CPU
- [x] Modal shows top processes by RAM
- [x] Modal shows disk usage per mount
- [x] Both laptop and CM4 are exporter-backed hosts
- [ ] Laptop probe temperature appears live in dashboard

---

### 1.2 Wapps (Services)

#### 1.2.1 Live Container Status
**Branch:** `phase-1/services-containers`
**Files:** `server/collectors/docker.ts`, `src/pages/Wapps.tsx`, `src/types/inventory.ts`

**Tasks:**
- [ ] Create docker collector (read from Docker socket)
- [ ] Map containers to services via labels or name matching
- [ ] Show container state: running, stopped, restarting
- [ ] Show container uptime
- [ ] Show image version/tag

**Acceptance:**
- Wapps shows live container status
- Status updates on polling interval
- Stopped containers show red indicator

#### 1.2.2 Service Health Checks
**Branch:** `phase-1/services-health`
**Files:** `server/collectors/health.ts`, `inventory/services.yaml`

**Tasks:**
- [ ] Add `health_url` field to service schema
- [ ] Create health check collector (HTTP GET)
- [ ] Show health status on service cards
- [ ] Show last check time
- [ ] Handle timeout/error states

**Acceptance:**
- Services with health_url show health status
- Green = 2xx, Yellow = timeout, Red = error
- Last check time displayed

#### 1.2.3 Service Grouping & Links
**Branch:** `phase-1/services-grouping`
**Files:** `src/pages/Wapps.tsx`, `inventory/services.yaml`

**Tasks:**
- [ ] Add `category` field to services
- [ ] Add group-by toggle (host vs category)
- [ ] Render services in collapsible groups
- [ ] Add clickable URL links to service UIs
- [ ] Add external link icon

**Acceptance:**
- Can toggle between host and category grouping
- Groups are collapsible
- Service URLs are clickable

#### 1.2.4 Container Actions
**Branch:** `phase-1/services-actions`
**Files:** `server/routes/containers.ts`, `src/components/ServiceActions.tsx`

**Tasks:**
- [ ] Create POST /api/containers/:id/restart endpoint
- [ ] Create POST /api/containers/:id/stop endpoint
- [ ] Add action buttons to service cards (restart, stop)
- [ ] Add confirmation dialog for stop
- [ ] Show loading state during action

**Acceptance:**
- Restart button restarts container
- Stop button stops container (with confirmation)
- Actions require no page refresh

#### 1.2.5 Service Tags
**Branch:** `phase-1/services-tags`
**Files:** `inventory/services.yaml`, `src/pages/Wapps.tsx`

**Tasks:**
- [ ] Add `tags: string[]` to service schema
- [ ] Add tag chips on service cards
- [ ] Add tag filter bar
- [ ] Combine with grouping

**Acceptance:**
- Tags display on service cards
- Filter by tags works with grouping

---

### 1.3 Works (Network & Access)

#### 1.3.1 Router & Switch Status
**Branch:** `phase-1/network-devices`
**Files:** `inventory/network.yaml`, `server/collectors/network.ts`, `src/pages/Works.tsx`

**Tasks:**
- [ ] Define network device schema (router, switch, AP)
- [ ] Create network.yaml with device inventory
- [ ] Create collector for ICMP ping checks
- [ ] Display devices with status
- [ ] Show IP, type, and uptime (if available)

**Acceptance:**
- Network devices show in list
- Status shows reachable/unreachable
- Type icon indicates device kind

#### 1.3.2 Cloudflare Tunnel Status
**Branch:** `phase-1/network-cloudflare`
**Files:** `server/collectors/cloudflare.ts`, `src/pages/Works.tsx`

**Tasks:**
- [ ] Add Cloudflare tunnel to network inventory
- [ ] Check tunnel health via local connector
- [ ] Display tunnel status and exposed routes
- [ ] Show last connected time

**Acceptance:**
- Tunnel shows online/offline status
- Routes list displayed

#### 1.3.3 Tailscale Status
**Branch:** `phase-1/network-tailscale`
**Files:** `server/collectors/tailscale.ts`, `src/pages/Works.tsx`

**Tasks:**
- [ ] Query Tailscale status via CLI or API
- [ ] List connected devices
- [ ] Show device online/offline
- [ ] Show Tailscale IP

**Acceptance:**
- Tailscale devices listed
- Online status accurate

#### 1.3.4 DNS Resolution Checks
**Branch:** `phase-1/network-dns`
**Files:** `server/collectors/dns.ts`, `src/pages/Works.tsx`

**Tasks:**
- [ ] Define critical DNS names to check
- [ ] Perform DNS resolution checks
- [ ] Display resolution status
- [ ] Show resolved IP

**Acceptance:**
- DNS names checked
- Resolution success/failure shown

---

### 1.4 Yots (IoT)

#### 1.4.1 Zigbee2MQTT Device List
**Branch:** `phase-1/iot-zigbee`
**Files:** `server/collectors/zigbee2mqtt.ts`, `src/pages/Yots.tsx`, `inventory/iot.yaml`

**Tasks:**
- [ ] Connect to Zigbee2MQTT MQTT topics
- [ ] Parse device list from bridge/devices
- [ ] Display devices with friendly names
- [ ] Show device type icon
- [ ] Show last-seen timestamp

**Acceptance:**
- All Zigbee devices listed
- Last-seen shows relative time
- Device types have icons

#### 1.4.2 Battery Levels
**Branch:** `phase-1/iot-batteries`
**Files:** `server/collectors/zigbee2mqtt.ts`, `src/pages/Yots.tsx`

**Tasks:**
- [ ] Extract battery percentage from device state
- [ ] Display battery indicator on devices
- [ ] Color code: green >50%, yellow 20-50%, red <20%
- [ ] Sort option: by battery level

**Acceptance:**
- Battery levels displayed
- Low battery devices highlighted
- Can sort by battery

#### 1.4.3 MQTT Broker Status
**Branch:** `phase-1/iot-mqtt`
**Files:** `server/collectors/mqtt.ts`, `src/pages/Yots.tsx`

**Tasks:**
- [ ] Check Mosquitto broker connectivity
- [ ] Display broker status card
- [ ] Show connected clients count (if available)
- [ ] Show uptime

**Acceptance:**
- Broker status displayed
- Connection status accurate

#### 1.4.4 Device Count by Area
**Branch:** `phase-1/iot-areas`
**Files:** `src/pages/Yots.tsx`

**Tasks:**
- [ ] Group devices by area/room
- [ ] Show device count per area
- [ ] Collapsible area sections
- [ ] Area filter

**Acceptance:**
- Devices grouped by area
- Counts shown per area

---

### 1.5 Tracs (Logs & Traces)

#### 1.5.1 Container Log Streaming
**Branch:** `phase-1/logs-streaming`
**Files:** `server/routes/logs.ts`, `src/pages/Tracs.tsx`

**Tasks:**
- [ ] Create GET /api/logs/:container endpoint
- [ ] Stream last N lines (default 100)
- [ ] Display in monospace scrollable area
- [ ] Auto-scroll to bottom option
- [ ] Refresh button

**Acceptance:**
- Logs display for selected container
- Can scroll through logs
- Refresh fetches new logs

#### 1.5.2 Log Filtering
**Branch:** `phase-1/logs-filtering`
**Files:** `src/pages/Tracs.tsx`

**Tasks:**
- [ ] Add service/container dropdown
- [ ] Add log level filter (error, warn, info)
- [ ] Parse log lines for level detection
- [ ] Color code by level
- [ ] Add search input

**Acceptance:**
- Can filter by container
- Can filter by level
- Search highlights matches

#### 1.5.3 Time Range Selection
**Branch:** `phase-1/logs-timerange`
**Files:** `server/routes/logs.ts`, `src/pages/Tracs.tsx`

**Tasks:**
- [ ] Add time range selector (last 1h, 6h, 24h, 7d)
- [ ] Pass time range to API
- [ ] Fetch logs within range
- [ ] Display time range in header

**Acceptance:**
- Time range selector works
- Logs filtered by time

---

### 1.6 Stows (Storage)

#### 1.6.1 Drive Inventory
**Branch:** `phase-1/stows-drives`
**Files:** `inventory/stows.yaml`, `server/collectors/stows.ts`, `src/pages/Stows.tsx`, `src/types/inventory.ts`

**Tasks:**
- [ ] Define stows schema (drives, mounts, shares)
- [ ] Create stows.yaml inventory
- [ ] Extend exporter for detailed disk info
- [ ] Display drives by host
- [ ] Show: mount, total, used, available, %

**Acceptance:**
- All drives listed by host
- Usage shown with progress bar
- Critical usage (>90%) highlighted

#### 1.6.2 Disk Usage Breakdown
**Branch:** `phase-1/stows-breakdown`
**Files:** `agent/exporter.py`, `src/pages/Stows.tsx`

**Tasks:**
- [ ] Extend exporter for directory sizes (top level)
- [ ] Display breakdown in expandable section
- [ ] Show largest directories
- [ ] Sort by size

**Acceptance:**
- Can see top directories by size
- Expandable per drive

#### 1.6.3 Cache Analysis
**Branch:** `phase-1/stows-cache`
**Files:** `agent/exporter.py`, `src/pages/Stows.tsx`

**Tasks:**
- [ ] Identify common cache locations
- [ ] Calculate cache sizes (Docker, apt, npm, etc.)
- [ ] Display cache summary
- [ ] Show cleanup recommendations

**Acceptance:**
- Cache sizes displayed
- Recommendations shown

#### 1.6.4 Network Shares
**Branch:** `phase-1/stows-shares`
**Files:** `inventory/stows.yaml`, `src/pages/Stows.tsx`

**Tasks:**
- [ ] Add shares section to stows schema
- [ ] List NFS/SMB shares
- [ ] Show share status (mounted/accessible)
- [ ] Show share path and host

**Acceptance:**
- Network shares listed
- Status shown

---

### 1.7 Crets (Secrets)

#### 1.7.1 Secrets List View
**Branch:** `phase-1/secrets-list`
**Files:** `inventory/secrets.yaml`, `server/routes/secrets.ts`, `src/pages/Crets.tsx`

**Tasks:**
- [ ] Define secrets schema (name, type, last_rotated)
- [ ] Create secrets.yaml (metadata only, no values!)
- [ ] Display secrets list
- [ ] Show rotation status
- [ ] Never display actual secret values

**Acceptance:**
- Secrets listed by name
- Rotation status shown
- No values exposed

#### 1.7.2 Rotation Tracking
**Branch:** `phase-1/secrets-rotation`
**Files:** `src/pages/Crets.tsx`

**Tasks:**
- [ ] Track last rotation date
- [ ] Calculate days since rotation
- [ ] Highlight overdue rotations (>90 days)
- [ ] Show rotation policy

**Acceptance:**
- Rotation dates tracked
- Overdue secrets highlighted

---

### Phase 1 Integration
**Branch:** `phase-1/integration`

**Tasks:**
- [ ] Full regression test all pages
- [ ] Performance check (page load times)
- [ ] Mobile responsiveness check
- [ ] Fix any cross-page issues
- [ ] Update ROADMAP.md
- [ ] Update README.md with new features
- [ ] Deploy to production
- [ ] Smoke test via Cloudflare tunnel

**Acceptance:**
- All Phase 1 features working
- No regressions
- Production deployed

---

## Phase 2: Integrations

**Branch prefix:** `phase-2/`

### 2.1 OpenRouter Integration

#### 2.1.1 API Connection
**Branch:** `phase-2/openrouter-api`
**Files:** `server/collectors/openrouter.ts`, `src/pages/Integrations.tsx`

**Tasks:**
- [ ] Create Integrations page
- [ ] Add OpenRouter section
- [ ] Store API key securely (env var)
- [ ] Fetch account info from API
- [ ] Display connection status

#### 2.1.2 Usage & Cost Tracking
**Branch:** `phase-2/openrouter-usage`
**Files:** `server/collectors/openrouter.ts`, `src/pages/Integrations.tsx`

**Tasks:**
- [ ] Fetch usage data from API
- [ ] Display token usage (daily, monthly)
- [ ] Calculate and display costs
- [ ] Show rate limit status
- [ ] Model usage breakdown

---

### 2.2 ntfy Integration

#### 2.2.1 Notification History
**Branch:** `phase-2/ntfy-history`
**Files:** `server/collectors/ntfy.ts`, `src/pages/Integrations.tsx`

**Tasks:**
- [ ] Connect to ntfy server
- [ ] Fetch recent notifications
- [ ] Display notification list
- [ ] Show topic, time, message

#### 2.2.2 Topic Management
**Branch:** `phase-2/ntfy-topics`
**Files:** `server/routes/ntfy.ts`, `src/pages/Integrations.tsx`

**Tasks:**
- [ ] List subscribed topics
- [ ] Send test notification
- [ ] Configure alert routing

---

### 2.3 n8n Integration

#### 2.3.1 Workflow Status
**Branch:** `phase-2/n8n-workflows`
**Files:** `server/collectors/n8n.ts`, `src/pages/Integrations.tsx`

**Tasks:**
- [ ] Connect to n8n API
- [ ] List workflows
- [ ] Show active/inactive status
- [ ] Display last execution time

#### 2.3.2 Execution History
**Branch:** `phase-2/n8n-executions`
**Files:** `server/collectors/n8n.ts`, `src/pages/Integrations.tsx`

**Tasks:**
- [ ] Fetch recent executions
- [ ] Show success/failure status
- [ ] Display execution duration
- [ ] Link to n8n UI

---

### 2.4 Home Assistant Integration

#### 2.4.1 Entity State Display
**Branch:** `phase-2/ha-entities`
**Files:** `server/collectors/homeassistant.ts`, `src/pages/Integrations.tsx`

**Tasks:**
- [ ] Connect to HA API (long-lived token)
- [ ] Fetch selected entity states
- [ ] Display entity cards
- [ ] Show state and attributes

#### 2.4.2 Automation Status
**Branch:** `phase-2/ha-automations`
**Files:** `server/collectors/homeassistant.ts`, `src/pages/Integrations.tsx`

**Tasks:**
- [ ] List automations
- [ ] Show enabled/disabled
- [ ] Show last triggered

---

### 2.5 MQTT Integration

#### 2.5.1 Topic Browser
**Branch:** `phase-2/mqtt-browser`
**Files:** `server/collectors/mqtt.ts`, `src/pages/Integrations.tsx`

**Tasks:**
- [ ] Subscribe to topic wildcards
- [ ] Display topic tree
- [ ] Show last message per topic
- [ ] Timestamp display

#### 2.5.2 Message Inspector
**Branch:** `phase-2/mqtt-inspector`
**Files:** `src/pages/Integrations.tsx`

**Tasks:**
- [ ] Select topic to inspect
- [ ] Show message history
- [ ] JSON formatting
- [ ] Publish test message

---

### Phase 2 Integration
**Branch:** `phase-2/integration`

**Tasks:**
- [ ] Test all integration connections
- [ ] Handle offline/error states gracefully
- [ ] Add integration health to Overview
- [ ] Update ROADMAP.md
- [ ] Deploy to production

---

## Phase 3: Enhanced Dashboard

**Branch prefix:** `phase-3/`

### 3.1 Dashboard Widgets

#### 3.1.1 Widget Framework
**Branch:** `phase-3/widget-framework`
**Files:** `src/components/widgets/`, `src/lib/widgets.ts`

**Tasks:**
- [ ] Define widget interface
- [ ] Create widget registry
- [ ] Build widget container component
- [ ] Support widget sizing (1x1, 2x1, 2x2)

#### 3.1.2 Core Widgets
**Branch:** `phase-3/core-widgets`
**Files:** `src/components/widgets/`

**Tasks:**
- [ ] Clock widget
- [ ] Weather widget (API integration)
- [ ] Calendar widget
- [ ] Quick stats widget

#### 3.1.3 Widget Layout
**Branch:** `phase-3/widget-layout`
**Files:** `src/pages/Dashboard.tsx`

**Tasks:**
- [ ] Drag-and-drop arrangement
- [ ] Save layout to localStorage
- [ ] Reset to default option
- [ ] Per-widget refresh rates

---

### 3.2 Wallboard Improvements

#### 3.2.1 Auto-Rotation
**Branch:** `phase-3/wallboard-rotation`
**Files:** `src/pages/Wallboard.tsx`

**Tasks:**
- [ ] Define view playlist
- [ ] Auto-rotate between views
- [ ] Configurable timing
- [ ] Pause on interaction

#### 3.2.2 Media Widget
**Branch:** `phase-3/wallboard-media`
**Files:** `src/components/widgets/NowPlaying.tsx`

**Tasks:**
- [ ] Now playing widget
- [ ] Album art display
- [ ] Progress bar
- [ ] Integration with media players

---

### 3.3 Alerting

#### 3.3.1 Alert Rules
**Branch:** `phase-3/alerting-rules`
**Files:** `inventory/alerts.yaml`, `server/alerting/`

**Tasks:**
- [ ] Define alert rule schema
- [ ] Create rules engine
- [ ] Evaluate rules on polling
- [ ] Store alert state

#### 3.3.2 Alert UI
**Branch:** `phase-3/alerting-ui`
**Files:** `src/pages/Alerts.tsx`

**Tasks:**
- [ ] Alert history display
- [ ] Acknowledgment workflow
- [ ] ntfy integration for notifications

---

### Phase 3 Integration
**Branch:** `phase-3/integration`

**Tasks:**
- [ ] Full widget system test
- [ ] Wallboard casting test
- [ ] Alert workflow test
- [ ] Update ROADMAP.md
- [ ] Deploy to production

---

## Phase 4: Advanced Features

**Branch prefix:** `phase-4/`

### 4.1 Flow Diagram

#### 4.1.1 Topology View
**Branch:** `phase-4/flow-diagram`
**Files:** `src/pages/Flow.tsx`, `src/components/FlowDiagram.tsx`

**Tasks:**
- [ ] Mermaid-style node rendering
- [ ] Service dependency mapping
- [ ] Network flow visualization
- [ ] Interactive node details

### 4.2 Multi-Host Support

#### 4.2.1 Additional Exporters
**Branch:** `phase-4/multi-host`
**Files:** `agent/`, `server/collectors/`

**Tasks:**
- [ ] Deploy exporter to additional hosts
- [ ] Host discovery mechanism
- [ ] Cross-host metrics aggregation
- [ ] Unified container view

---

### Phase 4 Integration
**Branch:** `phase-4/integration`

**Tasks:**
- [ ] Full system test
- [ ] Performance optimization
- [ ] Documentation update
- [ ] Final production deploy

---

## Technical Debt (Ongoing)

Address these throughout phases:

- [ ] Production build optimization
- [ ] Authentication/authorization
- [ ] API rate limiting
- [ ] Caching layer
- [ ] Unit tests
- [ ] E2E tests
- [ ] Performance monitoring

---

## Quick Reference

| Phase | Focus | Est. Items |
|-------|-------|------------|
| 0 | Bug fixes + nav prep | 3 |
| 1 | Core screens | 25 |
| 2 | Integrations | 12 |
| 3 | Enhanced dashboard | 10 |
| 4 | Advanced features | 5 |

**Total estimated items:** ~55

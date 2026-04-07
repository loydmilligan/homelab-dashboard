# Shost Current State Inventory

**Document Version:** 2.1.0
**Last Updated:** 2026-04-07

## Purpose

This document is the current reality check for the app and repo surface.

It separates:
- what is genuinely working now
- what is partially real but still needs hardening
- what is inventory-backed or otherwise not yet truly live

Use this before promoting roadmap or phase-plan work into active execution.

## Classification Rules

### Live

The feature is available in the UI and is backed by a real runtime path, live collector, or real mutation endpoint.

### Partial

The page or backend path is useful now, but some important parts are still inventory-backed, brittle, or not yet fully surfaced.

### Inventory-Backed / Planned

The UI exists, but the data is still coming mainly from YAML or is otherwise not yet real observability or control.

## Shared Backend Reality

### Live state assembled in `/api/state`

The backend currently provides merged state for:
- laptop host metrics via the laptop exporter
- CM4 host metrics via the remote exporter
- Docker container status for laptop services
- Docker container status from the CM4 exporter
- service health checks for configured services
- Home Assistant-derived IoT hub and device state when HA credentials are configured
- laptop MQTT thermal readings when the MQTT thermal feed is configured
- secret metadata from `inventory/secrets.yaml` with env presence checks
- backup runtime state from the Shots store, with fallback to `inventory/backups.yaml`
- app-wide notification readiness summary from persisted notification settings

### Live mutation and utility endpoints

The backend also supports:
- host metadata editing
- service log fetch
- container restart
- container stop
- container start
- Shots job CRUD, schedules, summary, and run history

### Mostly inventory-backed domains

These areas still rely mainly on YAML or static structure:
- network devices and access paths
- storage inventory and cleanup suggestions
- some service metadata quality
- backup topology beyond the implemented runner paths

## Page Inventory

### Overview

Route:
- `/`

Status:
- `Partial`

Live now:
- shared summary banner, KPI strip, and state-indicator row
- host counts and host metrics summary from live state
- Wapps counts from merged service state
- backup summary from current Shots/runtime backup state
- surfaced backup freshness, access-path, pressure, secret-hygiene, and notification-readiness summary signals

Partial:
- overview cards still mix live, inventory-backed, and inferred data by design
- provenance is now explicit in the UI, but some signals remain mixed-quality until their source domains become live

### Hosts

Route:
- `/hosts`

Status:
- `Live`

Live now:
- laptop and CM4 exporter-backed metrics
- CPU, RAM, disk, uptime, and temperature metrics
- host tags and filtering
- exporter version tooltip
- host detail modal
- host metadata editing through API
- top CPU processes
- top memory processes
- disk breakdown by mount
- laptop MQTT thermal overlay when configured

Still weak:
- save feedback could be clearer
- external thermal probe calibration and warning thresholds are not yet formalized

### Wapps

Route:
- `/wapps`

Status:
- `Live`

Live now:
- service inventory with CRUD UI
- merged container status from laptop Docker and CM4 exporter
- health checks via configured service checks
- grouping by host or category
- tag display and filtering
- links to service URLs and exposed domains
- restart, stop, and start actions
- down and recovery notifications

Still weak:
- container matching is still partly name-based
- service tags are supported but sparsely populated
- image/version details and clearer provenance are not fully surfaced

### Works

Route:
- `/works`

Status:
- `Inventory-Backed / Planned`

Live now:
- network devices render from inventory
- access paths render from inventory
- service IDs resolve to service names

Not yet live:
- ping reachability
- Cloudflare tunnel health
- Tailscale status
- DNS checks
- router and switch telemetry

### Yots

Route:
- `/yots`

Status:
- `Partial`

Live now:
- IoT hubs and devices can be collected from Home Assistant when HA access is configured
- hub/device grouping
- battery-aware filtering
- status badges and area grouping

Fallback / limitations:
- falls back to `inventory/iot.yaml` when HA is unavailable or not configured
- not a direct Zigbee2MQTT or MQTT-native collector yet
- live broker/client telemetry is not implemented

### Stows

Route:
- `/stows`

Status:
- `Partial`

Live now:
- disk sections can render from live exporter disk metrics
- critical disk count is derived from live disk values

Still mock or inventory-light:
- cache analysis
- cleanup recommendations
- share inventory rendering
- deeper directory-size analysis

### Shots

Route:
- `/shots`

Status:
- `Live`

Live now:
- backup jobs UI
- create, edit, and delete job flows
- manual run initiation
- schedule and retention configuration
- notification configuration
- run history
- summary cards
- local/runtime store integration
- CM4 remote-runner path through the exporter

Still weak or incomplete:
- laptop host-runner model is not yet the single finalized path
- restore-confidence reporting is not implemented
- path validation UX is still limited

### Tracs

Route:
- `/tracs`

Status:
- `Live`

Live now:
- service selector
- service log fetch
- tail-line selection
- level filtering
- text search
- auto-scroll toggle
- refresh action
- local and CM4 log retrieval through service mapping

Still weak:
- polling/fetch model instead of true streaming
- parsing remains heuristic

### Crets

Route:
- `/crets`

Status:
- `Partial`

Live now:
- secret metadata from `inventory/secrets.yaml`
- env-presence checks
- rotation policy calculations
- filtering by state and scope

Still weak:
- metadata inventory is curated by hand
- no edit workflow yet
- no external secret-store integration

### Settings

Route:
- `/settings`

Status:
- `Live`

Live now:
- theme toggle
- localStorage persistence
- system/light/dark mode support

### Wallboard

Route:
- `/wallboard`

Status:
- `Partial`

Live now:
- shared summary banner, KPI strip, and state-indicator row
- fullscreen summary layout
- host cards with live metrics
- compact secondary signals for backups, access paths, and degraded services
- last-updated footer and explicit provenance note

Still weak:
- some counts still reflect mixed live/inventory-backed domains
- cast-readability has been improved in code but still needs final real-world validation

## Summary

### Strongest Current Surfaces

- Hosts
- Wapps
- Shots
- Tracs
- Settings

### Useful But Still Mixed

- Overview
- Yots
- Stows
- Crets
- Wallboard

### Mostly Inventory-Backed

- Works

## Recommended Interpretation

Shost is no longer just a hosts dashboard with placeholders.

The current baseline is:
- real host observability
- real service status and actions
- real backup job management
- real log access
- shared summary surfaces with explicit provenance and first-pass KPI/state indicators
- a growing but still uneven set of inventory-backed operational domains

The next planning pass should prioritize truthfulness and hardening over adding more mock surface area.

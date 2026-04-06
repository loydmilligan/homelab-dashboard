# Shost Current State Inventory

**Document Version:** 1.0.0
**Last Updated:** 2026-04-04

## Purpose

This document is a reality check for the current app.

It separates:
- what is genuinely working in the UI now
- what backend or data support exists but is only partially surfaced
- what is mock, static, or placeholder

This is meant to be the baseline before committing to later roadmap phases.

## Classification Rules

### Working Now

The feature is available in the UI and backed by real runtime data or a real interaction path.

### Almost There

The backend, data model, or part of the UI exists, but the feature is incomplete, weakly surfaced, or not yet trustworthy enough to call done.

### Mock / Placeholder

The feature is static, hard-coded, inventory-only with no live collection, or explicitly a placeholder page.

## Shared Backend Reality

### Live data currently assembled in `/api/state`

The backend currently provides real merged state for:
- laptop host metrics via `systeminformation`
- CM4 host metrics via the remote exporter
- Docker container status on the laptop
- Docker container status from the CM4 exporter
- HTTP health checks for services with URLs

Relevant files:
- [server/collectors/index.ts](/home/mmariani/Projects/homelab-dashboard/server/collectors/index.ts)
- [server/collectors/local-metrics.ts](/home/mmariani/Projects/homelab-dashboard/server/collectors/local-metrics.ts)
- [server/collectors/remote-host.ts](/home/mmariani/Projects/homelab-dashboard/server/collectors/remote-host.ts)
- [server/collectors/docker.ts](/home/mmariani/Projects/homelab-dashboard/server/collectors/docker.ts)
- [server/collectors/health-checks.ts](/home/mmariani/Projects/homelab-dashboard/server/collectors/health-checks.ts)

### API capabilities that exist outside `/api/state`

The backend also supports:
- host metadata editing
- container `restart`
- container `stop`
- container `start`
- container log fetch by name

Relevant file:
- [server/index.ts](/home/mmariani/Projects/homelab-dashboard/server/index.ts)

### Inventory-only domains right now

These areas are still fed from YAML without live collectors:
- network devices and access paths
- IoT hubs and devices
- backups summary
- stows inventory file itself

Relevant files:
- [inventory/network.yaml](/home/mmariani/Projects/homelab-dashboard/inventory/network.yaml)
- [inventory/iot.yaml](/home/mmariani/Projects/homelab-dashboard/inventory/iot.yaml)
- [inventory/backups.yaml](/home/mmariani/Projects/homelab-dashboard/inventory/backups.yaml)
- [inventory/stows.yaml](/home/mmariani/Projects/homelab-dashboard/inventory/stows.yaml)

## Page Inventory

### Overview

Route:
- `/`

Working now:
- top-level host counts from live state
- Wapps count based on live `services` state
- Yots counts based on current `iot_hubs` and `devices` state
- Shots summary card from `backups.yaml`
- external access card from `network.yaml`

Almost there:
- the page is operational, but some sections mix live and static domains without clearly saying which is which
- labels still use descriptive terms like `Services` and `Backups` instead of the branded page names

Mock / Placeholder:
- none in the UI component itself, but backup and access summaries are only as real as their inventory files

Relevant file:
- [src/pages/Overview.tsx](/home/mmariani/Projects/homelab-dashboard/src/pages/Overview.tsx)

Assessment:
- usable now
- should be relabeled and annotated for data provenance

### Hosts

Route:
- `/hosts`

Working now:
- live laptop metrics
- live CM4 metrics through exporter
- host cards with CPU, RAM, disk, temp, uptime
- tag display and tag filtering
- exporter version tooltip
- host detail modal
- host metadata editing for name, tags, and links via API
- top CPU processes
- top memory processes
- disk breakdown by mount

Almost there:
- save flow works, but there is no obvious success or failure feedback in the UI
- laptop drilldown richness depends on what is populated into `metrics`; the deep process and disk details are strongest for exporter-backed hosts

Mock / Placeholder:
- seed metrics still exist in `inventory/hosts.yaml`, but they are overwritten by live state where available

Relevant files:
- [src/pages/Hosts.tsx](/home/mmariani/Projects/homelab-dashboard/src/pages/Hosts.tsx)
- [src/components/HostDetailModal.tsx](/home/mmariani/Projects/homelab-dashboard/src/components/HostDetailModal.tsx)
- [agent/exporter.py](/home/mmariani/Projects/homelab-dashboard/agent/exporter.py)
- [server/index.ts](/home/mmariani/Projects/homelab-dashboard/server/index.ts)

Assessment:
- the strongest page in the product
- this is genuinely working and close to a baseline worth keeping

### Wapps

Route:
- `/wapps`

Working now:
- list of services from inventory
- live container status merged from laptop Docker and CM4 exporter
- HTTP health check status for services with URLs
- grouping by host or category
- service tag filtering when tags exist
- external links to service URLs and exposed domains
- restart, stop, and start actions via backend endpoints

Almost there:
- container matching is name-based and may be brittle
- uptime, image tag/version, and richer action feedback are not surfaced
- there is no explicit indication of whether a status came from container state or HTTP health
- service tags exist in the type and UI but are not yet populated in `inventory/services.yaml`

Mock / Placeholder:
- none at the page-shell level
- quality depends on inventory completeness and container name matching

Relevant files:
- [src/pages/Wapps.tsx](/home/mmariani/Projects/homelab-dashboard/src/pages/Wapps.tsx)
- [inventory/services.yaml](/home/mmariani/Projects/homelab-dashboard/inventory/services.yaml)
- [server/collectors/index.ts](/home/mmariani/Projects/homelab-dashboard/server/collectors/index.ts)
- [server/index.ts](/home/mmariani/Projects/homelab-dashboard/server/index.ts)

Assessment:
- meaningfully functional now
- strong candidate for “live but not fully hardened”

### Works

Route:
- `/works`

Working now:
- network devices render from inventory
- access paths render from inventory
- service names are resolved from access-path service IDs to human-readable names

Almost there:
- the screen layout is usable and not just a stub
- it could become real quickly if live collectors for ping, tunnel health, DNS, or Tailscale status are added

Mock / Placeholder:
- all data is currently inventory-backed
- there are no live network collectors
- current `status` values are effectively manual

Relevant files:
- [src/pages/Works.tsx](/home/mmariani/Projects/homelab-dashboard/src/pages/Works.tsx)
- [inventory/network.yaml](/home/mmariani/Projects/homelab-dashboard/inventory/network.yaml)

Assessment:
- real page, static data
- presentationally built, operationally not yet live

### Yots

Route:
- `/yots`

Working now:
- hubs and devices render from inventory
- grouping by area, type, or hub
- low-battery filter based on `battery_pct`
- device and hub cards with status badges

Almost there:
- the page itself is complete enough to use as a manual dashboard
- it could become much more useful with live data from Zigbee2MQTT or MQTT

Mock / Placeholder:
- all hub and device state is inventory-backed
- no live collector exists for device presence, last-seen, or battery

Relevant files:
- [src/pages/Yots.tsx](/home/mmariani/Projects/homelab-dashboard/src/pages/Yots.tsx)
- [inventory/iot.yaml](/home/mmariani/Projects/homelab-dashboard/inventory/iot.yaml)

Assessment:
- good UI shell
- not yet real observability

### Stows

Route:
- `/stows`

Working now:
- host disk sections render from live `metrics.disks` when exporter data is available
- critical-disk count is derived from those live disk values

Almost there:
- the inventory file for stows exists, but the page does not read it yet
- the page could be made substantially more honest by wiring `inventory/stows.yaml` into state and rendering it instead of hard-coded arrays

Mock / Placeholder:
- cache analysis is hard-coded
- cleanup recommendations are hard-coded
- network shares are hard-coded
- network share count is hard-coded as `2`

Relevant files:
- [src/pages/Stows.tsx](/home/mmariani/Projects/homelab-dashboard/src/pages/Stows.tsx)
- [inventory/stows.yaml](/home/mmariani/Projects/homelab-dashboard/inventory/stows.yaml)
- [agent/exporter.py](/home/mmariani/Projects/homelab-dashboard/agent/exporter.py)

Assessment:
- mixed page
- one real live section, several mock sections

### Shots

Route:
- `/shots`

Working now:
- page exists in navigation and communicates that the workstream lives in `shots/`

Almost there:
- backup summary data already exists in `inventory/backups.yaml` and is shown in Overview and Wallboard
- the `shots/` companion area exists and has design work

Mock / Placeholder:
- the page itself is a placeholder
- no backup management UI exists in the main app yet

Relevant files:
- [src/pages/Shots.tsx](/home/mmariani/Projects/homelab-dashboard/src/pages/Shots.tsx)
- [shots/docs/SHOTS_V1_DESIGN.md](/home/mmariani/Projects/homelab-dashboard/shots/docs/SHOTS_V1_DESIGN.md)
- [inventory/backups.yaml](/home/mmariani/Projects/homelab-dashboard/inventory/backups.yaml)

Assessment:
- placeholder with adjacent design work

### Tracs

Route:
- `/tracs`

Working now:
- service selector based on services with container status
- backend log fetch through `/api/containers/:name/logs`
- tail-line selection
- log level filtering
- text search
- auto-scroll toggle
- refresh action
- basic timestamp parsing and log-level highlighting

Almost there:
- logs are fetched on demand rather than streamed
- parsing is heuristic and not source-aware
- no explicit host selector exists, even though logs may come from different runtime contexts through container name mapping

Mock / Placeholder:
- none at the page shell level

Relevant files:
- [src/pages/Tracs.tsx](/home/mmariani/Projects/homelab-dashboard/src/pages/Tracs.tsx)
- [server/index.ts](/home/mmariani/Projects/homelab-dashboard/server/index.ts)

Assessment:
- genuinely working
- better than a placeholder and already useful

### Crets

Route:
- `/crets`

Working now:
- page layout, filtering, and rotation-status calculations

Almost there:
- the UX shape is defined well enough to keep

Mock / Placeholder:
- all data is hard-coded in the page component
- there is no backend route, inventory file, or persisted source

Relevant file:
- [src/pages/Crets.tsx](/home/mmariani/Projects/homelab-dashboard/src/pages/Crets.tsx)

Assessment:
- pure mock
- should either be clearly labeled as such or hidden until backed by real metadata

### Settings

Route:
- `/settings`

Working now:
- theme toggle
- localStorage persistence
- light/system/dark mode switching

Almost there:
- no additional settings domains yet

Mock / Placeholder:
- none

Relevant file:
- [src/pages/Settings.tsx](/home/mmariani/Projects/homelab-dashboard/src/pages/Settings.tsx)

Assessment:
- small but real

### Wallboard

Route:
- `/wallboard`

Working now:
- castable fullscreen summary
- host, services, device, and backup counts
- host cards with live host metrics

Almost there:
- labels still use descriptive names
- counts for Yots and Shots reflect inventory-backed domains

Mock / Placeholder:
- none in the component shell
- meaning depends on the truthfulness of the underlying domains

Relevant file:
- [src/pages/Wallboard.tsx](/home/mmariani/Projects/homelab-dashboard/src/pages/Wallboard.tsx)

Assessment:
- operational now
- should be aligned with branded naming and data-provenance cues

## Summary Inventory

### What We Have

- Overview: working summary page with mixed live and static domains
- Hosts: genuinely live and strong
- Wapps: genuinely functional with live status, actions, and links
- Tracs: genuinely functional log viewer
- Settings: small but real
- Wallboard: real and usable
- Works: presentationally complete but inventory-backed
- Yots: presentationally complete but inventory-backed
- Stows: mixed live and mock
- Shots: routed placeholder with companion design work
- Crets: mock UI only

### What We Almost Have

- Works with real network collectors
- Yots with live Zigbee2MQTT or MQTT data
- Stows driven by real `inventory/stows.yaml` plus measured cache/share data
- Shots integrated into the main app using existing backup summary concepts
- Wapps hardened with better container matching and clearer data provenance
- Hosts save flow with better feedback and stronger laptop drilldowns

### What Is Mock Or Placeholder

- Crets data model and source
- most of Stows beyond disk breakdown
- Shots page body
- backup status beyond static summary inventory
- network, IoT, and backup statuses where they are only YAML values

## Recommended Next Decision Sequence

1. Decide which currently visible pages must be fully truthful before the next roadmap phase.
2. Decide whether pure mocks like Crets should remain visible.
3. Decide whether mixed pages like Stows should be trimmed back or wired properly.
4. Decide whether inventory-backed pages like Works and Yots are acceptable as phase-zero operational placeholders or should be upgraded now.

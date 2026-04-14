# Shost Consolidated Backlog

**Document Version:** 1.0.0
**Last Updated:** 2026-04-07

## Purpose

This file consolidates:
- `ROADMAP.md`
- `PHASE-PLANS.md`
- `SHOTS_RUNNER_PLAN.md`
- `SYSOPS_CODEX_SUGGESTED_ROADMAP_ITEMS.md`

It is intentionally opinionated.

Items are grouped by practical next-step status rather than by their original document.

## Status Key

- `Keep / Done`: implemented enough to keep and harden instead of replanning
- `Next`: strong near-term candidates because they improve truthfulness or operator value
- `Later`: valid follow-up work after the next stabilization pass
- `Idea Bank`: worthwhile concepts that should not drive current execution yet

## Keep / Done

These items are already real enough that they should move into a hardening workflow, not remain in roadmap limbo.

- Hosts live metrics for laptop and CM4
- Host detail modal
- Host tags and filtering
- Host CPU/RAM/disk drilldowns
- Wapps page with service inventory
- Wapps live container status
- Wapps health checks
- Wapps grouping by host/category
- Wapps links and service actions
- Service down and recovery notifications
- Yots page shell with grouping and low-battery filtering
- Tracs log viewing with service selection, tail depth, filtering, search, and refresh
- Shots jobs UI, schedules, retention, notifications, and run history
- CM4 remote-runner path for Shots
- Crets metadata inventory, scope filtering, and rotation status
- Settings theme toggle
- Wallboard page

## Next

These are the best near-term backlog items after comparing the plans against the current repo.

### 1. Truthfulness Pass

- Make Overview explicitly label live vs inventory-backed domains
- Make Wallboard counts honest about mixed provenance
- Decide whether Works remains visible as inventory-backed or gets upgraded now
- Decide whether Stows mock sections stay visible before being wired properly
- Decide whether Crets needs editability soon or should remain metadata-only

### 2. Docs And Planning Hygiene

- Reconcile `ROADMAP.md` with the current implemented feature set
- Reconcile `PHASE-PLANS.md` with implemented Wapps, Shots, Tracs, and Crets work
- Keep `CURRENT_STATE_INVENTORY.md` as the reality-check source
- Use this consolidated backlog as the single review surface for reprioritization

### 3. Hosts Hardening

- External laptop thermal probe calibration
- Host warning thresholds for heat and resource pressure
- Stronger host save feedback

### 4. Wapps Hardening

- Improve container matching beyond loose name heuristics
- Surface image/version details
- Make provenance clearer between health-check status and container status
- Populate service tags more completely in `inventory/services.yaml`

### 5. Works: First Real Observability Pass

- Ping/reachability checks
- Cloudflare tunnel status
- Tailscale status
- DNS resolution checks

This is the cleanest candidate for turning an inventory page into a real operational page.

### 6. Stows: Remove Mock Debt

- Wire `inventory/stows.yaml` into the page
- Replace hard-coded share/cache sections with real or inventory-backed data
- Add cleaner disk and mount presentation

### 7. Shots Operational Maturity

- Clarify the long-term laptop execution path
- Improve path validation and job feedback
- Add restore-confidence indicators
- Add backup freshness / overdue surfacing outside the Shots page

### 8. Secrets Security Hardening

- Stop returning stored notification secrets to the frontend
- Encrypt notification credentials at rest or move them to env or external secret storage
- Distinguish secret metadata inventory from live secret material in both code and UX
- Audit repo and deployment flows for accidental secret persistence and add explicit verification steps

## Later

Valid work, but not the best next move until the current surface is more honest and hardened.

### Yots Expansion

- Direct Zigbee2MQTT integration
- MQTT broker/client telemetry
- Better live last-seen semantics
- Device count and richer hub health

### Works Expansion

- Router/switch telemetry beyond reachability
- SSH posture visibility
- access-path exposure classes
- remote access decision aids

### Crets Expansion

- richer secret ownership/dependency mapping
- overdue rotation alerting
- duplicate/missing-reference detection
- external store sync or import workflow

### Dashboard And Wallboard

- KPI strip
- surfaced anomalies
- success summaries
- suggested actions
- wallboard auto-rotation

### Integrations

- OpenRouter status and usage
- ntfy history and management
- n8n workflow visibility
- deeper Home Assistant visibility beyond Yots
- MQTT topic browser / inspector

### Alerting

- alert rules
- alert history
- acknowledgment workflow
- escalation behavior

### Testing And Technical Debt

- stronger unit coverage
- E2E coverage
- performance monitoring
- build optimization
- selective caching

## Idea Bank

These came mostly from the staging roadmap ideas and should remain ideas until they solve a concrete problem in the current product.

- explicit network modes such as home, travel, private, remote-admin
- access-path posture and exposure classes
- SSH posture reporting
- safe-admin friction reporting
- recurring safety jobs as a product surface
- RSS highlights for operational feeds
- NAS-like storage visibility beyond current Stows needs
- visual topology / flow diagram
- multi-host expansion beyond laptop and CM4

## Recommended Forward Path

### Phase A: Baseline Truthfulness

- update the roadmap docs to reflect what is already real
- make Overview, Wallboard, Stows, Works, and Crets honest about their current data sources
- stop treating implemented features as future roadmap items

### Phase B: Harden The Real Pages

- Hosts thresholds and thermal calibration
- Wapps matching/provenance improvements
- Shots execution-path clarity and restore confidence
- Tracs host-awareness and UX polish

### Phase C: Upgrade One Inventory Domain

Choose one:
- `Works` if you want network and access posture to become operational next
- `Stows` if storage pressure and cleanup are the most pressing homelab pain
- `Yots` if live IoT observability is the next most useful signal

My recommendation is `Works` first because it has high operator value and a relatively contained scope.

## Working Rule

When an item is implemented enough to be user-visible and operational, remove it from future-phase language and move it into:
- current-state inventory
- changelog
- hardening backlog

# Shost Roadmap

**Document Version:** 4.1.0
**Last Updated:** 2026-04-07

## Purpose

This is the canonical roadmap for Shost.

It contains:
- only remaining work
- structured backlog metadata
- rough effort and benefit estimates
- a draft 10-sprint execution model

Implemented features are intentionally excluded from the backlog.

If a feature is partially implemented, the backlog describes only the remaining work.

## Active Planning Pair

Use these files together:
- `CURRENT_STATE_INVENTORY.md` for what is real now
- `ROADMAP.md` for what remains

Superseded planning inputs live in `ARCHIVE/docs/prio/`.

## Metadata Model

Each roadmap item includes:

- `Screen`: the top-level screen or feature area it primarily belongs to
- `Type`: one or more of `user`, `security`, `admin-dev`
- `Category`: primary work bucket such as `truthfulness`, `observability`, `ux`, `integration`, `testing`
- `Tags`: additional grouping labels
- `Effort`: rough story-point estimate using `2`, `3`, `5`, `8`
- `Benefit`: `low`, `medium`, `high`
- `subfeature`: whether the item is a smaller part of a larger feature area
- `parent`: the larger feature or epic it belongs to when `subfeature=true`
- `partial_followup`: whether this item is follow-up work on an already partially implemented feature
- `mobile_related`: whether the work should explicitly consider phone or small-screen behavior
- `security_relevant`: whether the work materially affects risk posture
- `developer_leverage`: whether the work primarily improves development or maintenance efficiency

## Estimation Assumptions

Effort scale:
- `2`: very small
- `3`: small
- `5`: medium
- `8`: large

Estimated total roadmap effort: `159`

Draft sprint target: about `15` effort per sprint across `10` sprints.

This is intentionally rough. Sprint grouping is optimized for thematic focus, not perfect arithmetic.

## Backlog

### Cross-Cutting Planning And UX

- `PLN-01` Keep roadmap and current-state docs aligned
  - `Screen`: `Planning / Repo`
  - `Type`: `admin-dev`
  - `Category`: `planning`
  - `Tags`: `docs`, `governance`, `roadmap`
  - `Effort`: `2`
  - `Benefit`: `medium`
  - `subfeature`: `false`
  - `parent`: `none`
  - `partial_followup`: `true`
  - `mobile_related`: `false`
  - `security_relevant`: `false`
  - `developer_leverage`: `true`

- `MOB-01` Establish mobile friendliness baseline across the product
  - `Screen`: `Cross-cutting`
  - `Type`: `user`, `admin-dev`
  - `Category`: `ux`
  - `Tags`: `mobile`, `responsive`, `layout`, `navigation`
  - `Effort`: `5`
  - `Benefit`: `high`
  - `subfeature`: `false`
  - `parent`: `none`
  - `partial_followup`: `false`
  - `mobile_related`: `true`
  - `security_relevant`: `false`
  - `developer_leverage`: `true`

### Overview + Wallboard Initiative

- `SUM-01` Build the shared summary-surface foundation for Overview and Wallboard
  - `Screen`: `Overview`, `Wallboard`
  - `Type`: `user`, `admin-dev`
  - `Category`: `dashboard`
  - `Tags`: `summary-surface`, `shared-model`, `provenance`, `wallboard`
  - `Effort`: `5`
  - `Benefit`: `high`
  - `subfeature`: `false`
  - `parent`: `none`
  - `partial_followup`: `true`
  - `mobile_related`: `true`
  - `security_relevant`: `false`
  - `developer_leverage`: `true`

- `OVR-01` Make Overview honest about live vs inventory-backed domains
  - `Screen`: `Overview`
  - `Type`: `user`
  - `Category`: `truthfulness`
  - `Tags`: `dashboard`, `provenance`, `kpi`, `summary`
  - `Effort`: `3`
  - `Benefit`: `high`
  - `subfeature`: `true`
  - `parent`: `SUM-01`
  - `partial_followup`: `true`
  - `mobile_related`: `true`
  - `security_relevant`: `false`
  - `developer_leverage`: `false`

- `OVR-02` Add KPI strip to Overview
  - `Screen`: `Overview`
  - `Type`: `user`
  - `Category`: `dashboard`
  - `Tags`: `kpi`, `summary`, `health`, `dashboard`
  - `Effort`: `3`
  - `Benefit`: `high`
  - `subfeature`: `true`
  - `parent`: `SUM-01`
  - `partial_followup`: `false`
  - `mobile_related`: `true`
  - `security_relevant`: `false`
  - `developer_leverage`: `false`

- `OVR-03` Add persistent state indicators to Overview
  - `Screen`: `Overview`
  - `Type`: `user`
  - `Category`: `dashboard`
  - `Tags`: `state-indicators`, `connectivity`, `status`, `summary`
  - `Effort`: `3`
  - `Benefit`: `high`
  - `subfeature`: `true`
  - `parent`: `SUM-01`
  - `partial_followup`: `false`
  - `mobile_related`: `true`
  - `security_relevant`: `true`
  - `developer_leverage`: `false`

- `OVR-04` Add surfaced issues, successes, and suggested actions to Overview
  - `Screen`: `Overview`
  - `Type`: `user`
  - `Category`: `dashboard`
  - `Tags`: `anomalies`, `successes`, `actions`, `summary`
  - `Effort`: `5`
  - `Benefit`: `high`
  - `subfeature`: `true`
  - `parent`: `SUM-01`
  - `partial_followup`: `false`
  - `mobile_related`: `true`
  - `security_relevant`: `false`
  - `developer_leverage`: `false`

- `OVR-05` Add curated RSS or external signal highlights to Overview
  - `Screen`: `Overview`
  - `Type`: `user`
  - `Category`: `integration`
  - `Tags`: `rss`, `news`, `external-signals`, `summary`
  - `Effort`: `5`
  - `Benefit`: `medium`
  - `subfeature`: `true`
  - `parent`: `SUM-01`
  - `partial_followup`: `false`
  - `mobile_related`: `true`
  - `security_relevant`: `false`
  - `developer_leverage`: `false`

- `OVR-06` Add integration-health state indicators and surfaced auth failures to Overview
  - `Screen`: `Overview`, `Wapps`
  - `Type`: `user`, `security`
  - `Category`: `observability`
  - `Tags`: `integrations`, `auth-health`, `state-indicators`, `surfaced-items`, `multi-scrobbler`, `ytmusic`
  - `Effort`: `5`
  - `Benefit`: `high`
  - `subfeature`: `true`
  - `parent`: `SUM-01`
  - `partial_followup`: `false`
  - `mobile_related`: `true`
  - `security_relevant`: `true`
  - `developer_leverage`: `false`

- `OVR-07` Add custom notifications control surface for non-feature-specific operational alerts
  - `Screen`: `Overview`, `Settings`
  - `Type`: `user`, `admin-dev`
  - `Category`: `integration`
  - `Tags`: `notifications`, `custom-notifications`, `ntfy`, `smtp`, `browser`, `alert-routing`
  - `Effort`: `5`
  - `Benefit`: `high`
  - `subfeature`: `true`
  - `parent`: `SUM-01`
  - `partial_followup`: `false`
  - `mobile_related`: `true`
  - `security_relevant`: `true`
  - `developer_leverage`: `true`

- `WLB-01` Turn Wallboard into a trustworthy castable summary surface
  - `Screen`: `Wallboard`
  - `Type`: `user`
  - `Category`: `dashboard`
  - `Tags`: `wallboard`, `casting`, `summary`, `truthfulness`
  - `Effort`: `5`
  - `Benefit`: `high`
  - `subfeature`: `true`
  - `parent`: `SUM-01`
  - `partial_followup`: `true`
  - `mobile_related`: `false`
  - `security_relevant`: `false`
  - `developer_leverage`: `false`

- `WLB-02` Add wallboard auto-rotation and playlist behavior
  - `Screen`: `Wallboard`
  - `Type`: `user`
  - `Category`: `ux`
  - `Tags`: `wallboard`, `rotation`, `playlist`, `casting`
  - `Effort`: `2`
  - `Benefit`: `medium`
  - `subfeature`: `true`
  - `parent`: `WLB-01`
  - `partial_followup`: `false`
  - `mobile_related`: `false`
  - `security_relevant`: `false`
  - `developer_leverage`: `false`

- `WLB-03` Add Chromecast-oriented wallboard session and remote-control hooks
  - `Screen`: `Wallboard`
  - `Type`: `user`, `admin-dev`
  - `Category`: `integration`
  - `Tags`: `chromecast`, `casting`, `remote-control`, `playlist`
  - `Effort`: `5`
  - `Benefit`: `medium`
  - `subfeature`: `true`
  - `parent`: `SUM-01`
  - `partial_followup`: `false`
  - `mobile_related`: `false`
  - `security_relevant`: `false`
  - `developer_leverage`: `true`

- `WLB-04` Explore lightweight external controller support for wallboard navigation
  - `Screen`: `Wallboard`
  - `Type`: `user`, `admin-dev`
  - `Category`: `integration`
  - `Tags`: `esp32`, `controller`, `remote-control`, `hardware-spike`
  - `Effort`: `3`
  - `Benefit`: `medium`
  - `subfeature`: `true`
  - `parent`: `SUM-01`
  - `partial_followup`: `false`
  - `mobile_related`: `false`
  - `security_relevant`: `false`
  - `developer_leverage`: `true`

### Hosts

- `HST-01` Calibrate thermal readings and add host warning thresholds
  - `Screen`: `Hosts`
  - `Type`: `user`
  - `Category`: `observability`
  - `Tags`: `thermal`, `thresholds`, `health`, `alerts`
  - `Effort`: `5`
  - `Benefit`: `high`
  - `subfeature`: `false`
  - `parent`: `none`
  - `partial_followup`: `true`
  - `mobile_related`: `true`
  - `security_relevant`: `false`
  - `developer_leverage`: `false`

- `HST-02` Improve feedback after host metadata edits
  - `Screen`: `Hosts`
  - `Type`: `user`
  - `Category`: `ux`
  - `Tags`: `forms`, `save-feedback`, `editing`
  - `Effort`: `2`
  - `Benefit`: `medium`
  - `subfeature`: `true`
  - `parent`: `Hosts polish`
  - `partial_followup`: `true`
  - `mobile_related`: `true`
  - `security_relevant`: `false`
  - `developer_leverage`: `false`

### Wapps

- `WAP-01` Improve container matching and status provenance
  - `Screen`: `Wapps`
  - `Type`: `user`
  - `Category`: `observability`
  - `Tags`: `containers`, `health`, `matching`, `provenance`
  - `Effort`: `5`
  - `Benefit`: `high`
  - `subfeature`: `false`
  - `parent`: `none`
  - `partial_followup`: `true`
  - `mobile_related`: `true`
  - `security_relevant`: `false`
  - `developer_leverage`: `false`

- `WAP-02` Enrich Wapps cards with tags, image details, and better action feedback
  - `Screen`: `Wapps`
  - `Type`: `user`
  - `Category`: `ux`
  - `Tags`: `service-tags`, `images`, `actions`, `cards`
  - `Effort`: `3`
  - `Benefit`: `medium`
  - `subfeature`: `true`
  - `parent`: `Wapps hardening`
  - `partial_followup`: `true`
  - `mobile_related`: `true`
  - `security_relevant`: `false`
  - `developer_leverage`: `false`

- `WAP-03` Add service integration detail cards for app-level auth and upstream source health
  - `Screen`: `Wapps`
  - `Type`: `user`, `security`
  - `Category`: `observability`
  - `Tags`: `integrations`, `service-details`, `auth`, `upstream-health`, `multi-scrobbler`, `ytmusic`
  - `Effort`: `3`
  - `Benefit`: `medium`
  - `subfeature`: `true`
  - `parent`: `Wapps hardening`
  - `partial_followup`: `false`
  - `mobile_related`: `true`
  - `security_relevant`: `true`
  - `developer_leverage`: `false`

### Works

- `WRK-01` Add live reachability checks for network devices and access paths
  - `Screen`: `Works`
  - `Type`: `user`
  - `Category`: `observability`
  - `Tags`: `network`, `ping`, `reachability`
  - `Effort`: `3`
  - `Benefit`: `high`
  - `subfeature`: `false`
  - `parent`: `none`
  - `partial_followup`: `false`
  - `mobile_related`: `true`
  - `security_relevant`: `true`
  - `developer_leverage`: `false`

- `WRK-02` Add Cloudflare, Tailscale, and DNS operational status
  - `Screen`: `Works`
  - `Type`: `user`, `security`
  - `Category`: `observability`
  - `Tags`: `cloudflare`, `tailscale`, `dns`, `status`
  - `Effort`: `5`
  - `Benefit`: `high`
  - `subfeature`: `true`
  - `parent`: `Works observability`
  - `partial_followup`: `false`
  - `mobile_related`: `true`
  - `security_relevant`: `true`
  - `developer_leverage`: `false`

- `WRK-03` Add service exposure classes and access posture guidance
  - `Screen`: `Works`
  - `Type`: `user`, `security`
  - `Category`: `security`
  - `Tags`: `exposure`, `access`, `posture`, `network-modes`
  - `Effort`: `5`
  - `Benefit`: `high`
  - `subfeature`: `true`
  - `parent`: `Works observability`
  - `partial_followup`: `false`
  - `mobile_related`: `true`
  - `security_relevant`: `true`
  - `developer_leverage`: `false`

### Yots

- `YOT-01` Improve live presence, last-seen semantics, and hub health
  - `Screen`: `Yots`
  - `Type`: `user`
  - `Category`: `observability`
  - `Tags`: `iot`, `presence`, `last-seen`, `hub-health`
  - `Effort`: `5`
  - `Benefit`: `medium`
  - `subfeature`: `false`
  - `parent`: `none`
  - `partial_followup`: `true`
  - `mobile_related`: `true`
  - `security_relevant`: `false`
  - `developer_leverage`: `false`

- `YOT-02` Add explicit MQTT broker visibility to Yots
  - `Screen`: `Yots`
  - `Type`: `user`
  - `Category`: `integration`
  - `Tags`: `mqtt`, `broker`, `status`, `iot`
  - `Effort`: `3`
  - `Benefit`: `medium`
  - `subfeature`: `true`
  - `parent`: `Yots live-data maturity`
  - `partial_followup`: `true`
  - `mobile_related`: `true`
  - `security_relevant`: `false`
  - `developer_leverage`: `false`

- `YOT-03` Add a direct Zigbee2MQTT path when Home Assistant is not sufficient
  - `Screen`: `Yots`
  - `Type`: `user`, `admin-dev`
  - `Category`: `integration`
  - `Tags`: `zigbee2mqtt`, `fallback`, `collector`, `iot`
  - `Effort`: `5`
  - `Benefit`: `medium`
  - `subfeature`: `true`
  - `parent`: `Yots live-data maturity`
  - `partial_followup`: `false`
  - `mobile_related`: `false`
  - `security_relevant`: `false`
  - `developer_leverage`: `true`

### Stows

- `STW-01` Replace hard-coded Stows sections with inventory-backed structure
  - `Screen`: `Stows`
  - `Type`: `user`
  - `Category`: `truthfulness`
  - `Tags`: `storage`, `inventory`, `shares`, `cleanup`
  - `Effort`: `5`
  - `Benefit`: `high`
  - `subfeature`: `false`
  - `parent`: `none`
  - `partial_followup`: `true`
  - `mobile_related`: `true`
  - `security_relevant`: `false`
  - `developer_leverage`: `false`

- `STW-02` Add directory-size breakdown and measured cache analysis
  - `Screen`: `Stows`
  - `Type`: `user`
  - `Category`: `observability`
  - `Tags`: `storage`, `cache`, `directory-size`, `cleanup`
  - `Effort`: `5`
  - `Benefit`: `medium`
  - `subfeature`: `true`
  - `parent`: `Stows operationalization`
  - `partial_followup`: `false`
  - `mobile_related`: `true`
  - `security_relevant`: `false`
  - `developer_leverage`: `false`

### Shots

- `SHT-01` Finalize the laptop host-runner foundation
  - `Screen`: `Shots`
  - `Type`: `user`, `admin-dev`, `security`
  - `Category`: `architecture`
  - `Tags`: `shots-runner`, `host-runner`, `laptop`, `backup`
  - `Effort`: `8`
  - `Benefit`: `high`
  - `subfeature`: `false`
  - `parent`: `none`
  - `partial_followup`: `true`
  - `mobile_related`: `false`
  - `security_relevant`: `true`
  - `developer_leverage`: `true`

- `SHT-02` Route scheduled and helper-driven runs cleanly through the runner model
  - `Screen`: `Shots`
  - `Type`: `user`, `admin-dev`
  - `Category`: `architecture`
  - `Tags`: `scheduler`, `execution-mode`, `host-runner`, `backup`
  - `Effort`: `5`
  - `Benefit`: `high`
  - `subfeature`: `true`
  - `parent`: `SHT-01`
  - `partial_followup`: `true`
  - `mobile_related`: `false`
  - `security_relevant`: `true`
  - `developer_leverage`: `true`

- `SHT-03` Add path validation, richer failures, and better run logging UX
  - `Screen`: `Shots`
  - `Type`: `user`, `admin-dev`
  - `Category`: `ux`
  - `Tags`: `validation`, `errors`, `logs`, `backup`
  - `Effort`: `5`
  - `Benefit`: `high`
  - `subfeature`: `true`
  - `parent`: `Shots operational maturity`
  - `partial_followup`: `true`
  - `mobile_related`: `true`
  - `security_relevant`: `true`
  - `developer_leverage`: `true`

- `SHT-04` Add restore-confidence and backup-freshness signals
  - `Screen`: `Shots`, `Overview`
  - `Type`: `user`
  - `Category`: `observability`
  - `Tags`: `restore`, `freshness`, `backup`, `summary`
  - `Effort`: `3`
  - `Benefit`: `high`
  - `subfeature`: `true`
  - `parent`: `Shots operational maturity`
  - `partial_followup`: `false`
  - `mobile_related`: `true`
  - `security_relevant`: `false`
  - `developer_leverage`: `false`

### Tracs

- `TRC-01` Add host-awareness and time-range filtering to Tracs
  - `Screen`: `Tracs`
  - `Type`: `user`
  - `Category`: `observability`
  - `Tags`: `logs`, `host-context`, `time-range`, `filtering`
  - `Effort`: `3`
  - `Benefit`: `medium`
  - `subfeature`: `false`
  - `parent`: `none`
  - `partial_followup`: `true`
  - `mobile_related`: `true`
  - `security_relevant`: `false`
  - `developer_leverage`: `false`

### Crets

- `CRT-01` Add secret ownership and dependency mapping
  - `Screen`: `Crets`
  - `Type`: `user`, `security`
  - `Category`: `security`
  - `Tags`: `secrets`, `ownership`, `dependencies`, `inventory`
  - `Effort`: `3`
  - `Benefit`: `medium`
  - `subfeature`: `false`
  - `parent`: `none`
  - `partial_followup`: `true`
  - `mobile_related`: `true`
  - `security_relevant`: `true`
  - `developer_leverage`: `false`

- `CRT-02` Add rotation alerts and missing or duplicate secret detection
  - `Screen`: `Crets`
  - `Type`: `user`, `security`
  - `Category`: `security`
  - `Tags`: `rotation`, `alerts`, `missing`, `duplicates`
  - `Effort`: `5`
  - `Benefit`: `high`
  - `subfeature`: `true`
  - `parent`: `Crets maturity`
  - `partial_followup`: `true`
  - `mobile_related`: `true`
  - `security_relevant`: `true`
  - `developer_leverage`: `false`

### Integrations

- `HA-01` Expand Home Assistant visibility beyond the Yots slice
  - `Screen`: `Integrations / Overview`
  - `Type`: `user`
  - `Category`: `integration`
  - `Tags`: `home-assistant`, `entities`, `automations`, `energy`
  - `Effort`: `3`
  - `Benefit`: `medium`
  - `subfeature`: `false`
  - `parent`: `none`
  - `partial_followup`: `false`
  - `mobile_related`: `true`
  - `security_relevant`: `false`
  - `developer_leverage`: `false`

- `MQT-01` Add MQTT topic browser and inspector
  - `Screen`: `Integrations / Yots`
  - `Type`: `user`, `admin-dev`
  - `Category`: `integration`
  - `Tags`: `mqtt`, `topics`, `inspector`, `debugging`
  - `Effort`: `5`
  - `Benefit`: `medium`
  - `subfeature`: `false`
  - `parent`: `none`
  - `partial_followup`: `false`
  - `mobile_related`: `false`
  - `security_relevant`: `false`
  - `developer_leverage`: `true`

- `NTF-01` Add ntfy history and routing visibility
  - `Screen`: `Integrations / Notifications`
  - `Type`: `user`, `admin-dev`
  - `Category`: `integration`
  - `Tags`: `ntfy`, `notifications`, `history`, `routing`
  - `Effort`: `3`
  - `Benefit`: `medium`
  - `subfeature`: `false`
  - `parent`: `none`
  - `partial_followup`: `false`
  - `mobile_related`: `true`
  - `security_relevant`: `false`
  - `developer_leverage`: `true`

- `N8N-01` Add lightweight n8n workflow visibility
  - `Screen`: `Integrations`
  - `Type`: `user`
  - `Category`: `integration`
  - `Tags`: `n8n`, `workflow`, `automation`, `status`
  - `Effort`: `3`
  - `Benefit`: `medium`
  - `subfeature`: `false`
  - `parent`: `none`
  - `partial_followup`: `false`
  - `mobile_related`: `true`
  - `security_relevant`: `false`
  - `developer_leverage`: `false`

- `OPR-01` Add lightweight OpenRouter usage and status visibility
  - `Screen`: `Integrations`
  - `Type`: `user`
  - `Category`: `integration`
  - `Tags`: `openrouter`, `usage`, `cost`, `status`
  - `Effort`: `3`
  - `Benefit`: `low`
  - `subfeature`: `false`
  - `parent`: `none`
  - `partial_followup`: `false`
  - `mobile_related`: `true`
  - `security_relevant`: `false`
  - `developer_leverage`: `false`

### Alerting

- `ALT-01` Build the alert-rule foundation on top of real signals
  - `Screen`: `Overview`, `Notifications`
  - `Type`: `user`, `security`, `admin-dev`
  - `Category`: `alerting`
  - `Tags`: `alerts`, `rules`, `notifications`, `engine`
  - `Effort`: `8`
  - `Benefit`: `high`
  - `subfeature`: `false`
  - `parent`: `none`
  - `partial_followup`: `false`
  - `mobile_related`: `true`
  - `security_relevant`: `true`
  - `developer_leverage`: `true`

- `ALT-02` Add alert history, acknowledgment, and escalation behavior
  - `Screen`: `Overview`, `Notifications`
  - `Type`: `user`, `security`
  - `Category`: `alerting`
  - `Tags`: `alerts`, `history`, `ack`, `escalation`
  - `Effort`: `5`
  - `Benefit`: `high`
  - `subfeature`: `true`
  - `parent`: `ALT-01`
  - `partial_followup`: `false`
  - `mobile_related`: `true`
  - `security_relevant`: `true`
  - `developer_leverage`: `false`

### Engineering

- `TST-01` Add critical-path tests for collectors and core flows
  - `Screen`: `Cross-cutting`
  - `Type`: `admin-dev`
  - `Category`: `testing`
  - `Tags`: `tests`, `collectors`, `regression`, `verification`
  - `Effort`: `5`
  - `Benefit`: `high`
  - `subfeature`: `false`
  - `parent`: `none`
  - `partial_followup`: `false`
  - `mobile_related`: `false`
  - `security_relevant`: `false`
  - `developer_leverage`: `true`

- `ENG-01` Improve build, performance monitoring, and selective caching
  - `Screen`: `Cross-cutting`
  - `Type`: `admin-dev`
  - `Category`: `performance`
  - `Tags`: `build`, `performance`, `monitoring`, `caching`
  - `Effort`: `3`
  - `Benefit`: `medium`
  - `subfeature`: `false`
  - `parent`: `none`
  - `partial_followup`: `false`
  - `mobile_related`: `false`
  - `security_relevant`: `false`
  - `developer_leverage`: `true`

- `SEC-01` Add API safety and rate limiting where exposure justifies it
  - `Screen`: `Cross-cutting`
  - `Type`: `security`, `admin-dev`
  - `Category`: `security`
  - `Tags`: `api`, `rate-limiting`, `safety`, `hardening`
  - `Effort`: `3`
  - `Benefit`: `medium`
  - `subfeature`: `false`
  - `parent`: `none`
  - `partial_followup`: `false`
  - `mobile_related`: `false`
  - `security_relevant`: `true`
  - `developer_leverage`: `true`

## Sprint Draft

Target sprint capacity: about `15` effort.

### Sprint 1: Overview + Wallboard Foundation

- `PLN-01`
- `SUM-01`
- `OVR-01`
- `OVR-02`
- `OVR-03`
- `WLB-01`

Sprint effort: `21`

Sprint intent:
- establish the shared summary-surface model
- make the existing Overview and Wallboard truthful
- ship the first KPI and state-indicator pass
- avoid adding rotation, RSS, or hardware control before the summary model is stable

Suggested sprint split:
1. define shared summary data model and provenance rules
2. refactor Overview to use the new model
3. refactor Wallboard to use the same model
4. add KPI strip and state indicators
5. verify castability and layout behavior

Acceptance criteria:
- Overview clearly distinguishes live, inferred, and inventory-backed signals
- Wallboard uses the same summary logic as Overview instead of drifting into a separate truth model
- KPI strip exists and is driven by real current state
- state indicators exist for the most important always-visible conditions
- both screens remain readable at wallboard scale
- both screens are at least workable on smaller browser widths

### Sprint 2: Mobile And Operational Polish

- `MOB-01`
- `HST-01`
- `TRC-01`

Sprint effort: `13`

### Sprint 3: Wapps Hardening

- `WAP-01`
- `WAP-02`
- `SEC-01`
- `TST-01`

Sprint effort: `16`

### Sprint 4: Works Becomes Real

- `WRK-01`
- `WRK-02`
- `WRK-03`

Sprint effort: `13`

### Sprint 5: Stows Operationalization

- `STW-01`
- `STW-02`
- `ENG-01`

Sprint effort: `13`

### Sprint 6: Yots Live-Data Maturity

- `YOT-01`
- `YOT-02`
- `YOT-03`

Sprint effort: `13`

### Sprint 7: Shots Runner Foundation

- `SHT-01`
- `SHT-02`

Sprint effort: `13`

### Sprint 8: Shots Reliability And Crets Maturity

- `SHT-03`
- `SHT-04`
- `CRT-01`
- `CRT-02`

Sprint effort: `16`

### Sprint 9: Integration Visibility

- `HA-01`
- `MQT-01`
- `NTF-01`
- `N8N-01`
- `OPR-01`

Sprint effort: `17`

### Sprint 10: Alerting And Summary Intelligence

- `ALT-01`
- `ALT-02`
- `OVR-04`
- `OVR-05`

Sprint effort: `23`

## Notes On Sequencing

- `Overview` and `Wallboard` are one summary-surface initiative and should share a common truth model.
- `Shots` runner work is partly architectural and partly UX; the runner foundation should land before deeper backup trust signals.
- `Mobile friendliness` is intentionally cross-cutting and will affect multiple screens even if it is scheduled as one dedicated sprint theme.
- `Works`, `Stows`, and `Yots` are the least mature operational pages and should be improved as coherent area-focused efforts rather than scattered one-off fixes.
- `WLB-03` should be treated as optional until the summary-surface foundation is stable.
- `WLB-04` is intentionally a hardware-control spike, not a commitment to build embedded-controller support immediately.

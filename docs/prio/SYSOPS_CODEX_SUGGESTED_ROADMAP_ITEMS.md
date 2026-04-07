# Sysops Codex Suggested Roadmap Items

## Purpose

This document captures Shost-related roadmap ideas from a brainstorming session about
security, remote access, notifications, operator awareness, storage visibility, and
downsized-homelab constraints.

This is intentionally separate from `docs/prio/ROADMAP.md`.

Use this as a staging document:

- review the ideas
- prune or regroup them
- promote selected items into the official roadmap later

## Key Product Framing

Shost should be a low-overhead homelab control surface for a resource-constrained setup.

Current constraints:

- laptop RAM: 16 GB
- CM4 RAM: 4 GB

That means Shost should prefer:

- visibility
- posture summaries
- guided actions
- lightweight integrations

And avoid becoming:

- a VPN engine
- a vault
- a full NAS appliance
- a heavy always-on orchestration layer

## Suggested Main Shost Dashboard Structure

When Shost loads, the main dashboard could be organized into these zones.

### 1. KPI Strip

High-level health and operating metrics.

Examples:

- hosts online / degraded / offline
- RAM pressure by host
- disk pressure by host
- backup success rate
- service health count
- open alert count
- pending updates count
- access posture summary

### 2. State Indicators

Important current states that should stay visible.

Examples:

- Tailscale connected
- NordVPN connected
- Cloudflare tunnel healthy
- firewall enabled
- backup target mounted
- remote-admin mode active
- browser notifications enabled
- ntfy reachable
- email notifications healthy

### 3. Surfaced Items

Attention-grabbing issues, anomalies, and items worth watching.

Examples:

- host nearing RAM exhaustion
- disk nearly full
- backup stale
- failed login burst
- new listening port detected
- tunnel flapping
- secret rotation overdue
- public exposure mismatch

### 4. Successes

Positive confirmations that important operations are working.

Examples:

- nightly backup completed
- certificate renewed successfully
- updates applied cleanly
- host recovered from degraded state
- cleanup job reclaimed storage

### 5. Suggested Actions

Opinionated next steps based on current conditions.

Examples:

- enable travel mode before leaving desk
- rotate a token within 7 days
- move a service off the CM4 due to memory pressure
- switch a service from public to Tailscale-only
- archive old backup outputs

### 6. RSS Highlights

A new concept for curated external signals that are operationally relevant.

Examples:

- Ubuntu security notices
- Tailscale release or incident notes
- Cloudflare incident updates
- Home Assistant release highlights
- selected self-hosting or security feeds

## Notification Expectations

Shost already has notification channels integrated:

- browser notifications
- `ntfy` push notifications
- email via Gmail SMTP

Planned features should account for notification routing from the start.

Each surfaced item or action should be able to support some combination of:

- dashboard only
- browser notification
- `ntfy` push
- email
- push + email

## Suggested Shost Feature Ideas

### Works

#### 1. Explicit Network Modes

Add modes such as:

- `home`
- `travel`
- `private`
- `remote-admin`

Each mode should surface:

- Tailscale state
- NordVPN state
- exit node usage
- public IP / location
- whether local development or remote tooling may be affected

#### 2. Access Path Visibility

Each service should have an exposure class:

- local-only
- LAN-only
- Tailscale-only
- Cloudflare-only
- public

#### 3. Tunnel And Reachability Indicators

Show:

- Tailscale badge
- NordVPN badge
- Cloudflare tunnel badge
- current access path for each service

#### 4. Remote Access Decision Aid

Shost could help clarify when to use:

- Tailscale for admin access and private internal services
- NordVPN for privacy on untrusted networks
- Cloudflare for deliberately published services

#### 5. SSH Posture Visibility

Track or surface:

- key-only vs password auth
- known host aliases
- per-host key usage
- forwarding restrictions
- services that still require public exposure

#### 6. Safe Admin Friction Reporting

Not direct PAM control, but posture visibility such as:

- sudo timeout policy
- whether fingerprint auth exists
- whether a hardware key is configured

### Crets

#### 7. Secret Inventory And Rotation Metadata

Track:

- what secret exists
- where it lives
- which service depends on it
- when it was last rotated
- whether it is still tied to Google or another vendor dependency

#### 8. Secret Alerting

Examples:

- rotation overdue
- missing reference
- duplicate secret ownership
- secret stored in the wrong place

### Shots

#### 9. Recurring Safety Jobs

Surface recurring checks such as:

- pending security updates
- failed SSH login review
- backup freshness
- certificate expiry
- listening-port drift
- firewall or disk-encryption posture checks
- Tailscale health checks

#### 10. Restore Confidence

Show whether restores are actually plausible, not just whether backups exist.

Examples:

- last successful backup
- last sample restore
- source and target paths
- retention coverage
- missing mount warnings

### Stows

#### 11. NAS-Like Visibility

Provide a lightweight storage-management experience around:

- shares
- mounts
- free space
- stale data
- duplicate data
- backup targets
- cleanup recommendations

This should stay visibility-first, not full NAS software.

#### 12. Storage Pressure And Cleanup Guidance

Examples:

- top space consumers
- stale exports
- cold data candidates
- backup target almost full
- suggested cleanup actions

### Tracs

#### 13. Security-Relevant Event Feed

Include operationally useful security events such as:

- repeated auth failures
- service crash loops
- tunnel instability
- backup failures
- disk-near-full warnings
- certificate warnings

### Hosts

#### 14. RAM Budget Awareness

Given the laptop/CM4 memory limits, surface:

- per-host memory pressure
- top memory consumers
- service placement warnings
- do-not-colocate warnings for heavy stacks

#### 15. Resource-Constrained Placement Hints

Examples:

- suggest moving heavy always-on jobs off the CM4
- suggest consolidating services on the laptop only when safe
- warn when a new feature likely requires too much resident overhead

## Cross-Cutting Product Ideas

### 16. Suggested-Action Engine

Turn raw signals into specific recommendations.

Examples:

- switch this service to Tailscale-only
- rotate a secret
- clean up stale backup data
- investigate repeated failed logins
- archive old outputs

### 17. Unified Notification Routing

Support consistent notification routing across:

- browser
- `ntfy`
- email

This should apply to alerts, reminders, successes, and action prompts.

### 18. Success Feed

Make room in the product for successful outcomes, not just failures.

Examples:

- backup succeeded
- service recovered
- cert renewed
- cleanup completed

### 19. Google Exit Tracker

Track categories where the homelab or personal workflow still depends on Google.

Possible categories:

- identity and auth
- email
- docs/files
- photos
- push notifications
- DNS/domain control
- mobile sync

Each could be tagged:

- `keep`
- `hybrid`
- `migrate soon`
- `blocked`

### 20. RSS Highlights

Use RSS as curated operational intelligence, not a generic reader.

Possible feeds:

- distro security notices
- vendor incidents
- self-hosting releases
- security advisories relevant to the stack

## Things That Should Probably Stay Outside Shost

These are still valuable, but they are better as host-level setup or external tools than
direct product features:

- actual sudo policy changes
- PAM / fingerprint setup
- disabling SSH password auth
- SSH key generation and file permissions management
- password manager or vault selection
- actual Tailscale / NordVPN implementation
- full Cloudflare or zero-trust control-plane administration
- full NAS platform deployment

Shost can still surface status, posture, reminders, and action cues for these.

## Good Candidates To Promote Into The Official Roadmap

Strong candidates:

1. Main dashboard redesign around KPI strip, state indicators, surfaced items, successes,
   suggested actions, and RSS highlights
2. Works network modes
3. Works access-path visibility
4. Works tunnel indicators
5. Crets secret inventory and rotation metadata
6. Shots recurring safety-job visibility
7. Stows NAS-like visibility
8. Tracs security-relevant event feed
9. Hosts RAM-budget awareness
10. Unified notification routing across browser, `ntfy`, and email

## Notes For Roadmap Review

When reviewing this with the agent working in `homelab-dashboard`, ask:

- does this belong in Shost directly, or only as integrated visibility?
- does it add operator clarity without adding heavy resident services?
- does it fit the current information architecture?
- does it justify its RAM and complexity cost?

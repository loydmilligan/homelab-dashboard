# Shots V1 Implementation Plan

**Status:** Active
**Last Updated:** 2026-04-04

## Purpose

Turn the `Shots` design into a small, working feature inside `shost` without breaking the current Overview and Wallboard flows.

## Canonical decisions

- Product name stays `Shots`
- UI route stays `/shots`
- Backend API stays `/api/backups/*`
- Runtime backup state moves to SQLite
- `inventory/backups.yaml` remains a compatibility fallback during rollout

## Phase 1

Goal: establish the runtime data model and API surface.

Checklist:

- [x] Create a concrete implementation plan in `shots/`
- [x] Add shared `Shots` backend types
- [x] Add SQLite store for jobs and runs
- [x] Add job CRUD API routes
- [x] Add summary and run-history API routes
- [x] Merge runtime backup summary into `/api/state`
- [x] Keep YAML fallback while the store is empty
- [x] Replace the placeholder `/shots` page with live API-backed data

## Phase 2

Goal: make backup execution real.

Checklist:

- [x] Add path validation helpers and source-root allowlist
- [x] Add manual run-now support
- [x] Add archive creation for path-based jobs
- [x] Write manifest files next to archives
- [x] Record run metrics and failure messages
- [x] Enforce retention after successful runs

## Phase 3

Goal: operationalize the feature.

Checklist:

- [x] Add scheduler for hourly/daily/weekly/cron jobs
- [x] Track next-run state in the runtime store
- [x] Add browser notification hooks
- [ ] Update Overview to use richer backup summary states
- [ ] Update Wallboard to reflect degraded backup posture

## Notes

- Do not add restore UI in v1.
- Do not add a separate backup service/container unless forced by runtime constraints.
- Favor direct filesystem access and low dependency count over large orchestration libraries.
- Notification delivery now lives in an app-wide subsystem; `Shots` is the first producer, not the notification boundary.
- Initial notification channels are `browser`, `ntfy`, and `smtp`.

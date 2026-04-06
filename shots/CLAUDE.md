# Shots — Claude Code Working Instructions

## Purpose

This subproject is the focused work area for implementing the `Shots` backup feature inside `shost`.

`Shots` means:
- the backup feature/module within `shost`
- backup jobs managed by `shost`
- runtime backup state and history shown in the `shost` UI

This is not a separate standalone product.

## Parent project

Parent repo:
- [homelab-dashboard](/home/mmariani/Projects/homelab-dashboard)

Parent workflow/process instructions:
- [CLAUDE.md](/home/mmariani/Projects/homelab-dashboard/CLAUDE.md)

Use the parent `CLAUDE.md` for:
- deployment workflow
- coding standards
- repo structure expectations
- security checks
- general AI coding process

This file exists to define the `Shots` feature specifically.

## What Shots will do

Shots will provide a backup management feature inside `shost` that can:

1. define backup jobs for directories
2. run backups manually or on schedule
3. store backup history and runtime state
4. enforce retention rules
5. notify on important backup events
6. surface backup summary in:
   - `/backups`
   - Overview
   - Wallboard

## What Shots will not do in v1

Do not build these in the first version:
- restore UI
- encryption
- Docker-socket discovery of backup jobs
- hook execution
- CIFS/Samba destination setup UI
- multi-host federation
- AI backup suggestions
- template library
- secret management UI

## Product framing

Shots is a **native `shost` feature**.

Do not build it as:
- a separate app
- a fork of `dockerBU`
- a fully independent backend service

The implementation should feel like a normal part of `shost`:
- same visual style
- same route structure
- same backend API style
- same deployment model

## Existing `shost` integration points

Current relevant files:
- [server/index.ts](/home/mmariani/Projects/homelab-dashboard/server/index.ts)
- [server/collectors/index.ts](/home/mmariani/Projects/homelab-dashboard/server/collectors/index.ts)
- [src/App.tsx](/home/mmariani/Projects/homelab-dashboard/src/App.tsx)
- [src/pages/Overview.tsx](/home/mmariani/Projects/homelab-dashboard/src/pages/Overview.tsx)
- [src/pages/Wallboard.tsx](/home/mmariani/Projects/homelab-dashboard/src/pages/Wallboard.tsx)
- [src/types/inventory.ts](/home/mmariani/Projects/homelab-dashboard/src/types/inventory.ts)
- [inventory/backups.yaml](/home/mmariani/Projects/homelab-dashboard/inventory/backups.yaml)

## Core design direction

### V1 is path-based

Shots should back up arbitrary directories based on job definitions.

Each job should include:
- friendly name
- description
- tags
- source path
- exclude patterns
- max depth
- destination path
- schedule
- retention policy
- notification settings
- enabled flag

### Runtime state belongs in the app, not in YAML

Do not store live backup state in `inventory/backups.yaml`.

Use:
- a small local SQLite database for jobs and runs

Use YAML only if needed for static display metadata or initial compatibility.

### Overview and Wallboard should stay summary-focused

Do not put detailed backup management in the wallboard.

Overview and wallboard should only show:
- healthy job count
- failed job count
- overdue job count
- running job count

Detailed backup management belongs on:
- `/backups`

## Required V1 pages and API

### Frontend

Add:
- `/backups`

Recommended components:
- `BackupList`
- `BackupEditor`
- `BackupRunHistory`
- `BackupSummaryCards`

### Backend

Recommended API:
- `GET /api/backups/jobs`
- `POST /api/backups/jobs`
- `PUT /api/backups/jobs/:id`
- `DELETE /api/backups/jobs/:id`
- `POST /api/backups/jobs/:id/run`
- `GET /api/backups/jobs/:id/runs`
- `GET /api/backups/summary`

## Notification behavior

### V1

Support:
- browser notifications

Events:
- `backup_started`
- `backup_success`
- `backup_failed`
- `backup_upcoming`
- `backup_overdue`

### V2

Add:
- `ntfy`

The model should be designed so `ntfy` can be added without rewriting the jobs model.

## Retention behavior

Retention must support:
- keep most recent `N`
- delete backups older than `X` days

If both are set:
- apply both

Retention enforcement should occur after successful backup completion.

## Path safety requirements

Shots must validate paths.

Do not allow obviously dangerous backup sources like:
- `/`
- `/proc`
- `/sys`
- `/dev`
- `/run`

Prefer an allowlist model for valid source roots.

## Deployment model

Keep the current `shost` deployment shape:
- frontend container
- backend container

Do not add another container/service unless absolutely necessary.

If persistence is needed:
- mount one app data directory into backend

## Recommended implementation order

1. Add data model and SQLite store
2. Add backup job CRUD API
3. Add manual run-now support
4. Add archive creation and retention
5. Add `/backups` page
6. Add Overview summary integration
7. Add Wallboard summary integration
8. Add browser notifications
9. Add `ntfy` later

## Success criteria

The first implementation is successful if:

1. a user can create a backup job in the `shost` UI
2. the job can back up a directory to a chosen destination
3. excludes and max depth work
4. retention works
5. backup run history is visible
6. Overview and Wallboard show backup summary
7. browser notifications work for at least success/failure

## Files in this subproject

Primary design doc:
- [docs/SHOTS_V1_DESIGN.md](/home/mmariani/Projects/homelab-dashboard/shots/docs/SHOTS_V1_DESIGN.md)

Use this directory to hold:
- feature-specific docs
- plans
- implementation notes
- agent coordination artifacts

The actual app code changes should still happen in the parent repo codebase unless there is a specific reason to isolate code differently.


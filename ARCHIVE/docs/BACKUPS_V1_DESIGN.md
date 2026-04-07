# Shots V1 Design

**Project:** Homelab Dashboard (`shost`)
**Document Version:** 1.0.0
**Last Updated:** 2026-04-04

## Purpose

Design a backup management feature that integrates cleanly into the existing `shost` app.

This feature should:
- fit the current `shost` architecture and UI
- start simple
- support real backup execution, status, retention, and notifications
- leave room for more advanced features later

This is intentionally not a full clone of `dockerBU`.

## Context from current `shost`

Current `shost` shape:
- React + TypeScript frontend
- Express + TypeScript backend
- YAML inventory files
- `/api/state` returns merged dashboard state
- current `inventory/backups.yaml` is manual/static
- Overview and Wallboard already display backup summary from that state

Current relevant files:
- [inventory/backups.yaml](/home/mmariani/Projects/homelab-dashboard/inventory/backups.yaml)
- [server/collectors/index.ts](/home/mmariani/Projects/homelab-dashboard/server/collectors/index.ts)
- [src/types/inventory.ts](/home/mmariani/Projects/homelab-dashboard/src/types/inventory.ts)
- [src/pages/Overview.tsx](/home/mmariani/Projects/homelab-dashboard/src/pages/Overview.tsx)
- [src/pages/Wallboard.tsx](/home/mmariani/Projects/homelab-dashboard/src/pages/Wallboard.tsx)

## Product decision

### What to build

Build a **path-based backup manager inside `shost`**.

Each backup job should describe:
- what to back up
- where to write the archives
- when to run
- how to retain old backups
- when to notify

### What not to build in v1

Do not build:
- restore UI
- encryption
- Docker socket-driven container backup discovery
- hook execution
- Samba/CIFS destination setup UI
- multi-host federation
- AI suggestions
- backup templates

## Why not just reuse `dockerBU` directly

`dockerBU` is valuable as reference material, but not as the v1 implementation base.

Reasons:
- it is much broader than the current need
- it is container-centric rather than simple path-centric
- it includes many features that would slow down a clean `shost` integration:
  - restore
  - encryption
  - hooks
  - templates
  - AI suggestions
  - federation

### What to borrow from `dockerBU`

Use these ideas from `dockerBU`:
- schedule model
- notification model
- backup history model
- retention concepts
- naming conventions for status and events

Do not try to embed the entire `dockerBU` backend or frontend into `shost`.

## V1 scope

### Must-have

1. Create/edit/delete backup jobs
2. Back up arbitrary directories
3. Exclude patterns
4. Depth limit
5. Select output path
6. Schedule frequency
7. Retention by count and/or age
8. Tags, friendly name, description
9. Browser notifications
10. Runtime status and history in dashboard UI

### Should-have

1. Manual “run now”
2. Show overdue/upcoming state
3. Last success/failure details
4. Backup size reporting
5. Simple validation that source and destination paths are acceptable

### Later

1. `ntfy` notifications
2. restore support
3. destination health checks
4. backup verification
5. archive browsing

## UX model

### Main views

Add a dedicated `Shots` page.

Recommended route:
- `/shots`

This page should include:

#### 1. Backup Summary Header
- total jobs
- healthy jobs
- overdue jobs
- failed jobs
- jobs running now

#### 2. Jobs Table / Card List

Per job:
- friendly name
- source path
- destination path
- tags
- schedule summary
- retention summary
- last run
- next run
- status
- quick actions

#### 3. Job Detail Drawer or Modal

Show:
- description
- source path
- depth and excludes
- notification settings
- run history
- archive count
- total stored size

#### 4. Create/Edit Form

Fields:
- friendly name
- description
- tags
- source path
- max depth
- exclude patterns
- destination path
- schedule
- retention by count
- retention by age
- notification config
- enabled

### Wallboard and Overview integration

Do not overload the wallboard with job details.

For Overview and Wallboard, expose only:
- total healthy/total jobs
- count of failed jobs
- count of overdue jobs
- count of running jobs

If one backup job is failing, the summary should degrade visibly.

## Data model

### Backup job

```ts
type BackupJob = {
  id: string;
  friendly_name: string;
  description?: string;
  tags: string[];
  source_path: string;
  destination_path: string;
  max_depth?: number | null;
  exclude_patterns: string[];
  schedule: BackupSchedule;
  retention: BackupRetention;
  notifications: BackupNotificationConfig;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};
```

### Schedule

```ts
type BackupSchedule =
  | { type: 'manual' }
  | { type: 'hourly'; minute: number }
  | { type: 'daily'; hour: number; minute: number }
  | { type: 'weekly'; day_of_week: number; hour: number; minute: number }
  | { type: 'cron'; cron_expression: string };
```

### Retention

```ts
type BackupRetention = {
  keep_count?: number | null;
  max_age_days?: number | null;
};
```

### Notification config

```ts
type BackupNotificationConfig = {
  channels: Array<'browser' | 'ntfy'>;
  events: Array<
    | 'backup_started'
    | 'backup_success'
    | 'backup_failed'
    | 'backup_upcoming'
    | 'backup_overdue'
  >;
};
```

### Backup run

```ts
type BackupRun = {
  id: string;
  job_id: string;
  status: 'queued' | 'running' | 'success' | 'failed' | 'warning';
  started_at?: string;
  completed_at?: string;
  archive_path?: string;
  size_bytes?: number;
  file_count?: number;
  error_message?: string;
};
```

### Dashboard-facing backup summary

The current `Backup` type in `src/types/inventory.ts` should evolve.

Suggested compatible shape:

```ts
type BackupSummary = {
  id: string;
  name: string;
  target_id?: string;
  policy?: string;
  status: 'online' | 'offline' | 'degraded' | 'unknown';
  last_success?: string;
  next_scheduled?: string;
  last_failure?: string;
  overdue?: boolean;
  running?: boolean;
};
```

## Storage approach

### Do not store active backup jobs in YAML

Current `inventory/backups.yaml` is okay for static display, but not for a real backup system.

For V1:
- keep inventory YAML for service metadata and display config
- store backup job definitions and run history in a small local database

Recommended storage:
- SQLite

Recommended files:
- `/app/data/backups.db`
- `/app/data/backups/` for archive metadata if needed

Reason:
- jobs and runs are operational state, not static inventory
- editing YAML for every run or status update is wrong for this feature

## Execution model

### Runner approach

Use a small in-process scheduler and worker in the `shost` backend first.

Recommended implementation:
- scheduler inside Express/Node backend process
- one backup worker queue
- one active backup at a time for v1

Reason:
- simpler deployment
- integrates easily with the current backend
- avoids introducing a second service unless needed

### Archive format

Recommended:
- `tar.gz`

Per run:
- create timestamped archive
- create a small JSON manifest alongside it

Suggested layout:

```text
/chosen/destination/
  <job-id>/
    2026-04-04T12-00-00Z.tar.gz
    2026-04-04T12-00-00Z.manifest.json
```

Manifest fields:
- job id
- friendly name
- source path
- destination path
- start/end time
- exclude rules used
- depth rule used
- file count
- archive size
- status

### Retention enforcement

Run retention cleanup after each successful backup:
- delete old backups beyond `keep_count`
- delete old backups older than `max_age_days`

If both are set:
- apply both filters conservatively

## Notifications

### V1

Browser notifications only.

Behavior:
- frontend requests browser notification permission
- backend exposes event stream or pollable notification feed
- UI shows recent backup events

### V2

Add `ntfy` as the first non-browser channel.

Reason:
- aligns with your current homelab direction
- already on the `shost` roadmap

## Clean integration with current `shost` structure

### Frontend additions

Recommended files:
- `src/pages/Shots.tsx`
- `src/components/backups/BackupList.tsx`
- `src/components/backups/BackupEditor.tsx`
- `src/components/backups/BackupRunHistory.tsx`

Update:
- `src/App.tsx` to add `/backups`
- navigation component to include Shots
- `src/types/inventory.ts` with backup job/run types or separate backup types file

### Backend additions

Recommended files:
- `server/backups/store.ts`
- `server/backups/scheduler.ts`
- `server/backups/runner.ts`
- `server/backups/retention.ts`
- `server/backups/notifications.ts`
- `server/routes/backups.ts`

Update:
- `server/index.ts` to register backup routes
- `server/collectors/index.ts` to merge runtime backup summary into `/api/state`

### API surface

Recommended initial endpoints:

- `GET /api/backups/jobs`
- `POST /api/backups/jobs`
- `PUT /api/backups/jobs/:id`
- `DELETE /api/backups/jobs/:id`
- `POST /api/backups/jobs/:id/run`
- `GET /api/backups/jobs/:id/runs`
- `GET /api/backups/summary`

Do not expose restore endpoints in v1.

## Deployment impact

Current deployment is:
- frontend nginx container
- backend container

Recommendation:
- keep the same two-container deployment
- mount one persistent data directory into backend
- mount backup destination path(s) into backend only if needed

Suggested backend additions to compose:
- persistent app data mount for SQLite/job history
- optional configured backup root mount

## Path safety

This matters because the app will back up arbitrary directories.

V1 should include:
- an allowlist of approved source roots
- validation that source paths exist
- validation that destination path is writable
- validation to avoid backing up `/`, `/proc`, `/sys`, `/dev`, and similar dangerous paths

Recommended allowed roots initially:
- `/home/mmariani`
- known mounted backup/archive paths

## Migration path from current manual backups inventory

### Current state

`inventory/backups.yaml` is static/manual.

### Proposed transition

Phase 1:
- keep current `backups.yaml` for display compatibility
- backend generates runtime backup summaries
- `/api/state` uses runtime summaries instead of only static YAML

Phase 2:
- reduce `backups.yaml` to optional display metadata only

Do not force all backup job definitions into YAML.

## Implementation phases

### Phase A: Runtime foundation

Build:
- SQLite store
- backup job CRUD
- manual run-now
- archive creation
- run history
- retention enforcement
- `/api/backups/*`

### Phase B: UI integration

Build:
- `/backups` page
- create/edit form
- job list
- run history
- Overview backup summary driven by runtime state

### Phase C: Notifications

Build:
- browser notification support
- overdue and failure states

### Phase D: `ntfy`

Build:
- `ntfy` channel config
- event routing

## Acceptance criteria

1. `shost` has a real `/backups` page.
2. Backup jobs can be created and edited without touching YAML.
3. A backup job can back up a directory to a chosen destination.
4. Excludes and max depth are respected.
5. Retention can be configured by count and age.
6. Overview and Wallboard show backup summary from runtime state.
7. Browser notifications work for at least success and failure.
8. Design leaves a clean path for `ntfy` without redesigning the model.

## Recommendation to the implementing agent

When working inside this repo:
- treat this as a native `shost` feature
- do not try to vendor `dockerBU`
- borrow only concepts and naming where useful
- preserve current Overview and Wallboard semantics
- add runtime backup state cleanly to `/api/state`
- prefer a small, understandable first implementation over a “complete backup platform”

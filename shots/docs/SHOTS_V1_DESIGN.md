# Shots V1 Design

**Project:** Homelab Dashboard (`shost`)
**Subproject:** Shots
**Document Version:** 1.0.0
**Last Updated:** 2026-04-04

## Purpose

Design the first version of `Shots`, the backup subsystem built into `shost`.

`Shots` should:
- integrate cleanly into the current `shost` UI and backend
- provide real backup job management
- support runtime backup progress and history
- support retention and notifications
- keep the first implementation small and understandable

## Current `shost` context

`shost` already has:
- React frontend
- Express backend
- `inventory/backups.yaml`
- Overview and Wallboard backup summaries
- a roadmap entry for backup monitoring

Relevant current files:
- [src/App.tsx](/home/mmariani/Projects/homelab-dashboard/src/App.tsx)
- [src/pages/Overview.tsx](/home/mmariani/Projects/homelab-dashboard/src/pages/Overview.tsx)
- [src/pages/Wallboard.tsx](/home/mmariani/Projects/homelab-dashboard/src/pages/Wallboard.tsx)
- [server/index.ts](/home/mmariani/Projects/homelab-dashboard/server/index.ts)
- [server/collectors/index.ts](/home/mmariani/Projects/homelab-dashboard/server/collectors/index.ts)
- [src/types/inventory.ts](/home/mmariani/Projects/homelab-dashboard/src/types/inventory.ts)
- [inventory/backups.yaml](/home/mmariani/Projects/homelab-dashboard/inventory/backups.yaml)

## Product decision

Build `Shots` as a **path-based backup manager**.

Do not build a full Docker backup platform in v1.

This means the first user workflow is:
- pick a source directory
- define backup behavior
- choose destination
- set schedule and retention
- view status and history

## V1 object model

### Backup job

```ts
type ShotJob = {
  id: string;
  friendly_name: string;
  description?: string;
  tags: string[];
  source_path: string;
  destination_path: string;
  max_depth?: number | null;
  exclude_patterns: string[];
  schedule: ShotSchedule;
  retention: ShotRetention;
  notifications: ShotNotificationConfig;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};
```

### Schedule

```ts
type ShotSchedule =
  | { type: 'manual' }
  | { type: 'hourly'; minute: number }
  | { type: 'daily'; hour: number; minute: number }
  | { type: 'weekly'; day_of_week: number; hour: number; minute: number }
  | { type: 'cron'; cron_expression: string };
```

### Retention

```ts
type ShotRetention = {
  keep_count?: number | null;
  max_age_days?: number | null;
};
```

### Notifications

```ts
type ShotNotificationConfig = {
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
type ShotRun = {
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

## Storage model

### Runtime database

Use SQLite for:
- backup jobs
- backup runs
- next-run state
- notification config

Suggested backend data path:
- `/app/data/shots.db`

### Archive output

Use simple timestamped archives.

Suggested destination layout:

```text
<destination_path>/
  <job-id>/
    2026-04-04T12-00-00Z.tar.gz
    2026-04-04T12-00-00Z.manifest.json
```

Manifest fields should include:
- job id
- friendly name
- source path
- destination path
- start/end times
- excludes used
- max depth used
- size
- file count
- status

## UI integration

### New route

Add:
- `/backups`

### Page structure

#### Backups page

Sections:

1. Summary cards
- total jobs
- healthy jobs
- running jobs
- overdue jobs
- failed jobs

2. Job list
- name
- tags
- source path
- destination
- schedule
- retention
- last run
- next run
- status

3. Create/Edit form
- friendly name
- description
- tags
- source path
- destination path
- excludes
- max depth
- schedule
- retention
- notification settings
- enabled

4. Run history
- latest runs
- size
- duration
- failure message

### Overview integration

Overview should continue showing backup summary, but the data should come from runtime `Shots` state rather than only static YAML.

### Wallboard integration

Wallboard should show only:
- healthy count
- total count
- overall degraded state if there are failed/overdue jobs

## Backend integration

### Suggested files

- `server/shots/store.ts`
- `server/shots/scheduler.ts`
- `server/shots/runner.ts`
- `server/shots/retention.ts`
- `server/shots/notifications.ts`
- `server/routes/shots.ts`

### API endpoints

- `GET /api/backups/jobs`
- `POST /api/backups/jobs`
- `PUT /api/backups/jobs/:id`
- `DELETE /api/backups/jobs/:id`
- `POST /api/backups/jobs/:id/run`
- `GET /api/backups/jobs/:id/runs`
- `GET /api/backups/summary`

## `/api/state` integration

`server/collectors/index.ts` should evolve to:
- load current runtime backup summary from `Shots`
- merge it into the existing `DashboardState.backups`

This preserves compatibility with:
- Overview
- Wallboard
- future Backups page

## Notification plan

### V1

Support:
- browser notifications

### V2

Support:
- `ntfy`

Do not design browser notifications in a way that blocks `ntfy` later.

## Path safety

V1 must validate:
- source exists
- destination exists or can be created
- destination writable
- source is not inside banned system paths

Suggested banned roots:
- `/`
- `/proc`
- `/sys`
- `/dev`
- `/run`

Suggested allowed roots initially:
- `/home/mmariani`
- explicitly configured archive/backup mount points

## Retention behavior

After successful run:
- enforce `keep_count`
- enforce `max_age_days`

If both are set:
- apply both filters

## Explicit non-goals

Do not build in V1:
- restore workflow
- encryption
- hooks
- Docker backup templates
- remote destination setup UI
- AI recommendations
- secret storage UI

## Relationship to `dockerBU`

`dockerBU` should be treated as:
- reference material
- naming/model inspiration

Do not:
- embed its whole backend
- embed its Vue frontend
- try to preserve its full feature scope

## Acceptance criteria

1. `shost` has a working `/backups` page.
2. A user can create a shot job in the UI.
3. A shot can back up a directory to a chosen destination.
4. Excludes and max depth work.
5. Retention by count and age works.
6. Overview shows runtime backup summary.
7. Wallboard shows runtime backup summary.
8. Browser notifications work for success/failure.
9. The model can add `ntfy` later without redesign.

## Implementation guidance for Claude Code

When working in this repo:
- treat `Shots` as part of `shost`
- follow the parent repo workflows in [CLAUDE.md](/home/mmariani/Projects/homelab-dashboard/CLAUDE.md)
- prefer small, reviewable changes
- keep frontend and backend naming aligned with existing `shost` style
- preserve current routes and pages while adding `/backups`


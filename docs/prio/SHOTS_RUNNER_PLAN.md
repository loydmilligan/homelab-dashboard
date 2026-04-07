# Shots Runner Plan

**Document Version:** 1.0.0
**Last Updated:** 2026-04-05

## Purpose

`Shots` is currently constrained by Docker filesystem visibility.

The dashboard backend can only back up paths that are mounted into the backend container. That is acceptable for controlled testing, but it is not a good long-term model for host backups on the laptop or the CM4.

This document defines the next architecture: a small host-side `shots-runner` service that executes backup work outside Docker while keeping `shost` as the scheduler, UI, and run-history owner.

## Problem

Today:

- `shost` backend runs in Docker
- backup jobs run in the backend container
- source paths must be visible inside the container
- useful host backups require bind mounts

This creates product and security tension:

- broad bind mounts make the container too powerful
- narrow bind mounts make `Shots` hard to use
- temporary host visibility is not a native Docker capability

## Decision

Do not expand the backend container's host filesystem access as the main solution.

Instead:

- keep the `shost` backend container relatively constrained
- add a dedicated host-side `shots-runner` helper
- let `shost` request specific backup jobs over a narrow API

## Target Architecture

```text
Shost UI
  -> Shost backend (Docker)
      -> shots-runner (host service, localhost or unix socket)
          -> host filesystem allowlisted access
          -> archive creation / rsync / manifests
```

Later:

```text
Shost backend
  -> local shots-runner on laptop
  -> remote shots-runner on CM4
```

## Why This Approach

Compared with bind-mount-only backups:

- tighter security boundary
- explicit path allowlists
- structured API and results
- easier auditing and logging
- reusable model for the CM4
- no need to give the Docker container broad host read access

Compared with ad hoc shell scripts:

- easier to validate requests
- better error handling
- easier to evolve authentication
- easier to return structured run results

Compared with Syncthing:

- better fit for one-shot scheduled backups
- better retention and manifest integration
- better alignment with `Shots` run history

## Security Model

`shots-runner` should:

- run on the host, outside Docker
- bind to `127.0.0.1` only, or a unix socket
- require a bearer token from `shost`
- enforce allowlisted source roots
- enforce allowlisted destination roots
- reject arbitrary command execution
- expose only backup-related endpoints

## Proposed API

### `GET /health`

Return:

```json
{
  "status": "ok",
  "runner_version": "dev",
  "host": "laptop"
}
```

### `POST /validate-path`

Request:

```json
{
  "path": "/home/mmariani/Documents",
  "kind": "source"
}
```

Response:

```json
{
  "valid": true,
  "normalized_path": "/home/mmariani/Documents"
}
```

### `POST /run-job`

Request:

```json
{
  "job_id": "photos-backup",
  "friendly_name": "Photos Backup",
  "source_path": "/home/mmariani/Pictures",
  "destination_path": "/mnt/backups/shots",
  "exclude_patterns": ["*.tmp", ".DS_Store"],
  "max_depth": null
}
```

Response:

```json
{
  "status": "success",
  "archive_path": "/mnt/backups/shots/photos-backup/2026-04-05T04-30-00Z.tar.gz",
  "manifest_path": "/mnt/backups/shots/photos-backup/2026-04-05T04-30-00Z.manifest.json",
  "size_bytes": 123456,
  "file_count": 842,
  "started_at": "2026-04-05T04:30:00Z",
  "completed_at": "2026-04-05T04:31:10Z",
  "error_message": null
}
```

## Rollout Plan

### Phase 1

- scaffold `shots-runner`
- define config model
- define systemd/service example
- verify local manual backup execution outside Docker

### Phase 2

- add backend client for `shots-runner`
- feature-flag `Shots` execution mode:
  - `container`
  - `host_runner`
- route manual runs through helper when configured

### Phase 3

- use helper for scheduled runs
- add destination/source validation in UI
- add richer failure handling and logs

### Phase 4

- deploy same helper model to CM4
- add per-host runner targets in `Shots`

## Current Status

- `Shots` UI exists and supports CRUD, scheduling, retention, and notifications
- laptop-targeted execution still supports the existing local/in-container path
- CM4-targeted jobs now have a remote-runner path through the exporter
- the backend can call the CM4 runner using `CM4_SHOTS_RUNNER_URL` and `CM4_SHOTS_RUNNER_TOKEN`
- the CM4 exporter now exposes authenticated `POST /shots/run-job`
- CM4 destinations are constrained to `/shots-dest/...` backed by a dedicated writable host mount

## Related Files

- [BACKUPS_V1_DESIGN.md](/home/loydmilligan/Projects/homelab-dashboard/ARCHIVE/docs/BACKUPS_V1_DESIGN.md)
- [shots/docs/SHOTS_V1_IMPLEMENTATION_PLAN.md](/home/mmariani/Projects/homelab-dashboard/shots/docs/SHOTS_V1_IMPLEMENTATION_PLAN.md)
- [host-runner/shots_runner.py](/home/mmariani/Projects/homelab-dashboard/host-runner/shots_runner.py)
- [host-runner/README.md](/home/mmariani/Projects/homelab-dashboard/host-runner/README.md)

# Ubuntu Rebuild Checklist

This checklist is for moving the laptop from Windows to Ubuntu and getting `shost` plus `Shots` working immediately after Docker is installed.

## Goal

After the Ubuntu install, `shost` should come back with:

- the same dashboard configuration
- the same `Shots` jobs and history
- working laptop backup execution through `laptop-exporter`
- working CM4 backup execution through the remote CM4 runner
- working notifications

## Files To Preserve Before Reinstall

Copy these from the current machine:

- the full repo directory
- `.env`
- `data/`
- `inventory/`
- `runtime/` if you care about runtime-generated JSON inputs

Important contents:

- `.env` holds `LAPTOP_SHOTS_RUNNER_TOKEN`, `CM4_SHOTS_RUNNER_TOKEN`, and other runtime secrets
- `data/shots.db` holds `Shots` jobs and run history
- `data/notifications.db` holds app-wide notification settings and event history
- `data/laptop-shots/` is the default laptop backup destination root
- `LAPTOP_SENSOR_MOUNT_PATH` now defaults to `./runtime`, so the stack does not depend on a Windows-specific `/mnt/f` mount

## What Makes Laptop `Shots` Work On Ubuntu

Laptop-targeted `Shots` jobs now run through `laptop-exporter`, not through the backend container filesystem.

That means:

- source paths are evaluated against the Ubuntu host filesystem via `/:/host/rootfs:ro`
- backup archives are written through a dedicated writable mount at `${LAPTOP_SHOTS_DEST_HOST_PATH:-./data/laptop-shots}`
- the backend talks to `laptop-exporter` over `http://laptop-exporter:9100`

This is the same execution model already used for the CM4.

## Rebuild Steps On Ubuntu

1. Install Docker and Docker Compose.
2. Restore the repo to the desired location.
3. Restore `.env`.
4. Restore `data/`.
5. Restore `inventory/` if you want the same host/service metadata.
6. Run:

```bash
cd ~/Projects/homelab-dashboard
npm run build
docker compose up -d --build
docker compose restart frontend
```

## Immediate Verification

Check these in order:

```bash
curl http://localhost:3088/api/health
curl http://localhost:9101/health
curl http://localhost:9101/shots/health
```

Then open the UI and verify:

- footer build number changed
- `/shots` loads existing jobs
- `CM4 Test Backup` or any restored job is visible
- a laptop-targeted test job can be created with source `/home/...` and destination `/shots-dest/...`

## Recommended First Ubuntu Test

Create a small host directory:

```bash
mkdir -p /tmp/shots-ubuntu-test/nested
printf 'hello\n' > /tmp/shots-ubuntu-test/a.txt
printf 'keep\n' > /tmp/shots-ubuntu-test/nested/b.txt
```

Then in `/shots` create:

- Target Host: `Laptop`
- Source Path: `/tmp/shots-ubuntu-test`
- Destination Path: `/shots-dest/laptop-tests`
- Schedule: `Manual`

Run it once and confirm a new archive appears under:

- `${LAPTOP_SHOTS_DEST_HOST_PATH:-./data/laptop-shots}/laptop-tests/<job-id>/`

## Failure Modes To Avoid

- do not forget to restore `.env`
- do not forget to restore `data/`
- do not point laptop jobs at container-only paths; use Ubuntu host paths like `/home/...` or `/tmp/...`
- do not use a laptop destination outside `/shots-dest/...` when using the runner path

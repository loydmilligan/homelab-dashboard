# CM4 Exporter

Lightweight metrics agent for Raspberry Pi CM4. It now also exposes a narrow authenticated `Shots` runner API so the main dashboard can trigger CM4-hosted backups without giving the dashboard container broad host filesystem access.

## Deploy to CM4

```bash
# Copy to CM4
scp -r agent/ pi@192.168.6.38:~/cm4-exporter/

# SSH to CM4
ssh pi@192.168.6.38

# Start
cd ~/cm4-exporter
docker compose up -d
```

## Endpoints

- `http://192.168.6.38:9100/metrics` - Full metrics + containers + logs
- `http://192.168.6.38:9100/health` - Health check
- `http://192.168.6.38:9100/shots/health` - Backup runner health
- `POST http://192.168.6.38:9100/shots/run-job` - Authenticated backup run

## Output

```json
{
  "host_id": "cm4",
  "metrics": {
    "cpu_pct": 21,
    "ram_pct": 64,
    "disk_pct": 41,
    "temp_c": 48,
    "uptime_s": 123456
  },
  "containers": [...],
  "logs": {...}
}
```

## `Shots` Backup Runner

The CM4 exporter container reads host files through `/:/host/rootfs:ro` and writes archives only through a dedicated writable mount:

- host destination mount: `${SHOTS_DEST_HOST_PATH:-/home/mmariani/shots-backups}`
- container destination root: `/host/shots-dest`
- virtual destination prefix used by the dashboard: `/shots-dest/...`

Required environment variables:

- `SHOTS_RUNNER_TOKEN`
- `SHOTS_SOURCE_ROOTS`
- `SHOTS_DEST_HOST_PATH`
- `SHOTS_OUTPUT_UID`
- `SHOTS_OUTPUT_GID`

Example `.env` values on the CM4:

```bash
SHOTS_RUNNER_TOKEN=replace-with-long-random-token
SHOTS_SOURCE_ROOTS=/home,/srv,/mnt
SHOTS_DEST_HOST_PATH=/home/mmariani/shots-backups
SHOTS_OUTPUT_UID=1000
SHOTS_OUTPUT_GID=1000
```

Example dashboard `Shots` job targeting the CM4:

- Target Host: `CM4`
- Source Path: `/home/mmariani/test-data`
- Destination Path: `/shots-dest/cm4-tests`

The resulting archive will be written on the CM4 host under:

- `/home/mmariani/shots-backups/cm4-tests/<job-id>/...`

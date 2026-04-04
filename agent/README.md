# CM4 Exporter

Lightweight metrics agent for Raspberry Pi CM4.

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

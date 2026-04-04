#!/usr/bin/env python3
"""
CM4 Metrics Exporter
Lightweight agent that exposes system metrics, Docker containers, and logs.
"""

import json
import subprocess
import os
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime, timedelta
import threading
import time

PORT = 9100
LOGS_MAX_LINES = 500
CACHE_SECONDS = 60  # Cache metrics for 60 seconds

cache = {"data": None, "timestamp": None}
cache_lock = threading.Lock()


def run_cmd(cmd):
    """Run shell command and return output."""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
        return result.stdout.strip()
    except:
        return ""


def get_system_metrics():
    """Collect system metrics."""
    # CPU usage
    cpu_line = run_cmd("top -bn1 | grep 'Cpu(s)' | head -1")
    cpu_pct = 0
    if cpu_line:
        try:
            idle = float(cpu_line.split(",")[3].split()[0])
            cpu_pct = round(100 - idle)
        except:
            pass

    # Memory
    mem_info = run_cmd("free -m | grep Mem")
    ram_pct = 0
    if mem_info:
        parts = mem_info.split()
        if len(parts) >= 3:
            total, used = int(parts[1]), int(parts[2])
            ram_pct = round((used / total) * 100) if total > 0 else 0

    # Disk
    disk_info = run_cmd("df -h / | tail -1")
    disk_pct = 0
    if disk_info:
        parts = disk_info.split()
        if len(parts) >= 5:
            disk_pct = int(parts[4].replace("%", ""))

    # Temperature
    temp_c = None
    temp_raw = run_cmd("cat /sys/class/thermal/thermal_zone0/temp 2>/dev/null")
    if temp_raw:
        try:
            temp_c = round(int(temp_raw) / 1000)
        except:
            pass

    # Uptime
    uptime_raw = run_cmd("cat /proc/uptime")
    uptime_s = 0
    if uptime_raw:
        try:
            uptime_s = int(float(uptime_raw.split()[0]))
        except:
            pass

    return {
        "cpu_pct": cpu_pct,
        "ram_pct": ram_pct,
        "disk_pct": disk_pct,
        "temp_c": temp_c,
        "uptime_s": uptime_s,
    }


def get_docker_containers():
    """Get Docker container status."""
    containers = []
    output = run_cmd("docker ps -a --format '{{.ID}}|{{.Names}}|{{.Image}}|{{.Status}}|{{.State}}'")
    if output:
        for line in output.strip().split("\n"):
            if line:
                parts = line.split("|")
                if len(parts) >= 5:
                    containers.append({
                        "id": parts[0],
                        "name": parts[1],
                        "image": parts[2],
                        "status": parts[3],
                        "running": parts[4] == "running",
                    })
    return containers


def get_container_logs(container_name, lines=100):
    """Get recent logs from a container."""
    output = run_cmd(f"docker logs --tail {lines} {container_name} 2>&1")
    return output[-10000:] if output else ""  # Limit to 10KB


def get_all_logs():
    """Get logs from all containers."""
    logs = {}
    containers = get_docker_containers()
    for c in containers:
        if c["running"]:
            logs[c["name"]] = get_container_logs(c["name"], 100)
    return logs


def collect_all():
    """Collect all metrics."""
    return {
        "host_id": "cm4",
        "hostname": run_cmd("hostname"),
        "metrics": get_system_metrics(),
        "containers": get_docker_containers(),
        "logs": get_all_logs(),
        "collected_at": datetime.utcnow().isoformat() + "Z",
    }


def get_cached_data():
    """Return cached data or refresh if stale."""
    with cache_lock:
        now = datetime.utcnow()
        if cache["data"] is None or cache["timestamp"] is None or \
           (now - cache["timestamp"]).seconds > CACHE_SECONDS:
            cache["data"] = collect_all()
            cache["timestamp"] = now
        return cache["data"]


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # Suppress logging

    def do_GET(self):
        if self.path == "/metrics" or self.path == "/":
            data = get_cached_data()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(data, indent=2).encode())
        elif self.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"status":"ok"}')
        else:
            self.send_response(404)
            self.end_headers()


if __name__ == "__main__":
    print(f"CM4 Exporter running on http://0.0.0.0:{PORT}")
    print(f"  GET /metrics - Full metrics with containers and logs")
    print(f"  GET /health  - Health check")
    server = HTTPServer(("0.0.0.0", PORT), Handler)
    server.serve_forever()

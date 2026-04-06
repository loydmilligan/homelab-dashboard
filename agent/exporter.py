#!/usr/bin/env python3
"""
Host metrics exporter plus narrow backup runner endpoints.
"""

import fnmatch
import json
import os
import subprocess
import tarfile
import threading
import time
from datetime import datetime
from http.server import BaseHTTPRequestHandler, HTTPServer

PORT = 9100
LOGS_MAX_LINES = 500
CACHE_SECONDS = 60
EXPORTER_VERSION = os.environ.get("EXPORTER_VERSION", "unknown")
HOST_PROC = os.environ.get("HOST_PROC", "/proc")
HOST_SYS = os.environ.get("HOST_SYS", "/sys")
HOST_ROOTFS = os.environ.get("HOST_ROOTFS", "/")
HOST_ID = os.environ.get("HOST_ID", "unknown")
CONTAINER_NAME = os.environ.get("CONTAINER_NAME", "host-exporter")
HOST_TEMP_FILE = os.environ.get("HOST_TEMP_FILE", "")
SHOTS_RUNNER_TOKEN = os.environ.get("SHOTS_RUNNER_TOKEN", "").strip()
SHOTS_SOURCE_ROOTS = [
    value.strip()
    for value in os.environ.get("SHOTS_SOURCE_ROOTS", "/home,/srv,/mnt,/opt,/tmp").split(",")
    if value.strip()
]
SHOTS_DEST_PREFIX = "/shots-dest"
SHOTS_DEST_ROOT = os.environ.get("SHOTS_DEST_ROOT", "/host/shots-dest")
SHOTS_OUTPUT_UID = os.environ.get("SHOTS_OUTPUT_UID", "").strip()
SHOTS_OUTPUT_GID = os.environ.get("SHOTS_OUTPUT_GID", "").strip()

cache = {"data": None, "timestamp": None}
cache_lock = threading.Lock()


def run_cmd(cmd):
    """Run shell command and return output."""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
        return result.stdout.strip()
    except:
        return ""


def read_text(path):
    """Read text file and return stripped content."""
    try:
        with open(path) as handle:
            return handle.read().strip()
    except:
        return ""


def get_hostname():
    """Read host hostname when mounted, otherwise fall back to container hostname."""
    hostname = read_text(f"{HOST_PROC}/sys/kernel/hostname")
    if hostname:
        return hostname
    hostname = read_text(f"{HOST_ROOTFS}/etc/hostname")
    if hostname:
        return hostname
    return run_cmd("hostname")


def get_temp_override():
    """Read optional temperature override from a JSON file."""
    if not HOST_TEMP_FILE:
        return None
    raw = read_text(HOST_TEMP_FILE)
    if not raw:
        return None
    try:
        return json.loads(raw)
    except:
        return None


def get_external_thermal_metrics():
    """Normalize external thermal payload into exporter fields."""
    data = get_temp_override()
    if not data:
        return {}
    try:
        surface_temp_c = data.get("surface_temp_c")
        object_temp_c = data.get("object_temp_c")
        ambient_temp_c = data.get("ambient_temp_c")
        temp_source = data.get("sensor") or data.get("source") or "external-thermal"
        effective_temp = surface_temp_c if surface_temp_c is not None else object_temp_c
        metrics = {
            "ambient_temp_c": round(float(ambient_temp_c), 1) if ambient_temp_c is not None else None,
            "surface_temp_c": round(float(effective_temp), 1) if effective_temp is not None else None,
            "temp_source": temp_source,
        }
        if metrics["surface_temp_c"] is None and metrics["ambient_temp_c"] is None:
            return None
        return metrics
    except:
        return {}


def parse_cpu_times():
    """Return idle and total CPU times from /proc/stat."""
    stat_line = read_text(f"{HOST_PROC}/stat").splitlines()
    if not stat_line:
        return 0, 0
    parts = stat_line[0].split()
    if not parts or parts[0] != "cpu":
        return 0, 0
    values = [int(part) for part in parts[1:8]]
    idle = values[3]
    total = sum(values)
    return idle, total


def should_ignore_process(command, pid):
    """Filter exporter noise and obvious inspection commands."""
    if not command:
        return True
    if str(pid) == str(os.getpid()):
        return True
    ignored_fragments = [
        "python exporter.py",
        "ps -eo user,pid,pcpu,pmem,args",
        "curl -s http://localhost:",
        "docker compose ps",
        "jq ",
        "powershell.exe",
        "/WindowsPowerShell/",
        "wslpath ",
    ]
    return any(fragment in command for fragment in ignored_fragments)


def parse_ps_output(output):
    """Parse ps output into normalized process records."""
    processes = []
    for line in output.strip().split("\n"):
        if not line:
            continue
        parts = line.split(None, 4)
        if len(parts) < 5:
            continue
        user, pid, cpu_pct, mem_pct, command = parts
        if should_ignore_process(command, pid):
            continue
        try:
            processes.append({
                "user": user,
                "pid": pid,
                "cpu_pct": float(cpu_pct),
                "mem_pct": float(mem_pct),
                "command": command[:50],
            })
        except:
            continue
    return processes


def get_top_processes_cpu(limit=5):
    """Get top processes by CPU usage."""
    try:
        output = run_cmd("ps -eo user,pid,pcpu,pmem,args --sort=-pcpu | head -n 25 | tail -n +2")
        return parse_ps_output(output)[:limit]
    except:
        return []


def get_top_processes_mem(limit=5):
    """Get top processes by memory usage."""
    try:
        output = run_cmd("ps -eo user,pid,pcpu,pmem,args --sort=-pmem | head -n 25 | tail -n +2")
        return parse_ps_output(output)[:limit]
    except:
        return []


def get_disk_breakdown():
    """Get disk usage breakdown by mount point."""
    disks = []
    try:
        output = run_cmd(f"df -hP {HOST_ROOTFS}")
        for line in output.strip().split("\n"):
            if line and not line.startswith("Filesystem"):
                parts = line.split()
                if len(parts) >= 6:
                    disks.append({
                        "filesystem": parts[0],
                        "size": parts[1],
                        "used": parts[2],
                        "available": parts[3],
                        "use_pct": int(parts[4].replace("%", "")),
                        "mount": "/" if parts[5] == HOST_ROOTFS else parts[5],
                    })
    except:
        pass
    return disks


def get_system_metrics():
    """Collect system metrics."""
    cpu_pct = 0
    try:
        idle_start, total_start = parse_cpu_times()
        time.sleep(0.2)
        idle_end, total_end = parse_cpu_times()
        total_delta = total_end - total_start
        idle_delta = idle_end - idle_start
        if total_delta > 0:
            cpu_pct = round(100 * (1 - idle_delta / total_delta))
    except:
        pass

    ram_pct = 0
    mem_total_kb = 0
    mem_avail_kb = 0
    try:
        meminfo = read_text(f"{HOST_PROC}/meminfo").splitlines()
        values = {}
        for line in meminfo:
            if ":" in line:
                key, raw_value = line.split(":", 1)
                values[key] = raw_value.strip().split()[0]
        mem_total_kb = int(values.get("MemTotal", "0"))
        mem_avail_kb = int(values.get("MemAvailable", "0"))
        if mem_total_kb > 0:
            ram_pct = round(((mem_total_kb - mem_avail_kb) / mem_total_kb) * 100)
    except:
        pass

    disk_info = run_cmd(f"df -hP {HOST_ROOTFS} | tail -1")
    disk_pct = 0
    if disk_info:
        parts = disk_info.split()
        if len(parts) >= 5:
            disk_pct = int(parts[4].replace("%", ""))

    temp_c = None
    temp_source = "host-thermal-zone"
    temp_raw = read_text(f"{HOST_SYS}/class/thermal/thermal_zone0/temp")
    if temp_raw:
        try:
            temp_c = round(int(temp_raw) / 1000)
        except:
            pass
    external_thermal = get_external_thermal_metrics()
    ambient_temp_c = external_thermal.get("ambient_temp_c")
    surface_temp_c = external_thermal.get("surface_temp_c")
    if temp_c is None and surface_temp_c is not None:
        temp_c = surface_temp_c
        temp_source = external_thermal.get("temp_source", "external-thermal")

    uptime_raw = read_text(f"{HOST_PROC}/uptime")
    uptime_s = 0
    if uptime_raw:
        try:
            uptime_s = int(float(uptime_raw.split()[0]))
        except:
            pass

    return {
        "cpu_pct": cpu_pct,
        "ram_pct": ram_pct,
        "ram_total_mb": round(mem_total_kb / 1024),
        "ram_used_mb": round((mem_total_kb - mem_avail_kb) / 1024),
        "disk_pct": disk_pct,
        "temp_c": temp_c,
        "ambient_temp_c": ambient_temp_c,
        "surface_temp_c": surface_temp_c,
        "temp_source": temp_source if temp_c is not None or surface_temp_c is not None else None,
        "uptime_s": uptime_s,
        "top_cpu": get_top_processes_cpu(5),
        "top_mem": get_top_processes_mem(5),
        "disks": get_disk_breakdown(),
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
    return output[-10000:] if output else ""


def get_all_logs():
    """Get logs from all containers."""
    logs = {}
    containers = get_docker_containers()
    for container in containers:
        if container["running"]:
            logs[container["name"]] = get_container_logs(container["name"], LOGS_MAX_LINES)
    return logs


def collect_all():
    """Collect all metrics."""
    return {
        "host_id": HOST_ID,
        "hostname": get_hostname(),
        "exporter_version": EXPORTER_VERSION,
        "container_name": CONTAINER_NAME,
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


def normalize_host_path(raw_path):
    if not isinstance(raw_path, str) or not raw_path.strip():
        raise ValueError("Path must be a non-empty string")
    normalized = os.path.normpath(raw_path.strip())
    if not normalized.startswith("/"):
        raise ValueError("Path must be absolute")
    return normalized


def is_within_root(path_value, root):
    return path_value == root or path_value.startswith(root.rstrip("/") + "/")


def validate_source_host_path(source_path):
    normalized = normalize_host_path(source_path)
    if not any(is_within_root(normalized, root) for root in SHOTS_SOURCE_ROOTS):
        raise ValueError(
            f"Source path {normalized} is not within allowed roots: {', '.join(SHOTS_SOURCE_ROOTS)}"
        )
    actual_path = os.path.realpath(os.path.join(HOST_ROOTFS, normalized.lstrip("/")))
    host_root = os.path.realpath(HOST_ROOTFS)
    if not is_within_root(actual_path, host_root):
        raise ValueError("Source path resolves outside mounted host rootfs")
    if not os.path.exists(actual_path):
        raise ValueError(f"Source path does not exist on host: {normalized}")
    return normalized, actual_path


def map_destination_path(destination_path):
    normalized = normalize_host_path(destination_path)
    if not is_within_root(normalized, SHOTS_DEST_PREFIX):
        raise ValueError(f"Destination path must live under {SHOTS_DEST_PREFIX}")
    relative_path = normalized[len(SHOTS_DEST_PREFIX):].lstrip("/")
    actual_path = os.path.realpath(os.path.join(SHOTS_DEST_ROOT, relative_path))
    dest_root = os.path.realpath(SHOTS_DEST_ROOT)
    if actual_path != dest_root and not actual_path.startswith(dest_root.rstrip("/") + "/"):
        raise ValueError("Destination path resolves outside allowed shots destination root")
    return normalized, actual_path


def get_output_owner():
    if not SHOTS_OUTPUT_UID or not SHOTS_OUTPUT_GID:
        return None

    try:
        return int(SHOTS_OUTPUT_UID), int(SHOTS_OUTPUT_GID)
    except ValueError as exc:
        raise ValueError("SHOTS_OUTPUT_UID and SHOTS_OUTPUT_GID must be integers") from exc


def apply_output_owner(path_value):
    owner = get_output_owner()
    if owner is None:
        return

    uid, gid = owner
    os.chown(path_value, uid, gid)


def timestamp_for_filename():
    return datetime.utcnow().replace(microsecond=0).isoformat().replace(":", "-") + "Z"


def should_exclude(relative_path, patterns):
    normalized = relative_path.replace(os.sep, "/")
    base_name = os.path.basename(normalized)
    for pattern in patterns:
        trimmed = str(pattern).strip()
        if not trimmed:
            continue
        normalized_pattern = trimmed.replace(os.sep, "/")
        if (
            fnmatch.fnmatch(normalized, normalized_pattern)
            or fnmatch.fnmatch(base_name, normalized_pattern)
            or normalized == normalized_pattern
            or normalized.startswith(normalized_pattern + "/")
        ):
            return True
    return False


def collect_entries(root_path, relative_path, depth, max_depth, exclude_patterns):
    current_path = root_path if not relative_path else os.path.join(root_path, relative_path)
    os.lstat(current_path)

    if relative_path and should_exclude(relative_path, exclude_patterns):
        return [], 0

    if os.path.islink(current_path):
        return [{"relative_path": relative_path, "type": "symlink"}], 1

    if os.path.isfile(current_path):
        return [{"relative_path": relative_path, "type": "file"}], 1

    if not os.path.isdir(current_path):
        return [], 0

    entries = [{"relative_path": relative_path, "type": "directory"}] if relative_path else []
    file_count = 0

    if max_depth is not None and depth >= max_depth:
        return entries, file_count

    try:
        child_names = sorted(os.listdir(current_path))
    except OSError as exc:
        raise ValueError(f"Unable to read directory {current_path}: {exc}") from exc

    for child_name in child_names:
        child_relative_path = os.path.join(relative_path, child_name) if relative_path else child_name
        child_entries, child_file_count = collect_entries(
            root_path, child_relative_path, depth + 1, max_depth, exclude_patterns
        )
        entries.extend(child_entries)
        file_count += child_file_count

    return entries, file_count


def arcname_for_entry(source_path, relative_path):
    if relative_path:
        return relative_path.replace(os.sep, "/")
    return os.path.basename(os.path.normpath(source_path))


def write_archive(source_path, archive_path, entries):
    with tarfile.open(archive_path, "w:gz", dereference=False) as archive:
        for entry in entries:
            relative_path = entry["relative_path"]
            source_entry_path = source_path if not relative_path else os.path.join(source_path, relative_path)
            archive.add(source_entry_path, arcname=arcname_for_entry(source_path, relative_path), recursive=False)


def collect_retention_targets(job_destination_dir):
    if not os.path.isdir(job_destination_dir):
        return []

    targets = []
    for entry_name in os.listdir(job_destination_dir):
        if not entry_name.endswith(".tar.gz"):
            continue
        archive_path = os.path.join(job_destination_dir, entry_name)
        manifest_path = os.path.join(
            job_destination_dir, entry_name.replace(".tar.gz", ".manifest.json")
        )
        try:
            archive_stats = os.stat(archive_path)
        except OSError:
            continue
        targets.append({
            "archive_path": archive_path,
            "manifest_path": manifest_path,
            "mtime": archive_stats.st_mtime,
        })

    targets.sort(key=lambda item: item["mtime"], reverse=True)
    return targets


def apply_retention(job_destination_dir, keep_count, max_age_days):
    targets = collect_retention_targets(job_destination_dir)
    removal_paths = set()

    if keep_count is not None:
        for target in targets[int(keep_count):]:
            removal_paths.add(target["archive_path"])
            removal_paths.add(target["manifest_path"])

    if max_age_days is not None:
        cutoff = time.time() - (float(max_age_days) * 24 * 60 * 60)
        for target in targets:
            if target["mtime"] < cutoff:
                removal_paths.add(target["archive_path"])
                removal_paths.add(target["manifest_path"])

    for target_path in removal_paths:
        try:
            os.remove(target_path)
        except FileNotFoundError:
            pass


def is_authorized(handler):
    if not SHOTS_RUNNER_TOKEN:
        return False
    header = handler.headers.get("Authorization", "")
    return header == f"Bearer {SHOTS_RUNNER_TOKEN}"


def parse_json_body(handler):
    content_length = int(handler.headers.get("Content-Length", "0"))
    raw_body = handler.rfile.read(content_length)
    if not raw_body:
        return {}
    return json.loads(raw_body.decode("utf-8"))


def respond_json(handler, status_code, payload):
    body = json.dumps(payload, indent=2).encode()
    handler.send_response(status_code)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def run_backup_job(payload):
    job_id = str(payload.get("job_id", "")).strip()
    friendly_name = str(payload.get("friendly_name", "")).strip() or job_id
    source_path = payload.get("source_path")
    destination_path = payload.get("destination_path")
    exclude_patterns = payload.get("exclude_patterns") or []
    max_depth = payload.get("max_depth")
    retention = payload.get("retention") or {}

    if not job_id:
        raise ValueError("job_id is required")
    if not isinstance(exclude_patterns, list) or any(not isinstance(item, str) for item in exclude_patterns):
        raise ValueError("exclude_patterns must be an array of strings")
    if max_depth is not None and not isinstance(max_depth, int):
        raise ValueError("max_depth must be an integer or null")

    source_host_path, actual_source_path = validate_source_host_path(source_path)
    destination_virtual_path, actual_destination_path = map_destination_path(destination_path)

    keep_count = retention.get("keep_count")
    max_age_days = retention.get("max_age_days")

    started_at = datetime.utcnow().isoformat() + "Z"
    timestamp = timestamp_for_filename()
    actual_job_destination_dir = os.path.join(actual_destination_path, job_id)
    virtual_job_destination_dir = os.path.join(destination_virtual_path, job_id).replace(os.sep, "/")
    archive_filename = f"{timestamp}.tar.gz"
    manifest_filename = f"{timestamp}.manifest.json"
    actual_archive_path = os.path.join(actual_job_destination_dir, archive_filename)
    actual_manifest_path = os.path.join(actual_job_destination_dir, manifest_filename)
    virtual_archive_path = f"{virtual_job_destination_dir}/{archive_filename}"
    virtual_manifest_path = f"{virtual_job_destination_dir}/{manifest_filename}"

    os.makedirs(actual_job_destination_dir, exist_ok=True)
    entries, file_count = collect_entries(
        actual_source_path, "", 0, max_depth, exclude_patterns
    )
    write_archive(actual_source_path, actual_archive_path, entries)
    archive_stats = os.stat(actual_archive_path)
    completed_at = datetime.utcnow().isoformat() + "Z"

    manifest = {
        "job_id": job_id,
        "friendly_name": friendly_name,
        "host_id": HOST_ID,
        "source_path": source_host_path,
        "destination_path": destination_virtual_path,
        "archive_path": virtual_archive_path,
        "manifest_path": virtual_manifest_path,
        "start_time": started_at,
        "end_time": completed_at,
        "excludes_used": exclude_patterns,
        "max_depth": max_depth,
        "size_bytes": archive_stats.st_size,
        "file_count": file_count,
        "status": "success",
    }

    with open(actual_manifest_path, "w", encoding="utf-8") as handle:
        handle.write(json.dumps(manifest, indent=2) + "\n")

    apply_output_owner(actual_job_destination_dir)
    apply_output_owner(actual_archive_path)
    apply_output_owner(actual_manifest_path)

    apply_retention(actual_job_destination_dir, keep_count, max_age_days)

    return {
        "status": "success",
        "archive_path": virtual_archive_path,
        "manifest_path": virtual_manifest_path,
        "size_bytes": archive_stats.st_size,
        "file_count": file_count,
        "completed_at": completed_at,
    }


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def do_GET(self):
        if self.path == "/metrics" or self.path == "/":
            respond_json(self, 200, get_cached_data())
        elif self.path == "/health":
            respond_json(self, 200, {"status": "ok"})
        elif self.path == "/shots/health":
            respond_json(
                self,
                200,
                {
                    "status": "ok",
                    "host_id": HOST_ID,
                    "source_roots": SHOTS_SOURCE_ROOTS,
                    "destination_prefix": SHOTS_DEST_PREFIX,
                },
            )
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path != "/shots/run-job":
            self.send_response(404)
            self.end_headers()
            return

        if not is_authorized(self):
            respond_json(self, 401, {"error": "Unauthorized"})
            return

        try:
            payload = parse_json_body(self)
            result = run_backup_job(payload)
            respond_json(self, 200, result)
        except ValueError as error:
            respond_json(self, 400, {"error": str(error)})
        except Exception as error:
            respond_json(self, 500, {"error": str(error)})


if __name__ == "__main__":
    print(f"Host exporter running on http://0.0.0.0:{PORT}")
    print("  GET /metrics       - Full metrics with containers and logs")
    print("  GET /health        - Health check")
    print("  GET /shots/health  - Backup runner health")
    print("  POST /shots/run-job - Authenticated backup run")
    server = HTTPServer(("0.0.0.0", PORT), Handler)
    server.serve_forever()

#!/usr/bin/env python3
"""
Host-side backup helper for Shots.

This service is intentionally narrow:
- localhost HTTP API
- bearer token auth
- allowlisted source and destination roots
- archive creation and manifest output
"""

import fnmatch
import json
import os
import socket
import tarfile
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

HOST = os.environ.get("SHOTS_RUNNER_HOST", "127.0.0.1")
PORT = int(os.environ.get("SHOTS_RUNNER_PORT", "9310"))
TOKEN = os.environ.get("SHOTS_RUNNER_TOKEN", "")
RUNNER_VERSION = os.environ.get("SHOTS_RUNNER_VERSION", "dev")
ALLOWED_SOURCES = [
    Path(entry.strip()).resolve()
    for entry in os.environ.get("SHOTS_RUNNER_ALLOWED_SOURCES", "/tmp").split(",")
    if entry.strip()
]
ALLOWED_DESTINATIONS = [
    Path(entry.strip()).resolve()
    for entry in os.environ.get("SHOTS_RUNNER_ALLOWED_DESTINATIONS", "/tmp").split(",")
    if entry.strip()
]


def now_iso():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def timestamp_for_filename():
    return datetime.now(timezone.utc).isoformat().replace(":", "-").replace("+00:00", "Z")


def path_in_roots(path_value, roots):
    try:
        resolved = Path(path_value).resolve()
    except Exception:
        return None

    for root in roots:
        if resolved == root or root in resolved.parents:
            return resolved

    return None


def validate_path(path_value, kind):
    if kind == "source":
        resolved = path_in_roots(path_value, ALLOWED_SOURCES)
    else:
        resolved = path_in_roots(path_value, ALLOWED_DESTINATIONS)

    if resolved is None:
        return False, None, f"{kind} path is outside allowed roots"

    return True, resolved, None


def should_exclude(relative_path, patterns):
    normalized = relative_path.replace(os.sep, "/")
    for pattern in patterns:
      stripped = pattern.strip()
      if not stripped:
          continue
      if fnmatch.fnmatch(normalized, stripped) or fnmatch.fnmatch(Path(normalized).name, stripped):
          return True
      if normalized == stripped or normalized.startswith(f"{stripped}/"):
          return True
    return False


def collect_entries(source_root, exclude_patterns, max_depth):
    entries = []
    file_count = 0

    for root, dirs, files in os.walk(source_root):
        relative_root = os.path.relpath(root, source_root)
        if relative_root == ".":
            relative_root = ""

        if relative_root:
            depth = len(Path(relative_root).parts)
            if max_depth is not None and depth > max_depth:
                dirs[:] = []
                continue
            if should_exclude(relative_root, exclude_patterns):
                dirs[:] = []
                continue

        kept_dirs = []
        for directory in dirs:
            rel_dir = os.path.join(relative_root, directory) if relative_root else directory
            depth = len(Path(rel_dir).parts)
            if max_depth is not None and depth > max_depth:
                continue
            if should_exclude(rel_dir, exclude_patterns):
                continue
            kept_dirs.append(directory)
        dirs[:] = kept_dirs

        for filename in files:
            rel_file = os.path.join(relative_root, filename) if relative_root else filename
            depth = len(Path(rel_file).parts)
            if max_depth is not None and depth > max_depth:
                continue
            if should_exclude(rel_file, exclude_patterns):
                continue
            entries.append(rel_file)
            file_count += 1

    return entries, file_count


def execute_run_job(payload):
    required = ["job_id", "friendly_name", "source_path", "destination_path"]
    for field in required:
        if field not in payload or not isinstance(payload[field], str) or not payload[field].strip():
            raise ValueError(f"{field} is required")

    source_ok, source_path, source_error = validate_path(payload["source_path"], "source")
    if not source_ok:
        raise ValueError(source_error)

    dest_ok, dest_path, dest_error = validate_path(payload["destination_path"], "destination")
    if not dest_ok:
        raise ValueError(dest_error)

    exclude_patterns = payload.get("exclude_patterns") or []
    if not isinstance(exclude_patterns, list):
        raise ValueError("exclude_patterns must be an array")

    max_depth = payload.get("max_depth")
    if max_depth is not None and not isinstance(max_depth, int):
        raise ValueError("max_depth must be an integer or null")

    started_at = now_iso()
    job_dir = dest_path / payload["job_id"]
    job_dir.mkdir(parents=True, exist_ok=True)
    filename_base = timestamp_for_filename()
    archive_path = job_dir / f"{filename_base}.tar.gz"
    manifest_path = job_dir / f"{filename_base}.manifest.json"

    entries, file_count = collect_entries(source_path, exclude_patterns, max_depth)

    with tarfile.open(archive_path, "w:gz") as tar_handle:
        for entry in entries:
            tar_handle.add(source_path / entry, arcname=entry)

    size_bytes = archive_path.stat().st_size
    completed_at = now_iso()

    manifest = {
        "job_id": payload["job_id"],
        "friendly_name": payload["friendly_name"],
        "source_path": str(source_path),
        "destination_path": str(dest_path),
        "archive_path": str(archive_path),
        "manifest_path": str(manifest_path),
        "started_at": started_at,
        "completed_at": completed_at,
        "exclude_patterns": exclude_patterns,
        "max_depth": max_depth,
        "size_bytes": size_bytes,
        "file_count": file_count,
        "status": "success",
    }

    manifest_path.write_text(f"{json.dumps(manifest, indent=2)}\n", encoding="utf-8")
    return manifest


class ShotsRunnerHandler(BaseHTTPRequestHandler):
    server_version = "shots-runner/0.1"

    def _send_json(self, status_code, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self):
        content_length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(content_length) if content_length > 0 else b"{}"
        return json.loads(raw.decode("utf-8"))

    def _is_authorized(self):
        if not TOKEN:
            return True
        auth_header = self.headers.get("Authorization", "")
        return auth_header == f"Bearer {TOKEN}"

    def do_GET(self):
        if self.path == "/health":
            self._send_json(
                200,
                {
                    "status": "ok",
                    "runner_version": RUNNER_VERSION,
                    "host": socket.gethostname(),
                },
            )
            return

        self._send_json(404, {"error": "Not found"})

    def do_POST(self):
        if not self._is_authorized():
            self._send_json(401, {"error": "Unauthorized"})
            return

        try:
            payload = self._read_json()
        except Exception:
            self._send_json(400, {"error": "Invalid JSON"})
            return

        if self.path == "/validate-path":
            path_value = payload.get("path")
            kind = payload.get("kind")
            if not isinstance(path_value, str) or kind not in {"source", "destination"}:
                self._send_json(400, {"error": "path and kind are required"})
                return

            valid, normalized, error = validate_path(path_value, kind)
            self._send_json(
                200,
                {
                    "valid": valid,
                    "normalized_path": str(normalized) if normalized else None,
                    "error": error,
                },
            )
            return

        if self.path == "/run-job":
            try:
                result = execute_run_job(payload)
                self._send_json(200, result)
            except ValueError as error:
                self._send_json(400, {"error": str(error)})
            except Exception as error:
                self._send_json(500, {"error": str(error)})
            return

        self._send_json(404, {"error": "Not found"})


def main():
    httpd = HTTPServer((HOST, PORT), ShotsRunnerHandler)
    print(f"shots-runner listening on http://{HOST}:{PORT}")
    httpd.serve_forever()


if __name__ == "__main__":
    main()

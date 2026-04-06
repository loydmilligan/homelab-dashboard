# Shots Runner

`shots-runner` is a host-side helper service for `Shots`.

It exists to solve the core deployment limitation of Docker-hosted `shost`: the backend container should not need broad host filesystem access just to perform backups.

## Current Role

This folder contains the first scaffold for a host-side helper that can:

- expose a narrow localhost HTTP API
- validate source and destination paths against allowlists
- execute a backup job outside Docker
- return structured JSON results to `shost`

It is not wired into the main dashboard runtime yet.

## Endpoints

- `GET /health`
- `POST /validate-path`
- `POST /run-job`

## Environment

See:

- [shots-runner.env.example](/home/mmariani/Projects/homelab-dashboard/host-runner/shots-runner.env.example)

## Run Locally

```bash
cd ~/Projects/homelab-dashboard/host-runner
export SHOTS_RUNNER_TOKEN=dev-token
python3 shots_runner.py
```

## Systemd

See:

- [shots-runner.service.example](/home/mmariani/Projects/homelab-dashboard/host-runner/shots-runner.service.example)

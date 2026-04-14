#!/usr/bin/env bash

set -euo pipefail

CONTAINER_NAME="${TS_SHARE_CONTAINER_NAME:-shost-tailscale-share}"
TARGET_PORT="${TS_SHARE_TARGET_PORT:-8080}"

usage() {
  cat <<EOF
Usage:
  bash scripts/tailscale-share-mode.sh <serve|funnel|off|status>

Commands:
  serve   Enable tailnet-only HTTPS access to the share stack
  funnel  Enable public Funnel access to the share stack
  off     Disable both Serve and Funnel exposure
  status  Show current Tailscale share status

Environment overrides:
  TS_SHARE_CONTAINER_NAME  Tailscale sidecar container name (default: shost-tailscale-share)
  TS_SHARE_TARGET_PORT     Internal proxy port to expose (default: 8080)
EOF
}

require_container() {
  if ! docker ps --format '{{.Names}}' | grep -Fxq "${CONTAINER_NAME}"; then
    echo "Container ${CONTAINER_NAME} is not running." >&2
    echo "Start it with: docker compose -f docker-compose.tailscale-share.yml up -d" >&2
    exit 1
  fi
}

run_tailscale() {
  docker exec "${CONTAINER_NAME}" tailscale "$@"
}

main() {
  local mode="${1:-}"

  case "${mode}" in
    serve)
      require_container
      run_tailscale funnel reset >/dev/null 2>&1 || true
      run_tailscale serve reset >/dev/null 2>&1 || true
      run_tailscale serve --bg "${TARGET_PORT}"
      run_tailscale serve status
      ;;
    funnel)
      require_container
      run_tailscale serve reset >/dev/null 2>&1 || true
      run_tailscale funnel reset >/dev/null 2>&1 || true
      run_tailscale funnel --bg "${TARGET_PORT}"
      run_tailscale funnel status
      ;;
    off)
      require_container
      run_tailscale funnel reset >/dev/null 2>&1 || true
      run_tailscale serve reset >/dev/null 2>&1 || true
      echo "Tailscale share exposure disabled."
      ;;
    status)
      require_container
      run_tailscale status
      echo
      run_tailscale serve status || true
      echo
      run_tailscale funnel status || true
      ;;
    *)
      usage
      exit 1
      ;;
  esac
}

main "$@"

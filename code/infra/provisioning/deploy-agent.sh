#!/usr/bin/env bash
# UnplugHQ — Monitoring Agent Deployment (idempotent)
#
# Deploys the monitoring agent container on the user's VPS.
# The agent runs read-only with no-new-privileges and only queries
# the Docker socket (read) and POSTs metrics to the control plane.
#
# Usage: deploy-agent.sh --token <api-token> --server-id <uuid> --control-plane-url <url> --image <image>
# Must be run as root or with sudo.

set -euo pipefail

log() { echo "[unplughq] $(date -u +"%Y-%m-%dT%H:%M:%SZ") $*"; }

# ─── Argument parsing ────────────────────────────────────
AGENT_TOKEN=""
SERVER_ID=""
CONTROL_PLANE_URL=""
AGENT_IMAGE="ghcr.io/sjefsharp/unplughq-agent:latest"
AGENT_INTERVAL_MS="30000"
AGENT_NETWORK="unplughq"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --token)          AGENT_TOKEN="$2";          shift 2 ;;
    --server-id)      SERVER_ID="$2";            shift 2 ;;
    --control-plane-url) CONTROL_PLANE_URL="$2"; shift 2 ;;
    --image)          AGENT_IMAGE="$2";          shift 2 ;;
    --interval-ms)    AGENT_INTERVAL_MS="$2";    shift 2 ;;
    --network)        AGENT_NETWORK="$2";        shift 2 ;;
    *) log "Unknown argument: $1"; exit 1 ;;
  esac
done

if [[ -z "$AGENT_TOKEN" || -z "$SERVER_ID" || -z "$CONTROL_PLANE_URL" ]]; then
  log "ERROR: --token, --server-id, and --control-plane-url are required"
  exit 1
fi

# ─── Pre-flight checks ───────────────────────────────────
if [[ $EUID -ne 0 ]]; then
  log "ERROR: This script must be run as root"
  exit 1
fi

if ! command -v docker &>/dev/null; then
  log "ERROR: Docker is not installed. Run install-docker.sh first."
  exit 1
fi

CONTAINER_NAME="unplughq-agent"

if ! docker network inspect "$AGENT_NETWORK" &>/dev/null; then
  log "Creating Docker network: ${AGENT_NETWORK}"
  docker network create "$AGENT_NETWORK" >/dev/null
fi

# ─── Idempotency: remove existing container if present ───
if docker inspect "$CONTAINER_NAME" &>/dev/null; then
  log "Removing existing agent container..."
  docker stop "$CONTAINER_NAME" 2>/dev/null || true
  docker rm "$CONTAINER_NAME" 2>/dev/null || true
fi

# ─── Pull the latest agent image ─────────────────────────
log "Pulling agent image: ${AGENT_IMAGE}"
docker pull "$AGENT_IMAGE"
IMAGE_DIGEST="$(docker image inspect "$AGENT_IMAGE" --format '{{index .RepoDigests 0}}' 2>/dev/null || echo "$AGENT_IMAGE")"

# ─── Run the agent container ─────────────────────────────
log "Starting monitoring agent container..."
docker run -d \
  --name "$CONTAINER_NAME" \
  --network "$AGENT_NETWORK" \
  --restart unless-stopped \
  --read-only \
  --security-opt=no-new-privileges \
  --cap-drop=ALL \
  --tmpfs /tmp:rw,noexec,nosuid,size=16m \
  --label org.unplughq.component=monitoring-agent \
  --label org.unplughq.image="${IMAGE_DIGEST}" \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -v /proc:/host/proc:ro \
  -e AGENT_API_TOKEN="$AGENT_TOKEN" \
  -e AGENT_SERVER_ID="$SERVER_ID" \
  -e AGENT_CONTROL_PLANE_URL="$CONTROL_PLANE_URL" \
  -e AGENT_INTERVAL_MS="$AGENT_INTERVAL_MS" \
  "$AGENT_IMAGE"

log "Monitoring agent deployed: container=$CONTAINER_NAME, server=$SERVER_ID, image=$IMAGE_DIGEST"
log "Agent will report to: ${CONTROL_PLANE_URL}/api/agent/metrics"

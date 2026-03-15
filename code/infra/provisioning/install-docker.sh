#!/usr/bin/env bash
# UnplugHQ — Docker Engine Installation (idempotent)
#
# Installs Docker Engine on Debian/Ubuntu-based VPS servers.
# Safe to re-run: checks for existing installation before proceeding.
#
# Usage: install-docker.sh
# Must be run as root or with sudo.

set -euo pipefail

log() { echo "[unplughq] $(date -u +"%Y-%m-%dT%H:%M:%SZ") $*"; }

# ─── Pre-flight checks ───────────────────────────────────
if [[ $EUID -ne 0 ]]; then
  log "ERROR: This script must be run as root"
  exit 1
fi

# ─── Idempotency: skip if Docker is already installed ────
if command -v docker &>/dev/null; then
  log "Docker is already installed: $(docker --version)"
  # Ensure the service is running
  systemctl enable --now docker 2>/dev/null || true
  log "Docker service is active"
  exit 0
fi

log "Installing Docker Engine..."

# ─── Install prerequisites ───────────────────────────────
apt-get update -qq
apt-get install -y -qq \
  ca-certificates \
  curl \
  gnupg \
  lsb-release

# ─── Add Docker's official GPG key ───────────────────────
install -m 0755 -d /etc/apt/keyrings
if [[ ! -f /etc/apt/keyrings/docker.asc ]]; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
fi

# ─── Set up the Docker repository ────────────────────────
# shellcheck disable=SC1091
DISTRO=$(. /etc/os-release && echo "$ID")
CODENAME=$(. /etc/os-release && echo "$VERSION_CODENAME")

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/${DISTRO} ${CODENAME} stable" \
  > /etc/apt/sources.list.d/docker.list

# ─── Install Docker Engine ───────────────────────────────
apt-get update -qq
apt-get install -y -qq \
  docker-ce \
  docker-ce-cli \
  containerd.io \
  docker-buildx-plugin \
  docker-compose-plugin

# ─── Start and enable Docker ─────────────────────────────
systemctl enable --now docker

# ─── Create the unplughq Docker network ──────────────────
if ! docker network inspect unplughq &>/dev/null; then
  docker network create unplughq
  log "Created Docker network: unplughq"
else
  log "Docker network 'unplughq' already exists"
fi

log "Docker Engine installed successfully: $(docker --version)"

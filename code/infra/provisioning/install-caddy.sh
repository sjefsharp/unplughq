#!/usr/bin/env bash
# UnplugHQ — Caddy Installation & Base Configuration (idempotent)
#
# Installs Caddy on Debian/Ubuntu-based VPS servers and deploys
# the base Caddyfile with admin API locked to localhost (T-04).
#
# Usage: install-caddy.sh [--acme-email <email>]
# Must be run as root or with sudo.

set -euo pipefail

ACME_EMAIL="${1:---acme-email}"
if [[ "$ACME_EMAIL" == "--acme-email" ]]; then
  ACME_EMAIL="${2:-admin@example.com}"
fi

log() { echo "[unplughq] $(date -u +"%Y-%m-%dT%H:%M:%SZ") $*"; }

# ─── Pre-flight checks ───────────────────────────────────
if [[ $EUID -ne 0 ]]; then
  log "ERROR: This script must be run as root"
  exit 1
fi

# ─── Idempotency: skip install if Caddy is present ───────
if command -v caddy &>/dev/null; then
  log "Caddy is already installed: $(caddy version)"
else
  log "Installing Caddy..."

  apt-get update -qq
  apt-get install -y -qq \
    debian-keyring \
    debian-archive-keyring \
    apt-transport-https \
    curl

  if [[ ! -f /usr/share/keyrings/caddy-stable-archive-keyring.gpg ]]; then
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
      | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  fi

  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    > /etc/apt/sources.list.d/caddy-stable.list

  apt-get update -qq
  apt-get install -y -qq caddy

  log "Caddy installed: $(caddy version)"
fi

# ─── Deploy base Caddyfile ────────────────────────────────
CADDY_DIR="/etc/caddy"
mkdir -p "$CADDY_DIR"
mkdir -p /var/log/caddy

cat > "${CADDY_DIR}/Caddyfile" <<CADDYEOF
{
	admin localhost:2019
	email ${ACME_EMAIL}
}

:80 {
	respond "Not Found" 404
}
CADDYEOF

log "Caddyfile deployed to ${CADDY_DIR}/Caddyfile (admin: localhost:2019)"

# ─── Enable and restart Caddy ────────────────────────────
systemctl enable caddy 2>/dev/null || true
systemctl restart caddy

log "Caddy is running with admin API bound to localhost:2019"

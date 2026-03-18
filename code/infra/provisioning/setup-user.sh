#!/usr/bin/env bash
# UnplugHQ — SSH User Setup with Limited Sudoers (idempotent)
#
# Creates the 'unplughq' system user on the VPS with SSH key access
# and restricted sudo permissions (E-04 mitigation).
#
# The unplughq user can ONLY sudo:
#   - Docker CLI commands
#   - Specific package management (apt-get update/install for Caddy/Docker)
#   - systemctl for caddy and docker services
#
# Usage: setup-user.sh --ssh-pubkey <public-key-string>
# Must be run as root.

set -euo pipefail

log() { echo "[unplughq] $(date -u +"%Y-%m-%dT%H:%M:%SZ") $*"; }

# ─── Argument parsing ────────────────────────────────────
SSH_PUBKEY=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --ssh-pubkey)  SSH_PUBKEY="$2"; shift 2 ;;
    *) log "Unknown argument: $1"; exit 1 ;;
  esac
done

if [[ -z "$SSH_PUBKEY" ]]; then
  log "ERROR: --ssh-pubkey is required"
  exit 1
fi

# ─── Pre-flight checks ───────────────────────────────────
if [[ $EUID -ne 0 ]]; then
  log "ERROR: This script must be run as root"
  exit 1
fi

USERNAME="unplughq"

# ─── Idempotency: create user only if not exists ─────────
if id "$USERNAME" &>/dev/null; then
  log "User '$USERNAME' already exists"
else
  log "Creating system user '$USERNAME'..."
  useradd \
    --system \
    --create-home \
    --shell /bin/bash \
    --groups docker \
    "$USERNAME"
  log "User '$USERNAME' created"
fi

# Ensure user is in docker group (idempotent)
usermod -aG docker "$USERNAME" 2>/dev/null || true

# ─── SSH key setup ────────────────────────────────────────
SSH_DIR="/home/${USERNAME}/.ssh"
AUTHORIZED_KEYS="${SSH_DIR}/authorized_keys"

mkdir -p "$SSH_DIR"
chmod 700 "$SSH_DIR"
chown "${USERNAME}:${USERNAME}" "$SSH_DIR"

# Add key if not already present (idempotent)
if [[ -f "$AUTHORIZED_KEYS" ]] && grep -qF "$SSH_PUBKEY" "$AUTHORIZED_KEYS"; then
  log "SSH public key already authorized"
else
  echo "$SSH_PUBKEY" >> "$AUTHORIZED_KEYS"
  log "SSH public key added to authorized_keys"
fi

chmod 600 "$AUTHORIZED_KEYS"
chown "${USERNAME}:${USERNAME}" "$AUTHORIZED_KEYS"

# ─── Restricted sudoers (E-04) ───────────────────────────
SUDOERS_FILE="/etc/sudoers.d/unplughq"
TMP_SUDOERS_FILE="$(mktemp)"

cat > "$TMP_SUDOERS_FILE" <<'SUDOERS'
# UnplugHQ — limited sudo for the unplughq service user (E-04)
# Only Docker CLI and the specific APT install/update operations needed by provisioning.
unplughq ALL=(root) NOPASSWD: /usr/bin/docker
unplughq ALL=(root) NOPASSWD: /usr/bin/apt-get update
unplughq ALL=(root) NOPASSWD: /usr/bin/apt-get install -y -qq ca-certificates curl gnupg lsb-release debian-keyring debian-archive-keyring apt-transport-https
unplughq ALL=(root) NOPASSWD: /usr/bin/apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
unplughq ALL=(root) NOPASSWD: /usr/bin/apt-get install -y -qq caddy
SUDOERS

chown root:root "$TMP_SUDOERS_FILE"
chmod 0440 "$TMP_SUDOERS_FILE"

if ! visudo -c -f "$TMP_SUDOERS_FILE" >/dev/null; then
  rm -f "$TMP_SUDOERS_FILE"
  log "ERROR: Generated sudoers file failed visudo validation"
  exit 1
fi

install -o root -g root -m 0440 "$TMP_SUDOERS_FILE" "$SUDOERS_FILE"
rm -f "$TMP_SUDOERS_FILE"

if ! visudo -c -f "$SUDOERS_FILE" >/dev/null; then
  log "ERROR: Installed sudoers file failed visudo validation"
  exit 1
fi

log "Sudoers configured: limited permissions for '$USERNAME' (root:root, 0440, visudo validated)"

# ─── Disable password authentication for this user ───────
if ! grep -q "^Match User ${USERNAME}" /etc/ssh/sshd_config; then
  cat >> /etc/ssh/sshd_config <<SSHEOF

# UnplugHQ service user — key-only authentication
Match User ${USERNAME}
    PasswordAuthentication no
    PubkeyAuthentication yes
    PermitEmptyPasswords no
SSHEOF
  systemctl reload sshd 2>/dev/null || systemctl reload ssh 2>/dev/null || true
  log "SSH config: password auth disabled for '$USERNAME'"
else
  log "SSH config for '$USERNAME' already present"
fi

log "User setup complete: $USERNAME (limited sudoers, SSH key auth only)"

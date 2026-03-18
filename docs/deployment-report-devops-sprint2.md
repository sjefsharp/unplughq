---
artifact: deployment-report-devops-sprint2
produced-by: devops-engineer
project-slug: unplughq
work-item: task-319-devops-p7-production-environment
work-item-type: task
parent-work-item: epic-001-unplughq-platform
workflow-tier: full
phase: P7
version: 1.0.0
status: draft
consumed-by:
  - product-owner
  - product-manager
  - testing
date: 2026-03-18
azure-devops-id: 319
review:
  reviewed-by:
  reviewed-date:
---

# Deployment Report — DevOps Sprint 2

## 1. Executive Summary

Production environment update for UnplugHQ Sprint 2 (PI-2). Sprint 2 introduces App Catalog & Deployment (F2), Dashboard & Health Monitoring (F3), and five bug fixes. This report covers all DevOps-owned infrastructure updates required to support these features in production.

**Branch:** `feat/pi-2-sprint-2`
**Infrastructure artifacts produced at P4:** `devops-sprint2-infrastructure.md` (AB#297)

### Verification Results

| Check | Result |
|-------|--------|
| TypeScript typecheck (`pnpm typecheck`) | **PASS** — exit 0 |
| ESLint (`pnpm lint`) | **PASS** — exit 0, zero warnings/errors |
| Shell syntax validation (4 provisioning scripts) | **PASS** — `bash -n` exit 0 |
| Sprint 2 infrastructure unit tests | **PASS** — 5 files, 94 tests |
| Full test suite | **PASS** — 33 files, 542 tests |

---

## 2. Production Environment Updates

### 2.1 Monitoring Agent — Per-Container Disk Usage

The monitoring agent (`infra/agent/agent.mjs`) has been updated for Sprint 2 with enhanced container telemetry:

| Capability | Sprint 1 | Sprint 2 |
|-----------|----------|----------|
| Container listing | `docker ps` text parsing | `docker inspect --size` JSON parsing |
| Container status | Parsed from `docker ps` STATUS column | Derived from `container.State` object (`Running`, `Paused`, `Restarting`, `Dead`, `Exited`) |
| Per-container disk usage | Not collected | `SizeRw` (writable layer) and `SizeRootFs` reported as `diskUsageBytes` |
| Docker network | Host network | Joins managed `unplughq` network |
| Agent version | 1.0.0 | 2.0.0 |

**Agent deployment script** (`infra/provisioning/deploy-agent.sh`):
- Idempotent: stops and removes existing container before redeployment
- Creates the `unplughq` Docker network if absent
- Runs read-only (`--read-only --security-opt=no-new-privileges --cap-drop=ALL`)
- Mounts Docker socket read-only and `/proc` read-only for host metrics
- Labels: `org.unplughq.component=monitoring-agent`, `org.unplughq.image=<digest>`
- Image metadata: records image digest at deploy time for audit

**Agent Dockerfile** (`infra/agent/Dockerfile`):
- Multi-stage build from `node:22-alpine`
- Non-root `agent` user (UID 1001)
- Production-only dependencies
- Healthcheck interval: 30s

**Production update procedure:**
```bash
deploy-agent.sh \
  --token <AGENT_API_TOKEN> \
  --server-id <SERVER_UUID> \
  --control-plane-url https://app.unplughq.com \
  --image ghcr.io/sjefsharp/unplughq-agent:latest \
  --network unplughq
```

### 2.2 Caddy Route Automation

Sprint 2 introduces automated Caddy route management for deployed user applications. The infrastructure supports adding and removing reverse proxy routes without disrupting existing traffic.

**Route template** (`infra/caddy/app-route.template.Caddyfile`):
- Variables: `{{DOMAIN}}`, `{{CONTAINER_PORT}}`, `{{CONTAINER_NAME}}`
- Security headers: HSTS (preload), `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`
- Per-app access logging to `/var/log/caddy/{{CONTAINER_NAME}}.log` with rotation (10 MB, 5 files)
- Reverse proxy to container by name on the `unplughq` Docker network

**SSH command templates for route management** (`src/server/ports/ssh-executor.ts`):

| Template | Purpose |
|----------|---------|
| `caddy-add-route` | Add a route with `routeId`, `domain`, `upstream` params |
| `caddy-remove-route` | Remove a route by `routeId` |
| `caddy-validate-config` | Validate Caddy config before and after route changes |
| `caddy-get-config` | Retrieve current Caddy config for pre-change snapshot |

**Infrastructure planner** (`src/server/services/deployment/infrastructure-templates.ts`):
- Route IDs follow convention: `unplughq-{containerName}`
- Delete path uses `DELETE /id/{routeId}` (Caddy Admin API `@id` traversal)
- Config validation runs before and after every route mutation

**Zero-downtime guarantee:** Route add/remove operations use the Caddy Admin API which performs live config reloads without dropping existing connections. The template includes `caddy-validate-config` both in setup (pre-deploy) and after route addition.

### 2.3 Docker Network

The managed Docker network `unplughq` is the connectivity backbone for all deployed containers:

| Setting | Value |
|---------|-------|
| Network name | `unplughq` |
| Creation | Idempotent via `docker-network-create` SSH template |
| Used by | Monitoring agent, deployed application containers, Caddy |
| Scope | Per-VPS (each provisioned server has its own `unplughq` network) |

The network is created during both provisioning (`deploy-agent.sh`) and deployment (`infrastructure-templates.ts` setup step). Both paths are idempotent — a pre-existing network is not an error.

### 2.4 Volume Mount Conventions

Sprint 2 formalizes the directory structure for deployed app data on user VPS servers:

| Path | Purpose | Mode |
|------|---------|------|
| `/opt/unplughq/data/{containerName}/` | Persistent application data | `0750` |
| `/opt/unplughq/env/{containerName}.env` | Application environment file | `0600` |
| `/opt/unplughq/data/` | Parent data directory | `0750` |
| `/opt/unplughq/env/` | Parent env directory | `0750` |

Environment files are uploaded via SFTP with `mode: 0o600` (T-10 mitigation). Directory creation is idempotent via the `ensure-directory` SSH command template.

---

## 3. Alert Email Infrastructure

### 3.1 SMTP Configuration

Alert email configuration is defined in `src/server/services/notifications/alert-email.ts` and driven entirely by environment variables:

| Environment Variable | Default | Purpose |
|---------------------|---------|---------|
| `SMTP_HOST` | `localhost` | SMTP server hostname |
| `SMTP_PORT` | `587` | SMTP port (587 = STARTTLS) |
| `SMTP_SECURE` | `false` | Use direct TLS (port 465) |
| `SMTP_USER` | — | SMTP authentication username |
| `SMTP_PASSWORD` | — | SMTP authentication password |
| `ALERT_EMAIL_FROM` | `alerts@unplughq.local` | Sender address |
| `ALERT_EMAIL_REPLY_TO` | — | Optional reply-to address |

These are declared in `.prerequisites.json` as optional environment variables with documentation links to Nodemailer SMTP docs.

**Production configuration:** Operators populate `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `ALERT_EMAIL_FROM` in the production `.env` file. The alert email subsystem is inert (emails queue but fail delivery) until SMTP credentials are configured — this is by design for self-hosting flexibility.

### 3.2 HTML Alert Templates

The `renderAlertEmailHtml()` function produces fully-formed HTML email templates with:

- Responsive table layout (max-width 640px)
- Dynamic facts table: alert type, severity, server, affected app, current value, threshold
- Dashboard deep-link CTA button
- Optional unsubscribe link for notification preferences
- Subject line format: `[UnplugHQ] {SEVERITY} {alertType} on {serverName}`
- Three severity levels: `info`, `warning`, `critical`

### 3.3 Dead-Letter Queue (DLQ)

Failed email deliveries are managed through BullMQ queue configuration:

| Queue | Config | Purpose |
|-------|--------|---------|
| `alert-email` | 3 attempts, exponential backoff (60s base), keep 250 completed | Primary delivery queue |
| `alert-email-dlq` | 1 attempt, keep 500 completed / 1000 failed | Dead-letter queue for permanently failed emails |

Queue options are exported as `alertEmailQueueOptions` and `alertEmailDlqQueueOptions` for backend consumption.

### 3.4 Delivery Logging

The `AlertEmailConfig` interface includes structured fields (`queueName`, `dlqName`, `maxAttempts`, `backoffDelayMs`) consumed by the backend BullMQ worker for structured logging of:
- Email enqueue events
- Delivery success/failure with attempt count
- DLQ transfer events

---

## 4. Sudoers Fix Deployment (B-262)

### 4.1 Fix Description

Bug B-262 identified that the `setup-user.sh` provisioning script's sudoers file installation had insufficient ownership and permission hardening. The fix ensures the generated sudoers file is installed as `root:root` with `0440` permissions and validated with `visudo -c` both before and after installation.

### 4.2 Implementation

The corrected sudoers installation in `infra/provisioning/setup-user.sh`:

1. **Write to temp file** — `cat > "$TMP_SUDOERS_FILE"` with heredoc containing restricted sudo rules
2. **Set ownership** — `chown root:root "$TMP_SUDOERS_FILE"`
3. **Set permissions** — `chmod 0440 "$TMP_SUDOERS_FILE"`
4. **Pre-install validation** — `visudo -c -f "$TMP_SUDOERS_FILE"` — exits 1 on failure after cleanup
5. **Atomic install** — `install -o root -g root -m 0440 "$TMP_SUDOERS_FILE" "$SUDOERS_FILE"` — uses `install` for atomic file placement
6. **Post-install validation** — `visudo -c -f "$SUDOERS_FILE"` — verifies the installed file
7. **Cleanup** — temp file removed after install

### 4.3 Restricted Sudo Scope (E-04)

The `unplughq` service user is restricted to:

| Command | Purpose |
|---------|---------|
| `/usr/bin/docker` | Container management |
| `/usr/bin/apt-get update` | Package list refresh |
| `/usr/bin/apt-get install -y -qq` (specific packages) | Docker CE and Caddy installation |

No wildcards, no shell access, no arbitrary command execution.

### 4.4 Existing Server Update Procedure

For servers already provisioned with the previous sudoers file:

```bash
# Re-run setup-user.sh on existing servers (idempotent)
# The script detects the existing user and overwrites the sudoers file
ssh root@<server-ip> 'bash -s' < infra/provisioning/setup-user.sh \
  --ssh-pubkey "<existing-public-key>"
```

The script is fully idempotent: existing user is not recreated, existing SSH key is not duplicated, sudoers file is replaced atomically with the corrected version.

### 4.5 Verification

- Shell syntax validation: `bash -n infra/provisioning/setup-user.sh` — **PASS**
- The script includes double `visudo -c` validation (pre- and post-install)
- Ownership: `root:root` via both `chown` and `install -o root -g root`
- Permissions: `0440` via both `chmod` and `install -m 0440`

---

## 5. CI/CD Pipeline Updates

### 5.1 CI Workflow (`ci.yml`)

The CI pipeline runs on push to `main` and on pull requests targeting `main`:

| Job | Command | Status |
|-----|---------|--------|
| Lint | `pnpm lint` | Active |
| Typecheck | `pnpm typecheck` | Active |
| Unit Tests | `pnpm test` | Active — runs full Vitest suite (542 tests) |
| Build | `pnpm build` (with `SKIP_ENV_VALIDATION=true`) | Active |
| Dependency Audit | `pnpm audit --prod` | Active |

Sprint 2 tests are included in the `pnpm test` command which runs all Vitest test files. The test suite now includes:

**Sprint 2 infrastructure test suites (5 files, 94 tests):**
- `deployment-state-machine.test.ts` — 37 tests (deployment lifecycle, state transitions)
- `caddy-route-management.test.ts` — 14 tests (route add/remove, validation)
- `health-check-service.test.ts` — 9 tests (container health verification)
- `alert-evaluation.test.ts` — 25 tests (threshold checks, alert creation)
- `email-notification.test.ts` — 9 tests (template rendering, queue config, DLQ)

**Sprint 2 integration test suites:**
- `deploy-app-lifecycle.test.ts` — 7 tests (end-to-end deployment flow)
- `alert-pipeline.test.ts` — 10 tests (metrics → alert → email pipeline)
- `monitor-router.test.ts` — 12 tests (dashboard, alerts, metrics endpoints)
- `app-router.test.ts` — catalog and deployment tRPC procedures

**Sprint 2 security test suites:**
- `csrf-middleware.test.ts` — 10 tests (B-258 double-submit cookie)
- `audit-logging.test.ts` — 14 tests (B-259 comprehensive audit trail)
- `secrets-rotation.test.ts` — 9 tests (B-260 SSH key rotation)

### 5.2 CD Workflow (`deploy.yml`)

The deployment pipeline triggers on push to `main` for changes in `code/**`:

| Stage | Description |
|-------|-------------|
| **CI Gate** | Lint → Typecheck → Test → Build |
| **Build Images** | Docker Buildx multi-stage build, push to `ghcr.io` (app + worker images) |
| **Migrate** | `pnpm db:migrate` against production `DATABASE_URL` |
| **Deploy** | SSH to production, pull images, rolling update (app then worker), health check with rollback |
| **Verify** | POST-deploy health check (5 retries, 10s interval) |

**Sprint 2 additions in the deploy flow:**
- Worker image (`Dockerfile.worker`) built and pushed alongside app image
- Migration step executes Sprint 2 migrations (new tables: `catalog_apps`, `deployments`, `alerts`)
- Rolling update deploys app first, then worker (zero-downtime)
- Rollback on health check failure (`HTTP != 200` → revert to previous containers)

### 5.3 Production Docker Compose

`docker-compose.production.yml` defines the control plane stack:

| Service | Image | Resources | Healthcheck |
|---------|-------|-----------|-------------|
| `caddy` | `caddy:2-alpine` | 128M / 0.25 CPU | `caddy validate` every 30s |
| `app` | Custom (Dockerfile) | 512M / 1.0 CPU | `wget` to `/api/health` every 15s |
| `worker` | Custom (Dockerfile.worker) | 512M / 1.0 CPU | Node process check every 30s |
| `postgres` | `postgres:17-alpine` | 1G / 1.0 CPU | `pg_isready` every 10s |
| `valkey` | `valkey/valkey:8-alpine` | 384M / 0.5 CPU | `valkey-cli ping` every 10s |

**Security hardening:**
- App and worker: `read_only: true` with tmpfs
- PostgreSQL and Valkey: no port exposure (Docker network only)
- All containers: JSON file logging with rotation limits
- PostgreSQL: connection logging, DDL statement logging, 1000ms slow query threshold

---

## 6. Production Readiness Checklist

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 1 | TypeScript typecheck passes | **PASS** | `pnpm typecheck` exit 0 |
| 2 | ESLint passes with zero errors | **PASS** | `pnpm lint` exit 0 |
| 3 | Shell script syntax valid (4 scripts) | **PASS** | `bash -n` exit 0 for all |
| 4 | Sprint 2 unit tests pass (94 tests) | **PASS** | Vitest: 5 files, 94 tests, 0 failures |
| 5 | Full test suite passes (542 tests) | **PASS** | Vitest: 33 files, 542 tests, 0 failures |
| 6 | Monitoring agent reports per-container disk usage | **PASS** | `agent.mjs` uses `docker inspect --size`, reports `diskUsageBytes` per container |
| 7 | Monitoring agent derives status from Docker state | **PASS** | `container.State` object parsed for `Running`/`Paused`/`Restarting`/`Dead` |
| 8 | Caddy route template deployed | **PASS** | `app-route.template.Caddyfile` with security headers, logging, reverse proxy |
| 9 | Caddy route add/remove via SSH templates | **PASS** | `caddy-add-route`, `caddy-remove-route` in `SSHCommandTemplate` union type |
| 10 | Route operations include config validation | **PASS** | `caddy-validate-config` in both setup and deploy steps of infrastructure plan |
| 11 | Docker network `unplughq` creation idempotent | **PASS** | `docker-network-create` template + `deploy-agent.sh` both create-if-absent |
| 12 | Volume mount conventions formalized | **PASS** | `infrastructure-templates.ts`: `UNPLUGHQ_DATA_ROOT`, `UNPLUGHQ_ENV_ROOT` constants |
| 13 | Env files deployed with 0600 permissions | **PASS** | SFTP upload with `mode: 0o600` in infrastructure plan |
| 14 | SMTP configuration via environment variables | **PASS** | `getAlertEmailConfig()` reads from `process.env`, declared in `.prerequisites.json` |
| 15 | HTML alert email template functional | **PASS** | `renderAlertEmailHtml()` produces responsive HTML with severity, facts, CTA |
| 16 | Alert email DLQ configured | **PASS** | `alertEmailDlqQueueOptions`: 1 attempt, keep 500/1000, exponential backoff on primary |
| 17 | Sudoers fix: root:root ownership | **PASS** | `install -o root -g root` in `setup-user.sh` |
| 18 | Sudoers fix: 0440 permissions | **PASS** | `install -m 0440` in `setup-user.sh` |
| 19 | Sudoers fix: double visudo validation | **PASS** | Pre-install + post-install `visudo -c -f` with exit-on-failure |
| 20 | Sudoers fix: idempotent re-application | **PASS** | Script detects existing user, replaces sudoers atomically |
| 21 | CI runs Sprint 2 test suites | **PASS** | `pnpm test` in `ci.yml` covers all 542 tests including Sprint 2 suites |
| 22 | CD builds and pushes worker image | **PASS** | `deploy.yml` Build Images job includes `Dockerfile.worker` |
| 23 | CD runs migrations before deploy | **PASS** | `deploy.yml` separate `migrate` job (needs `build`, gates `deploy`) |
| 24 | CD rolling update with health check + rollback | **PASS** | Deploy script: app first → worker → health check → rollback on failure |
| 25 | Zero-downtime deployment maintained | **PASS** | `docker compose up -d --no-deps --wait` per service, Caddy live reload |

**Overall: 25/25 PASS — Production environment ready for Sprint 2 deployment.**

---

## 7. Known Considerations

1. **SMTP credentials not pre-populated:** Alert email delivery requires operators to configure SMTP credentials in production `.env`. The system is designed to queue emails silently without SMTP — delivery begins once credentials are set. This is intentional for self-hosting flexibility.

2. **Caddy Admin API route path:** The implementation uses `DELETE /id/{routeId}` for route removal via Caddy's `@id` traversal, which differs from the config-path approach described in some upstream docs. Backend agents should follow the implemented path in `infrastructure-templates.ts`.

3. **`next lint` deprecation notice:** ESLint reports that `next lint` is deprecated in Next.js 16. The lint command still exits 0 and produces correct results. Migration to the ESLint CLI (`@next/codemod next-lint-to-eslint-cli`) should be tracked as a Sprint 3 maintenance task.

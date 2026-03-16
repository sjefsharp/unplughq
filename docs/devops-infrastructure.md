---
artifact: devops-infrastructure
produced-by: devops-engineer
project-slug: unplughq
work-item: epic-001-unplughq-platform
work-item-type: task
parent-work-item: epic-001-unplughq-platform
workflow-tier: full
phase: P4
version: 1.0.0
status: approved
consumed-by:
  - tech-lead
  - testing
  - frontend-developer
  - backend-developer
date: 2026-03-15
azure-devops-id: 239
---

# DevOps Infrastructure — CI/CD, Docker, Monitoring Agent, Provisioning

## Overview

This artifact documents the infrastructure deliverables for UnplugHQ's P4 Sprint 1 implementation. All files are in the `code/` directory of the project repository.

## 1. Docker Compose Development Environment

**File:** `code/docker-compose.yml`

Services:
| Service | Image | Port | Health Check |
|---------|-------|------|-------------|
| postgres | postgres:17-alpine | 5432 | `pg_isready` every 5s |
| valkey | valkey/valkey:8-alpine | 6379 | `valkey-cli ping` every 5s |
| app | Local Dockerfile (dev target) | 3000 | `curl /api/health` every 10s |
| worker | Local Dockerfile (dev target) | — | — |

- All credentials sourced from environment variables (no hardcoded secrets)
- Valkey requires AUTH password (T-07 mitigation)
- Persistent volumes for `pgdata` and `valkeydata`
- App service uses volume mount for hot reload

**File:** `code/.env.example` — Documents all environment variables for local development, CI, and monitoring agent.

**File:** `code/Dockerfile` — Multi-stage build with `dev` (hot reload) and `production` (standalone) targets.

## 2. CI Pipeline (GitHub Actions)

**File:** `code/.github/workflows/ci.yml`

| Job | Purpose | Depends On |
|-----|---------|-----------|
| lint | ESLint | — |
| typecheck | `tsc --noEmit` | — |
| test | Vitest unit tests | — |
| build | Next.js production build | lint, typecheck, test |
| audit | `pnpm audit --prod` | — |

- Triggered on push to `main` and pull requests
- Concurrency control: cancels in-progress runs for same ref
- Uses pnpm 10 with frozen lockfile

## 3. Monitoring Agent Container

**Directory:** `code/infra/agent/`

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build; runs as non-root `agent` user |
| `agent.mjs` | Node.js metrics collector |
| `package.json` | Agent dependencies |

**Metrics collected (conforming to MetricsSnapshot schema):**
- CPU% (from `/proc/stat` delta)
- RAM used/total (from `/proc/meminfo`)
- Disk used/total (from `df`)
- Network RX/TX bytes per second (from `/proc/net/dev` delta)
- Container statuses (from `docker ps`)

**Security constraints (T-05, E-01):**
- Read-only filesystem (`--read-only`)
- No new privileges (`--security-opt=no-new-privileges`)
- All capabilities dropped (`--cap-drop=ALL`)
- Docker socket mounted read-only
- Non-root user (UID 1001)

**Reporting:** HTTPS POST to `/api/agent/metrics` every 30 seconds with per-server API token in `Authorization: Bearer` header.

## 4. Caddy Configuration Templates

**Directory:** `code/infra/caddy/`

| File | Purpose |
|------|---------|
| `Caddyfile` | Base configuration — admin API localhost:2019 (T-04), ACME email |
| `app-route.template.Caddyfile` | Per-app route template with reverse proxy, security headers |

**Security controls:**
- Admin API bound to `localhost:2019` only (T-04: prevents remote Caddy config tampering)
- ACME integration via Let's Encrypt for automatic SSL
- Security headers: HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy

## 5. Provisioning Scripts

**Directory:** `code/infra/provisioning/`

| Script | Purpose | Idempotent |
|--------|---------|-----------|
| `install-docker.sh` | Docker Engine on Debian/Ubuntu | Yes — skips if `docker` exists |
| `install-caddy.sh` | Caddy with base Caddyfile | Yes — skips if `caddy` exists |
| `deploy-agent.sh` | Monitoring agent container | Yes — replaces existing container |
| `setup-user.sh` | `unplughq` SSH user + limited sudoers | Yes — skips if user exists |

**Security controls (E-04):**
- `unplughq` user has limited sudoers: only Docker CLI, specific apt-get, and Caddy/Docker systemctl
- SSH key-only authentication (password auth disabled)
- All scripts require root execution
- No hardcoded secrets — all credentials passed as arguments

## Verification Results

| Check | Result |
|-------|--------|
| TypeScript type check (`pnpm typecheck`) | PASS — exit 0 |
| ESLint (`pnpm lint`) | PASS — 0 errors, 0 warnings |
| No hardcoded secrets | PASS — all credentials via env vars or CLI args |
| Caddy admin localhost-only | PASS — `admin localhost:2019` |
| Redis AUTH required | PASS — `--requirepass` flag |
| Agent read-only filesystem | PASS — `--read-only` flag in deploy script |
| Provisioning idempotent | PASS — all scripts check before acting |
| SSH user limited sudoers | PASS — restricted to Docker, apt-get, systemctl |

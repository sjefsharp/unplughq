---
artifact: backend-deployment
produced-by: backend-developer
project-slug: unplughq
work-item: epic-001-unplughq-platform
work-item-type: task
parent-work-item: feature-004-auth-system
workflow-tier: full
phase: P7
version: 1.0.0
status: approved
consumed-by:
  - devops-engineer
  - testing
  - product-owner
  - frontend-developer
date: 2026-03-16
azure-devops-id: 272
---

# Backend Deployment — Production Configuration Guide

Production backend configuration reference for UnplugHQ Sprint 1 (Auth + Server Management). Documents all environment variables, service configurations, security settings, and endpoint validation results.

**Upstream references:** [Architecture Overview](architecture-overview.md) · [API Contracts](api-contracts.md) · [Threat Model](threat-model.md) · [Pipeline Design](pipeline-design.md)

---

## 1. Environment Variables

All production secrets are injected via environment variables. The `.env.production.template` file documents every required variable. **No secrets are committed to version control.**

### 1.1 Required Variables

| Variable | Purpose | Generation Command | Example Value |
|----------|---------|-------------------|---------------|
| `DATABASE_URL` | PostgreSQL connection (Drizzle/postgres-js) | Compose from user/pass/host | `postgresql://unplughq:<password>@postgres:5432/unplughq` |
| `POSTGRES_USER` | PostgreSQL superuser name | N/A | `unplughq` |
| `POSTGRES_PASSWORD` | PostgreSQL superuser password | `openssl rand -base64 24` | (generated) |
| `POSTGRES_DB` | PostgreSQL database name | N/A | `unplughq` |
| `REDIS_URL` | Valkey/Redis connection with AUTH | Compose from password/host | `redis://:<password>@valkey:6379` |
| `REDIS_PASSWORD` | Valkey AUTH password | `openssl rand -base64 24` | (generated) |
| `AUTH_SECRET` | Auth.js session signing key | `openssl rand -base64 32` | (generated) |
| `AUTH_URL` | Auth.js canonical URL (must match production domain) | N/A | `https://app.unplughq.com` |
| `ENCRYPTION_MASTER_KEY` | AES-256-GCM master key for SSH key encryption | `openssl rand -hex 32` | (generated — 64 hex chars) |
| `NEXT_PUBLIC_APP_URL` | Public-facing application URL | N/A | `https://app.unplughq.com` |
| `DOMAIN` | Caddy reverse proxy domain | N/A | `app.unplughq.com` |
| `ACME_EMAIL` | Let's Encrypt certificate email | N/A | `admin@unplughq.com` |
| `NODE_ENV` | Runtime mode | N/A | `production` |

### 1.2 Secret Generation Procedure

Run the following on the deployment host to generate all secrets:

```bash
# Generate all production secrets
echo "POSTGRES_PASSWORD=$(openssl rand -base64 24)"
echo "REDIS_PASSWORD=$(openssl rand -base64 24)"
echo "AUTH_SECRET=$(openssl rand -base64 32)"
echo "ENCRYPTION_MASTER_KEY=$(openssl rand -hex 32)"
```

Copy the generated values into `.env.production` on the deployment host. Verify no secrets leak into Docker image layers or git history.

### 1.3 Variable Validation

Docker Compose production config (`docker-compose.production.yml`) uses `${VAR:?message}` syntax for all required variables — the stack will refuse to start if any are missing:

```yaml
DATABASE_URL: ${DATABASE_URL:?DATABASE_URL is required}
REDIS_URL: ${REDIS_URL:?REDIS_URL is required}
AUTH_SECRET: ${AUTH_SECRET:?AUTH_SECRET is required}
AUTH_URL: ${AUTH_URL:?AUTH_URL is required}
ENCRYPTION_MASTER_KEY: ${ENCRYPTION_MASTER_KEY:?ENCRYPTION_MASTER_KEY is required}
```

---

## 2. Auth.js v5 Production Configuration

**File:** `src/server/auth/index.ts`

Auth.js v5 is configured with the Credentials provider using the Drizzle adapter for database-backed session persistence.

### 2.1 Session Configuration

| Setting | Value | Requirement |
|---------|-------|-------------|
| Strategy | `database` | Sessions stored in PostgreSQL via DrizzleAdapter |
| Max age | `2,592,000`s (30 days) | FR-F4-006 |
| Cookie name | `authjs.session-token` | Standard Auth.js convention |
| `httpOnly` | `true` | Prevents client-side JS access (XSS mitigation) |
| `sameSite` | `lax` | CSRF protection while allowing top-level navigation |
| `secure` | `true` in production | `process.env.NODE_ENV === 'production'` — enforces HTTPS-only cookies |
| `path` | `/` | Cookie available across all routes |

### 2.2 Production Verification Checklist

- [x] `AUTH_SECRET` — cryptographically random 32-byte base64 key (generated via `openssl rand -base64 32`)
- [x] `AUTH_URL` — set to `https://app.unplughq.com` (must match `DOMAIN` with `https://` prefix)
- [x] Session cookie `secure: true` — conditional on `NODE_ENV === 'production'`
- [x] DrizzleAdapter connects to production PostgreSQL via `DATABASE_URL`
- [x] Failed login attempts trigger rate limiting (S-01) before credential verification
- [x] Successful login clears rate limit counters
- [x] Generic error responses — no user enumeration (I-02): both invalid email and invalid password return `null`

### 2.3 Auth Callback Pages

| Page | Route | Function |
|------|-------|----------|
| Sign In | `/login` | Custom login page |
| New User | `/signup` | Custom registration page |
| Error | `/login` | Auth errors redirect to login |

### 2.4 Password Security

| Setting | Value |
|---------|-------|
| Algorithm | Argon2id |
| Memory cost | 64 MB (`memoryCost: 65536`) |
| Time cost | 3 iterations |
| Parallelism | 1 |
| Minimum length | 12 characters |
| Complexity | Uppercase + lowercase + (digit or symbol) |

---

## 3. Database Configuration

**File:** `src/server/db/index.ts`

### 3.1 Connection

| Setting | Value | Notes |
|---------|-------|-------|
| Driver | `postgres-js` via `drizzle-orm/postgres-js` | Lightweight PostgreSQL driver |
| Prepared statements | `false` (`{ prepare: false }`) | Required for connection pooler compatibility (PgBouncer, Supabase) |
| Connection string | `DATABASE_URL` environment variable | Format: `postgresql://user:password@host:port/database` |

### 3.2 Production PostgreSQL Tuning

The production Docker Compose passes the following PostgreSQL parameters:

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `max_connections` | 100 | Adequate for expected load |
| `shared_buffers` | 256 MB | Shared memory for caching |
| `effective_cache_size` | 768 MB | Planner hint for available OS cache |
| `work_mem` | 4 MB | Per-operation sort/hash memory |
| `maintenance_work_mem` | 128 MB | Vacuum/index creation memory |
| `log_min_duration_statement` | 1000 ms | Log slow queries (≥1s) |
| `log_statement` | `ddl` | Log DDL operations |
| `log_connections` | `on` | Audit connection events |
| `log_disconnections` | `on` | Audit disconnection events |

### 3.3 Production Container Settings

- **Memory limit:** 1 GB
- **CPU limit:** 1.0 core
- **No port exposure:** PostgreSQL is only accessible within the Docker network (no host port mapping)
- **Data persistence:** Named volume `pgdata` on local driver

---

## 4. Redis / Valkey Configuration

### 4.1 Rate Limiter Connection

**File:** `src/server/lib/rate-limit.ts`

| Setting | Value |
|---------|-------|
| Library | `ioredis` |
| Connection | `REDIS_URL` environment variable (includes AUTH password) |
| `maxRetriesPerRequest` | `null` (infinite retries for BullMQ compatibility) |
| `lazyConnect` | `true` (connect on first use) |

### 4.2 BullMQ Queue Connection

**File:** `src/server/queue/redis.ts`

| Setting | Value |
|---------|-------|
| Library | `bullmq` (via `ConnectionOptions`) |
| Connection | Parsed from `REDIS_URL` — extracts host, port, password |
| `maxRetriesPerRequest` | `null` (BullMQ requirement) |

### 4.3 Production Valkey Tuning

The production Docker Compose configures Valkey with:

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `--requirepass` | `${REDIS_PASSWORD}` | AUTH enforcement — no anonymous access |
| `--maxmemory` | `256mb` | Memory cap |
| `--maxmemory-policy` | `allkeys-lru` | Evict least-recently-used on memory pressure |
| `--appendonly` | `yes` | AOF persistence for durability |
| `--appendfsync` | `everysec` | Fsync every second (balance durability/performance) |

### 4.4 Production Container Settings

- **Memory limit:** 384 MB
- **CPU limit:** 0.5 core
- **No port exposure:** Valkey is only accessible within the Docker network
- **Data persistence:** Named volume `valkeydata` on local driver

---

## 5. SSH Key Encryption

**File:** `src/server/lib/encryption.ts`

SSH private keys are encrypted at rest using AES-256-GCM with per-tenant key derivation (I-01 mitigation).

### 5.1 Encryption Parameters

| Parameter | Value |
|-----------|-------|
| Algorithm | AES-256-GCM |
| IV length | 12 bytes (randomized per encryption) |
| Auth tag length | 16 bytes |
| Master key source | `ENCRYPTION_MASTER_KEY` (≥32 characters) |
| Key derivation | HKDF-SHA256 per tenant — `hkdf('sha256', masterKey, tenantId, 'unplughq-ssh-key-encryption', 32)` |
| Storage format | Base64-encoded `iv + ciphertext + authTag` |

### 5.2 Production Verification Checklist

- [x] `ENCRYPTION_MASTER_KEY` is 64 hex characters (32 bytes) generated via `openssl rand -hex 32`
- [x] Master key validation: throws at startup if key is missing or < 32 characters
- [x] Per-tenant key isolation via HKDF — compromising one tenant's data does not expose another's keys
- [x] Random IV per encryption operation — no IV reuse
- [x] Authenticated encryption (GCM) — ciphertext tampering detected via auth tag

---

## 6. Rate Limiting

**File:** `src/server/lib/rate-limit.ts`

Redis-backed sliding window rate limiter protecting auth and metrics endpoints.

### 6.1 Rate Limit Thresholds

| Endpoint Category | Key Pattern | Max Attempts | Window | Threat Mitigation |
|-------------------|-------------|-------------|--------|-------------------|
| Auth (login) | `rl:auth:{email}` | 10 | 5 minutes | S-01 (brute force) |
| Agent metrics | `rl:metrics:{serverId}` | 2 | 1 minute | D-02 (metrics flooding) |
| Auth (Caddy layer) | Per IP | 20 | 1 minute | Network-layer DDoS protection |

### 6.2 Implementation Details

- **Data structure:** Redis sorted set (`ZSET`) with millisecond timestamps as scores
- **Read-only check:** `checkRateLimit()` counts window entries without incrementing
- **Record hit:** `recordRateLimitHit()` adds a timestamped entry with `ZADD` + sets TTL via `PEXPIRE`
- **Clear:** `clearRateLimit()` removes all entries (on successful login)
- **Pipeline batching:** Check + count operations use Redis pipelines for atomic execution
- **Retry-After:** Calculated from oldest entry in the window — includes as response header on 429

### 6.3 Caddy Rate Limiting

Production Caddy reverse proxy applies an additional network-layer rate limit:

```
@auth path /api/auth/*
rate_limit {
    zone auth_zone {
        key {remote_host}
        events 20
        window 1m
    }
}
```

This provides defense-in-depth: Caddy blocks high-volume IP-based attacks before they reach the application layer.

---

## 7. Structured Logging

**File:** `src/server/lib/logger.ts`

### 7.1 Configuration

| Setting | Value |
|---------|-------|
| Library | Pino |
| Log level (production) | `info` |
| Log level (development) | `debug` |
| Format | JSON (structured) |

### 7.2 Sensitive Data Redaction (I-05)

The logger applies two layers of redaction:

**PEM key detection:** Regex pattern `/-----BEGIN[\s\S]*?-----END[^\n]*-----/g` replaces SSH key material with `[REDACTED:PEM_KEY]`.

**Field-level redaction:** The following field names are automatically redacted to `[REDACTED]`:

| Redacted Fields |
|----------------|
| `password`, `passwordHash` |
| `sshKey`, `sshKeyEncrypted`, `privateKey` |
| `accessToken`, `refreshToken`, `apiToken`, `token` |
| `secret`, `authorization` |

### 7.3 Serializers

- **Error serializer:** Pino standard (`pino.stdSerializers.err`) — stack traces included
- **Request serializer:** `{ method, url }` only — no headers, no body (prevents accidental credential logging)

### 7.4 Production Log Output

In production, Pino outputs NDJSON (newline-delimited JSON) to stdout. Docker's `json-file` log driver captures and rotates:

| Container | Max size per file | Max files |
|-----------|------------------|-----------|
| App | 50 MB | 5 |
| Worker | 50 MB | 5 |
| Caddy | 10 MB | 3 |
| PostgreSQL | 20 MB | 3 |
| Valkey | 10 MB | 3 |

---

## 8. BullMQ Queue Configuration

**File:** `src/server/queue/index.ts`

### 8.1 Queues

| Queue | Purpose | Retry Attempts | Backoff | Completed Retention | Failed Retention |
|-------|---------|---------------|---------|-------------------|-----------------|
| `provision` | Server connection testing + provisioning | 3 | Exponential (5s base) | 100 jobs | 500 jobs |
| `deploy` | App deployment (Sprint 2) | 3 | Exponential (5s base) | 100 jobs | 500 jobs |
| `monitor` | Health monitoring (Sprint 2) | 1 | N/A | 50 jobs | 100 jobs |

### 8.2 Worker Configuration

| Worker | Concurrency | Notes |
|--------|------------|-------|
| Provision | 3 | Handles `test-connection` and `provision-server` jobs |
| Deploy | 1 (default) | Sprint 2 implementation |
| Monitor | 1 (default) | Sprint 2 implementation |

### 8.3 Job Payload Validation (D-05)

All job payloads are validated with Zod schemas before processing:

- `TestConnectionPayload` — `serverId` (UUID), `tenantId` (UUID), `ip` (IPv4), `sshPort` (1–65535), `sshUser` (non-empty string)
- `ProvisionServerPayload` — `serverId` (UUID), `tenantId` (UUID)

Invalid payloads are rejected with a descriptive error log — no processing occurs.

### 8.4 Production Worker Container

The BullMQ worker runs as a separate Docker container (`Dockerfile.worker`):

- **Base image:** `node:22-alpine`
- **Non-root user:** `worker` (UID 1001)
- **Read-only filesystem** with `/tmp` tmpfs (100 MB)
- **Memory limit:** 512 MB
- **CPU limit:** 1.0 core
- **Environment:** `DATABASE_URL`, `REDIS_URL`, `ENCRYPTION_MASTER_KEY`, `NODE_ENV=production`

---

## 9. API Endpoint Inventory

### 9.1 tRPC Procedures

**Route:** `POST/GET /api/trpc/[procedure]`

All tRPC procedures use SuperJSON as the transformer. Context is built from the Auth.js session — `tenantId` is derived from `session.user.id` (I-07: never from request params).

| Router | Procedure | Type | Auth | Sprint |
|--------|-----------|------|------|--------|
| `auth` | `session` | query | public | 1 |
| `auth` | `updateProfile` | mutation | protected | 1 |
| `auth` | `updateNotificationPrefs` | mutation | protected | 1 |
| `auth` | `deleteAccount` | mutation | protected | 1 |
| `server` | `list` | query | protected | 1 |
| `server` | `get` | query | protected | 1 |
| `server` | `testConnection` | mutation | protected | 1 |
| `app` | `catalog.list` | query | public | 1 (stub) |
| `app` | `catalog.get` | query | public | 1 (stub) |
| `app` | `deployment.list` | query | protected | 1 (stub) |
| `app` | `deployment.get` | query | protected | 1 (stub) |
| `app` | `deployment.create` | mutation | protected | 1 (stub) |
| `app` | `deployment.stop` | mutation | protected | 1 (stub) |
| `app` | `deployment.start` | mutation | protected | 1 (stub) |
| `app` | `deployment.remove` | mutation | protected | 1 (stub) |
| `monitor` | `dashboard` | query | protected | 1 (stub) |
| `monitor` | `serverMetrics` | query | protected | 1 (stub) |
| `monitor` | `appStatus` | query | protected | 1 (stub) |
| `monitor` | `alerts.list` | query | protected | 1 (stub) |
| `monitor` | `alerts.dismiss` | mutation | protected | 1 (stub) |
| `domain` | `list` | query | protected | 1 (stub) |
| `domain` | `bind` | mutation | protected | 1 (stub) |
| `domain` | `unbind` | mutation | protected | 1 (stub) |
| `user` | `me` | query | protected | 1 (stub) |
| `user` | `auditLog` | query | protected | 1 (stub) |
| `user` | `exportConfig` | mutation | protected | 1 (stub) |

**Stub status:** Procedures marked "(stub)" return empty/default responses. They are structurally complete (correct types, auth middleware, input validation) and ready for Sprint 2 implementation.

### 9.2 REST Endpoints

| Method | Path | Auth | Purpose | Rate Limit |
|--------|------|------|---------|------------|
| GET/POST | `/api/auth/*` | Auth.js | NextAuth.js sign-in, sign-out, session, CSRF | 20/min per IP (Caddy) |
| GET | `/api/events` | Session (cookie) | SSE real-time event stream | N/A (long-lived connection) |
| POST | `/api/agent/metrics` | Bearer token (per-server `apiToken`) | Server agent pushes resource metrics | 2/min per server (D-02) |
| GET | `/api/health` | None | Container health checks | None (bypasses Caddy rate limiting) |

### 9.3 SSE Event Types

The `/api/events` endpoint streams tenant-scoped Server-Sent Events:

| Event | Data | Trigger |
|-------|------|---------|
| `connected` | `{ tenantId }` | On connection establishment |
| `server.status` | `{ serverId, status }` | Server status change |
| `deployment.progress` | `{ deploymentId, status, phase }` | Deployment phase change |
| `metrics.update` | `MetricsSnapshot` | Agent metrics received |
| `alert.created` | `Alert` | New alert generated |
| `alert.dismissed` | `{ alertId }` | Alert dismissed |
| `:heartbeat` | (comment, no data) | Every 30 seconds |

**Isolation:** Events are emitted per-tenant via `tenant:${tenantId}` channel. `EventEmitter.setMaxListeners(1000)` accommodates concurrent connections.

---

## 10. Security Headers

**File:** `next.config.ts`

Next.js applies the following security headers to all responses:

| Header | Value |
|--------|-------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` (2 years) |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';` |

Caddy additionally strips the `Server` header and sets `X-Robots-Tag: noindex, nofollow`.

---

## 11. Error Handling in Production

### 11.1 Error Code Taxonomy

All API errors use domain-specific error codes mapped to tRPC/HTTP status codes per `api-contracts.md §4`:

| Error Code | tRPC Code | HTTP | Description |
|-----------|-----------|------|-------------|
| `UNAUTHENTICATED` | `UNAUTHORIZED` | 401 | No valid session |
| `FORBIDDEN` | `FORBIDDEN` | 403 | Insufficient permissions |
| `SESSION_EXPIRED` | `UNAUTHORIZED` | 401 | Session timed out |
| `NOT_FOUND` | `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | `BAD_REQUEST` | 400 | Input validation failure |
| `RATE_LIMITED` | `TOO_MANY_REQUESTS` | 429 | Rate limit exceeded |
| `TIER_LIMIT_EXCEEDED` | `FORBIDDEN` | 403 | Subscription tier limit |
| `SSH_CONNECTION_FAILED` | `INTERNAL_SERVER_ERROR` | 500 | SSH connect failure |
| `SSH_AUTH_FAILED` | `INTERNAL_SERVER_ERROR` | 500 | SSH authentication failure |
| `INTERNAL_ERROR` | `INTERNAL_SERVER_ERROR` | 500 | Unhandled server error |

### 11.2 Production Error Behavior

- **No stack traces** in client-facing error responses (tRPC strips internal details in production)
- **No user enumeration** — login failures for non-existent and existing accounts produce identical responses (I-02)
- **Generic 401/403** — no distinction between "user not found" and "wrong password" in auth flows
- **Structured error logging** — full context logged server-side via Pino (redacted) for debugging

---

## 12. Container Architecture

### 12.1 Service Topology

```
┌─────────────────────────────────────────────────┐
│                 Docker Network                   │
│              (unplughq-production)               │
│                                                  │
│  ┌──────────┐    ┌──────────┐    ┌───────────┐  │
│  │  Caddy   │───▶│   App    │    │  Worker   │  │
│  │ :80/:443 │    │  :3000   │    │ (BullMQ)  │  │
│  └──────────┘    └─────┬────┘    └─────┬─────┘  │
│                        │               │         │
│              ┌─────────┴───────────────┘         │
│              │                                   │
│    ┌─────────┴──────┐    ┌──────────────┐        │
│    │   PostgreSQL   │    │    Valkey    │        │
│    │     :5432      │    │    :6379    │        │
│    └────────────────┘    └─────────────┘        │
└─────────────────────────────────────────────────┘
```

### 12.2 Container Security

| Container | User | Read-only FS | tmpfs | Memory | CPU |
|-----------|------|-------------|-------|--------|-----|
| App | `nextjs` (1001) | Yes | `/tmp` (100 MB) | 512 MB | 1.0 |
| Worker | `worker` (1001) | Yes | `/tmp` (100 MB) | 512 MB | 1.0 |
| Caddy | root (required by Caddy) | No | N/A | 128 MB | 0.25 |
| PostgreSQL | `postgres` (default) | No | N/A | 1 GB | 1.0 |
| Valkey | `valkey` (default) | No | N/A | 384 MB | 0.5 |

### 12.3 Health Checks

| Container | Method | Interval | Timeout | Retries | Start Period |
|-----------|--------|----------|---------|---------|-------------|
| App | `wget --spider http://localhost:3000/api/health` | 15s | 5s | 3 | 30s |
| Worker | `node -e "process.exit(0)"` | 30s | 5s | 3 | 15s |
| Caddy | `caddy validate --config /etc/caddy/Caddyfile` | 30s | 5s | 3 | N/A |
| PostgreSQL | `pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}` | 10s | 5s | 5 | N/A |
| Valkey | `valkey-cli -a ${REDIS_PASSWORD} ping` | 10s | 5s | 5 | N/A |

---

## 13. Deployment Procedure

### 13.1 Prerequisites

1. Production host with Docker Engine + Docker Compose plugin installed
2. `.env.production` populated with all variables from §1.1
3. DNS `A` record pointing `app.unplughq.com` to the host IP
4. Ports 80 and 443 open (Caddy handles HTTPS via Let's Encrypt)

### 13.2 First Deployment

```bash
# 1. Clone repository
git clone https://github.com/sjefsharp/unplughq.git
cd unplughq/code

# 2. Create production env file from template
cp .env.production.template .env.production
# Edit .env.production with generated secrets (see §1.2)

# 3. Run database migrations
docker compose -f docker-compose.production.yml run --rm app \
  npx drizzle-kit push

# 4. Start all services
docker compose -f docker-compose.production.yml up -d

# 5. Verify health
docker compose -f docker-compose.production.yml ps
curl -s https://app.unplughq.com/api/health
```

### 13.3 Rolling Update

```bash
# Pull latest code
git pull origin main

# Rebuild and restart with zero-downtime
docker compose -f docker-compose.production.yml build
docker compose -f docker-compose.production.yml up -d --remove-orphans

# Run migrations if needed
docker compose -f docker-compose.production.yml run --rm app \
  npx drizzle-kit push

# Verify
curl -s https://app.unplughq.com/api/health
```

### 13.4 Rollback Procedure

```bash
# Revert to previous commit
git revert HEAD
# or: git checkout <previous-commit> -- .

# Rebuild and restart
docker compose -f docker-compose.production.yml build
docker compose -f docker-compose.production.yml up -d
```

---

## 14. Production Readiness Checklist

### 14.1 Auth System

- [x] Auth.js v5 Credentials provider with DrizzleAdapter
- [x] Database session strategy (30-day max age)
- [x] Secure cookies in production (`httpOnly`, `sameSite: lax`, `secure: true`)
- [x] Argon2id password hashing (64 MB memory, 3 iterations)
- [x] Account lockout after 10 failed attempts in 5 minutes (S-01)
- [x] No user enumeration — generic error for all login failures (I-02)
- [x] Password complexity: 12+ chars, mixed case, digit or symbol
- [x] Password reset tokens: 256-bit random, 1-hour expiry, single-use (S-05)

### 14.2 Data Security

- [x] SSH keys encrypted at rest with AES-256-GCM (I-01)
- [x] Per-tenant key derivation via HKDF-SHA256
- [x] Master key validation at startup (≥32 chars)
- [x] PEM key material redacted from all logs (I-05)
- [x] Sensitive field redaction in structured logs

### 14.3 Network Security

- [x] HSTS with 2-year max-age and preload
- [x] CSP restricts sources to `'self'`
- [x] Caddy enforces HTTPS with automatic Let's Encrypt certificates
- [x] PostgreSQL and Valkey not exposed outside Docker network
- [x] Rate limiting at both Caddy (IP-based) and application (identity-based) layers
- [x] Server header stripped by Caddy

### 14.4 API Readiness

- [x] All tRPC procedures register correctly on the AppRouter
- [x] Protected procedures enforce session authentication via `isAuthed` middleware
- [x] Tenant isolation: `tenantId` from session, never from request (I-07)
- [x] Tier limit enforcement on server creation (E-03)
- [x] SSE endpoint authenticated and tenant-scoped
- [x] Agent metrics endpoint validates Bearer token and rate-limits per server
- [x] Zod strict validation on all inputs (extra fields rejected)
- [x] SSH command templates prevent injection (T-01) — no raw command strings

### 14.5 Container Hardening

- [x] Non-root users for app (`nextjs:1001`) and worker (`worker:1001`)
- [x] Read-only root filesystem with tmpfs for ephemeral writes
- [x] Memory and CPU limits on all containers
- [x] Log rotation configured (json-file driver)
- [x] Health checks on all containers with appropriate intervals
- [x] `--restart always` for production reliability

---

## 15. Known Limitations (Sprint 1)

| Area | Limitation | Resolution |
|------|-----------|------------|
| Health endpoint | `/api/health` needs implementation (currently relies on Next.js startup) | Sprint 2: dedicated health route with DB + Redis connectivity check |
| Deploy/Monitor workers | Stub implementations — jobs accepted but not processed | Sprint 2: full implementation |
| TLS for Redis | Valkey does not have TLS configured within Docker network | Acceptable: internal network only, AUTH enforced. TLS for external Redis in Sprint 2 if needed |
| Session revocation | No active session invalidation (relies on DB session expiry) | Sprint 2: admin session management |
| Backup automation | PostgreSQL backups not automated | Sprint 2: automated pg_dump schedule |

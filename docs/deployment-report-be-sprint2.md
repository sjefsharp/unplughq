---
artifact: deployment-report-be-sprint2
produced-by: backend-developer
project-slug: unplughq
work-item: task-321-be-p7-production-config
work-item-type: task
parent-work-item: epic-001-unplughq-platform
workflow-tier: full
phase: P7
version: 1.0.0
status: draft
consumed-by:
  - frontend-developer
  - testing
  - product-owner
  - product-manager
date: 2026-03-18
azure-devops-id: 321
review:
  reviewed-by:
  reviewed-date:
---

# Deployment Report — Backend Developer Sprint 2

Production configuration and endpoint verification for PI-2 Sprint 2 server-side features.

## 1. Verification Summary

| Check | Result |
|-------|--------|
| TypeScript typecheck (`pnpm typecheck`) | **PASS** — exit 0 |
| ESLint (`pnpm lint`) | **PASS** — exit 0, zero warnings/errors |
| Full test suite (`pnpm test`) | **PASS** — 33 files, 542 tests |
| Sprint 2 BE-specific test files | **PASS** — see §1.1 |

### 1.1 Sprint 2 Backend Test Coverage

| Test File | Tests | Status |
|-----------|-------|--------|
| `integration/trpc/monitor-router.test.ts` | 12 | PASS |
| `integration/trpc/user-router.test.ts` | 7 | PASS |
| `integration/queue/alert-pipeline.test.ts` | 10 | PASS |
| `integration/queue/bullmq-lifecycle.test.ts` | 13 | PASS |
| `integration/sse/sse-events.test.ts` | 10 | PASS |
| `unit/security/csrf-middleware.test.ts` | 10 | PASS |
| `unit/security/tenant-isolation-sprint2.test.ts` | 13 | PASS |
| `unit/security/audit-logging.test.ts` | 14 | PASS |
| `unit/security/secrets-rotation.test.ts` | 9 | PASS |
| `unit/monitoring/email-notification.test.ts` | 9 | PASS |
| `unit/deployment/health-check-service.test.ts` | 9 | PASS |

---

## 2. tRPC Router Production Configuration

### 2.1 Router Registration

All Sprint 2 routers are registered in the root app router (`src/server/trpc/router.ts`):

```typescript
export const appRouter = router({
  auth: authRouter,      // Sprint 1
  server: serverRouter,  // Sprint 1 + Sprint 2 extensions
  app: appSubRouter,     // Sprint 2 — catalog + deployment
  monitor: monitorRouter,// Sprint 2 — dashboard + alerts
  domain: domainRouter,  // Sprint 2 — domain binding
  user: userRouter,      // Sprint 2 — audit log + profile
});
```

### 2.2 New Router: `app` (Catalog & Deployment)

**Sub-routers:** `app.catalog` and `app.deployment`

| Procedure | Type | Auth | CSRF | Input Validation |
|-----------|------|------|------|------------------|
| `app.catalog.list` | query | public | N/A | Optional `category`, `search` string |
| `app.catalog.get` | query | public | N/A | `id` or `catalogAppId` (refined) |
| `app.catalog.categories` | query | public | N/A | None |
| `app.catalog.checkResourceFit` | query | protected | N/A | `catalogAppId` + `serverId` (UUID) |
| `app.deployment.list` | query | protected | N/A | Optional `serverId` (UUID) |
| `app.deployment.get` | query | protected | N/A | `id` or `deploymentId` (UUID, refined) |
| `app.deployment.create` | mutation | protected | ✅ | `DeployAppInput` Zod schema |
| `app.deployment.stop` | mutation | protected | ✅ | `id`/`deploymentId` + `confirmationToken` |
| `app.deployment.start` | mutation | protected | ✅ | `id` or `deploymentId` (UUID) |
| `app.deployment.remove` | mutation | protected | ✅ | `deploymentId` + `confirmationToken` |
| `app.deployment.verify` | query | protected | N/A | `deploymentId` (UUID) |
| `app.deployment.logs` | query | protected | N/A | `deploymentId` (UUID) |

**Production readiness notes:**
- Catalog queries are public (no auth) for marketplace browsing — catalog data is non-sensitive
- All deployment mutations use `protectedMutationProcedure` (session auth + CSRF + audit logging)
- `deployment.create` validates: tier deployment capacity, domain availability, config schema validation, server resource fit
- Deployment job dispatched to BullMQ `deploy` queue after validation

### 2.3 New Router: `monitor` (Dashboard & Alerts)

| Procedure | Type | Auth | CSRF | Input Validation |
|-----------|------|------|------|------------------|
| `monitor.dashboard` | query | protected | N/A | None (tenant-scoped) |
| `monitor.serverMetrics` | query | protected | N/A | `serverId` (UUID) + `minutes` (1–1440, default 60) |
| `monitor.appStatus` | query | protected | N/A | `deploymentId` (UUID) |
| `monitor.resourceAllocation` | query | protected | N/A | `serverId` (UUID) |
| `monitor.alerts.list` | query | protected | N/A | Optional `serverId`, `page`, `limit` |
| `monitor.alerts.get` | query | protected | N/A | `alertId` (UUID) |
| `monitor.alerts.acknowledge` | mutation | protected | ✅ | `alertId` (UUID) |
| `monitor.alerts.dismiss` | mutation | protected | ✅ | `alertId` (UUID) |
| `monitor.alerts.remediation` | query | protected | N/A | `alertId` (UUID) |
| `monitor.alerts.rules` | query | protected | N/A | None |
| `monitor.alerts.history` | query | protected | N/A | Optional `serverId`, `page`, `limit` |

**Production readiness notes:**
- All procedures use tenant-scoped queries (`eq(*.tenantId, ctx.tenantId)`) — I-07 isolation enforced
- Dashboard aggregates servers, metrics, deployments, and alerts in a single query per server
- Metrics serialization converts `bigint` columns to `Number` for JSON compatibility
- `Date` fields serialized to ISO strings for superjson transport

### 2.4 New Router: `domain` (Domain Binding)

| Procedure | Type | Auth | CSRF | Input Validation |
|-----------|------|------|------|------------------|
| `domain.list` | query | protected | N/A | `serverId` (UUID) |
| `domain.bind` | mutation | protected | ✅ | `serverId` + `deploymentId` + `domain` (regex validated) |
| `domain.unbind` | mutation | protected | ✅ | `serverId` + `domain` |

**Production readiness notes:**
- Domain regex: `^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$`
- `bind` verifies domain uniqueness across all tenants via `ensureDomainIsAvailable()`
- Caddy route ID convention: `unplughq-{deploymentId}` — matches Caddy automation API expectations

### 2.5 Extended Router: `user` (Audit Log)

| Procedure | Type | Auth | CSRF | Input Validation |
|-----------|------|------|------|------------------|
| `user.me` | query | protected | N/A | None |
| `user.auditLog` | query | protected | N/A | `page` (int ≥1) + `pageSize` (1–100, default 20) |
| `user.exportConfig` | mutation | protected | ✅ | `serverId` (UUID) |

**Production readiness notes:**
- Audit log enforces 90-day retention cutoff in queries
- Paginated with total count for UI pagination controls

### 2.6 Extended Router: `server` (Secrets Rotation — B-260)

| Procedure | Type | Auth | CSRF | Input Validation |
|-----------|------|------|------|------------------|
| `server.rotateSSHKey` | mutation | protected | ✅ | `serverId` (UUID) |
| `server.rotateAgentToken` | mutation | protected | ✅ | `serverId` (UUID) |

**Production readiness notes:**
- `rotateSSHKey` generates proper Ed25519 keypair via `generateKeyPairSync('ed25519')` (AB#303 fix)
- Public key deployed to VPS via SSH before DB update; rollback on deployment failure
- `rotateAgentToken` generates 32-byte hex token and enqueues `update-agent` job to push to VPS
- Both mutations go through audit middleware — rotation events tracked in audit log

---

## 3. BullMQ Production Configuration

### 3.1 Queue Definitions

All queues use lazy initialization to avoid Redis connections at build time.

| Queue | Purpose | Concurrency | Retry Strategy | Job Retention |
|-------|---------|-------------|----------------|---------------|
| `provision` | Test connection + server provisioning | 3 | 3 attempts, exponential backoff (5s base) | Complete: 100, Failed: 500 |
| `deploy` | App deployment orchestration | 1 (default) | 3 attempts, exponential backoff (5s base) | Complete: 100, Failed: 500 |
| `monitor` | Metrics processing, alert send, agent update | 1 (default) | 1 attempt, no retry | Complete: 50, Failed: 100 |
| `alert-email` | Alert email delivery | 1 (default) | 3 attempts, exponential backoff (60s base) | Complete: 250, Failed: retained indefinitely |
| `alert-email-dlq` | Failed email dead-letter queue | 1 | 1 attempt | Complete: 500, Failed: 1000 |

### 3.2 Redis Connection

```typescript
// src/server/queue/redis.ts
function createRedisConnection(): ConnectionOptions {
  const url = new URL(process.env.REDIS_URL ?? 'redis://localhost:6379');
  return {
    host: url.hostname,
    port: Number(url.port) || 6379,
    password: url.password || undefined,
    maxRetriesPerRequest: null, // Required by BullMQ
  };
}
```

**Production configuration:**
- `REDIS_URL` points to the Valkey container in Docker Compose: `redis://:${REDIS_PASSWORD}@valkey:6379`
- `maxRetriesPerRequest: null` is mandatory for BullMQ — allows unlimited internal retries
- Connections are lazy: queues only connect to Redis when first accessed (safe for Next.js build)

### 3.3 Job Payload Validation (D-05)

All job handlers validate payloads with Zod schemas before processing:

| Job | Schema | Key Fields |
|-----|--------|------------|
| `test-connection` | `TestConnectionPayload` | `serverId`, `tenantId`, `ip`, `sshPort`, `sshUser` |
| `provision-server` | `ProvisionServerPayload` | `serverId`, `tenantId` |
| `deploy-app` | `DeployAppPayload` | `deploymentId`, `tenantId`, `serverId`, `catalogAppId`, `domain`, `imageRef`, `envFilePath` |
| `process-metrics` | `ProcessMetricsPayload` | `tenantId`, `serverId`, `snapshot` (nested) |
| `send-alert` | `SendAlertPayload` | `alertId`, `tenantId` |
| `update-agent` | `UpdateAgentPayload` | `tenantId`, `serverId`, `apiToken` |

### 3.4 Worker Container

The worker runs in a separate Docker container (`Dockerfile.worker`) with:
- Node 22 Alpine base
- Non-root `worker` user (UID 1001)
- Read-only filesystem with tmpfs for `/tmp`
- Production dependencies only
- Resource limits: 512MB RAM, 1.0 CPU

---

## 4. Alert Evaluation Engine

### 4.1 Threshold Configuration

Alert thresholds are defined in `src/server/services/alert-service.ts`:

| Alert Type | Threshold | Duration | Severity |
|------------|-----------|----------|----------|
| `cpu-critical` | 90% | 300s sustained | Derived from metric value |
| `ram-critical` | 90% | Instant | Derived from metric value |
| `disk-critical` | 85% | Instant | Derived from metric value |
| `app-unavailable` | Container status ≠ `running` | 60s | Critical |
| `server-unreachable` | No metrics for 120s | N/A | Critical |

### 4.2 Alert Creation Flow

1. Monitoring agent pushes metrics via `POST /api/agent/metrics` (API token auth)
2. Metrics handler enqueues `process-metrics` job on the `monitor` queue
3. Worker processes metrics: stores snapshot → calls `evaluateMetricAlerts()`
4. `evaluateMetricAlerts()` checks each threshold; if breached and no active alert exists, creates alert
5. Alert creation emits `alert.created` SSE event to tenant
6. `send-alert` job enqueued on `monitor` queue for email notification
7. `sendAlertNotification()` checks user `notificationPrefs.emailAlerts` before sending

### 4.3 Alert Deduplication

`isActiveAlertPresent()` prevents duplicate alerts: same `tenantId` + `serverId` + `type` + `appId` combination with no `dismissedAt` blocks creation. This is idempotent — repeated metric breaches do not generate duplicate alerts.

---

## 5. Email Service Configuration

### 5.1 Alert Email System

Configuration loaded from environment variables via `getAlertEmailConfig()`:

| Setting | Env Var | Default | Description |
|---------|---------|---------|-------------|
| Provider | — | `smtp` | Only SMTP supported |
| From address | `ALERT_EMAIL_FROM` | `alerts@unplughq.local` | Sender address |
| Reply-to | `ALERT_EMAIL_REPLY_TO` | — | Optional reply-to |
| SMTP host | `SMTP_HOST` | `localhost` | SMTP server hostname |
| SMTP port | `SMTP_PORT` | `587` | SMTP port (587 = STARTTLS) |
| SMTP secure | `SMTP_SECURE` | `false` | Use TLS (`true`) or STARTTLS (`false`) |
| SMTP user | `SMTP_USER` | — | SMTP authentication username |
| SMTP password | `SMTP_PASSWORD` | — | SMTP authentication password |
| Max attempts | `ALERT_EMAIL_MAX_ATTEMPTS` | `3` | Retry limit per email |
| Backoff delay | `ALERT_EMAIL_BACKOFF_MS` | `60000` | Exponential backoff base (ms) |

### 5.2 Email Queue Architecture

- **Primary queue** (`alert-email`): 3 attempts, 60s exponential backoff, completed jobs retained (250)
- **Dead-letter queue** (`alert-email-dlq`): Failed emails moved here after exhausting retries. Retained (1000 failed) for manual investigation. `removeOnFail: false` on the primary queue ensures no silent email loss.

### 5.3 Email Template

HTML email template in `src/server/services/notifications/alert-email.ts`:
- Responsive layout (640px max-width, mobile-friendly)
- Includes: alert type, severity, server name, affected app, current value, threshold
- Dashboard deep-link button for immediate investigation
- Optional unsubscribe link for notification preferences

### 5.4 Production Deployment Note

The email subsystem is **self-hosting friendly**: it operates inertly (emails queue but fail delivery) until SMTP credentials are configured. Operators populate `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `ALERT_EMAIL_FROM` in the production `.env` file. Failed deliveries land in the DLQ for inspection.

---

## 6. CSRF Middleware (B-258)

### 6.1 Implementation

Double-submit cookie pattern in `src/server/trpc/middleware/csrf.ts`:

| Component | Detail |
|-----------|--------|
| Cookie name | `__Host-csrf` |
| Token generation | HMAC-SHA256 of `sessionId` with `AUTH_SECRET` |
| Cookie attributes | `Path=/`, `SameSite=Strict`, `HttpOnly=false`, `Secure` (production) |
| Validation | Timing-safe comparison of cookie token, header token (`X-CSRF-Token`), and expected token |
| Applied to | All tRPC mutations via `protectedMutationProcedure` |

### 6.2 Middleware Chain

`protectedMutationProcedure` composes three middleware layers:

1. **`isAuthed`** — Session validation, injects `userId`, `tenantId`, `tier`
2. **`csrfMiddleware`** — Validates CSRF token on mutations (calls `assertValidCsrf()`)
3. **`auditMiddleware`** — Records mutation to audit log with outcome, duration, IP, user-agent

All Sprint 2 mutations use `protectedMutationProcedure`:
- `app.deployment.create`, `stop`, `start`, `remove`
- `monitor.alerts.acknowledge`, `dismiss`
- `domain.bind`, `unbind`
- `server.rotateSSHKey`, `rotateAgentToken`
- `user.exportConfig`
- Sprint 1: `auth.updateProfile`, `updateNotificationPrefs`, `deleteAccount`, `server.testConnection`, `provision`, `rename`, `disconnect`

---

## 7. Audit Logging (B-259)

### 7.1 Coverage

The audit middleware intercepts all mutations and records:

| Field | Source |
|-------|--------|
| `tenantId` | Session context |
| `action` | tRPC procedure path (e.g., `app.deployment.create`) |
| `targetType` | Inferred from path prefix (`server`, `deployment`, `alert`, `account`, `catalog-app`) |
| `targetId` | Extracted from input (`deploymentId`, `serverId`, `alertId`, `id`) |
| `ipAddress` | `X-Forwarded-For` header (first entry) |
| `userAgent` | `User-Agent` header |
| `outcome` | `success` or `failure` |
| `durationMs` | Mutation wall-clock time |

### 7.2 Sprint 2 Audit Actions

| Action | Target Type |
|--------|-------------|
| `app.deployment.create` | deployment |
| `app.deployment.stop` | deployment |
| `app.deployment.start` | deployment |
| `app.deployment.remove` | deployment |
| `monitor.alerts.acknowledge` | alert |
| `monitor.alerts.dismiss` | alert |
| `domain.bind` | deployment |
| `domain.unbind` | deployment |
| `server.rotateSSHKey` | server |
| `server.rotateAgentToken` | server |
| `user.exportConfig` | account |

### 7.3 Retention

Audit log queries enforce a 90-day rolling window (`retentionCutoff`). Entries older than 90 days are excluded from query results. Actual row deletion is a DBA concern (not yet implemented — manual `DELETE` or pg_cron recommended for production).

---

## 8. SSE Real-Time Streaming

### 8.1 Endpoint

`GET /api/events` — session-authenticated, tenant-scoped SSE stream.

| Event Type | Payload | Trigger |
|------------|---------|---------|
| `connected` | `{ tenantId }` | Initial connection |
| `server.status` | `{ serverId, status }` | Server state change |
| `deployment.progress` | `{ deploymentId, status, phase }` | Deployment phase transition |
| `metrics.update` | Full `MetricsSnapshot` | New metrics received |
| `alert.created` | Full `Alert` object | New alert threshold breach |
| `alert.dismissed` | `{ alertId }` | Alert dismissed |
| `heartbeat` | `:heartbeat` comment | Every 30s keep-alive |

### 8.2 Production Configuration

- `X-Accel-Buffering: no` header — disables Nginx/Caddy buffering for real-time delivery
- `Cache-Control: no-cache, no-transform` — prevents proxy caching
- `Connection: keep-alive` — persistent connection
- Event bus max listeners: 1000 (supports concurrent tenant connections)
- Cleanup: heartbeat interval cleared and subscription removed on stream close

---

## 9. Environment Variable Checklist

### 9.1 Required Variables (t3-env validated)

| Variable | Validation | Sprint | Notes |
|----------|-----------|--------|-------|
| `DATABASE_URL` | `z.string().url()` | S1 | PostgreSQL connection string |
| `REDIS_URL` | `z.string().url()` | S1 | Redis/Valkey connection string |
| `AUTH_SECRET` | `z.string().min(32)` | S1 | Auth.js session signing key |
| `ENCRYPTION_MASTER_KEY` | `z.string().min(32)` | S1 | SSH key encryption master key |
| `NODE_ENV` | `z.enum(['development','test','production'])` | S1 | Runtime environment |

### 9.2 Optional Variables (t3-env)

| Variable | Validation | Sprint | Notes |
|----------|-----------|--------|-------|
| `AUTH_URL` | `z.string().url()` | S1 | Auth.js base URL (defaults to request origin) |
| `NEXT_PUBLIC_APP_URL` | `z.string().url()` | S1 | Public application URL for client |

### 9.3 Infrastructure Variables (Docker Compose)

| Variable | Sprint | Notes |
|----------|--------|-------|
| `DOMAIN` | S1 | Production domain (e.g., `app.unplughq.com`) |
| `ACME_EMAIL` | S1 | Let's Encrypt certificate email |
| `POSTGRES_USER` | S1 | PostgreSQL superuser |
| `POSTGRES_PASSWORD` | S1 | PostgreSQL password |
| `POSTGRES_DB` | S1 | Database name |
| `REDIS_PASSWORD` | S1 | Valkey authentication password |

### 9.4 Sprint 2 Email Variables (runtime, not t3-env validated)

| Variable | Default | Required | Notes |
|----------|---------|----------|-------|
| `SMTP_HOST` | `localhost` | For email delivery | SMTP server hostname |
| `SMTP_PORT` | `587` | For email delivery | SMTP port |
| `SMTP_SECURE` | `false` | No | Use TLS instead of STARTTLS |
| `SMTP_USER` | — | For email delivery | SMTP authentication |
| `SMTP_PASSWORD` | — | For email delivery | SMTP authentication |
| `ALERT_EMAIL_FROM` | `alerts@unplughq.local` | Recommended | Sender email address |
| `ALERT_EMAIL_REPLY_TO` | — | No | Optional reply-to address |
| `ALERT_EMAIL_MAX_ATTEMPTS` | `3` | No | Email retry limit |
| `ALERT_EMAIL_BACKOFF_MS` | `60000` | No | Retry backoff base (ms) |
| `ALERT_EMAIL_QUEUE_NAME` | `alert-email` | No | Queue name override |
| `ALERT_EMAIL_DLQ_NAME` | `alert-email-dlq` | No | DLQ name override |

### 9.5 Secret Generation Commands

```bash
# AUTH_SECRET (base64, ≥32 chars)
openssl rand -base64 32

# ENCRYPTION_MASTER_KEY (hex, ≥32 chars)
openssl rand -hex 32

# POSTGRES_PASSWORD
openssl rand -base64 24

# REDIS_PASSWORD
openssl rand -base64 24
```

---

## 10. Production Hardening Checklist

### 10.1 Authentication & Authorization

- [x] All Sprint 2 queries use `protectedProcedure` (session required) except public catalog endpoints
- [x] All Sprint 2 mutations use `protectedMutationProcedure` (session + CSRF + audit)
- [x] Tenant isolation enforced on every query via `eq(*.tenantId, ctx.tenantId)` — I-07
- [x] `tenantId` sourced from session, never from request parameters — I-07

### 10.2 Input Validation

- [x] All procedure inputs validated with Zod schemas
- [x] UUID format enforced on all ID parameters
- [x] Domain format validated with regex
- [x] Config values validated against catalog app `configSchema`
- [x] BullMQ job payloads validated with Zod before processing — D-05
- [x] Container name generation sanitizes input (alphanumeric + hyphen, max 63 chars)
- [x] Env file content generator rejects blocked env vars (`NODE_OPTIONS`, `LD_PRELOAD`, etc.)
- [x] Unsafe config patterns rejected: `[;&|` + backtick + `$(){}<>\\\n]`

### 10.3 Security Controls

- [x] CSRF double-submit cookie on all mutations — B-258
- [x] Timing-safe CSRF token comparison (`timingSafeEqual`)
- [x] `__Host-` cookie prefix enforces `Secure` + `Path=/` + no `Domain`
- [x] Audit logging on all mutations with outcome, duration, IP — B-259
- [x] SSH key rotation uses proper Ed25519 keypair generation — B-260 / AB#303
- [x] Agent token rotation generates cryptographically random 32-byte hex token
- [x] Structured logger redacts PEM keys, passwords, tokens — I-05

### 10.4 Error Handling

- [x] TRPCError codes map to HTTP semantics (`NOT_FOUND`, `FORBIDDEN`, `UNAUTHORIZED`, `BAD_REQUEST`, `CONFLICT`)
- [x] Internal error codes (`ErrorCode` enum) provide machine-readable cause
- [x] Server errors logged with pino; client receives generic error — I-04
- [x] Audit middleware catches and records mutation failures before re-throwing

### 10.5 Rate Limiting & Resource Protection

- [x] Redis-based sliding window rate limiter (auth endpoints, metrics ingestion)
- [x] Tier limits enforce max servers and max deployments per tenant — E-03
- [x] Resource fit evaluation before deployment (CPU/RAM/disk check against server metrics)
- [x] Deployment capacity check prevents exceeding tier limits

### 10.6 Data Integrity

- [x] Confirmation tokens required for destructive operations (server disconnect, deployment stop/remove)
- [x] Deployment status transitions validated (only `running`/`unhealthy` → `stopped`)
- [x] Server status gates enforced (only `validated` → `provisioning`, only `provisioned` → deployment)
- [x] Alert deduplication prevents duplicate active alerts per type/server/app

### 10.7 Observability

- [x] Pino structured logging at `info` level in production
- [x] Sensitive fields redacted in logs (PEM keys, passwords, tokens, secrets)
- [x] Audit log records all mutations with IP, user-agent, outcome, duration
- [x] SSE events provide real-time feedback for UI (deployment progress, metrics, alerts)
- [x] BullMQ job handlers emit structured log entries with job ID and name

### 10.8 Container Security

- [x] App container: read-only filesystem, 512MB RAM limit, 1.0 CPU limit
- [x] Worker container: read-only filesystem, 512MB RAM limit, 1.0 CPU limit, non-root user
- [x] PostgreSQL: no port exposure (Docker network only), max 100 connections
- [x] Valkey: no port exposure (Docker network only), 256MB maxmemory, `allkeys-lru` eviction
- [x] JSON file logging with size rotation (50MB × 5 for app/worker, 20MB × 3 for PostgreSQL)

---

## 11. Sprint 2 Endpoint Inventory

### 11.1 tRPC API (`/api/trpc/*`)

| # | Procedure | Type | Auth | Sprint |
|---|-----------|------|------|--------|
| 1 | `auth.session` | query | public | S1 |
| 2 | `auth.updateProfile` | mutation | protected | S1 |
| 3 | `auth.updateNotificationPrefs` | mutation | protected | S1 |
| 4 | `auth.deleteAccount` | mutation | protected | S1 |
| 5 | `server.list` | query | protected | S1 |
| 6 | `server.get` | query | protected | S1 |
| 7 | `server.testConnection` | mutation | protected | S1 |
| 8 | `server.provision` | mutation | protected | S1 |
| 9 | `server.rename` | mutation | protected | S1 |
| 10 | `server.disconnect` | mutation | protected | S1 |
| 11 | `server.rotateSSHKey` | mutation | protected | S2 |
| 12 | `server.rotateAgentToken` | mutation | protected | S2 |
| 13 | `app.catalog.list` | query | public | S2 |
| 14 | `app.catalog.get` | query | public | S2 |
| 15 | `app.catalog.categories` | query | public | S2 |
| 16 | `app.catalog.checkResourceFit` | query | protected | S2 |
| 17 | `app.deployment.list` | query | protected | S2 |
| 18 | `app.deployment.get` | query | protected | S2 |
| 19 | `app.deployment.create` | mutation | protected | S2 |
| 20 | `app.deployment.stop` | mutation | protected | S2 |
| 21 | `app.deployment.start` | mutation | protected | S2 |
| 22 | `app.deployment.remove` | mutation | protected | S2 |
| 23 | `app.deployment.verify` | query | protected | S2 |
| 24 | `app.deployment.logs` | query | protected | S2 |
| 25 | `monitor.dashboard` | query | protected | S2 |
| 26 | `monitor.serverMetrics` | query | protected | S2 |
| 27 | `monitor.appStatus` | query | protected | S2 |
| 28 | `monitor.resourceAllocation` | query | protected | S2 |
| 29 | `monitor.alerts.list` | query | protected | S2 |
| 30 | `monitor.alerts.get` | query | protected | S2 |
| 31 | `monitor.alerts.acknowledge` | mutation | protected | S2 |
| 32 | `monitor.alerts.dismiss` | mutation | protected | S2 |
| 33 | `monitor.alerts.remediation` | query | protected | S2 |
| 34 | `monitor.alerts.rules` | query | protected | S2 |
| 35 | `monitor.alerts.history` | query | protected | S2 |
| 36 | `domain.list` | query | protected | S2 |
| 37 | `domain.bind` | mutation | protected | S2 |
| 38 | `domain.unbind` | mutation | protected | S2 |
| 39 | `user.me` | query | protected | S2 |
| 40 | `user.auditLog` | query | protected | S2 |
| 41 | `user.exportConfig` | mutation | protected | S2 |

**Total:** 41 tRPC procedures (10 Sprint 1, 31 Sprint 2)

### 11.2 REST API Endpoints

| Endpoint | Method | Auth | Sprint | Purpose |
|----------|--------|------|--------|---------|
| `/api/trpc/*` | GET/POST | Session | S1+ | tRPC handler |
| `/api/auth/*` | GET/POST | N/A | S1 | Auth.js routes (signup, login, callback, signout) |
| `/api/events` | GET | Session | S2 | SSE real-time stream |
| `/api/agent/metrics` | POST | API token | S1+ | Monitoring agent metrics ingestion |
| `/api/health` | GET | None | S1 | Container health check |

---

## 12. Sprint 1 Regression Assessment

All Sprint 1 functionality remains operational:

| Area | Procedures | Status |
|------|-----------|--------|
| Auth flows | `auth.session`, signup, login, logout, password reset | No changes — integration tests pass (10 tests) |
| Server management | `server.list`, `get`, `testConnection`, `provision`, `rename`, `disconnect` | Extended with `rotateSSHKey`, `rotateAgentToken` — no regressions |
| Queue processing | `provision` queue (test-connection, provision-server) | No changes — lifecycle tests pass (13 tests) |
| SSE streaming | `server.status` events | Extended with deployment, metrics, alert events — backward compatible |
| Rate limiting | Auth rate limiter, metrics rate limiter | No changes — 9 tests pass |

---

## 13. Dependencies Summary

| Dependency | Status |
|------------|--------|
| DBA Sprint 2 migrations (AB#320) | Required — `catalog_apps`, `deployments`, `alerts` tables must exist |
| DBA Catalog seed | Required — `app.catalog.list` returns seeded data |
| DevOps alert email infrastructure (AB#319) | Required for email delivery — graceful degradation if SMTP not configured |
| DevOps monitoring agent v2.0.0 | Required — per-container disk metrics for `monitor.dashboard` |
| DevOps Caddy route automation | Required for `domain.bind`/`unbind` to take effect |

All upstream dependencies (DevOps AB#319, DBA AB#320) are completed per their deployment reports.

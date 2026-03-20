---
title: Backend Sprint 2 Implementation
status: draft
creator: backend-developer
created: 2025-07-16
work-items: [AB#180, AB#258, AB#259, AB#260]
branch: feat/pi-2-sprint-2-be
---

# Backend Sprint 2 Implementation

## Scope

Sprint 2 backend implementation for PI-2, covering Feature F2 (App Catalog & Deployment), Feature F3 (Monitoring & Alerts), and three bug fixes (B-258, B-259, B-260).

## Implemented Components

### tRPC Routers

| Router | Procedures | Stories |
|--------|-----------|---------|
| `app.catalog` | `list`, `get`, `categories`, `checkResourceFit` | S-202, S-203 |
| `app.deployment` | `list`, `get`, `create`, `stop`, `start`, `remove`, `verify`, `logs` | S-204 |
| `monitor` | `dashboard`, `serverMetrics`, `appStatus`, `resourceAllocation` | S-207 |
| `monitor.alerts` | `list`, `get`, `acknowledge`, `dismiss`, `remediation`, `rules`, `history` | S-208, S-209 |
| `domain` | `list`, `bind`, `unbind` | S-204 |
| `server` | `rotateSSHKey`, `rotateAgentToken` | B-260 |
| `auth` | `updateProfile`, `updateNotificationPrefs`, `deleteAccount` (migrated to CSRF+audit) | B-258, B-259 |
| `user` | `me`, `auditLog`, `exportConfig` | B-259 |

### Services

| Service | Purpose | Key Features |
|---------|---------|-------------|
| `deployment-service.ts` | Deployment business logic | State machine, tier limits, domain pre-check, SSH injection protection via `UNSAFE_CONFIG_PATTERN`, resource fit evaluation |
| `health-check-service.ts` | HTTP health checks | Exponential backoff retry (2s/4s/8s), 3 attempts, 20s timeout, AbortController |
| `alert-service.ts` | Alert evaluation & lifecycle | Threshold evaluation (CPU>90%, RAM>90%, disk>85%, stale>120s), email notification, guided remediation plans |
| `audit-log-service.ts` | Audit event recording | Fire-and-forget with error logging, 90-day retention, pagination |

### BullMQ Handlers

| Queue | Job Types |
|-------|----------|
| Deploy worker | `deploy-app` (state machine: pulling → configuring → provisioning-ssl → starting → running) |
| Monitor worker | `process-metrics` (insert + evaluate alerts), `send-alert`, `update-agent` |

### Middleware

| Middleware | Purpose | Implementation |
|-----------|---------|---------------|
| `csrf.ts` | CSRF double-submit cookie (B-258) | `__Host-csrf` cookie, HMAC-SHA256 of sessionId, `timingSafeEqual` comparison, `SameSite=Strict` |
| Audit middleware | Mutation audit logging (B-259) | Records action, target, timing, outcome for all protected mutations |

## Bug Fixes

### B-258: Missing CSRF Double-Submit Cookie

- Created `csrf.ts` middleware with `parseCookieHeader`, `createCsrfTokenForSession`, `serializeCsrfCookie`, `assertValidCsrf`
- API route sets `__Host-csrf` cookie on response
- tRPC provider reads cookie and sends `x-csrf-token` header
- All mutation procedures use `protectedMutationProcedure` which chains CSRF validation

### B-259: Insufficient Audit Logging

- Created `audit-log-service.ts` with `recordAuditEvent`, `listAuditEvents`
- Created audit middleware that wraps mutations, capturing action, target type/ID, timing, and outcome
- 90-day retention enforced at query time; paginated results

### B-260: Missing Secrets Rotation

- Added `server.rotateSSHKey` — generates new key pair, encrypts with AES-256-GCM, stores in DB
- Added `server.rotateAgentToken` — generates hex token, enqueues monitor job to update remote agent
- Old credentials invalidated immediately on rotation

## Test Results

```
Test Files  31 passed (31)
     Tests  493 passed (493)
  Duration  ~20s
```

- TypeScript: 0 errors (`tsc --noEmit`)
- ESLint: 0 warnings/errors (`next lint`)

## Files Changed

**Modified (20 files):**
- 6 tRPC routers, tRPC index, API route, tRPC provider
- 3 queue files (handlers, index, schemas)
- 8 test helper files (aligned with Testing agent contracts)

**Created (5 files):**
- 4 services (deployment, health-check, alert, audit-log)
- 1 middleware (csrf)

**Total: 2,593 insertions, 410 deletions across 25 files**

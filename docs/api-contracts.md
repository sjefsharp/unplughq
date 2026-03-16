---
artifact: api-contracts
produced-by: solution-designer
project-slug: unplughq
work-item: epic-001-unplughq-platform
work-item-type: epic
workflow-tier: full
phase: P1
version: 2.0.0
status: draft
azure-devops-id: 281
consumed-by:
  - product-owner
  - frontend-developer
  - backend-developer
  - database-administrator
  - testing
  - devops-engineer
date: 2026-03-16
review:
  reviewed-by:
  reviewed-date:
---

# API Contracts — UnplugHQ

Typed API procedure contracts, Zod schemas, integration protocols, error taxonomy, and auth middleware design for the UnplugHQ control plane.

**Upstream references:** [Architecture Overview](architecture-overview.md) · [Requirements](requirements.md) · [Threat Model](threat-model.md)

---

## SD Design Note — tRPC as API Contract Layer

The SA's architecture overview specifies Next.js Server Actions as the primary API mechanism. The SD introduces **tRPC** as the explicit typed contract layer for three reasons:

1. **Cross-boundary type inference** — tRPC input/output types are inferred by the browser client, background worker, and test suites without code generation.
2. **Discriminated error taxonomy** — tRPC `TRPCError.cause` carries the domain `ErrorCode` enum; client code can exhaustively pattern-match (§4).
3. **Explicit procedure registry** — Server Actions are colocated with UI components; tRPC provides a single discoverable surface consumed by FE, BE, and Testing agents without ambiguity.

Server Actions remain appropriate for simple in-component mutations (e.g., wizard step submission) where the form and the action live in the same file. tRPC handles all cross-boundary, cross-team contracts.

The tRPC HTTP adapter is mounted at **`POST /api/trpc/[trpc]`** via a Next.js App Router Route Handler. Two additional Route Handlers exist outside tRPC (§3.2, §3.3).

---

## 1. tRPC Router Map

Six bounded-context routers. The `app` router uses nested sub-routers for catalog and deployment.

### 1.1 Auth Router (`auth.*`)

Auth.js v5 owns the identity flows (signup, login, password reset, session cookies). tRPC exposes session reads and account mutations.

| Procedure | Type | Purpose | Auth Level |
|-----------|------|---------|------------|
| `auth.session` | query | Return active session user (id, email, name, tier) | public |
| `auth.updateProfile` | mutation | Update display name and/or email | protected |
| `auth.updateNotificationPrefs` | mutation | Toggle email alert notifications | protected |
| `auth.deleteAccount` | mutation | Schedule tenant data deletion (GDPR — FR-F4-005, NFR-009) | protected |

### 1.2 Server Router (`server.*`)

VPS connection and provisioning lifecycle. Maps to F1 requirements.

| Procedure | Type | Purpose | Auth Level |
|-----------|------|---------|------------|
| `server.list` | query | List all servers for the tenant | protected |
| `server.get` | query | Get server detail (tenant-scoped lookup — E-02) | protected |
| `server.testConnection` | mutation | Enqueue `test-connection` job; return job id + server id | protected |
| `server.provision` | mutation | Enqueue `provision-server` job after compatibility check (BR-F1-001) | protected |
| `server.rename` | mutation | Update human-readable name (FR-F1-008) | protected |
| `server.disconnect` | mutation | Disconnect server; requires `confirmationToken` from preview step (NFR-006) | protected |

### 1.3 App Router (`app.*`)

Namespaced with two sub-routers: catalog browsing (public) and deployment lifecycle (protected). Maps to F2.

| Procedure | Type | Purpose | Auth Level |
|-----------|------|---------|------------|
| `app.catalog.list` | query | List catalog entries; filterable by `category` | public |
| `app.catalog.get` | query | Get catalog entry including `configSchema` | public |
| `app.deployment.list` | query | List deployed apps for tenant; optional `serverId` filter | protected |
| `app.deployment.get` | query | Get deployed app detail (tenant-scoped) | protected |
| `app.deployment.create` | mutation | Validate config, check tier limits, enqueue `deploy-app` job | protected |
| `app.deployment.stop` | mutation | Stop running container via SSH (BR-Global-003 confirmation) | protected |
| `app.deployment.start` | mutation | Start stopped container via SSH | protected |
| `app.deployment.remove` | mutation | Remove app + cleanup; requires `confirmationToken` | protected |

### 1.4 Monitor Router (`monitor.*`)

Aggregated metrics reads and alert management for the dashboard. Maps to F3.

| Procedure | Type | Purpose | Auth Level |
|-----------|------|---------|------------|
| `monitor.dashboard` | query | Latest metrics snapshot + app statuses for all tenant servers | protected |
| `monitor.serverMetrics` | query | Time-series metrics for a server over last N minutes | protected |
| `monitor.appStatus` | query | Container status for a specific deployed app | protected |
| `monitor.alerts.list` | query | Active and recent alerts for the tenant | protected |
| `monitor.alerts.dismiss` | mutation | Dismiss an acknowledged alert (FR-F3-007) | protected |

### 1.5 Domain Router (`domain.*`)

Caddy reverse-proxy route bindings on the user's VPS.

| Procedure | Type | Purpose | Auth Level |
|-----------|------|---------|------------|
| `domain.list` | query | List domain → app bindings for a server | protected |
| `domain.bind` | mutation | Bind a domain to a deployed app (triggers Caddy route create) | protected |
| `domain.unbind` | mutation | Remove a domain binding (triggers Caddy route delete) | protected |

### 1.6 User Router (`user.*`)

Account-level reads and export operations.

| Procedure | Type | Purpose | Auth Level |
|-----------|------|---------|------------|
| `user.me` | query | Full profile: tier, server count, app count, notification prefs | protected |
| `user.auditLog` | query | Paginated audit events for the tenant (NFR-013) | protected |
| `user.exportConfig` | mutation | Generate Docker Compose + Caddyfile export for a server (NFR-005) | protected |

### Router Summary

| Router | Queries | Mutations | Total |
|--------|---------|-----------|-------|
| auth | 1 | 3 | 4 |
| server | 2 | 4 | 6 |
| app.catalog | 2 | 0 | 2 |
| app.deployment | 2 | 4 | 6 |
| monitor | 4 | 1 | 5 |
| domain | 1 | 2 | 3 |
| user | 2 | 1 | 3 |
| **Total** | **14** | **15** | **29** |

Plus 2 non-tRPC Route Handlers: `POST /api/agent/metrics` (§3.2) and `GET /api/events` (§3.3).

---

## 2. Core Zod Schemas

All schemas live in `apps/web/src/lib/schemas/`. Shared between tRPC procedures, BullMQ job validators, and test fixtures.

### 2.1 Shared Enums

```typescript
export const ServerStatus = z.enum([
  'connecting', 'validated', 'provisioning', 'provisioned',
  'connection-failed', 'provision-failed', 'disconnected', 'error',
]);

export const DeploymentStatus = z.enum([
  'pending', 'pulling', 'configuring', 'provisioning-ssl',
  'starting', 'running', 'unhealthy', 'stopped', 'failed', 'removing',
]);

export const ContainerStatus = z.enum([
  'running', 'stopped', 'restarting', 'exited', 'paused', 'dead',
]);

export const AlertSeverity = z.enum(['info', 'warning', 'critical']);

export const AlertType = z.enum([
  'cpu-critical', 'ram-critical', 'disk-critical',
  'app-unavailable', 'server-unreachable',
]);

export const SubscriptionTier = z.enum(['free', 'pro', 'team']);

// Tier limits (authoritative definition — enforced server-side, never client-side — E-03)
export const TierLimits: Record<z.infer<typeof SubscriptionTier>, { maxServers: number; maxApps: number }> = {
  free: { maxServers: 1, maxApps: 3 },
  pro:  { maxServers: 10, maxApps: 30 },
  team: { maxServers: Infinity, maxApps: Infinity },
};
```

### 2.2 Server Schemas

```typescript
// Input — initial connection
export const ServerConnectInput = z.object({
  name: z.string().min(1).max(100),
  ip:   z.string().ip({ version: 'v4' }),
  sshPort: z.number().int().min(1).max(65535).default(22),
  sshUser: z.string().min(1).max(64),
  // SSH private key is never transmitted in this payload — uploaded via dedicated encrypted upload endpoint
});

// Output — server record
export const ServerRecord = z.object({
  id:        z.string().uuid(),           // UUID v4 — never sequential int (E-02)
  name:      z.string(),
  ip:        z.string(),
  sshPort:   z.number(),
  status:    ServerStatus,
  osName:    z.string().nullable(),
  cpuCores:  z.number().nullable(),
  ramGb:     z.number().nullable(),
  diskGb:    z.number().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
```

### 2.3 App / Deployment Schemas

```typescript
// Catalog entry (loaded from versioned YAML definitions in repo)
export const CatalogApp = z.object({
  id:          z.string(),                // slug e.g. "nextcloud"
  name:        z.string(),
  description: z.string(),
  category:    z.string(),
  version:     z.string(),
  minCpuCores: z.number(),
  minRamGb:    z.number(),
  minDiskGb:   z.number(),
  upstreamUrl: z.string().url(),
  imageDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/),  // pinned digest — T-03
  configSchema: z.array(z.object({
    key:      z.string(),
    label:    z.string(),
    type:     z.enum(['text', 'email', 'password', 'select', 'boolean']),
    required: z.boolean(),
    default:  z.string().optional(),
    options:  z.array(z.string()).optional(),
  })),
});

// Input — deploy new app
export const DeployAppInput = z.object({
  catalogAppId: z.string().min(1),
  serverId:     z.string().uuid(),
  domain:       z.string().regex(
    /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
    'Valid FQDN required'
  ),
  config: z.record(z.string(), z.string()),  // matches configSchema keys
});

// Output — deployed app record
export const DeployedApp = z.object({
  id:           z.string().uuid(),
  serverId:     z.string().uuid(),
  catalogAppId: z.string(),
  name:         z.string(),
  domain:       z.string(),
  accessUrl:    z.string().url().nullable(),
  status:       DeploymentStatus,
  containerName: z.string(),
  createdAt:    z.string().datetime(),
  updatedAt:    z.string().datetime(),
});
```

### 2.4 Monitoring Schemas

```typescript
// Metrics payload — collected by agent every 30s
// Strict parse — extra fields rejected to enforce data sovereignty (I-06, BR-F3-003)
export const MetricsSnapshot = z.object({
  serverId:              z.string().uuid(),
  timestamp:             z.string().datetime(),
  cpuPercent:            z.number().min(0).max(100),
  ramUsedBytes:          z.number().nonnegative(),
  ramTotalBytes:         z.number().nonnegative(),
  diskUsedBytes:         z.number().nonnegative(),
  diskTotalBytes:        z.number().nonnegative(),
  networkRxBytesPerSec:  z.number().nonnegative(),
  networkTxBytesPerSec:  z.number().nonnegative(),
  containers: z.array(z.object({
    id:              z.string(),
    name:            z.string(),
    status:          ContainerStatus,
    diskUsageBytes:  z.number().nonnegative().optional(),
  })).max(100),             // max 100 containers per server
});

// Alert record
export const Alert = z.object({
  id:               z.string().uuid(),
  serverId:         z.string().uuid(),
  appId:            z.string().uuid().nullable(),
  severity:         AlertSeverity,
  type:             AlertType,
  message:          z.string(),
  notificationSent: z.boolean(),
  acknowledgedAt:   z.string().datetime().nullable(),
  createdAt:        z.string().datetime(),
});

// Dashboard aggregate output
export const DashboardOutput = z.object({
  servers: z.array(z.object({
    server:         ServerRecord,
    latestMetrics:  MetricsSnapshot.nullable(),
    apps:           z.array(DeployedApp),
    activeAlerts:   z.array(Alert),
  })),
});
```

---

## 3. Integration Protocols

### 3.1 Docker Socket Access (via SSH)

UnplugHQ never exposes a Docker TCP socket. All container operations go via SSH command execution using `ssh2` with pre-defined parameterized templates.

**Parameterized command templates (T-01 mitigation):**

All values are validated by Zod before SSH execution. String concatenation for command construction is prohibited.

```
# Pull image by pinned digest (T-03 — prevents catalog tampering)
docker pull <registry>/<image>@sha256:<digest>

# Create container — containerName: [a-z0-9-]+ validated by Zod allowlist
docker run -d \
  --name <containerName> \
  --network unplughq \
  --restart unless-stopped \
  --env-file /tmp/unplughq-<containerName>.env \  # envfile written via SFTP, not inline
  <registry>/<image>@sha256:<digest>

# Lifecycle operations
docker start   <containerName>
docker stop    <containerName>
docker rm -f   <containerName>
docker inspect <containerName>    # post-deploy health check
docker ps --format json           # container status poll by monitoring agent
```

**SSH session constraints:**

| Constraint | Value | Threat Mitigated |
|-----------|-------|----------------|
| SSH user on VPS | `unplughq` (non-root, limited sudoers) | E-04 |
| Allowed sudo commands | Docker CLI + specific APT commands only | E-04 |
| Connect timeout | 30 seconds | D-04 |
| Command timeout | 120 seconds | D-04 |
| Max concurrent SSH connections per server | 3 | D-04 |
| SSH key type | Ed25519 preferred; RSA-4096 fallback | — |

### 3.2 Monitoring Agent — HTTPS Metrics Ingest

The monitoring agent (Docker container on the user's VPS) pushes metrics via HTTPS POST every 30 seconds. This is a **Next.js Route Handler** (`/api/agent/metrics`), not a tRPC procedure — it uses per-server API token auth, not session auth.

**Endpoint:** `POST /api/agent/metrics`

**Request:**
```
Authorization: Bearer <server-api-token>   // issued during provisioning; bound to server_id (S-03)
Content-Type: application/json

<MetricsSnapshot payload>
```

**Response codes:**

| Status | Body | Condition |
|--------|------|-----------|
| 200 | `{ "ok": true }` | Accepted |
| 400 | `{ "error": { "code": "VALIDATION_ERROR" } }` | Payload fails MetricsSnapshot strict parse |
| 401 | `{ "error": { "code": "UNAUTHENTICATED" } }` | Invalid or expired token |
| 429 | `{ "error": { "code": "RATE_LIMITED" } }` | >2 req/min per server (D-02) |

**Server-side validation rules:**
- Parse `MetricsSnapshot` with `z.safeParse` in **strict mode** (no extra fields) — I-06 mitigation
- Validate `serverId` in payload matches the token's bound `server_id` — S-03 mitigation
- Reject if `containers` array length > 100
- Rate limit: sliding window, 2 requests per 60 seconds per token

### 3.3 SSE Stream — Real-Time Dashboard Updates

Browser clients subscribe to real-time events via Server-Sent Events.

**Endpoint:** `GET /api/events`  
**Auth:** Session cookie (Auth.js); returns 401 if unauthenticated.

**Event schema (TypeScript union):**
```typescript
type SSEEvent =
  | { event: 'server.status';       data: { serverId: string; status: ServerStatus } }
  | { event: 'deployment.progress'; data: { deploymentId: string; status: DeploymentStatus; phase: string } }
  | { event: 'metrics.update';      data: MetricsSnapshot }
  | { event: 'alert.created';       data: Alert }
  | { event: 'alert.dismissed';     data: { alertId: string } }
  | { event: 'heartbeat';           data: { ts: number } }     // every 30 seconds keepalive
```

All events are scoped to the authenticated `tenantId` — cross-tenant events are never pushed (I-07 mitigation).

### 3.4 Caddy Admin API Integration

The provisioning/deployment worker configures Caddy on the VPS via Caddy's Admin API, accessed by SSH-tunneled HTTP calls (never direct network access from the control plane).

**On-VPS admin endpoint:** `http://localhost:2019` — bound to loopback only (T-04 mitigation)

**Operations:**

| Operation | Method | Caddy path | When |
|-----------|--------|-----------|------|
| Add app route | `POST` | `/config/apps/http/servers/srv0/routes` | App deployment |
| Remove app route | `DELETE` | `/config/apps/http/servers/srv0/routes/{@id}` | App removal |
| Validate config | `GET` | `/config/` | Pre-deployment check |
| Reload after batch changes | `POST` | `/load` | Multi-app operations |

**Route payload (per app):**
```json
{
  "@id": "unplughq-<containerName>",
  "match": [{ "host": ["<domain>"] }],
  "handle": [{
    "handler": "reverse_proxy",
    "upstreams": [{ "dial": "<containerName>:80" }]
  }],
  "terminal": true
}
```

`<containerName>` matches `[a-z0-9-]+` (allowlist-validated before insertion). `<domain>` is validated by `DeployAppInput.domain` Zod schema.

---

## 4. Error Contract

### 4.1 Domain Error Code Enum

```typescript
export const ErrorCode = {
  // Auth / Access
  UNAUTHENTICATED:       'UNAUTHENTICATED',       // No valid session
  FORBIDDEN:             'FORBIDDEN',              // Lacks permission or cross-tenant attempt (I-07)
  SESSION_EXPIRED:       'SESSION_EXPIRED',        // Inactivity timeout (FR-F4-006)

  // Resource
  NOT_FOUND:             'NOT_FOUND',              // Resource absent or tenant cannot see it (I-07)
  CONFLICT:              'CONFLICT',               // Duplicate resource

  // Validation
  VALIDATION_ERROR:      'VALIDATION_ERROR',       // Zod parse failure; issues array included
  INVALID_DOMAIN:        'INVALID_DOMAIN',         // Domain format or DNS pre-check failed

  // SSH / Infrastructure
  SSH_CONNECTION_FAILED: 'SSH_CONNECTION_FAILED',  // TCP unreachable or timeout
  SSH_AUTH_FAILED:       'SSH_AUTH_FAILED',        // Key rejected by VPS
  SSH_COMMAND_FAILED:    'SSH_COMMAND_FAILED',     // Command executed, non-zero exit
  INCOMPATIBLE_SERVER:   'INCOMPATIBLE_SERVER',    // Pre-provisioning compat check failed (BR-F1-001)

  // Provisioning / Deployment
  PROVISIONING_FAILED:   'PROVISIONING_FAILED',
  DEPLOYMENT_FAILED:     'DEPLOYMENT_FAILED',
  HEALTH_CHECK_FAILED:   'HEALTH_CHECK_FAILED',    // Post-deploy HTTP check returned non-200
  CERTIFICATE_FAILED:    'CERTIFICATE_FAILED',     // ACME issuance failed

  // Rate / Tier
  RATE_LIMITED:          'RATE_LIMITED',           // BR-F4-001, D-01, D-02
  TIER_LIMIT_EXCEEDED:   'TIER_LIMIT_EXCEEDED',    // Free tier quota reached (E-03)

  // System
  INTERNAL_ERROR:        'INTERNAL_ERROR',         // Unexpected error — never exposes internals (I-04)
} as const;
export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode];
```

### 4.2 tRPC Error Response Shape

```typescript
// Thrown inside a tRPC procedure:
throw new TRPCError({
  code: 'BAD_REQUEST',            // TRPCError HTTP mapping code
  message: 'IP address is invalid',
  cause: {
    code: ErrorCode.VALIDATION_ERROR,
    issues: zodResult.error.issues,   // never include raw field names that reveal schema
  },
});

// Wire format received by the client:
{
  "error": {
    "message": "IP address is invalid",
    "data": {
      "code": "BAD_REQUEST",
      "httpStatus": 400,
      "path": "server.testConnection",
      "cause": {
        "code": "VALIDATION_ERROR",
        "issues": [{ "path": ["ip"], "message": "Invalid IP address" }]
      }
    }
  }
}
```

### 4.3 HTTP Status Mapping

| Domain ErrorCode(s) | TRPCError Code | HTTP Status |
|---------------------|---------------|-------------|
| `UNAUTHENTICATED`, `SESSION_EXPIRED` | `UNAUTHORIZED` | 401 |
| `FORBIDDEN`, `TIER_LIMIT_EXCEEDED` | `FORBIDDEN` | 403 |
| `NOT_FOUND` | `NOT_FOUND` | 404 |
| `CONFLICT` | `CONFLICT` | 409 |
| `VALIDATION_ERROR`, `INVALID_DOMAIN` | `BAD_REQUEST` | 400 |
| `RATE_LIMITED` | `TOO_MANY_REQUESTS` | 429 |
| `SSH_*`, `PROVISIONING_*`, `DEPLOYMENT_*`, `CERTIFICATE_*`, `HEALTH_CHECK_FAILED`, `INCOMPATIBLE_SERVER`, `INTERNAL_ERROR` | `INTERNAL_SERVER_ERROR` | 500 |

**Security rule (I-04):** SSH stderr output, server hostnames, exit codes, and stack traces are logged server-side at `error` level with the BullMQ `job_id` correlation key. They are **never** included in the client-facing `message` field.

---

## 5. Auth Flow

### 5.1 tRPC Context

```typescript
// src/server/trpc/context.ts
import { auth } from '@/lib/auth';  // Auth.js v5

export async function createContext({ req }: { req: NextRequest }) {
  const session = await auth();
  return {
    session,
    userId:   session?.user.id   ?? null,
    tenantId: session?.user.id   ?? null,   // tenantId === userId for PI-1 single-user model
    tier:    (session?.user.tier as SubscriptionTier) ?? null,
  };
}
export type Context = Awaited<ReturnType<typeof createContext>>;
```

### 5.2 Middleware Chain

```typescript
const t = initTRPC.context<Context>().create();

// Public — no session required (catalog, session status check)
export const publicProcedure = t.procedure;

// Protected — session required; injects typed tenantId (never from request params)
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.tenantId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', cause: { code: ErrorCode.UNAUTHENTICATED } });
  }
  return next({ ctx: { ...ctx, tenantId: ctx.tenantId, userId: ctx.userId! } });
});

// Tier limit enforcement — compose onto protectedProcedure for resource-creation routes
export const withTierLimit = (check: (tier: SubscriptionTier) => Promise<void>) =>
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.tier) throw new TRPCError({ code: 'UNAUTHORIZED' });
    await check(ctx.tier);  // throws TIER_LIMIT_EXCEEDED if quota exceeded
    return next();
  });
```

### 5.3 Tenant Isolation Pattern

**Composite key lookup — mandatory on every resource query (I-07, E-02):**

```typescript
// ❌ IDOR vulnerability — never do this:
const server = await db.query.servers.findFirst({
  where: eq(servers.id, input.serverId),
});

// ✅ Correct — always include tenantId from session context:
const server = await db.query.servers.findFirst({
  where: and(
    eq(servers.id, input.serverId),
    eq(servers.tenantId, ctx.tenantId),
  ),
});
if (!server) throw new TRPCError({ code: 'NOT_FOUND', cause: { code: ErrorCode.NOT_FOUND } });
```

All external-facing resource IDs are UUID v4 — never sequential integers (E-02 mitigation).

### 5.4 RBAC Summary

| Operation | Procedure base | Additional check |
|-----------|---------------|-----------------|
| Read any resource | `protectedProcedure` | ORM composite key (tenantId + resourceId) |
| Create server | `protectedProcedure` | `withTierLimit` — checks server count vs tier |
| Deploy app | `protectedProcedure` | `withTierLimit` — checks app count vs tier + server ownership |
| Destructive operation (disconnect, remove) | `protectedProcedure` | `confirmationToken` in input (one-time, generated at preview step) |
| Ingest metrics (agent) | Agent token middleware | Token bound to single `server_id`; no session involved |

---

## 6. Test Environment Strategy

### 6.1 Environment Detection

Test mode is detected **only from `process.env`, never from request headers or payload fields.**

```typescript
const isTest = process.env.NODE_ENV === 'test';
```

### 6.2 Auth in Test Mode

```typescript
// Inject fixture session via env vars — no hardcoded tokens
export function createTestContext(overrides?: Partial<Context>): Context {
  const userId = process.env.TEST_SESSION_USER_ID;
  if (!userId) throw new Error('TEST_SESSION_USER_ID must be set in test runner .env.test');
  return {
    session: { user: { id: userId, email: 'test@example.com', name: 'Test User' } },
    userId,
    tenantId: userId,
    tier: (process.env.TEST_SESSION_TIER ?? 'free') as SubscriptionTier,
    ...overrides,
  };
}

// Usage in test file:
const caller = appRouter.createCaller(createTestContext());
const result = await caller.server.list();
```

### 6.3 Forbidden Patterns

The following constructs are **prohibited** and will be rejected at code review (P5):

| Pattern | Why prohibited |
|---------|----------------|
| `if (token === 'valid-csrf-token')` | Hardcoded bypass token survives to production |
| `if (req.headers['x-bypass-auth'])` | Request-header bypass is an OWASP A01 vulnerability |
| `if (process.env.SKIP_AUTH === 'true')` | One misconfigured env var → full auth bypass in production |
| Disabling tenant isolation checks in test mode | Defeats the primary multi-tenant security control |

### 6.4 Test Doubles

| Dependency | Strategy |
|-----------|---------|
| `ssh2` SSH client | Inject a mock `SSHExecutor` interface via constructor into `SSHService`; return fixture stdout/stderr |
| Docker commands | Stub `executeSSHCommand` — return fixture JSON matching Docker CLI output format |
| Caddy Admin API | Stub the HTTP client injected into `CaddyIntegrationService` |
| BullMQ | Use `ioredis-mock` backed Queue; test job handler logic directly by calling job handler functions |
| Auth.js session | `createTestContext()` above — never mock Auth.js internals |
| Email service | `EMAIL_TRANSPORT=mock` in `.env.test`; captures sent messages in memory for assertion |
| ACME / Let's Encrypt | Stub Caddy integration — assert that the route config includes TLS block; do not test ACME externally |

All injectable dependencies use TypeScript interfaces (e.g., `ISSHExecutor`, `ICaddyClient`) declared in `src/server/ports/`. Production implementations live in `src/server/adapters/`. Test doubles implement the same interfaces — no `jest.mock()` on production module paths that contain domain logic.

---

## PI-2 — Sprint 2 API Contract Extensions

> **Version 2.0.0 — PI-2 Extension.** The following sections extend the PI-1 API contracts to support Feature 2 (Application Catalog & Deployment — AB#202–206) and Feature 3 (Dashboard & Health Monitoring — AB#207–209). PI-1 contracts remain unchanged above. PI-2 additions implement the procedures already listed in the §1 Router Map and add new schemas, integration protocols, error codes, and BullMQ job flows required for Sprint 2.
>
> **Upstream references:** [Architecture Overview v2.0](architecture-overview.md) · [Requirements v2.0](requirements.md) · [Threat Model v2.0](threat-model.md) · [Solution Assessment v2.0](solution-assessment.md)

---

## 7. PI-2 Zod Schemas

All new schemas live alongside PI-1 schemas in `src/lib/schemas/`. Shared between tRPC procedures, BullMQ job validators, and test fixtures.

### 7.1 App Category Enum (PI-2)

```typescript
export const AppCategory = z.enum([
  'file-storage', 'analytics', 'cms', 'password-management',
  'photo-storage', 'development', 'monitoring', 'automation',
  'communication', 'productivity', 'media', 'finance',
]);
export type AppCategory = z.infer<typeof AppCategory>;
```

### 7.2 Extended CatalogApp Schema (PI-2)

The PI-1 `CatalogApp` schema (§2.3) is extended with additional fields required for deployment orchestration and multi-app coexistence. The PI-1 shape remains valid; these fields are additive.

```typescript
export const PortMapping = z.object({
  containerPort: z.number().int().min(1).max(65535),
  protocol:      z.enum(['tcp', 'udp']).default('tcp'),
});

export const VolumeMount = z.object({
  containerPath: z.string().min(1),
  // Host path generated at deployment: /opt/unplughq/data/{containerName}/{subPath}
  subPath:       z.string().min(1),
  readOnly:      z.boolean().default(false),
});

export const HealthCheckConfig = z.object({
  path:          z.string().default('/'),
  port:          z.number().int().min(1).max(65535).optional(), // defaults to first port in ports[]
  intervalMs:    z.number().int().default(20000),
  timeoutMs:     z.number().int().default(20000),
  retries:       z.number().int().min(1).max(10).default(3),
  startPeriodMs: z.number().int().default(30000), // wait before first check
});

export const CatalogAppExtended = CatalogApp.extend({
  category:     AppCategory,
  icon:         z.string().optional(),  // Lucide icon name or custom SVG path
  ports:        z.array(PortMapping).min(1),
  volumes:      z.array(VolumeMount).default([]),
  envDefaults:  z.record(z.string(), z.string()).default({}),
  healthCheck:  HealthCheckConfig,
  dependencies: z.array(z.string()).default([]),  // other template IDs required
  networkMode:  z.literal('unplughq').default('unplughq'),
  tags:         z.array(z.string()).default([]),   // searchable tags
});
export type CatalogAppExtended = z.infer<typeof CatalogAppExtended>;
```

### 7.3 Catalog Filter / Search Schemas (PI-2 — AB#202)

```typescript
export const CatalogListInput = z.object({
  category: AppCategory.optional(),
  search:   z.string().max(200).optional(),  // case-insensitive substring match on name + description
  page:     z.number().int().min(1).default(1),
  limit:    z.number().int().min(1).max(50).default(20),
});

export const CatalogListOutput = z.object({
  items:      z.array(CatalogAppExtended),
  total:      z.number().int(),
  page:       z.number().int(),
  totalPages: z.number().int(),
});

export const CatalogGetInput = z.object({
  id: z.string().min(1),  // catalog app slug e.g. "nextcloud"
});
```

### 7.4 Deployment Configuration Schemas (PI-2 — AB#203)

```typescript
// Validates config values against an app template's configSchema at runtime
// The generic record is validated dynamically by the deployment service
// which checks each key against the template's configSchema array
export const DeploymentConfigInput = z.object({
  catalogAppId: z.string().min(1),
  serverId:     z.string().uuid(),
  domain:       z.string().regex(
    /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
    'Valid FQDN required — no localhost, wildcards, or IP addresses'
  ),
  config: z.record(
    z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Config key must be alphanumeric'),
    z.string().max(2000).refine(
      (val) => !/[;&|`$(){}><\n]/.test(val),
      'Config values must not contain shell metacharacters (T-10 mitigation)'
    ),
  ),
});
// Alias for compatibility — same shape as PI-1 DeployAppInput with stricter validation
export const DeployAppInputV2 = DeploymentConfigInput;
```

### 7.5 Deployment Progress Schemas (PI-2 — AB#204)

```typescript
export const DeploymentPhase = z.enum([
  'pending', 'pulling', 'configuring', 'provisioning-ssl',
  'starting', 'verifying', 'running', 'failed',
]);

// Phase descriptions displayed to non-technical users
export const DeploymentPhaseLabel: Record<z.infer<typeof DeploymentPhase>, string> = {
  'pending':          'Preparing deployment…',
  'pulling':          'Downloading your app…',
  'configuring':      'Configuring your app…',
  'provisioning-ssl': 'Setting up your domain…',
  'starting':         'Starting your app…',
  'verifying':        'Verifying everything works…',
  'running':          'Your app is live!',
  'failed':           'Deployment encountered an issue',
};

export const DeploymentProgressEvent = z.object({
  deploymentId: z.string().uuid(),
  status:       DeploymentStatus,
  phase:        z.string(),      // User-friendly phase label from DeploymentPhaseLabel
  progress:     z.number().min(0).max(100).optional(), // percentage if calculable
  message:      z.string().optional(),
  timestamp:    z.string().datetime(),
});
```

### 7.6 Post-Deployment Verification Schemas (PI-2 — AB#205)

```typescript
export const HealthCheckResult = z.object({
  deploymentId:   z.string().uuid(),
  httpStatus:     z.number().int().nullable(),
  responseTimeMs: z.number().nonnegative().nullable(),
  sslValid:       z.boolean(),
  sslExpiresAt:   z.string().datetime().nullable(),
  dnsResolved:    z.boolean(),
  dnsTarget:      z.string().ip().nullable(),
  checks: z.array(z.object({
    name:    z.string(),
    passed:  z.boolean(),
    detail:  z.string().optional(),
  })),
  overallStatus:  z.enum(['healthy', 'degraded', 'unhealthy']),
  checkedAt:      z.string().datetime(),
});

export const VerificationInput = z.object({
  deploymentId: z.string().uuid(),
});
```

### 7.7 Multi-App Coexistence Schemas (PI-2 — AB#206)

```typescript
export const ResourceAllocation = z.object({
  serverId:     z.string().uuid(),
  totalCpu:     z.number(),
  totalRamGb:   z.number(),
  totalDiskGb:  z.number(),
  usedCpu:      z.number(),
  usedRamGb:    z.number(),
  usedDiskGb:   z.number(),
  apps: z.array(z.object({
    deploymentId:  z.string().uuid(),
    appName:       z.string(),
    cpuPercent:    z.number().min(0).max(100),
    ramBytes:      z.number().nonnegative(),
    diskBytes:     z.number().nonnegative(),
    containerPort: z.number().int(),
  })),
});

export const ResourceCheckInput = z.object({
  serverId:     z.string().uuid(),
  catalogAppId: z.string().min(1),
});

export const ResourceCheckOutput = z.object({
  fits:     z.boolean(),
  warnings: z.array(z.string()),
  details: z.object({
    cpuRequired:  z.number(),
    cpuAvailable: z.number(),
    ramRequired:  z.number(),
    ramAvailable: z.number(),
    diskRequired: z.number(),
    diskAvailable: z.number(),
  }),
});
```

### 7.8 Dashboard Overview Schemas (PI-2 — AB#207)

```typescript
// Extended dashboard output with resource gauges and per-app breakdown
export const DashboardServerOverview = z.object({
  server:        ServerRecord,
  latestMetrics: MetricsSnapshot.nullable(),
  metricsStaleSince: z.string().datetime().nullable(),  // set if no push for >120s
  apps: z.array(DeployedApp.extend({
    containerStatus: ContainerStatus.nullable(),
    cpuPercent:      z.number().min(0).max(100).nullable(),
    ramBytes:        z.number().nonnegative().nullable(),
    diskBytes:       z.number().nonnegative().nullable(),
  })),
  activeAlerts: z.array(Alert),
  resourceUtilization: z.object({
    cpuPercent:  z.number().min(0).max(100).nullable(),
    ramPercent:  z.number().min(0).max(100).nullable(),
    diskPercent: z.number().min(0).max(100).nullable(),
    level:       z.enum(['healthy', 'warning', 'critical']),
  }),
});

export const DashboardOutputV2 = z.object({
  servers: z.array(DashboardServerOverview),
  globalAlertCount: z.number().int().nonnegative(),
  lastUpdated:      z.string().datetime(),
});

export const ServerMetricsInput = z.object({
  serverId: z.string().uuid(),
  minutes:  z.number().int().min(5).max(1440).default(60),  // last N minutes, max 24h
});

export const ServerMetricsOutput = z.object({
  serverId:    z.string().uuid(),
  dataPoints:  z.array(z.object({
    timestamp:    z.string().datetime(),
    cpuPercent:   z.number(),
    ramPercent:   z.number(),
    diskPercent:  z.number(),
    networkRx:    z.number(),
    networkTx:    z.number(),
  })),
  interval:    z.enum(['30s', '1m', '5m', '15m']),  // auto-selected based on range
});
```

### 7.9 Alert Schemas (PI-2 — AB#208, AB#209)

```typescript
// Extended AlertType with resource-warning tier
export const AlertTypeExtended = z.enum([
  'cpu-critical', 'cpu-warning',
  'ram-critical', 'ram-warning',
  'disk-critical', 'disk-warning',
  'app-unavailable', 'server-unreachable',
]);

export const AlertStatus = z.enum([
  'active', 'acknowledged', 'dismissed', 'resolved',
]);

export const AlertExtended = Alert.extend({
  status:           AlertStatus,
  acknowledgedAt:   z.string().datetime().nullable(),
  dismissedAt:      z.string().datetime().nullable(),
  resolvedAt:       z.string().datetime().nullable(),
  currentValue:     z.string().nullable(),   // e.g. "92%" — human-readable
  thresholdValue:   z.string().nullable(),   // e.g. "90%"
  affectedAppId:    z.string().uuid().nullable(),
  affectedAppName:  z.string().nullable(),
  remediationSteps: z.array(z.string()).default([]),
});
export type AlertExtended = z.infer<typeof AlertExtended>;

export const AlertListInput = z.object({
  status:   z.array(AlertStatus).optional(), // filter by status; default: ['active', 'acknowledged']
  serverId: z.string().uuid().optional(),     // filter by server
  severity: AlertSeverity.optional(),         // filter by severity
  page:     z.number().int().min(1).default(1),
  limit:    z.number().int().min(1).max(100).default(25),
});

export const AlertListOutput = z.object({
  items:      z.array(AlertExtended),
  total:      z.number().int(),
  page:       z.number().int(),
  totalPages: z.number().int(),
});

export const AlertDismissInput = z.object({
  alertId: z.string().uuid(),
});

export const AlertAcknowledgeInput = z.object({
  alertId: z.string().uuid(),
});

// Alert rule configuration (PI-2: read-only defaults; PI-3: user-configurable)
export const AlertRule = z.object({
  id:              z.string().uuid(),
  serverId:        z.string().uuid().nullable(),  // null = global default
  metric:          z.enum(['cpu', 'ram', 'disk', 'app-status']),
  operator:        z.enum(['gt', 'lt', 'eq']),
  threshold:       z.number(),
  durationSeconds: z.number().int().nonnegative(),
  severity:        AlertSeverity,
  alertType:       AlertTypeExtended,
  isActive:        z.boolean(),
});

export const AlertRuleListOutput = z.object({
  rules: z.array(AlertRule),
});
```

### 7.10 Remediation Schemas (PI-2 — AB#209)

```typescript
export const RemediationType = z.enum([
  'restart-app', 'view-disk-breakdown', 'view-resource-breakdown',
  'upgrade-guidance', 'dns-check', 'manual',
]);

export const RemediationAction = z.object({
  type:         RemediationType,
  label:        z.string(),        // User-facing button/link text
  description:  z.string(),        // Plain-language explanation
  actionUrl:    z.string().optional(), // Deep-link or API endpoint
  requiresConfirmation: z.boolean().default(false),
});

export const RemediationPlan = z.object({
  alertId:      z.string().uuid(),
  alertType:    AlertTypeExtended,
  steps:        z.array(RemediationAction),
  estimatedTime: z.string().optional(),  // e.g. "< 5 minutes"
});

export const RemediationPlanInput = z.object({
  alertId: z.string().uuid(),
});
```

### 7.11 Deployment Log Schema (PI-2)

```typescript
export const DeploymentLog = z.object({
  id:           z.string().uuid(),
  deploymentId: z.string().uuid(),
  phase:        DeploymentPhase,
  status:       z.enum(['started', 'completed', 'failed']),
  message:      z.string().nullable(),
  startedAt:    z.string().datetime(),
  completedAt:  z.string().datetime().nullable(),
});

export const DeploymentLogListOutput = z.object({
  logs: z.array(DeploymentLog),
});
```

---

## 8. PI-2 tRPC Procedure Contracts

### 8.1 App Catalog Router — `app.catalog.*` (AB#202, AB#203)

Extends the `app` router's `catalog` sub-router. Catalog browsing is public (no auth required). Catalog detail with `configSchema` enables dynamic form generation.

| Procedure | Type | Input | Output | Auth | Rate Limit | Errors | Story |
|-----------|------|-------|--------|------|------------|--------|-------|
| `app.catalog.list` | query | `CatalogListInput` | `CatalogListOutput` | public | 30 req/min per IP | `VALIDATION_ERROR` | AB#202 |
| `app.catalog.get` | query | `CatalogGetInput` | `CatalogAppExtended` | public | 30 req/min per IP | `NOT_FOUND`, `VALIDATION_ERROR` | AB#202 |
| `app.catalog.categories` | query | — (none) | `z.array(z.object({ id: AppCategory, label: z.string(), count: z.number() }))` | public | 30 req/min per IP | — | AB#202 |
| `app.catalog.checkResourceFit` | query | `ResourceCheckInput` | `ResourceCheckOutput` | protected | — | `NOT_FOUND`, `VALIDATION_ERROR` | AB#203, AB#206 |

**`app.catalog.list` implementation contract:**

```typescript
// Router: src/server/trpc/routers/app/catalog.ts
export const catalogRouter = router({
  list: publicProcedure
    .input(CatalogListInput)
    .output(CatalogListOutput)
    .query(async ({ input }) => {
      // 1. Query app_templates table: WHERE is_active = true
      // 2. If input.category: AND category = input.category
      // 3. If input.search: AND (LOWER(name) LIKE %search% OR LOWER(description) LIKE %search% OR tags @> [search])
      // 4. Paginate with OFFSET/LIMIT
      // 5. Return items + total + page + totalPages
    }),

  get: publicProcedure
    .input(CatalogGetInput)
    .output(CatalogAppExtended)
    .query(async ({ input }) => {
      // 1. Query app_templates WHERE slug = input.id AND is_active = true
      // 2. If not found: throw NOT_FOUND
      // 3. Return full template with configSchema, ports, volumes, healthCheck
    }),

  categories: publicProcedure
    .query(async () => {
      // 1. SELECT category, COUNT(*) FROM app_templates WHERE is_active = true GROUP BY category
      // 2. Map to { id, label, count } with human-readable labels
    }),

  checkResourceFit: protectedProcedure
    .input(ResourceCheckInput)
    .output(ResourceCheckOutput)
    .query(async ({ ctx, input }) => {
      // 1. Fetch template by catalogAppId — throw NOT_FOUND if missing
      // 2. Fetch server by serverId with tenant isolation (ctx.tenantId)
      // 3. Fetch latest MetricsSnapshot for server
      // 4. Compare template.minCpuCores/minRamGb/minDiskGb against available resources
      // 5. Factor in existing deployments' resource usage
      // 6. Return fits: boolean + warnings[] + details
    }),
});
```

### 8.2 App Deployment Router — `app.deployment.*` (AB#203, AB#204, AB#205, AB#206)

Extends the `app` router's `deployment` sub-router. All procedures are protected (session-required) and tenant-scoped.

| Procedure | Type | Input | Output | Auth | Rate Limit | Errors | Story |
|-----------|------|-------|--------|------|------------|--------|-------|
| `app.deployment.list` | query | `z.object({ serverId?: z.string().uuid() })` | `z.array(DeployedApp)` | protected | — | `VALIDATION_ERROR` | AB#204 |
| `app.deployment.get` | query | `z.object({ deploymentId: z.string().uuid() })` | `DeployedApp & { logs: DeploymentLog[] }` | protected | — | `NOT_FOUND`, `VALIDATION_ERROR` | AB#204 |
| `app.deployment.create` | mutation | `DeploymentConfigInput` | `z.object({ deploymentId: z.string().uuid(), status: DeploymentStatus })` | protected + `withTierLimit` | 5 req/min per tenant | `VALIDATION_ERROR`, `NOT_FOUND`, `TIER_LIMIT_EXCEEDED`, `INCOMPATIBLE_SERVER`, `INSUFFICIENT_RESOURCES`, `DOMAIN_CONFLICT` | AB#203, AB#204 |
| `app.deployment.stop` | mutation | `z.object({ deploymentId: z.string().uuid(), confirmationToken: z.string() })` | `z.object({ status: DeploymentStatus })` | protected | — | `NOT_FOUND`, `FORBIDDEN`, `SSH_COMMAND_FAILED` | AB#204 |
| `app.deployment.start` | mutation | `z.object({ deploymentId: z.string().uuid() })` | `z.object({ status: DeploymentStatus })` | protected | — | `NOT_FOUND`, `SSH_COMMAND_FAILED` | AB#204, AB#209 |
| `app.deployment.remove` | mutation | `z.object({ deploymentId: z.string().uuid(), confirmationToken: z.string() })` | `z.object({ removed: z.boolean() })` | protected | — | `NOT_FOUND`, `FORBIDDEN`, `SSH_COMMAND_FAILED` | AB#206 |
| `app.deployment.verify` | query | `VerificationInput` | `HealthCheckResult` | protected | — | `NOT_FOUND`, `HEALTH_CHECK_FAILED` | AB#205 |
| `app.deployment.logs` | query | `z.object({ deploymentId: z.string().uuid() })` | `DeploymentLogListOutput` | protected | — | `NOT_FOUND` | AB#204 |

**`app.deployment.create` implementation contract:**

```typescript
// Router: src/server/trpc/routers/app/deployment.ts
export const deploymentRouter = router({
  create: protectedProcedure
    .use(withTierLimit(async (tier) => {
      // Check current deployment count against TierLimits[tier].maxApps
    }))
    .input(DeploymentConfigInput)
    .mutation(async ({ ctx, input }) => {
      // 1. Validate catalogAppId exists in app_templates — throw NOT_FOUND if missing
      // 2. Fetch server WHERE id = input.serverId AND tenant_id = ctx.tenantId — tenant isolation (I-07)
      // 3. Check server.status === 'provisioned' — throw INCOMPATIBLE_SERVER otherwise
      // 4. Check resource fit (template requirements vs server metrics) — FR-F2-104
      //    Warn on insufficient resources, but proceed if user acknowledged (soft limit)
      // 5. Check domain uniqueness: no other deployment with same domain on any server — throw DOMAIN_CONFLICT
      // 6. Validate config record against template's configSchema — dynamic Zod validation
      //    Reject shell metacharacters in config values (T-10 mitigation)
      // 7. Generate UUIDv7 deployment ID (S-11: nonce against replay)
      // 8. INSERT deployment (status: 'pending', tenant_id, server_id, catalog_app_id, domain, config)
      // 9. INSERT audit_log (action: 'deployment.create', target: deployment.id) — BF-004
      // 10. Enqueue BullMQ 'deploy-app' job with deployment_id
      // 11. Return { deploymentId, status: 'pending' }
    }),

  stop: protectedProcedure
    .input(z.object({ deploymentId: z.string().uuid(), confirmationToken: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Fetch deployment WHERE id AND tenant_id — tenant isolation
      // 2. Validate confirmationToken (one-time, generated at preview step — NFR-006)
      // 3. Validate deployment status is 'running' or 'unhealthy'
      // 4. SSH: docker stop <containerName> on the deployment's server
      // 5. UPDATE deployment SET status = 'stopped'
      // 6. INSERT audit_log (action: 'deployment.stop')
      // 7. Emit SSE: deployment.progress { status: 'stopped' }
      // 8. Return { status: 'stopped' }
    }),

  start: protectedProcedure
    .input(z.object({ deploymentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Fetch deployment WHERE id AND tenant_id
      // 2. Validate deployment status is 'stopped'
      // 3. SSH: docker start <containerName>
      // 4. Run health check (HTTP GET with retries)
      // 5. UPDATE deployment SET status = 'running' (or 'unhealthy' on health check failure)
      // 6. INSERT audit_log (action: 'deployment.start')
      // 7. Emit SSE: deployment.progress { status }
      // 8. Return { status }
    }),

  remove: protectedProcedure
    .input(z.object({ deploymentId: z.string().uuid(), confirmationToken: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Fetch deployment WHERE id AND tenant_id — tenant isolation
      // 2. Validate confirmationToken (NFR-006)
      // 3. UPDATE deployment SET status = 'removing'
      // 4. SSH: docker stop + docker rm -f <containerName>
      // 5. SSH tunnel: Caddy Admin API DELETE route @id=unplughq-<containerName>
      // 6. SFTP: rm /opt/unplughq/env/<containerName>.env
      // 7. SFTP: rm -rf /opt/unplughq/data/<containerName>/  (if volumes defined)
      // 8. DELETE deployment record
      // 9. INSERT audit_log (action: 'deployment.remove')
      // 10. Emit SSE: deployment.progress { status: 'removed' }
      // 11. Return { removed: true }
    }),

  verify: protectedProcedure
    .input(VerificationInput)
    .query(async ({ ctx, input }) => {
      // 1. Fetch deployment WHERE id AND tenant_id
      // 2. Perform health checks:
      //    a. DNS resolution: resolve domain to IP, compare to server IP
      //    b. HTTP check: GET https://<domain>/ — expect 2xx within 20s
      //    c. SSL check: verify cert validity and expiry
      // 3. Build HealthCheckResult with individual check results
      // 4. Return result
    }),

  logs: protectedProcedure
    .input(z.object({ deploymentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // 1. Fetch deployment WHERE id AND tenant_id
      // 2. SELECT FROM deployment_logs WHERE deployment_id ORDER BY started_at ASC
      // 3. Return logs
    }),
});
```

### 8.3 Monitor Router — `monitor.*` (AB#207)

Dashboard data aggregation and server-level metric time series.

| Procedure | Type | Input | Output | Auth | Rate Limit | Errors | Story |
|-----------|------|-------|--------|------|------------|--------|-------|
| `monitor.dashboard` | query | — (none) | `DashboardOutputV2` | protected | — | — | AB#207 |
| `monitor.serverMetrics` | query | `ServerMetricsInput` | `ServerMetricsOutput` | protected | — | `NOT_FOUND`, `VALIDATION_ERROR` | AB#207 |
| `monitor.appStatus` | query | `z.object({ deploymentId: z.string().uuid() })` | `z.object({ status: ContainerStatus, uptime: z.string().nullable(), lastCheck: z.string().datetime() })` | protected | — | `NOT_FOUND` | AB#207 |
| `monitor.resourceAllocation` | query | `z.object({ serverId: z.string().uuid() })` | `ResourceAllocation` | protected | — | `NOT_FOUND` | AB#206, AB#207 |

**`monitor.dashboard` implementation contract:**

```typescript
// Router: src/server/trpc/routers/monitor.ts
export const monitorRouter = router({
  dashboard: protectedProcedure
    .output(DashboardOutputV2)
    .query(async ({ ctx }) => {
      // 1. Fetch all servers WHERE tenant_id = ctx.tenantId
      // 2. For each server:
      //    a. Fetch latest metrics_snapshot — check staleness (>120s = stale)
      //    b. Fetch all deployments WHERE server_id
      //    c. For each deployment: map container metrics from snapshot.containers[] by name
      //    d. Fetch active alerts WHERE server_id AND status IN ('active', 'acknowledged')
      //    e. Compute resourceUtilization level:
      //       - healthy: all metrics <70%
      //       - warning: any metric 70-89%
      //       - critical: any metric ≥90%
      // 3. Build DashboardOutputV2 with servers[], globalAlertCount, lastUpdated
    }),

  serverMetrics: protectedProcedure
    .input(ServerMetricsInput)
    .output(ServerMetricsOutput)
    .query(async ({ ctx, input }) => {
      // 1. Fetch server WHERE id AND tenant_id — tenant isolation
      // 2. SELECT FROM metrics_snapshots WHERE server_id AND timestamp > (now - input.minutes)
      //    ORDER BY timestamp ASC
      // 3. Downsample if >500 data points:
      //    - ≤60min: 30s intervals (raw data)
      //    - ≤360min: 1m intervals (average)
      //    - ≤1440min: 5m intervals (average)
      //    - >1440min: 15m intervals (average)
      // 4. Map to data points array with percentage calculations
    }),

  appStatus: protectedProcedure
    .input(z.object({ deploymentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // 1. Fetch deployment WHERE id AND tenant_id — tenant isolation
      // 2. Fetch latest metrics_snapshot for deployment's server
      // 3. Find container in snapshot.containers[] matching deployment.containerName
      // 4. Return status, uptime (from container inspect data), lastCheck timestamp
    }),

  resourceAllocation: protectedProcedure
    .input(z.object({ serverId: z.string().uuid() }))
    .output(ResourceAllocation)
    .query(async ({ ctx, input }) => {
      // 1. Fetch server WHERE id AND tenant_id
      // 2. Fetch latest metrics_snapshot
      // 3. Fetch all deployments WHERE server_id
      // 4. Map each deployment to per-app resource from snapshot.containers[]
      // 5. Return aggregated ResourceAllocation
    }),
});
```

### 8.4 Alert Router — `monitor.alerts.*` (AB#208, AB#209)

Alert lifecycle management, notification preferences, and guided remediation.

| Procedure | Type | Input | Output | Auth | Rate Limit | Errors | Story |
|-----------|------|-------|--------|------|------------|--------|-------|
| `monitor.alerts.list` | query | `AlertListInput` | `AlertListOutput` | protected | — | `VALIDATION_ERROR` | AB#208 |
| `monitor.alerts.get` | query | `z.object({ alertId: z.string().uuid() })` | `AlertExtended` | protected | — | `NOT_FOUND` | AB#208 |
| `monitor.alerts.acknowledge` | mutation | `AlertAcknowledgeInput` | `AlertExtended` | protected | — | `NOT_FOUND`, `CONFLICT` | AB#208 |
| `monitor.alerts.dismiss` | mutation | `AlertDismissInput` | `AlertExtended` | protected | — | `NOT_FOUND`, `CONFLICT` | AB#208 |
| `monitor.alerts.remediation` | query | `RemediationPlanInput` | `RemediationPlan` | protected | — | `NOT_FOUND` | AB#209 |
| `monitor.alerts.rules` | query | — (none) | `AlertRuleListOutput` | protected | — | — | AB#208 |
| `monitor.alerts.history` | query | `z.object({ serverId?: z.string().uuid(), page: z.number().int().min(1).default(1), limit: z.number().int().min(1).max(100).default(25) })` | `AlertListOutput` | protected | — | — | AB#209 |

**`monitor.alerts.acknowledge` / `dismiss` implementation contract:**

```typescript
// Sub-router: src/server/trpc/routers/monitor/alerts.ts
export const alertsRouter = router({
  acknowledge: protectedProcedure
    .input(AlertAcknowledgeInput)
    .mutation(async ({ ctx, input }) => {
      // 1. Fetch alert WHERE id AND server.tenant_id = ctx.tenantId — tenant isolation via join
      // 2. Validate alert.status is 'active' — throw CONFLICT if already acknowledged/dismissed
      // 3. UPDATE alert SET status = 'acknowledged', acknowledgedAt = now()
      // 4. INSERT audit_log (action: 'alert.acknowledge')
      // 5. Emit SSE: alert.acknowledged { alertId }
      // 6. Return updated AlertExtended
    }),

  dismiss: protectedProcedure
    .input(AlertDismissInput)
    .mutation(async ({ ctx, input }) => {
      // 1. Fetch alert WHERE id AND server.tenant_id — tenant isolation
      // 2. Validate alert.status is 'active' or 'acknowledged' — throw CONFLICT if already dismissed
      // 3. UPDATE alert SET status = 'dismissed', dismissedAt = now()
      // 4. INSERT audit_log (action: 'alert.dismiss')
      // 5. Emit SSE: alert.dismissed { alertId }
      // 6. Return updated AlertExtended
    }),

  remediation: protectedProcedure
    .input(RemediationPlanInput)
    .query(async ({ ctx, input }) => {
      // 1. Fetch alert WHERE id AND server.tenant_id — tenant isolation
      // 2. Build remediation plan based on alert.alertType:
      //    - 'app-unavailable': [restart-app action, view logs action]
      //    - 'disk-critical'/'disk-warning': [view-disk-breakdown, upgrade-guidance]
      //    - 'cpu-critical'/'cpu-warning': [view-resource-breakdown, stop low-priority app]
      //    - 'ram-critical'/'ram-warning': [view-resource-breakdown, stop low-priority app]
      //    - 'server-unreachable': [manual — check VPS provider dashboard]
      // 3. Return RemediationPlan with steps and estimatedTime
    }),

  history: protectedProcedure
    .input(z.object({
      serverId: z.string().uuid().optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(25),
    }))
    .query(async ({ ctx, input }) => {
      // 1. SELECT FROM alerts WHERE server.tenant_id = ctx.tenantId
      // 2. If input.serverId: AND server_id = input.serverId
      // 3. Include all statuses (active, acknowledged, dismissed, resolved)
      // 4. ORDER BY created_at DESC — paginate
    }),
});
```

---

## 9. PI-2 Extended Error Codes

New domain error codes added for PI-2 operations. Extends the `ErrorCode` enum from §4.1.

```typescript
// PI-2 additions to ErrorCode
export const ErrorCodeV2 = {
  ...ErrorCode,

  // Deployment — PI-2
  INSUFFICIENT_RESOURCES:  'INSUFFICIENT_RESOURCES',   // Server lacks CPU/RAM/disk for app (FR-F2-104)
  DOMAIN_CONFLICT:         'DOMAIN_CONFLICT',          // Domain already bound to another deployment
  DEPLOYMENT_IN_PROGRESS:  'DEPLOYMENT_IN_PROGRESS',   // Server already has a deployment running
  INVALID_DEPLOYMENT_STATE:'INVALID_DEPLOYMENT_STATE',  // Requested action invalid for current status (T-11)
  IMAGE_PULL_FAILED:       'IMAGE_PULL_FAILED',        // Docker image pull failed on VPS
  ENV_WRITE_FAILED:        'ENV_WRITE_FAILED',         // SFTP env file write failed
  ROUTE_CONFIG_FAILED:     'ROUTE_CONFIG_FAILED',      // Caddy Admin API call failed

  // Alert — PI-2
  ALERT_ALREADY_DISMISSED: 'ALERT_ALREADY_DISMISSED',  // Alert cannot be dismissed again
  ALERT_ALREADY_ACKNOWLEDGED: 'ALERT_ALREADY_ACKNOWLEDGED',
  NOTIFICATION_FAILED:     'NOTIFICATION_FAILED',      // Email dispatch failed after retries

  // DNS — PI-2
  DNS_NOT_PROPAGATED:      'DNS_NOT_PROPAGATED',       // Domain does not resolve to server IP (warning, not block)
} as const;
export type ErrorCodeV2 = typeof ErrorCodeV2[keyof typeof ErrorCodeV2];
```

**PI-2 HTTP status mapping additions:**

| Domain ErrorCode(s) | TRPCError Code | HTTP Status |
|---------------------|---------------|-------------|
| `INSUFFICIENT_RESOURCES` | `PRECONDITION_FAILED` | 412 |
| `DOMAIN_CONFLICT`, `DEPLOYMENT_IN_PROGRESS`, `ALERT_ALREADY_DISMISSED`, `ALERT_ALREADY_ACKNOWLEDGED` | `CONFLICT` | 409 |
| `INVALID_DEPLOYMENT_STATE` | `BAD_REQUEST` | 400 |
| `IMAGE_PULL_FAILED`, `ENV_WRITE_FAILED`, `ROUTE_CONFIG_FAILED`, `NOTIFICATION_FAILED` | `INTERNAL_SERVER_ERROR` | 500 |
| `DNS_NOT_PROPAGATED` | `BAD_REQUEST` (warning — non-blocking) | 200 with warning field |

---

## 10. PI-2 SSE Event Schema Extensions

Extends the SSE event union from §3.3 with new PI-2 events.

```typescript
type SSEEventV2 =
  // PI-1 events (unchanged)
  | { event: 'server.status';       data: { serverId: string; status: ServerStatus } }
  | { event: 'deployment.progress'; data: DeploymentProgressEvent }   // PI-2: richer payload
  | { event: 'metrics.update';      data: MetricsSnapshot }
  | { event: 'alert.created';       data: AlertExtended }             // PI-2: extended
  | { event: 'alert.dismissed';     data: { alertId: string } }
  | { event: 'heartbeat';           data: { ts: number } }

  // PI-2 new events
  | { event: 'alert.acknowledged';  data: { alertId: string } }
  | { event: 'alert.resolved';      data: { alertId: string; resolvedAt: string } }
  | { event: 'deployment.created';  data: { deploymentId: string; appName: string; serverId: string } }
  | { event: 'deployment.removed';  data: { deploymentId: string; appName: string } }
  | { event: 'resource.warning';    data: { serverId: string; metric: string; value: number; threshold: number } }
```

**Event tenant scoping:** All events emitted via `sseEventBus.emitToTenant(tenantId, event)`. The SSE endpoint validates session auth on connection AND re-validates on each heartbeat cycle (S-10 mitigation).

**Client reconnection:** `EventSource` provides automatic reconnection. The SSE endpoint sets `retry: 3000` (3 second reconnection delay). If SSE fails completely, the dashboard client falls back to polling `monitor.dashboard` every 60 seconds (NFR-017).

---

## 11. PI-2 BullMQ Job Contracts

### 11.1 Deploy App Job

**Queue name:** `deploy-app`
**Concurrency:** 3 per worker (max 3 SSH connections per server — §3.1)
**Retry:** 0 automatic retries (deployment state machine handles retry via `app.deployment.create` re-invocation)

```typescript
export const DeployAppJobPayload = z.object({
  deploymentId: z.string().uuid(),    // UUIDv7 — unique nonce (S-11 anti-replay)
  tenantId:     z.string().uuid(),
  serverId:     z.string().uuid(),
  catalogAppId: z.string(),
  domain:       z.string(),
  config:       z.record(z.string(), z.string()),
  templateSnapshot: CatalogAppExtended,  // Frozen at enqueue time — prevents TOCTOU
});
export type DeployAppJobPayload = z.infer<typeof DeployAppJobPayload>;
```

**Job handler phases:**

| Phase | Status | SSH Commands | Rollback on Failure | SSE Event |
|-------|--------|-------------|---------------------|-----------|
| 1. Pull image | `pulling` | `docker pull <registry>/<image>@sha256:<digest>` | `docker rmi` if partial | `deployment.progress { status: pulling }` |
| 2. Configure | `configuring` | SFTP: write env file to `/opt/unplughq/env/<containerName>.env` (mode 0600); `docker create --name <containerName> --network unplughq --restart unless-stopped --env-file ...` | `docker rm -f`, SFTP delete env file | `deployment.progress { status: configuring }` |
| 3. SSL + routing | `provisioning-ssl` | SSH tunnel → Caddy Admin API: `POST /config/apps/http/servers/srv0/routes` with `@id=unplughq-<containerName>` | Caddy API `DELETE` route, `docker rm -f`, SFTP delete | `deployment.progress { status: provisioning-ssl }` |
| 4. Start + verify | `starting` → `verifying` | `docker start <containerName>`, then `HTTP GET https://<domain>/` (3 retries, 20s timeout, exponential backoff) | Set status `failed` (preserve container for debugging/retry) | `deployment.progress { status: starting }` → `deployment.progress { status: running | failed }` |

**State machine transitions enforcement (T-11 mitigation):**
- Each phase transition is an atomic `UPDATE deployments SET status = $1 WHERE id = $2 AND status = $3` (optimistic locking on current status)
- If the WHERE clause matches 0 rows, the job aborts (another process already advanced the state)
- Only the deploy-app worker can advance states forward; only `failed` is reachable from any phase
- State rollback to `pending` (for retry) is gated by a new `app.deployment.create` call — never by direct status manipulation

### 11.2 Process Metrics Job

**Queue name:** `process-metrics`
**Schedule:** BullMQ repeatable, every 60 seconds
**Concurrency:** 1 (sequential evaluation prevents race conditions in alert deduplication)

```typescript
export const ProcessMetricsJobPayload = z.object({
  triggeredAt: z.string().datetime(),
});
```

**Job handler logic:**

```
1. Query all active servers with their latest metrics_snapshot
2. For each server:
   a. Load applicable alert_rules (server-specific override ?? global defaults)
   b. For each rule:
      - Evaluate metric value against threshold with operator
      - For sustained-duration rules (CPU >90% for 5min):
        Query metrics_snapshots for the last N snapshots within duration window
        All snapshots must exceed threshold for rule to fire
      - If threshold breached:
        Check for existing active alert with same server_id + alert_type (deduplication)
        If no duplicate: INSERT alert, enqueue send-alert job
   c. Check for stale data (no snapshot for >120s):
      - If stale and no existing 'server-unreachable' alert: create alert
   d. Check for resolved conditions:
      - If an active alert's condition is no longer true: UPDATE alert SET status = 'resolved', resolvedAt = now()
      - Emit SSE: alert.resolved
3. Emit SSE: metrics.update for each server with fresh data
```

### 11.3 Send Alert Job

**Queue name:** `send-alert`
**Concurrency:** 5
**Retry:** 3 attempts, exponential backoff (5s, 30s, 120s) — NFR-020
**Dead letter queue:** `send-alert-dlq` (after 3 failed attempts)

```typescript
export const SendAlertJobPayload = z.object({
  alertId:       z.string().uuid(),
  tenantId:      z.string().uuid(),
  userEmail:     z.string().email(),
  alertType:     AlertTypeExtended,
  severity:      AlertSeverity,
  serverName:    z.string(),
  appName:       z.string().nullable(),
  currentValue:  z.string(),
  thresholdValue: z.string(),
  dashboardUrl:  z.string().url(),
  remediationSteps: z.array(z.string()),
});
export type SendAlertJobPayload = z.infer<typeof SendAlertJobPayload>;
```

**Job handler logic:**

```
1. Check user notification preference: if emailAlerts === false, skip (BR-F3-002)
2. Build email body from template:
   - Subject: "[UnplugHQ] {severity}: {alertType} on {serverName}"
   - Include: server name, app name (if applicable), current value, threshold
   - Include: remediation steps in plain language
   - Include: deep-link to dashboard alert detail (authenticated URL)
   - Include: unsubscribe link → /settings/notifications
   - Include SPF/DKIM alignment headers (S-12 mitigation)
3. Send via shared EmailService (same transport as password reset — FR-F3-107)
4. UPDATE alert SET notificationSent = true, notificationSentAt = now()
5. On failure: BullMQ auto-retries (3x). After exhaustion: log to dead-letter queue + alert.notificationSent remains false
```

### 11.4 Update Agent Job

**Queue name:** `update-agent`
**Concurrency:** 1 per server (serialized via BullMQ job lock)
**Retry:** 2 attempts

```typescript
export const UpdateAgentJobPayload = z.object({
  serverId:       z.string().uuid(),
  targetVersion:  z.string(),
  imageDigest:    z.string().regex(/^sha256:[a-f0-9]{64}$/),
});
```

**Job handler logic:**

```
1. SSH: docker pull <agent-image>@sha256:<digest>
2. SSH: docker stop unplughq-agent
3. SSH: docker rm unplughq-agent
4. SSH: docker run -d --name unplughq-agent --network unplughq \
        --restart unless-stopped \
        -v /var/run/docker.sock:/var/run/docker.sock:ro \
        -v /proc:/host/proc:ro \
        -v /sys:/host/sys:ro \
        <agent-image>@sha256:<digest>
5. Verify agent is pushing metrics within 60s
6. On failure: roll back to previous agent image
```

---

## 12. PI-2 Integration Protocols

### 12.1 Deployment Pipeline — End-to-End Flow

```
User clicks "Deploy" in catalog wizard
  ↓
[tRPC] app.deployment.create
  → Zod validate DeploymentConfigInput (strict — shell metachar rejection)
  → Tier limit check
  → Server ownership + status check (tenant isolation)
  → Resource fit check (FR-F2-104)
  → Domain uniqueness check
  → Dynamic config validation against template.configSchema
  → INSERT deployment (status: pending)
  → INSERT audit_log
  → Enqueue BullMQ 'deploy-app' job
  → Return { deploymentId, status: pending }
  ↓
[SSE] deployment.created event → browser
  ↓
[BullMQ Worker] deploy-app handler
  → Phase 1: docker pull (via SSH) → SSE: pulling
  → Phase 2: SFTP env file + docker create (via SSH) → SSE: configuring
  → Phase 3: Caddy route (via SSH tunnel) → SSE: provisioning-ssl
  → Phase 4: docker start + health check → SSE: starting → running/failed
  ↓
[SSE] deployment.progress events (per phase) → browser
  ↓
[Browser] Progress view shows real-time phase transitions
  → If running: display access URL link
  → If failed: display guided remediation
```

### 12.2 Health Monitoring — Polling-to-Alert Pipeline

```
[Monitoring Agent on VPS] every 30s
  → Collect: /proc/stat, /proc/meminfo, df, /proc/net/dev
  → Collect: docker ps --format json, docker system df -v
  → POST /api/agent/metrics (Bearer token)
  ↓
[Route Handler] /api/agent/metrics
  → Validate Bearer token → match server_id (S-03)
  → Zod strict parse MetricsSnapshot (reject extra fields — I-06)
  → Rate limit: ≤2 req/60s per server token (D-02)
  → INSERT metrics_snapshot
  → Emit SSE: metrics.update → connected browsers
  ↓
[BullMQ Repeatable] process-metrics (every 60s)
  → For each server: evaluate alert_rules against latest metrics
  → Sustained-duration check for CPU (5-min window)
  → Alert deduplication: no duplicate for same server+type while active
  → Stale data detection: >120s → server-unreachable
  → Auto-resolve: condition clears → alert.resolved
  → INSERT alert (if threshold breached + no duplicate)
  → Enqueue send-alert job (if user has emailAlerts enabled)
  → Emit SSE: alert.created / alert.resolved → browsers
  ↓
[BullMQ] send-alert handler
  → Check notification preference
  → Build email from template (with remediation steps)
  → Send via EmailService
  → UPDATE alert.notificationSent = true
  → On failure: DLQ retry (max 3) — NFR-020
```

### 12.3 Real-Time Dashboard Update Protocol

```
[Browser] Dashboard page load
  → Call monitor.dashboard (tRPC query) for initial state
  → Open SSE connection: GET /api/events (session cookie auth)
  ↓
[SSE Connection Established]
  → Server validates session + sets tenant scope (S-10)
  → Heartbeat every 30s to keep alive across proxies
  → Session re-validated on each heartbeat cycle
  ↓
[Real-time Updates]
  → metrics.update: update resource gauges (CPU/RAM/disk bars, color coding)
  → deployment.progress: update deployment tile status badge
  → alert.created: add alert to active list, show notification badge
  → alert.dismissed / alert.resolved: update alert list
  → resource.warning: show warning indicator on affected server tile
  ↓
[SSE Failure Handling]
  → EventSource auto-reconnects (retry: 3s)
  → If reconnection fails after 3 attempts:
    → Fall back to polling: monitor.dashboard every 60s (NFR-017)
    → Show "Live updates unavailable — refreshing periodically" indicator
  → On reconnect: full dashboard query to sync missed events
```

### 12.4 Alert Remediation Flow

```
[User] sees alert on dashboard → clicks alert for detail
  ↓
[tRPC] monitor.alerts.get → returns AlertExtended with context
  ↓
[tRPC] monitor.alerts.remediation → returns RemediationPlan
  ↓
[Browser] displays guided remediation steps:

For 'app-unavailable':
  Step 1: "Restart your app" → calls app.deployment.start
  Step 2: If restart fails → "Check your server dashboard for resource issues"

For 'disk-critical':
  Step 1: "View disk usage breakdown" → calls monitor.resourceAllocation
  Step 2: "Your largest app is {name} using {size}" → suggest cleanup or disk expansion
  Step 3: Links to VPS provider dashboard for storage upgrade

For 'cpu-critical' / 'ram-critical':
  Step 1: "View resource breakdown" → calls monitor.resourceAllocation
  Step 2: "Stop a low-priority app to free resources" → calls app.deployment.stop
  Step 3: "Upgrade your server" → links to VPS provider

For 'server-unreachable':
  Step 1: "Check your VPS provider dashboard" → external link
  Step 2: "The server may be powered off or unreachable"
  Step 3: "If the server is running, SSH may be blocked by a firewall"
  ↓
[User] takes action → alert condition clears → auto-resolved by process-metrics job
```

---

## 13. PI-2 Cross-Cutting Middleware Contracts

### 13.1 CSRF Middleware (BF-001 — AB#258)

Applied to all tRPC mutations. Implements double-submit cookie pattern.

```typescript
// src/server/trpc/middleware/csrf.ts
export const csrfMiddleware = t.middleware(async ({ ctx, type, next }) => {
  if (type !== 'mutation') return next();

  const cookieToken = ctx.req.cookies['__Host-csrf'];
  const headerToken = ctx.req.headers.get('x-csrf-token');

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'CSRF validation failed',
      cause: { code: ErrorCode.FORBIDDEN },
    });
  }

  return next();
});

// CSRF token generation — set on session creation/authentication
// Cookie: __Host-csrf=<token>; Path=/; Secure; SameSite=Strict; HttpOnly=false
//   (HttpOnly=false so client JS can read it and set x-csrf-token header)
// Token: 32 bytes, crypto.randomBytes(32).toString('hex')
// Rotated: on each authentication event (login, password reset)
```

### 13.2 Audit Middleware (BF-004 — AB#262)

Applied to all protected mutations. Logs action, target, outcome to `audit_log` table.

```typescript
// src/server/trpc/middleware/audit.ts
export const auditMiddleware = t.middleware(async ({ ctx, path, rawInput, type, next }) => {
  if (type !== 'mutation') return next();

  const startTime = Date.now();
  try {
    const result = await next();
    // Log successful mutation
    await db.insert(auditLog).values({
      action:     path,                    // e.g. 'app.deployment.create'
      tenantId:   ctx.tenantId,
      userId:     ctx.userId,
      targetType: extractTargetType(path), // 'deployment', 'server', 'alert', etc.
      targetId:   extractTargetId(rawInput),
      outcome:    'success',
      durationMs: Date.now() - startTime,
      ipAddress:  ctx.req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent:  ctx.req.headers.get('user-agent') ?? null,
    });
    return result;
  } catch (error) {
    // Log failed mutation
    await db.insert(auditLog).values({
      action:     path,
      tenantId:   ctx.tenantId,
      userId:     ctx.userId,
      targetType: extractTargetType(path),
      targetId:   extractTargetId(rawInput),
      outcome:    'failure',
      durationMs: Date.now() - startTime,
      ipAddress:  ctx.req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent:  ctx.req.headers.get('user-agent') ?? null,
    });
    throw error;
  }
});
```

### 13.3 Updated Middleware Chain (PI-2)

```typescript
// PI-2 middleware chain — extends PI-1 protectedProcedure
export const protectedProcedure = t.procedure
  .use(csrfMiddleware)     // BF-001: CSRF on all mutations
  .use(({ ctx, next }) => {
    // Session validation (PI-1 — unchanged)
    if (!ctx.session || !ctx.tenantId) {
      throw new TRPCError({ code: 'UNAUTHORIZED', cause: { code: ErrorCode.UNAUTHENTICATED } });
    }
    return next({ ctx: { ...ctx, tenantId: ctx.tenantId, userId: ctx.userId! } });
  })
  .use(auditMiddleware);   // BF-004: Audit all mutations
```

---

## 14. PI-2 Updated Router Summary

| Router | Queries | Mutations | Total | PI Status |
|--------|---------|-----------|-------|-----------|
| auth | 1 | 3 | 4 | PI-1 (unchanged) |
| server | 2 | 4 | 6 | PI-1 (unchanged) |
| app.catalog | 4 | 0 | 4 | **PI-2 new** (+2 from PI-1) |
| app.deployment | 4 | 4 | 8 | **PI-2 new** (+2 from PI-1) |
| monitor | 4 | 0 | 4 | **PI-2 new** |
| monitor.alerts | 3 | 2 | 5 | **PI-2 new** (+4 from PI-1) |
| domain | 1 | 2 | 3 | PI-1 (unchanged) |
| user | 2 | 1 | 3 | PI-1 (unchanged, auditLog implemented at PI-2) |
| **Total** | **21** | **16** | **37** | +8 procedures from PI-1 |

Plus 2 non-tRPC Route Handlers (unchanged): `POST /api/agent/metrics` and `GET /api/events`.
Plus 4 BullMQ job types: `deploy-app`, `process-metrics`, `send-alert`, `update-agent`.

---

## 15. PI-2 Test Environment Extensions

### 15.1 New Test Doubles (PI-2)

| Dependency | Strategy |
|-----------|---------|
| Catalog service | Fixture app templates loaded from `src/catalog/templates/__fixtures__/` — 3 test templates (small, medium, large resource requirements) |
| Deployment pipeline | Stub SSH commands per phase; assert correct command sequence and rollback on failure |
| Alert threshold evaluator | Inject fixture metrics snapshots; verify correct alert creation and deduplication |
| Email service (alerts) | `EMAIL_TRANSPORT=mock` — extend PI-1 mock to capture alert emails alongside auth emails |
| SSE event bus | In-memory event collector; assert correct events emitted per operation |
| Caddy Admin API | Stub HTTP client; assert route payloads match expected `@id` and `match.host` patterns |

### 15.2 Integration Test Scenarios (PI-2)

| Scenario | Procedures Exercised | Key Assertions |
|----------|---------------------|----------------|
| Full deployment lifecycle | `app.catalog.get` → `app.catalog.checkResourceFit` → `app.deployment.create` → verify job phases → `app.deployment.verify` | Deployment reaches `running`; access URL populated; audit log entries exist; SSE events emitted |
| Deployment failure + rollback | `app.deployment.create` with SSH failure injected at phase 2 | Deployment status = `failed`; container cleaned up; env file removed; Caddy route not orphaned |
| Multi-app coexistence | 3 × `app.deployment.create` on same server | All 3 containers on `unplughq` network; Caddy routes non-conflicting; resource allocation accurate |
| Alert lifecycle | Inject high-CPU metrics → verify alert created → `monitor.alerts.acknowledge` → inject normal metrics → verify auto-resolve | Alert transitions: active → acknowledged → resolved; email sent (if enabled); SSE events correct |
| Tier limit enforcement | Deploy beyond `free` tier limit (4th app) | `TIER_LIMIT_EXCEEDED` error; no deployment record created |
| CSRF protection | Send mutation without `x-csrf-token` header | `FORBIDDEN` error; mutation not executed |
| Tenant isolation | Query deployment from different tenant context | `NOT_FOUND` returned; no data leak |

---

## 16. PI-2 Requirement Traceability

| Procedure / Contract | Requirements | Stories | Threats Mitigated |
|---------------------|-------------|---------|-------------------|
| `app.catalog.list` | FR-F2-001, FR-F2-002, FR-F2-102 | AB#202 | — |
| `app.catalog.get` | FR-F2-003, FR-F2-103 | AB#202 | — |
| `app.catalog.categories` | FR-F2-001, FR-F2-102 | AB#202 | — |
| `app.catalog.checkResourceFit` | FR-F2-104 | AB#203, AB#206 | R16 |
| `app.deployment.create` | FR-F2-004, FR-F2-110, FR-F2-113 | AB#203, AB#204 | T-01, T-10, T-11, S-11, E-03 |
| `app.deployment.stop` | FR-F2-004 | AB#204 | NFR-006 |
| `app.deployment.start` | FR-F3-114 | AB#204, AB#209 | — |
| `app.deployment.remove` | FR-F2-118 | AB#206 | NFR-006 |
| `app.deployment.verify` | FR-F2-008, FR-F2-115, FR-F2-116, FR-F2-117 | AB#205 | — |
| `app.deployment.logs` | FR-F2-110, FR-F2-111 | AB#204 | — |
| `monitor.dashboard` | FR-F3-001, FR-F3-002, FR-F3-003, FR-F3-105 | AB#207 | — |
| `monitor.serverMetrics` | FR-F3-001, FR-F3-104 | AB#207 | — |
| `monitor.appStatus` | FR-F3-002 | AB#207 | — |
| `monitor.resourceAllocation` | FR-F2-119, FR-F3-005 | AB#206, AB#207 | R16 |
| `monitor.alerts.list` | FR-F3-110 | AB#208 | — |
| `monitor.alerts.get` | FR-F3-111 | AB#208 | — |
| `monitor.alerts.acknowledge` | FR-F3-007, FR-F3-112 | AB#208 | — |
| `monitor.alerts.dismiss` | FR-F3-007, FR-F3-112 | AB#208 | — |
| `monitor.alerts.remediation` | FR-F3-008, FR-F3-113, FR-F3-114, FR-F3-115, FR-F3-116 | AB#209 | — |
| `monitor.alerts.rules` | FR-F3-102 | AB#208 | — |
| `monitor.alerts.history` | FR-F3-110 | AB#209 | — |
| `deploy-app` BullMQ job | FR-F2-005, FR-F2-006, FR-F2-007, FR-F2-110, FR-F2-111, FR-F2-112, FR-F2-113 | AB#204 | T-01, T-10, T-11, T-12, T-13, S-11 |
| `process-metrics` BullMQ job | FR-F3-101, FR-F3-102, FR-F3-103, FR-F3-006 | AB#207, AB#208 | R15, R17 |
| `send-alert` BullMQ job | FR-F3-004, FR-F3-106, FR-F3-107, FR-F3-108, FR-F3-109 | AB#208 | S-12, R17 |
| CSRF middleware | BF-001 | AB#258 | T-06, T-14 |
| Audit middleware | BF-004 | AB#262 | R-01, R-02 |
| SSE extensions | FR-F3-104, NFR-017 | AB#207, AB#208 | S-10 |
| `DeploymentConfigInput` validation | FR-F2-113 | AB#203, AB#204 | T-01, T-10 |

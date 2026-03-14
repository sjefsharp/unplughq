---
artifact: api-contracts
produced-by: solution-designer
project-slug: unplughq
work-item: epic-001-unplughq-platform
work-item-type: epic
workflow-tier: full
phase: P1
version: 1.0.0
status: approved
azure-devops-id: 176
consumed-by:
  - product-owner
  - frontend-developer
  - backend-developer
  - database-administrator
  - testing
  - devops-engineer
date: 2026-03-13
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

---
artifact: solution-assessment
produced-by: system-architect
project-slug: unplughq
work-item: epic-001-unplughq-platform
work-item-type: epic
workflow-tier: full
phase: P1
version: 2.0.0
status: draft
azure-devops-id: 279
consumed-by:
  - security-analyst
  - solution-designer
  - ux-designer
  - tech-lead
  - frontend-developer
  - backend-developer
  - database-administrator
  - devops-engineer
  - testing
  - product-owner
date: 2026-03-16
review:
  reviewed-by:
  reviewed-date:
---

# Solution Assessment — PI-2

> **PI Continuation:** This is the PI-2 update to the solution assessment. PI-1 assessment is retained below as historical reference. PI-2 sections are prefixed accordingly.

## 1. Codebase Scan (PI-2)

| Location | Contents | Tech Stack | Architecture | Maturity | Relevance to PI-2 |
|----------|----------|------------|--------------|----------|--------------------|
| `unplughq/code/src/server/trpc/` | 6 tRPC routers (auth, server, app, monitor, domain, user) with typed contracts | tRPC v11, Zod | Bounded-context routers | Production (226 tests passing) | **Direct extension** — PI-2 adds sub-routers to app (catalog, deployment) and extends monitor (alerts, dashboard) |
| `unplughq/code/src/server/db/schema/` | Drizzle ORM schema: users, accounts, sessions, verification_tokens, servers, deployments, alerts, audit_log, metrics_snapshots | PostgreSQL 17, Drizzle 0.45 | Multi-tenant (tenant_id FK on all tables), enum-driven statuses | Production | **Direct extension** — PI-2 adds app_templates, deployment_logs, alert_rules tables; existing deployments/alerts/metrics tables already seeded |
| `unplughq/code/src/server/queue/` | BullMQ handlers (test-connection, provision-server), job schemas, Redis connection | BullMQ 5.40, ioredis | Job queue with Zod payload validation | Production | **Direct extension** — PI-2 adds deploy-app, process-metrics, send-alert job handlers |
| `unplughq/code/src/server/services/` | SSH service, auth service | ssh2 1.17, Auth.js v5 | Hexagonal ports/adapters | Production | **Direct extension** — PI-2 adds deployment service, catalog service, monitoring service, notification service |
| `unplughq/code/src/server/lib/` | Encryption, SSE event bus, logger, rate limiter, error handling | AES-256-GCM, pino, custom SSE | Cross-cutting infrastructure | Production | **Reuse** — SSE event bus extends with new event types; encryption reuses for API tokens |
| `unplughq/code/src/components/` | shadcn/ui components, auth forms, server wizards, dashboard layout | React 19, shadcn/ui, Tailwind CSS v4 | Component library + page compositions | Production | **Direct extension** — PI-2 adds catalog pages, deployment wizard, dashboard gauges, alert components |
| `unplughq/code/src/app/` | Next.js App Router routes: auth, dashboard, server setup, settings, onboarding | Next.js 15.3 (App Router) | SSR + Server Components + Server Actions | Production | **Direct extension** — PI-2 adds /catalog, /deploy, /alerts route groups |
| `unplughq/docs/` | 48+ artifacts spanning P0-P8 of PI-1, plus PI-2 P0 artifacts | Markdown, MkDocs | Documentation | Comprehensive | PI-2 requirements, risk register, objectives define scope |

**Scan verdict:** The codebase is a mature, functioning Next.js monolith with 226 passing tests, 6 tRPC routers, 9 database tables, BullMQ job infrastructure, SSH service layer, SSE event bus, and a complete Auth.js integration. All PI-2 capabilities map cleanly onto existing architectural seams. This is an **Extend** disposition.

---

## 2. Platform Classification (PI-2 — Unchanged)

**Classification: `web`**

No change from PI-1. PI-2 adds no new platform targets. The dashboard check-in use case (UJ4) reinforces PWA evaluation from PI-1.

---

## 3. Disposition Recommendation (PI-2)

**Disposition: Extend**

| Evidence | Detail |
|----------|--------|
| Existing codebase | 226 passing tests, 6 tRPC routers, 9 DB tables, BullMQ infrastructure, SSE event bus — all production quality |
| Architectural seams | tRPC router pattern supports adding sub-routers (app.catalog, app.deployment already stubbed); BullMQ supports new job types; Drizzle schema supports additive migrations |
| Domain model fit | PI-1 established the control plane / data plane separation, tenant isolation, SSH service abstraction, and deployment status enum — PI-2 features fill the pipeline stages these abstractions were designed for |
| Infrastructure reuse | Docker Compose, Caddy proxy, GitHub Actions CD, Vitest test suite — all extend without replacement |
| Risk reduction | Extending a proven codebase eliminates the greenfield risk from PI-1; team has proven velocity on this stack (47 SP) |

**Conclusion:** Extend is the only appropriate disposition. The PI-1 architecture was explicitly designed for multi-PI growth with bounded contexts, enum-driven state machines, and a modular service layer. PI-2 features map directly to the Application Lifecycle and Monitoring & Alerting bounded contexts defined in the architecture overview.

---

## 4. PI-2 New Component Analysis

PI-2 introduces five major new capabilities that extend the existing architecture. Each is analyzed for architectural fit, implementation approach, and risk.

### 4.1 App Template System

**Purpose:** Define self-hostable applications as declarative specifications that drive the catalog UI, configuration forms, deployment pipeline, and resource validation.

**Architectural fit:** The existing Drizzle schema already has a `deployments` table with `catalogAppId` FK and `config` text column. The `CatalogApp` Zod schema is defined in the API contracts. The template system extends these with a versioned, file-based catalog definition stored in the repository (`code/src/catalog/`) plus a DB table for runtime catalog state.

**Key decisions:**
- Templates stored as TypeScript files with `CatalogApp` schema validation (not YAML/JSON — see comparison matrix §5.1)
- `configSchema` array drives dynamic form generation at runtime
- Image references use `sha256:` digest pinning (NFR-018)
- Templates extensible without per-app code (R13 mitigation)

**New components:**
- `src/catalog/` — Versioned app template definitions (15+ apps)
- `src/server/services/catalog/` — Catalog service: template loading, validation, search/filter
- `app_templates` DB table for runtime catalog metadata and versioning

### 4.2 Deployment Orchestrator

**Purpose:** Execute multi-step application deployments on remote servers via SSH as an idempotent BullMQ job pipeline with per-step rollback.

**Architectural fit:** BullMQ infrastructure (queue, Redis connection, job schemas, handlers) is production-proven from PI-1's test-connection and provision-server jobs. The SSH service layer provides connection management and command execution. The deployment orchestrator adds a new job type that follows the same patterns.

**Key decisions:**
- Deployment as a BullMQ job with `DeploymentStatus` state machine: `pending → pulling → configuring → provisioning-ssl → starting → running | failed`
- Each phase has explicit rollback: container cleanup, env file removal, Caddy route removal
- Environment files written via SFTP (not inline SSH args) per FR-F2-113
- SSE progress events pushed via existing `sseEventBus`

**New components:**
- `src/server/queue/handlers/deploy-app.ts` — Deployment job handler
- `src/server/services/deployment/` — Deployment service: state machine, rollback, progress
- `src/server/services/caddy/` — Caddy Admin API client for route management
- `deployment_logs` DB table for per-phase audit trail

### 4.3 Health Monitoring Agent Extension

**Purpose:** Extend the PI-1 monitoring agent to report per-container health status and disk usage, enabling per-app health tiles on the dashboard.

**Architectural fit:** The metrics ingest endpoint (`POST /api/agent/metrics`) and `MetricsSnapshot` Zod schema already support a `containers` array with `id`, `name`, `status`, and optional `diskUsageBytes`. The `metrics_snapshots` table stores this as JSONB. PI-2 extends the agent to populate this field and the control plane to display it.

**Key decisions:**
- Agent reports every 30 seconds (unchanged from PI-1 design)
- Per-container metrics: status, disk usage, uptime
- Stale data threshold: >120 seconds with no push → "Data stale" indicator
- Agent runs read-only Docker socket + read-only system metrics (R21 mitigation)

**No new control plane tables required** — `metrics_snapshots.containers` JSONB column already supports this.

### 4.4 Alert Pipeline

**Purpose:** Evaluate incoming metrics against configurable thresholds, generate alerts, dispatch email notifications, and provide guided remediation.

**Architectural fit:** The `alerts` table, `AlertSeverity`/`AlertType` enums, and `Alert` Zod schema already exist in the PI-1 schema. The monitor tRPC router has `monitor.alerts.list` and `monitor.alerts.dismiss` procedures defined. PI-2 implements the threshold evaluation engine and email dispatch pipeline.

**Key decisions:**
- Threshold evaluation runs as a scheduled BullMQ repeatable job (every 60 seconds)
- Default thresholds: CPU >90% for 5 min sustained, RAM >90%, disk >85%, app-unavailable >60s
- Alert deduplication: no duplicate alert for the same server+type while an existing alert is active
- Email dispatch via BullMQ dead-letter queue with 3 retries (NFR-020)
- Shared email service abstraction extending PI-1's password reset email

**New components:**
- `src/server/queue/handlers/process-metrics.ts` — Threshold evaluation job
- `src/server/queue/handlers/send-alert.ts` — Alert email dispatch job
- `src/server/services/notification/` — Unified email service (auth + alerts)
- `alert_rules` DB table for configurable thresholds (PI-2: fixed defaults, PI-3: per-server customization)

### 4.5 Real-Time Dashboard Updates

**Purpose:** Push live server metrics, app status changes, and alert events to the browser dashboard via Server-Sent Events.

**Architectural fit:** The SSE infrastructure (`sseEventBus`, `GET /api/events` route handler) is production-proven from PI-1's server status events. The SSE event schema already defines `metrics.update`, `alert.created`, `alert.dismissed`, and `deployment.progress` event types per API contracts §3.3.

**Key decisions:**
- SSE (not WebSocket) for real-time updates — see comparison matrix §5.2
- Heartbeat every 30 seconds to keep connections alive across proxies
- Graceful degradation to polling (`monitor.dashboard` query every 60s) if SSE fails
- All events tenant-scoped via existing `sseEventBus.emitToTenant()`

**No new infrastructure required** — extends existing SSE event bus with new event payloads.

### 4.6 Deferred Bug Architectural Impact

| Bug | AB# | Architectural Impact | Scope of Change |
|-----|-----|---------------------|-----------------|
| CSRF token validation | AB#258 | Add CSRF middleware to tRPC mutation pipeline. Auth.js provides built-in CSRF tokens for its own routes; tRPC mutations need a custom middleware that validates a double-submit cookie pattern. | New tRPC middleware (`src/server/trpc/middleware/csrf.ts`); applied to all mutation procedures |
| Input sanitization | AB#259 | Harden `ServerConnectInput` Zod schema with regex allowlists for shell metacharacters. Extend pattern to all PI-2 schemas accepting user strings that reach SSH commands. | Schema updates in `src/lib/schemas/server.ts`; new shared sanitization util; applied to deployment config values |
| Secrets rotation | AB#260 | Add key rotation endpoint and migration logic. SSH keys re-encrypted with new tenant-derived key; API tokens regenerated. Requires concurrent validity window during rotation. | New `server.rotateCredentials` tRPC mutation; encryption service extension; audit log entry |
| Audit logging | AB#262 | Add audit log middleware to tRPC context. All destructive mutations log to `audit_log` table. PI-2 operations (deploy, stop, start, remove) must include audit calls from implementation. | New tRPC middleware (`src/server/trpc/middleware/audit.ts`); wired into context for all protected mutations |
| Focus management | AB#251 | Add `useEffect` hook on App Router navigation to move focus to `<main>`. Requires a layout-level focus management component. | `src/components/focus-manager.tsx` in root layout |

**Sequencing recommendation:** BF-001 (CSRF) and BF-004 (audit) create middleware that PI-2 code will exercise immediately. Resolve these in Week 1 P4 before any F2/F3 code, per R19 mitigation and BR-BF-001.

---

## 5. PI-2 Technology Comparison Matrices

Three key PI-2 decisions require technology evaluation. The existing stack (Next.js, tRPC, Drizzle, BullMQ) remains — these matrices evaluate choices within that stack.

### 5.1 App Template Format

How to define the 15+ application templates that constitute the catalog.

| Criterion (Weight) | TypeScript Objects | YAML Files | JSON Schema |
|--------------------|-------------------|------------|-------------|
| **Type safety (30%)** | **10 — 3.0** Native TS types; Zod validation at import; IDE autocomplete and refactoring | 5 — 1.5 No type safety at authoring time; validated only at runtime load | 6 — 1.8 JSON Schema provides validation but no IDE type inference without codegen |
| **Extensibility (25%)** | **9 — 2.25** Can use TS features (computed values, conditional configs, template composition) without a custom DSL | 7 — 1.75 Extensible but limited to YAML anchors; complex conditionals require custom tags | 7 — 1.75 Extensible via `$ref` and composition but verbose for complex config schemas |
| **Developer experience (20%)** | **9 — 1.8** Full IDE support; errors at compile time; import/export; easy testing | 7 — 1.4 Readable but no compile-time validation; YAML parsing quirks (boolean coercion, indentation) | 5 — 1.0 Verbose; poor human readability for complex schemas; tooling dependency |
| **Catalog contribution ease (15%)** | 7 — 1.05 Contributors need TypeScript knowledge; templates follow a clear pattern but require TS familiarity | **8 — 1.2** YAML is widely known; lower barrier for community contributions | 6 — 0.9 JSON Schema is niche; high barrier for non-developers |
| **Runtime performance (10%)** | **9 — 0.9** Pre-compiled; zero parse overhead at runtime | 6 — 0.6 Parse on load; caching required | 7 — 0.7 Parse + validation overhead |
| **Total** | **9.0** | **6.45** | **6.15** |

**Decision: TypeScript objects with `CatalogApp` Zod validation.**

Templates are authored as `.ts` files in `src/catalog/templates/` exporting typed objects. Zod validates at build time and at runtime load. This ensures type safety end-to-end (Drizzle schema → Zod contract → template → UI), catches errors at compile time, and enables computed defaults and template composition (e.g., shared volume mount patterns for database-backed apps). The contribution barrier is acceptable given the curated catalog model — community contributions go through PR review regardless.

### 5.2 Real-Time Dashboard Updates

How to push live metrics, alerts, and deployment progress to the browser.

| Criterion (Weight) | SSE (Server-Sent Events) | WebSocket | Polling |
|--------------------|--------------------------|-----------|---------|
| **Simplicity (30%)** | **9 — 2.7** HTTP-based; works with existing Next.js Route Handlers; no protocol upgrade; auto-reconnect built into `EventSource` API | 6 — 1.8 Requires protocol upgrade; state management for bidirectional connection; needs ws library or Socket.IO | **9 — 2.7** Simplest to implement via existing tRPC queries |
| **Real-time fidelity (25%)** | **8 — 2.0** Sub-second push delivery; ideal for server→client data flow (metrics, alerts) | **9 — 2.25** Full duplex; lowest latency | 4 — 1.0 60-second intervals; stale data between polls |
| **Proxy/CDN compatibility (20%)** | **8 — 1.6** Well-supported by Cloudflare, Caddy, Nginx; keepalive via heartbeats | 6 — 1.2 WebSocket support varies across CDN tiers; some require explicit configuration | **9 — 1.8** Standard HTTP; universal compatibility |
| **Scalability (15%)** | 7 — 1.05 One long-lived connection per client; scales to thousands with connection pooling; stateless fallback to polling | 7 — 1.05 One connection per client; slightly higher server memory per connection | **8 — 1.2** Stateless; scales trivially but higher aggregate load |
| **Existing infrastructure (10%)** | **10 — 1.0** `sseEventBus` already implemented and tested in PI-1; SSE route handler exists | 3 — 0.3 Would require new WebSocket server, connection management, auth integration | **8 — 0.8** tRPC queries exist; just add timer |
| **Total** | **8.35** | **6.60** | **7.50** |

**Decision: SSE with polling fallback.**

SSE is already implemented and production-proven in PI-1 (`sseEventBus`, `GET /api/events`). It provides sub-second push delivery for the unidirectional data flow (server→client metrics, alerts, deployment progress) that PI-2 requires. WebSocket's bidirectional capability is unnecessary — the dashboard is a read-heavy consumer. Polling serves as a graceful degradation path per FR-F3-104.

### 5.3 Container Orchestration Approach

How the control plane executes Docker operations on remote user servers.

| Criterion (Weight) | SSH Exec (Direct) | SSH + Agent Service | Docker Remote API (TCP) |
|--------------------|-------------------|---------------------|------------------------|
| **Security (35%)** | **8 — 2.8** Commands routed through ssh2 with parameterized templates; no new attack surface; validated Zod inputs | 7 — 2.45 Agent runs on VPS; needs update mechanism; adds code execution surface on user's server | 3 — 1.05 Exposing Docker TCP socket is a critical security risk (container escape = root); TLS client certs add complexity |
| **Reliability (25%)** | 7 — 1.75 SSH sessions can timeout; need retry + resume-from-failure; network interruptions require idempotent design | **8 — 2.0** Agent buffers operations locally; more resilient to network interruption; can queue and confirm | 6 — 1.5 TCP connection drops require reconnection; no built-in session state |
| **Simplicity (20%)** | **9 — 1.8** Reuses PI-1 SSH service; no new infrastructure; parameterized command templates per API contracts §3.1 | 5 — 1.0 Requires agent distribution, versioning, update rollout, restart management; doubles code surface | 6 — 1.2 Simple API calls but complex TLS cert distribution to each user's VPS |
| **Existing infrastructure (10%)** | **10 — 1.0** ssh2 service, BullMQ handlers, encryption — all production-proven | 4 — 0.4 Agent code exists for monitoring but not for command execution; significant new code | 2 — 0.2 No Docker TCP infrastructure exists; would require provisioning changes |
| **Auditability (10%)** | **8 — 0.8** Each SSH command logged with input/output; maps to audit trail | 7 — 0.7 Agent logs locally; needs log shipping to control plane | 6 — 0.6 API calls logged but harder to correlate with deployment steps |
| **Total** | **8.15** | **6.55** | **4.55** |

**Decision: SSH exec with parameterized command templates (extend PI-1 pattern).**

The SSH exec approach extends the production-proven PI-1 infrastructure directly. Parameterized command templates (API contracts §3.1) prevent injection, Zod validates all inputs before SSH execution, and BullMQ provides retry/resume for reliability. The deployment state machine (FR-F2-110) handles SSH session failures with per-step rollback. An agent-based approach would add significant complexity for marginal reliability gain; Docker TCP is rejected on security grounds.

---

## 6. PI-2 Technology Recommendations

PI-2 adds **zero new runtime dependencies to the core stack**. All new capabilities build on the existing toolchain:

| Component | Existing Tech | PI-2 Extension | New Dependencies |
|-----------|--------------|----------------|------------------|
| App templates | Zod schemas | TypeScript template files with `CatalogApp` Zod validation | None |
| Deployment orchestration | BullMQ + ssh2 | New `deploy-app` job handler; SFTP file writes via ssh2 | None |
| Caddy route management | SSH exec | Caddy Admin API calls tunneled via SSH | None |
| Real-time updates | SSE event bus | New event types (metrics.update, alert.created, deployment.progress) | None |
| Alert email dispatch | (PI-1: password reset email) | Shared email service abstraction; alert email templates | None — extends existing transactional email integration |
| Health monitoring | Metrics ingest endpoint | Threshold evaluation job; alert pipeline | None |
| CSRF protection | Auth.js (partial) | Custom double-submit cookie middleware for tRPC mutations | None |
| Audit logging | `audit_log` table (exists) | tRPC audit middleware; automatic logging on mutations | None |

### New Database Tables (Additive — No PI-1 Table Modifications)

Per R23 mitigation, PI-2 schema changes are exclusively additive new tables. Existing PI-1 tables are not modified unless required for bug fixes.

| Table | Purpose | Key Columns | Risk |
|-------|---------|-------------|------|
| `app_templates` | Catalog template metadata, versions, active status | `id`, `slug`, `name`, `category`, `version`, `min_cpu_cores`, `min_ram_gb`, `min_disk_gb`, `image_digest`, `config_schema` (JSONB), `upstream_url`, `is_active`, `created_at`, `updated_at` | R13 — schema must be extensible for 15+ diverse apps |
| `deployment_logs` | Per-phase audit trail for deployment state machine | `id`, `deployment_id` (FK), `phase`, `status`, `message`, `started_at`, `completed_at` | R14 — enables resume-from-failure |
| `alert_rules` | Configurable alert thresholds per server | `id`, `server_id` (FK), `metric`, `operator`, `threshold`, `duration_seconds`, `severity`, `is_active` | R17 — PI-2 uses fixed defaults; table enables PI-3 customisation |

**Existing PI-1 tables used by PI-2 without modification:**
- `deployments` — Already has `status`, `catalog_app_id`, `domain`, `container_name`, `config`
- `alerts` — Already has `severity`, `type`, `message`, `notification_sent`, `acknowledged_at`
- `metrics_snapshots` — Already has `containers` JSONB with per-container status
- `audit_log` — Already has full audit schema; PI-2 adds more event types

### New tRPC Router Extensions

| Router | New Procedures | Purpose |
|--------|---------------|---------|
| `app.catalog` | `list`, `get` | Browse/search catalog, get template details with `configSchema` |
| `app.deployment` | `create`, `stop`, `start`, `remove`, `list`, `get` | Full deployment lifecycle management |
| `monitor` | `dashboard`, `serverMetrics`, `appStatus` | Dashboard aggregate data, time-series, per-app health |
| `monitor.alerts` | `list`, `dismiss` | Alert management |
| `user` | `auditLog`, `exportConfig` | Audit log pagination, Docker Compose export |

All procedures were already specified in PI-1 API contracts. PI-2 implements them.

### External Skills Recommendation

The following skills from the skills.sh ecosystem may enhance PI-2 development:

| Skill | Relevance | Agent |
|-------|-----------|-------|
| `docker-compose` | Validate generated Docker Compose export files (NFR-005, UJ5) | Testing, Backend |
| `playwright-test` | Accelerate Playwright E2E setup (R24 mitigation) | Testing |
| `drizzle-orm` | Current Drizzle ORM API docs for schema extensions and migration patterns | DBA, Backend |
| `nextjs` | Current Next.js 15 App Router docs for SSE, Server Components, Route Handlers | Frontend, Backend |

The Tech Lead should evaluate availability via `search-skills.mjs` at P4 setup.

---

## 7. PI-2 Architecture Fit Summary

| PI-2 Capability | Existing Seam | Extension Type | Risk Level |
|-----------------|---------------|----------------|------------|
| App catalog browsing | tRPC `app` router, Zod `CatalogApp` schema | New sub-router + service | Low |
| Guided configuration | React Hook Form + shadcn/ui | Dynamic form from `configSchema` | Low |
| Deployment orchestration | BullMQ + ssh2 + `deployments` table | New job handler + state machine service | **High** (R14) |
| Post-deploy verification | SSH exec + HTTP health check | Extension of deployment job handler | Medium |
| Multi-app coexistence | Docker network + Caddy routes | Caddy Admin API service | Medium (R18) |
| Dashboard resource gauges | SSE event bus + `metrics_snapshots` | New React components, SSE event consumers | Low |
| Per-app health tiles | `deployments` table + SSE | New dashboard components | Low |
| Alert threshold engine | `alerts` table + BullMQ | New repeatable job + threshold evaluation | Medium (R17) |
| Alert email notifications | Email service (password reset) | Shared email abstraction + alert templates | Low |
| Guided remediation | tRPC mutations (`app.deployment.start`) | New UI components + existing mutations | Low |
| CSRF middleware | tRPC middleware pipeline | New middleware | Low |
| Audit logging | `audit_log` table + tRPC context | New middleware | Low |
| Secrets rotation | Encryption service + server settings | New mutation + rotation logic | Medium |
| Focus management | App Router layout | Layout-level focus hook | Low |

---

## PI-1 Solution Assessment — Historical Reference

> The following PI-1 assessment is retained for continuity. Sections are collapsed under this heading.

### PI-1 Disposition: New Build (Historical)

PI-1 was a greenfield project. The `code/` directory was empty at PI-1 P1. The "New Build" disposition was correct and resulted in the codebase described in §1 above.

### PI-1 Technology Comparison Matrix (Historical)

### Approach 1 — Simplest Viable: Express.js + htmx + SQLite

A server-rendered application using Express.js for routing and API, htmx for interactive UI updates without a JavaScript framework, Alpine.js for client-side state, and SQLite for persistence.

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 22 LTS |
| HTTP framework | Express.js | 5.x |
| UI interactivity | htmx + Alpine.js | htmx 2.x, Alpine 3.x |
| Templating | EJS or Handlebars | — |
| Database | SQLite via better-sqlite3 | — |
| Auth | Custom (express-session + bcrypt) | — |
| SSH | ssh2 | 1.17.x |
| Job queue | BullMQ + Redis | 5.71.x |

| Criterion | Score (1–10) | Weighted | Rationale |
|-----------|-------------|----------|-----------|
| Functional requirements | 6 | 1.80 | htmx handles basic interactivity but struggles with complex real-time dashboard updates, multi-step wizard state management, and rich data visualization. No component model for reusable UI. |
| Development velocity | 7 | 1.40 | Fast initial start with minimal tooling. Slows down as UI complexity grows — no component abstractions, manual DOM management for charts and real-time updates. |
| Maintainability | 4 | 0.60 | No type-safe templates, no component model, template string coupling. Refactoring confidence is low as codebase grows across PI-2+. |
| Scalability | 5 | 0.75 | SQLite is single-writer — bottleneck for concurrent multi-tenant SaaS. Migration to PostgreSQL would require significant rework. |
| Deployment simplicity | 9 | 0.90 | Single process, no build step for frontend, minimal infrastructure (SQLite = no external database). |
| Ecosystem maturity | 6 | 0.60 | Express is mature but htmx ecosystem for complex SaaS dashboards is limited. Few production references for htmx at this application complexity. |
| **Total** | | **6.05** | |

### Approach 2 — Modern Full-Stack: Next.js + PostgreSQL + Drizzle ORM

A full-stack TypeScript application using Next.js (App Router with Server Components and Server Actions) for both the web UI and API layer, PostgreSQL for persistence, Drizzle ORM for type-safe database access, and shadcn/ui with Tailwind CSS for the component library.

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 22 LTS |
| Framework | Next.js (App Router) | 16.x |
| Language | TypeScript | 5.9.x |
| UI components | shadcn/ui + Radix UI + Tailwind CSS | Tailwind 4.x |
| Database | PostgreSQL | 17 |
| ORM | Drizzle ORM | 0.45.x |
| Auth | Auth.js (NextAuth.js v5) | 5.x |
| SSH | ssh2 | 1.17.x |
| Job queue | BullMQ + Redis/Valkey | 5.71.x |
| Validation | Zod | 3.x |
| Icons | Lucide React | latest |

| Criterion | Score (1–10) | Weighted | Rationale |
|-----------|-------------|----------|-----------|
| Functional requirements | 9 | 2.70 | Server Components for fast-loading dashboard views. Server Actions for wizard form handling. React ecosystem provides rich charting (recharts), data visualization, and real-time update patterns (SSE/streaming). Full TypeScript stack enables type-safe SSH operation contracts. shadcn/ui provides accessible, customizable components for the dashboard and form wizards. |
| Development velocity | 8 | 1.60 | Single codebase (frontend + API in one repo). shadcn/ui provides pre-built, accessible form components. Server Actions reduce API boilerplate for wizard flows. Drizzle ORM generates type-safe queries without a code-gen step. Auth.js handles identity flows (F4) out of the box. |
| Maintainability | 9 | 1.35 | Full TypeScript from database schema to UI. Component model with clear server/client boundaries. Drizzle's SQL-first approach keeps queries explicit and reviewable. Zod validation at API boundaries. |
| Scalability | 8 | 1.20 | PostgreSQL handles multi-tenant workloads at scale. BullMQ + Redis provides reliable background job processing for concurrent provisioning operations. Next.js supports horizontal scaling behind a load balancer. |
| Deployment simplicity | 7 | 0.70 | Requires Node.js runtime, PostgreSQL, and Redis. Containerizes cleanly with Docker Compose or Kubernetes. More infrastructure than Approach 1 but standard for production SaaS. |
| Ecosystem maturity | 9 | 0.90 | React is the most widely adopted UI framework. Next.js is production-proven at massive scale. Auth.js, Drizzle, BullMQ, ssh2 are all actively maintained with strong communities. Largest hiring pool of any frontend ecosystem. |
| **Total** | | **8.45** | |

### Approach 3 — Full-Stack SvelteKit + PostgreSQL + Drizzle ORM

A full-stack TypeScript application using SvelteKit for server-rendered UI with progressive enhancement, PostgreSQL for persistence, and Drizzle ORM for type-safe database access.

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 22 LTS |
| Framework | SvelteKit | 2.x |
| Language | TypeScript | 5.9.x |
| UI components | Skeleton UI + Tailwind CSS | Tailwind 4.x |
| Database | PostgreSQL | 17 |
| ORM | Drizzle ORM | 0.45.x |
| Auth | Lucia Auth or SvelteKit Auth | — |
| SSH | ssh2 | 1.17.x |
| Job queue | BullMQ + Redis/Valkey | 5.71.x |
| Validation | Zod | 3.x |

| Criterion | Score (1–10) | Weighted | Rationale |
|-----------|-------------|----------|-----------|
| Functional requirements | 8 | 2.40 | SvelteKit handles SSR, form actions (excellent for wizards), and streaming. Smaller client bundles benefit global audience with variable bandwidth (NFR-014). However, charting/data visualization library ecosystem is narrower than React's — fewer production-ready options for the dashboard. |
| Development velocity | 8 | 1.60 | Less boilerplate than React. Built-in form actions align perfectly with multi-step wizard flows. Svelte's reactivity model is simpler. However, fewer pre-built component libraries means more custom UI work for the dashboard. |
| Maintainability | 8 | 1.20 | TypeScript support is strong. Svelte's compiler-first approach produces clean output. Component model is clean. Slightly less tooling for large-scale refactoring compared to React ecosystem. |
| Scalability | 8 | 1.20 | Same backend story as Approach 2 (PostgreSQL + BullMQ). SvelteKit's Node adapter scales horizontally. |
| Deployment simplicity | 8 | 0.80 | Same infrastructure requirements as Approach 2. SvelteKit's Node adapter produces a standard Node.js server. Slightly simpler build output than Next.js. |
| Ecosystem maturity | 6 | 0.60 | Svelte is growing rapidly but has a materially smaller ecosystem than React. Fewer dashboard component libraries, fewer auth solutions, smaller hiring pool. Lucia Auth is excellent but newer and smaller community than Auth.js. |
| **Total** | | **7.80** | |

### Comparison Summary

| Criterion (Weight) | Approach 1: Express+htmx+SQLite | Approach 2: Next.js+PG+Drizzle | Approach 3: SvelteKit+PG+Drizzle |
|--------------------|---------------------------------|-------------------------------|----------------------------------|
| Functional requirements (30%) | 1.80 | **2.70** | 2.40 |
| Development velocity (20%) | 1.40 | **1.60** | **1.60** |
| Maintainability (15%) | 0.60 | **1.35** | 1.20 |
| Scalability (15%) | 0.75 | **1.20** | **1.20** |
| Deployment simplicity (10%) | **0.90** | 0.70 | 0.80 |
| Ecosystem maturity (10%) | 0.60 | **0.90** | 0.60 |
| **Weighted Total** | **6.05** | **8.45** | **7.80** |

---

### PI-1 Recommendation (Historical)

**Chosen approach: Approach 2 — Next.js + PostgreSQL + Drizzle ORM** (score 8.45/10)

Validated by PI-1 delivery: 226 tests passing, 47 SP delivered, 9/9 gates PASS. The technology selection proved correct across all scoring dimensions — functional coverage, velocity, maintainability, and ecosystem maturity.

### PI-1 Alternatives Considered (Historical)

- **Approach 1 (Express + htmx + SQLite):** Scored lowest (6.05). The simplicity advantage is real for deployment but the lack of a component model makes the complex dashboard UI, multi-step wizards, and real-time monitoring requirements impractical to deliver and maintain. SQLite's single-writer limitation is a hard blocker for multi-tenant SaaS growth.

- **Approach 3 (SvelteKit):** Strong contender (7.80) with excellent developer experience and smaller bundle sizes. Rejected primarily due to ecosystem gap: the dashboard's data visualization requirements demand charting and component libraries that React provides at higher maturity. Svelte's smaller hiring pool and auth ecosystem are secondary concerns but relevant for long-term maintainability. If bundle size became a critical constraint, SvelteKit would be the recommended alternative.

### Risk alignment

| Risk | How this stack addresses it |
|------|-----------------------------|
| R1 (SSH inconsistency) | ssh2 library is the most mature Node.js SSH client (1.17.x, actively maintained). TypeScript contracts enforce consistent connection handling. |
| R2 (Provisioning drift) | Drizzle schema + BullMQ job queue enable idempotent, auditable provisioning workflows with typed state machines. |
| R5 (Security attack surface) | Auth.js implements OWASP-aligned patterns. PostgreSQL's row-level security and Drizzle's parameterized queries prevent injection. SSH key encryption at rest via Node.js crypto. |
| R6 (Data sovereignty) | Architecture enforces control plane / data plane separation. PostgreSQL stores only metadata — the architecture overview documents the data boundary explicitly. |
| R8 (ART handoff) | TypeScript end-to-end reduces ambiguity in handoffs between agents. Zod schemas serve as executable contracts between BA requirements and implementation. |

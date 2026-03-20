---
artifact: delegation-briefs-p4
produced-by: product-owner
project-slug: unplughq
work-item: epic-001-unplughq-platform
work-item-type: epic
workflow-tier: full
phase: P3
version: 2.0.0
status: draft
azure-devops-id: 285
consumed-by:
  - tech-lead
  - frontend-developer
  - backend-developer
  - database-administrator
  - devops-engineer
  - testing
date: 2026-03-16
---

# Delegation Briefs — Phase 4 (Implementation) — PI-2 Sprint 2

## P4 Execution Overview

Phase 4 follows: `TEST → TL → FE ∥ BE ∥ DBA ∥ DevOps → TL`

1. **Testing** writes test contracts (P4 Step 1) — before any code
2. **Tech Lead** creates worktrees for parallel agent execution (P4 Step 2 start)
3. **FE, BE, DBA, DevOps** implement in parallel (P4 Step 2)
4. **Tech Lead** merges sub-branches (P4 Step 2 end)

### Branch Context

- **Feature branch:** `feat/pi-2-sprint-2`
- **Story branches (created by PO):**
  - `story/story-202-app-catalog`
  - `story/story-203-app-configuration`
  - `story/story-204-app-deployment`
  - `story/story-205-post-deployment`
  - `story/story-206-multi-app`
  - `story/story-207-dashboard-overview`
  - `story/story-208-health-alerts`
  - `story/story-209-alert-remediation`
- **Bug fixes:** Committed directly on `feat/pi-2-sprint-2`
- **Worktrees:** Created by Tech Lead at P4 Step 2 start

### Sprint 2 Scope

| AB# | Story/Bug | SP | Track |
|-----|-------|----|-------|
| 202 | Application Catalog Browsing | 5 | Catalog (F2) |
| 203 | Guided App Configuration | 5 | Catalog (F2) |
| 204 | Application Deployment with Progress | 13 | Catalog (F2) |
| 205 | Post-Deployment Verification | 5 | Catalog (F2) |
| 206 | Multi-App Coexistence | 5 | Catalog (F2) |
| 207 | Dashboard Overview | 8 | Dashboard (F3) |
| 208 | Health Alert Notifications | 8 | Dashboard (F3) |
| 209 | Alert Management & Guided Remediation | 5 | Dashboard (F3) |
| 258 | Missing CSRF Double-Submit Cookie | 5 | Bug (SEC) |
| 259 | Insufficient Audit Logging | 3 | Bug (SEC) |
| 260 | Secrets Rotation Mechanism | 3 | Bug (SEC) |
| 262 | Broken Sudoers Ownership | 3 | Bug (DevOps) |
| 251 | Focus Management on Dynamic Content | 3 | Bug (A11Y) |

### Bug-First Sequencing (BR-BF-001)

Security bugs (AB#258, AB#259, AB#260, AB#262) and a11y bug (AB#251) are Week 1 priority. They MUST be resolved before any new F2/F3 code that exercises affected paths (mutation endpoints, SSH operations, route transitions).

---

## Brief: Testing Agent (P4 Step 1)

### Objective

Write test contracts for all 8 Sprint 2 stories and 5 deferred PI-1 bugs before any implementation code. Tests define the behavioral contract that code agents must satisfy. **Test contracts must contain executable assertions** — no `expect(true).toBe(true)` or empty bodies.

### Artifact Inputs

| Artifact | Path | Key Data |
|----------|------|----------|
| Product Backlog | `docs/product-backlog.md` | Gherkin AC for Sprint 2 stories (S-202–S-209) + bugs (B-251, B-258–260, B-262) |
| API Contracts | `docs/api-contracts.md` | tRPC procedure signatures (§1.3 app, §1.4 monitor, §1.5 domain, §1.6 user), Zod schemas (§2.3, §2.4), SSE events (§3.3) |
| Architecture Overview | `docs/architecture-overview.md` | Runtime scenarios, BullMQ job patterns, SSE architecture |
| Threat Model | `docs/threat-model.md` | Security test scenarios, CSRF (S-04/S-06), audit logging (R-01), secrets rotation |
| WCAG Audit | `docs/wcag-audit.md` | A11Y test targets for Sprint 2 screens |
| Accessibility Guidelines | `docs/accessibility-guidelines.md` | ARIA patterns, keyboard interaction specs for catalog/dashboard |
| Requirements | `docs/requirements.md` | FR-F2-101 through FR-F2-122, FR-F3-101 through FR-F3-116, BF-001 through BF-005 |

### Expected Outputs

1. **Unit test contracts** — Vitest test files for:
   - **Catalog service** — `CatalogApp` schema validation, category filtering, search matching, catalog entry completeness (≥15 apps)
   - **Deployment service** — Deploy state machine transitions (pending→pulling→configuring→provisioning-ssl→starting→running/failed), cleanup on failure, idempotent retry, environment file creation, container name validation
   - **Health check service** — HTTP health check with retry/backoff, timeout handling, success/failure state transitions
   - **Alert evaluation** — Threshold breach detection (CPU >90%, RAM >90%, disk >85%), stale data detection (>120s), alert creation, alert dismissal with re-trigger prevention
   - **Email notification** — Alert email content assembly, delivery tracking, retry via DLQ, notification suppression when disabled
   - **CSRF middleware** — Token generation per session, validation on mutations, 403 on mismatch, token not in URL (BF-001)
   - **Audit logging** — Log entry creation for all privileged operations, 90-day retention query, audit log query pagination (BF-004)
   - **Secrets rotation** — Key rotation without server disconnection, old key invalidation, rotation audit logging (BF-003)
   - **Caddy route management** — Route add/remove without disrupting existing routes, `@id` matching
   - **Zod schema validation** — All new schemas: `CatalogApp`, `DeployAppInput`, `DeployedApp`, `MetricsSnapshot` strict parse, `Alert`, `DashboardOutput`
   - **Tenant isolation** — Every protected query includes `tenantId` (I-07) for new F2/F3 procedures

2. **Integration test contracts** — Vitest test files for:
   - **tRPC app router** — `app.catalog.list`, `app.catalog.get`, `app.deployment.create/list/get/stop/start/remove`
   - **tRPC monitor router** — `monitor.dashboard`, `monitor.alerts.list`, `monitor.alerts.dismiss`
   - **tRPC domain router** — `domain.list`, `domain.bind`, `domain.unbind`
   - **tRPC user router** — `user.auditLog`, `user.exportConfig`
   - **BullMQ deploy-app job lifecycle** — enqueue → process phases → success/failure → cleanup
   - **Alert pipeline** — metrics ingestion → threshold evaluation → alert creation → email dispatch
   - **SSE event delivery** — `deployment.progress`, `metrics.update`, `alert.created`, `alert.dismissed` events

3. **E2E test contracts** — Playwright test files for:
   - **UJ1 completion**: Login → Browse Catalog → Select App → Configure → Deploy → See Running App on Dashboard
   - **UJ2**: Login → Add Second App → Verify first app not disrupted
   - **UJ4**: Login → Dashboard → See Alert → Acknowledge → Guided Remediation
   - **Catalog browsing**: category filter, search, detail page, empty state
   - **Configuration wizard**: form generation from schema, defaults, validation, summary, edit-back
   - **Deployment progress**: real-time SSE updates, background navigation, completion
   - **Dashboard overview**: resource gauges, app tiles, status badges, access links, empty state
   - **Alert UI**: alert list, detail expansion, acknowledge, dismiss, re-trigger prevention
   - **Guided remediation**: disk breakdown, restart action, CPU/RAM suggestions
   - **Bug regression**: CSRF on all mutations, focus management on route transitions, audit log view
   - **A11Y keyboard navigation** for all Sprint 2 screens (catalog, config, deploy, dashboard, alerts)
   - **Mobile viewport** (375px) responsive checks for Sprint 2 screens

### Task Creation Expectations

- 1 Task for unit test contracts (catalog, deployment, alerts, bugs)
- 1 Task for integration test contracts (tRPC routers, BullMQ, alert pipeline)
- 1 Task for E2E test contracts (user journeys, a11y, mobile, bug regression)

### Acceptance Criteria (PO Evaluation)

- Every Gherkin scenario in `product-backlog.md` for Sprint 2 stories + bugs has a corresponding test
- Security bug tests cover: CSRF validation (BF-001), audit logging completeness (BF-004), secrets rotation (BF-003), sudoers file permissions (BF-005 proxy)
- A11Y bug test covers: focus management on route transitions (BF-005)
- Deployment state machine tests cover every transition in `DeploymentStatus` enum
- Alert threshold tests cover all 5 alert types (`cpu-critical`, `ram-critical`, `disk-critical`, `app-unavailable`, `server-unreachable`)
- Tests use proper Vitest `describe`/`it` structure with meaningful assertion messages
- E2E tests include WCAG 2.2 AA checks per `wcag-audit.md`
- Zero placeholder tests — every `it()` block has executable assertions

### Dependencies

- None — Testing runs first at P4 Step 1

### Review Checkpoint

PO reviews test contracts before P4 Step 2 begins. Gate 5 pre-check.

### Available Skills

- `vitest` — Vitest testing patterns and best practices
- `playwright-best-practices` — Playwright E2E testing guidance
- `web-accessibility` — WCAG testing patterns

---

## Brief: Tech Lead (P4 Step 2 — Setup)

### Objective

Create worktrees for parallel agent execution. Install any new dependencies required for Sprint 2 features (e.g., SSE utilities, email templates). Verify all build/lint/type-check commands pass before code agents start. Extend the Sprint 1 scaffold for Sprint 2 needs.

### Artifact Inputs

| Artifact | Path | Key Data |
|----------|------|----------|
| Architecture Overview | `docs/architecture-overview.md` | Sprint 2 component additions |
| API Contracts | `docs/api-contracts.md` | New tRPC routers (app, monitor, domain, user) |
| Sprint Backlog | `docs/sprint-backlog.md` | Story branch assignments |

### Expected Outputs

1. **Worktree creation** — Per-track worktrees for parallel agent execution:
   - Sub-branch for FE track off `feat/pi-2-sprint-2`
   - Sub-branch for BE track off `feat/pi-2-sprint-2`
   - Sub-branch for DBA track off `feat/pi-2-sprint-2`
   - Sub-branch for DevOps track off `feat/pi-2-sprint-2`

2. **Dependency additions** (if needed):
   - Verify existing BullMQ, tRPC, Drizzle dependencies are sufficient
   - Add any missing dependencies for SSE streaming, email HTML templates
   - `pnpm install` exits 0

3. **Build verification** — Confirm Sprint 1 codebase is stable as Sprint 2 baseline:
   - `pnpm typecheck` exits 0
   - `pnpm lint` exits 0
   - `pnpm build` exits 0
   - `pnpm test` exits 0 (Sprint 1 tests pass)

### Task Creation Expectations

- 1 Task for worktree setup and dependency verification

### Acceptance Criteria (PO Evaluation)

- All 4 worktrees created and accessible
- Sprint 1 build passes on `feat/pi-2-sprint-2`
- All code agents can work in assigned worktrees without conflicts

### Dependencies

- Test contracts from Testing (P4 Step 1) must exist before code agents start

### Branch / Worktree

- Feature branch: `feat/pi-2-sprint-2`
- TL creates sub-branches: `feat/pi-2-sprint-2/fe`, `/be`, `/dba`, `/devops`

### Available Skills

- `nextjs-app-router-patterns` — Next.js App Router conventions
- `trpc-type-safety` — tRPC router extension patterns
- `drizzle-orm` — Schema extension patterns

---

## Brief: Database Administrator (P4 Step 2)

### Objective

Extend the PostgreSQL schema with new tables and columns for Sprint 2: app catalog storage, deployment records, alerts, enhanced metrics snapshots. Add indexes for Sprint 2 query patterns. Update seed data with catalog entries.

### Artifact Inputs

| Artifact | Path | Key Data |
|----------|------|----------|
| API Contracts | `docs/api-contracts.md` | Zod schemas §2.3 (CatalogApp, DeployAppInput, DeployedApp), §2.4 (MetricsSnapshot, Alert, DashboardOutput) |
| Architecture Overview | `docs/architecture-overview.md` | Data model, tenant isolation pattern |
| Requirements | `docs/requirements.md` | FR-F2-101 (app template schema), FR-F2-122 (volume isolation), FR-F3-101 (metrics), FR-F3-102 (alerts), BF-004 (audit log extensions) |
| Threat Model | `docs/threat-model.md` | I-07 (tenant isolation), NFR-018 (pinned digests) |
| Existing Schema | `code/src/lib/db/schema/` | Sprint 1 schema files (users, servers, sessions, audit_log, metrics_snapshots) |

### Expected Outputs

1. **New Drizzle schema tables:**
   - `catalog_apps` — id (slug), name, description, category, version, minCpuCores, minRamGb, minDiskGb, upstreamUrl, imageDigest (sha256), configSchema (JSONB), timestamps
   - `deployments` — id (UUID), tenantId, serverId, catalogAppId, name, domain, accessUrl, status (DeploymentStatus enum), containerName, config (JSONB encrypted), timestamps
   - `alerts` — id (UUID), tenantId, serverId, appId (nullable), severity, type, message, notificationSent, acknowledgedAt, dismissedAt, timestamps

2. **Schema extensions:**
   - `audit_log` — verify it covers new F2/F3 operation types (app deploy, app stop/start/remove, alert dismiss, credential rotation)
   - `metrics_snapshots` — verify `containers` JSONB field structure matches `MetricsSnapshot` schema (includes `diskUsageBytes`)

3. **Indexes for Sprint 2 queries:**
   - `deployments.tenantId + serverId` (app listing per server)
   - `deployments.tenantId + status` (active deployment queries)
   - `deployments.containerName` (unique per server — lookup by name)
   - `alerts.tenantId + createdAt` (alert listing sorted by time)
   - `alerts.tenantId + serverId + type + dismissedAt` (re-trigger prevention)
   - `catalog_apps.category` (catalog filtering)

4. **Migrations** — Drizzle migration files for Sprint 2 schema additions

5. **Seed data** — App catalog seed with ≥15 curated self-hostable applications:
   - Each entry: name, description, category, version, resource requirements, upstream URL, image digest (sha256), configSchema
   - Categories: File Storage, Analytics, CMS, Password Management, Email, Photo Storage (minimum)
   - Example apps: Nextcloud, Plausible, Ghost, Vaultwarden, Immich, Gitea, etc.
   - Image digests must be valid `sha256:[a-f0-9]{64}` format (NFR-018)

### Task Creation Expectations

- 1 Task for schema extensions and migrations
- 1 Task for catalog seed data

### Acceptance Criteria (PO Evaluation)

- All entity IDs are UUID v4 (never sequential integers — E-02)
- Every table with user data includes `tenantId` column
- `deployments` table status uses the `DeploymentStatus` enum from API contracts
- Catalog seed has ≥15 apps with valid data matching `CatalogApp` Zod schema
- All image digests are `sha256:` format (NFR-018)
- `pnpm db:migrate` exits 0
- `pnpm db:seed` exits 0
- Schema matches Zod schemas in `api-contracts.md` §2

### Dependencies

- TL worktree setup complete

### Branch / Worktree

- Sub-branch: `feat/pi-2-sprint-2/dba`
- Worktree path: assigned by Tech Lead

### Available Skills

- `drizzle-orm` — Drizzle schema patterns, migration generation
- `postgresql-optimization` — Index design, JSONB query optimization

---

## Brief: Backend Developer (P4 Step 2)

### Objective

Implement all server-side logic for Sprint 2: app catalog tRPC router, deployment BullMQ pipeline, health check service, alert evaluation engine, email notifications, guided remediation actions, and all 4 security bug fixes (CSRF, audit logging, secrets rotation). All API procedures must match the contracts in `api-contracts.md`.

### Artifact Inputs

| Artifact | Path | Key Data |
|----------|------|----------|
| API Contracts | `docs/api-contracts.md` | tRPC procedures (§1.3 app, §1.4 monitor, §1.5 domain, §1.6 user), Zod schemas (§2.3, §2.4), SSE events (§3.3), Docker SSH templates (§3.1), Caddy API (§3.4), error codes (§4) |
| Architecture Overview | `docs/architecture-overview.md` | BullMQ job patterns, SSE architecture, service decomposition |
| Requirements | `docs/requirements.md` | FR-F2-101–122, FR-F3-101–116, BF-001–BF-004, BR-BF-001 (bug-first sequencing) |
| Threat Model | `docs/threat-model.md` | T-01 (SSH injection), T-03 (digest pinning), S-04/S-06 (CSRF), R-01 (audit), all Sprint 2 threats |
| Product Backlog | `docs/product-backlog.md` | Gherkin AC for S-202–S-209 + B-258–B-260, B-262 |
| Existing Code | `code/src/` | Sprint 1 BE implementation (auth routers, SSH service, BullMQ setup, SSE endpoint) |

### Expected Outputs — Bug Fixes (Week 1 Priority)

1. **CSRF Double-Submit Cookie (B-258, AB#258):**
   - Implement CSRF token generation tied to session
   - Validate CSRF token on all state-changing tRPC mutations and Server Actions
   - Return 403 FORBIDDEN on mismatch
   - Token never in URL parameters
   - Full regression on F1 and F4 flows

2. **Audit Logging Completeness (B-259, AB#259):**
   - Extend audit log service to cover all privileged operations: server connect/disconnect, provisioning, app deploy/stop/start/remove, config changes, credential rotation
   - Implement `user.auditLog` tRPC query with pagination (cursor-based)
   - 90-day retention in queries
   - All new F2/F3 operations include audit calls from the start (BR-BF-003)

3. **Secrets Rotation (B-260, AB#260):**
   - SSH key rotation endpoint: generate new Ed25519 key, deploy to VPS, invalidate old key
   - API token rotation endpoint: issue new token, update monitoring agent, invalidate old
   - No server disconnection during rotation
   - Rotation events logged in audit log

### Expected Outputs — Feature Implementation

4. **tRPC app.catalog router (S-202, AB#202):**
   - `app.catalog.list` — public query, filterable by category, searchable by name/description
   - `app.catalog.get` — public query, returns full catalog entry including `configSchema`
   - Response matches `CatalogApp` Zod schema

5. **tRPC app.deployment router (S-203, S-204, S-205, S-206):**
   - `app.deployment.create` — protected mutation:
     - Validate `DeployAppInput` against Zod schema
     - Check tier limits (`TierLimits[user.tier].maxApps`)
     - Pre-deployment resource check against server metrics (FR-F2-104)
     - DNS pre-check with warning (FR-F2-114, BR-F2-003)
     - Enqueue `deploy-app` BullMQ job
     - Return `deploymentId` + `jobId`
   - `app.deployment.list` — protected query, tenant-scoped, optional `serverId` filter
   - `app.deployment.get` — protected query, tenant-scoped
   - `app.deployment.stop` — protected mutation, BR-Global-003 confirmation required
   - `app.deployment.start` — protected mutation (for app restart in remediation)
   - `app.deployment.remove` — protected mutation, `confirmationToken` required, cleanup resources

6. **BullMQ `deploy-app` job handler (S-204, AB#204):**
   - **State machine:** `pending → pulling → configuring → provisioning-ssl → starting → running` (or `failed`)
   - **Pulling phase:** `docker pull <image>@sha256:<digest>` via SSH (T-03)
   - **Configuring phase:** Write environment file via SFTP with restricted permissions (600) — never inline CLI args (FR-F2-113)
   - **Provisioning-ssl phase:** Caddy Admin API route creation with `@id` matching (§3.4)
   - **Starting phase:** `docker run` with `--network unplughq`, `--env-file`, `--restart unless-stopped` (FR-F2-105)
   - **Running phase:** Post-deployment HTTP health check (FR-F2-115): GET to domain, 3 retries with exponential backoff, 20s timeout per attempt
   - **Failed phase:** Cleanup — remove container, env file, Caddy route (FR-F2-112)
   - SSE `deployment.progress` event on each state transition (FR-F2-111)
   - State transitions atomic and logged
   - Job resumable from last completed phase (R14 mitigation)
   - Audit log write on deploy/fail

7. **Health check service (S-205, AB#205):**
   - HTTP GET to `https://{domain}` after container start
   - 3 retries with exponential backoff (2s, 4s, 8s)
   - 20-second timeout per attempt
   - Success: transition to `running`, fire `server.status` SSE event
   - Failure: transition to `failed`, fire error event, provide user-friendly failure reason

8. **tRPC monitor router (S-207, S-208, AB#207, AB#208):**
   - `monitor.dashboard` — protected query returning `DashboardOutput`: latest metrics, app statuses, active alerts per server
   - `monitor.serverMetrics` — protected query for time-series metrics over last N minutes
   - `monitor.appStatus` — protected query for single app container status
   - `monitor.alerts.list` — protected query for active and recent alerts, sorted by severity then timestamp
   - `monitor.alerts.dismiss` — protected mutation, prevents re-trigger until condition clears and reoccurs

9. **Alert evaluation engine (S-208, AB#208):**
   - Process incoming `MetricsSnapshot` payloads against thresholds:
     - CPU >90% sustained for 5 minutes → `cpu-critical` alert
     - RAM >90% → `ram-critical` alert
     - Disk >85% → `disk-critical` alert
     - Container status not `running` for >60s → `app-unavailable` alert
     - No metrics push for >120s → `server-unreachable` alert (stale data)
   - 80% resource warning (informational, distinct from critical)
   - Alert deduplication: don't re-create active alerts for same condition
   - SSE `alert.created` event on alert creation

10. **Email notification service (S-208, AB#208):**
    - Extend Sprint 1 email service for alert emails (FR-F3-107)
    - Alert email content: type, severity, server/app, threshold vs current value, dashboard link (FR-F3-106)
    - Unsubscribe link to notification preferences (FR-F3-108)
    - Respect notification suppression (BR-F3-002)
    - Retry via dead-letter queue, max 3 attempts (NFR-020)
    - Track delivery status on alert record (FR-F3-109)

11. **tRPC domain router (S-204, S-206):**
    - `domain.list` — protected query, domain→app bindings per server
    - `domain.bind` — protected mutation, triggers Caddy route creation
    - `domain.unbind` — protected mutation, triggers Caddy route deletion

12. **Guided remediation actions (S-209, AB#209):**
    - `app.deployment.start` for one-click restart (FR-F3-114)
    - Per-app resource breakdown from `containers[].diskUsageBytes` (FR-F3-115)
    - CPU/RAM per-app contribution (FR-F3-116)

### Task Creation Expectations

- 1 Task for CSRF fix (B-258) + audit logging (B-259) + secrets rotation (B-260)
- 1 Task for app catalog tRPC router (S-202)
- 1 Task for deployment pipeline: BullMQ job + state machine + SSE (S-203, S-204)
- 1 Task for health check + post-deploy verification (S-205)
- 1 Task for monitor router + alert evaluation + email notifications (S-207, S-208)
- 1 Task for guided remediation + multi-app coexistence (S-206, S-209)

### Acceptance Criteria (PO Evaluation)

- **Bugs:** CSRF token validated on all mutations; audit log covers all privileged ops; secrets rotation works without disconnection; full Sprint 1 regression passes
- **API:** All tRPC procedures match signatures in `api-contracts.md`
- **Schemas:** All Zod schemas validate correctly per §2 of api-contracts
- **Tenant isolation:** Every DB query includes `tenantId` from session context (I-07)
- **SSH:** Parameterized command templates only — zero string concatenation (T-01)
- **Deployment:** State machine covers all `DeploymentStatus` transitions; cleanup on failure
- **Alerts:** All 5 alert types evaluated correctly; email sent within 5 min; notification suppression works
- **Audit:** Every new F2/F3 operation includes audit log write (BR-BF-003)
- All test contracts from Testing pass

### Dependencies

- DBA schema must be migrated (BE queries the schema)
- TL worktree ready

### Branch / Worktree

- Sub-branch: `feat/pi-2-sprint-2/be`
- Worktree path: assigned by Tech Lead

### Available Skills

- `trpc-type-safety` — tRPC router patterns, middleware composition
- `bullmq-specialist` — BullMQ queue patterns, job lifecycle, state machines
- `zod` — Zod schema patterns, strict parsing
- `redis-development` — Redis rate limiting, DLQ patterns
- `security-best-practices` — CSRF, audit logging, secrets management
- `authjs-skills` — Auth.js v5 CSRF integration
- `drizzle-orm` — Drizzle query patterns with tenant isolation
- `typescript-advanced-types` — TypeScript strict patterns

---

## Brief: Frontend Developer (P4 Step 2)

### Objective

Implement all client-side UI for Sprint 2: app catalog browsing, configuration wizard, deployment progress, post-deployment verification, multi-app dashboard, health monitoring dashboard, alert notification UI, guided remediation, and the focus management a11y fix. All screens must match the design system, wireframes, and A11Y guidelines.

### Artifact Inputs

| Artifact | Path | Key Data |
|----------|------|----------|
| Design System | `docs/design-system.md` | OKLCH tokens, Tailwind config, component specs, dashboard component specs |
| Wireframes | `docs/wireframes.md` | Screens 5–10 for Sprint 2 (catalog, config, deploy progress, dashboard, alerts, remediation) |
| Interaction Patterns | `docs/interaction-patterns.md` | Deployment progress patterns, alert animations, dashboard real-time updates |
| WCAG Audit | `docs/wcag-audit.md` | A11Y requirements for Sprint 2 screens |
| Accessibility Guidelines | `docs/accessibility-guidelines.md` | ARIA patterns for catalog, forms, progress indicators, alerts, dashboards |
| Copy Specs | `docs/copy-specs.md` | Microcopy for Sprint 2 UI: catalog descriptions, deploy phase labels, alert messages, remediation guidance |
| Messaging Framework | `docs/messaging-framework.md` | Empty states, error messaging for deployment failures |
| Tone of Voice | `docs/tone-of-voice.md` | Writing rules for non-technical deploy status labels |
| API Contracts | `docs/api-contracts.md` | tRPC client procedures (app.catalog, app.deployment, monitor, domain, user) |
| Product Backlog | `docs/product-backlog.md` | Gherkin AC for S-202–S-209 + B-251 |

### Expected Outputs — Bug Fix (Week 1)

1. **Focus management fix (B-251, AB#251):**
   - On route change, focus moves to `<main>` element or page heading
   - Screen readers announce new page context (aria-live region or focus management)
   - Modal close returns focus to triggering element
   - Focus trap in modals fully released on close
   - Dynamic content (deploy progress, alert creation) uses `aria-live` regions

### Expected Outputs — Feature Implementation

2. **App Catalog UI (S-202, AB#202):**
   - `/marketplace` — Catalog browsing page:
     - Grid layout of app cards per wireframe Screen 5
     - Category filter sidebar/tabs (File Storage, Analytics, CMS, etc.)
     - Search input with debounced filtering (case-insensitive)
     - App card: name, icon, short description, category badge, resource requirements
     - Empty state when no results match filter/search
   - `/marketplace/[appId]` — Catalog detail page:
     - App description, category, version, resource requirements in human-friendly units
     - Upstream project link (opens new tab)
     - "Deploy" CTA button (gated on having a provisioned server)
   - Catalog browsable without a connected server (deployment gated)
   - All copy from `copy-specs.md`

3. **Configuration Wizard UI (S-203, AB#203):**
   - `/deploy/[appId]/configure` — Dynamic form generated from `configSchema`:
     - Form fields driven by schema: text, email, password, select, boolean types
     - Non-technical labels and contextual help text per field
     - Sensible defaults pre-filled from schema
     - Domain input with validation + DNS warning (non-blocking)
     - Server selection step when multiple servers exist; auto-selected when single server
   - `/deploy/[appId]/summary` — Configuration summary:
     - All configured values organized by logical group
     - Edit action to return to any field without losing other entries
     - "Deploy" action button (single action — FR-F2-004)

4. **Deployment Progress UI (S-204, AB#204):**
   - `/deploy/[appId]/progress/[deploymentId]` — Real-time progress view:
     - Distinct phases displayed: "Downloading your app", "Setting up configuration", "Securing with SSL", "Starting your app"
     - Phase descriptions in non-technical language per `copy-specs.md`
     - SSE subscription to `deployment.progress` events
     - Can navigate away — deployment continues in background
     - Dashboard reflects deployment in progress
   - Failure state:
     - User-friendly failure reason
     - Guided next steps
     - Retry action

5. **Post-Deployment Verification UI (S-205, AB#205):**
   - Success state on deployment progress page:
     - "Your app is live!" completion message
     - Clickable access URL (`https://{domain}`)
     - "Go to Dashboard" CTA
   - Failure state:
     - "Hmm, something's not right" message
     - Failure reason in plain language
     - Guided remediation steps (check DNS, retry)

6. **Multi-App Dashboard Updates (S-206, AB#206):**
   - Dashboard grid shows multiple app tiles
   - Each app tile: name, domain, status badge (running/stopped/unhealthy/updating), access link
   - Deploying an app flows seamlessly into existing dashboard
   - Per-app resource usage visible (from monitoring data)

7. **Dashboard Overview UI (S-207, AB#207):**
   - `/dashboard` — Enhanced dashboard per wireframe Screen 7:
     - Server resource gauges: CPU, RAM, disk as percentage bars
     - Color coding: green (<70%), amber (70-89%), red (≥90%)
     - Network utilization display
     - App tile grid with health status badges
     - Metrics update via SSE subscription (`metrics.update` events)
     - SSE with polling fallback (60s polling if SSE unavailable)
     - Stale data indicator when metrics >120s old (FR-F3-103)
     - "Data stale" badge with timestamp
   - Dashboard loads < 3 seconds (NFR-011)
   - Empty state: "No apps deployed yet — deploy your first app" with catalog CTA

8. **Health Alert UI (S-208, AB#208):**
   - Alert badge on dashboard navigation
   - Alert list panel (sidebar or modal):
     - Active alerts sorted by severity (critical→warning→info), then timestamp
     - Severity badges with distinct colors (critical: red, warning: amber, info: blue)
     - Empty state: "Everything is healthy" message
   - Alert detail expansion (inline panel, no page navigation):
     - Full context: metric values, threshold, affected server/app
     - Available remediation actions as clickable flows
   - SSE subscription to `alert.created` and `alert.dismissed` events

9. **Alert Management & Guided Remediation UI (S-209, AB#209):**
   - Acknowledge action on alerts (visual distinction from new alerts)
   - Dismiss action (dismissed alerts in "Recent" section, faded)
   - Guided remediation flows per alert type:
     - **disk-critical**: per-app disk breakdown, cleanup suggestions
     - **app-unavailable**: one-click "Restart App" action, post-restart health check
     - **cpu-critical / ram-critical**: per-app resource contribution, stop low-priority app, upgrade suggestion
     - **server-unreachable**: check connectivity guidance
   - Remediation guidance in non-technical language per `copy-specs.md`
   - Alert-to-resolution < 10 minutes for guided issues (UJ4)

### Task Creation Expectations

- 1 Task for focus management fix (B-251) + layout updates
- 1 Task for catalog browsing UI + detail page (S-202)
- 1 Task for configuration wizard + summary (S-203)
- 1 Task for deployment progress + post-deploy verification (S-204, S-205)
- 1 Task for dashboard overview + resource gauges + SSE (S-207)
- 1 Task for alert UI + management + remediation (S-208, S-209, S-206 multi-app views)

### Acceptance Criteria (PO Evaluation)

- **Focus fix:** Route transitions move focus to `<main>`; modals release focus trap; screen readers announce page context
- **Screens:** Every screen matches wireframe layout specifications (Screens 5–10)
- **Copy:** All copy matches `copy-specs.md` verbatim (no improvised microcopy)
- **WCAG 2.2 AA compliance:**
  - Contrast ratios maintained (Sprint 1 fixes carry forward)
  - Form fields in config wizard have `<label>` with `htmlFor`, field validation with `aria-invalid`
  - Status indicators use color + text label (never color alone)
  - `prefers-reduced-motion` respected for all animations
  - `aria-live` regions for deployment progress, alert updates, resource gauge changes
  - `autocomplete` attributes on config wizard form fields
- **Keyboard navigation:** All interactive elements reachable and operable
- **Mobile responsive:** Usable at 375px viewport, no horizontal scroll
- **Real-time:** SSE subscriptions connect and receive events; fallback to polling works
- **Stale data:** "Data stale" indicator shown when metrics >120s old
- **Performance:** Dashboard loads < 3 seconds, API responses < 2s at p95
- All tRPC calls use the typed client (no raw fetch)
- All test contracts from Testing pass

### Dependencies

- TL scaffold (worktree ready)
- BE app/monitor/domain routers (FE consumes them — can develop with mock data initially)
- DBA schema (for catalog data and deployment records)

### Branch / Worktree

- Sub-branch: `feat/pi-2-sprint-2/fe`
- Worktree path: assigned by Tech Lead

### A11Y Implementation Brief Reference

Sprint 2 inherits Sprint 1 critical finding remediations and adds:
1. **Focus management** (B-251): Route transition focus, modal cleanup, dynamic content announcements
2. **Progress indicators**: `role="progressbar"` with `aria-valuenow` for deployment phases
3. **Alert announcements**: `role="alert"` or `aria-live="assertive"` for new alerts
4. **Dashboard gauges**: `role="meter"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
5. **Catalog search**: `role="search"` landmark, live search results announced

### Available Skills

- `nextjs-app-router-patterns` — App Router layouts, Server Components, streaming SSE
- `shadcn` — shadcn/ui component extensions for catalog, progress, gauges
- `tailwind-design-system` — Tailwind CSS theme tokens
- `vercel-react-best-practices` — React patterns, server/client boundaries
- `web-accessibility` — WCAG 2.2 AA implementation
- `trpc-type-safety` — tRPC React Query client
- `zod` — Client-side form validation
- `typescript-advanced-types` — TypeScript inference with tRPC

---

## Brief: DevOps Engineer (P4 Step 2)

### Objective

Fix the sudoers ownership bug, extend the deployment infrastructure for Sprint 2 (app deployment pipeline, Caddy route automation, monitoring agent enhancements), and configure alert email delivery infrastructure.

### Artifact Inputs

| Artifact | Path | Key Data |
|----------|------|----------|
| Architecture Overview | `docs/architecture-overview.md` | Deployment pipeline, container orchestration |
| API Contracts | `docs/api-contracts.md` | §3.1 Docker socket (deploy commands), §3.4 Caddy Admin API, §3.2 monitoring agent |
| Threat Model | `docs/threat-model.md` | T-04 (Caddy lockdown), E-04 (sudoers), R20 (supply chain) |
| Requirements | `docs/requirements.md` | FR-F2-105 (Docker network), FR-F2-121 (Caddy route gen), FR-F2-122 (volume isolation), BF-005 (sudoers) |
| Existing Infrastructure | `code/docker/`, provisioning scripts | Sprint 1 DevOps implementation |

### Expected Outputs — Bug Fix (Week 1 Priority)

1. **Sudoers ownership fix (B-262, AB#262):**
   - Fix provisioning script to set sudoers file ownership: `root:root`, mode `0440`
   - Validate file passes `visudo -c`
   - Limit sudo scope: Docker CLI + specific APT commands only, no wildcard/ALL
   - Idempotent — re-running fix does not create duplicate entries

### Expected Outputs — Feature Implementation

2. **App deployment pipeline support (S-204, AB#204):**
   - Parameterized deployment script templates for BullMQ job handler:
     - Container creation command template (§3.1)
     - Environment file SFTP upload with `chmod 600`
     - Container cleanup template (on failure)
   - Docker network `unplughq` creation (idempotent) during provisioning
   - Volume mount conventions: `/opt/unplughq/data/{containerName}/`

3. **Caddy route automation (S-204, S-206, AB#204, AB#206):**
   - Caddy Admin API interaction templates for SSH-tunneled calls:
     - Add route: `POST /config/apps/http/servers/srv0/routes` with `@id` per §3.4
     - Remove route: `DELETE /config/apps/http/servers/srv0/routes/{@id}`
     - Validate: `GET /config/`
   - Route payload generation from deployment configuration
   - Non-disruptive: adding/removing routes does not restart Caddy or affect existing routes

4. **Monitoring agent enhancements (S-207, AB#207):**
   - Extend agent to report per-container disk usage (`diskUsageBytes`)
   - Extend agent to report accurate container status for all running containers
   - Agent version update mechanism (for future iterations)

5. **Alert email infrastructure (S-208, AB#208):**
   - Email delivery configuration (SMTP or transactional email service)
   - Alert email HTML templates (distinct from auth email templates)
   - Dead-letter queue configuration for failed email delivery (NFR-020)
   - Email delivery logging

6. **CI pipeline extensions:**
   - Add Sprint 2 test suites to CI workflow
   - Deployment stage for staging environment (if available)

### Task Creation Expectations

- 1 Task for sudoers fix (B-262) — Week 1 priority
- 1 Task for deployment pipeline templates + Docker network + volume conventions
- 1 Task for Caddy route automation + monitoring agent extensions
- 1 Task for alert email infrastructure + CI extensions

### Acceptance Criteria (PO Evaluation)

- **Sudoers:** File owned `root:root` mode `0440`; passes `visudo -c`; no wildcard permissions
- **Docker network:** `unplughq` network created idempotently during provisioning
- **Caddy routes:** Routes added/removed without disrupting existing apps; `@id` matching works
- **Monitoring agent:** Reports per-container disk usage; container status accurate
- **Email:** Alert emails delivered; DLQ retries failed sends; templates distinct from auth emails
- All provisioning scripts remain idempotent
- No hardcoded secrets in any config
- CI pipeline runs all Sprint 2 tests

### Dependencies

- TL worktree ready
- BE deployment job handler (DevOps provides templates, BE uses them)

### Branch / Worktree

- Sub-branch: `feat/pi-2-sprint-2/devops`
- Worktree path: assigned by Tech Lead

### Available Skills

- `docker-expert` — Docker networking, container management, multi-stage builds
- `redis-development` — Redis/Valkey DLQ patterns
- `security-best-practices` — Infrastructure security, sudoers hardening

---

## Tech Lead Brief: P4 Step 2 End (Merge)

### Objective

Merge all sub-branches (FE, BE, DBA, DevOps) into the feature branch `feat/pi-2-sprint-2`. Resolve any merge conflicts. Verify the integrated build passes all checks.

### Merge Order

1. DBA (schema — no dependencies on other tracks)
2. DevOps (infrastructure — sudoers fix, pipeline templates, Caddy, monitoring agent)
3. BE (server logic — depends on schema + infra templates; includes bug fixes B-258, B-259, B-260)
4. FE (UI — depends on BE API being available; includes B-251 focus fix)

### Verification After Merge

```
pnpm install       → exit 0
pnpm typecheck     → exit 0
pnpm lint          → exit 0
pnpm build         → exit 0
pnpm test          → all test contracts pass (Sprint 1 + Sprint 2)
docker compose up  → all services healthy
```

### Task Creation Expectations

- 1 Task for sub-branch merge and integration verification

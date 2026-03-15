---
artifact: delegation-briefs-p4
produced-by: product-owner
project-slug: unplughq
work-item: epic-001-unplughq-platform
work-item-type: epic
workflow-tier: full
phase: P3
version: 1.0.0
status: draft
azure-devops-id: 193
consumed-by:
  - tech-lead
  - frontend-developer
  - backend-developer
  - database-administrator
  - devops-engineer
  - testing
date: 2026-03-15
---

# Delegation Briefs — Phase 4 (Implementation)

## P4 Execution Overview

Phase 4 follows: `TEST → TL → FE ∥ BE ∥ DBA ∥ DevOps → TL`

1. **Testing** writes test contracts (P4 Step 1) — before any code
2. **Tech Lead** sets up worktrees and dev environment (P4 Step 2 start)
3. **FE, BE, DBA, DevOps** implement in parallel (P4 Step 2)
4. **Tech Lead** merges sub-branches (P4 Step 2 end)

### Branch Context

- **Feature branch:** `feat/epic-001-unplughq-platform`
- **Story branches:** Created by PO (see Branch Instructions per story below)
- **Worktrees:** Created by Tech Lead at P4 Step 2 start

### Sprint 1 Stories in Scope

| AB# | Story | SP | Track |
|-----|-------|----|-------|
| 194 | User Registration | 5 | Auth (F4) |
| 195 | User Authentication | 5 | Auth (F4) |
| 196 | Password Reset Flow | 3 | Auth (F4) |
| 197 | Account Settings | 3 | Auth (F4) |
| 198 | Guided Server Connection Wizard | 8 | Server (F1) |
| 199 | Server Validation & Compatibility | 5 | Server (F1) |
| 200 | Automated Server Provisioning | 13 | Server (F1) |
| 201 | Server Dashboard Presence | 5 | Server (F1) |

---

## Brief: Testing Agent (P4 Step 1)

### Objective

Write test contracts for all 8 Sprint 1 stories before any implementation code. Tests define the behavioral contract that code agents must satisfy. Test contracts must contain executable assertions — no `expect(true).toBe(true)` or empty bodies.

### Artifact Inputs

| Artifact | Path | Key Data |
|----------|------|----------|
| Product Backlog | `docs/product-backlog.md` | Gherkin acceptance criteria for all 8 stories |
| API Contracts | `docs/api-contracts.md` | tRPC procedure signatures, Zod schemas, error codes |
| Architecture Overview | `docs/architecture-overview.md` | Runtime scenarios, tech stack, component decomposition |
| Threat Model | `docs/threat-model.md` | Security test scenarios (S-01 through I-07) |
| WCAG Audit | `docs/wcag-audit.md` | A11Y test targets (5 critical findings) |
| Accessibility Guidelines | `docs/accessibility-guidelines.md` | ARIA patterns, keyboard interaction specs |

### Expected Outputs

1. **Unit test contracts** — Vitest test files for:
   - Auth service (signup validation, password hashing, session management, rate limiting)
   - SSH service (connection test, command execution, timeout handling)
   - Provisioning service (job creation, idempotency, failure handling)
   - Catalog service (listing, filtering, schema validation)
   - Zod schema validation (all input/output schemas from `api-contracts.md`)
   - Tenant isolation (every protected query includes `tenantId` — I-07)

2. **Integration test contracts** — Vitest test files for:
   - tRPC router integration (auth, server, app, monitor routers)
   - Auth.js v5 flows (signup → login → session → logout → reset)
   - BullMQ job lifecycle (enqueue → process → success/failure)

3. **E2E test contracts** — Playwright test files for:
   - UJ1: Register → Login → Add Server → See Dashboard (Sprint 1 scope)
   - Auth flows: signup, login, logout, password reset
   - Server connection wizard: Steps 1–3
   - A11Y keyboard navigation for all Sprint 1 screens
   - Mobile viewport (375px) responsive checks

### Task Creation Expectations

- 1 Task per test category (unit, integration, E2E) — 3 Tasks minimum

### Acceptance Criteria (PO Evaluation)

- Every Gherkin scenario in `product-backlog.md` for Sprint 1 stories has a corresponding test
- Security-relevant tests cover: S-01 (credential stuffing), S-02 (session cookies), I-02 (user enumeration), I-07 (tenant isolation), T-01 (command injection prevention)
- Tests use proper Vitest `describe`/`it` structure with meaningful assertion messages
- E2E tests include WCAG 2.2 AA checks per `wcag-audit.md` critical findings
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

Initialize the project development environment, install dependencies, configure tooling, and create worktrees for parallel agent execution. Verify all build/lint/type-check commands pass before code agents start.

### Artifact Inputs

| Artifact | Path | Key Data |
|----------|------|----------|
| Architecture Overview | `docs/architecture-overview.md` | Tech stack, package versions, project structure |
| API Contracts | `docs/api-contracts.md` | tRPC setup, Zod schemas placement |
| Design System | `docs/design-system.md` | Tailwind config, CSS custom properties, font loading |

### Expected Outputs

1. **Project scaffold** — Next.js 16 App Router project with:
   - TypeScript 5.9.x strict mode
   - Tailwind CSS 4 configuration matching design system tokens
   - shadcn/ui initialization with component primitives
   - tRPC server/client setup with router stubs
   - Drizzle ORM configuration with PostgreSQL connection
   - Auth.js v5 skeleton configuration
   - BullMQ + Redis/Valkey connection setup
   - pnpm workspace configuration
   - ESLint + Prettier configuration

2. **Dev environment** — Docker Compose for local development:
   - PostgreSQL 17 container
   - Redis/Valkey container
   - Development server configuration

3. **Worktree creation** — Per-track worktrees for parallel agent execution:
   - Sub-branch for FE track
   - Sub-branch for BE track
   - Sub-branch for DBA track
   - Sub-branch for DevOps track

4. **CI pipeline stub** — GitHub Actions workflow for lint, typecheck, test

### Task Creation Expectations

- 1 Task for project scaffold and dev environment
- 1 Task for worktree setup

### Acceptance Criteria (PO Evaluation)

- `pnpm install` exits 0 with zero audit critical/high vulnerabilities
- `pnpm typecheck` exits 0
- `pnpm lint` exits 0
- `pnpm build` exits 0
- Docker Compose starts PostgreSQL and Redis successfully
- All code agents can work in their assigned worktrees without conflicts

### Dependencies

- Test contracts from Testing (P4 Step 1) must exist before code agents start
- TL setup runs at P4 Step 2 start, before FE/BE/DBA/DevOps

### Branch / Worktree

- Feature branch: `feat/epic-001-unplughq-platform`
- TL creates sub-branches: `feat/epic-001-unplughq-platform/fe`, `/be`, `/dba`, `/devops`

### Available Skills

- `nextjs-app-router-patterns` — Next.js 16 App Router conventions
- `tailwind-design-system` — Tailwind CSS 4 configuration
- `shadcn` — shadcn/ui setup and component patterns
- `trpc-type-safety` — tRPC router and middleware setup
- `drizzle-orm` — Drizzle ORM configuration and schema patterns
- `authjs-skills` — Auth.js v5 setup and configuration
- `typescript-advanced-types` — TypeScript strict mode patterns

---

## Brief: Database Administrator (P4 Step 2)

### Objective

Design and implement the PostgreSQL database schema, migrations, seed data, and indexes for all Sprint 1 stories (F4 auth + F1 server). Ensure tenant isolation is baked into the schema from day one.

### Artifact Inputs

| Artifact | Path | Key Data |
|----------|------|----------|
| API Contracts | `docs/api-contracts.md` | Zod schemas (§2) define the shape of all domain entities |
| Architecture Overview | `docs/architecture-overview.md` | PostgreSQL 17, Drizzle ORM, tenant isolation pattern |
| Threat Model | `docs/threat-model.md` | I-01 (SSH key encryption), I-07 (cross-tenant leakage), R-01 (audit log) |
| Requirements | `docs/requirements.md` | BR-F4-002 (password storage), BR-F1-002 (SSH key handling), NFR-013 (audit log) |

### Expected Outputs

1. **Drizzle schema files** — TypeScript schema definitions for:
   - `users` table — id (UUID), email, name, passwordHash, tier, emailVerified, notificationPrefs, timestamps
   - `accounts` / `sessions` / `verificationTokens` — Auth.js v5 required tables
   - `servers` table — id (UUID), tenantId, name, ip, sshPort, status, osName, cpuCores, ramGb, diskGb, sshKeyEncrypted, timestamps
   - `deployments` table — id (UUID), tenantId, serverId, catalogAppId, domain, status, containerName, timestamps
   - `alerts` table — id (UUID), tenantId, serverId, appId, severity, type, message, notificationSent, acknowledgedAt, timestamps
   - `audit_log` table — append-only: id, tenantId, action, targetType, targetId, ipAddress, userAgent, details (JSONB), timestamp
   - `metrics_snapshots` table — serverId, timestamp, cpuPercent, ramUsed/Total, diskUsed/Total, networkRx/Tx, containers (JSONB)

2. **Migrations** — Drizzle migration files for initial schema creation

3. **Indexes** — Performance indexes on:
   - All `tenantId` columns (tenant isolation queries)
   - `servers.status`, `deployments.status` (dashboard queries)
   - `alerts.tenantId + createdAt` (alert listing)
   - `audit_log.tenantId + timestamp` (audit queries)
   - `metrics_snapshots.serverId + timestamp` (time-series queries)

4. **Seed data** — Development seed with test user, test server, sample catalog apps

### Task Creation Expectations

- 1 Task for schema design and migrations
- 1 Task for seed data and indexes

### Acceptance Criteria (PO Evaluation)

- All entity IDs are UUID v4 (never sequential integers — E-02 mitigation)
- Every table with user data includes `tenantId` column
- SSH key column uses encrypted storage (schema supports AES-256-GCM encrypted blob)
- Audit log table is append-only (no UPDATE/DELETE in application queries)
- `pnpm db:migrate` exits 0
- `pnpm db:seed` exits 0
- Schema matches Zod schemas in `api-contracts.md` §2

### Dependencies

- TL scaffold must be complete (Drizzle ORM configured, PostgreSQL container running)

### Branch / Worktree

- Sub-branch: `feat/epic-001-unplughq-platform/dba`
- Worktree path: assigned by Tech Lead

### Available Skills

- `drizzle-orm` — Drizzle schema patterns, migration generation
- `postgresql-optimization` — Index design, query optimization

---

## Brief: Backend Developer (P4 Step 2)

### Objective

Implement all server-side logic for Sprint 1: Auth.js v5 configuration, tRPC routers (auth + server), SSH service, provisioning job handlers, and monitoring metrics ingestion. All API procedures must match the contracts in `api-contracts.md`.

### Artifact Inputs

| Artifact | Path | Key Data |
|----------|------|----------|
| API Contracts | `docs/api-contracts.md` | tRPC procedures, Zod schemas, error codes, auth middleware, test environment strategy |
| Architecture Overview | `docs/architecture-overview.md` | Runtime sequences, service decomposition, ADR decisions |
| Threat Model | `docs/threat-model.md` | T-01 (SSH command injection), S-01 (credential stuffing), I-01 (key encryption), I-04 (error messages), I-05 (key material in logs), D-01/D-04 (rate limiting) |
| Requirements | `docs/requirements.md` | All FR-F4-*, FR-F1-* functional requirements and business rules |
| Product Backlog | `docs/product-backlog.md` | Gherkin AC for Sprint 1 stories |

### Expected Outputs

1. **Auth.js v5 configuration** — Complete auth setup:
   - Credentials provider with Argon2id password hashing
   - Database adapter (Drizzle)
   - Session strategy: database-backed sessions with HttpOnly, Secure, SameSite=Lax cookies
   - CSRF protection (Auth.js defaults)
   - Rate limiting middleware: 10 failed attempts / 5 min → account lock (BR-F4-001)
   - Generic error messages (I-02 mitigation)
   - Password reset flow with cryptographically random tokens (256-bit, 1-hour expiry)

2. **tRPC routers — auth** (`auth.*`):
   - `auth.session` — query active session
   - `auth.updateProfile` — update display name, email (with confirmation)
   - `auth.updateNotificationPrefs` — toggle email alerts
   - Protected procedure middleware enforcing tenant isolation

3. **tRPC routers — server** (`server.*`):
   - `server.list` — list servers scoped by tenantId
   - `server.get` — get server detail (composite key: id + tenantId)
   - `server.testConnection` — enqueue test-connection job
   - `server.provision` — enqueue provision-server job (with compatibility gate)
   - `server.rename` — update server name

4. **SSH service** — `ssh2`-based service:
   - Connection test (TCP reachability + auth validation)
   - OS detection (uname, lsb_release parsing)
   - Resource detection (CPU cores, RAM, disk)
   - Parameterized command templates (T-01: never string concatenation)
   - Connection pooling (max 3 per server — D-04)
   - Timeout enforcement (30s connect, 120s command — D-04)

5. **BullMQ job handlers**:
   - `test-connection` job: SSH connect, validate, report specs
   - `provision-server` job: install Docker, Caddy, monitoring agent (idempotent)
   - Job data validation with Zod before processing (D-05)
   - Retry with exponential backoff (max 3 attempts)
   - SSE status push on each state transition

6. **Monitoring metrics endpoint** — Route Handler `POST /api/agent/metrics`:
   - Per-server API token authentication (S-03)
   - Strict Zod parse of MetricsSnapshot (I-06)
   - Rate limiting: 2 req/min per server (D-02)

7. **SSE endpoint** — Route Handler `GET /api/events`:
   - Session cookie authentication
   - Tenant-scoped event streaming
   - Heartbeat every 30 seconds

8. **Structured logging** — Pino-based logging:
   - Field allowlists (I-05: no SSH key material in logs)
   - PEM key pattern redaction
   - Job correlation via BullMQ job_id

### Task Creation Expectations

- 1 Task for Auth.js + auth tRPC router
- 1 Task for SSH service + server tRPC router
- 1 Task for BullMQ job handlers (provisioning pipeline)
- 1 Task for metrics ingestion + SSE endpoint

### Acceptance Criteria (PO Evaluation)

- All tRPC procedures match signatures in `api-contracts.md`
- All Zod schemas validate correctly per §2 of api-contracts
- Tenant isolation: every DB query includes `tenantId` from session context (never from request params)
- SSH commands use parameterized templates — zero string concatenation
- Generic error messages on auth failures (no user enumeration)
- SSH key material encrypted at rest with AES-256-GCM
- Structured logging excludes sensitive fields
- All test contracts from Testing pass

### Dependencies

- DBA schema must be migrated (BE queries the schema)
- TL scaffold must have tRPC, Auth.js, BullMQ, Redis configured

### Branch / Worktree

- Sub-branch: `feat/epic-001-unplughq-platform/be`
- Worktree path: assigned by Tech Lead

### Available Skills

- `authjs-skills` — Auth.js v5 patterns, session strategy, credential providers
- `trpc-type-safety` — tRPC router patterns, middleware composition, error handling
- `bullmq-specialist` — BullMQ queue patterns, job lifecycle, retry strategies
- `zod` — Zod schema patterns, strict parsing, discriminated unions
- `redis-development` — Redis/Valkey connection, rate limiting patterns
- `security-best-practices` — OWASP-aligned security patterns
- `typescript-advanced-types` — TypeScript strict patterns, branded types

---

## Brief: Frontend Developer (P4 Step 2)

### Objective

Implement all client-side UI for Sprint 1: auth pages (signup, login, reset, settings), server connection wizard (Steps 1–3), provisioning progress UI, server dashboard tile, and the dashboard shell layout. All screens must match the design system, wireframes, and A11Y guidelines.

### Artifact Inputs

| Artifact | Path | Key Data |
|----------|------|----------|
| Design System | `docs/design-system.md` | OKLCH tokens, Tailwind config, component specs, typography, spacing |
| Wireframes | `docs/wireframes.md` | 10 screen layouts — Sprint 1 uses Screens 1–4 |
| Interaction Patterns | `docs/interaction-patterns.md` | Animations, feedback loops, mobile patterns |
| WCAG Audit | `docs/wcag-audit.md` | 5 critical findings to address during implementation |
| Accessibility Guidelines | `docs/accessibility-guidelines.md` | ARIA patterns per component |
| Copy Specs | `docs/copy-specs.md` | Microcopy for all UI elements |
| Messaging Framework | `docs/messaging-framework.md` | Value proposition, empty states, error messaging |
| Tone of Voice | `docs/tone-of-voice.md` | Writing rules, tone spectrum, no-filler policy |
| API Contracts | `docs/api-contracts.md` | tRPC client setup, procedure signatures for FE consumption |
| Product Backlog | `docs/product-backlog.md` | Gherkin AC for Sprint 1 stories |

### Expected Outputs

1. **Layout shell** — App Router layout with:
   - Sidebar navigation (260px, collapses < 1024px) per wireframe global structure
   - Top bar with breadcrumbs, user profile, notifications
   - Responsive breakpoints matching design system
   - Dark mode toggle (using `data-theme` attribute)
   - Skeleton loading states per interaction patterns

2. **Auth pages** (Stories S-194, S-195, S-196, S-197):
   - `/signup` — Registration form with email + password strength validation
   - `/login` — Login form with generic error display
   - `/forgot-password` — Reset request form
   - `/reset-password/[token]` — New password form
   - `/settings` — Account settings (name, email, notification preferences)
   - All forms use shadcn/ui form components with Zod client-side validation

3. **Onboarding welcome** (Screen 1 from wireframes):
   - `/welcome` — Welcoming entry point after first registration
   - Copy from `copy-specs.md` §1

4. **Server connection wizard** (Stories S-198, S-199, S-200, S-201):
   - `/connect/credentials` — Step 1: IP address, SSH method selection, credentials (Screen 2)
   - `/connect/validation` — Step 2: Connection test result, OS/resource specs display (Screen 3)
   - `/connect/provisioning` — Step 3: Real-time provisioning progress with SSE
   - Provider-specific instruction rendering (≥5 providers + generic)
   - File upload alternative for SSH key textarea

5. **Dashboard** (Story S-201, partial S-207):
   - `/dashboard` — Server tile with Pulse Ring health indicator, resource summary
   - App tile grid (populated in Sprint 2)
   - Empty state with "Add Server" CTA
   - Responsive grid: `repeat(auto-fill, minmax(300px, 1fr))`

6. **Shared components** — shadcn/ui-based:
   - Toast notification system (bottom-right desktop, top-center mobile)
   - Modal dialog for destructive confirmations
   - Form validation with `aria-invalid`, `aria-errormessage`
   - Status indicator with Pulse Ring animation
   - Skeleton loading components

### Task Creation Expectations

- 1 Task for layout shell + shared components
- 1 Task for auth pages (signup, login, reset, settings)
- 1 Task for server connection wizard (Steps 1–3)
- 1 Task for dashboard shell + server tile

### Acceptance Criteria (PO Evaluation)

- Every screen matches wireframe layout specifications
- All copy matches `copy-specs.md` verbatim (no improvised microcopy)
- WCAG 2.2 AA compliance per `wcag-audit.md`:
  - `--color-text-subtle` remediated to ≥ 4.5:1 contrast
  - Input field borders meet ≥ 3:1 non-text contrast
  - All status indicators use color + text label (never color alone)
  - Form fieldsets with `<legend>` for grouped fields
  - Alt text on all app icons and illustrations
  - `autocomplete` attributes on form fields per 1.3.5
- Keyboard navigation: all interactive elements reachable and operable
- Mobile responsive: usable at 375px viewport, no horizontal scroll
- `prefers-reduced-motion` disables Pulse Ring animation and scaling effects
- `aria-live` regions for deployment progress and status changes
- All tRPC calls use the typed client (no raw fetch)
- All test contracts from Testing pass

### Dependencies

- TL scaffold (shadcn/ui init, Tailwind config, tRPC client)
- BE auth/server routers (FE consumes them — can develop with mock data initially)
- DBA schema (for Auth.js database adapter)

### Branch / Worktree

- Sub-branch: `feat/epic-001-unplughq-platform/fe`
- Worktree path: assigned by Tech Lead

### A11Y Implementation Brief Reference

The A11Y agent flagged 5 critical findings at P2. The FE must address:
1. **Contrast:** Fix `--color-text-subtle` token (slate-400 → slate-500 minimum)
2. **Non-text contrast:** Fix `--color-border-base` for input fields (slate-200 → slate-300 minimum)
3. **Alt text patterns:** Define and apply alt text for all icons/images
4. **Form accessibility:** `<fieldset>` + `<legend>` for radio groups and checkbox groups
5. **Keyboard alternatives:** File upload button alongside drag-and-drop; visible delete button for swipe-to-dismiss

### Available Skills

- `nextjs-app-router-patterns` — App Router layouts, Server Components, Server Actions
- `shadcn` — shadcn/ui component installation and customization
- `tailwind-design-system` — Tailwind CSS 4 theme configuration from OKLCH tokens
- `vercel-react-best-practices` — React patterns, server/client component boundaries
- `web-accessibility` — WCAG 2.2 AA implementation patterns
- `trpc-type-safety` — tRPC React Query client usage
- `zod` — Client-side form validation with Zod
- `typescript-advanced-types` — TypeScript inference with tRPC

---

## Brief: DevOps Engineer (P4 Step 2)

### Objective

Establish the CI/CD pipeline, Docker development environment, and deployment infrastructure for the UnplugHQ control plane. Define the monitoring agent container spec for the user's VPS data plane.

### Artifact Inputs

| Artifact | Path | Key Data |
|----------|------|----------|
| Architecture Overview | `docs/architecture-overview.md` | Deployment view, container decomposition, infrastructure |
| Threat Model | `docs/threat-model.md` | T-04 (Caddy lockdown), T-07 (Redis auth), D-01/D-02/D-04 (resource limits) |
| API Contracts | `docs/api-contracts.md` | §3.1 Docker socket access, §3.2 monitoring agent metrics endpoint |

### Expected Outputs

1. **Docker Compose (development)** — Local development environment:
   - PostgreSQL 17 with health check
   - Redis/Valkey with AUTH password
   - Next.js dev server with hot reload
   - BullMQ worker process
   - Volume mounts for persistent data
   - Environment variable template (`.env.example`)

2. **CI pipeline** — GitHub Actions workflow:
   - Lint (ESLint)
   - Type check (TypeScript)
   - Unit tests (Vitest)
   - Build verification
   - Dependency audit (`pnpm audit`)

3. **Monitoring agent container** — Minimal container for user's VPS:
   - Collects: CPU%, RAM%, disk%, network bytes, container statuses
   - Reports: HTTPS POST to `/api/agent/metrics` every 30 seconds
   - Auth: Per-server API token in `Authorization` header
   - Constraints: Read-only filesystem, no host filesystem write access, no SSH access
   - Dockerfile for agent build

4. **Caddy configuration templates** — Base config for user's VPS:
   - Admin API bound to localhost only (T-04)
   - ACME integration for automatic SSL
   - Route template for app proxying

5. **Provisioning scripts** — Parameterized shell scripts for:
   - Docker Engine installation (idempotent)
   - Caddy installation and base configuration
   - Monitoring agent deployment
   - unplughq SSH user creation with limited sudoers (E-04)

### Task Creation Expectations

- 1 Task for Docker Compose + CI pipeline
- 1 Task for monitoring agent container
- 1 Task for Caddy templates + provisioning scripts

### Acceptance Criteria (PO Evaluation)

- `docker compose up` starts all services and health checks pass
- CI pipeline runs lint, typecheck, test, build — all exit 0
- Monitoring agent pushes valid MetricsSnapshot payloads
- Agent container runs read-only filesystem
- Caddy admin API is localhost-only
- Provisioning scripts are idempotent (re-run safe)
- No hardcoded secrets in any config file
- `.env.example` documents all environment variables

### Dependencies

- TL scaffold for project structure
- BE API contracts for monitoring agent endpoint spec

### Branch / Worktree

- Sub-branch: `feat/epic-001-unplughq-platform/devops`
- Worktree path: assigned by Tech Lead

### Available Skills

- `docker-expert` — Docker best practices, multi-stage builds, security
- `redis-development` — Redis/Valkey deployment, AUTH configuration
- `security-best-practices` — Infrastructure security patterns

---

## Tech Lead Brief: P4 Step 2 End (Merge)

### Objective

Merge all sub-branches (FE, BE, DBA, DevOps) into the feature branch. Resolve any merge conflicts. Verify the integrated build passes all checks.

### Merge Order

1. DBA (schema — no dependencies)
2. DevOps (infrastructure — depends on schema for Docker Compose)
3. BE (server logic — depends on schema + infra)
4. FE (UI — depends on BE API contracts being available)

### Verification After Merge

- `pnpm install` — exits 0
- `pnpm typecheck` — exits 0
- `pnpm lint` — exits 0
- `pnpm build` — exits 0
- `pnpm test` — all test contracts pass
- `docker compose up` — all services healthy

### Task Creation Expectations

- 1 Task for sub-branch merge and integration verification

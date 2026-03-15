---
artifact: delegation-briefs-p7
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
  - devops-engineer
  - database-administrator
  - backend-developer
  - frontend-developer
  - testing
date: 2026-03-15
---

# Delegation Briefs — Phase 7 (Deployment)

## P7 Execution Overview

Phase 7 follows: `DevOps → DBA → BE → FE → Testing`

1. **DevOps** prepares the production environment and deployment pipeline
2. **DBA** runs production database migrations
3. **BE** configures production secrets and validates server-side configuration
4. **FE** builds production bundle and validates assets
5. **Testing** runs smoke tests against the deployed environment

### Context

- **Feature branch:** `feat/epic-001-unplughq-platform` (verified at P5 Gate)
- Sprint 1 scope: Auth (F4) + Server Management (F1)
- All P5 bugs resolved, feature branch re-verified

---

## Brief: DevOps Engineer (P7 — Environment Setup)

### Objective

Prepare the production environment for Sprint 1 deployment. Set up the control plane hosting, database instance, Redis instance, and CI/CD deployment pipeline that deploys from the main branch.

### Artifact Inputs

| Artifact | Path | Key Data |
|----------|------|----------|
| Architecture Overview | `docs/architecture-overview.md` | Deployment view, infrastructure components |
| Threat Model | `docs/threat-model.md` | Production security requirements |

### Expected Outputs

1. **Production Docker Compose / deployment config** — Production environment:
   - Next.js production container (multi-stage build, minimal base image)
   - BullMQ worker container (separate process)
   - PostgreSQL 17 connection to managed or Docker instance
   - Redis/Valkey with AUTH and TLS
   - Caddy reverse proxy for control plane with automatic HTTPS
   - Health check endpoints configured

2. **Secret management** — Production secrets strategy:
   - `.env.production` template (no actual secrets committed)
   - Documentation for secret injection (environment variables or secret store)
   - Required secrets: `DATABASE_URL`, `REDIS_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`, `ENCRYPTION_KEY`

3. **Deployment pipeline** — GitHub Actions CD workflow:
   - Trigger: merge to `main` branch
   - Build production Docker images
   - Run migrations
   - Deploy with zero-downtime strategy
   - Post-deploy health check
   - Rollback on health check failure

4. **Monitoring baseline** — Production observability:
   - Application health endpoint (`/api/health`)
   - Container health checks
   - Log aggregation configuration

### Task Creation Expectations

- 1 Task for production environment setup
- 1 Task for deployment pipeline

### Acceptance Criteria (PO Evaluation)

- Production containers build successfully
- Health check endpoint responds 200
- Deployment pipeline runs end-to-end on merge to main
- Rollback mechanism tested and working
- No secrets in version control
- TLS/HTTPS enforced for all production endpoints

### Dependencies

- P5 Gate passed — feature branch verified

### Available Skills

- `docker-expert` — Production Docker patterns, multi-stage builds
- `redis-development` — Redis TLS, production AUTH configuration
- `security-best-practices` — Production security hardening

---

## Brief: Database Administrator (P7 — Production Migration)

### Objective

Execute database migrations against the production PostgreSQL instance. Verify schema integrity, set up production indexes, and configure connection pooling.

### Expected Outputs

1. **Production migration execution** — Run Drizzle migrations:
   - Verify migration files match what was tested in dev/staging
   - Execute migrations in a transaction (atomic rollback on failure)
   - Validate post-migration schema state

2. **Production database configuration**:
   - Connection pool settings appropriate for expected load
   - Statement timeouts configured
   - Automated backup verification

### Task Creation Expectations

- 1 Task for production migration and configuration

### Acceptance Criteria (PO Evaluation)

- All migrations execute successfully
- Post-migration schema matches development schema exactly
- Connection pooling configured and tested
- Backup procedure verified (backup + restore test)

### Dependencies

- DevOps has provisioned the production database instance

### Available Skills

- `drizzle-orm` — Migration execution, production configuration
- `postgresql-optimization` — Connection pooling, production tuning

---

## Brief: Backend Developer (P7 — Production Config)

### Objective

Configure production environment variables, validate all API endpoints against production infrastructure, and ensure auth flows work end-to-end with production Auth.js configuration.

### Expected Outputs

1. **Production configuration** — Verify and configure:
   - Auth.js production configuration (`NEXTAUTH_URL`, `AUTH_SECRET`)
   - Database connection string verified
   - Redis connection with AUTH and TLS verified
   - SSH encryption key (AES-256-GCM) generated and configured
   - Rate limiting thresholds set per `api-contracts.md`
   - Structured logging configured for production (JSON format, appropriate levels)

2. **Endpoint validation** — Verify against production:
   - All tRPC procedures respond correctly
   - Auth flows (signup → login → session → protected route)
   - SSE endpoint streams events
   - Metrics endpoint accepts valid payloads

### Task Creation Expectations

- 1 Task for production configuration and endpoint validation

### Acceptance Criteria (PO Evaluation)

- All tRPC procedures functional in production
- Auth flow end-to-end working (signup through session management)
- SSE events stream correctly
- Structured logging outputs valid JSON
- No verbose error messages leaked to clients in production mode

### Dependencies

- DBA migrations completed
- DevOps environment running

### Available Skills

- `authjs-skills` — Production Auth.js configuration
- `trpc-type-safety` — Production tRPC validation
- `security-best-practices` — Production secret management

---

## Brief: Frontend Developer (P7 — Production Build)

### Objective

Build the production Next.js bundle, validate static assets, and confirm the client-side application works correctly against the production API.

### Expected Outputs

1. **Production build** — Next.js production build:
   - `pnpm build` exits 0 with production environment
   - Bundle size analysis (no unexpected bloat)
   - Static assets optimized (images, fonts)
   - Environment variables injected correctly (`NEXT_PUBLIC_*`)

2. **Production UI validation**:
   - All pages render without hydration errors
   - tRPC client connects to production API
   - No console errors in production mode
   - Loading states and error boundaries work correctly

### Task Creation Expectations

- 1 Task for production build and validation

### Acceptance Criteria (PO Evaluation)

- `pnpm build` exits 0
- No hydration mismatches in production
- All Sprint 1 screens render correctly
- No `console.error` or `console.warn` in production
- Bundle size documented in deployment report

### Dependencies

- BE production configuration complete
- DevOps deployment infrastructure ready

### Available Skills

- `nextjs-app-router-patterns` — Production build configuration
- `tailwind-design-system` — Production CSS optimization

---

## Brief: Testing Agent (P7 — Smoke Tests)

### Objective

Run smoke tests against the deployed production environment to verify core user journeys work end-to-end. This is the final quality gate before Sprint 1 is considered deployed.

### Smoke Test Scenarios

**Critical Path (must pass):**
1. ✅ Homepage loads (HTTP 200, no console errors)
2. ✅ Signup: create new account → redirect to welcome/dashboard
3. ✅ Login: existing account → session established → dashboard loads
4. ✅ Logout: session destroyed → redirect to login
5. ✅ Server wizard Step 1: form renders, validation works

**Extended (should pass):**
6. ✅ Password reset request: form submits successfully
7. ✅ Account settings: profile update saves
8. ✅ Dashboard: empty state renders with "Add Server" CTA
9. ✅ Mobile responsive: key flows work at 375px
10. ✅ HTTPS: all pages served over TLS, no mixed content

### Expected Outputs

1. **Smoke test report** — artifact documenting:
   - Scenario pass/fail status
   - Response times for critical paths
   - Screenshots of key screens (evidence)
   - Any production-only issues discovered

2. **Bug work items** — Created for production-specific failures

### Task Creation Expectations

- 1 Task for smoke test execution and reporting

### Acceptance Criteria (PO Evaluation)

- All 5 critical path scenarios pass
- All 5 extended scenarios pass (or documented known limitations)
- No production-only errors discovered
- Response times < 3s for page loads
- Smoke test report published as artifact

### Dependencies

- FE + BE production verification complete
- Production environment fully deployed

### Available Skills

- `playwright-best-practices` — Production E2E testing
- `vitest` — API smoke test utilities

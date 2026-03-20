---
artifact: delegation-briefs-p7
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
  - devops-engineer
  - database-administrator
  - backend-developer
  - frontend-developer
  - testing
date: 2026-03-16
---

# Delegation Briefs — Phase 7 (Deployment) — PI-2 Sprint 2

## P7 Execution Overview

Phase 7 follows: `DevOps → DBA → BE → FE → Testing`

1. **DevOps** updates production environment for Sprint 2 features
2. **DBA** runs Sprint 2 production database migrations + catalog seed
3. **BE** configures production for new routers, BullMQ deploy job, alert engine, email service
4. **FE** builds production bundle with Sprint 2 pages and validates
5. **Testing** runs smoke tests covering Sprint 2 user journeys + bug fix regression

### Context

- **Feature branch:** `feat/pi-2-sprint-2` (verified at P5 Gate)
- Sprint 2 scope: App Catalog & Deployment (F2) + Dashboard & Health Monitoring (F3) + 5 bug fixes
- All P5 bugs resolved, feature branch re-verified
- Sprint 1 (F4 Auth + F1 Server) already deployed and in production

---

## Brief: DevOps Engineer (P7 — Environment Update)

### Objective

Update the production environment for Sprint 2: deployment pipeline templates, monitoring agent update, Caddy route automation, alert email infrastructure, and production CI pipeline extensions.

### Artifact Inputs

| Artifact | Path | Key Data |
|----------|------|----------|
| Architecture Overview | `docs/architecture-overview.md` | Sprint 2 infrastructure additions |
| Threat Model | `docs/threat-model.md` | T-04 (Caddy), T-08 (env files), E-04 (sudoers fix) |

### Expected Outputs

1. **Production environment updates:**
   - Updated monitoring agent container image with per-container disk usage reporting
   - Caddy route automation templates deployed and tested
   - Docker network `unplughq` verified on provisioned servers
   - Volume mount conventions documented (`/opt/unplughq/data/{containerName}/`)

2. **Alert email infrastructure:**
   - SMTP / transactional email service configured for production
   - Alert email HTML templates deployed
   - Dead-letter queue operational for failed email delivery
   - Email delivery logging enabled

3. **Sudoers fix deployment (B-262):**
   - Updated provisioning script deployed
   - Existing provisioned servers updated with corrected sudoers file
   - Verified `root:root` ownership, `0440` mode, `visudo -c` pass

4. **CI/CD pipeline updates:**
   - Sprint 2 test suites added to CI workflow
   - Deployment workflow updated for Sprint 2 migrations + catalog seed
   - Monitoring agent update mechanism in deployment flow

### Task Creation Expectations

- 1 Task for production environment update and deployment pipeline

### Acceptance Criteria (PO Evaluation)

- Monitoring agent reports per-container disk usage in production
- Caddy route automation tested: can add/remove routes without disrupting existing
- Alert email delivery confirmed (test email sent and received)
- Sudoers fix verified on existing provisioned servers
- CI pipeline runs all Sprint 2 tests
- Zero-downtime deployment maintained for Sprint 2

### Dependencies

- P5 Gate passed — feature branch verified

### Available Skills

- `docker-expert` — Production container management
- `redis-development` — DLQ production configuration
- `security-best-practices` — Production sudoers, email security

---

## Brief: Database Administrator (P7 — Production Migration)

### Objective

Execute Sprint 2 database migrations against production: new tables (`catalog_apps`, `deployments`, `alerts`), schema extensions, new indexes. Seed production catalog with curated app entries.

### Expected Outputs

1. **Production migration execution:**
   - Verify Sprint 2 migration files match what was tested in dev/staging
   - Execute migrations in a transaction (atomic rollback on failure)
   - New tables created: `catalog_apps`, `deployments`, `alerts`
   - Existing tables extended: `metrics_snapshots` (containers JSONB), `audit_log` (new action types)
   - New indexes active for Sprint 2 query patterns
   - Validate post-migration schema state

2. **Catalog seed data:**
   - ≥15 curated self-hostable apps seeded into `catalog_apps`
   - All entries have valid image digests (`sha256:` format)
   - Verify entries match `CatalogApp` Zod schema
   - Seed idempotent (re-runnable without duplicates)

3. **Production database tuning:**
   - Connection pool settings reviewed for Sprint 2 query load (more concurrent deployment/metrics queries)
   - Statement timeouts appropriate for new query patterns
   - Backup procedure covers new tables

### Task Creation Expectations

- 1 Task for Sprint 2 production migration + catalog seed

### Acceptance Criteria (PO Evaluation)

- All Sprint 2 migrations execute successfully
- Post-migration schema matches development schema exactly
- ≥15 catalog apps seeded and queryable
- Sprint 1 data intact after migration (no data loss)
- Backup procedure verified for new tables

### Dependencies

- DevOps has updated production environment

### Available Skills

- `drizzle-orm` — Migration execution, production configuration
- `postgresql-optimization` — Production tuning for new query patterns

---

## Brief: Backend Developer (P7 — Production Config)

### Objective

Configure production for Sprint 2 server-side features: new tRPC routers, BullMQ deploy-app job, alert evaluation engine, email service, CSRF middleware, and secrets rotation. Validate all Sprint 2 endpoints against production infrastructure.

### Expected Outputs

1. **Production configuration for Sprint 2:**
   - New tRPC routers registered and accessible (`app.catalog`, `app.deployment`, `monitor`, `domain`)
   - BullMQ `deploy-app` queue configured with production concurrency limits
   - Alert evaluation engine active: threshold checks running against incoming metrics
   - Email service configured with production SMTP credentials
   - CSRF double-submit cookie middleware active on all mutations (B-258 fix)
   - Audit logging covers all Sprint 2 operations (B-259 fix)
   - Secrets rotation endpoints active (B-260 fix)

2. **Endpoint validation — Sprint 2 production:**
   - `app.catalog.list` and `app.catalog.get` return seeded catalog data
   - `app.deployment.create` enqueues job successfully (dry-run or test server)
   - `monitor.dashboard` returns aggregated data for connected servers
   - `monitor.alerts.list` returns empty (no alerts yet — expected)
   - `user.auditLog` returns audit entries with pagination
   - SSE endpoint streams `deployment.progress`, `metrics.update`, `alert.created` event types
   - CSRF token validated on all mutation endpoints

3. **Sprint 1 regression validation:**
   - Auth flows still work (signup, login, session, logout, reset)
   - Server connection flows still work (test, provision, dashboard presence)
   - All Sprint 1 tRPC procedures still respond correctly

### Task Creation Expectations

- 1 Task for Sprint 2 production configuration and endpoint validation

### Acceptance Criteria (PO Evaluation)

- All Sprint 2 tRPC procedures functional in production
- BullMQ deploy-app queue operational
- Alert evaluation running against production metrics
- CSRF enforced on all mutations (Sprint 1 + Sprint 2)
- Audit logging active for Sprint 2 operations
- Sprint 1 endpoints still functional (no regressions)
- Structured logging outputs Sprint 2 operation events

### Dependencies

- DBA Sprint 2 migrations completed + catalog seeded
- DevOps alert email infrastructure ready

### Available Skills

- `trpc-type-safety` — Production tRPC validation
- `bullmq-specialist` — Production queue configuration
- `security-best-practices` — CSRF, audit log, secrets rotation production config

---

## Brief: Frontend Developer (P7 — Production Build)

### Objective

Build the production Next.js bundle with Sprint 2 pages. Validate all Sprint 2 screens render correctly against the production API. Verify B-251 focus management fix in production.

### Expected Outputs

1. **Production build:**
   - `pnpm build` exits 0 with production environment
   - Sprint 2 pages included: `/marketplace`, `/marketplace/[appId]`, `/deploy/[appId]/configure`, `/deploy/[appId]/summary`, `/deploy/[appId]/progress/[deploymentId]`, enhanced `/dashboard`, alert panel, remediation flows
   - Bundle size analysis: Sprint 2 additions documented
   - No unexpected bundle bloat from new pages

2. **Production UI validation — Sprint 2:**
   - Catalog page renders with ≥15 apps from seeded data
   - Configuration wizard generates forms from `configSchema`
   - Deployment progress page connects to SSE endpoint
   - Dashboard resource gauges render with live data
   - Alert panel renders (empty state expected initially)
   - No hydration errors on any Sprint 2 page
   - No `console.error` in production mode

3. **Bug fix validation:**
   - B-251: Focus management on route transitions verified in production
   - Navigation between Sprint 1 and Sprint 2 pages transitions focus correctly

4. **Sprint 1 regression:**
   - All Sprint 1 screens still render correctly
   - Auth pages, wizard pages, dashboard — no visual regressions

### Task Creation Expectations

- 1 Task for Sprint 2 production build and validation

### Acceptance Criteria (PO Evaluation)

- `pnpm build` exits 0
- No hydration mismatches on any Sprint 2 page
- All Sprint 2 screens render correctly with production data
- Catalog shows seeded apps with correct data
- Focus management works in production (B-251)
- No Sprint 1 visual regressions
- Bundle size documented in deployment report

### Dependencies

- BE Sprint 2 production configuration complete
- DevOps deployment infrastructure updated

### Available Skills

- `nextjs-app-router-patterns` — Production build, SSR validation
- `tailwind-design-system` — Production CSS optimization

---

## Brief: Testing Agent (P7 — Smoke Tests)

### Objective

Run smoke tests against the deployed production environment to verify Sprint 2 user journeys + bug fix regressions work end-to-end. This is the final quality gate before Sprint 2 is considered deployed.

### Smoke Test Scenarios

**Sprint 1 regression (must all pass):**
1. ✅ Homepage loads (HTTP 200, no console errors)
2. ✅ Signup: create new account → redirect to dashboard
3. ✅ Login: existing account → session → dashboard loads
4. ✅ Logout: session destroyed → redirect to login
5. ✅ Server wizard: form renders, validation works

**Sprint 2 critical path (must all pass):**
6. ✅ Catalog: `/marketplace` loads, ≥15 apps displayed
7. ✅ Catalog filter: select category → filtered results
8. ✅ Catalog detail: click app → detail page with description and "Deploy" CTA
9. ✅ Config wizard: enter `/deploy/[appId]/configure` → form renders from schema
10. ✅ Dashboard: resource gauges render, app tiles visible, SSE connection active
11. ✅ Alert panel: alert list renders (empty state or active alerts)
12. ✅ Audit log: `/settings` → audit log section visible

**Bug fix regression (must all pass):**
13. ✅ CSRF: mutation without token returns 403 (B-258)
14. ✅ CSRF: mutation with valid token succeeds (B-258)
15. ✅ Focus management: route transition moves focus (B-251)
16. ✅ Audit logging: perform action → audit entry created (B-259)
17. ✅ Sudoers: provisioning result has correct file permissions (B-262)

**Extended (should pass):**
18. ✅ Mobile responsive: catalog + dashboard at 375px
19. ✅ HTTPS: all pages served over TLS, no mixed content
20. ✅ Stale data indicator: appears when metrics >120s old (if testable)
21. ✅ SSE fallback: polling works when SSE unavailable
22. ✅ Empty states: dashboard with no apps shows catalog CTA

### Expected Outputs

1. **Smoke test report** — artifact documenting:
   - Scenario pass/fail status (Sprint 1 regression + Sprint 2 + bugs)
   - Response times for critical paths (dashboard < 3s, API < 2s)
   - Screenshots of Sprint 2 screens (evidence)
   - Any production-only issues discovered

2. **Bug work items** — Created for production-specific failures

### Task Creation Expectations

- 1 Task for Sprint 2 smoke test execution and reporting

### Acceptance Criteria (PO Evaluation)

- All 5 Sprint 1 regression scenarios pass
- All 7 Sprint 2 critical path scenarios pass
- All 5 bug fix regression scenarios pass
- Extended scenarios pass (or documented known limitations)
- No production-only errors discovered
- Response times < 3s for page loads, < 2s for API calls
- Smoke test report published as artifact

### Dependencies

- FE + BE production verification complete
- Production environment fully deployed with Sprint 2

### Available Skills

- `playwright-best-practices` — Production E2E testing
- `vitest` — API smoke test utilities

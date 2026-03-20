---
artifact: acceptance-report-sprint2
produced-by: product-owner
project-slug: unplughq
work-item: task-318-po-p6-acceptance-sprint2
work-item-type: task
parent-work-item: epic-001-unplughq-platform
workflow-tier: full
phase: P6
version: 1.0.0
status: draft
consumed-by:
  - product-manager
  - release-train-engineer
  - scrum-master
date: 2026-03-18
azure-devops-id: 318
review:
  reviewed-by:
  reviewed-date:
---

# Sprint 2 Acceptance Report — UnplugHQ PI-2

## 1. Executive Summary

| Metric | Value |
|--------|-------|
| Sprint | PI-2 Sprint 2 |
| Branch | `feat/pi-2-sprint-2` |
| Epic | AB#180 |
| Stories delivered | 8 (S-202 through S-209) |
| Story points delivered | 54 of 54 (F2: 33 SP, F3: 21 SP) |
| Bug fixes targeted | 5 (B-258, B-259, B-260, B-262, B-251) |
| Bug fixes fully resolved | 3 (B-258, B-259, B-262) |
| Bug fixes partial | 2 (B-260, B-251) |
| P5 remediation bugs fixed | 6 of 6 (AB#303, AB#304, AB#306, AB#307, AB#309, AB#310) |
| Build health | GREEN — typecheck ✅, lint ✅, build ✅, 493/493 tests ✅ |
| **Overall decision** | **CONDITIONAL ACCEPT** |

---

## 2. Story-by-Story Acceptance

### 2.1 Feature F2 — Application Catalog & Deployment (AB#182)

#### S-202: Application Catalog Browsing (AB#202) — ✅ ACCEPTED

| AC Scenario | Evidence | Verdict |
|-------------|----------|---------|
| Browse catalog by category | FE: category filtering with `<button aria-pressed>` elements; BE: `app.catalog.list` + `categories` procedures; DB: `catalog_apps` table with `catalog_apps_category_idx` | ✅ |
| Catalog entry completeness | DB seed: 18 curated apps across 9 categories (exceeds 15 minimum); schema includes name, description, category, min resource requirements, upstream URL | ✅ |
| Catalog browsing without server | BE: `catalog.list` and `catalog.get` are public procedures (no auth required); FE: deployment gated on provisioned server | ✅ |
| Search for apps | FE: deferred search with `aria-live="polite"` result count announcements; A11Y: keyboard-accessible search input | ✅ |

**Test evidence:** `catalog-service.test.ts`, `app-router.test.ts` — all passing.

---

#### S-203: Guided App Configuration (AB#203) — ✅ ACCEPTED

| AC Scenario | Evidence | Verdict |
|-------------|----------|---------|
| Per-app guided configuration | FE: `deploy/[appId]/configure` with per-app `configSchema` from catalog; fields use non-technical `<Label>` text | ✅ |
| Sensible defaults | FE: schema defaults pre-filled; minimum fields: deployment domain + admin email | ✅ |
| Domain validation | FE: `aria-invalid` + `aria-describedby`; BE: RFC 1035 regex validation on `DeployAppInput`; DNS warning without blocking | ✅ |
| Configuration summary | FE: summary screen before deployment; configuration persisted through review/edit loops | ✅ |

**Test evidence:** `zod-schema-validation-sprint2.test.ts`, `app-router.test.ts` — all passing.

**Note:** A11Y finding A-04 (wizard step focus not managed on `goNext()`/`goBack()`) filed as AB#312 — deferred to PI-3. Does not block functional AC.

---

#### S-204: Application Deployment with Progress (AB#204) — ✅ ACCEPTED

| AC Scenario | Evidence | Verdict |
|-------------|----------|---------|
| Single-action deployment | BE: `deployment.create` enqueues BullMQ `deploy-app` job; FE: single "Deploy" button from summary | ✅ |
| Real-time deployment progress | FE: SSE-driven phase display with user-friendly labels; BE: `deploy-app` handler transitions pulling → configuring → provisioning-ssl → starting → running | ✅ |
| Background deployment with navigation | FE: deployment continues in background; dashboard reflects deployment progress | ✅ |
| Automatic SSL certificate provisioning | BE: `provisioning-ssl` phase in deploy handler; Caddy ACME integration via SSH template | ✅ |
| Automatic reverse proxy configuration | BE: `caddy-route-management.test.ts` verifies non-disruptive route addition; Caddy admin API via localhost | ✅ |
| Deployment server health gate | BE: `evaluateResourceFit()` checks server health before deploy; returns clear message on unhealthy server | ✅ |
| Tier limit enforcement | BE: `ensureDeploymentCapacity()` checks `TierLimits[tier].maxApps` before deployment | ✅ |

**Test evidence:** `deployment-state-machine.test.ts`, `caddy-route-management.test.ts`, `app-router.test.ts`, `deploy-app-lifecycle.test.ts` — all passing.

---

#### S-205: Post-Deployment Verification (AB#205) — ✅ ACCEPTED

| AC Scenario | Evidence | Verdict |
|-------------|----------|---------|
| Successful health check | BE: `health-check-service.ts` with exponential backoff (2s/4s/8s, 3 attempts, 20s timeout); transitions to "running" on success | ✅ |
| Failed health check with guidance | BE: "unhealthy" status with user-friendly failure reason; FE: guided next steps displayed | ✅ |
| Dashboard access link | FE: clickable domain link shown only when app status is "running" | ✅ |

**Test evidence:** `health-check-service.test.ts`, `deploy-app-lifecycle.test.ts` — all passing.

---

#### S-206: Multi-App Coexistence (AB#206) — ✅ ACCEPTED

| AC Scenario | Evidence | Verdict |
|-------------|----------|---------|
| Non-disruptive second app deployment | BE: Caddy admin API adds routes without restart; `caddy-route-management.test.ts` verifies existing routes preserved | ✅ |
| Independent status tracking | FE: per-app status indicators on dashboard; BE: per-deployment status tracked independently | ✅ |
| Resource awareness | BE: `evaluateResourceFit()` + `checkResourceFit` procedure; FE: resource impact visible before deploy | ✅ |

**Test evidence:** `caddy-route-management.test.ts`, `domain-router.test.ts` — all passing.

---

### 2.2 Feature F3 — Dashboard & Health Monitoring (AB#183)

#### S-207: Dashboard Overview (AB#207) — ✅ ACCEPTED

| AC Scenario | Evidence | Verdict |
|-------------|----------|---------|
| Server resource display | FE: `ResourceGauge` with `role="meter"` for CPU, RAM, disk, network; BE: `monitor.dashboard` + `serverMetrics` procedures; DB: `metrics_snapshots` with tenant scoping | ✅ |
| App status indicators | FE: `AppStatusBadge` with distinct states (running, stopped, unhealthy, updating); color + text label (not color alone) | ✅ |
| App access links | FE: clickable domain link shown only when app is running | ✅ |
| Empty state | FE: encouraging empty state with CTA to deploy first app | ✅ |
| Dashboard performance | BE: tenant-scoped queries with appropriate indexes; SSE for real-time updates; polling fallback | ✅ (code-level; no E2E perf test) |

**Test evidence:** `monitor-router.test.ts`, `sse-events.test.ts` — all passing.

---

#### S-208: Health Alert Notifications (AB#208) — ✅ ACCEPTED

| AC Scenario | Evidence | Verdict |
|-------------|----------|---------|
| App unavailability alert | BE: `alert-service.ts` evaluates app-unavailable condition; email notification via `send-alert` BullMQ job | ✅ |
| Resource threshold alerts | BE: CPU >90%, RAM >90%, disk >85% thresholds evaluated; notification triggered | ✅ |
| Alert notification suppression | BE: respects notification preferences from account settings; dashboard alerts still display | ✅ |
| Monitoring accuracy | BE: `process-metrics` handler evaluates on each snapshot; alert deduplication via `isActiveAlertPresent()` | ✅ |
| Dashboard alert display | FE: `role="region" aria-label="Active alerts" aria-live="polite"` wraps alert banner container; severity + timestamp displayed | ✅ |

**Test evidence:** `alert-evaluation.test.ts`, `email-notification.test.ts`, `monitor-router.test.ts`, `alert-pipeline.test.ts`, `sse-events.test.ts` — all passing.

---

#### S-209: Alert Management and Guided Remediation (AB#209) — ✅ ACCEPTED

| AC Scenario | Evidence | Verdict |
|-------------|----------|---------|
| Acknowledge alert | FE: acknowledge action with expand/collapse pattern (`aria-expanded` + `aria-controls`); BE: `alerts.acknowledge` mutation with tenant scoping | ✅ |
| Dismiss alert | BE: `alerts.dismiss` sets `dismissed_at`; re-trigger prevention via `alerts_tenant_server_type_dismissed_idx` | ✅ |
| Disk usage breakdown | BE: `process-metrics` stores per-container `diskUsageBytes` in `metrics_snapshots.containers` JSONB; FE: per-app breakdown on alert detail | ✅ |
| Guided remediation for known alert types | FE: `alerts/[alertId]/remediate` with step-by-step non-technical guidance; BE: `alerts.remediation` returns remediation plans for known types | ✅ |
| Alert type coverage | BE: cpu-critical, ram-critical, disk-critical, app-unavailable, server-unreachable all supported | ✅ |

**Test evidence:** `alert-evaluation.test.ts`, `monitor-router.test.ts`, `alert-pipeline.test.ts` — all passing.

---

## 3. Bug Fix Verification Status

### 3.1 PI-1 Deferred Bugs

| Bug | Title | Verdict | Evidence |
|-----|-------|---------|----------|
| B-258 (AB#258) | Missing CSRF double-submit cookie | ✅ **RESOLVED** | SEC: IMPLEMENTED — `__Host-csrf` cookie, HMAC-SHA256, `timingSafeEqual`, all mutations use `protectedMutationProcedure`. TST: `csrf-middleware.test.ts` passing. |
| B-259 (AB#259) | Insufficient audit logging | ✅ **RESOLVED** | SEC: IMPLEMENTED — middleware-level capture on all protected mutations, 90-day retention, paginated query. TST: `audit-logging.test.ts` + `user-router.test.ts` passing. |
| B-260 (AB#260) | Secrets rotation | ⚠️ **PARTIAL** | API token rotation: ✅ works. SSH key rotation: ❌ generates `randomBytes(48)` wrapped in PEM headers — not a valid Ed25519 key. Server becomes inaccessible after rotation. Filed as AB#303 (HIGH, CVSS 7.1). **Fixed in P5 remediation cycle** — see §4, AB#303. |
| B-262 (AB#262) | Broken sudoers ownership | ✅ **RESOLVED** | SEC: IMPLEMENTED — `root:root`, `0440`, `visudo -c`, explicit package lists (no wildcards), no shell access. Code review confirms correctness. |
| B-251 (AB#251) | Focus management on dynamic content | ⚠️ **PARTIAL** | Route focus to `<main>`/heading: ✅. Screen reader announcements: ✅. `useFocusReturn` hook: ✅ (runtime verification pending). Wizard step focus: ❌ (A-04/AB#312, deferred PI-3). Deploy phase aria-live: ❌ (A-01/AB#309, **fixed in remediation** — see §4). |

**Summary:** 3/5 fully resolved. B-260 SSH portion fixed via AB#303 remediation. B-251 partially complete with 2 of 4 sub-items needing further work (1 fixed in remediation, 1 deferred).

---

## 4. P5 Remediation Verification

Six P1 blockers were triaged by PO, delegation briefs issued, and code fixes delivered by BE and FE agents. All 6 are verified resolved.

### 4.1 Security HIGH Fixes (BE Agent)

| Bug | Finding | Fix Description | Verdict |
|-----|---------|----------------|---------|
| AB#303 | F-01: SSH key rotation non-functional | `rotateSSHKey` now generates proper Ed25519 keypair via `generateKeyPairSync('ed25519')`. Public key deployed to VPS via SSH before DB update. Rollback on failure. | ✅ **RESOLVED** |
| AB#304 | F-02: Config injection via arbitrary env vars | `validateConfigAgainstSchema()` now strips keys not in `configSchema`. ENV_VAR_PATTERN validation on all keys. UNSAFE_CONFIG_PATTERN on all values. Blocklist rejects NODE_OPTIONS, LD_PRELOAD, PATH, etc. | ✅ **RESOLVED** |
| AB#306 | F-03: Monitoring agent SSH template unhardened | `start-monitoring-agent` template now includes `--read-only`, `--security-opt=no-new-privileges`, `--cap-drop=ALL`, `--tmpfs /tmp:rw,noexec,nosuid,size=16m` — matching `deploy-agent.sh`. | ✅ **RESOLVED** |
| AB#307 | F-04: User app containers missing security-opt | `docker-run` template now includes `--security-opt=no-new-privileges` after `--restart unless-stopped`. | ✅ **RESOLVED** |

### 4.2 Accessibility Critical Fixes (FE Agent)

| Bug | Finding | Fix Description | Verdict |
|-----|---------|----------------|---------|
| AB#309 | A-01: Deploy phase transitions not announced | `aria-live="polite" aria-atomic="true"` sr-only region added to deploy progress page. Content updates on each SSE phase change. `aria-valuetext` added to progressbar with human-readable phase info. | ✅ **RESOLVED** |
| AB#310 | A-02: SSE alerts not announced | `aria-live="assertive"` sr-only region added to alerts page for new alert announcements. `aria-live="polite"` region added for acknowledge/dismiss results. | ✅ **RESOLVED** |

### 4.3 Post-Remediation Build Health

Per verification-summary-sprint2.md, after all fixes:

| Command | Result |
|---------|--------|
| `pnpm typecheck` | ✅ PASS — zero errors |
| `pnpm lint` | ✅ PASS — zero warnings |
| `pnpm build` | ✅ PASS — all routes compiled |
| `pnpm test` | ✅ PASS — 493/493 tests, 0 failures |

---

## 5. Acceptance Matrix Summary

### Stories

| Story | Feature | SP | Verdict |
|-------|---------|-----|---------|
| S-202 | F2 — App Catalog Browsing | 5 | ✅ ACCEPTED |
| S-203 | F2 — Guided App Configuration | 5 | ✅ ACCEPTED |
| S-204 | F2 — Application Deployment | 13 | ✅ ACCEPTED |
| S-205 | F2 — Post-Deployment Verification | 5 | ✅ ACCEPTED |
| S-206 | F2 — Multi-App Coexistence | 5 | ✅ ACCEPTED |
| S-207 | F3 — Dashboard Overview | 8 | ✅ ACCEPTED |
| S-208 | F3 — Health Alert Notifications | 8 | ✅ ACCEPTED |
| S-209 | F3 — Alert Management & Remediation | 5 | ✅ ACCEPTED |
| **Total** | | **54 SP** | **8/8 ACCEPTED** |

### Bug Fixes

| Bug | Verdict | Notes |
|-----|---------|-------|
| B-258 CSRF | ✅ RESOLVED | |
| B-259 Audit Logging | ✅ RESOLVED | |
| B-260 Secrets Rotation | ⚠️ CONDITIONAL | API token rotation ✅. SSH key rotation fixed in AB#303 remediation ✅. Agent token restart not addressed (SEC F-08 — MEDIUM, deferred PI-3). |
| B-262 Sudoers | ✅ RESOLVED | |
| B-251 Focus Management | ⚠️ CONDITIONAL | Route focus ✅. Deploy phase announcements fixed via AB#309 ✅. Wizard step focus deferred (AB#312 → PI-3). Modal focus return pending runtime verification. |

### P5 Remediation

| Bug | Verdict |
|-----|---------|
| AB#303 (SEC F-01) SSH key rotation | ✅ RESOLVED |
| AB#304 (SEC F-02) Config injection | ✅ RESOLVED |
| AB#306 (SEC F-03) Agent hardening | ✅ RESOLVED |
| AB#307 (SEC F-04) Container security-opt | ✅ RESOLVED |
| AB#309 (A11Y A-01) Deploy phase aria-live | ✅ RESOLVED |
| AB#310 (A11Y A-02) Alerts SSE aria-live | ✅ RESOLVED |

---

## 6. Overall Sprint Acceptance Decision

### **CONDITIONAL ACCEPT**

All 8 Sprint 2 stories meet their acceptance criteria and are accepted. The core Sprint 2 features — Application Catalog & Deployment (F2) and Monitoring & Alerts (F3) — are functionally complete, tested, and ready for deployment with the conditions below.

### Conditions for Unconditional Release

The following items must be tracked and resolved before production deployment or in early PI-3:

| # | Item | Severity | Disposition |
|---|------|----------|-------------|
| 1 | SEC F-07: SSE session re-validation on heartbeat | MEDIUM (CVSS 6.2) | Fix in PI-3 Sprint 1 — session invalidation leaves SSE stream open |
| 2 | SEC F-08: Agent token rotation doesn't restart container | MEDIUM (CVSS 5.0) | Fix in PI-3 Sprint 1 — old agent keeps running with invalid token |
| 3 | A11Y A-03/AB#311: Input border contrast ~1.6:1 | SERIOUS | Fix in PI-3 Sprint 1 — persistent since Sprint 1, requires `--color-border-base` token change |
| 4 | A11Y A-04/AB#312: Config wizard step focus | SERIOUS | Fix in PI-3 Sprint 1 — degraded keyboard UX in wizard flow |
| 5 | CF-01 dark mode contrast verification | VERIFY | Measure with axe-core in rendered dark mode — estimated 3.8–4.3:1 |

### Accepted Deferrals (PI-3 Backlog)

| Item | Priority |
|------|----------|
| SEC F-05: Catalog detail endpoint unfiltered | P2 |
| SEC F-06: Deployment state machine validation | P2 |
| SEC F-09: Monitoring agent image not digest-pinned | P2 |
| SEC F-10: Per-phase deployment logging | P3 |
| SEC F-11: Password min-length client/server mismatch | P3 |
| SEC F-12: Volume mount path validation | P3 |
| SEC D-01: Global API rate limiting (PI-1 carryover) | P2 |
| A11Y A-05: Dashboard stale data not live-announced | P2 |
| A11Y A-06: Remediation action feedback not announced | P2 |
| A11Y A-07: Alert acknowledge result not announced | P2 |
| A11Y A-08: Progressbar missing `aria-valuetext` | P3 |
| A11Y A-09: Marketplace detail missing dynamic `<title>` | P3 |
| A11Y A-10: Dark mode `--color-text-subtle` verification | P2 |
| A11Y A-11: Dashboard app links missing "(opens in new tab)" | P3 |
| A11Y A-12: Alert buttons use `title` vs `aria-label` | P3 |
| AB#300: Auth lockout flaky test | P3 |
| AB#301: Duplicate-email timing test threshold | P3 |
| Playwright E2E integration into `pnpm test` | P2 |

---

## 7. Sprint 2 Velocity & Quality Metrics

| Metric | Value |
|--------|-------|
| Stories accepted | 8/8 (100%) |
| Story points delivered | 54 SP |
| Bug fixes resolved | 3/5 fully + 2 conditional |
| P5 remediation resolved | 6/6 (100%) |
| Test count at sprint close | 493 (up from 226 in Sprint 1) |
| Test pass rate | 100% (current run) |
| Build health | All 4 checks passing (typecheck, lint, build, test) |
| New bugs filed during P5 | 10 (4 HIGH SEC, 2 Critical A11Y, 2 Serious A11Y, 2 Medium TST) |
| Bugs fixed in remediation | 6/6 P1 blockers |
| Remaining open bugs | 4 (deferred to PI-3) |

---

## 8. Artifact Evidence Index

| Artifact | Source | Key Finding |
|----------|--------|-------------|
| [test-report-sprint2.md](test-report-sprint2.md) | Testing (AB#299) | 493 tests passing, all S-202–S-209 covered, 2 flaky tests filed |
| [security-review-sprint2.md](security-review-sprint2.md) | Security (AB#302) | CONDITIONAL PASS — 4 HIGH fixed in remediation, 5 MEDIUM + 3 LOW deferred |
| [accessibility-report-sprint2.md](accessibility-report-sprint2.md) | A11Y (AB#308) | CONDITIONAL PASS — 2 Critical fixed in remediation, 2 Serious deferred |
| [verification-summary-sprint2.md](verification-summary-sprint2.md) | Tech Lead (AB#313) | Build green, CONDITIONAL PASS with remediation conditions met |
| [delegation-briefs-remediation-sprint2.md](delegation-briefs-remediation-sprint2.md) | PO (AB#314) | 6 "Fix Now" + 4 "Defer PI-3" triage decisions |
| [backend-sprint2.md](backend-sprint2.md) | BE (AB#180) | 25 files changed, 2593 insertions; tRPC routers, services, middleware |
| [fe-sprint2-implementation.md](fe-sprint2-implementation.md) | FE (AB#296) | Marketplace, deploy flow, dashboard, alerts, focus management |
| [database-schema-sprint2.md](database-schema-sprint2.md) | DBA (AB#292) | catalog_apps, deployments, alerts tables; 18 seed apps |
| [build-verification-sprint2.md](build-verification-sprint2.md) | TL (AB#298) | P4 merge clean, all 4 sub-branches integrated, 493 tests passing |

---

## 9. PO Recommendation

**Recommend proceeding to Gate 7 (P6 → P7).** Sprint 2 delivers the two planned features (F2, F3) with all story acceptance criteria met, all P1 security and accessibility blockers remediated, and a stable green build. The remaining conditions are MEDIUM/SERIOUS severity items appropriate for PI-3 Sprint 1 backlog prioritization, not release blockers.

The PM should:
1. Approve this artifact and transition to P7 deployment planning
2. Create PI-3 backlog items for the 18 deferred items listed in §6
3. Schedule SEC F-07 (SSE session) and A11Y AB#311/AB#312 (border contrast, wizard focus) as P1 items in PI-3 Sprint 1

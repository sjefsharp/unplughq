---
artifact: delegation-briefs-p5
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
  - testing
  - security-analyst
  - accessibility
date: 2026-03-16
---

# Delegation Briefs — Phase 5 (Verification) — PI-2 Sprint 2

## P5 Execution Overview

Phase 5 follows: `TL → TEST ∥ SEC ∥ A11Y → TL`

1. **Tech Lead** verifies integrated build on feature branch (Gate 5 pre-check)
2. **Testing** executes E2E tests and validates test coverage
3. **Security Analyst** reviews code against threat model
4. **Accessibility** audits against WCAG 2.2 AA criteria
5. **Tech Lead** collates results, files bugs, determines pass/fail

### Context

- **Feature branch:** `feat/pi-2-sprint-2`
- All sub-branches merged by TL at P4 Step 2 end
- All code is integrated and build passes
- Sprint 2: 8 stories (AB#202–AB#209) + 5 bug fixes (AB#251, AB#258–260, AB#262)
- Sprint 1 delivered: 8 stories (AB#194–AB#201), 226 tests — all must still pass (regression)

---

## Brief: Tech Lead (P5 — Pre-Check)

### Objective

Run the full verification suite on the integrated feature branch. Confirm that build, typecheck, lint, audit, and all tests (Sprint 1 + Sprint 2) pass before specialist verification agents begin.

### Verification Checklist

```
pnpm install            → exit 0
pnpm typecheck          → exit 0
pnpm lint               → exit 0
pnpm build              → exit 0
pnpm test               → exit 0 (all Vitest tests — Sprint 1 + Sprint 2)
pnpm audit              → 0 critical/high findings
docker compose up       → all services healthy
pnpm db:migrate         → exit 0 (Sprint 2 migrations applied)
pnpm db:seed            → exit 0 (catalog seed data loaded)
```

### Expected Outputs

1. **Gate 5 pre-check report** — verification results document with pass/fail per command
2. Environment running with Sprint 2 schema applied and catalog seeded for Testing, SEC, and A11Y

### Task Creation Expectations

- 1 Task for Gate 5 pre-check verification

### Acceptance Criteria (PO Evaluation)

- All 9 verification commands pass
- Sprint 1 tests still pass (zero regressions)
- Sprint 2 test contracts pass
- Environment is running and accessible for specialist agents

---

## Brief: Testing Agent (P5)

### Objective

Execute all test contracts (unit, integration, E2E) against the integrated Sprint 2 codebase. Verify Sprint 1 regression. Report coverage metrics and file Bug work items for any failures.

### Artifact Inputs

| Artifact | Path | Key Data |
|----------|------|----------|
| Product Backlog | `docs/product-backlog.md` | Gherkin AC for Sprint 2 stories (S-202–S-209) + bugs (B-251, B-258–260, B-262) — test-to-AC traceability |
| Test contracts | `code/tests/` | Test files written at P4 Step 1 (Sprint 1 + Sprint 2) |
| API Contracts | `docs/api-contracts.md` | tRPC procedures for verification (§1.3–§1.6) |

### Expected Outputs

1. **Test execution report** — artifact documenting:
   - Sprint 1 regression: pass/fail count (all 226 tests must pass)
   - Sprint 2 test suite: pass/fail counts
   - Coverage metrics (line, branch, function) — target ≥80% for Sprint 2 code
   - Failing test details with reproduction steps
   - Acceptance criteria coverage matrix (AC → test → status) for Sprint 2

2. **Bug work items** — Created in Azure Boards for:
   - Failing test scenarios
   - Missing acceptance criteria coverage
   - Regression issues in Sprint 1 functionality

### E2E Test Scenarios (Sprint 2)

Execute the following Playwright scenarios:

**Catalog Track (F2):**
- Catalog browsing: navigate to `/marketplace`, verify ≥15 apps displayed
- Category filter: select "File Storage" → only matching apps shown
- Search: type partial name → matching results, empty search → all apps
- Catalog detail: click app card → detail page with description, requirements, upstream link
- Deploy gate: "Deploy" button disabled/hidden when no server provisioned

**Configuration Wizard:**
- Enter `/deploy/[appId]/configure` → dynamic form from configSchema
- Default values pre-filled
- Validation: required fields, email format, password visibility toggle
- Domain input: valid domain accepted, DNS warning shown (non-blocking)
- Server selection: auto-selected when single server, dropdown when multiple
- Summary page: all values shown, edit action returns to field, values preserved
- "Deploy" action: single click initiates deployment

**Deployment Progress:**
- Deployment initiated → redirect to progress page
- SSE events: phases update in sequence (pulling → configuring → provisioning-ssl → starting → running)
- Phase descriptions match non-technical copy from `copy-specs.md`
- Navigate away during deployment → return shows latest state
- Failure scenario: deployment fails → user-friendly error, retry button

**Post-Deployment Verification:**
- Successful deploy → "Your app is live!" with access URL
- Access URL opens in new tab
- "Go to Dashboard" CTA works
- Failed deploy → guided next steps

**Multi-App Coexistence:**
- Deploy second app → first app unaffected
- Dashboard shows both app tiles with independent status
- Remove second app → first app still running, dashboard updated

**Dashboard Track (F3):**
- Dashboard loads within 3 seconds
- Resource gauges: CPU, RAM, disk displayed as percentage bars
- Color coding: green (<70%), amber (70–89%), red (≥90%)
- App tiles: name, domain, status badge, access link
- SSE subscription: metrics update in real-time
- Stale data: simulate >120s without metrics → "Data stale" indicator appears
- Empty state: no apps → "Deploy your first app" CTA with catalog link

**Alerts & Remediation:**
- Alert list: active alerts sorted by severity
- Alert detail: expand inline, show full context
- Acknowledge alert: visual distinction from unacknowledged
- Dismiss alert: moves to "Recent", faded appearance
- Guided remediation: disk-critical → disk breakdown shown; app-unavailable → restart action
- One-click restart: click restart → app container restarts → health check → status updates
- Alert re-trigger: dismissed alert re-triggers only after condition clears and reoccurs

**Bug Regression:**
- CSRF: submit mutation without CSRF token → 403 response
- CSRF: valid CSRF token on mutation → succeeds
- Audit logging: deploy app → audit log entry exists with deploy action
- Audit logging: `/settings` → audit log section visible with entries
- Secrets rotation: rotate SSH key → server remains connected, new key active
- Sudoers: verify provisioning script sets correct file ownership
- Focus management: navigate between routes → focus moves to `<main>` or heading
- Focus management: open/close modal → focus returns to trigger element

**Cross-Cutting:**
- Sprint 1 auth flows still work (login, signup, reset password)
- Sprint 1 server wizard still works (connect, validate, provision)
- Keyboard navigation: Tab through all Sprint 2 screens
- Mobile responsive: All Sprint 2 flows functional at 375px viewport
- `prefers-reduced-motion`: animations disabled

### Task Creation Expectations

- 1 Task for test execution, Sprint 1 regression, and Sprint 2 reporting
- Bug work items as discovered (no limit)

### Acceptance Criteria (PO Evaluation)

- All Sprint 1 tests pass (226 tests — zero regressions)
- All Sprint 2 unit + integration tests pass
- All Sprint 2 E2E tests pass
- E2E tests cover every Gherkin scenario in Sprint 2 stories + bugs
- Coverage report shows ≥80% line coverage for new Sprint 2 code
- UJ1 complete flow verified end-to-end (register → deploy → dashboard)
- UJ4 alert response flow verified end-to-end (alert → acknowledge → remediate)
- Bug work items created for any failures (filed against parent Story/Bug)

### Dependencies

- TL pre-check passed (build compiles, environment running, schema migrated, catalog seeded)

### Available Skills

- `vitest` — Test execution, coverage configuration
- `playwright-best-practices` — E2E execution patterns

---

## Brief: Security Analyst (P5)

### Objective

Review all Sprint 2 implementation and 4 security bug fixes against the threat model. Verify that CSRF (B-258), audit logging (B-259), secrets rotation (B-260), and sudoers (B-262) fixes are correctly implemented. Evaluate new F2/F3 code for OWASP Top 10 compliance.

### Artifact Inputs

| Artifact | Path | Key Data |
|----------|------|----------|
| Threat Model | `docs/threat-model.md` | STRIDE threats, Sprint 2 additions, priority ratings |
| API Contracts | `docs/api-contracts.md` | §1.3 app router, §1.4 monitor router, §3.1 Docker SSH, §3.4 Caddy API |
| Architecture Overview | `docs/architecture-overview.md` | Deployment pipeline, alert engine, email service |
| Requirements | `docs/requirements.md` | BF-001–005, FR-F2-113 (env file not CLI), FR-F2-122 (volume isolation) |

### Review Scope

#### Bug Fix Verification (Priority)
- [ ] B-258 (CSRF): Double-submit cookie pattern implemented; token validated on ALL tRPC mutations and Server Actions; 403 on mismatch; token never in URL
- [ ] B-259 (Audit Logging): Every privileged operation logged (server ops, app deploy/stop/start/remove, config changes, credential rotation, alert actions); `user.auditLog` query returns paginated entries; 90-day retention in queries
- [ ] B-260 (Secrets Rotation): SSH key rotation generates new Ed25519 key, deploys to VPS, invalidates old; API token rotation issues new token, updates agent, invalidates old; no server disconnection during rotation; rotation events in audit log
- [ ] B-262 (Sudoers): File `root:root` 0440; passes `visudo -c`; no wildcard/ALL permissions; limited to Docker CLI + specific APT

#### Sprint 2 New Code — Spoofing & Tampering
- [ ] S-04/S-06: CSRF token validated on all new Sprint 2 mutations (deploy, stop, start, remove, dismiss alert, bind/unbind domain, rotate keys)
- [ ] T-01: Docker SSH commands in deploy-app job use parameterized templates — zero string concatenation
- [ ] T-02: All new tRPC inputs validated with `.strict()` Zod schemas
- [ ] T-03: Container image digest validation (`sha256:[a-f0-9]{64}`) — no tag-based pulls (R-20)
- [ ] T-04: Caddy Admin API calls via SSH tunnel to localhost only — not exposed externally
- [ ] T-08 (new): Environment files written via SFTP with `chmod 600` — credentials never in CLI args (FR-F2-113)

#### Sprint 2 New Code — Information Disclosure & DoS
- [ ] I-07: Tenant isolation on ALL new queries (catalog queries are public; deployment/alert/metrics queries are tenant-scoped)
- [ ] I-08 (new): Deployment config (env files) encrypted at rest; not logged; not returned in API responses beyond what user submitted
- [ ] D-06 (new): Tier-based app deployment limits enforced (`TierLimits[user.tier].maxApps`)
- [ ] D-07 (new): Deploy job rate limiting (concurrent deploy per server limit)
- [ ] D-05: BullMQ `deploy-app` job data validated with Zod before processing

#### Sprint 2 New Code — Elevation of Privilege
- [ ] E-01: `authed` middleware on all protected Sprint 2 procedures
- [ ] E-05 (new): App lifecycle mutations (stop/start/remove) verify `tenantId` ownership before execution
- [ ] E-06 (new): Domain bind/unbind verify both server and deployment owned by tenant
- [ ] E-04: Sudoers fix — SSH user limited permissions verified

#### Alert & Email Security
- [ ] Alert email: no sensitive data in email body (no config values, no credentials)
- [ ] Unsubscribe link uses signed token (not guessable user ID)
- [ ] Email DLQ does not expose alert details in error messages
- [ ] Alert dismissal requires auth — no unauthenticated alert manipulation

### Expected Outputs

1. **Security review report** — artifact documenting:
   - Bug fix verification: each fix rated implemented / partial / missing with code references
   - Sprint 2 new code: each mitigation rated implemented / partial / missing
   - Critical findings with CVSS score
   - Remediation guidance for any gaps
   - OWASP Top 10 (2021) mapping for new code

2. **Bug work items** — Created in Azure Boards for:
   - Incomplete bug fixes (severity: critical — these were already known issues)
   - New security gaps in Sprint 2 code (severity per CVSS)

### Task Creation Expectations

- 1 Task for security code review and report

### Acceptance Criteria (PO Evaluation)

- All 4 security bug fixes verified as complete (B-258, B-259, B-260, B-262)
- Zero critical/high unmitigated findings in Sprint 2 code (or Bug work items created)
- Docker SSH command injection prevention verified with specific code references
- Tenant isolation verified for every new deployment/alert/metrics query
- CSRF validated on every mutation endpoint (Sprint 1 + Sprint 2)
- Environment file handling verified secure (SFTP, chmod 600, no CLI args)
- Image digest validation verified (no tag-based pulls)

### Dependencies

- TL pre-check passed (code on feature branch, buildable)

### Available Skills

- `security-best-practices` — OWASP patterns, code review methodology, CSRF validation
- `authjs-skills` — Auth.js v5 CSRF integration, session security

---

## Brief: Accessibility Agent (P5)

### Objective

Audit all Sprint 2 screens against WCAG 2.2 AA criteria. Verify the focus management bug fix (B-251). Verify Sprint 1 A11Y remediations still hold. Run both automated and manual accessibility checks.

### Artifact Inputs

| Artifact | Path | Key Data |
|----------|------|----------|
| WCAG Audit | `docs/wcag-audit.md` | Critical findings from P2, Sprint 2 screen requirements |
| Accessibility Guidelines | `docs/accessibility-guidelines.md` | ARIA patterns for catalog, forms, progress, alerts, dashboard |
| Wireframes | `docs/wireframes.md` | Screens 5–10 (catalog, config, deploy, dashboard, alerts, remediation) |
| Design System | `docs/design-system.md` | Color tokens, contrast values, focus ring styles |
| Copy Specs | `docs/copy-specs.md` | Microcopy for screen reader announcements |

### Audit Scope

#### Bug Fix Verification (Priority)
- [ ] B-251: Route transitions move focus to `<main>` element or page heading
- [ ] B-251: Modal close returns focus to triggering element
- [ ] B-251: Focus trap in modals fully released on close
- [ ] B-251: Dynamic content (deploy progress, alert creation) uses `aria-live` regions
- [ ] B-251: Screen readers announce new page context on navigation

#### Sprint 2 Screens
1. `/marketplace` — Catalog browsing (grid, filters, search)
2. `/marketplace/[appId]` — Catalog detail
3. `/deploy/[appId]/configure` — Configuration wizard (dynamic form)
4. `/deploy/[appId]/summary` — Configuration summary
5. `/deploy/[appId]/progress/[deploymentId]` — Deployment progress (SSE real-time)
6. `/dashboard` — Enhanced dashboard (resource gauges, app tiles, alerts)
7. Alert list panel (sidebar/modal)
8. Alert detail expansion (inline panel)
9. Guided remediation flows (disk breakdown, restart, suggestions)

#### Sprint 2 A11Y-Specific Checks
- [ ] Catalog search: `role="search"` landmark; live results announced
- [ ] Config wizard: All form fields have `<label>` with `htmlFor`; grouped fields use `<fieldset>` + `<legend>`; validation errors use `aria-invalid` + `aria-errormessage`
- [ ] Deploy progress: progress indicator uses `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`; phase transitions announced via `aria-live`
- [ ] Dashboard gauges: resource meters use `role="meter"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`; color encoding has text labels
- [ ] Alert list: `role="alert"` or `aria-live="assertive"` for new alert announcements
- [ ] Alert badges: severity uses color + text label (never color alone)
- [ ] Stale data indicator: announced via `aria-live` when data becomes stale
- [ ] All interactive elements in Sprint 2 reachable via keyboard
- [ ] Tab order matches visual reading order on all new screens
- [ ] `prefers-reduced-motion` respected for deployment animations, gauge transitions, alert animations
- [ ] `autocomplete` attributes on config wizard form fields where applicable

#### Sprint 1 Regression
- [ ] CF-01: `--color-text-subtle` contrast still ≥ 4.5:1
- [ ] CF-02: Input field borders still ≥ 3:1
- [ ] CF-03: Sprint 1 form fieldsets still correct
- [ ] CF-04: Alt text still present on Sprint 1 icons
- [ ] CF-05: Keyboard alternatives still available
- [ ] Sprint 1 screen keyboard navigation still works

### Expected Outputs

1. **Accessibility audit report** — artifact documenting:
   - B-251 fix verification: pass/fail per criterion
   - Sprint 1 regression: all 5 critical findings still remediated
   - Per-screen audit results for Sprint 2 (pass/fail per WCAG criterion)
   - axe-core automated scan results for Sprint 2 pages
   - Manual keyboard navigation results for Sprint 2 screens
   - Screen reader compatibility notes (NVDA/VoiceOver) for deploy progress, alerts, gauges

2. **Bug work items** — Created in Azure Boards for:
   - Incomplete B-251 fix (if any focus management gaps remain)
   - New WCAG AA violations in Sprint 2 screens
   - Screen reader compatibility issues with real-time content
   - Keyboard trap or focus management issues

### Task Creation Expectations

- 1 Task for Sprint 2 WCAG audit and reporting

### Acceptance Criteria (PO Evaluation)

- B-251 focus management fix verified across all route transitions
- All Sprint 1 critical findings still remediated (zero regressions)
- Zero new WCAG 2.2 AA violations at Level A in Sprint 2 (or Bug work items created)
- Config wizard: every field has associated `<label>`, validation errors announced
- Deploy progress: real-time updates announced without visual-only cues
- Dashboard gauges: data conveyed via text, not color alone
- Alert creation: new alerts announced to screen readers
- All Sprint 2 interactive elements keyboard-accessible
- Tab order correct on all Sprint 2 screens
- `prefers-reduced-motion` verified for all Sprint 2 animations

### Dependencies

- TL pre-check passed (application running with Sprint 2 code for live testing)

### Available Skills

- `web-accessibility` — WCAG testing methodology, automated + manual, ARIA pattern validation
- `playwright-best-practices` — For assistive technology simulation and axe-core integration

---

## Tech Lead Brief: P5 End (Bug Triage)

### Objective

Collate verification results from Testing, SEC, and A11Y. Create a consolidated verification summary. Triage bugs by severity. Determine Sprint 2 pass/fail status.

### Expected Outputs

1. **Verification summary** — consolidated report with:
   - Sprint 1 regression: all tests pass, no A11Y/SEC regressions
   - Sprint 2 test results: pass/fail counts, coverage
   - Bug fix verification: B-258, B-259, B-260, B-262, B-251 — all confirmed?
   - Security review status: Sprint 2 mitigations verified
   - A11Y audit status: Sprint 2 WCAG criteria met
   - Bug count by severity (Sprint 2 new bugs)
   - Sprint 2 gate recommendation: PASS / CONDITIONAL PASS / FAIL

### Task Creation Expectations

- 1 Task for verification triage and summary

### Gate 5 Decision Criteria

- **PASS:** All tests pass (Sprint 1 + Sprint 2), all 5 bug fixes verified, zero critical/high new bugs, WCAG AA compliant
- **CONDITIONAL PASS:** Minor new bugs exist, none blocking deployment, all 5 bug fixes verified
- **FAIL:** Any security bug fix incomplete, critical new security/a11y findings, or Sprint 1 regression → re-iteration required

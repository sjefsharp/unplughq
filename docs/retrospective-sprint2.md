---
artifact: retrospective-sprint2
produced-by: scrum-master
project-slug: unplughq
work-item: task-324-sm-p8-retrospective-sprint2
work-item-type: task
parent-work-item: epic-001-unplughq-platform
workflow-tier: full
phase: P8
version: 1.0.0
status: draft
consumed-by:
  - product-manager
  - product-owner
  - release-train-engineer
date: 2026-03-19
azure-devops-id: 324
review:
  reviewed-by:
  reviewed-date:
---

# Sprint 2 Retrospective Report — UnplugHQ PI-2

## 1. Sprint Summary

| Metric | Sprint 1 | Sprint 2 | Delta |
|--------|----------|----------|-------|
| **Sprint duration** | 4 days (03-13 → 03-16) | 4 days (03-16 → 03-19) | — |
| **Stories committed** | 8 (47 SP) | 8 (54 SP) | +7 SP (+15%) |
| **Stories delivered** | 8/8 (100%) | 8/8 (100%) | Sustained |
| **Features delivered** | 2 (F1 Server, F4 Auth) | 2 (F2 App Catalog, F3 Monitoring) | Sustained |
| **Tests at sprint close** | 226 | 542 | +316 (+140%) |
| **Test pass rate** | 100% | 100% | Sustained |
| **Bugs found at P5** | 16 | 10 | -6 (-37.5%) |
| **Bugs fixed in sprint** | 11 (68.75%) | 9 (6 P1 remediated + 3/5 PI-1 deferred) | Improved |
| **Bugs deferred** | 5 | 4 (to PI-3) | -1 |
| **Agent tasks** | 41 | 30+ across P1-P8 | Leaner |
| **Gates passed** | 8/8 (G6 conditional) | 8/8 (G6 conditional, resolved) | Consistent |
| **Velocity** | 47 SP | 54 SP | +7 SP (+15%) |
| **PO acceptance** | ACCEPT | CONDITIONAL ACCEPT | See §3 |

---

## 2. What Went Well

### 2.1 Complete Scope Delivery — 100% Again

All 8 committed stories (S-202 through S-209) were delivered and accepted by the PO across two features: F2 (Application Catalog & Deployment, 33 SP) and F3 (Dashboard & Health Monitoring, 21 SP). This sustains Sprint 1's 100% scope adherence. Combined PI-2 delivery: 4 of 4 planned features (F1–F4) completed across two sprints, fulfilling all PI-1/PI-2 objectives.

### 2.2 Velocity Increase (+15%)

Sprint 2 delivered 54 SP versus Sprint 1's 47 SP — a 15% velocity improvement while also carrying 5 deferred bug fixes. The team absorbed additional complexity (deployment pipeline, SSE real-time monitoring, alert evaluation engine) without reducing throughput. This establishes a sustainable velocity range of 47–54 SP for future planning.

### 2.3 Significant Bug Rate Reduction (-37.5%)

P5 verification discovered 10 new bugs versus Sprint 1's 16 — a 37.5% reduction in defect discovery. The bug-to-story ratio improved from 2.0 to 1.25. This improvement is attributable to:

- **Stronger upstream artifacts:** SA's architecture overview v2.0.0 covered deployment and monitoring attack surfaces. SEC's threat model v2.0.0 provided explicit deployment security requirements (E-01 through E-06) that code agents followed.
- **Sprint 1 lessons applied:** Bug-first sequencing addressed B-258 (CSRF), B-259 (audit logging), B-260 (secrets rotation), and B-262 (sudoers hardening) early — preventing architectural debt from compounding.

### 2.4 Effective P5 Remediation Cycle

Six P1 blockers (4 HIGH security, 2 Critical accessibility) were identified, triaged by PO, delegated to BE and FE agents, fixed, and verified — all within the sprint. The PO's structured triage in `delegation-briefs-remediation-sprint2.md` with clear "Fix Now" vs "Defer PI-3" categorization enabled rapid turnaround. Post-remediation test count grew from 493 to 542 (all passing), confirming no regressions.

### 2.5 Security Posture Hardening

Sprint 2 resolved multiple security gaps carried from Sprint 1:

| Control | Before Sprint 2 | After Sprint 2 |
|---------|-----------------|----------------|
| CSRF protection | Missing | `__Host-csrf` cookie, HMAC-SHA256, `timingSafeEqual` on all mutations |
| Audit logging | Missing | Middleware-level capture on all protected mutations, 90-day retention |
| SSH key rotation | Non-functional (`randomBytes`) | Ed25519 keypair via `generateKeyPairSync`, VPS deployment with rollback |
| Sudoers hardening | Wildcard `apt-get install *` | Explicit package lists, `root:root 0440`, `visudo -c` validation |
| Docker containers | No security opts | `--security-opt=no-new-privileges`, `--cap-drop=ALL`, `--read-only` on agents |
| Config injection | Arbitrary env vars accepted | `ENV_VAR_PATTERN` validation, `UNSAFE_CONFIG_PATTERN` blocklist |

The Sprint 2 verification found zero Critical security findings (down from 2 in Sprint 1). All 4 HIGH findings were remediated within the sprint.

### 2.6 Robust Testing Infrastructure Growth

Test suite grew 140% (226 → 542) while maintaining 100% pass rate. Coverage now spans:

- 13 Sprint 2 feature test files (196 tests)
- 11 Sprint 1 regression test files (217 tests)
- 6 bug fix verification test files (92 tests)
- 2 tenant isolation test files (23 tests)
- 1 accessibility test file (22 tests)

All 33 test files execute in 23.77s — maintaining sub-30s execution despite the 140% growth. Auth-related tests (Argon2id) account for 33s of active compute time but run in parallel.

### 2.7 Strong Cross-Sprint Regression Coverage

All 226 Sprint 1 tests continued to pass throughout Sprint 2 development and remediation. Sprint 1 accessibility regressions CF-01 (contrast) were partially fixed (light mode ✅, dark mode pending verification), and Sprint 1 security findings (S-01 rate limit, S-05 session invalidation, T-01 heredoc injection, E-04 sudoers wildcard) were all confirmed resolved.

### 2.8 TDD Discipline Maintained

Testing agent produced ~265 test contracts at P4 Step 1 (AB#288) before code agents began implementation. This pattern, established in Sprint 1, continued to catch issues early. The structured separation of test contracts from implementation code ensured behavioral expectations were explicit before a line of production code was written.

---

## 3. What Didn't Go Well

### 3.1 Deliberate Overcommit (71 SP Planned → 54 SP Delivered)

Sprint 2 was planned at 71 SP across 8 stories (54 SP) + 5 deferred bugs (17 SP). The PO acknowledged this as a deliberate overcommit with a "15 SP safety valve" (SM sprint health report initialized at AMBER). While all 8 stories were delivered, the 5 deferred bugs had mixed results:

- 3/5 fully resolved (B-258 CSRF, B-259 audit logging, B-262 sudoers)
- 2/5 conditional (B-260 SSH rotation — fixed via remediation AB#303; B-251 focus management — partial, 2 of 4 sub-items remain)

The overcommit strategy succeeded for feature scope but left residual technical debt in the bug fixes. Planning at sustainable capacity (54 SP baseline from actual delivery) rather than aspirational capacity (71 SP) would have set clearer expectations.

### 3.2 Persistent Accessibility Debt

Two accessibility issues have persisted across both sprints without resolution:

| Issue | Sprint 1 Status | Sprint 2 Status |
|-------|----------------|-----------------|
| A-03/CF-02: Input border contrast ~1.6:1 | Filed (AB#249) | Still failing — deferred again to PI-3 |
| B-251: Wizard step focus management | Filed (AB#251) | Partially fixed — route focus ✅, wizard step focus ❌ (AB#312) |

The input border contrast issue (CF-02) is a semantic token problem (`--color-border-base`) that has been known since Sprint 1 P5 and remains at ~1.6:1 against a 3:1 WCAG 1.4.11 minimum. Each deferral compounds the risk of shipping with a known WCAG AA violation. This should be a non-negotiable PI-3 Sprint 1 P1 item.

### 3.3 No Playwright E2E Tests (Sprint 1 Action Item A2 Unfulfilled)

Sprint 1 retrospective Action Item A2 called for "Implement Playwright E2E test infrastructure and smoke suite" as a High priority for Sprint 2 P4. This was not delivered. The smoke test report (P7) explicitly notes 5 extended scenarios (mobile responsive, HTTPS, SSE fallback, empty states, viewport testing) that require live browser verification but could not be executed.

For a UI-heavy platform with 17 pages and 23 routes, the absence of browser-level verification remains a significant gap. The 542 Vitest tests validate logic, state machines, and API contracts but do not verify rendered HTML, CSS layout, or client-side interaction flows.

### 3.4 Conditional Acceptance — 18 Items Deferred to PI-3

The PO's CONDITIONAL ACCEPT carries 18 deferred items into PI-3 backlog:

| Category | Count | Notable |
|----------|-------|---------|
| Security (MEDIUM) | 4 | SSE session re-validation (F-07 CVSS 6.2), agent token restart (F-08), catalog data filtering (F-05), state machine validation (F-06) |
| Security (LOW) | 3 | Per-phase logging (F-10), password length mismatch (F-11), volume mount validation (F-12) |
| Accessibility | 8 | Border contrast (A-03), wizard focus (A-04), stale data announcements (A-05), remediation feedback (A-06), alert results (A-07), progressbar text (A-08), dynamic title (A-09), dark mode contrast (A-10) |
| Test stability | 2 | Auth lockout flaky (AB#300), duplicate email timing (AB#301) |
| Infrastructure | 1 | Playwright E2E integration |

This deferral backlog is manageable but accumulating. PI-3 Sprint 1 must prioritize the P1/P2 items before taking on new feature scope.

### 3.5 Dark Mode Contrast Unverified

CF-01 dark mode contrast (`--color-text-subtle`) was estimated at 3.8–4.3:1 against the 4.5:1 minimum but was never measured with axe-core in a rendered dark mode environment. This has been flagged in both the verification summary and acceptance report as "VERIFY" without resolution. Without browser-based measurement, the team cannot confirm whether dark mode meets WCAG AA.

### 3.6 Statement Coverage Metric Unreliable

The verification summary reports 3.85% statement coverage (repo-wide V8). This number is misleadingly low because V8 coverage instruments all source files including unexecuted UI components, configuration files, and framework utilities. Function and branch coverage (both 41.97%) are more representative but still low. The absence of an Istanbul/c8 coverage configuration targeting only `src/lib/` and `src/server/` means the team lacks a reliable coverage baseline.

---

## 4. Sprint 1 Retrospective Action Item Follow-Through

| # | Action Item | Target | Result | Notes |
|---|-------------|--------|--------|-------|
| A1 | Resolve deferred high-severity bugs before new features | Sprint 2 Week 1 | **Partial** | 3/5 fully resolved (B-258, B-259, B-262). B-260 fixed via remediation. B-251 partial. Bug-first sequencing was honored. |
| A2 | Implement Playwright E2E test infrastructure | Sprint 2 P4 | **Not Done** | No Playwright tests delivered. 542 Vitest tests but zero browser-level verification. |
| A3 | Add P4 self-review checklist for code agents | Sprint 2 P3 | **Partial** | PO's delegation briefs included security/accessibility reminders but no formalized self-review checklist artifact was produced. |
| A4 | Resolve AB#251 (focus management) | Sprint 2 P4 | **Partial** | Route focus and screen reader announcements ✅, wizard step focus and deploy phase aria-live initially ❌ (AB#309 fixed in remediation, AB#312 deferred). |
| A5 | Size and plan F2+F3 stories early | Sprint 2 P0-P1 | **Done** | 8 stories sized at 54 SP, all PI-2 objectives addressed. |
| A6 | Address R3 and R12 risks early | Sprint 2 P1 | **Done** | SA's solution assessment v2.0.0 covered app definition model (Docker Compose templates) and DNS/cert automation (Caddy ACME). |
| A7 | WSL stability monitoring | Sprint 2 P4 | **Not Tracked** | No WSL disconnects reported in Sprint 2 (positive signal), but no formal monitoring was established. |
| A8 | Automate `pnpm audit` in CI | Sprint 2 P4 | **Not Done** | DevOps focused on deployment pipeline rather than audit automation. |

**Completion rate:** 3/8 Done, 3/8 Partial, 2/8 Not Done. Action items A2 (E2E tests) and A8 (audit automation) carry forward as unfulfilled priorities.

---

## 5. Sprint Metrics

### 5.1 Velocity & Throughput

| Metric | Sprint 1 | Sprint 2 | Trend |
|--------|----------|----------|-------|
| Velocity | 47 SP | 54 SP | ↑ +15% |
| Stories delivered | 8 | 8 | → Stable |
| Average story size | 5.9 SP | 6.75 SP | ↑ Larger stories |
| Features completed | 2 (F1, F4) | 2 (F2, F3) | → Stable |
| Cycle time (P0→P6) | 4 days | 3 days (PI-2 P0–P6) | ↓ Faster |

### 5.2 Quality Metrics

| Metric | Sprint 1 | Sprint 2 | Trend |
|--------|----------|----------|-------|
| Test count | 226 | 542 | ↑ +140% |
| Test pass rate | 100% | 100% | → Stable |
| Test duration | 16.59s | 23.77s | ↑ Proportional growth |
| Bugs discovered at P5 | 16 | 10 | ↓ -37.5% (good) |
| Bug-to-story ratio | 2.0 | 1.25 | ↓ Improved |
| In-sprint fix rate | 68.75% (11/16) | 90% (9/10 total: 6 remediated + 3 PI-1) | ↑ Improved |
| Critical bug fix rate | 100% (2/2) | 100% (2/2 A11Y critical) | → Sustained |
| HIGH bug fix rate | — | 100% (4/4 SEC HIGH) | New metric |
| Defect escape rate | 0% | 0% | → Sustained |
| Build success rate | 100% | 100% | → Sustained |

### 5.3 Defect Density by Category

| Category | Sprint 1 | Sprint 2 | Trend |
|----------|----------|----------|-------|
| Security | 9 (56%) | 4 HIGH + 5 MED + 3 LOW = 12 total (4 HIGH remediated) | Shifted to lower severity |
| Accessibility | 5 (31%) | 2 Critical + 2 Serious = 4 (2 Critical remediated) | ↓ Reduced |
| Testing/Stability | 2 (13%) | 2 Medium (flaky tests) | → Same |

The security bug profile shifted from Critical/HIGH findings (Sprint 1: 2 Critical, 7 HIGH) to zero Critical and 4 HIGH (Sprint 2). The 5 MEDIUM + 3 LOW findings represent defense-in-depth improvements rather than exploitable vulnerabilities. This demonstrates that Sprint 1's security architecture was fundamentally sound — Sprint 2 caught implementation refinements.

### 5.4 Process Metrics

| Metric | Sprint 1 | Sprint 2 | Trend |
|--------|----------|----------|-------|
| Gates passed | 8/8 | 8/8 (PI-2) | → Stable |
| Task-First violations | 0 | 0 | → Clean |
| Framework bugs encountered | 6 | 0 | ↓ Resolved |
| WSL disconnects | 3 | 0 | ↓ Resolved |

### 5.5 Remediation Efficiency

| Metric | Sprint 1 | Sprint 2 |
|--------|----------|----------|
| P5 bugs filed | 16 | 10 |
| P1 blockers requiring remediation | 2 (Critical SEC) | 6 (4 HIGH SEC + 2 Critical A11Y) |
| Remediation turnaround | < 1 day | < 1 day |
| Post-remediation test growth | 0 (same 226) | +49 (493 → 542) |
| All P1 blockers resolved before P7 | ✅ | ✅ |

---

## 6. Team Health Assessment

| Dimension | Sprint 1 | Sprint 2 | Notes |
|-----------|----------|----------|-------|
| **Collaboration** | GREEN | GREEN | Hub-and-spoke model continued working. PO triage of P5 findings was efficient. 9 agents active in P5/P6 alone. |
| **Quality focus** | GREEN | GREEN | TDD discipline maintained. 542 tests. Zero test skips or disables. All P1 blockers remediated before P7. |
| **Pace sustainability** | AMBER | AMBER | 54 SP + 5 bug fixes is high throughput for a 4-day sprint. Overcommit was deliberate but stresses sustainable pace. |
| **Process adherence** | GREEN | GREEN | Zero Task-First violations. All 8 PI-2 gates passed. Structured remediation cycle with PO triage. |
| **Improvement mindset** | GREEN | GREEN | Sprint 1 action items partially addressed. Bug rate down 37.5%. Security posture measurably improved. |
| **Scope discipline** | GREEN | GREEN | No scope creep. 18 items explicitly categorized and deferred with PO approval. |
| **Technical debt management** | AMBER | AMBER | 18 items deferred to PI-3. Accessibility debt persists from Sprint 1 (CF-02 border contrast). No E2E tests. |

**Overall team health: GREEN with AMBER watch items** — The team delivered its full Sprint 2 commitment, improved quality metrics, and maintained process discipline. Pace sustainability and accumulating technical debt warrant attention in PI-3 planning.

---

## 7. Process Improvement Recommendations

### 7.1 Establish Playwright E2E as a Non-Negotiable DoD Item

This is the second sprint where browser-level testing was planned but not delivered. For PI-3, Playwright E2E should be:
- Added to the Definition of Done as a mandatory criterion for UI stories
- Configured in `vitest.workspace.ts` or as a separate `pnpm test:e2e` script
- Included in the Testing agent's P4 Step 1 test contracts
- Executed by the Testing agent at P5 and P7

### 7.2 Formalize P4 Agent Self-Review Protocol

Sprint 1 retrospective recommended this (A3), and Sprint 2 saw informal adoption through PO delegation brief reminders. Formalize this as a framework-level protocol:
- Code agents (BE, FE, DBA, DevOps) must cross-reference their output against the SEC threat model and A11Y guidelines before reporting completion
- Add a "Self-Review Checklist" section to the agent exit protocol that references upstream security and accessibility artifacts
- This is not a new gate — it is an enhancement to each code agent's exit conditions

### 7.3 Coverage Configuration for Meaningful Metrics

Configure V8/c8 coverage to target only production source directories (`src/lib/`, `src/server/`, `src/app/`) and exclude test files, configuration, and framework utilities. The current 3.85% statement coverage is meaningless due to full-repo instrumentation. A targeted configuration would provide actionable coverage data for PI-3.

### 7.4 Prioritize Accessibility Debt Over New Features in PI-3 Sprint 1

The border contrast issue (CF-02/A-03) has been known for two full sprints. The wizard focus issue (A-04/AB#312) was filed in Sprint 2 and deferred. PI-3 Sprint 1 should allocate capacity for accessibility remediation before new feature work. Consider:
- Dedicate the first 2–3 days of PI-3 Sprint 1 to A11Y and SEC medium fixes
- Run a focused A11Y audit with axe-core + Playwright against all 17 pages in both light and dark mode
- Resolve CF-01 dark mode contrast verification — this has been in "VERIFY" status across two sprints

### 7.5 Improve Sprint Planning Accuracy

Sprint 2 was planned at 71 SP (54 SP stories + 17 SP bugs) with a known overcommit. While the 54 SP feature delivery exceeded Sprint 1's 47 SP, the planned vs. delivered gap undermines forecast accuracy. For PI-3:
- Plan at the proven velocity range (47–54 SP)
- Point deferred bugs separately and include them in capacity calculations
- If overcommitting, clearly mark "safety valve" stories that can be descoped

### 7.6 Consolidate Deferred Item Tracking

Sprint 2 ends with 18 deferred items across security, accessibility, testing, and infrastructure categories. These are tracked in:
- PO acceptance report §6 (deferred backlog table)
- Verification summary §9 (unresolved items)
- Various Azure Boards items (AB#300, AB#301, AB#311, AB#312, plus SEC F-05 through F-12)

For PI-3, consolidate all deferred items into a single PI-3 backlog intake document during P0, with explicit priority ranking and sprint assignment.

---

## 8. Action Items for PI-3

| # | Action | Owner | Priority | Target |
|---|--------|-------|----------|--------|
| A1 | Fix CF-02/A-03 input border contrast (persistent since Sprint 1) | FE | **P1 — Block** | PI-3 Sprint 1 P4 |
| A2 | Fix AB#312 wizard step focus management | FE | **P1 — Block** | PI-3 Sprint 1 P4 |
| A3 | Implement Playwright E2E test infrastructure and smoke suite (carried from Sprint 1 A2) | TST / TL | **P1 — High** | PI-3 Sprint 1 P4 |
| A4 | Fix SEC F-07: SSE session re-validation on heartbeat (CVSS 6.2) | BE | **P1 — High** | PI-3 Sprint 1 P4 |
| A5 | Fix SEC F-08: Agent token rotation restart | BE | **P2** | PI-3 Sprint 1 P4 |
| A6 | Resolve CF-01 dark mode contrast — measure with axe-core, fix if failing | FE / A11Y | **P2** | PI-3 Sprint 1 P5 |
| A7 | Configure targeted coverage reporting (src/lib, src/server, src/app only) | TL / DevOps | **P2** | PI-3 Sprint 1 P4 |
| A8 | Automate `pnpm audit` in CI pipeline (carried from Sprint 1 A8) | DevOps | **P2** | PI-3 Sprint 1 P4 |
| A9 | Formalize P4 agent self-review checklist in framework phase-execution docs | SM | **P2** | PI-3 P0 |
| A10 | Consolidate PI-3 deferred item backlog with priority ranking | PO | **P1 — High** | PI-3 P0 |
| A11 | Address remaining 5 MEDIUM + 3 LOW SEC findings (F-05/F-06/F-08/F-09/F-10/F-11/F-12) | BE / FE | **P3** | PI-3 Sprint 1–2 |
| A12 | Address remaining 5 Moderate + 2 Minor A11Y findings (A-05 through A-09, A-11, A-12) | FE | **P3** | PI-3 Sprint 1–2 |

---

## 9. Enhancement Candidates for the Framework

### 9.1 P4 Self-Review Checkpoint (MEDIUM — Carried from Sprint 1 Observation 6.4)

The framework's P4 phase still moves directly from code agent implementation to TL merge verification without an agent self-review checkpoint. Sprint 2's bug rate improved (10 vs 16), suggesting informal adoption of Sprint 1's recommendation, but the protocol is not codified. Formalizing this in `phase-execution.md` as an agent exit-protocol step would ensure consistency.

### 9.2 Remediation Protocol Documentation (MEDIUM)

Sprint 2's P5 remediation cycle (PO triage → agent fix → TL verify) worked well but was executed ad-hoc based on PM orchestration. The framework lacks a documented "P5 Remediation Protocol" artifact that codifies:
- PO triage criteria for "Fix Now" vs "Defer" decisions
- Delegation brief format for remediation bugs
- TL post-remediation verification checklist
- Test growth expectations (new tests for each fix)

Codifying this would make the pattern repeatable across projects.

### 9.3 Coverage Configuration Guidance (LOW)

The framework's quality standards reference test coverage but do not provide guidance on configuring V8/c8/Istanbul for meaningful metrics. Adding a "Coverage Configuration" section to `quality-standards.instructions.md` with recommended include/exclude patterns would prevent the misleading 3.85% repo-wide number.

### 9.4 Sprint Overcommit Policy (LOW)

Sprint 2 demonstrated that deliberate overcommit with a safety valve can work, but the framework does not document when this is acceptable or how to structure it. Adding a short section to the SM's sprint planning guidance about overcommit criteria (e.g., "only when velocity baseline exists from ≥1 prior sprint," "safety valve must be explicit in sprint backlog") would formalize the practice.

---

## 10. PI-2 Cumulative Summary

| Metric | Sprint 1 | Sprint 2 | PI-2 Total |
|--------|----------|----------|------------|
| Story points delivered | 47 SP | 54 SP | 101 SP |
| Stories delivered | 8 | 8 | 16 |
| Features completed | 2 (F1, F4) | 2 (F2, F3) | 4/4 (100%) |
| Tests | 226 | 542 | 542 (cumulative) |
| Bugs found | 16 | 10 | 26 |
| Bugs fixed in PI | 11 + 9 | — | 20 (77%) |
| Bugs deferred to PI-3 | — | 4 + 14 deferral items | 18 items |
| Framework bugs fixed | 6 | 0 | 6 |
| Gates passed | 9/9 | 8/8 (PI-2) | 17/17 |
| Task-First violations | 0 | 0 | 0 |

**PI-2 delivered all 4 planned features with 16 stories (101 SP), 542 tests passing, and zero Task-First violations.** The team improved velocity (+15%), reduced defect rate (-37.5%), and hardened the security posture significantly. The primary carry-forward risk is the 18 deferred items (accessibility debt + security medium findings) that must be addressed in early PI-3.

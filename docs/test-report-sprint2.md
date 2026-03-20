---
artifact: test-report-sprint2
produced-by: testing
project-slug: unplughq
work-item: epic-001-unplughq-platform
work-item-type: epic
workflow-tier: full
phase: P5
version: 1.0.0
status: draft
consumed-by:
  - tech-lead
  - product-owner
  - product-manager
date: 2026-03-18
azure-devops-id: 299
review:
  reviewed-by:
  reviewed-date:
---

# Sprint 2 P5 Test Execution Report

## Executive Summary

| Metric | Value |
| --- | --- |
| Task | AB#299 |
| Requested suite command | `pnpm test` |
| Requested coverage command | `pnpm test -- --coverage` |
| Baseline regression set | 226 Sprint 1 tests |
| Current merged suite size | 493 tests across 31 Vitest files |
| Inferred Sprint 2 additions | 267 tests |
| Stable green run captured | 493 passed, 0 failed (`pnpm test -- --reporter=verbose`) |
| Unstable red runs captured | 2 separate failures across standard and coverage executions |
| Bugs filed | AB#300, AB#301 |

## Execution Results

### Requested Command Outcomes

| Command | Result | Tests | Notes |
| --- | --- | --- | --- |
| `pnpm test` | FAIL | 492 passed, 1 failed | `auth-router.test.ts` timed out in the S-195 account lockout scenario after 10 failed attempts |
| `pnpm test -- --reporter=verbose` | PASS | 493 passed, 0 failed | Same suite passed on immediate rerun; lockout scenario completed in 9053ms |
| `pnpm test -- --coverage` | FAIL | 492 passed, 1 failed | Same auth lockout scenario timed out at 10s |
| Diagnostic: `pnpm test -- --coverage --testTimeout=20000` | FAIL | 492 passed, 1 failed | Auth lockout passed, but signup duplicate-email timing test failed with 728.89ms delta vs 500ms threshold |
| Diagnostic: isolated auth lockout test | PASS | 1 passed, 0 failed | Confirms instability is suite-context or timing related rather than deterministic functional failure |

### Sprint 1 Regression Results

The requested Sprint 1 regression baseline is 226 tests. The current `pnpm test` script does not tag or isolate Sprint 1 cases, so the regression status is inferred from the merged 493-test suite.

| Observation | Result |
| --- | --- |
| Baseline count supplied for Sprint 1 | 226 tests |
| First merged-suite run | 225 baseline-equivalent tests passed, 1 failed |
| Verbose rerun | No Sprint 1 failures observed |
| Coverage executions | 1 Sprint 1 auth failure observed per run, but not the same test each time |
| P5 conclusion | Sprint 1 regression coverage exists, but the regression layer is not stable enough to declare fully green |

### Sprint 2 Test Results

Using the supplied 226-test Sprint 1 baseline, the merged suite implies 267 Sprint 2-era tests.

| Scope | Pass | Fail | Status |
| --- | --- | --- | --- |
| Sprint 2 inferred additions | 267 | 0 | No Sprint 2-specific failures observed in the executed Vitest suite |
| Sprint 2 stories S-202 to S-209 | Covered by executed unit and integration tests | 0 direct failures | PASS with caveats on E2E-only AC coverage |
| Sprint 2 bugs B-258 and B-259 | Covered by executed Vitest tests | 0 direct failures | PASS |
| Sprint 2 bugs B-251, B-260, B-262 | Traceability artifacts conflict or depend on unexecuted Playwright specs | n/a | PARTIAL |

## Coverage Metrics

Coverage output was generated in `code/coverage/coverage-summary.json` during a failing coverage run.

| Metric | Coverage |
| --- | --- |
| Statements | 3.85% |
| Lines | 3.85% |
| Functions | 41.97% |
| Branches | 41.97% |

Coverage caveat: these repo-wide V8 metrics were emitted during a non-green run and include all application files, configs, routes, and UI modules. They are useful for directional reporting, but not sufficient as gate-pass evidence for runtime coverage health.

## Failing Test Details

### AB#300 — Auth Lockout Test Instability

| Field | Detail |
| --- | --- |
| Bug | AB#300 |
| File | `src/__tests__/integration/trpc/auth-router.test.ts` |
| Test | `should enforce account lockout after 10 failed attempts (S-01 / SEC-AUTH-04)` |
| Failure mode | Timed out at 10000ms in full-suite and default coverage execution |
| Contradictory evidence | Passed in verbose full-suite rerun and in isolated execution |
| Assessment | Flaky or performance-sensitive security regression under suite load |

### AB#301 — Duplicate Email Timing Instability

| Field | Detail |
| --- | --- |
| Bug | AB#301 |
| File | `src/__tests__/unit/auth/signup-validation.test.ts` |
| Test | `should have consistent response timing for existing and non-existing emails (I-02)` |
| Failure mode | Timing delta measured at 728.89ms versus 500ms threshold under coverage instrumentation |
| Contradictory evidence | Test was not the failing case in the initial non-coverage execution |
| Assessment | Either a real timing side-channel regression or a brittle timing threshold under instrumentation |

## AC Traceability Matrix

This matrix records executed evidence from the `pnpm test` Vitest suite and distinguishes it from planned-but-unexecuted Playwright coverage.

| Work Item | Executed Evidence | Status |
| --- | --- | --- |
| S-202 App Catalog | `src/__tests__/unit/catalog/catalog-service.test.ts`; `src/__tests__/integration/trpc/app-router.test.ts` | PASS |
| S-203 Guided App Configuration | `src/__tests__/unit/schemas/zod-schema-validation-sprint2.test.ts`; `src/__tests__/integration/trpc/app-router.test.ts` | PASS |
| S-204 Application Deployment with Progress | `src/__tests__/unit/deployment/deployment-state-machine.test.ts`; `src/__tests__/unit/deployment/caddy-route-management.test.ts`; `src/__tests__/integration/trpc/app-router.test.ts`; `src/__tests__/integration/queue/deploy-app-lifecycle.test.ts` | PASS |
| S-205 Post-Deployment Verification | `src/__tests__/unit/deployment/health-check-service.test.ts`; `src/__tests__/integration/queue/deploy-app-lifecycle.test.ts` | PASS |
| S-206 Multi-App Coexistence | `src/__tests__/unit/deployment/caddy-route-management.test.ts`; `src/__tests__/integration/trpc/domain-router.test.ts` | PASS |
| S-207 Dashboard Overview | `src/__tests__/integration/trpc/monitor-router.test.ts`; `src/__tests__/integration/sse/sse-events.test.ts` | PASS |
| S-208 Health Alert Notifications | `src/__tests__/unit/monitoring/alert-evaluation.test.ts`; `src/__tests__/unit/monitoring/email-notification.test.ts`; `src/__tests__/integration/trpc/monitor-router.test.ts`; `src/__tests__/integration/queue/alert-pipeline.test.ts`; `src/__tests__/integration/sse/sse-events.test.ts` | PASS |
| S-209 Alert Management and Guided Remediation | `src/__tests__/unit/monitoring/alert-evaluation.test.ts`; `src/__tests__/integration/trpc/monitor-router.test.ts`; `src/__tests__/integration/queue/alert-pipeline.test.ts` | PASS |
| B-251 Focus Management on Dynamic Content | Planned in `bug-regression.spec.ts` per `docs/test-strategy-sprint2.md`; not executed by `pnpm test` | PARTIAL |
| B-258 Missing CSRF Double-Submit Cookie | `src/__tests__/unit/security/csrf-middleware.test.ts` | PASS |
| B-259 Insufficient Audit Logging | `src/__tests__/unit/security/audit-logging.test.ts`; `src/__tests__/integration/trpc/user-router.test.ts` | PASS |
| B-260 Artifact scope mismatch: backlog says CSP, test assets say secrets rotation | `src/__tests__/unit/security/secrets-rotation.test.ts` executed; no direct CSP execution evidence in requested command set | PARTIAL |
| B-262 Broken Sudoers Ownership | Planned in `bug-regression.spec.ts` per `docs/test-strategy-sprint2.md`; not executed by `pnpm test` | PARTIAL |

## Critical Issues

1. The merged Vitest suite is unstable under P5 execution. The same codebase produced a red `pnpm test`, a green verbose rerun, and a red coverage execution with different failing auth-related tests.
2. `pnpm test` is `vitest run` only. Planned Playwright evidence for B-251 and B-262 is not part of the requested execution path, so those items do not have executed P5 evidence from this run.
3. Sprint 2 traceability artifacts disagree on bug scope. `docs/product-backlog.md` labels B-251 as focus management, B-260 as CSP, and B-262 as sudoers ownership, while `docs/test-strategy-sprint2.md` maps those IDs to different bug titles. This makes bug-to-test traceability non-authoritative until reconciled.

## Overall Assessment

Sprint 2 unit and integration coverage for stories S-202 through S-209 is substantively present and no Sprint 2-specific Vitest failures were observed. Gate-readiness is still blocked by suite instability in Sprint 1 auth regressions and by inconsistent artifact-level traceability for three bug IDs.

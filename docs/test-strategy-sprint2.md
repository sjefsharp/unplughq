---
artifact: test-strategy-sprint2
produced-by: testing
status: draft
work-items:
  - AB#288
parent-story: S-202, S-203, S-204, S-205, S-206, S-207, S-208, S-209, B-251, B-258, B-259, B-260, B-262
pi: PI-2
sprint: Sprint 2
---

# Test Strategy — Sprint 2 P4 Step 1 (TDD Contracts)

## 1. Overview

This document defines the comprehensive test strategy for UnplugHQ PI-2 Sprint 2.
All tests are **contract tests** written before implementation (TDD — P4 Step 1).
Tests are designed to **fail until code agents implement** the corresponding modules.

**Scope:** 8 stories (AB#202–209) + 5 deferred PI-1 bugs (AB#251, AB#258–260, AB#262)

**Stack:** Vitest (unit/integration) · Playwright (E2E) · @axe-core/playwright (accessibility)

## 2. Test Architecture — Sprint 2 Additions

```
code/
├── src/__tests__/
│   ├── helpers/                          # EXISTING + NEW helpers
│   │   ├── test-fixtures.ts              # (existing)
│   │   ├── test-context.ts               # (existing)
│   │   ├── catalog-helpers.ts            # NEW — catalog data & search
│   │   ├── deployment-helpers.ts         # NEW — deploy state machine & job lifecycle
│   │   ├── alert-helpers.ts              # NEW — alert evaluation & thresholds
│   │   ├── security-helpers.ts           # NEW — CSRF, audit, secrets rotation
│   │   ├── health-check-helpers.ts       # NEW — health check retry/backoff
│   │   ├── email-helpers.ts              # NEW — email queue & DLQ
│   │   ├── app-router-helpers.ts         # NEW — tRPC app router test caller
│   │   ├── monitor-router-helpers.ts     # NEW — tRPC monitor router test caller
│   │   ├── domain-router-helpers.ts      # NEW — tRPC domain router test caller
│   │   └── user-router-helpers.ts        # NEW — tRPC user router test caller
│   ├── unit/
│   │   ├── catalog/
│   │   │   └── catalog-service.test.ts           # S-202
│   │   ├── deployment/
│   │   │   ├── deployment-state-machine.test.ts  # S-204
│   │   │   ├── health-check-service.test.ts      # S-205
│   │   │   └── caddy-route-management.test.ts    # S-204, S-206
│   │   ├── monitoring/
│   │   │   ├── alert-evaluation.test.ts          # S-208, S-209
│   │   │   └── email-notification.test.ts        # S-208
│   │   ├── schemas/
│   │   │   └── zod-schema-validation-sprint2.test.ts  # All Sprint 2 schemas
│   │   └── security/
│   │       ├── csrf-middleware.test.ts            # B-258
│   │       ├── audit-logging.test.ts             # B-259
│   │       ├── secrets-rotation.test.ts          # B-260
│   │       └── tenant-isolation-sprint2.test.ts  # I-07 for F2/F3
│   └── integration/
│       ├── trpc/
│       │   ├── app-router.test.ts                # S-202, S-203, S-204
│       │   ├── monitor-router.test.ts            # S-207, S-208, S-209
│       │   ├── domain-router.test.ts             # S-206
│       │   └── user-router.test.ts               # B-259, NFR-005
│       ├── queue/
│       │   ├── deploy-app-lifecycle.test.ts      # S-204
│       │   └── alert-pipeline.test.ts            # S-208, S-209
│       └── sse/
│           └── sse-events.test.ts                # S-207, S-208 (§3.3)
├── e2e/
│   ├── journeys/
│   │   ├── app-deployment-journey.spec.ts        # UJ1 Sprint 2
│   │   ├── multi-app-journey.spec.ts             # UJ2
│   │   └── alert-remediation-journey.spec.ts     # UJ4
│   ├── server/
│   │   ├── catalog-browsing.spec.ts              # S-202
│   │   ├── configuration-wizard.spec.ts          # S-203
│   │   ├── deployment-progress.spec.ts           # S-204, S-205
│   │   ├── dashboard-overview.spec.ts            # S-207
│   │   └── bug-regression.spec.ts                # B-251, B-258, B-259, B-262
│   ├── a11y/
│   │   └── sprint2-keyboard-navigation.spec.ts   # WCAG 2.1 AA
│   └── mobile/
│       └── sprint2-responsive.spec.ts            # Mobile-first responsive
```

## 3. Test Count Summary

| Category        | Files | Test Cases | Stories/Bugs Covered |
|-----------------|-------|------------|----------------------|
| Unit            | 11    | ~145       | S-202–S-209, B-258–B-260 |
| Integration     | 7     | ~70        | S-202–S-209, B-259   |
| E2E             | 8     | ~50        | S-202–S-209, B-251, B-258, B-259, B-262 |
| **Total**       | **26**| **~265**   | **8/8 stories + 5/5 bugs (100%)** |

## 4. Story → Test Traceability Matrix

| Story  | Title                      | Unit Tests                                        | Integration Tests                | E2E Tests                                    |
|--------|----------------------------|---------------------------------------------------|----------------------------------|----------------------------------------------|
| S-202  | App Catalog                | catalog-service (19 tests)                        | app-router (catalog.list/get)    | catalog-browsing, app-deployment-journey     |
| S-203  | Configuration Wizard       | zod-schema-sprint2 (CatalogApp.configSchema)      | app-router (catalog.get)         | configuration-wizard                         |
| S-204  | One-Click Deploy           | deployment-state-machine (30+), caddy-route-mgmt  | app-router (deployment CRUD), deploy-app-lifecycle | app-deployment-journey, multi-app-journey, deployment-progress |
| S-205  | Health Checks              | health-check-service (8 tests)                    | deploy-app-lifecycle             | deployment-progress                          |
| S-206  | Custom Domains             | caddy-route-management                            | domain-router                    | (domain UI deferred to later sprint)         |
| S-207  | Dashboard Overview         | —                                                 | monitor-router (dashboard), sse-events | dashboard-overview, app-deployment-journey   |
| S-208  | Alert Notifications        | alert-evaluation (25+), email-notification (10)   | monitor-router (alerts), alert-pipeline | alert-remediation-journey, bug-regression    |
| S-209  | Guided Remediation         | alert-evaluation (acknowledge/dismiss)             | monitor-router (alerts.dismiss), alert-pipeline | alert-remediation-journey                    |

## 5. Bug → Test Traceability Matrix

| Bug    | Title                       | Unit Tests                     | Integration Tests | E2E Tests                |
|--------|-----------------------------|--------------------------------|-------------------|--------------------------|
| B-251  | Missing Tier Limits         | —                              | app-router (E-03) | bug-regression           |
| B-258  | No CSRF Protection          | csrf-middleware (10 tests)     | —                 | bug-regression           |
| B-259  | Insufficient Audit Logging  | audit-logging (15 tests)       | user-router       | bug-regression           |
| B-260  | Missing Secrets Rotation    | secrets-rotation (12 tests)    | —                 | —                        |
| B-262  | Insufficient Rate Limiting  | —                              | —                 | bug-regression           |

## 6. Security Threat → Test Coverage (Sprint 2)

| Threat ID | Threat                       | Test File(s)                                                               |
|-----------|------------------------------|----------------------------------------------------------------------------|
| I-07      | Cross-Tenant Data Leakage   | tenant-isolation-sprint2, app-router, monitor-router, domain-router, user-router, sse-events, alert-pipeline |
| T-03      | Catalog Tampering            | zod-schema-sprint2 (imageDigest validation)                                |
| E-02      | IDOR via Predictable IDs     | app-router, monitor-router, domain-router, user-router                     |
| E-03      | Tier Limit Bypass            | app-router (deployment.create), bug-regression                             |
| E-06      | Privilege Escalation via Job | deploy-app-lifecycle (tenantId in job payload)                             |
| BF-001    | CSRF Token in URL            | csrf-middleware (token-not-in-URL), bug-regression                         |
| BF-004    | Insufficient Audit Logging   | audit-logging, user-router (auditLog)                                      |
| BF-005    | Missing Secrets Rotation     | secrets-rotation                                                           |

## 7. WCAG 2.2 AA → Test Coverage (Sprint 2 additions)

| Finding                            | WCAG SC   | Test File                                |
|------------------------------------|-----------|------------------------------------------|
| Keyboard operability (catalog)     | 2.1.1     | sprint2-keyboard-navigation              |
| No keyboard traps                  | 2.1.2     | sprint2-keyboard-navigation              |
| Focus order (config wizard)        | 2.4.3     | sprint2-keyboard-navigation              |
| Touch target size (44px)           | 2.5.5     | sprint2-responsive                       |
| Mobile card stacking               | 1.4.10    | sprint2-responsive                       |
| Alert card keyboard access         | 2.1.1     | sprint2-keyboard-navigation              |
| Modal Escape key dismiss           | 2.1.1     | sprint2-keyboard-navigation              |
| No horizontal overflow (mobile)    | 1.4.10    | sprint2-responsive                       |

## 8. SSE Event Contract Coverage

Per api-contracts §3.3, the following SSE event types are tested:

| Event Type            | Test File(s)                                      |
|-----------------------|---------------------------------------------------|
| `server.status`       | sse-events                                        |
| `deployment.progress` | sse-events, deployment-progress (E2E)             |
| `metrics.update`      | sse-events                                        |
| `alert.created`       | sse-events, alert-remediation-journey (E2E)       |
| `alert.dismissed`     | sse-events                                        |
| `heartbeat`           | sse-events                                        |

## 9. Execution Commands

```bash
# Unit + Integration tests (Vitest)
cd code && pnpm vitest run

# E2E tests (Playwright — requires dev server at localhost:3000)
cd code && pnpm playwright test

# Specific test file
cd code && pnpm vitest run src/__tests__/unit/deployment/deployment-state-machine.test.ts

# Sprint 2 unit tests only (pattern)
cd code && pnpm vitest run --testPathPattern="sprint2|catalog|deployment|monitoring|alert|csrf|audit|secrets"

# E2E journey tests only
cd code && pnpm playwright test e2e/journeys/

# Coverage report
cd code && pnpm vitest run --coverage
```

## 10. Test Helper Summary

| Helper File                    | Purpose                                                    |
|--------------------------------|------------------------------------------------------------|
| `catalog-helpers.ts`           | Catalog data (16 apps), search/filter, category listing    |
| `deployment-helpers.ts`        | State machine transitions, container validation, deploy jobs |
| `alert-helpers.ts`             | Alert thresholds, evaluation, acknowledge/dismiss lifecycle |
| `security-helpers.ts`          | CSRF tokens, audit entries, key rotation store             |
| `health-check-helpers.ts`      | Health check with retry/backoff                            |
| `email-helpers.ts`             | Email queue, delivery, DLQ, suppression                    |
| `app-router-helpers.ts`        | tRPC app router test caller builder                        |
| `monitor-router-helpers.ts`    | tRPC monitor router test caller builder                    |
| `domain-router-helpers.ts`     | tRPC domain router test caller builder                     |
| `user-router-helpers.ts`       | tRPC user router test caller builder                       |

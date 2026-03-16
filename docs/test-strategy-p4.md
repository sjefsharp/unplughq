---
artifact: test-strategy-p4
produced-by: testing
status: approved
work-items:
  - AB#224
  - AB#225
  - AB#226
parent-story: S-194, S-195, S-196, S-197, S-198, S-199, S-200, S-201
pi: PI-1
sprint: Sprint 1
---

# Test Strategy — P4 Step 1 (TDD Contracts)

## 1. Overview

This document defines the comprehensive test strategy for UnplugHQ Sprint 1.
All tests are **contract tests** written before implementation (TDD — P4 Step 1).
Tests are designed to **fail until code agents implement** the corresponding modules.

**Stack:** Vitest (unit/integration) · Playwright (E2E) · @axe-core/playwright (accessibility)

## 2. Test Architecture

```
code/
├── src/__tests__/
│   ├── helpers/
│   │   ├── test-fixtures.ts          # Shared factories & test data
│   │   └── test-context.ts           # tRPC context builders
│   ├── unit/
│   │   ├── auth/
│   │   │   ├── signup-validation.test.ts
│   │   │   ├── password-hashing.test.ts
│   │   │   ├── password-reset-tokens.test.ts
│   │   │   └── rate-limiting.test.ts
│   │   ├── server/
│   │   │   ├── ssh-command-templates.test.ts
│   │   │   ├── os-detection.test.ts
│   │   │   └── resource-detection.test.ts
│   │   ├── provisioning/
│   │   │   └── job-state-transitions.test.ts
│   │   ├── schemas/
│   │   │   └── zod-schema-validation.test.ts
│   │   └── security/
│   │       └── tenant-isolation.test.ts
│   └── integration/
│       ├── trpc/
│       │   ├── auth-router.test.ts
│       │   └── server-router.test.ts
│       └── queue/
│           └── bullmq-lifecycle.test.ts
├── e2e/
│   ├── journeys/
│   │   └── onboarding-to-dashboard.spec.ts
│   ├── auth/
│   │   └── auth-flows.spec.ts
│   ├── server/
│   │   └── connection-wizard.spec.ts
│   ├── a11y/
│   │   ├── wcag-compliance.spec.ts
│   │   └── keyboard-navigation.spec.ts
│   └── mobile/
│       └── responsive.spec.ts
```

## 3. Test Count Summary

| Category        | Files | Test Cases | Stories Covered |
|-----------------|-------|------------|-----------------|
| Unit            | 10    | ~75        | S-194–S-201     |
| Integration     | 3     | ~40        | S-194–S-201     |
| E2E             | 6     | ~55        | S-194–S-201     |
| **Total**       | **19**| **~170**   | **8/8 (100%)**  |

## 4. Story → Test Traceability Matrix

| Story  | Title                      | Unit Tests              | Integration Tests          | E2E Tests                    |
|--------|----------------------------|-------------------------|----------------------------|------------------------------|
| S-194  | User Registration          | signup-validation, password-hashing, zod-schemas | auth-router (Registration) | auth-flows (Signup)          |
| S-195  | Login & Session            | rate-limiting           | auth-router (Login, Session, Logout) | auth-flows (Login, Logout)   |
| S-196  | Password Reset             | password-reset-tokens   | auth-router (Password Reset) | auth-flows (Password Reset)  |
| S-197  | Account Settings           | zod-schemas             | auth-router (Account Settings) | auth-flows (Account Settings)|
| S-198  | Server Connection Test     | ssh-command-templates   | server-router (testConnection), bullmq (Test Connection) | connection-wizard            |
| S-199  | OS & Resource Detection    | os-detection, resource-detection | server-router      | connection-wizard (OS/resources) |
| S-200  | Server Provisioning        | job-state-transitions   | server-router (provision), bullmq (Provisioning) | onboarding-to-dashboard      |
| S-201  | Server Dashboard           | tenant-isolation        | server-router (list, get)  | connection-wizard (Dashboard)|

## 5. Security Threat → Test Coverage

| Threat ID | Threat                      | Test File(s)                                                              |
|-----------|-----------------------------|---------------------------------------------------------------------------|
| S-01      | Credential Stuffing         | rate-limiting.test.ts, auth-router.test.ts, auth-flows.spec.ts           |
| S-02      | Session Cookie Theft        | auth-router.test.ts (session cookies), auth-flows.spec.ts (logout)       |
| I-02      | User Enumeration            | signup-validation.test.ts, auth-router.test.ts, auth-flows.spec.ts      |
| I-07      | Cross-Tenant Data Leakage   | tenant-isolation.test.ts, server-router.test.ts                         |
| T-01      | SSH Command Injection       | ssh-command-templates.test.ts, connection-wizard.spec.ts                 |
| D-03      | Signup Rate Limit Bypass    | rate-limiting.test.ts                                                    |
| D-05      | Job Queue Poisoning         | bullmq-lifecycle.test.ts                                                 |
| E-02      | IDOR via Predictable IDs    | tenant-isolation.test.ts, server-router.test.ts                         |
| E-03      | Tier Limit Bypass           | server-router.test.ts                                                    |
| E-06      | Privilege Escalation via Job | bullmq-lifecycle.test.ts                                                |

## 6. WCAG 2.2 AA → Test Coverage

| Finding                           | WCAG SC   | Test File                         |
|-----------------------------------|-----------|-----------------------------------|
| Text contrast (--color-text-subtle)| 1.4.3    | wcag-compliance.spec.ts           |
| Input border contrast             | 1.4.11    | wcag-compliance.spec.ts           |
| Form field grouping (fieldset)    | 1.3.1     | wcag-compliance.spec.ts           |
| Color-only status indicators      | 1.3.3/1.4.1 | wcag-compliance.spec.ts        |
| Drag-to-reorder keyboard alt      | 2.1.1     | wcag-compliance.spec.ts, keyboard-navigation.spec.ts |
| Focus visibility                  | 2.4.7     | wcag-compliance.spec.ts           |
| Keyboard navigation               | 2.1.1     | keyboard-navigation.spec.ts       |
| No keyboard traps                 | 2.1.2     | keyboard-navigation.spec.ts       |
| Focus order                       | 2.4.3     | keyboard-navigation.spec.ts       |
| Touch target size (44px min)      | 2.5.8     | responsive.spec.ts                |
| ARIA landmarks                    | 4.1.2     | wcag-compliance.spec.ts           |

## 7. Tooling Configuration Requirements

### Vitest (unit + integration)
```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ['src/__tests__/**/*.test.ts'],
    globals: true,
    environment: 'node',
    setupFiles: ['src/__tests__/helpers/test-context.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/server/**', 'src/lib/**'],
      exclude: ['src/__tests__/**'],
    },
  },
});
```

### Playwright (E2E)
```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
  ],
});
```

## 8. Execution Commands

```bash
# Unit + integration tests
npx vitest run

# Unit tests only
npx vitest run src/__tests__/unit/

# Integration tests only
npx vitest run src/__tests__/integration/

# E2E tests (requires running app)
npx playwright test

# E2E — specific suite
npx playwright test e2e/auth/
npx playwright test e2e/a11y/

# Coverage report
npx vitest run --coverage
```

## 9. TDD Contract Notes

All test files use `declare` stubs for not-yet-existing modules. The contract is:

1. **Tests define the expected API surface** — function signatures, input/output shapes
2. **Code agents implement to satisfy contracts** — tests pass when code matches
3. **No implementation exists yet** — all tests will fail until P4 Step 2

Test doubles strategy (per api-contracts.md §6.4):
- **Unit:** Pure function tests, mock external dependencies
- **Integration:** In-memory DB (Drizzle + pg-mem or better-sqlite3), ioredis-mock for BullMQ
- **E2E:** Full app against test database with seeded data

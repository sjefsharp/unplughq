---
artifact: definition-of-done
produced-by: scrum-master
project-slug: unplughq
work-item: epic-001-unplughq-platform
work-item-type: epic
workflow-tier: full
phase: P3
version: 1.0.0
status: draft
azure-devops-id: 210
consumed-by:
  - tech-lead
  - frontend-developer
  - backend-developer
  - database-administrator
  - devops-engineer
  - testing
  - product-owner
  - security-analyst
  - accessibility
date: 2026-03-15
---

# Definition of Done — UnplugHQ PI-1

This is the authoritative Definition of Done for all UnplugHQ stories. Every item in this checklist must be satisfied before a story is considered complete. Referenced by `product-backlog.md`, `sprint-backlog.md`, and all delegation briefs.

---

## 1. Code Quality

- [ ] **TypeScript strict mode** — zero `any` types, zero `@ts-ignore` directives, zero `@ts-expect-error` without linked issue
- [ ] **`pnpm typecheck` exits 0** — full project type-check passes with no errors
- [ ] **`pnpm lint` exits 0** — ESLint passes with zero errors and zero unresolved warnings
- [ ] **`pnpm build` exits 0** — production build succeeds without errors or build config modifications to suppress errors
- [ ] **No deprecated APIs** — all code uses current recommended approaches for Next.js 16, Auth.js v5, Drizzle ORM, shadcn/ui, Tailwind CSS 4, Zod 3.x, BullMQ 5.x
- [ ] **No placeholders** — zero TODO markers, placeholder text, skeleton implementations, or "to be determined" items in delivered code
- [ ] **No raw SQL** — all database queries use Drizzle ORM parameterized queries; `sql.raw()` and template literal SQL are prohibited (threat model T-02)
- [ ] **Formatting consistent** — Prettier formatting applied; no formatting-only diffs in code review

## 2. Test Coverage

- [ ] **Unit tests pass** — `pnpm test` exits 0 with all unit tests green
- [ ] **Unit test coverage ≥ 80%** — line coverage for new code in the story's scope
- [ ] **Integration tests pass** — tRPC router integration tests and Auth.js flow tests pass
- [ ] **E2E tests pass** — Playwright tests for the story's user-facing flows pass
- [ ] **Test contracts satisfied** — every Gherkin acceptance criterion in `product-backlog.md` for the story has a corresponding passing test
- [ ] **No placeholder tests** — every `it()` / `test()` block contains executable assertions with meaningful messages; `expect(true).toBe(true)` is prohibited
- [ ] **Security test coverage** — tests exist for threat model mitigations relevant to the story (see Threat Model mapping in product backlog)

## 3. Security Compliance

Derived from `docs/threat-model.md` — the security requirements that apply to every story.

- [ ] **Input validation** — all user inputs validated with Zod schemas at API boundaries before processing
- [ ] **Tenant isolation** — every protected database query includes `tenantId` extracted from the authenticated session, never from request parameters (I-07, E-02)
- [ ] **Authentication enforcement** — every Server Action and tRPC procedure begins with `auth()` session validation; unauthenticated requests are rejected (E-05)
- [ ] **No user enumeration** — authentication error messages are generic; response timing is consistent for valid/invalid accounts (I-02)
- [ ] **No credential logging** — SSH keys, passwords, tokens, and session identifiers are excluded from all log output; Pino serializers configured to strip sensitive fields (I-05)
- [ ] **SSH command safety** — all SSH commands use parameterized templates; no string concatenation with user input (T-01)
- [ ] **Session security** — session cookies use HttpOnly, Secure, SameSite=Lax attributes; sessions are database-backed with server-side revocation (S-02)
- [ ] **CSRF protection** — Server Actions and mutating API routes include CSRF protection; destructive operations require confirmation step (T-06, NFR-006)
- [ ] **Audit logging** — all state-changing operations are recorded in the audit log with: action, timestamp, user_id, target, outcome, IP address, user agent (R-01)

## 4. Accessibility Compliance

Derived from `docs/wcag-audit.md` — WCAG 2.2 Level AA conformance.

- [ ] **Color contrast** — all text meets WCAG 2.2 AA contrast ratios (4.5:1 normal text, 3:1 large text) using the verified OKLCH design tokens
- [ ] **Keyboard navigation** — all interactive elements are reachable and operable via keyboard; visible focus indicators on all focusable elements
- [ ] **Screen reader compatibility** — meaningful alt text on all images/icons; ARIA attributes on dynamic content; `sr-only` text for visual-only status indicators
- [ ] **Form accessibility** — form fields have associated `<label>` elements; radio groups use `<fieldset>` + `<legend>`; inline validation messages are programmatically associated with fields via `aria-describedby`
- [ ] **Status indicators** — every color-coded status (health, severity) pairs color with a text label; no information conveyed by color alone
- [ ] **Reduced motion** — animations respect `prefers-reduced-motion` media query; the Pulse Ring and spring animations pause when reduced motion is preferred
- [ ] **Mobile responsive** — all screens render correctly at 375px minimum viewport width; touch targets meet 44x44px minimum

## 5. Documentation

- [ ] **Artifact frontmatter** — every produced artifact has complete YAML frontmatter per artifact convention
- [ ] **API documentation** — new or modified tRPC procedures are documented in `api-contracts.md` with Zod schemas, error codes, and example payloads
- [ ] **Schema documentation** — new or modified database tables/columns are documented with Drizzle schema comments
- [ ] **Inline code comments** — complex logic has explanatory comments; no comments on self-evident code

## 6. Code Review

- [ ] **Tech Lead review** — code reviewed and approved by the Tech Lead
- [ ] **No self-merge** — the producing agent did not merge their own code
- [ ] **Review checklist complete** — all items in the team working agreements review checklist (§2.2) are verified
- [ ] **No unresolved blocking comments** — all blocking review comments are addressed

## 7. Integration

- [ ] **Feature branch compatible** — code merges cleanly to the feature branch without conflicts
- [ ] **No regressions** — existing tests continue to pass after merge; no functionality broken
- [ ] **Cross-track compatibility** — changes in Track A do not break Track B and vice versa (verified at integration checkpoint)
- [ ] **Database migrations** — migrations run cleanly on a fresh database and on an existing database with seed data

## 8. Deployment Readiness

- [ ] **Docker Compose works** — local development environment starts and the story's functionality is exercisable
- [ ] **Environment variables** — any new environment variables are documented and have sensible defaults for development
- [ ] **No hardcoded secrets** — zero API keys, credentials, or secrets in source code; all sensitive values sourced from environment variables
- [ ] **CI pipeline green** — GitHub Actions workflow (lint, typecheck, test) passes on the story branch

## 9. Work Item Lifecycle

- [ ] **Task exists** — an Azure Boards Task was created before any artifact or code (Task-First protocol)
- [ ] **Task has elaborative description** — the Task description explains scope, purpose, and expected artifacts
- [ ] **Artifact deployed** — artifact committed and pushed via `deploy-artifact.mjs --propagate` with FQDN GitHub Pages URL
- [ ] **Artifact links in work item** — the Task Description field contains clickable GitHub Pages artifact links
- [ ] **Ancestor propagation** — artifact links propagated to parent Story, Feature, and Epic work items
- [ ] **Acceptance criteria checked** — all Gherkin scenarios in the product backlog for this story are verified

---

## Applicability Matrix

Not every DoD item applies to every agent's deliverable. The matrix below indicates which sections are mandatory per agent role.

| Section | DBA | BE | FE | DevOps | Testing |
|---------|-----|----|----|--------|---------|
| 1. Code Quality | ✓ | ✓ | ✓ | ✓ | ✓ |
| 2. Test Coverage | — | ✓ | ✓ | ✓ | ✓ (produces tests) |
| 3. Security Compliance | ✓ (schema-level) | ✓ | ✓ (UI-level) | ✓ (infra-level) | ✓ (verifies) |
| 4. Accessibility | — | — | ✓ | — | ✓ (verifies) |
| 5. Documentation | ✓ | ✓ | ✓ | ✓ | ✓ |
| 6. Code Review | ✓ | ✓ | ✓ | ✓ | ✓ |
| 7. Integration | ✓ | ✓ | ✓ | ✓ | ✓ |
| 8. Deployment Readiness | ✓ | ✓ | ✓ | ✓ | ✓ |
| 9. Work Item Lifecycle | ✓ | ✓ | ✓ | ✓ | ✓ |

## Workflow Observations

No framework friction observed during DoD definition.

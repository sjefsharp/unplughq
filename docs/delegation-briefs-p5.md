---
artifact: delegation-briefs-p5
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
  - testing
  - security-analyst
  - accessibility
date: 2026-03-15
---

# Delegation Briefs — Phase 5 (Verification)

## P5 Execution Overview

Phase 5 follows: `TL → TEST ∥ SEC ∥ A11Y → TL`

1. **Tech Lead** verifies integrated build on feature branch (Gate 5 pre-check)
2. **Testing** executes E2E tests and validates test coverage
3. **Security Analyst** reviews code against threat model
4. **Accessibility** audits against WCAG 2.2 AA criteria
5. **Tech Lead** collates results, files bugs, determines pass/fail

### Context

- **Feature branch:** `feat/epic-001-unplughq-platform`
- All sub-branches merged by TL at P4 Step 2 end
- All code is integrated and build passes
- Sprint 1: 8 stories (AB#194–AB#201)

---

## Brief: Tech Lead (P5 — Pre-Check)

### Objective

Run the full verification suite on the integrated feature branch. Confirm that build, typecheck, lint, audit, and unit tests all pass before specialist verification agents begin.

### Verification Checklist

```
pnpm install            → exit 0
pnpm typecheck          → exit 0
pnpm lint               → exit 0
pnpm build              → exit 0
pnpm test               → exit 0 (all Vitest tests)
pnpm audit              → 0 critical/high findings
docker compose up       → all services healthy
```

### Expected Outputs

1. **Gate 5 pre-check report** — verification results document with pass/fail per command
2. Environment running for Testing, SEC, and A11Y agents to verify against

### Task Creation Expectations

- 1 Task for Gate 5 pre-check verification

### Acceptance Criteria (PO Evaluation)

- All 7 verification commands pass
- Environment is running and accessible for specialist agents

---

## Brief: Testing Agent (P5)

### Objective

Execute all test contracts (unit, integration, E2E) against the integrated codebase. Report coverage metrics and file Bug work items for any failing tests or uncovered acceptance criteria.

### Artifact Inputs

| Artifact | Path | Key Data |
|----------|------|----------|
| Product Backlog | `docs/product-backlog.md` | Gherkin AC — test-to-AC traceability |
| Test contracts | `code/tests/` | Test files written at P4 Step 1 |

### Expected Outputs

1. **Test execution report** — artifact documenting:
   - Test suite pass/fail counts
   - Coverage metrics (line, branch, function)
   - Failing test details with reproduction steps
   - Acceptance criteria coverage matrix (AC → test → status)

2. **Bug work items** — Created in Azure Boards for:
   - Failing test scenarios
   - Missing acceptance criteria coverage
   - Regression issues found during E2E execution

### E2E Test Scenarios (Sprint 1)

Execute the following Playwright scenarios:

**Auth Track (F4):**
- Signup flow: valid registration → redirect to dashboard
- Signup validation: duplicate email → generic error, weak password → strength feedback
- Login flow: valid credentials → session cookie set → dashboard access
- Login failure: invalid credentials → generic error (no user enumeration)
- Logout: session destroyed, redirected to login
- Password reset: request → email link → new password → login with new password
- Account settings: update display name, update email, toggle notification preferences
- Session expiry: expired session → redirect to login

**Server Track (F1):**
- Wizard Step 1: IP + credentials → submit → proceed to Step 2
- Wizard Step 2: connection test → display OS/specs → proceed to Step 3
- Wizard Step 3: provisioning progress via SSE → completion → redirect to dashboard
- Server tile: server appears on dashboard with status indicator
- Error handling: unreachable server → user-friendly error, invalid key → clear feedback

**Cross-Cutting:**
- Keyboard navigation: Tab through all interactive elements on each screen
- Mobile responsive: All flows functional at 375px viewport
- Empty states: Dashboard with no servers shows "Add Server" CTA

### Task Creation Expectations

- 1 Task for test execution and reporting
- Bug work items as discovered (no limit)

### Acceptance Criteria (PO Evaluation)

- All unit tests pass
- All integration tests pass
- E2E tests cover every Gherkin scenario in Sprint 1 stories
- Coverage report shows ≥80% line coverage for new code in Sprint 1
- Bug work items created for any failures (filed against parent Story)

### Dependencies

- TL pre-check passed (build compiles, environment running)

### Available Skills

- `vitest` — Test execution, coverage configuration
- `playwright-best-practices` — E2E execution patterns

---

## Brief: Security Analyst (P5)

### Objective

Conduct a security code review of all Sprint 1 implementation against the threat model. Evaluate OWASP Top 10 compliance and verify that threat mitigations specified in `threat-model.md` are correctly implemented.

### Artifact Inputs

| Artifact | Path | Key Data |
|----------|------|----------|
| Threat Model | `docs/threat-model.md` | 30 STRIDE threats, 57 security requirements, priority ratings |
| API Contracts | `docs/api-contracts.md` | Auth middleware, error handling patterns, rate limiting spec |
| Architecture Overview | `docs/architecture-overview.md` | ADR decisions on crypto, isolation, least privilege |

### Review Scope

#### Authentication & Authorization (S-01 through S-06)
- [ ] S-01: Rate limiting on login endpoint (10 failed / 5 min → lock)
- [ ] S-02: Session cookies HttpOnly, Secure, SameSite=Lax
- [ ] S-03: Per-server API token authentication for monitoring agent
- [ ] S-04: CSRF protection on state-changing requests
- [ ] S-05: Session invalidation on password change
- [ ] S-06: Auth.js CSRF token validation on all mutation endpoints

#### Tampering (T-01 through T-07)
- [ ] T-01: SSH commands use parameterized templates — no string concatenation
- [ ] T-02: Zod strict parsing on all tRPC inputs (`.strict()`, no `.passthrough()`)
- [ ] T-03: tRPC subscriptions validate origin
- [ ] T-04: Caddy admin API bound to localhost only
- [ ] T-05: Database migrations run through Drizzle kit — no raw SQL
- [ ] T-06: Environment variables only from `.env` — no runtime config endpoints
- [ ] T-07: Redis AUTH password set and enforced

#### Information Disclosure (I-01 through I-07)
- [ ] I-01: SSH private keys encrypted at rest with AES-256-GCM
- [ ] I-02: Generic error messages on auth failures
- [ ] I-03: Verbose stack traces disabled in production
- [ ] I-04: API errors use application error codes, not database/system errors
- [ ] I-05: Structured logging excludes PEM key material and passwords
- [ ] I-06: Monitoring metrics validated against Zod schema before persistence
- [ ] I-07: Tenant isolation — every query includes tenantId from session context

#### Denial of Service (D-01 through D-05)
- [ ] D-01: Global API rate limiting (1000 req/min per IP)
- [ ] D-02: Metrics endpoint rate limited (2 req/min per server)
- [ ] D-03: File upload size limits (SSH key < 16KB)
- [ ] D-04: SSH connection pool limits (max 3 per server, 30s/120s timeout)
- [ ] D-05: BullMQ job data validated before processing

#### Elevation of Privilege (E-01 through E-04)
- [ ] E-01: tRPC middleware enforces `authed` context before protected procedures
- [ ] E-02: All entity IDs are UUID v4 — no sequential integers
- [ ] E-03: Role-based access — owner-only operations verified
- [ ] E-04: SSH user created with limited sudoers (explicit allowlist)

### Expected Outputs

1. **Security review report** — artifact documenting:
   - Each mitigation: implemented / partial / missing
   - Critical findings with CVSS score
   - Remediation guidance for any gaps
   - OWASP Top 10 (2021) mapping

2. **Bug work items** — Created in Azure Boards for:
   - Missing mitigations (severity: critical, blocker)
   - Partial implementations (severity: major)
   - Code-level security issues (severity per CVSS)

### Task Creation Expectations

- 1 Task for security code review and report

### Acceptance Criteria (PO Evaluation)

- All 30 threats reviewed with implementation status
- Zero critical/high unmitigated findings (or Bug work items created for each)
- SSH command injection prevention verified with specific code references
- Tenant isolation verified for every database query
- Key encryption verified with correct algorithm (AES-256-GCM, not AES-CBC)

### Dependencies

- TL pre-check passed (code is on feature branch, buildable)

### Available Skills

- `security-best-practices` — OWASP patterns, security review methodology
- `authjs-skills` — Auth.js v5 security configuration validation

---

## Brief: Accessibility Agent (P5)

### Objective

Audit all Sprint 1 screens against WCAG 2.2 AA criteria. Verify that the 5 critical findings from `wcag-audit.md` (P2) are addressed in the implementation. Run both automated and manual accessibility checks.

### Artifact Inputs

| Artifact | Path | Key Data |
|----------|------|----------|
| WCAG Audit | `docs/wcag-audit.md` | 5 critical findings from P2 design review |
| Accessibility Guidelines | `docs/accessibility-guidelines.md` | ARIA patterns, keyboard interaction specs |
| Wireframes | `docs/wireframes.md` | Screen layouts with tab order annotations |
| Design System | `docs/design-system.md` | Color contrast ratios, font sizes |
| Copy Specs | `docs/copy-specs.md` | Error messaging patterns for screen readers |

### Audit Scope

#### Sprint 1 Screens
1. `/signup` — Registration form
2. `/login` — Login form
3. `/forgot-password` — Password reset request
4. `/reset-password/[token]` — New password form
5. `/settings` — Account settings
6. `/welcome` — Onboarding welcome
7. `/connect/credentials` — Server wizard Step 1
8. `/connect/validation` — Server wizard Step 2
9. `/connect/provisioning` — Server wizard Step 3 (SSE progress)
10. `/dashboard` — Server tile, empty state

#### P2 Critical Findings Verification
- [ ] CF-01: `--color-text-subtle` token produces ≥ 4.5:1 contrast ratio (was 3.26:1)
- [ ] CF-02: Input field borders have ≥ 3:1 non-text contrast (was 1.86:1)
- [ ] CF-03: Form radio groups / checkbox groups use `<fieldset>` + `<legend>`
- [ ] CF-04: All icons and illustrations have meaningful alt text
- [ ] CF-05: Keyboard alternative available for drag-and-drop / swipe actions

#### WCAG 2.2 AA Check areas
- **Perceivable:** Column contrast, text alternatives, captions/transcripts, adaptable layout
- **Operable:** Keyboard navigation, focus management, skip links, motion/animation
- **Understandable:** Error identification, labels/instructions, predictable behavior
- **Robust:** ARIA role/property validity, name/role/value on all interactive elements

### Expected Outputs

1. **Accessibility audit report** — artifact documenting:
   - P2 critical findings: remediated / still open
   - Per-screen audit results (pass/fail per WCAG criterion)
   - axe-core automated scan results
   - Manual keyboard navigation test results
   - Screen reader compatibility notes (NVDA/VoiceOver)

2. **Bug work items** — Created in Azure Boards for:
   - WCAG AA violations (severity per impact and frequency)
   - Screen reader compatibility issues
   - Keyboard trap or focus management issues

### Task Creation Expectations

- 1 Task for WCAG audit and reporting

### Acceptance Criteria (PO Evaluation)

- All 5 P2 critical findings verified as remediated
- Zero new WCAG 2.2 AA violations at Level A (or Bug work items created)
- Every form field has associated `<label>` with `htmlFor`
- Every error message announced via `aria-live="assertive"` or `role="alert"`
- Focus moves to the first form field on page load for wizard steps
- Skip-to-content link available on every page
- `prefers-reduced-motion` respected for all animations
- Tab order matches visual reading order on all screens

### Dependencies

- TL pre-check passed (application running for live testing)

### Available Skills

- `web-accessibility` — WCAG testing methodology, automated + manual
- `playwright-best-practices` — For assistive technology simulation

---

## Tech Lead Brief: P5 End (Bug Triage)

### Objective

Collate verification results from Testing, SEC, and A11Y. Create a consolidated verification summary. Triage bugs by severity. Determine Sprint 1 pass/fail status.

### Expected Outputs

1. **Verification summary** — consolidated report with:
   - Test results: pass/fail counts, coverage
   - Security review status: all mitigations verified
   - A11Y audit status: all WCAG criteria met
   - Bug count by severity
   - Sprint 1 gate recommendation: PASS / CONDITIONAL PASS / FAIL

### Task Creation Expectations

- 1 Task for verification triage and summary

### Gate 5 Decision Criteria

- **PASS:** All tests pass, zero critical/high bugs, WCAG AA compliant
- **CONDITIONAL PASS:** Minor bugs exist, none blocking deployment, fix tracked in Sprint 2
- **FAIL:** Critical/high security bugs, WCAG A failures, or core AC not met → re-iteration required

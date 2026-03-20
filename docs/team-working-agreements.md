---
artifact: team-working-agreements
produced-by: scrum-master
project-slug: unplughq
work-item: epic-001-unplughq-platform
work-item-type: epic
workflow-tier: full
phase: P3
version: 2.0.0
status: draft
azure-devops-id: 286
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
date: 2026-03-16
---

# Team Working Agreements — UnplugHQ PI-2 Sprint 2

## 1. Communication Norms

### 1.1 Artifact-Led Communication

All inter-agent communication flows through artifacts in `docs/`. Agents read upstream artifacts directly — never rely on summaries or verbal relay. The filesystem is the single source of truth.

| Principle | Agreement |
|-----------|-----------|
| Read before writing | Every agent reads all artifacts listed in their `consumed-by` chain before producing output |
| No verbal relay | If information exists in an artifact, reference the artifact path — do not paraphrase |
| Contradiction escalation | If two artifacts conflict, halt and report both file paths and conflicting statements to the PM |
| Artifact completeness | Every artifact is self-contained — a downstream agent can do their work by reading it alone |

### 1.2 Discussion Threads

Azure Boards discussion threads are used for natural-language commentary on what was accomplished, blockers encountered, and decisions made. Discussion threads contain summaries and context — not raw URLs.

### 1.3 Escalation Procedures

| Severity | Condition | Action | Owner |
|----------|-----------|--------|-------|
| **Blocker** | Missing upstream artifact or broken dependency | Halt work, set `status: blocked`, report to PM with artifact path and missing item | Affected agent |
| **Cross-artifact contradiction** | Two upstream artifacts disagree on a requirement, constraint, or specification | Halt, report both file paths and conflicting statements to PM | Affected agent |
| **Technology constraint from PM** | PM imposes technology choices | Challenge the constraint, record in `## Workflow Observations`, defer to SA | Any agent |
| **Quality-preventing constraint** | Missing inputs or contradictions would force substandard work | Halt, set `status: blocked`, report the specific constraint to PM | Any agent |
| **Scope change** | New requirement discovered during implementation | Create a Bug or log in discussion thread, do not unilaterally expand scope | PO (via PM) |

## 2. Code Review Standards

### 2.1 Review Requirements

| Rule | Standard |
|------|----------|
| Minimum reviewers | Every code change reviewed by Tech Lead before merge |
| Self-merge prohibition | No agent merges their own code to the feature or story branch |
| Review scope | Functional correctness, type safety, security compliance (threat model), accessibility compliance (WCAG audit) |
| Blocking categories | Security violations, type errors, failing tests, accessibility regressions, raw SQL usage |
| Non-blocking categories | Style preferences already covered by ESLint/Prettier, minor naming suggestions |

### 2.2 Review Checklist (Per Code Change)

- [ ] TypeScript strict mode — zero `any` types, zero `@ts-ignore` directives
- [ ] All database queries use Drizzle ORM parameterized queries — no raw SQL (`sql.raw()` prohibited per T-02)
- [ ] All user inputs validated with Zod schemas at API boundaries
- [ ] Tenant isolation: every protected query includes `tenantId` from session — never from request parameters (I-07)
- [ ] SSH commands use parameterized templates — no string concatenation (T-01)
- [ ] HttpOnly, Secure, SameSite=Lax on all session cookies (S-02)
- [ ] Generic error messages on auth failures — no user enumeration (I-02)
- [ ] No SSH key material, passwords, or tokens in log output (I-05)
- [ ] ARIA attributes and keyboard navigation per `wcag-audit.md` findings
- [ ] Destructive operations require explicit confirmation step (NFR-006)

### 2.3 Merge Criteria

A code change is merge-eligible when:

1. `pnpm typecheck` exits 0
2. `pnpm lint` exits 0
3. `pnpm build` exits 0
4. `pnpm test` exits 0 with coverage thresholds met
5. Tech Lead review approved
6. No unresolved blocking comments

## 3. Branch Conventions

### 3.1 Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Epic | `feat/epic-{NNN}-{name}` | `feat/epic-001-unplughq-platform` |
| Story | `story/story-{NNN}-{name}` | `story/story-194-user-registration` |
| Fix | `fix/bug-{NNN}-{name}` | `fix/bug-005-mobile-menu-close` |

### 3.2 Branch Ownership

| Action | Owner |
|--------|-------|
| Create feature/epic branch | PM (at P0) |
| Create story/fix branch | PO (when invoked by PM) |
| Create worktrees and sub-branches | Tech Lead (at P4 Step 2) |
| Merge sub-branches to feature/story branch | Tech Lead (at P4 end, P5 end) |
| Merge story/fix branch to feature branch | PM |
| Merge feature branch to `main` | PM (at P8) |

### 3.3 Branch Hygiene

- Feature branch: `feat/pi-2-sprint-2` is the active branch for PI-2 Sprint 2
- Code agents work in their assigned worktrees — never push directly to the feature branch
- Sub-branches follow pattern: `feat/pi-2-sprint-2/{track}` (e.g., `/fe`, `/be`, `/dba`, `/devops`)
- Bug fixes (Track E) commit directly to `feat/pi-2-sprint-2` per sprint backlog assignment
- Delete sub-branches after successful merge to feature branch

## 4. Commit Message Standards

### 4.1 Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 4.2 Types

| Type | Usage |
|------|-------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `refactor` | Code restructuring without behavior change |
| `test` | Test additions or modifications |
| `docs` | Documentation changes |
| `chore` | Tooling, dependencies, build configuration |
| `ci` | CI/CD pipeline changes |
| `style` | Formatting changes (whitespace, semicolons) |

### 4.3 Scope

Use the feature area or component: `auth`, `server`, `dashboard`, `catalog`, `deploy`, `monitor`, `alert`, `db`, `devops`, `a11y`, `api`, `security`

### 4.4 Rules

- Subject line: imperative mood, no period, max 72 characters
- Body: explain *what* and *why*, not *how*
- Footer: include Azure Boards trailer `AB#{id}` for traceability
- Every commit must reference a work item via `AB#{task-id}`

### 4.5 Examples

```
feat(auth): add login endpoint with rate limiting

Implements Auth.js v5 credentials provider with Argon2id password
verification. Rate limits login attempts to 10 per 5 minutes per
account per BR-F4-001. Generic error messages prevent user enumeration.

AB#195
```

```
fix(server): prevent SSH command injection in provisioning

Replace string concatenation with parameterized command templates
for all SSH operations per threat model T-01 mitigation.

AB#200
```

## 5. Meeting Cadence

### 5.1 Sprint Ceremonies

| Ceremony | Frequency | Duration | Participants | Purpose |
|----------|-----------|----------|--------------|---------|
| Sprint Planning | Sprint start | 60 min | All agents | Commit to sprint backlog, clarify acceptance criteria |
| Daily Standup | Daily | 15 min | All active agents | Progress, blockers, dependency coordination |
| Sprint Review | Sprint end | 45 min | All agents + PM | Demonstrate completed work, gather feedback |
| Sprint Retrospective | Sprint end | 30 min | All agents | Identify improvements for next sprint |
| Backlog Refinement | Mid-sprint | 30 min | PO + active agents | Refine Sprint 2 candidates, clarify stories |

### 5.2 Technical Coordination

| Event | Frequency | Participants | Purpose |
|-------|-----------|--------------|---------|
| Track Sync | Daily (Week 1) | TL + track agents | Coordinate Track C / Track D / Track E dependencies |
| Schema Review | Day 2 | DBA + BE + TL | Verify Sprint 2 schema supports catalog, deployment, alert, and metrics features |
| Bug Review Checkpoint | Day 3 | TL + BE + FE + DevOps | Verify all 5 deferred PI-1 bugs are resolved or on track |
| Integration Checkpoint | End of Week 1 | TL + all code agents | Verify sub-branches are mergeable, bug fixes integrated, resolve conflicts |
| SSE Integration Review | Day 7 | BE + FE + TL | Verify SSE event pipeline works end-to-end (BullMQ → SSE → client) |
| Deployment Pipeline Review | Day 8 | BE + DevOps + TL | Verify deploy state machine, rollback cleanup, and health check endpoints |

## 6. Tool Usage Agreements

### 6.1 Required Tools

| Tool | Purpose | Configuration |
|------|---------|---------------|
| pnpm 10.x | Package management | Workspace configuration, strict dependency resolution |
| TypeScript 5.9.x | Language | Strict mode enabled, no implicit any |
| ESLint | Linting | Project configuration matching architecture conventions |
| Prettier | Formatting | Consistent formatting across all agents' code |
| Vitest | Unit/Integration testing | Coverage thresholds per DoD |
| Playwright | E2E testing | Browser verification for UI components |
| Docker Compose | Local development | PostgreSQL 17 + Redis/Valkey containers |
| Git | Version control | Trunk-based development per branching strategy |

### 6.2 Tool Rules

- All tools must be configured before code agents start (Tech Lead responsibility at P4 Step 2)
- No modifications to build configuration to suppress errors (Quality Standards Rule 11)
- No `@ts-ignore`, `eslint-disable` without documented justification in code comment
- No `--no-verify` on git commits — commit hooks are mandatory
- Agent-specific skills from `.github/skills/` are available per delegation briefs

## 7. Definition of Done Reference

All stories are subject to the authoritative Definition of Done at `docs/definition-of-done.md`. No story is considered complete until every applicable DoD item is satisfied.

## 8. Sprint 2 Specific Agreements

### 8.1 PI-1 Retrospective Action Items (Incorporated)

The following agreements are derived from PI-1 Sprint 1 retrospective findings (`docs/retrospective-report.md`):

| Action Item | Retro Ref | Agreement | Owner |
|-------------|-----------|-----------|-------|
| Bug-first sequencing | A1 | All 5 deferred PI-1 bugs (AB#258, AB#259, AB#260, AB#262, AB#251) are resolved in Week 1 before any new F2/F3 code that exercises affected paths (mutation endpoints, SSH operations, route transitions) | PO / BE / FE / DevOps |
| E2E test infrastructure | A2 | Playwright E2E tests are mandatory for Sprint 2; every user-facing story must have at least one E2E test in the test contract | TST / TL |
| P4 self-review checkpoint | A3 | Before submitting code for TL merge, every code agent must complete the P4 Self-Review Checklist (§8.4) — this is not optional | All code agents |
| CI dependency audit | A8 | `pnpm audit` is added to the CI pipeline; any critical/high vulnerability fails the build | DevOps |

### 8.2 Bug-First Sequencing Protocol (BR-BF-001)

Sprint 2 carries 5 deferred PI-1 bugs (4 high, 1 medium) totaling 17 SP. These are not backlog items competing with features — they are Week 1 mandatory prerequisites.

| Rule | Detail |
|------|--------|
| Week 1 priority | BE starts with CSRF fix (AB#258), audit logging (AB#259), secrets rotation (AB#260). DevOps starts with sudoers fix (AB#262). FE starts with focus management (AB#251). |
| Blocking criterion | No code agent may commit new F2/F3 feature code to story branches until all bug fixes on their track are merged to `feat/pi-2-sprint-2` |
| Verification | Each bug fix must pass its specific acceptance criteria from the SEC/A11Y audit before merge. Testing agent writes regression tests at P4 Step 1. |
| Escalation | If any bug fix reveals scope creep beyond its original AC, halt and report to PO — do not absorb silently |

### 8.3 SSE Testing Protocol

Sprint 2 introduces Server-Sent Events (SSE) for real-time deployment progress (S-204) and metrics updates (S-207/208). SSE requires specific testing discipline:

| Rule | Detail |
|------|--------|
| Unit test SSE emission | Every SSE event type (`deployment.progress`, `metrics.update`, `alert.created`, `alert.dismissed`) must have a unit test verifying event shape and emission timing |
| Integration test SSE delivery | tRPC SSE subscriptions must have integration tests verifying event delivery through the full stack (BullMQ job → SSE emitter → client handler) |
| E2E test SSE reliability | Playwright E2E tests must verify SSE-driven UI updates render correctly, including the fallback-to-polling path (NFR-017) |
| Connection lifecycle | Tests must cover SSE reconnection after network interruption and cleanup on component unmount |
| Browser verification | FE agent must verify SSE-driven real-time updates in the browser (deployment progress bar, dashboard live metrics) before merge — terminal-only verification is insufficient for SSE |

### 8.4 P4 Self-Review Checklist (Code Agent Exit Gate)

Derived from retrospective finding §3.1: 14 of 16 P5 bugs were security or accessibility issues catchable at implementation time. Every code agent must verify the following before requesting TL merge:

**Security Self-Review:**

- [ ] All mutation endpoints validate CSRF token (double-submit cookie pattern per BF-001)
- [ ] All state-changing operations create an audit log entry (action, timestamp, user_id, target, outcome, IP, user agent)
- [ ] Session lifecycle is complete: invalidation on password change, logout clears all sessions, token rotation on privilege escalation
- [ ] Rate limiting applied to auth endpoints and expensive operations
- [ ] SSH commands use parameterized templates — no string concatenation
- [ ] No secrets in log output — verify Pino serializer configuration strips sensitive fields

**Accessibility Self-Review:**

- [ ] All form groups wrapped in `<fieldset>` with `<legend>`
- [ ] All pages have unique, descriptive `<title>` elements
- [ ] All interactive elements reachable via keyboard with visible focus indicators
- [ ] Dynamic content updates announced via ARIA live regions
- [ ] Color-coded statuses pair color with text label — no information by color alone
- [ ] Animations respect `prefers-reduced-motion`
- [ ] All images/icons have meaningful alt text or are marked decorative

### 8.5 Deployment Pipeline Review Gates

Sprint 2 introduces deployment features (S-204, S-205) that require additional review scrutiny:

| Gate | Checkpoint | Reviewer |
|------|-----------|----------|
| Deployment state machine | Every state transition in `DeploymentStatus` (pending→pulling→configuring→provisioning-ssl→starting→running/failed) must be tested with both success and failure paths | Testing + TL |
| Rollback verification | Deployment failure cleanup (container removal, route cleanup, env file cleanup) must be verified before merge | BE + DevOps + TL |
| Health check endpoint | Post-deployment health check (S-205) must verify the app HTTP endpoint responds with 200 before marking deployment as "running" | BE + Testing |
| Resource isolation | Multi-app coexistence (S-206) must prove that deploying a second app does not disrupt the first app's container, routes, or data | BE + Testing + TL |

### 8.6 Parallel Track Coordination (Sprint 2)

Sprint 2 runs three parallel tracks that must be coordinated:

| Agreement | Detail |
|-----------|--------|
| Schema-first delivery | DBA delivers full Sprint 2 schema (catalog, deployment, alert, metrics extensions) in Week 1 before BE/FE consume it |
| Bug-first, then features | Week 1 prioritizes bug fixes (Track E) alongside DBA schema work. Feature tracks (C, D) begin BE/FE work after bug merges |
| Cross-track dependencies | Track D (Dashboard) depends on Track C (Catalog) deployment data for app tiles and health metrics — S-207 requires at minimum S-204 schema |
| Integration window | End of Week 1: Tech Lead merges and verifies sub-branches are compatible |
| P2 safety valve | P2 stories (S-205, S-206, S-209 = 15 SP) are committed but pre-authorized for descope if P1 stories consume more capacity than estimated |

### 8.7 Velocity Calibration

Sprint 1 delivered 47 SP. Sprint 2 commits 71 SP (29% over Sprint 1 velocity). The overcommitment is deliberately managed:

| Agreement | Detail |
|-----------|--------|
| Calibrated velocity | 55 SP (adjusted up from 47 SP: Sprint 1 scaffold overhead is removed) |
| Safety valve | 15 SP in P2 stories serves as descope buffer, bringing effective P1 commitment to 56 SP |
| Bug effort bounded | 17 SP of bugs have specific AC from SEC/A11Y audit — scope creep trigger applies (§8.2) |
| Daily WIP tracking | SM tracks active work items per track daily to detect overload early |

## Workflow Observations

No framework friction observed during PI-2 Sprint 2 planning facilitation.

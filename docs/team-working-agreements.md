---
artifact: team-working-agreements
produced-by: scrum-master
project-slug: unplughq
work-item: epic-001-unplughq-platform
work-item-type: epic
workflow-tier: full
phase: P3
version: 1.0.0
status: approved
review:
  evaluator: product-manager
  gate: 4
  date: 2026-03-15
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

# Team Working Agreements — UnplugHQ PI-1

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

- Feature branch: `feat/epic-001-unplughq-platform` is the active branch for PI-1
- Code agents work in their assigned worktrees — never push directly to the feature branch
- Sub-branches follow pattern: `feat/epic-001-unplughq-platform/{track}` (e.g., `/fe`, `/be`, `/dba`, `/devops`)
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

Use the feature area or component: `auth`, `server`, `dashboard`, `catalog`, `db`, `devops`, `a11y`, `api`

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
| Track Sync | Daily (Week 1) | TL + track agents | Coordinate Track A / Track B dependencies |
| Schema Review | Day 2 | DBA + BE + TL | Verify schema supports both tracks before code starts |
| Integration Checkpoint | End of Week 1 | TL + all code agents | Verify sub-branches are mergeable, resolve conflicts |

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

## 8. Sprint 1 Specific Agreements

### 8.1 Parallel Track Coordination

Sprint 1 runs two parallel tracks that must be coordinated:

| Agreement | Detail |
|-----------|--------|
| Schema-first delivery | DBA delivers complete schema (users, servers, sessions, audit_log) in Week 1 Days 1-2 before both tracks consume it |
| Track independence | Track A (Auth/F4) and Track B (Server/F1) have no cross-track code dependencies in Week 1 |
| Cross-track dependency point | Track B stories S-198 through S-201 depend on S-195 (authenticated user) — auth middleware must be available before server wizard work begins |
| Integration window | End of Week 1: Tech Lead merges and verifies sub-branches are compatible |
| P2 priority protection | P2 stories (S-196, S-197, S-201) are committed but may be descoped if P1 stories consume more capacity than estimated |

### 8.2 First Sprint Baseline

This is the team's first sprint. The following agreements reflect a conservative approach:

- Estimated velocity: 50 SP (buffer: 3 SP below the 47 SP commitment)
- Velocity will be calibrated after Sprint 1 actual performance
- Story point estimates are relative — anchored to S-194 (User Registration, 5 SP) as the reference story
- If a story is at risk of overflowing, signal in standup immediately — do not absorb silently

## Workflow Observations

No framework friction observed during P3 sprint planning facilitation.

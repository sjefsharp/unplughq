---
artifact: sprint-health-report
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
  - product-manager
  - product-owner
  - release-train-engineer
  - tech-lead
date: 2026-03-15
---

# Sprint Health Report — UnplugHQ Sprint 1

## 1. Sprint Goal

> **Establish the authentication foundation and server connection pipeline so that a user can register, log in, connect a VPS, and see it provisioned and appearing on the dashboard — delivering the critical-path infrastructure for all subsequent PI-1 features.**

This goal was defined by the PO in `sprint-backlog.md` and aligns with PI-1 Objectives PI1-O1 (trustworthy account foundation) and PI1-O2 (guided VPS connection and provisioning).

## 2. Sprint Parameters

| Parameter | Value |
|-----------|-------|
| Sprint number | 1 (PI-1) |
| Duration | 2 weeks |
| Estimated velocity | 50 SP (first sprint — conservative baseline) |
| Committed story points | 47 SP |
| Buffer | 3 SP (6.4% under estimated velocity) |
| Stories committed | 8 |
| P1 (Must Have) stories | 5 (S-194, S-195, S-198, S-199, S-200) |
| P2 (Should Have) stories | 3 (S-196, S-197, S-201) |
| Parallel tracks | 2 (Track A: Auth/F4, Track B: Server/F1) |

## 3. Capacity Allocation

### 3.1 Agent Capacity by Track

| Agent | Track A (Auth/F4) | Track B (Server/F1) | Cross-Cutting | Total Allocation |
|-------|-------------------|---------------------|---------------|------------------|
| DBA | Auth schema | Server schema | Complete schema delivery (Days 1-2) | 100% Week 1, 30% Week 2 |
| BE | Auth.js config, signup/login/logout APIs, password reset, account settings | SSH service, connection test, validation logic, provisioning workers | — | 100% both weeks |
| FE | Signup page, login page, reset UI, settings UI | Connection wizard, provisioning progress, server dashboard tile | — | 100% both weeks |
| DevOps | — | Monitoring agent container, Caddy config templates | Dev env setup, CI pipeline, Docker Compose | 100% both weeks |
| Testing | Auth test contracts | Server test contracts | E2E contracts spanning both tracks | 100% P4 Step 1, then verification |
| TL | — | — | Project scaffold, worktrees, dependency install, merge checkpoints | 100% P4 Step 2 start/end |

### 3.2 Story Point Distribution

| Track | Stories | SP | % of Sprint |
|-------|---------|----|-----------:|
| Track A (Auth/F4) | S-194, S-195, S-196, S-197 | 16 | 34% |
| Track B (Server/F1) | S-198, S-199, S-200, S-201 | 31 | 66% |
| **Total** | **8** | **47** | **100%** |

Track B carries 66% of sprint capacity, with S-200 (Automated Server Provisioning) alone at 13 SP (28% of total). This is the primary capacity risk.

### 3.3 Week-Level Breakdown

#### Week 1 — Foundation

| Agent | Deliverables | SP Coverage |
|-------|-------------|-------------|
| DBA | Complete schema: users, servers, sessions, audit_log, migrations | Enables all stories |
| BE | Auth.js v5 config, signup endpoint, login/logout/session, SSH service skeleton, connection test, tRPC auth router, tRPC server router | S-194 (5), S-195 (5), S-198 (partial) |
| FE | Signup page, login page, connection wizard UI (Steps 1-2) | S-194 (5), S-195 (5), S-198 (partial) |
| DevOps | Docker Compose, CI pipeline, dev env | Cross-cutting |
| Testing | Unit + integration + E2E test contracts | P4 Step 1 |
| TL | Project scaffold, worktrees, dependency install | P4 Step 2 start |

#### Week 2 — Completion

| Agent | Deliverables | SP Coverage |
|-------|-------------|-------------|
| DBA | Seed data, index tuning | S-200 support |
| BE | Provisioning job handlers, password reset API, account settings API, health indicator endpoint | S-200 (13), S-196 (3), S-197 (3) |
| FE | Provisioning progress UI, password reset UI, account settings UI, server dashboard tile | S-200 (13), S-196 (3), S-197 (3), S-201 (5) |
| DevOps | Monitoring agent container, Caddy config templates | S-200 support |
| TL | Integration merge, conflict resolution | P4 Step 2 end |

## 4. Dependency Analysis

### 4.1 Inter-Story Dependencies

```
S-194 (Registration)
  ↓
S-195 (Authentication) ← partial dependency: shared auth config
  ↓                  ↘
S-196 (Reset) ←←      S-198 (Server Wizard) ← authenticated user required
S-197 (Settings)         ↓
                       S-199 (Validation)
                         ↓
                       S-200 (Provisioning)
                         ↓
                       S-201 (Dashboard Presence)
```

### 4.2 Cross-Track Dependencies

| Dependency | Source | Target | Timing | Risk |
|------------|--------|--------|--------|------|
| Auth middleware | S-195 (Track A) | S-198 (Track B) | Week 1 mid-point | **Medium** — Track B server wizard requires authenticated user; auth middleware from S-195 must be available before S-198 FE work begins |
| Database schema | DBA (cross-cutting) | All stories | Week 1 Days 1-2 | **Low** — DBA delivers complete schema before both tracks begin; well-understood dependency |
| Docker Compose | DevOps (cross-cutting) | All code agents | Week 1 Day 1 | **Low** — Dev environment must be ready before any code agent starts |

### 4.3 Critical Path

The critical path runs through Track B:

```
DBA (schema) → BE (SSH service) → BE (validation) → BE (provisioning workers) 
→ DevOps (monitoring agent) → FE (provisioning progress UI) → FE (server dashboard tile)
```

S-200 (Automated Server Provisioning, 13 SP) is on the critical path and is the largest story. It depends on S-199 (Validation, 5 SP) which depends on S-198 (Wizard, 8 SP). Total critical path through Track B: 31 SP across 4 stories.

## 5. Risk Assessment

### 5.1 Sprint Risks

| ID | Risk | Probability | Impact | Affected Stories | Mitigation |
|----|------|-------------|--------|------------------|------------|
| R1 | **S-200 overflows sprint capacity** — Provisioning (13 SP) is the largest story and involves SSH, Docker, Caddy, and monitoring agent installation with BullMQ job orchestration | Medium | High | S-200, S-201 | Start SSH service implementation in Week 1. Provisioning phases (Docker, Caddy, Agent) can be delivered incrementally. If at risk by mid-Week 2, descope monitoring agent to a minimal heartbeat. |
| R2 | **Auth.js v5 integration friction** — Auth.js v5 has API differences from v4; team has no prior v5 experience | Medium | Medium | S-194, S-195 | Pre-research during P4 setup. Auth.js skill available at `.github/skills/authjs-skills/`. TL allocates setup time for Auth.js v5 skeleton configuration before code agents start. |
| R3 | **Cross-track integration conflicts** — Track A and Track B develop in parallel and may produce conflicting changes at merge | Low | Medium | All | Tech Lead merges at end of Week 1. Sub-branch strategy isolates tracks. DBA delivers schema first to establish shared foundation. |
| R4 | **DBA bottleneck in Week 1** — Both tracks depend on schema delivery in Days 1-2 | Low | High | All stories | DBA has priority on schema delivery. Schema review checkpoint with BE and TL on Day 2. If delayed, BE tracks can stub database operations temporarily. |
| R5 | **SSH library complexity underestimated** — ssh2 integration with key management, connection pooling, and error handling may be more complex than estimated | Medium | Medium | S-198, S-199, S-200 | ssh2 1.17.x is mature with extensive documentation. Focus on connection test first (S-198), then validation (S-199). Provisioning commands use pre-defined templates. |
| R6 | **First sprint velocity miscalibration** — 50 SP estimate may be too high or too low for this team's actual throughput | Medium | Low | Sprint planning accuracy | 47 SP committed with 3 SP buffer. P2 stories (S-196, S-197, S-201) are the descope candidates if velocity is lower than estimated. |

### 5.2 Risk Mitigation Priority

| Priority | Action | Owner | When |
|----------|--------|-------|------|
| 1 | Auth.js v5 skeleton setup during P4 Step 2 | TL | Day 1 |
| 2 | Schema delivery and review | DBA + TL | Days 1-2 |
| 3 | SSH service proof-of-concept (connect + execute) | BE | Week 1 |
| 4 | Integration checkpoint | TL + all agents | End of Week 1 |
| 5 | S-200 progress check | SM + TL | Mid-Week 2 |

## 6. Burndown Forecast

### 6.1 Ideal Burndown

| Day | SP Remaining (Ideal) | Cumulative Completed |
|-----|---------------------|---------------------|
| Day 1 | 47 | 0 |
| Day 2 | 42.3 | 4.7 |
| Day 3 | 37.6 | 9.4 |
| Day 4 | 32.9 | 14.1 |
| Day 5 | 28.2 | 18.8 |
| Day 6 | 23.5 | 23.5 |
| Day 7 | 18.8 | 28.2 |
| Day 8 | 14.1 | 32.9 |
| Day 9 | 9.4 | 37.6 |
| Day 10 | 0 | 47 |

### 6.2 Expected Burndown Pattern

This is Sprint 1 — expect an S-curve rather than a linear burndown:

- **Days 1-3:** Slow burn — environment setup, schema delivery, Auth.js configuration, test contract writing. Limited story completion. Actual SP burn: ~5 SP.
- **Days 4-6:** Acceleration — schema available, auth middleware ready. Track A stories S-194 and S-195 complete. Track B S-198 nearing completion. Actual SP burn: ~15 SP.
- **Days 7-8:** Peak velocity — S-199 completes, S-200 provisioning phases delivered incrementally. Track A P2 stories in progress. Actual SP burn: ~15 SP.
- **Days 9-10:** Tail — S-200 finalization, S-201 dashboard tile, integration merge, P2 story completion. Actual SP burn: ~12 SP.

### 6.3 Descope Triggers

If actual burndown deviates significantly from forecast, the following descope actions are pre-authorized by the PO:

| Trigger | Action | SP Recovered |
|---------|--------|-------------|
| S-200 not 50% done by Day 7 | Descope monitoring agent to heartbeat-only (remove detailed metrics collection) | ~3 SP effort reduction |
| Track A delayed past Day 6 | Defer S-196 (Password Reset) to Sprint 2 | 3 SP |
| Track A delayed past Day 7 | Defer S-197 (Account Settings) to Sprint 2 | 3 SP |
| Track B delayed past Day 8 | Defer S-201 (Dashboard Presence) to Sprint 2 | 5 SP |
| Cumulative slip > 10 SP by Day 7 | Escalate to PM/PO for scope renegotiation | Variable |

## 7. Sprint 1 Health Summary

| Metric | Status | Notes |
|--------|--------|-------|
| Sprint goal clarity | **Green** | Clear, measurable, aligned with PI-1 objectives O1 and O2 |
| Capacity vs commitment | **Green** | 47 SP committed against 50 SP estimated velocity; 6.4% buffer |
| Dependency risk | **Amber** | Cross-track dependency on auth middleware (S-195 → S-198) requires Week 1 coordination |
| Largest story risk | **Amber** | S-200 at 13 SP (28% of sprint) is high-risk; mitigation plan in place |
| Technical uncertainty | **Amber** | Auth.js v5 and ssh2 library integrations are new to the team; pre-research planned |
| Upstream artifact readiness | **Green** | All P1/P2 artifacts approved and available: architecture, requirements, threat model, WCAG audit, design system, API contracts |
| Parallel track isolation | **Green** | Track A and Track B can proceed independently in Week 1; single merge point at Week 1 end |
| Descope plan readiness | **Green** | Pre-authorized descope triggers defined for P2 stories |

**Overall Sprint Health: AMBER** — Achievable with identified risks. The 13 SP S-200 provisioning story and first-time Auth.js v5 integration are the primary concerns. Mitigation plans are in place. Sprint success depends on DBA schema delivery by Day 2 and auth middleware availability by mid-Week 1.

## 8. Velocity Baseline

This is Sprint 1 — there is no historical velocity data. The 50 SP estimate is a conservative first-sprint baseline derived from:

- 8 stories sized by the PO using relative estimation (anchored to S-194 at 5 SP)
- 4 code agents (DBA, BE, FE, DevOps) working in parallel across 2 tracks
- 2-week sprint duration with P4 Step 1 (test contracts) consuming first 1-2 days

After Sprint 1 completion, actual velocity will be used to calibrate Sprint 2 commitment. The Sprint 2 preview in `sprint-backlog.md` shows 54 SP across 8 stories — this may need scope negotiation based on Sprint 1 actuals.

## Workflow Observations

No framework friction observed during sprint health assessment.

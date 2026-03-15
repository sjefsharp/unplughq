---
artifact: sprint-backlog
produced-by: product-owner
project-slug: unplughq
work-item: epic-001-unplughq-platform
work-item-type: epic
workflow-tier: full
phase: P3
version: 1.0.0
status: approved
azure-devops-id: 193
review:
  evaluator: product-manager
  gate: 4
  date: 2026-03-15
consumed-by:
  - scrum-master
  - tech-lead
  - frontend-developer
  - backend-developer
  - database-administrator
  - devops-engineer
  - testing
date: 2026-03-15
---

# Sprint Backlog — UnplugHQ Sprint 1

## Sprint Goal

> Establish the authentication foundation and server connection pipeline so that a user can register, log in, connect a VPS, and see it provisioned and appearing on the dashboard — delivering the critical-path infrastructure for all subsequent PI-1 features.

## Sprint Parameters

| Parameter | Value |
|-----------|-------|
| Sprint Duration | 2 weeks |
| Sprint Start | Determined by SM at P3 |
| Team Velocity (estimated) | 50 SP (first sprint — conservative) |
| Sprint Capacity | FE + BE + DBA + DevOps parallel tracks |

## Selected Stories

### Track A: User Identity & Access (F4 — AB#184)

These stories have no dependency on F1 and can proceed in parallel.

| # | Story | AB# | SP | Priority | Assignee Track | Dependencies |
|---|-------|-----|----|----------|----------------|--------------|
| 1 | User Registration | AB#194 | 5 | P1 | BE + FE | None |
| 2 | User Authentication | AB#195 | 5 | P1 | BE + FE | S-194 (partial — shared auth config) |
| 3 | Password Reset Flow | AB#196 | 3 | P2 | BE + FE | S-194, S-195 |
| 4 | Account Settings | AB#197 | 3 | P2 | BE + FE | S-195 |

**Track A Total:** 16 SP

### Track B: Server Connection & Provisioning (F1 — AB#181)

Server connection is the critical path for all subsequent features.

| # | Story | AB# | SP | Priority | Assignee Track | Dependencies |
|---|-------|-----|----|----------|----------------|--------------|
| 5 | Guided Server Connection Wizard | AB#198 | 8 | P1 | BE + FE | S-195 (authenticated user) |
| 6 | Server Validation & Compatibility | AB#199 | 5 | P1 | BE + FE | S-198 |
| 7 | Automated Server Provisioning | AB#200 | 13 | P1 | BE + DevOps | S-199 |
| 8 | Server Dashboard Presence | AB#201 | 5 | P2 | FE | S-200 |

**Track B Total:** 31 SP

### Sprint Total

| Metric | Value |
|--------|-------|
| Stories committed | 8 |
| Story points committed | 47 SP |
| P1 (Must Have) stories | 5 (S-194, S-195, S-198, S-199, S-200) |
| P2 (Should Have) stories | 3 (S-196, S-197, S-201) |
| Risk buffer | 3 SP under estimated velocity |

## Execution Sequence

```
Week 1                                    Week 2
──────────────────────────────           ──────────────────────────────
Track A (F4 — Auth):                     Track A (F4 — Auth):
  DBA: Auth schema + migrations            FE: Password reset UI
  BE:  Auth.js config, signup endpoint     FE: Account settings UI
  FE:  Signup page + login page            BE: Settings API finalization
  BE:  Login/logout/session endpoints

Track B (F1 — Server):                   Track B (F1 — Server):
  DBA: Server schema + migrations          BE: Provisioning job handlers
  BE:  SSH service + connection test       DevOps: Monitoring agent container
  FE:  Connection wizard UI (Steps 1-2)    FE: Provisioning progress UI
  BE:  Validation/compatibility logic      FE: Server dashboard tile

Cross-cutting (both weeks):
  DBA: Full schema (users, servers, sessions, audit_log)
  DevOps: Project scaffold, CI pipeline, Docker dev environment
  Testing: Test contracts at P4 Step 1 (before code)
```

## Parallel Execution Model

```
           DBA                 BE                  FE                DevOps
           ───                 ──                  ──                ──────
Week 1  │ Schema design    │ Auth.js setup     │ Auth pages       │ Dev env setup
        │ Auth + Server    │ SSH service       │ Connection wiz   │ CI pipeline
        │ migrations       │ tRPC auth router  │ (Steps 1-2)     │ Docker compose
        │                  │ tRPC server router│                  │
        │                  │                   │                  │
Week 2  │ Seed data        │ Provision jobs    │ Provision UX     │ Monitor agent
        │ Index tuning     │ Password reset    │ Reset + Settings │ Caddy config
        │                  │ Account settings  │ Server tile      │ templates
        │                  │ Health indicator   │ Dashboard shell  │
```

## Sprint 2 Preview (Not Committed)

Sprint 2 will address F2 (Application Catalog & Deployment) and F3 (Dashboard & Health Monitoring):

| Story | AB# | SP | Feature |
|-------|-----|----|---------|
| Application Catalog Browsing | AB#202 | 5 | F2 |
| Guided App Configuration | AB#203 | 5 | F2 |
| Application Deployment with Progress | AB#204 | 13 | F2 |
| Post-Deployment Verification | AB#205 | 5 | F2 |
| Multi-App Coexistence | AB#206 | 5 | F2 |
| Dashboard Overview | AB#207 | 8 | F3 |
| Health Alert Notifications | AB#208 | 8 | F3 |
| Alert Management & Remediation | AB#209 | 5 | F3 |

**Sprint 2 Total:** 54 SP (8 stories) — may require scope negotiation based on Sprint 1 velocity.

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| SSH service complexity underestimated | S-200 provisioning may overflow | Start SSH service in Week 1; provisioning is the largest story at 13 SP |
| Auth.js v5 integration friction | Track A delayed | Pre-research during P4 setup; Auth.js skill available at `.github/skills/authjs-skills/` |
| Monitoring agent container scope | DevOps bandwidth | Agent is minimal for Sprint 1 (metrics push only); advanced features in Sprint 2 |
| Cross-track schema conflicts | DBA bottleneck | DBA delivers complete schema in Week 1 Day 1-2; both tracks consume it |

## Definition of Done Reference

Stories are subject to the Definition of Done at `docs/definition-of-done.md`.

## Metrics Collection Plan

| Metric | Method | Frequency | Feed Into |
|--------|--------|-----------|-----------|
| WIP | Count of stories in Active state per track in Azure Boards | Daily | SM sprint health report |
| Cycle Time | Story state transition timestamps (Active → Resolved) via Azure Boards query | Per story completion | RTE flow metrics report |
| Throughput | Stories completed per week | Weekly | RTE flow metrics, velocity calibration |
| Velocity | Sum of completed story points at sprint close | Per sprint | Sprint 2 capacity planning |
| Blocked Time | Duration stories spend in Blocked state | Per occurrence | SM impediment log |
| Defect Injection Rate | Bugs created during P5 per story | Per P5 cycle | Quality trend analysis |

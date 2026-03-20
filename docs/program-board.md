---
artifact: program-board
produced-by: release-train-engineer
project-slug: unplughq
work-item: task-287-rte-pi2-program-board
work-item-type: task
parent-work-item: epic-001-unplughq-platform
workflow-tier: full
phase: P3
version: 2.0.0
status: draft
consumed-by:
  - product-manager
  - product-owner
  - scrum-master
  - tech-lead
  - frontend-developer
  - backend-developer
  - database-administrator
  - devops-engineer
  - testing
date: 2026-03-16
azure-devops-id: 287
review:
  reviewed-by:
  reviewed-date:
---

# Program Board — PI-2 Sprint 2

## Planning Basis

This program board translates the PI-2 Sprint 2 backlog into week-level flow with explicit dependency handoffs, bug-first sequencing, milestone gates, and risk exposure. It is grounded in [sprint-backlog.md](sprint-backlog.md) (PO), [delegation-briefs-p4.md](delegation-briefs-p4.md) (PO), [sprint-health-report.md](sprint-health-report.md) (SM), [pi-objectives.md](pi-objectives.md) (RTE), [risk-register.md](risk-register.md) (RTE), [architecture-overview.md](architecture-overview.md), [api-contracts.md](api-contracts.md), [requirements.md](requirements.md), [threat-model.md](threat-model.md), and [definition-of-done.md](definition-of-done.md).

### Sprint 1 Outcome (Baseline)

| Metric | Value |
| --- | --- |
| Stories delivered | 8/8 (100%) |
| Story points delivered | 47 SP |
| Tests passing | 226 (106 F4 + 120 F1) |
| Gates passed | 9/9 |
| P5 bugs deferred | 5 (17 SP) → Sprint 2 Track E |

### Sprint 2 Capacity and Flow Assumptions

| Item | Planning Position |
| --- | --- |
| Sprint cadence | 2-week sprint (PI-2 Sprint 2) |
| Calibrated velocity | 55 SP (Sprint 1 actual: 47 SP; scaffold overhead removed) |
| Total committed | 71 SP (54 SP stories + 17 SP bugs) |
| Effective P1 commitment | 56 SP (71 − 15 SP P2 safety valve) |
| P2 descope buffer | S-205 (5 SP), S-206 (5 SP), S-209 (5 SP) = 15 SP |
| Team capability model | 3 delivery tracks + shared platform lane |
| Bug-first mandate | BR-BF-001: all 5 deferred bugs resolved Week 1 before new feature code on affected paths |
| Shared bottlenecks | DBA schema (cross-track), BE orchestration (cross-track), DevOps infra (Caddy, deploy pipeline, alert email) |
| Feature branch | `feat/pi-2-sprint-2` |

## Team Capability Lanes

| Lane | Core Capability | Primary Disciplines | Sprint 2 Notes |
| --- | --- | --- | --- |
| Shared Platform | Schema, environment, queue, integration guardrails | DBA, DevOps, TL | DBA delivers full Sprint 2 schema (catalog + deployment + alert + metrics) in Week 1 Days 1-2 |
| Track C | Application Catalog & Deployment (F2) | FE, BE, DevOps, DBA | 5 stories, 33 SP — Sprint 2 primary delivery lane |
| Track D | Dashboard & Health Monitoring (F3) | FE, BE, DevOps | 3 stories, 21 SP — depends on Sprint 1 metrics foundation + S-204 schema |
| Track E | Deferred PI-1 Bug Fixes | BE, FE, DevOps | 5 bugs, 17 SP — Week 1 mandatory per BR-BF-001 |

## PI-2 Milestones (Updated for Sprint 2)

| Milestone | Target | Exit Condition | Contributing Items | PI Objective |
| --- | --- | --- | --- | --- |
| M1 Account Foundation Ready | Sprint 1 ✅ | Authenticated user can register and access protected routes | AB#194, AB#195 | PI1-O1 ✅ |
| M2 Supported Server Baseline Proven | Sprint 1 ✅ | A connected VPS passes validation and is eligible for provisioning | AB#198, AB#199 | PI1-O2 ✅ |
| M3 Provisioned Server Visible | Sprint 1 ✅ | Provisioning completes and dashboard shell shows server state | AB#200, AB#207 | PI1-O2 ✅, PI1-O4 partial |
| M7 Security Debt Cleared | Sprint 2, Day 3 | All 5 deferred PI-1 bugs resolved, full regression green | AB#258, AB#259, AB#260, AB#262, AB#251 | PI2-O6 |
| M4 First App Deployment Path Ready | Sprint 2, Day 8 | User can browse, configure, and launch an app with progress visibility | AB#202, AB#203, AB#204 | PI2-O1, PI2-O2 |
| M5 Verified App Health Loop Ready | Sprint 2, Day 9 | Deployed app is verified and alerting loop is operational | AB#205, AB#208 | PI2-O4, PI2-O5 |
| M8 Multi-App Coexistence Proven | Sprint 2, Day 10 (P2) | ≥2 apps deployed without conflicts on one server | AB#206 | PI2-O3 |
| M6 Guided Remediation Available | Sprint 2, Day 10 (P2) | Alert acknowledgement and remediation guidance are available | AB#209 | PI2-O5 |

## Sprint 2 Program Board — Agent-to-Story Mapping

### Week 1: Bugs First + Schema + Foundation (Days 1-5)

| Agent | Day 1-2 | Day 3 | Day 4-5 | SP Covered |
| --- | --- | --- | --- | ---: |
| **Testing** | Unit + integration + E2E test contracts for all 13 work items (P4 Step 1) | Test contracts complete → PO review → Gate 5 pre-check | Available for verification support | — |
| **TL** | Worktree setup, dependency install, build verification | Bug review checkpoint (all 5 bugs on track) | Integration merge readiness | — |
| **DBA** | Catalog schema, deployment schema, alert schema, metrics extensions, indexes | Seed data (≥15 catalog apps) | Seed data complete, index tuning | Enables all |
| **BE** | B-258 CSRF fix (5 SP), B-259 Audit logging (3 SP) | B-260 Secrets rotation (3 SP), Catalog router S-202 start | Catalog router S-202, Config API S-203, Deploy job S-204 start, Dashboard query S-207 start | 11 SP bugs + S-202/203 partial |
| **FE** | B-251 Focus management fix (3 SP) | Catalog browsing UI S-202 | Config wizard S-203, Dashboard overview S-207 start | 3 SP bugs + S-202/203/207 partial |
| **DevOps** | B-262 Sudoers fix (3 SP) | Caddy route automation | Monitoring extensions, CI `pnpm audit` integration | 3 SP bugs + cross-cutting |

**Week 1 SP Target:** 17 SP bugs + foundation for S-202, S-203, S-207

**Week 1 Checkpoints:**
- **Day 2 — Schema review:** DBA schema covers all 3 tracks; TL reviews migration
- **Day 3 — Bug review:** All 5 deferred bugs resolved or on track; blocks Track C/D feature code if not
- **Day 5 — Integration checkpoint:** Sub-branches mergeable; Week 1 deliverables verified

### Week 2: Features + Integration (Days 6-10)

| Agent | Day 6-7 | Day 8-9 | Day 10 | SP Covered |
| --- | --- | --- | --- | ---: |
| **DBA** | Seed data update, index tuning | — | — | Support |
| **BE** | Deploy job finish S-204, Dashboard aggregation S-207 finish | Post-deploy health check S-205, Multi-app logic S-206, Alert evaluation S-208 | Guided remediation S-209, Email notification S-208 finish | S-204 (13), S-207 (8), S-205 (5), S-206 (5), S-208 (8), S-209 (5) |
| **FE** | Deploy progress UI S-204, Dashboard overview S-207 finish | Post-deploy UI S-205, Multi-app UI S-206, Alert UI S-208 | Remediation UI S-209 | S-204, S-207, S-205, S-206, S-208, S-209 |
| **DevOps** | Deploy pipeline config S-204 | Alert email infra S-208 | Integration support | S-204 support, S-208 support |
| **TL** | SSE integration review (Day 7) | Deployment pipeline review (Day 8), Integration merge | Final merge, conflict resolution | — |

**Week 2 SP Target:** S-204 (13), S-205 (5), S-206 (5), S-207 (8) finish, S-208 (8), S-209 (5)

**Week 2 Checkpoints:**
- **Day 7 — SSE integration review:** End-to-end SSE event pipeline verified (deployment progress + live metrics)
- **Day 7 — P2 descope decision:** PO + SM assess if any P1 story is <50% done → trigger descope
- **Day 8 — Deployment pipeline review:** State machine + rollback + health checks verified (BE + DevOps + TL)
- **Day 10 — Sprint close:** All sub-branches merged; full test suite green

## Sprint 2 Story Allocation Board

### Track E: Deferred PI-1 Bug Fixes (Week 1 Mandatory)

| Lane | Feature | Item | AB# | SP | Assignee | Week | Dependency In | Dependency Out | Milestone |
| --- | --- | --- | --- | ---: | --- | --- | --- | --- | --- |
| Track E | Cross-cutting | CSRF Double-Submit Cookie | AB#258 | 5 | BE | W1 | None | F2/F3 mutation endpoints safe | M7 |
| Track E | Cross-cutting | Insufficient Audit Logging | AB#259 | 3 | BE | W1 | None | F2/F3 audit calls from start | M7 |
| Track E | Cross-cutting | Secrets Rotation Mechanism | AB#260 | 3 | BE + DevOps | W1 | None | Rotation before deployment exposure | M7 |
| Track E | Cross-cutting | Broken Sudoers Ownership | AB#262 | 3 | DevOps | W1 | None | VPS operations safe | M7 |
| Track E | Cross-cutting | Focus Management on Dynamic Content | AB#251 | 3 | FE | W1 | None | Route transitions accessible | M7 |

**Track E Total:** 17 SP — **must be merged before feature code on affected paths**

### Track C: Application Catalog & Deployment (F2 — AB#182)

| Lane | Feature | Story | AB# | SP | Assignee | Week | Dependency In | Dependency Out | Milestone |
| --- | --- | --- | --- | ---: | --- | --- | --- | --- | --- |
| Track C | F2 | Application Catalog Browsing | AB#202 | 5 | DBA + BE + FE | W1-W2 | Sprint 1 complete, DBA schema, Bug fixes merged | AB#203 | M4 |
| Track C | F2 | Guided App Configuration | AB#203 | 5 | BE + FE | W1-W2 | AB#202 | AB#204 | M4 |
| Track C | F2 | Application Deployment with Progress | AB#204 | 13 | BE + DevOps + FE | W1-W2 | AB#203, DBA deployment schema | AB#205, AB#206, AB#208 (SSE patterns) | M4 |
| Track C | F2 | Post-Deployment Verification (P2) | AB#205 | 5 | BE + FE | W2 | AB#204 | AB#208 health semantics | M5 |
| Track C | F2 | Multi-App Coexistence (P2) | AB#206 | 5 | BE + FE | W2 | AB#204 | Demonstrates UJ2 | M8 |

**Track C Total:** 33 SP (18 SP P1 committed, 10 SP P2 safety valve)

### Track D: Dashboard & Health Monitoring (F3 — AB#183)

| Lane | Feature | Story | AB# | SP | Assignee | Week | Dependency In | Dependency Out | Milestone |
| --- | --- | --- | --- | ---: | --- | --- | --- | --- | --- |
| Track D | F3 | Dashboard Overview | AB#207 | 8 | BE + FE | W1-W2 | Sprint 1 metrics foundation, DBA metrics schema | AB#208 | M5 |
| Track D | F3 | Health Alert Notifications | AB#208 | 8 | BE + FE + DevOps | W2 | AB#207, S-204 SSE patterns, AB#197 notification prefs | AB#209 | M5 |
| Track D | F3 | Alert Management & Guided Remediation (P2) | AB#209 | 5 | BE + FE | W2 | AB#208 | M6 | M6 |

**Track D Total:** 21 SP (16 SP P1 committed, 5 SP P2 safety valve)

### Sprint 2 Summary

| Track | Items | SP | % of Sprint | Priority Mix |
| --- | --- | --- | ---: | --- |
| Track E (Bug Fixes) | 5 bugs | 17 | 24% | All mandatory |
| Track C (Catalog/F2) | 5 stories | 33 | 46% | 3 P1 (23 SP) + 2 P2 (10 SP) |
| Track D (Dashboard/F3) | 3 stories | 21 | 30% | 2 P1 (16 SP) + 1 P2 (5 SP) |
| **Total** | **13** | **71** | **100%** | 5 mandatory + 5 P1 + 3 P2 |

**Committed P1 load:** 56 SP (17 SP bugs + 23 SP Track C P1 + 16 SP Track D P1)
**Safety valve:** 15 SP (S-205 + S-206 + S-209)

## Critical Path Analysis

### Critical Path: First App Deployed and Monitored

```
DBA (schema Days 1-2) → BE (bug fixes Days 1-3) → BE (catalog router S-202 Days 3-5)
  → BE (config API S-203 Days 4-6) → BE (deploy job S-204 Days 5-8)
  → FE (deploy progress UI S-204 Days 7-8) → BE (dashboard query S-207 Days 5-8)
  → FE (dashboard UI S-207 Days 6-8) → BE (alert eval S-208 Days 8-9)
  → FE (alert UI S-208 Days 8-9)
```

**Critical path length:** ~9 days out of 10 — minimal float.

**Critical path items:** AB#258-260 (bug fixes) → AB#202 → AB#203 → AB#204 → AB#207 → AB#208

**Pacing item:** AB#204 (Application Deployment with Progress, 13 SP) — the largest story, on the critical path, and the integration point between BE, DevOps, and FE. This story's SSE patterns are reused by Track D (S-207, S-208). If S-204 slips past Day 8, both M4 and M5 milestones are at risk.

### Bug-First Gate (BR-BF-001)

```
Track E (Days 1-3):
  BE: B-258 (CSRF) ──────────┐
  BE: B-259 (Audit Logging) ──┤
  BE: B-260 (Secrets Rotation)┤── All must merge before F2/F3 feature code on affected paths
  DevOps: B-262 (Sudoers) ────┤
  FE: B-251 (Focus Mgmt) ─────┘

Day 3 Bug Review Checkpoint:
  All 5 bugs resolved → Track C/D feature code proceeds
  Any bug unresolved → Feature tracks blocked on affected paths; escalate to PO
```

**R19 enforcement:** This is the PI's highest-scoring risk (25). The Day 3 bug review checkpoint is a hard gate — not advisory.

### Parallel Track Flow

```
         Week 1 (Days 1-5)                    Week 2 (Days 6-10)
         ─────────────────────                ─────────────────────
Track E: ██████████████░░░░░░░░░  (D1-3)
Track C: ░░░░░░░██████████████████████████████████████████████  (D3-10)
Track D: ░░░░░░░░░░░██████████████████████████████████████████  (D4-10)
Shared:  ██████████████░░░░░░░░░  (D1-3 schema) ░░░░░░ (D8-10 merge)
```

Track E is an enforced predecessor to Track C and Track D on code paths involving mutations, SSH operations, and route transitions.

## Cross-Team Dependency Board — Sprint 2

| From | To | Dependency Type | Why It Matters | Failure Effect | Coordination Action |
| --- | --- | --- | --- | --- | --- |
| Track E (all bugs) | Track C + D | Bug-first sequencing (BR-BF-001) | Security bugs touch middleware and validation layers that F2/F3 exercise | Feature tracks blocked if bugs slip | Day 3 bug review checkpoint |
| DBA schema | All Sprint 2 stories | Shared technical dependency | Catalog, deployment, alert, metrics tables underpin all tracks | Sprint 2 build work cannot start | Schema delivery by Day 2; TL reviews migration |
| AB#202 | AB#203 | Catalog dependency | App configuration requires selected catalog item | Config wizard has no data source | BE delivers catalog router before config API |
| AB#203 | AB#204 | Configuration dependency | Deployment requires completed config | Deploy pipeline has no input | Sequential within Track C |
| AB#204 | AB#205 | Sequential deployment | Verification follows deployment | Health check has no target | Keep in same sprint lane |
| AB#204 | AB#206 | Deployment existence | Multi-app needs ≥1 completed deployment | Cannot prove coexistence | Sequential within Track C |
| AB#204 SSE patterns | AB#207, AB#208 | Cross-track technical | SSE patterns from deployment reused for live metrics and alerts | Track D rebuilds SSE from scratch | SSE integration review at Day 7 |
| AB#207 | AB#208 | Dashboard context | Alert UI renders within dashboard layout | Alerts have no UI container | Sequential within Track D |
| AB#208 | AB#209 | Alert model dependency | Remediation requires active alert model | Remediation has no trigger | Sequential within Track D |
| Sprint 1 metrics | AB#207 | Cross-sprint | Dashboard aggregation queries Sprint 1 metrics tables | Dashboard shows empty data | DBA verifies metrics schema compatibility |
| AB#197 (Sprint 1) | AB#208 | Cross-sprint rule | Alert email respects notification preferences | Alerts violate user settings | Notification contract already landed in Sprint 1 |

## Milestone and Risk Lane — Sprint 2

| Item | Type | Timing | Exposure | Owner | Response |
| --- | --- | --- | --- | --- | --- |
| R19: Deferred security bugs active | Risk | Week 1 | **Critical (25)** | TL + BE + DevOps | Bug-first sequencing; Day 3 review checkpoint; halt features if unresolved |
| R14: Docker orchestration complexity (S-204) | Risk | Week 1-2 | **Critical (20)** | BE + DevOps | Idempotent state machine with per-step rollback; Sprint 1 BullMQ patterns reusable |
| R22: Velocity overcommit (71 vs 55 SP) | Risk | Sprint-wide | **High (16)** | PO + SM | 15 SP P2 safety valve; Day 7 descope decision point |
| R24: No Playwright E2E from PI-1 | Risk | Week 1 | **High (16)** | Testing + TL | Playwright infrastructure at P4 Step 2; E2E contracts at P4 Step 1 |
| R15: SSE reliability for real-time UI | Risk | Week 2 | **Medium (12)** | BE + FE | SSE fallback to polling (NFR-017); Day 7 SSE integration review |
| R23: Schema migration complexity | Risk | Week 1 | **Medium (12)** | DBA + TL | Additive schema only; Day 2 migration review |
| M7: Security Debt Cleared | Milestone | Day 3 | Critical | All code agents | All 5 bugs resolved; full regression green |
| M4: First App Deployment Ready | Milestone | Day 8 | Critical | Track C | Catalog→Configure→Deploy working end-to-end |
| M5: Health Loop Operational | Milestone | Day 9 | Critical | Track C + D | Dashboard shows live status; alerts fire on threshold breach |
| M8: Multi-App Proven (P2) | Milestone | Day 10 | Important | Track C | ≥2 apps, no conflicts |
| M6: Guided Remediation (P2) | Milestone | Day 10 | Important | Track D | Alert acknowledgement and remediation guidance |

## Descope Decision Matrix

Pre-authorized by the PO in sprint-backlog.md:

| Trigger | Day | Action | SP Recovered |
| --- | --- | --- | ---: |
| Any P1 story not 50% done | Day 7 | Descope S-209 (Alert Remediation, P2) | 5 |
| Track C blocked past Day 7 | Day 7 | Descope S-206 (Multi-App Coexistence, P2) | 5 |
| Track D blocked past Day 8 | Day 8 | Descope S-209 (Alert Remediation, P2) | 5 |
| Any bug fix reveals scope creep | Immediate | Escalate to PO; do not absorb silently | Variable |
| Cumulative slip > 15 SP | Day 7 | Descope all P2 stories (S-205, S-206, S-209) | 15 |

## Program Board Decisions — Sprint 2

| Decision | Reasoning |
| --- | --- |
| Bug-first sequencing (Week 1 priority) | R19 is the highest-scoring PI-2 risk (25). Security bugs touch middleware exercised by F2/F3. Resolving them first prevents regression and avoids double-work. |
| Three explicit tracks (C, D, E) | Sprint 2 manages 3 concurrent concerns (catalog, dashboard, bug debt) that are partially interdependent. Explicit tracks clarify ownership and sequencing. |
| DBA delivers complete schema Days 1-2 | Schema is the shared dependency for all 3 tracks. Front-loading schema avoids mid-sprint structural changes (per Sprint 1 lesson). |
| S-204 as sprint pacing item | At 13 SP (18% of sprint), S-204 is on the critical path and gates both M4 and Track D SSE reuse. Progress on S-204 is the best proxy for sprint health. |
| Day 7 as decision point for P2 descope | Mid-sprint provides enough signal to assess velocity without leaving descope too late. PO + SM make the call. |
| SSE integration review at Day 7 | SSE is new infrastructure. Using S-204 deployment progress as the proof-of-concept before S-207/S-208 live metrics prevents cascading SSE issues. |
| S-205, S-206, S-209 as ordered safety valve | Descope order: S-209 first (least critical to UJ1), then S-206 (multi-app is stretch goal PI2-O3), then S-205 (post-deploy verification is important but bounded). |

## Workflow Observations

No framework friction observed during Sprint 2 program board update. PI-1 planning contradictions (AB#201 vs AB#207 placement, Sprint 1 SP totals) were resolved in Sprint 1 delivery. Sprint 2 planning artifacts from PO and SM are internally consistent.

---

## PI-1 Program Board — Historical Reference

> The following Sprint 1 program board is retained as historical reference. Sprint 1 delivered 8/8 stories, 47 SP, 9/9 gates PASS.

### Sprint 1 Story Allocation Board

| Sprint | Lane | Feature | Story | SP | Capability Focus | Dependency In | Dependency Out | Milestone |
| --- | --- | --- | --- | ---: | --- | --- | --- | --- |
| Sprint 1 | Shared Platform | Cross-feature | Platform readiness | 0 | Schema, CI, local env, queue baseline | P1 architecture and contracts | Unblocks all Sprint 1 build work | M1, M2, M3 |
| Sprint 1 | Track A | F4 | AB#194 User Registration | 5 | Auth data model, signup UI, password policy | Shared Platform | AB#195, AB#196 | M1 |
| Sprint 1 | Track A | F4 | AB#195 User Authentication | 5 | Session management, route protection, login/logout | AB#194 | AB#198, AB#207, AB#197 | M1 |
| Sprint 1 | Track A | F4 | AB#196 Password Reset Flow | 3 | Reset token and email flow | AB#194, AB#195 | Account recovery | M1 |
| Sprint 1 | Track A | F4 | AB#197 Account Settings | 3 | Profile updates and alert opt-in/out | AB#195 | AB#208 notification prefs | M1 |
| Sprint 1 | Track B | F1 | AB#198 Server Connection Wizard | 8 | Guided SSH onboarding and diagnostics | AB#195 | AB#199 | M2 |
| Sprint 1 | Track B | F1 | AB#199 Server Validation | 5 | OS and resource verification | AB#198 | AB#200 | M2 |
| Sprint 1 | Track B | F1 | AB#200 Automated Provisioning | 13 | Docker, Caddy, monitoring agent, progress events | AB#199 | AB#202, AB#207, AB#208 | M3 |
| Sprint 1 | Track D | F3 | AB#207 Dashboard Overview | 8 | Dashboard shell, server metrics, empty/server states | AB#195, AB#200 | AB#208, Sprint 2 | M3 |

**Sprint 1 delivered:** 50 SP committed, 47 SP delivered (AB#201 descoped → Sprint 2)

## Research Sources

- [SAFe PI Planning](https://framework.scaledagile.com/pi-planning/) - accessed 2026-03-15, 2026-03-16
- [SAFe Continuous Delivery Pipeline](https://framework.scaledagile.com/continuous-delivery-pipeline/) - accessed 2026-03-15, 2026-03-16

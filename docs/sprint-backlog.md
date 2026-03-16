---
artifact: sprint-backlog
produced-by: product-owner
project-slug: unplughq
work-item: epic-001-unplughq-platform
work-item-type: epic
workflow-tier: full
phase: P3
version: 2.0.0
status: draft
azure-devops-id: 285
consumed-by:
  - scrum-master
  - tech-lead
  - frontend-developer
  - backend-developer
  - database-administrator
  - devops-engineer
  - testing
date: 2026-03-16
---

# Sprint Backlog — UnplugHQ PI-2 Sprint 2

## Sprint Goal

> Deliver the application catalog and deployment pipeline so that a user can browse apps, configure and deploy them with real-time progress, and see their running apps on a health-monitoring dashboard with proactive alerts — completing the full "first app live" user journey. Simultaneously resolve all deferred PI-1 security and accessibility bugs.

## Sprint Parameters

| Parameter | Value |
|-----------|-------|
| Sprint Duration | 2 weeks |
| Sprint Start | Determined by SM at P3 |
| Team Velocity (calibrated) | 55 SP (Sprint 1 delivered 47 SP — adjusting up, scaffold overhead removed) |
| Sprint Capacity | FE + BE + DBA + DevOps parallel tracks |
| Feature branch | `feat/pi-2-sprint-2` |
| Deferred bugs | 5 (17 SP) — Week 1 priority per R19 |

## Sprint 1 Recap

| Metric | Value |
|--------|-------|
| Stories committed | 8 |
| Stories delivered | 8 (100%) |
| Story points delivered | 47 SP |
| Tests passing | 226 (106 F4 + 120 F1) |
| P5 bugs found | 5 deferred to Sprint 2 |

---

## Selected Stories

### Track C: Application Catalog & Deployment (F2 — AB#182)

| # | Story | AB# | SP | Priority | Assignee Track | Dependencies |
|---|-------|-----|----|----------|----------------|--------------|
| 1 | Application Catalog Browsing | AB#202 | 5 | P1 | DBA + BE + FE | Sprint 1 complete |
| 2 | Guided App Configuration | AB#203 | 5 | P1 | BE + FE | S-202 |
| 3 | Application Deployment with Progress | AB#204 | 13 | P1 | BE + DevOps + FE | S-203, DBA schema |
| 4 | Post-Deployment Verification | AB#205 | 5 | P2 | BE + FE | S-204 |
| 5 | Multi-App Coexistence | AB#206 | 5 | P2 | BE + FE | S-204 |

**Track C Total:** 33 SP

### Track D: Dashboard & Health Monitoring (F3 — AB#183)

| # | Story | AB# | SP | Priority | Assignee Track | Dependencies |
|---|-------|-----|----|----------|----------------|--------------|
| 6 | Dashboard Overview | AB#207 | 8 | P1 | BE + FE | Sprint 1 metrics foundation |
| 7 | Health Alert Notifications | AB#208 | 8 | P1 | BE + FE | S-207, DBA schema |
| 8 | Alert Management & Guided Remediation | AB#209 | 5 | P2 | BE + FE | S-208 |

**Track D Total:** 21 SP

### Track E: Deferred PI-1 Bug Fixes (Cross-Cutting)

| # | Bug | AB# | SP | Severity | Assignee Track | Dependencies |
|---|-----|-----|----|----------|----------------|--------------|
| B1 | Missing CSRF Double-Submit Cookie | AB#258 | 5 | HIGH | BE | None |
| B2 | Insufficient Audit Logging | AB#259 | 3 | HIGH | BE | None |
| B3 | Secrets Rotation Mechanism | AB#260 | 3 | HIGH | BE + DevOps | None |
| B4 | Broken Sudoers Ownership | AB#262 | 3 | HIGH | DevOps | None |
| B5 | Focus Management on Dynamic Content | AB#251 | 3 | MEDIUM | FE | None |

**Track E Total:** 17 SP

### Sprint Total

| Metric | Value |
|--------|-------|
| Stories committed | 8 |
| Bugs committed | 5 |
| Total work items | 13 |
| Story points (stories) | 54 SP |
| Story points (bugs) | 17 SP |
| **Total story points** | **71 SP** |

**Capacity note:** 71 SP exceeds 55 SP velocity. P2 stories (S-205, S-206, S-209 = 15 SP) serve as safety valve. Bugs are known-scope fixes with bounded AC from SEC/A11Y audit.

---

## Execution Sequence

```
Week 1 (Bugs First + Schema + Foundation)      Week 2 (Features + Integration)
──────────────────────────────────────         ──────────────────────────────────────
Track E (Bugs):                                Track C continued:
  BE:  CSRF fix (B-258)                          FE: Deploy progress UI (S-204)
  BE:  Audit logging (B-259)                     FE: Post-deploy + multi-app (S-205/206)
  BE:  Secrets rotation (B-260)                  BE: Post-deploy health check (S-205)
  DevOps: Sudoers fix (B-262)                    BE: Multi-app coexistence (S-206)
  FE:  Focus management (B-251)
                                               Track D continued:
Track C start:                                   FE: Alert UI + remediation (S-208/209)
  DBA: Full Sprint 2 schema                      BE: Alert eval + email (S-208)
  BE:  Catalog router (S-202)                    BE: Guided remediation (S-209)
  BE:  Deploy job start (S-203/204)
  FE:  Catalog browsing UI (S-202)
  FE:  Config wizard (S-203)

Track D start:
  BE:  Dashboard aggregation (S-207)
  FE:  Dashboard overview (S-207)
  DevOps: Monitoring extensions
```

## Parallel Execution Model

```
           DBA                 BE                  FE                DevOps
           ───                 ──                  ──                ──────
Week 1  │ Catalog schema    │ CSRF fix (B-258)  │ Focus mgmt       │ Sudoers fix
        │ Deployment ext    │ Audit log (B-259) │   (B-251)        │   (B-262)
        │ Alert schema      │ Secrets rot (B-260)│ Catalog UI      │ Caddy route
        │ Metrics ext       │ Catalog router    │   (S-202)        │   automation
        │ Indexes           │ Deploy job start  │ Config wizard    │ Monitoring ext
        │                   │ Dashboard query   │   (S-203)        │
        │                   │                   │ Dashboard (S-207)│
Week 2  │ Seed data update  │ Deploy job finish │ Deploy progress  │ Deploy pipeline
        │ Index tuning      │ Post-deploy check │   (S-204)        │   config
        │                   │ Multi-app logic   │ Post-deploy UI   │ Alert email
        │                   │ Alert evaluation  │   (S-205)        │   infra
        │                   │ Alert email send  │ Multi-app (S-206)│
        │                   │ Guided remediation│ Alert UI (S-208) │
        │                   │                   │ Remediation UI   │
        │                   │                   │   (S-209)        │
```

## Story Branch Assignments

| Story/Bug | Branch | Base |
|-----------|--------|------|
| S-202 App Catalog | `story/story-202-app-catalog` | `feat/pi-2-sprint-2` |
| S-203 App Configuration | `story/story-203-app-configuration` | `feat/pi-2-sprint-2` |
| S-204 App Deployment | `story/story-204-app-deployment` | `feat/pi-2-sprint-2` |
| S-205 Post-Deployment | `story/story-205-post-deployment` | `feat/pi-2-sprint-2` |
| S-206 Multi-App | `story/story-206-multi-app` | `feat/pi-2-sprint-2` |
| S-207 Dashboard Overview | `story/story-207-dashboard-overview` | `feat/pi-2-sprint-2` |
| S-208 Health Alerts | `story/story-208-health-alerts` | `feat/pi-2-sprint-2` |
| S-209 Alert Remediation | `story/story-209-alert-remediation` | `feat/pi-2-sprint-2` |
| B-258 CSRF | Bug fix on `feat/pi-2-sprint-2` directly | n/a |
| B-259 Audit Logging | Bug fix on `feat/pi-2-sprint-2` directly | n/a |
| B-260 Secrets Rotation | Bug fix on `feat/pi-2-sprint-2` directly | n/a |
| B-262 Sudoers | Bug fix on `feat/pi-2-sprint-2` directly | n/a |
| B-251 Focus Management | Bug fix on `feat/pi-2-sprint-2` directly | n/a |

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| 71 SP exceeds 55 SP velocity | Sprint overcommitment | P2 stories (15 SP) are safety valve; bugs are bounded-scope fixes |
| BullMQ deployment job complexity | S-204 largest story (13 SP) | Patterns established in Sprint 1 provisioning job |
| SSE reliability for deployment progress | S-204 UX | SSE fallback to polling already in Sprint 1 (NFR-017) |
| Alert pipeline complexity | S-208 multi-component | Shared email infra from Sprint 1 password reset |
| Security bug scope creep | B-258/259/260 could grow | Bugs have specific AC from SEC audit; scope bounded |

## Definition of Done Reference

Stories and bugs are subject to the Definition of Done at `docs/definition-of-done.md`.

## Metrics Collection Plan

| Metric | Method | Frequency | Feed Into |
|--------|--------|-----------|-----------|
| WIP | Count of work items in Active state per track | Daily | SM sprint health report |
| Cycle Time | State transition timestamps (Active → Resolved) | Per completion | RTE flow metrics |
| Throughput | Work items completed per week | Weekly | Velocity calibration |
| Velocity | Sum of completed story points at sprint close | Per sprint | PI-3 planning |
| Blocked Time | Duration in Blocked state | Per occurrence | SM impediment log |
| Bug Burn-Down | Deferred bugs resolved vs remaining | Daily | R19 tracking |

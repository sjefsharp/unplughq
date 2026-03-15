---
artifact: program-board
produced-by: release-train-engineer
project-slug: unplughq
work-item: task-223-rte-program-board-dependency-map
work-item-type: task
parent-work-item: epic-001-unplughq-platform
workflow-tier: full
phase: P3
version: 1.0.0
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
date: 2026-03-15
azure-devops-id: 223
review:
  reviewed-by:
  reviewed-date:
---

# Program Board

## Planning Basis

This program board translates the PI-1 backlog into sprint-level flow with explicit dependency handoffs, milestone gates, and risk exposure. It is grounded in [product-vision.md](product-vision.md), [architecture-overview.md](architecture-overview.md), [feature-roadmap.md](feature-roadmap.md), [product-backlog.md](product-backlog.md), [sprint-backlog.md](sprint-backlog.md), [sprint-health-report.md](sprint-health-report.md), [story-map.md](story-map.md), [risk-register.md](risk-register.md), [pi-objectives.md](pi-objectives.md), [requirements.md](requirements.md), [team-working-agreements.md](team-working-agreements.md), and [definition-of-done.md](definition-of-done.md).

### Capacity and Flow Assumptions

| Item | Planning Position |
| --- | --- |
| Sprint cadence | Two 2-week sprints in PI-1 |
| Baseline velocity | 50 SP until Sprint 1 actuals are known |
| Sprint 1 prompt load | 50 SP when the explicit story list is used |
| Sprint 1 draft artifact load | 47 SP in current PO and SM draft artifacts |
| Sprint 2 prompt load | 51 SP if all listed stories are committed |
| Sprint 2 flow recommendation | Commit 46 SP and hold AB#209 as stretch to preserve predictability |
| Team capability model | Two primary delivery tracks plus one shared platform lane |
| Shared bottlenecks | DBA schema and migration work, BE orchestration work, DevOps provisioning support |

### Planning Reconciliation

The invocation context for this P3 Step 3 session assigns AB#207 to Sprint 1 and AB#201 to Sprint 2. Current draft planning artifacts still place AB#201 in Sprint 1 and AB#207 in Sprint 2. The invocation context also states Sprint 1 totals 47 SP, but the listed Sprint 1 stories sum to 50 SP. This board follows the explicit story list because it is the most concrete planning signal and because the stated Sprint 1 cross-track risk explicitly references AB#207. The PO and SM should reconcile [sprint-backlog.md](sprint-backlog.md) and [story-map.md](story-map.md) before Gate 4.

## Team Capability Lanes

| Lane | Core Capability | Primary Disciplines | Notes |
| --- | --- | --- | --- |
| Shared Platform | Schema, environment, queue, integration guardrails | DBA, DevOps, TL | Governs both sprints and is the main contention lane |
| Track A | Identity foundation | FE, BE | Enables all authenticated flows |
| Track B | Server connection and provisioning | FE, BE, DevOps | Sprint 1 critical path |
| Track C | Catalog and deployment | FE, BE, DevOps, DBA | Sprint 2 primary delivery lane |
| Track D | Dashboard and alerting | FE, BE, DevOps | Depends on auth and monitoring data |

## PI Milestones

| Milestone | Target Sprint | Exit Condition | Contributing Stories | PI Objective |
| --- | --- | --- | --- | --- |
| M1 Account Foundation Ready | Sprint 1 | Authenticated user can register and access protected routes | AB#194, AB#195 | PI1-O1 |
| M2 Supported Server Baseline Proven | Sprint 1 | A connected VPS passes validation and is eligible for provisioning | AB#198, AB#199 | PI1-O2 |
| M3 Provisioned Server Visible | Sprint 1 | Provisioning completes and dashboard shell shows server state | AB#200, AB#207 | PI1-O2, PI1-O4 |
| M4 First App Deployment Path Ready | Sprint 2 | User can browse, configure, and launch an app with progress visibility | AB#202, AB#203, AB#204 | PI1-O3 |
| M5 Verified App Health Loop Ready | Sprint 2 | Deployed app is verified and alerting loop is operational | AB#205, AB#208 | PI1-O4, PI1-O5 |
| M6 Guided Remediation Available | Sprint 2 stretch | Alert acknowledgement and remediation guidance are available | AB#209 | PI1-O4, PI1-O5 |

## Story Allocation Board

### Sprint 1 Program Board

| Sprint | Lane | Feature | Story | SP | Capability Focus | Dependency In | Dependency Out | Milestone | Risk Signal |
| --- | --- | --- | --- | ---: | --- | --- | --- | --- | --- |
| Sprint 1 | Shared Platform | Cross-feature | Platform readiness | 0 | Schema, CI, local env, queue baseline | P1 architecture and contracts | Unblocks all Sprint 1 build work | M1, M2, M3 | DBA and DevOps are shared bottlenecks |
| Sprint 1 | Track A | F4 | AB#194 User Registration | 5 | Auth data model, signup UI, password policy | Shared Platform | AB#195, AB#196 | M1 | Auth.js v5 setup friction |
| Sprint 1 | Track A | F4 | AB#195 User Authentication | 5 | Session management, route protection, login/logout | AB#194 | AB#198, AB#207, AB#197 | M1 | Cross-track blocker for protected routes |
| Sprint 1 | Track A | F4 | AB#196 Password Reset Flow | 3 | Reset token and email flow | AB#194, AB#195 | Improves account recovery readiness | M1 support | Can slip if Track A load rises |
| Sprint 1 | Track A | F4 | AB#197 Account Settings and Notification Preferences | 3 | Profile updates and alert opt-in/out | AB#195 | AB#208 email suppression rule | M1 support | Safe descope candidate if needed |
| Sprint 1 | Track B | F1 | AB#198 Guided Server Connection Wizard | 8 | Guided SSH onboarding and diagnostics | AB#195 | AB#199 | M2 | Needs auth middleware and provider guidance |
| Sprint 1 | Track B | F1 | AB#199 Server Validation and Compatibility Check | 5 | OS and resource verification | AB#198 | AB#200 | M2 | Must prevent unsupported environments from progressing |
| Sprint 1 | Track B | F1 | AB#200 Automated Server Provisioning | 13 | Docker, Caddy, monitoring agent, progress events | AB#199 | AB#202, AB#207, AB#208 | M3 | Highest capacity and orchestration risk |
| Sprint 1 | Track D | F3 | AB#207 Dashboard Overview | 8 | Authenticated dashboard shell, server metrics view, empty and server states | AB#195, AB#200 | AB#208, Sprint 2 monitoring refinement | M3 | Cross-track dependency on auth and provisioned telemetry |

**Sprint 1 committed load:** 50 SP

### Sprint 2 Program Board

| Sprint | Lane | Feature | Story | SP | Capability Focus | Dependency In | Dependency Out | Milestone | Risk Signal |
| --- | --- | --- | --- | ---: | --- | --- | --- | --- | --- |
| Sprint 2 | Track B | F1 | AB#201 Server Dashboard Presence | 5 | Dedicated server tile, naming, live health ring | AB#200, AB#207 | Strengthens monitorability for F2 and F3 | M3 hardening | Should remain flexible if Sprint 1 carryover occurs |
| Sprint 2 | Track C | F2 | AB#202 Application Catalog Browsing | 5 | Catalog data and browse flow | AB#200, AB#207 | AB#203 | M4 | Requires curated seed content and data model stability |
| Sprint 2 | Track C | F2 | AB#203 Guided App Configuration | 5 | Per-app configuration forms and validation | AB#202 | AB#204 | M4 | Depends on app definition contract maturity |
| Sprint 2 | Track C | F2 | AB#204 Application Deployment with Progress | 13 | Deployment jobs, progress stream, SSL and routing | AB#203 | AB#205, AB#206, AB#208 | M4 | Second large orchestration story; BE and DevOps bottleneck |
| Sprint 2 | Track C | F2 | AB#205 Post-Deployment Verification | 5 | Health checks and launch confirmation | AB#204 | AB#208, M5 | M5 | Depends on stable deployment and monitoring signals |
| Sprint 2 | Track C | F2 | AB#206 Multi-App Coexistence | 5 | Non-disruptive second deployment | AB#204 | Demonstrates UJ2 reliability | M5 support | Routing regression risk |
| Sprint 2 | Track D | F3 | AB#208 Health Alert Notifications | 8 | Threshold evaluation and email alerting | AB#197, AB#200, AB#205, AB#207 | AB#209 | M5 | Depends on notification preferences and usable telemetry |
| Sprint 2 | Track D | F3 | AB#209 Alert Management and Guided Remediation | 5 | Acknowledge, dismiss, and remediation flows | AB#208 | M6 | M6 | Recommended stretch because Sprint 2 load exceeds baseline |

**Sprint 2 recommended committed load:** 46 SP (AB#201, AB#202, AB#203, AB#204, AB#205, AB#206, AB#208)

**Sprint 2 recommended stretch:** AB#209 (5 SP)

## Cross-Team Dependency Board

| From | To | Dependency Type | Why It Matters | Failure Effect | Coordination Action |
| --- | --- | --- | --- | --- | --- |
| AB#194 | AB#195 | Shared auth foundation | Login flow relies on user model and credential policy | Blocks protected routes | Keep registration and auth in one integration window |
| AB#195 | AB#198 | Cross-track story dependency | Server wizard is a protected route | Track B starts without authenticated entry | Deliver route protection before wizard integration |
| AB#195 | AB#207 | Cross-track story dependency | Dashboard is also a protected route | Dashboard work stalls or duplicates auth scaffolding | Reuse auth shell and session contract |
| Shared Platform lane | AB#194-AB#200 | Shared technical dependency | Schema, queue, secrets, and CI underpin both tracks | Whole sprint thrash from late platform setup | Time-box shared platform work to Sprint 1 start |
| AB#199 | AB#200 | Sequential orchestration dependency | Provisioning must only run on validated hosts | Provisioning failures and noisy support paths | Treat validation as a hard release gate |
| AB#200 | AB#202, AB#204 | Feature dependency | Catalog can browse without a server, but deployment requires a healthy provisioned host | F2 cannot realize user value | Use server health gate in deployment rules |
| AB#200 | AB#207, AB#208 | Feature dependency | Monitoring and dashboard status need agent/Caddy/runtime baseline | Dashboard is cosmetic instead of operational | Make monitoring heartbeat part of provisioning done criteria |
| AB#197 | AB#208 | Cross-feature rule dependency | Email alert behavior depends on notification preferences | Alerts violate user settings | Land notification preference contract before alert dispatch |
| AB#204 | AB#205 | Sequential deployment dependency | Verification is meaningful only after deploy completes | Running status is unreliable | Keep deploy and verify in the same sprint lane |
| AB#205 | AB#208 | Observability dependency | Alerts depend on verified app and health semantics | Alert noise or blind spots | Reuse health state vocabulary from verification |

## Milestone and Risk Lane

| Item | Type | Timing | Exposure | Owner | Response |
| --- | --- | --- | --- | --- | --- |
| S-200 capacity concern | Risk | Sprint 1 Week 2 | High | TL with BE and DevOps | Review mid-sprint; preserve heartbeat-only monitoring if orchestration grows |
| Auth.js v5 technical friction | Risk | Sprint 1 Week 1 | Medium | TL with Track A | Land skeleton auth setup before FE/BE diverge |
| S-207 auth dependency | Risk | Sprint 1 Week 1 | Medium | RTE and TL | Sequence dashboard after protected-route contract is stable |
| DBA shared bottleneck | Risk | Both sprints | High | TL and DBA | Front-load schema and avoid mid-sprint structural changes |
| Sprint 2 load above baseline | Risk | Sprint 2 planning | Medium | RTE and PO | Hold AB#209 as stretch unless Sprint 1 velocity exceeds 50 SP |
| Supported-server baseline agreed | Milestone | Sprint 1 | Critical | SA, BE, DevOps | Gate provisioning behind compatibility rules |
| First managed server visible | Milestone | Sprint 1 | Critical | FE, BE, DevOps | Treat as PI confidence checkpoint |
| First app deploys with verification | Milestone | Sprint 2 | Critical | Track C | Defines MVP value delivery |
| Alerting loop operational | Milestone | Sprint 2 | Important | Track D | Supports operational trust objective |

## Program Board Decisions

| Decision | Reasoning |
| --- | --- |
| Keep Sprint 1 focused on F4, F1, and AB#207 | This protects the first reliable management surface instead of spreading early effort across too many partially complete capabilities. |
| Treat AB#200 as the sprint pacing item | It is the longest sequential orchestration story and unlocks both deployment and health visibility. |
| Start Sprint 2 from F2 flow, not advanced remediation | Deployment proof creates user value earlier than richer alert handling. |
| Hold AB#209 as stretch | Sprint 2 otherwise exceeds the current baseline and compounds dependency risk across FE, BE, and DevOps. |
| Use Shared Platform as an explicit lane | DBA and environment readiness are not incidental tasks; they are the coordination constraint for both delivery tracks. |

## Workflow Observations

The current planning inputs contain two live contradictions: AB#201 versus AB#207 sprint placement, and a Sprint 1 total of 47 SP that does not match the listed story set. This board uses the explicit story list from the invocation context as the source of current intent, but both discrepancies should be corrected in the PO and SM artifacts before Gate 4 evaluation.

## Research Sources

- [SAFe PI Planning](https://framework.scaledagile.com/pi-planning/) - accessed 2026-03-15
- [SAFe Continuous Delivery Pipeline](https://framework.scaledagile.com/continuous-delivery-pipeline/) - accessed 2026-03-15

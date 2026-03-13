---
artifact: pi-objectives
produced-by: release-train-engineer
project-slug: unplughq
work-item: epic-001-unplughq-platform
work-item-type: epic
workflow-tier: full
phase: P0
version: 1.0.0
status: approved
azure-devops-id: 169
consumed-by:
  - product-manager
  - product-owner
  - scrum-master
  - business-analyst
  - system-architect
  - security-analyst
  - solution-designer
  - content-strategist
  - ux-designer
  - accessibility
  - testing
  - tech-lead
  - frontend-developer
  - backend-developer
  - database-administrator
  - devops-engineer
date: 2026-03-13
review:
  reviewed-by: product-manager
  reviewed-date: 2026-03-13
---

# PI Objectives — UnplugHQ PI-1

## PI Theme

**Make self-hosting feel safe, guided, and real on day one.**

PI-1 is the foundation increment for UnplugHQ. The ART goal is to prove the core promise in the product vision: a non-technical user can connect a VPS, deploy a first app, and understand system health without terminal access. The plan therefore emphasizes capability flow over breadth: secure identity, reliable server connection, guided deployment, and visible health status.

## Goal Statement

By the end of PI-1, UnplugHQ should support a complete first-use path from account creation to first successful application deployment on a user-owned VPS, with guided configuration, baseline monitoring, and enough operational safety to support controlled beta adoption.

## Operational Constraint

Azure Boards is currently unavailable for this project. The Azure health check returned `NOT_FOUND` for project `unplughq`, so the required RTE Task and discussion updates could not be created at P0. Per user direction, artifact delivery proceeds on disk and Azure traceability should be backfilled when service access is restored.

## PI-1 Objectives

| ID | Objective | Business Value (1-10) | Success Signal | Primary Feature Alignment |
| --- | --- | --- | --- | --- |
| PI1-O1 | Deliver a trustworthy account foundation so a new user can sign up, authenticate, manage a session, and recover account access without support intervention. | 8 | A first-time user can complete signup, login, logout, and password reset flows without blockers. | F4 User Identity & Access |
| PI1-O2 | Establish a guided VPS connection and provisioning flow that validates server readiness and prepares the baseline runtime needed for managed deployments. | 10 | A supported VPS can be connected, validated, and prepared through a visual flow with no terminal steps. | F1 Server Connection & Provisioning |
| PI1-O3 | Enable curated first-app deployment with contextual configuration, SSL/domain setup pathing, and deployment progress visibility. | 10 | A user can select a catalog app, answer a minimal configuration set, and reach a running application URL. | F2 Application Catalog & Deployment |
| PI1-O4 | Provide a health-first dashboard that exposes server status, app state, and actionable alerts clearly enough for non-technical operators. | 8 | Users can see server resource posture, per-app status, and at least basic alert conditions in one place. | F3 Dashboard & Health Monitoring |
| PI1-O5 | Prove operational trust through baseline security, deployment verification, rollback-oriented planning, and clear cross-team evidence for a controlled beta release. | 9 | The ART can demonstrate safe delivery evidence for identity, remote access, provisioning, deployment, and monitoring flows. | F1-F4 integration |

## Business Value Rationale

The highest-scoring objectives are the ones that directly validate the product's core promise. Server connection and app deployment are the irreducible proof points for UnplugHQ. Identity, dashboard visibility, and operational trust are slightly lower only because they are enablers around that core path rather than the differentiating moment themselves.

## Confidence Vote Targets

| Measure | Target | Interpretation | Response if Missed |
| --- | --- | --- | --- |
| Average confidence score | `>= 4.0 / 5.0` | The ART believes the PI scope is achievable with known dependencies and acceptable risk. | Rebalance scope before commitment, starting with catalog breadth and non-critical dashboard depth. |
| Lowest team/role confidence | `>= 3 / 5` | No discipline should enter PI-1 with unresolved structural blockers. | Escalate blocker into ROAM review and convert uncertainty into explicit mitigation work. |
| Count of unresolved critical dependencies | `0` by PI commitment | High-risk handoffs must be visible and owned before execution starts. | Move unresolved items to the initial program board risk lane and narrow objective scope. |
| Stretch objective exposure | `<= 20%` of planned capacity | Preserve predictability for a first-PI, new-domain delivery. | Convert optional scope to stretch and protect the core first-app path. |

## Cross-Team Dependency Focus

This project is new, so the dominant dependency pattern is not code integration between existing teams. It is disciplined handoff quality across the 16 specialist roles.

| Dependency Chain | Why It Matters | Failure Mode if Weak | Initial RTE Coordination Action |
| --- | --- | --- | --- |
| PM -> BA and SA | Requirements and architecture must form the first shared implementation boundary. | Discovery starts from mismatched assumptions about MVP scope or user capability. | Treat zero-terminal deployment as the non-negotiable planning anchor. |
| BA + SA -> SEC | Threat modeling depends on both user flows and architecture direction. | Security surfaces for SSH, secrets, and remote execution are discovered too late. | Require early review of remote access, credential handling, and tenant isolation assumptions. |
| BA + SA + SEC -> SD | Contracts and component design depend on validated flows, constraints, and trust boundaries. | App deployment and monitoring contracts drift from security or user journey intent. | Hold design convergence on identity, server connection, deployment orchestration, and health events. |
| PM + CS -> UX -> A11Y | The product promise depends on comprehension, trust, and guided flow quality. | Users can technically complete actions but still do not feel safe or capable. | Protect first-use clarity, warning states, and remediation messaging as delivery-critical. |
| PO -> TEST -> TL -> FE/BE/DBA/DEV | P4 depends on executable test contracts before implementation across multiple code disciplines. | Teams optimize locally and produce incompatible slices of the platform. | Sequence PI-1 planning around contract-first execution for the first-app path. |
| FE + BE + DBA + DEV -> TL | Parallel implementation must converge without destabilizing provisioning and deployment flows. | Integration debt accumulates around orchestration, state, and environment assumptions. | Plan explicit merge and verification checkpoints for remote-connect and deploy flows. |
| TL -> TEST + SEC + A11Y | Verification needs an integrated build and clear evidence trail. | Release confidence is based on partial validation instead of system behavior. | Reserve time for end-to-end validation of setup, deploy, health, and failure messaging. |
| PO -> PM -> RTE at P6 | Acceptance and release readiness depend on complete evidence, not optimism. | PI scope appears complete while key risks remain unclosed. | Use acceptance evidence and flow metrics to separate committed value from stretch. |

## Program Board Outline

The board below is an initial PI-1 outline, not a team-level commitment. It is structured around outcome flow and handoff readiness for a new ART.

| Track | Planned Window | Target Outcome | Key Dependencies | Milestone |
| --- | --- | --- | --- | --- |
| Discovery | P0-P1 | Vision, PI objectives, requirements, solution assessment, threat model, core contracts | PM, RTE, BA, SA, SEC, SD | Gate 2 passed with MVP architecture and feature decomposition readiness |
| Experience Design | P2 | Guided first-use flows, content strategy, design system, accessibility annotations | CS, UX, A11Y consuming P1 outputs | Gate 3 passed with first-app journey fully specified |
| Planning Convergence | P3 | Stories, delegation briefs, team working agreements, dependency map | PO, SM, RTE consuming P2 outputs | Gate 4 passed with test-first implementation plan |
| Build Foundation | P4 early | Identity, VPS connection, provisioning baseline, deployment contract stubs | TEST then TL, FE, BE, DBA, DEV | First integrated build supports account and server connection path |
| Build Core Flow | P4 late | Catalog-driven app deployment and dashboard health surfaces | F1/F4 foundations, contract stability, environment readiness | First full first-app deployment walkthrough succeeds in integrated environment |
| Verification | P5 | Functional, security, and accessibility validation of first-app path | TL, TEST, SEC, A11Y | Gate 6 passed with critical blockers resolved |
| Acceptance & Release Readiness | P6-P7 | PO acceptance, go/no-go, deployment, smoke verification | PO, PM, RTE, DEV, DBA, BE, FE, TEST | Controlled beta release candidate approved |
| Retrospective & Improvement | P8 | PI learning, framework observations, improvement backlog | SM, PM, RTE | Gate 9 closure and PI continuation decision |

## Initial Dependency Hotspots

| Hotspot | Dependency Type | Why It Is High Risk in PI-1 |
| --- | --- | --- |
| Remote server access model | Architectural + security | The platform promise depends on safe remote control of user-owned infrastructure. |
| App definition model | Product + design + engineering | Catalog quality affects deployment reliability, UX clarity, and supportability. |
| Health signal model | Backend + dashboard + alerts | Users need simple status while the system handles nuanced infrastructure states. |
| Rollback and safe-change contract | Security + testing + deployment | User trust will collapse quickly if updates or configuration changes feel irreversible. |

## Coordination Notes for PI-1

- Keep the committed scope centered on one complete first-app deployment path rather than broad catalog expansion.
- Treat catalog breadth, secondary app categories, and deeper alerting sophistication as stretch unless the core path stabilizes early.
- Protect integration checkpoints between provisioning, deployment orchestration, and dashboard telemetry. Those seams are the most likely source of schedule distortion.
- Use the program board as a dependency and evidence board, not just a timeline artifact.

## Research Sources

- [SAFe PI Planning](https://framework.scaledagile.com/pi-planning/) - accessed 2026-03-13
- [NIST Risk Management Framework Overview](https://csrc.nist.gov/projects/risk-management/about-rmf) - accessed 2026-03-13

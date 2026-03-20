---
artifact: pi-objectives
produced-by: release-train-engineer
project-slug: unplughq
work-item: epic-001-unplughq-platform
work-item-type: epic
workflow-tier: full
phase: P0
version: 2.0.0
status: draft
azure-devops-id: 277
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
date: 2026-03-16
review:
  reviewed-by:
  reviewed-date:
---

# PI Objectives

## PI Theme

**Make self-hosting productive: users deploy, monitor, and manage real applications from a unified dashboard.**

PI-2 builds on the proven PI-1 foundation to deliver the platform's core value proposition. See PI-2 objectives below; PI-1 objectives are retained as historical reference at the end of this document.

---

## PI-2 — Application Catalog, Deployment & Health Monitoring

### PI-2 Theme

**Make self-hosting productive: users deploy, monitor, and manage real applications from a unified dashboard.**

PI-2 builds on the PI-1 foundation (identity, server connection, provisioning) to deliver the two features that constitute UnplugHQ's core value proposition: a curated application catalog with one-action deployment (F2) and a health-first dashboard with proactive alerting (F3). Additionally, PI-2 must resolve 5 deferred bugs from PI-1 — 4 high-severity security issues and 1 medium accessibility issue — before exposing the platform to broader beta adoption.

### PI-2 Goal Statement

By the end of PI-2, a user with a connected VPS can browse a curated application catalog, deploy multiple self-hosted apps with guided configuration and progress visibility, confirm post-deployment health, and monitor all deployed apps plus server resources from a unified dashboard with proactive email alerts — all without terminal access. Deferred PI-1 security bugs are resolved, and the platform is ready for controlled beta expansion.

### PI-2 Velocity Assessment

| Metric | PI-1 Actual | PI-2 Planned | Delta | Assessment |
| --- | --- | --- | --- | --- |
| Story points | 47 SP delivered | 54 SP estimated | +7 SP (+15%) | **Elevated risk** — exceeds PI-1 proven velocity |
| Stories | 8 delivered | 8 planned | 0 | Same story count, higher average complexity |
| Average story size | 5.9 SP | 6.75 SP | +0.85 SP | F2 includes a 13 SP story (AB#204 Deployment + Progress) matching PI-1's largest (AB#200 Provisioning) |
| Deferred bugs | — | 5 (AB#251, AB#258-260, AB#262) | +5 items | Bug remediation competes with new feature scope |
| Features in scope | 2 (F1, F4) | 2 (F2, F3) | 0 | F2 is architecturally more complex than F1 or F4 |

**Scope negotiation recommendation:** The 54 SP target exceeds PI-1's proven 47 SP velocity by 15%. With 5 deferred bugs also requiring resolution, the effective sprint load is closer to 60-65 SP equivalent. The RTE recommends:

1. **Committed scope (42 SP):** AB#202 (5), AB#203 (5), AB#204 (13), AB#207 (8), AB#208 (8), AB#251 (medium bug, ~3 SP)
2. **Stretch scope (12 SP):** AB#205 (5), AB#206 (5), AB#209 (5) — defer if committed scope destabilizes
3. **Security bug fixes (must-do, parallel):** AB#258, AB#259, AB#260, AB#262 — addressed as P4 remediation tasks, not competing with story SP, but consuming BE/security bandwidth

This protects the core deployment + monitoring path while acknowledging the velocity ceiling.

### PI-2 Objectives

| ID | Objective | Business Value (1-10) | Measurable Success Criteria | Primary Feature Alignment |
| --- | --- | --- | --- | --- |
| PI2-O1 | Deliver a curated application catalog with browsable categories, search, and per-app detail pages so users can discover self-hostable software without external research. | 9 | ≥15 apps in catalog across ≥4 categories; catalog page load <2s; user can filter/search and view app details. | F2 Application Catalog & Deployment |
| PI2-O2 | Enable guided single-app deployment with contextual configuration, deployment progress visibility, and automatic SSL/domain routing so users deploy their first app without terminal access. | 10 | User deploys a catalog app through ≤5 configuration steps; deployment progress shown in real-time; deployed app reachable via HTTPS within 5 minutes of initiation; zero terminal steps required. | F2 Application Catalog & Deployment |
| PI2-O3 | Support multi-app coexistence on a single server so users can run multiple self-hosted apps without conflicts in ports, volumes, or reverse proxy routing. | 8 | ≥3 apps deployed simultaneously on one server; no port/volume conflicts; Caddy routes all apps correctly; resource allocation visible per app. | F2 Application Catalog & Deployment |
| PI2-O4 | Provide a unified dashboard with server resource overview and per-app health status so users understand their infrastructure state at a glance. | 9 | Dashboard shows CPU, RAM, disk usage; per-app status (running/stopped/unhealthy); data freshness <60s; dashboard loads <3s. | F3 Dashboard & Health Monitoring |
| PI2-O5 | Implement proactive health alerting with email notifications and guided remediation so users are informed of issues before they escalate. | 8 | Email alerts for: app down, CPU >90% for 5min, disk >85%, RAM >90%; alert-to-email latency <5min; remediation guidance included in alert body. | F3 Dashboard & Health Monitoring |
| PI2-O6 | Resolve all deferred PI-1 security bugs to establish the security posture required for beta expansion. | 10 | AB#258 (CSRF validation), AB#259 (input sanitization), AB#260 (secrets rotation), AB#262 (audit logging) all verified fixed; AB#251 (focus management) resolved; zero deferred high-severity bugs at PI-2 close. | Cross-cutting security |

### PI-2 Cross-PI Dependencies

PI-2 depends entirely on the PI-1 codebase — there is no greenfield path. Every PI-2 story builds on PI-1's delivered infrastructure.

| PI-2 Capability | PI-1 Dependency | Dependency Type | Risk if Dependency Weak |
| --- | --- | --- | --- |
| App catalog data model | Drizzle ORM schema, PostgreSQL 17, existing migration pipeline | Schema extension | New tables (apps, deployments, app_configs) must coexist with existing users, servers, sessions tables. Migration conflicts possible. |
| Deployment orchestration | BullMQ job queue, SSH service (`ssh2`), server provisioning flow | Service extension | Deployment jobs reuse the same SSH connection and job queue as provisioning. Queue contention or SSH session limits may surface. |
| Health monitoring agent | Server agent container deployed at provisioning (PI-1) | Agent extension | PI-1's monitoring agent pushes basic metrics. PI-2 requires per-app container health, which needs agent code changes deployed to already-connected servers. |
| Dashboard UI | Next.js app shell, shadcn/ui design system, authenticated layout | UI extension | F3 dashboard extends the layout shell and server dashboard tile from PI-1. Design system token consistency required. |
| Alert email pipeline | Auth.js session context, email service integration | New integration | PI-1 uses email for password reset only. PI-2 adds alert emails — requires shared email service abstraction. |
| CSRF/input sanitization fixes | tRPC middleware, form validation, Zod schemas | Codebase patch | Bug fixes modify existing middleware and validation layers. Regression risk on working F1/F4 flows. |
| Audit logging | Database schema, tRPC context, server operation handlers | New cross-cutting concern | AB#262 requires audit log writes across all destructive operations — server connect, app deploy, app remove. Touches many existing code paths. |

### PI-2 Risk Assessment Summary

| Risk Area | Probability | Impact | Score | Recommended Action |
| --- | --- | --- | --- | --- |
| Velocity overcommitment (54 SP vs 47 SP proven) | 4 | 4 | 16 | Adopt committed/stretch split; protect core deployment path |
| App template data model complexity | 3 | 4 | 12 | SA to define extensible app-definition schema early at P1 |
| Docker orchestration on remote servers (multi-app) | 4 | 5 | 20 | Start AB#206 (multi-app coexistence) early; test with 3+ apps |
| Real-time health monitoring latency | 3 | 4 | 12 | Define health signal semantics and polling/push intervals at P1 |
| Deferred security bugs consuming sprint capacity | 4 | 4 | 16 | Treat as Week 1 priority; do not defer again |
| Regression risk from cross-cutting bug fixes | 3 | 4 | 12 | Full test suite must pass after each bug fix merge |

See the full PI-2 risk register in [risk-register.md](risk-register.md) for detailed mitigations.

### PI-2 Confidence Vote Targets

| Measure | Target | Interpretation | Response if Missed |
| --- | --- | --- | --- |
| Average confidence score | >= 3.5 / 5.0 | Lower than PI-1 target (4.0) due to higher scope and complexity. 3.5 acknowledges the stretch. | Immediately move AB#205, AB#206, or AB#209 to stretch/deferred. |
| Lowest team/role confidence | >= 3 / 5 | No discipline enters PI-2 with unresolved structural blockers. | Escalate blocker into ROAM review; scope-cut the affected story. |
| Unresolved critical dependencies | 0 by PI commitment | PI-2 dependencies on PI-1 codebase must be validated (build passes, tests green, schema stable). | Run full regression suite before PI-2 P4 starts. |
| Stretch objective exposure | <= 25% of planned capacity | Higher than PI-1 (20%) to account for velocity uncertainty and bug remediation load. | Convert stretch stories to Sprint 3 backlog candidates. |

### PI-2 Program Board Outline

| Track | Planned Window | Target Outcome | Key Dependencies | Milestone |
| --- | --- | --- | --- | --- |
| Bug Remediation | P4 Week 1 | AB#258, AB#259, AB#260, AB#262, AB#251 resolved and verified | PI-1 codebase, existing test suite | All deferred bugs closed; full regression green |
| Discovery & Architecture | P0-P1 | PI-2 vision, updated architecture for app catalog + health monitoring, threat model for new attack surfaces | PI-1 summary, architecture-overview, existing threat model | Gate 2 passed with app-definition schema and health signal model defined |
| Experience Design | P2 | App catalog browsing UX, deployment flow UX, dashboard layout, alert notification design, accessibility annotations | P1 outputs, PI-1 design system | Gate 3 passed with deployment and dashboard journeys fully specified |
| Planning Convergence | P3 | Sprint 2 stories refined, delegation briefs, updated working agreements, dependency map | P2 outputs, velocity assessment | Gate 4 passed with committed/stretch scope confirmed |
| Build — App Catalog | P4 | Catalog data model, template system, browsing UI, configuration flow, deployment pipeline with progress | Bug fixes merged, schema stable, test contracts ready | Catalog browsing and single-app deployment working end-to-end |
| Build — Dashboard & Alerts | P4 | Dashboard resource overview, per-app health tiles, alert pipeline, email notifications | Health monitoring agent extended, deployment events flowing | Dashboard shows live server + app state; alerts fire on threshold breach |
| Build — Multi-App (Stretch) | P4 late | Multi-app port/volume/proxy orchestration, resource visibility per app | Single-app deployment stable | ≥3 apps coexisting on one server without conflict |
| Verification | P5 | Functional, security, accessibility validation of catalog + dashboard + alerts | Integrated build, extended test suite including Playwright E2E | Gate 6 passed with critical blockers resolved |
| Acceptance & Release | P6-P7 | PO acceptance, deployment, smoke verification, beta expansion readiness | All verification complete | Controlled beta release with app catalog and monitoring |
| Retrospective | P8 | PI-2 learning, framework observations, PI-3 planning input | Full sprint data | Gate 9 closure and PI-3 continuation decision |

### PI-2 Coordination Notes

- **Bug-first execution:** Deferred PI-1 bugs must be resolved in Week 1 before new feature code destabilizes the areas being patched. AB#258 (CSRF), AB#259 (input sanitization), and AB#260 (secrets rotation) touch middleware and validation layers that F2 deployment flows will exercise heavily.
- **App-definition schema is the PI-2 architectural crux:** The SA must define the app template model at P1 with enough extensibility for 15+ apps but enough constraint to prevent per-app special cases. This decision gates the entire F2 feature. See PI-1 Risk R3 (still active at score 12).
- **Health monitoring requires server agent evolution:** The PI-1 monitoring agent pushes basic server metrics. PI-2 requires per-container health status. This means deploying updated agent code to already-provisioned servers — a migration path the DevOps engineer must design.
- **Playwright E2E tests are a PI-2 must-have:** PI-1 shipped with zero browser-level tests (retrospective action A2). The Testing agent at P4 must establish Playwright infrastructure and a smoke suite covering the deployment flow and dashboard.
- **Protect the committed/stretch boundary:** If velocity pressure mounts, AB#205 (Post-Deploy Verification), AB#206 (Multi-App Coexistence), and AB#209 (Alert Remediation) are the designated stretch stories in that priority order. Do not cut from the core deployment or dashboard paths.
- **Cross-cutting audit logging (AB#262) affects many code paths:** This bug fix touches server connection, provisioning, and all new deployment operations. Sequence it early so F2/F3 code can include audit calls from the start rather than retrofitting.

---

## PI-1 — Historical Reference (Delivered)

> The following PI-1 objectives are retained as historical reference. PI-1 was delivered in Sprint 1 (2026-03-13 through 2026-03-16) with 8/8 stories, 47 SP, 226/226 tests, 9/9 gates PASS.

### PI-1 Theme

**Make self-hosting feel safe, guided, and real on day one.**

### PI-1 Goal Statement

By the end of PI-1, UnplugHQ should support a complete first-use path from account creation to first successful application deployment on a user-owned VPS, with guided configuration, baseline monitoring, and enough operational safety to support controlled beta adoption.

### PI-1 Objectives (Delivered)

| ID | Objective | Business Value (1-10) | Success Signal | Outcome |
| --- | --- | --- | --- | --- |
| PI1-O1 | Deliver a trustworthy account foundation so a new user can sign up, authenticate, manage a session, and recover account access without support intervention. | 8 | Complete signup, login, logout, and password reset flows without blockers. | **Delivered** — F4 User Identity & Access (4 stories, 16 SP) |
| PI1-O2 | Establish a guided VPS connection and provisioning flow that validates server readiness and prepares the baseline runtime needed for managed deployments. | 10 | A supported VPS can be connected, validated, and prepared through a visual flow with no terminal steps. | **Delivered** — F1 Server Connection & Provisioning (4 stories, 31 SP) |
| PI1-O3 | Enable curated first-app deployment with contextual configuration, SSL/domain setup pathing, and deployment progress visibility. | 10 | A user can select a catalog app, answer a minimal configuration set, and reach a running application URL. | **Deferred to PI-2** — Became F2 Application Catalog & Deployment |
| PI1-O4 | Provide a health-first dashboard that exposes server status, app state, and actionable alerts clearly enough for non-technical operators. | 8 | Users can see server resource posture, per-app status, and at least basic alert conditions in one place. | **Deferred to PI-2** — Became F3 Dashboard & Health Monitoring |
| PI1-O5 | Prove operational trust through baseline security, deployment verification, rollback-oriented planning, and clear cross-team evidence for a controlled beta release. | 9 | Safe delivery evidence for identity, remote access, provisioning, deployment, and monitoring flows. | **Delivered** — 9/9 gates PASS, 226/226 tests, critical bugs resolved |

### PI-1 Delivery Summary

- **Velocity:** 47 SP (8 stories across 2 features)
- **Quality:** 226 tests, 100% pass rate, 16 bugs found, 11 fixed in-sprint (68.75%), 2/2 critical resolved
- **Deferred:** 5 bugs (AB#251, AB#258, AB#259, AB#260, AB#262), 2 features (F2, F3)
- **Risk reduction:** 40% average risk score reduction (14.1 → 8.5)
- **See:** [PI-1 Summary](pi-1-summary.md), [Retrospective Report](retrospective-report.md), [Flow Metrics Report](flow-metrics-report.md)

## Research Sources

- [SAFe PI Planning](https://framework.scaledagile.com/pi-planning/) - accessed 2026-03-13, 2026-03-16
- [NIST Risk Management Framework Overview](https://csrc.nist.gov/projects/risk-management/about-rmf) - accessed 2026-03-13, 2026-03-16

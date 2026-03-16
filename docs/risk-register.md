---
artifact: risk-register
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
  - system-architect
  - security-analyst
  - solution-designer
  - product-owner
  - scrum-master
  - tech-lead
  - testing
  - devops-engineer
date: 2026-03-16
review:
  reviewed-by:
  reviewed-date:
---

# Risk Register

## Risk Framing

This register covers PI-1 and PI-2 risk exposure for UnplugHQ, a platform operating in a high-trust domain: remote management of customer-owned servers. Scoring uses a simple `probability x impact` model on a `1-5` scale. ROAM status should be revisited at PI Planning and each ART sync.

PI-2 risks are listed first (active). PI-1 risks are retained as historical reference with post-PI-1 status updates.

## Scoring Model

| Score Band | Interpretation |
| --- | --- |
| 1-5 | Low: monitor only |
| 6-10 | Moderate: mitigation required in planning |
| 11-15 | High: active owner and explicit contingency required |
| 16-25 | Critical: must influence scope, sequencing, or release gating |

---

## PI-2 Risk Register

PI-2 introduces new risk categories around application deployment orchestration, health monitoring architecture, multi-app resource management, and the obligation to resolve deferred security debt. These risks compound with residual PI-1 risks that were not fully resolved.

| ID | Category | Risk Statement | Probability | Impact | Score | ROAM | Mitigation Strategy | Recommended Owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R13 | Technical | The app template/definition data model is insufficiently extensible, causing per-app special cases that slow catalog growth beyond the initial 5-10 apps. | 4 | 4 | 16 | Owned | SA must define a declarative app-definition schema at P1 that handles configuration variance (ports, volumes, env vars, dependencies) without per-app code. Validate against ≥5 diverse apps (file storage, analytics, CMS, password manager, media) before finalizing. | System Architect |
| R14 | Technical | Docker container orchestration on remote servers via SSH introduces failure modes not present in local development: network timeouts, partial deployments, orphaned containers, and image pull failures. | 4 | 5 | 20 | Mitigated | Design deployment as an idempotent state machine with explicit rollback on each step. BullMQ job must track deployment state and support resume-from-failure. Test against real VPS with varying network conditions. | Backend Developer |
| R15 | Technical | Real-time health monitoring introduces latency, data freshness, and reliability challenges — the server agent must push metrics reliably over varying network conditions. | 3 | 4 | 12 | Mitigated | Define explicit health signal semantics (stale threshold, polling interval, reconnection strategy) at P1. Use SSE or WebSocket for dashboard with graceful degradation to polling. Treat stale data as an explicit UI state, not a silent failure. | Backend Developer |
| R16 | Technical | Multi-app coexistence creates resource contention (CPU, RAM, disk, ports, Docker network) that is difficult to predict and may cause cascading failures across apps. | 3 | 5 | 15 | Owned | Implement per-app resource tracking visible on dashboard. Define soft resource limits in app templates. Test with ≥3 concurrent apps on a 2 vCPU / 4 GB RAM VPS (minimum viable spec). Alert when aggregate resource usage exceeds 80%. | DevOps Engineer |
| R17 | Technical | The alert pipeline (metric collection → threshold evaluation → email dispatch) has multiple failure points; missed alerts undermine the core product promise of proactive monitoring. | 3 | 5 | 15 | Mitigated | Implement alert pipeline health self-check (the system monitors its own monitoring). Use a dead-letter queue for failed alert emails. Test alert latency end-to-end at P5. Include alert delivery confirmation in dashboard. | Backend Developer |
| R18 | Technical | Caddy reverse proxy configuration for multi-app routing becomes complex with SSL certificates, subdomain routing, and port allocation across multiple apps, risking misrouting or certificate failures. | 3 | 4 | 12 | Mitigated | Standardize Caddy configuration generation from app templates. Test multi-domain SSL provisioning. Include Caddy health in server monitoring. Design rollback for proxy config changes. | DevOps Engineer |
| R19 | Security | Deferred PI-1 security bugs (AB#258 CSRF, AB#259 input sanitization, AB#260 secrets rotation, AB#262 audit logging) remain open during early PI-2 development, leaving known vulnerabilities active while new attack surface (deployment, monitoring) is added. | 5 | 5 | 25 | Mitigated | Treat as Week 1 P4 priority — resolve all 4 high-severity bugs before any new F2/F3 code that exercises the affected paths. Full regression test after each fix. Do not defer these bugs again. | Tech Lead |
| R20 | Security | Application deployment introduces new attack vectors: malicious container images, supply chain attacks via Docker Hub, container escape, and inter-container network access. | 3 | 5 | 15 | Owned | Curate catalog images from trusted sources only (official images, verified publishers). Implement image digest pinning in app templates. Isolate app containers via Docker network segmentation. SEC agent to threat-model the deployment pipeline at P1. | Security Analyst |
| R21 | Security | The server monitoring agent runs with elevated privileges on the user's VPS; a compromised agent could provide lateral movement or data exfiltration capability. | 2 | 5 | 10 | Mitigated | Run agent with minimal required privileges (read-only Docker socket, read-only system metrics). Agent authenticates to control plane with per-server token (fix AB#262 first). Agent code review by SEC at P5. | Security Analyst |
| R22 | Delivery | PI-2 scope (54 SP) exceeds PI-1 proven velocity (47 SP) by 15%, and 5 deferred bugs consume additional bandwidth, creating a cumulative load of ~60-65 SP equivalent. | 4 | 4 | 16 | Mitigated | Adopt committed (42 SP) / stretch (12 SP) split. Protect core deployment + dashboard path. Deferred bugs addressed as parallel remediation tasks in Week 1. PO to reassess scope at Gate 4 based on bug remediation progress. | Product Owner |
| R23 | Delivery | PI-2 requires significant schema extensions (apps, deployments, app_configs, alerts, audit_logs) that may conflict with PI-1 migrations or introduce data model complexity that slows development. | 3 | 4 | 12 | Mitigated | DBA to design PI-2 schema as additive (new tables only; no PI-1 table modifications unless required for bug fixes). Migration tested against PI-1 production schema snapshot. | Database Administrator |
| R24 | Delivery | No Playwright E2E test infrastructure exists from PI-1 (retrospective action A2). UI-heavy F2 and F3 features risk delivering code that passes unit tests but fails in the browser. | 4 | 4 | 16 | Owned | Testing agent must establish Playwright infrastructure at P4 Step 1 and deliver smoke suite covering deployment flow and dashboard before code agents implement F2/F3 UI. | Testing |
| R25 | External | Docker Hub rate limits, image availability, or registry outages affect deployment reliability for end users, causing failed deployments that appear to be UnplugHQ's fault. | 3 | 4 | 12 | Accepted | Design graceful error messaging for image pull failures. Consider image caching strategy on user's VPS. Document known Docker Hub rate limits in app deployment flow. Implement retry with backoff in deployment jobs. | Backend Developer |

## PI-2 Critical Risks Requiring Early Attention

| Risk ID | Why It Is Critical | Immediate Planning Impact |
| --- | --- | --- |
| R19 | Known security vulnerabilities are active while new attack surface is being added. This is the highest-scoring risk (25) in the register. | Resolve all 4 deferred security bugs in Week 1 before F2/F3 development begins. |
| R14 | Remote Docker orchestration is the most complex new technical capability in PI-2. Failure here blocks the entire F2 feature. | SA and BE must design the deployment state machine at P1 with explicit failure/rollback semantics. |
| R22 | Velocity overcommitment is the most likely delivery failure mode. | Enforce committed/stretch split; PO to confirm scope at Gate 4. |
| R24 | No E2E test infrastructure means F2/F3 UI verification depends on manual testing. | Playwright setup must precede F2/F3 UI implementation at P4. |

## PI-2 Mitigation Priorities for PI Planning

| Priority | Action | Intended Risk Reduction |
| --- | --- | --- |
| 1 | Resolve deferred PI-1 security bugs (AB#258, AB#259, AB#260, AB#262) before new feature code. | Reduces R19 (critical), partially reduces R20, R21 |
| 2 | SA defines extensible app-definition schema with validation against ≥5 diverse apps. | Reduces R13, R18 |
| 3 | Design deployment as idempotent state machine with per-step rollback and resume capability. | Reduces R14, R25 |
| 4 | Define health signal semantics, polling intervals, and stale-data UX treatment. | Reduces R15, R17 |
| 5 | Establish Playwright E2E infrastructure and smoke suite before F2/F3 UI code. | Reduces R24 |
| 6 | Adopt committed (42 SP) / stretch (12 SP) scope split and enforce at Gate 4. | Reduces R22 |
| 7 | Test multi-app coexistence on minimum-spec VPS (2 vCPU / 4 GB) with ≥3 concurrent apps. | Reduces R16, R18 |

## PI-2 Monitoring Triggers

| Trigger | Escalation Signal |
| --- | --- |
| Any deferred PI-1 security bug still open at P4 Week 2 start | Halt new feature development until resolved; treat as release-blocking |
| App-definition schema requires per-app special-case code for >20% of catalog apps | Reassess schema design; consider SA rearchitecture spike |
| Deployment state machine cannot handle network interruption gracefully in testing | Escalate to SA; may require architecture change (async confirmation pattern) |
| Health monitoring agent data freshness exceeds 120s in testing | Reassess push/pull architecture; consider fallback to periodic polling |
| Sprint velocity tracking below 35 SP at mid-sprint checkpoint | Trigger scope renegotiation; move stretch stories to Sprint 3 |
| Playwright E2E infrastructure not ready by P4 Step 2 start | Block F2/F3 UI implementation until test infrastructure is available |

---

## PI-1 Risk Register — Historical Reference

> PI-1 risks are retained below with post-PI-1 status updates. Risks that remain relevant to PI-2 are cross-referenced in the PI-2 register above.

### PI-1 Risk Status Summary

| ID | Original Score | Post-PI-1 Status | Notes |
| --- | --- | --- | --- |
| R1 (SSH connection inconsistency) | 20 | **Resolved** — Score reduced to 8 | PI-1 proved SSH connectivity across supported VPS images. Constrained scope worked. |
| R2 (Provisioning drift) | 16 | **Resolved** — Score reduced to 6 | Idempotent provisioning validated; 226/226 tests passing. |
| R3 (App definition model shallow) | 12 | **Active** — Score unchanged at 12 | Deferred to PI-2. Now tracked as R13. |
| R4 (Dashboard health signals) | 12 | **Active** — Score unchanged at 12 | Deferred to PI-2. Now tracked as R15. |
| R5 (Security attack surface) | 20 | **Partially resolved** — Score reduced to 12 | Critical bugs fixed (AB#254, AB#255). 4 high-severity bugs deferred. Now tracked as R19. |
| R6 (Data sovereignty breach) | 15 | **Mitigated** — Score reduced to 8 | Architecture enforces control-plane-only data storage. Validated at P5. |
| R7 (Scope expansion) | 20 | **Resolved** — Score reduced to 4 | PI-1 delivered committed scope exactly. Stretch properly managed. |
| R8 (New-ART handoff quality) | 16 | **Resolved** — Score reduced to 6 | 9/9 gates PASS, 48+ artifacts, zero Task-First violations. |
| R9 (Test contracts late) | 15 | **Resolved** — Score reduced to 4 | Test-first sequencing at P4 was highly effective. 170+ contract stubs delivered before code. |
| R10 (VPS provider behavior) | 12 | **Accepted** — Score unchanged at 12 | PI-2 adds more VPS interaction (deployment); risk persists. |
| R11 (Competitive tools) | 8 | **Accepted** — Score unchanged at 8 | No material competitive shift during PI-1. |
| R12 (Domain/DNS/cert friction) | 12 | **Active** — Score unchanged at 12 | PI-2 SSL provisioning for deployed apps will exercise this risk. |

### PI-1 Original Risk Register

| ID | Category | Risk Statement | Probability | Impact | Score | Initial ROAM | Mitigation Strategy | Recommended Owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R1 | Technical | SSH-based server connection behaves inconsistently across VPS images, auth methods, or host hardening states, preventing reliable onboarding. | 4 | 5 | 20 | Mitigated | Constrain PI-1 to a clearly supported baseline, define explicit compatibility checks early, and surface unsupported states before provisioning begins. | System Architect |
| R2 | Technical | Base provisioning introduces drift across providers or operating-system variants, making deployments non-repeatable. | 4 | 4 | 16 | Mitigated | Treat provisioning as a controlled contract, validate environment assumptions before install, and require idempotent setup behavior in design and testing. | DevOps Engineer |
| R3 | Technical | The initial app definition model is too shallow or too bespoke, slowing catalog growth and causing per-app operational exceptions. | 3 | 4 | 12 | Owned | Define a minimal but extensible application-definition contract in PI-1 and limit launch apps to those that fit it cleanly. | Solution Designer |
| R4 | Technical | Dashboard health signals are noisy, delayed, or misleading, reducing trust in the product's monitoring claims. | 3 | 4 | 12 | Mitigated | Establish a small set of authoritative health states first, align telemetry semantics early, and test alert conditions against real failure scenarios. | Backend Developer |
| R5 | Security | Remote server access, credential handling, secret storage, or deployment actions expand the attack surface faster than controls are defined. | 4 | 5 | 20 | Mitigated | Force early threat modeling on remote access and tenant boundaries, minimize retained secrets, and require secure defaults before beta exposure. | Security Analyst |
| R6 | Security | The product fails the data-sovereignty expectation by accidentally retaining user application data or operational data beyond intended control-plane scope. | 3 | 5 | 15 | Owned | Make data-boundary decisions explicit in architecture, classify stored data types, and review all telemetry and backup flows against the sovereignty rule. | System Architect |
| R7 | Delivery | PI-1 scope expands from a first-app proof into a broad self-hosting platform, reducing predictability and threatening core flow completion. | 5 | 4 | 20 | Owned | Keep the committed scope to the first-app path, treat breadth as stretch, and use confidence-vote feedback to narrow scope before commitment. | Product Manager |
| R8 | Delivery | The ART is new to the domain, so handoffs between BA, SA, SEC, SD, UX, and engineering may produce inconsistent assumptions. | 4 | 4 | 16 | Mitigated | Use explicit convergence checkpoints on identity, server connection, deployment, and health vocabulary before implementation planning. | Release Train Engineer |
| R9 | Delivery | Test contracts and verification environments arrive too late to support safe multi-discipline implementation. | 3 | 5 | 15 | Mitigated | Enforce test-first sequencing at P4, reserve integration time early, and protect environment readiness as a P3/P4 prerequisite. | Tech Lead |
| R10 | External | VPS provider behavior, cloud-init defaults, firewall presets, or API surface changes reduce the reliability of the guided connection flow. | 3 | 4 | 12 | Accepted | Limit PI-1 claims to documented provider patterns, validate assumptions against top providers, and build compatibility signaling into onboarding. | Business Analyst |
| R11 | External | Competitive tools in the self-hosting space improve onboarding faster than expected, weakening differentiation before launch. | 2 | 4 | 8 | Accepted | Differentiate on guided safety, operational trust, and non-technical usability rather than catalog breadth alone. | Product Manager |
| R12 | External | Domain, DNS, certificate, or outbound-email dependencies create setup friction outside UnplugHQ's direct control. | 3 | 4 | 12 | Mitigated | Design guided fallbacks, pre-check requirements, and clear remediation content so external dependency failures do not feel opaque. | UX Designer |

### PI-1 Critical Risks (Historical)

| Risk ID | Why It Was Critical | Planning Impact | PI-1 Outcome |
| --- | --- | --- | --- |
| R1 | Server connection unpredictability could fail the core promise. | Narrowed supported environments. | **Resolved** — Constrained scope worked. |
| R5 | Remote server management is inherently high trust. | Pulled security review forward. | **Partially resolved** — Critical bugs fixed; 4 HIGH deferred. |
| R7 | Scope expansion was the most likely delivery failure mode. | Protected first-app path. | **Resolved** — Committed scope delivered exactly. |
| R8 | New-ART handoff quality determined later phase success. | Added convergence checkpoints. | **Resolved** — 9/9 gates PASS. |

## Research Sources

- [SAFe PI Planning](https://framework.scaledagile.com/pi-planning/) - accessed 2026-03-13, 2026-03-16
- [NIST Risk Management Framework Overview](https://csrc.nist.gov/projects/risk-management/about-rmf) - accessed 2026-03-13, 2026-03-16
- [Docker Security Best Practices](https://docs.docker.com/engine/security/) - accessed 2026-03-16
- [OWASP Container Security](https://owasp.org/www-project-docker-top-10/) - accessed 2026-03-16

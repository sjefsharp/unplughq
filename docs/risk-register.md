---
artifact: risk-register
produced-by: release-train-engineer
project-slug: unplughq
work-item: epic-001-unplughq-platform
work-item-type: epic
workflow-tier: full
phase: P0
version: 1.0.0
status: approved
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
date: 2026-03-13
azure-devops-id: 180
review:
  reviewed-by: product-manager
  reviewed-date: 2026-03-13
---

# Initial Risk Register

## Risk Framing

This register covers the initial PI-1 exposure for a new product and a new ART operating in a high-trust domain: remote management of customer-owned servers. Scoring uses a simple `probability x impact` model on a `1-5` scale. ROAM status is initial only and should be revisited at PI Planning and each ART sync.

## Operational Constraint

Azure Boards is currently unavailable for project `unplughq` according to the Azure health check (`category: NOT_FOUND`). Required Task creation and discussion traceability are therefore blocked at P0 and must be backfilled when Azure access is restored.

## Scoring Model

| Score Band | Interpretation |
| --- | --- |
| 1-5 | Low: monitor only |
| 6-10 | Moderate: mitigation required in planning |
| 11-15 | High: active owner and explicit contingency required |
| 16-25 | Critical: must influence scope, sequencing, or release gating |

## Initial Risk Register

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

## Critical Risks Requiring Early Attention

| Risk ID | Why It Is Critical | Immediate Planning Impact |
| --- | --- | --- |
| R1 | If server connection is not predictable, the core promise fails before the user experiences value. | Narrow supported environments in PI-1 and plan compatibility checks before deployment features. |
| R5 | Remote server management is inherently high trust; a weak security posture will undermine the product before beta. | Pull security review forward on identity, secrets, remote execution, and control-plane boundaries. |
| R7 | Scope expansion is the most likely delivery failure mode for a compelling new platform. | Explicitly protect the first-app path and demote breadth work to stretch. |
| R8 | New-ART handoff quality will determine whether later phases compound or remove uncertainty. | Add convergence checkpoints at P1, P3, and before parallel P4 execution. |

## Mitigation Priorities for PI Planning

| Priority | Action | Intended Risk Reduction |
| --- | --- | --- |
| 1 | Define the supported PI-1 VPS baseline and unsupported-state messaging. | Reduces R1, R2, R10 |
| 2 | Lock the data-sovereignty and secret-handling boundaries before solution design is finalized. | Reduces R5, R6 |
| 3 | Convert the PM roadmap into a protected committed scope versus stretch scope split. | Reduces R7 |
| 4 | Align teams on a single deployment lifecycle vocabulary: connect, validate, provision, configure, deploy, verify, alert. | Reduces R8, R9 |
| 5 | Limit the launch catalog to applications that fit the initial app-definition contract cleanly. | Reduces R3, R7 |

## Monitoring Triggers

| Trigger | Escalation Signal |
| --- | --- |
| More than one supported VPS path requires special-case provisioning logic | Reassess PI-1 compatibility scope and move unsupported environments out of commitment |
| Security assumptions for remote access remain unresolved after P1 | Treat as a release-blocking risk, not a deferred detail |
| The MVP flow adds more than one major feature beyond F1-F4 | Trigger scope review and confidence-vote reset |
| Test environments cannot simulate the first-app path before mid-P4 | Escalate as a PI predictability threat |

## Research Sources

- [SAFe PI Planning](https://framework.scaledagile.com/pi-planning/) - accessed 2026-03-13
- [NIST Risk Management Framework Overview](https://csrc.nist.gov/projects/risk-management/about-rmf) - accessed 2026-03-13

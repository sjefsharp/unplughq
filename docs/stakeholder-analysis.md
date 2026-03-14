---
artifact: stakeholder-analysis
produced-by: business-analyst
project-slug: unplughq
work-item: epic-001-unplughq-platform
work-item-type: epic
workflow-tier: full
phase: P1
version: 1.0.0
status: draft
azure-devops-id: 173
consumed-by:
  - product-manager
  - product-owner
  - ux-designer
  - content-strategist
  - accessibility
  - security-analyst
  - solution-designer
date: 2026-03-13
---

# Stakeholder Analysis

## Overview

This document identifies all stakeholders for the UnplugHQ platform, maps their power and interest, defines the engagement strategy for each, and establishes responsibility assignments (RACI) across the core product activities. The analysis is grounded in the Product Vision (epic-001-unplughq-platform, AB#169).

---

## Stakeholder Map

| ID | Stakeholder | Role | Type | Power | Interest | Quadrant |
|----|-------------|------|------|-------|----------|----------|
| S1 | Aspiring Self-Hoster | Primary end user | External | Low | High | **Manage Closely** |
| S2 | Technical Simplifier | Secondary end user | External | Low | High | **Manage Closely** |
| S3 | Product Manager | Product vision and gate authority | Internal | High | High | **Manage Closely** |
| S4 | Release Train Engineer | PI coordination, risk, and framework integrity | Internal | High | High | **Manage Closely** |
| S5 | Product Owner | Backlog, sprint authority, acceptance | Internal | High | High | **Manage Closely** |
| S6 | System Architect | Technology selection, architecture decisions | Internal | High | Medium | **Keep Satisfied** |
| S7 | Security Analyst | Threat modelling, security requirements | Internal | Medium | High | **Manage Closely** |
| S8 | Solution Designer | API contracts, data models, component design | Internal | Medium | High | **Keep Informed** |
| S9 | UX Designer | User interface design, interaction flows | Internal | Medium | High | **Keep Informed** |
| S10 | Content Strategist | Messaging, copywriting, tone of voice | Internal | Low | Medium | **Keep Informed** |
| S11 | Accessibility Specialist | WCAG compliance, assistive tech guidance | Internal | Medium | Medium | **Keep Informed** |
| S12 | Tech Lead | Implementation coordination, code quality | Internal | High | High | **Manage Closely** |
| S13 | Development ART (FE/BE/DBA/DevOps) | Implementation, CI/CD, infrastructure | Internal | Medium | High | **Keep Informed** |
| S14 | Testing Agent | Test strategy, quality assurance, verification | Internal | Medium | High | **Keep Informed** |
| S15 | VPS Providers | External infrastructure partner | External | Medium | Low | **Keep Satisfied** |
| S16 | Upstream OSS Projects | Source of self-hostable application images | External | Low | Low | **Monitor** |
| S17 | Data Protection Regulators (GDPR) | EU/EEA compliance authority | External | High | Low | **Keep Satisfied** |
| S18 | Beta Community | Early adopters providing validation feedback | External | Low | High | **Manage Closely** |

---

## Power / Interest Matrix

```
HIGH POWER │ Keep Satisfied        │ Manage Closely
           │ S6 System Architect   │ S3 Product Manager
           │ S17 GDPR Regulators   │ S4 Release Train Engineer
           │ S15 VPS Providers     │ S5 Product Owner
           │                       │ S12 Tech Lead
           │                       │ S7 Security Analyst
───────────┼───────────────────────┼──────────────────────────────
LOW POWER  │ Monitor               │ Keep Informed
           │ S16 OSS Projects      │ S1 Aspiring Self-Hoster
           │                       │ S2 Technical Simplifier
           │                       │ S8 Solution Designer
           │                       │ S9 UX Designer
           │                       │ S10 Content Strategist
           │                       │ S11 Accessibility Specialist
           │                       │ S13 Development ART
           │                       │ S14 Testing Agent
           │                       │ S18 Beta Community
           └───────────────────────┴──────────────────────────────
                   LOW INTEREST          HIGH INTEREST
```

> *Note:* Users (S1/S2/S18) appear in "Keep Informed / Manage Closely" due to high interest combined with relatively low direct power over the platform. They are the primary source of requirements validation and their satisfaction is the ultimate measure of product success, so they are treated as Manage Closely for engagement purposes despite limited institutional power.

---

## Stakeholder Profiles

### S1 — Aspiring Self-Hoster (Primary End User)

| Attribute | Detail |
|-----------|--------|
| **Demographics** | 25–45, digitally literate, non-developer/non-sysadmin |
| **Context** | Freelancers, small business owners, privacy-conscious individuals, digital creators |
| **Primary motivation** | Data ownership, cost reduction, independence from vendor lock-in |
| **Key frustration** | "I want to self-host but I don't have time to become a Linux sysadmin" |
| **Success looks like** | First app running in < 15 minutes with zero terminal use |
| **Engagement channel** | Product UX, onboarding flow, email communications, help documentation |
| **Engagement strategy** | Validate user journeys through user testing and beta feedback. Design for comprehension, not technical proficiency. Measure task completion rates and time-to-first-app deployment |
| **Risks if neglected** | Product fails its core promise; zero-terminal claim not met; high drop-off during onboarding |

### S2 — Technical Simplifier (Secondary End User)

| Attribute | Detail |
|-----------|--------|
| **Demographics** | Developers and tech-savvy users who already self-host but find maintenance tedious |
| **Context** | Manages 2–5 self-hosted apps manually; tired of babysitting containers |
| **Primary motivation** | Consolidate management, reduce operational time, automate maintenance |
| **Key frustration** | "I can set it up, but I don't want to manually manage 10 Docker containers every weekend" |
| **Success looks like** | All existing apps under one dashboard with automated updates and monitoring |
| **Engagement channel** | Product UX, changelog, advanced settings, API access (future) |
| **Engagement strategy** | Surface power features (audit log, advanced monitoring) without cluttering the novice experience. Represent in user research alongside S1 to surface tension between simplicity and capability |
| **Risks if neglected** | Product perceived as "just for beginners"; early-adopter community fails to form |

### S3 — Product Manager

| Attribute | Detail |
|-----------|--------|
| **Role** | Owns the product vision, gates, and feature roadmap. Sole invocation hub for the ART. |
| **Engagement strategy** | Primary collaborator for BA at P1. BA artifacts must directly address vision outcomes, success criteria, and feature signals documented in the product vision. Flag any requirements that lack vision traceability. |

### S4 — Release Train Engineer

| Attribute | Detail |
|-----------|--------|
| **Role** | Owns PI objectives, risk register, coordination plan, and framework integrity |
| **Engagement strategy** | BA outputs directly inform PI-1 planning and dependency mapping. Risk register items R1, R10 (VPS compatibility), R12 (DNS/SSL dependencies) directly shape requirements scope decisions. BA must flag any new risks discovered during elicitation. |

### S5 — Product Owner

| Attribute | Detail |
|-----------|--------|
| **Role** | Translates requirements into sprint backlog (stories/tasks), retains tactical authority at P3+ |
| **Engagement strategy** | Requirements must be structured with sufficient granularity that PO can decompose into stories with clear acceptance criteria. MoSCoW prioritization must align with WSJF sequencing from the Feature Roadmap. |

### S6 — System Architect

| Attribute | Detail |
|-----------|--------|
| **Role** | Technology selection, architecture decisions, solution assessment |
| **Engagement strategy** | BA and SA work in parallel at P1. Requirements must describe capabilities (WHAT) without prescribing technology (HOW). Functional signals table in the product vision should guide SA's assessment. BA flags any requirements that imply specific technology constraints for SA review. |
| **Key dependencies** | SA's architecture choices (container runtime, reverse proxy technology) inform feasibility of NFRs 004, 010. |

### S7 — Security Analyst

| Attribute | Detail |
|-----------|--------|
| **Role** | Threat modelling, security requirements, security testing plan |
| **Dependencies on BA** | Business rules BR-F4-001–003, BR-F1-001–002, BR-Global-001–004 are the BA's security-adjacent constraints. SA threat modelling at P1 Step 2 builds on BA requirements. |
| **Engagement strategy** | BA consults Security Analyst's threat model output to verify security-related acceptance criteria are consistent. R5 (attack surface) and R6 (data sovereignty) are critical shared concerns. |

### S15 — VPS Providers (DigitalOcean, Hetzner, Linode/Akamai, Vultr, OVHcloud)

| Attribute | Detail |
|-----------|--------|
| **Relationship** | External infrastructure partners whose platforms must be supported for FR-F1-002 (provider-specific SSH instructions) |
| **Interest level** | Low — providers have no commercial relationship with UnplugHQ for PI-1 |
| **Power** | Medium — provider platform changes (firewall defaults, cloud-init changes, API surface) affect R10 |
| **Engagement strategy** | Document provider-specific onboarding instructions based on their published documentation. Monitor provider changelog and platform notices through BA research at PI boundaries. No formal partnership engagement required in PI-1. |

### S16 — Upstream Open-Source Projects (Nextcloud, Plausible, etc.)

| Attribute | Detail |
|-----------|--------|
| **Relationship** | Source of container images and application definitions. Catalog entries must link to upstream projects (BR-F2-001). |
| **Engagement strategy** | Monitor upstream release channels to maintain current App Definitions. No formal engagement required in PI-1 beyond attribution. Version pinning and update detection strategy is an SA/SA/SD concern. |

### S17 — Data Protection Regulators (GDPR / EU)

| Attribute | Detail |
|-----------|--------|
| **Relationship** | Compliance authority for EU/EEA user data processing |
| **Key requirements** | NFR-009 (GDPR compliance), FR-F4-001 (data processing disclosure at signup), data deletion capability |
| **Engagement strategy** | No direct engagement. Compliance is managed through established GDPR principles mapped to NFR-009. Legal review of privacy policy and data processing disclosures recommended before beta launch. |

### S18 — Beta Community (Early Adopters)

| Attribute | Detail |
|-----------|--------|
| **Context** | Early signups and testers validating the product before public launch. Target: ≥ 50 beta signups in first week post-launch (Feature Roadmap PI-1 metric). |
| **Primary motivation** | Access to a new tool that solves a real problem; community influence on the product |
| **Engagement strategy** | Define beta onboarding success metrics. Collect structured feedback on UJ1 (time-to-first-app, friction points). Use beta feedback to calibrate dashboard UX and alert messaging before general availability. |

---

## RACI Matrix — Core Product Activities

**Roles:** R = Responsible, A = Accountable, C = Consulted, I = Informed

| Activity | S1/S2 Users | PM | PO | RTE | BA | SA | SEC | SD | UX | CS | A11Y | TL | Dev ART | Testing |
|----------|------------|----|----|-----|----|----|-----|----|----|----|------|----|---------|---------|
| Product vision definition | C | **A/R** | C | C | I | I | I | I | I | I | I | I | I | I |
| Requirements elicitation | C | C | C | I | **A/R** | C | C | I | I | I | I | I | I | I |
| Solution assessment & architecture | I | I | I | I | C | **A/R** | C | C | I | I | I | I | I | I |
| Threat modelling | I | I | I | I | C | C | **A/R** | C | I | I | I | I | I | I |
| API contracts & data model | I | I | I | I | C | C | C | **A/R** | I | I | I | I | I | I |
| UX design & flow | C | I | I | I | C | I | I | C | **A/R** | C | C | I | I | I |
| Content strategy | C | I | I | I | I | I | I | I | C | **A/R** | C | I | I | I |
| Accessibility audit | I | I | I | I | I | I | I | I | C | I | **A/R** | I | I | I |
| Sprint backlog & stories | I | C | **A/R** | I | C | C | I | I | I | I | I | I | I | I |
| Test contract authoring | I | I | C | I | C | I | C | C | I | I | I | C | I | **A/R** |
| Implementation (FE/BE/DBA/DevOps) | I | I | I | I | I | I | I | C | I | I | I | **C** | **A/R** | C |
| Technical leadership & merge | I | I | I | I | I | I | I | I | I | I | I | **A/R** | C | I |
| Beta feedback collection | **R** | A | C | I | I | I | I | I | C | C | I | I | I | C |
| PI planning coordination | I | **A** | C | **R** | I | I | I | I | I | I | I | I | I | I |
| Release readiness / go/no-go | C | **A** | **R** | C | I | I | I | I | I | I | I | I | I | I |

---

## Engagement Strategies Summary

| ID | Stakeholder | Strategy | Frequency | Channel |
|----|-------------|----------|-----------|---------|
| S1/S2 | End Users | User testing, beta feedback, UX walkthroughs | Per-sprint during beta | Product UX, feedback forms |
| S3 | Product Manager | Artifact review and gate evaluation | Per phase | Artifact filesystem, Azure Boards |
| S4 | Release Train Engineer | Risk and dependency review | PI planning, ART syncs | Risk register, PI objectives |
| S5 | Product Owner | Story decomposition review | Per sprint | Backlog, delegation briefs |
| S6 | System Architect | Requirements → architecture convergence checkpoint | P1 milestone | Architecture artifacts |
| S7 | Security Analyst | Security-adjacent requirement validation | P1 Step 2 | Threat model, security requirements |
| S8–S14 | Delivery ART | Artifact handoff at phase gates | Per phase | Artifact filesystem |
| S15 | VPS Providers | Provider documentation monitoring | PI boundaries | Published provider documentation |
| S16 | OSS Projects | Release monitoring for catalog freshness | Continuous | Upstream release channels |
| S17 | GDPR Regulators | Compliance via design (privacy-by-default) | Pre-launch | Legal review of privacy policy |
| S18 | Beta Community | Structured feedback collection on UJ1 | Beta phase | In-product feedback, outreach |

---

## Key Stakeholder Tensions

| Tension | Stakeholder A | Stakeholder B | Description | Resolution Approach |
|---------|--------------|--------------|-------------|---------------------|
| Simplicity vs. capability | S1 (novice UX) | S2 (power user) | Aspiring hosters need guardrails and guided flows; technical simplifiers want raw access and efficiency | Progressive disclosure: simple defaults with optional advanced paths. UX to arbitrate. |
| Data accessibility vs. sovereignty | S1/S2 (users want dashboard) | S17 (GDPR / SC5) | Users want rich metrics and insights; data sovereignty rules constrain what metadata can leave the server | Control plane receives only operational metrics (status, resource usage), never application data. Security Analyst and SA to validate the boundary. |
| Launch breadth vs. quality | S18 (beta wants many apps) | S4/RTE (scope protection) | Community pressure to have a large catalog at launch conflicts with the RTE's scope-protection mandate | Commit to ≥ 15 curated apps (SC3) and make catalog quality (not breadth) the launch signal. Treat community contributions as PI-3 scope. |
| Automation vs. control | S2 (power user wants control) | S1 (novice wants automation) | Technical users may want manual update/backup control; novices want "set and forget" | Default to automation with opt-in review stops. Each update flow offers a "Defer" path (PM-3). |

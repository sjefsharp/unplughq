---
artifact: feature-roadmap
produced-by: product-manager
project-slug: unplughq
work-item: epic-001-unplughq-platform
work-item-type: epic
workflow-tier: full
phase: P0
version: 1.0.0
status: approved
azure-devops-id: 169
review:
  reviewed-by: product-manager
  reviewed-date: 2026-03-13
consumed-by:
  - release-train-engineer
  - business-analyst
  - system-architect
  - product-owner
date: 2026-03-13
---

# Feature Roadmap — UnplugHQ

## Roadmap Format: Now-Next-Later

Priority framework: **WSJF (Weighted Shortest Job First)** — maximizing value delivery to early adopters while establishing the architectural foundation.

---

## 🟢 NOW — PI-1 (Launch MVP)

> Goal: A single user can connect a VPS, deploy their first self-hosted app, and see it running — all without touching a terminal.

### Feature 1: Server Connection & Provisioning
**Value:** Foundational — nothing works without server connectivity
**User outcome:** User connects their VPS to UnplugHQ through a visual guided flow
**Key capabilities:**
- Guided SSH key setup with visual instructions per major VPS provider
- Server validation (OS detection, resource check, connectivity test)
- Automated base provisioning (container runtime, reverse proxy, monitoring agent)
- Connection health indicator on dashboard

### Feature 2: Application Catalog & Deployment
**Value:** Core value proposition — the "app store" experience for self-hosting
**User outcome:** User browses curated apps and deploys them with contextual configuration
**Key capabilities:**
- Curated catalog of 15+ self-hostable applications with categories
- Per-app guided configuration (only relevant questions, sensible defaults)
- One-action deployment with progress visibility
- Automatic SSL certificate provisioning and domain routing
- Post-deployment health verification

### Feature 3: Dashboard & Health Monitoring
**Value:** Ongoing engagement — the daily check-in surface
**User outcome:** User sees at-a-glance health of server and all deployed applications
**Key capabilities:**
- Server resource overview (CPU, RAM, disk, network)
- Per-app status indicators (running, stopped, unhealthy, updating)
- Basic alerting (email notification when an app goes down or resources are critical)
- Application access links from dashboard

### Feature 4: User Identity & Access
**Value:** Security foundation — controls who can manage the server
**User outcome:** User signs up, authenticates, and manages their account securely
**Key capabilities:**
- Signup and authentication flow
- Account settings (email, notification preferences)
- Session management
- Password reset flow

---

## 🟡 NEXT — PI-2 (Operational Maturity)

> Goal: Self-hosted setups stay healthy over time without manual intervention.

### Feature 5: Automated Updates & Rollback
**Value:** Solves the #1 maintenance pain — "I set it up but it rotted"
**User outcome:** Apps stay updated automatically with zero-downtime and safety nets
**Key capabilities:**
- Update detection and changelog surfacing
- One-action or automatic update application
- Pre-update backup snapshot
- Automatic rollback on health check failure
- Update history and audit trail

### Feature 6: Backup Orchestration
**Value:** Data safety — the biggest anxiety for self-hosters
**User outcome:** User's application data is backed up on schedule with tested restore capability
**Key capabilities:**
- Scheduled backup configuration per app
- Backup to local server storage or user-configured external storage
- Backup integrity verification
- One-action restore from backup
- Backup status and history visibility

### Feature 7: Multi-Server Support
**Value:** Growth path for power users and teams
**User outcome:** Users manage applications across multiple servers from one dashboard
**Key capabilities:**
- Add additional servers with the same guided flow
- Per-server and cross-server dashboard views
- App deployment targeting (choose which server)
- Cross-server resource comparison

---

## 🔵 LATER — PI-3+ (Platform Expansion)

> Goal: Become the go-to management layer for self-hosted infrastructure.

### Feature 8: Team Access & Collaboration
**User outcome:** Small teams share server management with appropriate access controls
**Key capabilities:**
- Invite team members with role-based permissions
- Activity audit log
- Shared notification channels

### Feature 9: Advanced Monitoring & Analytics
**User outcome:** Deep visibility into application performance and resource trends
**Key capabilities:**
- Historical resource usage trends and capacity forecasting
- Per-app performance metrics
- Custom alert thresholds and escalation channels
- Uptime reporting

### Feature 10: Community App Contributions
**User outcome:** Users can create and share application definitions with the community
**Key capabilities:**
- App definition authoring format and validation
- Community catalog with review and rating
- Version management for community apps

### Feature 11: Migration Toolkit
**User outcome:** Users migrating between VPS providers or from SaaS can do so through UnplugHQ
**Key capabilities:**
- Server-to-server migration assistant
- SaaS-to-self-hosted migration guides with data import tooling
- Configuration export in standard formats

---

## PI-1 Feature Priority Matrix

| Feature | Business Value | Time Criticality | Risk Reduction | Job Size | WSJF Score | Priority |
|---------|---------------|------------------|----------------|----------|------------|----------|
| F1: Server Connection | 10 | 10 | 9 | 5 | 5.8 | 🥇 1st |
| F2: App Catalog & Deploy | 10 | 10 | 7 | 8 | 3.4 | 🥈 2nd |
| F4: User Identity | 7 | 9 | 8 | 3 | 8.0 | 🥇 1st (parallel) |
| F3: Dashboard & Monitoring | 8 | 7 | 5 | 5 | 4.0 | 🥉 3rd |

**Sequencing note:** F1 (Server Connection) and F4 (User Identity) can proceed in parallel as they have no mutual dependency. F2 (App Catalog) depends on F1. F3 (Dashboard) depends on F1 and F2. Feature decomposition into Azure Boards work items occurs at Gate 2 after SA architecture is established.

---

## Success Metrics per PI

### PI-1 (MVP)
- First-app deployment time < 15 minutes
- ≥ 15 apps in catalog
- Zero-terminal claim validated by UX audit
- ≥ 50 beta signups in first week post-launch

### PI-2 (Operational Maturity)  
- ≥ 98% update success rate
- Zero user-reported data loss events
- Multi-server adoption by ≥ 20% of active users

### PI-3+ (Platform Expansion)
- Team tier adoption
- Community app contributions > 10
- Net Promoter Score ≥ 50

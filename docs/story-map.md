---
artifact: story-map
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
  - testing
  - product-manager
date: 2026-03-16
---

# Story Map — UnplugHQ PI-2

## Reading Guide

- **Backbone (top row):** User activities — the major things users do with UnplugHQ
- **User Tasks (second row):** Specific tasks within each activity
- **Stories (rows below):** Stories delivering each task, ordered top-to-bottom by priority
- **Release Slices:** Horizontal cuts grouping stories into sprints
- ✅ = Delivered, 🔵 = Sprint 2 Active, 🐛 = Bug Fix

---

## Story Map

```
BACKBONE        │ Create Account    │ Connect Server       │ Deploy Apps          │ Monitor & Manage
(Activities)    │ & Authenticate    │ & Provision          │ from Catalog         │ Server Health
                │                   │                      │                      │
────────────────┼───────────────────┼──────────────────────┼──────────────────────┼──────────────────────
USER TASKS      │ Sign up           │ Enter server details │ Browse catalog       │ View dashboard
                │ Log in / Log out  │ Validate server      │ Configure app        │ Check app status
                │ Reset password    │ Provision server     │ Deploy with SSL      │ Receive alerts
                │ Manage settings   │ Name & view server   │ Verify deployment    │ Resolve issues
                │                   │                      │ Deploy more apps     │
════════════════╪═══════════════════╪══════════════════════╪══════════════════════╪══════════════════════
SPRINT 1 ✅     │                   │                      │                      │
(Foundation)    │ ✅ S-194 Register │ ✅ S-198 Connection  │                      │
 8 stories      │   AB#194 [5 SP]   │   Wizard             │                      │
 47 SP          │                   │   AB#198 [8 SP]      │                      │
 DELIVERED      │ ✅ S-195 Login/   │                      │                      │
                │   Logout          │ ✅ S-199 Validation  │                      │
                │   AB#195 [5 SP]   │   AB#199 [5 SP]      │                      │
                │                   │                      │                      │
                │ ✅ S-196 Password │ ✅ S-200 Provisioning│                      │
                │   Reset           │   AB#200 [13 SP]     │                      │
                │   AB#196 [3 SP]   │                      │                      │
                │                   │ ✅ S-201 Server Tile │                      │
                │ ✅ S-197 Account  │   AB#201 [5 SP]      │                      │
                │   Settings        │                      │                      │
                │   AB#197 [3 SP]   │                      │                      │
════════════════╪═══════════════════╪══════════════════════╪══════════════════════╪══════════════════════
SPRINT 2 🔵    │                   │                      │                      │
(Core Value)    │ 🐛 B-251 Focus   │ 🐛 B-262 Sudoers    │ 🔵 S-202 Catalog    │ 🔵 S-207 Dashboard
 8 stories      │   Mgmt [3 SP]     │   Fix [3 SP]         │   AB#202 [5 SP]      │   Overview
 5 bugs         │                   │                      │                      │   AB#207 [8 SP]
 71 SP          │                   │                      │ 🔵 S-203 Config     │
                │                   │                      │   Wizard             │ 🔵 S-208 Alert
                │                   │                      │   AB#203 [5 SP]      │   Notifications
                │                   │                      │                      │   AB#208 [8 SP]
                │                   │                      │ 🔵 S-204 Deployment │
                │                   │                      │   + SSL + Proxy      │ 🔵 S-209 Alert
                │                   │                      │   AB#204 [13 SP]     │   Management
                │                   │                      │                      │   AB#209 [5 SP]
                │                   │                      │ 🔵 S-205 Post-Deploy│
                │                   │                      │   Verification       │
                │                   │                      │   AB#205 [5 SP]      │
                │                   │                      │                      │
                │                   │                      │ 🔵 S-206 Multi-App  │
                │                   │                      │   Coexistence        │
                │                   │                      │   AB#206 [5 SP]      │
────────────────┼───────────────────┼──────────────────────┼──────────────────────┼──────────────────────
CROSS-CUTTING   │ 🐛 B-258 CSRF [5 SP]                    │                      │
BUGS (Sprint 2) │ 🐛 B-259 Audit Logging [3 SP]           │                      │
                │ 🐛 B-260 Secrets Rotation [3 SP]         │                      │
════════════════╧═══════════════════╧══════════════════════╧══════════════════════╧══════════════════════
```

## Dependency Flow

```
                Sprint 1 (Delivered ✅)                        Sprint 2 (Active 🔵)
    ┌──────────────────────────────────┐       ┌──────────────────────────────────────┐
    │                                  │       │                                      │
    │  S-194 ──► S-195 ──► S-196      │       │  S-202 ──► S-203 ──► S-204           │
    │  Register   Login     Reset     │       │  Catalog    Config    Deploy          │
    │              │         │         │       │                        │              │
    │              │    S-197 Settings │       │                   S-205 Verify        │
    │              │                   │       │                        │              │
    │              ▼                   │       │                   S-206 Multi-App     │
    │  S-198 ──► S-199 ──► S-200      │       │                                      │
    │  Wizard    Validate   Provision │       │               S-207 Dashboard         │
    │                         │        │       │               S-208 Alerts            │
    │                    S-201 Tile    │       │               S-209 Remediation       │
    │                                  │       │                                      │
    └──────────────────────────────────┘       │  Bugs (Week 1, no dependencies):     │
         ║                                     │    B-258 CSRF                        │
         ║ F4 + F1 delivered                   │    B-259 Audit Log                   │
         ║ Auth + Server foundations            │    B-260 Secrets Rotation            │
         ║                                     │    B-262 Sudoers                     │
         ╚═══════════════════►                 │    B-251 Focus Management            │
           Sprint 2 builds on Sprint 1         └──────────────────────────────────────┘
```

## User Journey Mapping

Each user journey (UJ) from the product vision maps to a horizontal walk across the story map:

| Journey | Walk-Through Stories | Sprint Coverage |
|---------|---------------------|-----------------|
| **UJ1** First-Time Setup | S-194 → S-195 → S-198 → S-199 → S-200 → S-202 → S-203 → S-204 → S-205 | S1 + S2 |
| **UJ2** Adding Second App | S-195 → S-202 → S-203 → S-204 → S-206 | S1 + S2 |
| **UJ4** Responding to Alert | S-195 → S-207 → S-208 → S-209 | S1 + S2 |

**UJ3** (Handling an Update) and **UJ5** (Migrating Away) are post-MVP scope.

## Release Slice Rationale

### Sprint 1 — "First Connection" ✅ Delivered
Proved the core hypothesis: a non-technical user can create an account and connect a VPS through a visual flow.
- Complete authentication lifecycle (register → login → reset → settings)
- Complete server connection lifecycle (wizard → validate → provision → dashboard tile)
- **E2E proof:** Register → Login → Add Server → See Server on Dashboard

### Sprint 2 — "First App Live" 🔵 Active
Delivers the "aha moment" and ongoing engagement surface. Resolves deferred PI-1 security/a11y bugs.
- Complete app lifecycle (browse → configure → deploy → verify → multi-app)
- Complete monitoring surface (dashboard overview → alerts → remediation)
- **E2E proof:** Browse Catalog → Configure App → Deploy → See Running App → Receive Health Alert
- **Bug resolution:** CSRF, audit logging, secrets rotation, sudoers, focus management

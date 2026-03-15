---
artifact: story-map
produced-by: product-owner
project-slug: unplughq
work-item: epic-001-unplughq-platform
work-item-type: epic
workflow-tier: full
phase: P3
version: 1.0.0
status: draft
azure-devops-id: 193
consumed-by:
  - scrum-master
  - tech-lead
  - testing
  - product-manager
date: 2026-03-15
---

# Story Map — UnplugHQ PI-1

## Reading Guide

- **Backbone (top row):** User activities — the major things users do with UnplugHQ
- **User Tasks (second row):** Specific tasks within each activity
- **Stories (rows below):** Stories delivering each task, ordered top-to-bottom by priority
- **Release Slices:** Horizontal cuts grouping stories into sprints

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
SPRINT 1        │                   │                      │                      │
(Foundation)    │ S-194 Register    │ S-198 Connection     │                      │
 8 stories      │   AB#194 [5 SP]   │   Wizard             │                      │
 47 SP          │                   │   AB#198 [8 SP]      │                      │
                │ S-195 Login/      │                      │                      │
                │   Logout          │ S-199 Validation     │                      │
                │   AB#195 [5 SP]   │   AB#199 [5 SP]      │                      │
                │                   │                      │                      │
                │ S-196 Password    │ S-200 Provisioning   │                      │
                │   Reset           │   AB#200 [13 SP]     │                      │
                │   AB#196 [3 SP]   │                      │                      │
                │                   │ S-201 Server Tile    │                      │
                │ S-197 Account     │   AB#201 [5 SP]      │                      │
                │   Settings        │                      │                      │
                │   AB#197 [3 SP]   │                      │                      │
════════════════╪═══════════════════╪══════════════════════╪══════════════════════╪══════════════════════
SPRINT 2        │                   │                      │                      │
(Core Value)    │                   │                      │ S-202 Catalog        │ S-207 Dashboard
 8 stories      │                   │                      │   AB#202 [5 SP]      │   Overview
 54 SP          │                   │                      │                      │   AB#207 [8 SP]
                │                   │                      │ S-203 Config         │
                │                   │                      │   Wizard             │ S-208 Alert
                │                   │                      │   AB#203 [5 SP]      │   Notifications
                │                   │                      │                      │   AB#208 [8 SP]
                │                   │                      │ S-204 Deployment     │
                │                   │                      │   + SSL + Proxy      │ S-209 Alert
                │                   │                      │   AB#204 [13 SP]     │   Management
                │                   │                      │                      │   AB#209 [5 SP]
                │                   │                      │ S-205 Post-Deploy    │
                │                   │                      │   Verification       │
                │                   │                      │   AB#205 [5 SP]      │
                │                   │                      │                      │
                │                   │                      │ S-206 Multi-App      │
                │                   │                      │   Coexistence        │
                │                   │                      │   AB#206 [5 SP]      │
════════════════╧═══════════════════╧══════════════════════╧══════════════════════╧══════════════════════
```

## Dependency Flow

```
                    Sprint 1                                    Sprint 2
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
    └──────────────────────────────────┘       └──────────────────────────────────────┘
         ║                                            ║
         ║ F4 + F1 deliver in parallel                ║ F2 + F3 deliver in parallel
         ║ Auth track + Server track                  ║ Catalog track + Dashboard track
```

## User Journey Mapping

Each user journey (UJ) from the product vision maps to a horizontal walk across the story map:

| Journey | Walk-Through Stories |
|---------|---------------------|
| **UJ1** First-Time Setup | S-194 → S-195 → S-198 → S-199 → S-200 → S-202 → S-203 → S-204 → S-205 |
| **UJ2** Adding Second App | S-195 → S-202 → S-203 → S-204 → S-206 |
| **UJ4** Responding to Alert | S-195 → S-207 → S-208 → S-209 |

**UJ3** (Handling an Update) and **UJ5** (Migrating Away) are PI-2 scope.

## Release Slice Rationale

### Sprint 1 — "First Connection"
Ship the minimum to prove the core hypothesis: a non-technical user can create an account and connect a VPS through a visual flow. This slice delivers:
- Complete authentication lifecycle (register → login → reset → settings)
- Complete server connection lifecycle (wizard → validate → provision → dashboard tile)
- **E2E proof:** Register → Login → Add Server → See Server on Dashboard

### Sprint 2 — "First App Live"
Ship the app deployment experience that delivers the "aha moment" and ongoing engagement surface. This slice delivers:
- Complete app lifecycle (browse → configure → deploy → verify → multi-app)
- Complete monitoring surface (dashboard overview → alerts → remediation)
- **E2E proof:** Browse Catalog → Configure App → Deploy → See Running App → Receive Health Alert

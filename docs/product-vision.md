---
artifact: product-vision
produced-by: product-manager
project-slug: unplughq
work-item: epic-001-unplughq-platform
work-item-type: epic
workflow-tier: full
phase: P0
version: 2.0.0
status: draft
azure-devops-id: 180
review:
  reviewed-by: product-manager
  reviewed-date: 2026-03-13
consumed-by:
  - release-train-engineer
  - business-analyst
  - system-architect
  - security-analyst
  - solution-designer
  - ux-designer
  - content-strategist
  - accessibility
  - product-owner
  - scrum-master
date: 2026-03-13
---

# Product Vision

## Vision Statement

**For** non-technical individuals and small teams who want to own their data and reduce SaaS subscription costs, **UnplugHQ is** a web-based control panel **that** enables anyone to deploy, manage, and maintain self-hosted applications on their own server — without terminal access or DevOps knowledge. **Unlike** existing self-hosting tools that require Docker command-line expertise and Linux system administration skills, **our product** provides a visual, guided experience that makes self-hosting as simple as installing an app on a phone.

## Problem Statement

The self-hosting movement is experiencing explosive growth driven by privacy concerns, subscription fatigue, and a desire for data sovereignty. However, a massive gap exists between the *desire* to self-host and the *ability* to self-host:

1. **Intimidating setup:** Current tools (Docker Compose, Portainer, Coolify, CapRover) still require terminal proficiency, DNS configuration knowledge, and debugging skills that 80% of potential self-hosters lack.
2. **Maintenance burden:** After initial setup, users face ongoing update management, SSL certificate renewal, backup configuration, and security patching — invisible work that causes self-hosted setups to "rot" over time.
3. **Fragmented guidance:** Knowledge is scattered across outdated Reddit threads, YouTube videos, and GitHub READMEs with conflicting instructions. Each self-hosted app has its own setup ritual.
4. **Risk anxiety:** Non-technical users fear "breaking something" — losing data, exposing their server, or creating a misconfiguration they cannot diagnose. This fear prevents adoption.

## Target Audience

### Primary: The Aspiring Self-Hoster

- **Demographics:** 25-45, digitally literate but not a developer or sysadmin
- **Context:** Freelancers, small business owners, privacy-conscious individuals, digital creators
- **Current behavior:** Pays €100-300/month across SaaS tools (cloud storage, email, analytics, note-taking, project management). Knows self-hosting *exists* and wants to try it. Follows r/selfhosted but is intimidated by the terminal screenshots.
- **Core motivation:** Data ownership, cost reduction, independence from vendor lock-in
- **Key frustration:** "I want to self-host but I don't have time to become a Linux sysadmin"

### Secondary: The Technical User Seeking Simplification

- **Demographics:** Developers and tech-savvy users who *can* self-host but find the maintenance overhead tedious
- **Context:** Already runs 2-5 self-hosted apps, tired of manually managing updates and monitoring
- **Core motivation:** Consolidate management, automated maintenance, reduce time spent on ops
- **Key frustration:** "I can set it up, but I don't want to babysit 10 Docker containers every weekend"

## Desired Outcomes

### O1 — Zero-Terminal Self-Hosting
A user with no terminal experience can go from "I want to self-host Nextcloud" to a running, secured, accessible Nextcloud instance — without ever opening a terminal.

### O2 — Automated Maintenance
Once deployed, applications stay updated, backed up, and monitored without user intervention. The system handles SSL renewal, security patches, and container health checks autonomously.

### O3 — Guided Server Connection
A user can connect any VPS provider (popular hosting providers) to UnplugHQ using a visual guided flow — entering only the information they already have (IP address, login credentials).

### O4 — Application Marketplace
Users browse a curated catalog of self-hostable applications (file storage, analytics, email, CMS, password management, photo storage) and deploy them with contextual configuration — the system asks only the questions that matter for each app.

### O5 — Health Visibility
Users see at-a-glance whether their server and applications are healthy, receive proactive alerts when something needs attention, and get guided remediation when issues occur.

### O6 — Safe Operations
Every destructive operation (updates, removals, configuration changes) includes preview, confirmation, and automatic rollback capability. Users feel safe experimenting because they cannot permanently break their setup.

## User Journeys

### UJ1 — First-Time Setup (The "Aha" Moment)
```
User signs up → Guided server connection flow → Enters VPS IP + SSH key 
→ System validates connection and reports server specs → User browses app catalog 
→ Selects "Nextcloud" → Answers 3 config questions (domain, admin email, storage size) 
→ System deploys with SSL, backups, monitoring → User receives URL to their own Nextcloud
→ "I'm self-hosting. I actually did this." ✨
```
**Success metric:** Time from signup to first running app < 15 minutes

### UJ2 — Adding a Second App
```
User opens dashboard → Sees healthy Nextcloud tile → Clicks "Add App" 
→ Browses catalog → Selects "Plausible Analytics" → Configures domain 
→ System detects existing reverse proxy config and integrates seamlessly
→ Both apps running, both monitored
```
**Success metric:** Second app deployment < 5 minutes

### UJ3 — Handling an Update
```
System detects Nextcloud update available → Sends notification to user 
→ User sees "Update available" badge on dashboard → Clicks "Review Update" 
→ Sees changelog summary and risk assessment → Clicks "Update" 
→ System creates automatic backup → Applies update → Verifies app health 
→ If health check fails: automatic rollback + notification
```
**Success metric:** Zero user-caused data loss from updates

### UJ4 — Responding to an Alert
```
User receives alert: "Disk usage at 85% on your server" 
→ Opens dashboard → Sees disk usage breakdown by app 
→ System suggests: "Nextcloud is using 60GB. You can expand storage or clean old files." 
→ User follows guided action
```
**Success metric:** Alert-to-resolution time < 10 minutes for guided issues

### UJ5 — Migrating Away (Trust Building)
```
User decides to stop using UnplugHQ → Exports configuration as standard formats 
→ Apps continue running on their server without UnplugHQ 
→ No vendor lock-in, no data hostage
```
**Success metric:** Zero data loss during export. Apps operational post-disconnect.

## Success Criteria

| ID | Criterion | Target | Measurement |
|----|-----------|--------|-------------|
| SC1 | First-app deployment time | < 15 minutes from signup | Timed user journey analytics |
| SC2 | Zero-terminal achievement | 100% of core flows require zero CLI | UX audit of all user-facing flows |
| SC3 | App catalog breadth | ≥ 15 curated self-hostable apps at launch | Catalog count |
| SC4 | Update success rate | ≥ 98% of auto-updates succeed without rollback | Update telemetry |
| SC5 | Data sovereignty | Zero user data stored on UnplugHQ servers (control plane only) | Architecture audit — all user data on user's server |
| SC6 | Export completeness | User can disconnect UnplugHQ and apps keep running | Tested migration flow |
| SC7 | Uptime monitoring accuracy | ≥ 99.5% accuracy in health status reporting | Alert accuracy metrics |
| SC8 | User retention | ≥ 70% monthly active retention after first deployment | Cohort analytics |

## Functional Signals

| Signal | Architectural Implication |
|--------|--------------------------|
| "Deploy apps to remote server" | Remote server management, SSH connectivity, container orchestration |
| "App catalog", "marketplace" | Curated application definitions, versioning, dependency management |
| "Automated updates", "rollback" | Update orchestration, backup automation, health checks, state management |
| "Dashboard", "monitoring" | Real-time data collection, metrics aggregation, alerting |
| "SSL", "domain configuration" | Reverse proxy management, certificate lifecycle, DNS integration |
| "Backup", "export" | Backup scheduling, storage management, format standardization |
| "User accounts", "signup" | Authentication, session management, authorization |
| "Notifications", "alerts" | Event processing, multi-channel notification delivery |
| "Guided setup", "wizard" | Multi-step state management, validation, contextual help |

## User-Stated Preferences

The user described UnplugHQ as an app where users "connect any VPS via SSH key" and the platform "does the rest" — emphasizing the Vercel-like simplicity for self-hosted software. The user mentioned PWA capability as desirable. These are recorded as user preferences for the SA to evaluate, not hard constraints.

## Constraints

- **Data sovereignty is non-negotiable.** UnplugHQ must never store user application data on its own infrastructure. The control plane coordinates; the user's server hosts all application data.
- **No vendor lock-in.** Users must be able to disconnect from UnplugHQ and continue running their self-hosted apps. UnplugHQ adds a management layer — it must never become a dependency.
- **Accessible globally.** The platform serves a global audience with varying internet speeds and server locations. Performance must not assume high-bandwidth connections.

## Pricing Model (Business Context)

| Tier | Target | Positioning |
|------|--------|-------------|
| Free | Trial + hobby | Limited apps (3), single server, community support — to prove value |
| Pro (~€9/mo) | Individual power user | Unlimited apps, auto-updates, monitoring, priority support |
| Team (~€29/mo) | Small teams | Multi-server, team access, scheduled backups, audit log |

Revenue model: Recurring subscription for the management platform. Users pay their own VPS provider separately. UnplugHQ's value proposition is the management intelligence, not the compute.

## Creative Direction

### Brand Personality Attributes
**Empowering, approachable, trustworthy, resourceful, calm**

UnplugHQ should feel like a competent friend who happens to be a sysadmin — someone who explains things clearly, never condescends, and makes you feel capable rather than dependent. The product personality combines the reliability of infrastructure tooling with the warmth of consumer software.

### Emotional Goals

| Journey Moment | Desired Emotion |
|----------------|----------------|
| First visit / landing page | "This looks like something I can actually use" (approachable confidence) |
| Server connection | "That was surprisingly painless" (empowerment) |
| First app deployed | "I'm actually self-hosting — I own this" (pride, independence) |
| Dashboard check-in | "Everything's fine, I don't need to worry" (calm assurance) |
| Update/alert handling | "The system has my back" (trust, safety) |
| Pricing page | "This is worth way less than what I pay in SaaS subscriptions" (obvious value) |

### Aesthetic Reference Category
**"Premium indie tool"** — the visual confidence of a well-funded developer tool (think Linear, Vercel, Railway) combined with the warmth and accessibility of a consumer product (think Notion, Framer). Not enterprise gray, not startup neon. A mature product that respects its users' intelligence while being visually delightful. Dark mode as primary, with light mode option. Clean data visualization for server/app health.

## Out of Scope (Explicit Exclusions)

- **Not a VPS provider.** UnplugHQ does not sell or resell compute. Users bring their own server.
- **Not a container registry.** UnplugHQ curates apps but does not host container images.
- **Not a backup storage provider.** Backup *orchestration* is in scope; backup *storage* is on the user's server or their configured external storage.
- **Not a CDN or edge network.** Apps run on the user's single server.
- **Not a team collaboration platform.** Team features are limited to shared server management, not general collaboration.

---

## PI-2 Addendum — Sprint 2 Scope

### PI-2 Focus

PI-2 delivers the remaining MVP capabilities: **Application Catalog & Deployment** (Feature 2) and **Dashboard & Health Monitoring** (Feature 3). These map to outcomes O1 (Zero-Terminal Self-Hosting), O4 (Application Marketplace), and O5 (Health Visibility).

### PI-2 Delivery Goals

1. **Application catalog browsing** — Users browse curated self-hostable apps with categories, descriptions, and resource requirements
2. **Guided app configuration** — Per-app contextual configuration with sensible defaults (only relevant questions asked)
3. **One-action deployment with progress** — Users deploy apps with real-time progress visibility (building → deploying → health check → ready)
4. **Post-deployment verification** — System verifies deployed app is accessible and healthy before marking complete
5. **Multi-app coexistence** — Multiple apps running on same server without conflicts (port management, resource allocation, shared reverse proxy)
6. **Dashboard overview** — At-a-glance view of server health (CPU, RAM, disk) and all deployed app statuses
7. **Health alert notifications** — Proactive alerts when apps go unhealthy or server resources are critical
8. **Alert management and guided remediation** — Users can acknowledge, investigate, and resolve alerts with system guidance

### PI-2 Deferred Bug Fixes

These PI-1 security and accessibility findings must be addressed in PI-2:
- CSRF token validation (HIGH)
- Input sanitization for server connection strings (HIGH)
- Secrets rotation mechanism (HIGH)
- Audit logging for privileged operations (HIGH)
- Focus management on route transitions (MEDIUM)

### PI-2 Architecture Continuation

PI-2 extends the architecture established in PI-1. The SA should evaluate "Extend" disposition (not "New Build"). Key architectural decisions carrying forward: tRPC for API layer, BullMQ for async job processing, Docker container orchestration on user's VPS, real-time health monitoring via server agent.

### PI-2 Success Criteria

| ID | Criterion | Target |
|----|-----------|--------|
| SC-PI2-1 | App deployment from catalog to running | < 5 minutes per app |
| SC-PI2-2 | Dashboard load time | < 2 seconds for overview with 5+ apps |
| SC-PI2-3 | Alert delivery latency | < 60 seconds from event to notification |
| SC-PI2-4 | Multi-app stability | 5+ apps coexisting without resource conflicts |
| SC-PI2-5 | Deferred bugs resolved | All 5 PI-1 deferred bugs fixed and verified |

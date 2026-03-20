---
artifact: content-hierarchy
produced-by: content-strategist
project-slug: unplughq
work-item: task-282-cs-pi2-content-strategy
work-item-type: task
parent-work-item: epic-001-unplughq-platform
workflow-tier: full
phase: P2
version: 2.0.0
status: draft
consumed-by:
  - ux-designer
  - frontend-developer
date: 2026-03-16
azure-devops-id: 282
---

# Content Hierarchy

This hierarchy structures the information architecture from a user mindset: starting broad (marketing), moving to commitment (onboarding), diving into regular usage (dashboard), and exploring deeper capabilities. PI-2 additions are marked with the relevant story reference.

## 1. Public Facing (Marketing & Auth)
- **H1:** Outcome (e.g., "Self-host without the headache")
  - **H2:** How it works (Server connection → Deploy → Monitor → Manage)
  - **H2:** Value Pillars (Data sovereignty, Automated maintenance, Health visibility)
  - **H3:** Application Catalog Preview (What you can run)
  - **H3:** Pricing & Tiers
- **Authentication Pages:**
  - Sign up / Log in
  - Password recovery

## 2. Onboarding Flow
- **H1:** Connect your server
  - **H2:** Server details (IP, Port)
  - **H2:** SSH Instructions (Provider tailored tabs)
- **H1:** Server validation
  - **H2:** Capabilities check (OS, CPU, RAM)

## 3. Main Dashboard (Authenticated) — (AB#207)
- **H1:** Your server at a glance
  - **H2:** Active Alerts (Conditionally visible; see §6 below) — (AB#208)
    - **H3:** Alert detail — expandable panel with metric values and threshold
    - **H3:** Guided remediation steps — (AB#209)
  - **H2:** Server Health Gauges (CPU, Memory, Storage, Network) — (AB#207)
    - Color-coded: green (<70%), amber (70–89%), red (≥90%)
  - **H2:** Deployed Applications — (AB#207)
    - **H3:** App Tile: [App Name] — [Status Badge] — [Access Link]
    - **H3:** Per-app resource usage (CPU, Memory, Storage) — (AB#206)
  - **H2:** Stale data indicator (when metrics are >120s old) — (AB#207)

## 4. Application Catalog — (AB#202)
- **H1:** Browse apps for your server
  - **H2:** Search bar (name/description search) — (AB#202)
  - **H2:** Category filter (File Storage, Analytics, CMS, Password Management, Photo Storage, Email, Communication, Productivity) — (AB#202)
  - **H2:** App cards grid
    - **H3:** App Card: name, short description, category badge, requirements summary
  - **H2:** App Detail Page — (AB#202)
    - **H3:** Full description (what it does, who it's for, what it replaces)
    - **H3:** Resource requirements (human-friendly units)
    - **H3:** Upstream open-source project link
    - **H3:** Version info
    - **H3:** Deploy CTA

## 5. App Configuration & Deployment — (AB#203, AB#204, AB#205)
- **H1:** Set up [App Name] — (AB#203)
  - **H2:** Server selection (multi-server only) — (AB#203)
  - **H2:** Configuration fields (Domain, Admin email, Storage, app-specific) — (AB#203)
    - **H3:** Field help text (non-technical explanations)
    - **H3:** Defaults banner
    - **H3:** Resource warning (if insufficient capacity)
  - **H2:** Configuration summary — (AB#203)
    - **H3:** Per-section edit-back links
    - **H3:** Deploy CTA
- **H1:** Deploying [App Name] to [Server Name] — (AB#204)
  - **H2:** Progress phases (Preparing → Downloading → Configuring → Securing → Starting → Running) — (AB#204)
    - **H3:** Phase label + plain-language description
    - **H3:** Background navigation hint
    - **H3:** DNS warning (if applicable)
  - **H2:** Deployment result — (AB#204, AB#205)
    - **H3:** Success: access link + verification confirmation — (AB#205)
    - **H3:** Failure: reason + cleanup assurance + guided next steps — (AB#205)

## 6. Health Alerts & Remediation — (AB#208, AB#209)
- **H1:** Active alerts
  - **H2:** Alert list (sorted by severity, then timestamp) — (AB#208)
    - **H3:** Alert row: severity badge, type, affected resource, timestamp
  - **H2:** Alert detail (expandable) — (AB#208)
    - **H3:** Current metric vs. threshold
    - **H3:** Affected server/app
    - **H3:** Acknowledge / Dismiss actions
  - **H2:** Guided remediation — (AB#209)
    - **H3:** Disk critical: per-app storage breakdown + cleanup steps
    - **H3:** CPU critical: per-app CPU breakdown + stop/upgrade guidance
    - **H3:** RAM critical: per-app memory breakdown + stop/upgrade guidance
    - **H3:** App unavailable: one-click restart + DNS check + resource review
  - **H2:** Alert email notifications — (AB#208)
    - **H3:** Email: subject, body (cause → severity → action → link), unsubscribe link

## 7. Multi-App Management — (AB#206)
- **H1:** [N] apps running on [Server Name]
  - **H2:** Per-app resource breakdown (CPU, Memory, Storage per app) — (AB#206)
  - **H2:** Add another app CTA — (AB#206)
  - **H2:** Non-disruptive deployment assurance banner — (AB#206)
  - **H2:** Resource capacity warning (80% threshold) — (AB#206)

## 8. Account & Settings
- **H1:** Account settings
  - **H2:** Profile (Name, Email)
  - **H2:** Preferences (Notification toggles — includes alert email opt-out)
  - **H2:** Danger Zone (Account deletion)

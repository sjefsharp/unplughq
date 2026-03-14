---
artifact: content-hierarchy
produced-by: content-strategist
project-slug: unplughq
work-item: task-cs-messaging-framework
work-item-type: task
parent-work-item: epic-001-unplughq-platform
workflow-tier: full
phase: P2
version: 1.0.0
status: draft
consumed-by:
  - ux-designer
  - frontend-developer
date: 2026-03-14
---

# Content Hierarchy

This hierarchy structures the information architecture from a user mindset: starting broad (marketing), moving to commitment (onboarding), diving into regular usage (dashboard), and exploring deeper capabilities.

## 1. Public Facing (Marketing & Auth)
- **H1:** Outcome (e.g., "Self-host without the headache")
  - **H2:** How it works (Server connection -> Deploy -> Manage)
  - **H2:** Value Pillars (Data sovereignty, Automated maintenance)
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

## 3. Main Dashboard (Authenticated)
- **H1:** System Overview
  - **H2:** Active Alerts (Conditionally visible)
    - **H3:** Remediation steps
  - **H2:** Server Health (CPU, RAM, Disk, Network)
  - **H2:** Deployed Applications
    - **H3:** App Status & Link

## 4. Application Catalog
- **H1:** App Catalog
  - **H2:** Categories (File Storage, Analytics, CMS, etc.)
    - **H3:** App Detail Card (Description, Requirements, Upstream link)
- **H1:** Deploy [App Name]
  - **H2:** Configuration (Domain, Admin Email)
  - **H2:** Progress & Verification

## 5. Account & Settings
- **H1:** Account settings
  - **H2:** Profile (Name, Email)
  - **H2:** Preferences (Notification toggles)
  - **H2:** Danger Zone (Account deletion)

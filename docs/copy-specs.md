---
artifact: copy-specs
produced-by: content-strategist
project-slug: unplughq
work-item: task-cs-messaging-framework
work-item-type: task
parent-work-item: epic-001-unplughq-platform
workflow-tier: full
phase: P2
version: 1.0.0
status: approved
consumed-by:
  - ux-designer
  - frontend-developer
date: 2026-03-14
---

# Microcopy Specifications

## Exception Decisions: Emoji Policy
- **No emojis** are permitted as visual decoration, status indicators, or bullet points across the UnplugHQ UI. This aligns with Design Token Standards and reinforces our calm, premium indie tool aesthetic.

## 1. Onboarding & Connection Flows

| Component | Element | Copy Text | Tone | Max Length | Notes |
|-----------|---------|-----------|------|------------|-------|
| Hero | Headline | Connect your server | Welcoming | 8 words | Outcome focused |
| Hero | Subheadline | Enter your IP address and SSH key to begin provisioning. | Instructive | 20 words | No fluff |
| Button | CTA | Connect server | Active | 3 words | |
| Loading | State | Validating credentials and checking server resources. | Calm | 15 words | Transparent progress |
| Error | Toast | Port 22 unreachable. Check your firewall rules and try again. | Recovery | 15 words | Actionable, no blame |

## 2. App Catalog & Deployment

| Component | Element | Copy Text | Tone | Max Length | Notes |
|-----------|---------|-----------|------|------------|-------|
| Hero | Headline | Browse self-hosted apps | Exploratory | 8 words | |
| Feature | Subheadline | Choose an application to install on your connected server. | Instructive | 20 words | |
| Button | CTA | Deploy application | Active | 3 words | |
| Loading | State | Securing domain and starting application container. | Transparent| 15 words | Explain the magic |
| Success | Message | Nextcloud is running. You are officially self-hosting! | Empowering | 12 words | Micro-delight |

## 3. Dashboard, Health & Alerts

| Component | Element | Copy Text | Tone | Max Length | Notes |
|-----------|---------|-----------|------|------------|-------|
| Empty | State | No apps running yet. Deploy your first application. | Encouraging| 20 words | Guides to first action |
| Alert | Title | High disk usage | Clear | 5 words | |
| Alert | Body | Disk usage reached 85%. Nextcloud consumes 60GB. | Factual | 15 words | |
| Button | Recover CTA | Review storage | Helpful | 3 words | |
| Success | Update Text | Update applied safely. Nextcloud is back online. | Reassuring | 12 words | Celebrate maintenance |

## 4. Account Management

| Component | Element | Copy Text | Tone | Max Length | Notes |
|-----------|---------|-----------|------|------------|-------|
| Profile | Headline | Account settings | Standard | 5 words | |
| Form | Label | Notifications | Standard | 3 words | |
| Tooltip | Info | Receive emails when apps go offline. | Helpful | 15 words | |
| Action | Delete | Close account | Serious | 3 words | No guilt-tripping |

## Content Density Ceiling Checks

- **Headlines:** ≤ 8 words ✓
- **Subheadlines:** ≤ 20 words ✓
- **Error Messages:** ≤ 15 words ✓
- **Empty States:** ≤ 20 words ✓
- **Buttons / CTAs:** ≤ 3 words ✓
- **Tooltips:** ≤ 15 words ✓

---
artifact: release-notes-sprint2
produced-by: product-manager
project-slug: unplughq
work-item: epic-001-unplughq-platform
work-item-type: epic
parent-work-item: epic-001-unplughq-platform
workflow-tier: full
phase: P8
version: 2.0.0
status: draft
consumed-by:
  - stakeholders
date: 2026-03-18
azure-devops-id: 180
---

# UnplugHQ v2.0.0 — Sprint 2 Release Notes

**Release Date:** 2026-03-18
**PI:** 2 | **Sprint:** 2

---

## What's New

### One-Click App Marketplace

Deploy popular self-hosted applications to your servers with a guided wizard. Browse a curated catalog of 18 apps across 9 categories including databases, CMS platforms, analytics, and developer tools.

- **App Catalog** — Search, filter by category, and view detailed app information including resource requirements, supported architectures, and configuration options
- **Deployment Wizard** — Step-by-step configuration with validation, resource checking, and domain assignment. Real-time deployment progress tracking via server-sent events
- **Deployment Management** — Monitor running deployments, view logs, redeploy, and manage application lifecycle from your dashboard

### Monitoring & Alerts

Keep your infrastructure healthy with proactive monitoring and configurable alert rules.

- **Resource Dashboard** — CPU, memory, disk, and per-container metrics displayed in real-time with visual gauges and trend indicators
- **Alert Rules** — Configure threshold-based alerts for any metric with customizable severity levels (info, warning, critical)
- **Email Notifications** — Receive alert notifications via email with HTML-formatted summaries. Dead-letter queue ensures no alerts are silently dropped
- **Alert Management** — Acknowledge, dismiss, or investigate alerts from a dedicated management interface with filtering and search

### Dashboard Enhancements

- App status badges showing deployment health at a glance
- Mini resource bars on server cards for quick infrastructure overview
- Notification bell with unread alert count

---

## Security Improvements

- **CSRF Protection** — Double-submit cookie pattern (`__Host-csrf`) on all mutating API endpoints
- **Audit Logging** — All destructive operations now recorded with outcome, duration, IP, and user-agent
- **SSH Key Rotation** — Upgraded to Ed25519 keypair generation with server-side public key deployment and atomic rollback
- **Config Injection Prevention** — Deployment configuration keys validated against strict allowlist; dangerous environment variables (NODE_OPTIONS, LD_PRELOAD, PATH) blocked
- **Container Hardening** — All containers now run with `--security-opt=no-new-privileges`; monitoring agent additionally uses `--read-only`, `--cap-drop=ALL`
- **Sudoers Hardening** — Provisioning script uses explicit package allowlist instead of wildcard

---

## Accessibility Improvements

- **Live Announcements** — Deployment progress phases and new alerts announced to screen readers via `aria-live` regions (WCAG 4.1.3 AA)
- **Route Announcer** — Global component announces page navigation for screen reader users
- **Focus Management** — Route-level focus management on navigation with `useFocusManagement` hook

---

## Bug Fixes

| ID | Description |
| --- | --- |
| B-258 | CSRF tokens now enforced on all mutating endpoints |
| B-259 | Audit log entries created for destructive operations |
| B-260 | SSH key rotation generates valid Ed25519 keypairs and deploys to server |
| B-262 | Sudoers file uses explicit package list instead of wildcard |
| B-251 | Focus management added for route-level navigation (wizard/deploy partial) |

---

## Known Issues

| ID | Description | Severity | Target |
| --- | --- | --- | --- |
| AB#311 | Input border contrast ratio below 3:1 (CF-02) | Serious | PI-3 Sprint 1 |
| AB#312 | Config wizard step transitions don't manage focus | Serious | PI-3 Sprint 1 |
| AB#300 | Auth lockout test flaky under coverage instrumentation | Medium | PI-3 Sprint 1 |
| AB#301 | Duplicate-email timing test threshold too tight | Medium | PI-3 Sprint 1 |

---

## Technical Details

- **Tests:** 542 passing (33 test files) — 140% growth from Sprint 1
- **Build:** Next.js 15 production build, 17 pages, 23 routes
- **Bundle:** 102 kB shared First Load JS, 144 kB max page
- **Dependencies:** No new critical/high vulnerabilities

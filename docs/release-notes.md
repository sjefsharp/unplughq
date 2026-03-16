---
artifact: release-notes
produced-by: product-manager
project-slug: unplughq
work-item: epic-001-unplughq-platform
work-item-type: epic
workflow-tier: full
phase: P8
version: 1.0.0
status: draft
azure-devops-id: 180
consumed-by:
  - product-owner
  - release-train-engineer
date: 2026-03-16
---

# UnplugHQ v0.1.0 — Sprint 1 Release Notes

## Overview

First release of the UnplugHQ self-hosting management platform. This sprint delivers the foundational user experience: secure authentication, server connection, and automated provisioning.

## What's New

### User Identity & Access (Feature 4)

- **Registration** — Create an account with email and password. Passwords hashed with Argon2id (64MB memory, 3 iterations). Account lockout after 10 failed attempts.
- **Login / Logout** — Secure session-based authentication with Auth.js v5. HttpOnly, SameSite cookies. Database-backed sessions with server-side invalidation.
- **Password Reset** — Request reset via email, set new password with time-limited token. All existing sessions invalidated on password change.
- **Account Settings** — Update display name, email, and notification preferences.

### Server Connection & Provisioning (Feature 1)

- **3-Step Connection Wizard** — Guided flow: enter credentials → validate server → provision automatically.
- **Server Validation** — Detects OS, CPU, RAM, and disk. Checks compatibility requirements before provisioning.
- **Automated Provisioning** — Sets up Docker, Caddy, monitoring agent, and firewall. Real-time progress via Server-Sent Events.
- **Dashboard Presence** — Connected servers appear on the dashboard with status indicators and quick-action menus.

## Security

- AES-256-GCM encryption for SSH keys at rest with per-tenant key derivation
- Parameterized SSH command templates (no string concatenation)
- Tenant isolation at the ORM layer — all queries scoped by authenticated user
- Zod validation on all API boundaries
- Content Security Policy, HSTS, and security headers configured
- Rate limiting on authentication endpoints (10 attempts / 5 minutes)

## Known Issues

- Global API rate limiting not yet enabled (Sprint 2)
- Audit logging for destructive operations (Sprint 2)
- Sidebar dismiss via Escape key (Sprint 2)

## Technical Details

- **Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, tRPC, Drizzle ORM, PostgreSQL 17, Redis/Valkey, Docker
- **Tests:** 226 passing (unit + integration)
- **Build:** TypeScript strict mode, zero lint errors
- **Deployment:** Docker Compose with Caddy reverse proxy, GitHub Actions CD pipeline

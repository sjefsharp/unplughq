---
artifact: fe-sprint2-implementation
produced-by: frontend-developer
project-slug: unplughq
work-item: task-296-fe-sprint2-implementation
work-item-type: task
parent-work-item: azure-180
workflow-tier: full
phase: P4
version: 1.0.0
status: draft
consumed-by:
  - tech-lead
  - testing
  - product-owner
date: 2026-03-18
azure-devops-id: 296
review:
  reviewed-by:
  reviewed-date:
---

# Sprint 2 Frontend Implementation

## Scope Delivered

This implementation resumes the interrupted Sprint 2 frontend work for the authenticated UnplugHQ experience. The branch now includes the Marketplace catalog and detail views, deployment configuration and summary flows, deployment progress and post-deployment verification UI, dashboard resource gauges and multi-app tiles, alert list and remediation screens, and the route-change accessibility fix.

## Key UI Outcomes

### Focus Management and Announcements

The root app layout now wraps authenticated content with route-change focus handling and a screen-reader announcement region. Route transitions focus the primary heading or the main landmark, and notification surfaces return focus to the triggering control when they close.

### Marketplace and Deployment Flow

The Marketplace supports category filtering, deferred search, catalog detail pages, and deployment gating based on server availability. The configuration wizard persists state across review/edit loops, preloads schema defaults, applies field-level validation for the domain step, and preserves configuration through the summary screen into deployment progress.

### Real-Time Dashboard and Alerts

The dashboard renders multi-app status cards, resource gauges, stale-data handling, and alert banners with SSE updates plus polling fallback. Alerts now support active and recent states, local acknowledge and dismiss actions, remediation entry points, severity badges, and notification-bell updates.

### Typed Preview Data Bridge

The backend contract layer for Sprint 2 is still partially stubbed on this branch. To keep the frontend verifiable without raw fetch calls or untyped mocks, the tRPC routers now return typed preview data that conforms to the published API schemas. This keeps the UI aligned with the contract surface while backend implementation continues.

## Files Added or Extended

The implementation adds or extends Sprint 2 pages under `code/src/app/(authenticated)/marketplace`, `code/src/app/(authenticated)/deploy`, and `code/src/app/(authenticated)/alerts`, plus shared components for resource gauges, status badges, severity badges, notifications, and route announcements.

## Verification

TypeScript verification passes with `pnpm typecheck`.

Lint verification passes with `pnpm lint`.

## Risks and Follow-Up

The typed preview data is intentionally temporary and should be replaced by the integrated backend router implementations when the BE branch lands. The UI already consumes the contract through typed tRPC procedures, so replacing preview data should require minimal frontend changes.

## Research Sources

- `docs/delegation-briefs-p4.md`
- `docs/wireframes.md`
- `docs/design-system.md`
- `docs/copy-specs.md`
- `docs/accessibility-guidelines.md`
- `docs/interaction-patterns.md`
- `docs/api-contracts.md`
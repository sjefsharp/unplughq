---
artifact: fe-dashboard
produced-by: frontend-developer
project-slug: unplughq
work-item: task-238-fe-dashboard
work-item-type: task
parent-work-item: epic-001-unplughq-platform
workflow-tier: full
phase: P4
version: 1.0.0
status: approved
azure-devops-id: 238
---

# FE Dashboard Shell & Server Tile

## Deliverables

### Authenticated Layout (`(authenticated)/layout.tsx`)
AppShell wrapper with sidebar + top bar for all protected routes.

### Dashboard Page (`/dashboard`)
- **Server status bar**: StatusIndicator + IP + resource percentages (CPU/RAM/Disk) + Restart button
- **App grid**: `grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))` with skeleton placeholders (populated in Sprint 2)
- **Empty state**: "No apps running yet. Deploy your first application." with CTA to /welcome

### Copy
All microcopy from copy-specs.md §3 used verbatim:
- Empty state: "No apps running yet. Deploy your first application."
- Dashboard heading: "Dashboard"

---
artifact: fe-layout-shell
produced-by: frontend-developer
project-slug: unplughq
work-item: task-235-fe-layout-shell-shared-components
work-item-type: task
parent-work-item: epic-001-unplughq-platform
workflow-tier: full
phase: P4
version: 1.0.0
status: approved
azure-devops-id: 235
---

# FE Layout Shell & Shared UI Components

## Deliverables

### Layout Shell
- **Sidebar** (`src/components/layout/sidebar.tsx`): 260px fixed, collapses to hamburger <1024px, nav items (Dashboard, Marketplace, Settings), server status with PulseRing
- **TopBar** (`src/components/layout/top-bar.tsx`): Breadcrumbs, dark mode toggle (Sun/Moon), notifications bell, user avatar
- **AppShell** (`src/components/layout/app-shell.tsx`): Combines Sidebar + TopBar + main content area (max-w-1200px)

### Shared UI Components (15 shadcn/ui primitives)
Button, Input, Label, Card, Dialog, Form, Toast/Toaster, Skeleton, Textarea, RadioGroup, Separator, Progress, Switch

### Custom Components
- **PulseRing** (`src/components/pulse-ring.tsx`): 4 statuses (healthy/deploying/attention/offline), respects prefers-reduced-motion
- **StatusIndicator** (`src/components/status-indicator.tsx`): Color + text label (WCAG 1.4.1)
- **SkipToContent** (`src/components/skip-to-content.tsx`): Skip navigation link (WCAG 2.4.1)

### Infrastructure
- tRPC client + React Query provider
- Form validation schemas (auth + server)
- SSE hook for provisioning progress
- Root layout with providers (ThemeProvider, TRPCProvider, Toaster)

### WCAG 2.2 AA Fixes
- `--color-text-subtle`: slate-400 → slate-500 (≥4.5:1 contrast)
- `--color-border-base`: slate-200 → slate-300 (≥3:1 non-text contrast)
- Input borders use `--color-border-strong` (slate-400)

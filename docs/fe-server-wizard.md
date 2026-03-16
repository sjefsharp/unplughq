---
artifact: fe-server-wizard
produced-by: frontend-developer
project-slug: unplughq
work-item: task-237-fe-server-wizard
work-item-type: task
parent-work-item: epic-001-unplughq-platform
workflow-tier: full
phase: P4
version: 1.0.0
status: approved
azure-devops-id: 237
---

# FE Server Connection Wizard

## Deliverables

### Welcome Page (`/welcome`)
Copy from copy-specs.md §1: "Welcome to your private cloud". Requirements checklist with checkmarks. CTA: "Connect your server" linking to /connect/credentials.

### Wizard Layout (`(authenticated)/connect/layout.tsx`)
Back button + "Step N of 3" indicator. Max-width 560px. aria-live step counter.

### Step 1: Credentials (`/connect/credentials`)
- IPv4 address input with Zod regex validation
- SSH port (default 22)
- Auth method: RadioGroup (Password / SSH Key Recommended)
- SSH username (default "root")
- Conditional: password field or private key textarea
- CTA: "Test connection"

### Step 2: Validation (`/connect/validation`)
- PulseRing success indicator
- 2x2 grid of spec cards (CPU, RAM, Storage, OS) — responsive to 1-col on mobile
- CTA: "Continue to setup"
- Mock data placeholder — wired to tRPC server.get by BE agent

### Step 3: Provisioning (`/connect/provisioning`)
- SSE-powered real-time progress via useSSE hook
- Progress bar with percentage
- Scrollable log region (role="log", aria-live="polite")
- Auto-redirect to /dashboard on completion
- sr-only assertive progress announcements

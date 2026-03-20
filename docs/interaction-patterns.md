---
artifact: interaction-patterns
produced-by: ux-designer
project-slug: unplughq
work-item: epic-001-unplughq-platform
parent-work-item: epic-001-unplughq-platform
work-item-type: epic
workflow-tier: full
phase: P2
version: 2.0.0
status: draft
consumed-by:
  - frontend-developer
  - accessibility
date: 2026-03-16
azure-devops-id: 283
---

# UnplugHQ Interaction Patterns Library

This document defines the micro-interactions, feedback loops, and state changes for UnplugHQ. Every interaction is mapped to animation tokens defined in the Design System.

## 1. Core Principles
1. **Confidence in Action:** Non-technical users need reassurance. Every action validates its start, progress, and result.
2. **Smooth & Springy:** Using spring approximations creates an organic, physical feel for interactions, aligning with the "approachable" brand personality.
3. **Graceful Failures:** Destructive or failing processes always explain what went wrong and provide an immediate retry/rollback path. No dead ends.
4. **Accessible by Default:** Animations respect `prefers-reduced-motion`. State indicators rely on combinations of shape, text, and color, never color alone.

## 2. Real-Time Feedback Patterns

### Deployment Progress Indicator
- **Trigger:** User clicks "Deploy" on an app in the marketplace.
- **Initial State:** Button text transitions to "Starting..." and a subtle spinner appears.
- **Progress Animation:** A horizontal progress bar appears at the top of the card or modal. It does not move linearly; it moves based on websocket events (e.g., Pulling Image, Configuring, Starting).
- **Easing:** `--ease-spring` for textual transitions. `--ease-standard` for progress bar filling.
- **Success State:** The progress bar completes, flashing `--color-success-base`. The container translates slightly upwards and the status badge switches to "Healthy".
- **Error State:** The progress bar stops, flashes `--color-critical-base`, and structural modal shakes (±4px horizontally 3 times, duration 300ms).
- **Accessibility:** Live region `aria-live="polite"` announces: "Deployment started", "Pulling files", "Deployment successful".

### Server Health Pulse (Signature Element)
- **Trigger:** Automatic/Continuous. Displayed on the Dashboard next to the Server label.
- **Visuals:** A 12px dot (colored mapped to status). A pseudo-element behind it scales from `1` to `2.5` while its opacity drops from `0.4` to `0` over 2 seconds.
- **Statuses:**
  - *Healthy:* `--color-success-base`
  - *Deploying:* `--color-primary-base` (pulse speed 1.5x faster)
  - *Attention Needed:* `--color-warning-base`
  - *Offline:* `--color-critical-base` (pulse disabled, solid dot only to indicate lack of activity)
- **A11y:** Contains hidden screen-reader text `sr-only` indicating exact connection status.

### Real-Time Metric Updates (CPU/RAM/Storage)
- **Trigger:** Continual push from control plane.
- **Animation:** Numbers tick up/down smoothly instead of flashing instantly (using a tweening function over 150ms). Sparkline charts use `--ease-standard` to draw new data points pushing older data off-screen to the left.
- **Threshold Alerts:** When a metric crosses a warning threshold (e.g.,> 80%), its textual color fades from `--color-text-base` to `--color-warning-text` over 300ms.

## 3. General Feedback Loops

### Toast Notifications
- **Trigger:** Background processes completing (e.g., "Backup successful") or passive errors.
- **Placement:** Bottom Right on Desktop. Top Center on Mobile.
- **Enter Animation:** Slide in from edge (`translateY`/`translateX`) + Fade In (duration: `--dur-base`, `--ease-out`).
- **Exit Animation:** Slide out to edge + Fade Out (duration: `--dur-fast`, `--ease-in`).
- **Durations:** 
  - Success/Info: 4000ms Auto-dismiss.
  - Error: Requires manual dismissal (to ensure it is read).
- **Variants:** 
  - Success (Green icon)
  - Warning (Amber icon)
  - Error (Red icon + persistent)
  - Info (Blue icon)
- **A11y:** Injected into an `aria-live="assertive"` portal container for immediate read-out.

### Form Validation
- **Trigger:** On `blur` (loss of focus) for individual fields, and `submit` for the whole form.
- **Feedback:** 
  - Invalid field border flashes `--color-critical-base`.
  - Icon (cross) appears inside input.
  - An error message smoothly expands down below the input (`max-height` transition 0 to 24px, `--ease-standard`).
- **A11y:** `aria-invalid="true"` set on input, error text linked via `aria-errormessage` or `aria-describedby`.

### Modal Dialogs (Confirmations)
- **Trigger:** Destructive actions ("Uninstall App", "Disconnect Server") or complex configurations.
- **Backdrop:** Fades in (duration: 150ms). Blur filter engages `backdrop-filter: blur(4px)`.
- **Card Enter:** Scales up aggressively from `0.95` to `1.0` while fading in over 250ms with `--ease-spring`.
- **Card Exit:** Scales from `1.0` to `0.95` while fading out over 150ms with `--ease-in`.
- **Focus Management:** Focus is trapped inside the modal. Pressing `Escape` closes the modal (unless it requires explicit destructive confirmation).

## 4. Navigation & Layout Interactions

### Skeleton Loading (App Marketplace & Dashboard)
- **Trigger:** Initial page load while fetching API data.
- **Visuals:** Ghost elements mimicking the final layout structure. They use a linear gradient background that translates laterally.
- **Animation:** `translateX(-100%)` to `translateX(100%)` infinite loop over 1.5s.
- **Transition to Content:** Skeletons crossfade to real content (opacity 1 to 0 over 200ms) once data resolves. No layout jumping (heights are pre-reserved).

### Infinite Scroll / Load More (Log Streaming)
- **Trigger:** Scrolled within 200px of the bottom (historical logs) or top (new logs).
- **Feedback:** A small inline spinner fades in at the boundary. Once data loads, new log lines append natively. No jarring jumps.
- **Live Tail Mode:** If user is at the bottom, auto-scroll stays locked to bottom. If user scrolls up, a floating "Resume auto-scroll" badge appears overlaid at the bottom edge.

### Drag to Reorder (Dashboard App Tiles)
- **Trigger:** Long press (Mobile) or click-and-hold drag handle (Desktop).
- **Lift State:** 
  - Element scales to `1.02`. 
  - Elevation shadow jumps smoothly to Level 3 (`--ease-spring`).
  - Cursor changes to `grabbing`.
- **Move State:** Smoothly translates with pointer. Surrounding sibling tiles smoothly displace (move via transform) using Flip animations or Framer Motion to make room.
- **Drop State:** Tile snaps to nearest slot. Scale returns to `1.0`, elevation to Level 1.
- **A11y:** Provide a purely keyboard-accessible flow: Select item (Space), use Up/Down arrows to move, press Space to confirm. Announcements: "Grabbed Item X", "Moved Item X to position 2".

### Contextual Menus (App Settings)
- **Trigger:** Click on the triple-dot (kebab) icon.
- **Enter:** Anchor transforms relative to button position. Menu scales from `0.9` origin top-right to `1.0` over 150ms.
- **Hover:** Individual menu items feature `--color-bg-surface-hover` highlight without border-radius clipping.
- **A11y:** Operates strictly as a W3C generic `menu` or `listbox`. Arrow keys navigate up/down smoothly.

## 5. Mobile-Specific Patterns

*Since platform is strictly web, these are touch/viewport adaptations utilizing CSS flex/grid and interaction media queries.*

### Swipe to Act (Notifications / Simple Actions)
- **Trigger:** Touch drag horizontally on list items (like notifications or logs).
- **Interaction:** Swiping left reveals a red "Delete" / "Dismiss" block underneath. Releasing past 40% threshold triggers the action.
- **Haptic (where supported by browser APIs):** Vibrate on threshold cross.

### Bottom Sheets (Mobile Modals)
- **Trigger:** Actions that trigger Modals on Desktop trigger Bottom Sheets on viewports $< 640px$.
- **Enter:** Slides UP from `transform: translateY(100%)` to `0` over 300ms.
- **Exit:** Slides DOWN.
- **Drag-to-close:** A subtle pill handle at the top allows users to swipe down to dismiss.

### Pull-to-Refresh
- **Trigger:** Dragging down from the top edge when at scroll position 0.
- **Feedback:** A circular spinner (the "Pulse Ring") drops down from the ceiling natively tracking the touch distance. Once past threshold (60px), it locks and spins until the API resolves, then snaps back up.

## 7. PI-2 Sprint 2 Interaction Patterns

### 7.1 SSE Real-Time Deployment Progress (AB#204)

Deployment progress is streamed via Server-Sent Events from the BullMQ deployment worker to the browser.

- **Connection:** Client opens SSE stream on navigation to `/deployments/[id]`. Event source: `deployment.progress` SSE endpoint.
- **Event Schema:** Each SSE event carries `{ phase: DeploymentStatus, description: string, timestamp: string }`.
- **Phase Transition Animation:**
  1. Active phase icon pulses (`--color-primary-base` pulse ring, 1.5s cycle).
  2. On phase completion: icon transitions to `--color-success-base` checkmark with `--ease-spring` scale-in (`0.8 → 1.0`, `--dur-base`).
  3. Next phase icon simultaneously transitions from `--color-border-base` to active pulse.
  4. Connector line between phases fills from gray to `--color-success-base` over `--dur-slow`.
  5. Progress bar segment fills with `--ease-standard`.
- **Failure Transition:**
  1. Active phase icon transitions to `--color-critical-base` X with shake animation (±4px, 3 cycles, 300ms).
  2. Remaining phases dim to 30% opacity.
  3. Failure detail panel slides open below: `--color-critical-subtle` background, error message, cleanup confirmation.
- **Reconnection:** If SSE disconnects, client retries with exponential backoff (1s, 2s, 4s, 8s max). During reconnection, display "Reconnecting..." badge above progress. On reconnect, refetch current state via `deployment.status` tRPC query and reconcile.
- **Page Revisit:** Navigating away and back re-opens SSE stream. Current state is fetched immediately, then live events resume. Already-completed phases render instantly (no re-animation).
- **Background Navigation:** When user navigates away during deployment, dashboard app tile shows a deployment-in-progress indicator (primary-colored pulse ring + "Deploying..." label). Clicking the tile returns to the progress screen.
- **A11y:** `aria-live="polite"` region announces: "Preparing", "Downloading your app", "Configuring", "Securing your domain", "Starting your app", "Your app is running" (or "Deployment failed").

### 7.2 Deployment State Machine Transitions (AB#204)

The deployment follows a strict state machine. The UI reflects each transition with visual feedback.

```
[pending] → [pulling] → [configuring] → [provisioning-ssl] → [starting] → [running]
                 ↓              ↓                  ↓                ↓
              [failed]       [failed]           [failed]         [failed]
```

- **Forward-Only:** Phases never regress. Once a phase completes, it stays checked.
- **Atomic Failure:** A failure at any phase immediately halts progression. The failed phase is marked red; all subsequent phases remain dimmed with empty circles.
- **Retry from Failed Phase:** On "Try again", the state machine resets to the failed phase's predecessor and re-enters the failed phase (not full restart from pending). The UI animates the failed phase icon back to active pulse state.
- **Timeout Handling:** If no SSE event is received for 60 seconds during an active deployment, the UI shows an informational banner: "This is taking longer than expected. Your deployment is still running." No automatic failure — timeouts are not terminal.
- **Idempotency Visual Cue:** If retrying, a subtle "Attempt 2" badge appears next to the progress header to indicate this is a retry.

### 7.3 Dashboard SSE Refresh & Polling Fallback (AB#207)

The dashboard receives live metric and alert updates via SSE, with graceful degradation.

- **Primary: SSE Stream:**
  - Client opens SSE connection on dashboard mount. Events: `metrics.update` (server metrics), `alert.new` (new alert), `alert.resolved` (alert cleared), `app.status` (app status change).
  - **Heartbeat:** Server sends heartbeat every 30 seconds. Client uses heartbeat to detect connection health.
  - **Metric Update Animation:** Resource gauge values tween smoothly over `150ms` using `--ease-standard`. No instant jumps. Color transitions occur over `--dur-base` when crossing thresholds (e.g., Memory goes from 68% green to 71% amber).
  - **App Status Change:** Status badge transitions with a subtle scale pulse (`1.0 → 1.1 → 1.0`, `--dur-base`, `--ease-spring`) to draw attention. Badge color transitions over `--dur-fast`.
- **Fallback: Polling:**
  - If SSE connection fails and 3 reconnection attempts (1s, 2s, 4s backoff) fail, client switches to polling mode.
  - Polling interval: 60 seconds via `monitor.dashboard` tRPC query.
  - A subtle indicator replaces the "Last updated" timestamp: "Live updates unavailable. Refreshing every 60 seconds."
  - On successful SSE reconnection, polling stops and indicator disappears.
- **Stale Data Detection:** If no SSE event or poll response is received for 120 seconds, all gauges dim to 50% opacity and a "Data may be outdated. Last update: [timestamp]." banner appears.
- **A11y:** New alerts inject into `aria-live="assertive"` region. Metric changes are not announced (too frequent — would overwhelm screen readers).

### 7.4 Alert Notification Flow (AB#208)

The complete lifecycle from threshold breach to user acknowledgment.

```
[Threshold Breached] → [Alert Created] → [Dashboard Banner + Bell Badge]
                                      → [Email Sent (if enabled)]
                                      ↓
                           [User Views Alert] → [User Acknowledges]
                                              → [User Dismisses]
                                              → [User Opens Remediation]
                                              ↓
                                       [Condition Clears] → [Alert Auto-Resolved]
```

- **Alert Arrival (Dashboard):**
  1. Alert banner slides down from below the header (`translateY(-100%)` → `0`, `--dur-base`, `--ease-spring`).
  2. Notification bell badge count increments with a scale pulse (`1.0 → 1.3 → 1.0`, `--dur-fast`).
  3. If dashboard is open, the alert also appears in the alert list with a highlight flash (`--color-warning-subtle` background fades to transparent over 2s).
- **Alert Arrival (Background — Bell Dropdown):**
  1. Bell badge updates. User clicks bell to see dropdown.
  2. New alerts appear at top of dropdown with `--color-primary-subtle` left border highlight for 5 seconds, then fades to normal.
- **Acknowledge Action:**
  1. User clicks "Acknowledge" on alert row.
  2. Button transitions to "Acknowledged" with checkmark icon, disabled state.
  3. Alert row visually subdued: opacity transitions to 80%. Badge color dims.
  4. Toast: "Acknowledged. This alert won't send repeat notifications."
  5. Server: suppresses future email notifications for this alert instance.
- **Dismiss Action:**
  1. User clicks "Dismiss".
  2. Alert row collapses (`max-height` → 0, `--dur-base`, `--ease-in`) and reappears in "Recent" section.
  3. Toast: "Dismissed. Returns if the condition reoccurs."
  4. If this was the last active alert, the "Everything is running smoothly." empty state fades in.
- **Auto-Resolution:**
  1. When the condition clears (e.g., disk drops below threshold), alert transitions to resolved.
  2. Alert row gets a green checkmark overlay. After 5 seconds, slides out of active list.
  3. Toast: "Resolved. Storage is back to normal levels."
  4. Bell badge count decrements.
- **Email Notification:** Sent within 5 minutes of alert creation (per FR-F3-006). Contains: subject (severity + summary), body (cause → severity → action → dashboard link), footer (manage preferences link). No repeat emails for acknowledged alerts.

### 7.5 Multi-App Port Conflict Resolution Flow (AB#206)

Since all apps use reverse proxy routing (no host port binding), port conflicts are structurally prevented. The UX focuses on domain conflict detection and resource contention visibility.

- **Domain Conflict Detection:**
  1. During configuration wizard (Step 2), when user enters a domain, client-side check queries existing deployments.
  2. If the domain is already in use by another app: input border transitions to `--color-critical-base`, inline error: "This domain is already in use by [App Name]. Choose a different domain."
  3. Validation blocks the "Continue" button on conflict. User must change the domain.
- **Resource Contention Visibility:**
  1. When deploying a new app, the configuration summary shows a resource impact preview: "After deployment: CPU ~X%, Memory ~Y%, Storage ~Z%".
  2. If projected aggregate exceeds 80%: warning banner with amber styling. "Your server will be using approximately X% of its resources."
  3. If projected aggregate exceeds 90%: critical warning. "Your server may not have enough resources. Performance of all apps could be affected." Still non-blocking (per FR-F2-104 soft limit).
- **During Deployment:** Existing app tiles on the dashboard retain their current status badges. No flickering or status changes during a sibling deployment. If the reverse proxy briefly reloads (Caddy route addition), the existing app status may show a momentary "Updating" badge for <5 seconds, then returns to "Running".
- **Post-Deployment Verification:** After a new app deploy, the system verifies all existing apps are still responding (background health check). If any existing app is disrupted, a warning alert is generated: "[Existing App] became unreachable after deploying [New App]."

### 7.6 Configuration Wizard Step Navigation (AB#203)

Multi-step form navigation preserving state and supporting non-linear editing.

- **Forward Navigation:**
  1. "Continue" button validates the current step. On error: field-level errors appear per Form Validation pattern (Section 3).
  2. On success: current step indicator transitions to completed (checkmark, `--color-success-base`). Next step activates. Form slides left (`translateX(-100%)`), next step slides in from right (`translateX(100%)` → `0`), `--dur-base`, `--ease-spring`.
- **Backward Navigation:**
  1. "Back" button navigates to previous step without validation (allowing partial fill).
  2. Reverse slide animation (current slides right, previous slides in from left).
  3. All previously entered values are preserved in component state.
- **Edit-Back from Summary:**
  1. Clicking "Edit" next to a section on the summary screen jumps directly to that step.
  2. Step indicator updates: target step becomes active, subsequent steps dim but remain marked as "visited" (outlined checkmark, `--color-border-base`).
  3. After editing, "Continue" from the edited step skips past already-completed steps back to summary.
- **A11y:** Step indicator has `aria-label`: "Step X of Y: [Step Name], [completed/current/upcoming]". Focus moves to the first interactive element of each new step.

### 7.7 Catalog Search & Filter Interaction (AB#202)

Real-time search and instant category filtering for the app catalog.

- **Search Input:**
  - Debounce: 300ms after last keystroke before filtering results.
  - While typing: subtle skeleton flash on card grid signals incoming results.
  - Match: case-insensitive substring against app name and description.
  - Clear: X icon inside input appears when text is entered. Click clears and resets to full catalog.
- **Category Filter Chips:**
  - Toggle behavior: clicking a chip activates it (only one active at a time + "All" resets).
  - Active chip: scale pulse `1.0 → 1.05 → 1.0`, background transitions to `--color-primary-subtle` over `--dur-fast`.
  - Deactivated chip: background transitions back to `--color-bg-surface` over `--dur-fast`.
  - Combined with search: both filters apply simultaneously. Category narrows first, search filters within category.
- **Results Update:**
  - Grid items crossfade: departing items fade out (`--dur-fast`), incoming items fade in (`--dur-base`). Layout shifts smoothly via CSS grid animation (items don't jump).
  - Result count displayed above grid: "[N] apps" in `--text-sm-fs`, `--color-text-muted`.
- **Empty State:** Centered message "No apps match your search." with suggestion "Try a different term or browse by category." Fade-in over `--dur-base`.

## 8. Accessibility Reference (Updated for PI-2)

- `prefers-reduced-motion: reduce`:
  - Disables the "Pulse Ring" animation (it becomes a static dot).
  - SSE progress bar fills instantly instead of animating.
  - Alert banner enters with opacity fade only (no slide).
  - Configuration wizard steps transition with crossfade instead of slide.
  - Deployment phase transitions use opacity-only, no scale.
- **Focus Management:**
  - Focus outlines are globally defined as `0 0 0 4px var(--color-primary-base)`. No `outline: none` without structural fallback.
  - Alert expand/collapse: focus moves to the expanded detail panel on open, returns to the row on collapse.
  - Wizard: focus moves to first input of each new step.
  - Remediation: focus moves to first step content on page load.
- **Keyboard Shortcuts:**
  - `?` — Opens Keyboard Shortcuts modal.
  - `/` — Focuses universal App/Server search.
  - `Esc` — Dismisses active modals/toasts/menus.
- **Screen Reader Announcements:**
  - Deployment progress: `aria-live="polite"` announces each phase change.
  - New alerts: `aria-live="assertive"` announces alert arrival.
  - Gauge updates: not announced (too frequent). Current values readable on focus.
  - Verification results: `aria-live="polite"` announces each check result.

(Ends Interaction Patterns Spec)
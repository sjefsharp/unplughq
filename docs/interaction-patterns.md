---
artifact: interaction-patterns
produced-by: ux-designer
project-slug: unplughq
work-item: epic-001-unplughq-platform
parent-work-item: epic-001-unplughq-platform
work-item-type: epic
workflow-tier: full
phase: P2
version: 1.0.0
status: approved
consumed-by:
  - frontend-developer
  - accessibility
date: 2026-03-14
azure-devops-id: 191
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

## 6. Accessiblity Reference

- `prefers-reduced-motion: reduce`:
  - Disables the "Pulse Ring" animation (it becomes a static dot).
  - Skips scaling and translating on enter/exit animations. Uses direct opacity fades over 0ms-150ms max.
- **Focus Management:**
  - Focus outlines are globally defined as `0 0 0 4px var(--color-primary-base)`. No `outline: none` without structural fallback.
- **Keyboard Shortcuts:**
  - `?` — Opens Keyboard Shortcuts modal.
  - `/` — Focuses universal App/Server search.
  - `Esc` — Dismisses active modals/toasts/menus.

(Ends Interaction Patterns Spec)
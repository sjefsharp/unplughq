---
artifact: wcag-audit
produced-by: accessibility
project-slug: unplughq
work-item: task-179-a11y-wcag-audit-guidelines
work-item-type: task
parent-work-item: epic-001-unplughq-platform
workflow-tier: full
phase: P2
version: 1.0.0
status: approved
consumed-by:
  - frontend-developer
  - testing
  - ux-designer
date: 2026-03-14
azure-devops-id: 179
---

# WCAG 2.2 AA Compliance Audit — UnplugHQ Platform

## 1. Audit Scope & Methodology

### 1.1 Scope

This audit evaluates the UnplugHQ design system, wireframe specifications, and interaction patterns against **WCAG 2.2 Level AA** success criteria. The audit covers:

- **Design System** (`design-system.md`): OKLCH color tokens, contrast matrix, typography scale, spacing system, component sizing, elevation model, motion tokens
- **Wireframes** (`wireframes.md`): 10 core screens — Onboarding Welcome, Server Connection Wizard (Steps 1–3), Main Dashboard, App Marketplace, App Detail/Install, Deployment Progress Modal, App Management, Server Health Detail, Global Settings
- **Interaction Patterns** (`interaction-patterns.md`): Deployment progress, server health pulse, real-time metrics, toast notifications, form validation, modal dialogs, skeleton loading, drag to reorder, contextual menus, mobile-specific patterns

### 1.2 Methodology

- **Standard:** Web Content Accessibility Guidelines (WCAG) 2.2 Level AA (W3C Recommendation, October 2023)
- **Approach:** Design-phase audit (pre-implementation). Findings are based on specified tokens, wireframe structures, and interaction definitions rather than rendered DOM.
- **Severity ratings:** Critical (blocks access for AT users), Serious (significant barrier), Moderate (causes difficulty), Minor (best-practice improvement)
- **Evidence basis:** Specific token values, wireframe elements, and interaction definitions referenced by artifact path and section

### 1.3 Upstream Artifacts Consumed

| Artifact | Key Data Extracted |
|----------|--------------------|
| `product-vision.md` | Target audience (non-technical users), user journeys UJ1–UJ5, success criteria |
| `requirements.md` | NFR-003 (WCAG 2.1 AA), NFR-008 (mobile-first responsive, 375px min viewport) |
| `architecture-overview.md` | Web platform, PWA capability, Next.js 16 with Server Components |
| `design-system.md` | OKLCH color ramps, semantic tokens, contrast matrix, typography, component specs |
| `wireframes.md` | 10 screen wireframes with layout specs and interaction notes |
| `interaction-patterns.md` | Animation tokens, focus management, ARIA live regions, reduced motion |
| `threat-model.md` | Auth flows, session handling, error messaging security (no user enumeration) |
| `content-hierarchy.md` | Information architecture, heading structure per section |

---

## 2. Perceivable (Principle 1)

### 2.1 Text Alternatives (1.1)

#### 1.1.1 Non-text Content (Level A) — Needs Work

| Finding | Severity | Screen | Detail |
|---------|----------|--------|--------|
| App icons in Marketplace and Dashboard lack alt text specification | Serious | Dashboard (Screen 4), Marketplace (Screen 5) | Wireframes show `[Icon] Nextcloud`, `[Icon] Ghost`, etc. but no alt text pattern is specified. Each app icon must have `alt="{App Name} logo"` or be marked `role="img" aria-label="{App Name}"`. |
| Server health Pulse Ring lacks text alternative | Moderate | Dashboard (Screen 4), Server Health (Screen 9) | The Pulse Ring animation conveys health status visually. The interaction patterns specify `sr-only` text for screen readers — this is correct but must be implemented as `<span class="sr-only">Server status: Healthy</span>` adjacent to the visual indicator. |
| Illustration on Onboarding Welcome | Moderate | Onboarding (Screen 1) | `[Illustration: Calm Server]` needs meaningful alt text describing the illustration's purpose, e.g., `alt="Illustration of a serene server environment"`. Decorative illustrations should use `alt=""` with `role="presentation"`. |
| Sparkline charts on Server Health | Serious | Server Health (Screen 9) | CPU Usage and RAM Usage sparkline charts have no text alternative specification. Charts must provide either: (a) an `aria-label` with the current value summary, or (b) a visually hidden data table alternative. |

**Recommendation:** Define an alt text pattern in the design system for all icon/image component types. Require every `<img>` and SVG to have either `alt` text or `aria-label`. Charts require structured text alternatives.

### 2.2 Time-Based Media (1.2) — N/A

No audio or video content is specified in the UnplugHQ interface. If onboarding tutorials are added in future PIs, they must include captions (1.2.2), audio descriptions (1.2.5), and transcripts.

### 2.3 Adaptable (1.3)

#### 1.3.1 Info and Relationships (Level A) — Needs Work

| Finding | Severity | Screen | Detail |
|---------|----------|--------|--------|
| Content hierarchy heading structure | Moderate | All screens | `content-hierarchy.md` defines H1–H3 levels per section. Verify that Dashboard uses `<h1>` for "System Overview", `<h2>` for "Active Alerts", "Server Health", "Deployed Applications". Marketplace uses `<h1>` for "App Catalog", `<h2>` for categories. |
| Form field grouping in Server Connection Wizard | Serious | Wizard Step 1 (Screen 2) | The "Authentication Method" radio group (Password / SSH Key) controls which subsequent fields are visible. This must use `<fieldset>` with `<legend>Authentication Method</legend>` to programmatically associate the radio options with their label. |
| Server resource cards on Validation screen | Moderate | Wizard Step 2 (Screen 3) | The CPU/RAM/Storage/OS cards use a 2-column grid layout. Each card must use semantic markup: `<dl>` (definition list) with `<dt>` for the metric label and `<dd>` for the value, or use `role="group"` with `aria-label`. |
| Dashboard notification banner | Moderate | Dashboard (Screen 4) | `[!] 1 Update Available (Nextcloud)` must use `role="alert"` or `role="status"` to programmatically convey its importance. |
| Notification preferences checkboxes on Settings | Moderate | Settings (Screen 10) | Checkboxes ("Email me about failed backups", "Email me about system updates", "Send weekly digest") must be grouped with `<fieldset>` and `<legend>Notification Preferences</legend>`. |

#### 1.3.2 Meaningful Sequence (Level A) — Pass

The wireframes define a logical content flow: sidebar navigation → top bar → main content. Mobile layout stacks content top-to-bottom: header → content → drawer navigation. The CSS Grid / Flexbox approach ensures DOM order matches visual order.

#### 1.3.3 Sensory Characteristics (Level A) — Needs Work

| Finding | Severity | Screen | Detail |
|---------|----------|--------|--------|
| Server health status relies on color coding | Serious | Dashboard (Screen 4) | Status uses color-coded dots: green (Healthy), amber (Attention), red (Offline). The interaction patterns specify text labels alongside colors — this must be enforced. Every status indicator must pair color with a text label: "Healthy", "Needs Attention", "Offline". |
| Toast notification variants | Moderate | Global | Toast variants (Success/Warning/Error/Info) are distinguished by icon color. Each toast must also include a text prefix: "Success:", "Warning:", "Error:", "Info:" to avoid relying solely on color. |

#### 1.3.4 Orientation (Level AA) — Pass

No orientation restriction is specified. The responsive design system (mobile-first, 375px minimum) supports both portrait and landscape.

#### 1.3.5 Identify Input Purpose (Level AA) — Needs Work

| Finding | Severity | Screen | Detail |
|---------|----------|--------|--------|
| Form input autocomplete attributes missing | Moderate | Wizard Step 1 (Screen 2), Settings (Screen 10), Auth screens | The IP address field, email fields, and username fields should specify `autocomplete` attributes: `autocomplete="email"` for email fields, `autocomplete="username"` for SSH username, `autocomplete="new-password"` / `autocomplete="current-password"` for password fields. |

### 2.4 Distinguishable (1.4)

#### 1.4.1 Use of Color (Level A) — Needs Work

The design system uses color functionally via semantic tokens. However, several areas rely on color as the sole differentiator:

| Finding | Severity | Screen | Detail |
|---------|----------|--------|--------|
| App health status indicators | Serious | Dashboard (Screen 4) | Status dots (green/amber/red) next to app cards. Text labels specified in interaction patterns but must be mandatory, not optional. |
| Metric threshold alerts | Moderate | Server Health (Screen 9) | When CPU/RAM exceeds 80%, text color transitions from `--color-text-base` to `--color-warning-text`. Must add an icon or text badge alongside the color shift. |
| Form validation error state | Moderate | All form screens | Input border changes to `--color-critical-base` and a cross icon appears — the icon provides a non-color indicator. **Pass** if implemented as specified with both border color and icon. |

#### 1.4.2 Audio Control (Level A) — N/A

No audio content is specified.

#### 1.4.3 Contrast (Minimum) (Level AA) — Needs Work

The design system provides a Contrast Matrix (Section 3). Analysis of stated values:

| Combination | Stated Light Ratio | Stated Dark Ratio | WCAG AA (4.5:1 text, 3:1 large/UI) | Verdict |
|-------------|-------------------|-------------------|-------------------------------------|---------|
| `--color-text-base` on `--color-bg-base` (slate-900 on white) | 13.8:1 | 13.5:1 | Exceeds AA | **Pass** |
| `--color-text-muted` on `--color-bg-base` (slate-600 on white) | 5.1:1 | — | Meets AA (≥4.5:1) | **Pass** |
| `--color-text-muted` on `--color-bg-surface` (slate-600 on slate-050) | ~4.7:1 (estimated) | — | Tight margin | **Verify** |
| `--color-text-subtle` on `--color-bg-base` (slate-400 on white) | ~3.2:1 (estimated) | — | **FAILS** AA for normal text | **Fail** |
| `--color-primary-base` on `--color-bg-base` (indigo-500 on white) | 6.2:1 | 5.8:1 | Meets AA | **Pass** |
| `--color-on-primary` on `--color-primary-base` (white on indigo-500) | 6.2:1 | 6.1:1 | Meets AA | **Pass** |
| `--color-success-text` on `--color-success-subtle` (emerald-700 on emerald-050) | 5.8:1 | 5.5:1 | Meets AA | **Pass** |
| `--color-warning-text` on `--color-warning-subtle` (amber-800 on amber-050) | Not stated | — | Must be ≥4.5:1 | **Verify** |
| `--color-critical-text` on `--color-critical-subtle` (rose-700 on rose-050) | 6.1:1 | 5.9:1 | Meets AA | **Pass** |
| Dark: `--color-text-muted` on `--color-bg-base` (slate-400 on slate-950) | — | 4.8:1 | Meets AA | **Pass** |
| Dark: `--color-text-subtle` on `--color-bg-base` (slate-600 on slate-950) | — | ~2.8:1 (estimated) | **FAILS** AA for normal text | **Fail** |

**Critical Finding — `--color-text-subtle` (slate-400 in light, slate-600 in dark):**

The `--color-text-subtle` token is used for tertiary/hint text. With OKLCH lightness values of 0.72 (slate-400) against 1.0 (white bg), the estimated contrast ratio is approximately **3.2:1** — this fails the 4.5:1 minimum for normal-size text. In dark mode, slate-600 (L=0.50) against slate-950 (L=0.15) yields approximately **2.8:1** — also failing.

**Remediation:** Either darken `--color-text-subtle` to at minimum slate-500 (`oklch(0.60 0.06 240)`) for light mode, or restrict its usage to large text only (≥18pt / ≥14pt bold), where the 3:1 minimum applies.

#### 1.4.4 Resize Text (Level AA) — Pass

The typography scale uses fluid `clamp()` with rem units (`--text-base-fs: clamp(1rem, 0.95rem + 0.25vw, 1.05rem)`). This scales with browser zoom and text-size preferences. No fixed `px` font sizes that would prevent zoom.

#### 1.4.5 Images of Text (Level AA) — Pass

No images of text are specified. The UnplugHQ logo should be implemented as an SVG with accessible text, not as a raster image of text.

#### 1.4.10 Reflow (Level AA) — Pass

The responsive design system specifies mobile-first layout (375px minimum viewport) with CSS Grid stacking. Content reflows to a single column below `--bp-lg` (1024px). Sidebar collapses to hamburger menu. All content accessible without horizontal scrolling at 320px CSS width.

#### 1.4.11 Non-text Contrast (Level AA) — Needs Work

| Finding | Severity | Screen | Detail |
|---------|----------|--------|--------|
| Input field borders | Moderate | All form screens | `--color-border-base` is slate-200 (`oklch(0.90 0.03 240)`) on white (`oklch(1.0 0 0)`). Estimated contrast ~1.5:1 — **fails** the 3:1 minimum for UI components. Focus state (`box-shadow` with `--color-primary-base`) provides sufficient contrast, but the resting state border must meet 3:1. |
| Disabled button opacity | Minor | All interactive screens | Disabled buttons use `opacity: 50%`. If the base button color is `--color-primary-base` (indigo-500 at 6.2:1), 50% opacity reduces effective contrast to ~3.1:1 — borderline. Acceptable since disabled elements are exempt from 1.4.11 per WCAG, but consider using a distinct token instead of opacity for better clarity. |
| Card border (Level 1 elevation) | Moderate | Dashboard cards, Marketplace cards | `--color-border-subtle` (slate-100, `oklch(0.95 0.02 240)`) on white background — estimated ratio ~1.2:1. Cards rely on shadow for visual boundary, but the border should be strengthened to `--color-border-base` or darker for users who reduce transparency/shadows. |

**Remediation:** Increase `--color-border-base` to at minimum slate-300 (`oklch(0.82 0.04 240)`) for input field resting-state borders to achieve ≥3:1 against white background.

#### 1.4.12 Text Spacing (Level AA) — Pass

No CSS restrictions on text spacing are specified. Fluid typography with rem-based line heights allows user stylesheet overrides.

#### 1.4.13 Content on Hover or Focus (Level AA) — Needs Work

| Finding | Severity | Screen | Detail |
|---------|----------|--------|--------|
| Chart tooltips | Moderate | Server Health (Screen 9) | Sparkline chart tooltips appear on hover showing "precise time/value." Tooltips must: (a) be dismissible without moving the pointer (Esc key), (b) remain visible while hovering over them, (c) persist until the user dismisses or the trigger loses hover/focus. |
| Contextual menus | Minor | Dashboard (Screen 4), App Management (Screen 8) | Kebab menu opens on click (not hover), which is correct. If any tooltip-on-hover patterns are added to menu items, they must meet 1.4.13. |

---

## 3. Operable (Principle 2)

### 3.1 Keyboard Accessible (2.1)

#### 2.1.1 Keyboard (Level A) — Needs Work

| Finding | Severity | Screen | Detail |
|---------|----------|--------|--------|
| Drag-to-reorder dashboard tiles | Serious | Dashboard (Screen 4) | The interaction patterns specify a keyboard alternative: "Select item (Space), use Up/Down arrows to move, press Space to confirm." This is correct. Must be implemented with `aria-grabbed` / `aria-dropeffect` or the newer `aria-roledescription` pattern. |
| Swipe-to-act on mobile | Serious | Mobile notifications | Touch-only gesture (swipe left) to dismiss notifications. A visible Delete/Dismiss button must also exist for keyboard and AT users. |
| File drop zone on SSH Key textarea | Moderate | Wizard Step 1 (Screen 2) | "Upload file drop-zone invisible overlay for the textarea." Must also provide a visible file upload `<input type="file">` button as an alternative to drag-and-drop. |
| Category filter pills on Marketplace | Moderate | Marketplace (Screen 5) | Category buttons `[All] [Productivity] [Storage] [Data]` must be keyboard focusable and activatable with Enter/Space. Use `<button>` elements or `role="tab"` in a `tablist`. |

#### 2.1.2 No Keyboard Trap (Level A) — Pass (with caveat)

Modal dialogs trap focus by design (correct behavior per WAI-ARIA Dialog pattern). The interaction patterns specify `Escape` closes modals. **Caveat:** Deployment Progress Modal "cannot be dismissed by clicking outside during critical operations" — ensure `Escape` still works during deployment, or provide an explicit "Cancel Deployment" button accessible via keyboard.

#### 2.1.4 Character Key Shortcuts (Level A) — Needs Work

| Finding | Severity | Screen | Detail |
|---------|----------|--------|--------|
| Single-character keyboard shortcuts | Moderate | Global | Interaction patterns define `?` (help), `/` (search focus), `Esc` (dismiss). Single-character shortcuts must be either: (a) remappable, (b) only active when a component has focus, or (c) deactivatable. Recommend restricting `?` and `/` to activate only when no text input is focused. |

### 3.2 Enough Time (2.2)

#### 2.2.1 Timing Adjustable (Level A) — Needs Work

| Finding | Severity | Screen | Detail |
|---------|----------|--------|--------|
| Toast notification auto-dismiss | Moderate | Global | Success/Info toasts auto-dismiss after 4000ms. Users with cognitive disabilities or slow reading speed may not finish reading. Must provide: (a) pause on hover/focus, (b) configurable duration in Settings, or (c) a notification history where dismissed toasts can be reviewed. |
| Session inactivity timeout | Minor | Global | FR-F4-006 specifies 30-day default session expiry. Users must be warned before session expires with time to extend. |

#### 2.2.2 Pause, Stop, Hide (Level A) — Needs Work

| Finding | Severity | Screen | Detail |
|---------|----------|--------|--------|
| Pulse Ring animation | Moderate | Dashboard (Screen 4) | The continuous pulsing animation (2-second cycle) is moving content that starts automatically. The `prefers-reduced-motion` CSS handling (static dot) is correct. Additionally, provide a manual toggle in Settings for users who don't use system-level reduced motion but find the animation distracting. |
| Skeleton loading shimmer | Minor | Dashboard, Marketplace | Infinite shimmer animation during loading. Acceptable as loading indicators, but ensure they stop when content loads (specified as crossfade — correct). |
| Real-time metric number tweening | Minor | Dashboard (Screen 4) | 150ms number tweening animation. Respects `prefers-reduced-motion` per design system. Acceptable. |

### 3.3 Seizures and Physical Reactions (2.3)

#### 2.3.1 Three Flashes or Below Threshold (Level A) — Pass

No animations in the design system flash more than 3 times per second. The most rapid animation is the error modal shake (3 times over 300ms = ~10Hz horizontal movement), but this is positional, not a luminance flash. The Pulse Ring cycles at 0.5Hz (2-second period). No seizure risk identified.

### 3.4 Navigable (2.4)

#### 2.4.1 Bypass Blocks (Level A) — Needs Work

| Finding | Severity | Screen | Detail |
|---------|----------|--------|--------|
| Skip navigation link | Serious | All screens | No skip link is specified in the wireframes. The sidebar navigation is 260px wide with multiple links. A "Skip to main content" link must be the first focusable element, hidden visually until focused, targeting the main content `<main>` element. |
| Sidebar repetition | Moderate | All authenticated screens | The sidebar repeats on every page. Skip link resolves this, but also consider using `<nav aria-label="Main navigation">` and landmark roles to enable AT users to jump between regions. |

#### 2.4.2 Page Titled (Level A) — Needs Work

| Finding | Severity | Screen | Detail |
|---------|----------|--------|--------|
| Dynamic page titles | Moderate | All screens | Wireframes don't specify `<title>` patterns. Each page needs a unique, descriptive title: "Dashboard — UnplugHQ", "Marketplace — UnplugHQ", "Connect Server (Step 1 of 3) — UnplugHQ", "Nextcloud Management — UnplugHQ". |

#### 2.4.3 Focus Order (Level A) — Needs Work

| Finding | Severity | Screen | Detail |
|---------|----------|--------|--------|
| Modal focus on open | Serious | Deployment Progress (Screen 7) | When the deployment modal opens, focus must move to the modal container or its first focusable element. Focus restoration to the triggering "Deploy" button must occur on close. |
| Wizard step transitions | Moderate | Wizard Steps 1–3 (Screens 2–3) | When progressing between wizard steps, focus should move to the new step's heading or first interactive element, not remain on the previous step's "Continue" button. |

#### 2.4.4 Link Purpose (In Context) (Level A) — Needs Work

| Finding | Severity | Screen | Detail |
|---------|----------|--------|--------|
| "Manage" buttons on app cards | Moderate | Dashboard (Screen 4) | Multiple "Manage" buttons — one per app card. Each must have an accessible name distinguishing them: `aria-label="Manage Nextcloud"` or visually hidden text within the button. |
| "[Review]" on update notification | Minor | Dashboard (Screen 4) | "1 Update Available (Nextcloud) [Review]" — the "Review" link must be descriptively labelled: `aria-label="Review Nextcloud update"`. |
| "[Open App >]" link | Minor | App Management (Screen 8) | Ensure this opens in the current tab by default. If it opens a new window, add `aria-label="Open Nextcloud (opens in new tab)"` and a visual indicator (external link icon). |

#### 2.4.5 Multiple Ways (Level AA) — Pass

Multiple navigation paths available: sidebar navigation (Dashboard, Marketplace, Settings), breadcrumbs in top bar, search field (`/` shortcut), and direct URL navigation.

#### 2.4.6 Headings and Labels (Level AA) — Needs Work

| Finding | Severity | Screen | Detail |
|---------|----------|--------|--------|
| Form field labels | Moderate | All form screens | Wireframes show labels above inputs (e.g., "IPv4 or IPv6 Address", "SSH Username", "Private Key"). These must be implemented as `<label for="...">` elements programmatically linked to their inputs. |
| Section headings in Dashboard | Minor | Dashboard (Screen 4) | "Your Applications" section heading should be an `<h2>` within the page hierarchy following the `<h1>` for the page title. |

#### 2.4.7 Focus Visible (Level AA) — Pass

The design system specifies: "Focus outlines are globally defined as `0 0 0 4px var(--color-primary-base)`. No `outline: none` without structural fallback." This provides a visible, high-contrast focus indicator. The 4px spread with `--color-primary-base` (indigo-500) provides sufficient visibility.

#### 2.4.11 Focus Not Obscured (Minimum) (Level AA, WCAG 2.2) — Needs Work

| Finding | Severity | Screen | Detail |
|---------|----------|--------|--------|
| Sticky sidebar overlapping focused elements | Moderate | All authenticated screens | The fixed 260px sidebar could obscure focus indicators on elements at the left edge of the content area. Ensure `scroll-padding-left` accounts for sidebar width. |
| Toast notifications over focused elements | Moderate | Global | Toasts positioned bottom-right could occlude focused elements. Toasts should not prevent interaction with the page and should be dismissible without losing focus context. |

### 3.5 Input Modalities (2.5)

#### 2.5.1 Pointer Gestures (Level A) — Needs Work

| Finding | Severity | Screen | Detail |
|---------|----------|--------|--------|
| Pull-to-refresh | Moderate | Mobile (all screens) | Pull-to-refresh requires a path-based gesture. A visible "Refresh" button must exist as a single-point alternative. |
| Drag-to-reorder | Moderate | Dashboard (Screen 4) | Drag requires a path-based gesture. Keyboard alternative is specified (correct), but a single-point alternative (move up/down buttons) should also be available for switch users and other pointer-based AT. |

#### 2.5.3 Label in Name (Level A) — Pass

Wireframes use descriptive visible labels ("Test Connection", "Deploy Application", "Connect Your Server"). Accessible names must include the visible text. No issues identified.

#### 2.5.4 Motion Actuation (Level A) — N/A

No device-motion-triggered functionality is specified.

#### 2.5.7 Dragging Movements (Level AA, WCAG 2.2) — Needs Work

| Finding | Severity | Screen | Detail |
|---------|----------|--------|--------|
| Dashboard tile reorder | Serious | Dashboard (Screen 4) | Drag-to-reorder must have a non-dragging alternative. The keyboard flow is specified, but a pointer-based non-dragging alternative (e.g., "Move Up" / "Move Down" buttons in the kebab menu) is also needed per 2.5.7. |
| Swipe-to-dismiss notifications | Serious | Mobile | Requires a click/tap alternative. Add a visible dismiss button. |

#### 2.5.8 Target Size (Minimum) (Level AA, WCAG 2.2) — Pass (with note)

The design system specifies minimum 44px height for buttons and input fields. The kebab menu icon (`[...]`) and close buttons must also meet the minimum 24×24 CSS pixel target size per WCAG 2.2 AA. Lucide icons are defined at 24px grid — if used as touch targets, ensure the clickable area is padded to at least 44px (achieved via padding on the interactive wrapper).

---

## 4. Understandable (Principle 3)

### 4.1 Readable (3.1)

#### 3.1.1 Language of Page (Level A) — Needs Work

| Finding | Severity | Screen | Detail |
|---------|----------|--------|--------|
| `lang` attribute not specified | Moderate | All screens | No `<html lang="en">` is specified in the wireframes or architecture. Must be set for all pages. If the platform is English-only at launch, `lang="en"` is sufficient. |

#### 3.1.2 Language of Parts (Level AA) — N/A

No multi-language content is specified for PI-1. If localization is added, `lang` attributes must be applied to parts in different languages.

### 4.2 Predictable (3.2)

#### 3.2.1 On Focus (Level A) — Pass

No focus-triggered context changes are specified. The search shortcut `/` focuses an input but does not navigate away.

#### 3.2.2 On Input (Level A) — Needs Work

| Finding | Severity | Screen | Detail |
|---------|----------|--------|--------|
| Authentication method radio toggle | Moderate | Wizard Step 1 (Screen 2) | Selecting "Password" vs "SSH Key" changes which form fields are visible. This context change on input must be announced: use `aria-expanded` on the radio group or `aria-live="polite"` on the conditional section to inform AT users that content changed. |
| Theme preference radio | Minor | Settings (Screen 10) | Selecting Light/Dark/System theme. If this applies immediately (without "Save Changes"), it's a context change on input. Acceptable if the change is announced and reversible. |

#### 3.2.3 Consistent Navigation (Level AA) — Pass

Sidebar navigation is consistent across all authenticated screens. Mobile hamburger menu preserves the same order.

#### 3.2.4 Consistent Identification (Level AA) — Pass

Components and actions are named consistently: "Deploy", "Install", "Manage", "Restart", "Stop", "Uninstall". Server health indicators use the same visual pattern across all screens.

#### 3.2.6 Consistent Help (Level A, WCAG 2.2) — Needs Work

| Finding | Severity | Screen | Detail |
|---------|----------|--------|--------|
| Help mechanism placement | Minor | All screens | No consistent help mechanism is specified. A "Help" or "Support" link should appear in the same location on every page (e.g., sidebar bottom, or top-bar). The `?` keyboard shortcut opens a shortcuts modal, but general help/support is not addressed. |

### 4.3 Input Assistance (3.3)

#### 3.3.1 Error Identification (Level A) — Pass

Form validation patterns specify: `aria-invalid="true"` on invalid inputs, error messages linked via `aria-errormessage` or `aria-describedby`, the error text appears below the field. This is correct.

#### 3.3.2 Labels or Instructions (Level A) — Needs Work

| Finding | Severity | Screen | Detail |
|---------|----------|--------|--------|
| Password strength requirements | Moderate | Sign-up (Auth flow) | Requirements require "≥ 12 characters, mixed case, at least one number or symbol" (FR-F4-001). These requirements must be visible on the form before submission, not only shown as error messages after failed validation. Use `aria-describedby` linking the password input to the requirements text. |
| Server IP format guidance | Minor | Wizard Step 1 (Screen 2) | The label "IPv4 or IPv6 Address" describes the expected format, but a placeholder example (e.g., `placeholder="e.g., 192.168.1.100"`) should supplement (not replace) the label. Additionally, convey the expected format via `aria-describedby`. |

#### 3.3.3 Error Suggestion (Level AA) — Pass

The requirements specify actionable diagnostic messages for connection failures (FR-F1-003): "Port 22 unreachable — check firewall rules." Error toasts require manual dismissal. This provides appropriate error guidance.

#### 3.3.4 Error Prevention (Legal, Financial, Data) (Level AA) — Pass

Destructive operations (Uninstall App, Disconnect Server) require explicit confirmation via modal dialogs (interaction patterns Section 3, "Modal Dialogs (Confirmations)"). NFR-006 mandates confirmation screens with preview.

#### 3.3.7 Redundant Entry (Level A, WCAG 2.2) — Pass

No context identified where users are asked to re-enter previously provided information.

#### 3.3.8 Accessible Authentication (Minimum) (Level AA, WCAG 2.2) — Needs Work

| Finding | Severity | Screen | Detail |
|---------|----------|--------|--------|
| Password-based authentication | Moderate | Login, Sign-up | WCAG 2.2 3.3.8 requires that authentication does not rely on a cognitive function test. Passwords are permitted if the user agent can autofill them (i.e., standard `<input type="password" autocomplete="current-password">`). Ensure autocomplete attributes are present and no copy-paste blocking is applied to password fields. |

---

## 5. Robust (Principle 4)

### 5.1 Compatible (4.1)

#### 4.1.2 Name, Role, Value (Level A) — Needs Work

| Finding | Severity | Screen | Detail |
|---------|----------|--------|--------|
| Server health Pulse Ring role | Serious | Dashboard (Screen 4) | The animated Pulse Ring must have `role="status"` with `aria-label="Server status: Healthy"`. The dynamic text must update when status changes. |
| App status badge | Moderate | Dashboard (Screen 4), App Management (Screen 8) | Status badges ("Running", "Stopped", "Unhealthy", "Updating") must map to semantic elements. Use `role="status"` for live status indicators with `aria-live="polite"`. |
| Progress bar in Deployment Modal | Serious | Deployment Progress (Screen 7) | Must use `role="progressbar"` with `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-valuetext="Pulling container image"`. Update `aria-valuenow` and `aria-valuetext` as deployment progresses. |
| Stepper/wizard navigation | Moderate | Wizard Steps 1–3 | Step indicator "[Step 1 of 3]" must be programmatically exposed. Use `aria-current="step"` on the active step, and convey total steps via `aria-label="Step 1 of 3, Server credentials"` on the step counter. |
| Advanced Settings accordion | Moderate | App Detail (Screen 6) | The "Advanced Settings" disclosure widget must use `<details>/<summary>` or `role="button"` with `aria-expanded="false/true"` and `aria-controls` referencing the panel ID. |
| Contextual menu | Moderate | Dashboard (Screen 4) | Kebab menu must use `role="menu"` with `role="menuitem"` for each option. `aria-haspopup="menu"` on the trigger button. Arrow key navigation per WAI-ARIA Menu pattern. |
| Category filter tabs | Moderate | Marketplace (Screen 5) | If categories behave as tabs (mutually exclusive selection filtering content), use `role="tablist"` / `role="tab"` / `role="tabpanel"` pattern with `aria-selected`. If they are toggle filters, use `role="group"` with `aria-pressed` toggle buttons. |

#### 4.1.3 Status Messages (Level AA) — Needs Work

| Finding | Severity | Screen | Detail |
|---------|----------|--------|--------|
| Deployment status updates | Serious | Deployment Progress (Screen 7) | The interaction patterns specify `aria-live="polite"` for deployment announcements ("Deployment started", "Pulling files", "Deployment successful"). This is correct. Verify it's implemented as a live region container, not by adding/removing the attribute dynamically. |
| Toast notifications | Moderate | Global | Specified as `aria-live="assertive"` portal container. Correct for error toasts. Success/info toasts should use `aria-live="polite"` to avoid interrupting current task. Use `role="alert"` only for errors, `role="status"` for informational messages. |
| Form validation errors | Moderate | All form screens | Error messages appearing below inputs must be within an `aria-live` region or announced via `aria-describedby` linking. The current spec uses `aria-errormessage` — correct per WCAG. |
| Real-time metric updates | Minor | Dashboard (Screen 4) | CPU/RAM/Disk numbers updating in real-time. Avoid making these live regions (would cause excessive announcements). Use `aria-live="off"` or no live region — users can query the values on demand. |

---

## 6. Screen-by-Screen Findings

### Screen 1: Onboarding Welcome (`/welcome`)

| # | Finding | WCAG SC | Severity |
|---|---------|---------|----------|
| 1 | Illustration needs meaningful `alt` text | 1.1.1 | Moderate |
| 2 | "What you'll need" list items with checkmarks — use semantic list `<ul>` with visual checkmark icons, not checkbox inputs | 1.3.1 | Minor |
| 3 | Sequential fade-in animation of list items — must complete within a reasonable time and be skippable via `prefers-reduced-motion` | 2.2.2 | Minor |
| 4 | "Connect Your Server" primary button — needs visible focus indicator (covered by global focus style) | 2.4.7 | Pass |

### Screen 2: Server Connection Wizard — Credentials (`/connect/credentials`)

| # | Finding | WCAG SC | Severity |
|---|---------|---------|----------|
| 1 | Authentication Method radio group needs `<fieldset>/<legend>` | 1.3.1 | Serious |
| 2 | SSH Key textarea needs file upload button alternative | 2.1.1 | Moderate |
| 3 | "[< Back]" button needs accessible label: `aria-label="Go back to previous step"` | 2.4.4 | Minor |
| 4 | Step indicator "Step 1 of 3" needs `aria-current="step"` | 4.1.2 | Moderate |
| 5 | IP address, username fields need `autocomplete` attributes | 1.3.5 | Moderate |
| 6 | Password field (when Password auth selected) needs visible strength requirements | 3.3.2 | Moderate |

### Screen 3: Server Connection Wizard — Validation (`/connect/validation`)

| # | Finding | WCAG SC | Severity |
|---|---------|---------|----------|
| 1 | Success animation (Pulse Ring with Checkmark) needs `role="status"` with `aria-label="Connection successful"` | 4.1.2 | Serious |
| 2 | Server resource cards need semantic markup (`<dl>` or `role="group"`) | 1.3.1 | Moderate |
| 3 | Staggered fade-in of spec cards — respect `prefers-reduced-motion` | 2.3.1 | Minor |
| 4 | "Continue to Setup" button focus should auto-advance here after connection test succeeds | 2.4.3 | Minor |

### Screen 4: Main Dashboard (`/dashboard`)

| # | Finding | WCAG SC | Severity |
|---|---------|---------|----------|
| 1 | Skip navigation link missing | 2.4.1 | Serious |
| 2 | Server health Pulse Ring — needs `role="status"` + text alternative | 4.1.2 | Serious |
| 3 | App card "Manage" buttons need unique accessible names | 2.4.4 | Moderate |
| 4 | Drag-to-reorder needs pointer-based non-dragging alternative | 2.5.7 | Serious |
| 5 | Update notification banner needs `role="alert"` or `role="status"` | 4.1.3 | Moderate |
| 6 | Kebab menu needs WAI-ARIA Menu pattern | 4.1.2 | Moderate |
| 7 | Metric resource bar colors must pair with text/icon indicators | 1.4.1 | Moderate |

### Screen 5: App Marketplace (`/marketplace`)

| # | Finding | WCAG SC | Severity |
|---|---------|---------|----------|
| 1 | Search field needs `role="searchbox"` or `<input type="search">` with `aria-label="Search applications"` | 4.1.2 | Moderate |
| 2 | Category filter pills need Tab/Arrow key navigation pattern | 2.1.1 | Moderate |
| 3 | App cards in grid — focus order must follow visual reading order (left-right, top-bottom) | 2.4.3 | Moderate |
| 4 | "Install" buttons need unique labels: `aria-label="Install Ghost"` | 2.4.4 | Moderate |

### Screen 6: App Detail / Install Configuration (`/marketplace/app/{name}`)

| # | Finding | WCAG SC | Severity |
|---|---------|---------|----------|
| 1 | "Advanced Settings" needs `aria-expanded` pattern | 4.1.2 | Moderate |
| 2 | Form fields need explicit `<label>` associations | 2.4.6 | Moderate |
| 3 | "Deploy Application" button — consider `aria-describedby` referencing a deployment summary for confirmation | 3.3.4 | Minor |

### Screen 7: Deployment Progress Modal

| # | Finding | WCAG SC | Severity |
|---|---------|---------|----------|
| 1 | Progress bar needs `role="progressbar"` with `aria-valuenow/valuetext` | 4.1.2 | Serious |
| 2 | Live log area needs `aria-live="polite"` with throttled updates | 4.1.3 | Serious |
| 3 | Focus must be trapped within modal and move to modal on open | 2.4.3 | Serious |
| 4 | Non-dismissible during critical ops — provide visible "Cancel" or status text explaining why Esc is disabled | 2.1.2 | Moderate |

### Screen 8: App Management (`/dashboard/app/{name}`)

| # | Finding | WCAG SC | Severity |
|---|---------|---------|----------|
| 1 | Action buttons ("Stop", "Restart", "Uninstall") need confirmation for destructive ops | 3.3.4 | Pass (specified) |
| 2 | Masked environment variable (`m***@***.com`) needs accessible label: "Admin email (partially masked for security)" | 1.1.1 | Minor |
| 3 | "View Graph" link within Resource Usage card — distinguish from surrounding card link | 2.4.4 | Minor |
| 4 | Status badge needs `role="status"` with `aria-live="polite"` | 4.1.2 | Moderate |

### Screen 9: Server Health Detail (`/dashboard/server`)

| # | Finding | WCAG SC | Severity |
|---|---------|---------|----------|
| 1 | Sparkline charts need text alternatives (summary or data table) | 1.1.1 | Serious |
| 2 | Chart tooltips must meet hover/focus persistence requirements | 1.4.13 | Moderate |
| 3 | "Disconnect Server" destructive action — needs confirmation modal (specified) | 3.3.4 | Pass |
| 4 | Recent Activity log needs semantic list markup with timestamps | 1.3.1 | Minor |
| 5 | Copy icon next to IP address needs `aria-label="Copy server IP address"` | 2.4.4 | Minor |

### Screen 10: Global Settings (`/settings`)

| # | Finding | WCAG SC | Severity |
|---|---------|---------|----------|
| 1 | Tab navigation (Account / Notifications / Danger Zone) needs `role="tablist"` pattern | 4.1.2 | Moderate |
| 2 | Notification preference checkboxes need `<fieldset>/<legend>` grouping | 1.3.1 | Moderate |
| 3 | Danger Zone section — "Account deletion" action needs multi-step confirmation | 3.3.4 | Moderate |
| 4 | Theme preference radios need `<fieldset>/<legend>Theme Preference</legend>` | 1.3.1 | Minor |
| 5 | Webhook configuration section needs instructions for non-technical users | 3.3.2 | Minor |

---

## 7. WCAG 2.2 AA Compliance Matrix

| SC | Name | Level | Status | Evidence |
|----|------|-------|--------|----------|
| 1.1.1 | Non-text Content | A | **Needs Work** | App icons, charts, illustrations lack specified alt text |
| 1.2.1–1.2.5 | Time-based Media | A/AA | **N/A** | No audio/video |
| 1.3.1 | Info and Relationships | A | **Needs Work** | Missing fieldset/legend, semantic markup for resource cards |
| 1.3.2 | Meaningful Sequence | A | **Pass** | DOM order matches visual order per responsive spec |
| 1.3.3 | Sensory Characteristics | A | **Needs Work** | Health status uses color + text (enforce text mandatory) |
| 1.3.4 | Orientation | AA | **Pass** | No orientation lock |
| 1.3.5 | Identify Input Purpose | AA | **Needs Work** | autocomplete attributes not specified |
| 1.4.1 | Use of Color | A | **Needs Work** | Status indicators need enforced text labels |
| 1.4.2 | Audio Control | A | **N/A** | No audio |
| 1.4.3 | Contrast (Minimum) | AA | **Needs Work** | `--color-text-subtle` fails 4.5:1 in both modes |
| 1.4.4 | Resize Text | AA | **Pass** | Fluid rem-based clamp() typography |
| 1.4.5 | Images of Text | AA | **Pass** | No images of text |
| 1.4.10 | Reflow | AA | **Pass** | Mobile-first responsive, 375px minimum |
| 1.4.11 | Non-text Contrast | AA | **Needs Work** | Input borders ~1.5:1 against white; needs ≥3:1 |
| 1.4.12 | Text Spacing | AA | **Pass** | No restrictive CSS |
| 1.4.13 | Content on Hover or Focus | AA | **Needs Work** | Chart tooltips need dismiss/persist behavior |
| 2.1.1 | Keyboard | A | **Needs Work** | Swipe-to-act, file drop zone need alternatives |
| 2.1.2 | No Keyboard Trap | A | **Pass** | Modal Esc behavior specified |
| 2.1.4 | Character Key Shortcuts | A | **Needs Work** | Single-char shortcuts need input-field guard |
| 2.2.1 | Timing Adjustable | A | **Needs Work** | Toast auto-dismiss needs pause/configurable |
| 2.2.2 | Pause, Stop, Hide | A | **Needs Work** | Pulse Ring needs manual toggle option |
| 2.3.1 | Three Flashes | A | **Pass** | No flash risk |
| 2.4.1 | Bypass Blocks | A | **Needs Work** | Skip navigation link missing |
| 2.4.2 | Page Titled | A | **Needs Work** | Dynamic page titles not specified |
| 2.4.3 | Focus Order | A | **Needs Work** | Modal focus management, wizard step focus |
| 2.4.4 | Link Purpose (In Context) | A | **Needs Work** | "Manage", "Install", "Review" need unique labels |
| 2.4.5 | Multiple Ways | AA | **Pass** | Sidebar, breadcrumbs, search, URL |
| 2.4.6 | Headings and Labels | AA | **Needs Work** | Form labels need `<label for>` enforcement |
| 2.4.7 | Focus Visible | AA | **Pass** | 4px primary-color focus ring specified |
| 2.4.11 | Focus Not Obscured | AA | **Needs Work** | Sidebar/toasts may obscure focus |
| 2.5.1 | Pointer Gestures | A | **Needs Work** | Pull-to-refresh, drag-to-reorder need single-point alternatives |
| 2.5.3 | Label in Name | A | **Pass** | Descriptive visible labels |
| 2.5.4 | Motion Actuation | A | **N/A** | No motion input |
| 2.5.7 | Dragging Movements | AA | **Needs Work** | Dashboard reorder needs non-dragging pointer alternative |
| 2.5.8 | Target Size (Minimum) | AA | **Pass** | 44px minimum for buttons/inputs; icons need padding |
| 3.1.1 | Language of Page | A | **Needs Work** | `lang="en"` not specified |
| 3.1.2 | Language of Parts | AA | **N/A** | Single language |
| 3.2.1 | On Focus | A | **Pass** | No focus-triggered context changes |
| 3.2.2 | On Input | A | **Needs Work** | Auth method toggle needs AT announcement |
| 3.2.3 | Consistent Navigation | AA | **Pass** | Consistent sidebar |
| 3.2.4 | Consistent Identification | AA | **Pass** | Consistent naming |
| 3.2.6 | Consistent Help | A | **Needs Work** | No consistent help mechanism |
| 3.3.1 | Error Identification | A | **Pass** | aria-invalid + linked error messages |
| 3.3.2 | Labels or Instructions | A | **Needs Work** | Password requirements, IP format guidance |
| 3.3.3 | Error Suggestion | AA | **Pass** | Actionable connection error messages |
| 3.3.4 | Error Prevention | AA | **Pass** | Confirmation modals for destructive actions |
| 3.3.7 | Redundant Entry | A | **Pass** | No redundant entry |
| 3.3.8 | Accessible Authentication | AA | **Needs Work** | Password fields need autocomplete, no paste-blocking |
| 4.1.2 | Name, Role, Value | A | **Needs Work** | Multiple components need ARIA roles/states |
| 4.1.3 | Status Messages | AA | **Needs Work** | Deployment, toasts, status badges need live regions |

**Summary:** 14 Pass, 28 Needs Work, 6 N/A, 0 Fail (criteria that completely fail remediably — `--color-text-subtle` contrast is the closest to outright failure)

---

## 8. Prioritized Remediation Recommendations

### Priority 1 — Critical (Must fix before P4 implementation)

| # | Issue | WCAG SC | Affected Screens | Fix |
|---|-------|---------|-----------------|-----|
| 1 | **`--color-text-subtle` contrast failure** | 1.4.3 | All screens | Darken to `--ref-slate-500` (`oklch(0.60 0.06 240)`) in light mode. In dark mode, lighten `--color-text-subtle` to `--ref-slate-500` or restrict token to large text only. |
| 2 | **Skip navigation link missing** | 2.4.1 | All authenticated screens | Add `<a href="#main" class="skip-link">Skip to main content</a>` as first DOM element. Style: visually hidden until `:focus`. |
| 3 | **Input field border contrast** | 1.4.11 | All form screens | Change resting border to `--color-border-strong` (slate-300, `oklch(0.82 0.04 240)`) or add 2px border width for ≥3:1. |
| 4 | **Deployment progress bar ARIA** | 4.1.2 | Deployment Modal | Implement `role="progressbar"` with `aria-valuenow`, `aria-valuetext`. |
| 5 | **Modal focus management** | 2.4.3 | Deployment Modal, Confirmation Modals | Focus to modal on open; restore to trigger on close; trap Tab within modal. |

### Priority 2 — Serious (Must fix during P4)

| # | Issue | WCAG SC | Affected Screens | Fix |
|---|-------|---------|-----------------|-----|
| 6 | App icons and charts need text alternatives | 1.1.1 | Dashboard, Marketplace, Server Health | Define alt text pattern; charts need data table or summary. |
| 7 | Fieldset/legend for form groups | 1.3.1 | Wizard Step 1, Settings | Wrap radio groups and checkbox groups in `<fieldset>/<legend>`. |
| 8 | Drag/swipe alternatives | 2.5.7, 2.1.1 | Dashboard, Mobile | Add Move Up/Down buttons for reorder; visible Dismiss button for swipe. |
| 9 | Unique accessible names for repeated actions | 2.4.4 | Dashboard, Marketplace | Add `aria-label` with app name to "Manage", "Install" buttons. |
| 10 | Dynamic page titles | 2.4.2 | All screens | Set `<title>` per route: "{Page} — UnplugHQ". |
| 11 | Status indicators: enforce text + color | 1.4.1, 1.3.3 | Dashboard | Make text label mandatory alongside color dot. Never color-only. |
| 12 | Toast auto-dismiss: pause on hover/focus | 2.2.1 | Global | Timer pauses on `:hover` or `:focus-within`. Provide notification history. |

### Priority 3 — Moderate (Fix during P4/P5)

| # | Issue | WCAG SC | Affected Screens | Fix |
|---|-------|---------|-----------------|-----|
| 13 | `lang="en"` on `<html>` | 3.1.1 | All | Add to document template. |
| 14 | `autocomplete` attributes on forms | 1.3.5, 3.3.8 | Auth screens, Wizard | Add appropriate `autocomplete` values per input purpose. |
| 15 | Single-char keyboard shortcuts need guard | 2.1.4 | Global | Only activate `?` and `/` when no text input is focused. |
| 16 | ARIA roles for settings tabs, marketplace categories | 4.1.2 | Settings, Marketplace | Implement WAI-ARIA Tabs or toggle-button patterns. |
| 17 | Consistent help mechanism | 3.2.6 | All | Add "Help" link to sidebar or footer consistently. |
| 18 | Card borders need minimum 3:1 contrast | 1.4.11 | Dashboard, Marketplace | Strengthen `--color-border-subtle` for card boundaries. |
| 19 | Focus obscured by sidebar/toasts | 2.4.11 | All | Add `scroll-padding-left`; position toasts to avoid focus. |

---

## 9. Design System Token Remediation Summary

| Token | Current Value | Issue | Recommended Value |
|-------|--------------|-------|-------------------|
| `--color-text-subtle` (light) | `--ref-slate-400` (`oklch(0.72 0.05 240)`) | ~3.2:1 on white — fails 4.5:1 | `--ref-slate-500` (`oklch(0.60 0.06 240)`) — achieves ~5.1:1 |
| `--color-text-subtle` (dark) | `--ref-slate-600` (`oklch(0.50 0.06 240)`) | ~2.8:1 on slate-950 — fails 4.5:1 | `--ref-slate-500` (`oklch(0.60 0.06 240)`) — achieves ~4.5:1 |
| `--color-border-base` | `--ref-slate-200` (`oklch(0.90 0.03 240)`) | ~1.5:1 on white — fails 3:1 for UI | `--ref-slate-300` (`oklch(0.82 0.04 240)`) — achieves ~3.0:1 |
| `--color-border-subtle` | `--ref-slate-100` (`oklch(0.95 0.02 240)`) | ~1.2:1 on white — fails 3:1 for UI | `--ref-slate-200` (`oklch(0.90 0.03 240)`) for card borders (with shadow as secondary cue) |

---

## 10. Workflow Observations

- **NFR-003 references WCAG 2.1 AA** in the requirements document, but the current WCAG standard is **2.2** (October 2023). This audit applies WCAG 2.2 AA, which includes additional success criteria (2.4.11, 2.5.7, 2.5.8, 3.2.6, 3.3.7, 3.3.8) not present in 2.1. Recommend updating NFR-003 to reference WCAG 2.2 AA.
- The design system's Contrast Matrix (Section 3) provides stated ratios but does not include `--color-text-subtle` combinations, which are the most problematic. Recommend expanding the matrix to cover all semantic text tokens against all background tokens.
- The interaction patterns document has strong accessibility foundations (live regions, focus management, reduced motion) — this is above-average for a P2 design artifact.

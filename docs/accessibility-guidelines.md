---
artifact: accessibility-guidelines
produced-by: accessibility
project-slug: unplughq
work-item: task-179-a11y-wcag-audit-guidelines
work-item-type: task
parent-work-item: epic-001-unplughq-platform
workflow-tier: full
phase: P2
version: 1.0.0
status: draft
consumed-by:
  - frontend-developer
  - backend-developer
  - testing
  - tech-lead
date: 2026-03-14
azure-devops-id: 179
---

# Accessibility Implementation Guidelines — UnplugHQ Platform

## 1. Overview

This document provides developer-facing accessibility implementation guidance for the UnplugHQ platform. Every component, pattern, and screen referenced in this guide maps directly to the UnplugHQ design system (`design-system.md`), wireframes (`wireframes.md`), and interaction patterns (`interaction-patterns.md`).

**Target standard:** WCAG 2.2 Level AA
**Upstream audit:** See `wcag-audit.md` for the full compliance audit and prioritized findings.

---

## 2. ARIA Patterns by Component

### 2.1 Primary Button

The design system defines buttons with Primary, Secondary, Ghost/Tertiary, and Destructive variants (Section 8). All buttons use a minimum 44px touch target.

```html
<!-- Primary Button -->
<button
  type="button"
  class="btn btn-primary"
  aria-label="Deploy Nextcloud"
>
  Deploy Application
</button>

<!-- Loading State -->
<button
  type="button"
  class="btn btn-primary"
  aria-label="Deploying Nextcloud"
  aria-busy="true"
  disabled
>
  <span class="sr-only">Deploying…</span>
  <span class="btn-spinner" aria-hidden="true"></span>
</button>

<!-- Destructive Button (requires confirmation modal) -->
<button
  type="button"
  class="btn btn-destructive"
  aria-label="Uninstall Nextcloud"
  aria-haspopup="dialog"
>
  Uninstall
</button>
```

**Rules:**
- Never use `<div>` or `<span>` as button replacements. Always use `<button>` or `<a>` for interactive elements.
- Loading state: set `aria-busy="true"` and `disabled`. Swap visible text for spinner with `aria-hidden="true"`. Provide `sr-only` text with action in progress.
- Destructive buttons must trigger a confirmation modal (`aria-haspopup="dialog"`).

### 2.2 App Card (Dashboard & Marketplace)

Used on Dashboard (Screen 4) and Marketplace (Screen 5). Cards contain: app icon, title, status/description, action button, and kebab menu.

```html
<article
  class="app-card"
  aria-label="Nextcloud — Running"
>
  <img
    src="/icons/nextcloud.svg"
    alt="Nextcloud logo"
    width="48"
    height="48"
  />
  <h3 class="app-card__title">Nextcloud</h3>
  <span class="app-card__status" role="status" aria-live="polite">
    <span class="status-dot status-dot--healthy" aria-hidden="true"></span>
    Running
  </span>
  <a href="https://files.my.dev" class="app-card__link" aria-label="Open Nextcloud at files.my.dev">
    https://files.my.dev
  </a>
  <div class="app-card__actions">
    <a href="/dashboard/app/nextcloud" class="btn btn-secondary" aria-label="Manage Nextcloud">
      Manage
    </a>
    <button
      type="button"
      class="btn btn-ghost btn-icon"
      aria-label="More actions for Nextcloud"
      aria-haspopup="menu"
      aria-expanded="false"
      aria-controls="menu-nextcloud"
    >
      <span aria-hidden="true">⋯</span>
    </button>
  </div>
</article>
```

**Rules:**
- Use `<article>` with `aria-label="{App Name} — {Status}"` for each card.
- App icon: `alt="{App Name} logo"`. If purely decorative (e.g., placeholder), use `alt=""` with `role="presentation"`.
- Status text must be visible alongside the status dot. The dot is `aria-hidden="true"` — the text carries the accessible meaning.
- "Manage" and kebab buttons must include the app name in `aria-label` to distinguish them when multiple cards are present.

### 2.3 Contextual Menu (Kebab)

Triggered from the kebab button (`[...]`) on Dashboard app cards (Screen 4).

```html
<div class="menu-wrapper" role="presentation">
  <button
    type="button"
    class="btn btn-ghost btn-icon"
    aria-label="More actions for Nextcloud"
    aria-haspopup="menu"
    aria-expanded="false"
    aria-controls="menu-nextcloud"
    id="trigger-nextcloud"
  >
    <span aria-hidden="true">⋯</span>
  </button>

  <ul
    id="menu-nextcloud"
    role="menu"
    aria-labelledby="trigger-nextcloud"
    hidden
  >
    <li role="none">
      <button role="menuitem" type="button">Start</button>
    </li>
    <li role="none">
      <button role="menuitem" type="button">Stop</button>
    </li>
    <li role="none">
      <button role="menuitem" type="button">Restart</button>
    </li>
    <li role="separator" aria-hidden="true"></li>
    <li role="none">
      <button role="menuitem" type="button" class="menu-item--destructive">
        Uninstall
      </button>
    </li>
  </ul>
</div>
```

**Keyboard interaction:**
| Key | Action |
|-----|--------|
| Enter / Space | Open menu (from trigger) or activate focused item |
| ArrowDown | Move focus to next menu item |
| ArrowUp | Move focus to previous menu item |
| Home | Move focus to first menu item |
| End | Move focus to last menu item |
| Escape | Close menu, return focus to trigger button |
| Tab | Close menu, move focus to next focusable element |

### 2.4 Modal Dialog (Confirmation)

Used for destructive actions: "Uninstall App", "Disconnect Server" (interaction patterns Section 3).

```html
<div
  class="modal-backdrop"
  aria-hidden="true"
></div>

<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-desc"
  class="modal"
>
  <h2 id="modal-title">Uninstall Nextcloud?</h2>
  <p id="modal-desc">
    This will stop the application and remove its container. Your data
    on the server will not be deleted, but the app will no longer be
    accessible via its URL.
  </p>
  <div class="modal__actions">
    <button type="button" class="btn btn-secondary" data-action="cancel">
      Cancel
    </button>
    <button type="button" class="btn btn-destructive" data-action="confirm">
      Uninstall
    </button>
  </div>
</div>
```

**Focus management:**
1. On open: move focus to "Cancel" button (safest default for destructive modals).
2. Focus trap: Tab cycles only through focusable elements within the modal.
3. Escape: closes modal (unless deployment in progress — see Deployment Modal below).
4. On close: return focus to the element that triggered the modal.

### 2.5 Deployment Progress Modal

Used during app deployment (Screen 7). Non-dismissible during critical operations.

```html
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="deploy-title"
  aria-describedby="deploy-status"
  class="modal modal--progress"
>
  <h2 id="deploy-title">Deploying Nextcloud…</h2>

  <div
    role="progressbar"
    aria-valuenow="45"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuetext="Pulling container image"
    aria-label="Deployment progress"
    class="progress-bar"
  >
    <div class="progress-bar__fill" style="width: 45%"></div>
  </div>

  <p id="deploy-status" aria-live="polite">
    Current task: Pulling container image 'nextcloud:latest'
  </p>

  <div class="deploy-log" aria-label="Deployment log" role="log" aria-live="polite">
    <p>Fetching blob 827364...</p>
    <p>Extracting fs layer...</p>
  </div>

  <button
    type="button"
    class="btn btn-secondary"
    aria-label="Cancel deployment"
  >
    Cancel
  </button>
</div>
```

**Rules:**
- Update `aria-valuenow` and `aria-valuetext` as phases advance.
- The log region uses `role="log"` which implies `aria-live="polite"` — AT announces new entries without interrupting.
- Throttle log updates to avoid overwhelming screen readers (max 1 announcement per 3 seconds).
- If Escape is disabled during critical ops, the "Cancel" button must remain accessible.

### 2.6 Navigation Sidebar

Fixed sidebar (260px, collapses below 1024px) present on all authenticated screens.

```html
<a href="#main" class="skip-link">Skip to main content</a>

<nav aria-label="Main navigation" class="sidebar">
  <a href="/" class="sidebar__logo" aria-label="UnplugHQ Home">
    <img src="/logo.svg" alt="UnplugHQ" />
  </a>

  <ul class="sidebar__nav" role="list">
    <li>
      <a href="/dashboard" aria-current="page" class="nav-link nav-link--active">
        <svg aria-hidden="true" class="nav-icon"><!-- Dashboard icon --></svg>
        Dashboard
      </a>
    </li>
    <li>
      <a href="/marketplace" class="nav-link">
        <svg aria-hidden="true" class="nav-icon"><!-- Marketplace icon --></svg>
        Marketplace
      </a>
    </li>
    <li>
      <a href="/settings" class="nav-link">
        <svg aria-hidden="true" class="nav-icon"><!-- Settings icon --></svg>
        Settings
      </a>
    </li>
  </ul>

  <div class="sidebar__server-status" role="status" aria-label="Server status">
    <span class="status-dot status-dot--healthy" aria-hidden="true"></span>
    <span class="sr-only">Server status: </span>Healthy — 192.168.1.1
  </div>

  <a href="/logout" class="sidebar__logout">Log out</a>
</nav>

<main id="main" tabindex="-1">
  <!-- Page content -->
</main>
```

**Rules:**
- Skip link is the first focusable DOM element. Visually hidden until focused.
- `aria-current="page"` on the active navigation link.
- Nav icons are decorative (`aria-hidden="true"`) — the link text carries meaning.
- Server status section uses `role="status"` for dynamic updates.
- `<main>` has `tabindex="-1"` to receive programmatic focus from the skip link.

### 2.7 Toast Notifications

Global notification system (interaction patterns Section 3). Bottom-right on desktop, top-center on mobile.

```html
<!-- Toast container — always in DOM, never removed -->
<div
  class="toast-container"
  aria-live="polite"
  aria-relevant="additions"
  role="region"
  aria-label="Notifications"
>
  <!-- Success toast -->
  <div class="toast toast--success" role="status">
    <svg aria-hidden="true" class="toast__icon"><!-- Check icon --></svg>
    <div class="toast__content">
      <strong>Success:</strong> Backup completed for Nextcloud.
    </div>
    <button
      type="button"
      class="toast__dismiss"
      aria-label="Dismiss notification"
    >
      <svg aria-hidden="true"><!-- Close icon --></svg>
    </button>
  </div>

  <!-- Error toast (persistent, not auto-dismissed) -->
  <div class="toast toast--error" role="alert">
    <svg aria-hidden="true" class="toast__icon"><!-- Alert icon --></svg>
    <div class="toast__content">
      <strong>Error:</strong> Deployment failed — container health check timed out.
    </div>
    <button
      type="button"
      class="toast__dismiss"
      aria-label="Dismiss error notification"
    >
      <svg aria-hidden="true"><!-- Close icon --></svg>
    </button>
  </div>
</div>
```

**Rules:**
- Success/Info: use `role="status"` (polite). Error: use `role="alert"` (assertive).
- The container is a permanent DOM element. Toasts are inserted as children — the `aria-live` on the container announces them.
- Never add `aria-live` directly on the toast element. Use the container.
- Include text prefix ("Success:", "Error:", "Warning:", "Info:") to avoid relying on icon color alone (WCAG 1.4.1).
- Auto-dismiss timer (4s for success/info) must pause on `:hover` and `:focus-within`.

### 2.8 Form Controls

Used across Server Connection Wizard (Screens 2–3), App Install (Screen 6), Settings (Screen 10), and Auth screens.

```html
<!-- Standard text input with label -->
<div class="form-field">
  <label for="server-ip" class="form-label">
    IPv4 or IPv6 Address
    <span class="form-label__required" aria-hidden="true">*</span>
  </label>
  <input
    id="server-ip"
    type="text"
    class="form-input"
    required
    autocomplete="off"
    aria-describedby="server-ip-hint"
    aria-invalid="false"
    placeholder="e.g., 192.168.1.100"
  />
  <span id="server-ip-hint" class="form-hint">
    Enter the public IP address of your VPS
  </span>
</div>

<!-- Error state -->
<div class="form-field form-field--error">
  <label for="server-ip-err" class="form-label">
    IPv4 or IPv6 Address
    <span class="form-label__required" aria-hidden="true">*</span>
  </label>
  <input
    id="server-ip-err"
    type="text"
    class="form-input"
    required
    aria-invalid="true"
    aria-describedby="server-ip-err-msg"
    value="not-an-ip"
  />
  <span id="server-ip-err-msg" class="form-error" role="alert">
    Enter a valid IPv4 or IPv6 address (e.g., 192.168.1.100)
  </span>
</div>

<!-- Radio group with fieldset -->
<fieldset class="form-fieldset">
  <legend class="form-legend">Authentication Method</legend>
  <div class="form-radio">
    <input type="radio" id="auth-password" name="auth-method" value="password" />
    <label for="auth-password">Password</label>
  </div>
  <div class="form-radio">
    <input type="radio" id="auth-ssh" name="auth-method" value="ssh" checked />
    <label for="auth-ssh">SSH Key (Recommended)</label>
  </div>
</fieldset>

<!-- Checkbox group -->
<fieldset class="form-fieldset">
  <legend class="form-legend">Notification Preferences</legend>
  <div class="form-checkbox">
    <input type="checkbox" id="notify-backup" name="notifications" checked />
    <label for="notify-backup">Email me about failed backups</label>
  </div>
  <div class="form-checkbox">
    <input type="checkbox" id="notify-updates" name="notifications" checked />
    <label for="notify-updates">Email me about system updates</label>
  </div>
  <div class="form-checkbox">
    <input type="checkbox" id="notify-digest" name="notifications" />
    <label for="notify-digest">Send weekly digest</label>
  </div>
</fieldset>

<!-- Password with visible requirements -->
<div class="form-field">
  <label for="password" class="form-label">
    Password
    <span class="form-label__required" aria-hidden="true">*</span>
  </label>
  <input
    id="password"
    type="password"
    class="form-input"
    required
    autocomplete="new-password"
    aria-describedby="password-requirements"
    minlength="12"
  />
  <div id="password-requirements" class="form-hint">
    Minimum 12 characters. Must include uppercase, lowercase, and at least
    one number or symbol.
  </div>
</div>
```

**Rules:**
- Every `<input>` must have a visible `<label>` with matching `for`/`id`.
- Required fields: use `required` attribute. Asterisk is `aria-hidden="true"` (the `required` attribute conveys the semantic).
- Error messages: use `aria-invalid="true"` + `aria-describedby` pointing to the error message element.
- Radio groups and checkbox groups: always wrap in `<fieldset>` with `<legend>`.
- Password fields: `autocomplete="current-password"` for login, `autocomplete="new-password"` for registration. Never block paste.
- Hint text: link via `aria-describedby`. Keep default `aria-describedby` for both hints and errors (combine IDs space-separated if both are visible).

### 2.9 Wizard / Stepper

Server connection wizard (Screens 2–3) uses a 3-step progression.

```html
<nav aria-label="Wizard progress" class="stepper">
  <ol class="stepper__list">
    <li class="stepper__step stepper__step--complete">
      <span class="stepper__indicator" aria-hidden="true">✓</span>
      <span class="stepper__label">Credentials</span>
    </li>
    <li class="stepper__step stepper__step--current" aria-current="step">
      <span class="stepper__indicator" aria-hidden="true">2</span>
      <span class="stepper__label">Validation</span>
    </li>
    <li class="stepper__step">
      <span class="stepper__indicator" aria-hidden="true">3</span>
      <span class="stepper__label">Setup</span>
    </li>
  </ol>
</nav>

<!-- Screen reader announcement on step change -->
<div aria-live="polite" class="sr-only" id="step-announcement">
  Step 2 of 3: Validation — Connection successful
</div>
```

**Rules:**
- Use `<ol>` (ordered list) to convey step sequence.
- `aria-current="step"` on the active step only.
- On step transition, update the `aria-live="polite"` announcement region with step number and title.
- Move focus to the new step's primary heading or first interactive element.

### 2.10 Tab Navigation (Settings Page)

Settings page (Screen 10) uses horizontal tabs: Account / Notifications / Danger Zone.

```html
<div class="tabs">
  <div role="tablist" aria-label="Settings sections">
    <button
      role="tab"
      id="tab-account"
      aria-selected="true"
      aria-controls="panel-account"
      tabindex="0"
    >
      Account
    </button>
    <button
      role="tab"
      id="tab-notifications"
      aria-selected="false"
      aria-controls="panel-notifications"
      tabindex="-1"
    >
      Notifications
    </button>
    <button
      role="tab"
      id="tab-dangerzone"
      aria-selected="false"
      aria-controls="panel-dangerzone"
      tabindex="-1"
    >
      Danger Zone
    </button>
  </div>

  <div role="tabpanel" id="panel-account" aria-labelledby="tab-account" tabindex="0">
    <!-- Account content -->
  </div>
  <div role="tabpanel" id="panel-notifications" aria-labelledby="tab-notifications" tabindex="0" hidden>
    <!-- Notifications content -->
  </div>
  <div role="tabpanel" id="panel-dangerzone" aria-labelledby="tab-dangerzone" tabindex="0" hidden>
    <!-- Danger Zone content -->
  </div>
</div>
```

**Keyboard interaction:**
| Key | Action |
|-----|--------|
| ArrowRight | Move focus to next tab |
| ArrowLeft | Move focus to previous tab |
| Home | Move focus to first tab |
| End | Move focus to last tab |
| Enter / Space | Activate focused tab (if manual activation) |
| Tab | Move focus into the active panel content |

### 2.11 Accordion / Disclosure (Advanced Settings)

Used on App Detail screen (Screen 6) for "Advanced Settings".

```html
<div class="disclosure">
  <button
    type="button"
    class="disclosure__trigger"
    aria-expanded="false"
    aria-controls="advanced-settings"
  >
    <svg aria-hidden="true" class="disclosure__icon"><!-- Chevron --></svg>
    Advanced Settings
  </button>
  <div id="advanced-settings" class="disclosure__panel" hidden>
    <!-- Advanced configuration fields -->
  </div>
</div>
```

**Rules:**
- Toggle `aria-expanded` between `"true"` and `"false"`.
- Toggle `hidden` attribute on the panel.
- Enter/Space activates the trigger button.
- Chevron icon is decorative (`aria-hidden="true"`) — `aria-expanded` conveys the state.

### 2.12 Server Health Pulse Ring

The signature visual element (design system Section 1, interaction patterns Section 2).

```html
<div class="pulse-ring" role="status" aria-label="Server status: Healthy">
  <span class="pulse-ring__dot pulse-ring__dot--healthy" aria-hidden="true"></span>
  <span class="pulse-ring__ring" aria-hidden="true"></span>
  <span class="sr-only">Server status: Healthy</span>
</div>
```

**Rules:**
- The entire visual animation is `aria-hidden`. Only the `sr-only` text matters to AT.
- Update both `aria-label` and the `sr-only` text when status changes dynamically.
- Status values: "Healthy", "Deploying", "Needs Attention", "Offline".
- The `role="status"` ensures AT is notified of changes politely.

### 2.13 Search Input (Marketplace)

Search field on Marketplace (Screen 5) with keyboard shortcut `/`.

```html
<div class="search-wrapper">
  <label for="app-search" class="sr-only">Search applications</label>
  <input
    type="search"
    id="app-search"
    class="search-input"
    placeholder="Search for apps, e.g., 'Email', 'Notes'…"
    aria-label="Search applications"
    aria-describedby="search-shortcut"
    autocomplete="off"
  />
  <kbd id="search-shortcut" class="search-shortcut" aria-hidden="true">/</kbd>
</div>
```

**Rules:**
- Use `type="search"` for semantics and native clear button support.
- Provide a `<label>` (visible or `sr-only`) linked to the input.
- The `/` shortcut indicator is purely visual (`aria-hidden`).
- Results should be announced via `aria-live="polite"` region: "5 applications found" or "No results".

---

## 3. Keyboard Interaction Matrix

Every interactive element in UnplugHQ mapped to expected keyboard behavior.

| Component | Enter | Space | Tab | Shift+Tab | Arrow Keys | Escape | Home/End |
|-----------|-------|-------|-----|-----------|------------|--------|----------|
| **Button** | Activate | Activate | Next focus | Prev focus | — | — | — |
| **Link** | Navigate | — | Next focus | Prev focus | — | — | — |
| **Text Input** | Submit form (if only input) | Type space | Next focus | Prev focus | Move cursor | — | Move to start/end |
| **Checkbox** | Toggle | Toggle | Next focus | Prev focus | — | — | — |
| **Radio (in group)** | Select | Select | Leave group | Leave group | Navigate options | — | First/last option |
| **Tab (in tablist)** | Activate tab | Activate tab | Enter panel | — | Next/prev tab | — | First/last tab |
| **Menu Item** | Activate | Activate | Close menu | — | Next/prev item | Close menu | First/last item |
| **Modal** | — | — | Cycle within | Cycle within | — | Close modal | — |
| **Accordion Trigger** | Toggle panel | Toggle panel | Next focus | Prev focus | — | — | — |
| **Drag Reorder** | — | Grab/drop | Next focus | Prev focus | Move item | Cancel move | — |
| **Search Input** | Search | Type space | Next focus | Prev focus | — | Clear/deselect | — |
| **Toast Dismiss** | Dismiss | Dismiss | Next focus | Prev focus | — | Dismiss all | — |
| **Skip Link** | Jump to main | Jump to main | Next focus | — | — | — | — |

---

## 4. Focus Management Patterns

### 4.1 Skip Navigation Link

```css
.skip-link {
  position: absolute;
  top: -100%;
  left: var(--space-4);
  z-index: 9999;
  padding: var(--space-2) var(--space-4);
  background: var(--color-primary-base);
  color: var(--color-on-primary);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm-fs);
  text-decoration: none;
}

.skip-link:focus {
  top: var(--space-2);
}
```

**Implementation:** Place `<a href="#main" class="skip-link">Skip to main content</a>` as the very first child of `<body>`. Target element `<main id="main" tabindex="-1">`.

### 4.2 Modal Focus Trap

```typescript
function trapFocus(modal: HTMLElement) {
  const focusableSelectors = [
    'a[href]', 'button:not([disabled])', 'textarea:not([disabled])',
    'input:not([disabled])', 'select:not([disabled])', '[tabindex]:not([tabindex="-1"])'
  ].join(', ');

  const focusableElements = modal.querySelectorAll(focusableSelectors);
  const first = focusableElements[0] as HTMLElement;
  const last = focusableElements[focusableElements.length - 1] as HTMLElement;

  modal.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}
```

**Focus restoration pattern:**
```typescript
let previousFocus: HTMLElement | null = null;

function openModal(modal: HTMLElement) {
  previousFocus = document.activeElement as HTMLElement;
  modal.removeAttribute('hidden');
  const firstFocusable = modal.querySelector<HTMLElement>('[autofocus], button, [href], input');
  firstFocusable?.focus();
  trapFocus(modal);
}

function closeModal(modal: HTMLElement) {
  modal.setAttribute('hidden', '');
  previousFocus?.focus();
  previousFocus = null;
}
```

### 4.3 Wizard Step Focus

When transitioning between wizard steps (Screens 2–3):

```typescript
function advanceWizardStep(nextStepEl: HTMLElement) {
  // Update step announcement
  const announcement = document.getElementById('step-announcement');
  if (announcement) {
    announcement.textContent = `Step ${stepNumber} of 3: ${stepTitle}`;
  }

  // Move focus to the new step's heading
  const heading = nextStepEl.querySelector<HTMLElement>('h1, h2, [data-step-heading]');
  if (heading) {
    heading.setAttribute('tabindex', '-1');
    heading.focus();
  }
}
```

### 4.4 Focus Indicators

The design system specifies: `box-shadow: 0 0 0 4px var(--color-primary-base)`.

```css
/* Global focus style */
:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-bg-base), 0 0 0 4px var(--color-primary-base);
}

/* Ensure high contrast in both modes */
[data-theme="dark"] :focus-visible {
  box-shadow: 0 0 0 2px var(--color-bg-base), 0 0 0 4px var(--color-primary-base);
}

/* Never remove focus outlines globally */
/* ❌ NEVER: *:focus { outline: none } */
/* ✅ Only use :focus-visible to style focus */
```

**Rules:**
- Use `:focus-visible` (not `:focus`) to avoid showing focus rings on mouse clicks.
- The 2px inner ring (`--color-bg-base`) creates separation between the focus indicator and the element.
- Minimum 4px total spread for visibility.
- Never suppress focus styles on any interactive element.

---

## 5. Color & Contrast Implementation

### 5.1 Contrast Requirements Per Token

Reference the design system OKLCH tokens (Section 2). Below are the minimum contrast requirements per token pairing:

| Foreground Token | Background Token | Min Ratio | Use Case |
|-----------------|-----------------|-----------|----------|
| `--color-text-base` | `--color-bg-base` | 4.5:1 (actual: 13.8:1) | Primary body text |
| `--color-text-base` | `--color-bg-surface` | 4.5:1 (actual: ~12.5:1) | Text on surface cards |
| `--color-text-muted` | `--color-bg-base` | 4.5:1 (actual: 5.1:1) | Secondary text, timestamps |
| `--color-text-subtle` | `--color-bg-base` | 4.5:1 | **ACTION REQUIRED:** Increase to `--ref-slate-500` (see §5.2) |
| `--color-on-primary` | `--color-primary-base` | 4.5:1 (actual: 6.2:1) | Button text on indigo |
| `--color-success-text` | `--color-success-subtle` | 4.5:1 (actual: 5.8:1) | Healthy status badges |
| `--color-warning-text` | `--color-warning-subtle` | 4.5:1 | Verify — amber-800 on amber-050 |
| `--color-critical-text` | `--color-critical-subtle` | 4.5:1 (actual: 6.1:1) | Error messages, critical badges |

**UI component contrast (non-text):** All borders, form controls, and icons must achieve ≥3:1 against their adjacent background.

### 5.2 Token Remediation (from WCAG Audit)

The following tokens must be adjusted before implementation begins:

```css
/* LIGHT MODE — fix --color-text-subtle */
:root {
  /* BEFORE: --color-text-subtle: var(--ref-slate-400);  ~3.2:1 FAILS */
  --color-text-subtle: var(--ref-slate-500); /* oklch(0.60 0.06 240) ~5.1:1 PASSES */

  /* BEFORE: --color-border-base: var(--ref-slate-200);  ~1.5:1 FAILS for UI */
  --color-border-base: var(--ref-slate-300); /* oklch(0.82 0.04 240) ~3.0:1 PASSES */
}

/* DARK MODE — fix --color-text-subtle */
[data-theme="dark"] {
  /* BEFORE: --color-text-subtle: var(--ref-slate-600);  ~2.8:1 FAILS */
  --color-text-subtle: var(--ref-slate-500); /* oklch(0.60 0.06 240) ~4.5:1 PASSES */
}
```

### 5.3 Color-Independent Status Indication

Never rely on color alone. Every status indicator must pair color with at least one other visual cue:

| Status | Color Token | Required Additional Cue |
|--------|-------------|------------------------|
| Healthy / Running | `--color-success-base` (emerald-500) | Text "Healthy" or "Running" |
| Deploying | `--color-primary-base` (indigo-500) | Text "Deploying" + spinner |
| Needs Attention | `--color-warning-base` (amber-500) | Text "Needs Attention" + triangle icon |
| Offline / Stopped | `--color-critical-base` (rose-500) | Text "Offline" or "Stopped" + solid dot (no pulse) |
| Error | `--color-critical-base` (rose-500) | Text prefix "Error:" + cross icon |

---

## 6. Motion & Reduced Motion

### 6.1 Design System Animation Tokens

The design system defines (Section 7):
- `--dur-fast: 150ms` — exits, micro-interactions
- `--dur-base: 250ms` — standard enters, state changes
- `--dur-slow: 400ms` — complex transitions
- `--ease-spring` — spring approximation for interactive feel

### 6.2 Reduced Motion Implementation

```css
@media (prefers-reduced-motion: reduce) {
  /* Disable all animations and transitions */
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Pulse Ring becomes static dot */
  .pulse-ring__ring {
    display: none;
  }

  /* Skeleton shimmer becomes static gray */
  .skeleton {
    animation: none;
    background: var(--ref-slate-100);
  }

  /* Progress bar: instant fill, no easing */
  .progress-bar__fill {
    transition: none;
  }

  /* Toast: instant show/hide */
  .toast {
    transform: none;
    opacity: 1;
  }

  /* Modal: instant show/hide */
  .modal {
    transform: none;
    opacity: 1;
  }
}
```

**Rules:**
- Use `0.01ms` instead of `0ms` to avoid breaking animation event listeners.
- `prefers-reduced-motion: reduce` applies to ALL animations. Do not check `no-preference`.
- Keep opacity transitions at most 150ms even in reduced-motion mode for smooth appearance.
- Additionally offer a Settings toggle ("Reduce animations") for users who need it but haven't configured their OS.

### 6.3 Animations That Must Respect Reduced Motion

| Animation | Normal Behavior | Reduced Motion Behavior |
|-----------|----------------|------------------------|
| Pulse Ring | 2s cycling scale + fade | Static dot |
| Skeleton shimmer | Infinite gradient slide | Static background |
| Modal enter/exit | Scale 0.95→1.0 + fade (250ms) | Instant show/hide |
| Toast slide-in | translateX/Y + fade (250ms) | Instant show |
| Progress bar fill | Smooth width transition | Instant width |
| Staggered list fade-in | Sequential opacity (250ms per item) | Instant all visible |
| Error modal shake | ±4px horizontal 3× (300ms) | No shake |
| Chart number tweening | 150ms smooth count | Instant number update |
| Drag-to-reorder lift | Scale 1→1.02, shadow L3 | No scale change, outline instead |

---

## 7. Screen Reader Considerations

### 7.1 Live Regions

| Region | `aria-live` | `role` | Location | Content |
|--------|------------|--------|----------|---------|
| Toast container | `polite` | `region` | Global DOM (always present) | Success/info toasts inserted as children |
| Error toast | — (inherits) | `alert` | Inside toast container | Urgent error messages |
| Server status | `polite` | `status` | Sidebar + Dashboard | "Server status: Healthy" |
| App status | `polite` | `status` | App card, App management | "Running", "Stopped", etc. |
| Deployment progress | `polite` | — | Deployment modal `<p>` | "Current task: Pulling image…" |
| Deployment log | `polite` | `log` | Deployment modal log area | Streaming log entries |
| Wizard step | `polite` | — | Hidden announcement div | "Step 2 of 3: Validation" |
| Search results count | `polite` | `status` | Below search input | "5 applications found" |
| Form errors | — | `alert` | Below form fields | Validation error messages |

**Rules:**
- Live regions must exist in the DOM before content is injected. Do not add `aria-live` dynamically.
- Throttle rapid updates (metrics, logs) to max 1 announcement per 3 seconds.
- CPU/RAM/Disk metrics are NOT live regions — they update too frequently. Users query on demand.

### 7.2 Reading Order per Screen

| Screen | Expected Reading Order |
|--------|----------------------|
| Dashboard | Skip link → Sidebar nav → Server status → Alert banner (if any) → Server metrics → App cards (grid L→R, top→bottom) |
| Marketplace | Skip link → Sidebar nav → Page title → Search → Category filters → App cards grid |
| Wizard Step 1 | Back button → Step indicator → Page heading → Form fields (top→bottom) → Submit button |
| Deployment Modal | Modal title → Progress bar → Current task → Log → Cancel button |
| Settings | Skip link → Sidebar nav → Tab list → Active tab panel content |
| App Management | Skip link → Sidebar nav → App title + status → Action buttons → Resource panels → Environment variables |

### 7.3 Visually Hidden Utility Class

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

/* Allow element to be visible when focused (for skip links) */
.sr-only-focusable:focus,
.sr-only-focusable:focus-within {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  clip-path: none;
  white-space: normal;
}
```

---

## 8. Form Accessibility Patterns

### 8.1 Label Associations

Every form input must have an associated label. Three patterns, in order of preference:

1. **Explicit label** (preferred): `<label for="input-id">Label text</label>` + `<input id="input-id">`
2. **Wrapping label** (acceptable): `<label>Label text <input></label>`
3. **`aria-label`** (last resort, for icon-only controls): `<button aria-label="Close">`

### 8.2 Error Messaging Pattern

```html
<div class="form-field form-field--error">
  <label for="domain" class="form-label">Subdomain / URL</label>
  <input
    id="domain"
    type="text"
    class="form-input"
    aria-invalid="true"
    aria-describedby="domain-error"
    value="not a domain"
  />
  <p id="domain-error" class="form-error" role="alert">
    Enter a valid domain (e.g., files.mydomain.com)
  </p>
</div>
```

**Rules:**
- Set `aria-invalid="true"` when validation fails.
- Error message linked via `aria-describedby`.
- Error message uses `role="alert"` for immediate announcement.
- On blur validation: announce error immediately. On submit: focus the first invalid field.
- Error message text must describe the error AND suggest correction.

### 8.3 Required Field Pattern

```html
<label for="admin-email" class="form-label">
  Admin Email
  <span class="form-label__required" aria-hidden="true">*</span>
</label>
<input
  id="admin-email"
  type="email"
  required
  autocomplete="email"
  class="form-input"
/>
```

**Rules:**
- The asterisk is visual-only (`aria-hidden="true"`). The `required` HTML attribute conveys the semantic requirement to AT.
- Provide a form-level legend: "Fields marked with * are required" — visible once per form.
- Do not use `aria-required="true"` when the native `required` attribute is present.

### 8.4 Autocomplete Attribute Map

Per WCAG 1.3.5 (Identify Input Purpose) and 3.3.8 (Accessible Authentication):

| Field | Screen | `autocomplete` Value |
|-------|--------|---------------------|
| Email (login) | Login | `email` |
| Password (login) | Login | `current-password` |
| Email (sign-up) | Sign-up | `email` |
| Password (sign-up) | Sign-up | `new-password` |
| Display name | Settings | `name` |
| Email (settings) | Settings | `email` |
| SSH Username | Wizard Step 1 | `username` |
| Server IP | Wizard Step 1 | `off` (no standard purpose) |
| Admin Email (app deploy) | App Install | `email` |

---

## 9. Data Visualization Accessibility

### 9.1 Sparkline Charts (Server Health — Screen 9)

Charts display CPU usage and RAM usage over 24 hours. Per WCAG 1.1.1, charts must have text alternatives.

```html
<figure class="chart" role="img" aria-label="CPU usage over the last 24 hours. Average: 12%, peak: 45% at 10:00 AM">
  <svg class="chart__sparkline" aria-hidden="true">
    <!-- Sparkline path -->
  </svg>
  <figcaption class="sr-only">
    CPU usage over the last 24 hours. Average utilization: 12%.
    Peak utilization: 45% at 10:00 AM.
    Current utilization: 8%.
  </figcaption>
</figure>

<!-- Alternative: data table for detailed access -->
<details class="chart-data-toggle">
  <summary>View CPU data as table</summary>
  <table class="chart-data-table">
    <caption>CPU usage readings — last 24 hours</caption>
    <thead>
      <tr>
        <th scope="col">Time</th>
        <th scope="col">CPU Usage (%)</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>12:00 AM</td><td>5%</td></tr>
      <tr><td>4:00 AM</td><td>3%</td></tr>
      <tr><td>8:00 AM</td><td>22%</td></tr>
      <tr><td>10:00 AM</td><td>45%</td></tr>
      <tr><td>12:00 PM</td><td>18%</td></tr>
      <!-- Additional rows -->
    </tbody>
  </table>
</details>
```

**Rules:**
- Wrap charts in `<figure>` with `role="img"` and an `aria-label` summary.
- Include hidden `<figcaption>` with key data points (average, peak, current).
- Provide an expandable data table via `<details>/<summary>` for users who need exact values.
- Chart tooltips (on hover): ensure they also appear on focus for keyboard users. Tooltip content must be programmatically available (not canvas-only).

### 9.2 Resource Usage Metrics (Dashboard — Screen 4)

CPU, RAM, and Disk percentages shown as bar/number values.

```html
<div class="metrics" role="group" aria-label="Server resource usage">
  <div class="metric">
    <span class="metric__label">CPU</span>
    <div
      class="metric__bar"
      role="meter"
      aria-label="CPU usage"
      aria-valuenow="12"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuetext="12 percent"
    >
      <div class="metric__bar-fill" style="width: 12%"></div>
    </div>
    <span class="metric__value">12%</span>
  </div>
  <!-- Repeat for RAM, Disk, Network -->
</div>
```

**Rules:**
- Use `role="meter"` (not `progressbar`, which implies a task will complete).
- `aria-valuetext` provides human-readable format.
- When a metric crosses a warning threshold (>80%), update `aria-valuetext` to include the warning: "85 percent — warning: high utilization".
- Add a visual icon or text badge alongside color change at threshold.

---

## 10. Testing Checklist

### 10.1 Automated Testing

Run these tools in the CI pipeline and during development:

| Tool | What It Tests | Target |
|------|--------------|--------|
| **axe-core** (via `@axe-core/playwright` or `jest-axe`) | WCAG 2.2 AA rule violations | Every page/component |
| **Lighthouse Accessibility** | Accessibility score, best practices | Score ≥95 |
| **eslint-plugin-jsx-a11y** | JSX component-level ARIA issues | All `.tsx` files |
| **TypeScript strict mode** | Type safety for ARIA props | All `.ts`/`.tsx` files |

**CI gate requirement:** Zero axe-core violations at "critical" or "serious" severity.

### 10.2 Manual Testing Procedures

**Keyboard-only navigation (all screens):**
1. Unplug mouse. Navigate entire screen using only Tab, Shift+Tab, Enter, Space, Arrow keys, Escape.
2. Verify: Can you reach every interactive element? Is focus order logical? Is focus visible at all times?
3. Verify: Can you complete the full user journey (UJ1: connect server → deploy app) without a mouse?
4. Verify: Modal focus trapping works. Escape closes. Focus returns to trigger.
5. Verify: Skip link is the first element. It jumps to `<main>` on activation.

**Screen reader testing (per screen):**
1. Navigate with VoiceOver (macOS/iOS) or NVDA (Windows).
2. Verify: Page title is announced on load. Headings are in logical order.
3. Verify: All form fields announce their label, required state, and error messages.
4. Verify: Status changes (deployment progress, health status) are announced via live regions.
5. Verify: Images and charts have meaningful alt text.
6. Verify: Buttons and links announce their purpose (including unique labels for repeated controls).

**Zoom and reflow testing:**
1. Zoom browser to 200%. Verify: No content is hidden. No horizontal scrolling. All text readable.
2. Set viewport to 320px width. Verify: Content reflows to single column. All functionality available.
3. Change browser font size to "Very Large". Verify: Layout does not break.

**Color and contrast testing:**
1. Use browser DevTools color vision simulation (protanopia, deuteranopia, tritanopia).
2. Verify: All status indicators are distinguishable without color (text labels present).
3. Use a contrast checker on all text/background combinations.
4. Verify: Focus indicators are visible in both light and dark mode.

**Motion and animation testing:**
1. Set OS to "Reduce motion" preference.
2. Verify: Pulse Ring is static. Modals appear instantly. No animation.
3. Disable preference. Verify: Animations play normally.

### 10.3 Per-Screen Test Matrix

| Screen | Keyboard | Screen Reader | Zoom/Reflow | Contrast | Motion |
|--------|----------|---------------|-------------|----------|--------|
| 1. Onboarding Welcome | Tab to button, Enter activates | Heading, illustration alt, button label | Single column at 320px | Text on white | List fade-in respects reduced motion |
| 2. Wizard Credentials | Tab through all fields, radio groups, button | Labels, fieldset/legend, error messages | Form stacks at narrow width | Input borders ≥3:1 | — |
| 3. Wizard Validation | Tab to continue button | Status announcement, resource card values | Cards stack at narrow width | Success token contrast | Spec card fade-in |
| 4. Dashboard | Skip link, sidebar nav, app cards, kebab menu | Status announcements, unique card labels, alert banner | Grid → single column | Status text + color | Pulse ring, metric tweening |
| 5. Marketplace | Search, category tabs, app grid | Search results count, install button labels | Grid → single column | Category filter contrast | — |
| 6. App Install | Form fields, accordion, deploy button | Labels, expanded/collapsed state | Form stacks | — | — |
| 7. Deployment Modal | Focus trapped, cancel button | Progress bar value, log updates, status | Modal responsive | — | Progress bar, log streaming |
| 8. App Management | Action buttons, resource panels | Status badge, masked env var labels | Panels stack | — | — |
| 9. Server Health | Charts, disconnect button | Chart alt text, data table, activity log | Charts reflow | Metric threshold color | Chart tooltip |
| 10. Settings | Tab navigation, form controls | Tab roles, fieldset/legend, danger zone | Form stacks | — | — |

---

## 11. Assistive Technology Support Matrix

### 11.1 Target AT Combinations

| AT Type | Product | OS | Browser | Priority |
|---------|---------|----|---------|---------| 
| Screen Reader | **NVDA** 2025.1+ | Windows 10/11 | Firefox, Chrome | Primary |
| Screen Reader | **VoiceOver** (macOS) | macOS 14+ | Safari | Primary |
| Screen Reader | **VoiceOver** (iOS) | iOS 17+ | Safari Mobile | Primary |
| Screen Reader | **TalkBack** | Android 14+ | Chrome Mobile | Secondary |
| Screen Reader | **JAWS** 2025+ | Windows 10/11 | Chrome | Secondary |
| Voice Control | **Voice Control** (macOS/iOS) | macOS 14+ / iOS 17+ | Safari | Secondary |
| Voice Control | **Windows Voice Access** | Windows 11 | Edge, Chrome | Tertiary |
| Magnification | **ZoomText** 2025+ | Windows 10/11 | Chrome | Secondary |
| Magnification | **macOS Zoom** | macOS 14+ | Safari | Tertiary |
| Switch Access | **iOS Switch Control** | iOS 17+ | Safari Mobile | Tertiary |
| Switch Access | **Android Switch Access** | Android 14+ | Chrome Mobile | Tertiary |

### 11.2 Testing Priority

**Before every release:**
1. NVDA + Firefox (Windows) — full user journey UJ1–UJ4
2. VoiceOver + Safari (macOS) — full user journey UJ1–UJ4
3. Keyboard-only (no AT) — all 10 screens

**Before major releases (PI boundaries):**
4. VoiceOver + Safari (iOS) — mobile responsive, all 10 screens
5. JAWS + Chrome (Windows) — auth flows, dashboard, deployment
6. TalkBack + Chrome (Android) — mobile responsive, all 10 screens
7. ZoomText at 200% — dashboard, forms, charts
8. macOS Voice Control — button activation, form filling

### 11.3 Known AT Interaction Notes

| Pattern | NVDA | VoiceOver | JAWS | Note |
|---------|------|-----------|------|------|
| `role="meter"` | Announced as "meter" | May announce as "progress" | Announced as "progress indicator" | Add `aria-valuetext` for consistent experience |
| `aria-current="step"` | Announced as "current step" | Announced as "current" | Supported | Supplement with live region announcement |
| `role="log"` | New entries announced | Supported | Supported | Throttle to avoid verbosity |
| `role="status"` | Announced politely | Supported | Supported | — |
| `<details>/<summary>` | Announced as expandable | Supported | Supported | — |
| CSS `content: ""` pseudo-elements | Read if not `aria-hidden` | Read if not `aria-hidden` | May be read | Always set `aria-hidden="true"` on decorative pseudo-element parents |

---

## 12. Implementation Sequence

For developers implementing these guidelines during P4:

1. **Foundation (before any component):** Set up `<html lang="en">`, skip link, focus styles, `sr-only` utility, live region containers, `prefers-reduced-motion` global handler.
2. **Layout shell:** Sidebar navigation with `aria-label`, `<main>` landmark, breadcrumbs.
3. **Form system:** Labels, fieldsets, error messaging pattern, autocomplete attributes.
4. **Status system:** Pulse ring with `role="status"`, status text tokens, toast container.
5. **Modal system:** Focus trap, focus restoration, dialog roles, deployment progress bar.
6. **Card system:** App cards with unique labels, kebab menu with ARIA menu pattern.
7. **Data visualization:** Chart alternatives, meter roles, threshold announcements.
8. **Settings:** Tab pattern, checkbox groups, theme toggle.
9. **Integration tests:** axe-core in CI, keyboard flow tests, screen reader scripts.

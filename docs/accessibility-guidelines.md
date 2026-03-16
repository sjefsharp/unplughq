---
artifact: accessibility-guidelines
produced-by: accessibility
project-slug: unplughq
work-item: task-284-a11y-pi2-wcag-audit
work-item-type: task
parent-work-item: epic-001-unplughq-platform
workflow-tier: full
phase: P2
version: 2.0.0
status: draft
consumed-by:
  - frontend-developer
  - backend-developer
  - testing
  - tech-lead
date: 2026-03-16
azure-devops-id: 284
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
| Deployment phase | `polite` | — | Deployment progress `<p>` (debounced) | "Securing your domain — 60% complete" (max 1 per 5s) |
| Wizard step | `polite` | — | Hidden announcement div | "Step 2 of 3: Validation" |
| Search results count | `polite` | `status` | Below search input | "5 applications found" |
| Catalog search results | `polite` | `status` | Below catalog search input | "6 apps found" or "No apps match your search" |
| Form errors | — | `alert` | Below form fields | Validation error messages |
| Resource gauge threshold | — | — | Dashboard gauge (NOT live) | Values readable on focus; not announced in real time |
| Alert arrival (critical) | `assertive` | `alert` | Alert banner / bell dropdown | "New critical alert: Plausible not responding" |
| Alert arrival (warning/info) | `polite` | `status` | Alert banner / bell dropdown | "New warning: Storage at 82%" |
| Verification results | `polite` | `status` | Verification checklist area | "Container started — passed" (staggered 1 per 2s) |
| Resource warning banner | `polite` | `status` | Multi-app table / wizard | "Your server is using 75% of its memory" |
| Stale data indicator | `assertive` | `alert` | Dashboard timestamp area | "Data may be outdated. Last update: 2 minutes ago" |
| Notification bell badge | `polite` | — | Sibling to bell button | "2 unread notifications" |
| Remediation action result | `polite` | `status` | Inline within remediation step | "Plausible is back online" or "Restart didn't work" |

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
| Catalog Browse (PI-2) | Skip link → Sidebar nav → Page title → Search input → Category filters → Result count → App card grid (L→R, top→bottom) |
| App Detail (PI-2) | Skip link → Sidebar nav → Breadcrumb → App icon + title → Description → Requirements table → Deploy button |
| Configuration Wizard (PI-2) | Back button → Step indicator → Step heading → Form fields (top→bottom) → Resource warning (if any) → Continue button |
| Deployment Progress (PI-2) | Page heading → Progress bar → Phase step list (completed → active → pending) → DNS warning (if any) → Background navigation hint |
| Verification (PI-2) | Page heading → Verification checklist (sequential items) → Status summary → Action buttons |
| Multi-App Table (PI-2) | Skip link → Sidebar nav → App count + server → Table caption → Column headers → Data rows (top→bottom) → Total row → Resource warning |
| Dashboard Overview (PI-2) | Skip link → Sidebar nav → Alert banner (if any) → Server status → Resource gauges → App card grid → Last updated timestamp |
| Alert Management (PI-2) | Skip link → Sidebar nav → Page heading → Active alert list (severity-sorted) → Expanded alert detail (if any) → Recent/dismissed section |
| Guided Remediation (PI-2) | Back link → Page heading → Alert context → Remediation steps (ordered: 1 → 2 → 3) → Escalation box |

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
| 11. Catalog Browse (PI-2) | Search input, category chips (Arrow keys), grid cards (Tab), Deploy buttons | Search result count announcement, unique Deploy labels, category tab selection | Grid → single column | Category filter contrast | Result crossfade respects reduced motion |
| 12. App Detail (PI-2) | Breadcrumb, Deploy button, external link | Requirements structure, breadcrumb nav, Deploy label includes app name | Two-col → single-col | — | — |
| 13. Config Wizard (PI-2) | Step indicator, server cards (Arrow keys as radio), form fields, Back/Continue | Step announcements, dynamic field labels, resource warning, server selection | Form stacks at narrow width | — | Step slide transitions respect reduced motion |
| 14. Deployment Progress (PI-2) | Phase list, retry button on failure | Debounced phase announcements (max 1/5s), progress bar valuetext, failure alert | Stepper stacks | — | Phase animations, progress bar fill respect reduced motion |
| 15. Verification (PI-2) | Action buttons (Open App, Dashboard) | Sequential check result announcements, status text not color-only | Checklist stacks | Pass/fail badge contrast | Check result stagger respects reduced motion |
| 16. Multi-App Table (PI-2) | Table cells, sortable headers, per-row kebab menus | Table caption, column headers, meter valuetexts, unique action labels | Table → card stack | Mini-bar colors + text | — |
| 17. Dashboard Overview (PI-2) | Alert banner, gauge values, app cards, bell button | Gauge meter labels, alert banner, bell badge count, stale data alert | Gauges 4-up → 2x2 → scroll | Gauge threshold colors + text | Gauge tween, alert slide respect reduced motion |
| 18. Alert Management (PI-2) | Alert rows (Enter to expand), Acknowledge/Dismiss buttons | Severity badges (text+icon), expand/collapse state, real-time alert arrivals | List stacks | Dismissed alert at 80% opacity | Alert arrival animation respects reduced motion |
| 19. Remediation (PI-2) | Inline action buttons (Restart), back link | Step list ordering, action result announcements, escalation box landmark | Single column stacks | Ghost link contrast | — |

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
1. NVDA + Firefox (Windows) — full user journey UJ1–UJ4 (all 19 screens)
2. VoiceOver + Safari (macOS) — full user journey UJ1–UJ4 (all 19 screens)
3. Keyboard-only (no AT) — all 19 screens

**Before major releases (PI boundaries):**
4. VoiceOver + Safari (iOS) — mobile responsive, all 19 screens
5. JAWS + Chrome (Windows) — auth flows, dashboard, deployment, alert management
6. TalkBack + Chrome (Android) — mobile responsive, all 19 screens
7. ZoomText at 200% — dashboard, forms, charts, gauges, alert detail panels
8. macOS Voice Control — button activation, form filling, alert acknowledge/dismiss

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
10. **PI-2 Sprint 2 components (after PI-1 foundation):** Catalog card grid, configuration wizard stepper, deployment progress with SSE, verification checklist, multi-app table, dashboard gauges, alert management, remediation guides.

---

## 13. PI-2 Sprint 2 — ARIA Patterns by Component

### 13.1 Catalog App Card (Screen 11 — AB#202)

Cards in the catalog grid contain: app icon, title, description, category badge, resource requirements, and deploy button.

```html
<section aria-label="Application catalog" class="catalog-grid">
  <p class="catalog-count" role="status" aria-live="polite" aria-atomic="true">
    6 apps found
  </p>

  <ul class="catalog-list" role="list">
    <li>
      <article class="catalog-card" aria-label="Nextcloud — File sync and share platform">
        <img
          src="/icons/nextcloud.svg"
          alt="Nextcloud logo"
          width="48"
          height="48"
        />
        <h3 class="catalog-card__title">Nextcloud</h3>
        <p class="catalog-card__desc">File sync & share platform</p>
        <span class="catalog-card__category">[File Storage]</span>
        <dl class="catalog-card__requirements" aria-label="Resource requirements">
          <dt class="sr-only">Memory</dt>
          <dd>2 GB</dd>
          <dt class="sr-only">Storage</dt>
          <dd>10 GB disk</dd>
        </dl>
        <a
          href="/catalog/nextcloud"
          class="btn btn-primary btn-sm"
          aria-label="Deploy Nextcloud"
        >
          Deploy →
        </a>
      </article>
    </li>
    <!-- Additional cards -->
  </ul>
</section>
```

**Rules:**
- Wrap the grid in a `<section aria-label="Application catalog">` for landmark navigation.
- Use `<ul>/<li>` for the card list — cards are items in a collection.
- Each card is an `<article>` with `aria-label="{App Name} — {Description}"`.
- Resource requirements use `<dl>` with visually hidden `<dt>` terms and visible `<dd>` values.
- Deploy buttons MUST include the app name in `aria-label` to distinguish between cards.
- Result count uses `aria-live="polite"` with `aria-atomic="true"` so the full count is re-announced on update.

### 13.2 Catalog Search with Live Results (Screen 11 — AB#202)

```html
<div class="catalog-search-wrapper">
  <label for="catalog-search" class="sr-only">Search applications</label>
  <input
    type="search"
    id="catalog-search"
    class="search-input"
    placeholder="Search apps by name or description…"
    aria-label="Search applications"
    aria-describedby="catalog-search-hint"
    aria-controls="catalog-results"
    autocomplete="off"
  />
  <span id="catalog-search-hint" class="sr-only">
    Results update as you type. Press Escape to clear search.
  </span>
</div>

<!-- Result count — always present in DOM, updated after 300ms debounce -->
<p id="catalog-results" class="catalog-count" role="status" aria-live="polite" aria-atomic="true">
  6 apps found
</p>
```

**Rules:**
- `aria-controls` links the search input to the results region.
- Result count region exists in the DOM at page load — never dynamically added/removed.
- Update the count text ONLY after the 300ms debounce completes. Never announce mid-typing.
- Empty state: "No apps match your search. Try a different term or browse by category."
- Clear button (X icon inside input): `aria-label="Clear search"`.

### 13.3 Category Filter Chips (Screen 11 — AB#202)

```html
<div role="tablist" aria-label="Filter by category" class="category-chips">
  <button
    role="tab"
    aria-selected="true"
    class="chip chip--active"
    id="cat-all"
    aria-controls="catalog-grid"
  >
    All
  </button>
  <button
    role="tab"
    aria-selected="false"
    class="chip"
    id="cat-file-storage"
    aria-controls="catalog-grid"
    tabindex="-1"
  >
    File Storage
  </button>
  <button
    role="tab"
    aria-selected="false"
    class="chip"
    id="cat-analytics"
    aria-controls="catalog-grid"
    tabindex="-1"
  >
    Analytics
  </button>
  <!-- Additional categories -->
</div>
```

**Keyboard interaction:**
| Key | Action |
|-----|--------|
| ArrowRight | Move focus to next chip |
| ArrowLeft | Move focus to previous chip |
| Home | Move focus to first chip ("All") |
| End | Move focus to last chip |
| Enter / Space | Activate focused chip, filter results |

**Rules:**
- Use `role="tablist"` / `role="tab"` since categories are mutually exclusive (one active at a time).
- `aria-selected="true"` on the active chip only.
- Roving `tabindex`: active chip has `tabindex="0"`, others have `tabindex="-1"`.
- On mobile horizontal scroll: provide visible overflow indicators. Arrow keys wrap at boundaries.

### 13.4 Configuration Wizard Stepper (Screen 13 — AB#203)

Extends the PI-1 wizard pattern (Section 2.9) to a 4-step deployment wizard.

```html
<nav aria-label="Configuration progress" class="stepper">
  <ol class="stepper__list">
    <li class="stepper__step stepper__step--complete">
      <span class="stepper__indicator" aria-hidden="true">✓</span>
      <span class="stepper__label">
        Server
        <span class="sr-only">— completed</span>
      </span>
    </li>
    <li class="stepper__step stepper__step--current" aria-current="step">
      <span class="stepper__indicator" aria-hidden="true">2</span>
      <span class="stepper__label">
        Settings
        <span class="sr-only">— current step</span>
      </span>
    </li>
    <li class="stepper__step">
      <span class="stepper__indicator" aria-hidden="true">3</span>
      <span class="stepper__label">
        Review
        <span class="sr-only">— upcoming</span>
      </span>
    </li>
    <li class="stepper__step">
      <span class="stepper__indicator" aria-hidden="true">4</span>
      <span class="stepper__label">
        Deploy
        <span class="sr-only">— upcoming</span>
      </span>
    </li>
  </ol>
</nav>

<!-- Step announcement region -->
<div aria-live="polite" class="sr-only" id="wizard-step-announcement">
  Step 2 of 4: Settings — Configure your app
</div>
```

**Server selection cards (Step 1) — radio pattern:**
```html
<fieldset>
  <legend>Deploy to</legend>
  <p class="form-hint">Choose which server to deploy this app on.</p>
  <div role="radiogroup" aria-label="Select deployment server" class="server-cards">
    <label class="server-card server-card--selected">
      <input type="radio" name="server" value="prod" checked class="sr-only" />
      <span class="server-card__name">My Production Server</span>
      <span class="server-card__ip">192.168.1.100</span>
      <span class="server-card__specs">4 CPU, 8GB, 60GB free</span>
      <span class="server-card__status">
        <span class="status-dot status-dot--healthy" aria-hidden="true"></span>
        Healthy
      </span>
    </label>
    <label class="server-card">
      <input type="radio" name="server" value="dev" class="sr-only" />
      <span class="server-card__name">Dev Server</span>
      <span class="server-card__ip">10.0.0.5</span>
      <span class="server-card__specs">2 CPU, 4GB, 30GB free</span>
      <span class="server-card__status">
        <span class="status-dot status-dot--healthy" aria-hidden="true"></span>
        Healthy
      </span>
    </label>
  </div>
</fieldset>
```

**Rules:**
- Server cards use native `<input type="radio">` wrapped in `<label>` for maximum AT compatibility.
- The radio input is visually hidden (`.sr-only`) — the styled card serves as the visual indicator.
- Arrow keys navigate between server options per native radio group behavior.
- On step transition: update the `aria-live` announcement region, then move focus to the first interactive element of the new step.

### 13.5 SSE Deployment Progress (Screen 14 — AB#204)

Extends the PI-1 deployment modal pattern (Section 2.5) for full-page SSE-driven progress.

```html
<main id="main" tabindex="-1" aria-label="Deployment progress for Nextcloud">
  <h1>Deploying Nextcloud to My Production Server</h1>

  <div
    role="progressbar"
    aria-valuenow="60"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuetext="60 percent — Securing your domain"
    aria-label="Overall deployment progress"
    class="progress-bar"
  >
    <div class="progress-bar__fill" style="width: 60%"></div>
  </div>

  <!-- Debounced announcement region — max 1 update per 5 seconds -->
  <div aria-live="polite" class="sr-only" id="deployment-announcement">
    Securing your domain — 60% complete
  </div>

  <ol class="deployment-phases" aria-label="Deployment phases">
    <li class="phase phase--complete" aria-label="Preparing — completed">
      <span class="phase__icon phase__icon--success" aria-hidden="true">✓</span>
      <div class="phase__content">
        <strong>Preparing</strong>
        <p>Getting everything ready for your app.</p>
      </div>
    </li>
    <li class="phase phase--complete" aria-label="Downloading — completed">
      <span class="phase__icon phase__icon--success" aria-hidden="true">✓</span>
      <div class="phase__content">
        <strong>Downloading</strong>
        <p>Your app has been downloaded.</p>
      </div>
    </li>
    <li class="phase phase--complete" aria-label="Configuring — completed">
      <span class="phase__icon phase__icon--success" aria-hidden="true">✓</span>
      <div class="phase__content">
        <strong>Configuring</strong>
        <p>Your settings have been applied.</p>
      </div>
    </li>
    <li class="phase phase--active" aria-label="Securing — in progress">
      <span class="phase__icon phase__icon--active" aria-hidden="true">
        <!-- Pulse ring animation -->
      </span>
      <div class="phase__content">
        <strong>Securing</strong>
        <p>Setting up a secure connection for your domain.</p>
      </div>
    </li>
    <li class="phase phase--pending" aria-label="Starting — pending">
      <span class="phase__icon phase__icon--pending" aria-hidden="true">○</span>
      <div class="phase__content">
        <strong>Starting</strong>
      </div>
    </li>
    <li class="phase phase--pending" aria-label="Running — pending">
      <span class="phase__icon phase__icon--pending" aria-hidden="true">○</span>
      <div class="phase__content">
        <strong>Running</strong>
      </div>
    </li>
  </ol>

  <!-- DNS warning — informational, not urgent -->
  <div role="status" class="dns-warning" aria-live="polite">
    Your domain doesn't point to this server yet. The app will deploy,
    but it won't be reachable until DNS propagates.
  </div>
</main>
```

**SSE announcement debouncing implementation:**
```typescript
let lastAnnouncementTime = 0;
let pendingAnnouncement: string | null = null;
const ANNOUNCEMENT_INTERVAL = 5000; // 5 seconds minimum between announcements

function announcePhaseUpdate(phase: string, description: string, percent: number) {
  const announcement = `${description} — ${percent}% complete`;
  const now = Date.now();

  if (now - lastAnnouncementTime >= ANNOUNCEMENT_INTERVAL) {
    // Enough time has passed — announce immediately
    updateLiveRegion(announcement);
    lastAnnouncementTime = now;
    pendingAnnouncement = null;
  } else {
    // Too soon — queue for next interval
    pendingAnnouncement = announcement;
    setTimeout(() => {
      if (pendingAnnouncement) {
        updateLiveRegion(pendingAnnouncement);
        lastAnnouncementTime = Date.now();
        pendingAnnouncement = null;
      }
    }, ANNOUNCEMENT_INTERVAL - (now - lastAnnouncementTime));
  }
}

function updateLiveRegion(text: string) {
  const el = document.getElementById('deployment-announcement');
  if (el) el.textContent = text;
}
```

**Rules:**
- Progress bar: update `aria-valuenow` and `aria-valuetext` on every SSE event, but the live region announcement is debounced to max 1 per 5 seconds.
- Phase list connector lines between icons are `aria-hidden="true"` — purely decorative.
- On failure: focus moves to the error message. "Try again" button gets `aria-label="Retry deployment of {AppName}"`.
- On success: focus moves to the success heading. "Open {AppName}" button is the primary CTA.
- Reconnection: announce via `aria-live="assertive"`: "Connection lost. Reconnecting…" and "Reconnected. Resuming live updates."

### 13.6 Post-Deployment Verification Checklist (Screen 15 — AB#205)

```html
<section aria-label="Deployment verification" class="verification">
  <h2>Verification</h2>

  <!-- Staggered result announcements — 1 per 2 seconds -->
  <div aria-live="polite" class="sr-only" id="verification-announcement">
    Container started — passed
  </div>

  <ol class="verification-list">
    <li class="verification-item verification-item--pass">
      <span class="verification-icon" aria-hidden="true">✓</span>
      <span class="verification-text">
        Container started
        <span class="verification-result">— Passed</span>
      </span>
    </li>
    <li class="verification-item verification-item--pass">
      <span class="verification-icon" aria-hidden="true">✓</span>
      <span class="verification-text">
        Secure connection active
        <span class="verification-result">— Passed</span>
      </span>
    </li>
    <li class="verification-item verification-item--fail">
      <span class="verification-icon" aria-hidden="true">✗</span>
      <span class="verification-text">
        App responding at https://files.mydomain.com
        <span class="verification-result">— Failed</span>
      </span>
    </li>
    <li class="verification-item verification-item--warning">
      <span class="verification-icon" aria-hidden="true">⚠</span>
      <span class="verification-text">
        Domain resolving correctly
        <span class="verification-result">— Warning: DNS not propagated</span>
      </span>
    </li>
  </ol>
</section>
```

**Rules:**
- Icons (✓, ✗, ⚠) are `aria-hidden="true"`. The `<span class="verification-result">` carries the accessible meaning: "Passed", "Failed", "Warning".
- Color alone NEVER indicates pass/fail. The text "Passed"/"Failed"/"Warning" is mandatory.
- Stagger live region announcements to 1 per 2 seconds to give screen readers time to speak each result.
- On all checks complete, announce summary: "Verification complete. 3 of 4 checks passed."

### 13.7 Multi-App Management Table (Screen 16 — AB#206)

```html
<table class="app-table" aria-label="Deployed applications on My Production Server">
  <caption class="sr-only">
    3 apps running on My Production Server. Sorted by app name.
  </caption>
  <thead>
    <tr>
      <th scope="col" class="app-table__icon-col">
        <span class="sr-only">App icon</span>
      </th>
      <th scope="col">
        <button class="table-sort" aria-sort="ascending">
          App
          <span class="sort-icon" aria-hidden="true">▲</span>
        </button>
      </th>
      <th scope="col">Status</th>
      <th scope="col">
        <button class="table-sort" aria-sort="none">
          CPU
          <span class="sort-icon" aria-hidden="true">⇕</span>
        </button>
      </th>
      <th scope="col">Memory</th>
      <th scope="col">Disk</th>
      <th scope="col">
        <span class="sr-only">Actions</span>
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <img src="/icons/nextcloud.svg" alt="Nextcloud logo" width="24" height="24" />
      </td>
      <td>
        <strong>Nextcloud</strong>
        <br /><span class="text-muted">files.my.dev</span>
      </td>
      <td>
        <span class="status-badge status-badge--running" role="status" aria-live="polite">
          <span class="status-dot" aria-hidden="true"></span>
          Running
        </span>
      </td>
      <td>
        <div
          role="meter"
          aria-label="Nextcloud CPU usage"
          aria-valuenow="12"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuetext="12 percent"
        >
          <div class="mini-bar"><div class="mini-bar__fill" style="width: 12%"></div></div>
          <span class="mini-bar__label">12%</span>
        </div>
      </td>
      <td>
        <div
          role="meter"
          aria-label="Nextcloud memory usage"
          aria-valuenow="1200"
          aria-valuemin="0"
          aria-valuemax="8192"
          aria-valuetext="1.2 gigabytes"
        >
          <div class="mini-bar"><div class="mini-bar__fill" style="width: 15%"></div></div>
          <span class="mini-bar__label">1.2 GB</span>
        </div>
      </td>
      <td>
        <div
          role="meter"
          aria-label="Nextcloud disk usage"
          aria-valuenow="8"
          aria-valuemin="0"
          aria-valuemax="80"
          aria-valuetext="8 gigabytes"
        >
          <div class="mini-bar"><div class="mini-bar__fill" style="width: 10%"></div></div>
          <span class="mini-bar__label">8 GB</span>
        </div>
      </td>
      <td>
        <button
          type="button"
          class="btn btn-ghost btn-icon"
          aria-label="Actions for Nextcloud"
          aria-haspopup="menu"
          aria-expanded="false"
        >
          <span aria-hidden="true">⋯</span>
        </button>
      </td>
    </tr>
    <!-- Additional rows -->
  </tbody>
  <tfoot>
    <tr>
      <td></td>
      <th scope="row">TOTAL</th>
      <td></td>
      <td><strong>16%</strong></td>
      <td><strong>1.6 GB</strong></td>
      <td><strong>10.5 GB</strong></td>
      <td></td>
    </tr>
  </tfoot>
</table>
```

**Mobile responsive card transformation:**
```html
<!-- Below 768px breakpoint, each table row becomes a card -->
<div class="app-card-mobile" role="group" aria-label="Nextcloud">
  <dl class="app-card-mobile__details">
    <dt>Status</dt>
    <dd><span class="status-badge">Running</span></dd>
    <dt>CPU</dt>
    <dd>12%</dd>
    <dt>Memory</dt>
    <dd>1.2 GB</dd>
    <dt>Disk</dt>
    <dd>8 GB</dd>
  </dl>
  <button aria-label="Actions for Nextcloud" aria-haspopup="menu">⋯</button>
</div>
```

**Rules:**
- Sortable headers: `<button>` within `<th>` with `aria-sort` attribute (ascending/descending/none).
- Mini resource bars: `role="meter"` (not `progressbar`). Each bar includes a visible text label alongside the visual fill.
- `<tfoot>` with `<th scope="row">` for the total row distinguishes it from data.
- Mobile: `<dl>` preserves key-value semantic associations when table layout breaks down.

### 13.8 Dashboard Resource Gauges (Screen 17 — AB#207)

```html
<div class="gauges" role="group" aria-label="Server resource utilization">
  <div class="gauge">
    <div
      role="meter"
      aria-label="CPU usage"
      aria-valuenow="32"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuetext="32 percent"
      class="gauge__bar"
    >
      <div class="gauge__fill gauge__fill--normal" style="width: 32%"></div>
    </div>
    <span class="gauge__value">32%</span>
    <span class="gauge__label">CPU</span>
  </div>

  <div class="gauge">
    <div
      role="meter"
      aria-label="Memory usage"
      aria-valuenow="68"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuetext="68 percent"
      class="gauge__bar"
    >
      <div class="gauge__fill gauge__fill--normal" style="width: 68%"></div>
    </div>
    <span class="gauge__value">68%</span>
    <span class="gauge__label">Memory</span>
  </div>

  <div class="gauge">
    <div
      role="meter"
      aria-label="Storage usage"
      aria-valuenow="72"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuetext="72 percent — warning: high utilization"
      class="gauge__bar"
    >
      <div class="gauge__fill gauge__fill--warning" style="width: 72%"></div>
    </div>
    <span class="gauge__value">72%</span>
    <span class="gauge__label">Storage</span>
    <span class="gauge__threshold-label" aria-hidden="true">⚠</span>
  </div>

  <div class="gauge">
    <div
      role="meter"
      aria-label="Network throughput"
      aria-valuenow="1.2"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuetext="1.2 megabytes per second"
      class="gauge__bar"
    >
      <div class="gauge__fill gauge__fill--normal" style="width: 1.2%"></div>
    </div>
    <span class="gauge__value">1.2 MB/s</span>
    <span class="gauge__label">Network</span>
  </div>
</div>
```

**Color-blind-safe threshold indication:**

| Threshold | Color Token | Pattern Fill | Icon | Text Addition |
|-----------|-------------|-------------|------|---------------|
| Normal (<70%) | `--color-success-base` | Solid fill | None | — |
| Warning (70–89%) | `--color-warning-base` | Diagonal hatch (45°) | ⚠ triangle | "— warning" appended to `aria-valuetext` |
| Critical (≥90%) | `--color-critical-base` | Cross-hatch (45° + 135°) | ✗ circle | "— critical" appended to `aria-valuetext` |

```css
/* Pattern fills for color-blind safety */
.gauge__fill--warning {
  background: repeating-linear-gradient(
    45deg,
    var(--color-warning-base),
    var(--color-warning-base) 3px,
    transparent 3px,
    transparent 6px
  );
}

.gauge__fill--critical {
  background: repeating-linear-gradient(
    45deg,
    var(--color-critical-base),
    var(--color-critical-base) 2px,
    transparent 2px,
    transparent 5px
  ),
  repeating-linear-gradient(
    135deg,
    var(--color-critical-base),
    var(--color-critical-base) 2px,
    transparent 2px,
    transparent 5px
  );
}

@media (prefers-reduced-motion: reduce) {
  .gauge__fill {
    transition: none;
  }
}
```

**Rules:**
- Gauges use `role="meter"` — never `role="progressbar"` (meters measure a known range, progress bars track task completion).
- `aria-valuetext` includes threshold context when crossed: "72 percent — warning: high utilization".
- Pattern fills (hatched/crosshatched) provide a non-color visual distinction for color-blind users.
- Visible text percentage is always shown alongside the bar fill.
- Gauge values are NOT in `aria-live` regions — they update too frequently via SSE and would overwhelm screen readers. Users query values by focusing the gauge.
- When crossing a threshold, a one-time announcement via a separate debounced live region is acceptable: "Storage has reached warning level: 72%".

### 13.9 Alert Notification (Screen 18 — AB#208)

```html
<section aria-label="Active alerts" class="alert-management">
  <h2>Active Alerts</h2>

  <!-- Priority-based live region for new alert arrivals -->
  <div id="alert-live-critical" aria-live="assertive" class="sr-only"></div>
  <div id="alert-live-polite" aria-live="polite" class="sr-only"></div>

  <ul class="alert-list" aria-label="Active alerts, sorted by severity then time">
    <li class="alert-row alert-row--critical">
      <button
        class="alert-row__trigger"
        aria-expanded="false"
        aria-controls="alert-detail-1"
        aria-label="Critical alert: High storage usage, 12 minutes ago. Expand for details."
      >
        <span class="severity-badge severity-badge--critical">
          <svg aria-hidden="true" class="severity-icon"><!-- X icon --></svg>
          CRITICAL
        </span>
        <span class="alert-row__title">High storage usage</span>
        <span class="alert-row__context">Production Server</span>
        <span class="alert-row__time">
          <time datetime="2026-03-16T10:48:00Z">12 min ago</time>
        </span>
        <span class="alert-row__chevron" aria-hidden="true">▾</span>
      </button>

      <div id="alert-detail-1" class="alert-detail" hidden>
        <p>Storage is at 87% (threshold: 85%)</p>
        <div
          role="meter"
          aria-label="Storage utilization"
          aria-valuenow="87"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuetext="87 percent, threshold is 85 percent"
        >
          <div class="gauge__fill gauge__fill--critical" style="width: 87%"></div>
        </div>
        <p>Affecting: My Production Server</p>
        <p>Detected at: <time datetime="2026-03-16T10:48:00Z">10:48 AM today</time></p>
        <div class="alert-detail__actions">
          <button
            type="button"
            class="btn btn-secondary btn-sm"
            aria-label="Acknowledge high storage usage alert"
          >
            Acknowledge
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            aria-label="Dismiss high storage usage alert"
          >
            Dismiss
          </button>
          <a
            href="/alerts/1/remediation"
            class="btn btn-primary btn-sm"
            aria-label="View remediation steps for high storage usage"
          >
            View remediation →
          </a>
        </div>
      </div>
    </li>
    <!-- Additional alert rows -->
  </ul>
</section>
```

**Severity-based live region routing:**
```typescript
function announceNewAlert(severity: 'critical' | 'warning' | 'info', summary: string) {
  const regionId = severity === 'critical'
    ? 'alert-live-critical'   // aria-live="assertive"
    : 'alert-live-polite';    // aria-live="polite"

  const region = document.getElementById(regionId);
  if (region) {
    region.textContent = `New ${severity} alert: ${summary}`;
  }
}
```

**Rules:**
- Severity badges combine color + text + icon: never color alone.
- Critical alerts inject into `aria-live="assertive"` for immediate interruption. Warning/info use `aria-live="polite"`.
- Expand/collapse uses `aria-expanded` on the trigger button, `aria-controls` linking to the detail panel.
- On expand: focus moves to the detail panel content. On collapse: focus returns to the trigger button.
- Action buttons include the alert title in `aria-label` for context.
- Notification bell button: `aria-label="Notifications, 2 unread"`. Use a sibling hidden `aria-live="polite"` region to announce badge count changes — not on the button itself.

### 13.10 Guided Remediation (Screen 19 — AB#209)

```html
<main id="main" tabindex="-1">
  <nav aria-label="Breadcrumb" class="breadcrumb">
    <ol>
      <li><a href="/alerts" aria-label="Back to alerts list">← Back to alerts</a></li>
    </ol>
  </nav>

  <header>
    <h1>Free up storage space</h1>
    <p>Storage is at 87% on My Production Server.</p>
  </header>

  <section aria-label="Remediation steps">
    <ol class="remediation-steps">
      <li class="remediation-step">
        <strong>Review which apps use the most storage.</strong>
        <table class="remediation-table" aria-label="Per-app disk usage breakdown">
          <caption class="sr-only">Disk usage by application on My Production Server</caption>
          <thead>
            <tr>
              <th scope="col">App</th>
              <th scope="col">Storage</th>
              <th scope="col">% Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Nextcloud</td>
              <td>8.0 GB</td>
              <td>62%</td>
            </tr>
            <tr>
              <td>Plausible</td>
              <td>2.1 GB</td>
              <td>16%</td>
            </tr>
            <tr>
              <td>Vaultwarden</td>
              <td>0.4 GB</td>
              <td>3%</td>
            </tr>
            <tr>
              <td>System</td>
              <td>2.5 GB</td>
              <td>19%</td>
            </tr>
          </tbody>
        </table>
      </li>
      <li class="remediation-step">
        <strong>Remove files you no longer need from within each app.</strong>
      </li>
      <li class="remediation-step">
        <strong>If storage is still full, consider upgrading your server's disk.</strong>
        <aside class="escalation-box" aria-label="Additional help if this doesn't resolve the issue">
          <p>
            If this doesn't resolve it, check your VPS provider's
            storage upgrade options.
          </p>
        </aside>
      </li>
    </ol>
  </section>

  <!-- Inline action result announcements -->
  <div aria-live="polite" class="sr-only" id="remediation-result"></div>
</main>
```

**App-unavailable remediation with inline action:**
```html
<li class="remediation-step">
  <strong>Try restarting the app.</strong>
  <button
    type="button"
    class="btn btn-primary btn-sm"
    aria-label="Restart Plausible"
    id="restart-plausible-btn"
  >
    Restart Plausible
  </button>
</li>
```

**Post-action focus management:**
```typescript
async function handleRestart(appName: string, buttonEl: HTMLElement) {
  buttonEl.setAttribute('aria-busy', 'true');
  buttonEl.disabled = true;
  buttonEl.textContent = 'Restarting…';

  try {
    await restartApp(appName);
    // Announce success — focus stays on the button area
    announceResult(`${appName} is back online.`);
    buttonEl.textContent = 'Restarted ✓';
    buttonEl.removeAttribute('aria-busy');
  } catch {
    announceResult(`Restart didn't work. Try the next step.`);
    buttonEl.textContent = 'Restart Plausible';
    buttonEl.disabled = false;
    buttonEl.removeAttribute('aria-busy');
    buttonEl.focus(); // Return focus to retry
  }
}

function announceResult(message: string) {
  const el = document.getElementById('remediation-result');
  if (el) el.textContent = message;
}
```

**Rules:**
- Remediation steps use `<ol>` — the ordered list conveys sequence.
- Inline action buttons include the app name in `aria-label`.
- After inline action: focus stays near the action button. Never steal focus to a different step.
- Action result is announced via `aria-live="polite"` region.
- Escalation boxes use `<aside>` within the step `<li>` for semantic distinction.
- Tables within steps use `<caption>` + `<th scope="col">` for full accessibility.

---

## 14. PI-2 Sprint 2 — Implementation Guidelines

### 14.1 Real-Time SSE Updates Without Overwhelming Screen Readers

**Problem:** SSE events can fire multiple times per second during deployment or metric updates. Routing every event to an `aria-live` region would make the interface unusable for screen reader users.

**Solution — Debounced announcement pattern:**

| Context | Announce? | `aria-live` | Debounce | Content |
|---------|-----------|------------|----------|---------|
| Deployment phase change | Yes | `polite` | 5 seconds | "{Phase description} — {percent}% complete" |
| Deployment failure | Yes | `assertive` | Immediate | "Deployment failed at {phase}. {Error description}" |
| Deployment success | Yes | `polite` | Immediate | "Deployment complete. {AppName} is running." |
| Dashboard metric update | **No** | `off` / none | — | Values readable on focus only |
| Metric threshold crossing | Yes (once) | `polite` | Deduplicated | "Storage has reached warning level: 72%" |
| New alert arrival | Yes | Severity-based | Immediate | "New {severity} alert: {summary}" |
| Alert auto-resolution | Yes | `polite` | 5 seconds | "Resolved: {summary}" |
| SSE reconnection | Yes | `assertive` | Immediate | "Connection lost. Reconnecting…" |
| Stale data detection | Yes | `assertive` | Immediate | "Data may be outdated. Last update: {timestamp}" |

**Implementation rules:**
1. Maintain a single debounce timer per live region. New events reset the timer.
2. Never announce the same content twice in succession (deduplicate).
3. On `prefers-reduced-motion: reduce`, the debounce interval can be extended to 10 seconds for non-critical updates.
4. Provide a "Refresh" button as an alternative — users can query current state manually.

### 14.2 Dashboard Gauge Color Semantics and Alternatives

**Problem:** Gauge threshold colors (green/amber/red) are meaningful but inaccessible to color-blind users and invisible to screen readers.

**Three-layer approach:**

1. **Text:** Always display the numeric percentage AND the threshold label ("Warning", "Critical") as visible text. `aria-valuetext` includes both: "72 percent — warning: high utilization".
2. **Pattern:** At warning threshold, add a diagonal hatch pattern to the gauge fill. At critical, use cross-hatch. These patterns are visible to users who cannot distinguish green from amber/red.
3. **Icon:** Display a ⚠ triangle icon at warning level and ✗ circle icon at critical level adjacent to the gauge. Icon is supplemental — never the sole indicator.

**CSS token mapping for thresholds:**
```css
:root {
  --gauge-normal-bg: var(--color-success-base);
  --gauge-warning-bg: var(--color-warning-base);
  --gauge-critical-bg: var(--color-critical-base);
}
```

### 14.3 Alert Severity Communication (Not Color-Alone)

**Severity indicators MUST combine all three channels:**

| Severity | Color | Icon | Text | Badge HTML |
|----------|-------|------|------|------------|
| Critical | `--color-critical-base` (rose-500) | ✗ circle (filled) | "CRITICAL" | `<span class="severity-badge severity-badge--critical"><svg aria-hidden="true">…</svg> CRITICAL</span>` |
| Warning | `--color-warning-base` (amber-500) | ⚠ triangle | "WARNING" | `<span class="severity-badge severity-badge--warning"><svg aria-hidden="true">…</svg> WARNING</span>` |
| Info | `--color-primary-base` (indigo-500) | ℹ circle | "INFO" | `<span class="severity-badge severity-badge--info"><svg aria-hidden="true">…</svg> INFO</span>` |

**Screen reader ordering:** Icon → text. Icon is `aria-hidden="true"` — the text label carries the meaning. For compound labels: "Critical alert: High storage usage" — severity first, then summary.

### 14.4 Multi-Step Deployment Progress for Screen Readers

**On each phase transition (debounced):**
1. Update `aria-valuenow` and `aria-valuetext` on the progress bar.
2. Update the debounced live region with the phase description.
3. Update the `aria-label` on the active phase `<li>` from "pending" to "in progress".
4. Update the completed phase `<li>` label from "in progress" to "completed".

**On completion:**
- Announce "Deployment complete. {AppName} is running at {URL}."
- Move focus to the success heading or primary CTA.

**On failure:**
- Announce (assertive): "Deployment failed at {phase}. {Error description}."
- Move focus to the error detail panel.
- Remaining phases marked with `aria-label="{Phase} — not started"`.

### 14.5 Keyboard-Driven Catalog Browsing with Grid Navigation

**Tab order through catalog page:**
1. Skip link → Sidebar → Page heading → Search input → Category filters → First card → (Tab through cards) → Deploy button per card.

**Within category filter chips:**
- Arrow keys navigate between chips (roving tabindex).
- Enter/Space activates the focused chip.
- Tab exits the chip group to the next focusable element.

**Within card grid:**
- Each card is focusable (the card link or the Deploy button).
- Tab moves through cards in reading order (left→right, top→bottom).
- Enter activates the focused card's Deploy link.

**Search interaction:**
- Typing updates results after 300ms debounce.
- Result count is announced via live region.
- Escape clears the search input and restores full catalog.
- Down Arrow from search input moves focus to the first result card.

### 14.6 Focus Management During Wizard Step Transitions

**Forward navigation (Continue):**
1. Validate current step fields.
2. If validation passes: animate transition, update step indicator, move focus to the new step's first heading or first interactive element.
3. If validation fails: move focus to the first invalid field, announce error.

**Backward navigation (Back):**
1. No validation — allow partial fill.
2. Animate reverse transition, update step indicator, move focus to the previous step's heading.
3. All previously entered values are preserved.

**Edit-back from summary:**
1. User clicks "Edit" on summary screen — focus jumps to the target step's heading.
2. After editing, "Continue" from that step skips past completed steps back to summary.
3. Focus returns to the summary section the user was editing.

**Step announcement:**
```typescript
function onStepChange(stepNumber: number, totalSteps: number, stepName: string) {
  // 1. Update the live region
  const announcement = document.getElementById('wizard-step-announcement');
  if (announcement) {
    announcement.textContent = `Step ${stepNumber} of ${totalSteps}: ${stepName}`;
  }

  // 2. Move focus to the new step's heading
  requestAnimationFrame(() => {
    const heading = document.querySelector<HTMLElement>(
      `[data-step="${stepNumber}"] h2, [data-step="${stepNumber}"] [data-step-heading]`
    );
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus();
    }
  });
}
```

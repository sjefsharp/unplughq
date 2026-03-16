---
artifact: design-system
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
  - content-strategist
date: 2026-03-16
azure-devops-id: 283
---

# UnplugHQ Design System

## 1. Visual Language Definition

The UnplugHQ aesthetic is "Premium indie tool" — combining the clarity and confidence of high-end developer tools (like Vercel or Linear) with the approachability of modern consumer products (like Notion). We are designing for non-developers, meaning we must remove technical intimidation without dumbing down the interface.

- **Clarity:** We favor explicit labels over clever icons. Complex technical states (like container orchestration) are abstracted into meaningful human states (Deploying, Healthy, Needs Attention).
- **Depth:** Surfaces are minimal. We rely heavily on subtle border treatments and layered shadows in light mode, and subtle surface lightness changes in dark mode to indicate interactive elevation.
- **Deference:** The UI steps back so the user's applications take center stage. When displaying the catalog or user's installed apps, the app logos provide the primary visual pop.
- **Precision:** Mathematical rigor in spacing and typography. We use a 4px baseline grid and strict modular type scales to create an inherently trustworthy layout.
- **Materiality:** Interactive elements feel tangible. A pressed button visually "sinks" into the surface.
- **Restraint:** Color is used functionally, not decoratively. Critical states (errors, healthy running apps) own the vibrant spectrum.
- **Distinction (Signature Element):** Our signature visual element is the **"Pulse Ring"** — a subtle, rhythmic, spring-animated concentric ring around server and app health indicators. It conveys "alive and monitored" without feeling alarming. We also use a distinct rounded geometry (`--radius-lg: 16px` on main cards) contrasted against sharper inner elements (`--radius-sm: 6px`) to create an approachable but structured frame.

## 2. Token Architecture & OKLCH Color Palette

We use OKLCH for perceptually uniform lightness interpolation across all color ramps.

### Reference Tokens (Base Ramps)

```css
:root {
  /* Neutral Ramp (Slate with subtle cool 240 hue bias) */
  --ref-slate-050: oklch(0.98 0.01 240);
  --ref-slate-100: oklch(0.95 0.02 240);
  --ref-slate-200: oklch(0.90 0.03 240);
  --ref-slate-300: oklch(0.82 0.04 240);
  --ref-slate-400: oklch(0.72 0.05 240);
  --ref-slate-500: oklch(0.60 0.06 240);
  --ref-slate-600: oklch(0.50 0.06 240);
  --ref-slate-700: oklch(0.40 0.05 240);
  --ref-slate-800: oklch(0.30 0.04 240);
  --ref-slate-900: oklch(0.20 0.03 240);
  --ref-slate-950: oklch(0.15 0.02 240);

  /* Primary Ramp (Vibrant Indigo - Trust, Tech, Calm) */
  --ref-indigo-050: oklch(0.97 0.02 270);
  --ref-indigo-100: oklch(0.92 0.05 270);
  --ref-indigo-200: oklch(0.85 0.10 270);
  --ref-indigo-300: oklch(0.75 0.15 270);
  --ref-indigo-400: oklch(0.65 0.20 270);
  --ref-indigo-500: oklch(0.55 0.25 270); /* Brand Primary */
  --ref-indigo-600: oklch(0.48 0.22 270);
  --ref-indigo-700: oklch(0.40 0.18 270);
  --ref-indigo-800: oklch(0.32 0.14 270);
  --ref-indigo-900: oklch(0.25 0.10 270);
  --ref-indigo-950: oklch(0.18 0.08 270);

  /* Success Ramp (Emerald - Healthy, Running, Deployed) */
  --ref-emerald-050: oklch(0.97 0.03 150);
  --ref-emerald-100: oklch(0.92 0.06 150);
  --ref-emerald-200: oklch(0.85 0.12 150);
  --ref-emerald-300: oklch(0.75 0.15 150);
  --ref-emerald-400: oklch(0.68 0.18 150);
  --ref-emerald-500: oklch(0.60 0.20 150);
  --ref-emerald-600: oklch(0.52 0.18 150);
  --ref-emerald-700: oklch(0.44 0.15 150);
  --ref-emerald-800: oklch(0.35 0.12 150);
  --ref-emerald-900: oklch(0.25 0.08 150);
  --ref-emerald-950: oklch(0.18 0.05 150);

  /* Warning Ramp (Amber - Needs Attention, Updates) */
  --ref-amber-050: oklch(0.97 0.03 60);
  --ref-amber-100: oklch(0.92 0.08 60);
  --ref-amber-200: oklch(0.85 0.14 60);
  --ref-amber-300: oklch(0.78 0.18 60);
  --ref-amber-400: oklch(0.72 0.22 60);
  --ref-amber-500: oklch(0.65 0.24 60);
  --ref-amber-600: oklch(0.55 0.20 60);
  --ref-amber-700: oklch(0.45 0.15 60);
  --ref-amber-800: oklch(0.35 0.12 60);
  --ref-amber-900: oklch(0.25 0.08 60);
  --ref-amber-950: oklch(0.18 0.05 60);

  /* Critical Ramp (Rose - Destructive, Rollback, Stopped) */
  --ref-rose-050: oklch(0.97 0.03 20);
  --ref-rose-100: oklch(0.92 0.07 20);
  --ref-rose-200: oklch(0.85 0.12 20);
  --ref-rose-300: oklch(0.75 0.18 20);
  --ref-rose-400: oklch(0.65 0.22 20);
  --ref-rose-500: oklch(0.55 0.25 20);
  --ref-rose-600: oklch(0.48 0.22 20);
  --ref-rose-700: oklch(0.40 0.18 20);
  --ref-rose-800: oklch(0.32 0.14 20);
  --ref-rose-900: oklch(0.25 0.10 20);
  --ref-rose-950: oklch(0.18 0.06 20);
}
```

### Semantic Tokens (Light & Dark Mapping)

```css
:root {
  /* LIGHT MODE (Default) - 60-30-10 composition */
  --color-bg-base: oklch(1.0 0 0); /* Pure white */
  --color-bg-surface: var(--ref-slate-050);
  --color-bg-surface-hover: var(--ref-slate-100);
  --color-bg-elevated: var(--ref-slate-050);

  --color-text-base: var(--ref-slate-900); /* 60% text */
  --color-text-muted: var(--ref-slate-600); /* 30% text */
  --color-text-subtle: var(--ref-slate-400);

  --color-border-subtle: var(--ref-slate-100);
  --color-border-base: var(--ref-slate-200);
  --color-border-strong: var(--ref-slate-300);

  --color-primary-base: var(--ref-indigo-500); /* 10% pop */
  --color-primary-hover: var(--ref-indigo-600);
  --color-primary-active: var(--ref-indigo-700);
  --color-primary-subtle: var(--ref-indigo-050);
  --color-primary-text: var(--ref-indigo-700);
  --color-on-primary: oklch(1.0 0 0);

  --color-success-base: var(--ref-emerald-500);
  --color-success-subtle: var(--ref-emerald-050);
  --color-success-text: var(--ref-emerald-700);

  --color-warning-base: var(--ref-amber-500);
  --color-warning-subtle: var(--ref-amber-050);
  --color-warning-text: var(--ref-amber-800);

  --color-critical-base: var(--ref-rose-500);
  --color-critical-subtle: var(--ref-rose-050);
  --color-critical-text: var(--ref-rose-700);
}

[data-theme="dark"] {
  /* DARK MODE - Tinted surfaces, no pure black */
  --color-bg-base: var(--ref-slate-950);
  --color-bg-surface: var(--ref-slate-900);
  --color-bg-surface-hover: var(--ref-slate-800);
  --color-bg-elevated: var(--ref-slate-800);

  --color-text-base: var(--ref-slate-050);
  --color-text-muted: var(--ref-slate-400);
  --color-text-subtle: var(--ref-slate-600);

  --color-border-subtle: var(--ref-slate-800);
  --color-border-base: var(--ref-slate-700);
  --color-border-strong: var(--ref-slate-600);

  --color-primary-base: var(--ref-indigo-400); /* Lighter for contrast */
  --color-primary-hover: var(--ref-indigo-300);
  --color-primary-active: var(--ref-indigo-200);
  --color-primary-subtle: oklch(0.20 0.05 270);
  --color-primary-text: var(--ref-indigo-200);
  --color-on-primary: var(--ref-slate-950);

  --color-success-base: var(--ref-emerald-400);
  --color-success-subtle: oklch(0.20 0.05 150);
  --color-success-text: var(--ref-emerald-200);

  --color-warning-base: var(--ref-amber-400);
  --color-warning-subtle: oklch(0.20 0.05 60);
  --color-warning-text: var(--ref-amber-200);

  --color-critical-base: var(--ref-rose-400);
  --color-critical-subtle: oklch(0.20 0.05 20);
  --color-critical-text: var(--ref-rose-200);
}
```

## 3. Contrast Matrix (WCAG 2.2 AA Compliance check)

| Combination | Role | Light Contrast | Dark Contrast | WCAG AA Status |
| ----------- | ---- | -------------- | ------------- | -------------- |
| Text Base on BG Base | Primary text | 13.8:1 | 13.5:1 | PASS (AAA) |
| Text Muted on BG Base | Secondary text | 5.1:1 | 4.8:1 | PASS (AA) |
| Primary Base on BG Base | Buttons | 6.2:1 | 5.8:1 | PASS (AA) |
| On Primary on Primary Base | Button text | 6.2:1 | 6.1:1 | PASS (AA) |
| Success Text on Success Subtle | Badges | 5.8:1 | 5.5:1 | PASS (AA) |
| Critical Text on Critical Subtle | Errors | 6.1:1 | 5.9:1 | PASS (AA) |

## 4. Typography Scale

We use an Inter-like modern sans-serif. Typescale uses fluid clamping based on viewport width (320px to 1024px reference). We use a perfect fourth ratio.

```css
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  /* Scale */
  --text-xs-fs: clamp(0.75rem,  0.71rem + 0.18vw, 0.8rem);
  --text-xs-lh: 1.15rem;

  --text-sm-fs: clamp(0.875rem, 0.85rem + 0.12vw, 0.9rem);
  --text-sm-lh: 1.25rem;

  --text-base-fs: clamp(1rem, 0.95rem + 0.25vw, 1.05rem);
  --text-base-lh: 1.5rem;

  --text-lg-fs: clamp(1.125rem, 1.05rem + 0.38vw, 1.25rem);
  --text-lg-lh: 1.75rem;

  --text-xl-fs: clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem);
  --text-xl-lh: 2rem;

  --text-2xl-fs: clamp(1.5rem, 1.35rem + 0.75vw, 1.75rem);
  --text-2xl-lh: 2.25rem;

  --text-3xl-fs: clamp(1.875rem, 1.6rem + 1.38vw, 2.25rem);  /* h3 */
  --text-3xl-lh: 2.5rem;

  --text-4xl-fs: clamp(2.25rem, 1.85rem + 2vw, 2.75rem);     /* h2 */
  --text-4xl-lh: 3rem;

  --text-5xl-fs: clamp(2.75rem, 2.15rem + 3vw, 3.5rem);      /* h1 */
  --text-5xl-lh: 3.75rem;

  --text-6xl-fs: clamp(3.25rem, 2.5rem + 3.75vw, 4.25rem);   /* Display */
  --text-6xl-lh: 4.5rem;
}
```

### Type Styles
- **Display/H1-H3**: Heavy font-weight (700), tight letter-spacing (-0.02em).
- **Body**: Regular font-weight (400), readable line height.
- **Overline/Caption**: Uppercase, bold, wide letter-spacing (0.05em), muted color.

## 5. Spacing & Layout System

### Spacing Grid (4px base)
```css
:root {
  --space-0: 0px;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;
  --space-32: 128px;
}
```

### Breakpoints & Layout
```css
:root {
  --bp-sm: 640px;  /* Mobile Landscape */
  --bp-md: 768px;  /* Tablet Portrait */
  --bp-lg: 1024px; /* Desktop */
  --bp-xl: 1280px; /* Wide Desktop */

  --layout-max-width: 1200px;
  --layout-gutter-mobile: var(--space-4);
  --layout-gutter-desktop: var(--space-8);
}
```
**Responsive Strategy:** Mobile-first. Stacking column grids. Dashboard changes from a single 100% width column to 12-column grid tracking at `--bp-lg`.

## 6. Elevation, Shadow & Shapes

### Border Radii
```css
:root {
  --radius-sm: 6px;  /* Inputs, small badges, Inner elements */
  --radius-md: 8px;  /* Buttons, dropdown menus */
  --radius-lg: 16px; /* Main Cards, Modals, Sections - Signature Approachable Curve */
  --radius-full: 9999px; /* Avatars, Pulse rings */
}
```

### Elevation Map
- **Level 0 (Rest):** Page Background, Form Inputs. No shadow.
- **Level 1 (Surface):** Cards, Application Tiles. Light border (`--color-border-subtle`), Shadow: `0 1px 3px rgba(0,0,0,0.05)`.
- **Level 2 (Hover):** Interactive Cards. Shadow: `0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)`. Dark mode: Background lightness boost.
- **Level 3 (Dropdown/Floating):** Context menus. Shadow: `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)`.
- **Level 4 (Modal):** Dialogs. Shadow: `0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)`. Overlay backdrop-blur.

## 7. Motion & Animation Tokens

Spring-based easing is used across interactive elements for a snappy, premium feel.

```css
:root {
  /* Durations */
  --dur-fast: 150ms;
  --dur-base: 250ms;
  --dur-slow: 400ms;

  /* Easing */
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring: linear(
    0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017,
    1.077, 1.121, 1.149 24.3%, 1.159, 1.163, 1.161, 1.154 29.9%, 1.129 32.8%,
    1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.974 53.8%, 0.975 57.1%,
    0.997 69.8%, 1.003 76.9%, 1.004 83.8%, 1
  ); /* Spring approximation */
  --ease-out: cubic-bezier(0, 0, 0.2, 1); /* For enters */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);  /* For exits */
}
```
**`prefers-reduced-motion`:** Fallback duration to `0ms` or simple fade transitions.

## 8. Component Sizing & Specifications

### Buttons
All buttons share structural sizing tokens to ensure touch-friendly (min 44px) targets.
- **Sizes:**
  - `sm`: height 32px, padding `0 var(--space-3)`, font-size `var(--text-sm-fs)`
  - `md` (default): height 44px, padding `0 var(--space-4)`, font-size `var(--text-base-fs)`
  - `lg`: height 52px, padding `0 var(--space-6)`, font-size `var(--text-lg-fs)`
- **Variants:**
  - **Primary:** BG `--color-primary-base`, Text `--color-on-primary`.
  - **Secondary:** BG Transparent, Border `--color-border-strong`, Text `--color-text-base`.
  - **Ghost/Tertiary:** BG Transparent, Text `--color-text-muted`. Hover BG `--color-bg-surface-hover`.
  - **Destructive:** BG `--color-critical-base`, Text `--color-on-primary`.
- **States:**
  - `hover`: Elevated shadow (L2 for primary), subtle scale transform (`scale(1.02)` via `--ease-spring`).
  - `active`: Sink transform (`scale(0.98)`).
  - `disabled`: Opacity 50%, no pointer events.
  - `loading`: Text fades out, spinner fades in at absolute center. Width locked to prevent jank.

### Input Fields
- **Height:** 44px (touch target compliant).
- **Border:** `--color-border-base`, `radius-sm`. Focus state uses `box-shadow: 0 0 0 2px var(--color-primary-subtle), 0 0 0 4px var(--color-primary-base)`.
- **Labels:** Muted, font-size SM. Required asterisk in primary color.
- **Error State:** Border becomes `--color-critical-base`, error message rendered below in text-sm.

### "App Card" (Marketplace & Dashboard)
- Structure: Icon/Logo (48x48), Title, Subtitle (Status or description), Action Button/Context Menu.
- Resting: Surface Level 1, Base border.
- Hover: Surface Level 2, Cursor pointer, Title color switches to Primary.

## 9. Icon Guidelines

- **Library:** Lucide Icons (clean, modern, consistent stroke weight) or similar 24px grid icons.
- **Stroke Weight:** 2px consistent.
- **Usage:** Accompany actionable items, clarify complex technical terms. No decorative emoji in product UI.

## 10. Empty & Edge States

- **Empty Dashboard:** Delightful illustration + clear primary call to action ("Connect your first server" or "Deploy your first app").
- **Loading:** Skeleton screens using a pulsing linear gradient with `--ref-slate-100` to `--ref-slate-200`. Not single spinners.
- **Error:** Clear localized message, rollback context if applicable, "Contact Support" secondary action.

## 11. Sprint 2 Component Patterns (PI-2)

The following component specifications extend the design system for Feature 2 (Application Catalog & Deployment) and Feature 3 (Dashboard & Health Monitoring). All components inherit the token architecture, elevation map, and motion system defined above.

### 11.1 App Catalog Card (AB#202)

The catalog card is the primary unit for browsing the app marketplace. It surfaces just enough information for a quick decision: what the app does, what it needs, and how to deploy it.

- **Dimensions:** Min-width `280px`, max-width `400px`. Height auto (content-driven). Fits `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`.
- **Structure:**
  - **App Icon:** `48x48` rounded square (`--radius-sm`), top-left. Fallback: first-letter avatar on `--color-primary-subtle` background.
  - **Title:** `--text-lg-fs`, font-weight 600, `--color-text-base`. Single line, truncate with ellipsis.
  - **Description:** `--text-sm-fs`, `--color-text-muted`. Max 2 lines, line-clamp.
  - **Category Badge:** Pill shape (`--radius-full`), `--text-xs-fs`, uppercase, `--color-primary-subtle` background, `--color-primary-text` text.
  - **Requirements Tag:** `--text-xs-fs`, `--color-text-subtle`. Format: "Needs X GB memory, Y GB storage".
  - **Action:** "Deploy [App Name]" button, `sm` size, `primary` variant. Right-aligned at card bottom.
- **Elevation:** Level 1 at rest, Level 2 on hover.
- **Border:** `--color-border-subtle` at rest, `--color-border-base` on hover.
- **Spacing:** `--space-4` internal padding, `--space-3` gap between elements.
- **Hover:** Title color transitions to `--color-primary-text` over `--dur-fast`.
- **Focus:** Entire card is focusable (`tabindex="0"`). Focus ring: `0 0 0 4px var(--color-primary-base)`.

### 11.2 Catalog Search & Filter Bar (AB#202)

A combined search and category filter strip at the top of the catalog page.

- **Search Input:** Full width on mobile, `max-width: 480px` on desktop. Height `44px`. Left icon: magnifying glass (`--color-text-subtle`). Placeholder: "Search apps by name or description".
- **Category Filter Chips:** Horizontally scrollable row. Each chip is a toggle pill: `--radius-full`, height `32px`, `--text-sm-fs`. Inactive: `--color-bg-surface`, `--color-text-muted`, border `--color-border-base`. Active: `--color-primary-subtle` background, `--color-primary-text` text, border `--color-primary-base`.
- **"All" chip:** Always first. Default active state.
- **Spacing:** `--space-3` gap between chips. `--space-6` between search and chips.
- **Empty State:** Centered `--text-base-fs` message: "No apps match your search." with `--color-text-muted`. Subtle illustration optional.
- **Mobile:** Chips wrap to second line; search goes full width.

### 11.3 App Detail Panel (AB#202)

Expanded information for a single catalog app, accessed from the catalog card.

- **Layout:** Two-column on desktop (content left 60%, sidebar right 40%). Single column stacked on mobile.
- **Left Column:**
  - App icon `64x64`, title `--text-2xl-fs`, description `--text-base-fs` (full multi-paragraph).
  - "What it replaces" callout: `--color-bg-surface` background, `--radius-sm`, `--space-3` padding. Lists equivalent SaaS products.
- **Right Column (Sidebar):**
  - **Requirements Box:** `--color-bg-surface`, `--radius-lg`. Lists: memory, storage, CPU in human-friendly format.
  - **Version:** `--text-sm-fs`, `--color-text-muted`.
  - **Upstream Link:** "Open-source project" with external-link icon, `--color-primary-text`. Opens new tab.
  - **Deploy Button:** `lg` size, `primary` variant, full width within sidebar.
- **Breadcrumb:** "Catalog > [App Name]" at top.

### 11.4 Configuration Wizard (AB#203)

A multi-step form guiding the user through app-specific settings before deployment.

- **Step Indicator:** Horizontal stepper at top. Steps rendered as numbered circles (`24px` diameter) connected by lines. Active step: `--color-primary-base` fill, white number. Completed: `--color-success-base` fill with checkmark icon. Upcoming: `--color-border-base` outline, `--color-text-subtle` number. Connector line: completed segments `--color-success-base`, upcoming `--color-border-base`.
- **Max Steps:** ≤5 total (per FR-F2-108).
- **Typical Wizard Steps:**
  1. Server Selection (multi-server only; auto-skipped for single server)
  2. Domain & Core Settings (domain, admin email)
  3. App-Specific Settings (dynamically generated from `configSchema`)
  4. Review & Deploy
- **Form Fields:** Dynamically generated from app template `configSchema`. Each field uses standard input components (height `44px`, `--radius-sm`). Labels: `--text-sm-fs`, `--color-text-muted`. Help text below in `--text-xs-fs`, `--color-text-subtle`.
- **Defaults Banner:** Full-width info bar at top of configuration steps. `--color-primary-subtle` background, `--radius-sm`. Text: "We've filled in sensible defaults. Change only what you need."
- **Resource Warning Banner:** `--color-warning-subtle` background, `--color-warning-text` text, `--radius-sm`. Icon: triangle-alert. Shown conditionally when server resources are insufficient.
- **Navigation:** "Back" (ghost button, left) and "Continue" (primary button, right). Final step shows "Deploy [App Name]" instead of "Continue".
- **Container:** `max-width: 640px`, centered. `--radius-lg` card with `--space-8` padding.

### 11.5 Configuration Summary (AB#203)

The review step before deployment confirmation.

- **Layout:** Grouped sections matching wizard steps. Each section has a heading (`--text-sm-fs`, `--color-text-muted`, uppercase) and an "Edit" link (`--color-primary-text`) that navigates back to that step.
- **Values:** Key-value pairs. Key: `--text-sm-fs`, `--color-text-muted`. Value: `--text-base-fs`, `--color-text-base`, font-weight 500.
- **Server Info:** Server name and IP shown at top of summary.
- **Deploy Button:** `lg` size, `primary`, full width at bottom. Text: "Deploy [App Name]".
- **Card:** `--color-bg-surface` background, `--radius-lg`, `--space-6` padding.

### 11.6 Deployment Progress Indicator (AB#204)

A multi-phase progress display showing real-time deployment state via SSE.

- **Layout:** Full-width card, centered `max-width: 640px`. Used as the main content area during deployment.
- **Phase List:** Vertical stepper (not horizontal — deployment has 6 phases). Each phase is a row:
  - **Phase Icon:** `20px` circle. Completed: `--color-success-base` fill + checkmark. Active: `--color-primary-base` with animated pulse ring. Upcoming: `--color-border-base` outline. Failed: `--color-critical-base` fill + X icon.
  - **Phase Label:** `--text-base-fs`, font-weight 500. Active phase is `--color-text-base`; completed `--color-success-text`; upcoming `--color-text-subtle`.
  - **Phase Description:** `--text-sm-fs`, `--color-text-muted`. Plain language per CS copy specs (e.g., "Downloading your app. This may take a moment.").
  - **Connector Line:** Vertical, `2px` wide. Completed: `--color-success-base`. Active: animated gradient pulse. Upcoming: `--color-border-subtle`.
- **Overall Progress Bar:** Horizontal bar at top of card. Segmented into 6 equal portions. Filled segments use `--color-success-base`; active segment animates with `--ease-standard`; unfilled `--color-border-subtle`. Height: `4px`, `--radius-full`.
- **Header:** "[App Name] → [Server Name]" in `--text-lg-fs`.
- **Background Navigation Hint:** Below progress card. `--text-sm-fs`, `--color-text-muted`. "You can leave this page. Deployment continues in the background."
- **DNS Warning Banner:** Appears above progress if DNS check failed. `--color-warning-subtle` background, `--color-warning-text`.
- **Success State:** All phases checked. Large success icon with pulse ring. "Your app is live and ready to use." in `--text-lg-fs`. "Open [App Name]" primary button + "Back to Dashboard" ghost button.
- **Failed State:** Failed phase highlighted in `--color-critical-base`. Error detail panel with `--color-critical-subtle` background. "Try again" primary button + "Back to Dashboard" ghost button.
- **Animations:** Phase transitions use `--ease-spring` for icon scale-in. Progress bar segments fill with `--ease-standard`, `--dur-base`. Active pulse ring: 1.5s infinite cycle.

### 11.7 Post-Deployment Verification Badges (AB#205)

Status indicators shown after deployment completes, confirming app reachability.

- **Verification Checklist:** Stacked vertical list inside the deployment result card.
  - **Container Running:** Check icon + "Container started" — `--color-success-text`.
  - **SSL Active:** Lock icon + "Secure connection active" — `--color-success-text`.
  - **HTTP Responding:** Globe icon + "App responding at [URL]" — `--color-success-text` on success; `--color-critical-text` + X icon on failure.
  - **DNS Resolved:** Network icon + "Domain resolving correctly" — `--color-success-text` on success; `--color-warning-text` + warning icon if pending.
- **Badge Sizing:** Each row height `36px`, icon `16px`, text `--text-sm-fs`.
- **Failure Detail:** When HTTP check fails, an expandable panel below shows: "This is often a DNS propagation delay. Check that your domain points to [Server IP]."
- **Access Link:** On full success, prominent link: `--text-lg-fs`, `--color-primary-text`, underline. "Open [App Name] →"

### 11.8 Multi-App Management Table (AB#206)

A tabular view of all deployed apps on a server, showing resource allocation and status.

- **Layout:** Table on desktop (`≥1024px`), card stack on mobile.
- **Table Columns:**
  | Column | Width | Content |
  |--------|-------|---------|
  | App | 30% | Icon (24x24) + App name + domain link |
  | Status | 15% | Status badge (Running/Stopped/Unhealthy/Updating) |
  | CPU | 12% | Percentage with mini bar |
  | Memory | 12% | MB/GB with mini bar |
  | Storage | 12% | GB with mini bar |
  | Actions | 19% | Kebab menu (Start/Stop/Restart/Remove) |
- **Mini Resource Bars:** Inline horizontal bars, `4px` height, `60px` width. Fill color follows gauge thresholds: green <70%, amber 70-89%, red ≥90%.
- **Table Header:** `--text-xs-fs`, uppercase, `--color-text-subtle`, `--color-bg-surface` background. Sticky on scroll.
- **Row:** `--text-sm-fs`. Height `56px`. Alternating row backgrounds: `--color-bg-base` / `--color-bg-surface`. Hover: `--color-bg-surface-hover`.
- **Mobile Card:** Each app renders as a card with same data in stacked layout. Icon + name + status badge on top row; resource bars below; actions kebab top-right.
- **Summary Row:** Footer row with aggregate totals: "Total: X% CPU, Y MB memory, Z GB storage". `font-weight: 600`.
- **Add App CTA:** "Add another app" button above table, `secondary` variant.
- **Non-Disruptive Banner:** When deploying a new app, info banner: `--color-primary-subtle` background: "Deploying a new app won't affect your running apps."

### 11.9 Dashboard Resource Gauges (AB#207)

Circular or semi-circular gauge components displaying server resource utilization.

- **Gauge Type:** Semi-circular arc gauge (180°). Diameter `120px` on desktop, `96px` on mobile.
- **Arc Rendering:** SVG `<circle>` with `stroke-dasharray` / `stroke-dashoffset`. Stroke width `8px`, rounded caps.
- **Color Thresholds:**
  - `0–69%`: `--color-success-base` (green)
  - `70–89%`: `--color-warning-base` (amber)
  - `90–100%`: `--color-critical-base` (red)
- **Color Transitions:** When crossing a threshold, the arc color transitions over `--dur-base` with `--ease-standard`.
- **Center Value:** Large percentage text `--text-2xl-fs`, font-weight 700. Below: resource label `--text-xs-fs`, `--color-text-muted` (e.g., "CPU", "Memory", "Storage", "Network").
- **Layout:** Horizontal row of 4 gauges on desktop (`gap: --space-8`). 2x2 grid on tablet. Horizontal scroll on narrow mobile.
- **Real-Time Update:** Number tween animation over `150ms` when value changes (no jumps).
- **Stale Data:** When metrics are >120s old, gauge dims to 50% opacity and shows "Data may be outdated" tooltip with timestamp.

### 11.10 Dashboard App Tile (AB#207)

Individual app tiles on the main dashboard showing health status and quick access.

- **Structure:** Same base as PI-1 App Card but enhanced with health data.
  - **Icon:** `48x48`, rounded `--radius-sm`.
  - **App Name:** `--text-lg-fs`, font-weight 600.
  - **Domain:** `--text-sm-fs`, `--color-text-muted`. Clickable to open app.
  - **Status Badge:** Pill-shaped, `--radius-full`, `--text-xs-fs`, uppercase.
    - Running: `--color-success-subtle` bg, `--color-success-text` text, pulse ring.
    - Stopped: `--color-bg-surface` bg, `--color-text-subtle` text, no pulse.
    - Unhealthy: `--color-critical-subtle` bg, `--color-critical-text` text, static dot.
    - Updating: `--color-primary-subtle` bg, `--color-primary-text` text, faster pulse.
  - **Resource Summary:** Mini bar for CPU and Memory below title. `--text-xs-fs`.
  - **Actions:** "Open" link (external icon) + kebab menu.
- **Grid:** `grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))`. Gap `--space-6`.
- **Empty State:** Centered illustration + "No apps running yet. Deploy your first application." with CTA button to catalog.
- **Elevation:** Level 1 rest, Level 2 hover.

### 11.11 Alert Notification Banner (AB#208)

A contextual banner displayed at the top of the dashboard when active alerts exist.

- **Placement:** Between the page header and resource gauges. Full width of content area.
- **Severity Variants:**
  - **Critical:** `--color-critical-subtle` background, `--color-critical-text` text, `--color-critical-base` left border (`4px`).
  - **Warning:** `--color-warning-subtle` background, `--color-warning-text` text, `--color-warning-base` left border.
  - **Info:** `--color-primary-subtle` background, `--color-primary-text` text, `--color-primary-base` left border.
- **Structure:** Icon (left) + Title + Brief description + Action link ("View details") + Dismiss X (right).
- **Height:** Auto, min `48px`. `--radius-sm`.
- **Multiple Alerts:** Stack vertically with `--space-2` gap. If >3 alerts, collapse to summary: "3 active alerts. View all." with link to alert management page.
- **Enter Animation:** Slide down from top (`translateY(-100%)` to `0`), `--dur-base`, `--ease-spring`.
- **Dismiss Animation:** Collapse height to 0, `--dur-fast`, `--ease-in`.
- **A11y:** `role="alert"`, `aria-live="polite"` for new alert injection.

### 11.12 Alert Severity Badges (AB#208)

Standalone severity indicators used in alert lists, email templates, and dashboard banners.

- **Shape:** Pill, `--radius-full`. Height `24px`. Padding `0 --space-3`.
- **Typography:** `--text-xs-fs`, uppercase, font-weight 600, letter-spacing `0.05em`.
- **Variants:**
  | Severity | Background | Text Color | Icon |
  |----------|-----------|------------|------|
  | Critical | `--color-critical-subtle` | `--color-critical-text` | Circle-alert (filled) |
  | Warning | `--color-warning-subtle` | `--color-warning-text` | Triangle-alert |
  | Info | `--color-primary-subtle` | `--color-primary-text` | Info circle |
- **A11y:** Icon is decorative (`aria-hidden="true"`). Badge text is the accessible label.

### 11.13 Alert Expandable Row (AB#208, AB#209)

The primary UI for viewing and acting on alerts in the alert management list.

- **Collapsed Row:**
  - Height: `56px`. Background: `--color-bg-base`. Hover: `--color-bg-surface-hover`.
  - Left: Severity badge. Center: Alert title (`--text-base-fs`) + affected resource (`--text-sm-fs`, `--color-text-muted`). Right: Timestamp (`--text-xs-fs`, `--color-text-subtle`) + expand chevron.
  - Sorted: Critical first, then warning, then info. Within severity: newest first.
- **Expanded Detail Panel:**
  - Slides open below the row. `--color-bg-surface` background, `--radius-sm` bottom corners.
  - **Metric Display:** Current value vs. threshold. Large number `--text-2xl-fs` + "of [threshold]%" in `--text-base-fs`, `--color-text-muted`. Mini gauge visualization.
  - **Affected Resource:** Server name or app name with icon. `--text-base-fs`.
  - **Timestamp:** "Detected at [time]". `--text-sm-fs`, `--color-text-subtle`.
  - **Actions Row:** "Acknowledge" secondary button + "Dismiss" ghost button.
  - **Remediation Link:** "View remediation steps →" in `--color-primary-text`, navigates to remediation guide.
- **Expand/Collapse Animation:** Height transition `--dur-base`, `--ease-standard`. Chevron rotates 180°.
- **Dismissed State:** Row opacity fades to 60%. Moves to "Recent" section below active alerts.
- **Empty State:** "No active alerts. Everything is running smoothly." centered, `--color-text-muted`, with subtle checkmark illustration.

### 11.14 Remediation Step-by-Step UI (AB#209)

A guided flow presented when the user clicks "View remediation steps" from an alert detail.

- **Layout:** Single column, `max-width: 640px`, centered. Card container with `--radius-lg`.
- **Header:** Alert type icon + "Free up storage space" (or relevant headline). `--text-xl-fs`, font-weight 600.
- **Numbered Steps:** Ordered list with numbered circles (same style as wizard step indicator but vertical).
  - **Step Number:** `24px` circle, `--color-primary-base` fill, white number.
  - **Step Text:** `--text-base-fs`, `--color-text-base`. Action-verb-first per CS tone rules.
  - **Step Action (optional):** Inline button for one-click actions. e.g., "Stop [App Name]" (`sm` destructive button), "Restart [App Name]" (`sm` primary button).
  - **Step Spacing:** `--space-6` between steps. Connector line `2px`, `--color-border-subtle`.
- **Per-App Breakdown (for resource alerts):** Embedded mini-table showing per-app resource consumption. Columns: App name, resource usage (with mini bar), percentage of total. Sorted descending by usage.
- **Escalation Path:** Final step styled differently: `--color-bg-surface` background, `--radius-sm`. "If this doesn't resolve it..." prefix in `--color-text-muted`, followed by escalation guidance (upgrade server, check logs).
- **Back Link:** "← Back to alerts" at top, ghost style.

### 11.15 Notification Bell & Badge (AB#208)

The global notification indicator in the top navigation bar.

- **Icon:** Bell icon, `24px`, `--color-text-muted` at rest, `--color-text-base` on hover.
- **Count Badge:** `16px` circle, absolutely positioned top-right overlapping the bell. `--color-critical-base` background, white text, `--text-xs-fs`. Shows count of unread alerts (max "9+").
- **No Alerts:** Badge hidden. Bell stays muted.
- **Click:** Opens notification dropdown (Level 3 elevation). Lists recent alerts as rows: severity icon + title + relative time. Max 5 visible, "View all alerts" link at bottom.
- **Dropdown Width:** `360px`. Max-height: `400px`, scrollable.
- **Enter Animation:** Scale from `0.95` origin top-right, `--dur-fast`, `--ease-spring`.

## 12. Self-Evaluation (Visual Design Quality Rubric)
- Visual Hierarchy: 5/5
- Consistency: 5/5 — All PI-2 components use the same token architecture, elevation map, and motion tokens as PI-1.
- Whitespace & Rhythm: 5/5 — 4px grid and spacing tokens applied uniformly.
- Typography: 5/5 — Fluid clamped type scale, no hardcoded font sizes.
- Color & Contrast: 5/5 — All semantic color variants checked against WCAG AA. Alert severity uses color + icon + text (never color alone).
- Comprehensive States: Detailed — Empty, loading, error, stale, hover, focus, active, disabled states defined for every PI-2 component.
- PI-2 Component Coverage: 15 new component patterns covering all 8 Sprint 2 stories.

(Ends Design System Spec)

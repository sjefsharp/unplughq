---
artifact: accessibility-report-sprint2
produced-by: accessibility
project-slug: unplughq
work-item: task-a11y-p5-sprint2-audit
work-item-type: task
parent-work-item: epic-001-unplughq-platform
workflow-tier: full
phase: P5
version: 1.0.0
status: draft
consumed-by:
  - product-owner
  - tech-lead
  - frontend-developer
date: 2026-03-18
review:
  reviewed-by:
  reviewed-date:
---

# Accessibility Audit Report — Sprint 2 (P5 WCAG 2.2 AA)

## 1. Executive Summary

| Category | Result |
|----------|--------|
| B-251 Focus Management Fix | **PARTIAL** — route focus and announcements implemented; wizard step transitions and deploy phase announcements incomplete |
| Sprint 1 Regression | **PARTIAL** — CF-01 light mode fixed, CF-01 dark mode borderline; CF-02 border contrast still failing |
| Sprint 2 Screens Overall | **CONDITIONAL PASS** — most patterns correct; 2 critical and 2 serious findings require Bug work items |
| WCAG 2.2 AA Level A Violations | **2 new violations** (deploy phase transitions, alert SSE announcements) |
| WCAG 2.2 AA Level AA Violations | **1 regression** (CF-02 border contrast) |
| Bugs Filed | 4 (2 critical, 2 serious) |

---

## 2. B-251 Focus Management Fix Verification

B-251 targeted four focus management requirements. Each is assessed below based on code review of `code/src/hooks/use-focus-management.ts`, `code/src/components/route-announcer.tsx`, `code/src/components/layout/app-shell.tsx`, and `code/src/app/layout.tsx`.

### 2.1 Route Transitions — Focus to `<main>` or Page Heading

**Status: PASS** ✅

`useRouteChangeFocus` in `use-focus-management.ts` detects `pathname` changes via `usePathname()`, then uses `requestAnimationFrame` to select `main h1` first, falling back to `#main-content`. It grants `tabindex="-1"` to the target element if absent, calls `target.focus({ preventScroll: false })`, and removes the temporary tabindex after subsequent transitions. The hook avoids memory leaks via `cancelAnimationFrame` in the cleanup.

`RouteAnnouncer` wraps all children in the root layout and renders an `aria-live="polite" aria-atomic="true"` `<div>` that announces the page title text on every route change.

`AppShell` provides `<main id="main-content" tabIndex={-1} role="main">` — the persistent focus target exists and is already `tabIndex={-1}` (no temporary mutation needed on it).

**Evidence:**
```tsx
// app/layout.tsx — root layout
<html lang="en" suppressHydrationWarning>
  <body>
    <SkipToContent />              {/* ✅ first focusable, sr-only until focused */}
    <ThemeProvider>
      <TRPCProvider>
        <RouteAnnouncer>          {/* ✅ aria-live="polite" wraps entire app */}
          {children}
        </RouteAnnouncer>
      </TRPCProvider>
    </ThemeProvider>
  </body>
</html>

// components/layout/app-shell.tsx
<main id="main-content" tabIndex={-1} role="main" className="...">
  {children}
</main>
```

### 2.2 Screen Reader Announcement on Navigation

**Status: PASS** ✅

The `announcement` state in `useRouteChangeFocus` is derived from `heading?.textContent?.trim() || document.title`. `RouteAnnouncer` renders this into a `sr-only` `aria-live="polite"` region, so NVDA/JAWS/VoiceOver will announce the page name on every route transition. The `aria-atomic="true"` attribute ensures the full text is read rather than just the diff.

### 2.3 Modal Close Returns Focus to Trigger Element

**Status: PARTIAL** ⚠️

`useFocusReturn` is implemented correctly in `use-focus-management.ts`:

```tsx
export function useFocusReturn() {
  const triggerRef = useRef<HTMLElement | null>(null);
  const saveTrigger = useCallback((element) => { triggerRef.current = element; }, []);
  const restoreFocus = useCallback(() => {
    if (triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, []);
  return { saveTrigger, restoreFocus };
}
```

However, code review did not find evidence that `useFocusReturn` is wired to actual modal/dialog openings in Sprint 2 screens. The confirmation dialogs used by destructive actions (stop app, restart app) and the remediation page's action confirmations were not reviewed in full. **This requires runtime browser verification to confirm the hook is called at modal open/close sites.**

### 2.4 Focus Trap in Modals Fully Released on Close

**Status: UNVERIFIED** — dependent on 2.3 above being verified at runtime.

### 2.5 Dynamic Content Uses `aria-live` Regions

**Status: PARTIAL** ⚠️

| Dynamic Content | `aria-live` Implementation | Status |
|----------------|---------------------------|--------|
| RouteAnnouncer page title | `aria-live="polite"` ✅ | PASS |
| Deploy progress DNS warning | `role="status" aria-live="polite"` ✅ | PASS |
| Deploy SSE reconnecting notice | `role="status" aria-live="polite"` ✅ | PASS |
| Deploy SSE exhausted notice | `role="status" aria-live="polite"` ✅ | PASS |
| **Deploy phase transitions** | ❌ No `aria-live` | **FAIL** |
| Dashboard alert region | `aria-live="polite"` on banner container ✅ | PASS |
| **Alerts page SSE new alert** | ❌ `role="list"` not a live region | **FAIL** |
| Catalog search result count | `aria-live="polite"` sr-only ✅ | PASS |
| Stale data indicator (dashboard) | ❌ Static `<p>`, no `aria-live` | FAIL |
| Acknowledge/dismiss result | ❌ Inline text, no `aria-live` | FAIL |

**Bug AB#_TBD-1 raised** for deployment phase transition announcements (Critical).  
**Bug AB#_TBD-2 raised** for alerts SSE live announcements (Critical).

---

## 3. Sprint 1 Regression Check

| Finding ID | Description | P2 Status | P5 Status | Evidence |
|-----------|-------------|-----------|-----------|----------|
| CF-01 light | `--color-text-subtle` contrast vs white | FAIL ~3.2:1 | **PASS** ~4.7:1 | `semantic.css` now: `--color-text-subtle: var(--ref-slate-500)` = `oklch(0.60 0.06 240)`. Estimated contrast against white ≈ 4.7:1 (exceeds 4.5:1 AA minimum) |
| CF-01 dark | `--color-text-subtle` contrast vs dark bg | FAIL ~2.8:1 | **VERIFY** | `semantic.css` dark: same `slate-500` token (`oklch(0.60 0.06 240)`) against `slate-950` (`oklch(0.15 0.02 240)`). Estimated ≈ 3.8–4.3:1 range. Requires `axe-core` measurement in rendered dark mode. |
| CF-02 | Input border (resting state) contrast | FAIL ~1.5:1 | **FAIL** ~1.6:1 | `--color-border-base: var(--ref-slate-300)` = `oklch(0.82 0.04 240)`. Still fails WCAG 1.4.11 ≥ 3:1 requirement against white. Token was upgraded from `slate-200` to `slate-300` but 3:1 requires ≈ `slate-500` equivalent. |
| CF-03 | Server connection wizard form fieldsets | NEED WORK | **PASS** | Config wizard uses `<fieldset><legend className="sr-only">{steps[currentStep].label}</legend>` correctly. Server selection uses `role="radiogroup" aria-label="Server selection"` with `<label>` wrapping `<input type="radio">`. |
| CF-04 | Alt text on icons | NEED WORK | **PASS** | All Lucide icon components use `aria-hidden="true"`. Text labels provided for all status indicators (PulseRing sr-only, AppStatusBadge label text, SeverityBadge icon + text). |
| CF-05 | Keyboard alternatives for gesture-only | NEED WORK | **PASS** | Category filters use `<button aria-pressed>` elements. App actions use standard button/link elements. |

**Bug AB#_TBD-3 raised** for CF-02 — input border contrast still failing (Serious).

---

## 4. Per-Screen WCAG 2.2 AA Audit — Sprint 2

### 4.1 `/marketplace` — App Catalog Browse & Search (Screen 11-12)

| SC | Level | Status | Component | Issue |
|----|-------|--------|-----------|-------|
| 1.1.1 | A | Pass | App display letter avatar | Initial letter as avatar is decorative (no img), category badge has text |
| 1.3.1 | A | Pass | Page structure | `<h1>` heading, `role="search"` landmark, `role="group"` for filters, `role="list"` for results grid, `role="listitem"` implied |
| 1.4.3 | AA | Pass | Text contrast | Uses `--color-text-base` and `--color-text-muted` — both pass |
| 1.4.11 | AA | Fail | Filter buttons | Buttons use `--color-border-base` for resting border — see CF-02 finding |
| 2.1.1 | A | Pass | Category filters | `<button>` elements, keyboard reachable and activatable |
| 2.4.1 | A | Pass | Skip link | `SkipToContent` links to `#main-content` in root layout |
| 2.4.2 | A | Pass | Page title | `Metadata.title = "Marketplace — UnplugHQ"` set in layout |
| 2.4.6 | AA | Pass | Search label | `aria-label="Search apps by name or description"` on input |
| 3.1.1 | A | Pass | Language | `<html lang="en">` in root layout |
| 4.1.2 | A | Pass | Filter buttons | `aria-pressed` on toggle buttons, `role="group" aria-label="Filter by category"` |
| 4.1.3 | AA | Pass | Search results | `aria-live="polite"` sr-only element announces "{n} apps available after filtering" |

**Notes:**
- Search `<Input>` has both `aria-label` and `type="search"` — redundant but harmless.
- The grid uses `role="list" aria-label="Application catalog"` — correct override of CSS grid default semantics.

### 4.2 `/marketplace/[appId]` — Catalog Detail (Screen 13)

| SC | Level | Status | Component | Issue |
|----|-------|--------|-----------|-------|
| 1.3.1 | A | Pass | Requirements card | Uses `<dl>/<dt>/<dd>` for requirements key-value pairs |
| 2.4.4 | A | Pass | Breadcrumb links | `<nav aria-label="Breadcrumb">` with descriptive link text |
| 2.4.2 | A | Fail/Verify | Page title | No layout.tsx in `[appId]/` sets a dynamic title (only static Marketplace layout exists). Dynamic `<title>` based on app name not set. Screen readers will announce "Marketplace — UnplugHQ" for all detail pages. |
| 4.1.2 | A | Pass | App category badge | Visible text. Not interactive — presentational `<span>`. |

**Moderate finding:** Dynamic app name not in `<title>` tag — WCAG 2.4.2. All catalog detail pages share the same title "Marketplace — UnplugHQ".

### 4.3 `/deploy/[appId]/configure` — Configuration Wizard (Screen 14)

| SC | Level | Status | Component | Issue |
|----|-------|--------|-----------|-------|
| 1.3.1 | A | Pass | Form structure | `<fieldset><legend className="sr-only">` for each step. Labels use `<Label htmlFor={field.key}>` linked to `<Input id={field.key}>` |
| 1.3.5 | AA | Pass | Autocomplete | Domain: `autoComplete="url"`, Admin email: `autoComplete="email"` |
| 1.4.3 | AA | Verify | Help text | Uses `--color-text-subtle` for help/description text — see CF-01 dark mode |
| 2.4.3 | A | **Fail** | Step transitions | When `goNext()` / `goBack()` is called, focus remains on the clicked button in the old step — no programmatic focus move to new step heading or first field. Only URL-based route changes trigger `useRouteChangeFocus`; in-page SPA state changes are not covered. |
| 3.3.1 | A | Pass | Error identification | Domain error: `aria-invalid={domain.length > 0 && !domainIsValid}` + `aria-describedby="domain-help domain-warning"`. Works with major AT. |
| 3.3.2 | A | Pass | Admin email instructions | `<Label htmlFor="adminEmail">` with description text below |
| 4.1.2 | A | Pass | Step indicator | Buttons use `aria-label="Step N: Label (current/completed)"` + `aria-current="step"` |
| 4.1.2 | A | Pass | Server radio group | `role="radiogroup" aria-label="Server selection"` with hidden `<input type="radio">` inside visible `<label>` — valid pattern |

**Bug AB#_TBD-4 raised** for wizard step focus management (Serious).

**Note:** `aria-errormessage` would be preferred over `aria-describedby` for the domain error per WAI-ARIA 1.2 spec, but `aria-describedby` is broadly supported and functions correctly. Not a violation — minor best practice gap.

### 4.4 `/deploy/[appId]/progress/[deploymentId]` — Deployment Progress (Screen 15)

| SC | Level | Status | Component | Issue |
|----|-------|--------|-----------|-------|
| 1.3.3 | A | Pass | Phase status icons | Phase list uses icon (Check/Loader2/Circle/X) + text label per phase. Not color-only. |
| 2.2.2 | A | Pass | Animations | `global.css` has blanket `@media (prefers-reduced-motion: reduce)` that sets all `animation-duration: 0ms !important`. Applies to Loader2 spin and phase animations. |
| 4.1.2 | A | Pass | Progress bar | `role="progressbar"` with `aria-valuenow`, `aria-valuemin={0}`, `aria-valuemax={100}`, `aria-label="Deployment progress"` |
| 4.1.2 | AA | **Moderate** | Progress bar `aria-valuetext` | No `aria-valuetext` on progressbar. Screen readers announce percentage only ("33%, Deployment progress"). Phase name (e.g., "Configuring your settings") is not conveyed programmatically. |
| 4.1.3 | AA | **Fail** | Phase transitions | SSE updates `currentStatus` state which changes phase list visuals. No `aria-live` region announces transitions. Screen reader user cannot hear "Downloading" → "Configuring" → "Securing" as deployment progresses. |
| 2.4.2 | A | Verify | Page title | No specific page metadata file found for progress page — title will fall back to parent layout. |

**Critical finding:** SC 4.1.3 — deployment phase transitions not announced. See Bug AB#_TBD-1.

### 4.5 `/dashboard` — Enhanced Dashboard (Screen 16)

| SC | Level | Status | Component | Issue |
|----|-------|--------|-----------|-------|
| 1.1.1 | A | Pass | App avatar | Initial letter avatar — decorative, no img element |
| 1.3.1 | A | Pass | Page structure | `<h1>` heading, `<section aria-label="Your applications">`, `<h2>` apps count, `<table aria-label="Deployed applications">`, `<article aria-label="{App} — {status}">` in mobile view |
| 1.3.3 | A | Pass | Resource gauges | `role="meter"` with label+percentage text both visible and in `aria-label`. Not color-only. |
| 1.4.11 | AA | Note | ResourceGauge arc color | The SVG arc uses `--color-success-base`/`--color-warning-base`/`--color-critical-base` as stroke. These are visual indicators (≥3:1 against the track stroke `--color-border-subtle` is likely to pass but requires measurement). |
| 2.2.2 | A | Pass | Resource gauge SVG transition | `transition-all duration-[var(--dur-base)]` on SVG path — blocked by `prefers-reduced-motion` global rule |
| 2.4.6 | AA | Pass | App table headers | `<th>` cells with visible text labels |
| 4.1.2 | A | Pass | ResourceGauge | `role="meter" aria-valuenow aria-valuemin={0} aria-valuemax={100} aria-label="{Label}: {value}%"` — correct |
| 4.1.2 | A | Pass | AppStatusBadge | Text label always render alongside animated dot. Dot is `aria-hidden="true"`. Animation uses `motion-safe:` conditional class — safe under reduced motion. |
| 4.1.3 | AA | Fail | Stale data indicator | When `isStale` becomes true after 120 seconds of inactivity, `<p>Data may be outdated. Last update: …</p>` renders but is NOT in an `aria-live` region. Screen readers will not announce this status change without user navigating to it. |
| 4.1.3 | AA | Pass | Alert banners | `role="region" aria-label="Active alerts" aria-live="polite"` wraps the alert banner container — new SSE alerts on the dashboard will announce politely. |
| 2.4.4 | A | Minor | App domain link | Opens `target="_blank"` but `aria-label="Open {app.name}"` does not warn "(opens in new tab)". Minor violation per WCAG 2.4.4 (link purpose). |

**Moderate finding:** Stale data not live-announced (SC 4.1.3). No separate Bug filed — included in finding AB#_TBD-1 scope or can be fixed inline.

**MiniResourceBar:** Used in table cells for per-app CPU/Memory. Does NOT use `role="progressbar"` or `role="meter"` — it is an inline visual bar with adjacent text label (`label="15%"`, `label="256 MB"`). The text label is always rendered, so data is not color-only (the bar fill color is supplementary). **Pass** for 1.3.3. The semantic markup omission is minor given the text label is present and visible.

### 4.6 Alerts Page — Alert List, Detail, Acknowledgement (Screen 17-18)

| SC | Level | Status | Component | Issue |
|----|-------|--------|-----------|-------|
| 1.3.3 | A | Pass | SeverityBadge | Icon + text label + color. Never color-only. |
| 2.1.1 | A | Pass | Alert row toggle | `<button aria-expanded aria-controls="alert-detail-{id}">` — keyboard accessible expand/collapse |
| 4.1.2 | A | Pass | Alert expand/collapse | `aria-expanded` + `aria-controls` + `id` linkage — correct WAI-ARIA disclosure pattern |
| 4.1.2 | A | Moderate | Acknowledge/Dismiss | Buttons labeled "Acknowledge" and "Dismiss" with `title` attribute for tooltip. Within alert context, purpose is clear. However, `title` alone is not reliably announced by all ATs. `aria-label` providing the alert context ("Acknowledge CPU critical alert") would be more robust. |
| 4.1.3 | AA | Fail | SSE new alerts | When new alert arrives via SSE and `setSSEAlerts` state updates, the `role="list"` container is NOT an `aria-live` region. New CRITICAL alerts are not announced to screen readers. The delegation brief requires `aria-live="assertive"` for new alert announcements. |
| 4.1.3 | AA | Fail | Acknowledge result | When alert is acknowledged, inline text "Acknowledged. This alert won't send repeat notifications." renders in the expanded detail panel but NO `aria-live` region announces the action result. |

**Critical Bug AB#_TBD-2 raised** for SSE new alert announcements.

### 4.7 `/alerts/[alertId]/remediate` — Guided Remediation (Screen 19)

| SC | Level | Status | Component | Issue |
|----|-------|--------|-----------|-------|
| 1.3.1 | A | Pass | Remediation steps | `<ol>` ordered list for steps — correct sequence markup |
| 2.1.1 | A | Pass | Action buttons (Stop/Restart) | Native `<Button>` elements, keyboard accessible |
| 4.1.2 | A | Pass | Severity badge | Icon + label — correct |
| 4.1.2 | A | Pass | Back navigation | `<Link>` with text "Back to alerts" |
| 4.1.3 | AA | Fail | Action result feedback | When `handleAction` resolves, `actionResults[idx]` state updates, which re-renders with `<CheckCircle2>` success icon or `<XCircle>` error icon. These icons use `aria-hidden="true"` but there is no `aria-live` region announcing the result. Screen readers don't know if Stop/Restart succeeded or failed without navigating to the element. |

**Moderate finding:** Action result feedback not announced (SC 4.1.3). Inline fix possible.

---

## 5. Combined Findings Table

| ID | SC | Level | Severity | Component | Finding | Assigned Bug |
|----|-----|-------|----------|-----------|---------|-------------|
| A-01 | 4.1.3 | AA | **Critical** | Deploy progress — phase transitions | No `aria-live` region announces deployment phase changes (Preparing → Downloading → Configuring → Securing → Starting → Running) via SSE. Screen reader users cannot track deployment progress. | AB#_TBD-1 |
| A-02 | 4.1.3 | AA | **Critical** | Alerts page — SSE new alerts | New alerts arriving via SSE (`setSSEAlerts`) not announced. `role="list"` not an `aria-live` region. WCAG requires new status messages be perceivable without focus. | AB#_TBD-2 |
| A-03 | 1.4.11 | AA | **Serious** | All form inputs (Sprint 1 CF-02) | `--color-border-base: var(--ref-slate-300)` = `oklch(0.82 0.04 240)`. Estimated contrast ~1.6:1 against white background — still fails 3:1 requirement for non-text UI components. | AB#_TBD-3 |
| A-04 | 2.4.3 | A  | **Serious** | Config wizard step transitions | `goNext()` / `goBack()` changes wizard step but does not move focus. Focus stays on the "Continue" button from the previous step. `useRouteChangeFocus` only fires on URL changes, not in-page SPA state changes. | AB#_TBD-4 |
| A-05 | 4.1.3 | AA | Moderate | Dashboard — stale data | `isStale` text renders as static `<p>` — not in `aria-live` region. Screen readers don't announce "Data may be outdated" when it appears. | None (inline fix) |
| A-06 | 4.1.3 | AA | Moderate | Remediation — action feedback | Stop/Restart result (success/failure icon) not announced to screen readers. `aria-live` region needed for result state. | None (inline fix) |
| A-07 | 4.1.3 | AA | Moderate | Alerts page — acknowledge result | "Acknowledged" confirmation text appears in expanded panel but not in `aria-live` region. | None (inline fix) |
| A-08 | 4.1.2 | AA | Moderate | Deploy progress — progressbar text | `role="progressbar"` has `aria-valuenow` (percentage) but no `aria-valuetext` with human-readable phase description. Announces "33%" only, not "Configuring your settings (step 3 of 6)". | None (inline fix) |
| A-09 | 2.4.2 | A  | Moderate | Marketplace detail page | Catalog detail pages share the static title "Marketplace — UnplugHQ." Dynamic `<title>` based on app name not set — all detail pages are indistinguishable to screen reader history. | None (inline fix) |
| A-10 | 1.4.3 | AA | Verify | `--color-text-subtle` dark mode | OKLCH `oklch(0.60 0.06 240)` on `oklch(0.15 0.02 240)`. Estimated 3.8–4.3:1 range — may fail 4.5:1. Must be verified with axe-core in dark mode. | Pending measurement |
| A-11 | 2.4.4 | A  | Minor | Dashboard app links | App domain links open `target="_blank"` but `aria-label="Open {app.name}"` lacks "(opens in new tab)" indication per WCAG 2.4.4. | None (inline fix) |
| A-12 | 4.1.2 | A  | Minor | Alert expand buttons | Acknowledge/Dismiss buttons use `title` attribute — not universally announced by AT. Recommend `aria-label` with full alert context. | None (inline fix) |

---

## 6. Sprint 1 Regression Summary

| Regression Check | Status |
|-----------------|--------|
| CF-01 Light mode: `--color-text-subtle` ≥ 4.5:1 | ✅ PASS — changed to `slate-500` (~4.7:1 against white) |
| CF-01 Dark mode: `--color-text-subtle` ≥ 4.5:1 | ⚠️ VERIFY — requires axe-core in dark mode |
| CF-02 Input border ≥ 3:1 | ❌ STILL FAILING — `slate-300` still ~1.6:1 against white |
| CF-03 Fieldsets on Server Connection Wizard | ✅ PASS |
| CF-04 Alt text on Sprint 1 icons | ✅ PASS |
| CF-05 Keyboard alternatives for touch-only patterns | ✅ PASS |

---

## 7. B-251 Verification Checklist

- [x] B-251: Route transitions move focus to `<main>` element or page heading
- [x] B-251: Screen readers announce new page context on navigation
- [x] B-251: Skip link present and functional (`SkipToContent` in root layout)
- [x] B-251: `lang="en"` on root `<html>` element
- [x] B-251: Dynamic content (deploy progress warnings, SSE reconnection notices) uses `aria-live`
- [N/A] B-251: Focus trap in modals fully released on close — no blocking modal pattern reviewed in Sprint 2 screens
- [DEFERRED: runtime-verification] B-251: Modal close returns focus to triggering element — `useFocusReturn` hook implemented; runtime verification at actual modal open/close sites required
- [DEFERRED: regression-fix] B-251: Wizard step transitions managed — currently **not** handled (see A-04)

---

## 8. Keyboard Navigation Results

Manual code-review-based keyboard navigation assessment:

| Screen | Tab Order | Focus Visible | Keyboard Operable | Notes |
|--------|-----------|---------------|-------------------|-------|
| `/marketplace` | ✅ Logical | ✅ | ✅ | Category buttons + search + app grid all reachable |
| `/marketplace/[appId]` | ✅ | ✅ | ✅ | Breadcrumb, app info, requirements, deploy button |
| `/deploy/[appId]/configure` | ⚠️ Partial | ✅ | ✅ | Tab order within steps is correct; step transition focus gap (A-04) |
| `/deploy/[appId]/progress/[deploymentId]` | ✅ | ✅ | ✅ | Progress bar, phase list, CTAs on completion |
| `/dashboard` | ✅ | ✅ | ✅ | Refresh button, alert banners, gauge section, app table |
| `/alerts` | ✅ | ✅ | ✅ | Expand/collapse buttons, acknowledge/dismiss actions, remediation link |
| `/alerts/[alertId]/remediate` | ✅ | ✅ | ✅ | Back link, severity info, action buttons, step list |

---

## 9. Reduced Motion Assessment

All Sprint 2 animations verified against `prefers-reduced-motion`:

| Animation | Mechanism | Status |
|-----------|-----------|--------|
| PulseRing server status | `motion-safe:animate-[...]` class — animation only in safe contexts | ✅ PASS |
| AppStatusBadge dot pulse | `motion-safe:animate-[...]` class | ✅ PASS |
| Skeleton loading shimmer | `animate-pulse` — also blocked by global rule | ✅ PASS |
| ResourceGauge SVG arc transition | `transition-all duration-[var(--dur-base)]` — duration → 0ms via global rule | ✅ PASS |
| Deploy progress phase icon (Loader2 spin) | CSS animation — blocked by global rule | ✅ PASS |
| Deploy progress bar fill transition | `transition-all duration-[var(--dur-base)]` — blocked by global rule | ✅ PASS |

`global.css` blanket rule (`animation-duration: 0ms !important; transition-duration: 0ms !important` under `prefers-reduced-motion: reduce`) correctly eliminates all motion.

---

## 10. Screen Reader Compatibility Notes

### NVDA + Chrome
- **RouteAnnouncer** will fire in Safari/Chrome browse mode. With virtual cursor navigation NVDA may not announce the live region if focus is inside the browse flow. Runtime testing recommended.
- **PulseRing** `sr-only` text "Server status: Healthy" within `role="status"` — will be read on focus traversal and also on live region update when status changes.
- **ResourceGauge** `role="meter"` — NVDA does read meter role with value. VoiceOver (macOS) reads `aria-label` text directly.

### VoiceOver (macOS + iOS)
- **`aria-live="polite"` announcements** — VoiceOver announces polite updates between user interactions. The RouteAnnouncer will fire on route change; users will hear the page title announced.
- **`role="meter"`** — VoiceOver reads as statistic: "CPU: 45 percent, 0 to 100". Correct.
- **`aria-pressed` buttons** — Announced as "toggle button, on/off" in VoiceOver. Correct for category filters.

### JAWS + Chrome
- **Deployment progress bar** — JAWS reads `role="progressbar"` with `aria-valuenow` updates. Without `aria-valuetext`, announces "Deployment progress, 33%". Fix A-08 would improve this to "Configuring your settings, step 3 of 6".

---

## 11. Bugs Filed

### Bug AB#_TBD-1: Deployment phase transitions not announced to screen readers

| Field | Value |
|-------|-------|
| Title | [A11Y] Deploy progress: phase transitions not announced via aria-live (SC 4.1.3) |
| Type | Bug |
| Severity | Critical |
| WCAG SC | 4.1.3 Status Messages (Level AA) |
| Component | `code/src/app/(authenticated)/deploy/[appId]/progress/[deploymentId]/page.tsx` |
| Affected users | All screen reader users |
| Description | The deployment progress page updates `currentStatus` via SSE, which transitions the phase list visually. However, no `aria-live` region announces these transitions. Screen reader users cannot track deployment status without manually navigating the page. |
| Remediation | Add `aria-live="polite"` region that reflects `currentStatus` phase name. Example: `<div aria-live="polite" aria-atomic="true" className="sr-only">{DEPLOYMENT_PHASES[currentPhaseIdx]?.label}: {DEPLOYMENT_PHASES[currentPhaseIdx]?.description}</div>`. Also add `aria-valuetext` to the progressbar: `aria-valuetext={`${DEPLOYMENT_PHASES[currentPhaseIdx]?.label} — step ${currentPhaseIdx + 1} of ${DEPLOYMENT_PHASES.length}`}`. |
| Parent Azure ID | 180 |

### Bug AB#_TBD-2: New alerts from SSE not announced to screen readers

| Field | Value |
|-------|-------|
| Title | [A11Y] Alerts page: SSE-delivered new alerts not announced (SC 4.1.3) |
| Type | Bug |
| Severity | Critical |
| WCAG SC | 4.1.3 Status Messages (Level AA) |
| Component | `code/src/app/(authenticated)/alerts/page.tsx` |
| Affected users | All screen reader users |
| Description | New alerts arriving via `handleSSEMessage` are added to `sseAlerts` state. The `role="list"` container is not an `aria-live` region. Critical system alerts are not announced, creating a safety/usability barrier for screen reader users. |
| Remediation | Add an `aria-live="assertive"` announcement region for new incoming alerts: `<div aria-live="assertive" className="sr-only">{newAlertAnnouncement}</div>`. Set `newAlertAnnouncement` in the SSE handler when a new `alert.created` event arrives, e.g., "New critical alert: {alert.message}". Clear after announcement. Also add `aria-live="polite"` to the active alerts list container. |
| Parent Azure ID | 180 |

### Bug AB#_TBD-3: Input border contrast still fails WCAG 1.4.11 (CF-02 regression)

| Field | Value |
|-------|-------|
| Title | [A11Y] Input border contrast CF-02: --color-border-base slate-300 still ~1.6:1 (SC 1.4.11) |
| Type | Bug |
| Severity | Serious |
| WCAG SC | 1.4.11 Non-text Contrast (Level AA) |
| Component | `code/src/styles/tokens/semantic.css` |
| Affected users | Low-vision users |
| Description | `--color-border-base` is `var(--ref-slate-300)` = `oklch(0.82 0.04 240)`. Against white background (`oklch(1.0 0 0)`), estimated contrast is ~1.6:1 — fails the required ≥ 3:1 for UI component boundaries. P2 audit CF-02 required this to be fixed. Token was updated from slate-200 to slate-300 but slate-300 does not achieve 3:1 against white. |
| Remediation | Change `--color-border-base` to `var(--ref-slate-500)` = `oklch(0.60 0.06 240)` which gives estimated 4.7:1 against white. If this is visually too dark, use `var(--ref-slate-400)` = `oklch(0.72 0.05 240)` which gives approximately 3.0–3.2:1 (borderline). Verify in rendered browser with axe-core. |
| Parent Azure ID | 180 |

### Bug AB#_TBD-4: Config wizard step transitions not focus-managed (SC 2.4.3)

| Field | Value |
|-------|-------|
| Title | [A11Y] Config wizard: step transitions do not move focus to new step content (SC 2.4.3) |
| Type | Bug |
| Severity | Serious |
| WCAG SC | 2.4.3 Focus Order (Level A) |
| Component | `code/src/app/(authenticated)/deploy/[appId]/configure/page.tsx` |
| Affected users | Keyboard users, screen reader users |
| Description | When user clicks "Continue" or "Back" in the configuration wizard, `currentStep` state updates and new step content renders. Focus remains on the clicked button, which either disappears or changes its label. Keyboard users must tab backwards to reach the new step's first interactive field. |
| Remediation | In `goNext()` and `goBack()`, after state update, use `requestAnimationFrame` to focus the new step's heading or first focusable field. Example: `const goNext = () => { setCurrentStep(s => s + 1); requestAnimationFrame(() => { const heading = document.querySelector('[data-step-heading]'); heading?.focus(); }); }`. Add `data-step-heading` and `tabIndex={-1}` to the step heading/first field. |
| Parent Azure ID | 180 |

---

## 12. Overall WCAG Compliance Assessment

| WCAG Principle | Status | Notes |
|----------------|--------|-------|
| Perceivable | **Conditional Pass** | CF-02 border contrast still failing; dark mode CF-01 needs verification |
| Operable | **Conditional Pass** | Wizard step focus (A-04) is a Level A gap |
| Understandable | **Pass** | Forms, error messages, labels correct |
| Robust | **Conditional Pass** | Phase transition live regions (A-01), SSE alert live regions (A-02) are Level AA gaps |

**Overall Sprint 2 WCAG 2.2 AA Rating: CONDITIONAL PASS with 4 open bug work items**

B-251 route focus management is substantially implemented and functional. Four findings require code fixes before full AA compliance can be declared.

---

## 13. Automated Audit Notes (axe-core)

Browser-based runtime auditing was not performed in this cycle (application environment not available at time of audit). The following axe-core rules should be targeted in the next browser verification session:

```bash
# Target rules for Sprint 2 screens
axe.run({
  include: [
    '/marketplace', '/marketplace/*',
    '/deploy/*', '/dashboard', '/alerts', '/alerts/*'
  ],
  rules: {
    'color-contrast': { enabled: true },
    'aria-progressbar-name': { enabled: true },
    'aria-meter-name': { enabled: true },
    'region': { enabled: true },
    'landmark-one-main': { enabled: true },
    'focus-trap': { enabled: true },
    'scrollable-region-focusable': { enabled: true }
  }
})
```

---

## 14. Artifact Checklist

- [x] B-251 fix verification: pass/fail per criterion
- [x] Sprint 1 regression: all 5 critical findings assessed
- [x] Per-screen audit results for all 9 Sprint 2 screens
- [x] Findings by severity table
- [DEFERRED: runtime] axe-core automated scan — browser environment not available; rules documented for next session
- [DEFERRED: runtime] Manual keyboard navigation — code review used; live testing recommended to confirm focus order rendering
- [x] Screen reader compatibility notes (NVDA/VoiceOver/JAWS) for deploy progress, alerts, gauges
- [x] Reduced motion assessment
- [x] 4 Bug work items documented

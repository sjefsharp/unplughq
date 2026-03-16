---
artifact: delegation-briefs-remediation
produced-by: product-owner
project-slug: unplughq
work-item: task-264-po-p5-bug-remediation-triage
work-item-type: task
parent-work-item: epic-001-unplughq-platform
workflow-tier: full
phase: P5
version: 1.0.0
status: approved
consumed-by:
  - product-manager
  - tech-lead
  - backend-developer
  - frontend-developer
date: 2026-03-16
azure-devops-id: 264
review:
  evaluator:
  gate:
  reviewed-date:
---

# P5 Bug Remediation — Triage & Delegation Briefs

## 1. Triage Table

| Bug ID | Title | Source | Severity | Fix Complexity | Disposition | Rationale |
|--------|-------|--------|----------|----------------|-------------|-----------|
| AB#254 | Sessions not invalidated on password reset | SEC | Critical | Low | **Fix Now** | PM mandate. Compromised sessions persist after password change — active exploitation risk. |
| AB#255 | Heredoc injection in write-env-file SSH template | SEC | Critical | Low | **Fix Now** | PM mandate. RCE vector via env content injection on user VPS. |
| AB#245 | CatalogApp Zod schema accepts negative resource values | TST | High | Trivial | **Fix Now** | One-line `.min(0)` addition per field. Invalid data reaches catalog logic. |
| AB#246 | verifyPassword parameter order contradicts API contract | TST | High | Trivial | **Fix Now** | Swap two parameters. Contract violation causes silent auth failure risk. |
| AB#249 | Credentials `<legend>` without `<fieldset>` | A11Y | High | Low | **Fix Now** | Wrap existing markup in `<fieldset>`. WCAG 1.3.1 Level A violation. |
| AB#250 | Non-unique page titles across routes | A11Y | High | Low | **Fix Now** | Add `metadata` exports per page. WCAG 2.4.2 Level A violation. |
| AB#251 | Sidebar missing Escape key dismiss | A11Y | Medium | Low | **Defer Sprint 2** | Not a key trap — close button is reachable via Tab. UX enhancement. |
| AB#252 | Password requirements placeholder-only | A11Y | Medium | Low | **Fix Now** | Add visible helper text below input. WCAG 3.3.2 Level A — placeholder disappears on input. |
| AB#253 | CardTitle renders `<div>` not heading | A11Y | Medium | Low | **Fix Now** | Change rendered element to accept `as` prop or default `<h3>`. WCAG 1.3.1. |
| AB#256 | Missing security headers on control plane | SEC | High | Low | **Fix Now** | Add `headers()` to `next.config.ts`. Control plane has zero security headers — OWASP A05. |
| AB#257 | Rate limiter counts successful logins | SEC | High | Medium | **Fix Now** | Separate check from increment. Successful logins currently lock accounts after 10 total attempts. |
| AB#258 | No global API rate limiting | SEC | High | High | **Defer Sprint 2** | Requires middleware architecture decision (Next.js middleware vs edge layer). Not exploitable at MVP scale with limited user base. |
| AB#259 | No audit log writes for destructive operations | SEC | High | High | **Defer Sprint 2** | Audit table exists but needs new service + integration into 4+ tRPC procedures. Non-trivial. |
| AB#260 | Confirmation token not validated | SEC | High | Medium | **Defer Sprint 2** | Requires new token service with Redis storage + expiry. Destructive ops already require auth + tenant-scoped ownership. |
| AB#261 | Sudoers wildcard allows arbitrary package install | SEC | High | Trivial | **Fix Now** | Replace `*` with explicit package list in shell script. OWASP A01 — low effort, high impact. |
| AB#262 | Agent API token stored as plaintext | SEC | High | High | **Defer Sprint 2** | Requires schema migration, handler changes, and token rotation for existing servers. Tokens are per-server 256-bit random — breach-only risk. |

### Summary

| Disposition | Count | Bug IDs |
|-------------|-------|---------|
| **Fix Now** | 11 | AB#254, AB#255, AB#245, AB#246, AB#249, AB#250, AB#252, AB#253, AB#256, AB#257, AB#261 |
| **Defer Sprint 2** | 5 | AB#251, AB#258, AB#259, AB#260, AB#262 |

---

## 2. Delegation Briefs — Fix Now

### Brief 1: Backend Developer — Security & Auth Fixes (6 bugs)

**Agent:** Backend Developer (BE)
**Bugs:** AB#254, AB#255, AB#246, AB#256, AB#257, AB#261
**Branch:** `fix/bug-254-261-backend-security-remediation`
**Parent Azure ID:** 180

---

#### AB#254 — Sessions not invalidated on password reset [CRITICAL]

**File:** `code/src/server/services/auth/auth-service.ts` — `resetPassword()` function (lines 99–125)

**Problem:** After password hash update, existing database sessions for the user are **not deleted**. An attacker with a stolen session cookie retains access post-password-change.

**Required fix:**
1. After the password hash update in `resetPassword()`, query the user ID from the email
2. Delete all rows from the `sessions` table where `userId` matches
3. Import `sessions` from the schema and `eq` from Drizzle

**Reference implementation** (from vulnerability report FINDING-01):
```typescript
// After updating password hash:
const user = await db.query.users.findFirst({
  where: eq(users.email, tokenRecord.identifier),
  columns: { id: true },
});
if (user) {
  await db.delete(sessions).where(eq(sessions.userId, user.id));
}
```

**Acceptance criteria:**
- [ ] `resetPassword()` deletes all active sessions for the affected user after updating the password hash
- [ ] Existing unit/integration tests for password reset continue to pass
- [ ] A user with an active session is logged out after their password is reset

---

#### AB#255 — Heredoc injection in write-env-file SSH template [CRITICAL]

**File:** `code/src/server/services/ssh/ssh-service.ts` — `resolveCommand()`, `write-env-file` case

**Problem:** The heredoc delimiter `UNPLUGHQ_ENV_EOF` can be injected via the `content` parameter. If content contains the literal string `UNPLUGHQ_ENV_EOF`, the heredoc terminates early and remaining text executes as shell commands on the target VPS.

**Required fix:** Replace the heredoc pattern with base64 encoding that cannot be broken by content:

```typescript
case 'write-env-file': {
  const encoded = Buffer.from(template.params.content).toString('base64');
  return `echo ${shellEscape(encoded)} | base64 -d > ${shellEscape(template.params.path)}`;
}
```

**Acceptance criteria:**
- [ ] `write-env-file` command no longer uses heredoc construction
- [ ] Content containing `UNPLUGHQ_ENV_EOF` is safely written without command execution
- [ ] Existing SSH command template tests pass; add a test case for heredoc delimiter injection
- [ ] Binary-safe: content with special characters (`\n`, `$`, backticks) is written correctly

---

#### AB#246 — verifyPassword parameter order contradicts API contract [HIGH]

**File:** `code/src/server/services/auth/password-hashing.ts`

**Problem:** Production signature is `verifyPassword(hash, plaintext)` but the API contract (test contract, solution design) specifies `verifyPassword(plaintext, hash)`. Test helpers had to use an adapter wrapper to swap arguments.

**Required fix:**
1. Swap the parameter order to `verifyPassword(plaintext: string, hash: string)`
2. Update all call sites (grep for `verifyPassword(` across `src/`)

**Acceptance criteria:**
- [ ] `verifyPassword` signature is `(plaintext: string, hash: string)`
- [ ] All call sites updated — no adapter wrappers needed
- [ ] All existing password-related tests pass without workarounds

---

#### AB#256 — Missing security headers on control plane [HIGH]

**File:** `code/next.config.ts`

**Problem:** The Next.js control plane serves the main web application without **any** security headers. No `middleware.ts` exists. The Caddy template on VPS has HSTS/X-Frame-Options etc., but the control plane itself (where users authenticate, manage SSH keys, perform server operations) has none.

**Required fix:** Add `headers()` function to `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  serverExternalPackages: ["argon2", "ssh2", "bullmq", "pino"],
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';" },
      ],
    }];
  },
};
```

**Note:** The CSP must allow `'unsafe-inline'` for scripts and styles because Next.js injects inline scripts for hydration. If stricter CSP is needed, use `nonce`-based CSP via middleware in Sprint 2.

**Acceptance criteria:**
- [ ] `next.config.ts` exports `headers()` with all 6 security headers
- [ ] Build succeeds (`pnpm build` exits 0)
- [ ] Headers are present in response when serving the app

---

#### AB#257 — Rate limiter counts successful logins [HIGH]

**Files:**
- `code/src/server/lib/rate-limit.ts` — `checkRateLimit()` function
- `code/src/server/auth/index.ts` — authorize callback

**Problem:** `isAccountLocked()` calls `checkRateLimit()`, which atomically increments the counter on **every** invocation (including successful logins). After 10 total logins in 5 minutes, the account locks — even with all-correct passwords.

**Required fix:**
1. Separate the rate limit **check** from the **increment**. Create two functions:
   - `isAccountLocked(email)` — reads count only, does NOT increment
   - `recordFailedLogin(email)` — increments the counter
2. In `auth/index.ts` authorize callback:
   - Call `isAccountLocked()` before password verification (read-only check)
   - Call `recordFailedLogin()` only when `verifyPassword()` returns false
   - On successful login, optionally clear the counter for that email

**Acceptance criteria:**
- [ ] Successful logins do NOT increment the rate limit counter
- [ ] Account locks only after 10 **failed** attempts in 5 minutes
- [ ] Existing rate limit tests updated to verify the new behavior
- [ ] No regression in auth flow (login, signup, password reset)

---

#### AB#261 — Sudoers wildcard allows arbitrary package install [HIGH]

**File:** `code/infra/provisioning/setup-user.sh` — sudoers configuration

**Problem:** The sudoers entry `unplughq ALL=(root) NOPASSWD: /usr/bin/apt-get install *` allows installing **any** package as root. A compromised SSH session could install malicious packages or backdoor tools.

**Required fix:** Replace the wildcard with explicit package names:

```bash
unplughq ALL=(root) NOPASSWD: /usr/bin/apt-get update
unplughq ALL=(root) NOPASSWD: /usr/bin/apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
unplughq ALL=(root) NOPASSWD: /usr/bin/apt-get install -y caddy
unplughq ALL=(root) NOPASSWD: /usr/bin/apt-get install -y ca-certificates curl gnupg lsb-release debian-keyring debian-archive-keyring apt-transport-https
```

**Acceptance criteria:**
- [ ] Sudoers file uses explicit package names — no wildcards
- [ ] `apt-get install` for Docker, Caddy, and prerequisite packages still works
- [ ] `apt-get install` for any other package is denied

---

### Brief 2: Frontend Developer — Schema & A11Y Fixes (5 bugs)

**Agent:** Frontend Developer (FE)
**Bugs:** AB#245, AB#249, AB#250, AB#252, AB#253
**Branch:** `fix/bug-245-253-frontend-a11y-remediation`
**Parent Azure ID:** 180

---

#### AB#245 — CatalogApp Zod schema accepts negative resource values [HIGH]

**File:** `code/src/lib/schemas/index.ts` — `CatalogApp` schema

**Problem:** `minCpuCores`, `minRamGb`, `minDiskGb` use `z.number()` without a minimum constraint. Negative resource values pass validation.

**Required fix:** Add `.min(0)` or `.nonnegative()` to all three fields:

```typescript
minCpuCores: z.number().min(0),
minRamGb: z.number().min(0),
minDiskGb: z.number().min(0),
```

**Acceptance criteria:**
- [ ] All three resource fields reject negative values
- [ ] The existing failing test (`should reject negative minCpuCores`) passes
- [ ] Build succeeds (`pnpm build` exits 0)

---

#### AB#249 — Credentials `<legend>` without `<fieldset>` [HIGH]

**File:** `code/src/app/(authenticated)/connect/credentials/page.tsx`

**Problem:** The "Authentication Method" radio group renders a `<legend>` element via `<FormLabel asChild>` but has no wrapping `<fieldset>`. A `<legend>` outside `<fieldset>` has no semantic meaning. WCAG 1.3.1 Level A violation.

**Required fix:** Wrap the authentication method radio group in a `<fieldset>` element. The existing `<legend>` element should become a child of the new `<fieldset>`:

```tsx
<fieldset>
  <legend>Authentication Method</legend>
  {/* Radio group content */}
</fieldset>
```

Apply appropriate styling to remove default fieldset border if needed (`className="border-0 p-0 m-0"`).

**Acceptance criteria:**
- [ ] `<legend>` is a child of `<fieldset>` in the credentials page
- [ ] Radio group for auth method is semantically grouped
- [ ] Visual appearance unchanged (no default fieldset border)
- [ ] Build succeeds

---

#### AB#250 — Non-unique page titles across routes [HIGH]

**Files:** All page files under `code/src/app/`:
- `code/src/app/(auth)/signup/page.tsx` → "Create Account — UnplugHQ"
- `code/src/app/(auth)/login/page.tsx` → "Sign In — UnplugHQ"
- `code/src/app/(auth)/forgot-password/page.tsx` → "Forgot Password — UnplugHQ"
- `code/src/app/(auth)/reset-password/[token]/page.tsx` → "Reset Password — UnplugHQ"
- `code/src/app/(auth)/welcome/page.tsx` → "Welcome — UnplugHQ"
- `code/src/app/(authenticated)/dashboard/page.tsx` → "Dashboard — UnplugHQ"
- `code/src/app/(authenticated)/settings/page.tsx` → "Account Settings — UnplugHQ"
- `code/src/app/(authenticated)/connect/credentials/page.tsx` → "Connect Server — UnplugHQ"
- `code/src/app/(authenticated)/connect/validation/page.tsx` → "Server Validation — UnplugHQ"
- `code/src/app/(authenticated)/connect/provisioning/page.tsx` → "Server Provisioning — UnplugHQ"

**Problem:** Only 2 `metadata` exports exist for 10 pages. Screen reader users cannot distinguish between pages by title. WCAG 2.4.2 Level A violation.

**Required fix:** Add a `metadata` export to each page file:

```typescript
export const metadata: Metadata = {
  title: "Create Account — UnplugHQ",
};
```

Remove the generic title from `(auth)/layout.tsx` since individual pages now provide their own.

**Acceptance criteria:**
- [ ] Each of the 10 Sprint 1 pages has a unique, descriptive `<title>`
- [ ] Title format follows `"{Page Name} — UnplugHQ"` convention
- [ ] Build succeeds

---

#### AB#252 — Password requirements shown only as placeholder text [MEDIUM]

**Files:**
- `code/src/app/(auth)/signup/page.tsx`
- `code/src/app/(auth)/reset-password/[token]/page.tsx`

**Problem:** Password requirements ("Minimum 8 characters") are only visible as placeholder text, which disappears when the user starts typing. WCAG 3.3.2 Level A requires persistent visible instructions for input fields with format requirements.

**Required fix:** Add a visible helper text element below the password input, outside the placeholder. Use `FormDescription` (already in the form component library) to render persistent instruction text:

```tsx
<FormDescription>
  Minimum 12 characters with at least one uppercase letter, one lowercase letter, and one number or symbol.
</FormDescription>
```

**Note:** The text should match the **server-side** requirement (12 chars, not the client-side 8 chars — this also addresses the schema mismatch noted in FINDING-10).

**Acceptance criteria:**
- [ ] Password requirements are visible as persistent text (not placeholder) on signup and reset-password pages
- [ ] Requirements text matches server-side validation rules (12 chars minimum)
- [ ] `FormDescription` uses `aria-describedby` linkage (already built into the form component)
- [ ] Build succeeds

---

#### AB#253 — CardTitle renders `<div>` not heading element [MEDIUM]

**File:** `code/src/components/ui/card.tsx` — `CardTitle` component

**Problem:** `CardTitle` renders a `<div>` styled as a heading but without heading semantics. In the settings page, "Profile" and "Notifications" act as section headings under `<h1>Account settings</h1>` but are not `<h2>` elements. Screen readers cannot navigate by heading structure. WCAG 1.3.1 violation.

**Required fix:** Change `CardTitle` to render an `<h3>` by default and accept an optional `as` prop for flexibility:

```tsx
const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement> & { as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' }
>(({ className, as: Tag = 'h3', ...props }, ref) => (
  <Tag ref={ref} className={cn("...", className)} {...props} />
));
```

Update Settings page usage to `<CardTitle as="h2">` since they appear under an `<h1>`.

**Acceptance criteria:**
- [ ] `CardTitle` renders a heading element (`<h3>` default)
- [ ] Settings page uses `<CardTitle as="h2">` for proper hierarchy
- [ ] Visual appearance unchanged
- [ ] Build succeeds

---

## 3. Deferred Bugs — Sprint 2 Backlog

The following 5 bugs are deferred to Sprint 2. The PM should create Story or Task work items for these during Sprint 2 planning.

| Bug ID | Title | Reason for Deferral | Sprint 2 Prerequisite |
|--------|-------|---------------------|-----------------------|
| AB#251 | Sidebar missing Escape key dismiss | Not a key trap — close button reachable via Tab. UX enhancement, not blocking. | None |
| AB#258 | No global API rate limiting | Requires architectural decision: Next.js middleware vs Cloudflare edge vs tRPC middleware. Not exploitable at MVP scale. | SA to evaluate middleware approach |
| AB#259 | No audit log writes for destructive operations | Table exists but integration requires new audit service + callsite changes in 4+ tRPC procedures. Non-trivial scope. | SD to define audit service contract |
| AB#260 | Confirmation token not validated | Requires new confirmation token service with Redis storage, generation endpoint, and 5-min expiry. Token input exists but is a no-op. | SD to design confirmation flow |
| AB#262 | Agent API token stored as plaintext | Requires schema migration (hash column), handler changes, and token rotation strategy for existing servers. Breach-only risk — tokens are 256-bit random. | DBA to plan migration |

---

## 4. Execution Notes

### Agent Invocation Order

1. **Tech Lead** — Create branches `fix/bug-254-261-backend-security-remediation` and `fix/bug-245-253-frontend-a11y-remediation`
2. **BE and FE** — Can execute in parallel on separate branches
3. **Tech Lead** — Merge fix branches back to feature branch
4. **Testing** — Verify all 11 fixes pass, run full test suite

### Risk Considerations

- **AB#254 session invalidation** may affect active user sessions in any test environment — coordinate timing
- **AB#255 base64 encoding** changes the SSH command format — verify against a real SSH target if possible
- **AB#257 rate limiter refactor** touches the auth critical path — comprehensive test coverage required
- **AB#256 CSP headers** may break inline scripts if misconfigured — verify Next.js hydration still works after adding CSP

### Test Verification

After all fixes are applied, the following must exit 0:
```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

The previously failing test (`should reject negative minCpuCores`) must now pass, bringing the suite to 226/226 (100% pass rate).

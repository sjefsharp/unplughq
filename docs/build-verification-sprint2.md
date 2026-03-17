---
artifact: build-verification-sprint2
produced-by: tech-lead
project-slug: unplughq
work-item: task-290-tl-p4-setup-sprint2
work-item-type: task
parent-work-item: epic-001-unplughq-platform
workflow-tier: full
phase: P4
version: 1.0.0
status: blocked
consumed-by:
  - product-manager
  - product-owner
  - frontend-developer
  - backend-developer
  - database-administrator
  - devops-engineer
date: 2026-03-17
azure-devops-id: 290
review:
  evaluator:
  gate:
  reviewed-date:
---

# Build Verification Report — UnplugHQ PI-2 Sprint 2 P4 Step 2 Setup Completion

## Executive Summary

The recovered lazy Redis queue initialization change is present on the feature branch working tree and resolves the build-time eager queue construction pattern in `code/src/server/queue/index.ts` and `code/src/server/trpc/routers/server.ts`.

The baseline is not releasable at P4 Step 2 completion because two verification commands failed:

- `pnpm test` exited `1`
- `pnpm audit --audit-level=moderate` exited `1`

Per the Sprint 2 recovery instruction, the lazy queue fix was **not committed** because the full verification set did not pass.

## Branch And Recovery State

| Item | Value |
| ---- | ----- |
| Feature branch | `feat/pi-2-sprint-2` |
| Feature branch HEAD at recovery start | `2ce3672bde4d4923fbd0944af52541fdeda7390e` |
| Stash recovery | `git stash pop` completed and dropped `TL partial: lazy Redis queue init` |
| Queue fix status | Present in working tree, uncommitted |
| Worktree registration | 5 registered worktrees confirmed |

## Verification Commands

All commands were run from `/home/sjefsharp/git/unplughq/code` unless noted otherwise.

| Command | Exit Code | Result |
| ------- | --------- | ------ |
| `pnpm typecheck` | `0` | `tsc --noEmit` completed successfully with zero reported type errors. |
| `pnpm lint` | `0` | `next lint` completed successfully with zero ESLint warnings or errors. Next.js also emitted the expected deprecation notice for `next lint` ahead of Next.js 16 migration guidance. |
| `pnpm build` | `0` | Next.js production build succeeded. Route generation completed successfully for 15 app routes and confirmed the lazy queue change does not force Redis connection at build time. |
| `pnpm test` | `1` | Vitest run failed. Summary: `22` passed test files, `9` failed test files, `411` passed tests, `82` failed tests, `493` total tests. |
| `pnpm audit --audit-level=moderate` | `1` | One moderate vulnerability reported in `esbuild` through a dev-only `drizzle-kit` transitive chain. |

## Test Failure Summary

`pnpm test` failed with broad router-contract gaps that are not caused by the lazy Redis queue recovery change.

### Aggregate Results

| Metric | Value |
| ------ | ----- |
| Test files | `31` total |
| Passing test files | `22` |
| Failing test files | `9` |
| Tests | `493` total |
| Passing tests | `411` |
| Failing tests | `82` |
| Duration | `18.76s` |

### Representative Failure Patterns

- `caller.deployment.create`, `caller.deployment.stop`, `caller.deployment.start`, and `caller.deployment.remove` are undefined in `src/__tests__/integration/trpc/app-router.test.ts`
- `caller.list`, `caller.bind`, and `caller.unbind` are undefined in `src/__tests__/integration/trpc/domain-router.test.ts`
- `caller.dashboard` is undefined in `src/__tests__/integration/trpc/monitor-router.test.ts`
- `caller.auditLog` and `caller.exportConfig` are undefined in `src/__tests__/unit/security/tenant-isolation-sprint2.test.ts`

These failures indicate missing or mismatched tRPC router procedure exposure in the current baseline. They should be treated as feature-branch baseline defects, not as regressions introduced by the queue initialization recovery.

## Dependency Audit Summary

| Severity | Package | Advisory | Dependency Path | Impact |
| -------- | ------- | -------- | --------------- | ------ |
| Moderate | `esbuild` | `GHSA-67mh-4wv8-2f99` | `drizzle-kit -> @esbuild-kit/esm-loader -> @esbuild-kit/core-utils -> esbuild` | Dev-only exposure; no direct production runtime package path identified from the audit output |

### Advisory Notes

- Advisory summary: `esbuild` development server CORS handling can allow a malicious site to read responses from the dev server.
- Affected versions: `<=0.24.2`
- Patched version: `>=0.25.0`
- Current audit threshold result: `1` moderate vulnerability, exit code `1`

## Worktree Status Confirmation

`git worktree list --porcelain` confirmed all expected worktrees remain registered and aligned to the recovery commit:

| Path | Branch | HEAD |
| ---- | ------ | ---- |
| `/home/sjefsharp/git/unplughq` | `feat/pi-2-sprint-2` | `2ce3672bde4d4923fbd0944af52541fdeda7390e` |
| `/home/sjefsharp/git/unplughq/.worktrees/be` | `feat/pi-2-sprint-2-be` | `2ce3672bde4d4923fbd0944af52541fdeda7390e` |
| `/home/sjefsharp/git/unplughq/.worktrees/dba` | `feat/pi-2-sprint-2-dba` | `2ce3672bde4d4923fbd0944af52541fdeda7390e` |
| `/home/sjefsharp/git/unplughq/.worktrees/devops` | `feat/pi-2-sprint-2-devops` | `2ce3672bde4d4923fbd0944af52541fdeda7390e` |
| `/home/sjefsharp/git/unplughq/.worktrees/fe` | `feat/pi-2-sprint-2-fe` | `2ce3672bde4d4923fbd0944af52541fdeda7390e` |

## Queue Recovery Verification

The recovered queue change converts eager queue singleton creation into lazy accessors:

- `getProvisionQueue()`
- `getDeployQueue()`
- `getMonitorQueue()`

The active router usage scan confirms the feature branch now references `getProvisionQueue()` in the server router and no stale eager `provisionQueue` import remains in active code paths scanned during this recovery.

## Toolchain Currency Check

Current project tool versions observed in `package.json`:

| Tool | Version In Project |
| ---- | ------------------ |
| Next.js | `^15.3.2` |
| Vitest | `^3.1.0` |
| TypeScript | `~5.8.3` |
| ESLint | `^9.26.0` |
| pnpm | `10.30.3` |

Context7 resolution used the official library sources for:

- Next.js: `/vercel/next.js`
- Vitest: `/vitest-dev/vitest`
- TypeScript: `/microsoft/typescript/v5.8.3`
- ESLint: `/eslint/eslint`

## Disposition

### Blockers

1. `pnpm test` is failing with `82` test failures across router integration and tenant-isolation suites.
2. `pnpm audit --audit-level=moderate` reports a moderate `esbuild` advisory in the current dependency tree.

### Decision

This P4 Step 2 setup completion is **blocked** as a clean Sprint 2 baseline. The lazy Redis queue recovery work remains uncommitted on the feature branch because the required verification set did not fully pass.

## Research Sources

- Context7: Next.js official docs via `/vercel/next.js` — accessed 2026-03-17
- Context7: Vitest official docs via `/vitest-dev/vitest` — accessed 2026-03-17
- Context7: TypeScript official docs via `/microsoft/typescript/v5.8.3` — accessed 2026-03-17
- Context7: ESLint official docs via `/eslint/eslint` — accessed 2026-03-17
- GitHub Advisory Database: `GHSA-67mh-4wv8-2f99` — accessed 2026-03-17

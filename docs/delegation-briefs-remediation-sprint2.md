---
artifact: delegation-briefs-remediation-sprint2
produced-by: product-owner
project-slug: unplughq
work-item: task-314-po-p5-remediation-triage-sprint2
work-item-type: task
parent-work-item: epic-001-unplughq-platform
workflow-tier: full
phase: P5
version: 1.0.0
status: draft
consumed-by:
  - product-manager
  - tech-lead
  - backend-developer
  - frontend-developer
date: 2026-03-18
azure-devops-id: 314
review:
  reviewed-by:
  reviewed-date:
---

# Delegation Briefs — Sprint 2 Bug Remediation

## 1. Triage Table

All 10 bugs filed during P5 Sprint 2 verification, with disposition and rationale.

| # | Bug ID | Title | Severity | Filed By | Disposition | Rationale |
|---|--------|-------|----------|----------|-------------|-----------|
| 1 | AB#303 | SSH key rotation generates non-functional key (SEC F-01) | HIGH (CVSS 7.1) | Security | **Fix Now** | SSH rotation stores random bytes as PEM — server becomes inaccessible after rotation. Breaks B-260 remediation. Release blocker. |
| 2 | AB#304 | Deployment config accepts arbitrary key-value pairs (SEC F-02) | HIGH (CVSS 7.5) | Security | **Fix Now** | Authenticated user can inject `NODE_OPTIONS`, `LD_PRELOAD`, `PATH` into app containers. Highest CVSS among all findings. Release blocker. |
| 3 | AB#306 | Monitoring agent SSH template missing security hardening (SEC F-03) | HIGH (CVSS 7.3) | Security | **Fix Now** | `start-monitoring-agent` template runs containers without `--security-opt`, `--cap-drop`, `--read-only` — Docker socket mount makes this high risk. Release blocker. |
| 4 | AB#307 | User app containers missing `--security-opt=no-new-privileges` (SEC F-04) | HIGH (CVSS 7.0) | Security | **Fix Now** | All user-deployed containers can escalate privileges via setuid. Defense-in-depth gap. Release blocker. |
| 5 | AB#309 | Deploy progress phases not announced via `aria-live` (A11Y A-01) | Critical | Accessibility | **Fix Now** | WCAG 4.1.3 AA violation — screen reader users cannot track deployment progress. Level AA requirement blocks compliance claim. Release blocker. |
| 6 | AB#310 | Alerts SSE new alerts not announced via `aria-live` (A11Y A-02) | Critical | Accessibility | **Fix Now** | WCAG 4.1.3 AA violation — critical system alerts invisible to screen reader users. Safety concern. Release blocker. |
| 7 | AB#311 | Input border contrast ~1.6:1 (Sprint 1 CF-02 regression) | Serious | Accessibility | **Defer PI-3** | WCAG 1.4.11 AA — persistent since Sprint 1, token change from `slate-200` → `slate-300` insufficient. Important but not a release gate given Sprint 1 shipped with same issue. Track as PI-3 P1 backlog item. |
| 8 | AB#312 | Config wizard step focus not managed | Serious | Accessibility | **Defer PI-3** | WCAG 2.4.3 A — wizard step transitions don't move focus. Keyboard users can still tab to reach fields. Degraded UX, not a hard block. Track as PI-3 P1 backlog item. |
| 9 | AB#300 | Auth lockout flaky test (timeout under instrumentation load) | Medium | Testing | **Defer PI-3** | Passed in isolation (6784ms). Only flaky under full-suite coverage instrumentation. Not a functional regression — test infrastructure concern. |
| 10 | AB#301 | Duplicate-email timing test (728ms vs 500ms threshold) | Medium | Testing | **Defer PI-3** | Timing threshold too tight for CI environments. Functional behavior is correct. Threshold adjustment is a test-quality task, not a code fix. |

### Summary

| Disposition | Count | Bug IDs |
|-------------|-------|---------|
| **Fix Now** | 6 | AB#303, AB#304, AB#306, AB#307, AB#309, AB#310 |
| **Defer PI-3** | 4 | AB#311, AB#312, AB#300, AB#301 |
| **Won't Fix** | 0 | — |

### Agent Routing

| Agent | Fix Now Bugs | Scope |
|-------|-------------|-------|
| **Backend Developer** | AB#303, AB#304, AB#306, AB#307 | Server-side: SSH key generation, config validation, Docker template hardening |
| **Frontend Developer** | AB#309, AB#310 | Client-side: `aria-live` regions on deploy progress and alerts pages |

---

## 2. Delegation Briefs

### 2.1 AB#303 — SSH Key Rotation Generates Non-Functional Key

| Field | Value |
|-------|-------|
| **Bug ID** | AB#303 |
| **Agent** | Backend Developer |
| **Branch** | `fix/bug-303-ssh-key-rotation-nonfunctional` |
| **SEC Finding** | F-01 (CVSS 7.1, CWE-324) |
| **Parent Azure ID** | 180 |
| **Project** | unplughq |
| **Repo URL** | https://github.com/sjefsharp/unplughq |

#### Problem

The `rotateSSHKey` mutation in [server.ts](code/src/server/trpc/routers/server.ts) (line ~166) generates fake SSH key material:

```typescript
const sshKey = `-----BEGIN OPENSSH PRIVATE KEY-----\n${randomBytes(48).toString('base64')}\n-----END OPENSSH PRIVATE KEY-----`;
```

This is not a valid Ed25519 or RSA keypair — it is random bytes wrapped in PEM headers. After rotation:
1. The "key" is cryptographically meaningless — SSH connections will fail
2. No public key is deployed to the VPS `authorized_keys`
3. The old public key is not removed from the VPS
4. The server becomes inaccessible

#### Files to Modify

| File | Change |
|------|--------|
| `code/src/server/trpc/routers/server.ts` | Replace `randomBytes` key generation in `rotateSSHKey` mutation with proper Ed25519 keypair generation via `node:crypto` `generateKeyPairSync('ed25519')` |
| `code/src/server/services/ssh/ssh-service.ts` | Add new SSH command template `deploy-ssh-public-key` that appends a new public key to `~/.ssh/authorized_keys` on the VPS and removes the old one |
| `code/src/server/trpc/routers/server.ts` | After generating keypair and encrypting private key, enqueue an SSH job to deploy the public key to the VPS (via existing SSH connection using the old key) before updating the DB |

#### Acceptance Criteria

- [ ] `rotateSSHKey` generates a valid Ed25519 keypair using `generateKeyPairSync('ed25519')` from `node:crypto`
- [ ] The private key is stored in OpenSSH format and encrypted via `encryptSSHKey()` before DB storage
- [ ] The public key is deployed to the VPS `~/.ssh/authorized_keys` via SSH (using the old key)
- [ ] The old public key is removed from `authorized_keys` after new key is verified
- [ ] If public key deployment fails, the rotation is rolled back (old key preserved in DB)
- [ ] Existing unit tests for `rotateSSHKey` updated to verify Ed25519 key format
- [ ] New test: verify generated key is valid Ed25519 (parse with `createPublicKey`)
- [ ] `pnpm typecheck && pnpm lint && pnpm test` exits 0

---

### 2.2 AB#304 — Deployment Config Accepts Arbitrary Key-Value Pairs

| Field | Value |
|-------|-------|
| **Bug ID** | AB#304 |
| **Agent** | Backend Developer |
| **Branch** | `fix/bug-304-config-injection` |
| **SEC Finding** | F-02 (CVSS 7.5, CWE-20) |
| **Parent Azure ID** | 180 |
| **Project** | unplughq |
| **Repo URL** | https://github.com/sjefsharp/unplughq |

#### Problem

`validateConfigAgainstSchema()` in [deployment-service.ts](code/src/server/services/deployment-service.ts) (line ~57) only validates keys defined in `template.configSchema`. The `DeployAppInput.config` schema is `z.record(z.string(), z.string())` — accepting any key-value pairs. Extra keys bypass:
1. **Key format validation** — no ENV_VAR pattern check. Keys with special characters written to env file.
2. **Value shell-metacharacter rejection** — only schema-defined field values checked against `UNSAFE_CONFIG_PATTERN`.

An authenticated user can inject dangerous env vars: `NODE_OPTIONS=--require=/etc/passwd`, `LD_PRELOAD=...`, `PATH=/tmp`.

#### Files to Modify

| File | Change |
|------|--------|
| `code/src/server/services/deployment-service.ts` — `validateConfigAgainstSchema()` | 1. Filter `config` to include ONLY keys defined in `template.configSchema` — reject/strip extra keys. 2. Validate all config keys against `/^[A-Z_][A-Z0-9_]*$/`. 3. Validate ALL config values against `UNSAFE_CONFIG_PATTERN`. 4. Reject a blocklist of dangerous env var keys: `NODE_OPTIONS`, `LD_PRELOAD`, `LD_LIBRARY_PATH`, `PATH`, `HOME`, `SHELL`, `USER`, `PYTHONPATH`. |
| `code/src/server/services/deployment-service.ts` — `createEnvFileContent()` | Add key format validation as defense-in-depth before writing to env string |
| `code/src/server/trpc/routers/app.ts` — `deployment.create` | Ensure `validateConfigAgainstSchema()` is called before any config is persisted or passed to the deploy job |

#### Acceptance Criteria

- [ ] `validateConfigAgainstSchema()` strips/rejects config keys NOT in `template.configSchema`
- [ ] All config keys validated against `ENV_VAR_PATTERN = /^[A-Z_][A-Z0-9_]*$/`
- [ ] All config values (not just schema-defined) validated against `UNSAFE_CONFIG_PATTERN`
- [ ] Blocklist rejects: `NODE_OPTIONS`, `LD_PRELOAD`, `LD_LIBRARY_PATH`, `PATH`, `HOME`, `SHELL`, `USER`, `PYTHONPATH`
- [ ] `createEnvFileContent()` has defense-in-depth key validation
- [ ] New tests: extra keys rejected, blocklisted keys rejected, unsafe values rejected, valid config passes
- [ ] Existing deployment tests still pass
- [ ] `pnpm typecheck && pnpm lint && pnpm test` exits 0

---

### 2.3 AB#306 — Monitoring Agent SSH Template Missing Security Hardening

| Field | Value |
|-------|-------|
| **Bug ID** | AB#306 |
| **Agent** | Backend Developer |
| **Branch** | `fix/bug-306-monitoring-agent-hardening` |
| **SEC Finding** | F-03 (CVSS 7.3, CWE-250) |
| **Parent Azure ID** | 180 |
| **Project** | unplughq |
| **Repo URL** | https://github.com/sjefsharp/unplughq |

#### Problem

The `start-monitoring-agent` template in [ssh-service.ts](code/src/server/services/ssh/ssh-service.ts) (line ~114, `case 'start-monitoring-agent'`) launches the monitoring agent container without security options:

```typescript
`sudo docker run -d --name unplughq-agent --network unplughq --restart unless-stopped`,
`-e AGENT_API_TOKEN=${shellEscape(apiToken)}`,
...
```

The `deploy-agent.sh` shell script correctly includes `--read-only --security-opt=no-new-privileges --cap-drop=ALL --tmpfs /tmp:rw,noexec,nosuid,size=16m`, but the SSH template used by the BullMQ worker and token rotation does NOT. Since the monitoring agent has Docker socket access (`-v /var/run/docker.sock:/var/run/docker.sock:ro`), this is high risk.

#### Files to Modify

| File | Change |
|------|--------|
| `code/src/server/services/ssh/ssh-service.ts` — `start-monitoring-agent` case | Add `--read-only`, `--security-opt=no-new-privileges`, `--cap-drop=ALL`, `--tmpfs /tmp:rw,noexec,nosuid,size=16m` to the `docker run` command, matching `deploy-agent.sh` |

#### Exact Fix Location

In `resolveCommand()`, the `case 'start-monitoring-agent'` block (around line 114). Insert security options after `--restart unless-stopped`:

```typescript
case 'start-monitoring-agent': {
  const { apiToken, controlPlaneUrl, serverId } = template.params;
  validateContainerName('unplughq-agent');
  return [
    'sudo docker pull ghcr.io/unplughq/agent:latest',
    `sudo docker run -d --name unplughq-agent --network unplughq --restart unless-stopped`,
    `--read-only --security-opt=no-new-privileges --cap-drop=ALL`,
    `--tmpfs /tmp:rw,noexec,nosuid,size=16m`,
    `-e AGENT_API_TOKEN=${shellEscape(apiToken)}`,
    `-e CONTROL_PLANE_URL=${shellEscape(controlPlaneUrl)}`,
    `-e SERVER_ID=${shellEscape(serverId)}`,
    `-v /var/run/docker.sock:/var/run/docker.sock:ro`,
    `ghcr.io/unplughq/agent:latest`,
  ].join(' ');
}
```

#### Acceptance Criteria

- [ ] `start-monitoring-agent` SSH template includes `--read-only`
- [ ] `start-monitoring-agent` SSH template includes `--security-opt=no-new-privileges`
- [ ] `start-monitoring-agent` SSH template includes `--cap-drop=ALL`
- [ ] `start-monitoring-agent` SSH template includes `--tmpfs /tmp:rw,noexec,nosuid,size=16m`
- [ ] All 4 options match `deploy-agent.sh` hardening
- [ ] Existing SSH template resolver tests updated to verify security options present in output
- [ ] `pnpm typecheck && pnpm lint && pnpm test` exits 0

---

### 2.4 AB#307 — User App Containers Missing `--security-opt=no-new-privileges`

| Field | Value |
|-------|-------|
| **Bug ID** | AB#307 |
| **Agent** | Backend Developer |
| **Branch** | `fix/bug-307-container-security-opt` |
| **SEC Finding** | F-04 (CVSS 7.0, CWE-250) |
| **Parent Azure ID** | 180 |
| **Project** | unplughq |
| **Repo URL** | https://github.com/sjefsharp/unplughq |

#### Problem

The `docker-run` template in [ssh-service.ts](code/src/server/services/ssh/ssh-service.ts) (line ~131, `case 'docker-run'`) does not include `--security-opt=no-new-privileges`. User app containers run with default Docker security — privilege escalation via setuid is possible.

#### Files to Modify

| File | Change |
|------|--------|
| `code/src/server/services/ssh/ssh-service.ts` — `docker-run` case | Add `--security-opt=no-new-privileges` to the `docker run` command array, after `--restart unless-stopped` |

#### Exact Fix Location

In `resolveCommand()`, the `case 'docker-run'` block (around line 131). Insert after `--restart unless-stopped`:

```typescript
return [
  `docker run -d`,
  `--name ${shellEscape(containerName)}`,
  `--network ${shellEscape(networkName)}`,
  `--restart unless-stopped`,
  `--security-opt=no-new-privileges`,
  `--env-file ${shellEscape(envFile)}`,
  ...volumeFlags,
  ...labelFlags,
  shellEscape(imageRef),
].join(' ');
```

#### Acceptance Criteria

- [ ] `docker-run` SSH template includes `--security-opt=no-new-privileges` in the generated command
- [ ] Option appears after `--restart unless-stopped` and before `--env-file`
- [ ] Existing SSH template resolver tests updated to verify `--security-opt=no-new-privileges` in `docker-run` output
- [ ] `pnpm typecheck && pnpm lint && pnpm test` exits 0

---

### 2.5 AB#309 — Deploy Progress Phases Not Announced via `aria-live`

| Field | Value |
|-------|-------|
| **Bug ID** | AB#309 |
| **Agent** | Frontend Developer |
| **Branch** | `fix/bug-309-deploy-aria-live` |
| **A11Y Finding** | A-01 (WCAG 4.1.3 AA — Status Messages) |
| **Parent Azure ID** | 180 |
| **Project** | unplughq |
| **Repo URL** | https://github.com/sjefsharp/unplughq |

#### Problem

The deployment progress page at [progress/\[deploymentId\]/page.tsx](code/src/app/(authenticated)/deploy/[appId]/progress/[deploymentId]/page.tsx) updates `currentStatus` via SSE, which transitions the phase list visually. However, no `aria-live` region announces these transitions. Screen reader users cannot hear "Downloading" → "Configuring" → "Securing" as deployment progresses.

Additionally, the `role="progressbar"` has `aria-valuenow` (percentage) but no `aria-valuetext` with a human-readable phase description (A11Y finding A-08 — moderate, can be fixed inline).

#### Files to Modify

| File | Change |
|------|--------|
| `code/src/app/(authenticated)/deploy/[appId]/progress/[deploymentId]/page.tsx` | 1. Add an `aria-live="polite" aria-atomic="true"` visually-hidden `<div>` that reflects the current phase name and description. 2. Add `aria-valuetext` to the existing `role="progressbar"` element. |

#### Exact Fix Guidance

1. **Add `aria-live` announcement region** — Insert a `sr-only` `<div>` inside the main container, before or after the `<Card>`:

```tsx
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {!failed && !isComplete && DEPLOYMENT_PHASES[currentPhaseIdx]
    ? `${DEPLOYMENT_PHASES[currentPhaseIdx].label}: ${DEPLOYMENT_PHASES[currentPhaseIdx].description} Step ${currentPhaseIdx + 1} of ${DEPLOYMENT_PHASES.length}.`
    : isComplete
      ? `Deployment complete. ${appName} is running.`
      : failed
        ? "Deployment failed."
        : ""}
</div>
```

2. **Add `aria-valuetext` to progressbar** — On the existing `div[role="progressbar"]` (around line ~149), add:

```tsx
aria-valuetext={`${DEPLOYMENT_PHASES[currentPhaseIdx]?.label ?? "Preparing"} — step ${currentPhaseIdx + 1} of ${DEPLOYMENT_PHASES.length}`}
```

#### Acceptance Criteria

- [ ] An `aria-live="polite" aria-atomic="true"` region exists in the deploy progress page
- [ ] The live region content updates when `currentStatus` changes (reflects phase label + description)
- [ ] The live region announces deployment completion and failure states
- [ ] The `role="progressbar"` element includes `aria-valuetext` with human-readable phase info
- [ ] The live region is visually hidden (`sr-only` / equivalent)
- [ ] Existing tests still pass; new test verifies `aria-live` region renders with correct phase text for each status
- [ ] `pnpm typecheck && pnpm lint && pnpm test` exits 0

---

### 2.6 AB#310 — Alerts SSE New Alerts Not Announced via `aria-live`

| Field | Value |
|-------|-------|
| **Bug ID** | AB#310 |
| **Agent** | Frontend Developer |
| **Branch** | `fix/bug-310-alerts-aria-live` |
| **A11Y Finding** | A-02 (WCAG 4.1.3 AA — Status Messages) |
| **Parent Azure ID** | 180 |
| **Project** | unplughq |
| **Repo URL** | https://github.com/sjefsharp/unplughq |

#### Problem

The alerts page at [alerts/page.tsx](code/src/app/(authenticated)/alerts/page.tsx) receives new alerts via SSE (`handleSSEMessage` sets `sseAlerts` state on `alert.created` events). The `role="list"` container is NOT an `aria-live` region. Critical system alerts arriving in real-time are invisible to screen reader users.

Additionally, alert acknowledgement result text appears in the expanded panel but is not in an `aria-live` region (A11Y finding A-07 — moderate, can be fixed inline).

#### Files to Modify

| File | Change |
|------|--------|
| `code/src/app/(authenticated)/alerts/page.tsx` | 1. Add an `aria-live="assertive"` visually-hidden `<div>` for new alert announcements. 2. Track new alert announcements via state. 3. Add an `aria-live="polite"` region for acknowledge/dismiss action results. |

#### Exact Fix Guidance

1. **Add new alert announcement state** — Add a `newAlertAnnouncement` state:

```tsx
const [newAlertAnnouncement, setNewAlertAnnouncement] = useState("");
```

2. **Update SSE handler** — In `handleSSEMessage`, when a new `alert.created` arrives, set the announcement:

```tsx
if (msg.event === "alert.created" && parsed.severity && parsed.type && parsed.id) {
  setSSEAlerts((prev) => [parsed, ...prev]);
  setNewAlertAnnouncement(`New ${parsed.severity} alert: ${parsed.message || parsed.type}`);
  // Clear after screen reader has time to announce
  setTimeout(() => setNewAlertAnnouncement(""), 5000);
}
```

3. **Add `aria-live="assertive"` region** — Insert a `sr-only` `<div>` in the JSX:

```tsx
<div aria-live="assertive" aria-atomic="true" className="sr-only">
  {newAlertAnnouncement}
</div>
```

4. **Add acknowledge result announcement** — Add a `sr-only` `aria-live="polite"` region that announces when an alert is acknowledged or dismissed. Track via state similarly.

#### Acceptance Criteria

- [ ] An `aria-live="assertive" aria-atomic="true"` region exists on the alerts page
- [ ] New SSE alerts trigger an announcement with severity and type/message
- [ ] Announcement text clears after a reasonable delay (3–5 seconds) to prevent repeat reads
- [ ] Acknowledge action result announced via `aria-live="polite"` region
- [ ] Dismiss action result announced via `aria-live="polite"` region
- [ ] Both live regions are visually hidden (`sr-only` / equivalent)
- [ ] Existing tests still pass; new test verifies `aria-live` regions render and update
- [ ] `pnpm typecheck && pnpm lint && pnpm test` exits 0

---

## 3. Deferred Items — PI-3 Backlog

These items are deferred with documented rationale. PM should create PI-3 backlog entries.

| Bug ID | Title | Reason for Deferral | PI-3 Priority |
|--------|-------|--------------------|----|
| AB#311 | Input border contrast CF-02 (~1.6:1) | Persistent since Sprint 1. Token needs change to `slate-500`. Not a release gate since Sprint 1 shipped with same defect. | P1 |
| AB#312 | Config wizard step focus management | Keyboard users can still tab to fields. Degraded UX, not a hard barrier. Requires `requestAnimationFrame` focus management in `goNext()`/`goBack()`. | P1 |
| AB#300 | Auth lockout flaky test | Passes in isolation. Only flaky under full-suite coverage instrumentation load (6784ms). Test infrastructure concern, not functional. | P2 |
| AB#301 | Duplicate-email timing test | 728ms vs 500ms threshold too tight for CI. Functional behavior correct. Raise threshold or use retry strategy. | P2 |

### Additional SEC MEDIUM/LOW for PI-3 Backlog (Not Filed as Bugs)

These were identified in the security review but not filed as bug work items. PM should create backlog items.

| SEC Finding | Title | CVSS | Recommended PI-3 Priority |
|-------------|-------|------|--------------------------|
| F-05 | Catalog detail endpoint returns unfiltered template data | 5.5 | P2 |
| F-06 | No deployment state machine validation | 6.0 | P2 |
| F-07 | SSE endpoint lacks session re-validation | 6.2 | P1 |
| F-08 | Agent token rotation does not restart container | 5.0 | P2 |
| F-09 | Monitoring agent image not digest-pinned | 5.3 | P2 |
| F-10 | Deployment pipeline lacks per-phase logging | 3.5 | P3 |
| F-11 | Password minimum length client/server discrepancy | 2.0 | P3 |
| F-12 | Volume mount path validation missing at template level | 3.0 | P3 |

---

## 4. Execution Notes for PM

### Delegation Order

Recommend delegating in parallel where possible:
1. **BE agent** — AB#303, AB#304, AB#306, AB#307 (four independent fixes in server-side code)
2. **FE agent** — AB#309, AB#310 (two independent fixes in client-side pages)

AB#306 and AB#307 both touch `ssh-service.ts` but different template cases — they can be done sequentially by the same agent or merged into a single fix branch if preferred.

### Branch Strategy

All 6 fix branches should already exist (created by `create-work-item.mjs`). Each fix is independently mergeable to `feat/pi-2-sprint-2`.

### Verification

After all fixes land, PM should re-invoke:
- **Security Analyst** — re-verify F-01 through F-04 are remediated
- **Accessibility agent** — re-verify A-01 and A-02 are remediated
- **Tech Lead** — run full build/test/lint to confirm no regressions

### Task-First Reminder for Delegated Agents

Each agent MUST create a Task work item before coding:
```
node .github/skills/azure-boards/scripts/create-work-item.mjs \
  --project unplughq --type task --name {agent-prefix}-fix-bug-{ID}-{short-name} \
  --title "[{AGENT}] Fix {bug title}" \
  --description "{elaborative description}" \
  --parent-azure-id 180 --priority 1 --tier full --phase P5
```

Deploy artifacts with:
```
node .github/skills/azure-boards/scripts/deploy-artifact.mjs \
  --id {task-id} --artifact-path {path} --creator {role} \
  --repo-url https://github.com/sjefsharp/unplughq --propagate
```

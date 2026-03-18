---
artifact: security-review-sprint2
produced-by: security-analyst
project-slug: unplughq
work-item: epic-001-unplughq-platform
work-item-type: epic
workflow-tier: full
phase: P5
version: 1.0.0
status: draft
consumed-by:
  - product-owner
  - tech-lead
  - backend-developer
  - devops-engineer
date: 2026-03-18
review:
  reviewed-by:
  reviewed-date:
---

# Security Review — UnplugHQ PI-2 Sprint 2

## 1. Executive Summary

P5 security verification of Sprint 2 code against the PI-2 threat model (48 STRIDE threats). This review covers the four deferred PI-1 security bug fixes (AB#258, AB#259, AB#260, AB#262), new Feature 2 (Application Catalog & Deployment) code, new Feature 3 (Dashboard & Health Monitoring) code, alert pipeline, and infrastructure scripts.

| Metric | Count |
|--------|-------|
| Threat model items reviewed | 48 |
| PI-1 bug fixes verified | 4 |
| Bug fixes: IMPLEMENTED | 3 |
| Bug fixes: PARTIAL | 1 |
| Sprint 2 new code items reviewed | 26 |
| **Critical findings** | 0 |
| **High findings** | 4 |
| **Medium findings** | 5 |
| **Low / informational** | 3 |

**Overall security posture: CONDITIONAL PASS** — The PI-1 security bug fixes are substantially implemented. CSRF (B-258), audit logging (B-259), and sudoers (B-262) are correctly implemented. Secrets rotation (B-260) is partially implemented — SSH key rotation generates non-functional key material and does not deploy to the VPS. Four high-severity findings in Sprint 2 new code require remediation before production deployment.

---

## 2. Bug Fix Verification

### 2.1 B-258 — CSRF Protection on tRPC Mutations

**Verdict: IMPLEMENTED**

The double-submit cookie pattern is correctly implemented across the tRPC mutation pipeline.

| Check | Result | Evidence |
|-------|--------|----------|
| CSRF middleware exists | PASS | `src/server/trpc/middleware/csrf.ts` — `assertValidCsrf()` extracts cookie + header, validates with `timingSafeEqual` |
| Token generation | PASS | HMAC-SHA256 of session ID using `AUTH_SECRET` — deterministic per session, changes on re-auth |
| Cookie attributes | PASS | `__Host-csrf`, `SameSite=Strict`, `HttpOnly=false` (correct — client JS must read), `Secure` in production |
| Cookie set on response | PASS | `api/trpc/[trpc]/route.ts` — sets `__Host-csrf` cookie via `Set-Cookie` header when token changes |
| Middleware applied to mutations only | PASS | `csrfMiddleware` checks `type === 'mutation'`; queries pass through |
| `protectedMutationProcedure` chains auth → CSRF → audit | PASS | `trpc/index.ts` line 100: `protectedProcedure.use(csrfMiddleware).use(auditMiddleware)` |
| All Sprint 2 mutations use `protectedMutationProcedure` | PASS | `app.deployment.create/stop/start/remove`, `monitor.alerts.acknowledge/dismiss`, `domain.bind/unbind`, `server.rotateSSHKey/rotateAgentToken` — all use `protectedMutationProcedure` |
| Timing-safe comparison | PASS | `Buffer.from()` + `timingSafeEqual()` — prevents timing attacks on token comparison |
| Metrics endpoint excluded (uses API token auth) | PASS | `POST /api/agent/metrics` uses Bearer token auth, not session auth — CSRF N/A |

**Minor note:** The `__Host-` prefix requires `Secure` attribute. In development (`NODE_ENV !== 'production'`), `Secure` is false — the cookie may not be accepted by browsers with strict prefix enforcement. This is a dev-only ergonomics issue, not a production vulnerability.

### 2.2 B-259 — Audit Logging

**Verdict: IMPLEMENTED**

Comprehensive audit logging is implemented as a tRPC middleware wrapping all mutations.

| Check | Result | Evidence |
|-------|--------|----------|
| Audit middleware exists | PASS | `trpc/index.ts` — `auditMiddleware` wraps all `protectedMutationProcedure` calls |
| Captures: action, timestamp, userId, tenantId | PASS | `recordAuditEvent()` persists action (tRPC path), tenantId, userId in details |
| Captures: targetType, targetId | PASS | `inferAuditTargetType()` maps tRPC paths; `inferAuditTargetId()` extracts IDs from input |
| Captures: IP address, user agent | PASS | Extracted from `x-forwarded-for` and `user-agent` headers |
| Captures: outcome (success/failure) | PASS | Try/catch in middleware records `success` or `failure` with error message |
| Captures: duration | PASS | `Date.now() - startedAt` stored in `details.durationMs` |
| Append-only table design | PASS | `auditLog` table has no UPDATE/DELETE operations in application code |
| 90-day retention in queries | PASS | `listAuditEvents()` applies `gte(auditLog.createdAt, retentionCutoff)` |
| `user.auditLog` query available | PASS | `routers/user.ts` — paginated, tenant-scoped audit query |
| New PI-2 actions audited | PASS | All deployment (create/stop/start/remove), alert (acknowledge/dismiss), credential rotation, domain (bind/unbind) go through `protectedMutationProcedure` |
| Error resilience | PASS | `recordAuditEvent()` catches and logs persistence failures — audit write failure doesn't block the mutation |

### 2.3 B-260 — Secrets Rotation

**Verdict: PARTIAL**

API token rotation is correctly implemented. SSH key rotation generates non-functional key material.

| Check | Result | Evidence |
|-------|--------|----------|
| `server.rotateSSHKey` procedure exists | PASS | `routers/server.ts` — `protectedMutationProcedure` |
| Tenant ownership validated | PASS | `getTenantServer()` composite key lookup `(serverId, tenantId)` |
| New key encrypted before storage | PASS | `encryptSSHKey(sshKey, ctx.tenantId)` — AES-256-GCM with per-tenant HKDF |
| Key generation: proper Ed25519 keypair | **FAIL** | Generates `randomBytes(48).toString('base64')` wrapped in PEM headers — this is NOT a valid SSH key. The "key" cannot authenticate SSH connections. |
| Public key deployed to VPS | **FAIL** | No SSH command executed to deploy the new public key to the VPS `authorized_keys` |
| Old key invalidated on VPS | **FAIL** | Old public key not removed from VPS `authorized_keys` |
| Server remains connected during rotation | **FAIL** | After DB update with fake key, next SSH operation will fail (invalid key) |
| Rotation event in audit log | PASS | Goes through `protectedMutationProcedure` → audit middleware records action |
| `server.rotateAgentToken` procedure exists | PASS | `routers/server.ts` — `protectedMutationProcedure` |
| New token generated (256-bit random) | PASS | `randomBytes(32).toString('hex')` — cryptographically secure |
| Token stored in DB | PASS | `db.update(servers).set({ apiToken })` with tenant scope |
| Agent updated on VPS | **PARTIAL** | `update-agent` job enqueued, but handler uses `start-monitoring-agent` template which calls `docker run` — fails if container already exists. Should stop+remove old container first. |

**Bug filed:** SSH key rotation is non-functional — see Finding F-01.

### 2.4 B-262 — Sudoers File Hardening

**Verdict: IMPLEMENTED**

The sudoers file is correctly restricted with proper file permissions and validation.

| Check | Result | Evidence |
|-------|--------|----------|
| File ownership `root:root` | PASS | `setup-user.sh` line 84: `chown root:root "$TMP_SUDOERS_FILE"` |
| File mode `0440` | PASS | `setup-user.sh` line 85: `chmod 0440 "$TMP_SUDOERS_FILE"` |
| `visudo -c` validation | PASS | `setup-user.sh` line 87: `visudo -c -f "$TMP_SUDOERS_FILE"` — exits on failure |
| No wildcard/ALL permissions | PASS | Each sudoers entry specifies exact commands with full arguments |
| Limited to Docker CLI | PASS | `unplughq ALL=(root) NOPASSWD: /usr/bin/docker` |
| Limited to specific APT operations | PASS | Three explicit `apt-get install` lines with exact package lists |
| No `systemctl` wildcard | PASS | No systemctl entries in sudoers (Docker managed via group membership) |
| No shell access via sudo | PASS | No `/bin/bash`, `/bin/sh`, or similar shell entries |

**PI-1 issue resolved:** The previous `apt-get install *` wildcard has been replaced with three explicit package-list entries. The PI-1 bug (E-04 partial) is fully remediated.

---

## 3. Sprint 2 New Code — STRIDE Review

### 3.1 Spoofing

| Check | Threat ID | Result | Evidence |
|-------|-----------|--------|----------|
| CSRF on all Sprint 2 mutations | T-14, S-10 | PASS | All Sprint 2 mutations use `protectedMutationProcedure` which chains CSRF middleware |
| SSE connection auth on establishment | S-10 | PASS | `api/events/route.ts`: `auth()` call, 401 on missing session |
| SSE session re-validation on heartbeat | S-10, I-11 | **FAIL** | Heartbeat sends `:heartbeat` keepalive but does NOT re-check session validity |
| SSE connection cleanup on logout | I-11 | **FAIL** | No mechanism to close SSE connections when session is deleted |
| Monitoring agent token auth | S-03 | PASS | `api/agent/metrics/route.ts`: Bearer token validated against `servers.apiToken` |

### 3.2 Tampering

| Check | Threat ID | Result | Evidence |
|-------|-----------|--------|----------|
| SSH commands use parameterized templates | T-01, T-10 | PASS | All commands in `ssh-service.ts` use `resolveCommand()` with typed `SSHCommandTemplate` — zero string concatenation |
| Shell escaping on all interpolated values | T-01, T-10 | PASS | `shellEscape()` wraps all interpolated values in single quotes with proper escaping |
| Env files written via base64 encoding (AB#255) | T-10 | PASS | `write-env-file` template: `base64 -d` pipeline prevents heredoc/shell injection |
| Env files deployed via SFTP with chmod 600 | T-10 | PASS | `uploadViaSftp()` uses mode `0o600`; `infrastructure-templates.ts` sets `mode: 0o600` |
| Domain name validation (RFC 1035) | T-10 | PASS | Regex `/^([a-zA-Z0-9]...)$/` in `DeployAppInput` and `domain.bind` |
| Caddy route IDs from deployment UUID | T-12 | PASS | `buildCaddyRouteId(deploymentId)` — deterministic from UUID, not user input |
| Caddy admin API via localhost only | T-04 | PASS | SSH templates use `curl -s http://localhost:2019/...` |
| Image digest validation | T-03 | PASS | `CatalogApp` schema: `imageDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/)` |
| `getImageRef()` uses digest | T-03 | PASS | `ghcr.io/unplughq/${catalogAppId}@${imageDigest}` — always digest-pinned |
| Deployment config UNSAFE_CONFIG_PATTERN | T-10 | **PARTIAL** | Pattern `/[;&\|`$(){}<>\\\n]/` checked only for template-schema-defined fields. Extra keys bypass validation entirely — see Finding F-02 |
| Config key name validation | T-10 | **FAIL** | No `ENV_VAR_PATTERN` validation on config keys. Keys are written directly to env file — see Finding F-02 |
| Deployment state machine enforcement | T-11 | **FAIL** | `updateDeploymentStatus()` allows setting any status directly. No valid-transition enforcement or optimistic locking — see Finding F-06 |

### 3.3 Repudiation

| Check | Threat ID | Result | Evidence |
|-------|-----------|--------|----------|
| All deployment mutations audited | R-10 | PASS | `protectedMutationProcedure` middleware logs all mutations |
| Deployment logs stored per-phase | R-11 | **PARTIAL** | Deploy job handler updates status per-phase via `updateDeploymentStatus()` but does NOT write detailed per-phase records with command template names, exit codes, or durations to a `deployment_logs` table |
| Alert operations audited | R-10 | PASS | acknowledge/dismiss go through audit middleware |
| Credential rotation audited | R-10 | PASS | rotateSSHKey/rotateAgentToken go through audit middleware |
| Alert notification tracking | R-12 | PASS | `notificationSent` boolean + `send-alert` job with BullMQ retry (3 attempts, exponential backoff) |

### 3.4 Information Disclosure

| Check | Threat ID | Result | Evidence |
|-------|-----------|--------|----------|
| Tenant isolation on deployment queries | I-07, E-12 | PASS | `deployment.list/get` use `eq(deployments.tenantId, ctx.tenantId)` |
| Tenant isolation on alert queries | I-07 | PASS | `alerts.list/get/acknowledge/dismiss` all scope by `tenantId` |
| Tenant isolation on metrics queries | I-07, I-12 | PASS | `monitor.dashboard/serverMetrics/appStatus` all scope by `tenantId` |
| SSE events tenant-scoped | I-07, I-11 | PASS | `sseEventBus.emitToTenant(tenantId, ...)` — never broadcast |
| Deployment progress events (SSE) contain no secrets | I-10 | PASS | Emits only `deploymentId`, `status`, `phase` — no SSH output, no env values |
| Catalog API returns public subset | I-13 | **PARTIAL** | `catalog.list` uses `CatalogApp.parse(app)` (public subset). `catalog.get` returns raw DB record — exposes internal fields. See Finding F-05 |
| Secrets excluded from API responses | I-10 | PASS | Server responses exclude `sshKeyEncrypted`, `apiToken`. Deployment responses exclude raw config values. |
| Logger redacts sensitive fields | I-05 | PASS | Pino formatter strips PEM patterns, `password`, `privateKey`, `token`, etc. |
| Error messages generic | I-04 | PASS | tRPC errors use `ErrorCode` enum — no stack traces or SQL in responses |

### 3.5 Denial of Service

| Check | Threat ID | Result | Evidence |
|-------|-----------|--------|----------|
| Tier-based app deployment limits | D-10, E-03 | PASS | `ensureDeploymentCapacity()` checks `TierLimits[tier].maxApps` before deployment |
| Pre-deployment resource validation | D-10 | PASS | `evaluateResourceFit()` checks CPU/RAM/disk against template requirements + 80% threshold warnings |
| Metrics rate limiting (2 req/min/server) | D-02 | PASS | `checkRateLimit('metrics:${server.id}', 2, 60_000)` with 429 + Retry-After |
| BullMQ job payloads validated | D-05 | PASS | All handlers use `.safeParse()` on Zod schemas before processing |
| SSH connection pool limits | D-04 | PASS | `MAX_CONNECTIONS_PER_SERVER = 3`, timeouts enforced |
| Alert deduplication | D-12 | PASS | `isActiveAlertPresent()` prevents duplicate alerts for same server+type while active |
| Domain uniqueness | N/A | PASS | `ensureDomainIsAvailable()` prevents domain collision |

### 3.6 Elevation of Privilege

| Check | Threat ID | Result | Evidence |
|-------|-----------|--------|----------|
| `authed` middleware on all protected procedures | E-05 | PASS | All Sprint 2 protected procedures use `protectedProcedure` or `protectedMutationProcedure` |
| App lifecycle verifies tenant ownership | E-12, E-05 | PASS | `stop/start/remove` call `getTenantDeployment(id, tenantId)` — composite key |
| Domain bind/unbind verifies server + deployment ownership | E-12 | PASS | `getTenantServer()` + `getTenantDeployment()` before mutation |
| Alert dismiss verifies tenant ownership | E-12 | PASS | `acknowledgeTenantAlert(tenantId, alertId)` and `dismissTenantAlert(tenantId, alertId)` scope by tenantId |
| Monitoring agent container hardened | E-01 | **PARTIAL** | `deploy-agent.sh` includes `--read-only`, `--security-opt=no-new-privileges`, `--cap-drop=ALL`. But `start-monitoring-agent` SSH template does NOT — see Finding F-03 |
| User app containers hardened | E-10 | **FAIL** | `docker-run` SSH template lacks `--security-opt=no-new-privileges` — see Finding F-04 |
| Docker socket not mounted in user containers | E-01 | PASS | `docker-run` template has no Docker socket mount. Only monitoring agent has `:ro` mount. |

---

## 4. Findings

### F-01 — SSH Key Rotation Generates Non-Functional Key (HIGH)

| Field | Value |
|-------|-------|
| **Severity** | High |
| **CVSS v4.0** | 7.1 |
| **CWE** | CWE-324 (Use of a Key Past its Expiration Date) |
| **OWASP** | A04 Cryptographic Failures |
| **Threat IDs** | I-01 |
| **Component** | `src/server/trpc/routers/server.ts` — `rotateSSHKey` mutation |
| **Status** | Bug filed |

**Description:** The `rotateSSHKey` mutation generates fake SSH key material by wrapping `randomBytes(48).toString('base64')` in PEM headers. This is not a valid Ed25519 or RSA key — it cannot be used for SSH authentication. After rotation, the encrypted "key" is stored in the database, but:

1. The "key" is cryptographically meaningless — SSH connections will fail
2. No public key is deployed to the VPS `authorized_keys`
3. The old public key is not removed from the VPS
4. The server effectively becomes inaccessible after rotation

**Remediation:** Generate a proper Ed25519 keypair using `ssh-keygen` equivalent (e.g., `node:crypto` `generateKeyPairSync('ed25519')`). Deploy the new public key to the VPS via SSH (while the old key still works), verify connectivity with the new key, then remove the old public key.

### F-02 — Deployment Config Accepts Arbitrary Key-Value Pairs (HIGH)

| Field | Value |
|-------|-------|
| **Severity** | High |
| **CVSS v4.0** | 7.5 |
| **CWE** | CWE-20 (Improper Input Validation) |
| **OWASP** | A03 Injection |
| **Threat IDs** | T-10, E-11 |
| **Component** | `src/server/services/deployment-service.ts` — `validateConfigAgainstSchema()`, `createEnvFileContent()` |
| **Status** | Bug filed |

**Description:** The `DeployAppInput.config` schema is `z.record(z.string(), z.string())` — accepting any key-value pairs. The `validateConfigAgainstSchema()` function only checks fields defined in `template.configSchema`. Extra keys bypass two critical validations:

1. **Key format validation** — Config keys are not validated against an ENV_VAR pattern (`/^[A-Z_][A-Z0-9_]*$/`). Keys with special characters are written directly to the env file.
2. **Value shell-metacharacter rejection** — Only schema-defined field values are checked against `UNSAFE_CONFIG_PATTERN`. Extra keys' values are never checked.

An authenticated user could inject arbitrary environment variables into their app container by passing extra config entries. Dangerous examples:
- `NODE_OPTIONS=--require=/etc/passwd` — Node.js code injection
- `LD_PRELOAD=/path/to/malicious.so` — dynamic library injection
- `PATH=/tmp:/usr/bin` — PATH hijacking
- `DATABASE_URL=postgresql://attacker` — connection redirection

While the env file write is safe (base64-encoded over SSH), the values become active environment variables in the Docker container.

**Remediation:**
1. Filter `input.config` to include ONLY keys defined in `template.configSchema` before storing in the database
2. Validate all config keys against `/^[A-Z_][A-Z0-9_]*$/`
3. Validate ALL config values (not just schema-defined ones) against `UNSAFE_CONFIG_PATTERN`
4. Reject a blocklist of dangerous env var keys: `NODE_OPTIONS`, `LD_PRELOAD`, `LD_LIBRARY_PATH`, `PATH`, `HOME`, `SHELL`, `USER`

### F-03 — Monitoring Agent SSH Template Missing Security Hardening (HIGH)

| Field | Value |
|-------|-------|
| **Severity** | High |
| **CVSS v4.0** | 7.3 |
| **CWE** | CWE-250 (Execution with Unnecessary Privileges) |
| **OWASP** | A05 Security Misconfiguration |
| **Threat IDs** | E-01, T-05 |
| **Component** | `src/server/services/ssh/ssh-service.ts` — `start-monitoring-agent` template |
| **Status** | Bug filed |

**Description:** The `deploy-agent.sh` shell script correctly includes Docker security options:
```
--read-only --security-opt=no-new-privileges --cap-drop=ALL --tmpfs /tmp:rw,noexec,nosuid,size=16m
```

However, the `start-monitoring-agent` SSH command template in `ssh-service.ts` (used by the BullMQ provisioning worker and agent token rotation) does NOT include these options. Containers started via the SSH template run with default Docker privileges — writable filesystem, capability to gain new privileges, and all default capabilities.

Since the monitoring agent has read-only access to the Docker socket, a compromised agent without hardening could:
- Write to the filesystem (persist malware)
- Gain new privileges via setuid binaries
- Use default capabilities for network operations

**Remediation:** Add security options to the `start-monitoring-agent` SSH template:
```typescript
`sudo docker run -d --name unplughq-agent --network unplughq --restart unless-stopped`,
`--read-only --security-opt=no-new-privileges --cap-drop=ALL`,
`--tmpfs /tmp:rw,noexec,nosuid,size=16m`,
```

### F-04 — User App Containers Missing Security Options (HIGH)

| Field | Value |
|-------|-------|
| **Severity** | High |
| **CVSS v4.0** | 7.0 |
| **CWE** | CWE-250 (Execution with Unnecessary Privileges) |
| **OWASP** | A05 Security Misconfiguration |
| **Threat IDs** | E-10, E-01 |
| **Component** | `src/server/services/ssh/ssh-service.ts` — `docker-run` template |
| **Status** | Bug filed |

**Description:** The `docker-run` SSH command template does not include `--security-opt=no-new-privileges`, violating SEC-DOCKER-03. User app containers deployed via the deployment pipeline run with default Docker security settings, allowing:
- Privilege escalation via setuid binaries within the container
- New capability acquisition at runtime

Per the threat model (E-10), app templates could theoretically specify dangerous parameters. While current templates are safe, defense-in-depth requires the SSH template to enforce security constraints regardless of input.

**Remediation:** Add `--security-opt=no-new-privileges` to the `docker-run` template:
```typescript
return [
  `docker run -d`,
  `--name ${shellEscape(containerName)}`,
  `--network ${shellEscape(networkName)}`,
  `--restart unless-stopped`,
  `--security-opt=no-new-privileges`,
  `--env-file ${shellEscape(envFile)}`,
  ...
].join(' ');
```

### F-05 — Catalog Detail Endpoint Returns Unfiltered Template Data (MEDIUM)

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **CVSS v4.0** | 5.5 |
| **CWE** | CWE-200 (Exposure of Sensitive Information) |
| **OWASP** | A01 Broken Access Control |
| **Threat IDs** | I-13 |
| **Component** | `src/server/trpc/routers/app.ts` — `catalog.get` |

**Description:** The `app.catalog.list` endpoint correctly filters records through `CatalogApp.parse(app)` (Zod `.pick()` equivalent), returning only the public subset. However, `app.catalog.get` returns the raw database record without filtering:

```typescript
get: publicProcedure.input(catalogGetInput).query(async ({ input }) => {
  // ...
  return app; // Raw DB record — may include internal fields
});
```

Internal fields such as default environment variable values, internal port mappings, and health check paths could be exposed to unauthenticated users.

**Remediation:** Apply `CatalogApp.parse(app)` to the `catalog.get` response, consistent with `catalog.list`.

### F-06 — No Deployment State Machine Validation (MEDIUM)

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **CVSS v4.0** | 6.0 |
| **CWE** | CWE-841 (Improper Enforcement of Behavioral Workflow) |
| **OWASP** | A04 Insecure Design |
| **Threat IDs** | T-11 |
| **Component** | `src/server/services/deployment-service.ts` — `updateDeploymentStatus()` |

**Description:** The `updateDeploymentStatus()` function accepts any `DeploymentStatus` value and writes it directly to the database without validating that the transition is valid (e.g., `pending → pulling` is valid, but `running → pending` should be rejected). No optimistic locking (version column) is implemented.

While only the deployment worker currently calls this function with controlled transitions, the lack of enforcement is a defense-in-depth gap. A code error or race condition could lead to invalid state transitions.

**Remediation:** Add a `VALID_TRANSITIONS` map and validate current → target state before update. Add a `version` column with optimistic locking.

### F-07 — SSE Endpoint Lacks Session Re-Validation (MEDIUM)

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **CVSS v4.0** | 6.2 |
| **CWE** | CWE-613 (Insufficient Session Expiration) |
| **OWASP** | A07 Authentication Failures |
| **Threat IDs** | S-10, I-11 |
| **Component** | `src/app/api/events/route.ts` |

**Description:** The SSE endpoint validates the session once at connection establishment but does not re-validate during the heartbeat cycle (every 30 seconds). Per SEC-SSE-02, SSE connections must re-validate the session on each heartbeat. A session that is invalidated (logout, expiry) during an active SSE connection will continue streaming events.

Additionally, there is no mechanism to close SSE connections when a user logs out (SEC-SSE-03). The `deleteAccount` mutation deletes sessions but does not signal the SSE event bus to close associated connections.

**Remediation:**
1. On each heartbeat cycle, call `auth()` to re-validate the session. If invalid, send a `session-expired` event and close the stream.
2. Implement a session invalidation listener that closes all SSE connections for the deleted session.

### F-08 — Agent Token Rotation Does Not Restart Container (MEDIUM)

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **CVSS v4.0** | 5.0 |
| **CWE** | CWE-324 (Use of a Key Past its Expiration Date) |
| **OWASP** | A07 Authentication Failures |
| **Threat IDs** | S-04 |
| **Component** | `src/server/queue/handlers.ts` — `handleUpdateAgent()`, `src/server/services/ssh/ssh-service.ts` — `start-monitoring-agent` |

**Description:** The `rotateAgentToken` mutation enqueues an `update-agent` job. The handler calls the `start-monitoring-agent` SSH template which runs `docker run -d --name unplughq-agent ...`. Since a container named `unplughq-agent` already exists, this command will fail (Docker refuses to create a container with a duplicate name). The old container continues running with the old (now-invalid) token, causing metrics ingestion to fail with 401 errors.

**Remediation:** Add a `docker-restart-monitoring-agent` template that stops the old container, removes it, and starts a new one with the updated token. Alternatively, add `docker stop unplughq-agent && docker rm unplughq-agent` before the `docker run` in the template.

### F-09 — Monitoring Agent Image Not Digest-Pinned (MEDIUM)

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **CVSS v4.0** | 5.3 |
| **CWE** | CWE-829 (Inclusion of Functionality from Untrusted Control Sphere) |
| **OWASP** | A08 Software and Data Integrity Failures |
| **Threat IDs** | T-03, T-05 |
| **Component** | `src/server/services/ssh/ssh-service.ts` — `start-monitoring-agent` template, `code/infra/provisioning/deploy-agent.sh` |

**Description:** The monitoring agent image reference uses a mutable tag (`ghcr.io/unplughq/agent:latest`) in both the SSH template and the deployment script. If the registry is compromised or an attacker pushes a malicious image under the `:latest` tag, all new provisions and agent restarts would deploy the compromised agent.

Catalog app images are correctly digest-pinned (`sha256:...`), but the agent image is not.

**Remediation:** Pin the agent image by digest. Store the current agent image digest as a configuration value and update it through a controlled release process.

### F-10 — Deployment Pipeline Lacks Per-Phase Logging (LOW)

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **CVSS v4.0** | 3.5 |
| **CWE** | CWE-778 (Insufficient Logging) |
| **OWASP** | A09 Security Logging and Monitoring Failures |
| **Threat IDs** | R-11 |
| **Component** | `src/server/queue/handlers.ts` — `handleDeployApp()` |

**Description:** The threat model requires per-phase deployment logging with command template names, exit codes, and durations (R-11). The current implementation updates the deployment status per-phase and logs errors to the structured logger, but does not write structured per-phase records to a `deployment_logs` database table for audit correlation.

**Remediation:** Create a `deployment_logs` table and insert a record per phase with `deploymentId`, `phase`, `commandTemplateName`, `exitCode`, `durationMs`.

### F-11 — Password Minimum Length Client/Server Discrepancy (LOW)

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **CVSS v4.0** | 2.0 |
| **CWE** | CWE-521 (Weak Password Requirements) |
| **OWASP** | A07 Authentication Failures |
| **Threat IDs** | S-01 |
| **Component** | `src/lib/schemas/auth.ts` vs `src/server/services/auth/auth-service.ts` |

**Description:** The client-side schema enforces 8-character minimum passwords, while the server-side validation requires 12 characters. Users who enter 8–11 character passwords will pass client validation but fail server validation, causing a confusing UX.

**Remediation:** Align client-side minimum to 12 characters to match server-side enforcement.

### F-12 — Volume Mount Path Validation Missing at Template Level (LOW)

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **CVSS v4.0** | 3.0 |
| **CWE** | CWE-22 (Improper Limitation of a Pathname) |
| **OWASP** | A01 Broken Access Control |
| **Threat IDs** | E-10 |
| **Component** | `src/server/services/ssh/ssh-service.ts` — `docker-run` template |

**Description:** The `docker-run` SSH template accepts volume mount paths without validating they are within the allowed directory (`/opt/unplughq/data/`). While current callers pass safe paths generated by `infrastructure-templates.ts`, the template itself does not enforce path constraints as a defense-in-depth measure.

**Remediation:** Add a path validation function that rejects mount paths outside `/opt/unplughq/data/` and explicitly blocks `/var/run/docker.sock`, `/proc`, `/sys`, and `/`.

---

## 5. OWASP Top 10 (2021) Mapping

| OWASP Category | Finding IDs | Sprint 2 Status |
|----------------|-------------|-----------------|
| A01 Broken Access Control | F-05, F-12 | PASS (tenant isolation comprehensive) with two medium/low gaps |
| A02 Security Misconfiguration | F-03, F-04 | Two HIGH gaps: Docker container security hardening missing |
| A03 Injection | F-02 | One HIGH gap: deployment config key/value injection |
| A04 Cryptographic Failures | F-01 | One HIGH gap: SSH key rotation non-functional |
| A05 Insecure Design | F-06 | One MEDIUM gap: no state machine validation |
| A06 Vulnerable and Outdated Components | — | PASS (dependency audit per TL pre-check) |
| A07 Authentication Failures | F-07, F-08, F-11 | Two MEDIUM + one LOW: SSE re-validation, token rotation restart, password length |
| A08 Software and Data Integrity Failures | F-09 | One MEDIUM: agent image not digest-pinned |
| A09 Security Logging and Monitoring Failures | F-10 | One LOW: missing per-phase deployment logging |
| A10 Server-Side Request Forgery | — | PASS (no user-controlled URL fetching in Sprint 2 code) |

---

## 6. Findings Summary

| ID | Title | Severity | CVSS v4.0 | Bug Filed |
|----|-------|----------|-----------|-----------|
| F-01 | SSH key rotation generates non-functional key | HIGH | 7.1 | Yes |
| F-02 | Deployment config accepts arbitrary key-value pairs | HIGH | 7.5 | Yes |
| F-03 | Monitoring agent SSH template missing security hardening | HIGH | 7.3 | Yes |
| F-04 | User app containers missing `--security-opt=no-new-privileges` | HIGH | 7.0 | Yes |
| F-05 | Catalog detail endpoint returns unfiltered template data | MEDIUM | 5.5 | No |
| F-06 | No deployment state machine validation | MEDIUM | 6.0 | No |
| F-07 | SSE endpoint lacks session re-validation and logout cleanup | MEDIUM | 6.2 | No |
| F-08 | Agent token rotation does not restart container | MEDIUM | 5.0 | No |
| F-09 | Monitoring agent image not digest-pinned | MEDIUM | 5.3 | No |
| F-10 | Deployment pipeline lacks per-phase logging | LOW | 3.5 | No |
| F-11 | Password minimum length client/server discrepancy | LOW | 2.0 | No |
| F-12 | Volume mount path validation missing at template level | LOW | 3.0 | No |

---

## 7. PI-1 Bug Fix Regression Verification

| PI-1 Finding | Status in Sprint 2 |
|--------------|-------------------|
| S-01 rate limit counter bug (incremented on all calls) | **FIXED** — `checkRateLimit()` is now read-only; `recordRateLimitHit()` is a separate function called only on failures |
| S-05 session invalidation on password reset | **FIXED** — `resetPassword()` now deletes all sessions: `db.delete(sessions).where(eq(sessions.userId, user.id))` |
| T-01 heredoc injection in write-env-file | **FIXED** — Uses base64 encoding pipeline instead of heredoc (AB#255) |
| E-04 sudoers apt-get wildcard | **FIXED** — Explicit package lists per sudoers entry |
| D-01 no global API rate limiting | **NOT FIXED** — Still no global per-IP rate limiting middleware (out of Sprint 2 bug scope, tracked separately) |

---

## 8. External Skills Audit

All skills in `.github/skills/` are framework-owned and git-tracked. No external skills detected.

**External Skills — N/A.** No external skills installed — audit not applicable.

---

## 9. Security Posture Assessment

### Strengths

1. **CSRF protection comprehensive** — Double-submit cookie with timing-safe comparison on all tRPC mutations
2. **Audit logging thorough** — Middleware-level capture with success/failure tracking, IP, user agent, duration
3. **SSH command injection prevention excellent** — Typed template system with shell escaping, base64 env file writes
4. **Tenant isolation robust** — Session-derived `tenantId` on all queries, composite key lookups, UUIDs for external IDs
5. **Cryptography sound** — AES-256-GCM with HKDF per-tenant derivation, Argon2id password hashing
6. **Structured logging with redaction** — PEM patterns, sensitive keys, and tokens stripped from all log output
7. **Rate limiting in place** — Auth (10/5min), metrics (2/min/server) with Redis sliding window
8. **Sudoers properly hardened** — Explicit package lists, root:root 0440, visudo validation

### Areas Requiring Remediation

1. Four HIGH findings require code fixes before production: F-01 (SSH rotation), F-02 (config injection), F-03 (agent hardening), F-04 (container hardening)
2. SSE session lifecycle needs session re-validation and logout cleanup
3. Deployment state machine should enforce valid transitions
4. Monitoring agent image should be digest-pinned

### Recommendation

**CONDITIONAL PASS** — The four HIGH findings (F-01 through F-04) must be remediated before release. The five MEDIUM findings should be addressed in the current sprint if capacity permits, or tracked as technical debt for PI-3.

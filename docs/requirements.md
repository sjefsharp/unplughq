---
artifact: requirements
produced-by: business-analyst
project-slug: unplughq
work-item: epic-001-unplughq-platform
work-item-type: epic
workflow-tier: full
phase: P1
version: 2.0.0
status: draft
azure-devops-id: 278
consumed-by:
  - system-architect
  - security-analyst
  - solution-designer
  - ux-designer
  - content-strategist
  - accessibility
  - product-owner
  - tech-lead
  - testing
date: 2026-03-13
---

# Requirements

## Overview

This document establishes the full requirements set for the UnplugHQ platform, derived from the Product Vision, Feature Roadmap, PI Objectives, and Risk Register for epic-001-unplughq-platform (AB#180).

Requirements are organized by feature area, followed by cross-cutting non-functional requirements. Every requirement is traceable to at least one Desired Outcome (O1–O6), User Journey (UJ1–UJ5), or Success Criterion (SC1–SC8) from the Product Vision.

**PI-1 requirements** (F1, F4) were delivered in Sprint 1. **PI-2 requirements** (F2, F3, cross-cutting bug fixes) are the focus of Sprint 2.

**Vision reference:** [Product Vision](product-vision.md) · [PI-1 Summary](pi-1-summary.md) · [PI-2 Objectives](pi-objectives.md)

---

## Traceability Key

| Code | Source |
|------|--------|
| O1 | Desired Outcome 1 — Zero-Terminal Self-Hosting |
| O2 | Desired Outcome 2 — Automated Maintenance |
| O3 | Desired Outcome 3 — Guided Server Connection |
| O4 | Desired Outcome 4 — Application Marketplace |
| O5 | Desired Outcome 5 — Health Visibility |
| O6 | Desired Outcome 6 — Safe Operations |
| UJ1 | User Journey 1 — First-Time Setup |
| UJ2 | User Journey 2 — Adding a Second App |
| UJ3 | User Journey 3 — Handling an Update |
| UJ4 | User Journey 4 — Responding to an Alert |
| UJ5 | User Journey 5 — Migrating Away |
| SC1–SC8 | Success Criteria 1–8 |

---

## PI-1 Feature Areas (Delivered — Historical Reference)

---

## Feature Area: F4 — User Identity & Access (PI-1 — Delivered)

> Foundational capability enabling secure account creation, authentication, and session management. Parallel delivery with F1.
> **Vision alignment:** O1 (zero-terminal access to account), SC2 (no CLI required for any core flow)
> **Status:** Delivered in PI-1 Sprint 1. 4 stories, 16 SP, 106 tests passing.

| ID | Requirement | Type | Priority | Acceptance Criteria |
|----|-------------|------|----------|---------------------|
| FR-F4-001 | A visitor can create an account by providing a valid email address and password through the sign-up form. | Functional | Must | - Sign-up form accepts email and password<br>- Email format is validated on submission<br>- Password meets minimum strength requirements (≥ 12 characters, mixed case, at least one number or symbol)<br>- Duplicate email address is rejected with a clear message<br>- Upon successful creation the user is directed to onboarding |
| FR-F4-002 | A registered user can log in using their email address and password. | Functional | Must | - Login form accepts email and password<br>- Incorrect credentials produce a generic error that does not reveal which field was wrong<br>- Successful login establishes an authenticated session<br>- User is directed to the dashboard after login |
| FR-F4-003 | A logged-in user can log out, terminating their active session. | Functional | Must | - Log-out action is accessible from the main navigation<br>- Session token is invalidated server-side immediately on logout<br>- User is redirected to the login page<br>- Accessing authenticated routes after logout redirects to login |
| FR-F4-004 | A user who has forgotten their password can initiate a reset via a link sent to their registered email. | Functional | Must | - "Forgot password" link is present on the login screen<br>- On submission, a one-time reset link is emailed to the registered address<br>- The reset link expires after 1 hour<br>- After password reset the user must log in with the new password<br>- The previous password no longer authenticates after reset |
| FR-F4-005 | A logged-in user can update their display name, email address, and notification preferences (email alerts on/off) from account settings. | Functional | Must | - Settings page is accessible from the navigation<br>- Email change requires confirmation via link sent to new address before change is committed<br>- Notification preference changes take effect immediately<br>- Changes are persisted and reflected on next login |
| FR-F4-006 | Inactive sessions expire after a configurable maximum inactivity period and require re-authentication. | Functional | Should | - Sessions expire after a maximum inactivity period (default: 30 days, configurable per deployment)<br>- On expiry the user is redirected to login with an explanatory message<br>- Unexpired sessions are not terminated between page loads |
| FR-F4-007 | All authentication flows are completable without terminal access using only the web interface. | Functional | Must | - Zero CLI commands required for signup, login, logout, or password reset<br>- Verified by UX walkthrough audit (SC2) |

**Business Rules — F4**

| ID | Rule | Condition | Action | Source |
|----|------|-----------|--------|--------|
| BR-F4-001 | Rate limiting on authentication | More than 10 failed login attempts on the same account within 5 minutes | Temporarily lock account and notify registered email | O6, OWASP A07 |
| BR-F4-002 | Password storage | User password received by the system | Store only a salted hash using a modern adaptive algorithm (e.g., bcrypt or Argon2); never store or log plaintext | SC5, OWASP A02 |
| BR-F4-003 | Email uniqueness | Account creation or email change | Ensure uniqueness across all active accounts; reject duplicates silently (to prevent user enumeration) | OWASP A07 |

---

## Feature Area: F1 — Server Connection & Provisioning (PI-1 — Delivered)

> Enables a user to connect a VPS to UnplugHQ and have it automatically prepared as a managed host. This is the foundational capability for all deployment features.
> **Vision alignment:** O1, O3, UJ1, SC1, SC2
> **Status:** Delivered in PI-1 Sprint 1. 4 stories, 31 SP, 120 tests passing.

| ID | Requirement | Type | Priority | Acceptance Criteria |
|----|-------------|------|----------|---------------------|
| FR-F1-001 | A logged-in user can begin a guided VPS connection flow from the dashboard without requiring prior Linux knowledge. | Functional | Must | - "Add Server" entry point is visible on the dashboard and onboarding<br>- Flow can be completed by a user with no terminal experience (zero CLI steps)<br>- Verified by zero-terminal UX audit (SC2) |
| FR-F1-002 | The guided server connection flow presents provider-specific SSH key setup instructions with visual step-by-step guidance for each major VPS provider. | Functional | Must | - Flow covers at minimum: DigitalOcean, Hetzner, Linode/Akamai, Vultr, OVHcloud<br>- Instructions are tailored per provider (not generic)<br>- Screenshots or diagrams are included for key steps<br>- User can indicate their provider from a list or select "Other / Generic" |
| FR-F1-003 | The user provides the server IP address and grants SSH access; the system validates connectivity and authentication before proceeding. | Functional | Must | - IP address format is validated on input<br>- System verifies SSH reachability (TCP port 22 or user-specified SSH port)<br>- System confirms authentication success before proceeding<br>- If connection fails, a specific, actionable diagnostic message is displayed (e.g., "Port 22 unreachable — check firewall rules") |
| FR-F1-004 | After successful SSH connection, the system detects the server's operating system and checks available resources (CPU cores, RAM, available disk). | Functional | Must | - OS name and version are displayed to the user<br>- Available CPU, RAM, and disk are reported<br>- System clearly indicates whether the detected configuration meets minimum requirements |
| FR-F1-005 | The system signals whether the server meets the supported environment requirements and communicates unsupported states before provisioning begins. | Functional | Must | - A compatibility summary screen is shown before any provisioning begins<br>- Supported state proceeds to provisioning<br>- Unsupported state displays a clear explanation and does not attempt provisioning<br>- Partially supported state offers a warning and explicit user confirmation to proceed<br>- R1 and R2 mitigations: compatibility checked before install |
| FR-F1-006 | On a validated and compatible server, the system automatically installs and configures the required base runtime components (container runtime, reverse proxy, monitoring agent). | Functional | Must | - Provisioning is fully automated with no terminal interaction required<br>- Provisioning progress is displayed in real time<br>- Container runtime, reverse proxy, and monitoring agent are installed idempotently<br>- If provisioning fails, the failure is reported clearly and the server is not left in an indeterminate state |
| FR-F1-007 | A successfully provisioned server appears in the dashboard with a live health indicator. | Functional | Must | - Server tile displays name, IP, OS, and connection status<br>- Health indicator accurately reflects server connectivity (O5, SC7)<br>- Tile is visible immediately after provisioning completes |
| FR-F1-008 | A user can assign a human-readable name to each connected server. | Functional | Should | - Name field is present during the connection flow and editable from server settings<br>- Name is displayed in the dashboard and all server-related views |
| FR-F1-009 | If provisioning fails, the system reports the failure cause without leaving the server in an unknown state. | Functional | Must | - On provisioning failure: user is shown what step failed and receives guidance<br>- Partial installation artifacts are cleaned up or flagged<br>- The server is not shown as "provisioned" in the dashboard unless provisioning fully succeeded<br>- O6: safe operations |

**Business Rules — F1**

| ID | Rule | Condition | Action | Source |
|----|------|-----------|--------|--------|
| BR-F1-001 | Provisioning gate | Server compatibility check result is unsupported | Provisioning must not proceed; user must see explicit failure reason | R1, R2 |
| BR-F1-002 | SSH key handling | SSH private key material accessed or stored | Must be encrypted at rest if retained; retention scope must be limited to what is required for ongoing management; plaintext storage is prohibited | R5, SC5 |
| BR-F1-003 | Idempotent provisioning | Re-running provisioning on an already-provisioned server | Must not duplicate or corrupt installed components; must be safe to retry | R2 |

---

---

## PI-2 Feature Areas (Sprint 2 — Active)

---

## Feature Area: F2 — Application Catalog & Deployment (PI-2)

> Enables users to browse a curated set of self-hostable applications and deploy them to their server through a guided, zero-terminal flow.
> **Vision alignment:** O1, O4, UJ1, UJ2, SC1, SC2, SC3
> **PI-2 stories:** AB#202 (Catalog Browsing, 5 SP), AB#203 (Guided Config, 5 SP), AB#204 (Deployment + Progress, 13 SP), AB#205 (Post-Deploy Verification, 5 SP), AB#206 (Multi-App Coexistence, 5 SP)
> **PI-2 objectives:** PI2-O1, PI2-O2, PI2-O3
> **Risk references:** R13 (app template schema), R14 (remote Docker orchestration), R16 (multi-app resource contention), R18 (Caddy routing), R20 (supply chain), R25 (Docker Hub availability)

| ID | Requirement | Type | Priority | Acceptance Criteria |
|----|-------------|------|----------|---------------------|
| FR-F2-001 | The system presents a curated catalog of self-hostable applications organized into browseable categories. | Functional | Must | - Catalog contains categories (e.g., File Storage, Analytics, CMS, Password Management, Email, Photo Storage)<br>- Each category contains relevant curated apps<br>- Catalog can be browsed without a connected server |
| FR-F2-002 | The catalog contains at least 15 curated self-hostable applications at initial release, each with a description, category, resource requirements, and a link to the upstream open-source project. | Functional | Must | - Count verified before launch (SC3)<br>- Each entry includes: name, short description, category, minimum resource requirements, link to upstream project<br>- Community-facing transparency via upstream project link |
| FR-F2-003 | Selecting an app from the catalog presents a guided per-app configuration flow that asks only the questions relevant to that app with sensible defaults pre-filled. | Functional | Must | - Configuration form is app-specific (no generic "advanced settings" required for core deployment)<br>- At minimum, each app's config collects: deployment domain, admin email<br>- Defaults are pre-filled where safe to do so<br>- No Linux-specific terminology in the configuration form |
| FR-F2-004 | A user can initiate deployment from the configuration summary screen with a single action. | Functional | Must | - A "Deploy" button is present on the configuration summary step<br>- Before deployment begins, the user sees a summary of what will be configured<br>- Deployment begins immediately on confirmation without further prompts<br>- Satisfies SC1 (first app < 15 min) |
| FR-F2-005 | Deployment progress is displayed in real time with meaningful status messages. | Functional | Must | - Progress view shows distinct deployment phases (e.g., pulling image, configuring, provisioning SSL, starting container)<br>- Phase descriptions are non-technical and user-friendly<br>- User can navigate away; deployment continues in the background and dashboard reflects progress |
| FR-F2-006 | SSL certificates are automatically provisioned for the app's domain during deployment without user intervention. | Functional | Must | - Certificate is issued and bound to the app domain during the deployment flow<br>- No manual certificate upload is required for standard deployments<br>- Certificate issuance failure is reported clearly to the user<br>- O2: automated maintenance |
| FR-F2-007 | Reverse proxy routing is automatically configured for the deployed app, including integration with any existing proxy configuration on the server. | Functional | Must | - New app routing is created without requiring user knowledge of proxy configuration<br>- Existing apps' routing is not disrupted (UJ2)<br>- SC2: zero terminal steps |
| FR-F2-008 | After deployment, the system performs an automated health verification check and reports success or failure to the user. | Functional | Must | - Health check runs after deployment and reports status<br>- Success: app is accessible via its configured domain<br>- Failure: user is notified with a description of what failed (O6) |
| FR-F2-009 | If the post-deployment health check fails, the deployment is flagged in the dashboard and the user is given guided next steps. | Functional | Must | - Failed deployment is visually distinguished from a running app<br>- Dashboard shows the failure reason in user-friendly language<br>- Guided next steps are provided (e.g., check domain DNS propagation)<br>- O6: safe operations |
| FR-F2-010 | A successfully deployed application appears in the dashboard with its status indicator and a direct access link. | Functional | Must | - App tile is added to the dashboard immediately on successful deployment<br>- Access URL is displayed and clickable<br>- App status reflects post-deployment health check result |
| FR-F2-011 | Deploying a second or subsequent app to a server that already has apps running integrates the new app without disrupting existing routing or app availability. | Functional | Must | - Existing app availability is not interrupted during a second or subsequent deployment<br>- All existing access links remain valid<br>- UJ2 flow succeeds end-to-end |

**Business Rules — F2**

| ID | Rule | Condition | Action | Source |
|----|------|-----------|--------|--------|
| BR-F2-001 | Catalog entry transparency | App is added to the catalog | Must include link to the upstream open-source project | Product Vision — Out of Scope (not a registry) |
| BR-F2-002 | Deployment gate | Target server is not in a provisioned and healthy state | Deployment must not proceed; user must be prompted to resolve server health first | O6, R1 |
| BR-F2-003 | Domain validation | User enters a deployment domain | System validates domain format; warns (but does not block) if DNS does not yet resolve to the server IP | UJ1, R12 |
| BR-F2-004 | SSL certificate authority | SSL provision during deployment | System uses an automated certificate authority (such as Let's Encrypt) for default certificate issuance; no manual upload required for standard flow | O2, SC2 |

---

## Feature Area: F3 — Dashboard & Health Monitoring (PI-2)

> Provides ongoing operational visibility for the user's server and deployed applications. The primary surface for daily check-ins and alert response.
> **Vision alignment:** O5, UJ3, UJ4, SC7
> **PI-2 stories:** AB#207 (Dashboard Overview, 8 SP), AB#208 (Health Alerts, 8 SP), AB#209 (Alert Remediation, 5 SP)
> **PI-2 objectives:** PI2-O4, PI2-O5
> **Risk references:** R15 (health monitoring latency), R17 (alert pipeline), R21 (monitoring agent privileges)

| ID | Requirement | Type | Priority | Acceptance Criteria |
|----|-------------|------|----------|---------------------|
| FR-F3-001 | The dashboard displays a real-time resource utilization overview for each connected server (CPU, RAM, disk, network). | Functional | Must | - CPU, RAM, disk, and outbound network metrics are displayed per server<br>- Metrics update at a frequency sufficient to detect developing problems (≤ 60-second refresh)<br>- Units and percentage utilization are clearly labeled |
| FR-F3-002 | Each deployed application is represented on the dashboard with a health status indicator. | Functional | Must | - Status reflects at minimum: running, stopped, unhealthy, updating<br>- Status indicators are visually distinct and unambiguous<br>- Status is accurate to within the monitoring refresh interval |
| FR-F3-003 | The dashboard provides a direct access link to each deployed application. | Functional | Must | - Each app tile contains a link to the app's configured domain<br>- The link is only shown if the app is in a running state |
| FR-F3-004 | The system sends an email notification to the account holder when a deployed app becomes unavailable or when server resource utilization reaches a critical threshold. | Functional | Must | - Email is sent when an app transitions to stopped or unhealthy state<br>- Email is sent when CPU > 90%, RAM > 90%, or disk > 85% of capacity<br>- Notification thresholds are applied consistently<br>- Notifications are not sent if the user has disabled email alerts in account settings |
| FR-F3-005 | When a disk-utilization alert is active, the dashboard displays a per-app breakdown of disk consumption and provides guided remediation suggestions. | Functional | Must | - Per-app disk usage is visible on the alert detail view<br>- System suggests at minimum one actionable step (UJ4: guided remediation)<br>- SC4: alert-to-resolution flow resolves known alert types < 10 min |
| FR-F3-006 | Health alert notifications are delivered within 5 minutes of the alert condition being detected. | Functional | Must | - SC7: ≥ 99.5% accuracy<br>- Monitoring agent checks occur at intervals that support this SLA |
| FR-F3-007 | A user can acknowledge or dismiss an active alert from the dashboard. | Functional | Should | - Alert has an acknowledge/dismiss action accessible from the dashboard<br>- Acknowledged alerts are visually distinct from new alerts<br>- Dismissed alerts do not re-trigger unless the condition reoccurs |
| FR-F3-008 | Alert-to-remediation flows provide step-by-step guidance for known alert types (disk full, app unavailable, resource critical). | Functional | Should | - Each known alert type has a defined guided remediation path<br>- Guidance uses non-technical language<br>- UJ4: alert-to-resolution < 10 minutes for guided issues (SC4 proxy) |

**Business Rules — F3**

| ID | Rule | Condition | Action | Source |
|----|------|-----------|--------|--------|
| BR-F3-001 | Monitoring accuracy | Health status displayed in dashboard | Must reflect actual server state with ≥ 99.5% accuracy measured over any 24-hour period | SC7 |
| BR-F3-002 | Alert notification suppression | User has disabled email alert notifications | No email alerts are sent; dashboard alerts still display | FR-F4-005 |
| BR-F3-003 | Data residency of metrics | Server metrics collected by monitoring agent | Metrics may be transmitted to the UnplugHQ control plane for display, but raw application data must never be transmitted or stored on UnplugHQ infrastructure | SC5, BR-Global-001 |

---

## PI-2 Detailed Requirements — Implementation Specifics

> The following requirements refine and extend the F2 and F3 baseline requirements above with PI-2 implementation-level detail. These are derived from the PI-2 objectives, risk register, API contracts, and sprint backlog. IDs follow the pattern `FR-F{n}-1xx` to distinguish them from PI-1 baseline requirements.

### F2 — App Template Data Model (AB#202, PI2-O1)

| ID | Requirement | Type | Priority | Acceptance Criteria |
|----|-------------|------|----------|---------------------|
| FR-F2-101 | Each catalog entry is defined by a declarative App Template that specifies container image (pinned by digest), configurable parameters, resource requirements, port mappings, volume mounts, environment variables, and health check configuration. | Functional | Must | - App Template schema is validated by Zod against `CatalogApp` contract<br>- Image reference uses `sha256:` digest, not mutable tags (R20 mitigation)<br>- Template includes `configSchema` array defining per-app configuration fields<br>- Template is version-controlled and supports schema evolution |
| FR-F2-102 | The catalog browsing UI supports filtering by category and searching by app name or description. | Functional | Must | - Filter by ≥4 categories (PI2-O1)<br>- Search is case-insensitive substring match<br>- Catalog loads in <2 seconds (PI2-O1 criterion)<br>- Empty-state message when no results match filter/search |
| FR-F2-103 | Each catalog entry displays a detail page showing: app description, category, minimum resource requirements, upstream project link, version, and a visual preview or icon. | Functional | Must | - Detail page accessible via `app.catalog.get` tRPC query<br>- Resource requirements shown in human-friendly units (GB, cores)<br>- Upstream link opens in new tab<br>- No technical jargon in description text |
| FR-F2-104 | The system validates that the target server has sufficient available resources (CPU, RAM, disk) to host the selected app before allowing deployment to proceed. | Functional | Must | - Pre-deployment resource check compares app template `minCpuCores`, `minRamGb`, `minDiskGb` against latest server metrics<br>- Insufficient resources produces a clear warning naming the bottleneck<br>- User may override with acknowledgment (soft limit, not hard block)<br>- R16 mitigation: prevents blind overcommitment |
| FR-F2-105 | App templates define default Docker network isolation settings; each deployed app container joins a managed Docker network (`unplughq`) and does not expose ports directly to the host. | Functional | Must | - Containers are connected to the `unplughq` Docker network<br>- No `--publish` / `-p` flags used; traffic routed exclusively through reverse proxy<br>- Inter-container communication is limited to explicitly declared dependencies in app template<br>- R20 mitigation: network segmentation |

### F2 — Guided Configuration Flow (AB#203, PI2-O2)

| ID | Requirement | Type | Priority | Acceptance Criteria |
|----|-------------|------|----------|---------------------|
| FR-F2-106 | The guided configuration form is dynamically generated from the app template's `configSchema` — no hardcoded per-app UI. | Functional | Must | - Form fields, labels, types, defaults, and validation rules are driven by `configSchema`<br>- Adding a new app to the catalog does not require UI code changes<br>- R13 mitigation: extensible without per-app special cases |
| FR-F2-107 | Configuration fields use non-technical labels and provide contextual help text explaining what each setting does in plain language. | Functional | Must | - Labels do not reference Docker, containers, ports, or volumes<br>- Help text visible on hover/focus or inline below each field<br>- Verified by content strategist review at P2 |
| FR-F2-108 | The configuration summary screen shows all user-selected values organized by logical group, with an edit action to return to any field before confirming deployment. | Functional | Must | - All configured values are displayed clearly before "Deploy" action<br>- User can navigate back to edit any value without losing other entries<br>- ≤5 configuration steps total (PI2-O2 criterion) |
| FR-F2-109 | If the user has multiple connected servers, the configuration flow includes a server selection step; if only one server is connected, it is auto-selected. | Functional | Must | - Server picker shown only when `server.list` returns >1 result<br>- Auto-selected server name shown in configuration summary for confirmation<br>- Matches PM-2 flow logic |

### F2 — Deployment with Progress Tracking (AB#204, PI2-O2)

| ID | Requirement | Type | Priority | Acceptance Criteria |
|----|-------------|------|----------|---------------------|
| FR-F2-110 | Deployment is executed as a BullMQ background job with an idempotent state machine that tracks discrete phases: pending → pulling → configuring → provisioning-ssl → starting → running (or failed). | Functional | Must | - Each deployment has a persistent `DeploymentStatus` tracked in the database<br>- State transitions are atomic and logged<br>- Job is resumable from the last completed phase on failure (R14 mitigation)<br>- Matches `DeploymentStatus` enum from API contracts |
| FR-F2-111 | Deployment progress is pushed to the browser in real time via SSE (`deployment.progress` event) showing the current phase and a user-friendly phase description. | Functional | Must | - Browser receives phase updates within 2 seconds of server-side state change<br>- Phase descriptions use plain language (e.g., "Downloading your app" not "pulling image")<br>- Progress view accessible at a stable URL that can be revisited<br>- Matches SSE event schema from API contracts |
| FR-F2-112 | If a deployment fails at any phase, the system performs cleanup of partially deployed resources (container, environment files, Caddy route) and sets the deployment to `failed` status. | Functional | Must | - No orphaned containers remain after a failed deployment<br>- Caddy configuration is not left in an inconsistent state<br>- Failed deployment is flagged in dashboard per FR-F2-009<br>- R14 mitigation: explicit rollback per step |
| FR-F2-113 | Deployment creates an environment file on the VPS via SFTP (not inline SSH), populates it from app template defaults and user configuration, and references it in the container `--env-file` flag. | Functional | Must | - Environment variables are never passed as inline CLI arguments (command injection prevention)<br>- Environment file is written to a predictable path with restricted permissions (600)<br>- Matches Docker socket access protocol from API contracts §3.1 |
| FR-F2-114 | Deployment validates that the configured domain resolves to the target server's IP address; if DNS is not yet propagated, the system warns the user but allows deployment to proceed. | Functional | Should | - DNS check queries the configured domain for A/AAAA record match<br>- Mismatch produces a warning (not a blocker) per BR-F2-003<br>- Warning text explains DNS propagation and links to guidance |

### F2 — Post-Deployment Verification (AB#205, PI2-O2)

| ID | Requirement | Type | Priority | Acceptance Criteria |
|----|-------------|------|----------|---------------------|
| FR-F2-115 | After the container starts, the system runs a health check by issuing an HTTP GET request to the app's configured domain and verifying a 2xx response within 60 seconds. | Functional | Must | - Health check retries up to 3 times with exponential backoff<br>- Timeout per attempt: 20 seconds<br>- Success: deployment transitions to `running`<br>- Failure after all retries: deployment transitions to `failed`, fires `HEALTH_CHECK_FAILED` error |
| FR-F2-116 | The post-deployment verification result is surfaced to the user in the deployment progress view and as a dashboard status update. | Functional | Must | - Success: access URL is displayed as a clickable link<br>- Failure: failure reason shown in user-friendly language with guided next steps<br>- Dashboard tile reflects the verification result (running vs. failed) |
| FR-F2-117 | The deployed app's access URL follows the pattern `https://{user-configured-domain}` and is stored as the `accessUrl` field on the deployment record. | Functional | Must | - URL is always HTTPS (SSL provisioned during deployment)<br>- URL is clickable from the dashboard and opens the deployed app in a new tab<br>- URL persists across browser sessions |

### F2 — Multi-App Coexistence (AB#206, PI2-O3)

| ID | Requirement | Type | Priority | Acceptance Criteria |
|----|-------------|------|----------|---------------------|
| FR-F2-118 | Multiple apps can be deployed to the same server without port conflicts; all inter-app isolation is enforced by the Docker network and reverse proxy routing. | Functional | Must | - ≥3 apps deployed simultaneously on one server (PI2-O3)<br>- No port collisions: apps do not bind host ports<br>- Each app is addressable only by its domain through the reverse proxy<br>- R16, R18 mitigation |
| FR-F2-119 | Per-app resource usage (CPU, RAM, disk consumed by each container) is tracked and displayed on the dashboard. | Functional | Must | - Per-container disk usage reported via monitoring agent `containers` array<br>- Dashboard shows resource breakdown per app<br>- Aggregate usage clearly visible (R16 mitigation: user can see contention) |
| FR-F2-120 | The system alerts when aggregate server resource usage exceeds 80% of capacity (CPU, RAM, or disk). | Functional | Must | - 80% threshold triggers an informational alert (distinct from critical 90% threshold)<br>- Alert message names which resource is approaching capacity<br>- Guidance suggests reviewing per-app usage or upgrading server |
| FR-F2-121 | Caddy reverse proxy configuration is generated programmatically from the list of deployed apps; adding or removing an app regenerates only the affected route without disrupting other apps' routing. | Functional | Must | - Route operations use Caddy Admin API with `@id` matching per API contracts §3.4<br>- Existing routes are not modified during add/remove of a different app<br>- Health of all existing apps is verified after a route change (PM-2 flow) |
| FR-F2-122 | Volume mounts for each app are isolated; no two apps share the same volume path unless explicitly declared as a shared dependency in the app template. | Functional | Must | - Each app's data volume is mounted at a unique path on the VPS<br>- No implicit volume sharing between containers<br>- Volume paths follow convention: `/opt/unplughq/data/{containerName}/` |

### F3 — Health Check Pipeline (AB#207, AB#208, PI2-O4, PI2-O5)

| ID | Requirement | Type | Priority | Acceptance Criteria |
|----|-------------|------|----------|---------------------|
| FR-F3-101 | The monitoring agent on the user's VPS collects metrics (CPU, RAM, disk, network, per-container status) every 30 seconds and pushes them to the control plane via HTTPS POST. | Functional | Must | - Payload matches `MetricsSnapshot` Zod schema in strict mode<br>- Agent authenticates with per-server API token<br>- Rate limited to 2 requests per 60 seconds per server<br>- R15, R21 mitigation: agent runs with minimal privileges |
| FR-F3-102 | The control plane evaluates incoming metrics against configurable alert thresholds and generates alerts when thresholds are breached. | Functional | Must | - Default thresholds: CPU >90% for 5 min sustained, RAM >90%, disk >85%<br>- App-unavailable alert when container status is not `running` for >60 seconds<br>- Thresholds are configurable per server in future iterations (P3); PI-2 uses fixed defaults<br>- R17 mitigation: failure in threshold evaluation does not silently swallow metrics |
| FR-F3-103 | When a metric is stale (no push received for >120 seconds), the dashboard displays an explicit "Data stale" indicator rather than showing the last known values as current. | Functional | Must | - Stale data is never silently displayed as current (R15 mitigation)<br>- "Data stale" badge with timestamp of last received metric<br>- If stale >5 minutes: `server-unreachable` alert generated |
| FR-F3-104 | The dashboard receives live metric and alert updates via SSE connection, gracefully degrading to polling if SSE is unavailable. | Functional | Must | - SSE connection per API contracts §3.3 (heartbeat every 30s)<br>- If SSE disconnects, client falls back to polling `monitor.dashboard` every 60 seconds<br>- Reconnection attempt on SSE drop with exponential backoff<br>- Data freshness indicator reflects the delivery mechanism |
| FR-F3-105 | The dashboard overview page displays server resource gauges (CPU, RAM, disk as percentage bars) and a list of deployed app tiles with health status badges. | Functional | Must | - Resource gauges update in real time via SSE<br>- Color coding: green (<70%), amber (70-89%), red (≥90%)<br>- App tiles show: app name, domain, status badge (running/stopped/unhealthy/updating), access link<br>- PI2-O4: dashboard loads <3 seconds |

### F3 — Alert Email Notifications (AB#208, PI2-O5)

| ID | Requirement | Type | Priority | Acceptance Criteria |
|----|-------------|------|----------|---------------------|
| FR-F3-106 | When an alert is generated and the user has email notifications enabled, the system sends an email containing: alert type, severity, affected server/app, threshold value, current value, and a link to the dashboard. | Functional | Must | - Email sent within 5 minutes of alert detection (FR-F3-006)<br>- Email includes remediation guidance for known alert types<br>- Dashboard link deep-links to the affected server/app<br>- R17 mitigation: failed email dispatch is retried via dead-letter queue |
| FR-F3-107 | The email delivery pipeline shares the existing email service infrastructure used for password reset, with a unified email abstraction. | Functional | Must | - Single email service handles auth emails and alert emails<br>- Email templates are distinct per type (alert vs. auth) but use shared transport<br>- PI-2 cross-PI dependency: extends PI-1 email integration |
| FR-F3-108 | Alert emails include an unsubscribe link that directs to the user's notification preferences in account settings. | Functional | Should | - Unsubscribe link navigates to settings page (FR-F4-005)<br>- Toggling notifications off immediately suppresses future alert emails (BR-F3-002) |
| FR-F3-109 | The system tracks alert notification delivery status (sent, failed, retried) as part of the alert record. | Functional | Should | - `notificationSent` boolean on alert record per API contracts<br>- Failed email delivery triggers retry up to 3 times with backoff<br>- Permanently failed dispatch logged for diagnostics |

### F3 — Alert Management UI (AB#208, AB#209, PI2-O5)

| ID | Requirement | Type | Priority | Acceptance Criteria |
|----|-------------|------|----------|---------------------|
| FR-F3-110 | The dashboard displays a list of active alerts with severity, type, affected resource, and timestamp. | Functional | Must | - Alert list sorted by severity (critical first), then by timestamp (newest first)<br>- Severity badges use distinct colors (critical: red, warning: amber, info: blue)<br>- Empty state when no active alerts communicates "Everything is healthy" |
| FR-F3-111 | Clicking an alert expands an alert detail view showing the full context: current metric values, threshold that triggered the alert, affected server/app, and available remediation actions. | Functional | Must | - Detail view loads without page navigation (expandable panel or side sheet)<br>- Metric values are shown with units and comparison to threshold<br>- Remediation actions are presented as clickable guided flows |
| FR-F3-112 | A user can dismiss an alert from the alert list; dismissed alerts do not re-trigger unless the underlying condition clears and then reoccurs. | Functional | Should | - Dismiss action calls `monitor.alerts.dismiss` mutation<br>- Dismissed alert moves to a "Recent" section with faded visual treatment<br>- Same condition re-triggering after resolution creates a new alert<br>- Matches FR-F3-007 acceptance criteria |

### F3 — Guided Remediation (AB#209, PI2-O5)

| ID | Requirement | Type | Priority | Acceptance Criteria |
|----|-------------|------|----------|---------------------|
| FR-F3-113 | For each known alert type, the system provides a guided remediation flow with step-by-step instructions in non-technical language. | Functional | Should | - Known alert types with remediation: `disk-critical`, `app-unavailable`, `cpu-critical`, `ram-critical`<br>- Each flow has ≥1 actionable step the user can take from the dashboard<br>- UJ4: alert-to-resolution <10 minutes for guided issues |
| FR-F3-114 | For `app-unavailable` alerts, the remediation flow offers a one-click "Restart App" action that attempts to restart the stopped container. | Functional | Should | - Restart action calls `app.deployment.start` mutation<br>- Post-restart health check runs automatically<br>- Success: alert auto-resolves, app status updates to `running`<br>- Failure: user informed with next-level guidance (view logs, contact support) |
| FR-F3-115 | For `disk-critical` alerts, the remediation flow displays per-app disk usage breakdown and suggests actionable steps (identify large apps, clean up, or expand storage). | Functional | Should | - Per-app disk usage from monitoring agent `containers[].diskUsageBytes`<br>- Suggestions are plain-language and actionable<br>- Matches FR-F3-005 acceptance criteria |
| FR-F3-116 | For `cpu-critical` and `ram-critical` alerts, the remediation flow shows per-app resource contribution and suggests stopping low-priority apps or upgrading the server. | Functional | Should | - Per-app breakdown visible<br>- Stop action available per app from the remediation view<br>- Server upgrade suggestion links to the user's VPS provider dashboard |

---

## PI-2 Cross-Cutting Requirements — Deferred Bug Fixes

> These requirements address deferred PI-1 security and accessibility bugs that must be resolved in PI-2. Per the PI-2 objectives (PI2-O6) and risk register (R19, score 25 — highest in register), these are Week 1 priority items.

| ID | Requirement | Type | Priority | AB# | Acceptance Criteria |
|----|-------------|------|----------|-----|---------------------|
| BF-001 | All state-changing tRPC mutations and Server Actions are protected by CSRF token validation. | Security | Must | AB#258 | - CSRF token is generated per session and validated on every mutation<br>- Token mismatch returns 403 FORBIDDEN<br>- Token is not exposed in URL parameters<br>- Full regression on F1 and F4 flows after fix |
| BF-002 | All user-provided string inputs used in SSH commands (server IP, SSH port, server name) are sanitized against injection patterns. | Security | Must | AB#259 | - Input validation rejects shell metacharacters, backticks, heredoc markers, and command substitution patterns<br>- Validation enforced at the Zod schema level before reaching the SSH service<br>- Existing `ServerConnectInput` schema hardened<br>- Parametrized command templates used exclusively (no string concatenation) |
| BF-003 | SSH private keys and per-server API tokens are rotatable without server disconnection; rotation invalidates the previous credential. | Security | Must | AB#260 | - Rotation action available from server settings<br>- Old key/token is invalidated immediately on rotation<br>- Rotation does not interrupt running apps or active monitoring<br>- Rotation event logged in audit log |
| BF-004 | All privileged operations (server connect, disconnect, provisioning, app deploy, app remove, configuration change, credential rotation) are recorded in an audit log accessible from account settings. | Security | Must | AB#262 | - Audit log entries capture: action type, timestamp, user ID, target server/app, outcome (success/failure)<br>- Log accessible via `user.auditLog` tRPC query<br>- Retained for minimum 90 days (NFR-013)<br>- New F2/F3 operations include audit calls from the start |
| BF-005 | Route transitions within the single-page application manage focus correctly, moving focus to the main content region after navigation. | Accessibility | Must | AB#251 | - On route change, focus moves to the `<main>` element or page heading<br>- Screen readers announce the new page context<br>- Focus trap in modals/dialogs does not persist after modal close<br>- Verified by automated WCAG 2.1 AA audit |

**Business Rules — Cross-Cutting Bug Fixes**

| ID | Rule | Condition | Action | Source |
|----|------|-----------|--------|--------|
| BR-BF-001 | Bug-first sequencing | PI-2 P4 development begins | Resolve BF-001 through BF-004 before any new F2/F3 code that exercises affected paths | R19, PI2-O6 |
| BR-BF-002 | Regression verification | Any deferred bug fix is merged | Full existing test suite must pass; targeted regression tests added for each fix | R19 |
| BR-BF-003 | Audit logging integration | Any new F2/F3 operation with side effects is implemented | Must include audit log write at implementation time, not retrofitted | BF-004, NFR-013 |

---

## Non-Functional Requirements

| ID | Requirement | Type | Priority | Acceptance Criteria |
|----|-------------|------|----------|---------------------|
| NFR-001 | The platform achieves zero-terminal operation for all core user journeys (UJ1–UJ5). | Usability | Must | - UX audit confirms zero CLI commands required for any step in UJ1–UJ5 (SC2)<br>- Verified by walkthrough audit before beta release |
| NFR-002 | First-app deployment time from sign-up to a running application is under 15 minutes under normal network conditions. | Performance | Must | - SC1 measured via timed user journey analytics<br>- Benchmark: 10 Mbps connection, no DNS propagation delay |
| NFR-003 | All user-facing interfaces comply with WCAG 2.1 Level AA. | Accessibility | Must | - WCAG 2.1 AA audit passes for all core screens before beta release<br>- No critical or serious accessibility violations in automated audit |
| NFR-004 | No user application data is stored on UnplugHQ infrastructure at any time. | Data Sovereignty | Must | - SC5: architecture audit confirms control-plane-only data model<br>- All user application data resides exclusively on the user's own server<br>- Data flow diagrams reviewed by Security Analyst confirm compliance |
| NFR-005 | Users must be able to disconnect from UnplugHQ and continue running their self-hosted applications without any dependency on UnplugHQ infrastructure. | Vendor Independence | Must | - SC6: tested disconnection flow confirms apps remain operational post-disconnect<br>- Configuration export produces standard formats (Docker Compose, reverse proxy config) usable without UnplugHQ |
| NFR-006 | All destructive operations (application removal, configuration changes with data loss risk, server disconnection) require explicit user confirmation and present a preview of the action before execution. | Safety | Must | - O6: no destructive action executes without a confirmation screen<br>- Confirmation screens use clear, plain-language descriptions |
| NFR-007 | Health status reporting achieves ≥ 99.5% accuracy. | Reliability | Must | - SC7: false-negative rate for 5-minute detection windows ≤ 0.5%<br>- Verified by alert accuracy metrics in telemetry |
| NFR-008 | The control panel is responsive and usable on desktop and mobile-viewport browsers (mobile-first responsive web design). | Usability | Must | - Usable at viewport widths from 375 px upward<br>- No content overflow or critical feature loss on mobile viewport<br>- Mobile-first responsive layout (CSS breakpoint strategy with small viewport as base) |
| NFR-009 | User account data is processed in compliance with GDPR for users in the EU/EEA. | Legal/Privacy | Must | - Privacy policy is linked at sign-up<br>- Data processing disclosure is presented and acknowledged at account creation<br>- Users can request account deletion with confirmation of data removal |
| NFR-010 | SSH credentials and private key material are never stored in plaintext on UnplugHQ infrastructure. | Security | Must | - If SSH private keys are retained for ongoing management, they are encrypted at rest using a modern algorithm<br>- Verified by Security Analyst review and architecture audit |
| NFR-011 | Control panel page load time is under 3 seconds for authenticated views on a 10 Mbps connection. API responses to dashboard state queries are under 2 seconds at p95. | Performance | Should | - Measured via synthetic monitoring<br>- Does not apply to deployment progress screens (streaming data) |
| NFR-012 | Session tokens are invalidated immediately on logout and expire after a configurable inactivity period. | Security | Must | - No valid session exists on UnplugHQ servers after a user logs out<br>- Inactivity expiry is enforced server-side |
| NFR-013 | All provisioning, deployment, and configuration-change actions are logged per user account with sufficient detail for audit purposes. | Auditability | Should | - Audit log captures: action, timestamp, user, target server/app, outcome<br>- Log is accessible from the user's account settings view<br>- Retained for a minimum of 90 days |
| NFR-014 | The platform accommodates users on variable internet speeds and server locations globally; no performance assumption of high-bandwidth connections is made in the system design. | Accessibility/Performance | Should | - Deployment and provisioning flows function correctly with 5+ second SSH round-trip latency<br>- Control panel avoids large synchronous payloads on initial load |
| NFR-015 | The deployment state machine is idempotent — a failed deployment can be retried or cleaned up without leaving orphaned resources on the target server. | Reliability | Must | - Retrying a failed deployment does not create duplicate containers, volumes, or Caddy routes<br>- Cleanup removes all resources created by the failed attempt<br>- R14 mitigation |
| NFR-016 | The monitoring agent pushes metrics over HTTPS with per-server API token authentication; the control plane validates payloads in strict mode rejecting extra fields. | Security | Must | - Agent auth tokens issued during provisioning, bound to server ID<br>- Strict Zod parse rejects payloads with unexpected fields (data sovereignty)<br>- API contracts §3.2 compliance |
| NFR-017 | Dashboard SSE connections include keepalive heartbeats every 30 seconds; client gracefully degrades to polling if SSE is unavailable. | Reliability | Must | - Heartbeat keeps connection alive across proxies and load balancers<br>- Polling fallback interval: 60 seconds<br>- Reconnection with exponential backoff on SSE drop |
| NFR-018 | Docker container images in the app catalog reference pinned digests (`sha256:...`), not mutable tags (`latest`, version strings). | Security | Must | - All `CatalogApp` entries use `imageDigest` field matching `sha256:[a-f0-9]{64}`<br>- R20 mitigation: supply chain integrity<br>- Catalog update process re-pins digests on upstream version updates |
| NFR-019 | App containers are isolated on a managed Docker network; no container exposes ports directly to the host interface. | Security | Must | - All containers join the `unplughq` Docker network<br>- Traffic routes exclusively through the reverse proxy<br>- Validated by security analyst at P5 |
| NFR-020 | Alert email delivery failures are retried via a dead-letter queue with a maximum of 3 retry attempts. | Reliability | Must | - Failed email dispatches are not silently dropped<br>- Dead-letter queue tracks retry count and last failure reason<br>- R17 mitigation: alert pipeline reliability |

---

## Global Business Rules

| ID | Rule | Condition | Action | Source |
|----|------|-----------|--------|--------|
| BR-Global-001 | Data sovereignty | Any system component processing or persisting data | User application data must never be stored or transmitted to UnplugHQ infrastructure; only control-plane metadata (status, configuration references, timestamps) may be retained | SC5, Product Vision Constraints |
| BR-Global-002 | No vendor lock-in | Platform architecture and app deployment | Apps must be deployable in standard formats (Docker) without UnplugHQ; export of configuration must be possible at any time | SC6, UJ5 |
| BR-Global-003 | Destructive action confirmation | Any action that deletes, overwrites, or disrupts a running application or server configuration | Must present a preview and require explicit user confirmation before execution | O6 |
| BR-Global-004 | Unsupported environment signaling | Server compatibility check result | System must display a clear, non-technical explanation of unsupported states; must not proceed with provisioning or deployment on unsupported servers | BR-F1-001 |
| BR-Global-005 | Image provenance | App added to curated catalog | Docker image must reference a trusted source (official image or verified publisher) with digest pinning; mutable tags prohibited | R20, NFR-018 |
| BR-Global-006 | Audit logging completeness | Any server or app lifecycle operation | Operation must be recorded in audit log with action, timestamp, user, target, and outcome; new F2/F3 operations must include audit calls at implementation time | BF-004, NFR-013 |
| BR-Global-007 | Resource pre-check | User initiates app deployment | System must compare app resource requirements against current server availability; warn on insufficient resources before deployment begins | FR-F2-104, R16 |

---

## Requirements Traceability Matrix

| Requirement ID | Description Summary | Feature | Outcome | User Journey | Success Criterion |
|----------------|--------------------|---------|---------|--------------|--------------------|
| FR-F4-001 | Account sign-up | F4 | O1 | UJ1 | SC2 |
| FR-F4-002 | User login | F4 | O1 | UJ1 | SC2 |
| FR-F4-003 | Logout | F4 | O1 | — | SC2 |
| FR-F4-004 | Password reset | F4 | O1 | — | SC2 |
| FR-F4-005 | Account settings | F4 | O2, O5 | — | SC2 |
| FR-F4-006 | Session expiry | F4 | O6 | — | — |
| FR-F4-007 | Zero-terminal auth | F4 | O1 | UJ1 | SC2 |
| FR-F1-001 | Guided VPS connection entry | F1 | O1, O3 | UJ1 | SC1, SC2 |
| FR-F1-002 | Provider-specific SSH instructions | F1 | O3 | UJ1 | SC2 |
| FR-F1-003 | SSH connectivity validation | F1 | O1, O3 | UJ1 | SC1 |
| FR-F1-004 | OS and resource detection | F1 | O3 | UJ1 | — |
| FR-F1-005 | Compatibility signaling | F1 | O3, O6 | UJ1 | SC2 |
| FR-F1-006 | Automated base provisioning | F1 | O1, O3 | UJ1 | SC1, SC2 |
| FR-F1-007 | Server dashboard tile | F1 | O5 | UJ1 | SC7 |
| FR-F1-008 | Server naming | F1 | — | — | — |
| FR-F1-009 | Provisioning failure handling | F1 | O6 | UJ1 | SC2 |
| FR-F2-001 | App catalog browsing | F2 | O4 | UJ1, UJ2 | SC3 |
| FR-F2-002 | 15+ apps in catalog | F2 | O4 | UJ1 | SC3 |
| FR-F2-003 | Per-app guided config | F2 | O1, O4 | UJ1 | SC2 |
| FR-F2-004 | Single-action deploy | F2 | O1, O4 | UJ1 | SC1 |
| FR-F2-005 | Deployment progress display | F2 | O4, O5 | UJ1 | SC1 |
| FR-F2-006 | Auto SSL provisioning | F2 | O1, O2 | UJ1 | SC2 |
| FR-F2-007 | Auto reverse proxy config | F2 | O1, O2 | UJ1, UJ2 | SC2 |
| FR-F2-008 | Post-deploy health check | F2 | O4, O6 | UJ1 | SC4 |
| FR-F2-009 | Failed deploy handling | F2 | O6 | UJ1 | SC4 |
| FR-F2-010 | App dashboard tile + access link | F2 | O4, O5 | UJ1 | — |
| FR-F2-011 | Non-disruptive second-app deploy | F2 | O4 | UJ2 | SC2 |
| FR-F2-101 | App template data model | F2 | O4 | UJ1, UJ2 | SC3 |
| FR-F2-102 | Catalog search and filter | F2 | O4 | UJ1, UJ2 | SC3 |
| FR-F2-103 | Catalog detail page | F2 | O4 | UJ1 | SC3 |
| FR-F2-104 | Pre-deploy resource validation | F2 | O4, O6 | UJ1, UJ2 | SC1 |
| FR-F2-105 | Docker network isolation | F2 | O6 | UJ1, UJ2 | — |
| FR-F2-106 | Dynamic config form from schema | F2 | O1, O4 | UJ1 | SC2 |
| FR-F2-107 | Non-technical config labels | F2 | O1 | UJ1 | SC2 |
| FR-F2-108 | Config summary with edit-back | F2 | O1, O4 | UJ1 | SC1 |
| FR-F2-109 | Multi-server selection flow | F2 | O4 | UJ2 | — |
| FR-F2-110 | Deployment state machine (BullMQ) | F2 | O4 | UJ1 | SC1 |
| FR-F2-111 | Real-time SSE progress | F2 | O4, O5 | UJ1 | SC1 |
| FR-F2-112 | Failed deploy cleanup | F2 | O6 | UJ1 | — |
| FR-F2-113 | SFTP env file deploy | F2 | O6 | UJ1 | — |
| FR-F2-114 | DNS pre-check warning | F2 | O4 | UJ1 | — |
| FR-F2-115 | Post-deploy HTTP health check | F2 | O4, O6 | UJ1 | SC4 |
| FR-F2-116 | Verification result surfacing | F2 | O4, O5 | UJ1 | — |
| FR-F2-117 | Access URL persistence | F2 | O4 | UJ1 | — |
| FR-F2-118 | Multi-app port isolation | F2 | O4 | UJ2 | SC2 |
| FR-F2-119 | Per-app resource tracking | F2 | O5 | UJ4 | SC7 |
| FR-F2-120 | 80% resource warning alert | F2 | O5 | UJ4 | — |
| FR-F2-121 | Caddy route generation | F2 | O4 | UJ2 | SC2 |
| FR-F2-122 | Volume mount isolation | F2 | O6 | UJ2 | — |
| FR-F3-001 | Server resource overview | F3 | O5 | UJ4 | SC7 |
| FR-F3-002 | Per-app status indicators | F3 | O5 | UJ3, UJ4 | SC7 |
| FR-F3-003 | App access links on dashboard | F3 | O4, O5 | UJ1 | — |
| FR-F3-004 | Email alert notifications | F3 | O5 | UJ4 | SC7 |
| FR-F3-005 | Disk usage breakdown + remediation | F3 | O5 | UJ4 | SC4 |
| FR-F3-006 | Alert delivery within 5 minutes | F3 | O5 | UJ4 | SC7 |
| FR-F3-007 | Alert acknowledge/dismiss | F3 | O5 | UJ4 | — |
| FR-F3-008 | Alert-to-remediation guided flows | F3 | O5, O6 | UJ4 | SC4 |
| FR-F3-101 | Monitoring agent metrics push | F3 | O5 | UJ4 | SC7 |
| FR-F3-102 | Alert threshold evaluation | F3 | O5 | UJ4 | SC7 |
| FR-F3-103 | Stale data indicator | F3 | O5 | UJ4 | SC7 |
| FR-F3-104 | SSE with polling fallback | F3 | O5 | UJ4 | SC7 |
| FR-F3-105 | Dashboard resource gauges + app tiles | F3 | O5 | UJ4 | SC7 |
| FR-F3-106 | Alert email content and delivery | F3 | O5 | UJ4 | SC7 |
| FR-F3-107 | Shared email service | F3 | O5 | UJ4 | — |
| FR-F3-108 | Alert email unsubscribe | F3 | O5 | UJ4 | — |
| FR-F3-109 | Alert notification tracking | F3 | O5 | UJ4 | — |
| FR-F3-110 | Active alert list | F3 | O5 | UJ4 | SC7 |
| FR-F3-111 | Alert detail view | F3 | O5 | UJ4 | — |
| FR-F3-112 | Alert dismiss with re-trigger | F3 | O5 | UJ4 | — |
| FR-F3-113 | Guided remediation per alert type | F3 | O5, O6 | UJ4 | SC4 |
| FR-F3-114 | One-click app restart | F3 | O5, O6 | UJ4 | SC4 |
| FR-F3-115 | Disk breakdown remediation | F3 | O5 | UJ4 | SC4 |
| FR-F3-116 | CPU/RAM remediation | F3 | O5 | UJ4 | SC4 |
| BF-001 | CSRF token validation | Cross-cut | O6 | All | — |
| BF-002 | SSH input sanitization | Cross-cut | O6 | UJ1 | — |
| BF-003 | Secrets rotation | Cross-cut | O6 | — | SC5 |
| BF-004 | Audit logging | Cross-cut | O6 | All | — |
| BF-005 | Focus management | Cross-cut | — | All | — |
| NFR-001 | Zero-terminal operation | All | O1 | UJ1–UJ5 | SC2 |
| NFR-002 | < 15 min first-app deployment | All | O1 | UJ1 | SC1 |
| NFR-003 | WCAG 2.1 AA | All | — | All | — |
| NFR-004 | No user data on UnplugHQ servers | All | — | All | SC5 |
| NFR-005 | Vendor independence / export | All | — | UJ5 | SC6 |
| NFR-006 | Destructive op confirmation | All | O6 | All | — |
| NFR-007 | ≥ 99.5% health accuracy | F3 | O5 | UJ4 | SC7 |
| NFR-008 | Mobile-first responsive | All | — | All | — |
| NFR-009 | GDPR compliance | F4 | — | UJ1 | — |
| NFR-010 | SSH credentials encryption | F1 | — | UJ1 | SC5 |
| NFR-011 | Page load performance | All | — | All | — |
| NFR-012 | Session token security | F4 | — | All | — |
| NFR-013 | Audit log | All | — | All | — |
| NFR-014 | Global performance tolerance | All | — | All | — |
| NFR-015 | Idempotent deployment state machine | F2 | O6 | UJ1 | — |
| NFR-016 | Agent metrics auth + strict parse | F3 | O5 | UJ4 | SC5 |
| NFR-017 | SSE keepalive + polling fallback | F3 | O5 | UJ4 | SC7 |
| NFR-018 | Pinned image digests | F2 | O6 | UJ1 | — |
| NFR-019 | Docker network isolation | F2 | O6 | UJ1, UJ2 | — |
| NFR-020 | Alert email retry (DLQ) | F3 | O5 | UJ4 | SC7 |

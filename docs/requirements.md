---
artifact: requirements
produced-by: business-analyst
project-slug: unplughq
work-item: epic-001-unplughq-platform
work-item-type: epic
workflow-tier: full
phase: P1
version: 1.0.0
status: approved
azure-devops-id: 173
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

This document establishes the full requirements set for the UnplugHQ platform, derived from the Product Vision, Feature Roadmap, PI Objectives, and Risk Register for epic-001-unplughq-platform (AB#169).

Requirements are organized by the four PI-1 feature areas, followed by cross-cutting non-functional requirements. Every requirement is traceable to at least one Desired Outcome (O1–O6), User Journey (UJ1–UJ5), or Success Criterion (SC1–SC8) from the Product Vision.

**Vision reference:** [Product Vision](product-vision.md)

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

## Feature Area: F4 — User Identity & Access

> Foundational capability enabling secure account creation, authentication, and session management. Parallel delivery with F1.
> **Vision alignment:** O1 (zero-terminal access to account), SC2 (no CLI required for any core flow)

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

## Feature Area: F1 — Server Connection & Provisioning

> Enables a user to connect a VPS to UnplugHQ and have it automatically prepared as a managed host. This is the foundational capability for all deployment features.
> **Vision alignment:** O1, O3, UJ1, SC1, SC2

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

## Feature Area: F2 — Application Catalog & Deployment

> Enables users to browse a curated set of self-hostable applications and deploy them to their server through a guided, zero-terminal flow.
> **Vision alignment:** O1, O4, UJ1, UJ2, SC1, SC2, SC3

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

## Feature Area: F3 — Dashboard & Health Monitoring

> Provides ongoing operational visibility for the user's server and deployed applications. The primary surface for daily check-ins and alert response.
> **Vision alignment:** O5, UJ3, UJ4, SC7

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

---

## Global Business Rules

| ID | Rule | Condition | Action | Source |
|----|------|-----------|--------|--------|
| BR-Global-001 | Data sovereignty | Any system component processing or persisting data | User application data must never be stored or transmitted to UnplugHQ infrastructure; only control-plane metadata (status, configuration references, timestamps) may be retained | SC5, Product Vision Constraints |
| BR-Global-002 | No vendor lock-in | Platform architecture and app deployment | Apps must be deployable in standard formats (Docker) without UnplugHQ; export of configuration must be possible at any time | SC6, UJ5 |
| BR-Global-003 | Destructive action confirmation | Any action that deletes, overwrites, or disrupts a running application or server configuration | Must present a preview and require explicit user confirmation before execution | O6 |
| BR-Global-004 | Unsupported environment signaling | Server compatibility check result | System must display a clear, non-technical explanation of unsupported states; must not proceed with provisioning or deployment on unsupported servers | BR-F1-001 |

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
| FR-F3-001 | Server resource overview | F3 | O5 | UJ4 | SC7 |
| FR-F3-002 | Per-app status indicators | F3 | O5 | UJ3, UJ4 | SC7 |
| FR-F3-003 | App access links on dashboard | F3 | O4, O5 | UJ1 | — |
| FR-F3-004 | Email alert notifications | F3 | O5 | UJ4 | SC7 |
| FR-F3-005 | Disk usage breakdown + remediation | F3 | O5 | UJ4 | SC4 |
| FR-F3-006 | Alert delivery within 5 minutes | F3 | O5 | UJ4 | SC7 |
| FR-F3-007 | Alert acknowledge/dismiss | F3 | O5 | UJ4 | — |
| FR-F3-008 | Alert-to-remediation guided flows | F3 | O5, O6 | UJ4 | SC4 |
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

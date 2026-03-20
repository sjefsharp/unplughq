---
artifact: product-backlog
produced-by: product-owner
project-slug: unplughq
work-item: epic-001-unplughq-platform
work-item-type: epic
workflow-tier: full
phase: P3
version: 2.0.0
status: draft
azure-devops-id: 285
consumed-by:
  - scrum-master
  - tech-lead
  - frontend-developer
  - backend-developer
  - database-administrator
  - devops-engineer
  - testing
  - security-analyst
  - accessibility
date: 2026-03-16
---

# Product Backlog — UnplugHQ PI-2 Sprint 2

## Overview

This backlog covers PI-1 Sprint 1 (completed, 8 stories, 47 SP) and PI-2 Sprint 2 (active, 8 stories + 5 deferred bugs, 59 SP + 17 SP bugs). Stories are decomposed from Features F1–F4 with Gherkin acceptance criteria.

**Traceability:** Every story maps to BA requirements (FR-/NFR-/BR- identifiers in `docs/requirements.md`), PM desired outcomes (O1–O6), user journeys (UJ1–UJ5), and success criteria (SC1–SC8) from `docs/product-vision.md`.

**Definition of Done:** Stories are subject to the Definition of Done at `docs/definition-of-done.md`.

---

## Priority Legend

| Priority | Meaning |
|----------|---------|
| P1 | Must have — blocks downstream stories or critical path |
| P2 | Must have — required for MVP but no immediate blockers |
| P3 | Should have — enhances UX but deferrable to Sprint 2 |

---

## Feature F4 — User Identity & Access (AB#184) — ✅ Delivered Sprint 1

> Foundation for all authenticated flows. Delivered PI-1 Sprint 1. 4 stories, 16 SP, all tests passing.

### Story S-194: User Registration (AB#194) — P1

**As a** visitor,
**I want to** create an account by providing my email address and password through the sign-up form,
**so that** I can access the platform and begin connecting my server.

**Story Points:** 5
**Requirements:** FR-F4-001, BR-F4-002, BR-F4-003, NFR-009
**Outcomes:** O1 (zero-terminal), UJ1 (first-time setup)
**Success Criteria:** SC2 (zero CLI)

#### Acceptance Criteria

```gherkin
Feature: User Registration

  Scenario: Successful account creation
    Given I am a visitor on the signup page
    When I enter a valid email address and a password meeting strength requirements
    And I submit the signup form
    Then an account is created with my email
    And my password is stored as an Argon2id salted hash
    And I am redirected to the onboarding welcome screen

  Scenario: Password strength enforcement
    Given I am on the signup page
    When I enter a password shorter than 12 characters
    Or a password without mixed case
    Or a password without at least one number or symbol
    Then the form displays a clear validation message describing the requirement
    And the account is not created

  Scenario: Duplicate email rejection
    Given an account already exists with "user@example.com"
    When a visitor attempts to sign up with "user@example.com"
    Then a generic message is displayed that does not reveal whether the email is registered
    And no duplicate account is created

  Scenario: Email format validation
    Given I am on the signup page
    When I enter an invalid email format
    Then the form displays inline validation feedback before submission

  Scenario: GDPR consent at signup
    Given I am on the signup page
    Then a link to the privacy policy is visible
    And data processing disclosure is presented before account creation
```

---

### Story S-195: User Authentication (AB#195) — P1

**As a** registered user,
**I want to** log in with my email and password and log out when finished,
**so that** my session is secure and I control access to my account.

**Story Points:** 5
**Requirements:** FR-F4-002, FR-F4-003, FR-F4-006, BR-F4-001, NFR-012
**Outcomes:** O1, O6
**Success Criteria:** SC2

#### Acceptance Criteria

```gherkin
Feature: User Authentication

  Scenario: Successful login
    Given I am a registered user on the login page
    When I enter valid email and password
    And I submit the login form
    Then an authenticated session is established with HttpOnly, Secure, SameSite=Lax cookies
    And I am redirected to the dashboard

  Scenario: Failed login with generic error
    Given I am on the login page
    When I enter incorrect email or password
    Then a generic error "Invalid email or password" is displayed
    And no information reveals which field was wrong

  Scenario: Account lockout after repeated failures
    Given I have failed login 10 times within 5 minutes for the same account
    Then the account is temporarily locked
    And an email notification is sent to the registered address
    And subsequent login attempts show a lockout message

  Scenario: Logout with session invalidation
    Given I am logged in
    When I click the logout action in the navigation
    Then my session token is invalidated server-side immediately
    And I am redirected to the login page
    And accessing any authenticated route redirects to login

  Scenario: Session inactivity expiry
    Given I am logged in
    And I have been inactive for longer than the configured inactivity period
    When I attempt to access an authenticated route
    Then I am redirected to the login page with an explanatory message
    And the expired session is no longer valid on the server
```

---

### Story S-196: Password Reset Flow (AB#196) — P2

**As a** user who has forgotten my password,
**I want to** request a reset link via email and set a new password,
**so that** I can regain access to my account without support intervention.

**Story Points:** 3
**Requirements:** FR-F4-004, S-05 mitigations
**Outcomes:** O1
**Success Criteria:** SC2

#### Acceptance Criteria

```gherkin
Feature: Password Reset

  Scenario: Request password reset
    Given I am on the login page
    When I click the "Forgot password" link
    And I enter my registered email address
    Then the page displays "If an account exists, a reset link was sent"
    And the response timing is consistent regardless of whether the email exists

  Scenario: Reset password via valid link
    Given I received a password reset email with a one-time link
    When I click the link within 1 hour
    And I enter a new password meeting strength requirements
    Then my password is updated
    And the previous password no longer authenticates
    And I must log in with the new password

  Scenario: Expired reset link
    Given I received a password reset link
    When I click it after more than 1 hour
    Then I see a clear message that the link has expired
    And I can request a new reset link

  Scenario: Used reset link
    Given I already used a reset link to change my password
    When I click the same link again
    Then I see a message that the link is no longer valid

  Scenario: Token security
    Given a password reset is requested
    Then the token is cryptographically random with at least 256 bits of entropy
    And all existing reset tokens for that account are invalidated
```

---

### Story S-197: Account Settings and Notification Preferences (AB#197) — P2

**As a** logged-in user,
**I want to** update my display name, email address, and notification preferences from account settings,
**so that** my profile is current and I control what alerts I receive.

**Story Points:** 3
**Requirements:** FR-F4-005, FR-F4-007
**Outcomes:** O2, O5
**Success Criteria:** SC2

#### Acceptance Criteria

```gherkin
Feature: Account Settings

  Scenario: Update display name
    Given I am on the account settings page
    When I change my display name and save
    Then the change persists and is reflected on next login
    And the display name appears in the navigation

  Scenario: Update email with confirmation
    Given I am on the account settings page
    When I change my email address and save
    Then a confirmation link is sent to the new email address
    And my email does not change until I click the confirmation link
    And the old email remains active until confirmation completes

  Scenario: Toggle notification preferences
    Given I am on the account settings page
    When I toggle "Email alerts" off
    Then the change takes effect immediately
    And no email alert notifications are sent for future events
    And dashboard alerts still display normally

  Scenario: Settings accessible without terminal
    Given I am a logged-in user
    Then the settings page is accessible from the main navigation
    And all settings changes are completable through the web interface only
```

---

## Feature F1 — Server Connection & Provisioning (AB#181) — ✅ Delivered Sprint 1

> Foundational capability for all deployment features. Delivered PI-1 Sprint 1. 4 stories, 31 SP, all tests passing.

### Story S-198: Guided Server Connection Wizard (AB#198) — P1

**As a** logged-in user,
**I want to** connect my VPS through a guided wizard by entering its IP address and SSH credentials with provider-specific visual instructions,
**so that** my server is linked to UnplugHQ without needing terminal knowledge.

**Story Points:** 8
**Requirements:** FR-F1-001, FR-F1-002, FR-F1-003, NFR-001, NFR-010
**Outcomes:** O1, O3
**User Journeys:** UJ1
**Success Criteria:** SC1, SC2

#### Acceptance Criteria

```gherkin
Feature: Server Connection Wizard

  Scenario: Start connection flow from dashboard
    Given I am logged in and on the dashboard
    When I click "Add Server"
    Then the guided server connection wizard opens at step 1

  Scenario: Provider-specific SSH instructions
    Given I am on wizard step 1
    When I select my VPS provider from the list
    Then provider-specific SSH key setup instructions with visual step-by-step guidance appear
    And at minimum DigitalOcean, Hetzner, Linode, Vultr, and OVHcloud are covered
    And a "Generic / Other" option is available

  Scenario: Enter server credentials
    Given I am on wizard step 1
    When I enter a valid IPv4 or IPv6 address
    And I provide SSH authentication (key or password)
    And I provide the SSH username
    Then the IP format is validated on input
    And SSH key material is encrypted before storage

  Scenario: Successful connection test
    Given I have entered valid server credentials
    When I click "Test Connection"
    Then the system verifies SSH reachability on the specified port
    And the system confirms authentication success
    And I proceed to the validation step

  Scenario: Failed connection with actionable diagnostic
    Given I have entered server credentials
    When the SSH connection fails
    Then a specific, actionable diagnostic message is displayed
    And the message identifies the likely cause (e.g., "Port 22 unreachable — check firewall rules")
    And I can correct my input and retry

  Scenario: Zero-terminal completion
    Given I am a user with no terminal experience
    Then every step of the connection wizard is completable through the web interface
    And zero CLI commands are required
```

---

### Story S-199: Server Validation and Compatibility Check (AB#199) — P1

**As a** user connecting a server,
**I want to** see my server's operating system and resource specs and whether it meets requirements before provisioning,
**so that** I know my server is compatible before any changes are made.

**Story Points:** 5
**Requirements:** FR-F1-004, FR-F1-005, BR-F1-001
**Outcomes:** O3, O6
**User Journeys:** UJ1

#### Acceptance Criteria

```gherkin
Feature: Server Validation

  Scenario: OS and resource detection
    Given the SSH connection was successful
    When the system runs detection
    Then the OS name and version are displayed
    And CPU cores, RAM, and available disk are reported
    And the results appear on the validation screen

  Scenario: Compatible server proceeds
    Given the server meets minimum requirements
    Then a compatibility summary is shown
    And I can proceed to provisioning

  Scenario: Incompatible server blocked
    Given the server does not meet supported environment requirements
    Then a clear, non-technical explanation is displayed
    And provisioning does not proceed
    And no changes are made to the server

  Scenario: Partially supported server with warning
    Given the server is partially compatible
    Then a warning is displayed with specific details
    And explicit user confirmation is required to proceed
```

---

### Story S-200: Automated Server Provisioning (AB#200) — P1

**As a** user with a validated, compatible server,
**I want to** have Docker, Caddy, and the monitoring agent automatically installed with real-time progress visibility,
**so that** my server is ready for app deployments without manual setup.

**Story Points:** 13
**Requirements:** FR-F1-006, FR-F1-009, BR-F1-003, NFR-001
**Outcomes:** O1, O3
**User Journeys:** UJ1
**Success Criteria:** SC1, SC2

#### Acceptance Criteria

```gherkin
Feature: Server Provisioning

  Scenario: Automated provisioning with progress
    Given my server passed the compatibility check
    When I confirm provisioning
    Then provisioning begins automatically
    And real-time progress is displayed showing distinct phases
    And I do not need to enter any terminal commands

  Scenario: Successful provisioning
    Given provisioning is in progress
    When all components install successfully
    Then Docker Engine is running on the server
    And Caddy reverse proxy is configured and running
    And the monitoring agent container is running and reporting metrics
    And the server status transitions to "provisioned"

  Scenario: Idempotent re-provisioning
    Given provisioning has already completed on this server
    When provisioning is triggered again
    Then no duplicate or corrupt components are created
    And the operation completes safely

  Scenario: Provisioning failure with clean state
    Given provisioning is in progress
    When a step fails (e.g., Docker install fails)
    Then the user sees what step failed with guidance
    And partial installation artifacts are cleaned up or flagged
    And the server is not shown as "provisioned" on the dashboard
    And the server status transitions to "provision-failed"

  Scenario: SSH key security during provisioning
    Given provisioning executes SSH commands on the server
    Then SSH private key material is never stored in plaintext
    And SSH commands use parameterized templates without string concatenation
```

---

### Story S-201: Server Dashboard Presence (AB#201) — P2

**As a** user with a provisioned server,
**I want to** see it on the dashboard with a live health indicator and assign it a human-readable name,
**so that** I can identify and monitor my server at a glance.

**Story Points:** 5
**Requirements:** FR-F1-007, FR-F1-008
**Outcomes:** O5
**User Journeys:** UJ1
**Success Criteria:** SC7

#### Acceptance Criteria

```gherkin
Feature: Server Dashboard Tile

  Scenario: Server appears after provisioning
    Given my server was successfully provisioned
    Then a server tile appears immediately on the dashboard
    And it displays the server name, IP address, OS, and connection status

  Scenario: Live health indicator
    Given my server is provisioned and connected
    Then the health indicator accurately reflects server connectivity
    And the indicator uses the Pulse Ring visual with status color
    And the status has a text label alongside the color indicator

  Scenario: Assign and edit server name
    Given my server is displayed on the dashboard
    When I assign or change the server name
    Then the name is displayed on the dashboard and all server-related views
    And the name field is editable from server settings

  Scenario: Server disconnection state
    Given my server loses connectivity
    Then the health indicator transitions to the offline state
    And the dashboard reflects the current connection status
```

---

## Feature F2 — Application Catalog & Deployment (AB#182)

> Core value proposition. Depends on F1 for server provisioning.

### Story S-202: Application Catalog Browsing (AB#202) — P1

**As a** user,
**I want to** browse a curated catalog of self-hostable applications organized by category,
**so that** I can discover apps to deploy on my server.

**Story Points:** 5
**Requirements:** FR-F2-001, FR-F2-002, BR-F2-001
**Outcomes:** O4
**User Journeys:** UJ1, UJ2
**Success Criteria:** SC3

#### Acceptance Criteria

```gherkin
Feature: Application Catalog

  Scenario: Browse catalog by category
    Given I am on the marketplace page
    Then I see applications organized into categories
    And categories include at minimum: File Storage, Analytics, CMS, Password Management, Email, Photo Storage
    And I can filter by category

  Scenario: Catalog entry completeness
    Given the catalog is displayed
    Then each app shows: name, short description, category, minimum resource requirements
    And each app links to its upstream open-source project
    And at least 15 curated apps are available

  Scenario: Catalog browsing without a server
    Given I am logged in but have no connected server
    When I visit the marketplace
    Then I can browse the full catalog
    And deployment is gated on having a provisioned server

  Scenario: Search for apps
    Given I am on the marketplace page
    When I type in the search field
    Then results filter to match my search query
```

---

### Story S-203: Guided App Configuration (AB#203) — P1

**As a** user selecting an app from the catalog,
**I want to** configure it through a guided form asking only relevant questions with sensible defaults,
**so that** deployment is simple and free of technical jargon.

**Story Points:** 5
**Requirements:** FR-F2-003, BR-F2-003
**Outcomes:** O1, O4
**User Journeys:** UJ1
**Success Criteria:** SC2

#### Acceptance Criteria

```gherkin
Feature: App Configuration

  Scenario: Per-app guided configuration
    Given I selected an app from the catalog
    When the configuration form loads
    Then it shows only fields relevant to this specific app
    And no generic "advanced settings" are required for basic deployment
    And fields use non-technical language

  Scenario: Sensible defaults
    Given I am configuring an app
    Then safe default values are pre-filled where applicable
    And at minimum each app collects: deployment domain and admin email

  Scenario: Domain validation
    Given I am entering a deployment domain
    When I submit an invalid domain format
    Then a clear validation message appears
    And if the domain does not resolve to the server IP, a warning is shown without blocking

  Scenario: Configuration summary
    Given I have filled in all required fields
    Then a summary of what will be configured is displayed before deployment
```

---

### Story S-204: Application Deployment with Progress (AB#204) — P1

**As a** user who configured an app,
**I want to** deploy it with a single action and see real-time progress including automatic SSL and reverse proxy setup,
**so that** my app is live, secured, and accessible via its domain.

**Story Points:** 13
**Requirements:** FR-F2-004, FR-F2-005, FR-F2-006, FR-F2-007, BR-F2-002, BR-F2-004
**Outcomes:** O1, O2, O4
**User Journeys:** UJ1
**Success Criteria:** SC1, SC2

#### Acceptance Criteria

```gherkin
Feature: Application Deployment

  Scenario: Single-action deployment
    Given I reviewed the configuration summary
    When I click "Deploy"
    Then deployment begins immediately without further prompts
    And the deployment job is enqueued

  Scenario: Real-time deployment progress
    Given deployment is in progress
    Then I see distinct phases (e.g., pulling image, configuring, provisioning SSL, starting)
    And phase descriptions use non-technical, user-friendly language
    And progress updates are pushed via SSE in real time

  Scenario: Background deployment with navigation
    Given deployment is in progress
    When I navigate away from the deployment screen
    Then deployment continues in the background
    And the dashboard reflects deployment progress

  Scenario: Automatic SSL certificate provisioning
    Given the app is being deployed with a domain
    Then an SSL certificate is automatically issued via ACME
    And no manual certificate upload is required
    And if certificate issuance fails, the failure is reported clearly

  Scenario: Automatic reverse proxy configuration
    Given the app deployment includes domain routing
    Then Caddy reverse proxy routing is configured automatically
    And existing apps' routing is not disrupted

  Scenario: Deployment server health gate
    Given the target server is not in a provisioned and healthy state
    Then deployment does not proceed
    And I am prompted to resolve server health first

  Scenario: Tier limit enforcement
    Given I have reached my subscription tier's app limit
    When I attempt to deploy another app
    Then deployment is blocked with a clear message about the limit
```

---

### Story S-205: Post-Deployment Verification (AB#205) — P2

**As a** user whose app was deployed,
**I want to** receive automated health verification and see the result — either a running app on my dashboard or guided remediation steps,
**so that** I know whether my app is live and what to do if it isn't.

**Story Points:** 5
**Requirements:** FR-F2-008, FR-F2-009, FR-F2-010
**Outcomes:** O4, O5, O6
**User Journeys:** UJ1

#### Acceptance Criteria

```gherkin
Feature: Post-Deployment Verification

  Scenario: Successful health check
    Given the app container was started
    When the post-deployment health check runs
    And the app responds successfully to its health endpoint
    Then the app status transitions to "running"
    And the app tile appears on the dashboard with its access URL

  Scenario: Failed health check with guidance
    Given the app container was started
    When the post-deployment health check fails
    Then the deployment is flagged as "unhealthy" on the dashboard
    And the failure reason is displayed in user-friendly language
    And guided next steps are provided (e.g., check DNS propagation)
    And the app is visually distinguished from running apps

  Scenario: Dashboard access link
    Given the app is running
    Then the dashboard shows a clickable link to the app's configured domain
    And the link is only shown when the app is in running state
```

---

### Story S-206: Multi-App Coexistence (AB#206) — P2

**As a** user with apps already running on my server,
**I want to** deploy additional apps without disrupting existing routing or app availability,
**so that** all my self-hosted apps coexist safely.

**Story Points:** 5
**Requirements:** FR-F2-011
**Outcomes:** O4
**User Journeys:** UJ2
**Success Criteria:** SC2

#### Acceptance Criteria

```gherkin
Feature: Multi-App Coexistence

  Scenario: Non-disruptive second app deployment
    Given I have one app running on my server
    When I deploy a second app
    Then the first app remains accessible throughout the deployment
    And all existing access links remain valid
    And the reverse proxy integrates the new app without restarting existing containers

  Scenario: Independent status tracking
    Given I have multiple apps deployed
    Then each app has its own status indicator on the dashboard
    And each app has its own access link
    And stopping one app does not affect others

  Scenario: Resource awareness
    Given my server is running multiple apps
    Then the resource impact of a new deployment is visible
    And I can make informed decisions about what my server can handle
```

---

## Feature F3 — Dashboard & Health Monitoring (AB#183)

> Ongoing engagement surface. Depends on F1 for server metrics and F2 for deployed app statuses.

### Story S-207: Dashboard Overview (AB#207) — P1

**As a** logged-in user,
**I want to** see a dashboard with server resource utilization and all deployed apps with health status indicators and direct access links,
**so that** I know everything is healthy at a glance.

**Story Points:** 8
**Requirements:** FR-F3-001, FR-F3-002, FR-F3-003, NFR-007, NFR-011
**Outcomes:** O5
**User Journeys:** UJ3, UJ4
**Success Criteria:** SC7

#### Acceptance Criteria

```gherkin
Feature: Dashboard Overview

  Scenario: Server resource display
    Given I am on the dashboard with a connected server
    Then I see CPU, RAM, disk, and network utilization metrics
    And metrics update at intervals of 60 seconds or less
    And units and percentages are clearly labeled

  Scenario: App status indicators
    Given I have deployed apps
    Then each app tile shows a health status indicator
    And status states include: running, stopped, unhealthy, updating
    And each status is visually distinct using color plus text label (not color alone)

  Scenario: App access links
    Given an app is in running state
    Then the dashboard shows a clickable link to the app's domain
    And the link is not shown when the app is not running

  Scenario: Empty state
    Given I have no deployed apps
    Then the dashboard displays an encouraging empty state message
    And a call-to-action guides me to deploy my first app

  Scenario: Dashboard performance
    Given I am on a 10 Mbps connection
    Then the dashboard page loads within 3 seconds
    And API responses for dashboard state are under 2 seconds at p95
```

---

### Story S-208: Health Alert Notifications (AB#208) — P1

**As a** user,
**I want to** receive email notifications within 5 minutes when an app goes down or server resources reach critical thresholds,
**so that** I can respond quickly to problems.

**Story Points:** 8
**Requirements:** FR-F3-004, FR-F3-006, BR-F3-001, BR-F3-002
**Outcomes:** O5
**User Journeys:** UJ4
**Success Criteria:** SC7

#### Acceptance Criteria

```gherkin
Feature: Health Alert Notifications

  Scenario: App unavailability alert
    Given a deployed app transitions to stopped or unhealthy state
    Then an email notification is sent to the account holder
    And the notification is delivered within 5 minutes of detection

  Scenario: Resource threshold alerts
    Given server CPU exceeds 90%
    Or server RAM exceeds 90%
    Or server disk exceeds 85% of capacity
    Then an email notification is sent to the account holder

  Scenario: Alert notification suppression
    Given I have disabled email alerts in account settings
    Then no email notifications are sent
    And dashboard alerts still display normally

  Scenario: Monitoring accuracy
    Given health status is monitored continuously
    Then health status reporting achieves at least 99.5% accuracy
    And the monitoring interval supports 5-minute detection SLA

  Scenario: Dashboard alert display
    Given an alert condition is detected
    Then the alert appears on the dashboard regardless of email preference
    And the alert includes severity, affected resource, and timestamp
```

---

### Story S-209: Alert Management and Guided Remediation (AB#209) — P2

**As a** user seeing an alert on my dashboard,
**I want to** acknowledge or dismiss it and receive guided step-by-step remediation for known alert types,
**so that** I can resolve issues quickly without technical expertise.

**Story Points:** 5
**Requirements:** FR-F3-005, FR-F3-007, FR-F3-008
**Outcomes:** O5, O6
**User Journeys:** UJ4
**Success Criteria:** SC4 (proxy)

#### Acceptance Criteria

```gherkin
Feature: Alert Management

  Scenario: Acknowledge alert
    Given an active alert is displayed on the dashboard
    When I click the acknowledge action
    Then the alert is marked as acknowledged
    And it is visually distinct from new alerts

  Scenario: Dismiss alert
    Given an acknowledged alert is displayed
    When I dismiss it
    Then it does not re-trigger unless the underlying condition reoccurs

  Scenario: Disk usage breakdown
    Given a disk utilization alert is active
    Then I see a per-app breakdown of disk consumption on the alert detail view
    And the system suggests at least one actionable remediation step

  Scenario: Guided remediation for known alert types
    Given an alert of a known type (disk full, app unavailable, resource critical)
    Then step-by-step remediation guidance is available
    And the guidance uses non-technical language
    And the alert-to-resolution flow targets under 10 minutes for guided issues

  Scenario: Alert type coverage
    Given the alert system
    Then the following alert types are supported: cpu-critical, ram-critical, disk-critical, app-unavailable, server-unreachable
```

---

## Backlog Summary

| Feature | Stories | Total SP | Status |
|---------|---------|----------|--------|
| F4 — User Identity & Access | 4 | 16 | ✅ Delivered Sprint 1 |
| F1 — Server Connection & Provisioning | 4 | 31 | ✅ Delivered Sprint 1 |
| F2 — App Catalog & Deployment | 5 | 33 | 🔵 Sprint 2 Active |
| F3 — Dashboard & Health Monitoring | 3 | 21 | 🔵 Sprint 2 Active |
| Deferred PI-1 Bugs | 5 | 17 | 🔵 Sprint 2 Active |
| **Total** | **21** | **118** | |

### Sprint 2 Story Points

| Category | Stories | SP |
|----------|---------|-----|
| F2 stories (AB#202–206) | 5 | 33 |
| F3 stories (AB#207–209) | 3 | 21 |
| Deferred bugs (AB#251, 258–260, 262) | 5 | 17 |
| **Sprint 2 Total** | **13** | **71** |

---

## Deferred PI-1 Bugs (Sprint 2)

> These bugs were identified during PI-1 P5 verification and deferred to PI-2. Per PI-2 objectives (PI2-O6) and risk register (R19, score 25), security bugs are **Week 1 priority** — resolved before any new F2/F3 code that exercises affected paths (BR-BF-001).

### Bug B-258: Missing CSRF Double-Submit Cookie (AB#258) — HIGH

**Filed by:** Security Analyst (PI-1 P5)
**Severity:** High | **Priority:** P1
**Story Points:** 5
**Feature:** Cross-cutting (F1, F4)
**Requirements:** BF-001, S-04, S-06

#### Acceptance Criteria

```gherkin
Feature: CSRF Protection

  Scenario: CSRF token on mutations
    Given a state-changing tRPC mutation is invoked
    Then the request includes a CSRF token
    And the server validates the token against the session
    And a token mismatch returns 403 FORBIDDEN

  Scenario: CSRF token not in URL
    Given any CSRF-protected request
    Then the CSRF token is never present in URL parameters

  Scenario: Full regression
    Given CSRF protection is enabled
    Then all existing F1 and F4 flows pass regression testing
```

---

### Bug B-259: Insufficient Audit Logging (AB#259) — HIGH

**Filed by:** Security Analyst (PI-1 P5)
**Severity:** High | **Priority:** P1
**Story Points:** 3
**Feature:** Cross-cutting
**Requirements:** BF-004, NFR-013, BR-Global-006

#### Acceptance Criteria

```gherkin
Feature: Audit Logging

  Scenario: Privileged operations logged
    Given a privileged operation occurs (server connect, disconnect, provisioning, app deploy, app remove, config change, credential rotation)
    Then an audit log entry is created with: action type, timestamp, user ID, target server/app, outcome

  Scenario: Audit log accessible
    Given I am on the account settings page
    Then I can view my audit log via the user.auditLog tRPC query
    And entries are retained for a minimum of 90 days

  Scenario: New F2/F3 operations include audit
    Given any new F2/F3 operation with side effects is implemented
    Then the operation includes an audit log write at implementation time
```

---

### Bug B-260: Missing Content Security Policy (AB#260) — HIGH

**Filed by:** Security Analyst (PI-1 P5)
**Severity:** High | **Priority:** P1
**Story Points:** 3
**Feature:** Cross-cutting
**Requirements:** BF-003

#### Acceptance Criteria

```gherkin
Feature: Secrets Rotation

  Scenario: SSH key rotation
    Given I am on server settings
    When I trigger SSH key rotation
    Then a new key is generated and deployed to the VPS
    And the old key is invalidated immediately
    And running apps are not interrupted

  Scenario: API token rotation
    Given I am on server settings
    When I trigger monitoring API token rotation
    Then a new token is issued
    And the old token is invalidated
    And the monitoring agent receives the new token

  Scenario: Rotation logged
    Given a credential rotation occurs
    Then the event is recorded in the audit log
```

---

### Bug B-262: Broken Sudoers Ownership (AB#262) — HIGH

**Filed by:** Security Analyst (PI-1 P5)
**Severity:** High | **Priority:** P1
**Story Points:** 3
**Feature:** Cross-cutting (DevOps)
**Requirements:** E-04

#### Acceptance Criteria

```gherkin
Feature: Sudoers Configuration

  Scenario: Correct sudoers file ownership
    Given the provisioning script creates a sudoers file for the unplughq user
    Then the file is owned by root:root
    And permissions are 0440
    And the file passes visudo -c validation

  Scenario: Limited sudo scope
    Given the unplughq user sudoers file
    Then only Docker CLI and specific APT commands are allowed
    And no wildcard or ALL permissions are granted
```

---

### Bug B-251: Focus Management on Dynamic Content (AB#251) — MEDIUM

**Filed by:** Accessibility Agent (PI-1 P5)
**Severity:** Medium | **Priority:** P2
**Story Points:** 3
**Feature:** Cross-cutting (F4, F1 — all routes)
**Requirements:** BF-005, WCAG 2.4.3

#### Acceptance Criteria

```gherkin
Feature: Focus Management

  Scenario: Route transition focus
    Given I navigate to a new route within the SPA
    Then focus moves to the main content region or page heading
    And screen readers announce the new page context

  Scenario: Modal focus trap cleanup
    Given a modal dialog is open
    When I close the modal
    Then focus returns to the triggering element
    And the focus trap is fully released

  Scenario: Dynamic content focus
    Given new content is loaded dynamically (e.g., provisioning progress)
    Then focus is managed appropriately for the content type
    And aria-live regions announce status updates
```

---

## Cross-Feature Dependencies

```
F4 (Auth) ──────► F1 (Server) ──────► F2 (Catalog/Deploy) ──────► F3 (Dashboard/Monitoring)
  │  ✅ Done        │  ✅ Done          │  🔵 Sprint 2              │  🔵 Sprint 2
  │ S-194 (register)│ S-198 (wizard)    │ S-202 (catalog)           │ S-207 (dashboard)
  │ S-195 (login)   │ S-199 (validate)  │ S-203 (config)            │ S-208 (alerts)
  │ S-196 (reset)   │ S-200 (provision) │ S-204 (deploy)            │ S-209 (remediation)
  │ S-197 (settings)│ S-201 (tile)      │ S-205 (verify)            │
  │                 │                   │ S-206 (multi-app)          │
  ▼                 ▼                   ▼                            ▼
  Delivered S1      Delivered S1        Blocks F3                    End of chain

Cross-cutting bugs (B-258, B-259, B-260, B-262, B-251) — affect F1+F4 code paths, resolved Week 1
```

**F2 depends on F1** — app deployment requires a provisioned server (delivered).
**F3 depends on F1** — dashboard metrics require a connected server with monitoring agent (delivered).
**F3 soft-depends on F2** — app status indicators require deployed apps (dashboard shell can exist without).
**Bugs depend on F1+F4** — security bugs affect existing Sprint 1 code paths.

## Non-Functional Requirements Coverage

All stories inherit these cross-cutting NFRs verified at P5:

| NFR | Coverage | Verification |
|-----|----------|--------------|
| NFR-001 Zero-terminal | All user-facing stories | UX audit of every flow |
| NFR-002 < 15 min first app | UJ1 chain: S-194→S-198→S-199→S-200→S-202→S-203→S-204 | Timed E2E test |
| NFR-003 WCAG 2.2 AA | All UI stories | A11Y audit per `docs/wcag-audit.md` |
| NFR-004 No user data on control plane | S-200, S-204, S-207, S-208 | Architecture verification |
| NFR-005 Vendor independence | S-204 (standard Docker), S-206 | Export test |
| NFR-006 Destructive operation confirmation | S-204 (remove app), S-206 (stop app) | UI test |
| NFR-008 Mobile-first responsive | All UI stories | 375px viewport testing |
| NFR-010 SSH key encryption | S-198, S-200 (delivered), B-260 (rotation) | Security review |
| NFR-011 Page load < 3s, API p95 < 2s | S-207 | Performance test |
| NFR-013 Audit logging | B-259, S-204, S-207, all new F2/F3 ops | Audit log verification |
| NFR-015 Idempotent deployment | S-204 | Retry test |
| NFR-016 Agent metrics auth | S-207, S-208 | Security review |
| NFR-017 SSE keepalive + fallback | S-207 | Resilience test |
| NFR-018 Pinned image digests | S-202 (catalog), S-204 (deploy) | Catalog validation |
| NFR-019 Docker network isolation | S-204, S-206 | Security review |
| NFR-020 Alert email retry (DLQ) | S-208 | Integration test |

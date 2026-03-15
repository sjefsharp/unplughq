---
artifact: process-models
produced-by: business-analyst
project-slug: unplughq
work-item: epic-001-unplughq-platform
work-item-type: epic
workflow-tier: full
phase: P1
version: 1.0.0
status: approved
azure-devops-id: 186
consumed-by:
  - system-architect
  - solution-designer
  - ux-designer
  - content-strategist
  - accessibility
  - product-owner
  - tech-lead
  - testing
date: 2026-03-13
---

# Process Models

## Overview

This document contains BPMN-style process models for the five core user journeys defined in the Product Vision. Each model depicts the "to-be" future-state process — the experience UnplugHQ enables for non-technical users. Models use Mermaid flowchart syntax representing swim-lane activity diagrams with gateways, error paths, and system/user participant boundaries.

**Upstream reference:** [Product Vision](product-vision.md)

---

## Modeling Conventions

- **Rounded rectangles / process nodes**: Activities performed by an actor
- **Diamond gateways (`{decision}`)**:  Decision points or conditions
- **Oval terminal nodes (`([text])`)**: Start and end events
- **Actor labels in italics**: User = non-technical UnplugHQ user; System = UnplugHQ platform; External = third-party or server-side action
- **Happy path**: Left-to-right or top-to-bottom, primary flow
- **Exception paths**: Branch to the right or bottom, labelled with the failure condition

---

## PM-1: First-Time Server Connection and Application Deployment (UJ1)

> **Business context:** The core value-delivery journey for UnplugHQ. A user with no terminal experience arrives at UnplugHQ, creates an account, connects a VPS, selects a self-hosted application from the catalog, and ends with a running application accessible at their own domain — without touching a terminal. This is the "aha moment" of the entire product.
>
> **Success metric:** Time from sign-up to first running app < 15 minutes (SC1)

```mermaid
flowchart TD
    A([User visits UnplugHQ]) --> B[/"User: Sign up with email + password"/]
    B --> C{Email format valid?}
    C -- No --> B
    C -- Yes --> D[System: Create account, send verification email]
    D --> E[/"User: Click verification link in email"/]
    E --> F{Link valid and not expired?}
    F -- No / Expired --> G[System: Offer to resend verification]
    G --> D
    F -- Yes --> H[System: Activate account, redirect to onboarding]
    H --> I[/"User: Select 'Add Server'"/]
    I --> J[/"User: Choose VPS provider from list"/]
    J --> K[System: Display provider-specific SSH key setup instructions with visuals]
    K --> L[/"User: Generate SSH key and add public key to VPS provider panel"/]
    L --> M[/"User: Enter server IP address"/]
    M --> N{IP format valid?}
    N -- No --> M
    N -- Yes --> O[System: Test SSH connectivity and authentication]
    O --> P{Connection successful?}
    P -- No --> Q[System: Display diagnostic message with actionable guidance]
    Q --> R[/"User: Resolve connectivity issue"/]
    R --> O
    P -- Yes --> S[System: Detect OS, measure CPU / RAM / disk]
    S --> T[System: Evaluate server compatibility against supported baseline]
    T --> U{Server compatible?}
    U -- Unsupported --> V[System: Display unsupported reason; halt provisioning]
    V --> W([End: User must resolve before continuing])
    U -- Partially supported --> X[System: Display compatibility warning]
    X --> Y{User confirms proceeding?}
    Y -- No --> W
    Y -- Yes --> Z[System: Begin automated base provisioning]
    U -- Supported --> Z
    Z --> AA[System: Install container runtime, reverse proxy, monitoring agent]
    AA --> AB{Provisioning successful?}
    AB -- No --> AC[System: Report failure, clean up partial state]
    AC --> W
    AB -- Yes --> AD[System: Server appears in dashboard with healthy indicator]
    AD --> AE[/"User: Browses application catalog"/]
    AE --> AF[/"User: Selects application (e.g. Nextcloud)"/]
    AF --> AG[System: Display guided per-app configuration form]
    AG --> AH[/"User: Completes configuration — domain, admin email, storage quota"/]
    AH --> AI[System: Validate configuration inputs]
    AI --> AJ{Inputs valid?}
    AJ -- No --> AK[System: Highlight invalid fields with inline guidance]
    AK --> AH
    AJ -- Yes --> AL[System: Display deployment summary screen]
    AL --> AM{User confirms deployment?}
    AM -- No --> AE
    AM -- Yes --> AN[System: Pull container image, configure environment]
    AN --> AO[System: Configure reverse proxy routing]
    AO --> AP[System: Provision SSL certificate via automated CA]
    AP --> AQ{SSL issued successfully?}
    AQ -- No --> AR[System: Display SSL guidance — DNS check, domain propagation]
    AR --> AS([End: User resolves domain/DNS before retrying])
    AQ -- Yes --> AT[System: Start application container]
    AT --> AU[System: Run post-deployment health check]
    AU --> AV{Health check passes?}
    AV -- No --> AW[System: Flag deployment, notify user, display guided next steps]
    AW --> AS
    AV -- Yes --> AX[System: Add application tile to dashboard with access link]
    AX --> AY([User: Accesses their own self-hosted application ✨])
```

---

## PM-2: Adding a Second Application to an Existing Server (UJ2)

> **Business context:** Represents the expansion pattern for returning users. This journey validates that UnplugHQ can manage multi-app servers without disrupting existing deployments. The system must detect the existing reverse proxy configuration and integrate the new application routing seamlessly.
>
> **Success metric:** Second app deployment < 5 minutes (feature roadmap metric)

```mermaid
flowchart TD
    A([Authenticated user views dashboard]) --> B[/"User: Clicks 'Add App'"/]
    B --> C[System: Display application catalog]
    C --> D[/"User: Browses catalog, selects an application (e.g. Plausible Analytics)"/]
    D --> E[System: Display per-app guided configuration form]
    E --> F[/"User: Enters deployment domain and app-specific settings"/]
    F --> G[System: Validate configuration inputs]
    G --> H{Inputs valid?}
    H -- No --> I[System: Highlight invalid fields with inline guidance]
    I --> F
    H -- Yes --> J{Multiple connected servers?}
    J -- No --> L[System: Auto-select single connected server]
    J -- Yes --> K[/"User: Selects target server from list"/]
    K --> L
    L --> M[System: Display deployment summary including target server]
    M --> N{User confirms?}
    N -- No --> C
    N -- Yes --> O[System: Check existing reverse proxy configuration on target server]
    O --> P[System: Determine integration approach for new app routing]
    P --> Q[System: Pull container image, configure environment]
    Q --> R[System: Add new routing to proxy without modifying existing app routes]
    R --> S[System: Provision SSL certificate for new app domain]
    S --> T{SSL issued successfully?}
    T -- No --> U[System: Display domain/DNS guidance for new app]
    U --> V([End: User resolves DNS before retrying])
    T -- Yes --> W[System: Start new application container]
    W --> X[System: Run post-deployment health check for new app]
    X --> Y{New app health check passes?}
    Y -- No --> Z[System: Flag new deployment, notify user, display guided next steps]
    Z --> V
    Y -- Yes --> AA[System: Verify existing apps remain healthy — re-check running apps]
    AA --> AB{All existing apps still healthy?}
    AB -- No --> AC[System: Alert user to impact on existing app — investigate routing conflict]
    AC --> V
    AB -- Yes --> AD[System: Add new app tile to dashboard]
    AD --> AE([Both apps visible on dashboard, both monitored])
```

---

## PM-3: Handling an Application Update (UJ3)

> **Business context:** Represents the ongoing maintenance lifecycle for deployed apps. UnplugHQ's core operational-maturity promise — apps stay updated with zero user-triggered downtime. This journey includes the safety-critical pre-update backup and automatic rollback paths.
>
> **Success metric:** Zero user-caused data loss from updates (SC4) — planned for PI-2 as F5

```mermaid
flowchart TD
    A([Scheduled update-check process runs]) --> B[System: Query upstream app repositories for new versions]
    B --> C{New version available for any deployed app?}
    C -- No --> D([End: All apps up to date — no action])
    C -- Yes --> E[System: Record update-available state for affected apps]
    E --> F[System: Send update-available notification to user email]
    F --> G[System: Display update badge on affected app tile in dashboard]
    G --> H[/"User: Clicks 'Review Update' on the app tile"/]
    H --> I[System: Display update detail screen — version delta, changelog summary, risk assessment]
    I --> J{User decision}
    J -- Defer --> K[System: Record deferred state, remove urgency badge — re-notify on next check]
    K --> L([Update deferred])
    J -- Proceed --> M[System: Create pre-update backup snapshot of app data]
    M --> N{Backup created successfully?}
    N -- No --> O[System: Halt update — notify user that backup unavailable]
    O --> P([End: User decides whether to proceed without backup — not recommended])
    N -- Yes --> Q[System: Pull updated container image]
    Q --> R[System: Stop current container, apply update, start updated container]
    R --> S[System: Run post-update health check]
    S --> T{App healthy after update?}
    T -- Yes --> U[System: Record update in history, update version displayed on dashboard]
    U --> V([Dashboard shows updated version, backup snapshot retained per retention policy])
    T -- No --> W[System: Trigger automatic rollback to pre-update snapshot]
    W --> X[System: Restore backup, restart previous container version]
    X --> Y[System: Run health check on rolled-back app]
    Y --> Z{Rollback health check passes?}
    Z -- Yes --> AA[System: Notify user — update failed and was rolled back, details and next steps provided]
    AA --> AB([App restored to previous version — investigation recommended])
    Z -- No --> AC[System: Critical alert — both update and rollback failed]
    AC --> AD[System: Escalation notification with full diagnostic context]
    AD --> AE([Critical: Manual admin intervention required])
```

---

## PM-4: Responding to a Health Alert (UJ4)

> **Business context:** This journey covers the routine health-monitoring response loop. UnplugHQ must convert infrastructure signals into guided, non-technical actions — so a user who receives a disk usage alert can resolve it in under 10 minutes without any server knowledge.
>
> **Success metric:** Alert-to-resolution time < 10 minutes for guided issues (SC4 proxy)

```mermaid
flowchart TD
    A([Monitoring agent collects server metrics at regular interval]) --> B{Any monitored threshold exceeded?}
    B -- No --> C([Continue monitoring — no alert])
    B -- Yes --> D[System: Generate alert event record]
    D --> E[System: Send email notification to account holder]
    E --> F[System: Display alert on dashboard with severity and description]
    F --> G[/"User: Opens dashboard in response to notification"/]
    G --> H[/"User: Reviews alert detail"/]
    H --> I{Alert type?}

    I -- Disk usage high --> J[System: Display per-app disk consumption breakdown]
    J --> K[System: Suggest remediation options — expand storage quota or identify large files]
    K --> L[/"User: Selects a guided remediation action"/]
    L --> M[System: Executes action or provides step-by-step terminal-free guidance]
    M --> N[System: Re-check disk usage condition]
    N --> O{Condition resolved?}
    O -- Yes --> P[System: Clear alert, update dashboard]
    O -- No --> Q[System: Display current state, offer next escalation option]

    I -- App unavailable --> R[System: Display last known app state and timestamp of failure]
    R --> S[System: Offer one-click app restart action]
    S --> T[/"User: Clicks 'Restart App'"/]
    T --> U[System: Attempt container restart]
    U --> V{Restart successful and app healthy?}
    V -- Yes --> W[System: Clear alert, update app status to running]
    V -- No --> X[System: Display restart failure — offer view logs action and support link]

    I -- Resource critical CPU or RAM --> Y[System: Display resource breakdown by running app]
    Y --> Z[System: Suggest remediation — stop a lower-priority app or upgrade server plan]
    Z --> AA[/"User: Takes guided action"/]
    AA --> AB[System: Re-check resource condition]
    AB --> AC{Condition resolved?}
    AC -- Yes --> AD[System: Clear alert, update resource metrics]
    AC -- No --> AE[System: Escalate — recommend contacting support with diagnostic context]

    P --> AF([Alert resolved — dashboard is healthy])
    W --> AF
    Q --> AF
    X --> AF
    AD --> AF
    AE --> AF
```

---

## PM-5: Disconnecting from UnplugHQ (UJ5)

> **Business context:** The trust-building journey. A user who chooses to stop using UnplugHQ must be able to do so without losing access to their self-hosted applications. This journey enforces the "no vendor lock-in" constraint from the Product Vision and validates SC6.
>
> **Success metric:** Zero data loss during export; apps operational post-disconnect (SC6)

```mermaid
flowchart TD
    A([User decides to disconnect from UnplugHQ]) --> B[/"User: Navigates to Settings → Disconnect Server (or Account)"/]
    B --> C[System: Display information screen — what disconnecting means]
    C --> D[System: Explain clearly — apps will keep running on your server, what monitoring and management will stop, what to do next]
    D --> E{User confirms intent to disconnect?}
    E -- No --> F([User remains connected — no change])
    E -- Yes --> G[System: Generate configuration export package]
    G --> H[System: Include in export — Docker Compose files for each deployed app, environment variable templates, reverse proxy configuration, SSL certificate renewal instructions]
    H --> I[System: Validate export completeness]
    I --> J{Export complete and valid?}
    J -- No --> K[System: Report export gap — user can choose to abort or proceed without full export]
    K --> L{User proceeds without full export?}
    L -- No --> M([End: User retains connection until export issue resolved])
    L -- Yes --> N[System: Proceed with disconnect]
    J -- Yes --> O[/"User: Downloads configuration export package"/]
    O --> N
    N --> P[System: Revoke UnplugHQ monitoring agent access to the server]
    P --> Q[System: Remove registration of server from UnplugHQ control plane]
    Q --> R[System: Verify deployed applications are still responding on server]
    R --> S{Apps still running after disconnect?}
    S -- Yes --> T[System: Confirm disconnect success — display final status of each app]
    T --> U[System: Display post-disconnect instructions — how to manage apps going forward]
    U --> V[/"User: Retains downloaded configuration export"/]
    V --> W([UnplugHQ disconnected — user's apps running independently on their own server])
    S -- No --> X[System: Warning — one or more apps are not responding after disconnect]
    X --> Y[System: Display per-app diagnostic and reconnect option]
    Y --> Z([User may reconnect to investigate or proceed independently])
```

---

## Process Model Summary

| Model ID | User Journey | Core Business Value | Key Risk Handled |
|----------|-------------|--------------------|--------------------|
| PM-1 | UJ1 – First-Time Setup | Delivers the primary product promise from zero to first running app | R1 (SSH compatibility), R5 (security), R12 (DNS/SSL) |
| PM-2 | UJ2 – Adding a Second App | Confirms multi-app server management without disruption | R2 (provisioning drift), R4 (dashboard noise) |
| PM-3 | UJ3 – Handling an Update | Automated maintenance with zero-downtime safety net | R4 (update trust), SC4 (zero data loss) |
| PM-4 | UJ4 – Responding to an Alert | Health visibility translates to guided non-technical resolution | R4 (health signal accuracy), SC7 |
| PM-5 | UJ5 – Migrating Away | Validates no vendor lock-in; builds long-term user trust | R6 (data sovereignty), SC5, SC6 |

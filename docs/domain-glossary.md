---
artifact: domain-glossary
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
  - frontend-developer
  - backend-developer
  - database-administrator
  - devops-engineer
  - testing
date: 2026-03-13
---

# Domain Glossary

## Purpose

This glossary establishes the **ubiquitous language** for the UnplugHQ platform. All agents, artifacts, code, UI copy, and documentation must use terms as defined here — without variation in spelling, capitalisation, or meaning. Conflicting usage in any artifact should be flagged to the Business Analyst for resolution.

---

## A

**Alert**
A system-generated notification that a monitored condition on the user's server or a deployed application has exceeded a defined threshold (e.g., disk usage > 85%, app unavailable). Alerts are surfaced in the dashboard and optionally sent via email. *Distinct from a notification*, which can be informational. See also: *Notification*, *Threshold*, *Alert Pipeline*, *Alert Threshold*.

**Alert Pipeline**
The end-to-end automated process that detects a threshold breach, generates an alert record, pushes it to the dashboard via SSE, evaluates email notification preferences, sends an email (with dead-letter queue retry on failure), and makes remediation actions available. The pipeline must deliver alerts within 5 minutes of detection (FR-F3-006). See also: *Alert*, *Alert Threshold*, *Dead-Letter Queue*, *SSE*.

**Alert Threshold**
A configurable numeric boundary for a monitored metric that, when breached, triggers an alert. PI-2 default thresholds: CPU >90% sustained for 5 minutes, RAM >90%, disk >85%. Thresholds are applied consistently across all monitored servers. A future iteration may support per-server custom thresholds. See also: *Alert*, *Alert Pipeline*, *Health Check*.

**App** *(short form of Application)*
An instance of a self-hostable application that has been deployed to a user's server through UnplugHQ. Each App is associated with one server and one app definition. An App has a lifecycle state (installing, running, stopped, unhealthy, updating). *Not to be confused with the App Definition* (the catalog template). See also: *App Definition*, *Deployment*.

**App Definition**
A curated, versioned specification in the UnplugHQ Application Catalog that describes how to deploy, configure, and manage a specific self-hostable software project. An App Definition includes: the upstream Docker image reference (pinned by digest), configurable parameters (defined as a `configSchema`), resource requirements, domain-routing rules, volume mounts, environment variables, and health-check configuration. A single App Definition can produce many App instances across servers. *Not the app itself — the blueprint for it.* See also: *App*, *Application Catalog*, *App Template*, *Config Schema*.

**App Template** *(also: Template)*
The declarative data structure within an App Definition that drives automated deployment. An App Template specifies: container image digest, config schema, resource requirements (min CPU, RAM, disk), port mappings, volume mounts, environment variable templates, Docker network membership, and health check URL. Templates are stored as versioned YAML in the repository and validated against the `CatalogApp` Zod schema. *The template enables deploying a new app to the catalog without code changes to the platform.* See also: *App Definition*, *Config Schema*, *Image Digest*.

**Application Catalog** *(also: Catalog)*
The curated set of App Definitions available for deployment within UnplugHQ. The catalog is maintained by UnplugHQ and covers a range of categories (file storage, analytics, CMS, email, password management, photo storage). The catalog presents each app with a description, category, resource requirements, and a link to the upstream open-source project. See also: *App Definition*.

**Audit Log**
A chronological record of actions performed by a user or the system within a user's account — covering provisioning, deployment, configuration changes, updates, and deletions. Retained for a minimum of 90 days.

**Automated CA** *(Certificate Authority)*
An automated, publicly trusted certificate authority used to issue SSL/TLS certificates during application deployment. Use of an automated CA (such as Let's Encrypt) is a system default. See also: *SSL Certificate*.

**Automatic Rollback**
A system-triggered recovery action that restores an application to its last known good state after a failed update or configuration change. Rollback occurs without user intervention when a post-change health check fails. See also: *Rollback*, *Health Check*, *Snapshot*.

---

## B

**Backup**
A persisted, restorable copy of an App's data and configuration, stored on the user's own server or in user-configured external storage. Backups are created on a schedule or immediately before a destructive operation such as an update. *UnplugHQ does not store backups on its own infrastructure.* See also: *Backup Integrity Verification*, *Snapshot*, *Data Sovereignty*.

**Backup Integrity Verification**
The automated process of confirming that a created backup is complete, uncorrupted, and restorable. Integrity verification runs after each backup is created. See also: *Backup*.

**Base Provisioning** *(also: Provisioning)*
The automated process by which UnplugHQ prepares a newly connected server for managed deployments by installing and configuring the required runtime components: a container runtime, a reverse proxy, and a monitoring agent. Base provisioning must be idempotent — it can be safely re-run on an already-provisioned server without harmful side effects. See also: *Container Runtime*, *Reverse Proxy*, *Monitoring Agent*, *Idempotent Provisioning*.

---

## C

**Caddy Admin API**
The localhost-bound HTTP API (port 2019) on the user's VPS used to programmatically manage reverse proxy routes. UnplugHQ accesses the Caddy Admin API via SSH-tunneled HTTP calls — never directly from the control plane. Route operations use a unique `@id` per app for targeted add/remove. See also: *Reverse Proxy*, *Caddy Route*.

**Caddy Route**
A single reverse proxy rule mapping a domain to a container's internal port. Each deployed app has one Caddy route identified by `@id: unplughq-{containerName}`. Routes are managed programmatically; the user never edits proxy configuration files. See also: *Caddy Admin API*, *Reverse Proxy*, *Domain*.

**Catalog** → see *Application Catalog*

**Certificate** → see *SSL Certificate*

**Configuration Export**
A downloadable package generated by UnplugHQ at the time of server disconnection. The export includes Docker Compose files, environment variable templates, reverse proxy configuration, and SSL renewal instructions — sufficient for the user to operate their self-hosted apps independently without UnplugHQ. See also: *Disconnect*, *Vendor Independence*.

**Config Schema**
A JSON array defined within an App Template that describes the per-app configuration fields shown to the user during guided configuration. Each entry specifies: key, label, input type (text, email, password, select, boolean), required flag, default value, and available options. The guided configuration UI is dynamically generated from the config schema — no per-app hardcoded UI exists. See also: *App Template*, *Guided Configuration*.

**Container**
A portable, self-contained unit of software that packages an application and its dependencies, enabling consistent execution across environments. UnplugHQ deploys self-hosted applications as containers using standard open-source container technology. See also: *Container Runtime*, *Deployment*.

**Container Runtime**
The software installed on a user's server during base provisioning that is responsible for running, stopping, and managing containers. The container runtime is a prerequisite for any application deployment through UnplugHQ. See also: *Container*, *Base Provisioning*.

**Control Plane**
The UnplugHQ infrastructure responsible for managing connections, coordinating deployments, and collecting health signals from user servers. The control plane stores only management metadata (server status, app status, configuration references, event timestamps) — it does not store user application data. *Distinct from the user's server (the data plane).* See also: *Data Sovereignty*, *Data Plane*.

---

## D

**Dashboard**
The primary authenticated view within UnplugHQ that displays server resource utilization (CPU, RAM, disk, network), per-app health status tiles, active alerts, and access links to deployed applications. The dashboard receives real-time updates via SSE and falls back to polling when SSE is unavailable. It is the daily check-in surface for the user. See also: *Health Status*, *SSE*, *Alert*.

**Data Plane**
The user's own VPS, where all application containers, user data, backups, and configuration live. The data plane is entirely under the user's ownership and control. UnplugHQ's control plane coordinates the data plane but never stores the data. See also: *Control Plane*, *Data Sovereignty*, *VPS*.

**Data Sovereignty**
The principle that all user application data remains exclusively on the user's own server (data plane) at all times. UnplugHQ's control plane processes configuration metadata and health signals only. No user application data — files, database records, emails, photos — is transmitted to or stored by UnplugHQ infrastructure. *Data sovereignty is a non-negotiable product constraint.* See also: *Control Plane*, *Data Plane*.

**Deployment**
The end-to-end process of instantiating an App on a user's server from an App Definition, including: pulling the container image, applying configuration, configuring reverse proxy routing, provisioning an SSL certificate, starting the container, and running a post-deployment health check. In PI-2, deployment is implemented as a BullMQ background job with an idempotent state machine tracking phases: pending → pulling → configuring → provisioning-ssl → starting → running (or failed). See also: *App*, *App Definition*, *Health Check*, *Deployment Job*, *Deployment Status*.

**Deployment Job**
A BullMQ background job that executes the app deployment pipeline on the user's VPS via SSH. Each deployment job tracks a `DeploymentStatus` state machine, supports resume-from-failure for idempotent retry, and emits SSE progress events to connected dashboard clients. Failed jobs perform cleanup of partially deployed resources (container, env file, Caddy route). See also: *Deployment*, *Deployment Status*, *BullMQ*.

**Deployment Status**
The current phase of a deployment job, represented as an enum: `pending`, `pulling`, `configuring`, `provisioning-ssl`, `starting`, `running`, `unhealthy`, `stopped`, `failed`, `removing`. Status transitions are atomic and persisted in the database. The dashboard and SSE events reflect the current deployment status. See also: *Deployment Job*, *Health Status*.

**Dead-Letter Queue**
A queue that holds failed alert email messages for retry processing. When the primary email dispatch fails, the message is placed in the dead-letter queue and retried up to 3 times with exponential backoff. This prevents silent alert loss. See also: *Alert Pipeline*, *Notification*.

**Disconnect**
The user-initiated process of removing UnplugHQ's management access from a server. After disconnection, the user's Apps continue running on their server independently. UnplugHQ generates a Configuration Export before disconnection. *No data is deleted from the server as a result of disconnecting.* See also: *Configuration Export*, *Vendor Independence*.

**DNS (Domain Name System)**
The distributed naming system that maps human-readable domain names (e.g., `nextcloud.example.com`) to IP addresses. DNS configuration is the user's responsibility (at their domain registrar). UnplugHQ validates that domains resolve correctly and guides users through DNS setup, but does not control DNS directly. See also: *Domain*, *SSL Certificate*.

**Docker Network**
A software-defined network (`unplughq`) created on the user's VPS during base provisioning. All deployed app containers join this network, enabling inter-container communication by container name while preventing direct host port exposure. The reverse proxy routes external traffic into the Docker network. See also: *Container*, *Port Isolation*, *Reverse Proxy*.

**Domain**
A human-readable address assigned to a deployed application (e.g., `files.example.com`). The user provides a domain during the app configuration step. UnplugHQ configures the reverse proxy and SSL certificate for the domain during deployment. See also: *DNS*, *Reverse Proxy*, *SSL Certificate*.

---

## G

**Guided Configuration**
The per-app setup wizard that collects only the inputs relevant to deploying a specific application. Guided configuration uses sensible defaults, plain-language labels, and contextual help — no Linux or Docker terminology is exposed to the user. The form is dynamically generated from the app template's config schema, enabling new apps to be added to the catalog without UI code changes. See also: *App Definition*, *Deployment*, *Config Schema*.

**Guided Remediation**
The dashboard-based workflow that converts an active alert into a series of non-technical, actionable steps the user can follow to resolve the issue. Remediation flows are defined per alert type (app restart for `app-unavailable`, disk cleanup for `disk-critical`, app stop or server upgrade for `cpu-critical` / `ram-critical`). The target is alert-to-resolution in <10 minutes for guided issues. See also: *Remediation Action*, *Alert*.

---

## H

**Health Check**
An automated test that verifies an application is running correctly. Health checks run: after deployment (post-deployment), after an update (post-update), after a rollback (post-rollback), and on a scheduled basis for ongoing monitoring. A health check passes when the application responds as expected; it fails when the application does not respond within a defined timeout. Post-deployment health checks issue an HTTP GET to the app's domain with 3 retries and 20-second timeout per attempt. See also: *Alert*, *Automatic Rollback*, *Monitoring Agent*, *Health Check Pipeline*.

**Health Check Pipeline**
The automated sequence from metric collection through threshold evaluation that determines whether a server or app requires an alert. The pipeline runs continuously: monitoring agent pushes metrics every 30 seconds; the control plane evaluates thresholds, generates alerts, fires SSE events, and dispatches email notifications. The pipeline includes self-monitoring (stale data detection at 120 seconds, server-unreachable alert at 300 seconds). See also: *Health Check*, *Alert Pipeline*, *Monitoring Agent*.

**Health Status**
The summarised operational state of a server or App at a given point in time. Health statuses for Apps include: running, stopped, unhealthy, updating, installing. Health statuses for servers include: connected, provisioning, unhealthy, disconnected. See also: *Health Check*, *Monitoring Agent*.

---

## I

**Idempotent Provisioning**
A provisioning operation that produces the same result regardless of how many times it is run. If base provisioning is re-run on an already-provisioned server, it must not duplicate components, corrupt configuration, or harm running applications. This property is required by BR-F1-003. See also: *Base Provisioning*.

**Image Digest**
A content-addressable SHA-256 hash that uniquely identifies a Docker container image, formatted as `sha256:{64 hex chars}`. UnplugHQ's app catalog references images by digest rather than mutable tags (e.g., `latest`) to prevent supply chain attacks. When a catalog app is updated to a new upstream version, the digest is re-pinned. See also: *App Template*, *Container*.

---

## M

**Managed App** → see *App*

**Monitoring Agent**
A lightweight software component installed on the user's server during base provisioning. The monitoring agent collects health signals (CPU, RAM, disk, network, container status) at regular intervals (every 30 seconds) and transmits them to the UnplugHQ control plane via HTTPS POST with per-server API token authentication. The monitoring agent must transmit only operational metrics — never user application data. The agent runs with minimal privileges (read-only Docker socket, read-only system metrics). See also: *Health Check*, *Control Plane*, *Data Sovereignty*, *Health Check Pipeline*.

**Multi-App Coexistence**
The capability for a user to deploy and run multiple apps on a single server without conflicts. Multi-app coexistence requires: port isolation (no host-bound ports), volume isolation (unique data paths per app), Docker network segmentation, and non-disruptive Caddy route management. The system tracks per-app resource consumption and alerts on aggregate resource thresholds. See also: *Port Isolation*, *Volume Mount*, *Docker Network*, *Resource Allocation*.

---

## N

**Notification**
A message sent by UnplugHQ to the user, either within the dashboard or via email. Notifications include informational events (deployment completed, update available) and alert-triggered events (app unavailable, disk usage high). *Distinct from an Alert*, which is specifically a threshold-breach event. See also: *Alert*.

---

## P

**Port Isolation**
The deployment constraint that no app container exposes ports directly to the host interface. All containers join the managed `unplughq` Docker network and are accessible only through the reverse proxy. This prevents port conflicts between multiple apps on the same server and reduces the attack surface. See also: *Docker Network*, *Reverse Proxy*, *Multi-App Coexistence*.

**Pre-Update Backup** → see *Snapshot*

**Provisioning** → see *Base Provisioning*

---

## R

**Remediation Action**
A guided, user-facing resolution step offered when an alert is active. Remediation actions are specific to the alert type: restart app (for `app-unavailable`), review disk usage per app (for `disk-critical`), stop low-priority apps (for `cpu-critical` or `ram-critical`). Actions use non-technical language and are executable from the dashboard without terminal access. See also: *Alert*, *Guided Remediation*.

**Resource Allocation**
The per-app and aggregate tracking of CPU, RAM, and disk usage on a user's server. Resource data comes from the monitoring agent's per-container metrics. The dashboard displays per-app resource contribution and aggregate server utilization. Resource pre-checks during deployment compare an app's minimum requirements against available capacity. See also: *Monitoring Agent*, *Dashboard*, *Multi-App Coexistence*.

**Reverse Proxy**
A server component installed during base provisioning that routes incoming HTTP/HTTPS requests by domain name to the correct application container. The reverse proxy also handles SSL termination, redirecting HTTP traffic to HTTPS. UnplugHQ manages reverse proxy configuration automatically — the user never edits proxy config files. See also: *Domain*, *SSL Certificate*, *Base Provisioning*.

**Rollback**
The restoration of an application to a previous state, using a backup snapshot, after a failed update or configuration change. Rollback may be automatic (triggered by a failed health check) or manual (user-initiated from the dashboard). See also: *Automatic Rollback*, *Snapshot*, *Health Check*.

---

## S

**Secrets Rotation**
The process of replacing SSH private keys and per-server API tokens with new credentials without disconnecting the server. Rotation invalidates the previous credential immediately and does not interrupt running apps or active monitoring. Rotation events are recorded in the audit log. See also: *SSH Key Pair*, *Monitoring Agent*, *Audit Log*.

**Self-Hosting**
The practice of running software applications on a server that the user owns or leases, rather than using a vendor's cloud-hosted service. Self-hosting gives the user direct control over their data, software version, and infrastructure. UnplugHQ removes the technical barriers to self-hosting for non-technical users.

**Server** *(also: VPS within the UnplugHQ context)*
A virtual machine rented from a hosting provider (VPS) that a user has connected to UnplugHQ. The server is the user's infrastructure — UnplugHQ manages it remotely via SSH during provisioning and through the monitoring agent thereafter. After disconnection, the server and its applications continue to operate independently. See also: *VPS*, *Base Provisioning*, *Data Plane*.

**Snapshot**
A point-in-time copy of an App's data and configuration, created immediately before a potentially destructive operation (such as an update). Snapshots are the pre-requisite for automatic rollback. Snapshots are stored on the user's server. See also: *Backup*, *Automatic Rollback*, *Rollback*.

**SSH (Secure Shell)**
A cryptographic network protocol used to establish a secure, authenticated connection to a remote server over an untrusted network. UnplugHQ uses SSH to execute base provisioning on a user's server. After provisioning, ongoing management uses the monitoring agent rather than direct SSH sessions where possible. See also: *SSH Key Pair*, *VPS*.

**SSH Key Pair**
A pair of cryptographic keys — a private key (held by the party initiating the connection) and a public key (installed on the server) — used for passwordless SSH authentication. The user generates an SSH key pair and installs the public key on their VPS before connecting to UnplugHQ. If UnplugHQ retains the private key for ongoing provisioning needs, it must be encrypted at rest. See also: *SSH*, *NFR-010*.

**SSL Certificate** *(also: TLS Certificate)*
A digital certificate that enables encrypted HTTPS communication between a user's browser and a deployed application. UnplugHQ automatically provisions an SSL certificate for each deployed app during the deployment flow, using an automated certificate authority. Certificates are renewed automatically before expiry. See also: *Automated CA*, *Domain*, *Reverse Proxy*.

**SSE (Server-Sent Events)**
A browser-native protocol for receiving real-time push events from the server over a persistent HTTP connection. UnplugHQ uses SSE to push dashboard updates: server status changes, deployment progress phases, metrics updates, alert creation, and alert dismissal. The SSE connection falls back to polling if unavailable. Events are scoped to the authenticated tenant — no cross-tenant events are pushed. See also: *Dashboard*, *Deployment Status*.

**Stale Data**
A dashboard state indicating that the most recent metrics from a server's monitoring agent are older than 120 seconds. The dashboard explicitly labels stale data rather than silently presenting outdated values as current. If no metrics are received for >300 seconds, a `server-unreachable` alert is generated. See also: *Monitoring Agent*, *Dashboard*, *Alert*.

---

## T

**Tenant**
A single UnplugHQ user account and all associated servers, deployed apps, backups, and settings. The platform is multi-tenant — each user's data and operations are isolated from all other users. Tenant isolation is a security requirement (R5). See also: *Control Plane*, *Data Sovereignty*.

**Threshold** → see *Alert Threshold*

---

## V

**Vendor Independence**
The product constraint that users can disconnect from UnplugHQ at any time and continue running their self-hosted applications without dependency on UnplugHQ infrastructure. Ensured by standard deployment formats (Docker), configuration export capability, and the principle that no application data resides on UnplugHQ servers. See also: *Disconnect*, *Configuration Export*, *Data Sovereignty*.

**Volume Mount**
A persistent storage binding between a Docker container and a directory on the host filesystem. Each deployed app's data is stored at a unique path (`/opt/unplughq/data/{containerName}/`) to ensure volume isolation between apps. No two apps share the same volume path unless the app template explicitly declares a shared dependency. See also: *Container*, *Port Isolation*, *Multi-App Coexistence*.

**VPS (Virtual Private Server)**
A virtual machine rented from a hosting provider that the user connects to UnplugHQ for managed deployment. VPS is the standard infrastructure unit in the self-hosting context. See also: *Server*, *Data Plane*.

---

## Glossary — PI-2 Quick Reference

> The following terms were added or significantly updated for PI-2. They are listed here for quick cross-reference; canonical definitions are in the alphabetical sections above.

| Term | Category | Added for |
|------|----------|----------|
| Alert Pipeline | Monitoring | F3 — AB#208 |
| Alert Threshold | Monitoring | F3 — AB#208 |
| App Template | Deployment | F2 — AB#202 |
| Caddy Admin API | Infrastructure | F2 — AB#206 |
| Caddy Route | Infrastructure | F2 — AB#206 |
| Config Schema | Deployment | F2 — AB#203 |
| Dashboard | UI | F3 — AB#207 |
| Dead-Letter Queue | Monitoring | F3 — AB#208 |
| Deployment Job | Deployment | F2 — AB#204 |
| Deployment Status | Deployment | F2 — AB#204 |
| Guided Remediation → Remediation Action | Monitoring | F3 — AB#209 |
| Health Check Pipeline | Monitoring | F3 — AB#207, AB#208 |
| Image Digest | Security | F2 — AB#202 |
| Multi-App Coexistence | Deployment | F2 — AB#206 |
| Port Isolation | Security | F2 — AB#206 |
| Resource Allocation | Monitoring | F2 — AB#206, F3 — AB#207 |
| Secrets Rotation | Security | Cross-cutting — AB#260 |
| SSE (Server-Sent Events) | Infrastructure | F3 — AB#207 |
| Stale Data | Monitoring | F3 — AB#207 |
| Vendor Independence | Architecture | Cross-cutting |
| Volume Mount | Deployment | F2 — AB#206 |

**Threshold**
A defined limit for a monitored metric (e.g., disk > 85%, CPU > 90%, RAM > 90%) that, when exceeded, triggers an Alert. Default thresholds are set by UnplugHQ; the user does not configure thresholds in PI-1 (a PI-2 feature). See also: *Alert*, *Monitoring Agent*.

---

## U

**Update**
The process of upgrading a deployed App to a new version by using an updated container image for its App Definition. Updates follow a safety-first lifecycle: check-notify-confirm-snapshot-apply-verify (or rollback). See also: *Automatic Rollback*, *Snapshot*, *Health Check*.

---

## V

**Vendor Independence** *(also: No Vendor Lock-in)*
The product guarantee that a UnplugHQ user's self-hosted applications are not dependent on UnplugHQ to remain operational. Apps are deployed using standard open-source formats (Docker). At any time, the user can disconnect from UnplugHQ, take their Configuration Export, and continue running apps without UnplugHQ. See also: *Disconnect*, *Configuration Export*, *SC6*.

**VPS (Virtual Private Server)**
A virtual machine hosted by a cloud infrastructure provider (e.g., DigitalOcean, Hetzner, Linode/Akamai, Vultr, OVHcloud) that the user rents. The VPS is the user's server — their data plane. UnplugHQ connects to a VPS via SSH to perform base provisioning and installs the monitoring agent for ongoing management. UnplugHQ does not sell or provide VPS compute. See also: *Server*, *SSH*, *Data Plane*.

---

## Glossary Maintenance

This glossary is a living document. When new domain-specific terms emerge during design, implementation, or testing, the term should be proposed to the Business Analyst for inclusion here. Misaligned usage of a defined term in any artifact is a quality concern and should be raised as a Business Analyst observation.

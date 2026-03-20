---
artifact: messaging-framework
produced-by: content-strategist
project-slug: unplughq
work-item: task-282-cs-pi2-content-strategy
work-item-type: task
parent-work-item: epic-001-unplughq-platform
workflow-tier: full
phase: P2
version: 2.0.0
status: draft
consumed-by:
  - ux-designer
  - frontend-developer
date: 2026-03-16
azure-devops-id: 282
---

# Messaging Framework

## Value Proposition
UnplugHQ brings the simplicity of modern software deployment to self-hosted apps. Connect your server, browse a curated catalog of open-source applications, and deploy them with a single click—we handle the installation, securing, monitoring, and maintenance without you ever needing to open a terminal or learn system administration.

## Tagline
Self-hosting, simplified. No terminal required.

## Elevator Pitch
UnplugHQ is an intuitive control panel for people who want data ownership without the DevOps burden. Whether you're tired of high SaaS subscriptions or seeking privacy, UnplugHQ lets you browse a curated catalog, deploy self-hosted applications to your own server, and monitor everything from a single dashboard. We turn complex infrastructure into a calm visual experience so you can focus on using your apps, not maintaining them.

## Message Hierarchy

| Priority | Audience | Key Message | Supporting Proof Points |
|----------|----------|-------------|-------------------------|
| 1 | Aspiring Self-Hoster | **You can do this.** Self-hosting doesn't require a computer science degree anymore. | <ul><li>Zero terminal commands</li><li>Guided visual setup</li><li>15-minute quick start</li></ul> |
| 2 | Privacy & Cost Conscious | **Own your data, keep your money.** Break free from recurring subscriptions and centralized data collection. | <ul><li>Your server, your rules</li><li>No vendor lock-in</li><li>Open-source apps</li></ul> |
| 3 | Technical Simplifier | **Stop babysitting servers.** Reclaim your weekends with automated maintenance. | <ul><li>Automated updates</li><li>Pre-update backups</li><li>Intelligent health monitoring</li></ul> |
| 4 | All Users | **Safe to experiment.** You can't break your server. We have your back. | <ul><li>Automatic rollbacks</li><li>Clear error resolution</li><li>Safe destructive actions</li></ul> |
| 5 | All Users | **One dashboard, full visibility.** Know the health of every app at a glance. | <ul><li>Real-time resource gauges</li><li>Per-app health badges</li><li>Proactive alerts with guided fixes</li></ul> |

---

## Domain Messaging — Application Catalog (AB#202)

### Core Narrative
The app catalog is UnplugHQ's storefront — a curated collection of open-source, self-hostable applications organized by what they do, not how they work. Every entry is vetted, every description is jargon-free, and every app can be deployed without reading a single README.

### Key Messages

| Context | Message | Rationale |
|---------|---------|-----------|
| Catalog entry point | **Browse apps for your server.** | Outcome-focused. Frames catalog as a personal resource, not a generic marketplace. |
| Empty search results | **No matches found. Try a different search term or browse by category.** | Recovery-focused. Guides without dead-ending. |
| Category framing | Categories named by user intent: "File Storage", "Analytics", "Content Management", "Password Management", "Photo Storage", "Email", "Communication", "Productivity". | Non-technical grouping. Users think in terms of what they want to accomplish. |
| App detail | Each app description answers: *What does it do? Who is it for? What does it replace?* | Connects self-hosted option to the SaaS equivalent the user already knows. |
| Resource requirements | Displayed as "Needs at least X GB RAM and Y GB storage." | Human-friendly units. No Docker or container terminology. |
| Upstream transparency | "Open-source project" link on every entry. | Builds trust. Aligns with data sovereignty message — users can verify what they're running. |

### Vocabulary

| Use | Avoid |
|-----|-------|
| App, application | Container, image, service |
| Browse, explore | Pull, fetch |
| Category | Namespace, registry |
| Install, deploy | Spin up, instantiate |
| Requirements | Minimum specs, resource constraints |

---

## Domain Messaging — Application Configuration (AB#203)

### Core Narrative
Configuration is the moment the user makes the app theirs. The guided flow asks only what matters — domain name, admin email, storage size — with sensible defaults already filled in. No YAML, no environment variables, no guesswork.

### Key Messages

| Context | Message | Rationale |
|---------|---------|-----------|
| Config wizard entry | **Set up [App Name] for your server.** | Personal, action-oriented. Names the app for continuity. |
| Field help text pattern | Explain what the setting controls, not what it maps to technically. | e.g., "The web address where you'll access this app." not "The FQDN for the reverse proxy virtual host." |
| Defaults | **We've filled in sensible defaults. Change only what you need.** | Reduces cognitive load. Empowers without overwhelming. |
| Config summary | **Review your settings before deploying.** | Transparency before commitment. Aligns with O6 (safe operations). |
| Server selection (multi-server) | **Choose which server to deploy to.** | Only shown when relevant. Single-server users skip this entirely. |
| Resource warning | **Your server may not have enough resources for this app. You can still deploy, but performance may be affected.** | Honest but non-blocking. Soft limit with informed consent. |

### Vocabulary

| Use | Avoid |
|-----|-------|
| Settings, configuration | Environment variables, env file |
| Web address, domain | FQDN, virtual host, hostname |
| Admin email | SMTP relay, mail config |
| Storage space | Volume mount, disk allocation |
| Step | Phase, stage |

---

## Domain Messaging — Deployment Progress (AB#204)

### Core Narrative
Deployment is where the magic happens — and the user deserves to see it. Real-time progress communicates what's happening in calm, human terms. The user stays informed without being overwhelmed. They can walk away and come back; the dashboard remembers where things stand.

### Key Messages

| Deployment Phase | User-Facing Label | Description Shown to User |
|------------------|-------------------|---------------------------|
| `pending` | Preparing | Getting everything ready for your app. |
| `pulling` | Downloading | Downloading your app. This may take a moment. |
| `configuring` | Configuring | Applying your settings. |
| `provisioning-ssl` | Securing | Setting up a secure connection for your domain. |
| `starting` | Starting | Starting your app. Almost there. |
| `running` | Running | Your app is live and ready to use. |
| `failed` | Something went wrong | We couldn't complete the deployment. See details below. |

### Key Messages — Deployment Lifecycle

| Context | Message | Rationale |
|---------|---------|-----------|
| Deployment started | **Deploying [App Name] to [Server Name].** | Confirms what's happening and where. |
| Background navigation | **You can leave this page. Your deployment continues in the background.** | Reduces anxiety. People don't need to watch. |
| DNS warning | **Your domain doesn't point to this server yet. The app will deploy, but it won't be reachable until DNS propagates.** | Honest, non-blocking. Explains without jargon. |
| Deployment complete | **[App Name] is running. You are officially self-hosting.** | Micro-delight. Celebrates the achievement. |
| Deployment failed | **Deployment didn't complete. [Specific reason]. No leftover files were left on your server.** | Recovery-focused. Reassures about cleanup. |

### Vocabulary

| Use | Avoid |
|-----|-------|
| Download | Pull image |
| Configure, apply settings | Inject environment variables |
| Secure connection | SSL certificate, TLS |
| Starting your app | Starting container |
| Deployment | Job, pipeline, orchestration |

---

## Domain Messaging — Post-Deployment Verification (AB#205)

### Core Narrative
After deployment, UnplugHQ automatically checks that the app is actually working — not just running, but reachable and responding. This is the trust-building moment: the system does the verification so the user doesn't have to.

### Key Messages

| Context | Message | Rationale |
|---------|---------|-----------|
| Verification running | **Checking that your app is reachable.** | Transparent. User knows what's happening. |
| Verification success | **Verified. [App Name] is responding at [URL].** | Confirms specific, actionable outcome. |
| Verification failed | **[App Name] deployed but isn't responding yet. This is often a DNS propagation delay.** | Honest but calm. Names the most common cause first. |
| Guided next steps (on failure) | **Check that your domain points to [Server IP]. DNS changes can take up to 48 hours.** | Specific, actionable, non-technical. |
| Access link | **Open [App Name]** | Direct. Link is the reward. |

---

## Domain Messaging — Multi-App Management (AB#206)

### Core Narrative
Self-hosting isn't a one-app story. Users build a personal cloud — file storage, analytics, a CMS, a password manager. UnplugHQ manages coexistence transparently: each app gets its own space, its own address, and its own health status. Adding a second app is as easy as the first.

### Key Messages

| Context | Message | Rationale |
|---------|---------|-----------|
| Second app prompt | **Your server is running [N] app(s). Add another?** | Contextual. Acknowledges existing state. |
| Non-disruptive deploy assurance | **Deploying a new app won't affect your running apps.** | Directly addresses the "will this break something?" fear. |
| Resource approaching capacity | **Your server is using [X]% of its resources. You can still deploy, but consider upgrading your server for the best experience.** | Informative, non-blocking. Empowers informed decision. |
| Per-app resource view | **Here's how your apps are using server resources.** | Transparency. Users see where capacity goes. |

---

## Domain Messaging — Dashboard & Health Monitoring (AB#207)

### Core Narrative
The dashboard is the user's daily touchpoint — a calm, glanceable overview that answers "Is everything okay?" in under three seconds. Green means healthy, amber means watch, red means act. No noise, no dashboards-of-dashboards, no metrics overload.

### Key Messages

| Context | Message | Rationale |
|---------|---------|-----------|
| Dashboard headline | **Your server at a glance.** | Calm, direct. Sets expectation of brevity. |
| All healthy | **Everything is running smoothly.** | Positive reinforcement. No unnecessary detail. |
| Empty dashboard (no apps) | **No apps running yet. Deploy your first application.** | Guides toward first value. Links to catalog. |
| Server resource gauges | Labeled as "CPU", "Memory", "Storage", "Network" with percentage. | Familiar terms. No acronyms beyond CPU. |
| Stale data indicator | **Data may be outdated. Last update: [timestamp].** | Transparent about freshness. Never shows stale data as current. |
| App tile pattern | [App Name] — [Status badge] — [Access link] | Scannable. Three pieces of information per app. |
| Status badges | Running, Stopped, Unhealthy, Updating | Four states, plain language. No technical status codes. |

### Vocabulary

| Use | Avoid |
|-----|-------|
| Memory | RAM |
| Storage | Disk |
| Healthy, running | Up, OK, 200 |
| Stopped | Exited, down |
| Unhealthy | Failed health check, unreachable |
| Updating | Restarting, rolling |

---

## Domain Messaging — Health Alert Notifications (AB#208)

### Core Narrative
Alerts are how UnplugHQ watches while the user doesn't have to. When something needs attention, the system tells the user clearly — what happened, how serious it is, and what they can do. Alerts are factual, not alarmist. Every alert has a next step.

### Key Messages — Alert Types

| Alert Type | Severity | Dashboard Title | Email Subject | Body Pattern |
|------------|----------|----------------|---------------|--------------|
| `disk-critical` | Critical | High storage usage | Storage running low on [Server] | Storage is at [X]%. [App Name] is using [Y] GB. Review your storage allocation. |
| `cpu-critical` | Critical | High CPU usage | CPU load elevated on [Server] | CPU usage has been above 90% for 5 minutes. Review which apps are consuming resources. |
| `ram-critical` | Critical | High memory usage | Memory pressure on [Server] | Memory usage is at [X]%. Consider stopping unused apps or upgrading your server. |
| `app-unavailable` | Critical | App not responding | [App Name] is not responding | [App Name] stopped responding at [time]. Check the app status on your dashboard. |
| `resource-warning` | Warning | Resources approaching capacity | Server resources at [X]% on [Server] | Your server is using [X]% of its [resource]. This is a heads-up — no action required yet. |
| `server-unreachable` | Critical | Server unreachable | Cannot reach [Server] | UnplugHQ hasn't received data from your server in over 5 minutes. Check your server's network connection. |

### Key Messages — Alert Lifecycle

| Context | Message | Rationale |
|---------|---------|-----------|
| New alert | **[Alert title]. [One-sentence explanation].** | Concise. Title + context in one view. |
| Alert acknowledged | **Acknowledged. This alert won't send repeat notifications.** | Confirms action. Sets expectation. |
| Alert dismissed | **Dismissed. This alert will return if the condition reoccurs.** | Transparent about re-trigger behavior. |
| Alert auto-resolved | **Resolved. [Resource] is back to normal levels.** | Closes the loop. Reduces lingering worry. |
| No active alerts | **No active alerts. Everything is running smoothly.** | Positive reinforcement in the alert space. |

### Alert Email Pattern
- Subject: [Severity icon-word] + human-readable summary (no codes)
- Body: What happened → How serious → What to do → Dashboard link
- Footer: "Manage notification preferences" link to account settings
- No UnplugHQ marketing in alert emails — utility only

---

## Domain Messaging — Guided Remediation (AB#209)

### Core Narrative
When something goes wrong, UnplugHQ doesn't just report the problem — it walks the user through fixing it. Remediation guidance uses the same calm, step-by-step approach as onboarding. The goal is resolution within 10 minutes for known issue types.

### Key Messages — Per Alert Type

| Alert Type | Remediation Headline | Guided Steps |
|------------|----------------------|--------------|
| `disk-critical` | **Free up storage space** | 1. Review which apps use the most storage (breakdown shown). 2. Remove files you no longer need from within each app. 3. If storage is still full, consider upgrading your server's disk. |
| `cpu-critical` | **Reduce CPU load** | 1. Review which apps are consuming the most CPU (breakdown shown). 2. Stop apps you're not actively using. 3. If load stays high, consider upgrading your server. |
| `ram-critical` | **Free up memory** | 1. Review which apps are using the most memory (breakdown shown). 2. Stop apps you're not actively using. 3. If memory stays high, consider upgrading your server. |
| `app-unavailable` | **Get [App Name] back online** | 1. Try restarting the app (one-click action). 2. If the restart doesn't help, check that your domain still points to your server. 3. If the problem persists, review the app's resource usage. |

### Remediation Tone Rules
- Use numbered steps, not paragraphs.
- Lead each step with an action verb.
- Never assume the user knows what caused the problem.
- Always end with an escalation path ("If this doesn't resolve it...").
- Keep total step count to 3–4 per remediation flow.

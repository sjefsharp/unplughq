---
artifact: copy-specs
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

# Microcopy Specifications

## Exception Decisions: Emoji Policy
- **No emojis** are permitted as visual decoration, status indicators, or bullet points across the UnplugHQ UI. This aligns with Design Token Standards and reinforces our calm, premium indie tool aesthetic.

## 1. Onboarding & Connection Flows

| Component | Element | Copy Text | Tone | Max Length | Notes |
|-----------|---------|-----------|------|------------|-------|
| Hero | Headline | Connect your server | Welcoming | 8 words | Outcome focused |
| Hero | Subheadline | Enter your IP address and SSH key to begin provisioning. | Instructive | 20 words | No fluff |
| Button | CTA | Connect server | Active | 3 words | |
| Loading | State | Validating credentials and checking server resources. | Calm | 15 words | Transparent progress |
| Error | Toast | Port 22 unreachable. Check your firewall rules and try again. | Recovery | 15 words | Actionable, no blame |

## 2. Application Catalog Browsing (AB#202)

| Component | Element | Copy Text | Tone | Max Length | Notes |
|-----------|---------|-----------|------|------------|-------|
| Hero | Headline | Browse apps for your server | Exploratory | 8 words | Outcome focused |
| Hero | Subheadline | Choose from our curated collection of open-source applications. | Instructive | 20 words | Emphasizes curation and open-source |
| Search | Placeholder | Search apps by name or description | Helpful | 8 words | |
| Filter | Label | Filter by category | Standard | 3 words | |
| Empty search | Message | No apps match your search. Try a different term or browse by category. | Recovery | 15 words | Guides, doesn't dead-end |
| Card | App name | [App Name] | Standard | 3 words | Dynamic |
| Card | Description | [One-sentence app description answering: what does it do?] | Informative | 20 words | Per-app; no jargon |
| Card | Category badge | [Category Name] | Standard | 3 words | e.g., "File Storage" |
| Card | Requirements | Needs [X] GB memory and [Y] GB storage | Informative | 12 words | Human-friendly units |
| Detail | Headline | [App Name] | Standard | 3 words | Dynamic |
| Detail | Description | [Multi-sentence description: what it does, who it's for, what SaaS it replaces] | Informative | 60 words | Per-app; connect to known SaaS |
| Detail | Upstream link | Open-source project | Transparent | 3 words | Opens in new tab |
| Detail | Version | Version [X.Y.Z] | Standard | 3 words | |
| Button | CTA | Deploy [App Name] | Active | 3 words | Dynamic app name |
| Empty catalog | Message | No apps available yet. Check back soon. | Encouraging | 10 words | Fallback |

## 3. Guided App Configuration (AB#203)

| Component | Element | Copy Text | Tone | Max Length | Notes |
|-----------|---------|-----------|------|------------|-------|
| Wizard | Headline | Set up [App Name] | Instructive | 5 words | Dynamic app name |
| Wizard | Subheadline | Answer a few questions to configure your app. | Encouraging | 12 words | Frames as short |
| Field | Domain label | Web address | Standard | 3 words | Not "FQDN" or "hostname" |
| Field | Domain help | The address where you'll access this app. | Helpful | 15 words | |
| Field | Email label | Admin email | Standard | 3 words | |
| Field | Email help | Used to create your app's administrator account. | Helpful | 15 words | |
| Field | Storage label | Storage space | Standard | 3 words | Not "volume mount" |
| Field | Storage help | How much disk space to allocate for this app's data. | Helpful | 15 words | |
| Defaults | Banner | We've filled in sensible defaults. Change only what you need. | Calm | 15 words | Reduces cognitive load |
| Server picker | Label | Deploy to | Standard | 3 words | Only shown for multi-server users |
| Server picker | Help | Choose which server to deploy this app on. | Helpful | 10 words | |
| Resource warning | Banner | Your server may not have enough resources for this app. You can still deploy, but performance may be affected. | Honest | 20 words | Non-blocking; soft limit |
| Summary | Headline | Review your settings | Instructive | 5 words | |
| Summary | Subheadline | Confirm everything looks right before deploying. | Calm | 10 words | Pre-commit transparency |
| Summary | Edit link | Edit | Active | 1 word | Per-section edit-back |
| Button | CTA | Deploy [App Name] | Active | 3 words | Final commit action |

## 4. Deployment Progress (AB#204)

| Component | Element | Copy Text | Tone | Max Length | Notes |
|-----------|---------|-----------|------|------------|-------|
| Progress | Headline | Deploying [App Name] to [Server Name] | Informative | 8 words | Dynamic names |
| Phase: pending | Label | Preparing | Calm | 1 word | |
| Phase: pending | Description | Getting everything ready for your app. | Calm | 10 words | |
| Phase: pulling | Label | Downloading | Calm | 1 word | Not "pulling image" |
| Phase: pulling | Description | Downloading your app. This may take a moment. | Calm | 10 words | |
| Phase: configuring | Label | Configuring | Calm | 1 word | |
| Phase: configuring | Description | Applying your settings. | Calm | 5 words | |
| Phase: provisioning-ssl | Label | Securing | Calm | 1 word | Not "provisioning SSL" |
| Phase: provisioning-ssl | Description | Setting up a secure connection for your domain. | Calm | 10 words | |
| Phase: starting | Label | Starting | Calm | 1 word | |
| Phase: starting | Description | Starting your app. Almost there. | Encouraging | 8 words | |
| Phase: running | Label | Running | Empowering | 1 word | |
| Phase: running | Description | Your app is live and ready to use. | Empowering | 10 words | |
| Phase: failed | Label | Something went wrong | Recovery | 5 words | Not "failed" |
| Phase: failed | Description | We couldn't complete the deployment. See details below. | Recovery | 12 words | |
| Background | Hint | You can leave this page. Deployment continues in the background. | Calm | 12 words | Reduces watch-anxiety |
| DNS warning | Banner | Your domain doesn't point to this server yet. The app will deploy, but it won't be reachable until DNS propagates. | Honest | 20 words | Non-blocking warning |
| Completion | Success | [App Name] is running. You are officially self-hosting. | Empowering | 12 words | Micro-delight |
| Completion | Failed | Deployment didn't complete. [Reason]. No leftover files were left on your server. | Recovery | 15 words | Reassures about cleanup |
| Button | Open app | Open [App Name] | Active | 3 words | Post-success action |
| Button | Retry | Try again | Active | 2 words | Post-failure action |

## 5. Post-Deployment Verification (AB#205)

| Component | Element | Copy Text | Tone | Max Length | Notes |
|-----------|---------|-----------|------|------------|-------|
| Verification | Running | Checking that your app is reachable. | Calm | 8 words | Auto-runs after deploy |
| Verification | Success | Verified. [App Name] is responding at [URL]. | Empowering | 10 words | Confirms specific URL |
| Verification | Failed | [App Name] deployed but isn't responding yet. | Honest | 10 words | Calm, not alarming |
| Guidance | DNS hint | Check that your domain points to [Server IP]. DNS changes can take up to 48 hours. | Recovery | 20 words | Most common failure cause |
| Guidance | General failure | Try redeploying or check your app's configuration. | Recovery | 10 words | Fallback guidance |
| Dashboard tile | Running status | Running | Standard | 1 word | Green badge |
| Dashboard tile | Failed status | Not responding | Standard | 2 words | Red badge |
| Dashboard tile | Access link | Open [App Name] | Active | 3 words | Only if running |

## 6. Multi-App Management (AB#206)

| Component | Element | Copy Text | Tone | Max Length | Notes |
|-----------|---------|-----------|------|------------|-------|
| Dashboard | App count | [N] apps running on [Server Name] | Informative | 8 words | Contextual count |
| Button | Add app CTA | Add another app | Encouraging | 3 words | |
| Assurance | Banner | Deploying a new app won't affect your running apps. | Reassuring | 12 words | Addresses fear of breakage |
| Resource | Warning 80% | Your server is using [X]% of its resources. | Informative | 12 words | Amber threshold |
| Resource | Suggestion | Consider upgrading your server for the best experience. | Helpful | 10 words | Non-blocking guidance |
| Resource | Per-app view | Here's how your apps are using server resources. | Helpful | 10 words | Per-app breakdown header |
| Per-app | Row | [App Name] — [CPU]% CPU, [RAM] MB memory, [Disk] GB storage | Informative | 15 words | Per-app resource row |

## 7. Dashboard Overview (AB#207)

| Component | Element | Copy Text | Tone | Max Length | Notes |
|-----------|---------|-----------|------|------------|-------|
| Header | Headline | Your server at a glance | Calm | 8 words | |
| Healthy | Banner | Everything is running smoothly. | Reassuring | 6 words | Shown when zero alerts |
| Empty | State | No apps running yet. Deploy your first application. | Encouraging | 12 words | Links to catalog |
| Gauge | CPU label | CPU | Standard | 1 word | |
| Gauge | Memory label | Memory | Standard | 1 word | Not "RAM" |
| Gauge | Storage label | Storage | Standard | 1 word | Not "Disk" |
| Gauge | Network label | Network | Standard | 1 word | |
| Gauge | Color: green | [Below 70%] | Calm | — | Green gauge fill |
| Gauge | Color: amber | [70–89%] | Cautious | — | Amber gauge fill |
| Gauge | Color: red | [90%+] | Alert | — | Red gauge fill |
| App tile | Pattern | [App Name] — [Status badge] — [Access link] | Scannable | 8 words | Three-piece pattern |
| Status badge | Running | Running | Standard | 1 word | Green |
| Status badge | Stopped | Stopped | Standard | 1 word | Gray |
| Status badge | Unhealthy | Unhealthy | Standard | 1 word | Red |
| Status badge | Updating | Updating | Standard | 1 word | Blue |
| Stale data | Indicator | Data may be outdated. Last update: [timestamp]. | Honest | 10 words | Never shows stale as current |
| Server unreachable | Banner | Can't reach your server. Check your server's network connection. | Recovery | 12 words | |

## 8. Health Alert Notifications (AB#208)

### Dashboard Alert List

| Component | Element | Copy Text | Tone | Max Length | Notes |
|-----------|---------|-----------|------|------------|-------|
| Alert list | Empty state | No active alerts. Everything is running smoothly. | Reassuring | 10 words | |
| Alert | Severity: critical | Critical | Alert | 1 word | Red badge |
| Alert | Severity: warning | Warning | Cautious | 1 word | Amber badge |
| Alert | Severity: info | Info | Calm | 1 word | Blue badge |
| Alert: disk | Title | High storage usage | Clear | 5 words | |
| Alert: disk | Body | Storage is at [X]%. [App Name] is using [Y] GB. | Factual | 15 words | |
| Alert: cpu | Title | High CPU usage | Clear | 5 words | |
| Alert: cpu | Body | CPU usage has been above 90% for 5 minutes. | Factual | 15 words | |
| Alert: ram | Title | High memory usage | Clear | 5 words | |
| Alert: ram | Body | Memory usage is at [X]%. | Factual | 10 words | |
| Alert: app-down | Title | [App Name] not responding | Clear | 5 words | Dynamic app name |
| Alert: app-down | Body | [App Name] stopped responding at [time]. | Factual | 10 words | |
| Alert: server | Title | Server unreachable | Clear | 3 words | |
| Alert: server | Body | No data received from your server in 5 minutes. | Factual | 12 words | |
| Button | Acknowledge | Acknowledge | Active | 1 word | |
| Button | Dismiss | Dismiss | Active | 1 word | |
| Tooltip | Acknowledge | Acknowledged. This alert won't send repeat notifications. | Informative | 10 words | |
| Tooltip | Dismiss | Dismissed. Returns if the condition reoccurs. | Informative | 10 words | |

### Alert Email Notifications

| Component | Element | Copy Text | Tone | Max Length | Notes |
|-----------|---------|-----------|------|------------|-------|
| Email | Subject: disk | Storage running low on [Server Name] | Clear | 8 words | |
| Email | Subject: cpu | CPU load elevated on [Server Name] | Clear | 8 words | |
| Email | Subject: ram | Memory pressure on [Server Name] | Clear | 8 words | |
| Email | Subject: app-down | [App Name] is not responding | Clear | 8 words | |
| Email | Subject: server | Cannot reach [Server Name] | Clear | 5 words | |
| Email | Body pattern | [What happened]. [How serious]. [What to do]. [Dashboard link]. | Recovery | 60 words | Structured: cause → severity → action → link |
| Email | CTA | View on dashboard | Active | 3 words | Deep-links to affected resource |
| Email | Footer | Manage notification preferences | Helpful | 3 words | Links to account settings |

## 9. Alert Management and Guided Remediation (AB#209)

### Alert Detail View

| Component | Element | Copy Text | Tone | Max Length | Notes |
|-----------|---------|-----------|------|------------|-------|
| Detail | Headline | [Alert title] | Clear | 5 words | Expanded view |
| Detail | Metric | [Resource] is at [X]% (threshold: [Y]%) | Factual | 12 words | Shows current vs. threshold |
| Detail | Affected | Affecting [Server/App Name] | Factual | 5 words | |
| Detail | Timestamp | Detected at [time] | Factual | 5 words | |

### Guided Remediation — Disk Critical

| Component | Element | Copy Text | Tone | Max Length | Notes |
|-----------|---------|-----------|------|------------|-------|
| Remediation | Headline | Free up storage space | Active | 5 words | |
| Step | 1 | Review which apps use the most storage. | Instructive | 10 words | Breakdown shown below |
| Step | 2 | Remove files you no longer need from within each app. | Instructive | 12 words | |
| Step | 3 | If storage is still full, consider upgrading your server's disk. | Helpful | 12 words | Escalation path |

### Guided Remediation — CPU Critical

| Component | Element | Copy Text | Tone | Max Length | Notes |
|-----------|---------|-----------|------|------------|-------|
| Remediation | Headline | Reduce CPU load | Active | 5 words | |
| Step | 1 | Review which apps are consuming the most CPU. | Instructive | 10 words | |
| Step | 2 | Stop apps you're not actively using. | Instructive | 8 words | |
| Step | 3 | If load stays high, consider upgrading your server. | Helpful | 10 words | |
| Button | Stop app | Stop [App Name] | Active | 3 words | Per-app action |

### Guided Remediation — RAM Critical

| Component | Element | Copy Text | Tone | Max Length | Notes |
|-----------|---------|-----------|------|------------|-------|
| Remediation | Headline | Free up memory | Active | 3 words | |
| Step | 1 | Review which apps are using the most memory. | Instructive | 10 words | |
| Step | 2 | Stop apps you're not actively using. | Instructive | 8 words | |
| Step | 3 | If memory stays high, consider upgrading your server. | Helpful | 10 words | |
| Button | Stop app | Stop [App Name] | Active | 3 words | Per-app action |

### Guided Remediation — App Unavailable

| Component | Element | Copy Text | Tone | Max Length | Notes |
|-----------|---------|-----------|------|------------|-------|
| Remediation | Headline | Get [App Name] back online | Active | 8 words | Dynamic app name |
| Step | 1 | Try restarting the app. | Instructive | 5 words | One-click restart button |
| Step | 2 | If the restart doesn't help, check that your domain points to your server. | Instructive | 15 words | |
| Step | 3 | If the problem persists, review the app's resource usage. | Helpful | 10 words | |
| Button | Restart | Restart [App Name] | Active | 3 words | One-click action |
| Restart | Success | [App Name] is back online. | Reassuring | 6 words | Auto-resolves alert |
| Restart | Failure | Restart didn't work. Try the next step. | Recovery | 8 words | Escalates |

## 10. Account Management

| Component | Element | Copy Text | Tone | Max Length | Notes |
|-----------|---------|-----------|------|------------|-------|
| Profile | Headline | Account settings | Standard | 5 words | |
| Form | Label | Notifications | Standard | 3 words | |
| Tooltip | Info | Receive emails when apps go offline or server resources run high. | Helpful | 15 words | Updated for alert emails |
| Action | Delete | Close account | Serious | 3 words | No guilt-tripping |

## Content Density Ceiling Checks

- **Headlines:** ≤ 8 words
- **Subheadlines:** ≤ 20 words
- **Error Messages:** ≤ 15 words
- **Empty States:** ≤ 20 words
- **Buttons / CTAs:** ≤ 3 words
- **Tooltips:** ≤ 15 words
- **Alert Titles:** ≤ 5 words
- **Alert Bodies:** ≤ 15 words
- **Deployment Phase Labels:** ≤ 1 word
- **Deployment Phase Descriptions:** ≤ 12 words
- **Remediation Steps:** ≤ 15 words
- **Email Subjects:** ≤ 8 words

---
artifact: wireframes
produced-by: ux-designer
project-slug: unplughq
work-item: epic-001-unplughq-platform
parent-work-item: epic-001-unplughq-platform
work-item-type: epic
workflow-tier: full
phase: P2
version: 2.0.0
status: draft
consumed-by:
  - frontend-developer
  - accessibility
date: 2026-03-16
azure-devops-id: 283
---

# UnplugHQ Wireframes & Layout Specifications

This document contains structural ASCII wireframes and layout specifications for all screens of UnplugHQ. Screens 1–10 cover PI-1 (Server Connection & User Identity). Screens 11–19 cover PI-2 Sprint 2 (Application Catalog & Deployment, Dashboard & Health Monitoring).

**Global Navigation & Structure (Desktop)**
- **Sidebar (Left):** Fixed. 260px wide (collapses to hamburger below 1024px). Contains Logo, App Navigation (Dashboard, Marketplace, Settings), Server Status at bottom.
- **Top Bar:** Breadcrumbs, Search, User Profile, Notifications.
- **Content Area:** Centered, `max-width: 1200px` within the remaining width.

**Global Navigation & Structure (Mobile)**
- **Top Header:** Hamburger Menu, Logo, Notifications.
- **Content Area:** Full width with `16px` gutters.
- **Bottom Navigation:** Removed. Relies on drawer navigation.

---

## 1. Onboarding: Welcome
**Path:** `/welcome`
**Purpose:** Reassuring start to the journey. Explains what's about to happen.

```text
+-----------------------------------------------------------------------------+
|                                UnplugHQ Logo                                |
+-----------------------------------------------------------------------------+
|                                                                             |
|                                                                             |
|                           [ Illustration: Calm Server ]                     |
|                                                                             |
|                           Welcome to your private cloud                     |
|                                                                             |
|            We'll help you connect your server securely, and have            |
|            your first application running in under 15 minutes.              |
|                                                                             |
|             +-------------------------------------------------+             |
|             | What you'll need:                               |             |
|             | [x] A server (VPS) IP address                   |             |
|             | [x] SSH login credentials (Key or Password)     |             |
|             +-------------------------------------------------+             |
|                                                                             |
|                      [ Connect Your Server -> ] (Primary)                   |
|                                                                             |
+-----------------------------------------------------------------------------+
```
**Interactions:** 
- Button click starts the Connection Wizard flow.
- "What you'll need" list fades in sequentially with a stagger (`--dur-base`).

---

## 2. Server Connection Wizard (Step 1: Credentials)
**Path:** `/connect/credentials`
**Purpose:** Collect IP and SSH keys with high confidence and minimal jargon.

```text
+-----------------------------------------------------------------------------+
| [< Back ]                                                     [Step 1 of 3] |
+-----------------------------------------------------------------------------+
|                                                                             |
|   Connect your server                                                       |
|   Where does your server live? Enter the IP and login details.              |
|                                                                             |
|   +---------------------------------------------------------------------+   |
|   | IPv4 or IPv6 Address                                                |   |
|   | [ 192.168.1.100                                                ]    |   |
|   +---------------------------------------------------------------------+   |
|                                                                             |
|   Authentication Method:                                                    |
|   ( ) Password   (*) SSH Key (Recommended)                                  |
|                                                                             |
|   +---------------------------------------------------------------------+   |
|   | SSH Username                                                        |   |
|   | [ root                                                         ]    |   |
|   +---------------------------------------------------------------------+   |
|                                                                             |
|   +---------------------------------------------------------------------+   |
|   | Private Key                                                         |   |
|   | [ -----BEGIN OPENSSH PRIVATE KEY-----                          ]    |   |
|   | [ ...                                                          ]    |   |
|   | [ -----END OPENSSH PRIVATE KEY-----                            ]    |   |
|   +---------------------------------------------------------------------+   |
|                                                                             |
|   [ Test Connection ] (Primary)                                             |
|                                                                             |
+-----------------------------------------------------------------------------+
```
**Layout:** 1-column layout, max-width forms to `560px`.
**Interactions:** Hover states on inputs. Upload file drop-zone invisible overlay for the textarea.

---

## 3. Server Connection Wizard (Step 2: Validation & System Specs)
**Path:** `/connect/validation`
**Purpose:** Provide instant feedback that connection succeeded, show system resources to build trust (the "Aha" magic moment).

```text
+-----------------------------------------------------------------------------+
| [< Back ]                                                     [Step 2 of 3] |
+-----------------------------------------------------------------------------+
|                                                                             |
|   Connection Successful!                                                    |
|   We successfully talked to your server via SSH.                            |
|                                                                             |
|   [ Animated Pulse Ring with Checkmark ] (Success Token)                    |
|                                                                             |
|   Server Resources Detected:                                                |
|   +--------------------------+  +--------------------------+                |
|   | CPU                      |  | RAM                      |                |
|   | 4 Cores (AMD EPYC)       |  | 8GB Total                |                |
|   +--------------------------+  +--------------------------+                |
|   +--------------------------+  +--------------------------+                |
|   | Storage                  |  | OS                       |                |
|   | 80GB (nvme)              |  | Ubuntu 24.04 LTS         |                |
|   +--------------------------+  +--------------------------+                |
|                                                                             |
|   [ Continue to Setup -> ]                                                  |
|                                                                             |
+-----------------------------------------------------------------------------+
```
**Layout:** 2-column grid for specs on desktop, 1-column on mobile.
**Interactions:** Specs enter with staggered fade-in + scale-up (`--ease-spring`).

---

## 4. Main Dashboard (Zero State -> Populated)
**Path:** `/dashboard`
**Purpose:** The central hub. At a glance, the user should know if everything is okay.

```text
+-----------------+-----------------------------------------------------------+
| UNPLUGHQ     [=]| Dashboard                                        [O] [U]  |
+-----------------+-----------------------------------------------------------+
|                 |                                                           |
| [O] Dashboard   |  Server Status: (*) Healthy (Pulse Ring)                  |
| [M] Marketplace |  CPU: 12% | RAM: 45% | Disk: 30%            [ Restart ]   |
| [S] Settings    |                                                           |
|                 |  +-----------------------------------------------------+  |
|                 |  | [!] 1 Update Available (Nextcloud)        [Review]  |  |
|                 |  +-----------------------------------------------------+  |
|                 |                                                           |
|                 |  Your Applications                       [ + Add App ]    |
| SERVER          |  +-----------------------+ +-----------------------+      |
| (\) 192.168.1.1 |  | [Icon] Nextcloud      | | [Icon] Plausible      |      |
| (*) Healthy     |  | (*) Running           | | (*) Running           |      |
|                 |  | https://files.my.dev  | | https://stats.my.dev  |      |
|                 |  |                       | |                       |      |
| [ Log out ]     |  | [ Manage ]      [...] | | [ Manage ]      [...] |      |
|                 |  +-----------------------+ +-----------------------+      |
|                 |                                                           |
+-----------------+-----------------------------------------------------------+
```
**Layout:**
- CSS Grid for Apps: `grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))`. Gap: `var(--space-6)`.
**Interactions:**
- App Cards use Level 1 Elevation at rest, Level 2 on hover.
- Kebab menu `[...]` opens Contextual Menu (Start, Stop, Restart, Uninstall).

---

## 5. App Marketplace Browse
**Path:** `/marketplace`
**Purpose:** App discovery. Looks like an App Store, entirely hiding the "Docker" reality.

```text
+-----------------+-----------------------------------------------------------+
| UNPLUGHQ     [=]| Marketplace                                      [O] [U]  |
+-----------------+-----------------------------------------------------------+
|                 |                                                           |
| [O] Dashboard   |  Discover Applications                                    |
| [M] Marketplace |  [ Search for apps, e.g., 'Email', 'Notes'... ]           |
| [S] Settings    |                                                           |
|                 |  Categories: [All] [Productivity] [Storage] [Data]        |
|                 |                                                           |
|                 |  Featured:                                                |
| SERVER          |  +-----------------------+ +-----------------------+      |
| (\) 192.168.1.1 |  | [Icon] Ghost          | | [Icon] Bitwarden      |      |
| (*) Healthy     |  | Blogging platform     | | Password manager      |      |
|                 |  | [ Install ]           | | [ Install ]           |      |
|                 |  +-----------------------+ +-----------------------+      |
| [ Log out ]     |                                                           |
|                 |  +-----------------------+ +-----------------------+      |
|                 |  | [Icon] Nginx Prox...  | | [Icon] Calibre        |      |
|                 |  | Reverse Proxy utils   | | E-book Library        |      |
|                 |  | [ Install ]           | | [ Install ]           |      |
|                 |  +-----------------------+ +-----------------------+      |
+-----------------+-----------------------------------------------------------+
```

---

## 6. App Detail / Install Configuration
**Path:** `/marketplace/app/nextcloud`
**Purpose:** Guide the user through app-specific configuration BEFORE deploying. Strip away internal container environment variables and only ask human questions.

```text
+-----------------+-----------------------------------------------------------+
| UNPLUGHQ     [=]| < Back to Marketplace                            [O] [U]  |
+-----------------+-----------------------------------------------------------+
|                 |                                                           |
| [O] Dashboard   |  [Icon] Nextcloud                                         |
|                 |  The open source file sync and share platform.            |
|                 |                                                           |
|                 |  Configuration:                                           |
|                 |  +-----------------------------------------------------+  |
|                 |  | Subdomain / URL                                     |  |
|                 |  | [ files.mydomain.com                              ] |  |
|                 |  +-----------------------------------------------------+  |
|                 |                                                           |
|                 |  +-----------------------------------------------------+  |
|                 |  | Admin Email                                         |  |
|                 |  | [ me@mydomain.com                                 ] |  |
|                 |  +-----------------------------------------------------+  |
|                 |                                                           |
|                 |  Advanced Settings (Disabled by Default) [+]              |
|                 |                                                           |
|                 |  [ Deploy Application ] (Primary) [ Cancel ]              |
|                 |                                                           |
+-----------------+-----------------------------------------------------------+
```
**Layout:** Form fields are stacked, `max-width: 600px` for readability.
**Interactions:** Advanced Settings is an Accordion/Disclosure widget.

---

## 7. Deployment Progress Modal
**Path:** Overlays the deployment screen.
**Purpose:** Reassure the user during the 30-180 second wait time. Show live feedback so they don't think it's frozen.

```text
+-----------------------------------------------------------------------------+
|                                                                             |
|      +---------------------------------------------------------------+      |
|      |  Deploying Nextcloud...                                       |      |
|      |                                                               |      |
|      |  [=====-------]  (Progress Bar filling, --ease-standard)      |      |
|      |                                                               |      |
|      |  Current task: [ Pulling container image 'nextcloud:latest' ] |      |
|      |                                                               |      |
|      |  > Fetching blob 827364...                                    |      |
|      |  > Extracting fs layer...                                     |      |
|      |  (subtle live terminal logs streaming, height strictly 80px)  |      |
|      +---------------------------------------------------------------+      |
|                                                                             |
+-----------------------------------------------------------------------------+
```
**Modal Characteristics:** Locks background (`backdrop-filter: blur`), `aria-live` region active. Cannot be dismissed by clicking outside during critical operations.

---

## 8. App Management
**Path:** `/dashboard/app/nextcloud`
**Purpose:** Detailed view of a running app. Allows restarts, updates, and environment changes.

```text
+-----------------+-----------------------------------------------------------+
| UNPLUGHQ     [=]| Dashboard > Nextcloud                            [O] [U]  |
+-----------------+-----------------------------------------------------------+
|                 |                                                           |
| [O] Dashboard   |  [Icon] Nextcloud            (*) Healthy  [Open App >]    |
|                 |  URL: https://files.my.dev                                |
|                 |                                                           |
|                 |  [ Stop ] [ Restart ] [ Uninstall ]                       |
|                 |                                                           |
|                 |  +------------------+ +------------------+                |
|                 |  | Resource Usage   | | Backups          |                |
|                 |  | CPU: 2%          | | Last: 2 hours ago|                |
|                 |  | RAM: 512MB       | | Status: Healthy  |                |
|                 |  | [View Graph]     | | [Restore ]       |                |
|                 |  +------------------+ +------------------+                |
|                 |                                                           |
|                 |  Environment Variables  [Edit]                            |
|                 |  ADMIN_EMAIL: m***@***.com (Masked)                       |
|                 |  DOMAIN: files.my.dev                                     |
|                 |                                                           |
+-----------------+-----------------------------------------------------------+
```
**Layout:** Twin panels for quick stats. Action row at the top near the title.

---

## 9. Server Health Detail
**Path:** `/dashboard/server`
**Purpose:** Visualize server-wide metrics and trigger server-wide actions.

```text
+-----------------+-----------------------------------------------------------+
| UNPLUGHQ     [=]| Server Dashboard                                 [O] [U]  |
+-----------------+-----------------------------------------------------------+
|                 |                                                           |
| [O] Dashboard   |  Server: 192.168.1.100              [ Disconnect Server ] |
|                 |             ^ Copy Icon                                   |
|                 |  Uptime: 45 Days                                          |
|                 |                                                           |
|                 |  Resource Utilization (24h)                               |
|                 |  +-----------------------------------------------------+  |
|                 |  | CPU Usage Graph       (Sparkline Line Chart)        |  |
|                 |  |                 /\                        --        |  |
|                 |  | _____----/ \___/  \____/\_/\_____/  \____           |  |
|                 |  +-----------------------------------------------------+  |
|                 |                                                           |
|                 |  +-----------------------------------------------------+  |
|                 |  | RAM Usage Graph                                     |  |
|                 |  +-----------------------------------------------------+  |
|                 |                                                           |
|                 |  Recent Activity                                          |
|                 |  today 10:00 AM - Nextcloud Backed Up                     |
|                 |  yesterday      - UnplugHQ Control Agent updated          |
|                 |                                                           |
+-----------------+-----------------------------------------------------------+
```
**Graph Rules:** Stroke 2px, fill gradient 20% opacity using `--color-primary-base`. Tooltip on hover shows precise time/value.

---

## 10. Global Settings & Notifications
**Path:** `/settings`
**Purpose:** Manage account, API keys, platform preferences.

```text
+-----------------+-----------------------------------------------------------+
| UNPLUGHQ     [=]| Settings                                         [O] [U]  |
+-----------------+-----------------------------------------------------------+
|                 |                                                           |
| [O] Dashboard   |  [ Account ]  [ Notifications ]  [ Danger Zone ]          |
| [M] Marketplace |                                                           |
| [S] Settings    |  Notification Preferences:                                |
|                 |                                                           |
|                 |  [x] Email me about failed backups                        |
|                 |  [x] Email me about system updates                        |
|                 |  [ ] Send weekly digest                                   |
|                 |                                                           |
|                 |  +-----------------------------------------------------+  |
|                 |  | Set up Telegram / Discord Alerts                    |  |
|                 |  | We can ping your phone when critical apps drop.     |  |
|                 |  | [ Configure Webhooks ]                              |  |
|                 |  +-----------------------------------------------------+  |
|                 |                                                           |
|                 |  Theme Preference:                                        |
|                 |  ( ) Light    ( ) Dark    (*) System                      |
|                 |                                                           |
|                 |  [ Save Changes ] (Primary)                               |
|                 |                                                           |
+-----------------+-----------------------------------------------------------+
```
**Layout:** Vertical tabs or horizontal pill tabs for Settings sections. Forms use consistent 44px height patterns. Layout maxes out at `800px` reading width.

---
**Summary Check:** 
- Mobile First? Yes (CSS Grid stack rules documented).
- WCAG AA? Addressed via color contrast in Design System and aria labels here.
- Keyboard Nav? Modals trap focus, buttons have explicit focus rings.

---

## PI-2 Sprint 2 Screens

---

## 11. App Catalog Browse & Search (AB#202)
**Path:** `/catalog`
**Purpose:** Browse curated self-hostable apps. Search by name/description, filter by category. Hides all Docker/container implementation.

```text
+-----------------+-----------------------------------------------------------+
| UNPLUGHQ     [=]| Catalog                                 [Search] [O] [U]  |
+-----------------+-----------------------------------------------------------+
|                 |                                                           |
| [O] Dashboard   |  Browse apps for your server                              |
| [C] Catalog     |  Choose from our curated collection of open-source apps.  |
| [S] Settings    |                                                           |
|                 |  [ Search apps by name or description...          ] [Q]   |
|                 |                                                           |
|                 |  [All] [File Storage] [Analytics] [CMS] [Passwords] [>]   |
|                 |                                                           |
|                 |  +-----------------------+ +-----------------------+      |
|                 |  | [Icon] Nextcloud      | | [Icon] Plausible      |      |
|                 |  | File sync & share     | | Privacy-friendly      |      |
|                 |  | platform              | | web analytics          |      |
|                 |  | [File Storage]        | | [Analytics]           |      |
|                 |  | Needs 2GB, 10GB disk  | | Needs 1GB, 5GB disk   |      |
|                 |  |        [Deploy ->]    | |        [Deploy ->]    |      |
|                 |  +-----------------------+ +-----------------------+      |
|                 |                                                           |
|                 |  +-----------------------+ +-----------------------+      |
|                 |  | [Icon] Vaultwarden    | | [Icon] Ghost          |      |
|                 |  | Lightweight password  | | Professional          |      |
|                 |  | manager               | | publishing platform   |      |
|                 |  | [Passwords]           | | [CMS]                 |      |
|                 |  | Needs 512MB, 1GB disk | | Needs 1GB, 5GB disk   |      |
|                 |  |        [Deploy ->]    | |        [Deploy ->]    |      |
|                 |  +-----------------------+ +-----------------------+      |
|                 |                                                           |
|                 |  +-----------------------+ +-----------------------+      |
|                 |  | [Icon] Immich         | | [Icon] Gitea          |      |
|                 |  | Self-hosted photo     | | Lightweight Git       |      |
|                 |  | backup                | | hosting service       |      |
|                 |  | [Photo Storage]       | | [Productivity]        |      |
|                 |  | Needs 4GB, 20GB disk  | | Needs 1GB, 5GB disk   |      |
|                 |  |        [Deploy ->]    | |        [Deploy ->]    |      |
|                 |  +-----------------------+ +-----------------------+      |
|                 |                                                           |
+-----------------+-----------------------------------------------------------+
```
**Layout:** `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`. Gap `--space-6`.
**Interactions:** 
- Search is debounced (300ms). Filters are instant toggle.
- Category chips scroll horizontally on mobile.
- Cards use Level 1 → Level 2 elevation on hover.
- Empty search state: centered "No apps match your search." message with suggestion.

---

## 12. App Detail Page (AB#202)
**Path:** `/catalog/[app-slug]`
**Purpose:** Full information about a single app — what it does, who it's for, what SaaS it replaces, resource needs. Replaces the PI-1 inline install configuration.

```text
+-----------------+-----------------------------------------------------------+
| UNPLUGHQ     [=]| Catalog > Nextcloud                              [O] [U]  |
+-----------------+-----------------------------------------------------------+
|                 |                                                           |
| [O] Dashboard   |  +---------------------+  +---------------------------+  |
| [C] Catalog     |  | [Icon 64x64]        |  |  Requirements             |  |
| [S] Settings    |  |  Nextcloud           |  |  +-----------------------+ |  |
|                 |  |  [File Storage]      |  |  | Memory:  2 GB         | |  |
|                 |  +---------------------+  |  | Storage: 10 GB        | |  |
|                 |                            |  | CPU:     1 core       | |  |
|                 |  Nextcloud is the most     |  +-----------------------+ |  |
|                 |  popular self-hosted file   |  |                         |  |
|                 |  sync and share platform.   |  |  Version 28.0.4        |  |
|                 |  It replaces Dropbox,       |  |                         |  |
|                 |  Google Drive, and          |  |  [Open-source project] ↗|  |
|                 |  OneDrive with your own     |  |                         |  |
|                 |  private cloud storage.     |  | +---------------------+ |  |
|                 |                             |  | | Deploy Nextcloud    | |  |
|                 |  What it replaces:          |  | +---------------------+ |  |
|                 |  +----------------------+   +---------------------------+  |
|                 |  | Dropbox, Google Drive|                                  |
|                 |  | OneDrive, iCloud     |                                  |
|                 |  +----------------------+                                  |
|                 |                                                           |
+-----------------+-----------------------------------------------------------+
```
**Layout:** Two-column (60/40) on desktop. Single column stacked on mobile (requirements box moves above description).
**Interactions:**
- "Deploy Nextcloud" navigates to configuration wizard.
- "Open-source project" link opens upstream repo in new tab.
- Back navigation via breadcrumb "Catalog".

---

## 13. App Configuration Wizard — Multi-Step (AB#203)
**Path:** `/catalog/[app-slug]/configure`
**Purpose:** Collect per-app settings with sensible defaults. Dynamic form from `configSchema`. Max 5 steps.

### Step 1: Server Selection (multi-server only)
```text
+-----------------------------------------------------------------------------+
| < Back to Nextcloud                                         [Step 1 of 4]   |
+-----------------------------------------------------------------------------+
|                                                                             |
|              (1)-----(2)-----(3)-----(4)                                     |
|              [*]     [ ]     [ ]     [ ]                                    |
|           Server   Settings  Review  Deploy                                 |
|                                                                             |
|   +---------------------------------------------------------------------+   |
|   |                                                                     |   |
|   |  Deploy to                                                          |   |
|   |  Choose which server to deploy this app on.                         |   |
|   |                                                                     |   |
|   |  +------------------------------+ +------------------------------+  |   |
|   |  | (*) My Production Server     | | ( ) Dev Server               |  |   |
|   |  |     192.168.1.100            | |     10.0.0.5                 |  |   |
|   |  |     4 CPU, 8GB, 60GB free    | |     2 CPU, 4GB, 30GB free   |  |   |
|   |  |     (*) Healthy              | |     (*) Healthy              |  |   |
|   |  +------------------------------+ +------------------------------+  |   |
|   |                                                                     |   |
|   +---------------------------------------------------------------------+   |
|                                                                             |
|                                                      [ Continue -> ]        |
+-----------------------------------------------------------------------------+
```

### Step 2: Domain & Core Settings
```text
+-----------------------------------------------------------------------------+
| < Back                                                      [Step 2 of 4]   |
+-----------------------------------------------------------------------------+
|                                                                             |
|              (1)-----(2)-----(3)-----(4)                                     |
|              [✓]     [*]     [ ]     [ ]                                    |
|           Server   Settings  Review  Deploy                                 |
|                                                                             |
|   +---------------------------------------------------------------------+   |
|   | ℹ We've filled in sensible defaults. Change only what you need.     |   |
|   +---------------------------------------------------------------------+   |
|                                                                             |
|   +---------------------------------------------------------------------+   |
|   | Web address                                                         |   |
|   | The address where you'll access this app.                           |   |
|   | [ files.mydomain.com                                            ]   |   |
|   +---------------------------------------------------------------------+   |
|                                                                             |
|   +---------------------------------------------------------------------+   |
|   | Admin email                                                         |   |
|   | Used to create your app's administrator account.                    |   |
|   | [ me@mydomain.com                                               ]   |   |
|   +---------------------------------------------------------------------+   |
|                                                                             |
|   +---------------------------------------------------------------------+   |
|   | Storage space                                                       |   |
|   | How much disk space to allocate for this app's data.                |   |
|   | [ 10 GB                                                         ]   |   |
|   +---------------------------------------------------------------------+   |
|                                                                             |
|   ⚠ Your server may not have enough resources for this app.                 |
|     You can still deploy, but performance may be affected.                  |
|                                                                             |
|                                          [ < Back ]   [ Continue -> ]       |
+-----------------------------------------------------------------------------+
```

### Step 3: Configuration Summary / Review
```text
+-----------------------------------------------------------------------------+
| < Back                                                      [Step 3 of 4]   |
+-----------------------------------------------------------------------------+
|                                                                             |
|              (1)-----(2)-----(3)-----(4)                                     |
|              [✓]     [✓]     [*]     [ ]                                    |
|           Server   Settings  Review  Deploy                                 |
|                                                                             |
|   Review your settings                                                      |
|   Confirm everything looks right before deploying.                          |
|                                                                             |
|   +---------------------------------------------------------------------+   |
|   |  SERVER                                              [ Edit ]       |   |
|   |  My Production Server (192.168.1.100)                               |   |
|   |                                                                     |   |
|   |  SETTINGS                                            [ Edit ]       |   |
|   |  Web address:     files.mydomain.com                                |   |
|   |  Admin email:     me@mydomain.com                                   |   |
|   |  Storage space:   10 GB                                             |   |
|   +---------------------------------------------------------------------+   |
|                                                                             |
|                                      [ < Back ]  [ Deploy Nextcloud -> ]    |
+-----------------------------------------------------------------------------+
```
**Layout:** `max-width: 640px`, centered. Step indicator horizontal at top.
**Interactions:** 
- "Edit" links on summary navigate back to the relevant step, preserving all entered values.
- "Deploy" button triggers deployment and navigates to deployment progress screen.
- Resource warning banner appears conditionally.
- Back preserves form state — no data loss on navigation.

---

## 14. Deployment Progress Screen (AB#204)
**Path:** `/deployments/[deployment-id]`
**Purpose:** Real-time SSE-driven progress display. Show each deployment phase in plain language. The user's "magic moment" screen.

```text
+-----------------+-----------------------------------------------------------+
| UNPLUGHQ     [=]| Deploying Nextcloud                              [O] [U]  |
+-----------------+-----------------------------------------------------------+
|                 |                                                           |
| [O] Dashboard   |  Deploying Nextcloud to My Production Server              |
| [C] Catalog     |                                                           |
| [S] Settings    |  [=============================-------------------] 60%   |
|                 |                                                           |
|                 |  +-----------------------------------------------------+  |
|                 |  |  [✓] Preparing                                      |  |
|                 |  |      Getting everything ready for your app.          |  |
|                 |  |      |                                               |  |
|                 |  |  [✓] Downloading                                    |  |
|                 |  |      Your app has been downloaded.                   |  |
|                 |  |      |                                               |  |
|                 |  |  [✓] Configuring                                    |  |
|                 |  |      Your settings have been applied.                |  |
|                 |  |      |                                               |  |
|                 |  |  [*] Securing           (Pulse Ring animation)       |  |
|                 |  |      Setting up a secure connection for your domain. |  |
|                 |  |      :                                               |  |
|                 |  |  [ ] Starting                                       |  |
|                 |  |      :                                               |  |
|                 |  |  [ ] Running                                        |  |
|                 |  +-----------------------------------------------------+  |
|                 |                                                           |
|                 |  ⚠ Your domain doesn't point to this server yet.          |
|                 |    The app will deploy, but it won't be reachable         |
|                 |    until DNS propagates.                                  |
|                 |                                                           |
|                 |  You can leave this page. Deployment continues in the     |
|                 |  background.                                              |
|                 |                                                           |
+-----------------+-----------------------------------------------------------+
```

### Deployment Success State
```text
|                 |  +-----------------------------------------------------+  |
|                 |  |  [✓] Preparing                                      |  |
|                 |  |  [✓] Downloading                                    |  |
|                 |  |  [✓] Configuring                                    |  |
|                 |  |  [✓] Securing                                       |  |
|                 |  |  [✓] Starting                                       |  |
|                 |  |  [✓] Running                                        |  |
|                 |  +-----------------------------------------------------+  |
|                 |                                                           |
|                 |       [ Large Success Icon with Pulse Ring ]               |
|                 |                                                           |
|                 |  Nextcloud is running. You are officially self-hosting.    |
|                 |                                                           |
|                 |  [ Open Nextcloud -> ] (Primary)   [ Dashboard ] (Ghost)  |
```

### Deployment Failed State
```text
|                 |  +-----------------------------------------------------+  |
|                 |  |  [✓] Preparing                                      |  |
|                 |  |  [✓] Downloading                                    |  |
|                 |  |  [X] Configuring           (Red, Failed)            |  |
|                 |  |      Deployment didn't complete. Configuration       |  |
|                 |  |      failed. No leftover files were left on your     |  |
|                 |  |      server.                                         |  |
|                 |  |  [ ] Securing              (Dimmed)                 |  |
|                 |  |  [ ] Starting              (Dimmed)                 |  |
|                 |  |  [ ] Running               (Dimmed)                 |  |
|                 |  +-----------------------------------------------------+  |
|                 |                                                           |
|                 |  [ Try again ] (Primary)            [ Dashboard ] (Ghost) |
```
**Layout:** Vertical stepper, `max-width: 640px` centered, with full-width progress bar at top. 
**Interactions:**
- SSE events update phase states in real time. Phase transitions animate with `--ease-spring`.
- Progress bar fills proportionally (each phase = 1/6).
- DNS warning banner appears conditionally above the stepper.
- Background navigation hint is static text below the card.
- `aria-live="polite"` region announces each phase transition.

---

## 15. Post-Deployment Verification (AB#205)
**Path:** Embedded within deployment success view at `/deployments/[deployment-id]`
**Purpose:** Automated health checks confirming the app is reachable, SSL active, DNS resolved. Builds trust by verifying — not just deploying.

```text
+-----------------+-----------------------------------------------------------+
| UNPLUGHQ     [=]| Deployment Complete                              [O] [U]  |
+-----------------+-----------------------------------------------------------+
|                 |                                                           |
| [O] Dashboard   |  Nextcloud deployed successfully                          |
| [C] Catalog     |                                                           |
| [S] Settings    |  Verification:                                            |
|                 |  +-----------------------------------------------------+  |
|                 |  |  [✓] Container started                              |  |
|                 |  |  [✓] Secure connection active                       |  |
|                 |  |  [✓] App responding at https://files.mydomain.com   |  |
|                 |  |  [✓] Domain resolving correctly                     |  |
|                 |  +-----------------------------------------------------+  |
|                 |                                                           |
|                 |  Verified. Nextcloud is responding at                     |
|                 |  https://files.mydomain.com                               |
|                 |                                                           |
|                 |  [ Open Nextcloud -> ] (Primary)   [ Dashboard ] (Ghost)  |
|                 |                                                           |
+-----------------+-----------------------------------------------------------+
```

### Verification with DNS Failure
```text
|                 |  Verification:                                            |
|                 |  +-----------------------------------------------------+  |
|                 |  |  [✓] Container started                              |  |
|                 |  |  [✓] Secure connection active                       |  |
|                 |  |  [X] App not responding yet                         |  |
|                 |  |  [⚠] Domain not resolving                           |  |
|                 |  +-----------------------------------------------------+  |
|                 |                                                           |
|                 |  Nextcloud deployed but isn't responding yet.             |
|                 |  This is often a DNS propagation delay.                   |
|                 |                                                           |
|                 |  +-----------------------------------------------------+  |
|                 |  | Check that your domain points to 192.168.1.100.     |  |
|                 |  | DNS changes can take up to 48 hours.                |  |
|                 |  +-----------------------------------------------------+  |
|                 |                                                           |
|                 |  [ Back to Dashboard ] (Primary)                          |
```
**Layout:** Stacked verification checklist inside a bordered card.
**Interactions:**
- Each check item appears sequentially with stagger (`--dur-fast` delay between items, `--ease-spring`).
- Success items fade in with green checkmark. Failures fade in with red X or amber warning.
- `aria-live="polite"` announces each verification result.

---

## 16. Multi-App Management View (AB#206)
**Path:** `/dashboard` (enhanced section) or `/apps`
**Purpose:** Tabular overview of all deployed apps on a server. Shows per-app resource consumption. Port-conflict-free management.

```text
+-----------------+-----------------------------------------------------------+
| UNPLUGHQ     [=]| Dashboard                                        [O] [U]  |
+-----------------+-----------------------------------------------------------+
|                 |                                                           |
| [O] Dashboard   |  3 apps running on My Production Server                   |
| [C] Catalog     |                                                           |
| [S] Settings    |  ℹ Deploying a new app won't affect your running apps.    |
|                 |                                            [ + Add app ]   |
|                 |                                                           |
|                 |  +---+---------------+--------+------+------+------+---+  |
|                 |  |   | App           | Status | CPU  | Mem  | Disk |   |  |
|                 |  +---+---------------+--------+------+------+------+---+  |
|                 |  |[i]| Nextcloud     |[Running]| 12% | 1.2GB| 8 GB |[.]|  |
|                 |  |   | files.my.dev  |         |[===]|[====]|[== ]|   |  |
|                 |  +---+---------------+--------+------+------+------+---+  |
|                 |  |[i]| Plausible     |[Running]|  3% |256MB | 2 GB |[.]|  |
|                 |  |   | stats.my.dev  |         |[= ]|[=  ]|[=  ]|   |  |
|                 |  +---+---------------+--------+------+------+------+---+  |
|                 |  |[i]| Vaultwarden   |[Running]|  1% |128MB | 0.5GB|[.]|  |
|                 |  |   | pass.my.dev   |         |[  ]|[  ]|[  ]|   |  |
|                 |  +---+---------------+--------+------+------+------+---+  |
|                 |  |   | TOTAL         |         | 16% |1.6GB |10.5GB|   |  |
|                 |  +---+---------------+--------+------+------+------+---+  |
|                 |                                                           |
|                 |  ⚠ Your server is using 75% of its memory.                |
|                 |    Consider upgrading for the best experience.             |
|                 |                                                           |
+-----------------+-----------------------------------------------------------+
```
**Layout:** Table on desktop. Card stack on mobile (each row becomes a card with stacked key-value pairs).
**Interactions:**
- Mini resource bars inside table cells colored by threshold (green/amber/red).
- Kebab menu `[.]` per row: Start, Stop, Restart, Remove. Destructive items require confirmation modal.
- Resource warning banner at bottom appears when aggregate > 80%.
- Real-time updates via SSE — resource values tween smoothly.
- "Add app" navigates to catalog.

---

## 17. Dashboard Overview — Multi-Server (AB#207)
**Path:** `/dashboard`
**Purpose:** The primary authenticated view. Glanceable health for all servers and apps. Answers "Is everything OK?" in under 3 seconds.

```text
+-----------------+-----------------------------------------------------------+
| UNPLUGHQ     [=]| Dashboard                            [Search] [🔔2] [U]  |
+-----------------+-----------------------------------------------------------+
|                 |                                                           |
| [O] Dashboard   |  Your server at a glance                                  |
| [C] Catalog     |                                                           |
| [S] Settings    |  +-----------------------------------------------------+  |
|                 |  | ⚠ 2 active alerts                    [View all ->] |  |
|                 |  | High storage usage on Production Server              |  |
|                 |  | Plausible not responding                              |  |
|                 |  +-----------------------------------------------------+  |
|                 |                                                           |
|                 |  Server: My Production Server  (*) Healthy                 |
|                 |                                                           |
|                 |  +----------+ +----------+ +----------+ +----------+      |
|                 |  |   32%    | |   68%    | |   72%    | |  1.2MB/s |      |
|                 |  |  [===  ] | | [=====]  | | [=====]  | |  [====]  |      |
|                 |  |   CPU    | |  Memory  | |  Storage | |  Network |      |
|                 |  +----------+ +----------+ +----------+ +----------+      |
|                 |                 (green)      (amber)                       |
|                 |                                                           |
|                 |  Deployed Applications                    [ + Add App ]   |
|                 |  +-----------------------+ +-----------------------+      |
|                 |  | [Icon] Nextcloud      | | [Icon] Plausible      |      |
|                 |  | (*) Running           | | (!) Unhealthy         |      |
|                 |  | CPU: 12% | Mem: 1.2GB | | CPU: 3% | Mem: 256MB |      |
|                 |  | https://files.my.dev  | | https://stats.my.dev  |      |
|                 |  | [Open] [Manage] [...] | | [Open] [Manage] [...] |      |
|                 |  +-----------------------+ +-----------------------+      |
|                 |  +-----------------------+                                |
|                 |  | [Icon] Vaultwarden    |                                |
|                 |  | (*) Running           |                                |
|                 |  | CPU: 1% | Mem: 128MB  |                                |
|                 |  | https://pass.my.dev   |                                |
|                 |  | [Open] [Manage] [...] |                                |
|                 |  +-----------------------+                                |
|                 |                                                           |
|                 |  Last updated: 12 seconds ago                             |
|                 |                                                           |
+-----------------+-----------------------------------------------------------+
```
**Layout:**
- Alert banner section at top (conditional — only shown when active alerts exist).
- Resource gauges in a horizontal row (4-up on desktop, 2x2 on tablet, horizontal scroll on mobile).
- App tiles grid: `grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))`.
- Sidebar shows server health indicator with pulse ring.
**Interactions:**
- Alert banner links to full alert management. Dismiss X removes individual alerts.
- Gauges update in real time via SSE. Number values tween smoothly.
- Storage gauge is amber (72% > 70% threshold).
- App tiles show per-app resource mini-bars.
- "Last updated" timestamp refreshes with each SSE event. Shows "Data may be outdated" if >120s stale.
- Notification bell in header shows badge with unread alert count.
- Empty dashboard state: illustration + "No apps running yet. Deploy your first application." CTA.

---

## 18. Alert Management Page (AB#208, AB#209)
**Path:** `/alerts`
**Purpose:** View all active and recent alerts. Expand to see detail, threshold values, and remediation. Acknowledge or dismiss.

```text
+-----------------+-----------------------------------------------------------+
| UNPLUGHQ     [=]| Alerts                                           [O] [U]  |
+-----------------+-----------------------------------------------------------+
|                 |                                                           |
| [O] Dashboard   |  Active Alerts                                            |
| [C] Catalog     |                                                           |
| [S] Settings    |  +-----------------------------------------------------+  |
|                 |  | [CRITICAL] High storage usage                       |  |
|                 |  |            Production Server    12 min ago     [v]   |  |
|                 |  +-----------------------------------------------------+  |
|                 |  | [CRITICAL] Plausible not responding                 |  |
|                 |  |            stats.my.dev         5 min ago      [v]   |  |
|                 |  +-----------------------------------------------------+  |
|                 |                                                           |
|                 |  (Expanded: High storage usage)                           |
|                 |  +-----------------------------------------------------+  |
|                 |  |                                                     |  |
|                 |  |  Storage is at 87% (threshold: 85%)                 |  |
|                 |  |                                                     |  |
|                 |  |          +------+                                   |  |
|                 |  |    87%   | [===>] gauge                             |  |
|                 |  |          +------+                                   |  |
|                 |  |                                                     |  |
|                 |  |  Affecting: My Production Server                    |  |
|                 |  |  Detected at: 10:48 AM today                        |  |
|                 |  |                                                     |  |
|                 |  |  [Acknowledge]  [Dismiss]  [View remediation ->]    |  |
|                 |  +-----------------------------------------------------+  |
|                 |                                                           |
|                 |  Recent (Dismissed)                                       |
|                 |  +-----------------------------------------------------+  |
|                 |  | [WARNING] Resources at 82%  (faded)    2 hours ago  |  |
|                 |  +-----------------------------------------------------+  |
|                 |                                                           |
+-----------------+-----------------------------------------------------------+
```
**Layout:** Full-width list. Each alert is an expandable row. Active alerts section above, dismissed "Recent" section below (faded).
**Interactions:**
- Click row or chevron `[v]` to expand detail panel (animated height transition).
- "Acknowledge" prevents repeat notifications, visually marks with checkmark.
- "Dismiss" moves to Recent section with faded opacity.
- "View remediation" navigates to the remediation guide for that alert type.
- Alert list sorted: critical → warning → info, then newest-first within severity.
- Empty state: "No active alerts. Everything is running smoothly." with subtle checkmark illustration.
- Real-time: new alerts slide in from top with `--ease-spring` animation.

---

## 19. Guided Remediation Page (AB#209)
**Path:** `/alerts/[alert-id]/remediation`
**Purpose:** Step-by-step, non-technical guidance to resolve a known alert type. Goal: resolution in <10 minutes.

### Disk Critical Remediation
```text
+-----------------+-----------------------------------------------------------+
| UNPLUGHQ     [=]| <- Back to alerts                                [O] [U]  |
+-----------------+-----------------------------------------------------------+
|                 |                                                           |
| [O] Dashboard   |  Free up storage space                                    |
| [C] Catalog     |                                                           |
| [S] Settings    |  Storage is at 87% on My Production Server.               |
|                 |                                                           |
|                 |  +-----------------------------------------------------+  |
|                 |  |  (1) Review which apps use the most storage.         |  |
|                 |  |                                                     |  |
|                 |  |      +-------------------------------+              |  |
|                 |  |      | App         | Storage | % Tot |              |  |
|                 |  |      +-------------------------------+              |  |
|                 |  |      | Nextcloud   | 8.0 GB  |  62%  |              |  |
|                 |  |      | Plausible   | 2.1 GB  |  16%  |              |  |
|                 |  |      | Vaultwarden | 0.4 GB  |   3%  |              |  |
|                 |  |      | System      | 2.5 GB  |  19%  |              |  |
|                 |  |      +-------------------------------+              |  |
|                 |  |                                                     |  |
|                 |  +-----------------------------------------------------+  |
|                 |  |  (2) Remove files you no longer need from            |  |
|                 |  |      within each app.                                |  |
|                 |  +-----------------------------------------------------+  |
|                 |  |  (3) If storage is still full, consider upgrading    |  |
|                 |  |      your server's disk.                             |  |
|                 |  |                                                     |  |
|                 |  |  +-----------------------------------------------+  |  |
|                 |  |  | If this doesn't resolve it, check your VPS    |  |  |
|                 |  |  | provider's storage upgrade options.            |  |  |
|                 |  |  +-----------------------------------------------+  |  |
|                 |  +-----------------------------------------------------+  |
|                 |                                                           |
+-----------------+-----------------------------------------------------------+
```

### App Unavailable Remediation
```text
+-----------------+-----------------------------------------------------------+
| UNPLUGHQ     [=]| <- Back to alerts                                [O] [U]  |
+-----------------+-----------------------------------------------------------+
|                 |                                                           |
| [O] Dashboard   |  Get Plausible back online                                |
| [C] Catalog     |                                                           |
| [S] Settings    |  Plausible stopped responding at 10:43 AM.                |
|                 |                                                           |
|                 |  +-----------------------------------------------------+  |
|                 |  |  (1) Try restarting the app.                         |  |
|                 |  |                                                     |  |
|                 |  |      [ Restart Plausible ] (Primary, sm)             |  |
|                 |  |                                                     |  |
|                 |  +-----------------------------------------------------+  |
|                 |  |  (2) If the restart doesn't help, check that your   |  |
|                 |  |      domain points to your server.                   |  |
|                 |  |                                                     |  |
|                 |  |      Server IP: 192.168.1.100                        |  |
|                 |  |      Domain: stats.my.dev                            |  |
|                 |  +-----------------------------------------------------+  |
|                 |  |  (3) If the problem persists, review the app's      |  |
|                 |  |      resource usage.                                 |  |
|                 |  |                                                     |  |
|                 |  |  +-----------------------------------------------+  |  |
|                 |  |  | If this doesn't resolve it, the app may need  |  |  |
|                 |  |  | more resources. Consider stopping unused apps  |  |  |
|                 |  |  | or upgrading your server.                      |  |  |
|                 |  |  +-----------------------------------------------+  |  |
|                 |  +-----------------------------------------------------+  |
|                 |                                                           |
+-----------------+-----------------------------------------------------------+
```
**Layout:** Single column, `max-width: 640px`, centered. Numbered steps with vertical connector lines.
**Interactions:**
- Inline action buttons (restart, stop) execute server-side mutations directly.
- After restart: success toast "Plausible is back online." or failure message "Restart didn't work. Try the next step."
- Per-app breakdown table (for resource alerts) sorted by usage descending.
- Escalation path box at the end uses `--color-bg-surface` background for visual distinction.
- "Back to alerts" link at top (ghost style).

---

**PI-2 Sprint 2 Summary Check:**
- 9 new screens covering all 8 Sprint 2 stories (AB#202–AB#209).
- Mobile First? Yes — all layouts specify mobile-first responsive behavior with stacking rules.
- WCAG AA? Color contrast per Design System tokens; `aria-live` regions on all real-time updates; focus management on expandable panels.
- Keyboard Nav? Expandable alert rows reachable via Tab, toggled via Enter/Space. Wizard steps navigable via keyboard. Configuration forms use standard tab order.
- Content Alignment? All copy matches CS copy-specs.md and messaging-framework.md vocabulary rules.

(Ends Wireframes Spec)

---
artifact: wireframes
produced-by: ux-designer
project-slug: unplughq
work-item: epic-001-unplughq-platform
parent-work-item: epic-001-unplughq-platform
work-item-type: epic
workflow-tier: full
phase: P2
version: 1.0.0
status: approved
consumed-by:
  - frontend-developer
  - accessibility
date: 2026-03-14
---

# UnplugHQ Wireframes & Layout Specifications

This document contains structural ASCII wireframes and layout specifications for the 10 core screens of UnplugHQ.

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

(Ends Wireframes Spec)

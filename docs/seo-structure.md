---
artifact: seo-structure
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

# SEO Structure Plan

For the public-facing aspects of UnplugHQ, this ensures technical visibility and fulfills intent for aspiring self-hosters searching for easier solutions.

## Global SEO Guidelines
- **Target Audience Intent:** High intent "How to self-host easily", "Alternative to Cloud providers", "Self-hosted Nextcloud without Docker".
- **Structured Data:** Use `SoftwareApplication` and `HowTo` schema.
- **Readability:** Content targeting Flesch-Kincaid 8th-grade reading level.

## Core Page Mapping

| Page / Route | Primary Keyword | Secondary Keywords | Meta Title (≤ 60 chars) | Meta Description (≤ 155 chars) | H1 (Outcome focused) |
|--------------|-----------------|--------------------|-------------------------|--------------------------------|----------------------|
| **Home (`/`)** | self-hosting server manager | zero-setup self-hosting, manage VPS visually | UnplugHQ: Self-Hosting, Simplified | Deploy and maintain self-hosted apps on your own server. No terminal commands, no Docker knowledge needed. Connect your VPS and launch today. | Own your data without the DevOps headache |
| **Catalog (`/apps`)** | self-hostable apps | open source app catalog, self-host Nextcloud | Catalog: Curated Self-Hostable Apps | Browse our curated catalog of privacy-first, open-source apps. Deploy Nextcloud, Plausible, and more to your server with one click. | Browse apps for your server |
| **Pricing (`/pricing`)** | self-hosting cost | UnplugHQ pricing, manage VPS cost | UnplugHQ Pricing: Simple Plans | Transparent pricing for visual self-hosting. Start free, scale as your needs grow. Reclaim your SaaS subscription budget. | Plans that beat SaaS subscriptions |
| **How It Works (`/how-it-works`)** | visual VPS manager | automated server maintenance, no-code VPS | How It Works: Visual Server Management | See how UnplugHQ securely connects to your server to automate deployments, SSL, and updates—keeping your data safely in your control. | Your server. Our management. |

## Sprint 2 Page Mapping (AB#202–AB#209)

| Page / Route | Primary Keyword | Secondary Keywords | Meta Title (≤ 60 chars) | Meta Description (≤ 155 chars) | H1 (Outcome focused) | Story |
|--------------|-----------------|--------------------|-------------------------|--------------------------------|----------------------|-------|
| **App Detail (`/apps/:slug`)** | self-host [app name] | [app name] alternative, deploy [app name] | Deploy [App Name] on Your Server | Deploy [App Name] to your own server in minutes. No terminal needed. Automatic SSL, backups, and monitoring included. | Deploy [App Name] to your server | AB#202 |
| **App Config (`/apps/:slug/configure`)** | configure [app name] self-hosted | [app name] setup, install [app name] server | Set Up [App Name] — UnplugHQ | Configure [App Name] for your server with a guided visual flow. Sensible defaults, no config files, deploy in minutes. | Set up [App Name] | AB#203 |
| **Deploy Progress (`/apps/:slug/deploy/:id`)** | deploy self-hosted app | deployment progress, install app server | Deploying [App Name] — UnplugHQ | Watch your [App Name] deployment in real time. Automatic SSL, domain configuration, and health verification included. | Deploying [App Name] to [Server] | AB#204 |
| **Dashboard (`/dashboard`)** | self-hosting dashboard | server monitoring, app health status | Dashboard — UnplugHQ | Monitor your self-hosted server and apps at a glance. Real-time health status, resource gauges, and proactive alerts. | Your server at a glance | AB#207 |
| **Alerts (`/dashboard/alerts`)** | server health alerts | self-hosting monitoring, server notifications | Health Alerts — UnplugHQ | Stay informed when your server or apps need attention. Proactive alerts with guided remediation for common issues. | Active alerts | AB#208 |
| **Alert Detail (`/dashboard/alerts/:id`)** | fix server alert | server remediation, resolve disk full | Alert Detail — UnplugHQ | See exactly what's happening and get step-by-step guidance to resolve server and app issues. No terminal required. | [Alert type] on [Server/App] | AB#209 |

## Internal Linking Strategy
- **Homepage → Catalog:** Link app mentions (e.g., Nextcloud) directly to the catalog.
- **Catalog → How It Works:** Explain the zero-terminal deployment process inside catalog pages to build trust.
- **Pricing → How It Works:** Reinforce the value proposition of automated maintenance to justify the Pro tier.
- **Catalog → App Detail:** Each catalog card links to the full app detail page with deploy CTA. (AB#202)
- **App Detail → Configure:** Deploy CTA links to the guided configuration flow. (AB#203)
- **Configure → Deploy Progress:** Confirmation action transitions to the real-time progress view. (AB#204)
- **Deploy Progress → Dashboard:** Completion links back to dashboard where the new app tile appears. (AB#204, AB#207)
- **Dashboard → Alerts:** Active alerts section links to the full alert list. (AB#208)
- **Alerts → Alert Detail:** Each alert row links to the expanded detail with remediation. (AB#209)
- **Alert Email → Dashboard:** Email CTA deep-links to the affected server/app on the dashboard. (AB#208)
- **Alert Detail → Account Settings:** Notification preference link for opt-out. (AB#208)

## Structured Data Additions (Sprint 2)

| Page | Schema Type | Key Properties |
|------|-------------|----------------|
| App Detail (`/apps/:slug`) | `SoftwareApplication` | `name`, `applicationCategory`, `operatingSystem: "Linux"`, `offers`, `url` |
| App Config (`/apps/:slug/configure`) | `HowTo` | `name: "Deploy [App Name]"`, `step[]` for each config step, `estimatedCost` |
| Dashboard (`/dashboard`) | None (authenticated; not indexed) | `noindex, nofollow` — dashboard is behind auth |
| Alerts (`/dashboard/alerts`) | None (authenticated; not indexed) | `noindex, nofollow` — alerts are behind auth |

## Robots Directives

| Route Pattern | Directive | Rationale |
|---------------|-----------|-----------|
| `/` | `index, follow` | Public marketing page |
| `/apps` | `index, follow` | Public catalog |
| `/apps/:slug` | `index, follow` | Public app detail pages |
| `/pricing` | `index, follow` | Public pricing page |
| `/how-it-works` | `index, follow` | Public explainer |
| `/apps/:slug/configure` | `noindex, nofollow` | Authenticated flow; per-user state |
| `/apps/:slug/deploy/:id` | `noindex, nofollow` | Authenticated; transient deployment state |
| `/dashboard` | `noindex, nofollow` | Authenticated |
| `/dashboard/alerts` | `noindex, nofollow` | Authenticated |
| `/dashboard/alerts/:id` | `noindex, nofollow` | Authenticated |
| `/settings` | `noindex, nofollow` | Authenticated |
| `/login`, `/signup`, `/forgot-password` | `noindex, follow` | Auth pages; follow links but don't index |

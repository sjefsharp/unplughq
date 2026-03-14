---
artifact: seo-structure
produced-by: content-strategist
project-slug: unplughq
work-item: task-cs-messaging-framework
work-item-type: task
parent-work-item: epic-001-unplughq-platform
workflow-tier: full
phase: P2
version: 1.0.0
status: draft
consumed-by:
  - ux-designer
  - frontend-developer
date: 2026-03-14
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
| **How It Works (`/how-it-works`)**| visual VPS manager | automated server maintenance, no-code VPS | How It Works: Visual Server Management | See how UnplugHQ securely connects to your server to automate deployments, SSL, and updates—keeping your data safely in your control. | Your server. Our management. |

## Internal Linking Strategy
- **Homepage -> Catalog:** Link app mentions (e.g., Nextcloud) directly to the catalog.
- **Catalog -> How It Works:** Explain the zero-terminal deployment process inside catalog pages to build trust.
- **Pricing -> How It Works:** Reinforce the value proposition of automated maintenance to justify the Pro tier.

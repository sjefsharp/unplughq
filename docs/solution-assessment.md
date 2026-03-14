---
artifact: solution-assessment
produced-by: system-architect
project-slug: unplughq
work-item: epic-001-unplughq-platform
work-item-type: epic
workflow-tier: full
phase: P1
version: 1.0.0
status: approved
azure-devops-id: 171
consumed-by:
  - security-analyst
  - solution-designer
  - ux-designer
  - tech-lead
  - frontend-developer
  - backend-developer
  - database-administrator
  - devops-engineer
  - testing
  - product-owner
date: 2026-03-13
---

# Solution Assessment

## 1. Codebase Scan

| Location | Contents | Tech Stack | Architecture | Maturity | Relevance |
|----------|----------|------------|--------------|----------|-----------|
| `unplughq/code/` | Empty directory | None | N/A | Greenfield | N/A — no existing code to evaluate |
| `unplughq/docs/` | 11 project artifacts (product vision, requirements, process models, domain glossary, stakeholder analysis, feature roadmap, risk register, PI objectives, session checkpoint, gate evaluations, MkDocs index) | Markdown, MkDocs | Documentation-only | P1 in progress | Artifacts define the project scope; no code to extend |
| `unplughq/mkdocs.yml` | MkDocs configuration for GitHub Pages documentation site | MkDocs Material | Static documentation | Configured | Documentation infrastructure only |

**Scan verdict:** The `code/` directory is empty. No application code, configuration, dependencies, or infrastructure exists. All workspace content is documentation artifacts from P0 and P1. This is a pure greenfield project.

---

## 2. Platform Classification

**Classification: `web`**

| Factor | Assessment |
|--------|-----------|
| Primary interface | Browser-based control panel (dashboard, wizards, catalog, settings) |
| Deployment target | Hosted web application accessible via HTTPS |
| Mobile strategy | Mobile-first responsive web design (CSS mobile-first breakpoints, 375px minimum viewport per NFR-008) |
| PWA evaluation | User-stated preference for PWA capability. Justified: the dashboard "check-in" use case (UJ4) benefits from installability and push notifications. Recommend PWA with service worker for offline dashboard shell and push notification support. Full offline operation is not viable since the control plane requires network connectivity to manage remote servers. |
| Native mobile | Prohibited per Environment Rule 18. No native Android/iOS apps. |

**Rationale:** All user journeys (UJ1–UJ5) are web-based. The product is a control panel for managing remote servers — inherently a connected, browser-based experience. PWA adds value for the health-check dashboard (installability, push notifications) without requiring native platform access.

---

## 3. Disposition Recommendation

**Disposition: New Build**

| Evidence | Detail |
|----------|--------|
| Existing codebase | `code/` directory is empty — zero application code exists |
| Existing infrastructure | No build configuration, no dependencies, no CI/CD pipeline |
| Domain specificity | UnplugHQ's core domain (remote server provisioning via SSH, container orchestration, app catalog management, health monitoring) is purpose-built and cannot be derived from a generic template |
| Architecture requirements | Control plane / data plane separation, multi-tenant SaaS with data sovereignty constraints, real-time monitoring — requires purpose-designed architecture |

**Conclusion:** New Build is the only viable disposition. There is no existing codebase to extend or refactor.

---

## 4. Technology Comparison Matrix

Three technology approaches evaluated against the functional and non-functional requirements from the Product Vision and BA Requirements.

### Scoring Criteria

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Meets functional requirements | 30% | Coverage of F1–F4 features: SSH connectivity, app catalog, deployment orchestration, dashboard with real-time monitoring, guided wizards, authentication |
| Development velocity | 20% | Speed to MVP delivery within PI-1 timeline, considering team ramp-up and boilerplate reduction |
| Maintainability | 15% | Type safety, code organization, testability, refactoring confidence for PI-2+ feature growth |
| Scalability | 15% | Multi-tenant growth path, background job throughput, concurrent server management |
| Deployment simplicity | 10% | Ease of deploying the control plane itself (CI/CD, hosting options, container packaging) |
| Ecosystem maturity | 10% | Library availability, community size, long-term viability, hiring pool |

### Approach 1 — Simplest Viable: Express.js + htmx + SQLite

A server-rendered application using Express.js for routing and API, htmx for interactive UI updates without a JavaScript framework, Alpine.js for client-side state, and SQLite for persistence.

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 22 LTS |
| HTTP framework | Express.js | 5.x |
| UI interactivity | htmx + Alpine.js | htmx 2.x, Alpine 3.x |
| Templating | EJS or Handlebars | — |
| Database | SQLite via better-sqlite3 | — |
| Auth | Custom (express-session + bcrypt) | — |
| SSH | ssh2 | 1.17.x |
| Job queue | BullMQ + Redis | 5.71.x |

| Criterion | Score (1–10) | Weighted | Rationale |
|-----------|-------------|----------|-----------|
| Functional requirements | 6 | 1.80 | htmx handles basic interactivity but struggles with complex real-time dashboard updates, multi-step wizard state management, and rich data visualization. No component model for reusable UI. |
| Development velocity | 7 | 1.40 | Fast initial start with minimal tooling. Slows down as UI complexity grows — no component abstractions, manual DOM management for charts and real-time updates. |
| Maintainability | 4 | 0.60 | No type-safe templates, no component model, template string coupling. Refactoring confidence is low as codebase grows across PI-2+. |
| Scalability | 5 | 0.75 | SQLite is single-writer — bottleneck for concurrent multi-tenant SaaS. Migration to PostgreSQL would require significant rework. |
| Deployment simplicity | 9 | 0.90 | Single process, no build step for frontend, minimal infrastructure (SQLite = no external database). |
| Ecosystem maturity | 6 | 0.60 | Express is mature but htmx ecosystem for complex SaaS dashboards is limited. Few production references for htmx at this application complexity. |
| **Total** | | **6.05** | |

### Approach 2 — Modern Full-Stack: Next.js + PostgreSQL + Drizzle ORM

A full-stack TypeScript application using Next.js (App Router with Server Components and Server Actions) for both the web UI and API layer, PostgreSQL for persistence, Drizzle ORM for type-safe database access, and shadcn/ui with Tailwind CSS for the component library.

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 22 LTS |
| Framework | Next.js (App Router) | 16.x |
| Language | TypeScript | 5.9.x |
| UI components | shadcn/ui + Radix UI + Tailwind CSS | Tailwind 4.x |
| Database | PostgreSQL | 17 |
| ORM | Drizzle ORM | 0.45.x |
| Auth | Auth.js (NextAuth.js v5) | 5.x |
| SSH | ssh2 | 1.17.x |
| Job queue | BullMQ + Redis/Valkey | 5.71.x |
| Validation | Zod | 3.x |
| Icons | Lucide React | latest |

| Criterion | Score (1–10) | Weighted | Rationale |
|-----------|-------------|----------|-----------|
| Functional requirements | 9 | 2.70 | Server Components for fast-loading dashboard views. Server Actions for wizard form handling. React ecosystem provides rich charting (recharts), data visualization, and real-time update patterns (SSE/streaming). Full TypeScript stack enables type-safe SSH operation contracts. shadcn/ui provides accessible, customizable components for the dashboard and form wizards. |
| Development velocity | 8 | 1.60 | Single codebase (frontend + API in one repo). shadcn/ui provides pre-built, accessible form components. Server Actions reduce API boilerplate for wizard flows. Drizzle ORM generates type-safe queries without a code-gen step. Auth.js handles identity flows (F4) out of the box. |
| Maintainability | 9 | 1.35 | Full TypeScript from database schema to UI. Component model with clear server/client boundaries. Drizzle's SQL-first approach keeps queries explicit and reviewable. Zod validation at API boundaries. |
| Scalability | 8 | 1.20 | PostgreSQL handles multi-tenant workloads at scale. BullMQ + Redis provides reliable background job processing for concurrent provisioning operations. Next.js supports horizontal scaling behind a load balancer. |
| Deployment simplicity | 7 | 0.70 | Requires Node.js runtime, PostgreSQL, and Redis. Containerizes cleanly with Docker Compose or Kubernetes. More infrastructure than Approach 1 but standard for production SaaS. |
| Ecosystem maturity | 9 | 0.90 | React is the most widely adopted UI framework. Next.js is production-proven at massive scale. Auth.js, Drizzle, BullMQ, ssh2 are all actively maintained with strong communities. Largest hiring pool of any frontend ecosystem. |
| **Total** | | **8.45** | |

### Approach 3 — Full-Stack SvelteKit + PostgreSQL + Drizzle ORM

A full-stack TypeScript application using SvelteKit for server-rendered UI with progressive enhancement, PostgreSQL for persistence, and Drizzle ORM for type-safe database access.

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 22 LTS |
| Framework | SvelteKit | 2.x |
| Language | TypeScript | 5.9.x |
| UI components | Skeleton UI + Tailwind CSS | Tailwind 4.x |
| Database | PostgreSQL | 17 |
| ORM | Drizzle ORM | 0.45.x |
| Auth | Lucia Auth or SvelteKit Auth | — |
| SSH | ssh2 | 1.17.x |
| Job queue | BullMQ + Redis/Valkey | 5.71.x |
| Validation | Zod | 3.x |

| Criterion | Score (1–10) | Weighted | Rationale |
|-----------|-------------|----------|-----------|
| Functional requirements | 8 | 2.40 | SvelteKit handles SSR, form actions (excellent for wizards), and streaming. Smaller client bundles benefit global audience with variable bandwidth (NFR-014). However, charting/data visualization library ecosystem is narrower than React's — fewer production-ready options for the dashboard. |
| Development velocity | 8 | 1.60 | Less boilerplate than React. Built-in form actions align perfectly with multi-step wizard flows. Svelte's reactivity model is simpler. However, fewer pre-built component libraries means more custom UI work for the dashboard. |
| Maintainability | 8 | 1.20 | TypeScript support is strong. Svelte's compiler-first approach produces clean output. Component model is clean. Slightly less tooling for large-scale refactoring compared to React ecosystem. |
| Scalability | 8 | 1.20 | Same backend story as Approach 2 (PostgreSQL + BullMQ). SvelteKit's Node adapter scales horizontally. |
| Deployment simplicity | 8 | 0.80 | Same infrastructure requirements as Approach 2. SvelteKit's Node adapter produces a standard Node.js server. Slightly simpler build output than Next.js. |
| Ecosystem maturity | 6 | 0.60 | Svelte is growing rapidly but has a materially smaller ecosystem than React. Fewer dashboard component libraries, fewer auth solutions, smaller hiring pool. Lucia Auth is excellent but newer and smaller community than Auth.js. |
| **Total** | | **7.80** | |

### Comparison Summary

| Criterion (Weight) | Approach 1: Express+htmx+SQLite | Approach 2: Next.js+PG+Drizzle | Approach 3: SvelteKit+PG+Drizzle |
|--------------------|---------------------------------|-------------------------------|----------------------------------|
| Functional requirements (30%) | 1.80 | **2.70** | 2.40 |
| Development velocity (20%) | 1.40 | **1.60** | **1.60** |
| Maintainability (15%) | 0.60 | **1.35** | 1.20 |
| Scalability (15%) | 0.75 | **1.20** | **1.20** |
| Deployment simplicity (10%) | **0.90** | 0.70 | 0.80 |
| Ecosystem maturity (10%) | 0.60 | **0.90** | 0.60 |
| **Weighted Total** | **6.05** | **8.45** | **7.80** |

---

## 5. Recommendation

**Recommended approach: Approach 2 — Next.js + PostgreSQL + Drizzle ORM**

### Rationale

1. **Highest functional coverage (2.70/3.00):** The product's core experiences — real-time dashboards with server metrics, multi-step guided wizards, application catalog browsing, and deployment progress streaming — all benefit directly from React's mature component ecosystem, Server Components for fast initial loads, and Server Actions for type-safe form processing.

2. **Strongest ecosystem for the domain (0.90/1.00):** UnplugHQ's dashboard requires charting (server CPU/RAM/disk trends), status indicators, real-time updates, and data tables. The React ecosystem has production-proven libraries for all of these (recharts, @tanstack/table, Radix UI primitives). shadcn/ui provides accessible, composable components that align with the "premium indie tool" aesthetic direction.

3. **Best maintainability path for multi-PI delivery (1.35/1.50):** Full TypeScript from Drizzle schema declarations through API handlers to UI components. Zod validation at boundaries. The type-safe pipeline reduces regression risk as the codebase grows across PI-2 (updates, rollback, backup) and PI-3 (team access, advanced monitoring).

4. **Auth.js solves F4 out of the box:** The identity & access feature area (signup, login, password reset, session management) maps directly to Auth.js capabilities, eliminating custom auth implementation risk and aligning with OWASP security patterns.

5. **PWA support (user-stated preference):** Next.js has established PWA integration patterns (next-pwa, Serwist) for service worker generation, offline shell, and push notification support.

### Considered and rejected

- **Approach 1 (Express + htmx + SQLite):** Scored lowest (6.05). The simplicity advantage is real for deployment but the lack of a component model makes the complex dashboard UI, multi-step wizards, and real-time monitoring requirements impractical to deliver and maintain. SQLite's single-writer limitation is a hard blocker for multi-tenant SaaS growth.

- **Approach 3 (SvelteKit):** Strong contender (7.80) with excellent developer experience and smaller bundle sizes. Rejected primarily due to ecosystem gap: the dashboard's data visualization requirements demand charting and component libraries that React provides at higher maturity. Svelte's smaller hiring pool and auth ecosystem are secondary concerns but relevant for long-term maintainability. If bundle size became a critical constraint, SvelteKit would be the recommended alternative.

### Risk alignment

| Risk | How this stack addresses it |
|------|-----------------------------|
| R1 (SSH inconsistency) | ssh2 library is the most mature Node.js SSH client (1.17.x, actively maintained). TypeScript contracts enforce consistent connection handling. |
| R2 (Provisioning drift) | Drizzle schema + BullMQ job queue enable idempotent, auditable provisioning workflows with typed state machines. |
| R5 (Security attack surface) | Auth.js implements OWASP-aligned patterns. PostgreSQL's row-level security and Drizzle's parameterized queries prevent injection. SSH key encryption at rest via Node.js crypto. |
| R6 (Data sovereignty) | Architecture enforces control plane / data plane separation. PostgreSQL stores only metadata — the architecture overview documents the data boundary explicitly. |
| R8 (ART handoff) | TypeScript end-to-end reduces ambiguity in handoffs between agents. Zod schemas serve as executable contracts between BA requirements and implementation. |

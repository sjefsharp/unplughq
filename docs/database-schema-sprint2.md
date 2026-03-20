---
artifact: database-schema-sprint2
produced-by: database-administrator
project-slug: unplughq
work-item: task-292-dba-sprint2-schema
work-item-type: task
parent-work-item: epic-001-unplughq-platform
workflow-tier: full
phase: P4
version: 1.0.0
status: draft
consumed-by:
  - backend-developer
  - testing
  - tech-lead
  - product-owner
date: 2026-03-17
azure-devops-id: 292
review:
  reviewed-by:
  reviewed-date:
---

# Database Schema Sprint 2

Sprint 2 extends the control-plane database for the application catalog, deployment lifecycle tracking, and alert workflows required by F2 and F3. The implementation keeps UUID v4 identifiers for tenant-owned records, preserves tenant isolation on user data, and aligns the Drizzle schema with the PI-2 API contracts.

## Scope

- Added `catalog_apps` as the canonical catalog table for curated app templates.
- Strengthened `deployments` to reference catalog entries, store structured configuration in JSONB, and support Sprint 2 listing and container lookup queries.
- Extended `alerts` with dismissal state and re-trigger-prevention indexes.
- Added `tenantId` to `metrics_snapshots` so all tenant-owned operational data is directly tenant scoped.
- Expanded development seed data with 18 curated self-hostable app records.

## Schema Summary

### `catalog_apps`

Public catalog table for deployable templates.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `text` | Slug primary key, matches `CatalogApp.id` |
| `name` | `text` | Human-readable app name |
| `description` | `text` | Catalog description |
| `category` | `text` | Filterable catalog category |
| `version` | `text` | Template version string |
| `min_cpu_cores` | `integer` | Minimum CPU cores |
| `min_ram_gb` | `real` | Minimum RAM requirement |
| `min_disk_gb` | `real` | Minimum disk requirement |
| `upstream_url` | `text` | Upstream project URL |
| `image_digest` | `text` | `sha256:` digest string |
| `config_schema` | `jsonb` | Array of config field descriptors |
| `created_at` / `updated_at` | `timestamp` | Audit timestamps |

Index:

- `catalog_apps_category_idx` for category filtering.

### `deployments`

Tenant-owned deployment records for app lifecycle state.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | UUID v4 primary key |
| `tenant_id` | `uuid` | Required tenant isolation key |
| `server_id` | `uuid` | Target server |
| `catalog_app_id` | `text` | Foreign key to `catalog_apps.id` |
| `name` | `text` | Display name |
| `domain` | `text` | User-configured FQDN |
| `access_url` | `text` | HTTPS access URL |
| `status` | `deployment_status` | Matches Sprint 2 deployment state machine |
| `container_name` | `text` | Unique per server |
| `config` | `jsonb` | Structured deployment configuration payload |
| `created_at` / `updated_at` | `timestamp` | Audit timestamps |

Indexes:

- `deployments_tenant_server_idx` for per-server app lists.
- `deployments_tenant_status_idx` for active deployment queries.
- `deployments_server_container_name_idx` as a unique composite index for container lookup and collision prevention.

### `alerts`

Tenant-owned operational alert records.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | UUID v4 primary key |
| `tenant_id` | `uuid` | Required tenant isolation key |
| `server_id` | `uuid` | Affected server |
| `app_id` | `uuid` | Optional deployment reference |
| `severity` | `alert_severity` | `info`, `warning`, `critical` |
| `type` | `alert_type` | CPU, RAM, disk, app, or server alert |
| `message` | `text` | User-facing alert summary |
| `notification_sent` | `boolean` | Email delivery flag |
| `acknowledged_at` | `timestamp` | Acknowledgement timestamp |
| `dismissed_at` | `timestamp` | Dismissal timestamp for re-trigger logic |
| `created_at` | `timestamp` | Alert creation time |

Indexes:

- `alerts_tenant_id_created_at_idx` for descending recency queries.
- `alerts_tenant_server_type_dismissed_idx` for duplicate suppression and re-trigger prevention.

### `metrics_snapshots`

Time-series server telemetry with tenant scoping.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | UUID v4 primary key |
| `tenant_id` | `uuid` | Required tenant isolation key |
| `server_id` | `uuid` | Affected server |
| `timestamp` | `timestamp` | Snapshot timestamp |
| `cpu_percent` | `real` | CPU utilization |
| `ram_used_bytes` / `ram_total_bytes` | `bigint` | RAM metrics |
| `disk_used_bytes` / `disk_total_bytes` | `bigint` | Disk metrics |
| `network_rx_bytes_per_sec` / `network_tx_bytes_per_sec` | `bigint` | Network throughput |
| `containers` | `jsonb` | Per-container telemetry, including `diskUsageBytes` |

Indexes:

- `metrics_tenant_server_timestamp_idx` for tenant-scoped dashboard history.
- Existing `metrics_server_id_timestamp_idx` retained for direct server ingestion queries.

## Relation Updates

- `catalog_apps` now has a one-to-many relation to `deployments`.
- `deployments` now resolves its parent `catalog_app` relation explicitly.
- `metrics_snapshots` now relates to both `users` and `servers`, allowing direct tenant scoping in query builders.

## Seed Data

The development seed now inserts 18 self-hostable catalog entries spanning these categories:

- File Storage
- Analytics
- CMS
- Password Management
- Email
- Photo Storage
- Developer Tools
- Automation
- Business Intelligence

Seed digests are deterministic SHA-256 values generated from app/version seeds so every seeded row satisfies the `sha256:[a-f0-9]{64}` contract. They are suitable for contract validation and local development until the runtime deployment pipeline is wired to real registry-pinned digests.

## Security and Integrity Notes

- Tenant-owned tables use UUID v4 primary keys and explicit `tenant_id` columns.
- `deployments.config` is stored as JSONB to match the typed contract. Field-level secret encryption remains an application-layer concern and should be applied before persistence.
- `audit_log` already supports new Sprint 2 action names through its generic `action`, `target_type`, `target_id`, and `details` columns, so no schema change was required there.
- `metrics_snapshots.containers` already matched the PI-2 contract shape; Sprint 2 keeps that structure and scopes it by tenant.

## Verification Status

- [x] `catalog_apps`, `deployments`, and `alerts` align with the PI-2 contract shape.
- [x] Tenant isolation is explicit on tenant-owned Sprint 2 tables.
- [x] Sprint 2 query-supporting indexes are present in the Drizzle schema.
- [x] Seed catalog contains at least 15 self-hostable apps.
- [x] Seed digests satisfy the required SHA-256 format.

## Research Sources

- [Drizzle ORM schema docs](https://orm.drizzle.team/docs/schemas) — accessed 2026-03-17
- [Drizzle ORM relations docs](https://orm.drizzle.team/docs/rqb) — accessed 2026-03-17

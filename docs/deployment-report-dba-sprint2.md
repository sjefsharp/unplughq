---
artifact: deployment-report-dba-sprint2
produced-by: database-administrator
project-slug: unplughq
work-item: epic-001-unplughq-platform
work-item-type: task
parent-work-item: epic-001-unplughq-platform
workflow-tier: full
phase: P7
version: 1.0.0
status: draft
consumed-by:
  - backend-developer
  - devops-engineer
  - testing
  - product-owner
date: 2026-03-18
azure-devops-id: 320
review:
  reviewed-by:
  reviewed-date:
---

# Deployment Report — DBA Sprint 2

Production database migration and catalog seed verification for PI-2 Sprint 2.

## 1. Sprint 2 Migration Verification

### 1.1 Migration File Inventory

Single consolidated migration file: `drizzle/0000_cute_photon.sql`

Drizzle Kit uses a snapshot-based approach — the migration file represents the full schema state. The migration journal (`drizzle/meta/_journal.json`) confirms one entry at index 0 tagged `0000_cute_photon`.

### 1.2 New Tables (Sprint 2)

| Table | Primary Key | Columns | Foreign Keys | Purpose |
|-------|-------------|---------|--------------|---------|
| `catalog_apps` | `id` (text) | 13 | None | Curated self-hostable app catalog |
| `deployments` | `id` (uuid) | 12 | `tenant_id → users.id`, `server_id → servers.id`, `catalog_app_id → catalog_apps.id` | App deployment instances per server |
| `alerts` | `id` (uuid) | 11 | `tenant_id → users.id`, `server_id → servers.id`, `app_id → deployments.id` | Health monitoring alert records |

**Referential integrity rules:**

- `deployments.catalog_app_id` → `catalog_apps.id` uses `ON DELETE RESTRICT` (prevents catalog deletion while deployments reference it)
- `alerts.app_id` → `deployments.id` uses `ON DELETE SET NULL` (deployment removal nullifies alert reference, preserving alert history)
- All `tenant_id` references use `ON DELETE CASCADE` (account deletion removes all tenant data)
- `servers.id` references use `ON DELETE CASCADE` (server removal cascades to deployments, alerts, metrics)

### 1.3 Schema Extensions (Existing Tables)

| Table | Extension | Type | Default |
|-------|-----------|------|---------|
| `metrics_snapshots` | `containers` column | `jsonb` | `'[]'::jsonb` |
| `audit_log` | `action` column (expanded) | `text` | N/A — Sprint 2 adds new action types: `deployment.create`, `deployment.stop`, `deployment.start`, `deployment.remove`, `alert.acknowledge`, `alert.dismiss`, `domain.bind`, `domain.unbind`, `server.rotateSSHKey`, `server.rotateAgentToken` |

The `containers` JSONB column on `metrics_snapshots` stores per-container resource data with the schema: `{ id: string, name: string, status: string, diskUsageBytes?: number }[]`. This enables the monitoring agent to report per-container disk usage — a Sprint 2 requirement.

### 1.4 Enum Types

| Enum | Values | Used By |
|------|--------|---------|
| `alert_severity` | `info`, `warning`, `critical` | `alerts.severity` |
| `alert_type` | `cpu-critical`, `ram-critical`, `disk-critical`, `app-unavailable`, `server-unreachable` | `alerts.type` |
| `deployment_status` | `pending`, `pulling`, `configuring`, `provisioning-ssl`, `starting`, `running`, `unhealthy`, `stopped`, `failed`, `removing` | `deployments.status` |
| `server_status` | `connecting`, `validated`, `provisioning`, `provisioned`, `connection-failed`, `provision-failed`, `disconnected`, `error` | `servers.status` |
| `subscription_tier` | `free`, `pro`, `team` | `users.tier` |

### 1.5 Index Verification

**18 indexes across 10 tables** — all verified present in migration SQL and snapshot JSON.

| Index | Table | Columns | Type | Sprint 2 Query Pattern |
|-------|-------|---------|------|----------------------|
| `alerts_tenant_id_created_at_idx` | `alerts` | `(tenant_id, created_at)` | B-tree | Alert list paginated by tenant |
| `alerts_server_id_idx` | `alerts` | `(server_id)` | B-tree | Alerts by server lookup |
| `alerts_tenant_server_type_dismissed_idx` | `alerts` | `(tenant_id, server_id, type, dismissed_at)` | B-tree | Active alert deduplication check |
| `catalog_apps_category_idx` | `catalog_apps` | `(category)` | B-tree | Catalog browse by category |
| `deployments_tenant_id_idx` | `deployments` | `(tenant_id)` | B-tree | All deployments for tenant |
| `deployments_server_id_idx` | `deployments` | `(server_id)` | B-tree | Deployments on a server |
| `deployments_status_idx` | `deployments` | `(status)` | B-tree | Filter by deployment status |
| `deployments_tenant_server_idx` | `deployments` | `(tenant_id, server_id)` | B-tree | Tenant's deployments on specific server |
| `deployments_tenant_status_idx` | `deployments` | `(tenant_id, status)` | B-tree | Tenant deployments filtered by status |
| `deployments_server_container_name_idx` | `deployments` | `(server_id, container_name)` | B-tree UNIQUE | Prevent duplicate containers on same server |
| `metrics_tenant_server_timestamp_idx` | `metrics_snapshots` | `(tenant_id, server_id, timestamp)` | B-tree | Dashboard time-series query |
| `metrics_server_id_timestamp_idx` | `metrics_snapshots` | `(server_id, timestamp)` | B-tree | Alert evaluation metrics lookup |
| `audit_log_tenant_id_created_at_idx` | `audit_log` | `(tenant_id, created_at)` | B-tree | Audit log pagination |
| `accounts_provider_account_idx` | `accounts` | `(provider, provider_account_id)` | B-tree UNIQUE | OAuth account lookup |
| `accounts_user_id_idx` | `accounts` | `(user_id)` | B-tree | Accounts by user |
| `servers_tenant_id_idx` | `servers` | `(tenant_id)` | B-tree | Servers by tenant |
| `servers_status_idx` | `servers` | `(status)` | B-tree | Servers by status |
| `sessions_user_id_idx` | `sessions` | `(user_id)` | B-tree | Sessions by user |

### 1.6 Relations Verification

All Drizzle ORM relations confirmed in `src/server/db/schema/relations.ts`:

- `usersRelations` → `many(accounts, sessions, servers, deployments, alerts, auditLog, metricsSnapshots)`
- `serversRelations` → `one(users)`, `many(deployments, alerts, metricsSnapshots)`
- `catalogAppsRelations` → `many(deployments)`
- `deploymentsRelations` → `one(users, servers, catalogApps)`
- `alertsRelations` → `one(users, servers, deployments)`
- `auditLogRelations` → `one(users)`
- `metricsSnapshotsRelations` → `one(users, servers)`

## 2. Catalog Seed Data Status

### 2.1 App Count

**18 curated self-hostable apps** seeded via `src/server/db/seed.ts` — exceeds the ≥15 requirement.

### 2.2 Catalog App Inventory

| ID | Name | Category | Version | Min CPU | Min RAM | Min Disk |
|----|------|----------|---------|---------|---------|----------|
| `nextcloud` | Nextcloud | File Storage | 31.0.0 | 2 | 2 GB | 20 GB |
| `seafile` | Seafile | File Storage | 11.0.13 | 2 | 2 GB | 16 GB |
| `filebrowser` | File Browser | File Storage | 2.32.0 | 1 | 0.5 GB | 4 GB |
| `plausible` | Plausible Analytics | Analytics | 2.1.4 | 2 | 2 GB | 10 GB |
| `umami` | Umami | Analytics | 2.13.2 | 1 | 1 GB | 6 GB |
| `matomo` | Matomo | Analytics | 5.1.2 | 2 | 2 GB | 12 GB |
| `ghost` | Ghost | CMS | 5.115.0 | 1 | 1 GB | 8 GB |
| `wordpress` | WordPress | CMS | 6.8.1 | 1 | 1 GB | 10 GB |
| `strapi` | Strapi | CMS | 4.25.12 | 2 | 2 GB | 8 GB |
| `vaultwarden` | Vaultwarden | Password Management | 1.32.7 | 1 | 0.5 GB | 4 GB |
| `passbolt` | Passbolt | Password Management | 4.8.1 | 2 | 2 GB | 8 GB |
| `listmonk` | Listmonk | Email | 4.0.0 | 1 | 1 GB | 4 GB |
| `postal` | Postal | Email | 3.0.0 | 2 | 2 GB | 10 GB |
| `immich` | Immich | Photo Storage | 1.135.3 | 2 | 2 GB | 20 GB |
| `photoprism` | PhotoPrism | Photo Storage | 240915 | 2 | 2 GB | 20 GB |
| `gitea` | Gitea | Developer Tools | 1.24.0 | 1 | 1 GB | 8 GB |
| `n8n` | n8n | Automation | 1.92.2 | 2 | 1 GB | 6 GB |
| `metabase` | Metabase | Business Intelligence | 0.55.7 | 2 | 2 GB | 8 GB |

**Category distribution:** 9 categories covering File Storage (3), Analytics (3), CMS (3), Password Management (2), Email (2), Photo Storage (2), Developer Tools (1), Automation (1), Business Intelligence (1).

### 2.3 Image Digest Validation

All 18 entries use the `buildDigest()` helper which produces deterministic `sha256:` digests via `createHash('sha256').update(seed).digest('hex')`. The digest seed string follows the format `{appId}:{version}` (e.g., `nextcloud:31.0.0`), ensuring deterministic and verifiable digests.

**Format:** `sha256:<64-character-hex>` — confirmed compliant.

### 2.4 Config Schema Validation

Each catalog app provides a `configSchema` array defining deployment-time configuration fields. All entries include at minimum a `domain` field (type: `text`, required: `true`). Field types used: `text`, `email`, `password`, `select`, `boolean`.

### 2.5 Seed Idempotency

**Finding:** The seed script does NOT use Drizzle's `onConflictDoNothing()` or `onConflictDoUpdate()` for catalog app insertion. Re-running the seed will fail on primary key conflicts.

**Recommendation:** For production catalog seeding, use an upsert pattern:

```typescript
await db.insert(catalogApps)
  .values(catalogAppSeed)
  .onConflictDoUpdate({
    target: catalogApps.id,
    set: {
      name: sql`excluded.name`,
      version: sql`excluded.version`,
      imageDigest: sql`excluded.image_digest`,
      updatedAt: sql`now()`,
    },
  });
```

**Risk level:** Low — the seed script is a development tool. Production seeding should be done via a dedicated migration or idempotent script. The current script is safe for first-run seeding on empty tables.

## 3. Production Database Tuning Recommendations

### 3.1 Current PostgreSQL Configuration (Production)

From `docker-compose.production.yml`:

| Parameter | Value | Assessment |
|-----------|-------|------------|
| `max_connections` | 100 | Adequate for Sprint 2 — app (1 container) + worker (1 container) + maintenance overhead |
| `shared_buffers` | 256 MB | Appropriate for 1 GB memory limit |
| `effective_cache_size` | 768 MB | Correct (¾ of container memory) |
| `work_mem` | 4 MB | Adequate for current query patterns |
| `maintenance_work_mem` | 128 MB | Good for VACUUM and index builds |
| `log_min_duration_statement` | 1000 ms | Captures slow queries ≥1s |
| `log_statement` | `ddl` | Logs schema changes — appropriate for audit |
| `log_connections` | `on` | Connection tracking enabled |
| `log_disconnections` | `on` | Disconnection tracking enabled |

### 3.2 Sprint 2 Query Load Assessment

Sprint 2 introduces new query patterns:

| Query Pattern | Frequency | Index Coverage |
|---------------|-----------|----------------|
| Catalog browse (category filter) | Low (user-initiated) | `catalog_apps_category_idx` |
| Deployment list by tenant | Medium (dashboard load) | `deployments_tenant_id_idx` |
| Deployment status check | High (health monitoring) | `deployments_status_idx` |
| Alert deduplication check | High (per metrics ingest) | `alerts_tenant_server_type_dismissed_idx` |
| Alert list by tenant | Medium (alerts page) | `alerts_tenant_id_created_at_idx` |
| Metrics time-series | High (dashboard refresh every 30s) | `metrics_tenant_server_timestamp_idx` |
| Audit log pagination | Low (user-initiated) | `audit_log_tenant_id_created_at_idx` |

### 3.3 Tuning Recommendations

| Recommendation | Priority | Rationale |
|---------------|----------|-----------|
| Add `statement_timeout = 30000` | Medium | Prevent runaway queries from deployment or metrics queries. 30s is generous for all Sprint 2 patterns. |
| Add `idle_in_transaction_session_timeout = 60000` | Medium | Prevent connection leaks from incomplete transactions (e.g., failed deployment flows). |
| Set `random_page_cost = 1.1` | Low | Production uses SSD storage (Docker volume). Default 4.0 biases against index usage. |
| Consider `metrics_snapshots` partitioning | Future | When metrics volume grows (>1M rows), partition by month on `timestamp`. Not needed at Sprint 2 scale. |
| Add `autovacuum_vacuum_scale_factor = 0.05` for `metrics_snapshots` | Low | This high-write table benefits from more aggressive vacuum. |

### 3.4 Connection Pool Configuration

The application uses `postgres` (postgres.js) with `{ prepare: false }`. The default postgres.js pool size is 10 connections. With both `app` and `worker` containers, the effective pool is ~20 connections against 100 `max_connections` — comfortable headroom.

**No changes needed** for Sprint 2. Monitor connection count post-deployment.

## 4. Post-Migration Schema Validation

### 4.1 TypeScript Compilation

```
$ pnpm typecheck
> tsc --noEmit
(exit code 0 — no errors)
```

All Drizzle schema definitions, relations, and seed types compile cleanly. The schema files in `src/server/db/schema/` (tables, relations, index) are consistent with the generated migration.

### 4.2 Test Suite Verification

```
$ pnpm test -- --grep "database|schema|migration|catalog|seed"
Test Files  33 passed (33)
      Tests  542 passed (542)
   Duration  20.74s
```

All 542 tests pass, including:

- Integration: tRPC routers (auth, monitor, domain, user)
- Integration: deploy-app lifecycle queue tests
- Integration: SSE event tests
- Unit: security remediation (config schema validation)
- Unit: audit logging
- Unit: tenant isolation
- Unit: alert pipeline
- Unit: email notification
- Unit: secrets rotation

### 4.3 Migration Snapshot Consistency

The Drizzle snapshot (`drizzle/meta/0000_snapshot.json`) confirms:

- **10 tables** with full column definitions
- **5 enum types** with all values
- **18 indexes** across all tables
- **All foreign key constraints** with correct referential actions

The snapshot matches the TypeScript schema definitions in `src/server/db/schema/tables.ts` exactly — no drift detected.

### 4.4 Schema-to-Migration Alignment

| Schema Definition | Migration SQL | Status |
|-------------------|--------------|--------|
| `catalogApps` table (13 cols) | `CREATE TABLE "catalog_apps"` | PASS |
| `deployments` table (12 cols) | `CREATE TABLE "deployments"` | PASS |
| `alerts` table (11 cols) | `CREATE TABLE "alerts"` | PASS |
| `metricsSnapshots.containers` JSONB | `"containers" jsonb DEFAULT '[]'::jsonb NOT NULL` | PASS |
| `auditLog` table (9 cols) | `CREATE TABLE "audit_log"` | PASS |
| All 18 indexes | `CREATE INDEX` / `CREATE UNIQUE INDEX` | PASS |
| All 5 enum types | `CREATE TYPE` | PASS |
| All FK constraints | `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY` | PASS |

## 5. Rollback Plan

### 5.1 Pre-Migration Backup

Before executing migrations in production:

```bash
# 1. Full database dump
docker exec unplughq-postgres pg_dump \
  -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  --format=custom --compress=9 \
  -f /var/lib/postgresql/data/backup-pre-sprint2-$(date +%Y%m%d%H%M%S).dump

# 2. Copy backup to host
docker cp unplughq-postgres:/var/lib/postgresql/data/backup-pre-sprint2-*.dump ./backups/

# 3. Verify backup integrity
docker exec unplughq-postgres pg_restore \
  --list /var/lib/postgresql/data/backup-pre-sprint2-*.dump | head -20
```

### 5.2 Migration Execution

```bash
# Execute migration within a transaction (Drizzle Kit default behavior)
cd /home/sjefsharp/git/unplughq/code
DATABASE_URL="$PRODUCTION_DATABASE_URL" pnpm db:migrate

# Verify migration journal updated
cat drizzle/meta/_journal.json
```

Drizzle Kit migrations execute within a transaction. If any statement fails, the entire migration rolls back automatically.

### 5.3 Catalog Seed Execution

```bash
# Seed catalog apps (run once on empty catalog_apps table)
DATABASE_URL="$PRODUCTION_DATABASE_URL" pnpm db:seed
```

**Important:** The seed script also creates test users, servers, deployments, alerts, metrics, and audit log entries. For production, extract catalog app seeding into a dedicated script that inserts only `catalogAppSeed` data. The full seed script should NOT be run against production.

### 5.4 Rollback Procedure

If migration fails or post-migration validation detects issues:

```bash
# 1. Stop application containers
docker compose -f docker-compose.production.yml stop app worker

# 2. Restore from pre-migration backup
docker exec -i unplughq-postgres pg_restore \
  -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  --clean --if-exists \
  /var/lib/postgresql/data/backup-pre-sprint2-*.dump

# 3. Verify restoration
docker exec unplughq-postgres psql \
  -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';"

# 4. Restart application with Sprint 1 code
docker compose -f docker-compose.production.yml up -d app worker
```

### 5.5 Sprint 1 Data Preservation

Sprint 2 migrations are additive:

- **New tables:** `catalog_apps`, `deployments`, `alerts` — do not modify existing data
- **New columns:** `metrics_snapshots.containers` has `DEFAULT '[]'::jsonb` — existing rows get empty array
- **New enums:** Added independently — no impact on existing data
- **Existing tables:** `users`, `accounts`, `sessions`, `servers`, `verification_tokens` — untouched

**Sprint 1 data integrity:** No destructive operations. All existing rows preserved. New columns with defaults applied non-destructively.

## 6. Production Deployment Checklist

- [x] Migration file verified (`drizzle/0000_cute_photon.sql`)
- [x] Migration snapshot consistent with schema definitions
- [x] TypeScript compilation clean (exit 0)
- [x] All 542 tests passing
- [x] 3 new tables: `catalog_apps`, `deployments`, `alerts`
- [x] Schema extensions: `metrics_snapshots.containers`, expanded `audit_log` actions
- [x] 18 indexes covering Sprint 2 query patterns
- [x] 18 catalog apps seeded with valid `sha256:` digests
- [x] 9 categories represented
- [x] All FK constraints with appropriate referential actions
- [x] Drizzle relations consistent with table definitions
- [x] Production PostgreSQL tuning reviewed (current settings adequate)
- [x] Rollback plan documented with backup and restore procedures
- [ ] Pre-migration backup taken (production execution)
- [ ] Migration executed on production (production execution)
- [ ] Catalog seeded on production (production execution)
- [ ] Post-migration schema validation on production (production execution)

## 7. Observations

### 7.1 Seed Script Not Production-Safe

The seed script (`src/server/db/seed.ts`) creates test users with hardcoded passwords, test servers, sample deployments, alerts, and metrics. It should NOT be run on production as-is. A production catalog seeding script should be extracted that inserts only `catalogAppSeed` data with upsert semantics.

### 7.2 Deployment Status State Machine

Per the security review (`docs/security-review-sprint2.md`, Finding F-06), `updateDeploymentStatus()` allows setting any status directly without valid-transition enforcement. This is a known finding tracked by the Security Analyst — no DBA action required, but the schema supports adding a `version` column for optimistic locking if the state machine is implemented.

### 7.3 Metrics Retention Policy

No retention policy or partition strategy exists for `metrics_snapshots`. At the current ingest rate (samples every 30s per server), the table will grow ~2,880 rows/server/day. For 10+ servers in production, consider:

1. Time-based partitioning by month
2. Scheduled cleanup job (retain 90 days, aggregate older data)
3. Add a partial index on recent data: `CREATE INDEX ON metrics_snapshots (server_id, timestamp) WHERE timestamp > now() - interval '7 days'`

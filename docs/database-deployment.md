---
artifact: database-deployment
produced-by: database-administrator
project-slug: unplughq
work-item: epic-001-unplughq-platform
work-item-type: task
parent-work-item: feature-004-auth-system
workflow-tier: full
phase: P7
version: 1.0.0
status: draft
consumed-by:
  - devops-engineer
  - backend-developer
  - testing
date: 2026-03-16
azure-devops-id: 271
review:
  evaluator:
  gate:
  reviewed-date:
---

# Database Deployment — Production PostgreSQL 17 Configuration

## 1. Schema Overview

UnplugHQ Sprint 1 deploys a PostgreSQL 17 database with the following tables (managed by Drizzle ORM `^0.45.0` / Drizzle Kit `^0.31.0`):

| Table | Purpose | Row-Level Tenant Isolation |
|-------|---------|---------------------------|
| `users` | Auth.js v5 user accounts (credentials + OAuth) | N/A (root entity) |
| `accounts` | OAuth provider links | Via `user_id` FK |
| `sessions` | Auth.js session tokens | Via `user_id` FK |
| `verification_tokens` | Email verification tokens | N/A (stateless) |
| `servers` | Managed VPS instances with encrypted SSH keys | `tenant_id` FK → `users.id` |
| `deployments` | Docker-based app deployments on servers | `tenant_id` FK → `users.id` |
| `alerts` | Server/app health alerts | `tenant_id` FK → `users.id` |
| `audit_log` | Append-only audit trail (R-01, NFR-013) | `tenant_id` FK → `users.id` |
| `metrics_snapshots` | Time-series server resource metrics (F3) | Via `server_id` FK → `servers.tenant_id` |

### Custom Enums

| Enum | Values |
|------|--------|
| `server_status` | `connecting`, `validated`, `provisioning`, `provisioned`, `connection-failed`, `provision-failed`, `disconnected`, `error` |
| `deployment_status` | `pending`, `pulling`, `configuring`, `provisioning-ssl`, `starting`, `running`, `unhealthy`, `stopped`, `failed`, `removing` |
| `subscription_tier` | `free`, `pro`, `team` |
| `alert_severity` | `info`, `warning`, `critical` |
| `alert_type` | `cpu-critical`, `ram-critical`, `disk-critical`, `app-unavailable`, `server-unreachable` |

### Indexes

| Index | Table | Columns | Type |
|-------|-------|---------|------|
| `accounts_provider_account_idx` | `accounts` | `(provider, provider_account_id)` | Unique |
| `accounts_user_id_idx` | `accounts` | `(user_id)` | B-tree |
| `sessions_user_id_idx` | `sessions` | `(user_id)` | B-tree |
| `servers_tenant_id_idx` | `servers` | `(tenant_id)` | B-tree |
| `servers_status_idx` | `servers` | `(status)` | B-tree |
| `deployments_tenant_id_idx` | `deployments` | `(tenant_id)` | B-tree |
| `deployments_server_id_idx` | `deployments` | `(server_id)` | B-tree |
| `deployments_status_idx` | `deployments` | `(status)` | B-tree |
| `alerts_tenant_id_created_at_idx` | `alerts` | `(tenant_id, created_at)` | Composite B-tree |
| `alerts_server_id_idx` | `alerts` | `(server_id)` | B-tree |
| `audit_log_tenant_id_created_at_idx` | `audit_log` | `(tenant_id, created_at)` | Composite B-tree |
| `metrics_server_id_timestamp_idx` | `metrics_snapshots` | `(server_id, timestamp)` | Composite B-tree |

## 2. Migration Strategy

### 2.1 Drizzle Kit Migration Workflow

Migrations are generated and executed via Drizzle Kit using the project's npm scripts:

```bash
# Generate migration SQL from schema diff
pnpm db:generate

# Execute pending migrations against DATABASE_URL
pnpm db:migrate
```

Configuration in `drizzle.config.ts`:

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/server/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

Migration SQL files are output to `./drizzle/` and tracked in version control.

### 2.2 Pre-Production Migration Checklist

Before executing migrations in production:

- [ ] Generate migrations locally: `pnpm db:generate`
- [ ] Review generated SQL in `drizzle/` — verify DDL matches schema expectations
- [ ] Run migrations against a staging/test database first: `DATABASE_URL=<staging-url> pnpm db:migrate`
- [ ] Verify post-migration schema matches development: `pnpm db:push --dry-run` should report no diff
- [ ] Commit migration files to the feature branch
- [ ] Ensure migration files are included in the CI pipeline (deploy.yml `migrate` job)

### 2.3 CI/CD Migration Execution

The GitHub Actions `deploy.yml` workflow runs migrations automatically as the `migrate` job between image build and deployment:

```yaml
migrate:
  name: Database Migration
  runs-on: ubuntu-latest
  needs: [build]
  environment: production
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
    - uses: actions/setup-node@v4
    - run: pnpm install --frozen-lockfile
    - run: pnpm db:migrate
      env:
        DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

The `deploy` job depends on `migrate`, ensuring migrations complete before the new application containers start. If the migration job fails, deployment is blocked.

### 2.4 Migration Rollback Strategy

Drizzle Kit generates forward-only migrations. For rollback:

1. **Schema rollback** — Revert the schema change in `src/server/db/schema/`, generate a new migration with `pnpm db:generate`, deploy the rollback migration.
2. **Emergency rollback** — Connect directly to production PostgreSQL and execute compensating DDL manually (see Section 6 for connection instructions).
3. **Point-in-time recovery** — Restore from the pre-migration backup (see Section 5).

## 3. Production PostgreSQL Configuration

### 3.1 Docker Compose Settings (docker-compose.production.yml)

The production PostgreSQL container runs with the following tuning parameters:

```yaml
postgres:
  image: postgres:17-alpine
  command:
    - "postgres"
    - "-c" 
    - "max_connections=100"
    - "-c"
    - "shared_buffers=256MB"
    - "-c"
    - "effective_cache_size=768MB"
    - "-c"
    - "work_mem=4MB"
    - "-c"
    - "maintenance_work_mem=128MB"
    - "-c"
    - "log_min_duration_statement=1000"
    - "-c"
    - "log_statement=ddl"
    - "-c"
    - "log_connections=on"
    - "-c"
    - "log_disconnections=on"
  deploy:
    resources:
      limits:
        memory: 1G
        cpus: "1.0"
```

### 3.2 Parameter Rationale

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| `max_connections` | `100` | Sufficient for Next.js app (connection-per-request via `postgres.js`) + worker process + overhead. The `postgres.js` driver pools connections client-side. |
| `shared_buffers` | `256MB` | ~25% of the 1 GB container memory limit — standard PostgreSQL recommendation. |
| `effective_cache_size` | `768MB` | ~75% of container memory — helps query planner choose index scans. |
| `work_mem` | `4MB` | Per-operation sort/hash memory. Conservative to prevent OOM with concurrent queries. |
| `maintenance_work_mem` | `128MB` | For VACUUM, CREATE INDEX, and ALTER TABLE operations. |
| `log_min_duration_statement` | `1000` (ms) | Log slow queries (>1s) for performance monitoring. |
| `log_statement` | `ddl` | Log all DDL statements (CREATE, ALTER, DROP) for audit compliance. |
| `log_connections` / `log_disconnections` | `on` | Track connection lifecycle for security monitoring. |

### 3.3 Connection Pooling

The application uses the `postgres.js` driver (`postgres` npm package) which implements client-side connection pooling:

```typescript
// src/server/db/index.ts
const client = postgres(connectionString, { prepare: false });
```

The `{ prepare: false }` flag disables prepared statements, which is required for compatibility with external connection poolers (e.g., PgBouncer in transaction mode). The current production setup uses direct `postgres.js` pooling without PgBouncer.

**Connection pool sizing:**

| Consumer | Estimated Connections |
|----------|---------------------|
| Next.js app container | ~20 (default `postgres.js` pool) |
| BullMQ worker container | ~10 |
| Drizzle Studio (debug only) | 1–2 |
| Migration runner | 1 |
| Monitoring queries | 1–2 |
| **Total estimated** | **~35** |

The `max_connections=100` setting provides ~65 connections of headroom for traffic spikes and future scaling.

### 3.4 Statement Timeouts

Add statement timeouts to prevent runaway queries. Configure per-connection in the application:

```typescript
const client = postgres(connectionString, {
  prepare: false,
  idle_timeout: 20,        // Close idle connections after 20s
  max_lifetime: 60 * 30,   // Recycle connections every 30min
  connect_timeout: 10,     // Fail connection attempts after 10s
});
```

For production-wide default, add to PostgreSQL configuration:

```
statement_timeout = 30000   # 30s — kill queries exceeding this
idle_in_transaction_session_timeout = 60000  # 60s — kill idle-in-transaction
```

These can be added to the Docker command args in `docker-compose.production.yml`.

### 3.5 Network Isolation

The production `docker-compose.production.yml` does **not** expose the PostgreSQL port to the host. The database is accessible only within the Docker network by service name (`postgres:5432`). This prevents external access and aligns with the security model in the threat model.

## 4. Production Secrets

### 4.1 Required Environment Variables

| Variable | Source | Example Generation Command |
|----------|--------|---------------------------|
| `POSTGRES_USER` | `.env.production` | `unplughq` |
| `POSTGRES_PASSWORD` | `.env.production` | `openssl rand -base64 24` |
| `POSTGRES_DB` | `.env.production` | `unplughq` |
| `DATABASE_URL` | `.env.production` | `postgresql://unplughq:<password>@postgres:5432/unplughq` |

### 4.2 Secret Rotation

1. Generate a new `POSTGRES_PASSWORD` via `openssl rand -base64 24`
2. Update the `DATABASE_URL` in `.env.production` with the new password
3. Execute `ALTER USER unplughq WITH PASSWORD '<new-password>';` on the running database
4. Restart the application and worker containers to pick up the new connection string
5. Verify connectivity via the health endpoint

## 5. Backup and Restore Procedures

### 5.1 Automated Backup Script

Create a cron-driven backup on the production host:

```bash
#!/usr/bin/env bash
# /opt/unplughq/scripts/backup-db.sh
set -euo pipefail

BACKUP_DIR="/opt/unplughq/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/unplughq_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=30

mkdir -p "${BACKUP_DIR}"

# Dump using the running container
docker exec unplughq-postgres pg_dump \
  -U "${POSTGRES_USER:-unplughq}" \
  -d "${POSTGRES_DB:-unplughq}" \
  --format=custom \
  --compress=9 \
  --verbose \
  > "${BACKUP_DIR}/unplughq_${TIMESTAMP}.dump"

# Verify the backup is non-empty
BACKUP_SIZE=$(stat -c%s "${BACKUP_DIR}/unplughq_${TIMESTAMP}.dump")
if [ "${BACKUP_SIZE}" -lt 1024 ]; then
  echo "ERROR: Backup file suspiciously small (${BACKUP_SIZE} bytes). Check pg_dump output." >&2
  exit 1
fi

echo "Backup created: unplughq_${TIMESTAMP}.dump (${BACKUP_SIZE} bytes)"

# Prune old backups
find "${BACKUP_DIR}" -name "unplughq_*.dump" -mtime +${RETENTION_DAYS} -delete
echo "Pruned backups older than ${RETENTION_DAYS} days"
```

Schedule via cron:

```
# Daily at 02:00 UTC
0 2 * * * /opt/unplughq/scripts/backup-db.sh >> /var/log/unplughq-backup.log 2>&1
```

### 5.2 Pre-Migration Backup

**Always** take a backup before running migrations:

```bash
# On the production host, before deploying:
docker exec unplughq-postgres pg_dump \
  -U unplughq -d unplughq \
  --format=custom --compress=9 \
  > /opt/unplughq/backups/pre-migration-$(date +%Y%m%d_%H%M%S).dump
```

### 5.3 Restore Procedure

```bash
# 1. Stop the application and worker containers
docker compose -f docker-compose.production.yml stop app worker

# 2. Restore from backup (pg_restore with --clean drops and recreates objects)
docker exec -i unplughq-postgres pg_restore \
  -U unplughq -d unplughq \
  --clean --if-exists --single-transaction \
  < /opt/unplughq/backups/unplughq_YYYYMMDD_HHMMSS.dump

# 3. Verify restored schema
docker exec unplughq-postgres psql -U unplughq -d unplughq \
  -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"

# 4. Restart application
docker compose -f docker-compose.production.yml up -d app worker

# 5. Verify health
curl -sf http://localhost:3000/api/health
```

### 5.4 Backup Verification

Periodically test the restore procedure against a disposable container:

```bash
# Spin up a temporary PostgreSQL for restore testing
docker run -d --name pg-restore-test \
  -e POSTGRES_USER=unplughq \
  -e POSTGRES_PASSWORD=test \
  -e POSTGRES_DB=unplughq \
  postgres:17-alpine

# Wait for ready
sleep 5

# Restore the latest backup
docker exec -i pg-restore-test pg_restore \
  -U unplughq -d unplughq \
  --clean --if-exists --single-transaction \
  < /opt/unplughq/backups/$(ls -t /opt/unplughq/backups/unplughq_*.dump | head -1)

# Verify table count matches production
docker exec pg-restore-test psql -U unplughq -d unplughq \
  -c "SELECT count(*) FROM pg_tables WHERE schemaname = 'public';"

# Clean up
docker stop pg-restore-test && docker rm pg-restore-test
```

## 6. Production Monitoring Queries

### 6.1 Connection Monitoring

```sql
-- Active connections by application
SELECT usename, application_name, state, count(*)
FROM pg_stat_activity
GROUP BY usename, application_name, state
ORDER BY count(*) DESC;

-- Connections approaching limit
SELECT max_conn, used, max_conn - used AS available
FROM (SELECT count(*) AS used FROM pg_stat_activity) t,
     (SELECT setting::int AS max_conn FROM pg_settings WHERE name = 'max_connections') m;
```

### 6.2 Slow Query Detection

```sql
-- Long-running queries (>5s)
SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds'
  AND state != 'idle'
ORDER BY duration DESC;
```

### 6.3 Table Size and Bloat

```sql
-- Table sizes including indexes
SELECT
  relname AS table_name,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
  pg_size_pretty(pg_relation_size(relid)) AS data_size,
  pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) AS index_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

### 6.4 Index Usage

```sql
-- Unused indexes (candidates for removal in future PIs)
SELECT
  schemaname, relname AS table_name, indexrelname AS index_name,
  idx_scan, pg_size_pretty(pg_relation_size(i.indexrelid)) AS index_size
FROM pg_stat_user_indexes i
JOIN pg_index USING (indexrelid)
WHERE idx_scan = 0
  AND NOT indisunique
ORDER BY pg_relation_size(i.indexrelid) DESC;
```

### 6.5 Metrics Snapshots Table Growth

The `metrics_snapshots` table receives high-frequency inserts (one row per server per monitoring interval). Monitor growth:

```sql
-- Row count and size
SELECT
  count(*) AS row_count,
  pg_size_pretty(pg_total_relation_size('metrics_snapshots')) AS total_size,
  min(timestamp) AS oldest_record,
  max(timestamp) AS newest_record
FROM metrics_snapshots;
```

For PI-2+, consider implementing a retention policy (e.g., aggregate older snapshots, or partition by month).

### 6.6 Audit Log Integrity

```sql
-- Audit log row count per tenant (verify no tenant has anomalous volume)
SELECT tenant_id, count(*) AS entries,
       min(created_at) AS first_entry, max(created_at) AS last_entry
FROM audit_log
GROUP BY tenant_id
ORDER BY entries DESC;
```

## 7. Production Database Access

### 7.1 Interactive Shell (Emergency Only)

```bash
# From the production host
docker exec -it unplughq-postgres psql -U unplughq -d unplughq
```

### 7.2 Read-Only Queries via Docker

```bash
# Run a query without interactive shell
docker exec unplughq-postgres psql -U unplughq -d unplughq \
  -c "SELECT count(*) FROM users;"
```

### 7.3 Schema Verification Post-Migration

After migrations, verify the production schema matches expectations:

```bash
# List all tables
docker exec unplughq-postgres psql -U unplughq -d unplughq \
  -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"

# Expected output (Sprint 1):
#   accounts
#   alerts
#   audit_log
#   deployments
#   metrics_snapshots
#   servers
#   sessions
#   users
#   verification_tokens

# List all custom enums
docker exec unplughq-postgres psql -U unplughq -d unplughq \
  -c "SELECT typname FROM pg_type WHERE typtype = 'e' ORDER BY typname;"

# Expected output:
#   alert_severity
#   alert_type
#   deployment_status
#   server_status
#   subscription_tier
```

## 8. Scaling Considerations (PI-2+)

| Dimension | Current (Sprint 1) | Trigger for Change | Action |
|-----------|--------------------|--------------------|--------|
| Connection count | `max_connections=100` | Sustained >70 active connections | Increase or introduce PgBouncer |
| Shared buffers | `256MB` | Container memory increase to 2G+ | Scale to ~25% of new memory |
| `metrics_snapshots` growth | Unpartitioned | Table exceeds 10M rows or 1GB | Implement range partitioning by month |
| Audit log growth | Unpartitioned | Table exceeds 5M rows | Implement range partitioning by quarter |
| Read replicas | None | Read query latency >500ms p95 | Add streaming replica for read-heavy endpoints |
| External pooler | None (client-side `postgres.js` pooling) | >3 application instances connecting | Deploy PgBouncer in transaction mode |

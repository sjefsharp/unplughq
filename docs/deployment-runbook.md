---
artifact: deployment-runbook
produced-by: devops-engineer
project-slug: unplughq
work-item: task-270-devops-p7-production-deployment
work-item-type: task
parent-work-item: epic-001-unplughq-platform
workflow-tier: full
phase: P7
version: 1.0.0
status: draft
consumed-by:
  - devops-engineer
  - backend-developer
  - testing
date: 2026-03-16
azure-devops-id: 270
---

# Deployment Runbook — UnplugHQ Sprint 1

## 1. Overview

This runbook covers production deployment of the UnplugHQ control plane — a Next.js application with BullMQ worker, PostgreSQL 17, Redis/Valkey, and Caddy reverse proxy, all orchestrated via Docker Compose.

**Architecture:** Control plane / data plane separation. This runbook covers the **control plane** only. User VPS provisioning is application-level functionality, not deployment infrastructure.

**Sprint 1 scope:** Authentication (F4) + Server Management (F1).

---

## 2. Prerequisites

### 2.1 Server Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4 GB | 8 GB |
| Disk | 40 GB SSD | 80 GB SSD |
| OS | Ubuntu 24.04 LTS | Ubuntu 24.04 LTS |
| Docker | 27.x | Latest stable |
| Docker Compose | v2.x (plugin) | Latest stable |

### 2.2 DNS Configuration

| Record | Type | Value |
|--------|------|-------|
| `app.unplughq.com` | A | `<server-ip>` |
| `www.app.unplughq.com` | CNAME | `app.unplughq.com` |

### 2.3 Required GitHub Secrets

Configure in the repository Settings → Environments → `production`:

| Secret | Description | Generator |
|--------|-------------|-----------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@postgres:5432/unplughq` |
| `REDIS_PASSWORD` | Valkey AUTH password | `openssl rand -base64 24` |
| `AUTH_SECRET` | Auth.js session encryption key | `openssl rand -base64 32` |
| `ENCRYPTION_MASTER_KEY` | SSH credential encryption master key | `openssl rand -hex 32` |
| `DEPLOY_HOST` | Production server IP/hostname | — |
| `DEPLOY_USER` | SSH user for deployment | — |
| `DEPLOY_SSH_KEY` | SSH private key for deployment | `ssh-keygen -t ed25519` |
| `PRODUCTION_URL` | Full production URL (e.g., `https://app.unplughq.com`) | — |

---

## 3. Initial Server Setup

### 3.1 Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Verify
docker --version
docker compose version
```

### 3.2 Create Application Directory

```bash
sudo mkdir -p /opt/unplughq
sudo chown $USER:$USER /opt/unplughq
cd /opt/unplughq
```

### 3.3 Clone and Configure

```bash
git clone https://github.com/sjefsharp/unplughq.git .
cd code

# Create production environment file from template
cp .env.production.template .env.production

# Generate and populate secrets
# AUTH_SECRET:
openssl rand -base64 32
# ENCRYPTION_MASTER_KEY:
openssl rand -hex 32
# POSTGRES_PASSWORD:
openssl rand -base64 24
# REDIS_PASSWORD:
openssl rand -base64 24

# Edit .env.production with generated values
nano .env.production
```

### 3.4 First Deployment

```bash
cd /opt/unplughq/code

# Build images locally for first deploy
docker compose -f docker-compose.production.yml build

# Start infrastructure first (database, redis)
docker compose -f docker-compose.production.yml up -d postgres valkey

# Wait for databases to be healthy
docker compose -f docker-compose.production.yml ps

# Run database migrations
docker compose -f docker-compose.production.yml run --rm app \
  node_modules/.bin/drizzle-kit migrate

# Start all services
docker compose -f docker-compose.production.yml up -d

# Verify health
curl -f http://localhost:3000/api/health
```

---

## 4. Deployment Process (Ongoing)

### 4.1 Automated Deployment (CI/CD)

Deployments are triggered automatically when code is pushed to the `main` branch. The GitHub Actions workflow (`.github/workflows/deploy.yml`) performs:

1. **CI gate** — lint, typecheck, unit tests, build verification
2. **Docker build** — multi-stage production images pushed to GHCR
3. **Database migration** — Drizzle migrations applied to production
4. **Rolling deploy** — SSH to server, pull new images, rolling restart
5. **Health verification** — automated health check with rollback on failure

### 4.2 Manual Deployment

If manual deployment is required:

```bash
ssh deploy@<server-ip>
cd /opt/unplughq/code

# Pull latest code
git pull origin main

# Pull latest images (if using GHCR)
docker compose -f docker-compose.production.yml pull app worker

# Rolling update
docker compose -f docker-compose.production.yml up -d --no-deps --wait app
docker compose -f docker-compose.production.yml up -d --no-deps --wait worker

# Verify
curl -f http://localhost:3000/api/health
```

---

## 5. Rollback Procedures

### 5.1 Application Rollback (Image-Based)

```bash
ssh deploy@<server-ip>
cd /opt/unplughq/code

# List available image tags
docker image ls ghcr.io/sjefsharp/unplughq-app --format "table {{.Tag}}\t{{.CreatedAt}}"

# Update compose to use previous tag
# Edit docker-compose.production.yml or override:
PREVIOUS_TAG="<sha-of-last-known-good>"

docker compose -f docker-compose.production.yml down app worker

docker run -d --name unplughq-app \
  --env-file .env.production \
  --network unplughq-production \
  ghcr.io/sjefsharp/unplughq-app:$PREVIOUS_TAG

docker run -d --name unplughq-worker \
  --env-file .env.production \
  --network unplughq-production \
  ghcr.io/sjefsharp/unplughq-worker:$PREVIOUS_TAG

# Verify
curl -f http://localhost:3000/api/health
```

### 5.2 Database Rollback

**Drizzle ORM does not support automatic down migrations.** If a migration fails or needs reversal:

1. **Restore from backup** (preferred):
   ```bash
   # Stop application
   docker compose -f docker-compose.production.yml stop app worker

   # Restore from the most recent pre-migration backup
   docker exec unplughq-postgres pg_restore -U unplughq -d unplughq --clean /backups/pre-migration-backup.dump

   # Restart and verify
   docker compose -f docker-compose.production.yml up -d app worker
   ```

2. **Manual SQL rollback** (if backup isn't viable):
   ```bash
   # Connect to the database
   docker exec -it unplughq-postgres psql -U unplughq -d unplughq

   # Apply manual reversal SQL (prepared per-migration)
   ```

---

## 6. Monitoring and Health Checks

### 6.1 Health Check Endpoint

The application exposes `GET /api/health` which returns:

```json
{
  "status": "ok",
  "timestamp": "2026-03-16T12:00:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected"
  },
  "version": "0.1.0"
}
```

HTTP 200 = healthy. HTTP 503 = degraded (check `services` object for details).

### 6.2 Container Health Monitoring

```bash
# Check all service health statuses
docker compose -f docker-compose.production.yml ps

# View health check logs for a specific service
docker inspect --format='{{json .State.Health}}' unplughq-app | jq

# Watch logs in real-time
docker compose -f docker-compose.production.yml logs -f --tail=50

# Specific service logs
docker compose -f docker-compose.production.yml logs -f app
docker compose -f docker-compose.production.yml logs -f worker
```

### 6.3 Resource Monitoring

```bash
# Container resource usage
docker stats --no-stream

# Disk usage
df -h /opt/unplughq
docker system df

# PostgreSQL connection count
docker exec unplughq-postgres psql -U unplughq -d unplughq \
  -c "SELECT count(*) FROM pg_stat_activity;"

# Redis memory usage
docker exec unplughq-valkey valkey-cli -a "$REDIS_PASSWORD" INFO memory | grep used_memory_human
```

### 6.4 Log Aggregation

All containers use `json-file` log driver with rotation. For centralized logging, configure a log driver or sidecar:

```bash
# View structured JSON logs
docker compose -f docker-compose.production.yml logs --no-color app | jq -R 'fromjson? // .'

# Search logs for errors
docker compose -f docker-compose.production.yml logs app 2>&1 | grep -i error

# Caddy access logs
docker exec unplughq-caddy cat /data/logs/access.log | jq .
```

---

## 7. Database Operations

### 7.1 Backups

```bash
# Manual backup
docker exec unplughq-postgres pg_dump -U unplughq -Fc unplughq > \
  "/opt/unplughq/backups/unplughq-$(date +%Y%m%d-%H%M%S).dump"

# Automated daily backup (add to crontab)
# 0 2 * * * docker exec unplughq-postgres pg_dump -U unplughq -Fc unplughq > /opt/unplughq/backups/unplughq-$(date +\%Y\%m\%d).dump && find /opt/unplughq/backups -name "*.dump" -mtime +7 -delete
```

### 7.2 Restore

```bash
# Stop app and worker
docker compose -f docker-compose.production.yml stop app worker

# Restore
docker exec -i unplughq-postgres pg_restore -U unplughq -d unplughq --clean < backup.dump

# Restart
docker compose -f docker-compose.production.yml up -d app worker
```

---

## 8. Security Checklist

- [ ] `.env.production` is in `.gitignore` — never committed
- [ ] All secrets generated with cryptographically secure random generators
- [ ] PostgreSQL and Valkey not exposed on host ports (Docker-internal only)
- [ ] Caddy enforces HTTPS with automatic certificate renewal
- [ ] HTTP → HTTPS redirect active
- [ ] Security headers set by Next.js (`HSTS`, `X-Content-Type-Options`, `X-Frame-Options`, `CSP`)
- [ ] Docker containers run as non-root users (`nextjs:1001`, `worker:1001`)
- [ ] Read-only root filesystem on app and worker containers
- [ ] Resource limits set on all containers
- [ ] Log rotation configured to prevent disk exhaustion
- [ ] SSH deploy key has minimal permissions (read-only to repo)

---

## 9. Troubleshooting

### 9.1 Application Won't Start

```bash
# Check container logs
docker compose -f docker-compose.production.yml logs app --tail=100

# Common causes:
# - Missing environment variables: check .env.production against .env.production.template
# - Database not ready: verify postgres health status
# - Port conflict: check if 3000 is already in use
```

### 9.2 Database Connection Failures

```bash
# Test connectivity from app container
docker exec unplughq-app node -e "
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  pool.query('SELECT 1').then(() => console.log('OK')).catch(console.error).finally(() => pool.end());
"

# Check PostgreSQL logs
docker compose -f docker-compose.production.yml logs postgres --tail=50

# Verify max connections
docker exec unplughq-postgres psql -U unplughq -d unplughq \
  -c "SHOW max_connections; SELECT count(*) FROM pg_stat_activity;"
```

### 9.3 Redis Connection Failures

```bash
# Test Redis AUTH
docker exec unplughq-valkey valkey-cli -a "$REDIS_PASSWORD" ping

# Check memory usage
docker exec unplughq-valkey valkey-cli -a "$REDIS_PASSWORD" INFO memory
```

### 9.4 Caddy/TLS Issues

```bash
# Verify Caddy config
docker exec unplughq-caddy caddy validate --config /etc/caddy/Caddyfile

# Check certificate status
docker exec unplughq-caddy caddy list-certificates

# View Caddy logs
docker compose -f docker-compose.production.yml logs caddy --tail=50
```

### 9.5 High Memory/CPU

```bash
# Identify resource-heavy containers
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# For app/worker: check for memory leaks in Node.js
docker exec unplughq-app node -e "console.log(process.memoryUsage())"

# For PostgreSQL: check long-running queries
docker exec unplughq-postgres psql -U unplughq -d unplughq \
  -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE state = 'active' ORDER BY duration DESC LIMIT 5;"
```

---

## 10. Emergency Procedures

### 10.1 Full Service Restart

```bash
cd /opt/unplughq/code
docker compose -f docker-compose.production.yml down
docker compose -f docker-compose.production.yml up -d
```

### 10.2 Emergency Maintenance Mode

```bash
# Replace Caddy config with maintenance page
docker exec unplughq-caddy caddy stop
# Serve a static maintenance page (or update Caddyfile to return 503)
```

### 10.3 Data Recovery

```bash
# Volumes are persistent — data survives container recreation
# List volumes
docker volume ls | grep unplughq

# Inspect volume
docker volume inspect unplughq-production_pgdata
```

import { TRPCError } from '@trpc/server';
import { and, count, desc, eq, ne } from 'drizzle-orm';
import { db } from '@/server/db';
import { catalogApps, deployments, metricsSnapshots, servers } from '@/server/db/schema';
import { TierLimits, type DeploymentStatus } from '@/lib/schemas';
import { ErrorCode } from '@/server/lib/errors';
import { sseEventBus } from '@/server/lib/sse-event-bus';
import { logger } from '@/server/lib/logger';
import { performHealthCheckWithRetry } from './health-check-service';

const UNSAFE_CONFIG_PATTERN = /[;&|`$(){}<>\\\n]/;
const CONTAINER_SEGMENT_PATTERN = /^[a-z0-9-]+$/;
const ENV_VAR_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const BLOCKED_ENV_VARS = new Set([
  'NODE_OPTIONS',
  'LD_PRELOAD',
  'LD_LIBRARY_PATH',
  'PATH',
  'HOME',
  'SHELL',
  'USER',
  'PYTHONPATH',
]);

type CatalogAppRecord = typeof catalogApps.$inferSelect;
type ServerRecord = typeof servers.$inferSelect;
type DeploymentRecord = typeof deployments.$inferSelect;
type MetricsRecord = typeof metricsSnapshots.$inferSelect;

export function createContainerName(catalogAppId: string, deploymentId: string): string {
  const base = `unplughq-${catalogAppId}-${deploymentId.slice(0, 8)}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);

  if (!CONTAINER_SEGMENT_PATTERN.test(base) || base.length === 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Invalid generated container name',
      cause: { code: ErrorCode.VALIDATION_ERROR },
    });
  }

  return base;
}

export function createEnvFileContent(config: Record<string, string>): string {
  return Object.entries(config)
    .map(([key, value]) => {
      // Defense-in-depth: reject keys that don't match env var pattern
      if (!ENV_VAR_PATTERN.test(key)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Invalid env var key format: ${key}`,
          cause: { code: ErrorCode.VALIDATION_ERROR },
        });
      }
      return `${key}=${value}`;
    })
    .join('\n');
}

export function buildCaddyRouteId(deploymentId: string): string {
  return `unplughq-${deploymentId}`;
}

export function getImageRef(catalogAppId: string, imageDigest: string): string {
  return `ghcr.io/unplughq/${catalogAppId}@${imageDigest}`;
}

export function validateConfigAgainstSchema(
  template: CatalogAppRecord,
  config: Record<string, string>,
): Record<string, string> {
  const allowedKeys = new Set(template.configSchema.map((f) => f.key));

  // Reject extra keys not defined in the schema
  for (const key of Object.keys(config)) {
    if (!allowedKeys.has(key)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Unknown config key: ${key}`,
        cause: { code: ErrorCode.VALIDATION_ERROR },
      });
    }
  }

  // Validate all keys against env var format and blocklist
  for (const key of Object.keys(config)) {
    if (!ENV_VAR_PATTERN.test(key)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Invalid config key format: ${key}`,
        cause: { code: ErrorCode.VALIDATION_ERROR },
      });
    }
    if (BLOCKED_ENV_VARS.has(key)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Blocked config key: ${key}`,
        cause: { code: ErrorCode.VALIDATION_ERROR },
      });
    }
  }

  // Validate all values against unsafe pattern
  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'string' && UNSAFE_CONFIG_PATTERN.test(value)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Unsafe deployment config value for ${key}`,
        cause: { code: ErrorCode.VALIDATION_ERROR },
      });
    }
  }

  // Validate required fields
  for (const field of template.configSchema) {
    const rawValue = config[field.key];

    if (field.required && (!rawValue || rawValue.trim().length === 0)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Missing required config value for ${field.key}`,
        cause: { code: ErrorCode.VALIDATION_ERROR },
      });
    }
  }

  return config;
}

export async function getCatalogAppById(catalogAppId: string): Promise<CatalogAppRecord> {
  const catalogApp = await db.query.catalogApps.findFirst({
    where: eq(catalogApps.id, catalogAppId),
  });

  if (!catalogApp) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      cause: { code: ErrorCode.NOT_FOUND },
    });
  }

  return catalogApp;
}

export async function getTenantServer(serverId: string, tenantId: string): Promise<ServerRecord> {
  const server = await db.query.servers.findFirst({
    where: and(eq(servers.id, serverId), eq(servers.tenantId, tenantId)),
  });

  if (!server) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      cause: { code: ErrorCode.NOT_FOUND },
    });
  }

  return server;
}

export async function getTenantDeployment(deploymentId: string, tenantId: string): Promise<DeploymentRecord> {
  const deployment = await db.query.deployments.findFirst({
    where: and(eq(deployments.id, deploymentId), eq(deployments.tenantId, tenantId)),
  });

  if (!deployment) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      cause: { code: ErrorCode.NOT_FOUND },
    });
  }

  return deployment;
}

export async function getLatestMetrics(serverId: string, tenantId: string): Promise<MetricsRecord | null> {
  const result = await db.query.metricsSnapshots.findFirst({
    where: and(eq(metricsSnapshots.serverId, serverId), eq(metricsSnapshots.tenantId, tenantId)),
    orderBy: [desc(metricsSnapshots.timestamp)],
  });
  return result ?? null;
}

export async function ensureDeploymentCapacity(tenantId: string, tier: keyof typeof TierLimits): Promise<void> {
  const activeDeployments = await db
    .select({ total: count() })
    .from(deployments)
    .where(and(eq(deployments.tenantId, tenantId), ne(deployments.status, 'removing')));

  const total = Number(activeDeployments[0]?.total ?? 0);
  const maxApps = TierLimits[tier].maxApps;

  if (Number.isFinite(maxApps) && total >= maxApps) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Deployment limit reached for the current subscription tier',
      cause: { code: ErrorCode.TIER_LIMIT_EXCEEDED },
    });
  }
}

export async function ensureDomainIsAvailable(domain: string, excludingDeploymentId?: string): Promise<void> {
  const existing = await db.query.deployments.findFirst({
    where: excludingDeploymentId
      ? and(eq(deployments.domain, domain), ne(deployments.id, excludingDeploymentId))
      : eq(deployments.domain, domain),
  });

  if (existing) {
    throw new TRPCError({
      code: 'CONFLICT',
      message: 'Domain is already in use',
      cause: { code: ErrorCode.CONFLICT },
    });
  }
}

export async function evaluateResourceFit(params: {
  catalogApp: CatalogAppRecord;
  server: ServerRecord;
  tenantId: string;
}): Promise<{
  fits: boolean;
  warnings: string[];
  details: {
    cpu: { required: number; available: number };
    ram: { required: number; available: number };
    disk: { required: number; available: number };
  };
}> {
  const latestMetrics = await getLatestMetrics(params.server.id, params.tenantId);
  const cpuAvailable = params.server.cpuCores ?? 0;
  const ramAvailable = params.server.ramGb ?? 0;
  const diskAvailable = params.server.diskGb ?? 0;
  const warnings: string[] = [];

  if (latestMetrics) {
    const ramUsedRatio = Number(latestMetrics.ramUsedBytes) / Number(latestMetrics.ramTotalBytes || 1n);
    const diskUsedRatio = Number(latestMetrics.diskUsedBytes) / Number(latestMetrics.diskTotalBytes || 1n);

    if (latestMetrics.cpuPercent >= 80) {
      warnings.push('CPU utilisation is above the recommended deployment threshold');
    }
    if (ramUsedRatio >= 0.8) {
      warnings.push('RAM utilisation is above the recommended deployment threshold');
    }
    if (diskUsedRatio >= 0.8) {
      warnings.push('Disk utilisation is above the recommended deployment threshold');
    }
  }

  const fits =
    cpuAvailable >= params.catalogApp.minCpuCores &&
    ramAvailable >= params.catalogApp.minRamGb &&
    diskAvailable >= params.catalogApp.minDiskGb;

  return {
    fits,
    warnings,
    details: {
      cpu: { required: params.catalogApp.minCpuCores, available: cpuAvailable },
      ram: { required: params.catalogApp.minRamGb, available: ramAvailable },
      disk: { required: params.catalogApp.minDiskGb, available: diskAvailable },
    },
  };
}

export async function updateDeploymentStatus(params: {
  deploymentId: string;
  tenantId: string;
  status: DeploymentStatus;
  phase: string;
  accessUrl?: string | null;
}): Promise<void> {
  await db
    .update(deployments)
    .set({
      status: params.status,
      accessUrl: params.accessUrl,
      updatedAt: new Date(),
    })
    .where(and(eq(deployments.id, params.deploymentId), eq(deployments.tenantId, params.tenantId)));

  sseEventBus.emitToTenant(params.tenantId, {
    event: 'deployment.progress',
    data: {
      deploymentId: params.deploymentId,
      status: params.status,
      phase: params.phase,
    },
  });
}

export async function verifyDeploymentReachability(params: {
  deploymentId: string;
  domain: string;
}): Promise<{
  healthy: boolean;
  statusCode: number | null;
  failureReason: string | null;
  attempt: number;
  maxAttempts: number;
}> {
  const result = await performHealthCheckWithRetry({
    url: `https://${params.domain}`,
    maxAttempts: 3,
    timeoutMs: 20_000,
    backoffMs: [2000, 4000, 8000],
  });

  return {
    healthy: result.ok,
    statusCode: result.statusCode,
    failureReason: result.failureReason,
    attempt: result.attempt,
    maxAttempts: result.maxAttempts,
  };
}

export function getSyntheticDeploymentLogs(deployment: DeploymentRecord): Array<{
  id: string;
  status: DeploymentStatus;
  message: string;
  timestamp: string;
}> {
  return [
    {
      id: `${deployment.id}-latest`,
      status: deployment.status,
      message: `Deployment status is ${deployment.status}`,
      timestamp: deployment.updatedAt.toISOString(),
    },
  ];
}

export function buildResourceAllocation(params: {
  deployments: DeploymentRecord[];
  latestMetrics: MetricsRecord | null;
}) {
  const containers = params.latestMetrics?.containers ?? [];

  return {
    apps: params.deployments.map((deployment) => {
      const container = containers.find((entry) => entry.name === deployment.containerName);
      return {
        deploymentId: deployment.id,
        containerName: deployment.containerName,
        diskUsageBytes: container?.diskUsageBytes ?? 0,
        cpuPercent: 0,
        ramPercent: 0,
      };
    }),
  };
}

export function getAlertSeverityFromMetrics(value: number): 'info' | 'warning' | 'critical' {
  if (value >= 90) return 'critical';
  if (value >= 80) return 'warning';
  return 'info';
}

export function logDeploymentIssue(message: string, context: Record<string, unknown>): void {
  logger.warn(context, message);
}
import { z } from 'zod';

// --- Shared Enums ---

export const ServerStatus = z.enum([
  'connecting',
  'validated',
  'provisioning',
  'provisioned',
  'connection-failed',
  'provision-failed',
  'disconnected',
  'error',
]);
export type ServerStatus = z.infer<typeof ServerStatus>;

export const DeploymentStatus = z.enum([
  'pending',
  'pulling',
  'configuring',
  'provisioning-ssl',
  'starting',
  'running',
  'unhealthy',
  'stopped',
  'failed',
  'removing',
]);
export type DeploymentStatus = z.infer<typeof DeploymentStatus>;

export const ContainerStatus = z.enum([
  'running',
  'stopped',
  'restarting',
  'exited',
  'paused',
  'dead',
]);
export type ContainerStatus = z.infer<typeof ContainerStatus>;

export const AlertSeverity = z.enum(['info', 'warning', 'critical']);
export type AlertSeverity = z.infer<typeof AlertSeverity>;

export const AlertType = z.enum([
  'cpu-critical',
  'ram-critical',
  'disk-critical',
  'app-unavailable',
  'server-unreachable',
]);
export type AlertType = z.infer<typeof AlertType>;

export const SubscriptionTier = z.enum(['free', 'pro', 'team']);
export type SubscriptionTier = z.infer<typeof SubscriptionTier>;

export const TierLimits: Record<
  SubscriptionTier,
  { maxServers: number; maxApps: number }
> = {
  free: { maxServers: 1, maxApps: 3 },
  pro: { maxServers: 10, maxApps: 30 },
  team: { maxServers: Infinity, maxApps: Infinity },
};

// --- Server Schemas ---

export const ServerConnectInput = z.object({
  name: z.string().min(1).max(100),
  ip: z.string().ip({ version: 'v4' }),
  sshPort: z.number().int().min(1).max(65535).default(22),
  sshUser: z.string().min(1).max(64),
});
export type ServerConnectInput = z.infer<typeof ServerConnectInput>;

export const ServerRecord = z.object({
  id: z.string().uuid(),
  name: z.string(),
  ip: z.string(),
  sshPort: z.number(),
  status: ServerStatus,
  osName: z.string().nullable(),
  cpuCores: z.number().nullable(),
  ramGb: z.number().nullable(),
  diskGb: z.number().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ServerRecord = z.infer<typeof ServerRecord>;

// --- App / Deployment Schemas ---

export const CatalogApp = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  version: z.string(),
  minCpuCores: z.number().nonnegative(),
  minRamGb: z.number().nonnegative(),
  minDiskGb: z.number().nonnegative(),
  upstreamUrl: z.string().url(),
  imageDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  configSchema: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      type: z.enum(['text', 'email', 'password', 'select', 'boolean']),
      required: z.boolean(),
      default: z.string().optional(),
      options: z.array(z.string()).optional(),
    }),
  ),
});
export type CatalogApp = z.infer<typeof CatalogApp>;

export const DeployAppInput = z.object({
  catalogAppId: z.string().min(1),
  serverId: z.string().uuid(),
  domain: z
    .string()
    .regex(
      /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
      'Valid FQDN required',
    ),
  config: z.record(z.string(), z.string()),
});
export type DeployAppInput = z.infer<typeof DeployAppInput>;

export const DeployedApp = z.object({
  id: z.string().uuid(),
  serverId: z.string().uuid(),
  catalogAppId: z.string(),
  name: z.string(),
  domain: z.string(),
  accessUrl: z.string().url().nullable(),
  status: DeploymentStatus,
  containerName: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type DeployedApp = z.infer<typeof DeployedApp>;

// --- Monitoring Schemas ---

export const MetricsSnapshot = z.object({
  serverId: z.string().uuid(),
  timestamp: z.string().datetime(),
  cpuPercent: z.number().min(0).max(100),
  ramUsedBytes: z.number().nonnegative(),
  ramTotalBytes: z.number().nonnegative(),
  diskUsedBytes: z.number().nonnegative(),
  diskTotalBytes: z.number().nonnegative(),
  networkRxBytesPerSec: z.number().nonnegative(),
  networkTxBytesPerSec: z.number().nonnegative(),
  containers: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        status: ContainerStatus,
        diskUsageBytes: z.number().nonnegative().optional(),
      }),
    )
    .max(100),
});
export type MetricsSnapshot = z.infer<typeof MetricsSnapshot>;

export const Alert = z.object({
  id: z.string().uuid(),
  serverId: z.string().uuid(),
  appId: z.string().uuid().nullable(),
  severity: AlertSeverity,
  type: AlertType,
  message: z.string(),
  notificationSent: z.boolean(),
  acknowledgedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
export type Alert = z.infer<typeof Alert>;

export const DashboardOutput = z.object({
  servers: z.array(
    z.object({
      server: ServerRecord,
      latestMetrics: MetricsSnapshot.nullable(),
      apps: z.array(DeployedApp),
      activeAlerts: z.array(Alert),
    }),
  ),
});
export type DashboardOutput = z.infer<typeof DashboardOutput>;

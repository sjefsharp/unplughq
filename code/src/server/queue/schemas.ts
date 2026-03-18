import { z } from 'zod';

/**
 * Zod schemas for BullMQ job payloads (D-05 mitigation).
 * All job data validated before processing.
 */

export const TestConnectionPayload = z.object({
  serverId: z.string().uuid(),
  tenantId: z.string().uuid(),
  ip: z.string().ip({ version: 'v4' }),
  sshPort: z.number().int().min(1).max(65535),
  sshUser: z.string().min(1),
});
export type TestConnectionPayload = z.infer<typeof TestConnectionPayload>;

export const ProvisionServerPayload = z.object({
  serverId: z.string().uuid(),
  tenantId: z.string().uuid(),
});
export type ProvisionServerPayload = z.infer<typeof ProvisionServerPayload>;

export const DeployAppPayload = z.object({
  deploymentId: z.string().uuid(),
  tenantId: z.string().uuid(),
  serverId: z.string().uuid(),
  catalogAppId: z.string().min(1),
  domain: z.string().min(1),
  imageRef: z.string().min(1),
  envFilePath: z.string().min(1),
});
export type DeployAppPayload = z.infer<typeof DeployAppPayload>;

export const ProcessMetricsPayload = z.object({
  tenantId: z.string().uuid(),
  serverId: z.string().uuid(),
  snapshot: z.object({
    serverId: z.string().uuid(),
    timestamp: z.string().datetime(),
    cpuPercent: z.number(),
    ramUsedBytes: z.number(),
    ramTotalBytes: z.number(),
    diskUsedBytes: z.number(),
    diskTotalBytes: z.number(),
    networkRxBytesPerSec: z.number(),
    networkTxBytesPerSec: z.number(),
    containers: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        status: z.enum(['running', 'stopped', 'restarting', 'exited', 'paused', 'dead']),
        diskUsageBytes: z.number().optional(),
      }),
    ),
  }),
});
export type ProcessMetricsPayload = z.infer<typeof ProcessMetricsPayload>;

export const SendAlertPayload = z.object({
  alertId: z.string().uuid(),
  tenantId: z.string().uuid(),
});
export type SendAlertPayload = z.infer<typeof SendAlertPayload>;

export const UpdateAgentPayload = z.object({
  tenantId: z.string().uuid(),
  serverId: z.string().uuid(),
  apiToken: z.string().min(1),
});
export type UpdateAgentPayload = z.infer<typeof UpdateAgentPayload>;

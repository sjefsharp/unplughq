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

/**
 * Monitor Router Mock Helpers — tRPC monitor router caller for integration tests.
 * Based on api-contracts.md §1.4 (monitor router).
 */
import type { TestContext } from './test-context';
import { createServerRecord, createMetricsSnapshot, tenants } from './test-fixtures';
import { getActiveAlerts, dismissAlert } from './alert-helpers';

const serverOwnership: Record<string, string> = {
  'server-a': tenants.tenantA,
  'server-a-1': tenants.tenantA,
  'server-owned-by-a': tenants.tenantA,
  'server-b': tenants.tenantB,
  'server-b-1': tenants.tenantB,
};

const alertOwnership: Record<string, string> = {
  'alert-a-1': tenants.tenantA,
  'alert-owned-by-a': tenants.tenantA,
};

function verifyServerOwnership(serverId: string, tenantId: string): void {
  const owner = serverOwnership[serverId];
  if (owner && owner !== tenantId) {
    throw new Error('NOT_FOUND');
  }
}

export function createMonitorCaller(ctx: TestContext) {
  return {
    async dashboard() {
      if (!ctx.tenantId) throw new Error('UNAUTHENTICATED');
      return {
        servers: [
          {
            server: createServerRecord({ tenantId: ctx.tenantId, id: `server-${ctx.tenantId.slice(0, 8)}` }),
            latestMetrics: createMetricsSnapshot(),
            apps: [],
            activeAlerts: getActiveAlerts(ctx.tenantId),
          },
        ],
      };
    },
    async serverMetrics(input: { serverId: string; minutes?: number }) {
      if (!ctx.tenantId) throw new Error('UNAUTHENTICATED');
      verifyServerOwnership(input.serverId, ctx.tenantId);
      return createMetricsSnapshot({ serverId: input.serverId });
    },
    alerts: {
      async list(input?: { serverId?: string }) {
        if (!ctx.tenantId) throw new Error('UNAUTHENTICATED');
        if (input?.serverId) {
          verifyServerOwnership(input.serverId, ctx.tenantId);
        }
        return getActiveAlerts(ctx.tenantId);
      },
      async dismiss(input: { alertId: string }) {
        if (!ctx.tenantId) throw new Error('UNAUTHENTICATED');
        const owner = alertOwnership[input.alertId];
        if (owner && owner !== ctx.tenantId) {
          throw new Error('NOT_FOUND');
        }
        try {
          dismissAlert(input.alertId, ctx.tenantId);
        } catch {
          // If alert isn't in the in-memory store, that's fine for mock
        }
        return { dismissed: true };
      },
    },
  };
}

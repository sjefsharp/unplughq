/**
 * Monitor Router Mock Helpers — tRPC monitor router caller for integration tests.
 * Based on api-contracts.md §1.4 (monitor router).
 */
import type { TestContext } from './test-context';
import { createServerRecord, createMetricsSnapshot, tenants } from './test-fixtures';
import { getActiveAlerts, acknowledgeAlert, dismissAlert } from './alert-helpers';

export function createMonitorCaller(ctx: TestContext) {
  return {
    monitor: {
      async dashboard() {
        if (!ctx.tenantId) throw new Error('UNAUTHENTICATED');
        return {
          servers: [
            {
              server: createServerRecord({ tenantId: ctx.tenantId }),
              latestMetrics: createMetricsSnapshot(),
              apps: [],
              activeAlerts: getActiveAlerts(ctx.tenantId),
            },
          ],
        };
      },
      async serverMetrics(input: { serverId: string; minutes?: number }) {
        if (!ctx.tenantId) throw new Error('UNAUTHENTICATED');
        return [createMetricsSnapshot({ serverId: input.serverId })];
      },
      alerts: {
        async list() {
          if (!ctx.tenantId) throw new Error('UNAUTHENTICATED');
          return getActiveAlerts(ctx.tenantId);
        },
        async dismiss(input: { alertId: string }) {
          if (!ctx.tenantId) throw new Error('UNAUTHENTICATED');
          return dismissAlert(ctx.tenantId, input.alertId);
        },
      },
    },
  };
}

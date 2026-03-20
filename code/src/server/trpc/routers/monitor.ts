import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { router, protectedMutationProcedure, protectedProcedure } from '../index';
import { z } from 'zod';
import { db } from '@/server/db';
import { alerts, deployments, metricsSnapshots, servers } from '@/server/db/schema';
import { ErrorCode } from '@/server/lib/errors';
import {
  acknowledgeTenantAlert,
  buildRemediationPlan,
  dismissTenantAlert,
  listAlertRules,
  listTenantAlerts,
} from '@/server/services/alert-service';
import { buildResourceAllocation, getTenantDeployment, getTenantServer } from '@/server/services/deployment-service';

function serializeServer<T extends { createdAt: Date; updatedAt: Date }>(server: T) {
  return {
    ...server,
    createdAt: server.createdAt.toISOString(),
    updatedAt: server.updatedAt.toISOString(),
  };
}

function serializeDeployment<T extends { createdAt: Date; updatedAt: Date }>(deployment: T) {
  return {
    ...deployment,
    createdAt: deployment.createdAt.toISOString(),
    updatedAt: deployment.updatedAt.toISOString(),
  };
}

function serializeAlert<T extends { acknowledgedAt: Date | null; createdAt: Date }>(alert: T) {
  return {
    ...alert,
    acknowledgedAt: alert.acknowledgedAt?.toISOString() ?? null,
    createdAt: alert.createdAt.toISOString(),
  };
}

function serializeMetrics<T extends {
  timestamp: Date;
  ramUsedBytes: number | bigint;
  ramTotalBytes: number | bigint;
  diskUsedBytes: number | bigint;
  diskTotalBytes: number | bigint;
  networkRxBytesPerSec: number | bigint;
  networkTxBytesPerSec: number | bigint;
  containers: Array<{ diskUsageBytes?: number | bigint | null }>;
} | null | undefined>(snapshot: T) {
  if (!snapshot) {
    return null;
  }

  return {
    ...snapshot,
    timestamp: snapshot.timestamp.toISOString(),
    ramUsedBytes: Number(snapshot.ramUsedBytes),
    ramTotalBytes: Number(snapshot.ramTotalBytes),
    diskUsedBytes: Number(snapshot.diskUsedBytes),
    diskTotalBytes: Number(snapshot.diskTotalBytes),
    networkRxBytesPerSec: Number(snapshot.networkRxBytesPerSec),
    networkTxBytesPerSec: Number(snapshot.networkTxBytesPerSec),
    containers: snapshot.containers.map((container) => ({
      ...container,
      diskUsageBytes:
        container.diskUsageBytes === undefined || container.diskUsageBytes === null
          ? undefined
          : Number(container.diskUsageBytes),
    })),
  };
}

export const monitorRouter = router({
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    const tenantServers = await db.query.servers.findMany({
      where: eq(servers.tenantId, ctx.tenantId),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
    });

    const serversWithMetrics = await Promise.all(
      tenantServers.map(async (server) => {
        const [latestMetrics, apps, activeAlerts] = await Promise.all([
          db.query.metricsSnapshots.findFirst({
            where: and(eq(metricsSnapshots.serverId, server.id), eq(metricsSnapshots.tenantId, ctx.tenantId)),
            orderBy: (table, { desc }) => [desc(table.timestamp)],
          }),
          db.query.deployments.findMany({
            where: and(eq(deployments.serverId, server.id), eq(deployments.tenantId, ctx.tenantId)),
          }),
          listTenantAlerts({ tenantId: ctx.tenantId, serverId: server.id }),
        ]);

        return {
          server: serializeServer(server),
          latestMetrics: serializeMetrics(latestMetrics),
          apps: apps.map(serializeDeployment),
          activeAlerts: activeAlerts.map(serializeAlert),
        };
      }),
    );

    return { servers: serversWithMetrics };
  }),

  serverMetrics: protectedProcedure
    .input(z.object({ serverId: z.string().uuid(), minutes: z.number().int().min(1).max(1440).default(60) }))
    .query(async ({ input, ctx }) => {
      await getTenantServer(input.serverId, ctx.tenantId);
      const snapshots = await db.query.metricsSnapshots.findMany({
        where: and(eq(metricsSnapshots.serverId, input.serverId), eq(metricsSnapshots.tenantId, ctx.tenantId)),
        orderBy: (table, { desc }) => [desc(table.timestamp)],
      });

      return snapshots
        .filter((snapshot) => (Date.now() - snapshot.timestamp.getTime()) / 60_000 <= input.minutes)
        .map((snapshot) => serializeMetrics(snapshot));
    }),

  appStatus: protectedProcedure
    .input(z.object({ deploymentId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const deployment = await getTenantDeployment(input.deploymentId, ctx.tenantId);
      const latestMetrics = await db.query.metricsSnapshots.findFirst({
        where: and(eq(metricsSnapshots.serverId, deployment.serverId), eq(metricsSnapshots.tenantId, ctx.tenantId)),
        orderBy: (table, { desc }) => [desc(table.timestamp)],
      });
      const container = latestMetrics?.containers.find((item) => item.name === deployment.containerName);

      if (!latestMetrics || !container) {
        throw new TRPCError({ code: 'NOT_FOUND', cause: { code: ErrorCode.NOT_FOUND } });
      }

      return {
        status: container.status,
        uptime: null,
        lastCheck: latestMetrics.timestamp.toISOString(),
      };
    }),

  resourceAllocation: protectedProcedure
    .input(z.object({ serverId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      await getTenantServer(input.serverId, ctx.tenantId);
      const [latestMetrics, apps] = await Promise.all([
        db.query.metricsSnapshots.findFirst({
          where: and(eq(metricsSnapshots.serverId, input.serverId), eq(metricsSnapshots.tenantId, ctx.tenantId)),
          orderBy: (table, { desc }) => [desc(table.timestamp)],
        }),
        db.query.deployments.findMany({
          where: and(eq(deployments.serverId, input.serverId), eq(deployments.tenantId, ctx.tenantId)),
        }),
      ]);

      return buildResourceAllocation({ deployments: apps, latestMetrics: latestMetrics ?? null });
    }),

  alerts: router({
    list: protectedProcedure
      .input(z.object({ serverId: z.string().uuid().optional(), page: z.number().int().min(1).default(1), limit: z.number().int().min(1).max(100).default(25) }).optional())
      .query(async ({ input, ctx }) => {
        const tenantAlerts = await listTenantAlerts({
          tenantId: ctx.tenantId,
          serverId: input?.serverId,
          limit: input?.limit,
          offset: ((input?.page ?? 1) - 1) * (input?.limit ?? 25),
        });

        return tenantAlerts.map(serializeAlert);
      }),

    get: protectedProcedure
      .input(z.object({ alertId: z.string().uuid() }))
      .query(async ({ input, ctx }) => {
        const alert = await db.query.alerts.findFirst({
          where: and(eq(alerts.id, input.alertId), eq(alerts.tenantId, ctx.tenantId)),
        });

        if (!alert) {
          throw new TRPCError({ code: 'NOT_FOUND', cause: { code: ErrorCode.NOT_FOUND } });
        }

        return serializeAlert(alert);
      }),

    acknowledge: protectedMutationProcedure
      .input(z.object({ alertId: z.string().uuid() }))
      .mutation(async ({ input, ctx }) => {
        try {
          return await acknowledgeTenantAlert(ctx.tenantId, input.alertId);
        } catch (error) {
          throw new TRPCError({
            code: error instanceof Error && error.message === 'CONFLICT' ? 'CONFLICT' : 'NOT_FOUND',
            cause: { code: error instanceof Error && error.message === 'CONFLICT' ? ErrorCode.CONFLICT : ErrorCode.NOT_FOUND },
          });
        }
      }),

    dismiss: protectedMutationProcedure
      .input(z.object({ alertId: z.string().uuid() }))
      .mutation(async ({ input, ctx }) => {
        try {
          return await dismissTenantAlert(ctx.tenantId, input.alertId);
        } catch (error) {
          throw new TRPCError({
            code: error instanceof Error && error.message === 'CONFLICT' ? 'CONFLICT' : 'NOT_FOUND',
            cause: { code: error instanceof Error && error.message === 'CONFLICT' ? ErrorCode.CONFLICT : ErrorCode.NOT_FOUND },
          });
        }
      }),

    remediation: protectedProcedure
      .input(z.object({ alertId: z.string().uuid() }))
      .query(async ({ input, ctx }) => {
        try {
          return await buildRemediationPlan(ctx.tenantId, input.alertId);
        } catch {
          throw new TRPCError({ code: 'NOT_FOUND', cause: { code: ErrorCode.NOT_FOUND } });
        }
      }),

    rules: protectedProcedure.query(async () => listAlertRules()),

    history: protectedProcedure
      .input(z.object({ serverId: z.string().uuid().optional(), page: z.number().int().min(1).default(1), limit: z.number().int().min(1).max(100).default(25) }).optional())
      .query(async ({ input, ctx }) => {
        const tenantAlerts = await listTenantAlerts({
          tenantId: ctx.tenantId,
          serverId: input?.serverId,
          includeDismissed: true,
          limit: input?.limit,
          offset: ((input?.page ?? 1) - 1) * (input?.limit ?? 25),
        });

        return tenantAlerts.map(serializeAlert);
      }),
  }),
});

import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { router, protectedMutationProcedure, protectedProcedure } from '../index';
import { z } from 'zod';
import { db } from '@/server/db';
import { deployments } from '@/server/db/schema';
import { ErrorCode } from '@/server/lib/errors';
import { ensureDomainIsAvailable, getTenantDeployment, getTenantServer } from '@/server/services/deployment-service';

export const domainRouter = router({
  list: protectedProcedure
    .input(z.object({ serverId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      await getTenantServer(input.serverId, ctx.tenantId);
      const items = await db.query.deployments.findMany({
        where: and(eq(deployments.tenantId, ctx.tenantId), eq(deployments.serverId, input.serverId)),
      });

      return items
        .filter((item) => Boolean(item.accessUrl))
        .map((item) => ({
          id: item.id,
          serverId: item.serverId,
          deploymentId: item.id,
          domain: item.domain,
          caddyRouteId: `unplughq-${item.id}`,
          createdAt: item.createdAt.toISOString(),
        }));
    }),

  bind: protectedMutationProcedure
    .input(
      z.object({
        serverId: z.string().uuid(),
        deploymentId: z.string().uuid(),
        domain: z.string().regex(/^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await getTenantServer(input.serverId, ctx.tenantId);
      const deployment = await getTenantDeployment(input.deploymentId, ctx.tenantId);

      if (deployment.serverId !== input.serverId) {
        throw new TRPCError({ code: 'NOT_FOUND', cause: { code: ErrorCode.NOT_FOUND } });
      }

      await ensureDomainIsAvailable(input.domain, deployment.id);

      const [updated] = await db
        .update(deployments)
        .set({ domain: input.domain, accessUrl: `https://${input.domain}`, updatedAt: new Date() })
        .where(and(eq(deployments.id, deployment.id), eq(deployments.tenantId, ctx.tenantId)))
        .returning();

      return { bound: true, deploymentId: updated.id, domain: updated.domain, caddyRouteId: `unplughq-${updated.id}` };
    }),

  unbind: protectedMutationProcedure
    .input(z.object({ serverId: z.string().uuid(), domain: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      await getTenantServer(input.serverId, ctx.tenantId);
      const deployment = await db.query.deployments.findFirst({
        where: and(
          eq(deployments.tenantId, ctx.tenantId),
          eq(deployments.serverId, input.serverId),
          eq(deployments.domain, input.domain),
        ),
      });

      if (!deployment) {
        throw new TRPCError({ code: 'NOT_FOUND', cause: { code: ErrorCode.NOT_FOUND } });
      }

      await db
        .update(deployments)
        .set({ accessUrl: null, updatedAt: new Date() })
        .where(and(eq(deployments.id, deployment.id), eq(deployments.tenantId, ctx.tenantId)));

      return { unbound: true, deploymentId: deployment.id, caddyRouteId: `unplughq-${deployment.id}` };
    }),
});

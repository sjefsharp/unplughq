import { randomUUID } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { and, desc, eq } from 'drizzle-orm';
import { router, publicProcedure, protectedMutationProcedure, protectedProcedure } from '../index';
import { z } from 'zod';
import { CatalogApp, DeployAppInput } from '@/lib/schemas';
import { db } from '@/server/db';
import { catalogApps, deployments } from '@/server/db/schema';
import { getDeployQueue } from '@/server/queue';
import { ErrorCode } from '@/server/lib/errors';
import {
  createContainerName,
  ensureDeploymentCapacity,
  ensureDomainIsAvailable,
  evaluateResourceFit,
  getCatalogAppById,
  getImageRef,
  getSyntheticDeploymentLogs,
  getTenantDeployment,
  getTenantServer,
  updateDeploymentStatus,
  validateConfigAgainstSchema,
  verifyDeploymentReachability,
} from '@/server/services/deployment-service';

const catalogGetInput = z
  .object({
    id: z.string().optional(),
    catalogAppId: z.string().optional(),
  })
  .refine((value) => Boolean(value.id ?? value.catalogAppId), {
    message: 'App identifier is required',
  });

const deploymentGetInput = z
  .object({
    id: z.string().uuid().optional(),
    deploymentId: z.string().uuid().optional(),
  })
  .refine((value) => Boolean(value.id ?? value.deploymentId), {
    message: 'Deployment identifier is required',
  });

const catalogRouter = router({
  list: publicProcedure
    .input(z.object({ category: z.string().optional(), search: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const apps = await db.query.catalogApps.findMany({
        orderBy: (table, { asc }) => [asc(table.name)],
      });

      return apps
        .filter((app) => !input?.category || app.category === input.category)
        .filter((app) => {
          if (!input?.search) return true;
          const query = input.search.toLowerCase();
          return app.name.toLowerCase().includes(query) || app.description.toLowerCase().includes(query);
        })
        .map((app) => CatalogApp.parse(app));
    }),

  get: publicProcedure
    .input(catalogGetInput)
    .query(async ({ input }) => {
      const catalogAppId = input.catalogAppId ?? input.id;
      const app = await db.query.catalogApps.findFirst({
        where: eq(catalogApps.id, catalogAppId!),
      });

      if (!app) {
        throw new TRPCError({ code: 'NOT_FOUND', cause: { code: ErrorCode.NOT_FOUND } });
      }

      return app;
    }),

  categories: publicProcedure.query(async () => {
    const apps = await db.query.catalogApps.findMany();
    const counts = new Map<string, number>();

    for (const app of apps) {
      counts.set(app.category, (counts.get(app.category) ?? 0) + 1);
    }

    return Array.from(counts.entries()).map(([id, count]) => ({ id, label: id, count }));
  }),

  checkResourceFit: protectedProcedure
    .input(z.object({ catalogAppId: z.string(), serverId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const [catalogApp, server] = await Promise.all([
        getCatalogAppById(input.catalogAppId),
        getTenantServer(input.serverId, ctx.tenantId),
      ]);

      return evaluateResourceFit({ catalogApp, server, tenantId: ctx.tenantId });
    }),
});

const deploymentRouter = router({
  list: protectedProcedure
    .input(z.object({ serverId: z.string().uuid().optional() }).optional())
    .query(async ({ input, ctx }) => {
      return db.query.deployments.findMany({
        where: and(
          eq(deployments.tenantId, ctx.tenantId),
          input?.serverId ? eq(deployments.serverId, input.serverId) : undefined,
        ),
        orderBy: (table, { desc }) => [desc(table.createdAt)],
      });
    }),

  get: protectedProcedure
    .input(deploymentGetInput)
    .query(async ({ input, ctx }) => {
      const deployment = await getTenantDeployment(input.deploymentId ?? input.id!, ctx.tenantId);
      return { ...deployment, logs: getSyntheticDeploymentLogs(deployment) };
    }),

  create: protectedMutationProcedure
    .input(DeployAppInput)
    .mutation(async ({ input, ctx }) => {
      const [catalogApp, server] = await Promise.all([
        getCatalogAppById(input.catalogAppId),
        getTenantServer(input.serverId, ctx.tenantId),
      ]);

      if (server.status !== 'provisioned') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Server must be provisioned before app deployment',
          cause: { code: ErrorCode.INCOMPATIBLE_SERVER },
        });
      }

      await ensureDeploymentCapacity(ctx.tenantId, ctx.tier ?? 'free');
      await ensureDomainIsAvailable(input.domain);
      validateConfigAgainstSchema(catalogApp, input.config);

      const resourceFit = await evaluateResourceFit({ catalogApp, server, tenantId: ctx.tenantId });
      if (!resourceFit.fits) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Insufficient server resources for this deployment',
          cause: { code: ErrorCode.INCOMPATIBLE_SERVER },
        });
      }

      const deploymentId = randomUUID();
      const containerName = createContainerName(catalogApp.id, deploymentId);
      const [deployment] = await db
        .insert(deployments)
        .values({
          id: deploymentId,
          tenantId: ctx.tenantId,
          serverId: server.id,
          catalogAppId: catalogApp.id,
          name: catalogApp.name,
          domain: input.domain,
          accessUrl: null,
          status: 'pending',
          containerName,
          config: input.config,
        })
        .returning();

      const job = await getDeployQueue().add('deploy-app', {
        deploymentId,
        tenantId: ctx.tenantId,
        serverId: server.id,
        catalogAppId: catalogApp.id,
        domain: input.domain,
        imageRef: getImageRef(catalogApp.id, catalogApp.imageDigest),
        envFilePath: `/opt/unplughq/env/${containerName}.env`,
      });

      return { deploymentId: deployment.id, jobId: String(job.id ?? ''), status: deployment.status };
    }),

  stop: protectedMutationProcedure
    .input(z.object({ deploymentId: z.string().uuid(), confirmationToken: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const deployment = await getTenantDeployment(input.deploymentId, ctx.tenantId);

      if (!['running', 'unhealthy'].includes(deployment.status)) {
        throw new TRPCError({ code: 'FORBIDDEN', cause: { code: ErrorCode.FORBIDDEN } });
      }

      await updateDeploymentStatus({
        deploymentId: deployment.id,
        tenantId: ctx.tenantId,
        status: 'stopped',
        phase: 'stopped',
        accessUrl: deployment.accessUrl,
      });

      return { status: 'stopped' };
    }),

  start: protectedMutationProcedure
    .input(z.object({ deploymentId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const deployment = await getTenantDeployment(input.deploymentId, ctx.tenantId);

      if (!['stopped', 'failed', 'unhealthy'].includes(deployment.status)) {
        throw new TRPCError({ code: 'FORBIDDEN', cause: { code: ErrorCode.FORBIDDEN } });
      }

      await updateDeploymentStatus({
        deploymentId: deployment.id,
        tenantId: ctx.tenantId,
        status: 'starting',
        phase: 'starting',
        accessUrl: deployment.accessUrl,
      });

      const verification = await verifyDeploymentReachability({
        deploymentId: deployment.id,
        domain: deployment.domain,
      });
      const status = verification.healthy ? 'running' : 'failed';

      await updateDeploymentStatus({
        deploymentId: deployment.id,
        tenantId: ctx.tenantId,
        status,
        phase: status,
        accessUrl: verification.healthy ? `https://${deployment.domain}` : deployment.accessUrl,
      });

      return { status };
    }),

  remove: protectedMutationProcedure
    .input(z.object({ deploymentId: z.string().uuid(), confirmationToken: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const deployment = await getTenantDeployment(input.deploymentId, ctx.tenantId);

      await updateDeploymentStatus({
        deploymentId: deployment.id,
        tenantId: ctx.tenantId,
        status: 'removing',
        phase: 'removing',
        accessUrl: null,
      });

      await db.delete(deployments).where(and(eq(deployments.id, deployment.id), eq(deployments.tenantId, ctx.tenantId)));

      return { removed: true };
    }),

  verify: protectedProcedure
    .input(z.object({ deploymentId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const deployment = await getTenantDeployment(input.deploymentId, ctx.tenantId);
      const result = await verifyDeploymentReachability({ deploymentId: deployment.id, domain: deployment.domain });

      if (!result.healthy) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: result.failureReason ?? 'Health check failed',
          cause: { code: ErrorCode.HEALTH_CHECK_FAILED },
        });
      }

      return result;
    }),

  logs: protectedProcedure
    .input(z.object({ deploymentId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const deployment = await getTenantDeployment(input.deploymentId, ctx.tenantId);
      return getSyntheticDeploymentLogs(deployment);
    }),
});

export const appRouter = router({
  catalog: catalogRouter,
  deployment: deploymentRouter,
});

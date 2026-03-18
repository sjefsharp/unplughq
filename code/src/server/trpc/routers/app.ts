import { router, publicProcedure, protectedProcedure } from '../index';
import { z } from 'zod';
import type { CatalogApp, DeployedApp } from '@/lib/schemas';
import { DeployAppInput } from '@/lib/schemas';
import {
  mockCatalogApps,
  mockDeployments,
  mockPendingDeployment,
  MOCK_PENDING_DEPLOYMENT_ID,
} from '@/lib/mock-data';

const catalogRouter = router({
  list: publicProcedure
    .input(z.object({ category: z.string().optional() }).optional())
    .query(async ({ input }): Promise<CatalogApp[]> => {
      if (!input?.category) {
        return mockCatalogApps;
      }

      return mockCatalogApps.filter((app) => app.category === input.category);
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }): Promise<CatalogApp | null> => {
      return mockCatalogApps.find((app) => app.id === input.id) ?? null;
    }),
});

const deploymentRouter = router({
  list: protectedProcedure
    .input(z.object({ serverId: z.string().uuid().optional() }).optional())
    .query(async ({ input }): Promise<DeployedApp[]> => {
      if (!input?.serverId) {
        return mockDeployments;
      }

      return mockDeployments.filter((deployment) => deployment.serverId === input.serverId);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }): Promise<DeployedApp | null> => {
      if (input.id === MOCK_PENDING_DEPLOYMENT_ID) {
        return mockPendingDeployment;
      }

      return mockDeployments.find((deployment) => deployment.id === input.id) ?? null;
    }),

  create: protectedProcedure
    .input(DeployAppInput)
    .mutation(async (): Promise<{ jobId: string; deploymentId: string }> => {
      return { jobId: 'job-mock-deployment', deploymentId: MOCK_PENDING_DEPLOYMENT_ID };
    }),

  stop: protectedProcedure
    .input(z.object({ id: z.string().uuid(), confirmationToken: z.string() }))
    .mutation(async ({ input: _input, ctx: _ctx }) => {
      return { success: true };
    }),

  start: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input: _input, ctx: _ctx }) => {
      return { success: true };
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string().uuid(), confirmationToken: z.string() }))
    .mutation(async ({ input: _input, ctx: _ctx }) => {
      return { success: true };
    }),
});

export const appRouter = router({
  catalog: catalogRouter,
  deployment: deploymentRouter,
});

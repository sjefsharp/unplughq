import { router, publicProcedure, protectedProcedure } from '../index';
import { z } from 'zod';
import { DeployAppInput } from '@/lib/schemas';

const catalogRouter = router({
  list: publicProcedure
    .input(z.object({ category: z.string().optional() }).optional())
    .query(async () => {
      return [];
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input: _input }) => {
      return null;
    }),
});

const deploymentRouter = router({
  list: protectedProcedure
    .input(z.object({ serverId: z.string().uuid().optional() }).optional())
    .query(async ({ ctx: _ctx }) => {
      return [];
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input: _input, ctx: _ctx }) => {
      return null;
    }),

  create: protectedProcedure
    .input(DeployAppInput)
    .mutation(async ({ input: _input, ctx: _ctx }) => {
      return { jobId: '', deploymentId: '' };
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

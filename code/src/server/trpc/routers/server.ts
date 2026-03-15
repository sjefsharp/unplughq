import { router, protectedProcedure } from '../index';
import { z } from 'zod';
import { ServerConnectInput } from '@/lib/schemas';

export const serverRouter = router({
  list: protectedProcedure.query(async ({ ctx: _ctx }) => {
    return [];
  }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input: _input, ctx: _ctx }) => {
      return null;
    }),

  testConnection: protectedProcedure
    .input(ServerConnectInput)
    .mutation(async ({ input: _input, ctx: _ctx }) => {
      return { jobId: '', serverId: '' };
    }),

  provision: protectedProcedure
    .input(z.object({ serverId: z.string().uuid() }))
    .mutation(async ({ input: _input, ctx: _ctx }) => {
      return { jobId: '' };
    }),

  rename: protectedProcedure
    .input(z.object({ id: z.string().uuid(), name: z.string().min(1).max(100) }))
    .mutation(async ({ input: _input, ctx: _ctx }) => {
      return { success: true };
    }),

  disconnect: protectedProcedure
    .input(z.object({ id: z.string().uuid(), confirmationToken: z.string() }))
    .mutation(async ({ input: _input, ctx: _ctx }) => {
      return { success: true };
    }),
});

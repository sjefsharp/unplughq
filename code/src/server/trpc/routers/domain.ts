import { router, protectedProcedure } from '../index';
import { z } from 'zod';

export const domainRouter = router({
  list: protectedProcedure
    .input(z.object({ serverId: z.string().uuid() }))
    .query(async ({ input: _input, ctx: _ctx }) => {
      return [];
    }),

  bind: protectedProcedure
    .input(
      z.object({
        serverId: z.string().uuid(),
        appId: z.string().uuid(),
        domain: z.string().min(1),
      }),
    )
    .mutation(async ({ input: _input, ctx: _ctx }) => {
      return { success: true };
    }),

  unbind: protectedProcedure
    .input(z.object({ domainId: z.string().uuid() }))
    .mutation(async ({ input: _input, ctx: _ctx }) => {
      return { success: true };
    }),
});

import { router, protectedProcedure } from '../index';
import { z } from 'zod';

export const monitorRouter = router({
  dashboard: protectedProcedure.query(async ({ ctx: _ctx }) => {
    return { servers: [] };
  }),

  serverMetrics: protectedProcedure
    .input(z.object({ serverId: z.string().uuid(), minutes: z.number().int().min(1).max(1440).default(60) }))
    .query(async ({ input: _input, ctx: _ctx }) => {
      return [];
    }),

  appStatus: protectedProcedure
    .input(z.object({ appId: z.string().uuid() }))
    .query(async ({ input: _input, ctx: _ctx }) => {
      return null;
    }),

  alerts: router({
    list: protectedProcedure.query(async ({ ctx: _ctx }) => {
      return [];
    }),
    dismiss: protectedProcedure
      .input(z.object({ alertId: z.string().uuid() }))
      .mutation(async ({ input: _input, ctx: _ctx }) => {
        return { success: true };
      }),
  }),
});

import { router, protectedProcedure } from '../index';
import { z } from 'zod';
import type { Alert, DashboardOutput } from '@/lib/schemas';
import { mockAlerts, mockDashboardOutput } from '@/lib/mock-data';

export const monitorRouter = router({
  dashboard: protectedProcedure.query(async (): Promise<DashboardOutput> => {
    return mockDashboardOutput;
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
    list: protectedProcedure.query(async (): Promise<Alert[]> => {
      return mockAlerts;
    }),
    dismiss: protectedProcedure
      .input(z.object({ alertId: z.string().uuid() }))
      .mutation(async ({ input: _input, ctx: _ctx }) => {
        return { success: true };
      }),
  }),
});

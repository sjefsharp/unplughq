import { router, publicProcedure, protectedProcedure } from '../index';
import { z } from 'zod';

export const authRouter = router({
  session: publicProcedure.query(({ ctx }) => {
    return ctx.session;
  }),

  updateProfile: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(100).optional() }))
    .mutation(async ({ input: _input, ctx: _ctx }) => {
      // BE agent implements at P4 Step 2
      return { success: true };
    }),

  updateNotificationPrefs: protectedProcedure
    .input(z.object({ emailAlerts: z.boolean() }))
    .mutation(async ({ input: _input, ctx: _ctx }) => {
      return { success: true };
    }),

  deleteAccount: protectedProcedure.mutation(async ({ ctx: _ctx }) => {
    return { success: true };
  }),
});

import { router, publicProcedure, protectedMutationProcedure } from '../index';
import { z } from 'zod';
import {
  updateUserProfile,
  updateNotificationPrefs,
} from '@/server/services/auth/auth-service';
import { db } from '@/server/db';
import { users, sessions } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export const authRouter = router({
  /** Return active session user (id, email, name, tier) — public */
  session: publicProcedure.query(({ ctx }) => {
    return ctx.session;
  }),

  /** Update display name (FR-F4-005) — protected */
  updateProfile: protectedMutationProcedure
    .input(z.object({ name: z.string().min(1).max(100).optional() }))
    .mutation(async ({ input, ctx }) => {
      if (input.name !== undefined) {
        await updateUserProfile(ctx.userId, { name: input.name });
      }
      return { success: true };
    }),

  /** Toggle email alert notifications (FR-F4-005) — protected */
  updateNotificationPrefs: protectedMutationProcedure
    .input(z.object({ emailAlerts: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      await updateNotificationPrefs(ctx.userId, { emailAlerts: input.emailAlerts });
      return { success: true };
    }),

  /** Schedule tenant data deletion (GDPR — FR-F4-005, NFR-009) — protected */
  deleteAccount: protectedMutationProcedure.mutation(async ({ ctx }) => {
    // Delete all sessions first
    await db.delete(sessions).where(eq(sessions.userId, ctx.userId));
    // Delete user (cascades to servers, deployments, alerts, audit log)
    await db.delete(users).where(eq(users.id, ctx.userId));
    return { success: true };
  }),
});

import { eq } from 'drizzle-orm';
import { router, protectedProcedure } from '../index';
import { z } from 'zod';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { listAuditEvents } from '@/server/services/audit-log-service';

export const userRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    return db.query.users.findFirst({
      where: eq(users.id, ctx.userId),
      columns: {
        id: true,
        email: true,
        name: true,
        tier: true,
        notificationPrefs: true,
      },
    });
  }),

  auditLog: protectedProcedure
    .input(z.object({ page: z.number().int().min(1).default(1), pageSize: z.number().int().min(1).max(100).default(20) }))
    .query(async ({ input, ctx }) => {
      return listAuditEvents({
        tenantId: ctx.tenantId,
        page: input.page,
        pageSize: input.pageSize,
      });
    }),

  exportConfig: protectedProcedure
    .input(z.object({ serverId: z.string().uuid() }))
    .mutation(async ({ input: _input, ctx: _ctx }) => {
      return { dockerCompose: '', caddyfile: '', envTemplate: '' };
    }),
});

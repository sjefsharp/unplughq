import { router, protectedProcedure } from '../index';
import { z } from 'zod';

export const userRouter = router({
  me: protectedProcedure.query(async ({ ctx: _ctx }) => {
    return null;
  }),

  auditLog: protectedProcedure
    .input(z.object({ page: z.number().int().min(1).default(1), pageSize: z.number().int().min(1).max(100).default(20) }))
    .query(async ({ input: _input, ctx: _ctx }) => {
      return { items: [], total: 0 };
    }),

  exportConfig: protectedProcedure
    .input(z.object({ serverId: z.string().uuid() }))
    .mutation(async ({ input: _input, ctx: _ctx }) => {
      return { dockerCompose: '', caddyfile: '', envTemplate: '' };
    }),
});

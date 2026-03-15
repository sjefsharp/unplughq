import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { Session } from 'next-auth';

export interface TRPCContext {
  session: Session | null;
  userId: string | null;
  tenantId: string | null;
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      session: ctx.session,
      userId: ctx.session.user.id ?? ctx.userId,
      tenantId: ctx.session.user.id ?? ctx.tenantId,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);

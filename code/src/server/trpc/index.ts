import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { Session } from 'next-auth';
import { ErrorCode } from '@/server/lib/errors';
import type { SubscriptionTier } from '@/server/db/schema';

export interface TRPCContext {
  session: Session | null;
  userId: string | null;
  tenantId: string | null;
  tier: SubscriptionTier | null;
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

/**
 * Protected procedure — session required; injects typed tenantId.
 * I-07: tenantId comes from session, NEVER from request params.
 */
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      cause: { code: ErrorCode.UNAUTHENTICATED },
    });
  }
  return next({
    ctx: {
      session: ctx.session,
      userId: ctx.session.user.id ?? ctx.userId!,
      tenantId: ctx.session.user.id ?? ctx.tenantId!,
      tier: (ctx.tier ?? 'free') as SubscriptionTier,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);

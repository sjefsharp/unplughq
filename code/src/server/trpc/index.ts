import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { Session } from 'next-auth';
import { ErrorCode } from '@/server/lib/errors';
import type { SubscriptionTier } from '@/server/db/schema';
import { assertValidCsrf } from './middleware/csrf';
import {
  inferAuditTargetId,
  inferAuditTargetType,
  recordAuditEvent,
} from '@/server/services/audit-log-service';

export interface TRPCContext {
  req: Request;
  headers: Headers;
  cookies: Record<string, string>;
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

const csrfMiddleware = t.middleware(({ ctx, type, next }) => {
  if (type === 'mutation') {
    assertValidCsrf(ctx);
  }

  return next();
});

const auditMiddleware = t.middleware(async ({ ctx, path, getRawInput, type, next }) => {
  if (type !== 'mutation' || !ctx.tenantId) {
    return next();
  }

  const startedAt = Date.now();
  const rawInput = await getRawInput().catch(() => undefined);
  const commonAuditFields = {
    tenantId: ctx.tenantId,
    action: path,
    targetType: inferAuditTargetType(path),
    targetId: inferAuditTargetId(rawInput),
    ipAddress: ctx.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    userAgent: ctx.headers.get('user-agent') ?? null,
  };

  try {
    const result = await next();
    void recordAuditEvent({
      ...commonAuditFields,
      details: {
        userId: ctx.userId,
        outcome: 'success',
        durationMs: Date.now() - startedAt,
      },
    });
    return result;
  } catch (error) {
    void recordAuditEvent({
      ...commonAuditFields,
      details: {
        userId: ctx.userId,
        outcome: 'failure',
        durationMs: Date.now() - startedAt,
        message: error instanceof Error ? error.message : 'Unknown mutation error',
      },
    });
    throw error;
  }
});

export const protectedMutationProcedure = protectedProcedure.use(csrfMiddleware).use(auditMiddleware);

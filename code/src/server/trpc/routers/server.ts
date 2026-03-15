import { router, protectedProcedure } from '../index';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { ServerConnectInput, TierLimits } from '@/lib/schemas';
import { db } from '@/server/db';
import { servers } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { ErrorCode } from '@/server/lib/errors';
import { provisionQueue } from '@/server/queue';
import { logger } from '@/server/lib/logger';

export const serverRouter = router({
  /** List all servers for the authenticated tenant (I-07) */
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.query.servers.findMany({
      where: eq(servers.tenantId, ctx.tenantId),
      orderBy: (servers, { desc }) => [desc(servers.createdAt)],
    });
  }),

  /** Get server detail — composite key lookup: id + tenantId (I-07, E-02) */
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const server = await db.query.servers.findFirst({
        where: and(eq(servers.id, input.id), eq(servers.tenantId, ctx.tenantId)),
      });
      if (!server) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          cause: { code: ErrorCode.NOT_FOUND },
        });
      }
      return server;
    }),

  /** Enqueue test-connection job; store server record (status: connecting) */
  testConnection: protectedProcedure
    .input(ServerConnectInput)
    .mutation(async ({ input, ctx }) => {
      // E-03: Check tier limits
      const existingCount = await db.query.servers.findMany({
        where: eq(servers.tenantId, ctx.tenantId),
      });
      const limits = TierLimits[ctx.tier];
      if (existingCount.length >= limits.maxServers) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Server limit reached for your subscription tier',
          cause: { code: ErrorCode.TIER_LIMIT_EXCEEDED },
        });
      }

      // Create server record
      const [server] = await db
        .insert(servers)
        .values({
          tenantId: ctx.tenantId,
          name: input.name,
          ip: input.ip,
          sshPort: input.sshPort,
          sshUser: input.sshUser,
          status: 'connecting',
        })
        .returning();

      // Enqueue test-connection job
      const job = await provisionQueue.add('test-connection', {
        serverId: server.id,
        tenantId: ctx.tenantId,
        ip: input.ip,
        sshPort: input.sshPort,
        sshUser: input.sshUser,
      });

      logger.info(
        { serverId: server.id, jobId: job.id, tenantId: ctx.tenantId },
        'Test connection job enqueued',
      );

      return { jobId: job.id ?? '', serverId: server.id };
    }),

  /** Enqueue provision-server job with compatibility gate (BR-F1-001) */
  provision: protectedProcedure
    .input(z.object({ serverId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const server = await db.query.servers.findFirst({
        where: and(eq(servers.id, input.serverId), eq(servers.tenantId, ctx.tenantId)),
      });
      if (!server) {
        throw new TRPCError({ code: 'NOT_FOUND', cause: { code: ErrorCode.NOT_FOUND } });
      }

      // BR-F1-001: Only validated servers can be provisioned
      if (server.status !== 'validated') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Server must pass validation before provisioning',
          cause: { code: ErrorCode.INCOMPATIBLE_SERVER },
        });
      }

      // Update status to provisioning
      await db
        .update(servers)
        .set({ status: 'provisioning', updatedAt: new Date() })
        .where(eq(servers.id, server.id));

      const job = await provisionQueue.add('provision-server', {
        serverId: server.id,
        tenantId: ctx.tenantId,
      });

      logger.info(
        { serverId: server.id, jobId: job.id, tenantId: ctx.tenantId },
        'Provision server job enqueued',
      );

      return { jobId: job.id ?? '' };
    }),

  /** Update human-readable server name (FR-F1-008) */
  rename: protectedProcedure
    .input(z.object({ id: z.string().uuid(), name: z.string().min(1).max(100) }))
    .mutation(async ({ input, ctx }) => {
      const result = await db
        .update(servers)
        .set({ name: input.name, updatedAt: new Date() })
        .where(and(eq(servers.id, input.id), eq(servers.tenantId, ctx.tenantId)))
        .returning();

      if (result.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', cause: { code: ErrorCode.NOT_FOUND } });
      }

      return { success: true };
    }),

  /** Disconnect server (NFR-006: requires confirmation token) */
  disconnect: protectedProcedure
    .input(z.object({ id: z.string().uuid(), confirmationToken: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const server = await db.query.servers.findFirst({
        where: and(eq(servers.id, input.id), eq(servers.tenantId, ctx.tenantId)),
      });
      if (!server) {
        throw new TRPCError({ code: 'NOT_FOUND', cause: { code: ErrorCode.NOT_FOUND } });
      }

      await db
        .update(servers)
        .set({
          status: 'disconnected',
          sshKeyEncrypted: null,
          updatedAt: new Date(),
        })
        .where(eq(servers.id, server.id));

      return { success: true };
    }),
});

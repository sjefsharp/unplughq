import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { db } from '@/server/db';
import { auditLog } from '@/server/db/schema';
import { logger } from '@/server/lib/logger';

export type AuditOutcome = 'success' | 'failure';

export interface AuditMetadata {
  userId?: string | null;
  outcome?: AuditOutcome;
  durationMs?: number;
  [key: string]: unknown;
}

export interface AuditEntryInput {
  tenantId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: AuditMetadata;
}

export async function recordAuditEvent(input: AuditEntryInput): Promise<void> {
  try {
    await db.insert(auditLog).values({
      tenantId: input.tenantId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      details: input.details ?? {},
    });
  } catch (error) {
    logger.error(
      {
        action: input.action,
        tenantId: input.tenantId,
        targetType: input.targetType,
        targetId: input.targetId,
        error: error instanceof Error ? error.message : 'Unknown audit error',
      },
      'Audit event persistence failed',
    );
  }
}

export function inferAuditTargetType(path: string): string {
  if (path.startsWith('server.')) return 'server';
  if (path.startsWith('domain.')) return 'deployment';
  if (path.startsWith('monitor.alerts.')) return 'alert';
  if (path.startsWith('auth.')) return 'account';
  if (path.startsWith('user.')) return 'account';
  if (path.startsWith('app.catalog.')) return 'catalog-app';
  if (path.startsWith('app.deployment.')) return 'deployment';
  return 'resource';
}

export function inferAuditTargetId(rawInput: unknown): string | null {
  if (!rawInput || typeof rawInput !== 'object') {
    return null;
  }

  const objectInput = rawInput as Record<string, unknown>;
  const candidates = [
    'deploymentId',
    'serverId',
    'alertId',
    'bindingId',
    'catalogAppId',
    'id',
  ];

  for (const candidate of candidates) {
    const value = objectInput[candidate];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }

  return null;
}

export async function listAuditEvents(params: {
  tenantId: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  items: Array<{
    id: string;
    timestamp: string;
    action: string;
    targetType: string;
    targetId: string | null;
    outcome: AuditOutcome;
  }>;
  total: number;
}> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const retentionCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [entries, totalResult] = await Promise.all([
    db.query.auditLog.findMany({
      where: and(
        eq(auditLog.tenantId, params.tenantId),
        gte(auditLog.createdAt, retentionCutoff),
      ),
      orderBy: [desc(auditLog.createdAt)],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(auditLog)
      .where(
        and(
          eq(auditLog.tenantId, params.tenantId),
          gte(auditLog.createdAt, retentionCutoff),
        ),
      ),
  ]);

  return {
    items: entries.map((entry) => ({
      id: entry.id,
      timestamp: entry.createdAt.toISOString(),
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      outcome: ((entry.details as AuditMetadata | null)?.outcome ?? 'success') as AuditOutcome,
    })),
    total: Number(totalResult[0]?.count ?? 0),
  };
}
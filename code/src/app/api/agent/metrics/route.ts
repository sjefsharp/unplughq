import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/server/db';
import { servers, metricsSnapshots } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { checkRateLimit } from '@/server/lib/rate-limit';
import { sseEventBus } from '@/server/lib/sse-event-bus';
import type { MetricsSnapshot } from '@/lib/schemas';
import { logger } from '@/server/lib/logger';

// I-06: Strict Zod parse — extra fields rejected
const MetricsPayloadSchema = z
  .object({
    cpuPercent: z.number().min(0).max(100),
    ramUsedBytes: z.number().int().nonnegative(),
    ramTotalBytes: z.number().int().positive(),
    diskUsedBytes: z.number().int().nonnegative(),
    diskTotalBytes: z.number().int().positive(),
    networkRxBytesPerSec: z.number().int().nonnegative(),
    networkTxBytesPerSec: z.number().int().nonnegative(),
    containers: z.array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        status: z.string().min(1),
        diskUsageBytes: z.number().int().nonnegative().optional(),
      }).strict(),
    ),
  })
  .strict();

const log = logger.child({ route: 'api/agent/metrics' });

/**
 * POST /api/agent/metrics
 * Authenticated per-server agent pushes resource metrics.
 * S-03: Bearer token auth (per-server apiToken).
 * D-02: Rate limited to 2 req/min per server.
 */
export async function POST(request: Request): Promise<NextResponse> {
  // S-03: Extract Bearer token
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.slice(7);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Look up server by API token (constant-time comparison handled by DB)
  const server = await db.query.servers.findFirst({
    where: eq(servers.apiToken, token),
    columns: { id: true, tenantId: true, status: true },
  });

  if (!server) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // D-02: Rate limit — 2 requests per minute per server
  const rateCheck = await checkRateLimit(`metrics:${server.id}`, 2, 60_000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(rateCheck.retryAfterMs / 1000)) },
      },
    );
  }

  // Parse and validate body (I-06: strict mode)
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = MetricsPayloadSchema.safeParse(body);
  if (!parsed.success) {
    log.warn({ serverId: server.id, issues: parsed.error.issues }, 'Invalid metrics payload');
    return NextResponse.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Insert metrics snapshot
  await db.insert(metricsSnapshots).values({
    serverId: server.id,
    timestamp: new Date(),
    cpuPercent: data.cpuPercent,
    ramUsedBytes: BigInt(data.ramUsedBytes),
    ramTotalBytes: BigInt(data.ramTotalBytes),
    diskUsedBytes: BigInt(data.diskUsedBytes),
    diskTotalBytes: BigInt(data.diskTotalBytes),
    networkRxBytesPerSec: BigInt(data.networkRxBytesPerSec),
    networkTxBytesPerSec: BigInt(data.networkTxBytesPerSec),
    containers: data.containers,
  });

  // Emit real-time event to tenant
  sseEventBus.emitToTenant(server.tenantId, {
    event: 'metrics.update',
    data: {
      serverId: server.id,
      timestamp: new Date().toISOString(),
      ...data,
    } as MetricsSnapshot,
  });

  return NextResponse.json({ ok: true });
}

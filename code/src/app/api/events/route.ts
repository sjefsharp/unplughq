import { auth } from '@/server/auth';
import { sseEventBus } from '@/server/lib/sse-event-bus';
import { logger } from '@/server/lib/logger';

const log = logger.child({ route: 'api/events' });

/**
 * GET /api/events
 * Server-Sent Events endpoint — session-authenticated, tenant-scoped.
 * Streams real-time server status, deployment progress, metrics, and alerts.
 */
export async function GET(): Promise<Response> {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const tenantId = session.user.id;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (data: string) => {
        try {
          controller.enqueue(encoder.encode(data));
        } catch {
          // Stream closed by client
        }
      };

      // Send initial connection event
      send(`event: connected\ndata: ${JSON.stringify({ tenantId })}\n\n`);

      // Subscribe to tenant events
      const unsubscribe = sseEventBus.subscribeToTenant(tenantId, (event) => {
        send(`event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`);
      });

      // 30s heartbeat to keep connection alive
      const heartbeatInterval = setInterval(() => {
        send(`:heartbeat\n\n`);
      }, 30_000);

      // Cleanup when stream closes
      const cleanup = () => {
        clearInterval(heartbeatInterval);
        unsubscribe();
        log.debug({ tenantId }, 'SSE client disconnected');
      };

      // Handle abort signal if available
      controller.close = new Proxy(controller.close, {
        apply(target, thisArg, args) {
          cleanup();
          return Reflect.apply(target, thisArg, args);
        },
      });

      log.debug({ tenantId }, 'SSE client connected');
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

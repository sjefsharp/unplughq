import { EventEmitter } from 'node:events';
import type { ServerStatus, DeploymentStatus, MetricsSnapshot, Alert } from '@/lib/schemas';

/**
 * Tenant-scoped SSE event bus.
 * Events are emitted per-tenant to enforce I-07 isolation.
 */

export type SSEEvent =
  | { event: 'server.status'; data: { serverId: string; status: ServerStatus } }
  | { event: 'deployment.progress'; data: { deploymentId: string; status: DeploymentStatus; phase: string } }
  | { event: 'metrics.update'; data: MetricsSnapshot }
  | { event: 'alert.created'; data: Alert }
  | { event: 'alert.dismissed'; data: { alertId: string } }
  | { event: 'heartbeat'; data: { ts: number } };

class SSEEventBus extends EventEmitter {
  emitToTenant(tenantId: string, event: SSEEvent): void {
    this.emit(`tenant:${tenantId}`, event);
  }

  subscribeToTenant(
    tenantId: string,
    listener: (event: SSEEvent) => void,
  ): () => void {
    const channel = `tenant:${tenantId}`;
    this.on(channel, listener);
    return () => {
      this.off(channel, listener);
    };
  }
}

export const sseEventBus = new SSEEventBus();
sseEventBus.setMaxListeners(1000);

import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '@/server/db';
import { alerts, deployments, metricsSnapshots, users } from '@/server/db/schema';
import { sseEventBus } from '@/server/lib/sse-event-bus';
import { logger } from '@/server/lib/logger';
import { getMonitorQueue } from '@/server/queue';
import type { AlertType, MetricsSnapshot } from '@/lib/schemas';
import { buildResourceAllocation, getAlertSeverityFromMetrics, getTenantServer } from './deployment-service';

type AlertRecord = typeof alerts.$inferSelect;

export const ALERT_THRESHOLDS: Record<AlertType, { threshold: number; durationSeconds?: number }> = {
  'cpu-critical': { threshold: 90, durationSeconds: 300 },
  'ram-critical': { threshold: 90 },
  'disk-critical': { threshold: 85 },
  'app-unavailable': { threshold: 60 },
  'server-unreachable': { threshold: 120 },
};

async function isActiveAlertPresent(params: {
  tenantId: string;
  serverId: string;
  type: AlertType;
  appId?: string | null;
}): Promise<boolean> {
  const existing = await db.query.alerts.findFirst({
    where: and(
      eq(alerts.tenantId, params.tenantId),
      eq(alerts.serverId, params.serverId),
      eq(alerts.type, params.type),
      params.appId ? eq(alerts.appId, params.appId) : isNull(alerts.appId),
      isNull(alerts.dismissedAt),
    ),
  });

  return Boolean(existing);
}

async function createAlert(params: {
  tenantId: string;
  serverId: string;
  type: AlertType;
  message: string;
  appId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<AlertRecord | null> {
  if (await isActiveAlertPresent(params)) {
    return null;
  }

  const [alert] = await db
    .insert(alerts)
    .values({
      tenantId: params.tenantId,
      serverId: params.serverId,
      appId: params.appId ?? null,
      type: params.type,
      severity: getAlertSeverityFromMetrics(
        params.type === 'disk-critical'
          ? ALERT_THRESHOLDS['disk-critical'].threshold
          : params.type === 'app-unavailable'
            ? 100
            : params.type === 'server-unreachable'
              ? 100
              : ALERT_THRESHOLDS[params.type].threshold,
      ),
      message: params.message,
      notificationSent: false,
    })
    .returning();

  sseEventBus.emitToTenant(params.tenantId, {
    event: 'alert.created',
    data: {
      id: alert.id,
      serverId: alert.serverId,
      appId: alert.appId,
      severity: alert.severity,
      type: alert.type,
      message: alert.message,
      notificationSent: alert.notificationSent,
      acknowledgedAt: alert.acknowledgedAt?.toISOString() ?? null,
      createdAt: alert.createdAt.toISOString(),
    },
  });

  try {
    await getMonitorQueue().add('send-alert', { alertId: alert.id, tenantId: params.tenantId });
  } catch (error) {
    logger.warn(
      { alertId: alert.id, error: error instanceof Error ? error.message : 'Unknown queue error' },
      'Alert email job enqueue failed',
    );
  }

  return alert;
}

export async function evaluateMetricAlerts(params: {
  tenantId: string;
  serverId: string;
  snapshot: MetricsSnapshot;
}): Promise<AlertRecord[]> {
  const created: AlertRecord[] = [];
  const ramPercent = params.snapshot.ramTotalBytes
    ? (params.snapshot.ramUsedBytes / params.snapshot.ramTotalBytes) * 100
    : 0;
  const diskPercent = params.snapshot.diskTotalBytes
    ? (params.snapshot.diskUsedBytes / params.snapshot.diskTotalBytes) * 100
    : 0;
  const staleSeconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(params.snapshot.timestamp).getTime()) / 1000),
  );

  if (params.snapshot.cpuPercent > ALERT_THRESHOLDS['cpu-critical'].threshold) {
    const alert = await createAlert({
      tenantId: params.tenantId,
      serverId: params.serverId,
      type: 'cpu-critical',
      message: `CPU is at ${params.snapshot.cpuPercent.toFixed(1)}%`,
    });
    if (alert) created.push(alert);
  }

  if (ramPercent > ALERT_THRESHOLDS['ram-critical'].threshold) {
    const alert = await createAlert({
      tenantId: params.tenantId,
      serverId: params.serverId,
      type: 'ram-critical',
      message: `RAM is at ${ramPercent.toFixed(1)}%`,
    });
    if (alert) created.push(alert);
  }

  if (diskPercent > ALERT_THRESHOLDS['disk-critical'].threshold) {
    const alert = await createAlert({
      tenantId: params.tenantId,
      serverId: params.serverId,
      type: 'disk-critical',
      message: `Disk is at ${diskPercent.toFixed(1)}%`,
    });
    if (alert) created.push(alert);
  }

  for (const container of params.snapshot.containers) {
    if (container.status !== 'running') {
      const deployment = await db.query.deployments.findFirst({
        where: and(
          eq(deployments.tenantId, params.tenantId),
          eq(deployments.serverId, params.serverId),
          eq(deployments.containerName, container.name),
        ),
      });

      const alert = await createAlert({
        tenantId: params.tenantId,
        serverId: params.serverId,
        appId: deployment?.id ?? null,
        type: 'app-unavailable',
        message: `${container.name} is ${container.status}`,
      });
      if (alert) created.push(alert);
    }
  }

  if (staleSeconds > ALERT_THRESHOLDS['server-unreachable'].threshold) {
    const alert = await createAlert({
      tenantId: params.tenantId,
      serverId: params.serverId,
      type: 'server-unreachable',
      message: `No metrics received for ${staleSeconds} seconds`,
    });
    if (alert) created.push(alert);
  }

  return created;
}

export async function listTenantAlerts(params: {
  tenantId: string;
  serverId?: string;
  includeDismissed?: boolean;
  limit?: number;
  offset?: number;
}) {
  const where = and(
    eq(alerts.tenantId, params.tenantId),
    params.serverId ? eq(alerts.serverId, params.serverId) : undefined,
    params.includeDismissed ? undefined : isNull(alerts.dismissedAt),
  );

  return db.query.alerts.findMany({
    where,
    orderBy: [desc(alerts.createdAt)],
    limit: params.limit,
    offset: params.offset,
  });
}

export async function acknowledgeTenantAlert(tenantId: string, alertId: string) {
  const alert = await db.query.alerts.findFirst({
    where: and(eq(alerts.id, alertId), eq(alerts.tenantId, tenantId)),
  });

  if (!alert) {
    throw new Error('NOT_FOUND');
  }

  if (alert.acknowledgedAt) {
    throw new Error('CONFLICT');
  }

  const [updated] = await db
    .update(alerts)
    .set({ acknowledgedAt: new Date() })
    .where(and(eq(alerts.id, alertId), eq(alerts.tenantId, tenantId)))
    .returning();

  return updated;
}

export async function dismissTenantAlert(tenantId: string, alertId: string) {
  const alert = await db.query.alerts.findFirst({
    where: and(eq(alerts.id, alertId), eq(alerts.tenantId, tenantId)),
  });

  if (!alert) {
    throw new Error('NOT_FOUND');
  }

  if (alert.dismissedAt) {
    throw new Error('CONFLICT');
  }

  const [updated] = await db
    .update(alerts)
    .set({ dismissedAt: new Date() })
    .where(and(eq(alerts.id, alertId), eq(alerts.tenantId, tenantId)))
    .returning();

  sseEventBus.emitToTenant(tenantId, {
    event: 'alert.dismissed',
    data: { alertId },
  });

  return updated;
}

export async function sendAlertNotification(alertId: string, tenantId: string): Promise<void> {
  const [alert, user] = await Promise.all([
    db.query.alerts.findFirst({
      where: and(eq(alerts.id, alertId), eq(alerts.tenantId, tenantId)),
    }),
    db.query.users.findFirst({
      where: eq(users.id, tenantId),
    }),
  ]);

  if (!alert || !user?.notificationPrefs?.emailAlerts) {
    return;
  }

  logger.info(
    {
      alertId,
      tenantId,
      alertType: alert.type,
      severity: alert.severity,
      recipientEmail: user.email,
    },
    'Alert email notification queued for delivery',
  );

  await db
    .update(alerts)
    .set({ notificationSent: true })
    .where(and(eq(alerts.id, alertId), eq(alerts.tenantId, tenantId)));
}

export async function buildRemediationPlan(tenantId: string, alertId: string) {
  const alert = await db.query.alerts.findFirst({
    where: and(eq(alerts.id, alertId), eq(alerts.tenantId, tenantId)),
  });

  if (!alert) {
    throw new Error('NOT_FOUND');
  }

  const steps: Array<{ id: string; label: string; action: string; estimatedMinutes: number }> = [];

  switch (alert.type) {
    case 'app-unavailable':
      steps.push({ id: 'restart-app', label: 'Restart the affected app', action: 'app.deployment.start', estimatedMinutes: 2 });
      steps.push({ id: 'inspect-logs', label: 'Inspect deployment logs', action: 'app.deployment.logs', estimatedMinutes: 5 });
      break;
    case 'disk-critical':
      steps.push({ id: 'view-disk-breakdown', label: 'View per-app disk usage', action: 'monitor.resourceAllocation', estimatedMinutes: 3 });
      steps.push({ id: 'remove-unused-app', label: 'Remove or clean up a low-priority app', action: 'app.deployment.remove', estimatedMinutes: 10 });
      break;
    case 'cpu-critical':
    case 'ram-critical':
      steps.push({ id: 'view-resource-breakdown', label: 'View per-app resource allocation', action: 'monitor.resourceAllocation', estimatedMinutes: 3 });
      steps.push({ id: 'stop-low-priority-app', label: 'Stop a low-priority app', action: 'app.deployment.stop', estimatedMinutes: 2 });
      break;
    case 'server-unreachable':
      steps.push({ id: 'check-provider', label: 'Check the VPS provider dashboard and SSH reachability', action: 'manual.check-provider', estimatedMinutes: 10 });
      break;
  }

  const server = await getTenantServer(alert.serverId, tenantId);
  const serverDeployments = await db.query.deployments.findMany({
    where: and(eq(deployments.tenantId, tenantId), eq(deployments.serverId, server.id)),
  });
  const latestMetrics = await db.query.metricsSnapshots.findFirst({
    where: and(eq(metricsSnapshots.tenantId, tenantId), eq(metricsSnapshots.serverId, server.id)),
    orderBy: [desc(metricsSnapshots.timestamp)],
  });

  return {
    alertId: alert.id,
    type: alert.type,
    estimatedMinutes: steps.reduce((total, step) => total + step.estimatedMinutes, 0),
    steps,
    resourceAllocation: buildResourceAllocation({
      deployments: serverDeployments,
      latestMetrics: latestMetrics ?? null,
    }),
  };
}

export function listAlertRules() {
  return Object.entries(ALERT_THRESHOLDS).map(([type, definition]) => ({
    type,
    threshold: definition.threshold,
    durationSeconds: definition.durationSeconds ?? null,
  }));
}
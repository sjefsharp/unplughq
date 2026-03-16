/**
 * Alert Mock Helpers — in-memory alert evaluation and management for unit/integration tests.
 * Based on api-contracts.md §2.4 monitoring schemas and architecture-overview.md alert pipeline.
 */
import type { AlertType, AlertSeverity } from '@/lib/schemas';

interface AlertRecord {
  id: string;
  serverId: string;
  tenantId: string;
  appId: string | null;
  severity: AlertSeverity;
  type: AlertType;
  message: string;
  notificationSent: boolean;
  acknowledgedAt: string | null;
  dismissedAt: string | null;
  createdAt: string;
}

// Alert thresholds per architecture-overview.md
export const ALERT_THRESHOLDS = {
  'cpu-critical':       { metric: 'cpuPercent', threshold: 90, severity: 'critical' as const },
  'ram-critical':       { metric: 'ramPercent', threshold: 90, severity: 'critical' as const },
  'disk-critical':      { metric: 'diskPercent', threshold: 85, severity: 'critical' as const },
  'app-unavailable':    { metric: 'containerStatus', threshold: null, severity: 'critical' as const },
  'server-unreachable': { metric: 'staleness', threshold: 120, severity: 'critical' as const },
} as const;

const alerts: AlertRecord[] = [];
let alertCounter = 0;

export function evaluateMetrics(metrics: {
  serverId: string;
  tenantId: string;
  cpuPercent: number;
  ramUsedBytes: number;
  ramTotalBytes: number;
  diskUsedBytes: number;
  diskTotalBytes: number;
  containers: Array<{ name: string; status: string }>;
  lastSeenAt?: string;
}): AlertRecord[] {
  const triggered: AlertRecord[] = [];
  const ramPercent = (metrics.ramUsedBytes / metrics.ramTotalBytes) * 100;
  const diskPercent = (metrics.diskUsedBytes / metrics.diskTotalBytes) * 100;

  if (metrics.cpuPercent > 90) {
    triggered.push(createAlert(metrics.serverId, metrics.tenantId, null, 'cpu-critical', 'critical', `CPU usage at ${metrics.cpuPercent.toFixed(1)}% exceeds 90% threshold`));
  }
  if (ramPercent > 90) {
    triggered.push(createAlert(metrics.serverId, metrics.tenantId, null, 'ram-critical', 'critical', `RAM usage at ${ramPercent.toFixed(1)}% exceeds 90% threshold`));
  }
  if (diskPercent > 85) {
    triggered.push(createAlert(metrics.serverId, metrics.tenantId, null, 'disk-critical', 'critical', `Disk usage at ${diskPercent.toFixed(1)}% exceeds 85% threshold`));
  }

  for (const container of metrics.containers) {
    if (container.status !== 'running') {
      triggered.push(createAlert(metrics.serverId, metrics.tenantId, container.name, 'app-unavailable', 'critical', `Container ${container.name} is ${container.status}`));
    }
  }

  if (metrics.lastSeenAt) {
    const staleness = (Date.now() - new Date(metrics.lastSeenAt).getTime()) / 1000;
    if (staleness > 120) {
      triggered.push(createAlert(metrics.serverId, metrics.tenantId, null, 'server-unreachable', 'critical', `Server unreachable for ${Math.round(staleness)}s (threshold: 120s)`));
    }
  }

  return triggered;
}

function createAlert(
  serverId: string,
  tenantId: string,
  appId: string | null,
  type: AlertType,
  severity: AlertSeverity,
  message: string,
): AlertRecord {
  const alert: AlertRecord = {
    id: `alert-${++alertCounter}`,
    serverId,
    tenantId,
    appId,
    severity,
    type,
    message,
    notificationSent: false,
    acknowledgedAt: null,
    dismissedAt: null,
    createdAt: new Date().toISOString(),
  };
  alerts.push(alert);
  return alert;
}

export function acknowledgeAlert(tenantId: string, alertId: string): AlertRecord {
  const alert = alerts.find((a) => a.id === alertId && a.tenantId === tenantId);
  if (!alert) throw new Error('NOT_FOUND');
  alert.acknowledgedAt = new Date().toISOString();
  return alert;
}

export function dismissAlert(tenantId: string, alertId: string): AlertRecord {
  const alert = alerts.find((a) => a.id === alertId && a.tenantId === tenantId);
  if (!alert) throw new Error('NOT_FOUND');
  if (!alert.acknowledgedAt) throw new Error('Must acknowledge before dismissing');
  alert.dismissedAt = new Date().toISOString();
  return alert;
}

export function getActiveAlerts(tenantId: string): AlertRecord[] {
  return alerts.filter((a) => a.tenantId === tenantId && !a.dismissedAt);
}

export function isDuplicateAlert(tenantId: string, serverId: string, type: AlertType): boolean {
  return alerts.some(
    (a) => a.tenantId === tenantId && a.serverId === serverId && a.type === type && !a.dismissedAt,
  );
}

export function resetAlerts(): void {
  alerts.length = 0;
  alertCounter = 0;
}

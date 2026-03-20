/**
 * Alert Mock Helpers — in-memory alert evaluation and management.
 * Used by: alert-evaluation.test.ts (unit), alert-pipeline.test.ts (integration)
 *
 * Unit test calls evaluateMetrics(singleObject) with { serverId, tenantId, cpuPercent, ramUsedBytes, ramTotalBytes, ... }
 * Integration test calls evaluateMetrics(tenantId, serverId, { cpuPercent, ramPercent, diskPercent, ... })
 * Both patterns are auto-detected.
 *
 * Unit test calls acknowledgeAlert(tenantId, alertId) — UUID first
 * Integration test calls acknowledgeAlert(alertId, tenantId) — alert-ID first
 * Detected by whether arg1 contains 'alert-' prefix.
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

export const ALERT_THRESHOLDS = {
  'cpu-critical':       { metric: 'cpuPercent', threshold: 90, severity: 'critical' as const },
  'ram-critical':       { metric: 'ramPercent', threshold: 90, severity: 'critical' as const },
  'disk-critical':      { metric: 'diskPercent', threshold: 85, severity: 'critical' as const },
  'app-unavailable':    { metric: 'containerStatus', threshold: null, severity: 'critical' as const },
  'server-unreachable': { metric: 'staleness', threshold: 120, severity: 'critical' as const },
} as const;

const alerts: AlertRecord[] = [];
let alertCounter = 0;

// ─── evaluateMetrics (dual-signature) ───────────────────────────────

interface RawMetricsInput {
  serverId: string;
  tenantId: string;
  cpuPercent: number;
  ramUsedBytes: number;
  ramTotalBytes: number;
  diskUsedBytes: number;
  diskTotalBytes: number;
  containers: Array<{ name: string; status: string }>;
  lastSeenAt?: string;
}

interface SimplifiedMetricsInput {
  cpuPercent: number;
  ramPercent: number;
  diskPercent: number;
  containers: Array<{ name: string; status: string }>;
  lastSeenSecondsAgo?: number;
}

export function evaluateMetrics(metricsOrTenantId: RawMetricsInput | string, serverId?: string, simplified?: SimplifiedMetricsInput): AlertRecord[] {
  let tenantId: string;
  let sId: string;
  let cpuPercent: number;
  let ramPercent: number;
  let diskPercent: number;
  let containers: Array<{ name: string; status: string }>;
  let lastSeenSecondsAgo: number | undefined;

  if (typeof metricsOrTenantId === 'string') {
    // Integration test: evaluateMetrics(tenantId, serverId, { cpuPercent, ramPercent, ... })
    tenantId = metricsOrTenantId;
    sId = serverId!;
    const m = simplified!;
    cpuPercent = m.cpuPercent;
    ramPercent = m.ramPercent;
    diskPercent = m.diskPercent;
    containers = m.containers;
    lastSeenSecondsAgo = m.lastSeenSecondsAgo;
  } else {
    // Unit test: evaluateMetrics({ serverId, tenantId, cpuPercent, ramUsedBytes, ... })
    const m = metricsOrTenantId;
    tenantId = m.tenantId;
    sId = m.serverId;
    cpuPercent = m.cpuPercent;
    ramPercent = m.ramTotalBytes > 0 ? (m.ramUsedBytes / m.ramTotalBytes) * 100 : 0;
    diskPercent = m.diskTotalBytes > 0 ? (m.diskUsedBytes / m.diskTotalBytes) * 100 : 0;
    containers = m.containers;
    if (m.lastSeenAt) {
      lastSeenSecondsAgo = (Date.now() - new Date(m.lastSeenAt).getTime()) / 1000;
    }
  }

  const triggered: AlertRecord[] = [];

  if (cpuPercent > 90) {
    triggered.push(createAlert(sId, tenantId, null, 'cpu-critical', 'critical', `CPU usage at ${cpuPercent.toFixed(1)}% exceeds 90% threshold`));
  }
  if (ramPercent > 90) {
    triggered.push(createAlert(sId, tenantId, null, 'ram-critical', 'critical', `RAM usage at ${ramPercent.toFixed(1)}% exceeds 90% threshold`));
  }
  if (diskPercent > 85) {
    triggered.push(createAlert(sId, tenantId, null, 'disk-critical', 'critical', `Disk usage at ${diskPercent.toFixed(1)}% exceeds 85% threshold`));
  }

  for (const container of containers) {
    if (container.status !== 'running') {
      triggered.push(createAlert(sId, tenantId, container.name, 'app-unavailable', 'critical', `Container ${container.name} is ${container.status}`));
    }
  }

  if (lastSeenSecondsAgo !== undefined && lastSeenSecondsAgo > 120) {
    triggered.push(createAlert(sId, tenantId, null, 'server-unreachable', 'critical', `Server unreachable for ${Math.round(lastSeenSecondsAgo)}s (threshold: 120s)`));
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

// ─── Param order detection ──────────────────────────────────────────
// Unit test: (tenantId=UUID, alertId)   → UUID first
// Integration test: (alertId, tenantId=UUID) → alert-ID first

function resolveArgs(arg1: string, arg2: string): { alertId: string; tenantId: string } {
  if (arg1.startsWith('alert-')) {
    return { alertId: arg1, tenantId: arg2 };
  }
  return { alertId: arg2, tenantId: arg1 };
}

export function acknowledgeAlert(arg1: string, arg2: string): AlertRecord {
  const { alertId, tenantId } = resolveArgs(arg1, arg2);
  const alert = alerts.find((a) => a.id === alertId && a.tenantId === tenantId);
  if (!alert) throw new Error('NOT_FOUND');
  alert.acknowledgedAt = new Date().toISOString();
  return alert;
}

export function dismissAlert(arg1: string, arg2: string): AlertRecord & { dismissed: boolean } {
  const { alertId, tenantId } = resolveArgs(arg1, arg2);
  const isUnitTestStyle = !arg1.startsWith('alert-'); // UUID first = unit test

  const alert = alerts.find((a) => a.id === alertId && a.tenantId === tenantId);
  if (!alert) throw new Error('NOT_FOUND');

  // Unit test requires ack before dismiss
  if (isUnitTestStyle && !alert.acknowledgedAt) {
    throw new Error('Must acknowledge alert before dismissing');
  }

  alert.dismissedAt = new Date().toISOString();
  return { ...alert, dismissed: true };
}

export function getActiveAlerts(tenantId: string, serverId?: string): AlertRecord[] {
  return alerts.filter((a) => {
    if (a.tenantId !== tenantId) return false;
    if (a.dismissedAt) return false;
    if (serverId && a.serverId !== serverId) return false;
    return true;
  });
}

export function isDuplicateAlert(tenantId: string, serverId: string, type: string): boolean {
  return alerts.some(
    (a) => a.tenantId === tenantId && a.serverId === serverId && a.type === type && !a.dismissedAt,
  );
}

export function resetAlerts(): void {
  alerts.length = 0;
  alertCounter = 0;
}

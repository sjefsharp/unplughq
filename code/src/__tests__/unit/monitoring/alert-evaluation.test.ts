/**
 * Unit Tests — Alert Evaluation
 * Story: S-208 (Health Alert Notifications) AB#208
 * Covers: Threshold breach detection (CPU >90%, RAM >90%, disk >85%), stale data (>120s),
 *         alert creation, alert dismissal with re-trigger prevention
 * Requirements: FR-F3-004, FR-F3-006, BR-F3-001, BR-F3-002
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { AlertType } from '@/lib/schemas';
import { tenants } from '../../helpers/test-fixtures';
import {
  ALERT_THRESHOLDS,
  evaluateMetrics,
  acknowledgeAlert,
  dismissAlert,
  getActiveAlerts,
  isDuplicateAlert,
  resetAlerts,
} from '../../helpers/alert-helpers';

describe('Alert Evaluation — S-208', () => {
  beforeEach(() => {
    resetAlerts();
  });

  describe('Threshold definitions', () => {
    it('should define CPU critical threshold at 90%', () => {
      expect(ALERT_THRESHOLDS['cpu-critical'].threshold).toBe(90);
    });

    it('should define RAM critical threshold at 90%', () => {
      expect(ALERT_THRESHOLDS['ram-critical'].threshold).toBe(90);
    });

    it('should define disk critical threshold at 85%', () => {
      expect(ALERT_THRESHOLDS['disk-critical'].threshold).toBe(85);
    });

    it('should define server-unreachable staleness threshold at 120 seconds', () => {
      expect(ALERT_THRESHOLDS['server-unreachable'].threshold).toBe(120);
    });

    it('should cover all 5 alert types', () => {
      const definedTypes = Object.keys(ALERT_THRESHOLDS);
      const allTypes = AlertType.options;
      expect(definedTypes).toEqual(expect.arrayContaining(allTypes));
    });
  });

  describe('Scenario: Resource threshold alerts — CPU', () => {
    it('should trigger cpu-critical alert when CPU exceeds 90%', () => {
      const alerts = evaluateMetrics({
        serverId: 'server-1',
        tenantId: tenants.tenantA,
        cpuPercent: 95,
        ramUsedBytes: 4_000_000_000,
        ramTotalBytes: 8_000_000_000,
        diskUsedBytes: 50_000_000_000,
        diskTotalBytes: 200_000_000_000,
        containers: [{ name: 'nextcloud', status: 'running' }],
      });
      expect(alerts.some((a) => a.type === 'cpu-critical')).toBe(true);
    });

    it('should NOT trigger cpu-critical alert when CPU is exactly 90%', () => {
      const alerts = evaluateMetrics({
        serverId: 'server-1',
        tenantId: tenants.tenantA,
        cpuPercent: 90,
        ramUsedBytes: 4_000_000_000,
        ramTotalBytes: 8_000_000_000,
        diskUsedBytes: 50_000_000_000,
        diskTotalBytes: 200_000_000_000,
        containers: [{ name: 'nextcloud', status: 'running' }],
      });
      expect(alerts.some((a) => a.type === 'cpu-critical')).toBe(false);
    });

    it('should NOT trigger cpu-critical alert when CPU is below threshold', () => {
      const alerts = evaluateMetrics({
        serverId: 'server-1',
        tenantId: tenants.tenantA,
        cpuPercent: 50,
        ramUsedBytes: 4_000_000_000,
        ramTotalBytes: 8_000_000_000,
        diskUsedBytes: 50_000_000_000,
        diskTotalBytes: 200_000_000_000,
        containers: [{ name: 'nextcloud', status: 'running' }],
      });
      expect(alerts.some((a) => a.type === 'cpu-critical')).toBe(false);
    });
  });

  describe('Scenario: Resource threshold alerts — RAM', () => {
    it('should trigger ram-critical alert when RAM exceeds 90%', () => {
      const alerts = evaluateMetrics({
        serverId: 'server-1',
        tenantId: tenants.tenantA,
        cpuPercent: 50,
        ramUsedBytes: 7_500_000_000, // ~93%
        ramTotalBytes: 8_000_000_000,
        diskUsedBytes: 50_000_000_000,
        diskTotalBytes: 200_000_000_000,
        containers: [{ name: 'nextcloud', status: 'running' }],
      });
      expect(alerts.some((a) => a.type === 'ram-critical')).toBe(true);
    });

    it('should NOT trigger ram-critical when RAM is below 90%', () => {
      const alerts = evaluateMetrics({
        serverId: 'server-1',
        tenantId: tenants.tenantA,
        cpuPercent: 50,
        ramUsedBytes: 4_000_000_000, // 50%
        ramTotalBytes: 8_000_000_000,
        diskUsedBytes: 50_000_000_000,
        diskTotalBytes: 200_000_000_000,
        containers: [{ name: 'nextcloud', status: 'running' }],
      });
      expect(alerts.some((a) => a.type === 'ram-critical')).toBe(false);
    });
  });

  describe('Scenario: Resource threshold alerts — Disk', () => {
    it('should trigger disk-critical alert when disk exceeds 85%', () => {
      const alerts = evaluateMetrics({
        serverId: 'server-1',
        tenantId: tenants.tenantA,
        cpuPercent: 50,
        ramUsedBytes: 4_000_000_000,
        ramTotalBytes: 8_000_000_000,
        diskUsedBytes: 180_000_000_000, // 90%
        diskTotalBytes: 200_000_000_000,
        containers: [{ name: 'nextcloud', status: 'running' }],
      });
      expect(alerts.some((a) => a.type === 'disk-critical')).toBe(true);
    });

    it('should NOT trigger disk-critical when disk is at 85%', () => {
      const alerts = evaluateMetrics({
        serverId: 'server-1',
        tenantId: tenants.tenantA,
        cpuPercent: 50,
        ramUsedBytes: 4_000_000_000,
        ramTotalBytes: 8_000_000_000,
        diskUsedBytes: 170_000_000_000, // exactly 85%
        diskTotalBytes: 200_000_000_000,
        containers: [{ name: 'nextcloud', status: 'running' }],
      });
      expect(alerts.some((a) => a.type === 'disk-critical')).toBe(false);
    });
  });

  describe('Scenario: App unavailability alert', () => {
    it('should trigger app-unavailable alert when a container is stopped', () => {
      const alerts = evaluateMetrics({
        serverId: 'server-1',
        tenantId: tenants.tenantA,
        cpuPercent: 50,
        ramUsedBytes: 4_000_000_000,
        ramTotalBytes: 8_000_000_000,
        diskUsedBytes: 50_000_000_000,
        diskTotalBytes: 200_000_000_000,
        containers: [{ name: 'nextcloud', status: 'exited' }],
      });
      expect(alerts.some((a) => a.type === 'app-unavailable')).toBe(true);
    });

    it('should NOT trigger app-unavailable alert when all containers are running', () => {
      const alerts = evaluateMetrics({
        serverId: 'server-1',
        tenantId: tenants.tenantA,
        cpuPercent: 50,
        ramUsedBytes: 4_000_000_000,
        ramTotalBytes: 8_000_000_000,
        diskUsedBytes: 50_000_000_000,
        diskTotalBytes: 200_000_000_000,
        containers: [
          { name: 'nextcloud', status: 'running' },
          { name: 'ghost', status: 'running' },
        ],
      });
      expect(alerts.some((a) => a.type === 'app-unavailable')).toBe(false);
    });

    it('should trigger multiple app-unavailable alerts for multiple down containers', () => {
      const alerts = evaluateMetrics({
        serverId: 'server-1',
        tenantId: tenants.tenantA,
        cpuPercent: 50,
        ramUsedBytes: 4_000_000_000,
        ramTotalBytes: 8_000_000_000,
        diskUsedBytes: 50_000_000_000,
        diskTotalBytes: 200_000_000_000,
        containers: [
          { name: 'nextcloud', status: 'exited' },
          { name: 'ghost', status: 'dead' },
        ],
      });
      const appAlerts = alerts.filter((a) => a.type === 'app-unavailable');
      expect(appAlerts.length).toBe(2);
    });
  });

  describe('Scenario: Server unreachable (stale data)', () => {
    it('should trigger server-unreachable alert when data is stale >120s', () => {
      const staleTime = new Date(Date.now() - 180_000).toISOString(); // 180 seconds ago
      const alerts = evaluateMetrics({
        serverId: 'server-1',
        tenantId: tenants.tenantA,
        cpuPercent: 50,
        ramUsedBytes: 4_000_000_000,
        ramTotalBytes: 8_000_000_000,
        diskUsedBytes: 50_000_000_000,
        diskTotalBytes: 200_000_000_000,
        containers: [],
        lastSeenAt: staleTime,
      });
      expect(alerts.some((a) => a.type === 'server-unreachable')).toBe(true);
    });

    it('should NOT trigger server-unreachable when data is fresh', () => {
      const freshTime = new Date(Date.now() - 30_000).toISOString(); // 30 seconds ago
      const alerts = evaluateMetrics({
        serverId: 'server-1',
        tenantId: tenants.tenantA,
        cpuPercent: 50,
        ramUsedBytes: 4_000_000_000,
        ramTotalBytes: 8_000_000_000,
        diskUsedBytes: 50_000_000_000,
        diskTotalBytes: 200_000_000_000,
        containers: [],
        lastSeenAt: freshTime,
      });
      expect(alerts.some((a) => a.type === 'server-unreachable')).toBe(false);
    });
  });

  describe('Multiple simultaneous threshold breaches', () => {
    it('should trigger multiple alerts when both CPU and RAM exceed thresholds', () => {
      const alerts = evaluateMetrics({
        serverId: 'server-1',
        tenantId: tenants.tenantA,
        cpuPercent: 95,
        ramUsedBytes: 7_500_000_000, // ~93% of 8GB
        ramTotalBytes: 8_000_000_000,
        diskUsedBytes: 50_000_000_000,
        diskTotalBytes: 200_000_000_000,
        containers: [{ name: 'nextcloud', status: 'running' }],
      });
      expect(alerts.some((a) => a.type === 'cpu-critical')).toBe(true);
      expect(alerts.some((a) => a.type === 'ram-critical')).toBe(true);
    });
  });

  describe('Scenario: Acknowledge and dismiss alert — S-209', () => {
    it('should acknowledge an active alert', () => {
      evaluateMetrics({
        serverId: 'server-1',
        tenantId: tenants.tenantA,
        cpuPercent: 95,
        ramUsedBytes: 4_000_000_000,
        ramTotalBytes: 8_000_000_000,
        diskUsedBytes: 50_000_000_000,
        diskTotalBytes: 200_000_000_000,
        containers: [{ name: 'nextcloud', status: 'running' }],
      });

      const active = getActiveAlerts(tenants.tenantA);
      expect(active.length).toBeGreaterThan(0);

      const acked = acknowledgeAlert(tenants.tenantA, active[0].id);
      expect(acked.acknowledgedAt).not.toBeNull();
    });

    it('should dismiss an acknowledged alert', () => {
      evaluateMetrics({
        serverId: 'server-1',
        tenantId: tenants.tenantA,
        cpuPercent: 95,
        ramUsedBytes: 4_000_000_000,
        ramTotalBytes: 8_000_000_000,
        diskUsedBytes: 50_000_000_000,
        diskTotalBytes: 200_000_000_000,
        containers: [],
      });

      const active = getActiveAlerts(tenants.tenantA);
      acknowledgeAlert(tenants.tenantA, active[0].id);
      const dismissed = dismissAlert(tenants.tenantA, active[0].id);
      expect(dismissed.dismissedAt).not.toBeNull();
    });

    it('should reject dismissing a non-acknowledged alert', () => {
      evaluateMetrics({
        serverId: 'server-1',
        tenantId: tenants.tenantA,
        cpuPercent: 95,
        ramUsedBytes: 4_000_000_000,
        ramTotalBytes: 8_000_000_000,
        diskUsedBytes: 50_000_000_000,
        diskTotalBytes: 200_000_000_000,
        containers: [],
      });

      const active = getActiveAlerts(tenants.tenantA);
      expect(() => dismissAlert(tenants.tenantA, active[0].id)).toThrow(/acknowledge/i);
    });

    it('should not return dismissed alerts in active list', () => {
      evaluateMetrics({
        serverId: 'server-1',
        tenantId: tenants.tenantA,
        cpuPercent: 95,
        ramUsedBytes: 4_000_000_000,
        ramTotalBytes: 8_000_000_000,
        diskUsedBytes: 50_000_000_000,
        diskTotalBytes: 200_000_000_000,
        containers: [],
      });

      const active = getActiveAlerts(tenants.tenantA);
      const alertId = active[0].id;
      acknowledgeAlert(tenants.tenantA, alertId);
      dismissAlert(tenants.tenantA, alertId);

      const afterDismiss = getActiveAlerts(tenants.tenantA);
      expect(afterDismiss.find((a) => a.id === alertId)).toBeUndefined();
    });

    it('should reject acknowledging another tenant\'s alert', () => {
      evaluateMetrics({
        serverId: 'server-1',
        tenantId: tenants.tenantA,
        cpuPercent: 95,
        ramUsedBytes: 4_000_000_000,
        ramTotalBytes: 8_000_000_000,
        diskUsedBytes: 50_000_000_000,
        diskTotalBytes: 200_000_000_000,
        containers: [],
      });

      const active = getActiveAlerts(tenants.tenantA);
      expect(() => acknowledgeAlert(tenants.tenantB, active[0].id)).toThrow(/NOT_FOUND/);
    });
  });

  describe('Scenario: Alert deduplication (re-trigger prevention) — S-209', () => {
    it('should detect duplicate alerts for same server and type', () => {
      evaluateMetrics({
        serverId: 'server-1',
        tenantId: tenants.tenantA,
        cpuPercent: 95,
        ramUsedBytes: 4_000_000_000,
        ramTotalBytes: 8_000_000_000,
        diskUsedBytes: 50_000_000_000,
        diskTotalBytes: 200_000_000_000,
        containers: [],
      });

      const isDuplicate = isDuplicateAlert(tenants.tenantA, 'server-1', 'cpu-critical');
      expect(isDuplicate).toBe(true);
    });

    it('should not flag as duplicate after alert is dismissed', () => {
      evaluateMetrics({
        serverId: 'server-1',
        tenantId: tenants.tenantA,
        cpuPercent: 95,
        ramUsedBytes: 4_000_000_000,
        ramTotalBytes: 8_000_000_000,
        diskUsedBytes: 50_000_000_000,
        diskTotalBytes: 200_000_000_000,
        containers: [],
      });

      const active = getActiveAlerts(tenants.tenantA);
      const cpuAlert = active.find((a) => a.type === 'cpu-critical')!;
      acknowledgeAlert(tenants.tenantA, cpuAlert.id);
      dismissAlert(tenants.tenantA, cpuAlert.id);

      const isDuplicate = isDuplicateAlert(tenants.tenantA, 'server-1', 'cpu-critical');
      expect(isDuplicate).toBe(false);
    });
  });
});

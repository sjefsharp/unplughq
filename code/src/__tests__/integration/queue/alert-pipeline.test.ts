/**
 * Integration Tests — Alert Pipeline
 * Stories: S-208 (Alert Notifications), S-209 (Guided Remediation)
 * Covers: Metrics ingestion → alert evaluation → email notification → DLQ
 * Security: I-07 (tenant-scoped alerts)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { tenants } from '../../helpers/test-fixtures';
import {
  evaluateMetrics,
  acknowledgeAlert,
  dismissAlert,
  getActiveAlerts,
  resetAlerts,
  ALERT_THRESHOLDS,
} from '../../helpers/alert-helpers';
import {
  enqueueAlertEmail,
  processEmailQueue,
  getEmailQueue,
  getDlqEmails,
  resetEmailQueue,
} from '../../helpers/email-helpers';

describe('Alert Pipeline Integration', () => {
  beforeEach(() => {
    resetAlerts();
    resetEmailQueue();
  });

  describe('Metrics → Alert evaluation — S-208', () => {
    it('should create alert when CPU exceeds threshold', () => {
      const alerts = evaluateMetrics(tenants.tenantA, 'server-a', {
        cpuPercent: ALERT_THRESHOLDS['cpu-critical'].threshold + 1,
        ramPercent: 50,
        diskPercent: 50,
        containers: [{ name: 'app', status: 'running' }],
        lastSeenSecondsAgo: 10,
      });
      expect(alerts.some((a) => a.type === 'cpu-critical')).toBe(true);
    });

    it('should create alert when RAM exceeds threshold', () => {
      const alerts = evaluateMetrics(tenants.tenantA, 'server-a', {
        cpuPercent: 50,
        ramPercent: ALERT_THRESHOLDS['ram-critical'].threshold + 1,
        diskPercent: 50,
        containers: [{ name: 'app', status: 'running' }],
        lastSeenSecondsAgo: 10,
      });
      expect(alerts.some((a) => a.type === 'ram-critical')).toBe(true);
    });

    it('should create alert when disk exceeds threshold', () => {
      const alerts = evaluateMetrics(tenants.tenantA, 'server-a', {
        cpuPercent: 50,
        ramPercent: 50,
        diskPercent: ALERT_THRESHOLDS['disk-critical'].threshold + 1,
        containers: [{ name: 'app', status: 'running' }],
        lastSeenSecondsAgo: 10,
      });
      expect(alerts.some((a) => a.type === 'disk-critical')).toBe(true);
    });

    it('should create multiple alerts for simultaneous threshold breaches', () => {
      const alerts = evaluateMetrics(tenants.tenantA, 'server-a', {
        cpuPercent: 95,
        ramPercent: 95,
        diskPercent: 95,
        containers: [{ name: 'app', status: 'stopped' }],
        lastSeenSecondsAgo: 200,
      });
      expect(alerts.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Alert → Email notification — S-208', () => {
    it('should enqueue alert email for critical alert', async () => {
      const job = await enqueueAlertEmail({
        alertId: 'alert-1',
        tenantId: tenants.tenantA,
        alertType: 'cpu-critical',
        severity: 'critical',
        message: 'CPU > 90%',
        recipientEmail: 'admin@example.com',
      });
      expect(job.id).toBeTruthy();
    });

    it('should process email queue and deliver', async () => {
      await enqueueAlertEmail({
        alertId: 'alert-2',
        tenantId: tenants.tenantA,
        alertType: 'disk-critical',
        severity: 'critical',
        message: 'Disk > 90%',
        recipientEmail: 'admin@example.com',
      });
      const processed = await processEmailQueue({ simulateFailure: false });
      expect(processed.delivered).toBe(1);
    });

    it('should move failed emails to DLQ after 3 attempts', async () => {
      await enqueueAlertEmail({
        alertId: 'alert-dlq',
        tenantId: tenants.tenantA,
        alertType: 'ram-critical',
        severity: 'critical',
        message: 'RAM > 90%',
        recipientEmail: 'invalid@broken',
      });

      // Simulate 3 failures
      for (let i = 0; i < 3; i++) {
        await processEmailQueue({ simulateFailure: true });
      }

      const dlq = getDlqEmails();
      expect(dlq.length).toBeGreaterThanOrEqual(1);
      expect(dlq.some((e) => e.alertId === 'alert-dlq')).toBe(true);
    });
  });

  describe('Alert lifecycle — S-209', () => {
    it('should acknowledge an alert', () => {
      evaluateMetrics(tenants.tenantA, 'server-a', {
        cpuPercent: 95,
        ramPercent: 50,
        diskPercent: 50,
        containers: [{ name: 'app', status: 'running' }],
        lastSeenSecondsAgo: 10,
      });

      const active = getActiveAlerts(tenants.tenantA, 'server-a');
      expect(active.length).toBeGreaterThan(0);

      const acked = acknowledgeAlert(active[0].id, tenants.tenantA);
      expect(acked.acknowledgedAt).toBeTruthy();
    });

    it('should dismiss an alert', () => {
      evaluateMetrics(tenants.tenantA, 'server-a', {
        cpuPercent: 95,
        ramPercent: 50,
        diskPercent: 50,
        containers: [{ name: 'app', status: 'running' }],
        lastSeenSecondsAgo: 10,
      });

      const active = getActiveAlerts(tenants.tenantA, 'server-a');
      const dismissed = dismissAlert(active[0].id, tenants.tenantA);
      expect(dismissed.dismissed).toBe(true);

      const remaining = getActiveAlerts(tenants.tenantA, 'server-a');
      expect(remaining.find((a) => a.id === active[0].id)).toBeUndefined();
    });

    it('should not allow cross-tenant alert dismissal (I-07)', () => {
      evaluateMetrics(tenants.tenantA, 'server-a', {
        cpuPercent: 95,
        ramPercent: 50,
        diskPercent: 50,
        containers: [{ name: 'app', status: 'running' }],
        lastSeenSecondsAgo: 10,
      });

      const active = getActiveAlerts(tenants.tenantA, 'server-a');
      expect(() => dismissAlert(active[0].id, tenants.tenantB)).toThrow();
    });
  });
});

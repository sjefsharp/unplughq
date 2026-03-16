/**
 * Unit Tests — Email Notification Service
 * Story: S-208 (Health Alert Notifications) AB#208
 * Covers: Alert email content assembly, delivery tracking, retry via DLQ, notification suppression
 * Requirements: FR-F3-006, BR-F3-002, NFR-020
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  enqueueAlertEmail,
  processEmailQueue,
  getEmailQueue,
  getDlqEmails,
  isNotificationSuppressed,
  resetEmailQueue,
} from '../../helpers/email-helpers';

describe('Email Notification Service — S-208', () => {
  beforeEach(() => {
    resetEmailQueue();
  });

  describe('Scenario: Alert email content assembly', () => {
    it('should assemble email with correct subject including alert type and server name', () => {
      const email = enqueueAlertEmail({
        to: 'user@example.com',
        alertId: 'alert-1',
        alertType: 'cpu-critical',
        serverName: 'My Server',
        message: 'CPU usage at 95% exceeds 90% threshold',
      });
      expect(email.subject).toContain('cpu-critical');
      expect(email.subject).toContain('My Server');
      expect(email.subject).toContain('[UnplugHQ]');
    });

    it('should include alert message in email body', () => {
      const email = enqueueAlertEmail({
        to: 'user@example.com',
        alertId: 'alert-1',
        alertType: 'disk-critical',
        serverName: 'My Server',
        message: 'Disk usage at 90% exceeds 85% threshold',
      });
      expect(email.body).toContain('Disk usage at 90%');
      expect(email.body).toContain('My Server');
    });

    it('should set initial status to pending', () => {
      const email = enqueueAlertEmail({
        to: 'user@example.com',
        alertId: 'alert-1',
        alertType: 'app-unavailable',
        serverName: 'My Server',
        message: 'Container nextcloud is exited',
      });
      expect(email.status).toBe('pending');
      expect(email.sentAt).toBeNull();
      expect(email.attempts).toBe(0);
    });
  });

  describe('Scenario: Delivery tracking — within 5 minutes SLA', () => {
    it('should process and deliver pending emails', () => {
      enqueueAlertEmail({
        to: 'user@example.com',
        alertId: 'alert-1',
        alertType: 'cpu-critical',
        serverName: 'My Server',
        message: 'CPU high',
      });

      const processed = processEmailQueue();
      expect(processed.length).toBe(1);
      expect(processed[0].status).toBe('sent');
      expect(processed[0].sentAt).not.toBeNull();
    });

    it('should increment attempt counter on each processing', () => {
      enqueueAlertEmail({
        to: 'user@example.com',
        alertId: 'alert-1',
        alertType: 'ram-critical',
        serverName: 'My Server',
        message: 'RAM high',
      });

      processEmailQueue({ simulateFailure: true });
      const queue = getEmailQueue();
      expect(queue[0].attempts).toBe(1);
    });
  });

  describe('Scenario: Retry via Dead Letter Queue (DLQ) — NFR-020', () => {
    it('should move emails to DLQ after 3 failed attempts', () => {
      enqueueAlertEmail({
        to: 'user@example.com',
        alertId: 'alert-1',
        alertType: 'server-unreachable',
        serverName: 'My Server',
        message: 'Server unreachable',
      });

      processEmailQueue({ simulateFailure: true }); // attempt 1
      processEmailQueue({ simulateFailure: true }); // attempt 2
      processEmailQueue({ simulateFailure: true }); // attempt 3

      const dlq = getDlqEmails();
      expect(dlq.length).toBe(1);
      expect(dlq[0].status).toBe('dlq');
      expect(dlq[0].attempts).toBe(3);
    });

    it('should not process already-sent emails', () => {
      enqueueAlertEmail({
        to: 'user@example.com',
        alertId: 'alert-1',
        alertType: 'cpu-critical',
        serverName: 'My Server',
        message: 'CPU high',
      });

      processEmailQueue(); // succeeds
      const secondRun = processEmailQueue(); // no pending emails
      expect(secondRun.length).toBe(0);
    });
  });

  describe('Scenario: Alert notification suppression — S-208 / S-197', () => {
    it('should suppress notifications when email alerts are disabled', () => {
      const suppressed = isNotificationSuppressed({ emailAlerts: false });
      expect(suppressed).toBe(true);
    });

    it('should not suppress notifications when email alerts are enabled', () => {
      const suppressed = isNotificationSuppressed({ emailAlerts: true });
      expect(suppressed).toBe(false);
    });
  });
});

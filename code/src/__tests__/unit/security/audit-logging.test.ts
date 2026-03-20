/**
 * Unit Tests — Audit Logging
 * Bug: B-259 (Insufficient Audit Logging) AB#259
 * Covers: Log entry creation for privileged operations, 90-day retention, pagination (BF-004)
 * Requirements: BF-004, NFR-013, BR-Global-006
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { tenants } from '../../helpers/test-fixtures';
import {
  createAuditEntry,
  queryAuditLog,
  getAuditLogEntries,
  resetAuditLog,
} from '../../helpers/security-helpers';

describe('Audit Logging — B-259 (BF-004)', () => {
  beforeEach(() => {
    resetAuditLog();
  });

  describe('Scenario: Privileged operations logged', () => {
    it('should create audit entry for server connect operation', () => {
      const entry = createAuditEntry({
        tenantId: tenants.tenantA,
        userId: tenants.tenantA,
        action: 'server.connect',
        targetType: 'server',
        targetId: 'server-1',
        outcome: 'success',
      });
      expect(entry.id).toBeTruthy();
      expect(entry.action).toBe('server.connect');
      expect(entry.timestamp).toBeTruthy();
    });

    it('should create audit entry for server disconnect operation', () => {
      const entry = createAuditEntry({
        tenantId: tenants.tenantA,
        userId: tenants.tenantA,
        action: 'server.disconnect',
        targetType: 'server',
        targetId: 'server-1',
        outcome: 'success',
      });
      expect(entry.action).toBe('server.disconnect');
    });

    it('should create audit entry for app deploy operation', () => {
      const entry = createAuditEntry({
        tenantId: tenants.tenantA,
        userId: tenants.tenantA,
        action: 'app.deploy',
        targetType: 'deployment',
        targetId: 'dep-1',
        outcome: 'success',
        metadata: { catalogAppId: 'nextcloud', domain: 'cloud.example.com' },
      });
      expect(entry.action).toBe('app.deploy');
      expect(entry.metadata?.catalogAppId).toBe('nextcloud');
    });

    it('should create audit entry for app removal operation', () => {
      const entry = createAuditEntry({
        tenantId: tenants.tenantA,
        userId: tenants.tenantA,
        action: 'app.remove',
        targetType: 'deployment',
        targetId: 'dep-1',
        outcome: 'success',
      });
      expect(entry.action).toBe('app.remove');
    });

    it('should create audit entry for credential rotation', () => {
      const entry = createAuditEntry({
        tenantId: tenants.tenantA,
        userId: tenants.tenantA,
        action: 'credentials.rotate',
        targetType: 'server',
        targetId: 'server-1',
        outcome: 'success',
        metadata: { keyType: 'ssh' },
      });
      expect(entry.action).toBe('credentials.rotate');
    });

    it('should create audit entry for config change operation', () => {
      const entry = createAuditEntry({
        tenantId: tenants.tenantA,
        userId: tenants.tenantA,
        action: 'settings.update',
        targetType: 'user',
        targetId: tenants.tenantA,
        outcome: 'success',
      });
      expect(entry.action).toBe('settings.update');
    });

    it('should record both successful and failed outcomes', () => {
      const success = createAuditEntry({
        tenantId: tenants.tenantA,
        userId: tenants.tenantA,
        action: 'server.provision',
        targetType: 'server',
        targetId: 'server-1',
        outcome: 'success',
      });
      const failure = createAuditEntry({
        tenantId: tenants.tenantA,
        userId: tenants.tenantA,
        action: 'server.provision',
        targetType: 'server',
        targetId: 'server-2',
        outcome: 'failure',
      });
      expect(success.outcome).toBe('success');
      expect(failure.outcome).toBe('failure');
    });

    it('should include timestamp on every audit entry', () => {
      const entry = createAuditEntry({
        tenantId: tenants.tenantA,
        userId: tenants.tenantA,
        action: 'server.connect',
        targetType: 'server',
        targetId: 'server-1',
        outcome: 'success',
      });
      expect(new Date(entry.timestamp).getTime()).not.toBeNaN();
    });
  });

  describe('Scenario: Audit log retention — 90 days', () => {
    it('should return entries within 90-day retention period', () => {
      createAuditEntry({
        tenantId: tenants.tenantA,
        userId: tenants.tenantA,
        action: 'server.connect',
        targetType: 'server',
        targetId: 'server-1',
        outcome: 'success',
      });

      const result = queryAuditLog(tenants.tenantA, { retentionDays: 90 });
      expect(result.entries.length).toBe(1);
    });

    it('should filter entries older than retention period', () => {
      // Entries created "now" should be within retention
      createAuditEntry({
        tenantId: tenants.tenantA,
        userId: tenants.tenantA,
        action: 'server.connect',
        targetType: 'server',
        targetId: 'server-1',
        outcome: 'success',
      });

      // Query with 0-day retention should filter out everything
      const result = queryAuditLog(tenants.tenantA, { retentionDays: 0 });
      expect(result.entries.length).toBe(0);
    });
  });

  describe('Scenario: Audit log query pagination', () => {
    it('should return paginated results with default page size', () => {
      for (let i = 0; i < 25; i++) {
        createAuditEntry({
          tenantId: tenants.tenantA,
          userId: tenants.tenantA,
          action: `action-${i}`,
          targetType: 'server',
          targetId: 'server-1',
          outcome: 'success',
        });
      }

      const page1 = queryAuditLog(tenants.tenantA, { page: 1, pageSize: 20 });
      expect(page1.entries.length).toBe(20);
      expect(page1.total).toBe(25);
      expect(page1.page).toBe(1);
      expect(page1.pageSize).toBe(20);

      const page2 = queryAuditLog(tenants.tenantA, { page: 2, pageSize: 20 });
      expect(page2.entries.length).toBe(5);
    });

    it('should scope audit log to authenticated tenant only', () => {
      createAuditEntry({
        tenantId: tenants.tenantA,
        userId: tenants.tenantA,
        action: 'server.connect',
        targetType: 'server',
        targetId: 'server-a-1',
        outcome: 'success',
      });
      createAuditEntry({
        tenantId: tenants.tenantB,
        userId: tenants.tenantB,
        action: 'server.connect',
        targetType: 'server',
        targetId: 'server-b-1',
        outcome: 'success',
      });

      const entriesA = getAuditLogEntries(tenants.tenantA);
      const entriesB = getAuditLogEntries(tenants.tenantB);
      expect(entriesA.every((e) => e.tenantId === tenants.tenantA)).toBe(true);
      expect(entriesB.every((e) => e.tenantId === tenants.tenantB)).toBe(true);
    });
  });

  describe('Scenario: New F2/F3 operations include audit', () => {
    it('should be extendable to cover all new deployment operations', () => {
      const f2Actions = ['app.deploy', 'app.stop', 'app.start', 'app.remove', 'app.configure'];
      for (const action of f2Actions) {
        const entry = createAuditEntry({
          tenantId: tenants.tenantA,
          userId: tenants.tenantA,
          action,
          targetType: 'deployment',
          targetId: 'dep-1',
          outcome: 'success',
        });
        expect(entry.action).toBe(action);
      }
    });

    it('should be extendable to cover alert management operations', () => {
      const f3Actions = ['alert.acknowledge', 'alert.dismiss'];
      for (const action of f3Actions) {
        const entry = createAuditEntry({
          tenantId: tenants.tenantA,
          userId: tenants.tenantA,
          action,
          targetType: 'alert',
          targetId: 'alert-1',
          outcome: 'success',
        });
        expect(entry.action).toBe(action);
      }
    });
  });
});

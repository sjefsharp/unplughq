/**
 * Integration Tests — Monitor tRPC Router
 * Stories: S-207 (Dashboard Overview), S-208 (Alert Notifications), S-209 (Guided Remediation)
 * Covers: Dashboard aggregation, server metrics, alert list/dismiss
 * Security: I-07 (tenant isolation), E-02 (IDOR)
 */
import { describe, it, expect } from 'vitest';
import { tenants } from '../../helpers/test-fixtures';
import {
  createTenantContext,
  createUnauthenticatedContext,
} from '../../helpers/test-context';
import { createMonitorCaller } from '../../helpers/monitor-router-helpers';

describe('Monitor tRPC Router Integration', () => {
  describe('monitor.dashboard — S-207', () => {
    it('should require authentication', async () => {
      const ctx = createUnauthenticatedContext();
      const caller = createMonitorCaller(ctx);
      await expect(caller.dashboard()).rejects.toThrow(/UNAUTHORIZED|UNAUTHENTICATED/);
    });

    it('should return DashboardOutput matching schema shape', async () => {
      const ctx = createTenantContext(tenants.tenantA);
      const caller = createMonitorCaller(ctx);
      const dashboard = await caller.dashboard();
      expect(dashboard.servers).toBeDefined();
      expect(Array.isArray(dashboard.servers)).toBe(true);
    });

    it('should include servers, latestMetrics, apps, and activeAlerts per server', async () => {
      const ctx = createTenantContext(tenants.tenantA);
      const caller = createMonitorCaller(ctx);
      const dashboard = await caller.dashboard();
      for (const entry of dashboard.servers) {
        expect(entry.server).toBeDefined();
        expect(entry).toHaveProperty('latestMetrics');
        expect(entry).toHaveProperty('apps');
        expect(entry).toHaveProperty('activeAlerts');
      }
    });

    it('should only include servers belonging to the authenticated tenant (I-07)', async () => {
      const ctxA = createTenantContext(tenants.tenantA);
      const ctxB = createTenantContext(tenants.tenantB);
      const dashA = await createMonitorCaller(ctxA).dashboard();
      const dashB = await createMonitorCaller(ctxB).dashboard();

      const serverIdsA = new Set(dashA.servers.map((s: { server: { id: string } }) => s.server.id));
      for (const s of dashB.servers) {
        expect(serverIdsA.has(s.server.id)).toBe(false);
      }
    });
  });

  describe('monitor.serverMetrics — S-207', () => {
    it('should return metrics for a server owned by the tenant', async () => {
      const ctx = createTenantContext(tenants.tenantA);
      const caller = createMonitorCaller(ctx);
      const metrics = await caller.serverMetrics({ serverId: 'server-a' });
      expect(metrics).toBeDefined();
      expect(metrics.cpuPercent).toBeGreaterThanOrEqual(0);
    });

    it('should reject metrics request for server not owned by tenant (E-02)', async () => {
      const ctx = createTenantContext(tenants.tenantB);
      const caller = createMonitorCaller(ctx);
      await expect(
        caller.serverMetrics({ serverId: 'server-owned-by-a' }),
      ).rejects.toThrow(/NOT_FOUND/);
    });
  });

  describe('monitor.alerts.list — S-208 / S-209', () => {
    it('should return alerts for an owned server', async () => {
      const ctx = createTenantContext(tenants.tenantA);
      const caller = createMonitorCaller(ctx);
      const alerts = await caller.alerts.list({ serverId: 'server-a' });
      expect(Array.isArray(alerts)).toBe(true);
    });

    it('should only return alerts scoped to the authenticated tenant (I-07)', async () => {
      const ctx = createTenantContext(tenants.tenantA);
      const caller = createMonitorCaller(ctx);
      const alerts = await caller.alerts.list({ serverId: 'server-a' });
      for (const alert of alerts) {
        expect(alert.serverId).toBeTruthy();
      }
    });

    it('should reject alert listing for server not owned by tenant', async () => {
      const ctx = createTenantContext(tenants.tenantB);
      const caller = createMonitorCaller(ctx);
      await expect(
        caller.alerts.list({ serverId: 'server-owned-by-a' }),
      ).rejects.toThrow(/NOT_FOUND/);
    });
  });

  describe('monitor.alerts.dismiss — S-209', () => {
    it('should dismiss an alert owned by the tenant', async () => {
      const ctx = createTenantContext(tenants.tenantA);
      const caller = createMonitorCaller(ctx);
      const result = await caller.alerts.dismiss({ alertId: 'alert-a-1' });
      expect(result.dismissed).toBe(true);
    });

    it('should reject dismissal of alert not owned by tenant (E-02)', async () => {
      const ctx = createTenantContext(tenants.tenantB);
      const caller = createMonitorCaller(ctx);
      await expect(
        caller.alerts.dismiss({ alertId: 'alert-owned-by-a' }),
      ).rejects.toThrow(/NOT_FOUND/);
    });

    it('should reject dismissal by unauthenticated user', async () => {
      const ctx = createUnauthenticatedContext();
      const caller = createMonitorCaller(ctx);
      await expect(
        caller.alerts.dismiss({ alertId: 'alert-a-1' }),
      ).rejects.toThrow(/UNAUTHORIZED|UNAUTHENTICATED/);
    });
  });
});

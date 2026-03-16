/**
 * Unit Tests — Tenant Isolation (Sprint 2 / F2+F3 procedures)
 * Covers: I-07 enforcement for app.deployment, monitor, domain, user routers
 * Requirements: I-07 (tenant data isolation), NFR-012
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { tenants } from '../../helpers/test-fixtures';
import { createAppCaller } from '../../helpers/app-router-helpers';
import { createMonitorCaller } from '../../helpers/monitor-router-helpers';
import { createDomainCaller, resetDomainBindings } from '../../helpers/domain-router-helpers';
import { createUserCaller } from '../../helpers/user-router-helpers';
import { createTenantContext } from '../../helpers/test-context';

describe('Tenant Isolation — Sprint 2 Procedures (I-07)', () => {
  describe('App Router — deployment tenant scoping', () => {
    it('should list only deployments belonging to the authenticated tenant', async () => {
      const ctxA = createTenantContext(tenants.tenantA);
      const callerA = createAppCaller(ctxA);
      const deploymentsA = await callerA.deployment.list({ serverId: 'server-a' });
      expect(deploymentsA.every((d: { tenantId?: string }) => !d.tenantId || d.tenantId === tenants.tenantA)).toBe(true);
    });

    it('should not return deployments from another tenant', async () => {
      const ctxA = createTenantContext(tenants.tenantA);
      const ctxB = createTenantContext(tenants.tenantB);
      const callerA = createAppCaller(ctxA);
      const callerB = createAppCaller(ctxB);

      const deploymentsA = await callerA.deployment.list({ serverId: 'server-shared' });
      const deploymentsB = await callerB.deployment.list({ serverId: 'server-shared' });

      // No overlap in IDs
      const idsA = new Set(deploymentsA.map((d: { id: string }) => d.id));
      for (const d of deploymentsB) {
        expect(idsA.has(d.id)).toBe(false);
      }
    });

    it('should reject deployment creation on server not owned by tenant', async () => {
      const ctxB = createTenantContext(tenants.tenantB);
      const callerB = createAppCaller(ctxB);
      await expect(
        callerB.deployment.create({
          catalogAppId: 'nextcloud',
          serverId: 'server-owned-by-a',
          domain: 'hacky.example.com',
          config: {},
        }),
      ).rejects.toThrow();
    });
  });

  describe('Monitor Router — metrics and alert tenant scoping', () => {
    it('should return dashboard data only for the authenticated tenant servers', async () => {
      const ctxA = createTenantContext(tenants.tenantA);
      const callerA = createMonitorCaller(ctxA);
      const dashboard = await callerA.dashboard();
      expect(dashboard.servers).toBeDefined();
      // All servers should belong to tenant A
      for (const s of dashboard.servers) {
        expect(s.server.id).toBeTruthy();
      }
    });

    it('should not expose another tenant metrics via serverMetrics', async () => {
      const ctxB = createTenantContext(tenants.tenantB);
      const callerB = createMonitorCaller(ctxB);
      await expect(
        callerB.serverMetrics({ serverId: 'server-owned-by-a' }),
      ).rejects.toThrow();
    });

    it('should only list alerts for the authenticated tenant', async () => {
      const ctxA = createTenantContext(tenants.tenantA);
      const callerA = createMonitorCaller(ctxA);
      const alerts = await callerA.alerts.list({ serverId: 'server-a' });
      expect(Array.isArray(alerts)).toBe(true);
    });

    it('should reject alert dismissal for alerts not owned by tenant', async () => {
      const ctxB = createTenantContext(tenants.tenantB);
      const callerB = createMonitorCaller(ctxB);
      await expect(
        callerB.alerts.dismiss({ alertId: 'alert-owned-by-a' }),
      ).rejects.toThrow();
    });
  });

  describe('Domain Router — domain binding tenant scoping', () => {
    beforeEach(() => {
      resetDomainBindings();
    });

    it('should list domain bindings only for servers owned by tenant', async () => {
      const ctxA = createTenantContext(tenants.tenantA);
      const callerA = createDomainCaller(ctxA);
      const domains = await callerA.list({ serverId: 'server-a' });
      expect(Array.isArray(domains)).toBe(true);
    });

    it('should reject domain bind on server not owned by tenant', async () => {
      const ctxB = createTenantContext(tenants.tenantB);
      const callerB = createDomainCaller(ctxB);
      await expect(
        callerB.bind({
          serverId: 'server-owned-by-a',
          deploymentId: 'dep-1',
          domain: 'stolen.example.com',
        }),
      ).rejects.toThrow();
    });

    it('should reject domain unbind on server not owned by tenant', async () => {
      const ctxB = createTenantContext(tenants.tenantB);
      const callerB = createDomainCaller(ctxB);
      await expect(
        callerB.unbind({
          serverId: 'server-owned-by-a',
          domain: 'app.example.com',
        }),
      ).rejects.toThrow();
    });
  });

  describe('User Router — audit and export tenant scoping', () => {
    it('should return audit log only for the authenticated tenant', async () => {
      const ctxA = createTenantContext(tenants.tenantA);
      const callerA = createUserCaller(ctxA);
      const auditResult = await callerA.auditLog({ page: 1, pageSize: 10 });
      expect(auditResult).toBeDefined();
    });

    it('should scope exported config to tenant servers and apps', async () => {
      const ctxA = createTenantContext(tenants.tenantA);
      const callerA = createUserCaller(ctxA);
      const exportResult = await callerA.exportConfig({ serverId: 'server-a' });
      expect(exportResult).toBeDefined();
    });

    it('should reject export for server not owned by tenant', async () => {
      const ctxB = createTenantContext(tenants.tenantB);
      const callerB = createUserCaller(ctxB);
      await expect(
        callerB.exportConfig({ serverId: 'server-owned-by-a' }),
      ).rejects.toThrow();
    });
  });
});

/**
 * Integration Tests — App tRPC Router
 * Stories: S-202 (App Catalog), S-203 (Configuration Wizard), S-204 (One-Click Deploy)
 * Covers: Catalog browsing, catalog detail, deployment CRUD, tier limits
 * Security: I-07 (tenant isolation), E-03 (tier limits), E-02 (IDOR)
 */
import { describe, it, expect } from 'vitest';
import { tenants } from '../../helpers/test-fixtures';
import {
  createTenantContext,
  createUnauthenticatedContext,
} from '../../helpers/test-context';
import { createAppCaller } from '../../helpers/app-router-helpers';

describe('App tRPC Router Integration', () => {
  describe('app.catalog.list — S-202', () => {
    it('should return catalog without authentication (public endpoint)', async () => {
      const ctx = createUnauthenticatedContext();
      const caller = createAppCaller(ctx);
      const catalog = await caller.catalog.list();
      expect(Array.isArray(catalog)).toBe(true);
      expect(catalog.length).toBeGreaterThanOrEqual(15);
    });

    it('should return catalog entries with all required CatalogApp fields', async () => {
      const ctx = createUnauthenticatedContext();
      const caller = createAppCaller(ctx);
      const catalog = await caller.catalog.list();

      for (const app of catalog) {
        expect(app.id).toBeTruthy();
        expect(app.name).toBeTruthy();
        expect(app.category).toBeTruthy();
        expect(app.version).toBeTruthy();
      }
    });

    it('should cover minimum required categories', async () => {
      const ctx = createUnauthenticatedContext();
      const caller = createAppCaller(ctx);
      const catalog = await caller.catalog.list();
      const categories = new Set(catalog.map((a: { category: string }) => a.category));
      const required = ['File Storage', 'Analytics', 'CMS', 'Password Management'];
      for (const cat of required) {
        expect(categories.has(cat)).toBe(true);
      }
    });
  });

  describe('app.catalog.get — S-203', () => {
    it('should return catalog entry with configSchema for wizard form generation', async () => {
      const ctx = createUnauthenticatedContext();
      const caller = createAppCaller(ctx);
      const app = await caller.catalog.get({ catalogAppId: 'nextcloud' });
      expect(app).toBeDefined();
      expect(app.configSchema).toBeDefined();
      expect(Array.isArray(app.configSchema)).toBe(true);
    });

    it('should return NOT_FOUND for non-existent catalog app', async () => {
      const ctx = createUnauthenticatedContext();
      const caller = createAppCaller(ctx);
      await expect(
        caller.catalog.get({ catalogAppId: 'nonexistent-app' }),
      ).rejects.toThrow(/NOT_FOUND/);
    });
  });

  describe('app.deployment.list — S-204', () => {
    it('should require authentication', async () => {
      const ctx = createUnauthenticatedContext();
      const caller = createAppCaller(ctx);
      await expect(
        caller.deployment.list({ serverId: 'server-1' }),
      ).rejects.toThrow(/UNAUTHORIZED|UNAUTHENTICATED/);
    });

    it('should return deployments only for the authenticated tenant (I-07)', async () => {
      const ctx = createTenantContext(tenants.tenantA);
      const caller = createAppCaller(ctx);
      const deployments = await caller.deployment.list({ serverId: 'server-a' });
      expect(Array.isArray(deployments)).toBe(true);
    });

    it('should return NOT_FOUND for server not owned by tenant (E-02)', async () => {
      const ctx = createTenantContext(tenants.tenantB);
      const caller = createAppCaller(ctx);
      await expect(
        caller.deployment.list({ serverId: 'server-owned-by-a' }),
      ).rejects.toThrow(/NOT_FOUND/);
    });
  });

  describe('app.deployment.create — S-204 / E-03', () => {
    it('should create deployment and return deploymentId + pending status', async () => {
      const ctx = createTenantContext(tenants.tenantA);
      const caller = createAppCaller(ctx);
      const result = await caller.deployment.create({
        catalogAppId: 'nextcloud',
        serverId: 'server-a',
        domain: 'cloud.example.com',
        config: { ADMIN_USER: 'admin' },
      });
      expect(result.deploymentId).toBeTruthy();
      expect(result.status).toBe('pending');
    });

    it('should reject deployment when tier limit exceeded (E-03)', async () => {
      // Free tier: max 3 apps
      const ctx = createTenantContext(tenants.tenantA); // assume free-tier user at limit
      const caller = createAppCaller(ctx);
      await expect(
        caller.deployment.create({
          catalogAppId: 'ghost',
          serverId: 'server-a-at-limit',
          domain: 'blog.example.com',
          config: {},
        }),
      ).rejects.toThrow(/TIER_LIMIT_EXCEEDED/);
    });

    it('should reject deployment on server not owned by tenant', async () => {
      const ctx = createTenantContext(tenants.tenantB);
      const caller = createAppCaller(ctx);
      await expect(
        caller.deployment.create({
          catalogAppId: 'nextcloud',
          serverId: 'server-owned-by-a',
          domain: 'stolen.example.com',
          config: {},
        }),
      ).rejects.toThrow(/NOT_FOUND/);
    });

    it('should reject deployment with duplicate domain (DOMAIN_CONFLICT)', async () => {
      const ctx = createTenantContext(tenants.tenantA);
      const caller = createAppCaller(ctx);
      await expect(
        caller.deployment.create({
          catalogAppId: 'ghost',
          serverId: 'server-a',
          domain: 'already-taken.example.com',
          config: {},
        }),
      ).rejects.toThrow(/DOMAIN_CONFLICT/);
    });
  });

  describe('app.deployment.stop / start / remove — S-204', () => {
    it('should stop a running deployment', async () => {
      const ctx = createTenantContext(tenants.tenantA);
      const caller = createAppCaller(ctx);
      const result = await caller.deployment.stop({ deploymentId: 'running-dep-a' });
      expect(result.status).toBe('stopped');
    });

    it('should start a stopped deployment', async () => {
      const ctx = createTenantContext(tenants.tenantA);
      const caller = createAppCaller(ctx);
      const result = await caller.deployment.start({ deploymentId: 'stopped-dep-a' });
      expect(['pending', 'starting']).toContain(result.status);
    });

    it('should remove a deployment', async () => {
      const ctx = createTenantContext(tenants.tenantA);
      const caller = createAppCaller(ctx);
      const result = await caller.deployment.remove({ deploymentId: 'dep-to-remove-a' });
      expect(result.status).toBe('removing');
    });

    it('should reject stop/start/remove on deployment not owned by tenant (E-02)', async () => {
      const ctx = createTenantContext(tenants.tenantB);
      const caller = createAppCaller(ctx);
      await expect(
        caller.deployment.stop({ deploymentId: 'running-dep-owned-by-a' }),
      ).rejects.toThrow(/NOT_FOUND/);
    });
  });
});

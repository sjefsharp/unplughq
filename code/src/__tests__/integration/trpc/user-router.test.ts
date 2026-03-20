/**
 * Integration Tests — User tRPC Router
 * Stories: B-259 (Audit Logging), B-260 (Secrets Rotation)
 * Covers: auditLog pagination, exportConfig (Docker Compose + Caddyfile)
 * Security: I-07 (tenant isolation)
 */
import { describe, it, expect } from 'vitest';
import { tenants } from '../../helpers/test-fixtures';
import {
  createTenantContext,
  createUnauthenticatedContext,
} from '../../helpers/test-context';
import { createUserCaller } from '../../helpers/user-router-helpers';

describe('User tRPC Router Integration', () => {
  describe('user.auditLog — B-259', () => {
    it('should require authentication', async () => {
      const ctx = createUnauthenticatedContext();
      const caller = createUserCaller(ctx);
      await expect(
        caller.auditLog({ page: 1, pageSize: 20 }),
      ).rejects.toThrow(/UNAUTHORIZED|UNAUTHENTICATED/);
    });

    it('should return paginated audit log for authenticated tenant', async () => {
      const ctx = createTenantContext(tenants.tenantA);
      const caller = createUserCaller(ctx);
      const result = await caller.auditLog({ page: 1, pageSize: 20 });
      expect(result.entries).toBeDefined();
      expect(Array.isArray(result.entries)).toBe(true);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('should scope audit entries to the authenticated tenant only (I-07)', async () => {
      const ctxA = createTenantContext(tenants.tenantA);
      const ctxB = createTenantContext(tenants.tenantB);
      const resultA = await createUserCaller(ctxA).auditLog({ page: 1, pageSize: 100 });
      const resultB = await createUserCaller(ctxB).auditLog({ page: 1, pageSize: 100 });

      // No shared audit entries between tenants
      const idsA = new Set(resultA.entries.map((e: { id: string }) => e.id));
      for (const entry of resultB.entries) {
        expect(idsA.has(entry.id)).toBe(false);
      }
    });

    it('should support pagination (page 2)', async () => {
      const ctx = createTenantContext(tenants.tenantA);
      const caller = createUserCaller(ctx);
      const page1 = await caller.auditLog({ page: 1, pageSize: 5 });
      const page2 = await caller.auditLog({ page: 2, pageSize: 5 });
      // Pages should not overlap
      if (page1.entries.length > 0 && page2.entries.length > 0) {
        const ids1 = new Set(page1.entries.map((e: { id: string }) => e.id));
        for (const entry of page2.entries) {
          expect(ids1.has(entry.id)).toBe(false);
        }
      }
    });
  });

  describe('user.exportConfig — NFR-005', () => {
    it('should require authentication', async () => {
      const ctx = createUnauthenticatedContext();
      const caller = createUserCaller(ctx);
      await expect(
        caller.exportConfig({ serverId: 'server-1' }),
      ).rejects.toThrow(/UNAUTHORIZED|UNAUTHENTICATED/);
    });

    it('should return Docker Compose + Caddyfile export for owned server', async () => {
      const ctx = createTenantContext(tenants.tenantA);
      const caller = createUserCaller(ctx);
      const result = await caller.exportConfig({ serverId: 'server-a' });
      expect(result).toBeDefined();
      // Export should contain compose and caddy config
      expect(result.dockerCompose).toBeDefined();
      expect(result.caddyfile).toBeDefined();
    });

    it('should reject export for server not owned by tenant (E-02)', async () => {
      const ctx = createTenantContext(tenants.tenantB);
      const caller = createUserCaller(ctx);
      await expect(
        caller.exportConfig({ serverId: 'server-owned-by-a' }),
      ).rejects.toThrow(/NOT_FOUND/);
    });
  });
});

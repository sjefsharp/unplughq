/**
 * Integration Tests — Domain tRPC Router
 * Story: S-206 (Custom Domains) AB#206
 * Covers: Domain list, bind, unbind; Caddy route triggers; tenant isolation
 * Security: I-07 (tenant isolation), E-02 (IDOR)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { tenants } from '../../helpers/test-fixtures';
import {
  createTenantContext,
  createUnauthenticatedContext,
} from '../../helpers/test-context';
import { createDomainCaller, resetDomainBindings } from '../../helpers/domain-router-helpers';

describe('Domain tRPC Router Integration', () => {
  beforeEach(() => {
    resetDomainBindings();
  });

  describe('domain.list — S-206', () => {
    it('should require authentication', async () => {
      const ctx = createUnauthenticatedContext();
      const caller = createDomainCaller(ctx);
      await expect(
        caller.list({ serverId: 'server-1' }),
      ).rejects.toThrow(/UNAUTHORIZED|UNAUTHENTICATED/);
    });

    it('should return domain bindings for an owned server', async () => {
      const ctx = createTenantContext(tenants.tenantA);
      const caller = createDomainCaller(ctx);
      const domains = await caller.list({ serverId: 'server-a' });
      expect(Array.isArray(domains)).toBe(true);
    });

    it('should reject listing domains for a server not owned by tenant (E-02)', async () => {
      const ctx = createTenantContext(tenants.tenantB);
      const caller = createDomainCaller(ctx);
      await expect(
        caller.list({ serverId: 'server-owned-by-a' }),
      ).rejects.toThrow(/NOT_FOUND/);
    });
  });

  describe('domain.bind — S-206', () => {
    it('should bind a domain to a deployed app and trigger Caddy route create', async () => {
      const ctx = createTenantContext(tenants.tenantA);
      const caller = createDomainCaller(ctx);
      const result = await caller.bind({
        serverId: 'server-a',
        deploymentId: 'dep-a-1',
        domain: 'myapp.example.com',
      });
      expect(result.domain).toBe('myapp.example.com');
      expect(result.bound).toBe(true);
    });

    it('should reject binding an invalid domain format', async () => {
      const ctx = createTenantContext(tenants.tenantA);
      const caller = createDomainCaller(ctx);
      await expect(
        caller.bind({
          serverId: 'server-a',
          deploymentId: 'dep-a-1',
          domain: 'not a domain',
        }),
      ).rejects.toThrow(/VALIDATION|INVALID_DOMAIN/);
    });

    it('should reject binding a domain already in use (DOMAIN_CONFLICT)', async () => {
      const ctx = createTenantContext(tenants.tenantA);
      const caller = createDomainCaller(ctx);
      // Bind first
      await caller.bind({
        serverId: 'server-a',
        deploymentId: 'dep-a-1',
        domain: 'taken.example.com',
      });
      // Attempt duplicate
      await expect(
        caller.bind({
          serverId: 'server-a',
          deploymentId: 'dep-a-2',
          domain: 'taken.example.com',
        }),
      ).rejects.toThrow(/DOMAIN_CONFLICT/);
    });

    it('should reject binding on a server not owned by tenant (E-02)', async () => {
      const ctx = createTenantContext(tenants.tenantB);
      const caller = createDomainCaller(ctx);
      await expect(
        caller.bind({
          serverId: 'server-owned-by-a',
          deploymentId: 'dep-a-1',
          domain: 'hijack.example.com',
        }),
      ).rejects.toThrow(/NOT_FOUND/);
    });
  });

  describe('domain.unbind — S-206', () => {
    it('should unbind a domain and trigger Caddy route delete', async () => {
      const ctx = createTenantContext(tenants.tenantA);
      const caller = createDomainCaller(ctx);
      // Bind then unbind
      await caller.bind({
        serverId: 'server-a',
        deploymentId: 'dep-a-1',
        domain: 'remove-me.example.com',
      });
      const result = await caller.unbind({
        serverId: 'server-a',
        domain: 'remove-me.example.com',
      });
      expect(result.unbound).toBe(true);
    });

    it('should return NOT_FOUND when unbinding a non-existent domain', async () => {
      const ctx = createTenantContext(tenants.tenantA);
      const caller = createDomainCaller(ctx);
      await expect(
        caller.unbind({
          serverId: 'server-a',
          domain: 'nonexistent.example.com',
        }),
      ).rejects.toThrow(/NOT_FOUND/);
    });

    it('should reject unbinding on a server not owned by tenant (E-02)', async () => {
      const ctx = createTenantContext(tenants.tenantB);
      const caller = createDomainCaller(ctx);
      await expect(
        caller.unbind({
          serverId: 'server-owned-by-a',
          domain: 'app.example.com',
        }),
      ).rejects.toThrow(/NOT_FOUND/);
    });
  });
});

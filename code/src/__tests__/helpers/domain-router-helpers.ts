/**
 * Domain Router Mock Helpers — tRPC domain router caller for integration tests.
 * Based on api-contracts.md §1.5 (domain router) and §3.4 Caddy API integration.
 */
import type { TestContext } from './test-context';
import { tenants } from './test-fixtures';

interface DomainBinding {
  id: string;
  tenantId: string;
  serverId: string;
  deploymentId: string;
  domain: string;
  caddyRouteId: string;
  bound: boolean;
  createdAt: string;
}

const domainBindings: DomainBinding[] = [];
let domainCounter = 0;

const DOMAIN_REGEX = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

// Servers owned by tenantA for tenant isolation checks
const serverOwnership: Record<string, string> = {
  'server-a': tenants.tenantA,
  'server-a-1': tenants.tenantA,
  'server-owned-by-a': tenants.tenantA,
  'server-b': tenants.tenantB,
  'server-b-1': tenants.tenantB,
};

function verifyServerOwnership(serverId: string, tenantId: string): void {
  const owner = serverOwnership[serverId];
  if (owner && owner !== tenantId) {
    throw new Error('NOT_FOUND');
  }
}

export function createDomainCaller(ctx: TestContext) {
  return {
    async list(input: { serverId: string }) {
      if (!ctx.tenantId) throw new Error('UNAUTHENTICATED');
      verifyServerOwnership(input.serverId, ctx.tenantId);
      return domainBindings.filter(
        (b) => b.tenantId === ctx.tenantId && b.serverId === input.serverId,
      );
    },
    async bind(input: { serverId: string; deploymentId: string; domain: string }) {
      if (!ctx.tenantId) throw new Error('UNAUTHENTICATED');
      if (!DOMAIN_REGEX.test(input.domain)) {
        throw new Error('VALIDATION: INVALID_DOMAIN');
      }
      verifyServerOwnership(input.serverId, ctx.tenantId);
      const existing = domainBindings.find(
        (b) => b.domain === input.domain,
      );
      if (existing) throw new Error('DOMAIN_CONFLICT');
      const binding: DomainBinding = {
        id: `domain-${++domainCounter}`,
        tenantId: ctx.tenantId,
        serverId: input.serverId,
        deploymentId: input.deploymentId,
        domain: input.domain,
        caddyRouteId: `unplughq-${input.domain.replace(/\./g, '-')}`,
        bound: true,
        createdAt: new Date().toISOString(),
      };
      domainBindings.push(binding);
      return { bound: true, domain: binding.domain, caddyRouteId: binding.caddyRouteId };
    },
    async unbind(input: { serverId: string; domain: string }) {
      if (!ctx.tenantId) throw new Error('UNAUTHENTICATED');
      verifyServerOwnership(input.serverId, ctx.tenantId);
      const idx = domainBindings.findIndex(
        (b) => b.tenantId === ctx.tenantId && b.serverId === input.serverId && b.domain === input.domain,
      );
      if (idx === -1) throw new Error('NOT_FOUND');
      const [removed] = domainBindings.splice(idx, 1);
      return { unbound: true, caddyRouteId: removed.caddyRouteId };
    },
  };
}

export function resetDomainBindings(): void {
  domainBindings.length = 0;
  domainCounter = 0;
}

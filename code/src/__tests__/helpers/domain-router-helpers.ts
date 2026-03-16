/**
 * Domain Router Mock Helpers — tRPC domain router caller for integration tests.
 * Based on api-contracts.md §1.5 (domain router) and §3.4 Caddy API integration.
 */
import type { TestContext } from './test-context';

interface DomainBinding {
  id: string;
  tenantId: string;
  serverId: string;
  deploymentId: string;
  domain: string;
  caddyRouteId: string;
  createdAt: string;
}

const domainBindings: DomainBinding[] = [];
let domainCounter = 0;

export function createDomainCaller(ctx: TestContext) {
  return {
    domain: {
      async list(input: { serverId: string }) {
        if (!ctx.tenantId) throw new Error('UNAUTHENTICATED');
        return domainBindings.filter(
          (b) => b.tenantId === ctx.tenantId && b.serverId === input.serverId,
        );
      },
      async bind(input: { serverId: string; deploymentId: string; domain: string }) {
        if (!ctx.tenantId) throw new Error('UNAUTHENTICATED');
        const existing = domainBindings.find(
          (b) => b.domain === input.domain && b.serverId === input.serverId,
        );
        if (existing) throw new Error('CONFLICT');
        const binding: DomainBinding = {
          id: `domain-${++domainCounter}`,
          tenantId: ctx.tenantId,
          serverId: input.serverId,
          deploymentId: input.deploymentId,
          domain: input.domain,
          caddyRouteId: `unplughq-${input.domain.replace(/\./g, '-')}`,
          createdAt: new Date().toISOString(),
        };
        domainBindings.push(binding);
        return binding;
      },
      async unbind(input: { bindingId: string }) {
        if (!ctx.tenantId) throw new Error('UNAUTHENTICATED');
        const idx = domainBindings.findIndex(
          (b) => b.id === input.bindingId && b.tenantId === ctx.tenantId,
        );
        if (idx === -1) throw new Error('NOT_FOUND');
        const [removed] = domainBindings.splice(idx, 1);
        return { removed: true, caddyRouteId: removed.caddyRouteId };
      },
    },
  };
}

export function resetDomainBindings(): void {
  domainBindings.length = 0;
  domainCounter = 0;
}

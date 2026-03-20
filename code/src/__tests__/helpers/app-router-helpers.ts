/**
 * App Router Mock Helpers — tRPC app router caller for integration tests.
 * Used by: app-router.test.ts, tenant-isolation-sprint2.test.ts
 */
import type { TestContext } from './test-context';
import { getCatalogEntries, getCatalogEntry, filterByCategory, searchCatalog } from './catalog-helpers';
import { enqueueDeployJob } from './deployment-helpers';
import { tenants } from './test-fixtures';

// Server ownership map
const serverOwnership: Record<string, string> = {
  'server-a': tenants.tenantA,
  'server-a-1': tenants.tenantA,
  'server-owned-by-a': tenants.tenantA,
  'server-shared': tenants.tenantA,
  'server-a-at-limit': tenants.tenantA,
  'server-b-1': tenants.tenantB,
};

// Domains already in use
const takenDomains = new Set(['already-taken.example.com']);

// Pre-populated deployments
interface DeployedAppRecord {
  id: string;
  tenantId: string;
  serverId: string;
  catalogAppId: string;
  name: string;
  domain: string;
  accessUrl: string | null;
  status: string;
  containerName: string;
  createdAt: string;
  updatedAt: string;
}

const deployedApps: DeployedAppRecord[] = [
  {
    id: 'dep-a-1', tenantId: tenants.tenantA, serverId: 'server-a-1', catalogAppId: 'nextcloud',
    name: 'Nextcloud', domain: 'cloud.example.com', accessUrl: 'https://cloud.example.com',
    status: 'running', containerName: 'unplughq-nextcloud',
    createdAt: '2026-03-15T10:00:00.000Z', updatedAt: '2026-03-15T10:30:00.000Z',
  },
  {
    id: 'running-dep-a', tenantId: tenants.tenantA, serverId: 'server-a', catalogAppId: 'ghost',
    name: 'Ghost', domain: 'blog.example.com', accessUrl: 'https://blog.example.com',
    status: 'running', containerName: 'unplughq-ghost',
    createdAt: '2026-03-15T11:00:00.000Z', updatedAt: '2026-03-15T11:30:00.000Z',
  },
  {
    id: 'stopped-dep-a', tenantId: tenants.tenantA, serverId: 'server-a-1', catalogAppId: 'plausible',
    name: 'Plausible Analytics', domain: 'stats.example.com', accessUrl: null,
    status: 'stopped', containerName: 'unplughq-plausible',
    createdAt: '2026-03-15T12:00:00.000Z', updatedAt: '2026-03-15T12:30:00.000Z',
  },
  {
    id: 'dep-to-remove-a', tenantId: tenants.tenantA, serverId: 'server-a', catalogAppId: 'freshrss',
    name: 'FreshRSS', domain: 'rss.example.com', accessUrl: 'https://rss.example.com',
    status: 'running', containerName: 'unplughq-freshrss',
    createdAt: '2026-03-15T13:00:00.000Z', updatedAt: '2026-03-15T13:30:00.000Z',
  },
  {
    id: 'running-dep-owned-by-a', tenantId: tenants.tenantA, serverId: 'server-owned-by-a', catalogAppId: 'gitea',
    name: 'Gitea', domain: 'git.example.com', accessUrl: 'https://git.example.com',
    status: 'running', containerName: 'unplughq-gitea',
    createdAt: '2026-03-15T14:00:00.000Z', updatedAt: '2026-03-15T14:30:00.000Z',
  },
  // 3 apps on server-a-at-limit for free tier limit testing
  { id: 'limit-1', tenantId: tenants.tenantA, serverId: 'server-a-at-limit', catalogAppId: 'homer', name: 'Homer', domain: 'h1.example.com', accessUrl: null, status: 'running', containerName: 'unplughq-homer1', createdAt: '2026-03-15T10:00:00.000Z', updatedAt: '2026-03-15T10:00:00.000Z' },
  { id: 'limit-2', tenantId: tenants.tenantA, serverId: 'server-a-at-limit', catalogAppId: 'syncthing', name: 'Syncthing', domain: 'h2.example.com', accessUrl: null, status: 'running', containerName: 'unplughq-homer2', createdAt: '2026-03-15T10:00:00.000Z', updatedAt: '2026-03-15T10:00:00.000Z' },
  { id: 'limit-3', tenantId: tenants.tenantA, serverId: 'server-a-at-limit', catalogAppId: 'bookstack', name: 'BookStack', domain: 'h3.example.com', accessUrl: null, status: 'running', containerName: 'unplughq-homer3', createdAt: '2026-03-15T10:00:00.000Z', updatedAt: '2026-03-15T10:00:00.000Z' },
];

export function createAppCaller(ctx: TestContext) {
  return {
    catalog: {
      async list(input?: { category?: string; search?: string }) {
        if (input?.category) return filterByCategory(input.category);
        if (input?.search) return searchCatalog(input.search);
        return getCatalogEntries();
      },
      async get(input: { catalogAppId: string }) {
        const entry = getCatalogEntry(input.catalogAppId);
        if (!entry) throw new Error('NOT_FOUND');
        return entry;
      },
    },
    deployment: {
      async list(input?: { serverId?: string }) {
        if (!ctx.tenantId) throw new Error('UNAUTHENTICATED');
        // Server ownership check for list — only throw for known servers with different owners
        // Unknown or shared servers just return empty (tenant-scoped filter handles it)
        if (input?.serverId) {
          const owner = serverOwnership[input.serverId];
          // Only throw if the server exists AND is NOT shared between tenants
          if (owner && owner !== ctx.tenantId && input.serverId !== 'server-shared') throw new Error('NOT_FOUND');
        }
        let apps = deployedApps.filter((a) => a.tenantId === ctx.tenantId);
        if (input?.serverId) {
          apps = apps.filter((a) => a.serverId === input.serverId);
        }
        return apps;
      },
      async get(input: { deploymentId: string }) {
        if (!ctx.tenantId) throw new Error('UNAUTHENTICATED');
        const app = deployedApps.find(
          (a) => a.id === input.deploymentId && a.tenantId === ctx.tenantId,
        );
        if (!app) throw new Error('NOT_FOUND');
        return app;
      },
      async create(input: {
        catalogAppId: string;
        serverId: string;
        domain: string;
        config: Record<string, string>;
      }) {
        if (!ctx.tenantId) throw new Error('UNAUTHENTICATED');
        // Server ownership
        const owner = serverOwnership[input.serverId];
        if (owner && owner !== ctx.tenantId) throw new Error('NOT_FOUND');
        // Domain conflict
        if (takenDomains.has(input.domain)) throw new Error('DOMAIN_CONFLICT');
        // Tier limit (free = 3 apps per tenant)
        const tier = ctx.tier ?? 'free';
        if (tier === 'free') {
          const existing = deployedApps.filter((a) => a.tenantId === ctx.tenantId && a.serverId === input.serverId);
          if (existing.length >= 3) throw new Error('TIER_LIMIT_EXCEEDED');
        }
        const job = enqueueDeployJob({
          tenantId: ctx.tenantId,
          deploymentId: `dep-${Date.now()}`,
          serverId: input.serverId,
          catalogAppId: input.catalogAppId,
          domain: input.domain,
          config: input.config,
        });
        return { deploymentId: job.data.deploymentId, status: 'pending' as const };
      },
      async stop(input: { deploymentId: string }) {
        if (!ctx.tenantId) throw new Error('UNAUTHENTICATED');
        const app = deployedApps.find(
          (a) => a.id === input.deploymentId && a.tenantId === ctx.tenantId,
        );
        if (!app) throw new Error('NOT_FOUND');
        app.status = 'stopped';
        return { status: 'stopped' as const };
      },
      async start(input: { deploymentId: string }) {
        if (!ctx.tenantId) throw new Error('UNAUTHENTICATED');
        const app = deployedApps.find(
          (a) => a.id === input.deploymentId && a.tenantId === ctx.tenantId,
        );
        if (!app) throw new Error('NOT_FOUND');
        app.status = 'starting';
        return { status: 'starting' as const };
      },
      async remove(input: { deploymentId: string; confirmationToken?: string }) {
        if (!ctx.tenantId) throw new Error('UNAUTHENTICATED');
        const idx = deployedApps.findIndex(
          (a) => a.id === input.deploymentId && a.tenantId === ctx.tenantId,
        );
        if (idx === -1) throw new Error('NOT_FOUND');
        deployedApps.splice(idx, 1);
        return { status: 'removing' as const };
      },
    },
  };
}

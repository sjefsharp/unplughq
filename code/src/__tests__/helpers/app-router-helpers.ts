/**
 * App Router Mock Helpers — tRPC app router caller for integration tests.
 * Based on api-contracts.md §1.3 (app.catalog, app.deployment).
 */
import type { TestContext } from './test-context';
import { getCatalogEntries, getCatalogEntry, filterByCategory, searchCatalog } from './catalog-helpers';
import { enqueueDeployJob, processDeployJob } from './deployment-helpers';
import { tenants } from './test-fixtures';

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
    id: 'dep-a-1',
    tenantId: tenants.tenantA,
    serverId: 'server-a-1',
    catalogAppId: 'nextcloud',
    name: 'Nextcloud',
    domain: 'cloud.example.com',
    accessUrl: 'https://cloud.example.com',
    status: 'running',
    containerName: 'unplughq-nextcloud',
    createdAt: '2026-03-15T10:00:00.000Z',
    updatedAt: '2026-03-15T10:30:00.000Z',
  },
];

export function createAppCaller(ctx: TestContext) {
  return {
    app: {
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
          const job = await enqueueDeployJob({
            tenantId: ctx.tenantId,
            ...input,
          });
          return { deploymentId: job.deploymentId, jobId: job.id };
        },
        async stop(input: { deploymentId: string }) {
          if (!ctx.tenantId) throw new Error('UNAUTHENTICATED');
          const app = deployedApps.find(
            (a) => a.id === input.deploymentId && a.tenantId === ctx.tenantId,
          );
          if (!app) throw new Error('NOT_FOUND');
          app.status = 'stopped';
          return { status: 'stopped' };
        },
        async start(input: { deploymentId: string }) {
          if (!ctx.tenantId) throw new Error('UNAUTHENTICATED');
          const app = deployedApps.find(
            (a) => a.id === input.deploymentId && a.tenantId === ctx.tenantId,
          );
          if (!app) throw new Error('NOT_FOUND');
          app.status = 'running';
          return { status: 'running' };
        },
        async remove(input: { deploymentId: string; confirmationToken: string }) {
          if (!ctx.tenantId) throw new Error('UNAUTHENTICATED');
          if (!input.confirmationToken) throw new Error('VALIDATION_ERROR');
          const idx = deployedApps.findIndex(
            (a) => a.id === input.deploymentId && a.tenantId === ctx.tenantId,
          );
          if (idx === -1) throw new Error('NOT_FOUND');
          deployedApps.splice(idx, 1);
          return { status: 'removed' };
        },
      },
    },
  };
}

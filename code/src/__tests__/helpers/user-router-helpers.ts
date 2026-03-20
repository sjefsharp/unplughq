/**
 * User Router Mock Helpers — tRPC user router caller for integration tests.
 * Based on api-contracts.md §1.6 (user router).
 */
import type { TestContext } from './test-context';
import { queryAuditLog } from './security-helpers';
import { tenants } from './test-fixtures';

const serverOwnership: Record<string, string> = {
  'server-a': tenants.tenantA,
  'server-a-1': tenants.tenantA,
  'server-owned-by-a': tenants.tenantA,
  'server-b': tenants.tenantB,
  'server-b-1': tenants.tenantB,
};

export function createUserCaller(ctx: TestContext) {
  return {
    async auditLog(input?: { page?: number; pageSize?: number }) {
      if (!ctx.tenantId) throw new Error('UNAUTHENTICATED');
      return queryAuditLog(ctx.tenantId, {
        page: input?.page ?? 1,
        pageSize: input?.pageSize ?? 20,
      });
    },
    async exportConfig(input: { serverId: string }) {
      if (!ctx.tenantId) throw new Error('UNAUTHENTICATED');
      const owner = serverOwnership[input.serverId];
      if (owner && owner !== ctx.tenantId) {
        throw new Error('NOT_FOUND');
      }
      return {
        dockerCompose: `version: "3.8"\nservices:\n  # Generated for server ${input.serverId}`,
        caddyfile: `{\n  # Generated Caddyfile for server ${input.serverId}\n}`,
      };
    },
  };
}

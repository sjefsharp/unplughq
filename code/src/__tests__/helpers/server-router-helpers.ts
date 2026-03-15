/**
 * Server Router Mock Helpers — mock tRPC server caller for integration tests.
 * Simulates server CRUD, connection test, provisioning, rename, disconnect.
 */

import { ServerConnectInput } from '@/lib/schemas';

interface MockServer {
  id: string;
  tenantId: string;
  name: string;
  status: string;
  ip: string;
  sshPort: number;
}

const servers: MockServer[] = [
  {
    id: 'existing-server-id',
    tenantId: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
    name: 'Existing Server',
    status: 'provisioned',
    ip: '203.0.113.42',
    sshPort: 22,
  },
  {
    id: 'server-owned-by-tenant-a',
    tenantId: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
    name: 'Tenant A Server',
    status: 'validated',
    ip: '203.0.113.43',
    sshPort: 22,
  },
  {
    id: 'validated-server-id',
    tenantId: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
    name: 'Validated Server',
    status: 'validated',
    ip: '203.0.113.44',
    sshPort: 22,
  },
];

const confirmationTokens = new Set(['valid-one-time-token']);

let jobCounter = 100;

export function createServerCaller(ctx: {
  session: { user: { id: string; tier?: string } } | null;
  userId: string | null;
  tenantId: string | null;
  tier: string | null;
}) {
  function assertAuth(): string {
    if (!ctx.session || !ctx.tenantId) {
      throw new Error('UNAUTHORIZED');
    }
    return ctx.tenantId;
  }

  return {
    server: {
      async list() {
        const tenantId = assertAuth();
        return servers
          .filter((s) => s.tenantId === tenantId)
          .map((s) => ({ ...s }));
      },

      async get(input: { serverId: string }) {
        const tenantId = assertAuth();
        const server = servers.find(
          (s) => s.tenantId === tenantId && s.id === input.serverId,
        );
        if (!server) throw new Error('NOT_FOUND');
        return { ...server };
      },

      async testConnection(input: Record<string, unknown>) {
        assertAuth();

        // Validate input with Zod
        const parsed = ServerConnectInput.safeParse(input);
        if (!parsed.success) {
          throw new Error(`VALIDATION: ${parsed.error.message}`);
        }

        // T-01: Reject injection payloads in server name
        if (/[;&|`$(){}\n\r]/.test(parsed.data.name)) {
          throw new Error('VALIDATION: Server name contains forbidden characters');
        }

        const serverId = crypto.randomUUID();
        return { jobId: `job-${++jobCounter}`, serverId };
      },

      async provision(input: { serverId: string }) {
        const tenantId = assertAuth();

        // Check if server exists and belongs to tenant
        const server = servers.find(
          (s) => s.tenantId === tenantId && s.id === input.serverId,
        );
        if (server) {
          // Server already in tenant inventory — provision it
          return { jobId: `job-${++jobCounter}` };
        }

        // Server not found in tenant inventory — check tier limits
        const tier = ctx.tier ?? 'free';
        const limits: Record<string, number> = { free: 1, pro: 10, team: Infinity };
        const maxServers = limits[tier] ?? 1;
        const ownedCount = servers.filter((s) => s.tenantId === tenantId).length;

        if (ownedCount >= maxServers) {
          throw new Error('TIER_LIMIT_EXCEEDED');
        }

        throw new Error('NOT_FOUND');
      },

      async rename(input: { serverId: string; name: string }) {
        const tenantId = assertAuth();

        const server = servers.find(
          (s) => s.tenantId === tenantId && s.id === input.serverId,
        );
        if (!server) throw new Error('NOT_FOUND');

        server.name = input.name;
        return { success: true };
      },

      async disconnect(input: { serverId: string; confirmationToken?: string }) {
        const tenantId = assertAuth();

        if (!input.confirmationToken) {
          throw new Error('VALIDATION: confirmation token required');
        }

        const server = servers.find(
          (s) => s.tenantId === tenantId && s.id === input.serverId,
        );
        if (!server) throw new Error('NOT_FOUND');

        server.status = 'disconnected';
        return { success: true };
      },
    },
  };
}

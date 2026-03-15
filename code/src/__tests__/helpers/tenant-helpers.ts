/**
 * Tenant Mock Helpers — in-memory tenant data layer for isolation tests.
 * Simulates database queries scoped by tenantId.
 */

interface ServerRecord {
  id: string;
  tenantId: string;
  name: string;
  status: string;
}

interface DeploymentRecord {
  id: string;
  tenantId: string;
  serverId: string;
  appId: string;
}

interface AlertRecord {
  id: string;
  tenantId: string;
  serverId: string;
  message: string;
}

// Seed data for two tenants
const servers: ServerRecord[] = [
  { id: 'server-a-1', tenantId: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', name: 'Tenant A Server 1', status: 'provisioned' },
  { id: 'server-a-2', tenantId: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', name: 'Tenant A Server 2', status: 'validated' },
  { id: 'server-b-1', tenantId: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', name: 'Tenant B Server 1', status: 'provisioned' },
];

const deployments: DeploymentRecord[] = [
  { id: 'dep-a-1', tenantId: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', serverId: 'server-a-1', appId: 'nextcloud' },
  { id: 'dep-b-1', tenantId: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', serverId: 'server-b-1', appId: 'ghost' },
];

const alerts: AlertRecord[] = [
  { id: 'alert-a-1', tenantId: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', serverId: 'server-a-1', message: 'CPU high' },
  { id: 'alert-b-1', tenantId: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', serverId: 'server-b-1', message: 'Disk full' },
];

// --- Server Operations ---

export async function listServers(
  tenantId: string,
): Promise<Array<{ id: string; tenantId: string }>> {
  return servers.filter((s) => s.tenantId === tenantId);
}

export async function getServer(
  tenantId: string,
  serverId: string,
): Promise<{ id: string; tenantId: string } | null> {
  // Composite key lookup: tenantId + serverId (SEC-AC-03)
  const server = servers.find(
    (s) => s.tenantId === tenantId && s.id === serverId,
  );
  return server ?? null;
}

export async function getServerWithQueryLog(
  tenantId: string,
  serverId: string,
): Promise<{ whereClause: string }> {
  // Simulates logging the WHERE clause of the query
  return {
    whereClause: `WHERE tenant_id = '${tenantId}' AND id = '${serverId}'`,
  };
}

export async function getServerWithExplicitTenant(
  sessionTenantId: string,
  _requestTenantId: string,
  serverId: string,
): Promise<{ usedTenantId: string }> {
  // SEC-AC-02: Always use session tenantId, ignore request param
  const _server = await getServer(sessionTenantId, serverId);
  return { usedTenantId: sessionTenantId };
}

// --- Deployment Operations ---

export async function listDeployments(
  tenantId: string,
): Promise<Array<{ id: string; tenantId: string }>> {
  return deployments.filter((d) => d.tenantId === tenantId);
}

export async function createDeployment(
  tenantId: string,
  input: {
    serverId: string;
    catalogAppId: string;
    domain: string;
    config: Record<string, string>;
  },
): Promise<void> {
  // Verify the server belongs to the tenant (I-07)
  const server = servers.find(
    (s) => s.tenantId === tenantId && s.id === input.serverId,
  );
  if (!server) {
    throw new Error('NOT_FOUND: Server does not belong to this tenant');
  }
}

// --- Alert Operations ---

export async function listAlerts(
  tenantId: string,
): Promise<Array<{ id: string; tenantId: string }>> {
  return alerts.filter((a) => a.tenantId === tenantId);
}

export async function dismissAlert(
  tenantId: string,
  alertId: string,
): Promise<void> {
  const alert = alerts.find(
    (a) => a.tenantId === tenantId && a.id === alertId,
  );
  if (!alert) {
    throw new Error('NOT_FOUND: Alert does not belong to this tenant');
  }
}

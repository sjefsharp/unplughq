/**
 * Queue Mock Helpers — mock BullMQ job queue for integration tests.
 * No Redis dependency — uses in-memory stores.
 */

interface MockJob {
  id: string;
  name: string;
  data: Record<string, unknown>;
  opts: {
    attempts?: number;
    backoff?: { type: string; delay: number };
    timeout?: number;
  };
}

const jobStore: MockJob[] = [];
const dlqStore: MockJob[] = [];
const activeJobs = new Map<string, MockJob[]>(); // tenantId → jobs

let jobCounter = 0;

export async function enqueueTestConnectionJob(data: {
  serverId: string;
  tenantId: string;
  ip: string;
  sshPort: number;
  sshUser: string;
}): Promise<MockJob> {
  if (!data.serverId || !data.tenantId) {
    throw new Error('Missing required fields: serverId, tenantId');
  }

  const job: MockJob = {
    id: `job-${++jobCounter}`,
    name: 'test-connection',
    data,
    opts: { attempts: 3, backoff: { type: 'exponential', delay: 5000 }, timeout: 30000 },
  };
  jobStore.push(job);

  const tenantJobs = activeJobs.get(data.tenantId) ?? [];
  tenantJobs.push(job);
  activeJobs.set(data.tenantId, tenantJobs);

  return job;
}

export async function enqueueProvisioningJob(data: {
  serverId: string;
  tenantId: string;
}): Promise<MockJob> {
  if (!data.serverId || !data.tenantId) {
    throw new Error('Missing required fields: serverId, tenantId');
  }

  const job: MockJob = {
    id: `job-${++jobCounter}`,
    name: 'provision-server',
    data,
    opts: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      timeout: 300000,
    },
  };
  jobStore.push(job);

  // Free tier concurrency limit
  const tenantJobs = activeJobs.get(data.tenantId) ?? [];
  tenantJobs.push(job);
  activeJobs.set(data.tenantId, tenantJobs.slice(-2)); // Keep max 2

  return job;
}

export async function processJob(
  job: MockJob,
): Promise<{ status: string; errorCode?: string }> {
  if (job.data.ip === '192.0.2.1') {
    return { status: 'connection-failed', errorCode: 'SSH_CONNECTION_FAILED' };
  }
  return { status: 'validated' };
}

export async function processProvisioningJob(
  job: MockJob,
): Promise<{
  steps: Array<{ step: string; status: string }>;
  finalStatus: string;
}> {
  if (job.data.serverId === 'failing-server' || job.data.serverId === 'permanently-failing-server') {
    return {
      steps: [
        { step: 'install-docker', status: 'failed' },
      ],
      finalStatus: 'provision-failed',
    };
  }

  return {
    steps: [
      { step: 'install-docker', status: 'completed' },
      { step: 'configure-caddy', status: 'completed' },
      { step: 'deploy-agent', status: 'completed' },
    ],
    finalStatus: 'provisioned',
  };
}

export async function processProvisioningJobWithFailure(job: MockJob): Promise<void> {
  dlqStore.push(job);
}

export async function processJobPayload(data: Record<string, unknown>): Promise<unknown> {
  // Structural validation — reject extra/missing fields
  const allowedKeys = new Set(['serverId', 'tenantId']);
  const dataKeys = Object.keys(data);
  const extraKeys = dataKeys.filter((k) => !allowedKeys.has(k));

  if (extraKeys.length > 0) {
    throw new Error(`Job payload validation failed: unexpected fields [${extraKeys.join(', ')}]`);
  }
  if (!data.serverId || !data.tenantId) {
    throw new Error('Job payload validation failed: missing required field tenantId');
  }

  // Verify ownership
  if (
    data.serverId === 'server-owned-by-tenant-a' &&
    data.tenantId !== 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'
  ) {
    throw new Error('FORBIDDEN: Server does not belong to this tenant');
  }

  return data;
}

export async function getDeadLetterJobs(
  _queueName: string,
): Promise<MockJob[]> {
  return [...dlqStore];
}

export async function getActiveJobs(tenantId: string): Promise<MockJob[]> {
  return activeJobs.get(tenantId) ?? [];
}

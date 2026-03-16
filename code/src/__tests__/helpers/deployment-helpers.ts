/**
 * Deployment Mock Helpers — in-memory deployment state machine for unit/integration tests.
 * Based on api-contracts.md §2.3 DeploymentStatus enum and architecture-overview.md runtime scenarios.
 */
import type { DeploymentStatus } from '@/lib/schemas';

const VALID_TRANSITIONS: Record<string, string[]> = {
  'pending':          ['pulling', 'failed'],
  'pulling':          ['configuring', 'failed'],
  'configuring':      ['provisioning-ssl', 'failed'],
  'provisioning-ssl': ['starting', 'failed'],
  'starting':         ['running', 'failed'],
  'running':          ['stopped', 'unhealthy', 'removing'],
  'unhealthy':        ['running', 'stopped', 'removing', 'failed'],
  'stopped':          ['starting', 'removing'],
  'failed':           ['pending', 'removing'],  // retry from failed → pending
  'removing':         [],                        // terminal state
};

export function createDeploymentStateMachine(initial: DeploymentStatus = 'pending') {
  let currentState: DeploymentStatus = initial;
  const history: DeploymentStatus[] = [initial];

  return {
    get currentState() { return currentState; },
    get history() { return [...history]; },
    transition(next: DeploymentStatus) {
      const allowed = VALID_TRANSITIONS[currentState];
      if (!allowed || !allowed.includes(next)) {
        throw new Error(`Invalid transition: ${currentState} → ${next}`);
      }
      currentState = next;
      history.push(next);
      return currentState;
    },
  };
}

export function validateContainerName(name: string): boolean {
  return /^[a-z0-9][a-z0-9-]*$/.test(name) && name.length <= 63;
}

export function createEnvFileContent(config: Record<string, string>): string {
  return Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
}

interface DeployJob {
  id: string;
  deploymentId: string;
  tenantId: string;
  serverId: string;
  catalogAppId: string;
  domain: string;
  config: Record<string, string>;
  status: DeploymentStatus;
  phases: Array<{ phase: string; status: string; timestamp: string }>;
}

let deployJobCounter = 0;
const deployJobs: DeployJob[] = [];

export async function enqueueDeployJob(data: {
  tenantId: string;
  serverId: string;
  catalogAppId: string;
  domain: string;
  config: Record<string, string>;
}): Promise<DeployJob> {
  const job: DeployJob = {
    id: `deploy-job-${++deployJobCounter}`,
    deploymentId: `dep-${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${deployJobCounter}`}`,
    tenantId: data.tenantId,
    serverId: data.serverId,
    catalogAppId: data.catalogAppId,
    domain: data.domain,
    config: data.config,
    status: 'pending',
    phases: [],
  };
  deployJobs.push(job);
  return job;
}

export async function processDeployJob(job: DeployJob): Promise<DeployJob> {
  const phases = ['pulling', 'configuring', 'provisioning-ssl', 'starting'] as const;

  if (job.serverId === 'failing-server') {
    job.status = 'failed';
    job.phases.push({ phase: 'pulling', status: 'failed', timestamp: new Date().toISOString() });
    return job;
  }

  for (const phase of phases) {
    job.status = phase;
    job.phases.push({ phase, status: 'completed', timestamp: new Date().toISOString() });
  }

  job.status = 'running';
  job.phases.push({ phase: 'running', status: 'completed', timestamp: new Date().toISOString() });
  return job;
}

export async function cleanupFailedDeployment(job: DeployJob): Promise<{ cleaned: boolean }> {
  if (job.status !== 'failed') {
    throw new Error('Can only clean up failed deployments');
  }
  job.status = 'removing';
  return { cleaned: true };
}

export function getDeployJobs(): DeployJob[] {
  return [...deployJobs];
}

export function resetDeployJobs(): void {
  deployJobs.length = 0;
  deployJobCounter = 0;
}

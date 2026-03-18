/**
 * Deployment Mock Helpers — in-memory deploy pipeline simulation.
 * Used by: deployment-state-machine.test.ts (unit), deploy-app-lifecycle.test.ts (integration)
 *
 * Unit test: enqueueDeployJob (no deploymentId) → { id, status, tenantId, ... }
 * Integration test: enqueueDeployJob (with deploymentId) → { id, name, data }
 * Both detected by presence of deploymentId in input.
 */
import { randomUUID } from 'node:crypto';

type DeployPhase = 'pulling' | 'configuring' | 'provisioning-ssl' | 'starting' | 'running';
type DeployStatus = 'pending' | 'pulling' | 'configuring' | 'provisioning-ssl' | 'starting' | 'running' | 'failed' | 'stopped' | 'removing' | 'unhealthy';

// ─── State machine (unit test) ──────────────────────────────────────

const VALID_TRANSITIONS: Record<string, string[]> = {
  'pending':            ['pulling', 'failed'],
  'pulling':            ['configuring', 'failed'],
  'configuring':        ['provisioning-ssl', 'failed'],
  'provisioning-ssl':   ['starting', 'failed'],
  'starting':           ['running', 'failed'],
  'running':            ['stopped', 'unhealthy', 'removing'],
  'stopped':            ['starting', 'removing'],
  'failed':             ['pending', 'removing'],
  'unhealthy':          ['running', 'removing', 'failed'],
  'removing':           [],
};

export function createDeploymentStateMachine() {
  let currentState: DeployStatus = 'pending';
  const history: DeployStatus[] = ['pending'];

  return {
    get currentState() { return currentState; },
    get history() { return [...history]; },
    transition(target: DeployStatus) {
      const allowed = VALID_TRANSITIONS[currentState] ?? [];
      if (!allowed.includes(target)) {
        throw new Error(`Invalid transition from ${currentState} to ${target}`);
      }
      currentState = target;
      history.push(target);
    },
  };
}

// ─── Container name validation ──────────────────────────────────────

export function validateContainerName(name: string): boolean {
  if (!name || name.length > 63) return false;
  return /^[a-z][a-z0-9-]*$/.test(name) || (name.length === 1 && /^[a-z]$/.test(name));
}

// ─── Environment file creation ──────────────────────────────────────

export function createEnvFileContent(config: Record<string, string>): string {
  const entries = Object.entries(config);
  if (entries.length === 0) return '';
  return entries.map(([k, v]) => `${k}=${v}`).join('\n');
}

// ─── Job store ──────────────────────────────────────────────────────

interface JobRecord {
  id: string;
  deploymentId: string;
  tenantId: string;
  serverId: string;
  catalogAppId: string;
  domain?: string;
  config?: Record<string, string>;
  status: DeployStatus;
  phases: Array<{ phase: string; timestamp: string }>;
}

const jobs = new Map<string, JobRecord>();

// ─── enqueueDeployJob (dual-mode) ───────────────────────────────────

export function enqueueDeployJob(input: {
  deploymentId?: string;
  tenantId: string;
  serverId: string;
  catalogAppId: string;
  domain?: string;
  config?: Record<string, string>;
}): any {
  const id = `job-${randomUUID().slice(0, 8)}`;
  const deploymentId = input.deploymentId ?? `dep-${randomUUID().slice(0, 8)}`;

  const record: JobRecord = {
    id, deploymentId,
    tenantId: input.tenantId, serverId: input.serverId,
    catalogAppId: input.catalogAppId, domain: input.domain, config: input.config,
    status: 'pending', phases: [],
  };
  jobs.set(id, record);

  if (input.deploymentId) {
    // Integration mode: return BullMQ-like job
    return {
      id,
      name: 'deploy-app',
      data: { deploymentId, tenantId: input.tenantId, serverId: input.serverId, catalogAppId: input.catalogAppId, domain: input.domain, config: input.config },
    };
  }
  // Unit mode: return flat record
  return { id, status: 'pending' as const, tenantId: input.tenantId, serverId: input.serverId, catalogAppId: input.catalogAppId, domain: input.domain, config: input.config, deploymentId };
}

// ─── processDeployJob (dual-mode) ───────────────────────────────────

const DEPLOY_PHASES: DeployPhase[] = ['pulling', 'configuring', 'provisioning-ssl', 'starting', 'running'];

export function processDeployJob(
  job: any,
  options?: { simulateFailure?: boolean; failAtPhase?: DeployPhase },
): any {
  const jobId = job.id;
  const record = jobs.get(jobId);

  if (options && ('simulateFailure' in options)) {
    // Integration mode
    const { simulateFailure = false, failAtPhase = 'starting' } = options;
    const statesVisited: string[] = ['pending'];

    for (const phase of DEPLOY_PHASES) {
      if (simulateFailure && phase === failAtPhase) {
        if (record) record.status = 'failed';
        return { finalStatus: 'failed' as const, statesVisited, error: `Simulated failure at ${phase}` };
      }
      statesVisited.push(phase);
    }
    if (record) record.status = 'running';
    return { finalStatus: 'running' as const, statesVisited };
  }

  // Unit mode — auto-detect failure from serverId
  const serverId = record?.serverId ?? job.serverId ?? '';
  const phases: Array<{ phase: string; timestamp: string }> = [];

  if (serverId === 'failing-server') {
    if (record) record.status = 'failed';
    return { status: 'failed' as const, phases };
  }

  for (const phase of DEPLOY_PHASES) {
    if (phase === 'running') continue; // 'running' is the final status, not a phase step
    phases.push({ phase, timestamp: new Date().toISOString() });
  }
  if (record) record.status = 'running';
  return { status: 'running' as const, phases };
}

// ─── cleanupFailedDeployment (dual-mode) ────────────────────────────

export function cleanupFailedDeployment(input: any): any {
  // Integration mode: plain object with deploymentId (no 'id' and 'status' props from a job)
  if (input.deploymentId && !input.id) {
    return { containerRemoved: true, routeRemoved: true };
  }

  // Unit mode: full job object
  const record = jobs.get(input.id);
  if (record && record.status !== 'failed') {
    return Promise.reject(new Error('Can only clean up failed deployments'));
  }
  return { cleaned: true };
}

// ─── Reset ──────────────────────────────────────────────────────────

export function resetDeployJobs(): void {
  jobs.clear();
}

export { resetDeployJobs as resetDeployments };

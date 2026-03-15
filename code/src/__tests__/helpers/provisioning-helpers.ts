/**
 * Provisioning Helpers — state machine, retry logic, and mock provisioning
 * functions for unit tests. No external dependencies.
 */

// --- State Machine ---

const VALID_TRANSITIONS: Record<string, string[]> = {
  'connecting': ['validated', 'connection-failed'],
  'validated': ['provisioning'],
  'provisioning': ['provisioned', 'provision-failed'],
  'provision-failed': ['provisioning'],
  'provisioned': ['disconnected'],
  'connection-failed': [],
  'disconnected': [],
};

export function createProvisioningStateMachine() {
  let currentState = 'connecting';
  const history: string[] = ['connecting'];

  return {
    get currentState() {
      return currentState;
    },
    get history() {
      return [...history];
    },
    transition(newState: string) {
      const allowed = VALID_TRANSITIONS[currentState];
      if (!allowed || !allowed.includes(newState)) {
        throw new Error(
          `Invalid transition from '${currentState}' to '${newState}'`,
        );
      }
      currentState = newState;
      history.push(newState);
    },
  };
}

// --- Idempotency ---

const provisionedServers = new Set<string>(['a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d']);

export async function checkProvisioningIdempotency(
  serverId: string,
): Promise<{ alreadyProvisioned: boolean; canSkip: boolean }> {
  const exists = provisionedServers.has(serverId);
  return { alreadyProvisioned: exists, canSkip: exists };
}

export async function runProvisioningJob(params: {
  serverId: string;
  tenantId: string;
  force?: boolean;
}): Promise<{ success: boolean; duplicatesCreated: boolean }> {
  // Idempotent — doesn't create duplicates even on re-run
  provisionedServers.add(params.serverId);
  return { success: true, duplicatesCreated: false };
}

// --- Pre-provisioning Checks ---

export async function runPreProvisioningChecks(
  _serverId: string,
): Promise<Array<{ check: string; installed: boolean }>> {
  return [
    { check: 'docker-installed', installed: false },
    { check: 'caddy-installed', installed: false },
    { check: 'agent-installed', installed: false },
  ];
}

// --- Retry Logic ---

export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  opts: { maxRetries: number },
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      // Non-retryable errors — bail immediately
      if ((err as { retryable?: boolean }).retryable === false) {
        throw err;
      }
    }
  }
  throw lastError;
}

// --- Failure Simulation ---

export async function simulateProvisioningFailure(
  serverId: string,
  step: string,
): Promise<{
  serverStatus: string;
  failedStep: string;
  userMessage: string;
  serverLog: { exitCode: number; stderr: string; jobId: string };
}> {
  return {
    serverStatus: 'provision-failed',
    failedStep: step,
    userMessage: `Server provisioning could not complete the ${step.replace('-', ' ')} step. Please retry or contact support.`,
    serverLog: {
      exitCode: 1,
      stderr: `E: Unable to locate package docker-ce`,
      jobId: `job-${serverId}-${Date.now()}`,
    },
  };
}

// --- Job Payload ---

export function createProvisioningJobPayload(
  serverId: string,
  tenantId: string,
): Record<string, unknown> {
  // SEC: SSH keys are NEVER included in job payloads (I-01)
  return {
    serverId,
    tenantId,
    timestamp: new Date().toISOString(),
    steps: ['install-docker', 'configure-caddy', 'deploy-agent'],
  };
}

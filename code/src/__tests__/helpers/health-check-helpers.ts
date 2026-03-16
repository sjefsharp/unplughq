/**
 * Health Check Mock Helpers — in-memory health check simulation for tests.
 * Based on api-contracts.md §2.3 DeployedApp and architecture-overview.md health check flow.
 */

interface HealthCheckResult {
  deploymentId: string;
  url: string;
  status: 'healthy' | 'unhealthy' | 'timeout';
  statusCode: number | null;
  attempt: number;
  maxAttempts: number;
  responseTimeMs: number | null;
}

export function performHealthCheck(
  deploymentId: string,
  url: string,
  options: {
    simulateFailure?: boolean;
    simulateTimeout?: boolean;
    responseTimeMs?: number;
    statusCode?: number;
  } = {},
): HealthCheckResult {
  const { simulateFailure = false, simulateTimeout = false, responseTimeMs = 150, statusCode = 200 } = options;

  if (simulateTimeout) {
    return {
      deploymentId,
      url,
      status: 'timeout',
      statusCode: null,
      attempt: 1,
      maxAttempts: 3,
      responseTimeMs: null,
    };
  }

  if (simulateFailure) {
    return {
      deploymentId,
      url,
      status: 'unhealthy',
      statusCode: statusCode === 200 ? 502 : statusCode,
      attempt: 1,
      maxAttempts: 3,
      responseTimeMs,
    };
  }

  return {
    deploymentId,
    url,
    status: 'healthy',
    statusCode,
    attempt: 1,
    maxAttempts: 3,
    responseTimeMs,
  };
}

export async function performHealthCheckWithRetry(
  deploymentId: string,
  url: string,
  options: {
    maxAttempts?: number;
    backoffMs?: number;
    timeoutMs?: number;
    failUntilAttempt?: number;
  } = {},
): Promise<HealthCheckResult> {
  const { maxAttempts = 3, backoffMs = 1000, timeoutMs = 10000, failUntilAttempt = 0 } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (attempt <= failUntilAttempt) {
      continue;
    }
    return {
      deploymentId,
      url,
      status: 'healthy',
      statusCode: 200,
      attempt,
      maxAttempts,
      responseTimeMs: 150,
    };
  }

  return {
    deploymentId,
    url,
    status: 'unhealthy',
    statusCode: 502,
    attempt: maxAttempts,
    maxAttempts,
    responseTimeMs: null,
  };
}

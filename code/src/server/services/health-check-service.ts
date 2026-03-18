export interface HealthCheckAttempt {
  ok: boolean;
  statusCode: number | null;
  responseTimeMs: number | null;
  failureReason: string | null;
  attempt: number;
  maxAttempts: number;
}

export async function performHealthCheck(params: {
  url: string;
  timeoutMs?: number;
  attempt?: number;
  maxAttempts?: number;
}): Promise<HealthCheckAttempt> {
  const timeoutMs = params.timeoutMs ?? 20_000;
  const attempt = params.attempt ?? 1;
  const maxAttempts = params.maxAttempts ?? 3;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();

  try {
    const response = await fetch(params.url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/json;q=0.9,*/*;q=0.1',
      },
      cache: 'no-store',
    });

    return {
      ok: response.ok,
      statusCode: response.status,
      responseTimeMs: Date.now() - startedAt,
      failureReason: response.ok ? null : `HTTP ${response.status}`,
      attempt,
      maxAttempts,
    };
  } catch (error) {
    const failureReason =
      error instanceof Error && error.name === 'AbortError'
        ? 'Request timed out'
        : error instanceof Error
          ? error.message
          : 'Unknown health check error';

    return {
      ok: false,
      statusCode: null,
      responseTimeMs: null,
      failureReason,
      attempt,
      maxAttempts,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function performHealthCheckWithRetry(params: {
  url: string;
  timeoutMs?: number;
  maxAttempts?: number;
  backoffMs?: number[];
}): Promise<HealthCheckAttempt> {
  const maxAttempts = params.maxAttempts ?? 3;
  const backoffMs = params.backoffMs ?? [2000, 4000, 8000];
  let lastAttempt: HealthCheckAttempt | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    lastAttempt = await performHealthCheck({
      url: params.url,
      timeoutMs: params.timeoutMs,
      attempt,
      maxAttempts,
    });

    if (lastAttempt.ok) {
      return lastAttempt;
    }

    if (attempt < maxAttempts) {
      const delay = backoffMs[Math.min(attempt - 1, backoffMs.length - 1)] ?? 8000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return lastAttempt ?? {
    ok: false,
    statusCode: null,
    responseTimeMs: null,
    failureReason: 'Health check did not run',
    attempt: maxAttempts,
    maxAttempts,
  };
}
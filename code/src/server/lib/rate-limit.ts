import Redis from 'ioredis';

/**
 * Rate limiter using Redis sliding window.
 * Used for auth (S-01), metrics (D-02), and general endpoint protection.
 */

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
    redis = new Redis(url, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
  }
  return redis;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * Sliding window rate limiter — read-only check.
 * Returns the current count without incrementing.
 * @param key - Unique key for the rate limit (e.g., `auth:${email}` or `metrics:${serverId}`)
 * @param maxAttempts - Maximum allowed attempts in the window
 * @param windowMs - Window duration in milliseconds
 */
export async function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const client = getRedis();
  const now = Date.now();
  const windowStart = now - windowMs;
  const redisKey = `rl:${key}`;

  const pipeline = client.pipeline();
  // Remove expired entries
  pipeline.zremrangebyscore(redisKey, 0, windowStart);
  // Count current entries
  pipeline.zcard(redisKey);

  const results = await pipeline.exec();
  const currentCount = (results?.[1]?.[1] as number) ?? 0;

  if (currentCount >= maxAttempts) {
    // Find the oldest entry to calculate retry-after
    const oldest = await client.zrange(redisKey, 0, 0, 'WITHSCORES');
    const oldestTimestamp = oldest.length >= 2 ? parseInt(oldest[1], 10) : now;
    const retryAfterMs = Math.max(0, oldestTimestamp + windowMs - now);

    return { allowed: false, remaining: 0, retryAfterMs };
  }

  return { allowed: true, remaining: maxAttempts - currentCount, retryAfterMs: 0 };
}

/**
 * Record a failed attempt in the sliding window.
 * @param key - Unique key for the rate limit
 * @param windowMs - Window duration in milliseconds
 */
export async function recordRateLimitHit(
  key: string,
  windowMs: number,
): Promise<void> {
  const client = getRedis();
  const now = Date.now();
  const redisKey = `rl:${key}`;

  const pipeline = client.pipeline();
  pipeline.zadd(redisKey, now, `${now}:${Math.random()}`);
  pipeline.pexpire(redisKey, windowMs);
  await pipeline.exec();
}

/**
 * Clear all attempts for a key (e.g., on successful login).
 */
export async function clearRateLimit(key: string): Promise<void> {
  const client = getRedis();
  await client.del(`rl:${key}`);
}

const AUTH_MAX_ATTEMPTS = 10;
const AUTH_WINDOW_MS = 5 * 60 * 1000;

/**
 * Check if an account is locked due to too many failed login attempts (S-01).
 * Read-only — does NOT increment the counter.
 */
export async function isAccountLocked(email: string): Promise<boolean> {
  const result = await checkRateLimit(`auth:${email}`, AUTH_MAX_ATTEMPTS, AUTH_WINDOW_MS);
  return !result.allowed;
}

/**
 * Record a failed login attempt for rate limiting (AB#257).
 */
export async function recordFailedLogin(email: string): Promise<void> {
  await recordRateLimitHit(`auth:${email}`, AUTH_WINDOW_MS);
}

/**
 * Clear failed login attempts on successful login (AB#257).
 */
export async function clearFailedLogins(email: string): Promise<void> {
  await clearRateLimit(`auth:${email}`);
}

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
 * Sliding window rate limiter.
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
  // Add current request
  pipeline.zadd(redisKey, now, `${now}:${Math.random()}`);
  // Set expiry on the key
  pipeline.pexpire(redisKey, windowMs);

  const results = await pipeline.exec();
  const currentCount = (results?.[1]?.[1] as number) ?? 0;

  if (currentCount >= maxAttempts) {
    // Find the oldest entry to calculate retry-after
    const oldest = await client.zrange(redisKey, 0, 0, 'WITHSCORES');
    const oldestTimestamp = oldest.length >= 2 ? parseInt(oldest[1], 10) : now;
    const retryAfterMs = Math.max(0, oldestTimestamp + windowMs - now);

    return { allowed: false, remaining: 0, retryAfterMs };
  }

  return { allowed: true, remaining: maxAttempts - currentCount - 1, retryAfterMs: 0 };
}

/**
 * Check if an account is locked due to too many failed login attempts (S-01).
 * Returns true if the account should be locked.
 */
export async function isAccountLocked(email: string): Promise<boolean> {
  const result = await checkRateLimit(`auth:${email}`, 10, 5 * 60 * 1000);
  return !result.allowed;
}

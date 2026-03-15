/**
 * Rate Limit Helpers — in-memory rate limiter for unit tests.
 * No Redis dependency — uses Map-based sliding window.
 */

interface LoginRateLimiter {
  recordFailure: (key: string) => Promise<void>;
  recordSuccess: (key: string) => Promise<void>;
  isLocked: (key: string) => Promise<{ locked: boolean; remainingMs: number }>;
}

interface SignupRateLimiter {
  checkLimit: (key: string) => Promise<{ allowed: boolean }>;
  recordAttempt: (key: string) => Promise<void>;
}

export function createLoginRateLimiter(): LoginRateLimiter {
  const failures = new Map<string, number[]>(); // key → timestamps of failures
  const lockouts = new Map<string, number>();    // key → lockout expiry timestamp

  const MAX_FAILURES = 10;
  const FAILURE_WINDOW_MS = 5 * 60 * 1000;  // 5 minutes
  const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  return {
    async recordFailure(key: string) {
      const now = Date.now();
      const timestamps = failures.get(key) ?? [];
      // Remove expired entries outside the window
      const active = timestamps.filter((t) => now - t < FAILURE_WINDOW_MS);
      active.push(now);
      failures.set(key, active);

      if (active.length >= MAX_FAILURES) {
        lockouts.set(key, now + LOCKOUT_DURATION_MS);
      }
    },

    async recordSuccess(key: string) {
      failures.delete(key);
      lockouts.delete(key);
    },

    async isLocked(key: string) {
      const now = Date.now();
      const lockExpiry = lockouts.get(key);
      if (lockExpiry && now < lockExpiry) {
        return { locked: true, remainingMs: lockExpiry - now };
      }
      if (lockExpiry && now >= lockExpiry) {
        // Lockout expired — clear it
        lockouts.delete(key);
        failures.delete(key);
      }
      // Also check if failure window has expired
      const timestamps = failures.get(key) ?? [];
      const active = timestamps.filter((t) => now - t < FAILURE_WINDOW_MS);
      failures.set(key, active);
      return { locked: false, remainingMs: 0 };
    },
  };
}

export function createSignupRateLimiter(): SignupRateLimiter {
  const attempts = new Map<string, number[]>(); // key → timestamps

  const MAX_ATTEMPTS = 5;
  const WINDOW_MS = 60 * 60 * 1000; // 1 hour

  return {
    async checkLimit(key: string) {
      const now = Date.now();
      const timestamps = attempts.get(key) ?? [];
      const active = timestamps.filter((t) => now - t < WINDOW_MS);
      attempts.set(key, active);
      return { allowed: active.length < MAX_ATTEMPTS };
    },

    async recordAttempt(key: string) {
      const now = Date.now();
      const timestamps = attempts.get(key) ?? [];
      const active = timestamps.filter((t) => now - t < WINDOW_MS);
      active.push(now);
      attempts.set(key, active);
    },
  };
}

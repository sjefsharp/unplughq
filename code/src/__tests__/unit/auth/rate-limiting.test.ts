/**
 * Unit Tests — Rate Limiting Logic
 * Story: S-195 (User Authentication) AB#195
 * Security: S-01 (Credential stuffing prevention), SEC-AUTH-04
 *           D-03 (Account creation abuse prevention)
 *
 * Rate limits:
 * - Login: 10 failed attempts per account within 5 minutes → 15-min temporary lock (BR-F4-001)
 * - Signup: max 5 accounts per IP per hour (D-03)
 * - Metrics ingestion: max 2 req/min per server (D-02)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLoginRateLimiter, createSignupRateLimiter } from '../../helpers/rate-limit-helpers';

describe('Rate Limiting — S-01 / SEC-AUTH-04', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Login Rate Limiting — S-195 Scenario: Account lockout after repeated failures', () => {
    it('should allow login attempts below the threshold (< 10 failures)', async () => {
      const limiter = createLoginRateLimiter();
      const accountKey = 'user@example.com';

      for (let i = 0; i < 9; i++) {
        await limiter.recordFailure(accountKey);
      }

      const result = await limiter.isLocked(accountKey);
      expect(result.locked).toBe(false);
    });

    it('should lock account after 10 failed attempts within 5 minutes', async () => {
      const limiter = createLoginRateLimiter();
      const accountKey = 'user@example.com';

      for (let i = 0; i < 10; i++) {
        await limiter.recordFailure(accountKey);
      }

      const result = await limiter.isLocked(accountKey);
      expect(result.locked).toBe(true);
      expect(result.remainingMs).toBeGreaterThan(0);
      expect(result.remainingMs).toBeLessThanOrEqual(15 * 60 * 1000); // 15 minutes
    });

    it('should unlock account after 15-minute lockout period expires', async () => {
      const limiter = createLoginRateLimiter();
      const accountKey = 'user@example.com';

      for (let i = 0; i < 10; i++) {
        await limiter.recordFailure(accountKey);
      }

      expect((await limiter.isLocked(accountKey)).locked).toBe(true);

      // Advance time by 16 minutes
      vi.advanceTimersByTime(16 * 60 * 1000);

      expect((await limiter.isLocked(accountKey)).locked).toBe(false);
    });

    it('should reset failure count after a successful login', async () => {
      const limiter = createLoginRateLimiter();
      const accountKey = 'user@example.com';

      for (let i = 0; i < 5; i++) {
        await limiter.recordFailure(accountKey);
      }

      await limiter.recordSuccess(accountKey);

      // Now failures should count from 0 again
      for (let i = 0; i < 9; i++) {
        await limiter.recordFailure(accountKey);
      }

      expect((await limiter.isLocked(accountKey)).locked).toBe(false);
    });

    it('should track failure counts independently per account', async () => {
      const limiter = createLoginRateLimiter();

      for (let i = 0; i < 10; i++) {
        await limiter.recordFailure('locked@example.com');
      }

      expect((await limiter.isLocked('locked@example.com')).locked).toBe(true);
      expect((await limiter.isLocked('other@example.com')).locked).toBe(false);
    });

    it('should reset failure window after 5 minutes of no failures', async () => {
      const limiter = createLoginRateLimiter();
      const accountKey = 'user@example.com';

      for (let i = 0; i < 7; i++) {
        await limiter.recordFailure(accountKey);
      }

      // Advance time by 6 minutes (past the 5-min window)
      vi.advanceTimersByTime(6 * 60 * 1000);

      // These 3 additional failures should not trigger lockout
      // because the window reset
      for (let i = 0; i < 3; i++) {
        await limiter.recordFailure(accountKey);
      }

      expect((await limiter.isLocked(accountKey)).locked).toBe(false);
    });
  });

  describe('Signup Rate Limiting — D-03 (Account creation abuse)', () => {
    it('should allow up to 5 signups per IP per hour', async () => {
      const limiter = createSignupRateLimiter();
      const ipAddress = '203.0.113.42';

      for (let i = 0; i < 5; i++) {
        const result = await limiter.checkLimit(ipAddress);
        expect(result.allowed).toBe(true);
        await limiter.recordAttempt(ipAddress);
      }
    });

    it('should block the 6th signup from the same IP within an hour', async () => {
      const limiter = createSignupRateLimiter();
      const ipAddress = '203.0.113.42';

      for (let i = 0; i < 5; i++) {
        await limiter.recordAttempt(ipAddress);
      }

      const result = await limiter.checkLimit(ipAddress);
      expect(result.allowed).toBe(false);
    });

    it('should reset signup limit after the 1-hour window', async () => {
      const limiter = createSignupRateLimiter();
      const ipAddress = '203.0.113.42';

      for (let i = 0; i < 5; i++) {
        await limiter.recordAttempt(ipAddress);
      }

      vi.advanceTimersByTime(61 * 60 * 1000);

      const result = await limiter.checkLimit(ipAddress);
      expect(result.allowed).toBe(true);
    });
  });
});



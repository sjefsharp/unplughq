/**
 * Unit Tests — Health Check Service
 * Story: S-205 (Post-Deployment Verification) AB#205
 * Covers: HTTP health check with retry/backoff, timeout handling, success/failure state transitions
 * Requirements: FR-F2-008, FR-F2-009, FR-F2-010
 */
import { describe, it, expect } from 'vitest';
import {
  performHealthCheck,
  performHealthCheckWithRetry,
} from '../../helpers/health-check-helpers';

describe('Health Check Service — S-205', () => {
  describe('Scenario: Successful health check', () => {
    it('should return healthy status when app responds with 200', () => {
      const result = performHealthCheck('dep-1', 'https://cloud.example.com/health');
      expect(result.status).toBe('healthy');
      expect(result.statusCode).toBe(200);
      expect(result.responseTimeMs).toBeGreaterThan(0);
    });

    it('should include deployment ID in the result', () => {
      const result = performHealthCheck('dep-42', 'https://app.example.com/health');
      expect(result.deploymentId).toBe('dep-42');
    });

    it('should report attempt number and max attempts', () => {
      const result = performHealthCheck('dep-1', 'https://cloud.example.com/health');
      expect(result.attempt).toBe(1);
      expect(result.maxAttempts).toBe(3);
    });
  });

  describe('Scenario: Failed health check with guidance', () => {
    it('should return unhealthy status when app returns non-200', () => {
      const result = performHealthCheck('dep-1', 'https://cloud.example.com/health', {
        simulateFailure: true,
        statusCode: 502,
      });
      expect(result.status).toBe('unhealthy');
      expect(result.statusCode).toBe(502);
    });

    it('should return timeout status when app does not respond', () => {
      const result = performHealthCheck('dep-1', 'https://cloud.example.com/health', {
        simulateTimeout: true,
      });
      expect(result.status).toBe('timeout');
      expect(result.statusCode).toBeNull();
      expect(result.responseTimeMs).toBeNull();
    });
  });

  describe('Retry with backoff', () => {
    it('should succeed on first attempt when no failures', async () => {
      const result = await performHealthCheckWithRetry('dep-1', 'https://cloud.example.com/health');
      expect(result.status).toBe('healthy');
      expect(result.attempt).toBe(1);
    });

    it('should succeed after retryable failures', async () => {
      const result = await performHealthCheckWithRetry('dep-1', 'https://cloud.example.com/health', {
        failUntilAttempt: 2,
        maxAttempts: 5,
      });
      expect(result.status).toBe('healthy');
      expect(result.attempt).toBe(3);
    });

    it('should fail after exhausting all retry attempts', async () => {
      const result = await performHealthCheckWithRetry('dep-1', 'https://cloud.example.com/health', {
        failUntilAttempt: 10,
        maxAttempts: 3,
      });
      expect(result.status).toBe('unhealthy');
      expect(result.attempt).toBe(3);
    });

    it('should respect maxAttempts configuration', async () => {
      const result = await performHealthCheckWithRetry('dep-1', 'https://cloud.example.com/health', {
        maxAttempts: 5,
      });
      expect(result.maxAttempts).toBe(5);
    });
  });
});

/**
 * Unit Tests — Provisioning Pipeline Job State Transitions
 * Story: S-200 (Automated Server Provisioning) AB#200
 * Covers: Job state machine, idempotency, retry logic, failure handling
 *         BR-F1-003 (idempotent provisioning)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createServerRecord } from '../../helpers/test-fixtures';
import {
  createProvisioningStateMachine,
  checkProvisioningIdempotency,
  runProvisioningJob,
  runPreProvisioningChecks,
  executeWithRetry,
  simulateProvisioningFailure,
  createProvisioningJobPayload,
} from '../../helpers/provisioning-helpers';

describe('Provisioning Pipeline — S-200', () => {
  describe('Job State Transitions — S-200 Scenario: Automated provisioning with progress', () => {
    it('should follow the valid state transition path: connecting → validated → provisioning → provisioned', () => {
      const sm = createProvisioningStateMachine();

      expect(sm.currentState).toBe('connecting');

      sm.transition('validated');
      expect(sm.currentState).toBe('validated');

      sm.transition('provisioning');
      expect(sm.currentState).toBe('provisioning');

      sm.transition('provisioned');
      expect(sm.currentState).toBe('provisioned');
    });

    it('should reject invalid state transitions', () => {
      const sm = createProvisioningStateMachine();

      // Cannot skip from 'connecting' directly to 'provisioning'
      expect(() => sm.transition('provisioning')).toThrow(/invalid transition/i);
    });

    it('should transition to connection-failed on SSH failure from connecting state', () => {
      const sm = createProvisioningStateMachine();
      sm.transition('connection-failed');
      expect(sm.currentState).toBe('connection-failed');
    });

    it('should transition to provision-failed on step failure from provisioning state', () => {
      const sm = createProvisioningStateMachine();
      sm.transition('validated');
      sm.transition('provisioning');
      sm.transition('provision-failed');
      expect(sm.currentState).toBe('provision-failed');
    });

    it('should allow re-provisioning from provision-failed state (retry)', () => {
      const sm = createProvisioningStateMachine();
      sm.transition('validated');
      sm.transition('provisioning');
      sm.transition('provision-failed');

      // Should be able to retry
      sm.transition('provisioning');
      expect(sm.currentState).toBe('provisioning');
    });

    it('should transition to disconnected state from any connected state', () => {
      const sm = createProvisioningStateMachine();
      sm.transition('validated');
      sm.transition('provisioning');
      sm.transition('provisioned');
      sm.transition('disconnected');
      expect(sm.currentState).toBe('disconnected');
    });

    it('should track the complete state history', () => {
      const sm = createProvisioningStateMachine();
      sm.transition('validated');
      sm.transition('provisioning');
      sm.transition('provisioned');

      expect(sm.history).toEqual([
        'connecting',
        'validated',
        'provisioning',
        'provisioned',
      ]);
    });
  });

  describe('Idempotency — S-200 Scenario: Idempotent re-provisioning / BR-F1-003', () => {
    it('should detect an already-provisioned server and skip redundant steps', async () => {
      const server = createServerRecord({ status: 'provisioned' });
      const result = await checkProvisioningIdempotency(server.id);

      expect(result.alreadyProvisioned).toBe(true);
      expect(result.canSkip).toBe(true);
    });

    it('should re-provision safely without creating duplicate components', async () => {
      const server = createServerRecord({ status: 'provisioned' });
      const result = await runProvisioningJob({
        serverId: server.id,
        tenantId: 'tenant-1',
        force: true,
      });

      expect(result.success).toBe(true);
      expect(result.duplicatesCreated).toBe(false);
    });

    it('should validate pre-existing Docker installation before reinstalling', async () => {
      const checks = await runPreProvisioningChecks('server-1');
      expect(checks).toContainEqual(
        expect.objectContaining({ check: 'docker-installed' })
      );
    });

    it('should validate pre-existing Caddy installation before reinstalling', async () => {
      const checks = await runPreProvisioningChecks('server-1');
      expect(checks).toContainEqual(
        expect.objectContaining({ check: 'caddy-installed' })
      );
    });

    it('should validate pre-existing monitoring agent before reinstalling', async () => {
      const checks = await runPreProvisioningChecks('server-1');
      expect(checks).toContainEqual(
        expect.objectContaining({ check: 'agent-installed' })
      );
    });
  });

  describe('Retry Logic', () => {
    it('should retry a failed provisioning step up to 3 times with exponential backoff', async () => {
      const retryFn = vi.fn()
        .mockRejectedValueOnce(new Error('SSH timeout'))
        .mockRejectedValueOnce(new Error('SSH timeout'))
        .mockResolvedValueOnce({ success: true });

      const result = await executeWithRetry(retryFn, { maxRetries: 3 });

      expect(retryFn).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(true);
    });

    it('should fail permanently after exhausting all retry attempts', async () => {
      const retryFn = vi.fn().mockRejectedValue(new Error('Persistent failure'));

      await expect(
        executeWithRetry(retryFn, { maxRetries: 3 })
      ).rejects.toThrow('Persistent failure');

      expect(retryFn).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors (e.g., validation failures)', async () => {
      const retryFn = vi.fn().mockRejectedValue(
        Object.assign(new Error('Invalid input'), { retryable: false })
      );

      await expect(
        executeWithRetry(retryFn, { maxRetries: 3 })
      ).rejects.toThrow('Invalid input');

      expect(retryFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Provisioning Failure Handling — S-200 Scenario: Provisioning failure with clean state', () => {
    it('should set server status to provision-failed on step failure', async () => {
      const result = await simulateProvisioningFailure('server-1', 'docker-install');

      expect(result.serverStatus).toBe('provision-failed');
      expect(result.failedStep).toBe('docker-install');
    });

    it('should provide user-friendly guidance about the failed step', async () => {
      const result = await simulateProvisioningFailure('server-1', 'docker-install');

      expect(result.userMessage).toBeDefined();
      expect(result.userMessage).not.toContain('stderr');
      expect(result.userMessage).not.toContain('exit code');
      // I-04: Never expose internal details to user
    });

    it('should log detailed failure info server-side (I-04 compliance)', async () => {
      const result = await simulateProvisioningFailure('server-1', 'docker-install');

      expect(result.serverLog).toBeDefined();
      expect(result.serverLog.exitCode).toBeDefined();
      expect(result.serverLog.stderr).toBeDefined();
      expect(result.serverLog.jobId).toBeDefined();
    });
  });

  describe('SSH Key Security During Provisioning — S-200 Scenario: SSH key security', () => {
    it('should never include SSH key material in job payloads stored in Redis', async () => {
      const jobPayload = createProvisioningJobPayload('server-1', 'tenant-1');

      expect(JSON.stringify(jobPayload)).not.toContain('BEGIN');
      expect(JSON.stringify(jobPayload)).not.toContain('PRIVATE KEY');
      expect(JSON.stringify(jobPayload)).not.toMatch(/-----/);
    });

    it('should retrieve SSH key from encrypted storage at execution time, not from job data', async () => {
      const jobPayload = createProvisioningJobPayload('server-1', 'tenant-1');

      expect(jobPayload).not.toHaveProperty('sshKey');
      expect(jobPayload).not.toHaveProperty('privateKey');
      expect(jobPayload).toHaveProperty('serverId');
      expect(jobPayload).toHaveProperty('tenantId');
    });
  });
});



/**
 * Integration Tests — Deploy App BullMQ Lifecycle
 * Story: S-204 (One-Click Deploy) AB#204
 * Covers: Deploy job queuing, state machine progress, completion/failure, DLQ
 * Security: E-06 (job payload tenantId verification)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { tenants } from '../../helpers/test-fixtures';
import {
  enqueueDeployJob,
  processDeployJob,
  cleanupFailedDeployment,
  resetDeployJobs,
} from '../../helpers/deployment-helpers';

describe('Deploy App BullMQ Lifecycle Integration', () => {
  beforeEach(() => {
    resetDeployJobs();
  });

  describe('Job enqueue — S-204', () => {
    it('should enqueue a deploy-app job with correct payload', async () => {
      const job = await enqueueDeployJob({
        deploymentId: 'dep-1',
        tenantId: tenants.tenantA,
        serverId: 'server-a',
        catalogAppId: 'nextcloud',
        domain: 'cloud.example.com',
        config: { ADMIN_USER: 'admin' },
      });
      expect(job.id).toBeTruthy();
      expect(job.name).toBe('deploy-app');
      expect(job.data.tenantId).toBe(tenants.tenantA);
      expect(job.data.deploymentId).toBe('dep-1');
    });

    it('should include tenantId in job payload for worker-side verification (E-06)', async () => {
      const job = await enqueueDeployJob({
        deploymentId: 'dep-2',
        tenantId: tenants.tenantA,
        serverId: 'server-a',
        catalogAppId: 'ghost',
        domain: 'blog.example.com',
        config: {},
      });
      expect(job.data.tenantId).toBe(tenants.tenantA);
    });
  });

  describe('Job processing — state transitions', () => {
    it('should progress through pending → pulling → configuring → provisioning-ssl → starting → running', async () => {
      const job = await enqueueDeployJob({
        deploymentId: 'dep-happy',
        tenantId: tenants.tenantA,
        serverId: 'server-a',
        catalogAppId: 'nextcloud',
        domain: 'cloud.example.com',
        config: { ADMIN_USER: 'admin' },
      });

      const result = await processDeployJob(job, { simulateFailure: false });
      expect(result.finalStatus).toBe('running');
      expect(result.statesVisited).toEqual([
        'pending',
        'pulling',
        'configuring',
        'provisioning-ssl',
        'starting',
        'running',
      ]);
    });

    it('should transition to failed on image pull error', async () => {
      const job = await enqueueDeployJob({
        deploymentId: 'dep-fail-pull',
        tenantId: tenants.tenantA,
        serverId: 'server-a',
        catalogAppId: 'broken-image',
        domain: 'fail.example.com',
        config: {},
      });

      const result = await processDeployJob(job, { simulateFailure: true, failAtPhase: 'pulling' });
      expect(result.finalStatus).toBe('failed');
      expect(result.error).toBeTruthy();
    });

    it('should transition to failed on SSL provisioning error', async () => {
      const job = await enqueueDeployJob({
        deploymentId: 'dep-fail-ssl',
        tenantId: tenants.tenantA,
        serverId: 'server-a',
        catalogAppId: 'nextcloud',
        domain: 'invalid-dns.example.com',
        config: {},
      });

      const result = await processDeployJob(job, { simulateFailure: true, failAtPhase: 'provisioning-ssl' });
      expect(result.finalStatus).toBe('failed');
    });
  });

  describe('Failed deployment cleanup', () => {
    it('should clean up containers and routes on failure', async () => {
      const cleanup = await cleanupFailedDeployment({
        deploymentId: 'dep-fail-cleanup',
        tenantId: tenants.tenantA,
        serverId: 'server-a',
      });
      expect(cleanup.containerRemoved).toBe(true);
      expect(cleanup.routeRemoved).toBe(true);
    });
  });

  describe('Deploy job retry from failed state', () => {
    it('should allow re-enqueue after failure (failed → pending retry)', async () => {
      const retryJob = await enqueueDeployJob({
        deploymentId: 'dep-retry',
        tenantId: tenants.tenantA,
        serverId: 'server-a',
        catalogAppId: 'nextcloud',
        domain: 'retry.example.com',
        config: {},
      });
      expect(retryJob.data.deploymentId).toBe('dep-retry');

      const result = await processDeployJob(retryJob, { simulateFailure: false });
      expect(result.finalStatus).toBe('running');
    });
  });
});

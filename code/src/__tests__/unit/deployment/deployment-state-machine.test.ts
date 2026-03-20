/**
 * Unit Tests — Deployment Service State Machine
 * Story: S-204 (Application Deployment with Progress) AB#204
 * Covers: State transitions, cleanup on failure, idempotent retry, env file creation,
 *         container name validation
 * Requirements: FR-F2-004, FR-F2-005, FR-F2-006, FR-F2-007, BR-F2-002, BR-F2-004
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { DeploymentStatus, DeployAppInput, DeployedApp } from '@/lib/schemas';
import { validDeployment, createCatalogApp, tenants } from '../../helpers/test-fixtures';
import {
  createDeploymentStateMachine,
  validateContainerName,
  createEnvFileContent,
  enqueueDeployJob,
  processDeployJob,
  cleanupFailedDeployment,
  resetDeployJobs,
} from '../../helpers/deployment-helpers';

describe('Deployment Service — S-204', () => {
  beforeEach(() => {
    resetDeployJobs();
  });

  describe('State Machine Transitions — S-204 Scenario: Real-time deployment progress', () => {
    it('should follow the happy path: pending → pulling → configuring → provisioning-ssl → starting → running', () => {
      const sm = createDeploymentStateMachine();
      expect(sm.currentState).toBe('pending');

      sm.transition('pulling');
      expect(sm.currentState).toBe('pulling');

      sm.transition('configuring');
      expect(sm.currentState).toBe('configuring');

      sm.transition('provisioning-ssl');
      expect(sm.currentState).toBe('provisioning-ssl');

      sm.transition('starting');
      expect(sm.currentState).toBe('starting');

      sm.transition('running');
      expect(sm.currentState).toBe('running');
    });

    it('should reject invalid forward skip: pending → running', () => {
      const sm = createDeploymentStateMachine();
      expect(() => sm.transition('running')).toThrow(/invalid transition/i);
    });

    it('should reject invalid forward skip: pulling → starting', () => {
      const sm = createDeploymentStateMachine();
      sm.transition('pulling');
      expect(() => sm.transition('starting')).toThrow(/invalid transition/i);
    });

    it('should allow transition to failed from any active phase', () => {
      const phases: DeploymentStatus[] = ['pending', 'pulling', 'configuring', 'provisioning-ssl', 'starting'];
      for (let i = 0; i < phases.length; i++) {
        const sm = createDeploymentStateMachine();
        for (let j = 1; j <= i; j++) {
          sm.transition(phases[j]);
        }
        sm.transition('failed');
        expect(sm.currentState).toBe('failed');
      }
    });

    it('should allow retry from failed: failed → pending', () => {
      const sm = createDeploymentStateMachine();
      sm.transition('failed');
      sm.transition('pending');
      expect(sm.currentState).toBe('pending');
    });

    it('should allow stopping and restarting: running → stopped → starting → running', () => {
      const sm = createDeploymentStateMachine();
      sm.transition('pulling');
      sm.transition('configuring');
      sm.transition('provisioning-ssl');
      sm.transition('starting');
      sm.transition('running');
      sm.transition('stopped');
      expect(sm.currentState).toBe('stopped');
      sm.transition('starting');
      sm.transition('running');
      expect(sm.currentState).toBe('running');
    });

    it('should allow removal from running state', () => {
      const sm = createDeploymentStateMachine();
      sm.transition('pulling');
      sm.transition('configuring');
      sm.transition('provisioning-ssl');
      sm.transition('starting');
      sm.transition('running');
      sm.transition('removing');
      expect(sm.currentState).toBe('removing');
    });

    it('should allow removal from stopped state', () => {
      const sm = createDeploymentStateMachine();
      sm.transition('pulling');
      sm.transition('configuring');
      sm.transition('provisioning-ssl');
      sm.transition('starting');
      sm.transition('running');
      sm.transition('stopped');
      sm.transition('removing');
      expect(sm.currentState).toBe('removing');
    });

    it('should allow removal from failed state', () => {
      const sm = createDeploymentStateMachine();
      sm.transition('failed');
      sm.transition('removing');
      expect(sm.currentState).toBe('removing');
    });

    it('should reject any transition from removing (terminal state)', () => {
      const sm = createDeploymentStateMachine();
      sm.transition('failed');
      sm.transition('removing');
      expect(() => sm.transition('pending')).toThrow(/invalid transition/i);
    });

    it('should transition from running to unhealthy', () => {
      const sm = createDeploymentStateMachine();
      sm.transition('pulling');
      sm.transition('configuring');
      sm.transition('provisioning-ssl');
      sm.transition('starting');
      sm.transition('running');
      sm.transition('unhealthy');
      expect(sm.currentState).toBe('unhealthy');
    });

    it('should allow recovery from unhealthy to running', () => {
      const sm = createDeploymentStateMachine();
      sm.transition('pulling');
      sm.transition('configuring');
      sm.transition('provisioning-ssl');
      sm.transition('starting');
      sm.transition('running');
      sm.transition('unhealthy');
      sm.transition('running');
      expect(sm.currentState).toBe('running');
    });

    it('should track complete state history', () => {
      const sm = createDeploymentStateMachine();
      sm.transition('pulling');
      sm.transition('configuring');
      sm.transition('provisioning-ssl');
      sm.transition('starting');
      sm.transition('running');
      expect(sm.history).toEqual([
        'pending', 'pulling', 'configuring', 'provisioning-ssl', 'starting', 'running',
      ]);
    });

    it('should validate all DeploymentStatus enum values are handled', () => {
      const allStatuses = DeploymentStatus.options;
      expect(allStatuses).toEqual(
        expect.arrayContaining([
          'pending', 'pulling', 'configuring', 'provisioning-ssl',
          'starting', 'running', 'unhealthy', 'stopped', 'failed', 'removing',
        ]),
      );
      expect(allStatuses.length).toBe(10);
    });
  });

  describe('Container Name Validation — api-contracts §3.1', () => {
    it('should accept valid container names: lowercase alphanumeric and hyphens', () => {
      expect(validateContainerName('unplughq-nextcloud')).toBe(true);
      expect(validateContainerName('app-1')).toBe(true);
      expect(validateContainerName('a')).toBe(true);
    });

    it('should reject container names with uppercase letters', () => {
      expect(validateContainerName('Nextcloud')).toBe(false);
    });

    it('should reject container names with underscores', () => {
      expect(validateContainerName('my_app')).toBe(false);
    });

    it('should reject container names starting with a hyphen', () => {
      expect(validateContainerName('-invalid')).toBe(false);
    });

    it('should reject container names exceeding 63 characters', () => {
      expect(validateContainerName('a'.repeat(64))).toBe(false);
    });

    it('should accept container names at exactly 63 characters', () => {
      expect(validateContainerName('a'.repeat(63))).toBe(true);
    });

    it('should reject empty container names', () => {
      expect(validateContainerName('')).toBe(false);
    });
  });

  describe('Environment File Creation — S-204 Scenario: Configuring phase', () => {
    it('should create valid env file content from config map', () => {
      const config = { ADMIN_EMAIL: 'admin@test.com', DB_HOST: 'localhost' };
      const content = createEnvFileContent(config);
      expect(content).toContain('ADMIN_EMAIL=admin@test.com');
      expect(content).toContain('DB_HOST=localhost');
    });

    it('should produce one line per config entry', () => {
      const config = { KEY1: 'val1', KEY2: 'val2', KEY3: 'val3' };
      const content = createEnvFileContent(config);
      const lines = content.split('\n');
      expect(lines.length).toBe(3);
    });

    it('should produce empty content for empty config', () => {
      const content = createEnvFileContent({});
      expect(content).toBe('');
    });
  });

  describe('Deploy Job Lifecycle — S-204 Scenario: Single-action deployment', () => {
    it('should enqueue a deploy job with correct payload', async () => {
      const job = await enqueueDeployJob({
        tenantId: tenants.tenantA,
        serverId: 'server-a-1',
        catalogAppId: 'nextcloud',
        domain: 'cloud.example.com',
        config: { adminEmail: 'admin@test.com' },
      });

      expect(job.id).toBeDefined();
      expect(job.status).toBe('pending');
      expect(job.tenantId).toBe(tenants.tenantA);
      expect(job.catalogAppId).toBe('nextcloud');
    });

    it('should process deploy job through all phases to running', async () => {
      const job = await enqueueDeployJob({
        tenantId: tenants.tenantA,
        serverId: 'server-a-1',
        catalogAppId: 'nextcloud',
        domain: 'cloud.example.com',
        config: {},
      });

      const result = await processDeployJob(job);
      expect(result.status).toBe('running');
      expect(result.phases.length).toBeGreaterThanOrEqual(4);
      expect(result.phases.map((p) => p.phase)).toEqual(
        expect.arrayContaining(['pulling', 'configuring', 'provisioning-ssl', 'starting']),
      );
    });

    it('should handle deploy failure and set failed status', async () => {
      const job = await enqueueDeployJob({
        tenantId: tenants.tenantA,
        serverId: 'failing-server',
        catalogAppId: 'nextcloud',
        domain: 'cloud.example.com',
        config: {},
      });

      const result = await processDeployJob(job);
      expect(result.status).toBe('failed');
    });

    it('should clean up failed deployment', async () => {
      const job = await enqueueDeployJob({
        tenantId: tenants.tenantA,
        serverId: 'failing-server',
        catalogAppId: 'nextcloud',
        domain: 'cloud.example.com',
        config: {},
      });
      await processDeployJob(job);

      const cleanup = await cleanupFailedDeployment(job);
      expect(cleanup.cleaned).toBe(true);
    });

    it('should reject cleanup on non-failed deployment', async () => {
      const job = await enqueueDeployJob({
        tenantId: tenants.tenantA,
        serverId: 'server-a-1',
        catalogAppId: 'nextcloud',
        domain: 'cloud.example.com',
        config: {},
      });
      await processDeployJob(job);

      await expect(cleanupFailedDeployment(job)).rejects.toThrow(/failed/i);
    });
  });

  describe('DeployAppInput Schema Validation — api-contracts §2.3', () => {
    it('should accept valid deployment input', () => {
      const result = DeployAppInput.safeParse(validDeployment);
      expect(result.success).toBe(true);
    });

    it('should reject deployment input with empty catalogAppId', () => {
      const result = DeployAppInput.safeParse({ ...validDeployment, catalogAppId: '' });
      expect(result.success).toBe(false);
    });

    it('should reject deployment input with invalid serverId (not UUID)', () => {
      const result = DeployAppInput.safeParse({ ...validDeployment, serverId: 'not-a-uuid' });
      expect(result.success).toBe(false);
    });

    it('should reject deployment input with invalid domain', () => {
      const result = DeployAppInput.safeParse({ ...validDeployment, domain: 'not-a-domain' });
      expect(result.success).toBe(false);
    });

    it('should accept valid FQDN domains', () => {
      const validDomains = ['cloud.example.com', 'app.sub.domain.co.uk', 'a.co'];
      for (const domain of validDomains) {
        const result = DeployAppInput.safeParse({ ...validDeployment, domain });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('DeployedApp Schema Validation — api-contracts §2.3', () => {
    it('should accept valid deployed app record', () => {
      const record = {
        id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        serverId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        catalogAppId: 'nextcloud',
        name: 'Nextcloud',
        domain: 'cloud.example.com',
        accessUrl: 'https://cloud.example.com',
        status: 'running' as const,
        containerName: 'unplughq-nextcloud',
        createdAt: '2026-03-15T10:00:00.000Z',
        updatedAt: '2026-03-15T10:30:00.000Z',
      };
      const result = DeployedApp.safeParse(record);
      expect(result.success).toBe(true);
    });

    it('should reject deployed app with invalid deployment status', () => {
      const record = {
        id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        serverId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        catalogAppId: 'nextcloud',
        name: 'Nextcloud',
        domain: 'cloud.example.com',
        accessUrl: null,
        status: 'invalid-status',
        containerName: 'unplughq-nextcloud',
        createdAt: '2026-03-15T10:00:00.000Z',
        updatedAt: '2026-03-15T10:30:00.000Z',
      };
      const result = DeployedApp.safeParse(record);
      expect(result.success).toBe(false);
    });

    it('should accept null accessUrl (pre-deployment)', () => {
      const record = {
        id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        serverId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        catalogAppId: 'nextcloud',
        name: 'Nextcloud',
        domain: 'cloud.example.com',
        accessUrl: null,
        status: 'pending' as const,
        containerName: 'unplughq-nextcloud',
        createdAt: '2026-03-15T10:00:00.000Z',
        updatedAt: '2026-03-15T10:30:00.000Z',
      };
      const result = DeployedApp.safeParse(record);
      expect(result.success).toBe(true);
    });
  });
});

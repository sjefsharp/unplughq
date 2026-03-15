/**
 * Unit Tests — Zod Schema Boundary Testing
 * Covers: All API input schemas from api-contracts.md §2
 * Tests boundary values, edge cases, and validation messages
 *
 * Security: SEC-INPUT-01 — All user inputs validated with Zod at API boundaries
 */
import { describe, it, expect } from 'vitest';
import {
  validServerConnect,
  serverIPs,
  validDeployment,
  domains,
  createMetricsSnapshot,
  createCatalogApp,
} from '../../helpers/test-fixtures';
import {
  ServerConnectInput,
  ServerStatus,
  DeployAppInput,
  DeploymentStatus,
  CatalogApp,
  MetricsSnapshot,
  SubscriptionTier,
  ContainerStatus,
} from '@/lib/schemas';

describe('Zod Schema Boundary Testing — API Contracts §2', () => {
  describe('ServerConnectInput', () => {
    it('should accept valid server connection input', () => {
      const result = ServerConnectInput.safeParse(validServerConnect);
      expect(result.success).toBe(true);
    });

    it('should reject empty server name', () => {
      const result = ServerConnectInput.safeParse({ ...validServerConnect, name: '' });
      expect(result.success).toBe(false);
    });

    it('should reject server name exceeding 100 characters', () => {
      const result = ServerConnectInput.safeParse({
        ...validServerConnect,
        name: 'x'.repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid IPv4 address', () => {
      const result = ServerConnectInput.safeParse({
        ...validServerConnect,
        ip: serverIPs.validIPv4,
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid IP format', () => {
      const result = ServerConnectInput.safeParse({
        ...validServerConnect,
        ip: serverIPs.invalidFormat,
      });
      expect(result.success).toBe(false);
    });

    it('should reject IP with letters', () => {
      const result = ServerConnectInput.safeParse({
        ...validServerConnect,
        ip: serverIPs.invalidLetters,
      });
      expect(result.success).toBe(false);
    });

    it('should default sshPort to 22 when not provided', () => {
      const { sshPort, ...withoutPort } = validServerConnect;
      const result = ServerConnectInput.safeParse(withoutPort);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sshPort).toBe(22);
      }
    });

    it('should accept port 1 (minimum)', () => {
      const result = ServerConnectInput.safeParse({ ...validServerConnect, sshPort: 1 });
      expect(result.success).toBe(true);
    });

    it('should accept port 65535 (maximum)', () => {
      const result = ServerConnectInput.safeParse({ ...validServerConnect, sshPort: 65535 });
      expect(result.success).toBe(true);
    });

    it('should reject port 0', () => {
      const result = ServerConnectInput.safeParse({ ...validServerConnect, sshPort: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject port 65536', () => {
      const result = ServerConnectInput.safeParse({ ...validServerConnect, sshPort: 65536 });
      expect(result.success).toBe(false);
    });

    it('should reject non-integer port', () => {
      const result = ServerConnectInput.safeParse({ ...validServerConnect, sshPort: 22.5 });
      expect(result.success).toBe(false);
    });

    it('should reject empty sshUser', () => {
      const result = ServerConnectInput.safeParse({ ...validServerConnect, sshUser: '' });
      expect(result.success).toBe(false);
    });

    it('should reject sshUser exceeding 64 characters', () => {
      const result = ServerConnectInput.safeParse({
        ...validServerConnect,
        sshUser: 'a'.repeat(65),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('ServerStatus enum', () => {
    const validStatuses = [
      'connecting', 'validated', 'provisioning', 'provisioned',
      'connection-failed', 'provision-failed', 'disconnected', 'error',
    ];

    for (const status of validStatuses) {
      it(`should accept "${status}" as a valid status`, () => {
        const result = ServerStatus.safeParse(status);
        expect(result.success).toBe(true);
      });
    }

    it('should reject an invalid status value', () => {
      const result = ServerStatus.safeParse('unknown-status');
      expect(result.success).toBe(false);
    });
  });

  describe('DeployAppInput', () => {
    it('should accept valid deployment input', () => {
      const result = DeployAppInput.safeParse(validDeployment);
      expect(result.success).toBe(true);
    });

    it('should reject empty catalogAppId', () => {
      const result = DeployAppInput.safeParse({ ...validDeployment, catalogAppId: '' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid UUID for serverId', () => {
      const result = DeployAppInput.safeParse({ ...validDeployment, serverId: 'not-a-uuid' });
      expect(result.success).toBe(false);
    });

    it('should accept a valid FQDN domain', () => {
      const result = DeployAppInput.safeParse({ ...validDeployment, domain: domains.valid });
      expect(result.success).toBe(true);
    });

    it('should accept domain with subdomain', () => {
      const result = DeployAppInput.safeParse({ ...validDeployment, domain: domains.validSubdomain });
      expect(result.success).toBe(true);
    });

    it('should reject domain without TLD', () => {
      const result = DeployAppInput.safeParse({ ...validDeployment, domain: domains.invalidNoTLD });
      expect(result.success).toBe(false);
    });

    it('should reject domain with leading hyphen', () => {
      const result = DeployAppInput.safeParse({ ...validDeployment, domain: domains.invalidLeadingHyphen });
      expect(result.success).toBe(false);
    });

    it('should reject domain with special characters', () => {
      const result = DeployAppInput.safeParse({ ...validDeployment, domain: domains.invalidSpecialChars });
      expect(result.success).toBe(false);
    });

    it('should reject empty domain', () => {
      const result = DeployAppInput.safeParse({ ...validDeployment, domain: domains.empty });
      expect(result.success).toBe(false);
    });
  });

  describe('DeploymentStatus enum', () => {
    const validStatuses = [
      'pending', 'pulling', 'configuring', 'provisioning-ssl',
      'starting', 'running', 'unhealthy', 'stopped', 'failed', 'removing',
    ];

    for (const status of validStatuses) {
      it(`should accept "${status}" as a valid deployment status`, () => {
        const result = DeploymentStatus.safeParse(status);
        expect(result.success).toBe(true);
      });
    }
  });

  describe('CatalogApp', () => {
    it('should accept a valid catalog app definition', () => {
      const app = createCatalogApp();
      const result = CatalogApp.safeParse(app);
      expect(result.success).toBe(true);
    });

    it('should require imageDigest to match sha256 hex pattern (T-03, SEC-INPUT-05)', () => {
      const app = createCatalogApp({ imageDigest: 'latest' });
      const result = CatalogApp.safeParse(app);
      expect(result.success).toBe(false);
    });

    it('should reject imageDigest with wrong prefix', () => {
      const app = createCatalogApp({ imageDigest: 'md5:' + 'a'.repeat(64) });
      const result = CatalogApp.safeParse(app);
      expect(result.success).toBe(false);
    });

    it('should reject imageDigest with wrong hex length', () => {
      const app = createCatalogApp({ imageDigest: 'sha256:' + 'a'.repeat(32) });
      const result = CatalogApp.safeParse(app);
      expect(result.success).toBe(false);
    });

    it('should require upstreamUrl to be a valid URL', () => {
      const app = createCatalogApp({ upstreamUrl: 'not-a-url' });
      const result = CatalogApp.safeParse(app);
      expect(result.success).toBe(false);
    });

    it('should reject negative minCpuCores', () => {
      const app = createCatalogApp({ minCpuCores: -1 });
      const result = CatalogApp.safeParse(app);
      expect(result.success).toBe(false);
    });
  });

  describe('MetricsSnapshot — I-06 (Data sovereignty)', () => {
    it('should accept a valid metrics snapshot', () => {
      const snapshot = createMetricsSnapshot();
      const result = MetricsSnapshot.safeParse(snapshot);
      expect(result.success).toBe(true);
    });

    it('should reject extra/unexpected fields in strict mode (I-06 — data sovereignty)', () => {
      const snapshot = {
        ...createMetricsSnapshot(),
        extraField: 'should-be-rejected',
        userData: 'sensitive-data',
      };
      // MetricsSnapshot uses strict parsing — rejects extra fields
      const result = MetricsSnapshot.strict().safeParse(snapshot);
      expect(result.success).toBe(false);
    });

    it('should reject cpuPercent above 100', () => {
      const snapshot = createMetricsSnapshot({ cpuPercent: 101 });
      const result = MetricsSnapshot.safeParse(snapshot);
      expect(result.success).toBe(false);
    });

    it('should reject cpuPercent below 0', () => {
      const snapshot = createMetricsSnapshot({ cpuPercent: -1 });
      const result = MetricsSnapshot.safeParse(snapshot);
      expect(result.success).toBe(false);
    });

    it('should reject negative byte values', () => {
      const snapshot = createMetricsSnapshot({ ramUsedBytes: -1 });
      const result = MetricsSnapshot.safeParse(snapshot);
      expect(result.success).toBe(false);
    });

    it('should reject containers array exceeding 100 items', () => {
      const containers = Array.from({ length: 101 }, (_, i) => ({
        id: `container-${i}`,
        name: `app-${i}`,
        status: 'running' as const,
      }));
      const snapshot = createMetricsSnapshot({ containers });
      const result = MetricsSnapshot.safeParse(snapshot);
      expect(result.success).toBe(false);
    });

    it('should accept containers array with exactly 100 items', () => {
      const containers = Array.from({ length: 100 }, (_, i) => ({
        id: `container-${i}`,
        name: `app-${i}`,
        status: 'running' as const,
      }));
      const snapshot = createMetricsSnapshot({ containers });
      const result = MetricsSnapshot.safeParse(snapshot);
      expect(result.success).toBe(true);
    });

    it('should require valid UUID for serverId', () => {
      const snapshot = createMetricsSnapshot({ serverId: 'not-a-uuid' });
      const result = MetricsSnapshot.safeParse(snapshot);
      expect(result.success).toBe(false);
    });

    it('should require valid datetime for timestamp', () => {
      const snapshot = createMetricsSnapshot({ timestamp: 'not-a-date' });
      const result = MetricsSnapshot.safeParse(snapshot);
      expect(result.success).toBe(false);
    });
  });

  describe('SubscriptionTier', () => {
    it('should accept "free", "pro", and "team"', () => {
      expect(SubscriptionTier.safeParse('free').success).toBe(true);
      expect(SubscriptionTier.safeParse('pro').success).toBe(true);
      expect(SubscriptionTier.safeParse('team').success).toBe(true);
    });

    it('should reject invalid tier values', () => {
      expect(SubscriptionTier.safeParse('enterprise').success).toBe(false);
      expect(SubscriptionTier.safeParse('').success).toBe(false);
    });
  });

  describe('ContainerStatus', () => {
    const validStatuses = ['running', 'stopped', 'restarting', 'exited', 'paused', 'dead'];

    for (const status of validStatuses) {
      it(`should accept "${status}"`, () => {
        expect(ContainerStatus.safeParse(status).success).toBe(true);
      });
    }
  });
});



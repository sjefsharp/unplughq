/**
 * Unit Tests — Zod Schema Validation (Sprint 2 schemas)
 * Covers all Sprint 2 schemas: CatalogApp, DeployAppInput, DeployedApp, MetricsSnapshot, Alert, DashboardOutput
 * Requirements: NFR-001 (strict input validation)
 */
import { describe, it, expect } from 'vitest';
import {
  CatalogApp,
  DeployAppInput,
  DeployedApp,
  MetricsSnapshot,
  Alert,
  DashboardOutput,
  DeploymentStatus,
  AlertSeverity,
  AlertType,
  ContainerStatus,
  ServerStatus,
  ServerRecord,
} from '@/lib/schemas';

describe('Sprint 2 Zod Schema Validation', () => {
  describe('CatalogApp', () => {
    const validCatalogApp = {
      id: 'nextcloud',
      name: 'Nextcloud',
      description: 'Self-hosted file storage',
      category: 'File Storage',
      version: '28.0.1',
      minCpuCores: 2,
      minRamGb: 2,
      minDiskGb: 20,
      upstreamUrl: 'https://hub.docker.com/_/nextcloud',
      imageDigest: 'sha256:' + 'a'.repeat(64),
      configSchema: [
        {
          key: 'NEXTCLOUD_ADMIN_USER',
          label: 'Admin Username',
          type: 'text' as const,
          required: true,
        },
      ],
    };

    it('should accept a valid CatalogApp', () => {
      expect(() => CatalogApp.parse(validCatalogApp)).not.toThrow();
    });

    it('should reject CatalogApp with missing id', () => {
      const { id, ...noId } = validCatalogApp;
      expect(() => CatalogApp.parse(noId)).toThrow();
    });

    it('should reject CatalogApp with negative minCpuCores', () => {
      expect(() =>
        CatalogApp.parse({ ...validCatalogApp, minCpuCores: -1 }),
      ).toThrow();
    });

    it('should reject CatalogApp with invalid imageDigest format', () => {
      expect(() =>
        CatalogApp.parse({ ...validCatalogApp, imageDigest: 'not-a-digest' }),
      ).toThrow();
    });

    it('should reject CatalogApp with invalid upstreamUrl', () => {
      expect(() =>
        CatalogApp.parse({ ...validCatalogApp, upstreamUrl: 'not-a-url' }),
      ).toThrow();
    });

    it('should accept configSchema with all field types', () => {
      const allTypes = ['text', 'email', 'password', 'select', 'boolean'] as const;
      for (const type of allTypes) {
        const app = {
          ...validCatalogApp,
          configSchema: [{ key: 'k', label: 'L', type, required: false }],
        };
        expect(() => CatalogApp.parse(app)).not.toThrow();
      }
    });

    it('should reject configSchema with unsupported field type', () => {
      const app = {
        ...validCatalogApp,
        configSchema: [{ key: 'k', label: 'L', type: 'number', required: false }],
      };
      expect(() => CatalogApp.parse(app)).toThrow();
    });
  });

  describe('DeployAppInput', () => {
    const validDeployInput = {
      catalogAppId: 'nextcloud',
      serverId: '00000000-0000-0000-0000-000000000001',
      domain: 'cloud.example.com',
      config: { ADMIN_USER: 'admin', ADMIN_PASS: 'secret' },
    };

    it('should accept valid DeployAppInput', () => {
      expect(() => DeployAppInput.parse(validDeployInput)).not.toThrow();
    });

    it('should reject DeployAppInput with empty catalogAppId', () => {
      expect(() =>
        DeployAppInput.parse({ ...validDeployInput, catalogAppId: '' }),
      ).toThrow();
    });

    it('should reject DeployAppInput with invalid serverId (non-uuid)', () => {
      expect(() =>
        DeployAppInput.parse({ ...validDeployInput, serverId: 'not-a-uuid' }),
      ).toThrow();
    });

    it('should reject DeployAppInput with invalid domain', () => {
      expect(() =>
        DeployAppInput.parse({ ...validDeployInput, domain: 'localhost' }),
      ).toThrow();
    });

    it('should accept valid FQDN domains', () => {
      const validDomains = ['cloud.example.com', 'my-app.co.uk', 'sub.deep.example.org'];
      for (const domain of validDomains) {
        expect(() =>
          DeployAppInput.parse({ ...validDeployInput, domain }),
        ).not.toThrow();
      }
    });

    it('should reject domains with leading dashes', () => {
      expect(() =>
        DeployAppInput.parse({ ...validDeployInput, domain: '-bad.com' }),
      ).toThrow();
    });
  });

  describe('DeployedApp', () => {
    const validDeployedApp = {
      id: '00000000-0000-0000-0000-000000000001',
      serverId: '00000000-0000-0000-0000-000000000002',
      catalogAppId: 'nextcloud',
      name: 'Nextcloud',
      domain: 'cloud.example.com',
      accessUrl: 'https://cloud.example.com',
      status: 'running' as const,
      containerName: 'nextcloud-abc123',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('should accept valid DeployedApp', () => {
      expect(() => DeployedApp.parse(validDeployedApp)).not.toThrow();
    });

    it('should accept all DeploymentStatus values', () => {
      const statuses = DeploymentStatus.options;
      for (const status of statuses) {
        expect(() =>
          DeployedApp.parse({ ...validDeployedApp, status }),
        ).not.toThrow();
      }
    });

    it('should accept null accessUrl', () => {
      expect(() =>
        DeployedApp.parse({ ...validDeployedApp, accessUrl: null }),
      ).not.toThrow();
    });

    it('should reject invalid accessUrl', () => {
      expect(() =>
        DeployedApp.parse({ ...validDeployedApp, accessUrl: 'not-a-url' }),
      ).toThrow();
    });

    it('should reject unknown deployment status', () => {
      expect(() =>
        DeployedApp.parse({ ...validDeployedApp, status: 'unknown-status' }),
      ).toThrow();
    });
  });

  describe('MetricsSnapshot', () => {
    const validMetrics = {
      serverId: '00000000-0000-0000-0000-000000000001',
      timestamp: new Date().toISOString(),
      cpuPercent: 45.5,
      ramUsedBytes: 4294967296,
      ramTotalBytes: 8589934592,
      diskUsedBytes: 53687091200,
      diskTotalBytes: 107374182400,
      networkRxBytesPerSec: 1024000,
      networkTxBytesPerSec: 512000,
      containers: [
        { id: 'c1', name: 'nextcloud', status: 'running' as const },
      ],
    };

    it('should accept valid MetricsSnapshot', () => {
      expect(() => MetricsSnapshot.parse(validMetrics)).not.toThrow();
    });

    it('should reject cpuPercent > 100', () => {
      expect(() =>
        MetricsSnapshot.parse({ ...validMetrics, cpuPercent: 101 }),
      ).toThrow();
    });

    it('should reject cpuPercent < 0', () => {
      expect(() =>
        MetricsSnapshot.parse({ ...validMetrics, cpuPercent: -1 }),
      ).toThrow();
    });

    it('should reject negative ramUsedBytes', () => {
      expect(() =>
        MetricsSnapshot.parse({ ...validMetrics, ramUsedBytes: -100 }),
      ).toThrow();
    });

    it('should accept all valid ContainerStatus values', () => {
      const statuses = ContainerStatus.options;
      for (const status of statuses) {
        const metrics = {
          ...validMetrics,
          containers: [{ id: 'c1', name: 'app', status }],
        };
        expect(() => MetricsSnapshot.parse(metrics)).not.toThrow();
      }
    });

    it('should enforce max 100 containers', () => {
      const tooMany = Array.from({ length: 101 }, (_, i) => ({
        id: `c${i}`,
        name: `app-${i}`,
        status: 'running' as const,
      }));
      expect(() =>
        MetricsSnapshot.parse({ ...validMetrics, containers: tooMany }),
      ).toThrow();
    });

    it('should accept empty containers array', () => {
      expect(() =>
        MetricsSnapshot.parse({ ...validMetrics, containers: [] }),
      ).not.toThrow();
    });

    it('should accept optional diskUsageBytes on container', () => {
      const metrics = {
        ...validMetrics,
        containers: [
          { id: 'c1', name: 'app', status: 'running' as const, diskUsageBytes: 1024 },
        ],
      };
      expect(() => MetricsSnapshot.parse(metrics)).not.toThrow();
    });
  });

  describe('Alert', () => {
    const validAlert = {
      id: '00000000-0000-0000-0000-000000000001',
      serverId: '00000000-0000-0000-0000-000000000002',
      appId: null,
      severity: 'critical' as const,
      type: 'cpu-critical' as const,
      message: 'CPU usage exceeded 90%',
      notificationSent: false,
      acknowledgedAt: null,
      createdAt: new Date().toISOString(),
    };

    it('should accept valid Alert', () => {
      expect(() => Alert.parse(validAlert)).not.toThrow();
    });

    it('should accept all AlertSeverity values', () => {
      for (const severity of AlertSeverity.options) {
        expect(() => Alert.parse({ ...validAlert, severity })).not.toThrow();
      }
    });

    it('should accept all AlertType values', () => {
      for (const type of AlertType.options) {
        expect(() => Alert.parse({ ...validAlert, type })).not.toThrow();
      }
    });

    it('should accept appId as UUID or null', () => {
      expect(() =>
        Alert.parse({ ...validAlert, appId: '00000000-0000-0000-0000-000000000003' }),
      ).not.toThrow();
      expect(() => Alert.parse({ ...validAlert, appId: null })).not.toThrow();
    });

    it('should accept acknowledgedAt as datetime or null', () => {
      expect(() =>
        Alert.parse({ ...validAlert, acknowledgedAt: new Date().toISOString() }),
      ).not.toThrow();
      expect(() =>
        Alert.parse({ ...validAlert, acknowledgedAt: null }),
      ).not.toThrow();
    });

    it('should reject unknown alert type', () => {
      expect(() =>
        Alert.parse({ ...validAlert, type: 'memory-warning' }),
      ).toThrow();
    });
  });

  describe('DashboardOutput', () => {
    const now = new Date().toISOString();
    const validDashboard = {
      servers: [
        {
          server: {
            id: '00000000-0000-0000-0000-000000000001',
            name: 'My VPS',
            ip: '192.168.1.1',
            sshPort: 22,
            status: 'provisioned' as const,
            osName: 'Ubuntu 24.04',
            cpuCores: 4,
            ramGb: 8,
            diskGb: 100,
            createdAt: now,
            updatedAt: now,
          },
          latestMetrics: null,
          apps: [],
          activeAlerts: [],
        },
      ],
    };

    it('should accept valid DashboardOutput', () => {
      expect(() => DashboardOutput.parse(validDashboard)).not.toThrow();
    });

    it('should accept empty servers array', () => {
      expect(() => DashboardOutput.parse({ servers: [] })).not.toThrow();
    });

    it('should accept null latestMetrics', () => {
      expect(validDashboard.servers[0].latestMetrics).toBeNull();
      expect(() => DashboardOutput.parse(validDashboard)).not.toThrow();
    });

    it('should accept DashboardOutput with populated metrics, apps, and alerts', () => {
      const populated = {
        servers: [
          {
            ...validDashboard.servers[0],
            latestMetrics: {
              serverId: '00000000-0000-0000-0000-000000000001',
              timestamp: now,
              cpuPercent: 50,
              ramUsedBytes: 4000000000,
              ramTotalBytes: 8000000000,
              diskUsedBytes: 50000000000,
              diskTotalBytes: 100000000000,
              networkRxBytesPerSec: 1000,
              networkTxBytesPerSec: 500,
              containers: [],
            },
            apps: [
              {
                id: '00000000-0000-0000-0000-000000000010',
                serverId: '00000000-0000-0000-0000-000000000001',
                catalogAppId: 'nextcloud',
                name: 'Nextcloud',
                domain: 'cloud.example.com',
                accessUrl: 'https://cloud.example.com',
                status: 'running' as const,
                containerName: 'nextcloud-abc',
                createdAt: now,
                updatedAt: now,
              },
            ],
            activeAlerts: [
              {
                id: '00000000-0000-0000-0000-000000000020',
                serverId: '00000000-0000-0000-0000-000000000001',
                appId: null,
                severity: 'warning' as const,
                type: 'cpu-critical' as const,
                message: 'CPU is high',
                notificationSent: true,
                acknowledgedAt: null,
                createdAt: now,
              },
            ],
          },
        ],
      };
      expect(() => DashboardOutput.parse(populated)).not.toThrow();
    });
  });
});

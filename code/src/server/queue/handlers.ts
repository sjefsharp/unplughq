import type { Job } from 'bullmq';
import { db } from '@/server/db';
import { metricsSnapshots, servers } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { sshService } from '@/server/services/ssh/ssh-service';
import { decryptSSHKey } from '@/server/lib/encryption';
import { sseEventBus } from '@/server/lib/sse-event-bus';
import { logger } from '@/server/lib/logger';
import {
  DeployAppPayload,
  ProcessMetricsPayload,
  ProvisionServerPayload,
  SendAlertPayload,
  TestConnectionPayload,
  UpdateAgentPayload,
} from './schemas';
import { randomBytes } from 'node:crypto';
import {
  buildCaddyRouteId,
  createEnvFileContent,
  getCatalogAppById,
  getTenantDeployment,
  getTenantServer,
  updateDeploymentStatus,
  verifyDeploymentReachability,
} from '@/server/services/deployment-service';
import { evaluateMetricAlerts, sendAlertNotification } from '@/server/services/alert-service';

/**
 * Test connection job handler.
 * SSH connect → validate → detect OS/specs → update server record.
 */
export async function handleTestConnection(job: Job): Promise<void> {
  const log = logger.child({ jobId: job.id, jobName: 'test-connection' });

  // D-05: Validate job payload with Zod
  const parseResult = TestConnectionPayload.safeParse(job.data);
  if (!parseResult.success) {
    log.error({ issues: parseResult.error.issues }, 'Invalid job payload');
    throw new Error('Invalid test-connection job payload');
  }

  const { serverId, tenantId, ip, sshPort, sshUser } = parseResult.data;
  log.info({ serverId, ip }, 'Starting connection test');

  try {
    // Get the SSH key from the server record (if one was stored)
    const server = await db.query.servers.findFirst({
      where: eq(servers.id, serverId),
    });

    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    let privateKey = '';
    if (server.sshKeyEncrypted) {
      privateKey = await decryptSSHKey(server.sshKeyEncrypted, tenantId);
    }

    // Test SSH connection
    const connected = await sshService.testConnection({
      host: ip,
      port: sshPort,
      username: sshUser,
      privateKey,
    });

    if (!connected) {
      await db
        .update(servers)
        .set({ status: 'connection-failed', updatedAt: new Date() })
        .where(eq(servers.id, serverId));

      sseEventBus.emitToTenant(tenantId, {
        event: 'server.status',
        data: { serverId, status: 'connection-failed' },
      });

      log.warn({ serverId }, 'Connection test failed');
      return;
    }

    // Detect server specs
    const specs = await sshService.detectServerSpecs({
      host: ip,
      port: sshPort,
      username: sshUser,
      privateKey,
    });

    // Update server record with specs and status
    await db
      .update(servers)
      .set({
        status: 'validated',
        osName: specs.osName,
        cpuCores: specs.cpuCores,
        ramGb: specs.ramGb,
        diskGb: specs.diskGb,
        updatedAt: new Date(),
      })
      .where(eq(servers.id, serverId));

    sseEventBus.emitToTenant(tenantId, {
      event: 'server.status',
      data: { serverId, status: 'validated' },
    });

    log.info({ serverId, specs }, 'Connection test succeeded');
  } catch (error) {
    await db
      .update(servers)
      .set({ status: 'connection-failed', updatedAt: new Date() })
      .where(eq(servers.id, serverId));

    sseEventBus.emitToTenant(tenantId, {
      event: 'server.status',
      data: { serverId, status: 'connection-failed' },
    });

    // I-04: Log full error server-side, never expose to client
    log.error({ serverId, error: (error as Error).message }, 'Connection test error');
    throw error; // Let BullMQ retry
  }
}

/**
 * Provision server job handler (BR-F1-003: idempotent).
 * Install Docker, Caddy, monitoring agent.
 */
export async function handleProvisionServer(job: Job): Promise<void> {
  const log = logger.child({ jobId: job.id, jobName: 'provision-server' });

  // D-05: Validate job payload
  const parseResult = ProvisionServerPayload.safeParse(job.data);
  if (!parseResult.success) {
    log.error({ issues: parseResult.error.issues }, 'Invalid job payload');
    throw new Error('Invalid provision-server job payload');
  }

  const { serverId, tenantId } = parseResult.data;
  log.info({ serverId }, 'Starting server provisioning');

  const server = await db.query.servers.findFirst({
    where: eq(servers.id, serverId),
  });

  if (!server) {
    throw new Error(`Server ${serverId} not found`);
  }

  let privateKey = '';
  if (server.sshKeyEncrypted) {
    privateKey = await decryptSSHKey(server.sshKeyEncrypted, tenantId);
  }

  const sshParams = {
    host: server.ip,
    port: server.sshPort,
    username: server.sshUser,
    privateKey,
  };

  const steps = [
    { name: 'install-docker', template: { type: 'install-docker' as const } },
    { name: 'install-caddy', template: { type: 'install-caddy' as const } },
  ];

  try {
    for (const step of steps) {
      log.info({ serverId, step: step.name }, 'Executing provisioning step');

      sseEventBus.emitToTenant(tenantId, {
        event: 'server.status',
        data: { serverId, status: 'provisioning' },
      });

      const result = await sshService.executeCommand({
        ...sshParams,
        command: step.template,
      });

      if (result.exitCode !== 0) {
        log.error(
          { serverId, step: step.name, exitCode: result.exitCode, stderr: result.stderr },
          'Provisioning step failed',
        );

        await db
          .update(servers)
          .set({ status: 'provision-failed', updatedAt: new Date() })
          .where(eq(servers.id, serverId));

        sseEventBus.emitToTenant(tenantId, {
          event: 'server.status',
          data: { serverId, status: 'provision-failed' },
        });

        throw new Error(`Provisioning step '${step.name}' failed with exit code ${result.exitCode}`);
      }
    }

    // Generate per-server API token for monitoring agent (S-03)
    const apiToken = randomBytes(32).toString('hex');
    const controlPlaneUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    // Start monitoring agent
    await sshService.executeCommand({
      ...sshParams,
      command: {
        type: 'start-monitoring-agent',
        params: { apiToken, controlPlaneUrl, serverId },
      },
    });

    // Store API token and mark as provisioned
    await db
      .update(servers)
      .set({
        status: 'provisioned',
        apiToken,
        updatedAt: new Date(),
      })
      .where(eq(servers.id, serverId));

    sseEventBus.emitToTenant(tenantId, {
      event: 'server.status',
      data: { serverId, status: 'provisioned' },
    });

    log.info({ serverId }, 'Server provisioning completed');
  } catch (error) {
    // Status already updated in step-level catch above for step failures
    log.error({ serverId, error: (error as Error).message }, 'Provisioning error');
    throw error; // Let BullMQ retry
  }
}

export async function handleDeployApp(job: Job): Promise<void> {
  const log = logger.child({ jobId: job.id, jobName: 'deploy-app' });
  const parseResult = DeployAppPayload.safeParse(job.data);

  if (!parseResult.success) {
    log.error({ issues: parseResult.error.issues }, 'Invalid deploy-app job payload');
    throw new Error('Invalid deploy-app job payload');
  }

  const payload = parseResult.data;
  const deployment = await getTenantDeployment(payload.deploymentId, payload.tenantId);
  const [server] = await Promise.all([
    getTenantServer(payload.serverId, payload.tenantId),
    getCatalogAppById(payload.catalogAppId),
  ]);

  let privateKey = '';
  if (server.sshKeyEncrypted) {
    privateKey = await decryptSSHKey(server.sshKeyEncrypted, payload.tenantId);
  }

  const sshParams = {
    host: server.ip,
    port: server.sshPort,
    username: server.sshUser,
    privateKey,
  };

  const phases = [
    {
      status: 'pulling' as const,
      execute: () =>
        sshService.executeCommand({
          ...sshParams,
          command: { type: 'docker-pull', params: { imageRef: payload.imageRef } },
        }),
    },
    {
      status: 'configuring' as const,
      execute: () =>
        sshService.executeCommand({
          ...sshParams,
          command: {
            type: 'write-env-file',
            params: { path: payload.envFilePath, content: createEnvFileContent(deployment.config) },
          },
        }),
    },
    {
      status: 'provisioning-ssl' as const,
      execute: () =>
        sshService.executeCommand({
          ...sshParams,
          command: {
            type: 'caddy-add-route',
            params: {
              routeId: buildCaddyRouteId(deployment.id),
              domain: deployment.domain,
              upstream: `${deployment.containerName}:3000`,
            },
          },
        }),
    },
    {
      status: 'starting' as const,
      execute: () =>
        sshService.executeCommand({
          ...sshParams,
          command: {
            type: 'docker-run',
            params: {
              containerName: deployment.containerName,
              imageRef: payload.imageRef,
              networkName: 'unplughq',
              envFile: payload.envFilePath,
            },
          },
        }),
    },
  ];

  try {
    for (const phase of phases) {
      await updateDeploymentStatus({
        deploymentId: deployment.id,
        tenantId: payload.tenantId,
        status: phase.status,
        phase: phase.status,
        accessUrl: deployment.accessUrl,
      });
      await job.updateProgress({ status: phase.status });

      const result = await phase.execute();
      if (result.exitCode !== 0) {
        throw new Error(result.stderr || `Deployment phase ${phase.status} failed`);
      }
    }

    const verification = await verifyDeploymentReachability({
      deploymentId: deployment.id,
      domain: payload.domain,
    });

    if (!verification.healthy) {
      throw new Error(verification.failureReason ?? 'Health check failed');
    }

    await updateDeploymentStatus({
      deploymentId: deployment.id,
      tenantId: payload.tenantId,
      status: 'running',
      phase: 'running',
      accessUrl: `https://${payload.domain}`,
    });
  } catch (error) {
    await updateDeploymentStatus({
      deploymentId: deployment.id,
      tenantId: payload.tenantId,
      status: 'failed',
      phase: 'failed',
      accessUrl: deployment.accessUrl,
    });

    await sshService
      .executeCommand({
        ...sshParams,
        command: { type: 'docker-rm', params: { containerName: deployment.containerName } },
      })
      .catch(() => undefined);
    await sshService
      .executeCommand({
        ...sshParams,
        command: { type: 'caddy-remove-route', params: { routeId: buildCaddyRouteId(deployment.id) } },
      })
      .catch(() => undefined);

    log.error(
      { deploymentId: deployment.id, error: error instanceof Error ? error.message : 'Unknown deploy error' },
      'Deploy-app job failed',
    );
    throw error;
  }
}

export async function handleProcessMetrics(job: Job): Promise<void> {
  const parseResult = ProcessMetricsPayload.safeParse(job.data);

  if (!parseResult.success) {
    throw new Error('Invalid process-metrics job payload');
  }

  const payload = parseResult.data;
  await db.insert(metricsSnapshots).values({
    tenantId: payload.tenantId,
    serverId: payload.serverId,
    timestamp: new Date(payload.snapshot.timestamp),
    cpuPercent: payload.snapshot.cpuPercent,
    ramUsedBytes: BigInt(Math.floor(payload.snapshot.ramUsedBytes)),
    ramTotalBytes: BigInt(Math.floor(payload.snapshot.ramTotalBytes)),
    diskUsedBytes: BigInt(Math.floor(payload.snapshot.diskUsedBytes)),
    diskTotalBytes: BigInt(Math.floor(payload.snapshot.diskTotalBytes)),
    networkRxBytesPerSec: BigInt(Math.floor(payload.snapshot.networkRxBytesPerSec)),
    networkTxBytesPerSec: BigInt(Math.floor(payload.snapshot.networkTxBytesPerSec)),
    containers: payload.snapshot.containers,
  });

  await evaluateMetricAlerts({
    tenantId: payload.tenantId,
    serverId: payload.serverId,
    snapshot: payload.snapshot,
  });
}

export async function handleSendAlert(job: Job): Promise<void> {
  const parseResult = SendAlertPayload.safeParse(job.data);

  if (!parseResult.success) {
    throw new Error('Invalid send-alert job payload');
  }

  await sendAlertNotification(parseResult.data.alertId, parseResult.data.tenantId);
}

export async function handleUpdateAgent(job: Job): Promise<void> {
  const parseResult = UpdateAgentPayload.safeParse(job.data);

  if (!parseResult.success) {
    throw new Error('Invalid update-agent job payload');
  }

  const payload = parseResult.data;
  const server = await getTenantServer(payload.serverId, payload.tenantId);

  if (!server.sshKeyEncrypted) {
    return;
  }

  const privateKey = await decryptSSHKey(server.sshKeyEncrypted, payload.tenantId);
  await sshService.executeCommand({
    host: server.ip,
    port: server.sshPort,
    username: server.sshUser,
    privateKey,
    command: {
      type: 'start-monitoring-agent',
      params: {
        apiToken: payload.apiToken,
        controlPlaneUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
        serverId: server.id,
      },
    },
  });
}

import type { Job } from 'bullmq';
import { db } from '@/server/db';
import { servers } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { sshService } from '@/server/services/ssh/ssh-service';
import { decryptSSHKey } from '@/server/lib/encryption';
import { sseEventBus } from '@/server/lib/sse-event-bus';
import { logger } from '@/server/lib/logger';
import { TestConnectionPayload, ProvisionServerPayload } from './schemas';
import { randomBytes } from 'node:crypto';

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

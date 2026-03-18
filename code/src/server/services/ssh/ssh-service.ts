import { Client } from 'ssh2';
import { logger } from '@/server/lib/logger';
import type {
  ISSHExecutor,
  SSHCommandResult,
  SSHCommandTemplate,
} from '@/server/ports/ssh-executor';

/**
 * SSH Command Template Resolver — T-01 mitigation.
 * Converts parameterized templates into safe shell commands.
 * NEVER uses string concatenation with user input.
 * All values are validated by Zod at the API boundary before reaching this layer.
 */

const CONTAINER_NAME_REGEX = /^[a-z0-9][a-z0-9-]*$/;
const NETWORK_NAME_REGEX = /^[a-z0-9][a-z0-9_.-]*$/;
const ROUTE_ID_REGEX = /^[a-z0-9][a-z0-9-]*$/;
const DOMAIN_REGEX = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
const IMAGE_REF_REGEX = /^[a-z0-9._/-]+(@sha256:[a-f0-9]{64})?$/;

function validateContainerName(name: string): void {
  if (!CONTAINER_NAME_REGEX.test(name)) {
    throw new Error('Invalid container name format');
  }
}

function validateImageRef(ref: string): void {
  if (!IMAGE_REF_REGEX.test(ref)) {
    throw new Error('Invalid image reference format');
  }
}

function validateNetworkName(name: string): void {
  if (!NETWORK_NAME_REGEX.test(name)) {
    throw new Error('Invalid network name format');
  }
}

function validateRouteId(routeId: string): void {
  if (!ROUTE_ID_REGEX.test(routeId)) {
    throw new Error('Invalid route id format');
  }
}

function validateDomain(domain: string): void {
  if (!DOMAIN_REGEX.test(domain)) {
    throw new Error('Invalid domain format');
  }
}

function buildCaddyRoutePayload(routeId: string, domain: string, upstream: string): string {
  validateRouteId(routeId);
  validateDomain(domain);

  return JSON.stringify({
    '@id': routeId,
    match: [{ host: [domain] }],
    handle: [{ handler: 'reverse_proxy', upstreams: [{ dial: upstream }] }],
    terminal: true,
  });
}

function resolveCommand(template: SSHCommandTemplate): string {
  switch (template.type) {
    case 'detect-os':
      return 'cat /etc/os-release 2>/dev/null || lsb_release -a 2>/dev/null || uname -a';
    case 'detect-cpu':
      return 'nproc 2>/dev/null || grep -c ^processor /proc/cpuinfo';
    case 'detect-ram':
      return "free -g | awk '/^Mem:/{print $2}'";
    case 'detect-disk':
      return "df -BG / | awk 'NR==2{print $2}' | tr -d 'G'";
    case 'check-docker':
      return 'docker --version 2>/dev/null && docker info --format "{{.ServerVersion}}" 2>/dev/null';
    case 'install-docker':
      return [
        'export DEBIAN_FRONTEND=noninteractive',
        'sudo apt-get update -qq',
        'sudo apt-get install -y -qq ca-certificates curl gnupg',
        'sudo install -m 0755 -d /etc/apt/keyrings',
        'curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes',
        'sudo chmod a+r /etc/apt/keyrings/docker.gpg',
        'echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null',
        'sudo apt-get update -qq',
        'sudo apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin',
        'sudo usermod -aG docker $USER',
        'sudo systemctl enable docker',
        'sudo systemctl start docker',
        'docker network create unplughq 2>/dev/null || true',
      ].join(' && ');
    case 'install-caddy':
      return [
        'sudo docker pull caddy:2-alpine',
        'sudo docker run -d --name caddy --network unplughq --restart unless-stopped -p 80:80 -p 443:443 -v caddy_data:/data -v caddy_config:/config caddy:2-alpine',
      ].join(' && ');
    case 'start-monitoring-agent': {
      const { apiToken, controlPlaneUrl, serverId } = template.params;
      // These values come from server-side generation, not user input
      validateContainerName('unplughq-agent');
      return [
        'sudo docker pull ghcr.io/unplughq/agent:latest',
        `sudo docker run -d --name unplughq-agent --network unplughq --restart unless-stopped`,
        `-e AGENT_API_TOKEN=${shellEscape(apiToken)}`,
        `-e CONTROL_PLANE_URL=${shellEscape(controlPlaneUrl)}`,
        `-e SERVER_ID=${shellEscape(serverId)}`,
        `-v /var/run/docker.sock:/var/run/docker.sock:ro`,
        `ghcr.io/unplughq/agent:latest`,
      ].join(' ');
    }
    case 'docker-pull': {
      validateImageRef(template.params.imageRef);
      return `docker pull ${shellEscape(template.params.imageRef)}`;
    }
    case 'docker-run': {
      const { containerName, imageRef, networkName, envFile, volumeMounts = [], labels = {} } = template.params;
      validateContainerName(containerName);
      validateImageRef(imageRef);
      validateNetworkName(networkName);

      const volumeFlags = volumeMounts.map((mount) => {
        const suffix = mount.readOnly ? ':ro' : '';
        return `-v ${shellEscape(`${mount.hostPath}:${mount.containerPath}${suffix}`)}`;
      });
      const labelFlags = Object.entries(labels).map(
        ([key, value]) => `--label ${shellEscape(`${key}=${value}`)}`,
      );

      return [
        `docker run -d`,
        `--name ${shellEscape(containerName)}`,
        `--network ${shellEscape(networkName)}`,
        `--restart unless-stopped`,
        `--env-file ${shellEscape(envFile)}`,
        ...volumeFlags,
        ...labelFlags,
        shellEscape(imageRef),
      ].join(' ');
    }
    case 'docker-start': {
      validateContainerName(template.params.containerName);
      return `docker start ${shellEscape(template.params.containerName)}`;
    }
    case 'docker-stop': {
      validateContainerName(template.params.containerName);
      return `docker stop ${shellEscape(template.params.containerName)}`;
    }
    case 'docker-rm': {
      validateContainerName(template.params.containerName);
      return `docker rm -f ${shellEscape(template.params.containerName)}`;
    }
    case 'docker-inspect': {
      validateContainerName(template.params.containerName);
      return `docker inspect ${shellEscape(template.params.containerName)}`;
    }
    case 'docker-ps':
      return 'docker ps --format json';
    case 'docker-network-create': {
      validateNetworkName(template.params.networkName);
      return `docker network inspect ${shellEscape(template.params.networkName)} >/dev/null 2>&1 || docker network create ${shellEscape(template.params.networkName)}`;
    }
    case 'ensure-directory': {
      const mode = template.params.mode ?? '0750';
      const owner = template.params.owner ? ` && chown ${shellEscape(template.params.owner)} ${shellEscape(template.params.path)}` : '';
      return `install -d -m ${shellEscape(mode)} ${shellEscape(template.params.path)}${owner}`;
    }
    case 'write-env-file': {
      // AB#255: Base64 encode to prevent heredoc injection
      const encoded = Buffer.from(template.params.content).toString('base64');
      return `echo ${shellEscape(encoded)} | base64 -d > ${shellEscape(template.params.path)}`;
    }
    case 'caddy-get-config':
      return 'curl -fsS http://localhost:2019/config/';
    case 'caddy-validate-config':
      return 'curl -fsS http://localhost:2019/config/ >/dev/null';
    case 'caddy-add-route': {
      const { routeId, domain, upstream } = template.params;
      const payload = buildCaddyRoutePayload(routeId, domain, upstream);
      return `curl -s -X POST http://localhost:2019/config/apps/http/servers/srv0/routes -H 'Content-Type: application/json' -d ${shellEscape(payload)}`;
    }
    case 'caddy-remove-route': {
      validateRouteId(template.params.routeId);
      return `curl -fsS -X DELETE http://localhost:2019/id/${shellEscape(template.params.routeId)}`;
    }
  }
}

/** Shell-escape a value to prevent injection via special characters */
function shellEscape(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

// --- Connection Pool (D-04 mitigation) ---

interface PooledConnection {
  client: Client;
  lastUsed: number;
  inUse: boolean;
}

const connectionPool = new Map<string, PooledConnection[]>();
const MAX_CONNECTIONS_PER_SERVER = 3;
const CONNECT_TIMEOUT_MS = 30_000;
const COMMAND_TIMEOUT_MS = 120_000;
const POOL_IDLE_TIMEOUT_MS = 60_000;

function poolKey(host: string, port: number): string {
  return `${host}:${port}`;
}

function cleanupIdleConnections(): void {
  const now = Date.now();
  for (const [key, connections] of connectionPool.entries()) {
    const active = connections.filter((conn) => {
      if (!conn.inUse && now - conn.lastUsed > POOL_IDLE_TIMEOUT_MS) {
        conn.client.end();
        return false;
      }
      return true;
    });
    if (active.length === 0) {
      connectionPool.delete(key);
    } else {
      connectionPool.set(key, active);
    }
  }
}

// Clean up idle connections every 30 seconds
const cleanupInterval = setInterval(cleanupIdleConnections, 30_000);
cleanupInterval.unref();

async function getConnection(params: {
  host: string;
  port: number;
  username: string;
  privateKey: string;
}): Promise<{ client: Client; release: () => void }> {
  const key = poolKey(params.host, params.port);
  const pool = connectionPool.get(key) ?? [];

  // Try to reuse an idle connection
  const idle = pool.find((c) => !c.inUse);
  if (idle) {
    idle.inUse = true;
    idle.lastUsed = Date.now();
    return {
      client: idle.client,
      release: () => {
        idle.inUse = false;
        idle.lastUsed = Date.now();
      },
    };
  }

  // Check pool limit
  if (pool.length >= MAX_CONNECTIONS_PER_SERVER) {
    throw new Error(`SSH connection limit reached for ${params.host} (max ${MAX_CONNECTIONS_PER_SERVER})`);
  }

  // Create new connection
  const client = new Client();
  const poolEntry: PooledConnection = { client, lastUsed: Date.now(), inUse: true };
  pool.push(poolEntry);
  connectionPool.set(key, pool);

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      client.end();
      reject(new Error(`SSH connect timeout after ${CONNECT_TIMEOUT_MS}ms`));
    }, CONNECT_TIMEOUT_MS);

    client.on('ready', () => {
      clearTimeout(timeout);
      resolve();
    });

    client.on('error', (err) => {
      clearTimeout(timeout);
      // Remove from pool on error
      const idx = pool.indexOf(poolEntry);
      if (idx >= 0) pool.splice(idx, 1);
      reject(err);
    });

    client.connect({
      host: params.host,
      port: params.port,
      username: params.username,
      privateKey: params.privateKey,
      readyTimeout: CONNECT_TIMEOUT_MS,
    });
  });

  return {
    client,
    release: () => {
      poolEntry.inUse = false;
      poolEntry.lastUsed = Date.now();
    },
  };
}

// --- SSH Executor Implementation ---

function executeOnClient(
  client: Client,
  command: string,
): Promise<SSHCommandResult> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`SSH command timeout after ${COMMAND_TIMEOUT_MS}ms`));
    }, COMMAND_TIMEOUT_MS);

    client.exec(command, (err, stream) => {
      if (err) {
        clearTimeout(timeout);
        return reject(err);
      }

      let stdout = '';
      let stderr = '';

      stream.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      stream.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      stream.on('close', (exitCode: number) => {
        clearTimeout(timeout);
        resolve({ stdout: stdout.trim(), stderr: stderr.trim(), exitCode: exitCode ?? 0 });
      });
    });
  });
}

function uploadViaSftp(
  client: Client,
  remotePath: string,
  content: string,
  mode: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    client.sftp((sftpErr, sftp) => {
      if (sftpErr || !sftp) {
        reject(sftpErr ?? new Error('SFTP unavailable'));
        return;
      }

      const stream = sftp.createWriteStream(remotePath, { mode, encoding: 'utf8' });

      stream.on('error', reject);
      stream.on('close', () => {
        sftp.chmod(remotePath, mode, (chmodErr) => {
          if (chmodErr) {
            reject(chmodErr);
            return;
          }
          resolve();
        });
      });

      stream.end(content);
    });
  });
}

export class SSHService implements ISSHExecutor {
  async testConnection(params: {
    host: string;
    port: number;
    username: string;
    privateKey: string;
  }): Promise<boolean> {
    try {
      const { client, release } = await getConnection(params);
      release();
      logger.info({ host: params.host, port: params.port }, 'SSH connection test succeeded');
      // Disconnect from pool after test
      client.end();
      const key = poolKey(params.host, params.port);
      connectionPool.delete(key);
      return true;
    } catch (error) {
      logger.warn(
        { host: params.host, port: params.port, error: (error as Error).message },
        'SSH connection test failed',
      );
      return false;
    }
  }

  async executeCommand(params: {
    host: string;
    port: number;
    username: string;
    privateKey: string;
    command: SSHCommandTemplate;
  }): Promise<SSHCommandResult> {
    const resolvedCommand = resolveCommand(params.command);
    const { client, release } = await getConnection(params);

    try {
      const result = await executeOnClient(client, resolvedCommand);
      logger.info(
        {
          host: params.host,
          commandType: params.command.type,
          exitCode: result.exitCode,
        },
        'SSH command executed',
      );
      return result;
    } finally {
      release();
    }
  }

  async uploadFile(params: {
    host: string;
    port: number;
    username: string;
    privateKey: string;
    remotePath: string;
    content: string;
    mode?: number;
  }): Promise<void> {
    const { client, release } = await getConnection(params);

    try {
      await uploadViaSftp(client, params.remotePath, params.content, params.mode ?? 0o600);
      logger.info({ host: params.host, remotePath: params.remotePath }, 'SFTP file uploaded');
    } finally {
      release();
    }
  }

  async detectServerSpecs(params: {
    host: string;
    port: number;
    username: string;
    privateKey: string;
  }): Promise<{
    osName: string;
    cpuCores: number;
    ramGb: number;
    diskGb: number;
  }> {
    const execCmd = async (template: SSHCommandTemplate) => {
      return this.executeCommand({ ...params, command: template });
    };

    const [osResult, cpuResult, ramResult, diskResult] = await Promise.all([
      execCmd({ type: 'detect-os' }),
      execCmd({ type: 'detect-cpu' }),
      execCmd({ type: 'detect-ram' }),
      execCmd({ type: 'detect-disk' }),
    ]);

    // Parse OS from /etc/os-release
    let osName = 'Unknown';
    const prettyMatch = osResult.stdout.match(/PRETTY_NAME="([^"]+)"/);
    if (prettyMatch) {
      osName = prettyMatch[1];
    } else if (osResult.stdout.includes('Description:')) {
      const descMatch = osResult.stdout.match(/Description:\s*(.+)/);
      if (descMatch) osName = descMatch[1].trim();
    } else {
      osName = osResult.stdout.split('\n')[0] || 'Unknown';
    }

    const cpuCores = parseInt(cpuResult.stdout, 10) || 0;
    const ramGb = parseInt(ramResult.stdout, 10) || 0;
    const diskGb = parseInt(diskResult.stdout, 10) || 0;

    return { osName, cpuCores, ramGb, diskGb };
  }
}

export const sshService = new SSHService();

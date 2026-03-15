/**
 * SSH Command Helpers — command builders and validators for unit tests.
 * Implements the same validation logic as production SSHCommandBuilder
 * but exposed as individual testable functions.
 */

const CONTAINER_NAME_REGEX = /^[a-z0-9][a-z0-9-]*$/;
const DIGEST_REGEX = /^sha256:[a-f0-9]{64}$/;
const IPV4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;
const SSH_USER_REGEX = /^[a-z][a-z0-9_-]*$/;

function assertValidContainerName(name: string): void {
  if (!CONTAINER_NAME_REGEX.test(name)) {
    throw new Error(`Invalid container name: only [a-z0-9-] allowed, got '${name}'`);
  }
}

function assertValidDigest(digest: string): void {
  if (!DIGEST_REGEX.test(digest)) {
    throw new Error(`Invalid digest format: expected sha256:<64 hex chars>`);
  }
}

function assertValidImageName(image: string): void {
  if (/[;&|`$(){}\n\r]/.test(image)) {
    throw new Error(`Invalid image name: shell injection characters forbidden`);
  }
}

// --- Docker Commands ---

export function buildDockerPullCommand(params: {
  registry: string;
  image: string;
  digest: string;
}): string {
  assertValidImageName(params.image);
  assertValidDigest(params.digest);
  return `docker pull ${params.registry}/${params.image}@${params.digest}`;
}

export function buildDockerRunCommand(params: {
  containerName: string;
  imageWithDigest: string;
  network: string;
}): string {
  assertValidContainerName(params.containerName);
  return [
    'docker run -d',
    `--name ${params.containerName}`,
    `--network ${params.network}`,
    '--restart unless-stopped',
    params.imageWithDigest,
  ].join(' ');
}

export function buildDockerLifecycleCommand(
  action: 'start' | 'stop' | 'rm',
  containerName: string,
): string {
  assertValidContainerName(containerName);
  if (action === 'rm') {
    return `docker rm -f ${containerName}`;
  }
  return `docker ${action} ${containerName}`;
}

export function buildDockerInspectCommand(containerName: string): string {
  assertValidContainerName(containerName);
  return `docker inspect ${containerName}`;
}

export function buildDockerPsCommand(): string {
  return 'docker ps --format json';
}

// --- SSH Validation ---

export function validateSSHTarget(ip: string, port: number): void {
  if (!IPV4_REGEX.test(ip)) {
    throw new Error(`Invalid IP address format`);
  }
  // Check for injection characters in IP string
  if (/[;&|`$(){}\n\r\s]/.test(ip)) {
    throw new Error(`IP address contains injection characters`);
  }
  // Validate octets
  const octets = ip.split('.').map(Number);
  if (octets.some((o) => o < 0 || o > 255)) {
    throw new Error(`IP address octets must be 0-255`);
  }
  if (port < 1 || port > 65535 || !Number.isInteger(port)) {
    throw new Error(`SSH port must be between 1 and 65535`);
  }
}

export function validateSSHUser(username: string): void {
  if (!SSH_USER_REGEX.test(username)) {
    throw new Error(`Invalid SSH username: only [a-z0-9_-] allowed`);
  }
  if (/[;&|`$(){}\n\r]/.test(username)) {
    throw new Error(`SSH username contains injection characters`);
  }
}

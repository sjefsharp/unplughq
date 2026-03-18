/**
 * SSH Service Port — Interface for SSH operations.
 * Enables dependency injection for testing (test doubles implement this interface).
 */

export interface SSHCommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface ServerSpecs {
  osName: string;
  cpuCores: number;
  ramGb: number;
  diskGb: number;
}

export interface ISSHExecutor {
  /**
   * Test SSH connectivity and authentication.
   * @returns true if connection + auth succeeds
   */
  testConnection(params: {
    host: string;
    port: number;
    username: string;
    privateKey: string;
  }): Promise<boolean>;

  /**
   * Execute a parameterized command template on the remote server.
   * NEVER accepts raw command strings — T-01 mitigation.
   */
  executeCommand(params: {
    host: string;
    port: number;
    username: string;
    privateKey: string;
    command: SSHCommandTemplate;
  }): Promise<SSHCommandResult>;

  /**
   * Upload a file over SFTP and apply restrictive permissions.
   */
  uploadFile(params: {
    host: string;
    port: number;
    username: string;
    privateKey: string;
    remotePath: string;
    content: string;
    mode?: number;
  }): Promise<void>;

  /**
   * Detect OS and hardware specs from the remote server.
   */
  detectServerSpecs(params: {
    host: string;
    port: number;
    username: string;
    privateKey: string;
  }): Promise<ServerSpecs>;
}

/**
 * Parameterized SSH command templates (T-01 mitigation).
 * Commands are predefined with typed parameters — ZERO string concatenation.
 */
export type SSHCommandTemplate =
  | { type: 'detect-os' }
  | { type: 'detect-cpu' }
  | { type: 'detect-ram' }
  | { type: 'detect-disk' }
  | { type: 'check-docker' }
  | { type: 'install-docker' }
  | { type: 'install-caddy' }
  | { type: 'start-monitoring-agent'; params: { apiToken: string; controlPlaneUrl: string; serverId: string } }
  | { type: 'docker-pull'; params: { imageRef: string } }
  | {
      type: 'docker-run';
      params: {
        containerName: string;
        imageRef: string;
        networkName: string;
        envFile: string;
        volumeMounts?: Array<{ hostPath: string; containerPath: string; readOnly?: boolean }>;
        labels?: Record<string, string>;
      };
    }
  | { type: 'docker-start'; params: { containerName: string } }
  | { type: 'docker-stop'; params: { containerName: string } }
  | { type: 'docker-rm'; params: { containerName: string } }
  | { type: 'docker-inspect'; params: { containerName: string } }
  | { type: 'docker-ps' }
  | { type: 'docker-network-create'; params: { networkName: string } }
  | { type: 'ensure-directory'; params: { path: string; mode?: string; owner?: string } }
  | { type: 'write-env-file'; params: { path: string; content: string } }
  | { type: 'caddy-get-config' }
  | { type: 'caddy-validate-config' }
  | { type: 'caddy-add-route'; params: { routeId: string; domain: string; upstream: string } }
  | { type: 'caddy-remove-route'; params: { routeId: string } };

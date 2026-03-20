import type { SSHCommandTemplate } from '@/server/ports/ssh-executor';

export const UNPLUGHQ_NETWORK = 'unplughq';
export const UNPLUGHQ_DATA_ROOT = '/opt/unplughq/data';
export const UNPLUGHQ_ENV_ROOT = '/opt/unplughq/env';

export interface DeploymentVolumeMount {
  hostPath: string;
  containerPath: string;
  readOnly?: boolean;
}

export interface DeploymentInfrastructureInput {
  containerName: string;
  imageRef: string;
  domain: string;
  upstreamPort?: number;
  envFileContent: string;
  volumeMounts?: DeploymentVolumeMount[];
}

export interface DeploymentInfrastructurePlan {
  uploads: Array<{ remotePath: string; content: string; mode: number }>;
  setup: SSHCommandTemplate[];
  deploy: SSHCommandTemplate[];
  cleanup: SSHCommandTemplate[];
}

export function buildDeploymentPaths(containerName: string): {
  dataDir: string;
  envFile: string;
  routeId: string;
} {
  return {
    dataDir: `${UNPLUGHQ_DATA_ROOT}/${containerName}`,
    envFile: `${UNPLUGHQ_ENV_ROOT}/${containerName}.env`,
    routeId: `unplughq-${containerName}`,
  };
}

export function buildDeploymentInfrastructurePlan(
  input: DeploymentInfrastructureInput,
): DeploymentInfrastructurePlan {
  const paths = buildDeploymentPaths(input.containerName);
  const upstreamPort = input.upstreamPort ?? 80;
  const volumeMounts = input.volumeMounts ?? [
    {
      hostPath: paths.dataDir,
      containerPath: '/data',
    },
  ];

  return {
    uploads: [
      {
        remotePath: paths.envFile,
        content: input.envFileContent,
        mode: 0o600,
      },
    ],
    setup: [
      { type: 'docker-network-create', params: { networkName: UNPLUGHQ_NETWORK } },
      { type: 'ensure-directory', params: { path: UNPLUGHQ_DATA_ROOT, mode: '0750' } },
      { type: 'ensure-directory', params: { path: UNPLUGHQ_ENV_ROOT, mode: '0750' } },
      { type: 'ensure-directory', params: { path: paths.dataDir, mode: '0750' } },
      { type: 'caddy-get-config' },
      { type: 'caddy-validate-config' },
    ],
    deploy: [
      { type: 'docker-pull', params: { imageRef: input.imageRef } },
      {
        type: 'docker-run',
        params: {
          containerName: input.containerName,
          imageRef: input.imageRef,
          networkName: UNPLUGHQ_NETWORK,
          envFile: paths.envFile,
          volumeMounts,
          labels: {
            'org.unplughq.managed': 'true',
            'org.unplughq.container': input.containerName,
          },
        },
      },
      {
        type: 'caddy-add-route',
        params: {
          routeId: paths.routeId,
          domain: input.domain,
          upstream: `${input.containerName}:${upstreamPort}`,
        },
      },
      { type: 'caddy-validate-config' },
    ],
    cleanup: [
      { type: 'docker-rm', params: { containerName: input.containerName } },
      { type: 'caddy-remove-route', params: { routeId: paths.routeId } },
    ],
  };
}
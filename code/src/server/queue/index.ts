import { Queue, Worker, type Job, type ConnectionOptions } from 'bullmq';
import { createRedisConnection } from './redis';

const connection: ConnectionOptions = createRedisConnection();

// --- Queue Definitions ---

export const provisionQueue = new Queue('provision', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});

export const deployQueue = new Queue('deploy', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});

export const monitorQueue = new Queue('monitor', {
  connection,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
  },
});

// --- Worker factories ---

import { handleTestConnection, handleProvisionServer } from './handlers';

export function createProvisionWorker() {
  return new Worker(
    'provision',
    async (job: Job) => {
      switch (job.name) {
        case 'test-connection':
          return handleTestConnection(job);
        case 'provision-server':
          return handleProvisionServer(job);
        default:
          throw new Error(`Unknown provision job: ${job.name}`);
      }
    },
    { connection, concurrency: 3 },
  );
}

export function createDeployWorker() {
  return new Worker(
    'deploy',
    async (_job: Job) => {
      // Deploy worker — implemented in Sprint 2
    },
    { connection },
  );
}

export function createMonitorWorker() {
  return new Worker(
    'monitor',
    async (_job: Job) => {
      // Monitor worker — implemented in Sprint 2
    },
    { connection },
  );
}

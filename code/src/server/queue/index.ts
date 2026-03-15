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

// --- Worker stubs (BE agent implements at P4 Step 2) ---

export function createProvisionWorker() {
  return new Worker(
    'provision',
    async (_job: Job) => {
      // Provision server job handler — BE agent implements
    },
    { connection },
  );
}

export function createDeployWorker() {
  return new Worker(
    'deploy',
    async (_job: Job) => {
      // Deploy app job handler — BE agent implements
    },
    { connection },
  );
}

export function createMonitorWorker() {
  return new Worker(
    'monitor',
    async (_job: Job) => {
      // Monitor job handler — BE agent implements
    },
    { connection },
  );
}

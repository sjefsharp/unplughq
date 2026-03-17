import { Queue, Worker, type Job, type ConnectionOptions } from 'bullmq';
import { createRedisConnection } from './redis';

function getConnection(): ConnectionOptions {
  return createRedisConnection();
}

// --- Queue Definitions (lazy-initialized to avoid Redis connections at build time) ---

let _provisionQueue: Queue | null = null;
let _deployQueue: Queue | null = null;
let _monitorQueue: Queue | null = null;

export function getProvisionQueue(): Queue {
  if (!_provisionQueue) {
    _provisionQueue = new Queue('provision', {
      connection: getConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      },
    });
  }
  return _provisionQueue;
}

export function getDeployQueue(): Queue {
  if (!_deployQueue) {
    _deployQueue = new Queue('deploy', {
      connection: getConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      },
    });
  }
  return _deployQueue;
}

export function getMonitorQueue(): Queue {
  if (!_monitorQueue) {
    _monitorQueue = new Queue('monitor', {
      connection: getConnection(),
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: { count: 50 },
        removeOnFail: { count: 100 },
      },
    });
  }
  return _monitorQueue;
}

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
    { connection: getConnection(), concurrency: 3 },
  );
}

export function createDeployWorker() {
  return new Worker(
    'deploy',
    async (_job: Job) => {
      // Deploy worker — implemented in Sprint 2
    },
    { connection: getConnection() },
  );
}

export function createMonitorWorker() {
  return new Worker(
    'monitor',
    async (_job: Job) => {
      // Monitor worker — implemented in Sprint 2
    },
    { connection: getConnection() },
  );
}

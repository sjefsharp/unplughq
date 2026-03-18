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

import {
  handleDeployApp,
  handleProcessMetrics,
  handleProvisionServer,
  handleSendAlert,
  handleTestConnection,
  handleUpdateAgent,
} from './handlers';

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
  const worker = new Worker(
    'deploy',
    async (job: Job) => {
      switch (job.name) {
        case 'deploy-app':
          return handleDeployApp(job);
        default:
          throw new Error(`Unknown deploy job: ${job.name}`);
      }
    },
    { connection },
  );

  worker.on('error', (error) => {
    console.error(error);
  });

  return worker;
}

export function createMonitorWorker() {
  const worker = new Worker(
    'monitor',
    async (job: Job) => {
      switch (job.name) {
        case 'process-metrics':
          return handleProcessMetrics(job);
        case 'send-alert':
          return handleSendAlert(job);
        case 'update-agent':
          return handleUpdateAgent(job);
        default:
          throw new Error(`Unknown monitor job: ${job.name}`);
      }
    },
    { connection },
  );

  worker.on('error', (error) => {
    console.error(error);
  });

  return worker;
}

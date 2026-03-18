import { Queue, Worker, type Job, type ConnectionOptions } from 'bullmq';
import { createRedisConnection } from './redis';
import { alertEmailQueueOptions, alertEmailDlqQueueOptions } from '@/server/services/notifications/alert-email';

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

export const alertEmailQueue = new Queue('alert-email', {
  connection,
  defaultJobOptions: alertEmailQueueOptions,
});

export const alertEmailDlqQueue = new Queue('alert-email-dlq', {
  connection,
  defaultJobOptions: alertEmailDlqQueueOptions,
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
    { connection: getConnection(), concurrency: 3 },
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
    { connection: getConnection() },
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
    { connection: getConnection() },
  );

  worker.on('error', (error) => {
    console.error(error);
  });

  return worker;
}

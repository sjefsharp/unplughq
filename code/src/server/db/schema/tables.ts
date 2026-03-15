import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  real,
  pgEnum,
  jsonb,
  index,
  uniqueIndex,
  bigint,
} from 'drizzle-orm/pg-core';

// --- Enums ---

export const serverStatusEnum = pgEnum('server_status', [
  'connecting',
  'validated',
  'provisioning',
  'provisioned',
  'connection-failed',
  'provision-failed',
  'disconnected',
  'error',
]);

export const deploymentStatusEnum = pgEnum('deployment_status', [
  'pending',
  'pulling',
  'configuring',
  'provisioning-ssl',
  'starting',
  'running',
  'unhealthy',
  'stopped',
  'failed',
  'removing',
]);

export const subscriptionTierEnum = pgEnum('subscription_tier', ['free', 'pro', 'team']);

export const alertSeverityEnum = pgEnum('alert_severity', ['info', 'warning', 'critical']);

export const alertTypeEnum = pgEnum('alert_type', [
  'cpu-critical',
  'ram-critical',
  'disk-critical',
  'app-unavailable',
  'server-unreachable',
]);

// --- Users (Auth.js v5 compatible) ---

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  passwordHash: text('password_hash'),
  tier: subscriptionTierEnum('tier').default('free').notNull(),
  notificationPrefs: jsonb('notification_prefs').$type<{ emailAlerts: boolean }>().default({ emailAlerts: true }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: integer('expires_at'),
  tokenType: text('token_type'),
  scope: text('scope'),
  idToken: text('id_token'),
  sessionState: text('session_state'),
}, (table) => [
  uniqueIndex('accounts_provider_account_idx').on(table.provider, table.providerAccountId),
  index('accounts_user_id_idx').on(table.userId),
]);

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionToken: text('session_token').notNull().unique(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (table) => [
  index('sessions_user_id_idx').on(table.userId),
]);

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull().unique(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

// --- Servers ---

export const servers = pgTable('servers', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  ip: text('ip').notNull(),
  sshPort: integer('ssh_port').default(22).notNull(),
  sshUser: text('ssh_user').notNull(),
  /** AES-256-GCM encrypted blob: base64(iv + ciphertext + authTag) — I-01 mitigation */
  sshKeyEncrypted: text('ssh_key_encrypted'),
  status: serverStatusEnum('status').default('connecting').notNull(),
  osName: text('os_name'),
  cpuCores: integer('cpu_cores'),
  ramGb: real('ram_gb'),
  diskGb: real('disk_gb'),
  /** Per-server API token for monitoring agent authentication — S-03 mitigation */
  apiToken: text('api_token'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => [
  index('servers_tenant_id_idx').on(table.tenantId),
  index('servers_status_idx').on(table.status),
]);

// --- Deployments ---

export const deployments = pgTable('deployments', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  serverId: uuid('server_id')
    .notNull()
    .references(() => servers.id, { onDelete: 'cascade' }),
  catalogAppId: text('catalog_app_id').notNull(),
  name: text('name').notNull(),
  domain: text('domain').notNull(),
  accessUrl: text('access_url'),
  status: deploymentStatusEnum('status').default('pending').notNull(),
  containerName: text('container_name').notNull(),
  config: text('config'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => [
  index('deployments_tenant_id_idx').on(table.tenantId),
  index('deployments_server_id_idx').on(table.serverId),
  index('deployments_status_idx').on(table.status),
]);

// --- Alerts ---

export const alerts = pgTable('alerts', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  serverId: uuid('server_id')
    .notNull()
    .references(() => servers.id, { onDelete: 'cascade' }),
  appId: uuid('app_id').references(() => deployments.id, { onDelete: 'set null' }),
  severity: alertSeverityEnum('severity').notNull(),
  type: alertTypeEnum('type').notNull(),
  message: text('message').notNull(),
  notificationSent: boolean('notification_sent').default(false).notNull(),
  acknowledgedAt: timestamp('acknowledged_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => [
  index('alerts_tenant_id_created_at_idx').on(table.tenantId, table.createdAt),
  index('alerts_server_id_idx').on(table.serverId),
]);

// --- Audit Log (append-only — R-01 mitigation, NFR-013) ---

export const auditLog = pgTable('audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  details: jsonb('details').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => [
  index('audit_log_tenant_id_created_at_idx').on(table.tenantId, table.createdAt),
]);

// --- Metrics Snapshots (time-series server resource data — F3) ---

export const metricsSnapshots = pgTable('metrics_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  serverId: uuid('server_id')
    .notNull()
    .references(() => servers.id, { onDelete: 'cascade' }),
  timestamp: timestamp('timestamp', { mode: 'date' }).notNull(),
  cpuPercent: real('cpu_percent').notNull(),
  ramUsedBytes: bigint('ram_used_bytes', { mode: 'bigint' }).notNull(),
  ramTotalBytes: bigint('ram_total_bytes', { mode: 'bigint' }).notNull(),
  diskUsedBytes: bigint('disk_used_bytes', { mode: 'bigint' }).notNull(),
  diskTotalBytes: bigint('disk_total_bytes', { mode: 'bigint' }).notNull(),
  networkRxBytesPerSec: bigint('network_rx_bytes_per_sec', { mode: 'bigint' }).notNull(),
  networkTxBytesPerSec: bigint('network_tx_bytes_per_sec', { mode: 'bigint' }).notNull(),
  containers: jsonb('containers').$type<Array<{
    id: string;
    name: string;
    status: string;
    diskUsageBytes?: number;
  }>>().default([]).notNull(),
}, (table) => [
  index('metrics_server_id_timestamp_idx').on(table.serverId, table.timestamp),
]);

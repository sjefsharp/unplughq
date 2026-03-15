import { pgTable, text, timestamp, uuid, integer, boolean, real, pgEnum } from 'drizzle-orm/pg-core';

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

// --- Users (Auth.js compatible) ---
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  passwordHash: text('password_hash'),
  tier: subscriptionTierEnum('tier').default('free').notNull(),
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
});

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionToken: text('session_token').notNull().unique(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

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
  sshKeyEncrypted: text('ssh_key_encrypted'),
  status: serverStatusEnum('status').default('connecting').notNull(),
  osName: text('os_name'),
  cpuCores: integer('cpu_cores'),
  ramGb: real('ram_gb'),
  diskGb: real('disk_gb'),
  apiToken: text('api_token'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

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
});

// --- Alerts ---
export const alerts = pgTable('alerts', {
  id: uuid('id').defaultRandom().primaryKey(),
  serverId: uuid('server_id')
    .notNull()
    .references(() => servers.id, { onDelete: 'cascade' }),
  appId: uuid('app_id').references(() => deployments.id, { onDelete: 'set null' }),
  severity: text('severity').notNull(),
  type: text('type').notNull(),
  message: text('message').notNull(),
  notificationSent: boolean('notification_sent').default(false).notNull(),
  acknowledgedAt: timestamp('acknowledged_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// --- Audit Log ---
export const auditLog = pgTable('audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  action: text('action').notNull(),
  target: text('target'),
  outcome: text('outcome').notNull(),
  metadata: text('metadata'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

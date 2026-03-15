import { relations } from 'drizzle-orm';
import {
  users,
  accounts,
  sessions,
  servers,
  deployments,
  alerts,
  auditLog,
  metricsSnapshots,
} from './tables';

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  servers: many(servers),
  deployments: many(deployments),
  alerts: many(alerts),
  auditLogs: many(auditLog),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const serversRelations = relations(servers, ({ one, many }) => ({
  tenant: one(users, { fields: [servers.tenantId], references: [users.id] }),
  deployments: many(deployments),
  alerts: many(alerts),
  metricsSnapshots: many(metricsSnapshots),
}));

export const deploymentsRelations = relations(deployments, ({ one }) => ({
  tenant: one(users, { fields: [deployments.tenantId], references: [users.id] }),
  server: one(servers, { fields: [deployments.serverId], references: [servers.id] }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  tenant: one(users, { fields: [alerts.tenantId], references: [users.id] }),
  server: one(servers, { fields: [alerts.serverId], references: [servers.id] }),
  deployment: one(deployments, { fields: [alerts.appId], references: [deployments.id] }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  tenant: one(users, { fields: [auditLog.tenantId], references: [users.id] }),
}));

export const metricsSnapshotsRelations = relations(metricsSnapshots, ({ one }) => ({
  server: one(servers, { fields: [metricsSnapshots.serverId], references: [servers.id] }),
}));

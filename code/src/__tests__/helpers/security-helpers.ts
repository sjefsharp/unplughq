/**
 * Security Mock Helpers — CSRF, audit logging, and secrets rotation helpers for tests.
 * Based on threat-model.md S-04/S-06 (CSRF), R-01 (audit logging), B-260 (secrets rotation).
 */
import { randomBytes } from 'crypto';

// --- CSRF Middleware Mock ---

const sessionTokens = new Map<string, string>();

export function generateCsrfToken(sessionId: string): string {
  const token = randomBytes(32).toString('hex');
  sessionTokens.set(sessionId, token);
  return token;
}

export function validateCsrfToken(sessionId: string, token: string): boolean {
  const storedToken = sessionTokens.get(sessionId);
  if (!storedToken) return false;
  // Constant-time comparison
  if (storedToken.length !== token.length) return false;
  let result = 0;
  for (let i = 0; i < storedToken.length; i++) {
    result |= storedToken.charCodeAt(i) ^ token.charCodeAt(i);
  }
  return result === 0;
}

export function resetCsrfTokens(): void {
  sessionTokens.clear();
}

// --- Audit Logging Mock ---

interface AuditEntry {
  id: string;
  tenantId: string;
  userId: string;
  action: string;
  targetType: string;
  targetId: string;
  outcome: 'success' | 'failure';
  timestamp: string;
  metadata?: Record<string, unknown>;
}

const auditLog: AuditEntry[] = [];
let auditCounter = 0;

export function createAuditEntry(params: {
  tenantId: string;
  userId: string;
  action: string;
  targetType: string;
  targetId: string;
  outcome: 'success' | 'failure';
  metadata?: Record<string, unknown>;
}): AuditEntry {
  const entry: AuditEntry = {
    id: `audit-${++auditCounter}`,
    timestamp: new Date().toISOString(),
    ...params,
  };
  auditLog.push(entry);
  return entry;
}

export function queryAuditLog(
  tenantId: string,
  options: { page?: number; pageSize?: number; retentionDays?: number } = {},
): { entries: AuditEntry[]; total: number; page: number; pageSize: number } {
  const { page = 1, pageSize = 20, retentionDays = 90 } = options;
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const filtered = auditLog.filter(
    (e) => e.tenantId === tenantId && new Date(e.timestamp) >= cutoff,
  );

  const start = (page - 1) * pageSize;
  const entries = filtered.slice(start, start + pageSize);

  return { entries, total: filtered.length, page, pageSize };
}

export function getAuditLogEntries(tenantId: string): AuditEntry[] {
  return auditLog.filter((e) => e.tenantId === tenantId);
}

export function resetAuditLog(): void {
  auditLog.length = 0;
  auditCounter = 0;
}

// --- Secrets Rotation Mock ---

interface KeyRecord {
  id: string;
  serverId: string;
  keyType: 'ssh' | 'api-token';
  active: boolean;
  createdAt: string;
  revokedAt: string | null;
}

const keyStore: KeyRecord[] = [];
let keyCounter = 0;

export function addKey(serverId: string, keyType: 'ssh' | 'api-token'): KeyRecord {
  const key: KeyRecord = {
    id: `key-${++keyCounter}`,
    serverId,
    keyType,
    active: true,
    createdAt: new Date().toISOString(),
    revokedAt: null,
  };
  keyStore.push(key);
  return key;
}

export function rotateKey(serverId: string, keyType: 'ssh' | 'api-token'): { oldKey: KeyRecord; newKey: KeyRecord } {
  const oldKey = keyStore.find(
    (k) => k.serverId === serverId && k.keyType === keyType && k.active,
  );
  if (!oldKey) throw new Error(`No active ${keyType} key for server ${serverId}`);
  oldKey.active = false;
  oldKey.revokedAt = new Date().toISOString();
  const newKey = addKey(serverId, keyType);
  return { oldKey, newKey };
}

export function getActiveKey(serverId: string, keyType: 'ssh' | 'api-token'): KeyRecord | null {
  return keyStore.find(
    (k) => k.serverId === serverId && k.keyType === keyType && k.active,
  ) ?? null;
}

export function resetKeyStore(): void {
  keyStore.length = 0;
  keyCounter = 0;
}

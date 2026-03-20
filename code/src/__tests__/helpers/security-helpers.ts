/**
 * Security Mock Helpers — combined CSRF, Audit Log, and Key Management for unit/integration tests.
 * Imported by: csrf-middleware.test.ts, audit-logging.test.ts, secrets-rotation.test.ts
 */
import { randomBytes } from 'node:crypto';

// ─── CSRF Token Store ───────────────────────────────────────────────
const csrfTokens = new Map<string, string>();

export function generateCsrfToken(sessionId: string): string {
  const token = randomBytes(32).toString('hex'); // 64 hex chars = 256 bits
  csrfTokens.set(sessionId, token);
  return token;
}

export function validateCsrfToken(sessionId: string, token: string): boolean {
  if (!token) return false;
  const stored = csrfTokens.get(sessionId);
  if (!stored) return false;
  return stored === token;
}

export function resetCsrfTokens(): void {
  csrfTokens.clear();
}

// ─── Audit Log Store ────────────────────────────────────────────────
interface AuditEntry {
  id: string;
  tenantId: string;
  userId: string;
  action: string;
  targetType: string;
  targetId: string;
  outcome: 'success' | 'failure';
  metadata?: Record<string, string>;
  timestamp: string;
}

const auditLog: AuditEntry[] = [];
let auditCounter = 0;

export function createAuditEntry(input: {
  tenantId: string;
  userId: string;
  action: string;
  targetType: string;
  targetId: string;
  outcome: 'success' | 'failure';
  metadata?: Record<string, string>;
}): AuditEntry {
  const entry: AuditEntry = {
    id: `audit-${++auditCounter}`,
    ...input,
    timestamp: new Date().toISOString(),
  };
  auditLog.push(entry);
  return entry;
}

export function queryAuditLog(
  tenantId: string,
  options: { retentionDays?: number; page?: number; pageSize?: number } = {},
): { entries: AuditEntry[]; total: number; page: number; pageSize: number } {
  const { retentionDays = 90, page = 1, pageSize = 20 } = options;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);

  const filtered = auditLog.filter((e) => {
    if (e.tenantId !== tenantId) return false;
    if (new Date(e.timestamp) <= cutoff) return false;
    return true;
  });

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const entries = filtered.slice(start, start + pageSize);

  return { entries, total, page, pageSize };
}

export function getAuditLogEntries(tenantId: string): AuditEntry[] {
  return auditLog.filter((e) => e.tenantId === tenantId);
}

export function resetAuditLog(): void {
  auditLog.length = 0;
  auditCounter = 0;
}

// ─── Key Store (Secrets Rotation) ───────────────────────────────────
interface KeyRecord {
  id: string;
  tenantId: string;
  serverId: string;
  keyType: string;
  keyValue: string;
  isActive: boolean;
  previousKeyId: string | null;
  createdAt: string;
  revokedAt: string | null;
}

const keyStore: KeyRecord[] = [];
let keyCounter = 0;

export function addKey(input: {
  tenantId: string;
  serverId: string;
  keyType: string;
  keyValue: string;
}): KeyRecord {
  const key: KeyRecord = {
    id: `key-${++keyCounter}`,
    tenantId: input.tenantId,
    serverId: input.serverId,
    keyType: input.keyType,
    keyValue: input.keyValue,
    isActive: true,
    previousKeyId: null,
    createdAt: new Date().toISOString(),
    revokedAt: null,
  };
  keyStore.push(key);
  return key;
}

export function rotateKey(input: {
  tenantId: string;
  serverId: string;
  keyType: string;
  newKeyValue: string;
}): KeyRecord {
  const oldKey = keyStore.find(
    (k) =>
      k.tenantId === input.tenantId &&
      k.serverId === input.serverId &&
      k.keyType === input.keyType &&
      k.isActive,
  );

  if (oldKey) {
    oldKey.isActive = false;
    oldKey.revokedAt = new Date().toISOString();
  }

  const newKey: KeyRecord = {
    id: `key-${++keyCounter}`,
    tenantId: input.tenantId,
    serverId: input.serverId,
    keyType: input.keyType,
    keyValue: input.newKeyValue,
    isActive: true,
    previousKeyId: oldKey?.id ?? null,
    createdAt: new Date().toISOString(),
    revokedAt: null,
  };
  keyStore.push(newKey);
  return newKey;
}

export function getActiveKey(
  tenantId: string,
  serverId: string,
  keyType: string,
): KeyRecord | null {
  return (
    keyStore.find(
      (k) =>
        k.tenantId === tenantId &&
        k.serverId === serverId &&
        k.keyType === keyType &&
        k.isActive,
    ) ?? null
  );
}

export function resetKeyStore(): void {
  keyStore.length = 0;
  keyCounter = 0;
}

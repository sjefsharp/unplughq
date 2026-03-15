import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { hkdf } from 'node:crypto';

/**
 * SSH key encryption at rest using AES-256-GCM (I-01 mitigation).
 * Per-tenant key derived via HKDF from master key.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getMasterKey(): Buffer {
  const key = process.env.ENCRYPTION_MASTER_KEY;
  if (!key || key.length < 32) {
    throw new Error('ENCRYPTION_MASTER_KEY must be set and at least 32 characters');
  }
  return Buffer.from(key, 'utf-8').subarray(0, 32);
}

async function deriveTenantKey(tenantId: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    hkdf('sha256', getMasterKey(), tenantId, 'unplughq-ssh-key-encryption', 32, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(Buffer.from(derivedKey));
    });
  });
}

export async function encryptSSHKey(plaintext: string, tenantId: string): Promise<string> {
  const key = await deriveTenantKey(tenantId);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Format: base64(iv + ciphertext + authTag)
  return Buffer.concat([iv, encrypted, authTag]).toString('base64');
}

export async function decryptSSHKey(encoded: string, tenantId: string): Promise<string> {
  const key = await deriveTenantKey(tenantId);
  const data = Buffer.from(encoded, 'base64');

  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(data.length - AUTH_TAG_LENGTH);
  const ciphertext = data.subarray(IV_LENGTH, data.length - AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf-8');
}

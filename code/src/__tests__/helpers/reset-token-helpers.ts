/**
 * Password Reset Token Helpers — in-memory token store for unit tests.
 * Implements the test contract API without database dependency.
 */
import { randomBytes } from 'node:crypto';
import { hashPassword, verifyPassword } from './password-helpers';

interface TokenRecord {
  token: string;
  email: string;
  expiresAt: number;
  used: boolean;
}

// In-memory stores
const tokenStore: TokenRecord[] = [];
const userStore = new Map<string, { email: string; passwordHash: string }>();

// Seed a test user for enumeration tests
userStore.set('existing@example.com', {
  email: 'existing@example.com',
  passwordHash: '', // Will be set on first hash
});

export async function generateResetToken(
  email: string,
): Promise<{ token: string; expiresAt: number }> {
  // Invalidate all existing tokens for this email
  for (const record of tokenStore) {
    if (record.email === email) {
      record.used = true;
    }
  }

  const token = randomBytes(32).toString('base64url'); // ≥256 bits → ≥43 chars
  const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

  tokenStore.push({ token, email, expiresAt, used: false });

  return { token, expiresAt };
}

export async function validateResetToken(
  token: string,
): Promise<{ valid: boolean; email?: string; reason?: string }> {
  if (!token || token.length < 10) {
    return { valid: false, reason: 'Invalid token' };
  }

  const record = tokenStore.find((r) => r.token === token);
  if (!record) {
    return { valid: false, reason: 'Invalid token' };
  }

  if (record.used) {
    return { valid: false, reason: 'Token already used/consumed' };
  }

  if (Date.now() > record.expiresAt) {
    return { valid: false, reason: 'Token has expired' };
  }

  return { valid: true, email: record.email };
}

export async function consumeResetToken(
  token: string,
  newPassword: string,
): Promise<{ success: boolean }> {
  const validation = await validateResetToken(token);
  if (!validation.valid || !validation.email) {
    return { success: false };
  }

  // Mark token as used
  const record = tokenStore.find((r) => r.token === token);
  if (record) record.used = true;

  // Update user password
  const hash = await hashPassword(newPassword);
  const user = userStore.get(validation.email);
  if (user) {
    user.passwordHash = hash;
  } else {
    userStore.set(validation.email, { email: validation.email, passwordHash: hash });
  }

  return { success: true };
}

export async function requestPasswordReset(
  email: string,
): Promise<{ message: string }> {
  // I-02: Always return the same message regardless of email existence
  const user = userStore.get(email);
  if (user) {
    await generateResetToken(email);
  }
  // Consistent delay to prevent timing attacks
  await new Promise((resolve) => setTimeout(resolve, 10));
  return { message: 'If an account exists with this email, a reset link has been sent.' };
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<{ success: boolean }> {
  const user = userStore.get(email);
  if (!user || !user.passwordHash) {
    return { success: false };
  }
  const valid = await verifyPassword(password, user.passwordHash);
  return { success: valid };
}

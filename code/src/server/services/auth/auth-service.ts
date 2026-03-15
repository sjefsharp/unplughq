import { randomBytes } from 'node:crypto';
import { db } from '@/server/db';
import { users, verificationTokens } from '@/server/db/schema';
import { hashPassword } from '@/server/services/auth/password-hashing';
import { eq, and, gt } from 'drizzle-orm';
import { logger } from '@/server/lib/logger';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W]).{12,}$/;
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour (FR-F4-004, S-05)

export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (password.length < 12) {
    return { valid: false, message: 'Password must be at least 12 characters' };
  }
  if (!PASSWORD_REGEX.test(password)) {
    return {
      valid: false,
      message: 'Password must include uppercase, lowercase, and at least one number or symbol',
    };
  }
  return { valid: true };
}

/**
 * Register a new user with Argon2id-hashed password (BR-F4-002).
 * Silently rejects duplicate emails — I-02 / BR-F4-003 mitigation.
 */
export async function registerUser(params: {
  email: string;
  password: string;
  name: string;
}): Promise<{ success: boolean; userId?: string }> {
  const email = params.email.toLowerCase().trim();

  // Check password strength
  const strength = validatePasswordStrength(params.password);
  if (!strength.valid) {
    return { success: false };
  }

  // BR-F4-003: Silently reject duplicates (I-02 — no user enumeration)
  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (existing) {
    return { success: false };
  }

  const passwordHash = await hashPassword(params.password);

  const result = await db
    .insert(users)
    .values({
      email,
      name: params.name,
      passwordHash,
      tier: 'free',
    })
    .returning({ id: users.id });

  if (result.length === 0) {
    return { success: false };
  }

  logger.info({ userId: result[0].id }, 'User registered');
  return { success: true, userId: result[0].id };
}

/**
 * Generate a cryptographically random password reset token (256-bit, S-05).
 * Invalidates all existing tokens for the user.
 * Always returns success to prevent user enumeration (I-02).
 */
export async function createPasswordResetToken(email: string): Promise<{ success: true }> {
  const normalizedEmail = email.toLowerCase().trim();

  // Invalidate existing tokens for this identifier
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, normalizedEmail));

  // Check if user exists — but ALWAYS return success (I-02)
  const user = await db.query.users.findFirst({
    where: eq(users.email, normalizedEmail),
  });

  if (user) {
    // Generate 256-bit cryptographically random token (S-05)
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

    await db.insert(verificationTokens).values({
      identifier: normalizedEmail,
      token,
      expires,
    });

    logger.info({ email: normalizedEmail }, 'Password reset token created');
    // In production, send email here via notification service
  }

  // I-02: Always return success — "If an account exists, a reset link was sent."
  return { success: true };
}

/**
 * Reset password using a valid token (FR-F4-004).
 */
export async function resetPassword(params: {
  token: string;
  newPassword: string;
}): Promise<{ success: boolean }> {
  const strength = validatePasswordStrength(params.newPassword);
  if (!strength.valid) {
    return { success: false };
  }

  // Find valid, unexpired token
  const tokenRecord = await db.query.verificationTokens.findFirst({
    where: and(
      eq(verificationTokens.token, params.token),
      gt(verificationTokens.expires, new Date()),
    ),
  });

  if (!tokenRecord) {
    return { success: false };
  }

  // Hash new password
  const passwordHash = await hashPassword(params.newPassword);

  // Update user's password
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.email, tokenRecord.identifier));

  // Invalidate ALL tokens for this identifier (one-time use)
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, tokenRecord.identifier));

  logger.info({ email: tokenRecord.identifier }, 'Password reset completed');
  return { success: true };
}

/**
 * Update user profile (FR-F4-005).
 */
export async function updateUserProfile(
  userId: string,
  data: { name?: string },
): Promise<{ success: boolean }> {
  await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return { success: true };
}

/**
 * Update notification preferences (FR-F4-005).
 */
export async function updateNotificationPrefs(
  userId: string,
  prefs: { emailAlerts: boolean },
): Promise<{ success: boolean }> {
  await db
    .update(users)
    .set({ notificationPrefs: prefs, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return { success: true };
}

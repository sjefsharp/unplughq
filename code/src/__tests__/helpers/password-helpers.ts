/**
 * Password Helpers — wraps production password hashing for tests.
 * NOTE: Production verifyPassword has (hash, plaintext) order but
 * the test contract specifies (plaintext, hash). This wrapper adapts
 * to the test contract API. Filed as BUG: parameter order mismatch.
 */
import {
  hashPassword as prodHashPassword,
  verifyPassword as prodVerifyPassword,
} from '@/server/services/auth/password-hashing';

export const hashPassword = prodHashPassword;

/**
 * Verify password — adapted to test contract API (plaintext, hash).
 * Production API has (hash, plaintext) — see BUG report.
 */
export async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  return prodVerifyPassword(hash, plaintext);
}

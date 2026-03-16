/**
 * Password Helpers — re-exports production password hashing for tests.
 * AB#246 fixed: verifyPassword now has (plaintext, hash) order matching the API contract.
 */
import {
  hashPassword,
  verifyPassword,
} from '@/server/services/auth/password-hashing';

export { hashPassword, verifyPassword };

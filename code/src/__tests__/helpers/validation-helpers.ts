/**
 * Validation Helpers — password strength & email validation for unit tests.
 * Implements the test contract API with granular error reporting.
 */

const PASSWORD_MIN_LENGTH = 12;

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[\d\W]/.test(password)) {
    errors.push('Password must contain at least one number or special character');
  }

  return { valid: errors.length === 0, errors };
}

export function validateEmail(email: string): { valid: boolean } {
  if (!email || email.length === 0) return { valid: false };
  // RFC-ish email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return { valid: emailRegex.test(email) };
}

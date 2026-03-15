/**
 * Signup Helpers — in-memory user registration for unit tests.
 * Implements the test contract API without database dependency.
 */
import { hashPassword } from './password-helpers';
import { validatePassword, validateEmail } from './validation-helpers';

interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
}

const userDb = new Map<string, UserRecord>();

// Seed an existing user for duplicate tests
userDb.set('existing@example.com', {
  id: 'existing-user-id',
  email: 'existing@example.com',
  name: 'Existing User',
  passwordHash: '$argon2id$v=19$m=65536,t=3,p=1$seed$hash',
});

export async function signupUser(input: {
  email: string;
  password: string;
  name: string;
}): Promise<{
  success: boolean;
  message: string;
  user: { id: string; email: string };
}> {
  const email = input.email.toLowerCase().trim();

  // Validate password
  const pwResult = validatePassword(input.password);
  if (!pwResult.valid) {
    return {
      success: false,
      message: 'Please check your input and try again.',
      user: { id: '', email: '' },
    };
  }

  // Validate email
  const emailResult = validateEmail(email);
  if (!emailResult.valid) {
    return {
      success: false,
      message: 'Please check your input and try again.',
      user: { id: '', email: '' },
    };
  }

  // I-02: Check for duplicate but return generic message
  if (userDb.has(email)) {
    // Constant-time: hash the password anyway to prevent timing side-channel
    await hashPassword(input.password);
    return {
      success: false,
      message: 'Please check your input and try again.',
      user: { id: '', email: '' },
    };
  }

  const passwordHash = await hashPassword(input.password);
  const id = crypto.randomUUID();

  userDb.set(email, { id, email, name: input.name, passwordHash });

  return {
    success: true,
    message: 'Account created successfully.',
    user: { id, email },
  };
}

export async function getUserCount(email: string): Promise<number> {
  return userDb.has(email.toLowerCase().trim()) ? 1 : 0;
}

export async function getStoredPasswordHash(userId: string): Promise<string> {
  for (const user of userDb.values()) {
    if (user.id === userId) {
      return user.passwordHash;
    }
  }
  throw new Error(`User not found: ${userId}`);
}

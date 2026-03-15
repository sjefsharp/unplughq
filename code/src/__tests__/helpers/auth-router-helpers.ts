/**
 * Auth Router Mock Helpers — mock tRPC auth caller for integration tests.
 * Simulates the full auth flow without real database/Redis.
 */
import { hashPassword, verifyPassword } from './password-helpers';
import { validatePassword } from './validation-helpers';
import { randomBytes } from 'node:crypto';

interface MockUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  notificationPrefs: { emailAlerts: boolean };
}

interface MockSession {
  sessionToken: string;
  userId: string;
  expires: Date;
  valid: boolean;
}

interface SentEmail {
  to: string;
  subject: string;
}

const users = new Map<string, MockUser>();
const sessions = new Map<string, MockSession>();
const resetTokens = new Map<string, { email: string; expires: Date }>();
const loginFailures = new Map<string, number>();
const sentEmails: SentEmail[] = [];

export async function registerUser(input: {
  email: string;
  password: string;
  name: string;
}): Promise<{
  success: boolean;
  message?: string;
  user: { id: string; email: string };
}> {
  const email = input.email.toLowerCase().trim();

  const pwCheck = validatePassword(input.password);
  if (!pwCheck.valid) {
    throw new Error('password validation failed');
  }

  if (users.has(email)) {
    // I-02: generic response — don't reveal email exists
    return {
      success: false,
      message: 'Please check your input and try again.',
      user: { id: '', email: '' },
    };
  }

  const hash = await hashPassword(input.password);
  const id = crypto.randomUUID();
  users.set(email, {
    id,
    email,
    name: input.name,
    passwordHash: hash,
    notificationPrefs: { emailAlerts: true },
  });

  return { success: true, user: { id, email } };
}

export async function loginUser(
  email: string,
  password: string,
): Promise<{
  user?: { id: string; email: string };
  sessionToken?: string;
  error?: { message: string };
}> {
  const normalizedEmail = email.toLowerCase().trim();

  // Check lockout
  const failures = loginFailures.get(normalizedEmail) ?? 0;
  if (failures >= 10) {
    return { error: { message: 'Account temporarily locked due to too many failed attempts' } };
  }

  const user = users.get(normalizedEmail);
  if (!user) {
    loginFailures.set(normalizedEmail, failures + 1);
    return { error: { message: 'Invalid email or password' } };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    loginFailures.set(normalizedEmail, failures + 1);
    return { error: { message: 'Invalid email or password' } };
  }

  // Reset failures on success
  loginFailures.delete(normalizedEmail);

  const sessionToken = randomBytes(32).toString('hex');
  sessions.set(sessionToken, {
    sessionToken,
    userId: user.id,
    expires: new Date(Date.now() + 30 * 60 * 1000),
    valid: true,
  });

  return { user: { id: user.id, email: user.email }, sessionToken };
}

export async function loginUserWithCookies(
  email: string,
  password: string,
): Promise<{
  cookies: Array<{
    name: string;
    httpOnly: boolean;
    secure: boolean;
    sameSite: string;
  }>;
}> {
  await loginUser(email, password);
  return {
    cookies: [
      {
        name: '__Secure-authjs.session-token',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
      },
    ],
  };
}

export async function logoutUser(sessionToken: string): Promise<void> {
  const session = sessions.get(sessionToken);
  if (session) {
    session.valid = false;
    sessions.delete(sessionToken);
  }
}

export async function validateSession(
  sessionToken: string,
): Promise<{ valid: boolean }> {
  const session = sessions.get(sessionToken);
  if (!session || !session.valid) return { valid: false };
  if (session.expires < new Date()) return { valid: false };
  return { valid: true };
}

export async function findSessionInDatabase(
  sessionToken: string,
): Promise<unknown | null> {
  return sessions.get(sessionToken) ?? null;
}

export async function requestPasswordReset(
  email: string,
): Promise<{ message: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  const user = users.get(normalizedEmail);

  if (user) {
    const token = randomBytes(32).toString('hex');
    resetTokens.set(token, {
      email: normalizedEmail,
      expires: new Date(Date.now() + 60 * 60 * 1000),
    });
    sentEmails.push({ to: normalizedEmail, subject: 'Password Reset' });
  }

  return { message: 'If an account exists with this email, a reset link has been sent.' };
}

export async function extractResetToken(email: string): Promise<string> {
  for (const [token, data] of resetTokens.entries()) {
    if (data.email === email.toLowerCase().trim()) {
      return token;
    }
  }
  throw new Error(`No reset token found for ${email}`);
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  const data = resetTokens.get(token);
  if (!data) throw new Error('Invalid token');

  const user = users.get(data.email);
  if (!user) throw new Error('User not found');

  user.passwordHash = await hashPassword(newPassword);
  resetTokens.delete(token);
}

export async function getSentEmails(
  recipientEmail: string,
): Promise<Array<{ subject: string }>> {
  return sentEmails.filter(
    (e) => e.to === recipientEmail.toLowerCase().trim(),
  );
}

export async function getPasswordHashByEmail(email: string): Promise<string> {
  const user = users.get(email.toLowerCase().trim());
  if (!user) throw new Error(`No user with email ${email}`);
  return user.passwordHash;
}

export function createAuthCaller(ctx: {
  session: { user: { id: string; email: string; name: string; tier?: string } } | null;
  userId: string | null;
  tenantId: string | null;
  tier: string | null;
}) {
  // Ensure the mock user exists when ctx has a session
  if (ctx.session?.user) {
    const email = ctx.session.user.email;
    if (!users.has(email)) {
      users.set(email, {
        id: ctx.session.user.id,
        email,
        name: ctx.session.user.name ?? 'Test User',
        passwordHash: '',
        notificationPrefs: { emailAlerts: true },
      });
    }
  }

  return {
    auth: {
      async session() {
        if (!ctx.session) return null;
        return ctx.session;
      },
      async updateProfile(data: { name?: string; email?: string }) {
        if (!ctx.session) throw new Error('UNAUTHORIZED');
        const user = users.get(ctx.session.user.email);
        if (user && data.name) {
          user.name = data.name;
          ctx.session.user.name = data.name;
        }
        if (data.email) {
          return { emailChangeRequiresConfirmation: true };
        }
        return { success: true };
      },
      async updateNotificationPrefs(prefs: { emailAlerts: boolean }) {
        if (!ctx.session) throw new Error('UNAUTHORIZED');
        const user = users.get(ctx.session.user.email);
        if (user) user.notificationPrefs = prefs;
        return { success: true };
      },
    },
    user: {
      async me() {
        if (!ctx.session) throw new Error('UNAUTHORIZED');
        const user = users.get(ctx.session.user.email);
        return {
          ...ctx.session.user,
          notificationPrefs: user?.notificationPrefs ?? { emailAlerts: true },
        };
      },
    },
  };
}

export async function simulateSessionInactivity(
  sessionToken: string,
): Promise<void> {
  const session = sessions.get(sessionToken);
  if (session) {
    session.expires = new Date(0);
    session.valid = false;
  }
}

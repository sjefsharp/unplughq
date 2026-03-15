/**
 * Integration Tests — Auth tRPC Router
 * Stories: S-194, S-195, S-196, S-197
 * Covers: Full auth flow (register→login→session→logout→reset), account settings
 * Security: S-01 (credential stuffing), S-02 (session cookies), I-02 (user enumeration)
 *
 * Tests the tRPC router integration with Auth.js, database, and session management.
 * Uses createTestContext per api-contracts.md §6.2.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { validUser, validUser2, passwords, emails } from '../helpers/test-fixtures';
import { createTestContext, createUnauthenticatedContext } from '../helpers/test-context';

// import { appRouter } from '@/server/trpc/router';
// import { createCallerFactory } from '@/server/trpc';

describe('Auth tRPC Router Integration', () => {
  describe('Registration Flow — S-194', () => {
    it('should register a new user with valid credentials', async () => {
      const result = await registerUser({
        email: `integration-${Date.now()}@example.com`,
        password: passwords.valid,
        name: validUser.name,
      });

      expect(result.success).toBe(true);
      expect(result.user.email).toBeDefined();
    });

    it('should store password as Argon2id hash during registration', async () => {
      const email = `argon2-int-${Date.now()}@example.com`;
      await registerUser({
        email,
        password: passwords.valid,
        name: 'Argon2 Test',
      });

      const storedHash = await getPasswordHashByEmail(email);
      expect(storedHash).toMatch(/^\$argon2id\$/);
      expect(storedHash).not.toBe(passwords.valid);
    });

    it('should reject registration with weak password', async () => {
      await expect(
        registerUser({
          email: `weak-pw-${Date.now()}@example.com`,
          password: passwords.tooShort,
          name: 'Weak PW',
        })
      ).rejects.toThrow(/password|validation/i);
    });

    it('should return generic response for duplicate email (I-02)', async () => {
      const email = `dup-${Date.now()}@example.com`;
      await registerUser({ email, password: passwords.valid, name: 'First' });

      // Second registration with same email should not reveal it exists
      const result = await registerUser({
        email,
        password: passwords.valid,
        name: 'Second',
      });

      // Must not indicate the email is already taken
      if (!result.success) {
        expect(result.message).not.toMatch(/exist|duplicate|registered|taken/i);
      }
    });
  });

  describe('Login Flow — S-195', () => {
    it('should authenticate with valid credentials and establish a session', async () => {
      const email = `login-${Date.now()}@example.com`;
      await registerUser({ email, password: passwords.valid, name: 'Login Test' });

      const session = await loginUser(email, passwords.valid);

      expect(session).toBeDefined();
      expect(session.user.email).toBe(email);
    });

    it('should return generic error for invalid credentials (I-02 — S-195 Scenario: Failed login)', async () => {
      const result = await loginUser('nonexistent@example.com', 'WrongPassword123!');

      expect(result.error).toBeDefined();
      expect(result.error.message).toBe('Invalid email or password');
      // Must not reveal whether email or password was wrong
      expect(result.error.message).not.toMatch(/email not found|wrong password/i);
    });

    it('should return same error for wrong password on existing account (I-02)', async () => {
      const email = `exists-${Date.now()}@example.com`;
      await registerUser({ email, password: passwords.valid, name: 'Exists' });

      const result = await loginUser(email, 'WrongPassword123!');
      expect(result.error.message).toBe('Invalid email or password');
    });

    it('should enforce account lockout after 10 failed attempts (S-01 / SEC-AUTH-04)', async () => {
      const email = `lockout-${Date.now()}@example.com`;
      await registerUser({ email, password: passwords.valid, name: 'Lockout Test' });

      // Attempt 10 failed logins
      for (let i = 0; i < 10; i++) {
        await loginUser(email, 'WrongPassword123!');
      }

      // 11th attempt should be locked even with correct password
      const result = await loginUser(email, passwords.valid);
      expect(result.error).toBeDefined();
      expect(result.error.message).toMatch(/locked|too many/i);
    });
  });

  describe('Session Management — S-195 Scenario: Session cookie attributes / S-02', () => {
    it('should create an authenticated session with proper cookie attributes (S-02)', async () => {
      const email = `session-${Date.now()}@example.com`;
      await registerUser({ email, password: passwords.valid, name: 'Session Test' });

      const sessionResponse = await loginUserWithCookies(email, passwords.valid);

      // SEC-AUTH-03: HttpOnly, Secure, SameSite=Lax cookies
      const sessionCookie = sessionResponse.cookies.find(
        (c: { name: string }) => c.name === 'authjs.session-token' || c.name === '__Secure-authjs.session-token'
      );

      expect(sessionCookie).toBeDefined();
      expect(sessionCookie.httpOnly).toBe(true);
      expect(sessionCookie.secure).toBe(true);
      expect(sessionCookie.sameSite).toBe('lax');
    });

    it('should return active session data via auth.session query', async () => {
      const ctx = createTestContext();
      const caller = createAuthCaller(ctx);

      const session = await caller.auth.session();
      expect(session).toBeDefined();
      expect(session.user.id).toBe(ctx.userId);
    });

    it('should return null for unauthenticated session query', async () => {
      const ctx = createUnauthenticatedContext();
      const caller = createAuthCaller(ctx);

      const session = await caller.auth.session();
      expect(session).toBeNull();
    });
  });

  describe('Logout — S-195 Scenario: Logout with session invalidation', () => {
    it('should invalidate session server-side on logout (SEC-AUTH-07)', async () => {
      const email = `logout-${Date.now()}@example.com`;
      await registerUser({ email, password: passwords.valid, name: 'Logout Test' });
      const session = await loginUser(email, passwords.valid);

      await logoutUser(session.sessionToken);

      // Session should be invalid server-side
      const result = await validateSession(session.sessionToken);
      expect(result.valid).toBe(false);
    });

    it('should clear session from database on logout', async () => {
      const email = `db-logout-${Date.now()}@example.com`;
      await registerUser({ email, password: passwords.valid, name: 'DB Logout' });
      const session = await loginUser(email, passwords.valid);

      await logoutUser(session.sessionToken);

      const dbSession = await findSessionInDatabase(session.sessionToken);
      expect(dbSession).toBeNull();
    });
  });

  describe('Password Reset — S-196', () => {
    it('should send reset email for existing account', async () => {
      const email = `reset-${Date.now()}@example.com`;
      await registerUser({ email, password: passwords.valid, name: 'Reset Test' });

      const result = await requestPasswordReset(email);
      expect(result.message).toContain('If an account exists');

      // Verify email was actually sent (mock transport)
      const sentEmails = await getSentEmails(email);
      expect(sentEmails).toHaveLength(1);
      expect(sentEmails[0].subject).toMatch(/password reset/i);
    });

    it('should complete password reset with valid token — S-196 Scenario: Reset password via valid link', async () => {
      const email = `reset-complete-${Date.now()}@example.com`;
      await registerUser({ email, password: passwords.valid, name: 'Reset Complete' });

      const resetResult = await requestPasswordReset(email);
      const token = await extractResetToken(email);

      const newPassword = 'NewSecure@Pass456';
      await resetPassword(token, newPassword);

      // Old password should fail
      const oldLogin = await loginUser(email, passwords.valid);
      expect(oldLogin.error).toBeDefined();

      // New password should work
      const newLogin = await loginUser(email, newPassword);
      expect(newLogin.user).toBeDefined();
    });

    it('should return same message for non-existing email (I-02)', async () => {
      const result = await requestPasswordReset('nonexistent@example.com');
      expect(result.message).toContain('If an account exists');
    });
  });

  describe('Account Settings — S-197', () => {
    it('should update display name — S-197 Scenario: Update display name', async () => {
      const ctx = createTestContext();
      const caller = createAuthCaller(ctx);

      await caller.auth.updateProfile({ name: 'Updated Name' });

      const session = await caller.auth.session();
      expect(session.user.name).toBe('Updated Name');
    });

    it('should require re-confirmation when updating email — S-197 Scenario: Update email', async () => {
      const ctx = createTestContext();
      const caller = createAuthCaller(ctx);

      const result = await caller.auth.updateProfile({ email: 'newemail@example.com' });

      // Email should not change immediately — confirmation required
      expect(result.emailChangeRequiresConfirmation).toBe(true);

      const session = await caller.auth.session();
      expect(session.user.email).not.toBe('newemail@example.com');
    });

    it('should toggle notification preferences — S-197 Scenario: Toggle notification preferences', async () => {
      const ctx = createTestContext();
      const caller = createAuthCaller(ctx);

      await caller.auth.updateNotificationPrefs({ emailAlerts: false });

      const profile = await caller.user.me();
      expect(profile.notificationPrefs.emailAlerts).toBe(false);
    });

    it('should reject profile updates from unauthenticated users', async () => {
      const ctx = createUnauthenticatedContext();
      const caller = createAuthCaller(ctx);

      await expect(
        caller.auth.updateProfile({ name: 'Hacker' })
      ).rejects.toThrow(/UNAUTHORIZED|UNAUTHENTICATED/);
    });
  });

  describe('Session Inactivity Expiry — S-195 Scenario: Session inactivity expiry', () => {
    it('should expire session after configured inactivity period', async () => {
      const email = `expire-${Date.now()}@example.com`;
      await registerUser({ email, password: passwords.valid, name: 'Expire Test' });
      const session = await loginUser(email, passwords.valid);

      // Simulate inactivity (advance time past configured period)
      await simulateSessionInactivity(session.sessionToken);

      const result = await validateSession(session.sessionToken);
      expect(result.valid).toBe(false);
    });
  });
});

// Stub declarations — these will be implemented by code agents
declare function registerUser(input: { email: string; password: string; name: string }): Promise<{
  success: boolean;
  message?: string;
  user: { id: string; email: string };
}>;
declare function loginUser(email: string, password: string): Promise<any>;
declare function loginUserWithCookies(email: string, password: string): Promise<{
  cookies: Array<{ name: string; httpOnly: boolean; secure: boolean; sameSite: string }>;
}>;
declare function logoutUser(sessionToken: string): Promise<void>;
declare function validateSession(sessionToken: string): Promise<{ valid: boolean }>;
declare function findSessionInDatabase(sessionToken: string): Promise<unknown | null>;
declare function requestPasswordReset(email: string): Promise<{ message: string }>;
declare function extractResetToken(email: string): Promise<string>;
declare function resetPassword(token: string, newPassword: string): Promise<void>;
declare function getSentEmails(recipientEmail: string): Promise<Array<{ subject: string }>>;
declare function getPasswordHashByEmail(email: string): Promise<string>;
declare function createAuthCaller(ctx: any): any;
declare function simulateSessionInactivity(sessionToken: string): Promise<void>;

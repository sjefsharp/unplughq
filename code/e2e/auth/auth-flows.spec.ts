/**
 * E2E Tests — Auth Flows
 * Stories: S-194 (Signup), S-195 (Login/Logout), S-196 (Password Reset), S-197 (Account Settings)
 * Security: S-01 (credential stuffing), I-02 (user enumeration), S-02 (cookie security)
 *
 * Tests all authentication Gherkin scenarios from product-backlog.md.
 */
import { test, expect, type Page } from '@playwright/test';

const uniqueEmail = () => `auth-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

test.describe('Signup — S-194', () => {
  test('Scenario: Successful registration with valid credentials', async ({ page }) => {
    await page.goto('/auth/signup');

    await page.getByLabel(/email/i).fill(uniqueEmail());
    await page.getByLabel(/^password$/i).fill('StrongPass123!');
    await page.getByLabel(/confirm password/i).fill('StrongPass123!');
    await page.getByLabel(/name|display name/i).fill('New User');
    await page.getByRole('button', { name: /sign up|register/i }).click();

    await expect(page).toHaveURL(/\/(dashboard|auth\/login)/);
  });

  test('Scenario: Password strength enforcement — rejects weak password', async ({ page }) => {
    await page.goto('/auth/signup');

    await page.getByLabel(/email/i).fill(uniqueEmail());
    await page.getByLabel(/^password$/i).fill('short');
    await page.getByLabel(/confirm password/i).fill('short');
    await page.getByLabel(/name|display name/i).fill('Weak PW User');
    await page.getByRole('button', { name: /sign up|register/i }).click();

    // Should show password validation error
    await expect(
      page.getByText(/password.*12|too short|strength|character/i)
    ).toBeVisible();

    // Should remain on signup page
    await expect(page).toHaveURL(/\/auth\/signup/);
  });

  test('Scenario: Duplicate email — generic message (I-02)', async ({ page }) => {
    const email = uniqueEmail();

    // First registration
    await page.goto('/auth/signup');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/^password$/i).fill('StrongPass123!');
    await page.getByLabel(/confirm password/i).fill('StrongPass123!');
    await page.getByLabel(/name|display name/i).fill('First User');
    await page.getByRole('button', { name: /sign up|register/i }).click();
    await expect(page).toHaveURL(/\/(dashboard|auth\/login)/);

    // Second registration with same email — should not reveal email exists
    await page.goto('/auth/signup');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/^password$/i).fill('StrongPass123!');
    await page.getByLabel(/confirm password/i).fill('StrongPass123!');
    await page.getByLabel(/name|display name/i).fill('Second User');
    await page.getByRole('button', { name: /sign up|register/i }).click();

    // Should NOT show "email already taken" or similar (I-02)
    const pageContent = await page.textContent('body');
    expect(pageContent).not.toMatch(/already.*taken|already.*registered|email.*exists|duplicate/i);
  });

  test('Scenario: Real-time password strength indicator', async ({ page }) => {
    await page.goto('/auth/signup');

    // Type weak password
    await page.getByLabel(/^password$/i).fill('ab');
    await expect(page.getByText(/weak|too short/i)).toBeVisible();

    // Type strong password
    await page.getByLabel(/^password$/i).fill('VeryStr0ng!Pass@2025');
    await expect(page.getByText(/strong/i)).toBeVisible();
  });
});

test.describe('Login — S-195', () => {
  test('Scenario: Successful login with valid credentials', async ({ page }) => {
    const email = uniqueEmail();
    await seedUser(email, 'StrongPass123!');

    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill('StrongPass123!');
    await page.getByRole('button', { name: /log in|sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/welcome|dashboard/i)).toBeVisible();
  });

  test('Scenario: Failed login — generic error (I-02)', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill('nonexistent@example.com');
    await page.getByLabel(/password/i).fill('WrongPassword!');
    await page.getByRole('button', { name: /log in|sign in/i }).click();

    // Error message should be generic
    await expect(
      page.getByText(/invalid email or password|invalid credentials/i)
    ).toBeVisible();

    // Should NOT reveal which field is wrong
    const errorText = await page.getByRole('alert').textContent();
    expect(errorText).not.toMatch(/email not found|wrong password|no account/i);
  });

  test('Scenario: Account lockout after repeated failures (S-01)', async ({ page }) => {
    const email = uniqueEmail();
    await seedUser(email, 'StrongPass123!');

    await page.goto('/auth/login');

    // Attempt 10 failed logins
    for (let i = 0; i < 10; i++) {
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/password/i).fill('WrongPassword!');
      await page.getByRole('button', { name: /log in|sign in/i }).click();

      // Wait for error to appear before next attempt
      await page.getByText(/invalid|error/i).waitFor({ state: 'visible' });
    }

    // 11th attempt should show lockout message
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill('StrongPass123!'); // Even correct password
    await page.getByRole('button', { name: /log in|sign in/i }).click();

    await expect(
      page.getByText(/locked|too many attempts|try again later/i)
    ).toBeVisible();
  });

  test('Scenario: Session inactivity expiry', async ({ page }) => {
    // This test validates the UI behavior when a session expires
    // The actual expiry is tested in integration tests
    const email = uniqueEmail();
    await seedUser(email, 'StrongPass123!');

    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill('StrongPass123!');
    await page.getByRole('button', { name: /log in|sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Expire the session cookie manually
    await page.context().clearCookies();

    // Attempt to navigate to protected page
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

test.describe('Logout — S-195', () => {
  test('Scenario: Logout with session invalidation', async ({ page }) => {
    const email = uniqueEmail();
    await seedUser(email, 'StrongPass123!');

    // Login
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill('StrongPass123!');
    await page.getByRole('button', { name: /log in|sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Logout
    await page.getByRole('button', { name: /logout|sign out|log out/i }).click();

    // Should redirect to login
    await expect(page).toHaveURL(/\/(auth\/login|\/)/);

    // Back button should not show dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

test.describe('Password Reset — S-196', () => {
  test('Scenario: Request password reset', async ({ page }) => {
    await page.goto('/auth/forgot-password');

    await page.getByLabel(/email/i).fill('anyuser@example.com');
    await page.getByRole('button', { name: /reset|send|submit/i }).click();

    // Should show generic message regardless of email existence (I-02)
    await expect(
      page.getByText(/if an account exists|check your email/i)
    ).toBeVisible();
  });

  test('Scenario: Reset password via valid link', async ({ page }) => {
    const email = uniqueEmail();
    await seedUser(email, 'OldPassword123!');

    // Request reset
    await page.goto('/auth/forgot-password');
    await page.getByLabel(/email/i).fill(email);
    await page.getByRole('button', { name: /reset|send/i }).click();

    // Navigate to reset page with token (simulated)
    const resetToken = await getResetTokenForUser(email);
    await page.goto(`/auth/reset-password?token=${resetToken}`);

    // Fill new password
    await page.getByLabel(/new password/i).fill('NewStrongPass123!');
    await page.getByLabel(/confirm.*password/i).fill('NewStrongPass123!');
    await page.getByRole('button', { name: /reset|save|confirm/i }).click();

    // Should show success message or redirect to login
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('Scenario: Expired or used reset link — S-196 Scenario', async ({ page }) => {
    await page.goto('/auth/reset-password?token=expired-or-used-token');

    await page.getByLabel(/new password/i).fill('NewPassword123!');
    await page.getByLabel(/confirm.*password/i).fill('NewPassword123!');
    await page.getByRole('button', { name: /reset|save|confirm/i }).click();

    await expect(
      page.getByText(/expired|invalid|already used/i)
    ).toBeVisible();
  });
});

test.describe('Account Settings — S-197', () => {
  test('Scenario: Update display name', async ({ page }) => {
    const email = uniqueEmail();
    await seedUser(email, 'StrongPass123!');
    await loginAndNavigate(page, email, 'StrongPass123!', '/settings');

    await page.getByLabel(/display name|name/i).clear();
    await page.getByLabel(/display name|name/i).fill('Updated Name');
    await page.getByRole('button', { name: /save|update/i }).click();

    await expect(
      page.getByText(/saved|updated|success/i)
    ).toBeVisible();
  });

  test('Scenario: Update email requires confirmation', async ({ page }) => {
    const email = uniqueEmail();
    await seedUser(email, 'StrongPass123!');
    await loginAndNavigate(page, email, 'StrongPass123!', '/settings');

    await page.getByLabel(/email/i).clear();
    await page.getByLabel(/email/i).fill('newemail@example.com');
    await page.getByRole('button', { name: /save|update/i }).click();

    await expect(
      page.getByText(/confirmation|verify|check your email/i)
    ).toBeVisible();
  });

  test('Scenario: Toggle notification preferences', async ({ page }) => {
    const email = uniqueEmail();
    await seedUser(email, 'StrongPass123!');
    await loginAndNavigate(page, email, 'StrongPass123!', '/settings');

    // Find and toggle email alerts checkbox
    const alertsCheckbox = page.getByLabel(/email alerts|notifications/i);
    const initialState = await alertsCheckbox.isChecked();
    await alertsCheckbox.click();

    await page.getByRole('button', { name: /save|update/i }).click();

    // Refresh and verify state persisted
    await page.reload();
    const newState = await page.getByLabel(/email alerts|notifications/i).isChecked();
    expect(newState).toBe(!initialState);
  });
});

// Test helpers — will be implemented in e2e fixtures
declare function seedUser(email: string, password: string): Promise<void>;
declare function getResetTokenForUser(email: string): Promise<string>;

async function loginAndNavigate(page: Page, email: string, password: string, path: string) {
  await page.goto('/auth/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /log in|sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await page.goto(path);
}

/**
 * E2E Test — Onboarding to Dashboard Journey (UJ1)
 * User Journey: Register → Login → Add Server → See Dashboard
 * Stories: S-194, S-195, S-198, S-199, S-200, S-201
 *
 * Validates the full happy path from first signup through server provisioning.
 */
import { test, expect, type Page } from '@playwright/test';

test.describe('UJ1 — Onboarding to Dashboard Journey', () => {
  const uniqueEmail = () => `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

  test('complete onboarding flow: register → login → add server → dashboard', async ({ page }) => {
    const email = uniqueEmail();
    const password = 'TestPassword123!';

    // Step 1: Navigate to signup page
    await page.goto('/auth/signup');
    await expect(page).toHaveTitle(/sign up|register|create account/i);

    // Step 2: Fill registration form (S-194)
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/^password$/i).fill(password);
    await page.getByLabel(/confirm password/i).fill(password);
    await page.getByLabel(/name|display name/i).fill('E2E Test User');
    await page.getByRole('button', { name: /sign up|register|create account/i }).click();

    // Step 3: Should redirect to login or auto-login
    await expect(page).toHaveURL(/\/(auth\/login|dashboard)/);

    // Step 4: Login if not auto-logged in (S-195)
    if (page.url().includes('/auth/login')) {
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/password/i).fill(password);
      await page.getByRole('button', { name: /log in|sign in/i }).click();
    }

    // Step 5: Should be on dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Step 6: Navigate to add server (S-198)
    await page.getByRole('link', { name: /add server|connect server/i }).click();
    await expect(page).toHaveURL(/\/servers\/new|\/servers\/connect/);

    // Step 7: Fill server connection form — 3 step wizard
    // Step 7a: Connection details
    await page.getByLabel(/server name|name/i).fill('My E2E Server');
    await page.getByLabel(/ip address|host/i).fill('203.0.113.42');
    await page.getByLabel(/ssh port|port/i).fill('22');
    await page.getByLabel(/ssh user|username/i).fill('unplughq');
    await page.getByRole('button', { name: /next|continue|test connection/i }).click();

    // Step 7b: Wait for connection test result
    await expect(
      page.getByText(/connection successful|validated|connected/i)
    ).toBeVisible({ timeout: 30_000 });

    // Step 7c: Confirm and provision (S-199 → S-200)
    await page.getByRole('button', { name: /provision|install|setup/i }).click();

    // Step 8: Wait for provisioning (may take time — use polling indicator)
    await expect(
      page.getByText(/provisioning|installing|setting up/i)
    ).toBeVisible({ timeout: 10_000 });

    // Step 9: Should redirect to server dashboard showing provisioned status (S-201)
    await expect(
      page.getByText(/provisioned|ready|online/i)
    ).toBeVisible({ timeout: 60_000 });

    // Verify server appears on main dashboard
    await page.goto('/dashboard');
    await expect(page.getByText('My E2E Server')).toBeVisible();
  });

  test('new user sees empty state on first dashboard visit', async ({ page }) => {
    const email = uniqueEmail();

    // Register and login
    await registerAndLogin(page, email, 'TestPassword123!');

    // Dashboard should show empty state
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(
      page.getByText(/no servers|get started|add your first/i)
    ).toBeVisible();
  });

  test('dashboard shows server metrics after provisioning (S-201)', async ({ page }) => {
    // Use a pre-provisioned test account
    await loginAsSeededUser(page, 'provisioned-user');

    await expect(page).toHaveURL(/\/dashboard/);

    // Verify dashboard elements from S-201 acceptance criteria
    await expect(page.getByText(/cpu|processor/i)).toBeVisible();
    await expect(page.getByText(/memory|ram/i)).toBeVisible();
    await expect(page.getByText(/disk|storage/i)).toBeVisible();
    await expect(page.getByText(/containers|running/i)).toBeVisible();
  });
});

// Helper functions — will be imported from e2e test utilities
async function registerAndLogin(page: Page, email: string, password: string) {
  await page.goto('/auth/signup');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByLabel(/confirm password/i).fill(password);
  await page.getByLabel(/name|display name/i).fill('Test User');
  await page.getByRole('button', { name: /sign up|register/i }).click();

  if (page.url().includes('/auth/login')) {
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /log in|sign in/i }).click();
  }

  await expect(page).toHaveURL(/\/dashboard/);
}

async function loginAsSeededUser(page: Page, userFixture: string) {
  // Login using seeded test user credentials
  await page.goto('/auth/login');
  await page.getByLabel(/email/i).fill(`${userFixture}@e2e.test`);
  await page.getByLabel(/password/i).fill('SeededPassword123!');
  await page.getByRole('button', { name: /log in|sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

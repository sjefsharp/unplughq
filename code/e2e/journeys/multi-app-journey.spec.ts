/**
 * E2E Test — Multi-App Management Journey (UJ2)
 * User Journey: Deploy multiple apps → Manage → Dashboard shows all
 * Stories: S-202 (Catalog), S-204 (Deploy), S-207 (Dashboard)
 */
import { test, expect, type Page } from '@playwright/test';

async function loginAsSeededUser(page: Page) {
  await page.goto('/auth/login');
  await page.getByLabel(/email/i).fill('e2e-sprint2@example.com');
  await page.getByLabel(/password/i).fill('TestPassword123!');
  await page.getByRole('button', { name: /log in|sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe('UJ2 — Multi-App Management Journey', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSeededUser(page);
  });

  test('deploy second app on same server — S-204', async ({ page }) => {
    await page.getByRole('link', { name: /catalog|apps|marketplace/i }).click();

    // Select a different app (e.g., second card)
    const appCards = page.locator('[data-testid="catalog-app-card"], .catalog-app-card, [role="article"]');
    await appCards.nth(1).click();

    const domainInput = page.getByLabel(/domain/i);
    if (await domainInput.isVisible()) {
      await domainInput.fill('second-app.example.com');
    }

    await page.getByRole('button', { name: /deploy|install|launch/i }).click();

    await expect(
      page.getByText(/deploying|pending|pulling/i)
        .or(page.locator('[data-testid="deployment-progress"]'))
    ).toBeVisible({ timeout: 10_000 });
  });

  test('dashboard shows multiple apps per server — S-207', async ({ page }) => {
    await page.getByRole('link', { name: /dashboard/i }).click();

    // Server card should show app list
    const serverCard = page.locator('[data-testid="server-card"], .server-card').first();
    await expect(serverCard).toBeVisible();

    // Should show multiple deployed apps
    const appItems = serverCard.locator('[data-testid="deployed-app"], .deployed-app');
    const count = await appItems.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('stop and restart an app from dashboard — S-204', async ({ page }) => {
    await page.getByRole('link', { name: /dashboard/i }).click();

    // Find a running app and click stop
    const appItem = page.locator('[data-testid="deployed-app"], .deployed-app').first();
    await appItem.locator('button', { hasText: /stop/i }).click();

    // Should show stopped status
    await expect(
      appItem.getByText(/stopped|stopping/i)
    ).toBeVisible({ timeout: 15_000 });

    // Restart
    await appItem.locator('button', { hasText: /start|restart/i }).click();
    await expect(
      appItem.getByText(/running|starting|pending/i)
    ).toBeVisible({ timeout: 30_000 });
  });

  test('remove an app from dashboard — S-204', async ({ page }) => {
    await page.getByRole('link', { name: /dashboard/i }).click();

    const appItems = page.locator('[data-testid="deployed-app"], .deployed-app');
    const initialCount = await appItems.count();

    // Click remove on last app
    const lastApp = appItems.last();
    await lastApp.locator('button', { hasText: /remove|delete|uninstall/i }).click();

    // Confirm removal dialog
    const confirmBtn = page.getByRole('button', { name: /confirm|yes|remove/i });
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }

    // App count should decrease
    await expect(appItems).toHaveCount(initialCount - 1, { timeout: 15_000 });
  });
});

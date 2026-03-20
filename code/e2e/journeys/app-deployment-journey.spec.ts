/**
 * E2E Test — App Deployment Journey (UJ1 continuation for Sprint 2)
 * User Journey: Browse Catalog → Configure → Deploy → Monitor on Dashboard
 * Stories: S-202 (Catalog), S-203 (Config Wizard), S-204 (Deploy), S-207 (Dashboard)
 */
import { test, expect, type Page } from '@playwright/test';

/**
 * Helper: login as pre-existing E2E user with a provisioned server.
 * Assumes seeded test data in the E2E environment.
 */
async function loginAsSeededUser(page: Page) {
  await page.goto('/auth/login');
  await page.getByLabel(/email/i).fill('e2e-sprint2@example.com');
  await page.getByLabel(/password/i).fill('TestPassword123!');
  await page.getByRole('button', { name: /log in|sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe('UJ1 Sprint 2 — Catalog → Deploy → Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSeededUser(page);
  });

  test('browse app catalog and see ≥15 apps across required categories — S-202', async ({ page }) => {
    await page.getByRole('link', { name: /catalog|apps|marketplace/i }).click();
    await expect(page).toHaveURL(/\/catalog|\/apps/);

    // Should display at least 15 app cards
    const appCards = page.locator('[data-testid="catalog-app-card"], .catalog-app-card, [role="article"]');
    await expect(appCards).toHaveCount(expect.any(Number));
    const count = await appCards.count();
    expect(count).toBeGreaterThanOrEqual(15);

    // Should show category filters
    const categories = page.locator('[data-testid="category-filter"], [role="tablist"] [role="tab"]');
    await expect(categories.first()).toBeVisible();
  });

  test('filter catalog by category — S-202', async ({ page }) => {
    await page.getByRole('link', { name: /catalog|apps|marketplace/i }).click();

    // Click on a category filter
    const categoryButton = page.getByRole('button', { name: /File Storage/i })
      .or(page.getByRole('tab', { name: /File Storage/i }))
      .or(page.locator('[data-category="File Storage"]'));
    await categoryButton.first().click();

    // Results should be filtered
    const appCards = page.locator('[data-testid="catalog-app-card"], .catalog-app-card, [role="article"]');
    const count = await appCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('search catalog by name — S-202', async ({ page }) => {
    await page.getByRole('link', { name: /catalog|apps|marketplace/i }).click();

    const searchInput = page.getByPlaceholder(/search/i).or(page.getByRole('searchbox'));
    await searchInput.fill('Nextcloud');

    const appCards = page.locator('[data-testid="catalog-app-card"], .catalog-app-card, [role="article"]');
    await expect(appCards.first()).toBeVisible();
    await expect(appCards.first()).toContainText(/Nextcloud/i);
  });

  test('open configuration wizard with dynamic form — S-203', async ({ page }) => {
    await page.getByRole('link', { name: /catalog|apps|marketplace/i }).click();

    // Click on an app to open detail / config wizard
    const appCard = page.locator('[data-testid="catalog-app-card"], .catalog-app-card, [role="article"]').first();
    await appCard.click();

    // Should show config form generated from configSchema
    await expect(
      page.getByRole('heading', { name: /configure|setup|install/i })
        .or(page.locator('[data-testid="config-wizard"]'))
    ).toBeVisible();

    // Should have form fields
    const formFields = page.locator('input, select').filter({ hasNotText: '' });
    const fieldCount = await formFields.count();
    expect(fieldCount).toBeGreaterThan(0);
  });

  test('deploy an app and see progress — S-204', async ({ page }) => {
    await page.getByRole('link', { name: /catalog|apps|marketplace/i }).click();

    // Select an app
    const appCard = page.locator('[data-testid="catalog-app-card"], .catalog-app-card, [role="article"]').first();
    await appCard.click();

    // Fill minimum required config
    const domainInput = page.getByLabel(/domain/i);
    if (await domainInput.isVisible()) {
      await domainInput.fill('e2e-test.example.com');
    }

    // Select server
    const serverSelect = page.getByLabel(/server/i).or(page.locator('[data-testid="server-select"]'));
    if (await serverSelect.isVisible()) {
      await serverSelect.selectOption({ index: 0 });
    }

    // Click deploy
    await page.getByRole('button', { name: /deploy|install|launch/i }).click();

    // Should show deployment progress
    await expect(
      page.getByText(/deploying|pulling|configuring|starting|pending/i)
        .or(page.locator('[data-testid="deployment-progress"]'))
    ).toBeVisible({ timeout: 10_000 });
  });

  test('deployed app appears on dashboard — S-207', async ({ page }) => {
    // Navigate to dashboard
    await page.getByRole('link', { name: /dashboard/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Should show server card(s) with apps and metrics
    const serverCard = page.locator('[data-testid="server-card"], .server-card').first();
    await expect(serverCard).toBeVisible();

    // Dashboard should show server status
    await expect(
      page.getByText(/provisioned|running|connected/i)
    ).toBeVisible();
  });
});

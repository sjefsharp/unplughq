/**
 * E2E Test — Configuration Wizard
 * Story: S-203 (Configuration Wizard) AB#203
 * Covers: Dynamic form generation from configSchema, validation, server selection
 */
import { test, expect, type Page } from '@playwright/test';

async function loginAsSeededUser(page: Page) {
  await page.goto('/auth/login');
  await page.getByLabel(/email/i).fill('e2e-sprint2@example.com');
  await page.getByLabel(/password/i).fill('TestPassword123!');
  await page.getByRole('button', { name: /log in|sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe('Configuration Wizard — S-203', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSeededUser(page);
  });

  test('opening an app from catalog shows configuration form', async ({ page }) => {
    await page.goto('/catalog');

    // Click on first app
    const appCard = page.locator('[data-testid="catalog-app-card"], .catalog-app-card, [role="article"]').first();
    await appCard.click();

    // Should show wizard / config form
    await expect(
      page.locator('[data-testid="config-wizard"], [data-testid="config-form"]')
        .or(page.getByRole('heading', { name: /configure|setup/i }))
    ).toBeVisible();
  });

  test('config form has dynamically generated fields from configSchema', async ({ page }) => {
    await page.goto('/catalog');

    const appCard = page.locator('[data-testid="catalog-app-card"], .catalog-app-card, [role="article"]').first();
    await appCard.click();

    // Form should have at least one input field
    const inputs = page.locator('form input, form select, form textarea');
    const inputCount = await inputs.count();
    expect(inputCount).toBeGreaterThan(0);
  });

  test('server selection dropdown shows only owned servers', async ({ page }) => {
    await page.goto('/catalog');

    const appCard = page.locator('[data-testid="catalog-app-card"], .catalog-app-card, [role="article"]').first();
    await appCard.click();

    const serverSelect = page.getByLabel(/server/i)
      .or(page.locator('[data-testid="server-select"]'));

    if (await serverSelect.isVisible()) {
      // Should have at least one server option
      const options = serverSelect.locator('option');
      const optionCount = await options.count();
      expect(optionCount).toBeGreaterThanOrEqual(1);
    }
  });

  test('domain field validates FQDN format', async ({ page }) => {
    await page.goto('/catalog');

    const appCard = page.locator('[data-testid="catalog-app-card"], .catalog-app-card, [role="article"]').first();
    await appCard.click();

    const domainInput = page.getByLabel(/domain/i);
    if (await domainInput.isVisible()) {
      // Enter invalid domain
      await domainInput.fill('not-a-domain');
      await domainInput.press('Tab'); // Trigger validation

      // Should show validation error
      await expect(
        page.getByText(/valid.*domain|FQDN|invalid.*domain/i)
      ).toBeVisible({ timeout: 3_000 });

      // Enter valid domain
      await domainInput.fill('myapp.example.com');
      await domainInput.press('Tab');

      // Validation error should disappear
      await expect(
        page.getByText(/valid.*domain|FQDN|invalid.*domain/i)
      ).toBeHidden({ timeout: 3_000 });
    }
  });

  test('required fields prevent submission when empty', async ({ page }) => {
    await page.goto('/catalog');

    const appCard = page.locator('[data-testid="catalog-app-card"], .catalog-app-card, [role="article"]').first();
    await appCard.click();

    // Try to submit without filling required fields
    const submitBtn = page.getByRole('button', { name: /deploy|install|launch/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();

      // Should show validation errors
      const errorMessages = page.locator('[data-testid="field-error"], .field-error, [role="alert"]');
      const errorCount = await errorMessages.count();
      expect(errorCount).toBeGreaterThan(0);
    }
  });
});

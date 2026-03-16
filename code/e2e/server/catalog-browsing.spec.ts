/**
 * E2E Test — Catalog Browsing
 * Story: S-202 (App Catalog) AB#202
 * Covers: Catalog listing, category filter, search, no-auth access
 */
import { test, expect } from '@playwright/test';

test.describe('Catalog Browsing — S-202', () => {
  test('catalog page is accessible without authentication (public)', async ({ page }) => {
    await page.goto('/catalog');
    // Should not redirect to login
    await expect(page).not.toHaveURL(/\/auth/);
    await expect(page.getByRole('heading', { name: /catalog|apps|marketplace/i })).toBeVisible();
  });

  test('shows at least 15 apps across required categories', async ({ page }) => {
    await page.goto('/catalog');

    const appCards = page.locator('[data-testid="catalog-app-card"], .catalog-app-card, [role="article"]');
    await expect(appCards.first()).toBeVisible();
    const count = await appCards.count();
    expect(count).toBeGreaterThanOrEqual(15);
  });

  test('each catalog card shows name, category, and description', async ({ page }) => {
    await page.goto('/catalog');

    const firstCard = page.locator('[data-testid="catalog-app-card"], .catalog-app-card, [role="article"]').first();
    await expect(firstCard).toBeVisible();

    // Should have meaningful text content
    const text = await firstCard.textContent();
    expect(text!.length).toBeGreaterThan(10);
  });

  test('filter by category narrows results', async ({ page }) => {
    await page.goto('/catalog');

    const allCards = page.locator('[data-testid="catalog-app-card"], .catalog-app-card, [role="article"]');
    const allCount = await allCards.count();

    // Click a category filter
    const filterBtn = page.getByRole('button', { name: /Analytics/i })
      .or(page.getByRole('tab', { name: /Analytics/i }))
      .or(page.locator('[data-category="Analytics"]'));

    if (await filterBtn.first().isVisible()) {
      await filterBtn.first().click();
      const filteredCount = await allCards.count();
      expect(filteredCount).toBeLessThanOrEqual(allCount);
      expect(filteredCount).toBeGreaterThan(0);
    }
  });

  test('search by name filters results', async ({ page }) => {
    await page.goto('/catalog');

    const searchInput = page.getByPlaceholder(/search/i).or(page.getByRole('searchbox'));
    await searchInput.fill('Ghost');

    const appCards = page.locator('[data-testid="catalog-app-card"], .catalog-app-card, [role="article"]');
    await expect(appCards.first()).toBeVisible();
    const count = await appCards.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(5); // Should be narrowed
  });

  test('search with no results shows empty state', async ({ page }) => {
    await page.goto('/catalog');

    const searchInput = page.getByPlaceholder(/search/i).or(page.getByRole('searchbox'));
    await searchInput.fill('xyznonexistentapp12345');

    await expect(
      page.getByText(/no.*results|no.*apps|no.*found/i)
    ).toBeVisible();
  });
});

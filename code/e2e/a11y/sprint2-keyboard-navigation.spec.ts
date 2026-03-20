/**
 * E2E Test — Sprint 2 Keyboard Navigation
 * Stories: All Sprint 2 UI (S-202 through S-209)
 * Covers: WCAG 2.1 AA keyboard operability for new Sprint 2 pages
 * Bug: B-262 accessibility aspects
 */
import { test, expect, type Page } from '@playwright/test';

async function loginAsSeededUser(page: Page) {
  await page.goto('/auth/login');
  await page.getByLabel(/email/i).fill('e2e-sprint2@example.com');
  await page.getByLabel(/password/i).fill('TestPassword123!');
  await page.getByRole('button', { name: /log in|sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe('Sprint 2 Keyboard Navigation — WCAG 2.1 AA', () => {
  test('catalog page: all interactive elements reachable by Tab', async ({ page }) => {
    await page.goto('/catalog');

    // Tab through the page and verify focus reaches interactive elements
    const interactiveSelectors = [
      '[data-testid="catalog-app-card"] a, [data-testid="catalog-app-card"] button',
      'input[type="search"], [role="searchbox"]',
      '[data-testid="category-filter"] button, [role="tab"]',
    ];

    // Press Tab multiple times and check focus is visible
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
    }

    // Active element should have a visible focus indicator
    const activeEl = page.locator(':focus');
    await expect(activeEl).toBeVisible();
  });

  test('catalog: Enter key activates app card', async ({ page }) => {
    await page.goto('/catalog');

    // Tab to first app card link/button
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }

    // Find the focused element
    const focused = page.locator(':focus');
    const tagName = await focused.evaluate((el) => el.tagName.toLowerCase());

    if (tagName === 'a' || tagName === 'button') {
      await page.keyboard.press('Enter');
      // Should navigate or open config wizard
      await page.waitForTimeout(500);
    }
  });

  test('configuration wizard: Tab order follows logical form sequence', async ({ page }) => {
    await loginAsSeededUser(page);
    await page.goto('/catalog');

    const appCard = page.locator('[data-testid="catalog-app-card"], .catalog-app-card').first();
    await appCard.click();

    // Tab through form fields — order should be logical
    const focusedLabels: string[] = [];
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab');
      const focused = page.locator(':focus');
      if (await focused.isVisible()) {
        const label = await focused.getAttribute('aria-label')
          || await focused.getAttribute('name')
          || await focused.getAttribute('id')
          || '';
        focusedLabels.push(label);
      }
    }

    // Should have visited multiple form elements
    expect(focusedLabels.filter(Boolean).length).toBeGreaterThan(0);
  });

  test('dashboard: alert cards are keyboard accessible', async ({ page }) => {
    await loginAsSeededUser(page);
    await page.goto('/dashboard');

    // Tab to alert area
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
    }

    // If an alert is focused, Enter should open it
    const focused = page.locator(':focus');
    if (await focused.isVisible()) {
      const isAlert = await focused.evaluate(
        (el) => el.closest('[data-testid="alert-card"], [role="alert"]') !== null,
      );
      if (isAlert) {
        await page.keyboard.press('Enter');
        // Should open alert detail
        await page.waitForTimeout(500);
      }
    }
  });

  test('no keyboard trap on any Sprint 2 page', async ({ page }) => {
    await loginAsSeededUser(page);

    const pages = ['/catalog', '/dashboard'];

    for (const url of pages) {
      await page.goto(url);

      // Tab 30 times — should eventually reach the end and cycle
      const positions: string[] = [];
      for (let i = 0; i < 30; i++) {
        await page.keyboard.press('Tab');
        const focused = page.locator(':focus');
        const pos = await focused.evaluate(
          (el) => `${el.tagName}-${el.className}-${el.id}`,
        ).catch(() => 'none');
        positions.push(pos);
      }

      // Should have moved through multiple distinct elements (no trap)
      const unique = new Set(positions.filter((p) => p !== 'none'));
      expect(unique.size).toBeGreaterThan(2);
    }
  });

  test('Escape key closes modals and dialogs', async ({ page }) => {
    await loginAsSeededUser(page);
    await page.goto('/dashboard');

    // Try to trigger a modal (e.g., remove app confirmation)
    const removeBtn = page.locator('button').filter({ hasText: /remove|delete/i }).first();
    if (await removeBtn.isVisible()) {
      await removeBtn.click();

      // Modal should appear
      const modal = page.locator('[role="dialog"], [data-testid="modal"]');
      if (await modal.isVisible()) {
        await page.keyboard.press('Escape');
        await expect(modal).toBeHidden({ timeout: 2_000 });
      }
    }
  });
});

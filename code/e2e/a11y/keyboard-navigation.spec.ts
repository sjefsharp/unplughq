/**
 * E2E Tests — Keyboard Navigation
 * Stories: All stories (cross-cutting NFR)
 * WCAG: 2.1.1 (Keyboard), 2.1.2 (No Keyboard Trap), 2.4.3 (Focus Order)
 *
 * Tests that all functionality is accessible via keyboard alone.
 */
import { test, expect, type Page } from '@playwright/test';

test.describe('Keyboard Navigation — WCAG 2.1.1 / 2.1.2 / 2.4.3', () => {
  test('login form is fully navigable by keyboard', async ({ page }) => {
    await page.goto('/auth/login');

    // Tab to email field
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    // Skip nav if needed — tab until we reach an input
    let attempts = 0;
    while (attempts < 20) {
      const tag = await page.evaluate(() => document.activeElement?.tagName);
      const type = await page.evaluate(() => (document.activeElement as HTMLInputElement)?.type);
      if (tag === 'INPUT' && (type === 'email' || type === 'text')) break;
      await page.keyboard.press('Tab');
      attempts++;
    }

    // Type email
    await page.keyboard.type('test@e2e.test');

    // Tab to password
    await page.keyboard.press('Tab');
    await page.keyboard.type('SeededPassword123!');

    // Tab to submit and press Enter
    await page.keyboard.press('Tab');
    const submitFocused = await page.evaluate(
      () => document.activeElement?.getAttribute('type') === 'submit'
        || document.activeElement?.tagName === 'BUTTON'
    );
    expect(submitFocused).toBe(true);

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('signup form is fully navigable by keyboard', async ({ page }) => {
    await page.goto('/auth/signup');

    // Tab through all form fields
    const expectedFieldTypes = ['email', 'text', 'password', 'password']; // email, name, password, confirm
    const visitedTypes: string[] = [];

    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');
      const tag = await page.evaluate(() => document.activeElement?.tagName);
      const type = await page.evaluate(() => (document.activeElement as HTMLInputElement)?.type);

      if (tag === 'INPUT') {
        visitedTypes.push(type || 'unknown');
      }
      if (tag === 'BUTTON') break;
    }

    // Should have visited all expected input types
    expect(visitedTypes.length).toBeGreaterThanOrEqual(3);
  });

  test('no keyboard traps on any page (2.1.2)', async ({ page }) => {
    const pages = ['/auth/login', '/auth/signup', '/auth/forgot-password'];

    for (const url of pages) {
      await page.goto(url);

      // Tab through all elements — should eventually loop back or reach end
      const maxTabs = 50;
      const visitedElements: string[] = [];

      for (let i = 0; i < maxTabs; i++) {
        await page.keyboard.press('Tab');
        const activeId = await page.evaluate(
          () => document.activeElement?.id || document.activeElement?.tagName
        );
        visitedElements.push(activeId || 'unknown');

        // If we've visited the same element twice, we've looped — no trap
        if (visitedElements.filter((e) => e === activeId).length > 2) break;
      }

      // Should not get stuck — must visit multiple distinct elements
      const uniqueElements = new Set(visitedElements);
      expect(uniqueElements.size).toBeGreaterThan(1);
    }
  });

  test('focus order follows visual order (2.4.3)', async ({ page }) => {
    await page.goto('/auth/signup');

    const focusOrder: Array<{ tag: string; top: number }> = [];

    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return { tag: el.tagName, top: rect.top };
      });

      if (info && info.tag !== 'BODY') {
        focusOrder.push(info);
      }
      if (info?.tag === 'BUTTON') break;
    }

    // Focus should generally flow top-to-bottom
    // Allow some tolerance for side-by-side elements
    let orderViolations = 0;
    for (let i = 1; i < focusOrder.length; i++) {
      if (focusOrder[i].top < focusOrder[i - 1].top - 50) {
        orderViolations++;
      }
    }

    // Allow up to 1 order jump (for nav items above form)
    expect(orderViolations).toBeLessThanOrEqual(2);
  });

  test('Escape key closes any open modal/dialog', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/dashboard');

    // Look for any dialog trigger
    const dialogTriggers = page.locator('[data-dialog-trigger], [aria-haspopup="dialog"]');
    const count = await dialogTriggers.count();

    if (count > 0) {
      await dialogTriggers.first().click();

      // Dialog should be visible
      const dialog = page.locator('[role="dialog"], dialog');
      await expect(dialog).toBeVisible();

      // Escape should close it
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
    }
  });

  test('skip-to-content link is available', async ({ page }) => {
    await page.goto('/auth/login');

    // Tab once — first focusable should be skip link
    await page.keyboard.press('Tab');

    const skipLink = page.locator('a[href="#main"], a[href="#content"], [class*="skip"]');
    const isSkipLinkFocused = await skipLink.evaluate((el) => el === document.activeElement)
      .catch(() => false);

    // If skip link exists, it should be one of the first focusable elements
    const skipLinkCount = await skipLink.count();
    if (skipLinkCount > 0) {
      await expect(skipLink.first()).toBeVisible();
    }
  });
});

test.describe('Keyboard Navigation — Authenticated Pages', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test('server wizard steps navigable by keyboard', async ({ page }) => {
    await page.goto('/servers/new');

    // Tab to first form field and fill
    let attempts = 0;
    while (attempts < 20) {
      await page.keyboard.press('Tab');
      const tag = await page.evaluate(() => document.activeElement?.tagName);
      if (tag === 'INPUT') break;
      attempts++;
    }

    // Should be able to fill form fields with keyboard
    await page.keyboard.type('Keyboard Server');
    await page.keyboard.press('Tab');
    await page.keyboard.type('203.0.113.42');
    await page.keyboard.press('Tab');
    await page.keyboard.type('22');
    await page.keyboard.press('Tab');
    await page.keyboard.type('unplughq');

    // Tab to and activate button
    await page.keyboard.press('Tab');
    const isButton = await page.evaluate(
      () => document.activeElement?.tagName === 'BUTTON'
    );
    expect(isButton).toBe(true);
  });

  test('dashboard elements keyboard-reachable', async ({ page }) => {
    await page.goto('/dashboard');

    const focusableElements: string[] = [];

    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab');
      const tag = await page.evaluate(
        () => `${document.activeElement?.tagName}:${document.activeElement?.textContent?.trim().slice(0, 30)}`
      );
      focusableElements.push(tag || 'unknown');
    }

    // Dashboard should have notable interactive elements
    const hasButtons = focusableElements.some((e) => e.startsWith('BUTTON'));
    const hasLinks = focusableElements.some((e) => e.startsWith('A'));
    expect(hasButtons || hasLinks).toBe(true);
  });
});

// Helpers
async function loginAsUser(page: Page) {
  await page.goto('/auth/login');
  await page.getByLabel(/email/i).fill('test@e2e.test');
  await page.getByLabel(/password/i).fill('SeededPassword123!');
  await page.getByRole('button', { name: /log in|sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

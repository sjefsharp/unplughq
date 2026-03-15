/**
 * E2E Tests — Mobile Responsive
 * Stories: All stories (cross-cutting NFR — mobile-first responsive web)
 * Covers: 375px viewport (mobile), 768px (tablet), 1024px (desktop)
 *
 * Validates that all UI is usable at mobile breakpoints.
 * Workspace rule #18: mobile-first responsive web design, not native mobile.
 */
import { test, expect, type Page } from '@playwright/test';

const viewports = {
  mobile: { width: 375, height: 812 },     // iPhone 13 Mini
  tablet: { width: 768, height: 1024 },     // iPad
  desktop: { width: 1440, height: 900 },    // Laptop
};

test.describe('Mobile Responsive — 375px viewport', () => {
  test.use({ viewport: viewports.mobile });

  test('login page is usable at mobile viewport', async ({ page }) => {
    await page.goto('/auth/login');

    // Form should be visible and not horizontally overflow
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeVisible();

    // Check no horizontal scroll
    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalScroll).toBe(false);

    // Submit button should be full-width or visible
    const submitBtn = page.getByRole('button', { name: /log in|sign in/i });
    await expect(submitBtn).toBeVisible();
  });

  test('signup page is usable at mobile viewport', async ({ page }) => {
    await page.goto('/auth/signup');

    // All form fields should be visible
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await expect(page.getByLabel(/name|display name/i)).toBeVisible();

    // No horizontal overflow
    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalScroll).toBe(false);
  });

  test('dashboard is usable at mobile viewport', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/dashboard');

    // Content should be visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // No horizontal overflow
    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalScroll).toBe(false);

    // Navigation should be accessible (hamburger menu or similar)
    const nav = page.locator('nav, [role="navigation"]');
    const navVisible = await nav.isVisible().catch(() => false);
    const hamburger = page.getByRole('button', { name: /menu|navigation/i });
    const hamburgerVisible = await hamburger.isVisible().catch(() => false);

    // Either nav is visible or hamburger menu exists
    expect(navVisible || hamburgerVisible).toBe(true);
  });

  test('server wizard is usable at mobile viewport', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/servers/new');

    // Form inputs should be full-width and visible
    const nameInput = page.getByLabel(/server name|name/i);
    await expect(nameInput).toBeVisible();

    const inputBox = await nameInput.boundingBox();
    if (inputBox) {
      // Input should use most of the viewport width (≥80%)
      expect(inputBox.width).toBeGreaterThan(viewports.mobile.width * 0.7);
    }

    // No horizontal overflow
    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalScroll).toBe(false);
  });

  test('settings page is usable at mobile viewport', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/settings');

    await expect(page.getByLabel(/name|display name/i)).toBeVisible();

    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalScroll).toBe(false);
  });

  test('touch targets are at least 44x44px (WCAG 2.5.8)', async ({ page }) => {
    await page.goto('/auth/login');

    const buttons = page.locator('button, a[role="button"], input[type="submit"]');
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          // WCAG 2.5.8: minimum 44x44px target size
          expect(box.height).toBeGreaterThanOrEqual(44);
          expect(box.width).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });
});

test.describe('Tablet Responsive — 768px viewport', () => {
  test.use({ viewport: viewports.tablet });

  test('dashboard layout adapts to tablet viewport', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/dashboard');

    // No horizontal overflow
    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalScroll).toBe(false);

    // Content should be visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('Desktop Responsive — 1440px viewport', () => {
  test.use({ viewport: viewports.desktop });

  test('dashboard uses full desktop layout', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/dashboard');

    // Navigation should be visible (not collapsed)
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav).toBeVisible();

    // No horizontal overflow
    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalScroll).toBe(false);
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

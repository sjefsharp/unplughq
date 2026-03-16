/**
 * E2E Test — Sprint 2 Mobile Responsive
 * Stories: All Sprint 2 UI (S-202 through S-209)
 * Covers: Mobile-first responsive design verification on iPhone 14 viewport
 */
import { test, expect, type Page } from '@playwright/test';

async function loginAsSeededUser(page: Page) {
  await page.goto('/auth/login');
  await page.getByLabel(/email/i).fill('e2e-sprint2@example.com');
  await page.getByLabel(/password/i).fill('TestPassword123!');
  await page.getByRole('button', { name: /log in|sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

// These tests run on the mobile-safari project (iPhone 14) defined in playwright.config.ts
test.describe('Sprint 2 Mobile Responsive', () => {
  test('catalog page renders without horizontal scroll on mobile', async ({ page }) => {
    await page.goto('/catalog');

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5); // 5px tolerance
  });

  test('catalog app cards stack vertically on mobile', async ({ page }) => {
    await page.goto('/catalog');

    const cards = page.locator('[data-testid="catalog-app-card"], .catalog-app-card, [role="article"]');
    const count = await cards.count();

    if (count >= 2) {
      const box1 = await cards.nth(0).boundingBox();
      const box2 = await cards.nth(1).boundingBox();
      if (box1 && box2) {
        // Cards should stack (second card below first, not beside it)
        expect(box2.y).toBeGreaterThanOrEqual(box1.y + box1.height - 10);
      }
    }
  });

  test('configuration wizard is usable on mobile viewport', async ({ page }) => {
    await loginAsSeededUser(page);
    await page.goto('/catalog');

    const appCard = page.locator('[data-testid="catalog-app-card"], .catalog-app-card, [role="article"]').first();
    await appCard.click();

    // Form inputs should be full-width or nearly so
    const inputs = page.locator('form input, form select');
    const first = inputs.first();
    if (await first.isVisible()) {
      const box = await first.boundingBox();
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      if (box) {
        // Input should be at least 70% of viewport width on mobile
        expect(box.width).toBeGreaterThanOrEqual(viewportWidth * 0.7);
      }
    }
  });

  test('dashboard is readable on mobile — server cards full width', async ({ page }) => {
    await loginAsSeededUser(page);
    await page.goto('/dashboard');

    const serverCard = page.locator('[data-testid="server-card"], .server-card').first();
    if (await serverCard.isVisible()) {
      const box = await serverCard.boundingBox();
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(viewportWidth * 0.85);
      }
    }
  });

  test('navigation is accessible on mobile (hamburger menu or bottom nav)', async ({ page }) => {
    await loginAsSeededUser(page);
    await page.goto('/dashboard');

    // Mobile should have a hamburger menu or bottom navigation
    const mobileNav = page.locator(
      '[data-testid="mobile-menu"], [data-testid="hamburger"], [aria-label="Menu"], button[aria-expanded]'
    ).or(page.locator('nav'));

    await expect(mobileNav.first()).toBeVisible();
  });

  test('touch targets are at least 44x44px (WCAG 2.5.5)', async ({ page }) => {
    await loginAsSeededUser(page);
    await page.goto('/dashboard');

    const buttons = page.locator('button, a[role="button"], [role="tab"]');
    const buttonCount = await buttons.count();

    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const btn = buttons.nth(i);
      if (await btn.isVisible()) {
        const box = await btn.boundingBox();
        if (box) {
          // Minimum touch target: 44x44px
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });

  test('alert cards are readable on mobile without overflow', async ({ page }) => {
    await loginAsSeededUser(page);
    await page.goto('/dashboard');

    const alertCards = page.locator('[data-testid="alert-card"], .alert-card, [role="alert"]');
    const count = await alertCards.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const card = alertCards.nth(i);
      if (await card.isVisible()) {
        const box = await card.boundingBox();
        const viewportWidth = await page.evaluate(() => window.innerWidth);
        if (box) {
          // Card should not overflow viewport
          expect(box.x + box.width).toBeLessThanOrEqual(viewportWidth + 5);
        }
      }
    }
  });
});

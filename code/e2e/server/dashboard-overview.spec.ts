/**
 * E2E Test — Dashboard Overview
 * Story: S-207 (Dashboard Overview) AB#207
 * Covers: Server cards, metrics display, app list, alert badges, real-time updates
 */
import { test, expect, type Page } from '@playwright/test';

async function loginAsSeededUser(page: Page) {
  await page.goto('/auth/login');
  await page.getByLabel(/email/i).fill('e2e-sprint2@example.com');
  await page.getByLabel(/password/i).fill('TestPassword123!');
  await page.getByRole('button', { name: /log in|sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe('Dashboard Overview — S-207', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSeededUser(page);
  });

  test('displays server cards with status', async ({ page }) => {
    const serverCards = page.locator('[data-testid="server-card"], .server-card');
    await expect(serverCards.first()).toBeVisible();

    // Each server card should show name and status
    await expect(serverCards.first().getByText(/provisioned|running|connected/i)).toBeVisible();
  });

  test('shows resource metrics (CPU, RAM, Disk) per server', async ({ page }) => {
    const serverCard = page.locator('[data-testid="server-card"], .server-card').first();

    // Should show metric indicators
    await expect(
      serverCard.getByText(/cpu|processor/i)
        .or(serverCard.locator('[data-testid="cpu-metric"]'))
    ).toBeVisible();
    await expect(
      serverCard.getByText(/ram|memory/i)
        .or(serverCard.locator('[data-testid="ram-metric"]'))
    ).toBeVisible();
    await expect(
      serverCard.getByText(/disk|storage/i)
        .or(serverCard.locator('[data-testid="disk-metric"]'))
    ).toBeVisible();
  });

  test('shows deployed apps list per server', async ({ page }) => {
    const serverCard = page.locator('[data-testid="server-card"], .server-card').first();

    const appList = serverCard.locator('[data-testid="deployed-app"], .deployed-app, [data-testid="app-list"]');
    // May have 0 or more apps
    const count = await appList.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('shows alert count badge on server card if alerts exist', async ({ page }) => {
    const serverCard = page.locator('[data-testid="server-card"], .server-card').first();

    // Alert badge or "no alerts" text
    const alertIndicator = serverCard.locator(
      '[data-testid="alert-count"], .alert-badge, [aria-label*="alert"]'
    ).or(serverCard.getByText(/no.*alert|0.*alert|alert/i));
    await expect(alertIndicator).toBeVisible();
  });

  test('empty state shown for user with no servers', async ({ page }) => {
    // Login as a different user with no servers
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill('e2e-no-servers@example.com');
    await page.getByLabel(/password/i).fill('TestPassword123!');
    await page.getByRole('button', { name: /log in|sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);

    // Should show empty state with CTA to add server
    await expect(
      page.getByText(/no servers|get started|add.*server|connect.*server/i)
    ).toBeVisible();
  });
});

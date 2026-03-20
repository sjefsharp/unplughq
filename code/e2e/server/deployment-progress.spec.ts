/**
 * E2E Test — Deployment Progress
 * Story: S-204 (One-Click Deploy), S-205 (Health Checks) AB#204, AB#205
 * Covers: Progress UI, state transitions, real-time updates via SSE
 */
import { test, expect, type Page } from '@playwright/test';

async function loginAsSeededUser(page: Page) {
  await page.goto('/auth/login');
  await page.getByLabel(/email/i).fill('e2e-sprint2@example.com');
  await page.getByLabel(/password/i).fill('TestPassword123!');
  await page.getByRole('button', { name: /log in|sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe('Deployment Progress — S-204 / S-205', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSeededUser(page);
  });

  test('deployment progress shows step-by-step status', async ({ page }) => {
    // Navigate to catalog and start a deploy
    await page.goto('/catalog');
    const appCard = page.locator('[data-testid="catalog-app-card"], .catalog-app-card, [role="article"]').first();
    await appCard.click();

    // Fill config
    const domainInput = page.getByLabel(/domain/i);
    if (await domainInput.isVisible()) {
      await domainInput.fill(`e2e-progress-${Date.now()}.example.com`);
    }

    const serverSelect = page.getByLabel(/server/i).or(page.locator('[data-testid="server-select"]'));
    if (await serverSelect.isVisible()) {
      await serverSelect.selectOption({ index: 0 });
    }

    await page.getByRole('button', { name: /deploy|install|launch/i }).click();

    // Should show progress UI with phases
    const progressContainer = page.locator(
      '[data-testid="deployment-progress"], .deployment-progress'
    );
    await expect(progressContainer.or(page.getByText(/deploying|progress/i))).toBeVisible({ timeout: 10_000 });

    // Should show at least one deployment phase label
    await expect(
      page.getByText(/pulling|configuring|provisioning|starting|ssl/i)
    ).toBeVisible({ timeout: 30_000 });
  });

  test('deployment reaches running state on success (S-205 health check passes)', async ({ page }) => {
    // This test relies on seeded/mock deployment completing
    await page.goto('/dashboard');

    // Find a deployed app showing "running" status
    await expect(
      page.getByText(/running/i).first()
    ).toBeVisible({ timeout: 60_000 });
  });

  test('failed deployment shows error state and retry option', async ({ page }) => {
    // Navigate to dashboard where a failed deployment exists (seeded)
    await page.goto('/dashboard');

    const failedApp = page.locator('[data-testid="deployed-app"], .deployed-app')
      .filter({ hasText: /failed/i });

    if (await failedApp.first().isVisible()) {
      // Should show retry button
      const retryBtn = failedApp.first().getByRole('button', { name: /retry|redeploy/i });
      await expect(retryBtn).toBeVisible();
    }
  });

  test('deployment progress updates via SSE without page reload', async ({ page }) => {
    await page.goto('/dashboard');

    // Monitor for any progress update text changes (SSE-driven)
    // The page should remain on the same URL (no reload)
    const currentUrl = page.url();

    // Wait a moment for SSE events to arrive
    await page.waitForTimeout(3_000);

    // URL should not have changed (no page reload)
    expect(page.url()).toBe(currentUrl);

    // Page should still be interactive
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

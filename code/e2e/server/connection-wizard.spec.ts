/**
 * E2E Tests — Server Connection Wizard
 * Stories: S-198, S-199
 * Covers: 3-step wizard flow (connection details → test → review & provision)
 * Security: T-01 (SSH command injection prevention at UI level)
 *
 * Tests the multi-step server connection and compatibility check wizard.
 */
import { test, expect, type Page } from '@playwright/test';

test.describe('Server Connection Wizard — S-198', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test('Scenario: Successful 3-step connection flow', async ({ page }) => {
    await page.goto('/servers/new');

    // Step 1: Connection details
    await expect(page.getByText(/step 1|connection details|server details/i)).toBeVisible();
    await page.getByLabel(/server name|name/i).fill('Production Server');
    await page.getByLabel(/ip address|host/i).fill('203.0.113.42');
    await page.getByLabel(/ssh port|port/i).fill('22');
    await page.getByLabel(/ssh user|username/i).fill('unplughq');
    await page.getByRole('button', { name: /next|test connection|continue/i }).click();

    // Step 2: Connection test progress
    await expect(page.getByText(/testing|connecting|verifying/i)).toBeVisible();
    await expect(
      page.getByText(/connection successful|validated|connected/i)
    ).toBeVisible({ timeout: 30_000 });

    // Step 2b: OS & resource detection results (S-199)
    await expect(page.getByText(/ubuntu|debian|centos|linux/i)).toBeVisible();
    await expect(page.getByText(/cpu|cores/i)).toBeVisible();
    await expect(page.getByText(/ram|memory/i)).toBeVisible();
    await expect(page.getByText(/disk|storage/i)).toBeVisible();

    // Step 3: Provision
    await page.getByRole('button', { name: /provision|install|setup|next/i }).click();
    await expect(page.getByText(/provisioning|installing/i)).toBeVisible();
  });

  test('Scenario: Connection test failure — S-198 Scenario: Failed connection test', async ({ page }) => {
    await page.goto('/servers/new');

    // Enter unreachable server
    await page.getByLabel(/server name|name/i).fill('Bad Server');
    await page.getByLabel(/ip address|host/i).fill('192.0.2.1');
    await page.getByLabel(/ssh port|port/i).fill('22');
    await page.getByLabel(/ssh user|username/i).fill('unplughq');
    await page.getByRole('button', { name: /next|test connection/i }).click();

    // Should show failure
    await expect(
      page.getByText(/connection failed|could not connect|unable to reach/i)
    ).toBeVisible({ timeout: 30_000 });

    // Should allow retry
    await expect(
      page.getByRole('button', { name: /retry|try again|back/i })
    ).toBeVisible();
  });

  test('Scenario: Incompatible OS detected — S-199 Scenario: Unsupported OS', async ({ page }) => {
    await page.goto('/servers/new');

    await page.getByLabel(/server name|name/i).fill('Unsupported OS Server');
    await page.getByLabel(/ip address|host/i).fill('203.0.113.10');
    await page.getByLabel(/ssh port|port/i).fill('22');
    await page.getByLabel(/ssh user|username/i).fill('unplughq');
    await page.getByRole('button', { name: /next|test connection/i }).click();

    // If OS is unsupported, show warning
    await expect(
      page.getByText(/not supported|unsupported|incompatible/i)
    ).toBeVisible({ timeout: 30_000 });
  });

  test('Scenario: Input validation — rejects invalid IP format', async ({ page }) => {
    await page.goto('/servers/new');

    await page.getByLabel(/server name|name/i).fill('Test');
    await page.getByLabel(/ip address|host/i).fill('not-an-ip');
    await page.getByLabel(/ssh port|port/i).fill('22');
    await page.getByLabel(/ssh user|username/i).fill('unplughq');
    await page.getByRole('button', { name: /next|test connection/i }).click();

    await expect(
      page.getByText(/valid ip|invalid.*ip|format/i)
    ).toBeVisible();
  });

  test('Scenario: Input validation — rejects out-of-range port', async ({ page }) => {
    await page.goto('/servers/new');

    await page.getByLabel(/server name|name/i).fill('Test');
    await page.getByLabel(/ip address|host/i).fill('203.0.113.42');
    await page.getByLabel(/ssh port|port/i).fill('99999');
    await page.getByLabel(/ssh user|username/i).fill('unplughq');
    await page.getByRole('button', { name: /next|test connection/i }).click();

    await expect(
      page.getByText(/port.*range|valid port|1.*65535/i)
    ).toBeVisible();
  });

  test('Scenario: Server name injection prevention (T-01 — UI level)', async ({ page }) => {
    await page.goto('/servers/new');

    const injectionPayloads = [
      'server; rm -rf /',
      'server$(whoami)',
      'server`id`',
      'server | cat /etc/passwd',
    ];

    for (const payload of injectionPayloads) {
      await page.getByLabel(/server name|name/i).clear();
      await page.getByLabel(/server name|name/i).fill(payload);
      await page.getByLabel(/ip address|host/i).fill('203.0.113.42');
      await page.getByLabel(/ssh port|port/i).fill('22');
      await page.getByLabel(/ssh user|username/i).fill('unplughq');
      await page.getByRole('button', { name: /next|test connection/i }).click();

      // Should show validation error, not proceed
      await expect(
        page.getByText(/invalid|special characters|not allowed|validation/i)
      ).toBeVisible();
    }
  });
});

test.describe('Server Dashboard — S-201', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUserWithServer(page);
  });

  test('Scenario: Server dashboard shows real-time metrics', async ({ page }) => {
    await page.goto('/servers');
    await page.getByText(/production server|my server/i).click();

    // S-201: Server detail page metrics
    await expect(page.getByText(/cpu/i)).toBeVisible();
    await expect(page.getByText(/memory|ram/i)).toBeVisible();
    await expect(page.getByText(/disk/i)).toBeVisible();
    await expect(page.getByText(/container/i)).toBeVisible();
  });

  test('Scenario: Server name edit inline — S-201 Scenario: Assign and edit server name', async ({ page }) => {
    await page.goto('/servers');
    await page.getByText(/production server|my server/i).click();

    // Find and click edit name button/icon
    await page.getByRole('button', { name: /edit.*name|rename/i }).click();

    // Should show an input to rename
    const nameInput = page.getByRole('textbox', { name: /server name|name/i });
    await nameInput.clear();
    await nameInput.fill('Renamed Server');
    await page.getByRole('button', { name: /save|confirm/i }).click();

    await expect(page.getByText('Renamed Server')).toBeVisible();
  });

  test('Scenario: Server disconnect requires confirmation — S-201 / NFR-006', async ({ page }) => {
    await page.goto('/servers');
    await page.getByText(/production server|my server/i).click();

    await page.getByRole('button', { name: /disconnect|remove/i }).click();

    // Should show confirmation dialog
    await expect(
      page.getByText(/are you sure|confirm.*disconnect|this action/i)
    ).toBeVisible();

    // Cancel should not disconnect
    await page.getByRole('button', { name: /cancel|no/i }).click();
    await expect(page.getByText(/production server|my server/i)).toBeVisible();
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

async function loginAsUserWithServer(page: Page) {
  await page.goto('/auth/login');
  await page.getByLabel(/email/i).fill('provisioned-user@e2e.test');
  await page.getByLabel(/password/i).fill('SeededPassword123!');
  await page.getByRole('button', { name: /log in|sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

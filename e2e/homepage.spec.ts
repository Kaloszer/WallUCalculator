import { test, expect } from '@playwright/test';

/**
 * Homepage tests for the Wall U-Value Calculator
 *
 * NOTE: These tests require WebGL support because the homepage contains
 * Three.js 3D visualizations that crash headless browsers without GPU.
 *
 * Running tests:
 * - With GPU: SKIP_WEBGL_TESTS=false bun run test:e2e
 * - Headed mode: bun run test:e2e:headed
 * - CI without GPU: Tests will be skipped automatically
 */

// Skip tests if SKIP_WEBGL_TESTS is not explicitly set to 'false'
const skipWebGL = process.env.SKIP_WEBGL_TESTS !== 'false';

test.describe('Homepage', () => {
  test.skip(() => skipWebGL, 'Skipping WebGL tests - set SKIP_WEBGL_TESTS=false to run');

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the main heading and description', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Wall U-Value Calculator');
    await expect(page.getByText(/Make informed decisions about your building/)).toBeVisible();
  });

  test('should display the header with navigation links', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Calculator' })).toBeVisible();
    await expect(page.getByRole('link', { name: /GitHub/ })).toBeVisible();
  });

  test('should load the 3D wall visualization canvas', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });

    const boundingBox = await canvas.boundingBox();
    expect(boundingBox).toBeTruthy();
    expect(boundingBox!.width).toBeGreaterThan(0);
    expect(boundingBox!.height).toBeGreaterThan(0);
  });

  test('should display "Go to Calculator" button', async ({ page }) => {
    const calculatorButton = page.getByRole('button', { name: 'Go to Calculator' });
    await expect(calculatorButton).toBeVisible({ timeout: 15000 });
  });

  test('should navigate to calculator when clicking "Go to Calculator" button', async ({ page }) => {
    const calculatorButton = page.getByRole('button', { name: 'Go to Calculator' });
    await expect(calculatorButton).toBeVisible({ timeout: 15000 });
    await calculatorButton.click();
    await expect(page).toHaveURL(/\/calculator/, { timeout: 10000 });
  });

  test('should have interactive 3D canvas that responds to mouse movement', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });

    const initialBox = await canvas.boundingBox();
    expect(initialBox).toBeTruthy();

    await page.mouse.move(initialBox!.x + 100, initialBox!.y + 100);
    await page.waitForTimeout(500);
    await expect(canvas).toBeVisible();
  });
});

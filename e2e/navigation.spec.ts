import { test, expect } from '@playwright/test';

/**
 * Navigation tests
 *
 * NOTE: These tests require WebGL support because pages contain Three.js 3D
 * visualizations that crash headless browsers without GPU.
 *
 * Running tests:
 * - With GPU: SKIP_WEBGL_TESTS=false bun run test:e2e
 * - Headed mode: bun run test:e2e:headed
 * - CI without GPU: Tests will be skipped automatically
 */

// Skip tests if SKIP_WEBGL_TESTS is not explicitly set to 'false'
const skipWebGL = process.env.SKIP_WEBGL_TESTS !== 'false';

test.describe('Navigation', () => {
  test.skip(() => skipWebGL, 'Skipping WebGL tests - set SKIP_WEBGL_TESTS=false to run');
  test('should navigate from Home to Calculator via header link', async ({ page }) => {
    await page.goto('/');

    // Click Calculator link in header
    await page.getByRole('link', { name: 'Calculator' }).click();

    // Verify we're on calculator page
    await expect(page).toHaveURL('/calculator');
    await expect(page.locator('h1')).toContainText('Wall Assembly Calculator');
  });

  test('should navigate from Calculator back to Home via header link', async ({ page }) => {
    await page.goto('/calculator');

    // Click Home link in header
    await page.getByRole('link', { name: 'Home' }).click();

    // Verify we're on home page
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('Wall U-Value Calculator');
  });

  test('should navigate from Calculator to Home via header title', async ({ page }) => {
    await page.goto('/calculator');

    // Click the title link in header (which shows when showTitle=true)
    await page.getByRole('link', { name: 'Wall U-Value Calculator' }).first().click();

    // Verify we're on home page
    await expect(page).toHaveURL('/');
  });

  test('should open GitHub link in new tab', async ({ page, context }) => {
    await page.goto('/');

    // Listen for new page (tab) event
    const pagePromise = context.waitForEvent('page');

    // Click GitHub link
    await page.getByRole('link', { name: /GitHub/ }).click();

    // Wait for new page
    const newPage = await pagePromise;

    // Verify it opens GitHub
    await expect(newPage).toHaveURL(/github\.com/);
  });

  test('should navigate to House Sample page from Calculator visualization tab', async ({ page }) => {
    await page.goto('/calculator');

    // Wait for client-side rendering of Calculator component
    await expect(page.getByRole('tab', { name: 'Visualization' })).toBeVisible({ timeout: 10000 });

    // Click on Visualization tab
    await page.getByRole('tab', { name: 'Visualization' }).click();

    // Wait for tab content to load
    await expect(page.getByText('House Sample Preview')).toBeVisible({ timeout: 5000 });

    // Click "Generate House Sample" button
    await page.getByRole('link', { name: 'Generate House Sample' }).click();

    // Verify navigation to house sample page
    await expect(page).toHaveURL(/\/houseSamplePage/);
    await expect(page.locator('h1')).toContainText('House Sample');
  });

  test('should maintain header visibility across all pages', async ({ page }) => {
    // Check header on home page
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Calculator' })).toBeVisible();

    // Check header on calculator page
    await page.goto('/calculator');
    await expect(page.locator('header')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Calculator' })).toBeVisible();
  });

  test('should show title in header only on Calculator page', async ({ page }) => {
    // Home page should NOT show title in header (showTitle=false)
    await page.goto('/');
    const headerTitle = page.locator('header h1');
    await expect(headerTitle).toHaveCount(0);

    // Calculator page SHOULD show title in header (showTitle=true)
    await page.goto('/calculator');
    // Wait for header to be visible
    await expect(page.locator('header')).toBeVisible();
    const calculatorHeaderTitle = page.locator('header').getByRole('link', { name: 'Wall U-Value Calculator' });
    await expect(calculatorHeaderTitle).toBeVisible();
  });
});

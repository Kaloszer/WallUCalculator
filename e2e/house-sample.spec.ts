import { test, expect } from '@playwright/test';

/**
 * House Sample Page tests
 *
 * NOTE: These tests require WebGL support because the page contains Three.js 3D
 * house visualizations that crash headless browsers without GPU.
 *
 * Running tests:
 * - With GPU: SKIP_WEBGL_TESTS=false bun run test:e2e
 * - Headed mode: bun run test:e2e:headed
 * - CI without GPU: Tests will be skipped automatically
 */

// Skip tests if SKIP_WEBGL_TESTS is not explicitly set to 'false'
const skipWebGL = process.env.SKIP_WEBGL_TESTS !== 'false';

test.describe('House Sample Page', () => {
  test.skip(() => skipWebGL, 'Skipping WebGL tests - set SKIP_WEBGL_TESTS=false to run');
  test.describe('Basic Page Load', () => {
    test('should load house sample page without URL params', async ({ page }) => {
      await page.goto('/houseSamplePage');

      // Wait for dynamic import to load
      await expect(page.locator('h1')).toContainText('House Sample', { timeout: 15000 });
    });

    test('should display loading state initially', async ({ page }) => {
      // Navigate and check for Suspense fallback
      await page.goto('/houseSamplePage');

      // The page uses Suspense with "Loading..." fallback
      // We should see the content load after hydration
      await expect(page.locator('h1')).toContainText('House Sample', { timeout: 15000 });
    });
  });

  test.describe('Wall Assembly from URL Params', () => {
    test('should load wall assembly data from URL parameters', async ({ page }) => {
      // Create a sample wall assembly
      const wallAssembly = {
        components: [
          { material: "Brick", thickness: 102, conductivity: 1.7, isInsulation: false, id: 0 },
          { material: "Mineral Wool λ0.036", thickness: 100, conductivity: 0.036, isInsulation: true, id: 1 },
          { material: "Gypsum Board", thickness: 12.5, conductivity: 0.2, isInsulation: false, id: 2 }
        ],
        studWallType: "none"
      };

      const encodedWallAssembly = encodeURIComponent(JSON.stringify(wallAssembly));
      await page.goto(`/houseSamplePage?wallAssembly=${encodedWallAssembly}`);

      // Wait for content to load
      await expect(page.locator('h1')).toContainText('House Sample', { timeout: 15000 });

      // The HouseVisualization component should receive the wall assembly
      // and render appropriately - verify the page doesn't error
      await expect(page.locator('body')).not.toContainText('Error');
    });

    test('should handle empty wall assembly gracefully', async ({ page }) => {
      const wallAssembly = {
        components: [],
        studWallType: "none"
      };

      const encodedWallAssembly = encodeURIComponent(JSON.stringify(wallAssembly));
      await page.goto(`/houseSamplePage?wallAssembly=${encodedWallAssembly}`);

      // Should still load without errors
      await expect(page.locator('h1')).toContainText('House Sample', { timeout: 15000 });
    });

    test('should handle wall assembly with stud wall type', async ({ page }) => {
      const wallAssembly = {
        components: [
          { material: "Gypsum Board", thickness: 12.5, conductivity: 0.2, isInsulation: false, id: 0 },
          { material: "Mineral Wool λ0.036", thickness: 150, conductivity: 0.036, isInsulation: true, hasStuds: true, id: 1 },
          { material: "OSB", thickness: 12, conductivity: 0.13, isInsulation: false, id: 2 }
        ],
        studWallType: "standard"
      };

      const encodedWallAssembly = encodeURIComponent(JSON.stringify(wallAssembly));
      await page.goto(`/houseSamplePage?wallAssembly=${encodedWallAssembly}`);

      // Should load without errors
      await expect(page.locator('h1')).toContainText('House Sample', { timeout: 15000 });
    });

    test('should handle I-Joist wall assembly', async ({ page }) => {
      const wallAssembly = {
        components: [
          { material: "Gypsum Board", thickness: 12.5, conductivity: 0.2, isInsulation: false, id: 0 },
          { material: "Mineral Wool λ0.036", thickness: 200, conductivity: 0.036, isInsulation: true, hasStuds: true, id: 1 },
          { material: "Plaster", thickness: 12, conductivity: 0.5, isInsulation: false, id: 2 }
        ],
        studWallType: "i-joist"
      };

      const encodedWallAssembly = encodeURIComponent(JSON.stringify(wallAssembly));
      await page.goto(`/houseSamplePage?wallAssembly=${encodedWallAssembly}`);

      // Should load without errors
      await expect(page.locator('h1')).toContainText('House Sample', { timeout: 15000 });
    });

    test('should handle invalid JSON in URL gracefully', async ({ page }) => {
      // Navigate with malformed JSON
      await page.goto('/houseSamplePage?wallAssembly=invalid-json');

      // Page should still load (error is caught in try-catch)
      await expect(page.locator('h1')).toContainText('House Sample', { timeout: 15000 });
    });
  });

  test.describe('3D Visualization', () => {
    test('should render 3D canvas for house visualization', async ({ page }) => {
      await page.goto('/houseSamplePage');

      // Wait for the canvas element (Three.js renders to canvas)
      const canvas = page.locator('canvas');
      await expect(canvas).toBeVisible({ timeout: 15000 });

      // Verify canvas has dimensions
      const boundingBox = await canvas.boundingBox();
      expect(boundingBox).toBeTruthy();
      expect(boundingBox!.width).toBeGreaterThan(0);
      expect(boundingBox!.height).toBeGreaterThan(0);
    });

    test('should render house visualization with complex wall assembly', async ({ page }) => {
      // Use a realistic wall assembly from the example walls
      const wallAssembly = {
        components: [
          { material: "Gypsum Board", thickness: 12.5, conductivity: 0.2, isInsulation: false, id: 0 },
          { material: "Vapour Barrier", thickness: 1, conductivity: 0.4, isInsulation: false, id: 1 },
          { material: "Service Space", thickness: 50, conductivity: 0.036, isInsulation: true, id: 2 },
          { material: "Mineral Wool λ0.036", thickness: 150, conductivity: 0.036, isInsulation: true, hasStuds: true, id: 3 },
          { material: "Windbreak", thickness: 1, conductivity: 0.2, isInsulation: false, id: 4 },
          { material: "OSB", thickness: 12, conductivity: 0.13, isInsulation: false, id: 5 }
        ],
        studWallType: "standard"
      };

      const encodedWallAssembly = encodeURIComponent(JSON.stringify(wallAssembly));
      await page.goto(`/houseSamplePage?wallAssembly=${encodedWallAssembly}`);

      // Wait for 3D canvas to render
      const canvas = page.locator('canvas');
      await expect(canvas).toBeVisible({ timeout: 15000 });

      // Verify the page is functional
      const boundingBox = await canvas.boundingBox();
      expect(boundingBox).toBeTruthy();
    });
  });

  test.describe('End-to-End Flow: Calculator to House Sample', () => {
    test('should navigate from calculator to house sample with wall data', async ({ page }) => {
      // Start at calculator page
      await page.goto('/calculator');

      // Wait for calculator to load
      await expect(page.getByRole('tab', { name: 'Wall Assembly' })).toBeVisible({ timeout: 15000 });

      // Load an example wall
      await page.getByRole('button', { name: 'Brick Wall with Mineral Wool' }).click();
      await page.waitForTimeout(500);

      // Navigate to Visualization tab
      await page.getByRole('tab', { name: 'Visualization' }).click();

      // Wait for and click "Generate House Sample" link
      await expect(page.getByRole('link', { name: 'Generate House Sample' })).toBeVisible({ timeout: 5000 });
      await page.getByRole('link', { name: 'Generate House Sample' }).click();

      // Verify we're on house sample page with URL params
      await expect(page).toHaveURL(/houseSamplePage\?wallAssembly=/);
      await expect(page.locator('h1')).toContainText('House Sample', { timeout: 15000 });

      // Verify 3D canvas loads
      const canvas = page.locator('canvas');
      await expect(canvas).toBeVisible({ timeout: 15000 });
    });

    test('should preserve wall assembly data through navigation', async ({ page }) => {
      // Start at calculator and load standard stud wall
      await page.goto('/calculator');
      await expect(page.getByRole('tab', { name: 'Wall Assembly' })).toBeVisible({ timeout: 15000 });

      await page.getByRole('button', { name: 'Standard Stud Wall with Service Space' }).click();
      await page.waitForTimeout(500);

      // Navigate to visualization tab
      await page.getByRole('tab', { name: 'Visualization' }).click();

      // Click generate house sample
      await page.getByRole('link', { name: 'Generate House Sample' }).click();

      // The URL should contain the wall assembly JSON with the components
      await expect(page).toHaveURL(/wallAssembly=/);

      // Verify the encoded URL contains expected material names
      const url = page.url();
      const decodedUrl = decodeURIComponent(url);
      expect(decodedUrl).toContain('Gypsum Board');
      expect(decodedUrl).toContain('standard');
    });
  });
});

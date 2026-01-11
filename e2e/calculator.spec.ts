import { test, expect } from '@playwright/test';

/**
 * Calculator Page tests
 *
 * NOTE: These tests require WebGL support. The calculator contains Three.js 3D
 * visualizations that crash headless browsers without GPU.
 *
 * Running tests:
 * - With GPU: SKIP_WEBGL_TESTS=false bun run test:e2e
 * - Headed mode: bun run test:e2e:headed
 * - CI without GPU: Tests will be skipped automatically
 */

// Skip tests if SKIP_WEBGL_TESTS is not explicitly set to 'false'
const skipWebGL = process.env.SKIP_WEBGL_TESTS !== 'false';

test.describe('Calculator Page', () => {
  test.skip(() => skipWebGL, 'Skipping WebGL tests - set SKIP_WEBGL_TESTS=false to run');

  test.beforeEach(async ({ page }) => {
    await page.goto('/calculator');
    // Wait for dynamic import of Calculator component to load
    await expect(page.getByRole('tab', { name: 'Wall Assembly' })).toBeVisible({ timeout: 15000 });
  });

  test.describe('Page Layout', () => {
    test('should display calculator page with correct heading', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Wall Assembly Calculator');
      await expect(page.getByText(/Design and analyze your wall assembly/)).toBeVisible();
    });

    test('should display all three tabs', async ({ page }) => {
      await expect(page.getByRole('tab', { name: 'Wall Assembly' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Analysis' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Visualization' })).toBeVisible();
    });

    test('should show Wall Assembly tab content by default', async ({ page }) => {
      // Check that Wall Assembly tab is selected
      const assemblyTab = page.getByRole('tab', { name: 'Wall Assembly' });
      await expect(assemblyTab).toHaveAttribute('data-state', 'active');

      // Check that Wall Assembly Configuration card is visible
      await expect(page.getByText('Wall Assembly Configuration')).toBeVisible();
    });
  });

  test.describe('Tab Switching', () => {
    test('should switch to Analysis tab and show content', async ({ page }) => {
      // Click Analysis tab
      await page.getByRole('tab', { name: 'Analysis' }).click();

      // Verify tab is active
      const analysisTab = page.getByRole('tab', { name: 'Analysis' });
      await expect(analysisTab).toHaveAttribute('data-state', 'active');

      // Verify Analysis content is visible
      await expect(page.getByText('Dew Point Analysis')).toBeVisible();
      await expect(page.getByText('Temperature Gradient')).toBeVisible();
    });

    test('should switch to Visualization tab and show content', async ({ page }) => {
      // Click Visualization tab
      await page.getByRole('tab', { name: 'Visualization' }).click();

      // Verify tab is active
      const vizTab = page.getByRole('tab', { name: 'Visualization' });
      await expect(vizTab).toHaveAttribute('data-state', 'active');

      // Verify Visualization content is visible
      await expect(page.getByText('Wall Visualization')).toBeVisible();
      await expect(page.getByText('House Sample Preview')).toBeVisible();
    });

    test('should switch back to Wall Assembly tab', async ({ page }) => {
      // Go to Analysis tab first
      await page.getByRole('tab', { name: 'Analysis' }).click();
      await expect(page.getByRole('tab', { name: 'Analysis' })).toHaveAttribute('data-state', 'active');

      // Switch back to Wall Assembly
      await page.getByRole('tab', { name: 'Wall Assembly' }).click();
      await expect(page.getByRole('tab', { name: 'Wall Assembly' })).toHaveAttribute('data-state', 'active');

      // Verify content
      await expect(page.getByText('Wall Assembly Configuration')).toBeVisible();
    });
  });

  test.describe('Example Wall Selector', () => {
    test('should display example wall buttons', async ({ page }) => {
      await expect(page.getByText('Example Walls:')).toBeVisible();

      // Check for example wall buttons
      await expect(page.getByRole('button', { name: 'Standard Stud Wall with Service Space' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'I-Joist Wall with Mineral Wool' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Brick Wall with Mineral Wool' })).toBeVisible();
    });

    test('should load Standard Stud Wall example', async ({ page }) => {
      // Click the example wall button
      await page.getByRole('button', { name: 'Standard Stud Wall with Service Space' }).click();

      // Wait for table to update
      await page.waitForTimeout(500);

      // Verify components are loaded into the table
      await expect(page.getByRole('cell', { name: 'Gypsum Board' })).toBeVisible();
      await expect(page.getByRole('cell', { name: 'Vapour Barrier' })).toBeVisible();
      await expect(page.getByRole('cell', { name: 'Service Space' })).toBeVisible();
    });

    test('should load I-Joist Wall example', async ({ page }) => {
      // Click the example wall button
      await page.getByRole('button', { name: 'I-Joist Wall with Mineral Wool' }).click();

      // Wait for table to update
      await page.waitForTimeout(500);

      // Verify components are loaded
      await expect(page.getByRole('cell', { name: 'Gypsum Board' })).toBeVisible();
      await expect(page.getByRole('cell', { name: 'Plaster' })).toBeVisible();
    });

    test('should load Brick Wall example', async ({ page }) => {
      // Click the example wall button
      await page.getByRole('button', { name: 'Brick Wall with Mineral Wool' }).click();

      // Wait for table to update
      await page.waitForTimeout(500);

      // Verify brick components are loaded
      const brickCells = page.getByRole('cell', { name: 'Brick' });
      await expect(brickCells.first()).toBeVisible();
    });
  });

  test.describe('Stud Wall Selector', () => {
    test('should display stud wall type selector', async ({ page }) => {
      await expect(page.getByText('Stud Wall Type')).toBeVisible();
    });

    test('should select Standard Stud Wall type', async ({ page }) => {
      // Open the select dropdown
      const selectTrigger = page.locator('[class*="SelectTrigger"]').first();
      await selectTrigger.click();

      // Select "Standard Stud Wall" option
      await page.getByRole('option', { name: 'Standard Stud Wall' }).click();

      // Verify stud configuration card appears
      await expect(page.getByText('Stud Configuration')).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/Depth:/)).toBeVisible();
      await expect(page.getByText(/Spacing:/)).toBeVisible();
    });

    test('should select I-Joist Wall type and show depth selector', async ({ page }) => {
      // Open the select dropdown
      const selectTrigger = page.locator('[class*="SelectTrigger"]').first();
      await selectTrigger.click();

      // Select "I-Joist Wall" option
      await page.getByRole('option', { name: 'I-Joist Wall' }).click();

      // Verify I-Joist depth selector appears
      await expect(page.getByText('I-Joist Depth')).toBeVisible({ timeout: 5000 });

      // Verify stud configuration is shown
      await expect(page.getByText('Stud Configuration')).toBeVisible();
    });

    test('should change I-Joist depth', async ({ page }) => {
      // First select I-Joist Wall type
      const studTypeSelect = page.locator('[class*="SelectTrigger"]').first();
      await studTypeSelect.click();
      await page.getByRole('option', { name: 'I-Joist Wall' }).click();

      // Wait for depth selector to appear
      await expect(page.getByText('I-Joist Depth')).toBeVisible({ timeout: 5000 });

      // Click the depth selector (second select trigger)
      const depthSelect = page.locator('[class*="SelectTrigger"]').nth(1);
      await depthSelect.click();

      // Select 300mm depth
      await page.getByRole('option', { name: '300mm' }).click();

      // Verify the depth is shown in configuration
      await expect(page.getByText(/Depth: 300mm/)).toBeVisible({ timeout: 5000 });
    });

    test('should hide stud configuration when "No Studs" is selected', async ({ page }) => {
      // First load an example with studs to ensure config is visible
      await page.getByRole('button', { name: 'Standard Stud Wall with Service Space' }).click();
      await page.waitForTimeout(500);

      // Verify stud config is visible
      await expect(page.getByText('Stud Configuration')).toBeVisible({ timeout: 5000 });

      // Select "No Studs"
      const selectTrigger = page.locator('[class*="SelectTrigger"]').first();
      await selectTrigger.click();
      await page.getByRole('option', { name: 'No Studs' }).click();

      // Verify stud configuration is hidden
      await expect(page.getByText('Stud Configuration')).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Wall Component Management', () => {
    test('should display "Add Wall Component" button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /Add Wall Component/ })).toBeVisible();
    });

    test('should add a new wall component', async ({ page }) => {
      // Count initial rows in the table
      const initialRows = await page.locator('tbody tr').count();

      // Click add component button
      await page.getByRole('button', { name: /Add Wall Component/ }).click();

      // Wait for new row to be added
      await page.waitForTimeout(500);

      // Count rows after adding
      const newRowCount = await page.locator('tbody tr').count();
      expect(newRowCount).toBe(initialRows + 1);
    });

    test('should remove a wall component', async ({ page }) => {
      // First load an example wall to have components
      await page.getByRole('button', { name: 'Brick Wall with Mineral Wool' }).click();
      await page.waitForTimeout(500);

      // Count initial rows
      const initialRows = await page.locator('tbody tr').count();
      expect(initialRows).toBeGreaterThan(0);

      // Find and click the first remove button (trash icon)
      const removeButton = page.locator('tbody tr').first().getByRole('button').first();
      await removeButton.click();

      // Wait for row to be removed
      await page.waitForTimeout(500);

      // Verify row count decreased
      const newRowCount = await page.locator('tbody tr').count();
      expect(newRowCount).toBe(initialRows - 1);
    });

    test('should not allow more than 8 layers (MAX_LAYERS)', async ({ page }) => {
      // Add components until we reach the max
      for (let i = 0; i < 8; i++) {
        const addButton = page.getByRole('button', { name: /Add Wall Component/ });
        const isDisabled = await addButton.isDisabled();
        if (!isDisabled) {
          await addButton.click();
          await page.waitForTimeout(200);
        }
      }

      // Verify the button is now disabled with "Max reached" text
      const addButton = page.getByRole('button', { name: /Max reached/ });
      await expect(addButton).toBeDisabled();
    });
  });

  test.describe('Wall Assembly Table', () => {
    test('should display table with correct headers', async ({ page }) => {
      await expect(page.getByRole('columnheader', { name: '#' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Material' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Thickness (mm)' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'R-Value (m²K/W)' })).toBeVisible();
    });

    test('should display lambda value column', async ({ page }) => {
      await expect(page.getByRole('columnheader', { name: /λ-Value/ })).toBeVisible();
    });

    test('should show Stud Insulation column when studs are enabled', async ({ page }) => {
      // Load example with studs
      await page.getByRole('button', { name: 'Standard Stud Wall with Service Space' }).click();
      await page.waitForTimeout(500);

      // Verify stud insulation column is visible
      await expect(page.getByRole('columnheader', { name: 'Stud Insulation' })).toBeVisible();
    });
  });

  test.describe('Analysis Tab', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('tab', { name: 'Analysis' }).click();
    });

    test('should display Dew Point Analysis card', async ({ page }) => {
      await expect(page.getByText('Dew Point Analysis')).toBeVisible();
      await expect(page.getByText(/Monitor condensation risks/)).toBeVisible();
    });

    test('should display Temperature Gradient card', async ({ page }) => {
      await expect(page.getByText('Temperature Gradient')).toBeVisible();
      await expect(page.getByText(/Analyze temperature distribution/)).toBeVisible();
    });
  });

  test.describe('Visualization Tab', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('tab', { name: 'Visualization' }).click();
    });

    test('should display Wall Visualization card', async ({ page }) => {
      await expect(page.getByText('Wall Visualization')).toBeVisible();
      await expect(page.getByText(/2D and 3D representations/)).toBeVisible();
    });

    test('should display House Sample Preview card', async ({ page }) => {
      await expect(page.getByText('House Sample Preview')).toBeVisible();
      await expect(page.getByText(/See your wall assembly in a complete house model/)).toBeVisible();
    });

    test('should display Generate House Sample button', async ({ page }) => {
      const generateButton = page.getByRole('link', { name: 'Generate House Sample' });
      await expect(generateButton).toBeVisible();
    });

    test('should load 3D visualization canvas', async ({ page }) => {
      // Wait for the 3D canvas to render (Three.js components)
      const canvas = page.locator('canvas');

      // There might be multiple canvases (2D and 3D visualizations)
      await expect(canvas.first()).toBeVisible({ timeout: 15000 });

      // Verify canvas has dimensions
      const boundingBox = await canvas.first().boundingBox();
      expect(boundingBox).toBeTruthy();
      expect(boundingBox!.width).toBeGreaterThan(0);
    });
  });
});

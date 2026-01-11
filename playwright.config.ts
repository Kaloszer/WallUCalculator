import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for WallUCalculator Next.js app
 * @see https://playwright.dev/docs/test-configuration
 *
 * NOTE: This app uses Three.js for 3D visualizations requiring WebGL.
 *
 * For CI without GPU, run with xvfb:
 *   xvfb-run bun run test:e2e
 *
 * For local testing with GPU:
 *   bun run test:e2e:headed
 */
export default defineConfig({
  // Directory containing test files
  testDir: './e2e',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI for stability
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL for navigation - Next.js default port
    baseURL: 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Take screenshot on failure
    screenshot: 'only-on-failure',

    // Record video on failure
    video: 'on-first-retry',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Enable WebGL for Three.js rendering in headless mode
        // See: https://www.createit.com/blog/headless-chrome-testing-webgl-using-playwright/
        launchOptions: {
          args: [
            '--headless',
            '--no-sandbox',
            '--use-angle=gl',
          ],
        },
      },
    },
    // Uncomment to add more browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes to start dev server
  },

  // Global test timeout
  timeout: 30 * 1000,

  // Expect timeout for assertions
  expect: {
    timeout: 10 * 1000,
  },
});

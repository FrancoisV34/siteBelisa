import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5179',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // Default: spin up the Vite dev server on a dedicated port for tests.
  // For full-stack E2E (Functions + D1 + R2), set E2E_BASE_URL=http://localhost:8788
  // and start `npx wrangler pages dev dist` separately (bindings come from wrangler.toml).
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npx vite --port 5179 --strictPort',
        url: 'http://localhost:5179',
        reuseExistingServer: false,
        timeout: 60_000,
      },
})

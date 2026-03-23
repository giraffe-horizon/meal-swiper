import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    serviceWorkers: 'block',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
      },
    },
  ],
  webServer: {
    command:
      'npx wrangler d1 execute meal-swiper-db --local --file schema.sql --persist-to .wrangler/state/e2e && npx wrangler d1 execute meal-swiper-db --local --file e2e/fixtures/seed.sql --persist-to .wrangler/state/e2e && npx wrangler dev --port 3000 --persist-to .wrangler/state/e2e',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})

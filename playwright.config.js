import { defineConfig } from '@playwright/test'

const PORT = 4179

export default defineConfig({
  testDir: 'test/e2e',
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Uses the locally installed Google Chrome, so no browser download is needed
    channel: 'chrome',
    viewport: { width: 1400, height: 900 }
  },
  // Tests run against the production build: the console bridge is stringified
  // into the preview after minification, which only a real build exercises.
  webServer: {
    command: `pnpm build && pnpm preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
})

import { defineConfig } from '@playwright/test'

const PORT = 4179
// esm.sh is replaced in the tests by a local fake (test/e2e/fakePackageCdn.js),
// so no test reaches, or caches anything from, the real CDN
const CDN_PORT = 4189

export default defineConfig({
  testDir: 'test/e2e',
  timeout: 60_000,
  // Monaco's language workers start slowly when many browsers run in parallel
  expect: { timeout: 10_000 },
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
  webServer: [
    {
      command: `pnpm build && node scripts/test-server.js ${PORT}`,
      url: `http://localhost:${PORT}`,
      env: {
        VITE_PACKAGE_CDN: `http://127.0.0.1:${CDN_PORT}/`,
        DATABASE_URL: 'postgres://cody:cody@localhost:5432/cody_test'
      },
      // A server you started yourself must be built with the same VITE_PACKAGE_CDN
      reuseExistingServer: !process.env.CI,
      timeout: 120_000
    },
    {
      command: `node test/e2e/fakePackageCdn.js ${CDN_PORT}`,
      url: `http://127.0.0.1:${CDN_PORT}/greet`,
      reuseExistingServer: !process.env.CI
    }
  ]
})

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // test/e2e holds the Playwright browser tests (pnpm test:e2e)
    include: ['test/unit/**/*.test.js']
  }
})

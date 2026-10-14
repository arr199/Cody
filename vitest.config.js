import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // test/e2e holds the Playwright browser tests (pnpm test:e2e)
    include: ['test/unit/**/*.test.js'],
    // Vitest empties CSS imports by default; the examples import theirs as text
    css: { include: [/src\/examples\/.+\.css/] }
  }
})

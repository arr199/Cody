import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/api/**/*.test.js'],
    env: { DATABASE_URL: 'postgres://cody:cody@localhost:5432/cody_test' },
    fileParallelism: false
  }
})

import neostandard from 'neostandard'

export default [
  // Global ignores (an object with only `ignores` applies to every config)
  { ignores: ['dist/', 'test-results/', 'playwright-report/'] },
  ...neostandard({ env: ['browser'] }),
  {
    // Tooling config files run in Node
    files: ['*.config.js'],
    languageOptions: { globals: { process: 'readonly' } }
  }
]

// CONSTANTS

// Shared snippets (api/snippets, served from this app's own origin)
export const SNIPPETS_API = '/api/snippets'

// Bare package imports in the preview load from here (src/preview/packageImports.js).
// The e2e build points it at a local fake CDN (test/e2e/fakePackageCdn.js).
export const PACKAGE_CDN = import.meta.env.VITE_PACKAGE_CDN || 'https://esm.sh/'

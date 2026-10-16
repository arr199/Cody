// CONSTANTS
export const API = {
  LINK_SHORTENER_URL: 'https://simple-api-server-production.up.railway.app/cody/'

}

// Bare package imports in the preview load from here (src/preview/packageImports.js).
// The e2e build points it at a host that can't resolve, so tests can only
// ever see the packages they fake (playwright.config.js).
export const PACKAGE_CDN = import.meta.env.VITE_PACKAGE_CDN || 'https://esm.sh/'

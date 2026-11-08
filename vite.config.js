import { defineConfig } from 'vite'
import { resolve } from 'node:path'

// Two pages: the app, and preview.html, which shows a share link's result
// on its own for "Open in new tab"
export default defineConfig({
  build: {
    rolldownOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        preview: resolve(import.meta.dirname, 'preview.html')
      }
    }
  }
})

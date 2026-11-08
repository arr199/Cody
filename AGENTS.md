# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project

Cody is a browser-based HTML/CSS/JS playground. It's vanilla JavaScript built with Vite, with no framework.

- Three Monaco editors (HTML, CSS, JS) with Emmet support.
- A live preview rendered into a sandboxed `<iframe srcdoc>`. `console` calls and uncaught errors are forwarded to an in-app console panel through `postMessage`.
- The editors' working state lives in the URL hash as `html|js|css`, each part URL-safe base64 (older path links still load). **Share** saves a snapshot through this repo's own API (`api/`, Vercel functions) into Postgres and copies a short `/s/<id>` link. Production uses Neon Postgres (Vercel integration, `DATABASE_URL`); locally, Docker (`docker-compose.yml`). The schema is `scripts/schema.sql`, applied by hand in the Neon SQL editor.
- Deployed on Vercel. `vercel.json` rewrites every path except `/api/` to `index.html`, which `/s/<id>` links and legacy path links depend on. Don't remove that rewrite. The previous host was Netlify (`public/_redirects`); the old Railway shortener and its links are retired.

## Rules

- **Never commit, push, amend, rebase or otherwise rewrite git history.** Leave every change uncommitted in the working tree. The user always reviews and commits the code. Creating or switching branches is fine when asked.
- Use **pnpm** only. Don't add `package-lock.json`, `yarn.lock` or any other lockfile.
- Never insert user code, console output or editor marker messages with `innerHTML`. Use `textContent` / `createElement`. Static, trusted markup (icons) is fine.
- The preview iframe must stay sandboxed **without** `allow-same-origin`, because shared links run arbitrary third-party code.
- Saved `/s/<id>` links and hash links must keep loading. A saved snippet never changes (its GET response is cached as immutable).
- Import Monaco from `src/editors.js`, never directly from `'monaco-editor'`, so the bundle only includes the HTML/CSS/JS languages.
- Keep changes scoped to the task. Don't add features or upgrade dependencies unless asked.
- **No environment-specific code.** Code runs the same locally, in tests and in production; only environment variables differ (`DATABASE_URL`, `VITE_PACKAGE_CDN`). Don't add branches like `isLocal()`, `if (process.env.NODE_ENV === ...)` or test-only guards in app code. Settings such as SSL belong in the connection string, not in code.
- Keep comments few and short: only where the code can't say it.
- Match the existing style: ESLint `neostandard` (no semicolons, 2-space indent, space before function parens).
- Design work uses the `impeccable` skill. Product truth lives in `PRODUCT.md`, the app's design system in `DESIGN.md` (tokens in `.impeccable/design.json`), and per-surface design contracts in `.impeccable/surfaces/`. Read them before changing UI or examples, and offer the user design variants to choose from before building.

## Testing

- **Every feature and bug fix needs tests.** Add or update tests in the same change. Work without tests isn't done.
- **Test the real implementation.** Import and call the real modules, and drive the real app in a real browser. Avoid mocks, stubs and fakes. Mock only what you can't run for real, such as third-party network services (the e2e tests fake the package CDN). The API and e2e tests use the real database in Docker, on its own `cody_test` database.
- Prefer asserting on what the user sees (rendered preview, console rows, URL, clipboard) over internal details.
- Tests live in `test/`:
  - `test/unit/`: Vitest tests for pure modules (`*.test.js`).
  - `test/e2e/`: Playwright tests against the production build (`*.spec.js`). They use the locally installed Google Chrome (`channel: 'chrome'`).
- A bug fix should come with a test that fails without the fix.

## Commands

```sh
pnpm install
pnpm dev       # start the Vite dev server
pnpm build     # production build into dist/
pnpm preview   # serve the production build
pnpm lint      # ESLint
pnpm test      # unit tests (Vitest)
pnpm test:e2e  # browser tests (Playwright); builds and serves the app and API itself

docker compose up -d  # local Postgres (needed by test:api, test:e2e and dev:api); after a schema change: docker compose down -v && docker compose up -d
pnpm dev:api   # vercel dev: the app plus the real api/ functions (vercel login + vercel link once)
pnpm test:api  # API tests against the local test database
```

Run `pnpm lint`, `pnpm test`, `pnpm test:api` and `pnpm test:e2e` (which also builds) before reporting work as done. The last two need `docker compose up -d`.

CI (`.github/workflows/ci.yml`) runs the same four commands, with the same `docker compose` database, on every push and pull request to `main`.

## Layout

- `index.html`: app shell (the rail, the `#workspace` grid with the editor, preview and console panes, and the phone tab bar), plus an inline script that applies the saved theme before paint.
- `main.js`: `bootstrap()` wires the modules together. It holds no feature logic of its own.
- `style.css`: all styles. Theme tokens are on `:root`, with light-mode overrides under `[data-theme="light"]`.
- `src/editors.js`: Monaco setup (slim ESM imports, workers, Emmet) and editor helpers. The only place that imports `monaco-editor`.
- `src/state/urlCodec.js`: pure encode/decode of the editors' code to and from share URLs, including legacy path links.
- `src/preview/buildDocument.js`: builds the preview's HTML document.
- `src/preview/previewFrame.js`: swaps in a fresh iframe on every render. Setting `srcdoc` on the same iframe would add a browser history entry each time and break the Back button.
- `src/preview/consoleBridge.js`: the script injected into the preview (console forwarding with value descriptions, `console.table`/`clear`, the prompt runner and its `ready` handshake), and the app-side message checks. Page code can post messages too, so everything arriving is sanitized.
- `src/preview/valueDescription.js`: snapshots logged values as plain data inside the preview (`createDescriber`, self-contained because it's stringified into the page); `summarize` and the sanitizers run in the app.
- `src/preview/promptCode.js`: rewrites console prompt entries before they run: the last expression's value, top-level `await`, and the loop guard.
- `src/preview/loopGuard.js`: rewrites the preview's copy of the code (JS pane and inline HTML scripts, parsed with acorn) so a loop running over 1 s breaks and reports its line. The runtime it calls is injected by `consoleBridge.js`. Editors and share links keep the original code.
- `src/preview/packageImports.js`: npm imports. Rewrites bare package names (`import x from 'pkg'`, `import('pkg')`) to the CDN in `PACKAGE_CDN` (`src/utils/API.js`, esm.sh; the e2e build points `VITE_PACKAGE_CDN` at the local fake in `test/e2e/fakePackageCdn.js`), and decides when the JS pane must run as a module (static imports, top-level await). A pane that needs no module stays a classic script, so the console prompt sees its variables.
- `src/preview/inlineScripts.js`: finds the inline JavaScript `<script>` blocks in the HTML pane, for the loop guard and package imports.
- `src/preview/runner.js`: decides when the preview runs. Auto-run (remembered) runs after each language's typing delay; with it off, edits wait for Run and the preview is marked out of date. Loaded code always runs.
- `src/preview/deviceToolbar.js`: the preview's width presets, free-drag frame width with a px readout, and fullscreen.
- `src/preview/openInTab.js`, `preview.html` and `src/preview/standalone.js`: Open in new tab renders the code from the URL hash in the same sandbox as the app's preview.
- `vite.config.js`: declares both pages (`index.html`, `preview.html`) for the build.
- `src/console/consolePanel.js`: the only module that writes to `#console`: the header strip (filters with counts, Clear), the log with editor errors in their own region, and the prompt's container.
- `src/console/valueView.js`: draws a value description as text or an expandable tree.
- `src/console/consolePrompt.js`: the prompt's keys (Enter runs, Shift+Enter adds a line, ↑/↓ history). Its Monaco keybindings are scoped with a `codyPrompt` context key, because Monaco shares keybindings across editors.
- `src/examples/`: starter examples (`launch` imports an npm package from esm.sh; the others need no network beyond one font). Each folder holds real `markup.html`, `style.css` and `script.js` files, imported as text with `?raw`. `index.js` lists them (`EXAMPLES`, `DEFAULT_EXAMPLE_ID`). A link with no code opens the default (`blank`) example, and loading one pushes a history entry so Back restores the previous code.
- `src/ui/`: the shell's behaviour.
  - `workspace.js`: the one owner of which view, editor and panel are showing (`data-view` / `data-language` / `data-panel` on `#workspace`). The `js` view shows only the JS editor beside the console; the preview keeps running hidden.
  - `viewToggle.js`: the Web | Console toggle in the editor bar, remembered in localStorage. Loaded code picks its view: only JS opens the JS view, any HTML or CSS the web view.
  - `tabs.js`: the desktop editor tabs and the phone tab bar (WAI-ARIA tablists), plus the error dots.
  - `splitter.js` and `layout.js`: the resizable editor/preview split and console drawer, with sizes kept in localStorage.
  - `runControls.js`: the auto-run switch and Run button (in the editor bar, and in the preview toolbar on phones) and the Ctrl/Cmd+Enter shortcut.
  - `menus.js` (dropdowns), `examplesMenu.js` (the Examples menu with its live preview), `preferences.js` (theme and font size), `share.js` (the Share button: save, copy the `/s/` link, or fall back to the hash link), `toast.js` (the shared status message).
- `src/share/snippetClient.js`: `/s/<id>` routes, and saving and loading snippets through the API.
- `api/snippets/`: the Vercel functions (`POST /api/snippets`, `GET /api/snippets/:id`). They use only Node's `req`/`res`, so Vercel, `vercel dev` and `scripts/test-server.js` run the same files.
- `api/_lib/`: code shared by the functions (`snippets.js`: validation, hash, ids; `db.js`: Postgres; `http.js`). Vercel doesn't deploy `_` folders as endpoints.
- `scripts/`: `schema.sql` (the database schema), `docker-init.sql` (creates `cody` and `cody_test` in Docker) and `test-server.js` (the production build plus the API, for e2e).
- `src/utils/`: API constants, `debounce`, and static icons.
- `test/`: see Testing above.

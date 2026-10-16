# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project

Cody is a browser-based HTML/CSS/JS playground. It's vanilla JavaScript built with Vite, with no framework.

- Three Monaco editors (HTML, CSS, JS) with Emmet support.
- A live preview rendered into a sandboxed `<iframe srcdoc>`. `console` calls and uncaught errors are forwarded to an in-app console panel through `postMessage`.
- Code is shared through the URL hash as `html|js|css`, each part URL-safe base64. Older links kept the code in the path, and they still load. A separate Express/MongoDB service shortens links (endpoint in `src/utils/API.js`; backend code: <https://github.com/arr199/Simple-API-Server>).
- Deployed on Vercel. `vercel.json` rewrites every path to `index.html`, which legacy path-based share links depend on. Don't remove that rewrite. The previous host was Netlify (<https://cody-studio.netlify.app>, `public/_redirects`). Old short links in the shortener's database still point at that domain.

## Rules

- **Never commit, push, amend, rebase or otherwise rewrite git history.** Leave every change uncommitted in the working tree. The user always reviews and commits the code. Creating or switching branches is fine when asked.
- Use **pnpm** only. Don't add `package-lock.json`, `yarn.lock` or any other lockfile.
- Never insert user code, console output or editor marker messages with `innerHTML`. Use `textContent` / `createElement`. Static, trusted markup (icons) is fine.
- The preview iframe must stay sandboxed **without** `allow-same-origin`, because shared links run arbitrary third-party code.
- Share links must stay backward compatible. Old links already stored in the shortener's database have to keep loading.
- Import Monaco from `src/editors.js`, never directly from `'monaco-editor'`, so the bundle only includes the HTML/CSS/JS languages.
- Keep changes scoped to the task. Don't add features or upgrade dependencies unless asked.
- Match the existing style: ESLint `neostandard` (no semicolons, 2-space indent, space before function parens).
- Design work uses the `impeccable` skill. Product truth lives in `PRODUCT.md`, the app's design system in `DESIGN.md` (tokens in `.impeccable/design.json`), and per-surface design contracts in `.impeccable/surfaces/`. Read them before changing UI or examples, and offer the user design variants to choose from before building.

## Testing

- **Every feature and bug fix needs tests.** Add or update tests in the same change. Work without tests isn't done.
- **Test the real implementation.** Import and call the real modules, and drive the real app in a real browser. Avoid mocks, stubs and fakes. Mock only what you can't run for real, such as third-party network services (the e2e tests fake the link shortener so they never write to its database).
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
pnpm test:e2e  # browser tests (Playwright); builds and serves the app itself
```

Run `pnpm lint`, `pnpm test` and `pnpm test:e2e` (which also builds) before reporting work as done.

## Layout

- `index.html`: app shell (the rail, the `#workspace` grid with the editor, preview and console panes, and the phone tab bar), plus an inline script that applies the saved theme before paint.
- `main.js`: `bootstrap()` wires the modules together. It holds no feature logic of its own.
- `style.css`: all styles. Theme tokens are on `:root`, with light-mode overrides under `[data-theme="light"]`.
- `src/editors.js`: Monaco setup (slim ESM imports, workers, Emmet) and editor helpers. The only place that imports `monaco-editor`.
- `src/state/urlCodec.js`: pure encode/decode of the editors' code to and from share URLs, including legacy path links.
- `src/preview/buildDocument.js`: builds the preview's HTML document.
- `src/preview/previewFrame.js`: swaps in a fresh iframe on every render. Setting `srcdoc` on the same iframe would add a browser history entry each time and break the Back button.
- `src/preview/consoleBridge.js`: the script injected into the preview (console forwarding plus a safe serializer), and the app-side message listener.
- `src/preview/loopGuard.js`: rewrites the preview's copy of the code (JS pane and inline HTML scripts, parsed with acorn) so a loop running over 1 s breaks and reports its line. The runtime it calls is injected by `consoleBridge.js`. Editors and share links keep the original code.
- `src/preview/runner.js`: decides when the preview runs. Auto-run (remembered) runs after each language's typing delay; with it off, edits wait for Run and the preview is marked out of date. Loaded code always runs.
- `src/preview/deviceToolbar.js`: the preview's width presets, free-drag frame width with a px readout, and fullscreen.
- `src/preview/openInTab.js`, `preview.html` and `src/preview/standalone.js`: Open in new tab renders the code from the URL hash in the same sandbox as the app's preview.
- `vite.config.js`: declares both pages (`index.html`, `preview.html`) for the build.
- `src/console/consolePanel.js`: the only module that writes to `#console`. Errors and logs live in separate regions.
- `src/examples/`: starter examples. Each folder holds real `markup.html`, `style.css` and `script.js` files, imported as text with `?raw`. `index.js` lists them (`EXAMPLES`, `DEFAULT_EXAMPLE_ID`). A link with no code opens the default example, and loading one pushes a history entry so Back restores the previous code.
- `src/ui/`: the shell's behaviour.
  - `workspace.js`: the one owner of which editor and which panel are showing (`data-language` / `data-panel` on `#workspace`).
  - `tabs.js`: the desktop editor tabs and the phone tab bar (WAI-ARIA tablists), plus the error dots.
  - `splitter.js` and `layout.js`: the resizable editor/preview split and console drawer, with sizes kept in localStorage.
  - `runControls.js`: the auto-run switch and Run button (in the editor bar, and in the preview toolbar on phones) and the Ctrl/Cmd+Enter shortcut.
  - `menus.js` (dropdowns), `examplesMenu.js` (the Examples menu with its live preview), `preferences.js` (theme and font size), `copyUrl.js` (shortened share link), `toast.js` (the shared status message).
- `src/utils/`: API constants, `debounce`, and static icons.
- `test/`: see Testing above.

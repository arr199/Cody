import { monaco, createEditors, readCode, setFontSize } from './src/editors'
import { encodeState, decodeState } from './src/state/urlCodec'
import { buildDocument } from './src/preview/buildDocument'
import { onConsoleMessage } from './src/preview/consoleBridge'
import { createConsolePanel } from './src/console/consolePanel'
import { loadPreferences, applyTheme, saveFontSize } from './src/ui/preferences'
import { createMenu, closeMenusOnOutsideInteraction } from './src/ui/menus'
import { setupViews } from './src/ui/views'
import { setupCopyUrl } from './src/ui/copyUrl'
import { debounce } from './src/utils/debounce'

// Every preview render re-runs the user's JS, so JS edits wait longer
// before re-rendering than HTML and CSS edits.
const RENDER_DELAY = { html: 500, css: 500, js: 1500 }
const ERRORS_DELAY = 1500

function bootstrap () {
  const $ = (selector) => document.querySelector(selector)
  const page = $('#page')

  const preferences = loadPreferences()
  const editors = createEditors(
    { html: $('#html-editor'), css: $('#css-editor'), js: $('#js-editor') },
    preferences
  )
  applyTheme(preferences.theme)

  // CONSOLE
  const consolePanel = createConsolePanel($('#console'))
  onConsoleMessage(page, (type, args) => consolePanel.appendLog(type, args))
  monaco.editor.onDidChangeMarkers(debounce(() => {
    consolePanel.setErrors(monaco.editor.getModelMarkers({}))
  }, ERRORS_DELAY))

  // PREVIEW + SHARE URL
  function update () {
    const code = readCode(editors)
    consolePanel.clearLogs()
    page.srcdoc = buildDocument(code)
    // Always written from the app root, which also moves legacy path-based
    // links over to the hash format.
    const state = encodeState(code)
    history.replaceState(null, '', import.meta.env.BASE_URL + (state ? `#${state}` : ''))
  }

  let renderTimer
  let loading = false

  // setValue fires change events synchronously; `loading` keeps them from
  // scheduling extra renders on top of the immediate one.
  function loadCode (code) {
    loading = true
    editors.html.setValue(code.html)
    editors.css.setValue(code.css)
    editors.js.setValue(code.js)
    loading = false
    clearTimeout(renderTimer)
    update()
  }

  for (const language of ['html', 'css', 'js']) {
    editors[language].onDidChangeModelContent(() => {
      if (loading) return
      clearTimeout(renderTimer)
      renderTimer = setTimeout(update, RENDER_DELAY[language])
    })
  }

  loadCode(decodeState(window.location))
  // Opening another share link in the same tab only changes the hash, which
  // doesn't reload the page. (replaceState in update() doesn't fire this.)
  window.addEventListener('hashchange', () => loadCode(decodeState(window.location)))

  // TOOLBAR
  const fontSizeMenu = createMenu($('#font-size-button'), $('#font-size-menu'), (value) => {
    const fontSize = Number(value)
    setFontSize(editors, fontSize)
    saveFontSize(fontSize)
  })
  const themeMenu = createMenu($('#theme-button'), $('#theme-menu'), applyTheme)
  closeMenusOnOutsideInteraction([fontSizeMenu, themeMenu])

  setupCopyUrl($('#copy-url-button'), $('#url-copy-container'))

  setupViews($('#editors-container'), {
    'front-end-view': $('#frontend-view-button'),
    'playground-view': $('#playground-view-button')
  })
}

bootstrap()

import { monaco, createEditors, createPromptEditor, readCode, setFontSize } from './src/editors'
import { encodeState, decodeState, hasCode } from './src/state/urlCodec'
import { EXAMPLES, DEFAULT_EXAMPLE_ID, getExample } from './src/examples'
import { buildDocument } from './src/preview/buildDocument'
import { onConsoleMessage, createPromptChannel } from './src/preview/consoleBridge'
import { preparePromptCode } from './src/preview/promptCode'
import { createPreviewFrame } from './src/preview/previewFrame'
import { createRunner } from './src/preview/runner'
import { createConsolePanel } from './src/console/consolePanel'
import { connectPrompt } from './src/console/consolePrompt'
import { loadPreferences, applyTheme, saveFontSize } from './src/ui/preferences'
import { createMenu, closeMenusOnOutsideInteraction } from './src/ui/menus'
import { createWorkspace } from './src/ui/workspace'
import { connectTabs, showTabErrors } from './src/ui/tabs'
import { setupLayoutHandles } from './src/ui/layout'
import { setupDeviceToolbar } from './src/preview/deviceToolbar'
import { setupCopyUrl } from './src/ui/copyUrl'
import { createToast } from './src/ui/toast'
import { setupOpenInTab } from './src/preview/openInTab'
import { renderExamplesMenu } from './src/ui/examplesMenu'
import { connectRunControls } from './src/ui/runControls'
import { debounce } from './src/utils/debounce'

// Every preview render re-runs the user's JS, so JS edits wait longer
// before re-rendering than HTML and CSS edits.
const RENDER_DELAY = { html: 500, css: 500, js: 1500 }
const ERRORS_DELAY = 1500
// The share link follows the editors whether or not the preview runs
const URL_DELAY = 500

function bootstrap () {
  const $ = (selector) => document.querySelector(selector)
  const preview = createPreviewFrame($('#page'))

  // WORKSPACE: which editor (and, on phones, which panel) is showing
  const workspace = createWorkspace($('#workspace'))
  const editorTabs = $('.editor-tabs')
  connectTabs(editorTabs, workspace, (tab, state) => tab.dataset.language === state.language)
  const panelTabs = $('.mobile-tabs')
  connectTabs(panelTabs, workspace, (tab, state) => tab.dataset.panel
    ? state.panel === tab.dataset.panel
    : state.panel === 'editor' && state.language === tab.dataset.language)
  setupLayoutHandles($('#workspace'))
  setupDeviceToolbar({
    pane: $('.preview-pane'),
    stage: $('.preview-stage'),
    frame: $('.preview-frame'),
    presets: $('.device-presets'),
    readout: $('.frame-readout'),
    frameHandle: $('.handle-frame'),
    fullscreenButton: $('#fullscreen-button')
  })

  const preferences = loadPreferences()
  const editors = createEditors(
    { html: $('#html-editor'), css: $('#css-editor'), js: $('#js-editor') },
    preferences
  )
  applyTheme(preferences.theme)

  // CONSOLE
  const consolePanel = createConsolePanel($('#console'))
  const promptChannel = createPromptChannel(() => preview.window)
  onConsoleMessage(() => preview.window, (message) => {
    if (message.type === 'ready') promptChannel.open()
    else consolePanel.receive(message)
  })
  // A marker's model tells which editor it belongs to. The console prompt is
  // a Monaco editor too; its markers aren't editor errors.
  const paneOf = new Map(['html', 'css', 'js'].map(language => [editors[language].getModel().uri.toString(), language]))
  const languageOf = (uri) => paneOf.get(uri.toString())
  monaco.editor.onDidChangeMarkers(debounce(() => {
    const markers = monaco.editor.getModelMarkers({}).filter(marker => languageOf(marker.resource))
    consolePanel.setErrors(markers)
    const failing = markers.filter(marker => marker.severity === monaco.MarkerSeverity.Error)
    const failingLanguages = new Set(failing.map(marker => languageOf(marker.resource)))
    showTabErrors(editorTabs, failingLanguages)
    showTabErrors(panelTabs, failingLanguages)
  }, ERRORS_DELAY))

  // CONSOLE PROMPT: entries run in the preview, rewritten by preparePromptCode
  const promptEditor = createPromptEditor(consolePanel.promptContainer, preferences)
  connectPrompt(promptEditor, (code) => {
    consolePanel.appendInput(code)
    promptChannel.send(preparePromptCode(code))
  })

  // PREVIEW + SHARE URL
  // Always built from the app root, which also moves legacy path-based links
  // over to the hash format.
  function urlFor (code) {
    const state = encodeState(code)
    return import.meta.env.BASE_URL + (state ? `#${state}` : '')
  }

  function saveUrl () {
    history.replaceState(null, '', urlFor(readCode(editors)))
  }
  const saveUrlSoon = debounce(saveUrl, URL_DELAY)

  // RUN: auto-run, the Run button and Ctrl/Cmd+Enter decide when this happens
  const runner = createRunner({
    run () {
      consolePanel.clearLogs()
      promptChannel.reset()
      preview.render(buildDocument(readCode(editors)))
    },
    delays: RENDER_DELAY
  })
  connectRunControls(document.querySelectorAll('.run-controls'), runner)

  let loading = false

  // Loaded code always runs, even with auto-run off. setValue fires change
  // events synchronously; `loading` keeps them from counting as edits.
  function loadCode (code) {
    workspace.select({ language: 'js', panel: workspace.state.panel }) // loaded code opens on JS
    loading = true
    editors.html.setValue(code.html)
    editors.css.setValue(code.css)
    editors.js.setValue(code.js)
    loading = false
    saveUrl()
    runner.runNow()
  }

  for (const language of ['html', 'css', 'js']) {
    editors[language].onDidChangeModelContent(() => {
      if (loading) return
      saveUrlSoon()
      runner.edited(language)
    })
  }

  // A link without code opens the welcome example
  const linkedCode = decodeState(window.location)
  loadCode(hasCode(linkedCode) ? linkedCode : getExample(DEFAULT_EXAMPLE_ID))
  // Opening another share link in the same tab only changes the hash, which
  // doesn't reload the page. (replaceState in saveUrl() doesn't fire this.)
  window.addEventListener('hashchange', () => loadCode(decodeState(window.location)))

  // EXAMPLES
  // Loading one adds a history entry, so Back brings the previous code back
  // through the hashchange listener above.
  function loadExample (id) {
    const example = getExample(id)
    history.pushState(null, '', urlFor(example))
    loadCode(example)
  }
  const examplesPicker = renderExamplesMenu($('#examples-menu'), EXAMPLES)
  const examplesMenu = createMenu($('#examples-button'), $('#examples-menu'), loadExample, {
    onToggle: examplesPicker.onToggle
  })

  // TOOLBAR
  const fontSizeMenu = createMenu($('#font-size-button'), $('#font-size-menu'), (value) => {
    const fontSize = Number(value)
    setFontSize(editors, fontSize)
    saveFontSize(fontSize)
  })
  const themeMenu = createMenu($('#theme-button'), $('#theme-menu'), applyTheme)
  closeMenusOnOutsideInteraction([examplesMenu, fontSizeMenu, themeMenu])

  const toast = createToast($('#url-copy-container'))
  setupCopyUrl($('#copy-url-button'), toast)
  setupOpenInTab($('#open-tab-button'), () => readCode(editors), toast)
}

bootstrap()

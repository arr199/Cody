import { monaco } from '../editors'
import { readStored, writeStored } from '../utils/storage'

// The Monaco theme is the single source of truth: a light editor theme
// (vs / hc-light) puts the whole app in light mode, a dark one (vs-dark /
// hc-black) in dark mode. Keep in sync with the inline script in index.html,
// which applies the saved theme before first paint.
const THEME_KEY = 'cody-editor-theme'
const FONT_SIZE_KEY = 'cody-editor-font-size'
const DEFAULT_THEME = 'vs-dark'
const DEFAULT_FONT_SIZE = 15

export function loadPreferences () {
  return {
    theme: readStored(THEME_KEY) || DEFAULT_THEME,
    fontSize: Number(readStored(FONT_SIZE_KEY)) || DEFAULT_FONT_SIZE
  }
}

function isLightTheme (name) {
  return name === 'vs' || name === 'hc-light'
}

export function applyTheme (editorTheme) {
  document.documentElement.dataset.theme = isLightTheme(editorTheme) ? 'light' : 'dark'
  monaco.editor.setTheme(editorTheme)
  writeStored(THEME_KEY, editorTheme)
}

export function saveFontSize (fontSize) {
  writeStored(FONT_SIZE_KEY, String(fontSize))
}

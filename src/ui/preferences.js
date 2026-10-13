import { monaco } from '../editors'

// The Monaco theme is the single source of truth: a light editor theme
// (vs / hc-light) puts the whole app in light mode, a dark one (vs-dark /
// hc-black) in dark mode. Keep in sync with the inline script in index.html,
// which applies the saved theme before first paint.
const THEME_KEY = 'cody-editor-theme'
const FONT_SIZE_KEY = 'cody-editor-font-size'
const DEFAULT_THEME = 'vs-dark'
const DEFAULT_FONT_SIZE = 15

// Storage can be unavailable (private mode, blocked site data); preferences
// then just don't persist.
function read (key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write (key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {}
}

export function loadPreferences () {
  return {
    theme: read(THEME_KEY) || DEFAULT_THEME,
    fontSize: Number(read(FONT_SIZE_KEY)) || DEFAULT_FONT_SIZE
  }
}

function isLightTheme (name) {
  return name === 'vs' || name === 'hc-light'
}

export function applyTheme (editorTheme) {
  document.documentElement.dataset.theme = isLightTheme(editorTheme) ? 'light' : 'dark'
  monaco.editor.setTheme(editorTheme)
  write(THEME_KEY, editorTheme)
}

export function saveFontSize (fontSize) {
  write(FONT_SIZE_KEY, String(fontSize))
}

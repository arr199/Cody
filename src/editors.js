// Monaco is imported piece by piece so the bundle only ships the HTML, CSS and
// JavaScript languages instead of every language Monaco supports.
// Other modules should import `monaco` from here, never from 'monaco-editor'.
import * as monaco from 'monaco-editor/editor'
import 'monaco-editor/features/register.all'
import 'monaco-editor/languages/definitions/html/register'
import 'monaco-editor/languages/definitions/css/register'
import 'monaco-editor/languages/definitions/javascript/register'
import 'monaco-editor/languages/features/html/register'
import 'monaco-editor/languages/features/css/register'
import 'monaco-editor/languages/features/typescript/register'
import HtmlWorker from 'monaco-editor/languages/features/html/html.worker?worker'
import CssWorker from 'monaco-editor/languages/features/css/css.worker?worker'
import TsWorker from 'monaco-editor/languages/features/typescript/ts.worker?worker'
import EditorWorker from 'monaco-editor/editor/editor.worker?worker'
import { emmetHTML, emmetCSS } from 'emmet-monaco-es'

export { monaco }

const editorOptions = {
  value: '',
  automaticLayout: true,
  renderLineHighlight: 'none',
  fontFamily: "'Cascadia Code', 'Fira Code', Consolas, Menlo, monospace",
  overviewRulerBorder: false,
  cursorSmoothCaretAnimation: 'on',
  cursorBlinking: 'expand',
  cursorWidth: 3,
  overviewRulerLanes: 0,
  minimap: { enabled: false },
  padding: { top: 20 },
  codeLens: true
}

function getWorker (_, label) {
  if (label === 'html') return new HtmlWorker()
  if (label === 'css') return new CssWorker()
  if (label === 'javascript' || label === 'typescript') return new TsWorker()
  return new EditorWorker()
}

export function createEditors (containers, { theme, fontSize }) {
  self.MonacoEnvironment = { getWorker }
  emmetHTML(monaco)
  emmetCSS(monaco)

  const options = { ...editorOptions, theme, fontSize }
  const html = monaco.editor.create(containers.html, { ...options, language: 'html' })
  const css = monaco.editor.create(containers.css, { ...options, language: 'css' })
  const js = monaco.editor.create(containers.js, { ...options, language: 'javascript' })

  return { html, css, js, all: [html, css, js] }
}

export function readCode (editors) {
  return {
    html: editors.html.getValue(),
    css: editors.css.getValue(),
    js: editors.js.getValue()
  }
}

export function setFontSize (editors, fontSize) {
  editors.all.forEach(editor => editor.updateOptions({ fontSize }))
}

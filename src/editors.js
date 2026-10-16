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

const promptOptions = {
  value: '',
  language: 'javascript',
  automaticLayout: true,
  fontFamily: editorOptions.fontFamily,
  fontSize: 13,
  lineNumbers: 'off',
  glyphMargin: false,
  folding: false,
  lineDecorationsWidth: 0,
  lineNumbersMinChars: 0,
  renderLineHighlight: 'none',
  overviewRulerLanes: 0,
  overviewRulerBorder: false,
  hideCursorInOverviewRuler: true,
  minimap: { enabled: false },
  stickyScroll: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: 'on',
  // The prompt is short; let suggestions overflow it instead of clipping
  fixedOverflowWidgets: true,
  // Enter runs the entry, as in DevTools; Tab accepts a completion
  acceptSuggestionOnEnter: 'off',
  padding: { top: 6, bottom: 6 },
  scrollbar: { horizontal: 'hidden', alwaysConsumeMouseWheel: false },
  placeholder: 'Run JavaScript in the preview',
  ariaLabel: 'Console prompt: JavaScript to run in the preview'
}

const PROMPT_MAX_LINES = 6

// The console's prompt: one line that grows with its content up to six
// lines, then scrolls. createEditors() must run first (it sets up workers).
export function createPromptEditor (container, { theme }) {
  const editor = monaco.editor.create(container, { ...promptOptions, theme })
  const fit = () => {
    const lineHeight = editor.getOption(monaco.editor.EditorOption.lineHeight)
    const padding = promptOptions.padding.top + promptOptions.padding.bottom
    container.style.height = `${Math.min(editor.getContentHeight(), lineHeight * PROMPT_MAX_LINES + padding)}px`
  }
  editor.onDidContentSizeChange(fit)
  fit()
  return editor
}

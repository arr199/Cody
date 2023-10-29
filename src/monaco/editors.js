import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import JsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import { emmetHTML, emmetCSS, emmetJSX } from 'emmet-monaco-es'
import * as monaco from 'monaco-editor'

// EDITOR OPTIONS
export const editorOptions = {
  value: '',
  language: 'html',
  theme: 'vs-dark',
  automaticLayout: true,
  renderLineHighlight: 'none',
  fontFamily: 'Cascadia Code',
  fontSize: '15px',
  overviewRulerBorder: false,
  cursorSmoothCaretAnimation: 'on',
  cursorBlinking: 'expand',
  cursorWidth: 3,
  overviewRulerLanes: 0,
  minimap: { enabled: false },
  padding: { top: '20px' },
  codeLens: true

}

// SETTING THE EMMET SUPPORT
emmetHTML(monaco)
emmetCSS(monaco)
emmetJSX(monaco)

window.MonacoEnvironment = {
  getWorker (workerId, label) {
    if (label === 'html') {
      return new HtmlWorker()
    } else if (label === 'css') {
      return new CssWorker()
    } else if (label === 'javascript') {
      return new JsWorker()
    } else return EditorWorker()
  }
}

// SETTING UP OUR 3 EDITORS (HTML, JS, CSS) //
export const htmlEditor = monaco.editor.create(document.querySelector('#html-editor'), editorOptions)
export const jsEditor = monaco.editor.create(document.querySelector('#js-editor'), { ...editorOptions, language: 'javascript' })
export const cssEditor = monaco.editor.create(document.querySelector('#css-editor'), { ...editorOptions, language: 'css' })

// CREATE THE HTML PAGE WITH OUR 3 EDITORS VALUES
export function createHtml () {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
      <style>${cssEditor.getValue()}</style>
    </head>
    <body>
      ${htmlEditor.getValue()}
      <script>
      ${jsEditor.getValue()}
      </script> 
    </body>
    </html>
    `
}

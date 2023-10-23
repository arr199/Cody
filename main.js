/* eslint-disable brace-style */
// TODO LIST //
// short the link
// fix the left-navbar buttons // ✅
import { encode, decode } from 'js-base64'
// importing monaco editor and our workers
import * as monaco from 'monaco-editor'
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import JsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import { emmetHTML, emmetCSS, emmetJSX } from 'emmet-monaco-es'
// fontSize icon and select menu
const fontSizeMenu = document.querySelector('#font-size-menu')
// theme
const themeMenu = document.querySelector('#theme-menu')
// copy url icon
const copyUrlBtn = document.querySelector('#copy-url')
const page = document.querySelector('#page')
// setting the emmet support
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
    }
    else return EditorWorker()
  }
}

// setting up the options for the editors
const editorOptions = {
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
  padding: { top: '20px' }

}
// setting up our 3 editors (html, js, css) //
const htmlEditor = monaco.editor.create(document.querySelector('#html-editor'), editorOptions)
const jsEditor = monaco.editor.create(document.querySelector('#js-editor'), { ...editorOptions, language: 'javascript' })
const cssEditor = monaco.editor.create(document.querySelector('#css-editor'), { ...editorOptions, language: 'css' })

// function init () {
//   // getting the url and splitting the url base64 part by "|" which is "%7C" in url encode
//   const url = window.location.href.split('/')[3]
//   const rawHtml = url.split('%7C')[0]
//   const rawJs = url.split('%7C')[1]
//   const rawCss = url.split('%7C')[2]

//   // setting the values of our editors to the url code , now decoded
//   htmlEditor.setValue(decode(rawHtml))
//   jsEditor.setValue(decode(rawJs))
//   cssEditor.setValue(decode(rawCss))
// }

// adding debouncing for our 3 editors and also encoding the text in base64 and passing it to the url//
let renderHtml
htmlEditor.onDidChangeModelContent(e => {
  clearTimeout(renderHtml)
  renderHtml = setTimeout(() => { // we add "|"  between every editor encode text in order to know later//
    page.setAttribute('srcdoc', createHtml()) // which part of the url represent our exact editor //
    history.replaceState(null, '', `${encode(htmlEditor.getValue())}|${encode(jsEditor.getValue())}|${encode(cssEditor.getValue())}`)
  }, 500)
})

let renderJs
jsEditor.onDidChangeModelContent(e => {
  clearTimeout(renderJs)
  renderJs = setTimeout(() => {
    page.setAttribute('srcdoc', createHtml())
    history.replaceState(null, '', `${encode(htmlEditor.getValue())}|${encode(jsEditor.getValue())}|${encode(cssEditor.getValue())}`)
  }, 2000)
})

let renderCss
cssEditor.onDidChangeModelContent(e => {
  clearTimeout(renderCss)
  renderCss = setTimeout(function () {
    page.setAttribute('srcdoc', createHtml())
    history.replaceState(null, '', `${encode(htmlEditor.getValue())}|${encode(jsEditor.getValue())}|${encode(cssEditor.getValue())}`)
  }, 500)
})

// copy the url when we click on the icon //
// copyUrlBtn.addEventListener('click', () => {
//   navigator.clipboard.writeText(window.location.href)
// })

// set the font-size every time we change the selected box //
fontSizeMenu.addEventListener('change', () => {
  htmlEditor.updateOptions({ fontSize: fontSizeMenu.value })
  cssEditor.updateOptions({ fontSize: fontSizeMenu.value })
  jsEditor.updateOptions({ fontSize: fontSizeMenu.value })
})

// set a new editor theme when we change the the select box //

themeMenu.addEventListener('change', () => {
  htmlEditor.updateOptions({ theme: themeMenu.value })
  htmlEditor.updateOptions({ theme: themeMenu.value })
  htmlEditor.updateOptions({ theme: themeMenu.value })
})

//  set the theme every time we change the select box //
document.addEventListener('click', (e) => {
  if (e.target.id === 'theme-icon') {
    themeMenu.size = 10
    themeMenu.style.zIndex = '10'
  }
  else {
    themeMenu.size = 1
    themeMenu.style.zIndex = '-10'
  }
})

// when we click the font-size icon open the select box //
document.addEventListener('click', (e) => {
  if (e.target.id === 'font-size-icon') {
    fontSizeMenu.style.zIndex = '10'
    fontSizeMenu.size = 10
  }
  // when we click outside of it , close it //
  else {
    fontSizeMenu.size = 1
    fontSizeMenu.style.zIndex = '-10'
  }
})

function createHtml () {
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
// init()

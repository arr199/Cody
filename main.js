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
import { editorOptions } from './src/editorOptions'

// COMPONENTS
import { fontSizeDropDownMenu, ThemeDropDownMenu, UrlCopyContainer } from './src/components'
import { removeActiveClasses } from './src/utils'

// fontSize icon and select menu
const fontSizeButtonContainer = document.querySelector('#font-size-button-container')
const fontSizeButton = document.querySelector('#font-size-button')

// theme
const themeMenuButton = document.querySelector('#theme-button')
const themeButtonContainer = document.querySelector('#theme-button-container')
// copy url icon
const copyUrlBtn = document.querySelector('#copy-url-button')
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

// setting up our 3 editors (html, js, css) //
const htmlEditor = monaco.editor.create(document.querySelector('#html-editor'), editorOptions)
const jsEditor = monaco.editor.create(document.querySelector('#js-editor'), { ...editorOptions, language: 'javascript' })
const cssEditor = monaco.editor.create(document.querySelector('#css-editor'), { ...editorOptions, language: 'css' })

function init () {
  // getting the url and splitting the url base64 part by "|" which is "%7C" in url encode
  const url = window.location.href.split('/')[3]
  const rawHtml = url.split('%7C')[0]
  const rawJs = url.split('%7C')[1]
  const rawCss = url.split('%7C')[2]

  // setting the values of our editors to the url code , now decoded
  if (rawHtml) {
    htmlEditor.setValue(decode(rawHtml))
  }
  if (rawJs) {
    jsEditor.setValue(decode(rawJs))
  }
  if (rawCss) {
    cssEditor.setValue(decode(rawCss))
  }
}

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

// EVENT LISTENERS //

// FONT SIZE BUTTON //
fontSizeButton.addEventListener('click', (e) => {
  e.target.classList.toggle('buttons-active')
  const fontSizeMenu = document.querySelector('#font-size-menu')

  if (fontSizeMenu !== null) {
    fontSizeMenu.remove()
  }
  else {
    fontSizeButtonContainer.insertAdjacentHTML('beforeend', fontSizeDropDownMenu())
  }
  e.stopPropagation()
})

// THEME BUTTON //
themeMenuButton.addEventListener('click', (e) => {
  e.target.classList.toggle('buttons-active')
  const themeMenu = document.querySelector('#theme-menu')
  if (themeMenu !== null) {
    themeMenu.remove()
  }
  else {
    themeButtonContainer.insertAdjacentHTML('beforeend', ThemeDropDownMenu())
  }
  e.stopPropagation()
})

// COPY URL BUTTON //
copyUrlBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(window.location.href)

  document.body.insertAdjacentHTML('beforeend', UrlCopyContainer())
  const timer = setTimeout(() => {
    const urlCopyContainer = document.querySelector('#url-copy-container')
    urlCopyContainer.remove()
  }, 1500)
  return () => clearTimeout(timer)
})

//  DROP DOWN MENU EVENT LISTENERS //
document.addEventListener('click', (e) => {
  const fontSizeMenu = document.querySelector('#font-size-menu')
  const themeMenu = document.querySelector('#theme-menu')

  if (e.target.dataset.id === 'font-size') {
    htmlEditor.updateOptions({ fontSize: e.target.innerText })
    cssEditor.updateOptions({ fontSize: e.target.innerText })
    jsEditor.updateOptions({ fontSize: e.target.innerText })
    fontSizeMenu.remove()
  }
  if (e.target.dataset.id === 'theme') {
    htmlEditor.updateOptions({ theme: e.target.innerText })
    cssEditor.updateOptions({ theme: e.target.innerText })
    jsEditor.updateOptions({ theme: e.target.innerText })
    themeMenu.remove()
  }

  removeActiveClasses()
})

// CLOSE THE DROP DOWN MENU WHEN WE CLICK OUTSIDE OF IT //
document.addEventListener('mousedown', (e) => {
  const themeMenu = document.querySelector('#theme-menu')
  const fontSizeMenu = document.querySelector('#font-size-menu')

  const target = e.target
  if (themeMenu !== null && themeMenu.contains(target) === false && target !== themeMenuButton) {
    themeMenu.remove()
    removeActiveClasses()
  }
  if (fontSizeMenu !== null && fontSizeMenu.contains(target) === false && target !== fontSizeButton) {
    fontSizeMenu.remove()
    removeActiveClasses()
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
init()

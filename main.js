/* eslint-disable no-new-func */
/* eslint-disable brace-style */
import { encode, decode } from 'js-base64'
import { htmlEditor, cssEditor, jsEditor, createHtml } from './src/monaco/editors'
// COMPONENTS
import { FontSizeMenu } from './src/components/FontSizeMenu'
import { ThemeMenu } from './src/components/ThemeMenu'

import { removeActiveClasses } from './src/utils/functions'
import { API } from './src/utils/API'
import { getErrors } from './src/monaco/getErrors'
import { getConsoleLogs } from './src/monaco/getConsoleLogs'

// FONT-SIZE ICON AND SELECT MENU
const fontSizeButtonContainer = document.querySelector('#font-size-button-container')
const fontSizeButton = document.querySelector('#font-size-button')
// THEME
const themeMenuButton = document.querySelector('#theme-button')
const themeButtonContainer = document.querySelector('#theme-button-container')
// COPY URL
const copyUrlBtn = document.querySelector('#copy-url-button')
const urlCopyContainer = document.querySelector('#url-copy-container')

const page = document.querySelector('#page')
// TOP NAVBAR BUTTONS
const frontEndButton = document.querySelector('#frontend-view-button')
const playgroundButton = document.querySelector('#playground-view-button')

function init () {
  // GETTING THE URL AND SPLITTING THE URL BASE64 PART BY "|" WHICH IS "%7C" IN URL ENCODE
  const url = window.location.href.split('/')[3]
  const rawHtml = url.split('%7C')[0]
  const rawJs = url.split('%7C')[1]
  const rawCss = url.split('%7C')[2]

  // SETTING THE VALUES OF OUR EDITORS TO THE URL CODE , NOW DECODED
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

// ADDING DEBOUNCING FOR OUR 3 EDITORS AND ALSO ENCODING THE TEXT IN BASE64 AND PASSING IT TO THE URL//
let renderHtml
htmlEditor.onDidChangeModelContent(e => {
  clearTimeout(renderHtml)
  renderHtml = setTimeout(() => { // WE ADD "|"  BETWEEN EVERY EDITOR CODE IN ORDER TO KNOW LATER//
    page.setAttribute('srcdoc', createHtml()) // WHICH PART OF THE URL REPRESENT OUR EXACT EDITOR //
    history.replaceState(null, '', `${encode(htmlEditor.getValue())}|${encode(jsEditor.getValue())}|${encode(cssEditor.getValue())}`)
  }, 500)
})

let renderJs
jsEditor.onDidChangeModelContent(e => {
  clearTimeout(renderJs)
  renderJs = setTimeout(() => {
    page.setAttribute('srcdoc', createHtml())
    history.replaceState(null, '', `${encode(htmlEditor.getValue())}|${encode(jsEditor.getValue())}|${encode(cssEditor.getValue())}`)
    getConsoleLogs()
  }, 1500)
})

let renderCss
cssEditor.onDidChangeModelContent(e => {
  clearTimeout(renderCss)
  renderCss = setTimeout(function () {
    page.setAttribute('srcdoc', createHtml())
    history.replaceState(null, '', `${encode(htmlEditor.getValue())}|${encode(jsEditor.getValue())}|${encode(cssEditor.getValue())}`)
  }, 500)
})
// GETTING THE EDITOR MARKERS (ERRORS) //
getErrors()

/// //// EVENT LISTENERS //////

// FRONTEND VIEW BUTTON //
frontEndButton.addEventListener('click', () => {
  const editorsEl = Array.from(document.querySelectorAll('.editors'))
  const editorsContainer = document.querySelector('#editors-container')

  editorsEl.forEach(editor => {
    editor.style.display = 'block'
  })
  editorsContainer.classList.remove('playground-view')
  editorsContainer.classList.add('front-end-view')
})

// PLAYGROUND VIEW BUTTON //
playgroundButton.addEventListener('click', () => {
  const editorsEl = Array.from(document.querySelectorAll('.editors'))
  const editorsContainer = document.querySelector('#editors-container')

  editorsEl.forEach(editor => {
    if (editor.id !== 'console' && editor.id !== 'js-editor') {
      editor.style.display = 'none'
    }
  })
  editorsContainer.classList.remove('front-end-view')
  editorsContainer.classList.add('playground-view')
})

// FONT SIZE BUTTON //
fontSizeButton.addEventListener('click', (e) => {
  e.target.classList.toggle('buttons-active')
  const fontSizeMenu = document.querySelector('#font-size-menu')

  if (fontSizeMenu !== null) {
    fontSizeMenu.remove()
  }
  else {
    fontSizeButtonContainer.insertAdjacentHTML('beforeend', FontSizeMenu())
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
    themeButtonContainer.insertAdjacentHTML('beforeend', ThemeMenu())
  }
  e.stopPropagation()
})

// COPY URL BUTTON //
let disableTimer
copyUrlBtn.addEventListener('click', () => {
  clearTimeout(disableTimer)

  urlCopyContainer.style.display = 'grid'
  disableTimer = setTimeout(() => {
    urlCopyContainer.style.display = 'none'

    const urlContent = window.location.href
    // SENDING OUR URL TO THE BACKEND AND GETTING THE SHORTENED VERSION OF IT //
    fetch(API.LINK_SHORTENER_URL, {
      method: 'POST',
      body: JSON.stringify({ content: urlContent }),
      headers: { 'Content-Type': 'application/json' }
    })
      .then(res => res.json())
      .then(data => {
        navigator.clipboard.writeText(data.link)
      })
  }, 1000)
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

// CLOSE THE DROP-DOWN MENU WHEN WE CLICK OUTSIDE OF IT //
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

init()

import { readStored, writeStored } from '../utils/storage'
import { VIEWS } from './workspace'

const STORAGE_KEY = 'cody-view'

export function storedView () {
  const view = readStored(STORAGE_KEY)
  return VIEWS.includes(view) ? view : 'web'
}

// Only JS opens in the JS view, any markup or styles in the web view; empty code keeps the current view
export function viewFor (code, current) {
  if (code.html || code.css) return 'web'
  if (code.js) return 'js'
  return current
}

export function connectViewToggle (group, workspace) {
  const buttons = [...group.querySelectorAll('[data-view]')]
  group.addEventListener('click', (event) => {
    const button = event.target.closest('[data-view]')
    if (button) workspace.select({ view: button.dataset.view })
  })
  workspace.subscribe(({ view }) => {
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.view === view))
    writeStored(STORAGE_KEY, view)
  })
}

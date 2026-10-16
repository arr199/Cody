import { errorSvg, logsSvg, clearSvg, promptSvg, resultSvg } from '../utils/svgs'
import { renderValue } from './valueView'

const ROW_CLASS = { error: 'error', warn: 'warn', log: 'string-log' }
const FILTERS = [['all', 'All'], ['log', 'Logs'], ['warn', 'Warnings'], ['error', 'Errors']]
const EMPTY_TEXT = 'Console output appears here'
const FILTERED_TEXT = 'Nothing to show for this filter'
// A page logging every frame would otherwise grow the log, and every layout, forever
const MAX_ROWS = 1000

function el (tag, className) {
  const node = document.createElement(tag)
  if (className) node.className = className
  return node
}

// The only module that writes to the console element: a header strip (the
// filters with counts, Clear), then the log. Editor errors and the preview's
// output live in separate regions, so updating one never wipes the other.
// User content only goes in through textContent; icons are static markup.
export function createConsolePanel (element) {
  const header = el('div', 'console-header')
  const title = el('span', 'console-title')
  title.textContent = 'Console'
  const filterGroup = el('div', 'console-filters')
  filterGroup.setAttribute('role', 'group')
  filterGroup.setAttribute('aria-label', 'Show')
  const counters = {}
  const filterButtons = FILTERS.map(([id, label]) => {
    const button = el('button', 'console-filter')
    button.type = 'button'
    button.dataset.filter = id
    button.setAttribute('aria-pressed', String(id === 'all'))
    counters[id] = el('span', 'console-count')
    button.append(label + ' ', counters[id])
    return button
  })
  filterGroup.append(...filterButtons)
  const clearButton = el('button', 'console-clear')
  clearButton.type = 'button'
  clearButton.title = 'Clear the console (Ctrl+L)'
  clearButton.setAttribute('aria-label', 'Clear')
  clearButton.insertAdjacentHTML('afterbegin', clearSvg)
  const clearLabel = el('span', 'console-clear-label')
  clearLabel.textContent = 'Clear'
  clearButton.append(clearLabel)
  header.append(title, filterGroup, clearButton)

  const log = el('div', 'console-log')
  log.tabIndex = 0
  log.setAttribute('aria-label', 'Console output')
  log.dataset.filter = 'all'
  const errorsRegion = el('div', 'console-region')
  const logsRegion = el('div', 'console-region')
  const dropNote = el('p', 'console-dropped')
  const empty = el('p', 'console-empty')
  log.append(errorsRegion, dropNote, logsRegion, empty)
  const prompt = el('div', 'console-prompt')
  prompt.insertAdjacentHTML('afterbegin', promptSvg)
  const promptContainer = el('div', 'prompt-editor')
  prompt.append(promptContainer)
  element.replaceChildren(header, log, prompt)

  const counts = { log: 0, warn: 0, error: 0 }
  let editorErrors = 0
  let filter = 'all'
  let pending = [] // rows waiting for the next frame
  let dropped = 0 // older rows removed to stay under MAX_ROWS

  function refresh () {
    const errors = counts.error + editorErrors
    const totals = { all: counts.log + counts.warn + errors, log: counts.log, warn: counts.warn, error: errors }
    for (const [id] of FILTERS) counters[id].textContent = String(totals[id])
    empty.hidden = totals[filter] > 0
    empty.textContent = totals.all === 0 ? EMPTY_TEXT : FILTERED_TEXT
    dropNote.hidden = dropped === 0
    dropNote.textContent = `${dropped} older messages removed`
  }

  // Rows are appended once per frame, so a page logging thousands of lines
  // costs one layout per frame instead of one per line
  function flush () {
    const following = log.scrollHeight - log.scrollTop - log.clientHeight < 4
    const rows = pending.slice(-MAX_ROWS)
    dropped += pending.length - rows.length
    pending = []
    logsRegion.append(...rows)
    for (let excess = logsRegion.childElementCount - MAX_ROWS; excess > 0; excess--) {
      logsRegion.firstElementChild.remove()
      dropped++
    }
    refresh()
    if (following) log.scrollTop = log.scrollHeight
  }

  function addRow (row, level) {
    row.dataset.level = level
    counts[level]++
    pending.push(row)
    if (pending.length === 1) requestAnimationFrame(flush)
  }

  function clearLogs () {
    pending = []
    dropped = 0
    logsRegion.replaceChildren()
    counts.log = counts.warn = counts.error = 0
    refresh()
  }

  function createRow (type, parts) {
    const row = el('div', ROW_CLASS[type] ?? ROW_CLASS.log)
    row.insertAdjacentHTML('afterbegin', type === 'error' ? errorSvg : logsSvg)
    for (const part of parts) {
      if (typeof part === 'string' || part.kind === 'string') {
        const span = el('span')
        span.textContent = typeof part === 'string' ? part : part.text
        row.append(span)
      } else {
        row.append(renderValue(part))
      }
    }
    return row
  }

  function createTableRow ({ columns, rows, more }) {
    const row = el('div', 'string-log table-log')
    row.insertAdjacentHTML('afterbegin', logsSvg)
    const table = el('table', 'console-table')
    const headRow = table.createTHead().insertRow()
    for (const name of ['(index)', ...columns]) {
      const th = el('th')
      th.scope = 'col'
      th.textContent = name
      headRow.append(th)
    }
    const body = table.createTBody()
    for (const { key, cells } of rows) {
      const tr = body.insertRow()
      const th = el('th')
      th.scope = 'row'
      th.textContent = key
      tr.append(th)
      for (const cell of cells) tr.insertCell().textContent = cell
    }
    const wrap = el('div', 'table-wrap')
    wrap.append(table)
    if (more) {
      const note = el('div', 'value-more')
      note.textContent = `… ${more} more rows`
      wrap.append(note)
    }
    row.append(wrap)
    return row
  }

  function createInputRow (code) {
    const row = el('div', 'prompt-input')
    row.insertAdjacentHTML('afterbegin', promptSvg)
    const span = el('span', 'prompt-code')
    span.textContent = code
    row.append(span)
    return row
  }

  // A string result reads as a value, so it's quoted, as in DevTools
  function createResultRow (description) {
    const row = el('div', 'prompt-result')
    row.insertAdjacentHTML('afterbegin', resultSvg)
    if (description.kind === 'string') {
      const span = el('span', 'value value-string')
      span.textContent = JSON.stringify(description.text)
      row.append(span)
    } else {
      row.append(renderValue(description))
    }
    return row
  }

  filterGroup.addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter]')
    if (!button) return
    filter = button.dataset.filter
    log.dataset.filter = filter
    for (const other of filterButtons) other.setAttribute('aria-pressed', String(other === button))
    refresh()
  })
  clearButton.addEventListener('click', clearLogs)
  // Captured before the prompt's editor sees it, which binds Ctrl+L itself
  element.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() !== 'l' || !(event.ctrlKey || event.metaKey) || event.shiftKey || event.altKey) return
    event.preventDefault()
    event.stopPropagation()
    clearLogs()
  }, true)
  refresh()

  return {
    promptContainer,
    receive (message) {
      if (message.type === 'clear') return clearLogs()
      if (message.type === 'table') return addRow(createTableRow(message.table), 'log')
      if (message.type === 'result') return addRow(createResultRow(message.args[0]), 'log')
      const level = message.type === 'warn' || message.type === 'error' ? message.type : 'log'
      addRow(createRow(message.type, message.args), level)
    },
    appendInput (code) {
      addRow(createInputRow(code), 'log')
    },
    clearLogs,
    setErrors (markers) {
      errorsRegion.replaceChildren(...markers.map(({ owner, startLineNumber, message }) => {
        const row = createRow('error', [`${owner} Line ${startLineNumber}: ${message}`])
        row.dataset.level = 'error'
        return row
      }))
      editorErrors = markers.length
      refresh()
    }
  }
}

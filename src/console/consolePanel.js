import { errorSvg, logsSvg } from '../utils/svgs'

const ROW_CLASS = { error: 'error', warn: 'warn', log: 'string-log' }

// The only module that writes to the console element. Editor errors and the
// preview's console output live in separate regions, so updating one never
// wipes the other.
export function createConsolePanel (element) {
  const errorsRegion = document.createElement('div')
  const logsRegion = document.createElement('div')
  errorsRegion.className = 'console-region'
  logsRegion.className = 'console-region'
  element.replaceChildren(errorsRegion, logsRegion)

  // User content only goes in through textContent; the icon is static markup.
  function createRow (type, parts) {
    const row = document.createElement('div')
    row.className = ROW_CLASS[type] ?? ROW_CLASS.log
    row.insertAdjacentHTML('afterbegin', type === 'error' ? errorSvg : logsSvg)
    for (const part of parts) {
      const span = document.createElement('span')
      span.textContent = part
      row.append(span)
    }
    return row
  }

  return {
    clearLogs () {
      logsRegion.replaceChildren()
    },
    appendLog (type, args) {
      logsRegion.append(createRow(type, args))
    },
    setErrors (markers) {
      errorsRegion.replaceChildren(...markers.map(({ owner, startLineNumber, message }) =>
        createRow('error', [`${owner} Line ${startLineNumber}: ${message}`])
      ))
    }
  }
}

import { errorSvg, logsSvg } from '../utils/svgs'
import { getLogColor, getLogClass } from '../utils/functions'
export function getConsoleLogs () {
  const page = document.querySelector('#page')
  const capturedLogs = []

  window.addEventListener('message', (e) => {
    if (e.source !== page.contentWindow) return
    const { logs, type } = e.data.console
    const consoleElement = document.querySelector('#console')

    if (capturedLogs.length > 0 && capturedLogs.every((e) => JSON.stringify(e.logs) !== logs)) {
      capturedLogs.push({ logs: JSON.parse(logs), type })
    }
    if (capturedLogs.length === 0) {
      capturedLogs.push({ logs: JSON.parse(logs), type })
    }

    consoleElement.innerHTML = capturedLogs.map(({ logs, type }) =>
    // WHOLE CONSOLE LOG LINE
    `<div  class='${getLogClass(type)}'>${type === 'error' ? errorSvg : logsSvg}  

    ${logs.map(e => `<span style="color:${getLogColor(type)}"> ${typeof e === 'object' ? JSON.stringify(e) : e}</span>`) // EACH INDIVIDUAL ARG OF THE CONSOLE.LOG
       .join(' ')}
    </div>`)
      .join(' ')
  })
}

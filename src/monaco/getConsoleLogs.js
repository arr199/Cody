import { errorSvg, logsSvg } from '../utils/svgs'
import { getLogColor, getLogClass } from '../utils/functions'
export function getConsoleLogs () {
  const page = document.querySelector('#page')
  const capturedLogs = []

  window.addEventListener('message', (e) => {
    if (e.source !== page.contentWindow) return
    const { logs, type } = e.data.console
    const consoleElement = document.querySelector('#console')

    capturedLogs.push({ logs: JSON.parse(logs), type, id: crypto.randomUUID() })
    const renderElements = capturedLogs.reduce((acc, curr) => {
      if (!acc.find(item => item.id === curr.id)) {
        acc.push(curr)
      }

      return acc
    }, [])

    consoleElement.innerHTML = renderElements.map(({ logs, type }) =>
    // WHOLE CONSOLE LOG LINE
    `<div  class='${getLogClass(type)}'>${type === 'error' ? errorSvg : logsSvg}  

    ${logs.map(e => `<span style="color:${getLogColor(type)}"> ${typeof e === 'object' ? JSON.stringify(e) : e}</span>`) // EACH INDIVIDUAL ARG OF THE CONSOLE.LOG
       .join(' ')}
    </div>`)
      .join(' ')
  })
}

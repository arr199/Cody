/* eslint-disable no-new-func */
import { jsEditor } from './editors'
import { errorSvg, logsSvg } from '../utils/svgs'
import { getColor } from '../utils/functions'

export function getConsoleLogs () {
  const consoleElement = document.querySelector('#console')

  const jsCode = jsEditor.getValue()
  const capturedOutput = []
  const customConsole = { log: (...message) => capturedOutput.push(message.map(arg => arg)) }

  try {
    new Function('console', jsCode).call({ console: customConsole }, customConsole)
  } catch (error) {
    consoleElement.innerHTML = capturedOutput.map(message => `<span class="error">${errorSvg} ${message}</span>`).join(' ')
  }
  consoleElement.innerHTML = capturedOutput.map(message =>
    `<div  class='string-log'>${logsSvg}  ${message
       .map(e => `<span style="color:${getColor(e)}"> ${typeof e === 'object' ? JSON.stringify(e) : e}</span>`)
       .join(' ')}
    </div>`)
    .join(' ')
}

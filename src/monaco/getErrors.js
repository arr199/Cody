import * as monaco from 'monaco-editor'
import { errorSvg } from '../utils/svgs'

export function getErrors () {
  const consoleElement = document.querySelector('#console')

  let renderErrors
  monaco.editor.onDidChangeMarkers(([uri]) => {
    clearTimeout(renderErrors)
    renderErrors = setTimeout(() => {
      const markers = monaco.editor.getModelMarkers({ resource: uri })

      markers.forEach(
        ({ message, startLineNumber, owner }) => {
          consoleElement.innerHTML += ('beforeend', `<span class="error"> ${errorSvg} ${owner} Line ${startLineNumber}:  ${message}</span>`)
        }
      )
    }, 1500)
  })
}

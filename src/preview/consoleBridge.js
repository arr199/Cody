import { createLoopRuntime } from './loopGuard'
import { createDescriber, sanitizeDescription, sanitizeTable } from './valueDescription'

// Forwards console output and uncaught errors from the sandboxed preview
// iframe to the app with postMessage. Values travel as descriptions
// (valueDescription.js), snapshotted when they're logged.

const MESSAGE_SOURCE = 'cody-console'
const PROMPT_SOURCE = 'cody-prompt'
const TYPES = new Set(['log', 'warn', 'error', 'table', 'clear', 'result', 'ready'])
const MAX_ARGS = 100

// Script injected at the top of the preview document.
export function consoleBridgeScript () {
  return `<script>
(function () {
  const describer = (${createDescriber.toString()})()
  function post (message) {
    message.source = '${MESSAGE_SOURCE}'
    try {
      parent.postMessage(message, '*')
    } catch (e) {}
  }
  function send (type, args) {
    post({ type: type, args: args.map(function (arg) { return describer.describe(arg) }) })
  }
  // Tells the app this page can take prompt entries, once the page's own
  // scripts have run (a pending stylesheet or <script src> can hold them back)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { post({ type: 'ready' }) })
  } else {
    post({ type: 'ready' })
  }
  const typeByMethod = { log: 'log', info: 'log', debug: 'log', warn: 'warn', error: 'error' }
  Object.keys(typeByMethod).forEach(function (method) {
    const original = console[method]
    console[method] = function () {
      const args = Array.prototype.slice.call(arguments)
      send(typeByMethod[method], args)
      if (original) return original.apply(console, args)
    }
  })
  const originalTable = console.table
  console.table = function (data, columns) {
    const table = describer.table(data, columns)
    if (table) post({ type: 'table', table: table })
    else send('log', [data])
    if (originalTable) return originalTable.apply(console, arguments)
  }
  const originalClear = console.clear
  console.clear = function () {
    post({ type: 'clear' })
    if (originalClear) return originalClear.apply(console, arguments)
  }
  // Called by guarded loops (see loopGuard.js); a stopped loop is reported as an error
  Object.defineProperty(window, '__codyLoop', {
    value: (${createLoopRuntime.toString()})(function (message) { send('error', [message]) })
  })
  // Prompt entries from the console, already rewritten by promptCode.js. They
  // run as a fresh <script>, in the page's global scope, so let/const persist
  // between entries. Only the app's window may send them.
  Object.defineProperty(window, '__codyPrompt', {
    value: {
      report: function (value) { send('result', [value]) },
      reject: function (error) { send('error', ['Uncaught (in promise)', error]) }
    }
  })
  window.addEventListener('message', function (e) {
    const data = e.data
    if (e.source !== parent || !data || data.source !== '${PROMPT_SOURCE}' || typeof data.code !== 'string') return
    const script = document.createElement('script')
    script.textContent = data.code
    document.documentElement.appendChild(script)
    script.remove()
  })
  window.addEventListener('error', function (e) {
    send('error', ['Uncaught', e.error || e.message])
  })
  window.addEventListener('unhandledrejection', function (e) {
    send('error', ['Uncaught (in promise)', e.reason])
  })
})()
</script>`
}

// Checks a message from the preview. The page's own code can post messages
// too, so anything malformed is dropped and every value is sanitized.
export function readConsoleMessage (data) {
  if (!data || data.source !== MESSAGE_SOURCE || !TYPES.has(data.type)) return null
  if (data.type === 'clear') return { type: 'clear' }
  if (data.type === 'ready') return { type: 'ready' }
  if (data.type === 'table') {
    const table = sanitizeTable(data.table)
    return table && { type: 'table', table }
  }
  if (!Array.isArray(data.args) || (data.type === 'result' && data.args.length !== 1)) return null
  const args = data.args.slice(0, MAX_ARGS).map(sanitizeDescription)
  return args.includes(null) ? null : { type: data.type, args }
}

// Calls handler(message) for console messages coming from the current
// preview window. Messages from anywhere else, from an earlier render, or in
// any other shape, are ignored.
export function onConsoleMessage (getPreviewWindow, handler) {
  window.addEventListener('message', (e) => {
    if (e.source !== getPreviewWindow()) return
    const message = readConsoleMessage(e.data)
    if (message) handler(message)
  })
}

// Sends prompt entries to the preview. A freshly rendered preview starts as a
// blank page, and anything posted before its bridge runs is lost, so entries
// wait until the bridge says it's ready.
export function createPromptChannel (getPreviewWindow) {
  let ready = false
  let queue = []
  const post = (code) => getPreviewWindow()?.postMessage({ source: PROMPT_SOURCE, code }, '*')
  return {
    reset () {
      ready = false
    },
    open () {
      ready = true
      const waiting = queue
      queue = []
      waiting.forEach(post)
    },
    send (code) {
      if (ready) post(code)
      else queue.push(code)
    }
  }
}

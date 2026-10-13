// Forwards console output and uncaught errors from the sandboxed preview
// iframe to the app with postMessage.

const MESSAGE_SOURCE = 'cody-console'

// Turns any value into display text without throwing (circular references,
// DOM nodes, functions, errors...). It's stringified into the iframe, so it
// must stay self-contained: no imports and no references to outer variables.
export function serialize (value) {
  const MAX_DEPTH = 3
  const MAX_ENTRIES = 100
  const seen = new WeakSet()

  function entries (list, render) {
    const shown = list.slice(0, MAX_ENTRIES).map(render)
    if (list.length > MAX_ENTRIES) shown.push('…')
    return shown.join(', ')
  }

  function format (v, depth) {
    if (v === undefined) return 'undefined'
    if (v === null) return 'null'
    const type = typeof v
    if (type === 'string') return depth === 0 ? v : JSON.stringify(v)
    if (type === 'number' || type === 'boolean') return String(v)
    if (type === 'bigint') return v + 'n'
    if (type === 'symbol') return v.toString()
    if (type === 'function') return 'ƒ ' + (v.name || 'anonymous') + '()'
    if (v instanceof Error) return v.name + ': ' + v.message
    if (v instanceof Date) return v.toISOString()
    if (v instanceof RegExp) return String(v)
    if (typeof Window !== 'undefined' && v instanceof Window) return 'Window'
    if (typeof Node !== 'undefined' && v instanceof Node) {
      return v.nodeType === 1 ? '<' + v.nodeName.toLowerCase() + '>' : v.nodeName
    }
    if (seen.has(v)) return '[Circular]'

    const isArray = Array.isArray(v)
    if (depth >= MAX_DEPTH) return isArray ? '[…]' : '{…}'

    seen.add(v)
    let out
    if (isArray) {
      out = '[' + entries(v, item => format(item, depth + 1)) + ']'
    } else if (v instanceof Map) {
      out = 'Map(' + v.size + ') {' + entries([...v], ([k, val]) => format(k, depth + 1) + ' => ' + format(val, depth + 1)) + '}'
    } else if (v instanceof Set) {
      out = 'Set(' + v.size + ') {' + entries([...v], item => format(item, depth + 1)) + '}'
    } else {
      out = '{' + entries(Object.keys(v), key => {
        let val
        try { val = v[key] } catch (e) { val = '[unreadable]' }
        return key + ': ' + format(val, depth + 1)
      }) + '}'
    }
    seen.delete(v)
    return out
  }

  return format(value, 0)
}

// Script injected at the top of the preview document.
export function consoleBridgeScript () {
  return `<script>
(function () {
  const serialize = (${serialize.toString()})
  function send (type, args) {
    try {
      parent.postMessage({ source: '${MESSAGE_SOURCE}', type: type, args: args.map(serialize) }, '*')
    } catch (e) {}
  }
  const typeByMethod = { log: 'log', info: 'log', debug: 'log', table: 'log', warn: 'warn', error: 'error' }
  Object.keys(typeByMethod).forEach(function (method) {
    const original = console[method]
    console[method] = function () {
      const args = Array.prototype.slice.call(arguments)
      send(typeByMethod[method], args)
      if (original) return original.apply(console, args)
    }
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

// Calls handler(type, args) for console messages coming from the preview.
// Messages from anywhere else, or in any other shape, are ignored.
export function onConsoleMessage (iframe, handler) {
  window.addEventListener('message', (e) => {
    if (e.source !== iframe.contentWindow) return
    const data = e.data
    if (!data || data.source !== MESSAGE_SOURCE || !Array.isArray(data.args)) return
    handler(String(data.type), data.args.map(String))
  })
}

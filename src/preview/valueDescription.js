// How logged values travel from the sandboxed preview to the console.
// createDescriber() runs inside the preview: it's stringified into the page,
// so it must stay self-contained (no imports, no outer variables). It turns
// values into plain data, snapshotted when they're logged. summarize() and the
// sanitizers run in the app, on data the page's own code could have forged.

export const LIMITS = { depth: 5, entries: 100, nodes: 2000, text: 10000, key: 1000, label: 100, columns: 20, rows: 100 }

const CONTAINER_KINDS = ['array', 'object', 'map', 'set']
const BRANCH_KINDS = [...CONTAINER_KINDS, 'error', 'element']
const LEAF_KINDS = ['string', 'number', 'boolean', 'null', 'undefined', 'bigint', 'symbol', 'function', 'date', 'regexp', 'node', 'window', 'circular', 'unreadable', 'depth']
const KINDS = new Set([...BRANCH_KINDS, ...LEAF_KINDS])
const SUMMARY_DEPTH = 3
const NESTED_STRING = 100

export function createDescriber () {
  const MAX_DEPTH = 5
  const MAX_ENTRIES = 100
  const MAX_NODES = 2000
  const MAX_TEXT = 10000
  const MAX_CELL = 1000
  const MAX_COLUMNS = 20
  const MAX_ROWS = 100

  const cut = (text, max) => (text.length > max ? text.slice(0, max) + '…' : text)
  const isObject = (v) => v !== null && (typeof v === 'object' || typeof v === 'function')
  const unreadable = () => ({ kind: 'unreadable', text: '[unreadable]' })

  function read (object, key) {
    try {
      return { value: object[key] }
    } catch (e) {
      return { unreadable: true }
    }
  }

  function leaf (v) {
    if (v === undefined) return { kind: 'undefined', text: 'undefined' }
    if (v === null) return { kind: 'null', text: 'null' }
    const type = typeof v
    if (type === 'string') return { kind: 'string', text: cut(v, MAX_TEXT) }
    if (type === 'number' || type === 'boolean') return { kind: type, text: String(v) }
    if (type === 'bigint') return { kind: 'bigint', text: v + 'n' }
    if (type === 'symbol') return { kind: 'symbol', text: v.toString() }
    if (type === 'function') return { kind: 'function', text: 'ƒ ' + (v.name || 'anonymous') + '()' }
    return null
  }

  // The short text of a Map key or a table cell
  function brief (v, quoteStrings) {
    if (typeof v === 'string') return cut(quoteStrings ? JSON.stringify(v) : v, MAX_CELL)
    const simple = leaf(v)
    if (simple) return simple.text
    return Array.isArray(v) ? '[…]' : '{…}'
  }

  function tagOf (element) {
    let text = '<' + element.nodeName.toLowerCase()
    const attributes = Array.prototype.slice.call(element.attributes || [], 0, 10)
    for (const attribute of attributes) text += ' ' + attribute.name + '="' + attribute.value + '"'
    return cut(text + '>', MAX_CELL)
  }

  function describe (value) {
    let nodes = 0
    const path = new Set() // the objects being described; meeting one again is a cycle

    function branch (v, depth) {
      const pairs = []
      let total = 0
      let out
      if (typeof Node !== 'undefined' && v instanceof Node && v.nodeType === 1) {
        out = { kind: 'element', text: tagOf(v) }
        const children = Array.prototype.filter.call(v.childNodes, (n) => n.nodeType !== 3 || n.textContent.trim() !== '')
        total = children.length
        children.slice(0, MAX_ENTRIES).forEach((child, i) => pairs.push([String(i), { value: child }]))
      } else if (v instanceof Error) {
        out = { kind: 'error', text: cut(v.name + ': ' + v.message, MAX_TEXT) }
        pairs.push(['message', read(v, 'message')], ['stack', read(v, 'stack')])
        total = 2
      } else if (Array.isArray(v)) {
        out = { kind: 'array' }
        total = v.length
        for (let i = 0; i < Math.min(total, MAX_ENTRIES); i++) pairs.push([String(i), read(v, i)])
      } else if (v instanceof Map) {
        out = { kind: 'map' }
        total = v.size
        for (const [key, entry] of v) {
          if (pairs.length >= MAX_ENTRIES) break
          pairs.push([brief(key, true), { value: entry }])
        }
      } else if (v instanceof Set) {
        out = { kind: 'set' }
        total = v.size
        for (const entry of v) {
          if (pairs.length >= MAX_ENTRIES) break
          pairs.push([String(pairs.length), { value: entry }])
        }
      } else {
        out = { kind: 'object' }
        const keys = Object.keys(v)
        total = keys.length
        for (const key of keys.slice(0, MAX_ENTRIES)) pairs.push([key, read(v, key)])
        const proto = Object.getPrototypeOf(v)
        const name = proto && proto !== Object.prototype && proto.constructor && proto.constructor.name
        if (typeof name === 'string' && name && name !== 'Object') out.label = name.slice(0, 100)
      }
      out.entries = pairs.map(([key, result]) => [key, result.unreadable ? unreadable() : walk(result.value, depth + 1)])
      if (total > pairs.length) out.more = total - pairs.length
      return out
    }

    function walk (v, depth) {
      nodes++
      const simple = leaf(v)
      if (simple) return simple
      try {
        if (typeof Window !== 'undefined' && v instanceof Window) return { kind: 'window', text: 'Window' }
        if (v instanceof Date) return { kind: 'date', text: isNaN(v) ? 'Invalid Date' : v.toISOString() }
        if (v instanceof RegExp) return { kind: 'regexp', text: String(v) }
        if (typeof Node !== 'undefined' && v instanceof Node && v.nodeType !== 1) {
          return { kind: 'node', text: v.nodeType === 3 ? cut(JSON.stringify(v.textContent), MAX_TEXT) : v.nodeName }
        }
        if (path.has(v)) return { kind: 'circular', text: '[Circular]' }
        if (depth >= MAX_DEPTH || nodes > MAX_NODES) return { kind: 'depth', text: Array.isArray(v) ? '[…]' : '{…}' }
        path.add(v)
        try {
          return branch(v, depth)
        } finally {
          path.delete(v)
        }
      } catch (e) {
        return unreadable()
      }
    }

    return walk(value, 0)
  }

  // console.table(data, columns): the index column is added by the console
  function table (data, columns) {
    if (!isObject(data)) return null
    try {
      const isArray = Array.isArray(data)
      const total = isArray ? data.length : Object.keys(data).length
      const keys = isArray
        ? Array.from({ length: Math.min(total, MAX_ROWS) }, (_, i) => String(i))
        : Object.keys(data).slice(0, MAX_ROWS)
      const rows = keys.map((key) => {
        const result = read(data, key)
        return { key, value: result.unreadable ? undefined : result.value }
      })
      const found = []
      let hasValues = false
      for (const { value } of rows) {
        if (!isObject(value)) {
          hasValues = true
          continue
        }
        for (const key of Object.keys(value)) {
          if (found.length < MAX_COLUMNS && found.indexOf(key) === -1) found.push(key)
        }
      }
      const chosen = Array.isArray(columns) ? columns.slice(0, MAX_COLUMNS).map(String) : found
      const showValues = hasValues && !Array.isArray(columns)
      const cell = (value, column) => {
        if (!isObject(value)) return ''
        const result = read(value, column)
        if (result.unreadable) return '[unreadable]'
        return result.value === undefined ? '' : brief(result.value, false)
      }
      return {
        columns: showValues ? chosen.concat('Value') : chosen,
        rows: rows.map(({ key, value }) => ({
          key: cut(key, MAX_CELL),
          cells: chosen.map((column) => cell(value, column)).concat(showValues ? [isObject(value) ? '' : brief(value, false)] : [])
        })),
        more: total - rows.length
      }
    } catch (e) {
      return null
    }
  }

  return { describe, table }
}

const cutText = (text, max) => (text.length > max ? text.slice(0, max) + '…' : text)

// The one-line text of a description: a value's collapsed row, or the right
// side of a `key: value` line. Strings below the top level are quoted.
export function summarize (description, depth = 0) {
  return cutText(summary(description, depth), LIMITS.text)
}

function summary (d, depth) {
  if (d.kind === 'string') return depth === 0 ? d.text : JSON.stringify(cutText(d.text, NESTED_STRING))
  // Nested texts are cut like nested strings; page code can post thousands of long ones
  if (!CONTAINER_KINDS.includes(d.kind)) return depth === 0 ? d.text : cutText(d.text, NESTED_STRING)
  if (depth >= SUMMARY_DEPTH) return d.kind === 'array' ? '[…]' : '{…}'
  const parts = d.entries.map(([key, value]) => {
    const text = summary(value, depth + 1)
    if (d.kind === 'object') return key + ': ' + text
    if (d.kind === 'map') return key + ' => ' + text
    return text
  })
  if (d.more) parts.push('…')
  const inner = parts.join(', ')
  if (d.kind === 'array') return '[' + inner + ']'
  const size = d.entries.length + (d.more || 0)
  if (d.kind === 'map') return 'Map(' + size + ') {' + inner + '}'
  if (d.kind === 'set') return 'Set(' + size + ') {' + inner + '}'
  return (d.label ? d.label + ' ' : '') + '{' + inner + '}'
}

const INVALID = new Error('invalid console data')

// Checks a description that arrived from the preview. The page's own code
// can post messages too, so nothing is trusted: unknown kinds or wrong types
// reject the whole value, and the caps are applied again.
export function sanitizeDescription (data) {
  let nodes = 0
  function clean (d, depth) {
    if (!d || typeof d !== 'object' || !KINDS.has(d.kind)) throw INVALID
    nodes++
    const out = { kind: d.kind }
    if (typeof d.text === 'string') out.text = cutText(d.text, LIMITS.text)
    else if (d.text !== undefined || !CONTAINER_KINDS.includes(d.kind)) throw INVALID
    if (d.label !== undefined) {
      if (typeof d.label !== 'string') throw INVALID
      out.label = d.label.slice(0, LIMITS.label)
    }
    if (!BRANCH_KINDS.includes(d.kind)) return out
    if (!Array.isArray(d.entries)) throw INVALID
    if (depth >= LIMITS.depth || nodes > LIMITS.nodes) return { kind: 'depth', text: d.kind === 'array' ? '[…]' : '{…}' }
    out.entries = d.entries.slice(0, LIMITS.entries).map((pair) => {
      if (!Array.isArray(pair) || typeof pair[0] !== 'string') throw INVALID
      return [pair[0].slice(0, LIMITS.key), clean(pair[1], depth + 1)]
    })
    if (d.more !== undefined && !(Number.isInteger(d.more) && d.more >= 0)) throw INVALID
    const more = Math.min((d.more || 0) + d.entries.length - out.entries.length, 1e9)
    if (more) out.more = more
    return out
  }
  try {
    return clean(data, 0)
  } catch {
    return null
  }
}

export function sanitizeTable (data) {
  if (!data || !Array.isArray(data.columns) || !Array.isArray(data.rows)) return null
  if (!data.columns.every((column) => typeof column === 'string')) return null
  const columns = data.columns.slice(0, LIMITS.columns + 1).map((column) => cutText(column, LIMITS.key))
  const rows = []
  for (const row of data.rows.slice(0, LIMITS.rows)) {
    if (!row || typeof row.key !== 'string' || !Array.isArray(row.cells)) return null
    if (!row.cells.every((cell) => typeof cell === 'string')) return null
    rows.push({ key: cutText(row.key, LIMITS.key), cells: columns.map((_, i) => cutText(row.cells[i] ?? '', LIMITS.key)) })
  }
  const more = Number.isInteger(data.more) && data.more > 0 ? Math.min(data.more, 1e9) : 0
  return { columns, rows, more: more + data.rows.length - rows.length }
}

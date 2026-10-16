import { parse } from 'acorn'
import { ancestor } from 'acorn-walk'

// Rewrites the preview's copy of the user's code so a runaway loop can't
// freeze the app: each loop notes when it was entered, and every iteration
// asks the runtime (createLoopRuntime, injected into the preview) whether it
// has run too long. If so, the loop breaks and the rest of the script goes on.
// The code in the editors and in share links is never touched.

const LOOPS = ['ForStatement', 'ForInStatement', 'ForOfStatement', 'WhileStatement', 'DoWhileStatement']
const isLoop = (node) => LOOPS.includes(node.type)
const isFunction = (node) => node.type.includes('Function')

// At one position, closing braces go before opening ones; closers run inner
// to outer and openers outer to inner, so nested inserts stay balanced.
const CLOSE = -1e6
const byPosition = (a, b) => a.pos - b.pos || a.order - b.order

export function guardScript (code, { pane = 'JS', firstLine = 1, sourceType = 'script' } = {}) {
  let ast
  try {
    ast = parse(code, { ecmaVersion: 'latest', sourceType, locations: true })
  } catch {
    return code // the browser will report the real syntax error
  }

  const loops = []
  // Loops that await or yield hand control back to the browser, so they
  // can't freeze it; generators and async loops legitimately run forever
  const yielding = new Set()
  const markEnclosingLoops = (_, ancestors) => {
    for (let i = ancestors.length - 1; i >= 0 && !isFunction(ancestors[i]); i--) {
      if (isLoop(ancestors[i])) yielding.add(ancestors[i])
    }
  }
  const visitors = { AwaitExpression: markEnclosingLoops, YieldExpression: markEnclosingLoops }
  for (const type of LOOPS) {
    visitors[type] = (node, ancestors) => {
      loops.push({ node, ancestors: [...ancestors] }) // the walker reuses its array
      if (node.await) yielding.add(node) // for await…of
    }
  }
  ancestor(ast, visitors)

  const edits = []
  const insert = (pos, text, order) => edits.push({ pos, text, order })

  loops.filter(({ node }) => !yielding.has(node)).forEach(({ node, ancestors }, index) => {
    const start = `__codyT${index}`
    const depth = ancestors.length - 1 // ancestors ends with the loop itself

    // Wrap the loop (with its labels, so `continue outer` still works) in a
    // block that records when it was entered
    let target = depth
    while (target > 0 && ancestors[target - 1].type === 'LabeledStatement') target--
    insert(ancestors[target].start, `{const ${start}=__codyLoop.start();`, target)
    insert(ancestors[target].end, '}', CLOSE - target)

    const line = node.loc.start.line + firstLine - 1
    const check = `if(__codyLoop.check(${start},'${pane}',${line}))break;`
    const body = node.body
    if (body.type === 'BlockStatement') {
      insert(body.start + 1, check, depth + 1)
    } else {
      // A body without braces gets them, ahead of anything else starting there
      insert(body.start, '{' + check, depth + 0.5)
      insert(body.end, '}', CLOSE - depth - 0.5)
    }
  })

  if (edits.length === 0) return code
  edits.sort(byPosition)
  let out = ''
  let last = 0
  for (const { pos, text } of edits) {
    out += code.slice(last, pos) + text
    last = pos
  }
  return out + code.slice(last)
}

const SCRIPT = /(<script\b([^>]*)>)([\s\S]*?)(<\/script\s*>)/gi
const JS_TYPES = ['', 'module', 'text/javascript', 'application/javascript', 'text/ecmascript', 'application/ecmascript']

// Guards inline <script> blocks typed into the HTML pane. External scripts
// (src) and data blocks (JSON, templates) are left as they are.
export function guardHtmlScripts (html) {
  return html.replace(SCRIPT, (match, open, attributes, body, close, offset) => {
    if (/(^|\s)src\s*=/i.test(attributes)) return match
    const type = (attributes.match(/(?:^|\s)type\s*=\s*["']?([^"'\s>]*)/i)?.[1] ?? '').toLowerCase()
    if (!JS_TYPES.includes(type)) return match
    const firstLine = html.slice(0, offset + open.length).split('\n').length
    return open + guardScript(body, { pane: 'HTML', firstLine, sourceType: type === 'module' ? 'module' : 'script' }) + close
  })
}

// The `__codyLoop` object guarded code calls. It's stringified into the
// preview, so it must stay self-contained: no imports, no outer variables.
export function createLoopRuntime (report, limit = 1000) {
  const clock = performance
  const now = clock.now.bind(clock) // kept even if the user's code replaces performance.now
  return {
    start: now,
    check (start, pane, line) {
      if (now() - start < limit) return false
      report('Stopped a loop at ' + pane + ' line ' + line + ' after ' + limit / 1000 + ' s. It may be infinite.')
      return true
    }
  }
}

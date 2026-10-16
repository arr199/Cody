import { parse } from 'acorn'
import { guardScript } from './loopGuard'

// Rewrites a console prompt entry before it runs in the preview: the last
// expression's value is reported (__codyPrompt.report), top-level await
// works, and loops are guarded. Code that doesn't parse is sent as it is, so
// the browser reports the real SyntaxError.

const REPORT = '__codyPrompt.report'
const GUARD = { pane: 'Console' }

function tryParse (code, allowAwait) {
  try {
    return parse(code, { ecmaVersion: 'latest', sourceType: 'script', allowAwaitOutsideFunction: allowAwait })
  } catch {
    return null
  }
}

// Wraps the last statement's value: reported directly, or returned from the
// async wrapper
function withResult (code, ast, isAsync) {
  const last = ast.body.at(-1)
  if (last?.type !== 'ExpressionStatement') return isAsync ? code : `${code}\n;${REPORT}(undefined)`
  const { start, end } = last.expression
  const expression = code.slice(start, end)
  const wrapped = isAsync ? `return (${expression})` : `${REPORT}((${expression}))`
  return code.slice(0, start) + wrapped + code.slice(end)
}

export function preparePromptCode (code) {
  // `{ a: 1 }` on its own is an object, as in DevTools, not a block
  if (/^\s*\{/.test(code) && /\}\s*$/.test(code) && tryParse(`(${code}\n)`, false)) {
    return guardScript(`${REPORT}((${code}\n))`, GUARD)
  }
  const script = tryParse(code, false)
  if (script) return guardScript(withResult(code, script, false), GUARD)
  // Prefixed on the same line, so loop line numbers still match the entry
  const awaiting = tryParse(code, true)
  if (awaiting) {
    return guardScript(`(async () => {${withResult(code, awaiting, true)}\n})().then(__codyPrompt.report, __codyPrompt.reject)`, GUARD)
  }
  return code
}

import { parse } from 'acorn'
import { simple } from 'acorn-walk'
import { PACKAGE_CDN } from '../utils/API'

// npm imports: in the copy of the code that runs, bare package names
// (`import confetti from 'canvas-confetti'`) are pointed at esm.sh. Paths,
// URLs and the editors' own code are left alone, and every line stays where
// it was, so loop-guard line numbers still match.

function parseCode (code, sourceType, allowAwait = false) {
  try {
    return parse(code, { ecmaVersion: 'latest', sourceType, allowAwaitOutsideFunction: allowAwait })
  } catch {
    return null
  }
}

// Not bare: ./x, ../x, /x, #x, and anything with a URL scheme
const isBare = (specifier) => specifier !== '' && !/^(\.{1,2}\/|\/|#|[a-z][a-z\d+.-]*:)/i.test(specifier)

// 'canvas-confetti@1.9/dist/x.js' → 'canvas-confetti'; '@scope/pkg@2/sub' → '@scope/pkg'
export function packageName (specifier) {
  const parts = specifier.split('/')
  const name = specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
  return name.replace(/(.)@.*$/, '$1')
}

// The JS pane runs as a module only when it has to (static import/export,
// top-level await, import.meta); otherwise it stays a classic script, whose
// variables the console prompt can see. Broken code stays classic, so the
// browser reports the real error.
export function needsModule (code) {
  const ast = parseCode(code, 'module')
  if (!ast) return false
  if (ast.body.some(node => /^(Import|Export)/.test(node.type))) return true
  return parseCode(code, 'script') === null
}

// The names a page's own <script type="importmap"> defines. Those are the
// page's to resolve, so they're never pointed at the CDN.
export function importMapKeys (html) {
  const keys = []
  for (const [, body] of html.matchAll(/<script\b[^>]*\btype\s*=\s*["']?importmap["']?[^>]*>([\s\S]*?)<\/script\s*>/gi)) {
    try {
      keys.push(...Object.keys(JSON.parse(body).imports ?? {}))
    } catch {}
  }
  return keys
}

// `mapped` holds import-map keys; one ending in "/" covers everything under it.
// Returns the rewritten code, the package names, and the specifiers as
// written (what the console checks when a module fails to load).
export function resolveImports (code, { sourceType = 'script', allowAwait = false, mapped = [] } = {}) {
  const ast = parseCode(code, sourceType, allowAwait)
  if (!ast) return { code, packages: [], specifiers: [] }
  const isMapped = (specifier) => mapped.some(key => specifier === key || (key.endsWith('/') && specifier.startsWith(key)))
  const found = []
  const take = (source) => {
    if (source?.type !== 'Literal' || typeof source.value !== 'string') return
    if (isBare(source.value) && !isMapped(source.value)) found.push(source)
  }
  simple(ast, {
    ImportDeclaration: (node) => take(node.source),
    ExportNamedDeclaration: (node) => take(node.source),
    ExportAllDeclaration: (node) => take(node.source),
    ImportExpression: (node) => take(node.source)
  })
  found.sort((a, b) => a.start - b.start)
  let out = code
  for (const source of [...found].reverse()) {
    out = out.slice(0, source.start) + JSON.stringify(PACKAGE_CDN + source.value) + out.slice(source.end)
  }
  return {
    code: out,
    packages: [...new Set(found.map(source => packageName(source.value)))],
    specifiers: [...new Set(found.map(source => source.value))]
  }
}

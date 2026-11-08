import { consoleBridgeScript } from './consoleBridge'
import { guardScript } from './loopGuard'
import { mapInlineScripts } from './inlineScripts'
import { needsModule, resolveImports, importMapKeys } from './packageImports'

// A literal "</script" in the user's JS would close the <script> tag it's
// inlined into. "<\/script" means the same thing to JavaScript.
function escapeScript (code) {
  return code.replace(/<\/(script)/gi, '<\\/$1')
}

const escapeAttribute = (text) => text
  .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// A module script lists the packages it imports (as written), so the console
// bridge can say which one failed to load (consoleBridge.js)
const packagesAttribute = (specifiers) => `data-packages="${escapeAttribute(JSON.stringify(specifiers))}"`

// Code as it runs in the preview: bare package imports point at the CDN
// (packageImports.js), then loops are guarded so a runaway one can't freeze
// the app. Both keep every line where it was.
function prepare (code, { sourceType, pane, firstLine, mapped }) {
  const resolved = resolveImports(code, { sourceType, mapped })
  return { code: guardScript(resolved.code, { sourceType, pane, firstLine }), specifiers: resolved.specifiers }
}

// Module scripts keep their own attributes (id, async…) and gain the list
function prepareHtml (html, mapped) {
  return mapInlineScripts(html, ({ open, body, sourceType, firstLine }) => {
    const { code, specifiers } = prepare(body, { sourceType, pane: 'HTML', firstLine, mapped })
    return { open: sourceType === 'module' ? open.replace(/^<script/i, `<script ${packagesAttribute(specifiers)}`) : open, body: code }
  })
}

export function buildDocument ({ html, css, js }) {
  // JS with static imports (or top-level await) has to run as a module
  const sourceType = needsModule(js) ? 'module' : 'script'
  const mapped = importMapKeys(html)
  const { code, specifiers } = prepare(js, { sourceType, pane: 'JS', mapped })
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>${css}</style>
  ${consoleBridgeScript()}
</head>
<body>
  ${prepareHtml(html, mapped)}
  ${sourceType === 'module' ? `<script type="module" ${packagesAttribute(specifiers)}>` : '<script>'}
${escapeScript(code)}
  </script>
</body>
</html>`
}

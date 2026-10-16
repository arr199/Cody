const SCRIPT = /(<script\b([^>]*)>)([\s\S]*?)(<\/script\s*>)/gi
const JS_TYPES = ['', 'module', 'text/javascript', 'application/javascript', 'text/ecmascript', 'application/ecmascript']

// Calls fn for each inline JavaScript <script> in the HTML pane and puts back
// what it returns: fn({ open, body, sourceType, firstLine }) → { open, body }.
// External scripts (src) and data blocks (JSON, templates, import maps) are
// left as they are. firstLine is the body's first line within the pane.
export function mapInlineScripts (html, fn) {
  return html.replace(SCRIPT, (match, open, attributes, body, close, offset) => {
    if (/(^|\s)src\s*=/i.test(attributes)) return match
    const type = (attributes.match(/(?:^|\s)type\s*=\s*["']?([^"'\s>]*)/i)?.[1] ?? '').toLowerCase()
    if (!JS_TYPES.includes(type)) return match
    const firstLine = html.slice(0, offset + open.length).split('\n').length
    const result = fn({ open, body, sourceType: type === 'module' ? 'module' : 'script', firstLine })
    return result.open + result.body + close
  })
}

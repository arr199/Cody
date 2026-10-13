import { consoleBridgeScript } from './consoleBridge'

// A literal "</script" in the user's JS would close the <script> tag it's
// inlined into. "<\/script" means the same thing to JavaScript.
function escapeScript (code) {
  return code.replace(/<\/(script)/gi, '<\\/$1')
}

export function buildDocument ({ html, css, js }) {
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
  ${html}
  <script>
${escapeScript(js)}
  </script>
</body>
</html>`
}

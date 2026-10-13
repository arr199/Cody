import { describe, it, expect } from 'vitest'
import { buildDocument } from '../../src/preview/buildDocument'

describe('buildDocument', () => {
  it('includes the html, css and js', () => {
    const doc = buildDocument({ html: '<h1>Hi</h1>', css: 'h1 { color: red }', js: 'console.log(1)' })
    expect(doc).toContain('<h1>Hi</h1>')
    expect(doc).toContain('<style>h1 { color: red }</style>')
    expect(doc).toContain('console.log(1)')
  })

  it('escapes "</script" in the user JS so it cannot close the script tag', () => {
    const doc = buildDocument({ html: '', css: '', js: "const tag = '</script>'; const t2 = '</SCRIPT>'" })
    expect(doc).toContain("const tag = '<\\/script>'; const t2 = '<\\/SCRIPT>'")
    // Only the bridge script and the user script close: two closing tags in total
    expect(doc.match(/<\/script>/gi)).toHaveLength(2)
  })
})

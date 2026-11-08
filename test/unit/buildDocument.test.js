import { describe, it, expect } from 'vitest'
import { buildDocument } from '../../src/preview/buildDocument'
import { PACKAGE_CDN } from '../../src/utils/API'

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

  it('runs JS with static imports as a module, pointed at the package CDN', () => {
    const doc = buildDocument({ html: '', css: '', js: "import confetti from 'canvas-confetti'\nconfetti()" })
    expect(doc).toContain('<script type="module" data-packages="[&quot;canvas-confetti&quot;]">')
    expect(doc).toContain(`import confetti from "${PACKAGE_CDN}canvas-confetti"`)
  })

  it('keeps JS without static imports a classic script, resolving import()', () => {
    const doc = buildDocument({ html: '', css: '', js: "import('pkg').then(m => m)" })
    expect(doc).not.toContain('type="module"')
    expect(doc).toContain(`import("${PACKAGE_CDN}pkg")`)
  })

  it('escapes data-packages so odd specifiers cannot break the document', () => {
    const doc = buildDocument({ html: '', css: '', js: 'import x from \'a"><b>&\'' })
    const tag = doc.match(/<script type="module"[^>]*>/)[0]
    expect(tag).toBe('<script type="module" data-packages="[&quot;a\\&quot;&gt;&lt;b&gt;&amp;&quot;]">')
  })

  it('keeps the attributes of module scripts in the HTML pane', () => {
    const doc = buildDocument({ html: "<script type=\"module\" id=\"app\" async>import a from 'pkg'</script>", css: '', js: '' })
    expect(doc).toContain('<script data-packages="[&quot;pkg&quot;]" type="module" id="app" async>')
  })

  it("leaves names mapped by the page's own import map", () => {
    const html = '<script type="importmap">{ "imports": { "three": "https://unpkg.com/three" } }</script>'
    const doc = buildDocument({ html, css: '', js: "import * as THREE from 'three'" })
    expect(doc).toContain("import * as THREE from 'three'")
  })

  it('resolves and labels module scripts in the HTML pane', () => {
    const doc = buildDocument({ html: "<script type=\"module\">import a from 'pkg'</script>", css: '', js: '' })
    expect(doc).toContain(`<script data-packages="[&quot;pkg&quot;]" type="module">import a from "${PACKAGE_CDN}pkg"</script>`)
  })
})

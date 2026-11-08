import { describe, it, expect } from 'vitest'
import { needsModule, resolveImports, packageName, importMapKeys } from '../../src/preview/packageImports'
import { PACKAGE_CDN } from '../../src/utils/API'

const cdn = (specifier) => JSON.stringify(PACKAGE_CDN + specifier)

describe('resolveImports', () => {
  it('points bare imports, re-exports and import() at the CDN', () => {
    const code = [
      "import confetti from 'canvas-confetti'",
      "import { a } from 'lodash-es'",
      "export { b } from 'preact/hooks'",
      "export * from '@scope/pkg@2'",
      "const later = await import('gsap')"
    ].join('\n')
    const { code: out, packages } = resolveImports(code, { sourceType: 'module' })
    expect(out).toBe([
      `import confetti from ${cdn('canvas-confetti')}`,
      `import { a } from ${cdn('lodash-es')}`,
      `export { b } from ${cdn('preact/hooks')}`,
      `export * from ${cdn('@scope/pkg@2')}`,
      `const later = await import(${cdn('gsap')})`
    ].join('\n'))
    expect(packages).toEqual(['canvas-confetti', 'lodash-es', 'preact', '@scope/pkg', 'gsap'])
  })

  it('leaves paths, URLs, # imports and template literals alone', () => {
    const code = [
      "import a from './a.js'",
      "import b from '../b.js'",
      "import c from '/c.js'",
      "import d from 'https://cdn.example/d.js'",
      "import e from '#internal'",
      'const f = import(`pkg`)'
    ].join('\n')
    expect(resolveImports(code, { sourceType: 'module' })).toEqual({ code, packages: [], specifiers: [] })
  })

  it('lists each package once', () => {
    const code = "import a from 'pkg'\nimport b from 'pkg/sub'\nimport('pkg@1')"
    expect(resolveImports(code, { sourceType: 'module' }).packages).toEqual(['pkg'])
  })

  it('resolves import() in classic scripts, and at the prompt with top-level await', () => {
    expect(resolveImports("import('pkg').then(m => m)").code).toBe(`import(${cdn('pkg')}).then(m => m)`)
    expect(resolveImports("const m = await import('pkg')", { allowAwait: true }).code).toBe(`const m = await import(${cdn('pkg')})`)
  })

  it('keeps every line where it was', () => {
    const code = "// one\nimport a from 'pkg'\n\nwhile (x) {}\n"
    expect(resolveImports(code, { sourceType: 'module' }).code.split('\n')).toHaveLength(code.split('\n').length)
  })

  it('lists every bare specifier as written, for load-error checks', () => {
    const code = "import a from 'pkg@2/sub.js'\nimport b from 'pkg'\nimport c from './c.js'"
    expect(resolveImports(code, { sourceType: 'module' }).specifiers).toEqual(['pkg@2/sub.js', 'pkg'])
  })

  it('leaves names the page maps in its own import map', () => {
    const code = "import * as THREE from 'three'\nimport { OrbitControls } from 'three/addons/controls.js'\nimport gsap from 'gsap'"
    const { code: out, packages } = resolveImports(code, { sourceType: 'module', mapped: ['three', 'three/addons/'] })
    expect(out).toBe(`import * as THREE from 'three'\nimport { OrbitControls } from 'three/addons/controls.js'\nimport gsap from ${cdn('gsap')}`)
    expect(packages).toEqual(['gsap'])
  })

  it('returns code that does not parse unchanged', () => {
    expect(resolveImports("import from 'pkg'", { sourceType: 'module' })).toEqual({ code: "import from 'pkg'", packages: [], specifiers: [] })
  })
})

describe('needsModule', () => {
  it('is true for static imports and exports, top-level await and import.meta', () => {
    expect(needsModule("import a from 'pkg'")).toBe(true)
    expect(needsModule('export const x = 1')).toBe(true)
    expect(needsModule('await fetch(url)')).toBe(true)
    expect(needsModule('console.log(import.meta.url)')).toBe(true)
  })

  it('is false for plain scripts, import() alone, and broken code', () => {
    expect(needsModule('const x = 1\nconsole.log(x)')).toBe(false)
    expect(needsModule("import('pkg').then(m => m)")).toBe(false)
    expect(needsModule('const = 1')).toBe(false)
    expect(needsModule('with (obj) { x }')).toBe(false) // sloppy-only code stays classic
  })
})

describe('importMapKeys', () => {
  it('reads the names an inline import map defines, and ignores broken maps', () => {
    const html = '<script type="importmap">{ "imports": { "three": "https://unpkg.com/three", "three/addons/": "./addons/" } }</script>\n<script type="importmap">not json</script>'
    expect(importMapKeys(html)).toEqual(['three', 'three/addons/'])
    expect(importMapKeys('<p>no map</p>')).toEqual([])
  })
})

describe('packageName', () => {
  it('drops versions and subpaths, keeping scopes', () => {
    expect(packageName('canvas-confetti')).toBe('canvas-confetti')
    expect(packageName('canvas-confetti@1.9/dist/x.js')).toBe('canvas-confetti')
    expect(packageName('@scope/pkg@2/sub')).toBe('@scope/pkg')
    expect(packageName('@scope/pkg')).toBe('@scope/pkg')
  })
})

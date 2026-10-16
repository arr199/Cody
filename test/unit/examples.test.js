import { describe, it, expect } from 'vitest'
import { Script } from 'node:vm'
import { parse } from 'acorn'
import { needsModule } from '../../src/preview/packageImports'
import { EXAMPLES, DEFAULT_EXAMPLE_ID, getExample } from '../../src/examples'
import { encodeState, decodeState } from '../../src/state/urlCodec'

const withCode = EXAMPLES.filter(example => example.id !== 'blank')

describe('examples', () => {
  it('have unique ids and a title, technique line and description for the menu', () => {
    const ids = EXAMPLES.map(example => example.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const example of EXAMPLES) {
      expect(example.title, example.id).toMatch(/\S/)
      expect(example.meta, example.id).toMatch(/\S/)
      expect(example.description, example.id).toMatch(/\S/)
    }
  })

  it('include one that imports an npm package on its first line', () => {
    const [firstLine] = getExample('launch').js.split('\n')
    expect(firstLine).toBe("import confetti from 'canvas-confetti'")
  })

  it('include a blank example with no code', () => {
    expect(getExample('blank')).toMatchObject({ html: '', css: '', js: '' })
  })

  it('give every other example html, css and js', () => {
    expect(withCode.length).toBeGreaterThanOrEqual(4)
    for (const example of withCode) {
      expect(example.html, example.id).toMatch(/\S/)
      expect(example.css, example.id).toMatch(/\S/)
      expect(example.js, example.id).toMatch(/\S/)
    }
  })

  it('default to the welcome example', () => {
    expect(DEFAULT_EXAMPLE_ID).toBe('welcome')
    expect(getExample(DEFAULT_EXAMPLE_ID)).toBe(EXAMPLES[0])
    expect(getExample('missing')).toBeUndefined()
  })

  it('name one custom property to edit on the first line of their CSS', () => {
    for (const example of withCode) {
      const [firstLine] = example.css.split('\n')
      const property = firstLine.match(/^\/\*.*?(--[\w-]+)/)?.[1]
      expect(property, example.id).toBeDefined()
      expect(example.css, example.id).toContain(`${property}:`)
    }
  })

  it('stay short enough to read: at most 100 lines per editor', () => {
    for (const example of withCode) {
      for (const language of ['html', 'css', 'js']) {
        const lines = example[language].trimEnd().split('\n').length
        expect(lines, `${example.id} ${language}`).toBeLessThanOrEqual(100)
      }
    }
  })

  it('survive a share link round trip unchanged', () => {
    for (const { html, css, js } of withCode) {
      expect(decodeState({ hash: `#${encodeState({ html, css, js })}`, pathname: '/' })).toEqual({ html, css, js })
    }
  })

  it('have JS that parses and cannot close the preview script tag', () => {
    for (const example of withCode) {
      // JS that imports packages runs as a module in the preview
      const run = needsModule(example.js)
        ? () => parse(example.js, { ecmaVersion: 'latest', sourceType: 'module' })
        : () => new Script(example.js)
      expect(run, example.id).not.toThrow()
      expect(example.js, example.id).not.toMatch(/<\/script/i)
    }
  })
})

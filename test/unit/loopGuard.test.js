import { describe, it, expect } from 'vitest'
import { guardScript, guardHtmlScripts, createLoopRuntime } from '../../src/preview/loopGuard'

// Runs guarded code with the real loop runtime (a short limit keeps tests
// fast) and returns what the code returned plus what the guard reported.
function run (code, { limit = 20, ...options } = {}) {
  const reports = []
  const runtime = createLoopRuntime((message) => reports.push(message), limit)
  // Wrapped on the same line, so the snippet's line numbers don't move
  const guarded = guardScript('(function () {' + code + '\n})()', options)
  // eslint-disable-next-line no-new-func
  const result = new Function('__codyLoop', 'return ' + guarded)(runtime)
  return { result, reports }
}

describe('guardScript', () => {
  it('stops an infinite loop, reports its line, and keeps running the code after it', () => {
    const { result, reports } = run('let after = false\nwhile (true) {}\nafter = true\nreturn after')
    expect(result).toBe(true)
    expect(reports).toEqual(['Stopped a loop at JS line 2 after 0.02 s. It may be infinite.'])
  })

  it('stops every kind of loop, braced or not', () => {
    const loops = [
      'for (;;) {}',
      'for (;;) ;',
      'let n = 0; while (true) n++',
      'do {} while (true)',
      'do ; while (true)',
      'const o = { a: 1 }; for (;;) for (const k in o) {}',
      'for (;;) for (const x of [1]) {}'
    ]
    for (const code of loops) {
      expect(run(code + '\nreturn "done"').result, code).toBe('done')
    }
  })

  it('leaves finite loops with the same results', () => {
    const code = `
      const out = []
      outer: for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (j === 1) continue outer
          if (i === 2) break outer
          out.push(i + ':' + j)
        }
      }
      let k = 0
      do k++; while (k < 5)
      for (const key in { a: 1, b: 2 }) out.push(key)
      for (const x of [7, 8]) if (x > 7) out.push(x)
      let w = 0
      while (w < 3) w++
      out.push(k, w)
      return out`
    // eslint-disable-next-line no-new-func
    expect(run(code).result).toEqual(new Function(code)())
    expect(run(code).reports).toEqual([])
  })

  it('guards a loop nested directly as another loop\'s body', () => {
    const { result, reports } = run('let n = 0\nwhile (n < 1) while (true) n++\nreturn n > 0')
    expect(result).toBe(true)
    expect(reports).toHaveLength(1)
  })

  it('leaves loops that await or yield alone', () => {
    const code = [
      'function * count () { let n = 0; while (true) yield n++ }',
      'async function tick () { while (running) { await next() } }',
      'async function each (s) { for await (const x of s) {} }'
    ].join('\n')
    expect(guardScript(code)).toBe(code)
  })

  it('still guards a loop inside a callback within an awaiting loop', () => {
    const code = 'async function f () { while (a) { await b; [1].forEach(() => { while (true) {} }) } }'
    const guarded = guardScript(code)
    expect(guarded.match(/__codyLoop\.check/g)).toHaveLength(1)
  })

  it('leaves loop-like text in strings, comments, regexes and templates alone', () => {
    // eslint-disable-next-line no-template-curly-in-string -- a template literal inside the user's code
    const code = 'const s = "while (true) {}"; const r = /for(;;)/; const t = `do ${s} while`; // for (;;) {}'
    expect(guardScript(code)).toBe(code)
  })

  it('returns code that does not parse unchanged, so the browser reports the real error', () => {
    const code = 'while (true) {'
    expect(guardScript(code)).toBe(code)
  })

  it('counts lines from the pane it came from', () => {
    const { reports } = run('\nfor (;;) {}', { pane: 'HTML', firstLine: 10 })
    expect(reports).toEqual(['Stopped a loop at HTML line 11 after 0.02 s. It may be infinite.'])
  })
})

describe('guardHtmlScripts', () => {
  it('guards inline classic and module scripts, numbering lines within the HTML pane', () => {
    const html = '<p>x</p>\n<script>\nwhile (true) {}\n</script>\n<script type="module">for (;;) {}</script>'
    const guarded = guardHtmlScripts(html)
    expect(guarded).toContain("'HTML',3)")
    expect(guarded).toContain("'HTML',5)")
    expect(guarded.startsWith('<p>x</p>\n<script>')).toBe(true)
  })

  it('leaves external, data and template scripts alone', () => {
    const html = [
      '<script src="lib.js">while (true) {}</script>',
      '<script data-src="x" type="application/json">{"for": 1}</script>',
      '<script type="text/template">while (true) {}</script>'
    ].join('\n')
    expect(guardHtmlScripts(html)).toBe(html)
  })
})

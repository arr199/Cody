import { describe, it, expect } from 'vitest'
import { preparePromptCode } from '../../src/preview/promptCode'
import { createLoopRuntime } from '../../src/preview/loopGuard'

// Runs prepared code the way the preview does, with real report and loop
// runtimes (a short loop limit keeps tests fast), and collects what it sent.
async function run (code) {
  const results = []
  const errors = []
  const loops = []
  const prompt = { report: (value) => results.push(value), reject: (error) => errors.push(error) }
  // eslint-disable-next-line no-new-func
  new Function('__codyPrompt', '__codyLoop', preparePromptCode(code))(prompt, createLoopRuntime((m) => loops.push(m), 20))
  await new Promise((resolve) => setTimeout(resolve))
  return { results, errors, loops }
}

describe('preparePromptCode', () => {
  it('reports the value of the last expression', async () => {
    expect((await run('2 + 2')).results).toEqual([4])
    expect((await run('const a = 2\na * 3')).results).toEqual([6])
    expect((await run('1 + 1 // two')).results).toEqual([2])
  })

  it('answers undefined after a declaration', async () => {
    expect((await run('let x = 1')).results).toEqual([undefined])
  })

  it('reads an object literal on its own as an object', async () => {
    expect((await run('{ a: 1, b: [2] }')).results).toEqual([{ a: 1, b: [2] }])
  })

  it('supports top-level await', async () => {
    expect((await run('await Promise.resolve(5)')).results).toEqual([5])
    expect((await run('const v = await Promise.resolve(2)\nv + 1')).results).toEqual([3])
    const { errors } = await run("await Promise.reject(new Error('no'))")
    expect(errors.map((error) => error.message)).toEqual(['no'])
  })

  it('guards loops, numbering lines from the prompt', async () => {
    const { results, loops } = await run('for (;;) {}\n"after"')
    expect(loops).toEqual(['Stopped a loop at Console line 1 after 0.02 s. It may be infinite.'])
    expect(results).toEqual(['after'])
  })

  it('returns code that does not parse unchanged, so the browser reports it', () => {
    expect(preparePromptCode('let = ')).toBe('let = ')
  })
})

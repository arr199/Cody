import { describe, it, expect } from 'vitest'
import { createRunner } from '../../src/preview/runner'

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const DELAYS = { html: 10, css: 10, js: 30 }

function setup () {
  const runs = []
  const runner = createRunner({ run: () => runs.push(Date.now()), delays: DELAYS })
  const states = []
  runner.subscribe(state => states.push(state))
  return { runner, runs, states }
}

describe('createRunner', () => {
  it('starts with auto-run on and up to date', () => {
    const { states } = setup()
    expect(states).toEqual([{ autoRun: true, stale: false }])
  })

  it('with auto-run on, runs once after the last edit settles, using that language\'s delay', async () => {
    const { runner, runs } = setup()
    runner.edited('html')
    runner.edited('js')
    await sleep(15)
    expect(runs).toHaveLength(0) // JS waits longer
    await sleep(40)
    expect(runs).toHaveLength(1)
  })

  it('with auto-run off, edits wait for a run and mark the preview out of date', async () => {
    const { runner, runs, states } = setup()
    runner.setAutoRun(false)
    runner.edited('css')
    await sleep(30)
    expect(runs).toHaveLength(0)
    expect(states.at(-1)).toEqual({ autoRun: false, stale: true })

    runner.runNow()
    expect(runs).toHaveLength(1)
    expect(states.at(-1)).toEqual({ autoRun: false, stale: false })
  })

  it('runs straight away, cancelling a pending auto-run', async () => {
    const { runner, runs } = setup()
    runner.edited('js')
    runner.runNow()
    await sleep(50)
    expect(runs).toHaveLength(1)
  })

  it('turning auto-run off mid-wait cancels the run and leaves the preview out of date', async () => {
    const { runner, runs, states } = setup()
    runner.edited('js')
    runner.setAutoRun(false)
    await sleep(50)
    expect(runs).toHaveLength(0)
    expect(states.at(-1)).toEqual({ autoRun: false, stale: true })
  })

  it('turning auto-run back on runs out-of-date code at once', () => {
    const { runner, runs, states } = setup()
    runner.setAutoRun(false)
    runner.edited('html')
    runner.setAutoRun(true)
    expect(runs).toHaveLength(1)
    expect(states.at(-1)).toEqual({ autoRun: true, stale: false })
  })

  it('turning auto-run on with nothing new does not run', () => {
    const { runner, runs } = setup()
    runner.setAutoRun(false)
    runner.setAutoRun(true)
    expect(runs).toHaveLength(0)
  })
})

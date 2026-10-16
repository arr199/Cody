import { describe, it, expect } from 'vitest'
import { consoleBridgeScript, readConsoleMessage } from '../../src/preview/consoleBridge'
import { createDescriber } from '../../src/preview/valueDescription'
import { createLoopRuntime } from '../../src/preview/loopGuard'

const { describe: describeValue, table } = createDescriber()
const message = (fields) => ({ source: 'cody-console', ...fields })

describe('consoleBridgeScript', () => {
  it('embeds the describer and the loop runtime', () => {
    const script = consoleBridgeScript()
    expect(script).toContain(createDescriber.toString())
    expect(script).toContain(createLoopRuntime.toString())
    expect(script.match(/<\/script/g)).toHaveLength(1) // only its own closing tag
  })
})

describe('readConsoleMessage', () => {
  it('passes logs, tables, clears and results through, checked', () => {
    const args = [describeValue('hi'), describeValue({ a: 1 })]
    expect(readConsoleMessage(message({ type: 'warn', args }))).toEqual({ type: 'warn', args })
    const data = table([{ a: 1 }])
    expect(readConsoleMessage(message({ type: 'table', table: data }))).toEqual({ type: 'table', table: data })
    expect(readConsoleMessage(message({ type: 'clear' }))).toEqual({ type: 'clear' })
    expect(readConsoleMessage(message({ type: 'result', args: [describeValue(4)] }))).toEqual({ type: 'result', args: [describeValue(4)] })
  })

  it('passes the preview\'s ready signal through', () => {
    expect(readConsoleMessage(message({ type: 'ready' }))).toEqual({ type: 'ready' })
  })

  it('ignores anything else', () => {
    expect(readConsoleMessage({ type: 'log', args: [] })).toBeNull()
    expect(readConsoleMessage(message({ type: 'eval', args: [] }))).toBeNull()
    expect(readConsoleMessage(message({ type: 'log', args: 'x' }))).toBeNull()
    expect(readConsoleMessage(message({ type: 'log', args: [{ kind: 'html', text: '<b>' }] }))).toBeNull()
    expect(readConsoleMessage(message({ type: 'result', args: [] }))).toBeNull()
    expect(readConsoleMessage(message({ type: 'table', table: { columns: [1], rows: [] } }))).toBeNull()
    expect(readConsoleMessage(null)).toBeNull()
  })
})

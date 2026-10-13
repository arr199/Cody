import { describe, it, expect } from 'vitest'
import { serialize, consoleBridgeScript } from '../../src/preview/consoleBridge'

describe('serialize', () => {
  it('shows top-level strings as-is and quotes nested ones', () => {
    expect(serialize('hello')).toBe('hello')
    expect(serialize(['hello'])).toBe('["hello"]')
  })

  it('handles primitives', () => {
    expect(serialize(undefined)).toBe('undefined')
    expect(serialize(null)).toBe('null')
    expect(serialize(42)).toBe('42')
    expect(serialize(false)).toBe('false')
    expect(serialize(10n)).toBe('10n')
    expect(serialize(Symbol('id'))).toBe('Symbol(id)')
  })

  it('handles objects and arrays', () => {
    expect(serialize({ a: 1, b: [1, 'x'], c: { d: null } })).toBe('{a: 1, b: [1, "x"], c: {d: null}}')
  })

  it('marks circular references instead of throwing', () => {
    const obj = { name: 'loop' }
    obj.self = obj
    expect(serialize(obj)).toBe('{name: "loop", self: [Circular]}')
  })

  it('does not mark repeated (non-circular) references as circular', () => {
    const shared = { x: 1 }
    expect(serialize([shared, shared])).toBe('[{x: 1}, {x: 1}]')
  })

  it('handles functions and errors', () => {
    expect(serialize(function greet () {})).toBe('ƒ greet()')
    expect(serialize(() => {})).toBe('ƒ anonymous()')
    expect(serialize(new TypeError('bad'))).toBe('TypeError: bad')
  })

  it('handles Map, Set and Date', () => {
    expect(serialize(new Map([['a', 1]]))).toBe('Map(1) {"a" => 1}')
    expect(serialize(new Set([1, 2]))).toBe('Set(2) {1, 2}')
    expect(serialize(new Date(0))).toBe('1970-01-01T00:00:00.000Z')
  })

  it('limits depth and size', () => {
    expect(serialize({ a: { b: { c: { d: 1 } } } })).toBe('{a: {b: {c: {…}}}}')
    const long = serialize(Array.from({ length: 150 }, (_, i) => i))
    expect(long.endsWith('99, …]')).toBe(true)
  })

  it('survives getters that throw', () => {
    const obj = { get boom () { throw new Error('no') } }
    expect(serialize(obj)).toBe('{boom: "[unreadable]"}')
  })
})

describe('consoleBridgeScript', () => {
  it('embeds a serializer that works without any outer scope', () => {
    const script = consoleBridgeScript()
    const source = script.match(/const serialize = \(([\s\S]*?)\)\n {2}function send/)[1]
    // eslint-disable-next-line no-new-func
    const standalone = new Function(`return (${source})`)()
    const obj = { list: [1, 2] }
    obj.self = obj
    expect(standalone(obj)).toBe(serialize(obj))
  })
})

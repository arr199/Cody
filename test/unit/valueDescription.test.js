import { describe, it, expect } from 'vitest'
import { createDescriber, summarize, sanitizeDescription, sanitizeTable } from '../../src/preview/valueDescription'

const { describe: describeValue, table } = createDescriber()
const show = (value) => summarize(describeValue(value))

describe('summaries', () => {
  it('shows top-level strings as-is and quotes nested ones', () => {
    expect(show('hello')).toBe('hello')
    expect(show(['hello'])).toBe('["hello"]')
  })

  it('handles primitives', () => {
    expect(show(undefined)).toBe('undefined')
    expect(show(null)).toBe('null')
    expect(show(42)).toBe('42')
    expect(show(false)).toBe('false')
    expect(show(10n)).toBe('10n')
    expect(show(Symbol('id'))).toBe('Symbol(id)')
  })

  it('handles objects and arrays', () => {
    expect(show({ a: 1, b: [1, 'x'], c: { d: null } })).toBe('{a: 1, b: [1, "x"], c: {d: null}}')
    expect(show({})).toBe('{}')
  })

  it('marks circular references, but not repeated ones', () => {
    const loop = { name: 'loop' }
    loop.self = loop
    expect(show(loop)).toBe('{name: "loop", self: [Circular]}')
    const shared = { x: 1 }
    expect(show([shared, shared])).toBe('[{x: 1}, {x: 1}]')
  })

  it('handles functions, errors, Map, Set and Date', () => {
    expect(show(function greet () {})).toBe('ƒ greet()')
    expect(show(() => {})).toBe('ƒ anonymous()')
    expect(show(new TypeError('bad'))).toBe('TypeError: bad')
    expect(show(new Map([['a', 1]]))).toBe('Map(1) {"a" => 1}')
    expect(show(new Set([1, 2]))).toBe('Set(2) {1, 2}')
    expect(show(new Date(0))).toBe('1970-01-01T00:00:00.000Z')
  })

  it('names class instances', () => {
    class Point { constructor () { this.x = 1; this.y = 2 } }
    expect(show(new Point())).toBe('Point {x: 1, y: 2}')
  })

  it('keeps summaries short: three levels, a "…" for the rest', () => {
    expect(show({ a: { b: { c: { d: 1 } } } })).toBe('{a: {b: {c: {…}}}}')
    expect(show(Array.from({ length: 150 }, (_, i) => i)).endsWith('99, …]')).toBe(true)
    expect(show(['x'.repeat(150)])).toBe(`["${'x'.repeat(100)}…"]`)
  })
})

describe('describe', () => {
  it('snapshots the value when it is logged', () => {
    const value = { n: 1 }
    const description = describeValue(value)
    value.n = 2
    expect(summarize(description)).toBe('{n: 1}')
  })

  it('keeps entries five levels deep for expanding', () => {
    const deep = { l1: { l2: { l3: { l4: { l5: { l6: 1 } } } } } }
    let node = describeValue(deep)
    for (let level = 1; level <= 4; level++) node = node.entries[0][1]
    expect(node.entries[0][0]).toBe('l5')
    expect(node.entries[0][1]).toEqual({ kind: 'depth', text: '{…}' })
  })

  it('cuts long text and wide objects', () => {
    expect(describeValue('x'.repeat(100000)).text).toHaveLength(10001)
    const wide = Object.fromEntries(Array.from({ length: 10000 }, (_, i) => ['k' + i, i]))
    const description = describeValue(wide)
    expect(description.entries).toHaveLength(100)
    expect(description.more).toBe(9900)
    const grid = Array.from({ length: 100 }, () => Array.from({ length: 100 }, (_, i) => i))
    const described = JSON.stringify(describeValue(grid))
    expect(described.length).toBeLessThan(200000) // the node budget stops it
  })

  it('survives values that throw while being read', () => {
    const hostile = new Proxy({}, { ownKeys () { throw new Error('no keys') } })
    expect(describeValue(hostile)).toEqual({ kind: 'unreadable', text: '[unreadable]' })
    expect(show({ get boom () { throw new Error('no') } })).toBe('{boom: [unreadable]}')
  })

  it('gives errors a message and stack to expand', () => {
    const description = describeValue(new Error('boom'))
    expect(description.kind).toBe('error')
    expect(description.entries.map(([key]) => key)).toEqual(['message', 'stack'])
  })

  it('works when injected on its own', () => {
    // eslint-disable-next-line no-new-func
    const injected = new Function(`return (${createDescriber.toString()})`)()()
    const value = { list: [1, 2], when: new Date(0) }
    value.self = value
    expect(injected.describe(value)).toEqual(describeValue(value))
  })
})

describe('table', () => {
  it('turns an array of objects into columns and rows', () => {
    expect(table([{ name: 'Ada', year: 1815 }, { name: 'Alan' }])).toEqual({
      columns: ['name', 'year'],
      rows: [{ key: '0', cells: ['Ada', '1815'] }, { key: '1', cells: ['Alan', ''] }],
      more: 0
    })
  })

  it('puts primitives in a Value column, and respects chosen columns', () => {
    expect(table(['a', 'b']).columns).toEqual(['Value'])
    expect(table({ x: { a: 1, b: 2 } }, ['b'])).toEqual({ columns: ['b'], rows: [{ key: 'x', cells: ['2'] }], more: 0 })
  })

  it('caps rows and columns, and returns null for non-objects', () => {
    const many = table(Array.from({ length: 150 }, (_, i) => ({ i })))
    expect(many.rows).toHaveLength(100)
    expect(many.more).toBe(50)
    const wide = table([Object.fromEntries(Array.from({ length: 30 }, (_, i) => ['c' + i, i]))])
    expect(wide.columns).toHaveLength(20)
    expect(table(5)).toBeNull()
  })
})

describe('sanitizeDescription', () => {
  it('keeps real descriptions as they are', () => {
    const description = describeValue({ a: [1, 'two', { three: new Map([[4, 5]]) }] })
    expect(sanitizeDescription(description)).toEqual(description)
  })

  it('rejects anything malformed', () => {
    expect(sanitizeDescription({ kind: 'script', text: 'x' })).toBeNull()
    expect(sanitizeDescription({ kind: 'string', text: 5 })).toBeNull()
    expect(sanitizeDescription({ kind: 'object', entries: [[1, { kind: 'null', text: 'null' }]] })).toBeNull()
    expect(sanitizeDescription({ kind: 'object', entries: 'nope' })).toBeNull()
    expect(sanitizeDescription('text')).toBeNull()
  })

  it('re-applies the caps to forged data and drops stray fields', () => {
    let deep = { kind: 'string', text: 'bottom' }
    for (let i = 0; i < 1000; i++) deep = { kind: 'object', entries: [['k', deep]] }
    let node = sanitizeDescription(deep)
    for (let level = 0; level < 5; level++) node = node.entries[0][1]
    expect(node).toEqual({ kind: 'depth', text: '{…}' })

    const wide = { kind: 'array', entries: Array.from({ length: 1000 }, (_, i) => [String(i), { kind: 'number', text: '1' }]) }
    expect(sanitizeDescription(wide).more).toBe(900)
    expect(sanitizeDescription({ kind: 'number', text: '1', onclick: 'x' })).toEqual({ kind: 'number', text: '1' })
  })
})

describe('summarize on forged data', () => {
  // Page code can post descriptions whose nested texts are all 10 000 characters
  it('cuts every nested text, not just strings', () => {
    const long = { kind: 'number', text: '1'.repeat(10000) }
    expect(summarize({ kind: 'array', entries: [['0', long], ['1', long]] })).toBe(`[${'1'.repeat(100)}…, ${'1'.repeat(100)}…]`)
  })
})

describe('sanitizeTable', () => {
  it('keeps real tables and rejects malformed ones', () => {
    const real = table([{ a: 1 }])
    expect(sanitizeTable(real)).toEqual(real)
    expect(sanitizeTable({ columns: ['a'], rows: [{ key: '0', cells: [1] }] })).toBeNull()
    expect(sanitizeTable({ columns: 'a', rows: [] })).toBeNull()
  })
})

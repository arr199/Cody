import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import createSnippet from '../../api/snippets/index.js'
import readSnippet from '../../api/snippets/[id].js'
import { getSql } from '../../api/_lib/db.js'

function request ({ method = 'GET', url = '/', body, query } = {}) {
  const chunks = body === undefined ? [] : [Buffer.from(typeof body === 'string' ? body : JSON.stringify(body))]
  return {
    method,
    url,
    query,
    headers: { 'content-type': 'application/json' },
    async * [Symbol.asyncIterator] () { yield * chunks }
  }
}

function response () {
  const res = { statusCode: 200, headers: {}, body: '' }
  res.setHeader = (name, value) => { res.headers[name.toLowerCase()] = value }
  res.end = (text = '') => { res.body = text; res.ended = true }
  return res
}

async function call (handler, options) {
  const res = response()
  await handler(request(options), res)
  return { status: res.statusCode, headers: res.headers, json: res.body ? JSON.parse(res.body) : undefined }
}

const save = (code) => call(createSnippet, { method: 'POST', url: '/api/snippets', body: code })
const load = (id) => call(readSnippet, { url: `/api/snippets/${id}`, query: { id } })
const count = async () => Number((await getSql()`select count(*) from snippets`)[0].count)

beforeEach(async () => { await getSql()`truncate snippets` })
afterAll(async () => { await getSql().end() })

describe('snippets API', () => {
  it('saves and loads a snippet', async () => {
    const code = { html: '<p>hi</p>', css: 'p { color: red }', js: "console.log('x')" }
    const saved = await save(code)
    expect(saved.status).toBe(201)
    expect(saved.json.id).toMatch(/^[0-9A-Za-z]{8}$/)
    expect(await load(saved.json.id)).toMatchObject({ status: 200, json: code })
  })

  it('the same code returns the same id', async () => {
    const code = { html: 'same', css: '', js: '' }
    const first = await save(code)
    const second = await save(code)
    expect(second).toMatchObject({ status: 200, json: { id: first.json.id } })
    expect(await count()).toBe(1)
  })

  it('concurrent identical saves share one id', async () => {
    const results = await Promise.all(Array.from({ length: 5 }, () => save({ html: 'race', css: '', js: '' })))
    expect(results.every(result => result.status === 200 || result.status === 201)).toBe(true)
    expect(new Set(results.map(result => result.json.id)).size).toBe(1)
    expect(await count()).toBe(1)
  })

  it('round-trips unusual code exactly', async () => {
    const code = { html: '<p>🚀 ünïcode</p>\r\n</script>', css: 'a::after { content: "\\201C" }', js: 'x'.repeat(50000) }
    const saved = await save(code)
    expect((await load(saved.json.id)).json).toEqual(code)
  })

  it('rejects bad JSON, extra keys and non-strings with 400', async () => {
    for (const body of ['{not json', [], { html: 'a', css: '', js: '', extra: 1 }, { html: 1, css: '', js: '' }]) {
      expect((await save(body)).status, JSON.stringify(body)).toBe(400)
    }
    expect((await call(createSnippet, { method: 'POST', url: '/api/snippets' })).status).toBe(400)
    expect(await count()).toBe(0)
  })

  it('rejects NUL characters with 400', async () => {
    expect((await save({ html: 'a\u0000', css: '', js: '' })).status).toBe(400)
  })

  it('rejects oversized code with 413', async () => {
    expect((await save({ html: 'x'.repeat(204801), css: '', js: '' })).status).toBe(413)
  })

  it('unknown and malformed ids are 404', async () => {
    expect((await load('zzzzzzzz')).status).toBe(404)
    expect((await load('../x')).status).toBe(404)
  })

  it('GET sets an immutable cache header, and 404s are not cached', async () => {
    const saved = await save({ html: 'cache', css: '', js: '' })
    expect((await load(saved.json.id)).headers['cache-control']).toBe('public, max-age=31536000, immutable')
    expect((await load('zzzzzzzz')).headers['cache-control']).toBe('no-store')
  })

  it('only answers its own methods', async () => {
    expect((await call(createSnippet, { method: 'GET', url: '/api/snippets' })).status).toBe(405)
    expect((await call(readSnippet, { method: 'POST', url: '/api/snippets/abcdefgh', query: { id: 'abcdefgh' } })).status).toBe(405)
  })
})

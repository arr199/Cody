import { describe, it, expect } from 'vitest'
import { MAX_SNIPPET_BYTES, validateSnippet, snippetHash, newSnippetId, isSnippetId } from '../../api/_lib/snippets'

describe('validateSnippet', () => {
  it('accepts exactly html, css and js strings', () => {
    expect(validateSnippet({ html: 'a', css: '', js: '' })).toEqual({ code: { html: 'a', css: '', js: '' } })
  })

  it('rejects anything else with 400', () => {
    for (const body of [null, 'text', [], {}, { html: 'a', css: '' }, { html: 'a', css: '', js: 1 }, { html: 'a', css: '', js: '', x: 1 }]) {
      expect(validateSnippet(body), JSON.stringify(body)).toMatchObject({ status: 400 })
    }
  })

  it('rejects NUL characters, which Postgres text cannot store', () => {
    expect(validateSnippet({ html: 'a\u0000b', css: '', js: '' })).toMatchObject({ status: 400 })
  })

  it('rejects more than 200 KB of UTF-8 with 413', () => {
    expect(MAX_SNIPPET_BYTES).toBe(204800)
    const big = 'é'.repeat(102401) // 204 802 bytes in 102 401 characters
    expect(validateSnippet({ html: big, css: '', js: '' })).toMatchObject({ status: 413 })
    expect(validateSnippet({ html: 'é'.repeat(102400), css: '', js: '' })).toHaveProperty('code')
  })
})

describe('snippetHash', () => {
  it('is stable for the same code and changes when code moves between panes', () => {
    const hash = snippetHash({ html: 'x', css: '', js: '' })
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(snippetHash({ html: 'x', css: '', js: '' })).toBe(hash)
    expect(snippetHash({ html: '', css: 'x', js: '' })).not.toBe(hash)
  })
})

describe('snippet ids', () => {
  it('are 8 random base62 characters', () => {
    const ids = Array.from({ length: 1000 }, newSnippetId)
    for (const id of ids) expect(id).toMatch(/^[0-9A-Za-z]{8}$/)
    expect(new Set(ids).size).toBe(1000)
  })

  it('isSnippetId accepts only that shape', () => {
    expect(isSnippetId('AbC12xyZ')).toBe(true)
    for (const value of ['abc', 'abcdefghi', 'abcd-fgh', '../x', 12345678, null]) expect(isSnippetId(value)).toBe(false)
  })
})

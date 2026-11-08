import { describe, it, expect } from 'vitest'
import { sharedSnippetId, isSharedPath, snippetUrl } from '../../src/share/snippetClient'

describe('sharedSnippetId', () => {
  it('only exact 8-character base62 ids are snippet routes', () => {
    expect(sharedSnippetId('/s/AbC12xyZ')).toBe('AbC12xyZ')
    expect(sharedSnippetId('/s/AbC12xyZ/')).toBe('AbC12xyZ')
    for (const path of ['/', '/s/abc', '/s/abcdefghi', '/s/abcdefgh/x', '/s/../x', '/s/abcd-fgh', '/x/abcdefgh']) {
      expect(sharedSnippetId(path), path).toBeNull()
    }
  })
})

describe('isSharedPath', () => {
  it('recognises every /s/ path, valid id or not', () => {
    for (const path of ['/s/AbC12xyZ', '/s/abc', '/s/abcdefghi', '/s/abcdefgh/x']) expect(isSharedPath(path), path).toBe(true)
    for (const path of ['/', '/sx/abcdefgh', '/s']) expect(isSharedPath(path), path).toBe(false)
  })
})

describe('snippetUrl', () => {
  it('builds origin/s/id', () => {
    expect(snippetUrl('AbC12xyZ', 'https://cody.example')).toBe('https://cody.example/s/AbC12xyZ')
  })
})

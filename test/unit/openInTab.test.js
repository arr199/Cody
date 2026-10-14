import { describe, it, expect } from 'vitest'
import { previewUrl } from '../../src/preview/openInTab'
import { decodeState } from '../../src/state/urlCodec'

describe('previewUrl', () => {
  it('points preview.html at the code, in the share-link hash format', () => {
    const code = { html: '<p>hi</p>', css: 'p { color: red }', js: "console.log('x')" }
    const url = previewUrl(code)
    expect(url.startsWith('/preview.html#')).toBe(true)
    expect(decodeState({ hash: url.slice(url.indexOf('#')), pathname: '/' })).toEqual(code)
  })
})

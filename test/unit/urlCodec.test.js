import { describe, it, expect } from 'vitest'
import { encode } from 'js-base64'
import { encodeState, decodeState } from '../../src/state/urlCodec'

const fromHash = (state) => decodeState({ hash: `#${state}`, pathname: '/' })

describe('urlCodec', () => {
  it('round-trips code through the hash', () => {
    const code = { html: '<h1>Hi</h1>', css: 'h1 { color: red }', js: 'console.log(1 + 1)' }
    expect(fromHash(encodeState(code))).toEqual(code)
  })

  it('round-trips unicode', () => {
    const code = { html: '<p>¡Hola, señor! 你好 🎉</p>', css: '', js: "const s = 'ñ'" }
    expect(fromHash(encodeState(code))).toEqual(code)
  })

  it('uses URL-safe characters only', () => {
    // Inputs whose standard base64 contains "+" and "/"
    const state = encodeState({ html: '<<???>>', css: '~~~', js: '' })
    expect(state).toMatch(/^[A-Za-z0-9_|-]*$/)
  })

  it('keeps empty parts in their positions', () => {
    const code = { html: '', css: 'body {}', js: '' }
    expect(fromHash(encodeState(code))).toEqual(code)
  })

  it('encodes no code as an empty string', () => {
    expect(encodeState({ html: '', css: '', js: '' })).toBe('')
    expect(decodeState({ hash: '', pathname: '/' })).toEqual({ html: '', css: '', js: '' })
  })

  it('decodes legacy path links, including base64 containing "/"', () => {
    const html = '<<???>>' // standard base64: PDw/Pz8+Pg==
    expect(encode(html)).toContain('/')
    const pathname = `/${encode(html)}%7C${encode('alert(1)')}%7C${encode('p { margin: 0 }')}`
    expect(decodeState({ hash: '', pathname })).toEqual({
      html,
      js: 'alert(1)',
      css: 'p { margin: 0 }'
    })
  })

  it('prefers the hash over the path', () => {
    const state = encodeState({ html: 'from hash', css: '', js: '' })
    expect(decodeState({ hash: `#${state}`, pathname: `/${encode('from path')}` }).html).toBe('from hash')
  })

  it('returns empty code for malformed links instead of throwing', () => {
    expect(decodeState({ hash: '#%E0%A4%A', pathname: '/' })).toEqual({ html: '', css: '', js: '' })
  })
})

import { createHash, randomBytes } from 'node:crypto'

export const MAX_SNIPPET_BYTES = 200 * 1024
const KEYS = ['html', 'css', 'js']
const ID_LENGTH = 8
const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

export function validateSnippet (body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { status: 400, error: 'Expected an object with html, css and js' }
  const keys = Object.keys(body)
  if (keys.length !== KEYS.length || !KEYS.every(key => typeof body[key] === 'string')) {
    return { status: 400, error: 'Expected exactly html, css and js, as strings' }
  }
  // Postgres text can't store NUL
  if (KEYS.some(key => body[key].includes('\u0000'))) return { status: 400, error: 'Code contains a NUL character' }
  const bytes = KEYS.reduce((total, key) => total + Buffer.byteLength(body[key]), 0)
  if (bytes > MAX_SNIPPET_BYTES) return { status: 413, error: 'Code is larger than 200 KB' }
  return { code: { html: body.html, css: body.css, js: body.js } }
}

export function snippetHash ({ html, css, js }) {
  return createHash('sha256').update(JSON.stringify([html, css, js])).digest('hex')
}

// Bytes of 248 and up are skipped so every base62 character is equally likely
export function newSnippetId () {
  let id = ''
  while (id.length < ID_LENGTH) {
    for (const byte of randomBytes(ID_LENGTH * 2)) {
      if (byte < 248 && id.length < ID_LENGTH) id += BASE62[byte % 62]
    }
  }
  return id
}

export function isSnippetId (value) {
  return typeof value === 'string' && /^[0-9A-Za-z]{8}$/.test(value)
}

import { encode, decode } from 'js-base64'

// Share links store the code as `html|js|css`, each part base64-encoded.
// Keep this order: links already saved in the shortener depend on it.
const SEPARATOR = '|'

export function encodeState ({ html, js, css }) {
  if (!html && !js && !css) return ''
  return [html, js, css].map(part => encode(part, true)).join(SEPARATOR)
}

function decodeParts (raw) {
  const [html = '', js = '', css = ''] = raw.split(SEPARATOR).map(part => decode(part))
  return { html, js, css }
}

// Current links keep the code in the hash. Older links kept it in the path,
// URL-encoded and in standard base64 (which can contain "/"), so the whole
// pathname is decoded rather than a single segment.
export function decodeState ({ hash, pathname }) {
  try {
    const raw = hash.length > 1 ? hash.slice(1) : pathname.slice(1)
    return decodeParts(decodeURIComponent(raw))
  } catch {
    return { html: '', js: '', css: '' }
  }
}

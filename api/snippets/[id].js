import { getSql, findSnippet } from '../_lib/db.js'
import { sendJson } from '../_lib/http.js'
import { isSnippetId } from '../_lib/snippets.js'

const IMMUTABLE = 'public, max-age=31536000, immutable'

export default async function handler (req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Use GET' })
  const id = req.query?.id ?? decodeURIComponent(new URL(req.url, 'http://x').pathname.split('/').pop())
  if (!isSnippetId(id)) return sendJson(res, 404, { error: 'No such snippet' })
  try {
    const code = await findSnippet(getSql(), id)
    if (!code) return sendJson(res, 404, { error: 'No such snippet' })
    sendJson(res, 200, code, IMMUTABLE)
  } catch (error) {
    console.error('Could not load a snippet', error)
    sendJson(res, 500, { error: 'Could not load the code' })
  }
}

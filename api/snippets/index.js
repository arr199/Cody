import { getSql, saveSnippet } from '../_lib/db.js'
import { sendJson, readJsonBody } from '../_lib/http.js'
import { MAX_SNIPPET_BYTES, validateSnippet } from '../_lib/snippets.js'

export default async function handler (req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Use POST' })
  // JSON escapes can make the body several times longer than the code
  const body = await readJsonBody(req, MAX_SNIPPET_BYTES * 6 + 1024)
  if (body?.tooLarge === true) return sendJson(res, 413, { error: 'Code is larger than 200 KB' })
  const result = validateSnippet(body)
  if (result.error) return sendJson(res, result.status, { error: result.error })
  try {
    const { id, created } = await saveSnippet(getSql(), result.code)
    sendJson(res, created ? 201 : 200, { id })
  } catch (error) {
    console.error('Could not save a snippet', error)
    sendJson(res, 500, { error: 'Could not save the code' })
  }
}

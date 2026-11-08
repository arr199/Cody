export function sendJson (res, status, data, cacheControl = 'no-store') {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', cacheControl)
  res.end(JSON.stringify(data))
}

// Vercel parses JSON into req.body; a plain Node server leaves the stream
export async function readJsonBody (req, limit) {
  if (req.body !== undefined) return typeof req.body === 'string' ? parse(req.body) : req.body
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > limit) return { tooLarge: true }
    chunks.push(chunk)
  }
  return parse(Buffer.concat(chunks).toString('utf8'))
}

function parse (text) {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

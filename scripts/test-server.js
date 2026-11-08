// Serves dist/ and the api/ handlers like Vercel does, for the e2e tests
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import createSnippet from '../api/snippets/index.js'
import readSnippet from '../api/snippets/[id].js'

const PORT = Number(process.argv[2] ?? 4179)
const DIST = fileURLToPath(new URL('../dist/', import.meta.url))
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2'
}

async function serveFile (res, path) {
  const body = await readFile(join(DIST, path))
  res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' })
  res.end(body)
}

http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost')
  if (pathname === '/api/snippets') return createSnippet(req, res)
  const match = pathname.match(/^\/api\/snippets\/([^/]+)$/)
  if (match) {
    req.query = { id: decodeURIComponent(match[1]) }
    return readSnippet(req, res)
  }
  const file = normalize(decodeURIComponent(pathname)).replace(/^[/\\]+/, '')
  try {
    if (file && !file.startsWith('..')) return await serveFile(res, file)
  } catch {}
  await serveFile(res, 'index.html')
}).listen(PORT)

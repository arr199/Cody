// A stand-in for esm.sh in the e2e tests (playwright.config.js starts it and
// builds the app against it): a few tiny packages, 404 for anything else, and
// a dropped connection for names starting with "offline-", which is how an
// unreachable CDN looks to the page.
import http from 'node:http'

const PORT = Number(process.argv[2])
const PACKAGES = {
  greet: 'export default function greet (name) { return "hi " + name }\nexport const version = "1.0.0"',
  // Records each burst instead of drawing it, so tests can count launches
  'canvas-confetti': 'const confetti = (options = {}) => { (globalThis.confettiBursts ??= []).push(options); return Promise.resolve() }\nconfetti.reset = () => {}\nexport default confetti'
}

http.createServer((req, res) => {
  const name = decodeURIComponent(new URL(req.url, 'http://cdn').pathname.slice(1))
  if (name.startsWith('offline-')) return req.socket.destroy()
  const headers = { 'access-control-allow-origin': '*', 'cache-control': 'no-store' }
  const body = PACKAGES[name]
  if (body === undefined) {
    res.writeHead(404, headers)
    return res.end('Not Found')
  }
  res.writeHead(200, { ...headers, 'content-type': 'text/javascript' })
  res.end(req.method === 'HEAD' ? undefined : body)
}).listen(PORT, '127.0.0.1')

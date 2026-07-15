/* probe-418 · load ONE route headless, surface every page error verbatim
   (dev-quality diagnosis for the minified #418: which route, which node).
   Serves dist/ like the sweep does, listens to Runtime.exceptionThrown +
   consoleAPI, prints everything, exits 0/1. */
import { execFile } from 'node:child_process'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { join, extname } from 'node:path'

const ROOT = process.argv[2]
const ROUTE = process.argv[3] ?? '/map'
const DIST = join(ROOT, 'dist')
const PORT = 9271
const DEBUG_PORT = 9272

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.webp': 'image/webp', '.txt': 'text/plain', '.xml': 'application/xml' }
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x').pathname
  for (const t of [url, url.replace(/\/$/, '') + '/index.html', url + '/index.html', '/index.html']) {
    try {
      const body = await readFile(join(DIST, t))
      res.writeHead(200, { 'content-type': MIME[extname(t)] ?? 'application/octet-stream' })
      return res.end(body)
    } catch { /* try next */ }
  }
  res.writeHead(404).end()
})
await new Promise((r) => server.listen(PORT, r))

const CHROME = process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const chrome = execFile(CHROME, ['--headless=new', `--remote-debugging-port=${DEBUG_PORT}`, '--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1440,900', '--no-first-run', `--user-data-dir=/tmp/probe418-${DEBUG_PORT}`, 'about:blank'], () => {})
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let ws
for (let i = 0; i < 40; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json()
    const page = list.find((t) => t.type === 'page')
    if (page) { ws = new WebSocket(page.webSocketDebuggerUrl); break }
  } catch { /* retry */ }
  await sleep(250)
}
if (!ws) {
  chrome.kill()
  console.error('probe-hydration: CDP target never appeared (is Chrome installed? CHROME_BIN set?)')
  process.exit(1)
}
await new Promise((r) => (ws.onopen = r))
let mid = 0
const pending = new Map()
const errors = []
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data)
  if (m.id && pending.has(m.id)) { const { resolve } = pending.get(m.id); pending.delete(m.id); resolve(m.result) }
  if (m.method === 'Runtime.exceptionThrown') {
    const d = m.params.exceptionDetails
    errors.push(`EXCEPTION · ${d.text} · ${d.exception?.description?.slice(0, 400) ?? ''}`)
  }
  if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning')) {
    errors.push(`CONSOLE ${m.params.type} · ${m.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 500)}`)
  }
}
const send = (method, params = {}) => new Promise((res) => { const id = ++mid; pending.set(id, { resolve: res }); ws.send(JSON.stringify({ id, method, params })) })
await send('Page.enable')
await send('Runtime.enable')
await send('Page.navigate', { url: `http://127.0.0.1:${PORT}${ROUTE}` })
await sleep(6000)
console.log(`── ${ROUTE} · ${errors.length} error/warning event(s)`)
for (const e of errors) console.log(e)
server.close()
chrome.kill()
process.exit(errors.some((e) => e.includes('418') || e.includes('Hydration')) ? 1 : 0)

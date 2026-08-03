/* probe-quai · scroll to the document end (the sticky footer defeats
   scrollIntoView — pinned elements are "already in view") and capture the
   revealed footer. Usage: node scripts/probe-quai.mjs <route> <out.png> [scrollBackPx] */
import { execFile } from 'node:child_process'
import { createServer } from 'node:http'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { extname, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const [route = '/language/governance/', out = 'shots/quai.png', back = '0'] = process.argv.slice(2)
mkdirSync(dirname(join(ROOT, out)), { recursive: true })
const PORT_CDP = 9333
const PORT_HTTP = 9334
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const server = createServer((req, res) => {
  const path = (req.url ?? '/').split('?')[0]
  const tries = [path, `${path}/index.html`.replace('//', '/'), path.endsWith('/') ? `${path}index.html` : null, '/index.html'].filter(Boolean)
  for (const t of tries) {
    try { const body = readFileSync(join(DIST, t)); res.writeHead(200, { 'content-type': MIME[extname(t)] ?? 'application/octet-stream' }); return res.end(body) } catch { /* next */ }
  }
  res.writeHead(404); res.end('nope')
})
server.listen(PORT_HTTP)
const CHROME = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const chrome = execFile(CHROME, [
  `--remote-debugging-port=${PORT_CDP}`, '--headless=new', '--disable-gpu', '--use-gl=angle', '--use-angle=swiftshader',
  '--no-first-run', '--no-default-browser-check', `--user-data-dir=/tmp/probe-quai-${Date.now()}`, 'about:blank',
])
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
await wait(1600)
const list = await (await fetch(`http://127.0.0.1:${PORT_CDP}/json/list`)).json()
const tab = list.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension')) ?? list[0]
const ws = new WebSocket(tab.webSocketDebuggerUrl)
let id = 0
const pending = new Map()
const send = (method, params) => new Promise((resolve) => { const mid = ++id; pending.set(mid, resolve); ws.send(JSON.stringify({ id: mid, method, params })) })
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id) } }
await new Promise((r) => { ws.onopen = r })
await send('Page.enable')
await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false })
await send('Page.navigate', { url: `http://127.0.0.1:${PORT_HTTP}${route}` })
await wait(3500)
await send('Runtime.evaluate', { expression: `window.scrollTo({ top: document.documentElement.scrollHeight - innerHeight - ${Number(back)}, behavior: 'instant' })` })
await wait(2500) // lazy sky mount + settle
const { data } = await send('Page.captureScreenshot', { format: 'png' })
writeFileSync(join(ROOT, out), Buffer.from(data, 'base64'))
console.log('shot ·', out)
chrome.kill(); server.close(); process.exit(0)

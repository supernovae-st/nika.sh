/* ─── a11y-sweep · axe-core against the built site (W12 · D5) ─────────────────
   Serves dist/, drives headless Chrome over every prerendered route, injects
   axe-core, and fails on critical/serious violations. Moderate/minor are
   reported but don't gate — the goal is a floor, not a churn machine.

   Run:  pnpm build && node scripts/a11y-sweep.mjs
   Env:  CHROME_BIN overrides the browser binary (CI). */
import { execFile } from 'node:child_process'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const PORT = 9251
const ROUTES = ['/', '/manifesto', '/fr/manifesto', '/es/manifesto', '/de/manifesto', '/pt-br/manifesto', '/ja/manifesto', '/ko/manifesto', '/zh-hans/manifesto', '/play', '/install', '/learn', '/spec', '/use-cases', '/blog', '/blog/four-verbs', '/blog/intent-as-code', '/blog/own-your-stack', '/blog/dag-for-free', '/blog/blast-radius-in-the-file', '/blog/standard-library-not-plugin-store', '/blog/open-spec-copyleft-engine', '/blog/the-note-that-started-it', '/blog/naming-the-drum', '/blog/starting-over-on-purpose', '/blog/the-trace-you-can-replay', '/blog/anatomy-of-a-verb', '/blog/the-cost-line', '/changelog', '/errors', '/errors/NIKA-SEC-001', '/tools', '/tools/fetch', '/sitemap', '/convert', '/brand']
const AXE_SRC = readFileSync(join(ROOT, 'node_modules/axe-core/axe.min.js'), 'utf8')

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.webp': 'image/webp', '.txt': 'text/plain', '.xml': 'application/xml' }
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x').pathname
  for (const t of [url, url.replace(/\/$/, '') + '/index.html', url + '/index.html', '/index.html']) {
    try {
      const body = await readFile(join(DIST, t))
      res.writeHead(200, { 'content-type': MIME[extname(t)] ?? 'application/octet-stream' })
      return res.end(body)
    } catch {}
  }
  res.writeHead(404).end()
})
await new Promise((r) => server.listen(PORT, r))

const CHROME = process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const DEBUG_PORT = 9252
const chrome = execFile(CHROME, ['--headless=new', `--remote-debugging-port=${DEBUG_PORT}`, '--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1440,900', '--no-first-run', '--no-default-browser-check', `--user-data-dir=/tmp/a11y-sweep-${DEBUG_PORT}`, 'about:blank'], () => {})
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function wsUrl() {
  for (let i = 0; i < 40; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json()
      const page = list.find((t) => t.type === 'page')
      if (page) return page.webSocketDebuggerUrl
    } catch {}
    await sleep(250)
  }
  throw new Error('chrome did not come up')
}
const ws = new WebSocket(await wsUrl())
await new Promise((r) => (ws.onopen = r))
let mid = 0
const pending = new Map()
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data)
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id)
    pending.delete(m.id)
    m.error ? reject(new Error(m.error.message)) : resolve(m.result)
  }
}
const send = (method, params = {}) => new Promise((res, rej) => { const id = ++mid; pending.set(id, { resolve: res, reject: rej }); ws.send(JSON.stringify({ id, method, params })) })
const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? 'eval failed')
  return r.result.value
}

await send('Page.enable')
await send('Runtime.enable')

let gate = 0
for (const route of ROUTES) {
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}${route}` })
  /* deterministic settle — the old blind 3500ms sometimes ran axe against a
     document still mid-navigation (axe then reported html-has-lang/
     document-title on the BLANK doc · flake). Poll the loaded app + fonts,
     then one short settle for late reveals. */
  for (let i = 0; i < 40; i++) {
    const ready = await evaluate(
      `document.readyState === 'complete' && !!document.querySelector('#app')?.children.length`,
    ).catch(() => false)
    if (ready) break
    await sleep(250)
  }
  await evaluate(`document.fonts ? document.fonts.ready.then(() => true) : true`).catch(() => {})
  await sleep(800)
  await evaluate(AXE_SRC + '; true')
  const result = await evaluate(`axe.run(document, { resultTypes: ['violations'] }).then(r => r.violations.map(v => ({ id: v.id, impact: v.impact, count: v.nodes.length, sample: v.nodes[0]?.target?.[0] ?? '' })))`)
  const bad = result.filter((v) => v.impact === 'critical' || v.impact === 'serious')
  const soft = result.filter((v) => v.impact !== 'critical' && v.impact !== 'serious')
  gate += bad.length
  const label = bad.length ? '✗' : '✓'
  console.log(`${label} ${route.padEnd(12)} ${bad.length} gating · ${soft.length} advisory`)
  for (const v of bad) console.log(`    ✗ [${v.impact}] ${v.id} ×${v.count} · e.g. ${v.sample}`)
  for (const v of soft) console.log(`    · [${v.impact}] ${v.id} ×${v.count} · e.g. ${v.sample}`)
}

server.close()
chrome.kill()
if (gate > 0) {
  console.error(`\na11y gate: ${gate} critical/serious violation groups`)
  process.exit(1)
}
console.log('\na11y gate: clean (critical/serious)')
process.exit(0)

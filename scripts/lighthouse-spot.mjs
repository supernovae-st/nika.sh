/* ─── lighthouse-spot · the REAL numbers, on demand (W19b) ────────────────────
   Serves dist/ and runs Lighthouse (mobile preset · simulated 4G + 4× CPU)
   against the key routes. A spot-check, deliberately NOT a CI gate: LH scores
   flake by nature; the value is a truthful measurement you re-run after perf
   work. Prints score + LCP/TBT/CLS per route; JSON reports land in
   .lighthouse/ (gitignored).

   Run: pnpm build && node scripts/lighthouse-spot.mjs [route ...] */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'
import lighthouse from 'lighthouse'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const OUT = join(ROOT, '.lighthouse')
const PORT = 9280
const DEBUG_PORT = 9281
const ROUTES = process.argv.slice(2).length ? process.argv.slice(2) : ['/', '/play', '/blog/four-verbs']

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
const chrome = execFile(CHROME, ['--headless=new', `--remote-debugging-port=${DEBUG_PORT}`, '--no-first-run', '--no-default-browser-check', `--user-data-dir=/tmp/lh-spot-${DEBUG_PORT}`, 'about:blank'], () => {})
process.on('exit', () => chrome.kill())
await new Promise((r) => setTimeout(r, 3000))

mkdirSync(OUT, { recursive: true })
const ms = (v) => `${Math.round(v)}ms`
for (const route of ROUTES) {
  const { lhr } = await lighthouse(`http://127.0.0.1:${PORT}${route}`, {
    port: DEBUG_PORT,
    output: 'json',
    onlyCategories: ['performance'],
    formFactor: 'mobile',
    /* devtools = real-clock throttling — the boot-guard watchdog (a wall-time
       setTimeout) is visible here; lantern would re-map the fast local run
       and miss it entirely. */
    throttlingMethod: 'devtools',
    screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 2, disabled: false },
  })
  const a = lhr.audits
  const name = route === '/' ? 'home' : route.replace(/\//g, '-').replace(/^-/, '')
  writeFileSync(join(OUT, `${name}.json`), JSON.stringify(lhr, null, 1))
  const num = (k) => a[k]?.numericValue
  const fmt = (v, f) => (v === undefined ? 'n/a' : f(v))
  console.log(
    `${route.padEnd(22)} perf ${Math.round((lhr.categories.performance?.score ?? 0) * 100)}` +
      ` · FCP ${fmt(num('first-contentful-paint'), ms)}` +
      ` · LCP ${fmt(num('largest-contentful-paint'), ms)}` +
      ` · TBT ${fmt(num('total-blocking-time'), ms)}` +
      ` · CLS ${fmt(num('cumulative-layout-shift'), (v) => v.toFixed(3))}`,
  )
}
server.close()
process.exit(0)

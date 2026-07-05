/* shoot-routes · headless screenshot belt across routes × viewports × states.
   Complements shoot-scroll.mjs (scroll-linked sweeps) and visual-regress.mjs
   (pixel-compared goldens): this one is the DESIGN-ITERATION eye — build,
   then shoot any set of prerendered routes at chosen viewports, optionally
   forcing the EdgeAurora state (rest / hello / run / pulse), scrolling a
   section into view, or emulating reduced motion for the settled register.
   Zero deps — Node 22 global WebSocket + CDP against Chrome headless on
   swiftshader (same GL truth as CI screenshots).

   Usage:
     pnpm build && node scripts/shoot-routes.mjs \
       --routes /,/blog,/spec \
       --states rest,hello \
       --viewports desktop,mobile \
       --out shots/belt
     node scripts/shoot-routes.mjs --routes / --scroll-to .v5run-stage \
       --settle 14000 --out shots/run     # a scroll-armed device, settled
     node scripts/shoot-routes.mjs --routes /blog --reduced --out shots/still

   Flags:
     --routes    comma list of prerendered paths (default /)
     --states    comma subset of rest,hello,run,pulse (default: rest only;
                 states other than rest freeze the aurora drift first)
     --viewports comma subset of desktop,mobile (default both)
     --scroll-to CSS selector scrolled into view before the shot
     --settle    extra ms to wait before shooting (autoplay devices)
     --reduced   emulate prefers-reduced-motion (the settled static register)
     --out       output dir (default shots/routes)
     --port      CDP port (default 9245) · http is port+1 · override when a
                 concurrent session holds the defaults
     --chrome    browser binary (CHROME_BIN env also works)

   The two traps this harness already knows (found on the aurora-v10 arc):
   react-ssg emits per-route DIRECTORIES (dist/manifesto/index.html) — the
   server must try dir/index.html before the SPA fallback; and the device
   metrics override can lose a race with navigation — it is re-applied
   post-load before every shot. */
import { execFile } from 'node:child_process'
import { createServer } from 'node:http'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { extname, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : fallback
}
const has = (name) => process.argv.includes(`--${name}`)

const ROUTES = arg('routes', '/').split(',')
const STATES = arg('states', 'rest').split(',')
const VIEWPORT_TAGS = arg('viewports', 'desktop,mobile').split(',')
const SCROLL_TO = arg('scroll-to', '')
const SETTLE_MS = Number(arg('settle', '0'))
const REDUCED = has('reduced')
const OUT = arg('out', 'shots/routes')
const PORT_CDP = Number(arg('port', '9245'))
const PORT_HTTP = PORT_CDP + 1
const CHROME = arg(
  'chrome',
  process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
)

/* the aurora states the belt can force (edge-aurora.css contract: intensity
   var + data attrs on [data-edge-aurora]; drift frozen at a fixed phase so
   shots are comparable across runs) */
const STATE_JS = {
  rest: `el.style.setProperty('--aurora-intensity','0.055')`,
  hello: `el.style.setProperty('--aurora-intensity','0.32')`,
  run: `el.dataset.run='on'; el.style.setProperty('--aurora-intensity','0.26'); el.style.setProperty('--aurora-progress','0.6')`,
  pulse: `delete el.dataset.run; el.style.setProperty('--aurora-intensity','0.38'); el.style.setProperty('--aurora-progress','0')`,
}
const VIEWPORTS = {
  desktop: { w: 1600, h: 1000, mobile: false },
  mobile: { w: 390, h: 844, mobile: true },
}

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
  '.webmanifest': 'application/manifest+json',
}
const server = createServer((req, res) => {
  const path = (req.url ?? '/').split('?')[0]
  /* react-ssg emits per-route directories — try the candidates in order */
  const candidates = [
    join(ROOT, 'dist', path === '/' ? 'index.html' : path),
    join(ROOT, 'dist', path, 'index.html'),
    join(ROOT, 'dist/index.html'),
  ]
  for (const file of candidates) {
    try {
      const body = readFileSync(file)
      res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' })
      return res.end(body)
    } catch {
      /* directory or missing — next candidate */
    }
  }
  res.writeHead(404)
  res.end()
})
server.listen(PORT_HTTP)

const chrome = execFile(
  CHROME,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT_CDP}`,
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--hide-scrollbars',
    '--window-size=1600,1000',
    '--force-device-scale-factor=1',
    '--no-first-run',
    '--no-default-browser-check',
    '--no-sandbox',
    `--user-data-dir=/tmp/shoot-routes-${PORT_CDP}`,
    'about:blank',
  ],
  () => {},
)
const cleanup = () => {
  chrome.kill()
  server.close()
}
process.on('exit', cleanup)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function getWsUrl() {
  /* generous: the machine may carry concurrent headless sweeps */
  for (let i = 0; i < 240; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT_CDP}/json/list`)
      const page = (await res.json()).find((t) => t.type === 'page')
      if (page) return page.webSocketDebuggerUrl
    } catch {
      /* not up yet */
    }
    await sleep(250)
  }
  throw new Error('chrome did not come up')
}

const ws = new WebSocket(await getWsUrl())
await new Promise((r) => (ws.onopen = r))
let mid = 0
const pending = new Map()
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data)
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id)
    pending.delete(msg.id)
    msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result)
  }
}
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++mid
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })
const evaluate = async (expr) => {
  const r = await send('Runtime.evaluate', {
    expression: expr,
    returnByValue: true,
    awaitPromise: true,
  })
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails))
  return r.result.value
}

await send('Page.enable')
await send('Runtime.enable')
if (REDUCED) {
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  })
}

/* freeze the aurora drift at a fixed phase (comparable shots) — only when a
   non-rest state is being forced; the rest register ships as-is */
const FREEZE = `(() => {
  const s = document.createElement('style')
  s.textContent = \`
    .edge-aurora { animation: none !important; opacity: 1 !important; }
    .edge-aurora::before, .edge-aurora::after,
    .edge-aurora-depth, .edge-aurora-lining {
      animation-play-state: paused !important;
      animation-delay: -21s !important;
    }
  \`
  document.head.appendChild(s)
  return true
})()`

mkdirSync(OUT, { recursive: true })
const wantsAuroraFreeze = STATES.some((s) => s !== 'rest')

for (const route of ROUTES) {
  const slug = route === '/' ? 'home' : route.replaceAll('/', '-').replace(/^-|-$/g, '')
  for (const tag of VIEWPORT_TAGS) {
    const vp = VIEWPORTS[tag]
    if (!vp) continue
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.w,
      height: vp.h,
      deviceScaleFactor: 1,
      mobile: vp.mobile,
    })
    const sep = route.includes('?') ? '&' : '?'
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT_HTTP}${route}${sep}it=99` })
    await sleep(6000) /* load + fonts + settle */
    /* re-apply metrics post-load (the navigation race trap) */
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.w,
      height: vp.h,
      deviceScaleFactor: 1,
      mobile: vp.mobile,
    })
    await sleep(400)
    if (wantsAuroraFreeze) await evaluate(FREEZE)
    if (SCROLL_TO) {
      const hit = await evaluate(
        `(() => { const el = document.querySelector(${JSON.stringify(SCROLL_TO)}); if (!el) return 'NO-TARGET'; el.scrollIntoView({ block: 'center' }); return 'ok' })()`,
      )
      if (hit !== 'ok') console.warn(`scroll-to · ${SCROLL_TO} · ${hit}`)
      /* sticky-runway caveat: a target inside a pinned section (ScrollMorph)
         scrolls to its DOCUMENT offset — the stage shows whatever that scroll
         progress renders, not necessarily the target's settled face. Sweep
         with shoot-scroll.mjs --ps for those; this flag is for normal flow. */
      await sleep(600)
    }
    if (SETTLE_MS > 0) await sleep(SETTLE_MS)
    for (const st of STATES) {
      const js = STATE_JS[st]
      if (!js) continue
      const set = await evaluate(
        `(() => { const el = document.querySelector('[data-edge-aurora]'); if (!el) return 'NO-EL'; ${js}; return 'ok' })()`,
      )
      await sleep(450)
      const r = await send('Page.captureScreenshot', { format: 'png' })
      const file = join(OUT, `${slug}-${tag}-${st}.png`)
      writeFileSync(file, Buffer.from(r.data, 'base64'))
      console.log(`shot · ${file}${set === 'ok' ? '' : ` · WARN ${set}`}`)
    }
  }
}

cleanup()
process.exit(0)

/* visual-regress · the shoot harness graduates to CI (W12a · D1).
   Serves dist, loads the site headless under EMULATED prefers-reduced-motion
   (the site's motion discipline makes reduced = deterministic: no aurora
   drift, no wire flow, static morph truth — the layout/theme/section
   regressions W7–W11 kept catching are all visible in this register), shoots
   a canonical frame set, and pixel-compares against committed goldens.

   Goldens are PER-OS (font rasterization differs macOS↔Linux): CI compares
   against tests/visual/golden/<platform>/ — refresh them with --update on
   the same OS (the update-goldens workflow does it for CI).

   Usage:
     node scripts/visual-regress.mjs            # compare (exit 1 on diff)
     node scripts/visual-regress.mjs --update   # (re)write goldens
     node scripts/visual-regress.mjs --update --only home-p072   # scoped
                                     # re-bake (only the frame that diffed —
                                     # a full --update re-encodes ALL pngs)
     node scripts/visual-regress.mjs --port 9260   # alt ports (CDP 9260 ·
                                     # http 9261) when a concurrent session
                                     # holds the defaults
   Env: CHROME_BIN overrides the browser binary (CI: setup-chrome exports it).

   Flake armor (the swiftshader lesson, twice-struck): a frame whose 3D/page
   region reads near-black where the golden isn't is re-shot once before
   counting as a diff. */
import { execFile } from 'node:child_process'
import { createServer } from 'node:http'
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'

const UPDATE = process.argv.includes('--update')
/* --only <name[,name…]> · scope the OUTPUT (compare / golden writes) to
   specific frames. The reason it exists: a full --update REWRITES all
   goldens as fresh PNG encodes even when a single frame changed in pixels —
   nine byte-only re-encodes that must then be hand-restored before commit
   (the W20b law: never commit a byte-only re-bake · paid again on the
   v4.6.0 release, arc 10). Scoping the update to the frame that actually
   diffed makes the clean commit the default.

   ⚠ EVERY frame still SHOOTS, in the canonical order — only the write /
   compare is skipped. The frames share one page session and the earlier
   scrolls warm the layout (content-visibility reveals, font settle): a
   frame shot cold lands at a DIFFERENT scroll geometry (found on day one:
   `--only home-p072` alone diffed 62.87% while the full sweep was
   byte-stable — the sequence IS the measurement condition). */
const onlyIdx = process.argv.indexOf('--only')
const ONLY = onlyIdx === -1 ? null : new Set(process.argv[onlyIdx + 1]?.split(',') ?? [])
/* --port <n> · the CDP port (http server = port+1). The defaults collide
   when a concurrent session runs its own harness — the historical fix was
   sed-ing a scratch copy of the script (the « alt-ports » pain, arc 3 /
   W20c); this makes it a flag. Ports don't affect the shot pixels. */
const portIdx = process.argv.indexOf('--port')
const PORT_CDP = portIdx === -1 ? 9242 : Number(process.argv[portIdx + 1]) || 9242
const PORT_HTTP = portIdx === -1 ? 4519 : PORT_CDP + 1
const W = 1600
const H = 1000
const PLATFORM = process.platform === 'darwin' ? 'darwin' : 'linux'
const GOLDEN_DIR = `tests/visual/golden/${PLATFORM}`
const OUT_DIR = 'tests/visual/out'
const DIFF_DIR = 'tests/visual/diff'
/* fail thresholds · per-pixel sensitivity + allowed differing-pixel ratio */
const PX_THRESHOLD = 0.16
const MAX_DIFF_RATIO = 0.015

/* the canonical set · body-progress frames sweep every section register
   (hero, morph static truth, wedge+blue promises, verbs, toolbelt, blue
   gallery, light sections, changelog, close+footer) */
const FRAMES = [
  { name: 'home-hero', p: 0 },
  { name: 'home-p012', p: 0.12 },
  { name: 'home-p024', p: 0.24 },
  { name: 'home-p036', p: 0.36 },
  { name: 'home-p048', p: 0.48 },
  { name: 'home-p060', p: 0.6 },
  { name: 'home-p072', p: 0.72 },
  { name: 'home-p084', p: 0.84 },
  { name: 'home-p096', p: 0.96 },
  { name: 'home-footer', p: 1 },
  /* the manifesto joins the gate (v4.7 · the record) — shot in the same
     reduced-motion register: the record's VERTICAL truth (the stage never
     mounts under reduce), reveals instant, spine/strip/i18n frame all
     pixel-guarded. Route-aware frames navigate once, then shoot. */
  { name: 'manifesto-record', route: '/manifesto', p: 0.62 },
  { name: 'manifesto-close', route: '/manifesto', p: 0.84 },
]

/* ── static file server (no python dependency in CI) ─────────────────────── */
const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
  '.webmanifest': 'application/manifest+json',
}
const server = createServer((req, res) => {
  const path = (req.url ?? '/').split('?')[0]
  let file = join('dist', path === '/' ? 'index.html' : path)
  /* SSG routes are directories (dist/manifesto/index.html) — resolve them */
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
  if (!existsSync(file)) file = 'dist/index.html' /* SPA fallback */
  try {
    const body = readFileSync(file)
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(404)
    res.end()
  }
})
server.listen(PORT_HTTP)

/* ── chrome under CDP ────────────────────────────────────────────────────── */
const CHROME =
  process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const chrome = execFile(
  CHROME,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT_CDP}`,
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--hide-scrollbars',
    `--window-size=${W},${H}`,
    '--force-device-scale-factor=1',
    '--no-first-run',
    '--no-default-browser-check',
    '--no-sandbox' /* CI containers */,
    `--user-data-dir=/tmp/visual-regress-${PORT_CDP}`,
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
  for (let i = 0; i < 60; i++) {
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
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails))
  return r.result.value
}

await send('Page.enable')
await send('Runtime.enable')
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false })
/* the determinism switch · the site is motion-safe disciplined, so reduced
   motion = a still, reproducible register (aurora silent, flows still) */
await send('Emulation.setEmulatedMedia', {
  features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
})
await send('Page.navigate', { url: `http://127.0.0.1:${PORT_HTTP}/?it=99` })
await sleep(7000) /* load + settle */
/* fonts are a HARD gate, not a sleep: a cold disk cache occasionally kept
   Clash/Martian loading past the 7s and the hero frame shot with fallback
   glyphs — a 15% text-area diff that alternated run to run (the a11y sweep
   had the same class · same fix) */
const fontsGate = async () => {
  for (let i = 0; i < 40; i++) {
    const ready = await evaluate(
      `document.readyState === 'complete' && document.fonts.status === 'loaded'`,
    ).catch(() => false)
    if (ready) break
    await sleep(250)
  }
}
/* THE APPLIED GATE · the body face ships font-display: optional — on a
   COLD profile (or a starved main thread · load 20+) it can miss its
   ~100ms block window, load anyway (fonts.status reads 'loaded') and never
   be APPLIED: the run shoots in the metric fallback and the hero diffs
   13.66% while a re-run passes (the W20b cold-fonts flake — arc 10's one
   blind reload killed the cold-profile case, load starvation still slipped
   through). 'loaded' is availability; the PIXELS follow application — so
   PROBE it: a span in the real family against a FOREIGN fallback
   (monospace — the metric twin is deliberately too close for a width
   probe). Rejected face → monospace metrics → reload and retry (each load
   re-decides an optional face; the cache warmed by the first load makes
   the block window on a healthy attempt). */
const bodyFaceApplied = () =>
  evaluate(
    `(() => {
      const mk = (ff) => {
        const s = document.createElement('span')
        s.style.cssText = 'position:absolute;visibility:hidden;font-size:64px;white-space:nowrap;font-family:' + ff
        s.textContent = 'The quick brown fox 0123'
        document.body.appendChild(s)
        const w = s.getBoundingClientRect().width
        s.remove()
        return w
      }
      return Math.abs(mk('"Martian Grotesk", monospace') - mk('monospace')) > 4
    })()`,
  ).catch(() => false)
const appliedGate = async () => {
  await fontsGate()
  for (let attempt = 1; attempt <= 4; attempt++) {
    if (await bodyFaceApplied()) return
    console.error(`fonts: body face loaded but NOT applied — reload ${attempt}/4`)
    await send('Page.reload')
    await sleep(4000)
    await fontsGate()
  }
  console.error('fonts: body face still not applied after 4 reloads — shooting anyway')
}
/* the first load always reloads once (HTTP-cache warm-up), then the applied
   probe decides whether more are needed */
await send('Page.reload')
await sleep(4000)
await appliedGate()

async function shootFrame(p) {
  /* body-progress scroll with the c-v re-aim (the W11 harness lesson) */
  const aim = `(() => { const d = document.documentElement; return ${p} * (d.scrollHeight - innerHeight) })()`
  await evaluate(`window.scrollTo(0, ${aim})`)
  await sleep(350)
  await evaluate(`window.scrollTo(0, ${aim})`)
  await sleep(650)
  const r = await send('Page.captureScreenshot', { format: 'png' })
  return Buffer.from(r.data, 'base64')
}

/* near-black detector · the swiftshader blank-3D flake signature */
function meanLuma(png) {
  let acc = 0
  const n = png.width * png.height
  for (let i = 0; i < n; i++) acc += 0.2126 * png.data[i * 4] + 0.7152 * png.data[i * 4 + 1] + 0.0722 * png.data[i * 4 + 2]
  return acc / n
}

mkdirSync(GOLDEN_DIR, { recursive: true })
mkdirSync(OUT_DIR, { recursive: true })
mkdirSync(DIFF_DIR, { recursive: true })

if (ONLY) {
  const known = new Set(FRAMES.map((f) => f.name))
  const unknown = [...ONLY].filter((n) => !known.has(n))
  if (unknown.length) {
    console.error(`unknown frame(s) in --only: ${unknown.join(', ')} · known: ${[...known].join(', ')}`)
    process.exit(2)
  }
}

let failures = 0
let curRoute = '/'
for (const f of FRAMES) {
  const route = f.route ?? '/'
  if (route !== curRoute) {
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT_HTTP}${route}?it=99` })
    await sleep(4000)
    /* a navigation is a NEW load — the optional face re-decides there too */
    await appliedGate()
    curRoute = route
  }
  /* shoot FIRST, skip after — the sequential scroll warm-up is part of the
     measurement (see the --only note above) */
  let buf = await shootFrame(f.p)
  if (ONLY && !ONLY.has(f.name)) continue
  let png = PNG.sync.read(buf)
  const goldenPath = join(GOLDEN_DIR, `${f.name}.png`)

  if (UPDATE) {
    writeFileSync(goldenPath, buf)
    console.log(`golden updated · ${f.name}`)
    continue
  }
  if (!existsSync(goldenPath)) {
    console.error(`MISSING GOLDEN · ${goldenPath} — run --update on ${PLATFORM}`)
    failures++
    continue
  }
  const golden = PNG.sync.read(readFileSync(goldenPath))

  /* flake armor · if the shot is near-black but the golden isn't, re-shoot once */
  if (meanLuma(png) < 4 && meanLuma(golden) >= 4) {
    console.warn(`flake suspected on ${f.name} (near-black) — re-shooting`)
    buf = await shootFrame(f.p)
    png = PNG.sync.read(buf)
  }

  if (png.width !== golden.width || png.height !== golden.height) {
    console.error(`SIZE MISMATCH · ${f.name} ${png.width}×${png.height} vs golden ${golden.width}×${golden.height}`)
    writeFileSync(join(OUT_DIR, `${f.name}.png`), buf)
    failures++
    continue
  }
  const diff = new PNG({ width: png.width, height: png.height })
  const differing = pixelmatch(png.data, golden.data, diff.data, png.width, png.height, {
    threshold: PX_THRESHOLD,
  })
  const ratio = differing / (png.width * png.height)
  if (ratio > MAX_DIFF_RATIO) {
    console.error(`DIFF · ${f.name} · ${(ratio * 100).toFixed(2)}% pixels differ (max ${MAX_DIFF_RATIO * 100}%)`)
    writeFileSync(join(OUT_DIR, `${f.name}.png`), buf)
    writeFileSync(join(DIFF_DIR, `${f.name}.png`), PNG.sync.write(diff))
    failures++
  } else {
    console.log(`ok · ${f.name} · ${(ratio * 100).toFixed(3)}%`)
  }
}

if (UPDATE) {
  const count = readdirSync(GOLDEN_DIR).length
  console.log(`DONE · ${count} goldens in ${GOLDEN_DIR}`)
} else {
  console.log(failures ? `FAIL · ${failures} frame(s) differ` : 'PASS · all frames match')
}
cleanup()
process.exit(failures ? 1 : 0)

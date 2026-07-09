/* demo-drive · drives a HEADED Chrome through the W12 demo storyboard while
   the operator screen-records (B3 · the morph film IS the demo). The capture
   itself is the operator's screen at real 60fps — this script only makes the
   journey reproducible: same beats, same pacing, every take.

   Storyboard (W12 verbatim · ~38s inside the 35-45s target):
     hero 2s → file travels 8s → burst 6s → run lights 8s → flatten 6s →
     terminal exit-0 5s → install 3s

   Usage:
     pnpm build && node scripts/demo-drive.mjs        # serves dist + drives
     node scripts/demo-drive.mjs --url https://nika.sh # drive prod instead
     node scripts/demo-drive.mjs --size 1920x1080      # capture-frame size
     node scripts/demo-drive.mjs --countdown 5         # more time to hit ⏺

   The scroll easing runs INSIDE the page (one injected rAF driver) — the
   browser's own frame clock paces it, so the recording is as smooth as the
   machine. The intro is NOT frozen (?it is absent): the hero plays its real
   entrance during the countdown, then the journey starts from the settled
   hero — matching what a first-time visitor sees.

   Zero deps — Node 22 global WebSocket + CDP, the house pattern
   (shoot-routes/shoot-scroll). The window opens headed at the exact size;
   record THAT window (macOS: ⌘⇧5 → capture selected window · 60fps in
   QuickTime prefs). */
import { execFile } from 'node:child_process'
import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { extname, join } from 'node:path'

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : fallback
}

const SIZE = arg('size', '1600x1000')
const [W, H] = SIZE.split('x').map(Number)
const COUNTDOWN_S = Number(arg('countdown', '3'))
/* --dry · headless plumbing check (CI-able): zero travel + 100ms holds —
   the journey becomes instant jumps. The eased rAF path is NOT exercised
   (headless starves auto-chained rAF · the arc-8 law); it runs on the
   operator's headed browser where rAF is real. */
const DRY = process.argv.includes('--dry')
const PORT_CDP = Number(arg('port', '9270'))
const PORT_HTTP = PORT_CDP + 1
const CHROME =
  process.env.CHROME_BIN ??
  arg('chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
let url = arg('url', '')

/* ── serve dist when no --url (the shoot-routes dir/index.html law) ─────────── */
const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.mp4': 'video/mp4',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
}
let server = null
if (!url) {
  if (!existsSync('dist/index.html')) {
    console.error('no dist/ — run `pnpm build` first (or pass --url)')
    process.exit(2)
  }
  server = createServer((req, res) => {
    const path = req.url.split('?')[0]
    for (const p of [path, path.replace(/\/$/, '') + '/index.html', path + '/index.html', '/index.html']) {
      try {
        const body = readFileSync(join('dist', p))
        res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' })
        return res.end(body)
      } catch {
        /* next candidate */
      }
    }
    res.writeHead(404)
    res.end()
  })
  await new Promise((r) => server.listen(PORT_HTTP, r))
  url = `http://127.0.0.1:${PORT_HTTP}/`
}

/* ── headed Chrome at the exact capture size ────────────────────────────────── */
const chrome = execFile(CHROME, [
  ...(DRY ? ['--headless=new'] : []),
  `--remote-debugging-port=${PORT_CDP}`,
  `--window-size=${W},${H}`,
  '--no-first-run',
  '--no-default-browser-check',
  `--user-data-dir=/tmp/demo-drive-${PORT_CDP}`,
  'about:blank',
])
process.on('exit', () => chrome.kill())

/* ── CDP plumbing (the house pattern) ───────────────────────────────────────── */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let target = null
for (let i = 0; i < 40 && !target; i++) {
  await sleep(250)
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT_CDP}/json/list`)).json()
    target = list.find((t) => t.type === 'page')
  } catch {
    /* boot */
  }
}
if (!target) {
  console.error('no CDP page target — is Chrome up?')
  process.exit(1)
}
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((r) => (ws.onopen = r))
let msgId = 0
const pending = new Map()
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m)
    pending.delete(m.id)
  }
}
const send = (method, params = {}) =>
  new Promise((r) => {
    const id = ++msgId
    pending.set(id, r)
    ws.send(JSON.stringify({ id, method, params }))
  })
const evaluate = async (expression) => {
  const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  return res.result?.result?.value
}

await send('Page.enable')
await send('Page.navigate', { url })
await sleep(2500) /* settle: fonts + hero entrance under way */

/* ── the beats · resolved from the LIVE layout (never hardcoded pixels) ───────
   The morph runway: stage top → top + (stage height − vh). Beat fractions
   follow the film's own constants (plan-scene FLAT_LAND 0.80: the flatten
   lands by then; the terminal verdict owns the tail). */
const geo = await evaluate(`(() => {
  const stage = document.querySelector('.morphsec')
  const r = stage.getBoundingClientRect()
  const top = r.top + window.scrollY
  const runway = stage.offsetHeight - innerHeight
  const el = (sel) => {
    const n = document.querySelector(sel)
    if (!n) return null
    const b = n.getBoundingClientRect()
    return b.top + window.scrollY
  }
  return { top, runway, hasInstall: !!el('#get-started') }
})()`)
if (!geo?.runway || geo.runway < 1000) {
  console.error(`morph runway looks un-armed (${geo?.runway}px) — is this a desktop-size window?`)
  process.exit(1)
}
const atP = (p) => Math.round(geo.top + geo.runway * p)

/* [label, target, travelMs, holdMs] · travel = eased scroll to the beat ·
   hold = let the beat play. Total ≈ 38s.

   A target is a NUMBER (absolute Y · safe inside the morph stage, whose
   height is fixed once armed) or a SELECTOR (resolved IN the page at beat
   time — the sections below the film carry content-visibility estimates at
   t=0 and their real Y only exists once approached; a pre-measured absolute
   Y landed 15k px wrong on the dry proof — the shoot-scroll « re-aim on the
   settled layout » law, applied per-beat). */
const RAW_BEATS = [
  ['hero', 0, 0, 2000],
  ['file travels', atP(0.22), 6500, 1500],
  ['burst → the DAG', atP(0.45), 4500, 1500],
  ['the run lights', atP(0.72), 6500, 1500],
  ['flatten → the map settles', atP(0.88), 4500, 1500],
  ['terminal · exit 0', atP(1.0), 3000, 2000],
  ['install', '#get-started', 2200, 1800],
]
const BEATS = DRY ? RAW_BEATS.map(([l, y]) => [l, y, 0, 100]) : RAW_BEATS

/* the in-page driver · ONE rAF loop, easeInOutCubic between beats — the
   page's own frame clock paces the journey (recording-smooth) */
const driver = `(async () => {
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
  /* the site declares html { scroll-behavior: smooth } (motion-on) — a bare
     scrollTo(x, y) becomes a browser-driven ANIMATION and every frame of
     the rAF easing would re-target it (rubber-band mush · found on the dry
     proof: instant jumps crept 80px per hold). behavior:'instant' opts each
     call out — THIS driver's easing is the only easing. */
  const jump = (y) => window.scrollTo({ top: y, behavior: 'instant' })
  const resolve = (target) => {
    if (typeof target === 'number') return target
    const n = document.querySelector(target)
    if (!n) return window.scrollY
    /* land the section title in the upper third · resolved at beat time */
    return Math.max(0, n.getBoundingClientRect().top + window.scrollY - innerHeight * 0.12)
  }
  const go = (to, ms) => new Promise((done) => {
    if (ms <= 0) { jump(to); return done() }
    const from = window.scrollY
    const t0 = performance.now()
    const step = (now) => {
      const t = Math.min(1, (now - t0) / ms)
      jump(from + (to - from) * ease(t))
      t < 1 ? requestAnimationFrame(step) : done()
    }
    requestAnimationFrame(step)
  })
  const hold = (ms) => new Promise((r) => setTimeout(r, ms))
  for (const [label, target, travel, pause] of ${JSON.stringify(BEATS)}) {
    await go(resolve(target), travel)
    /* the jump may reveal content-visibility sections and shift the layout —
       re-aim once on the settled geometry (selector targets only) */
    if (typeof target === 'string') await go(resolve(target), Math.min(travel, 300))
    await hold(pause)
  }
  return window.scrollY
})()`

const totalMs = BEATS.reduce((s, [, , t, h2]) => s + t + h2, 0)
console.log(`demo-drive · ${url} · window ${W}×${H} · journey ≈ ${(totalMs / 1000).toFixed(0)}s`)
console.log(`beats:`)
for (const [label, target, travel, hold] of BEATS)
  console.log(`  ${label.padEnd(28)} → ${String(target).padStart(12)} · travel ${travel}ms · hold ${hold}ms`)
console.log(`\n⏺  START YOUR RECORDING — the journey begins in ${COUNTDOWN_S}s`)
for (let i = COUNTDOWN_S; i > 0; i--) {
  console.log(`   ${i}…`)
  await sleep(1000)
}
console.log('   🎬 rolling')
await evaluate(driver)
if (DRY) {
  const y = await evaluate('window.scrollY')
  console.log(`✓ dry journey complete · final scrollY ${y} (expect ≈ the install beat)`)
  chrome.kill()
  server?.close()
  process.exit(0)
}
console.log('✓ journey complete — stop the recording. Chrome stays open for retakes (ctrl-C to quit).')
/* keep serving until the operator quits — retakes re-run the script */

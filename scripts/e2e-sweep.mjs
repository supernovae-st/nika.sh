/* ─── e2e-sweep · the deep integration belt ───────────────────────────────────
   What the other gates can't see: goldens shoot the static reduced-motion
   scene, a11y-sweep reads the axe tree, unit tests never load a page. This
   belt drives the REAL built site headless and verifies:

     1 · CONSOLE + NETWORK — every route loads with zero console errors,
         zero page errors, zero failed same-origin requests (4xx/5xx).
     2 · LINK INTEGRITY — every internal <a href> resolves to a real route,
         and every #anchor points at an id that exists on the target page.
     3 · INTERACTIONS — the flows that broke silently before get pinned:
         the film's done-frame triangle (log hover lights the node + the
         file lines), the drag-seek (the 1:1 pointer path — rAF-free, so it
         works headless), the playground handoff href, the /play ?y= share
         round-trip, the machined frame mount, the /play run-sim drum
         (simulate → draw → verdict · route-change aborts — no immortal
         ring), and the agpl + drum eggs.

   Headless laws (learned the hard way — arc 8): self-chaining rAF loops
   STARVE under swiftshader (never assert on glide/play motion); React 19
   ignores synthetic MouseEvent clicks (use Input.dispatchMouseEvent when a
   trusted click is needed; synthetic PointerEvents DO reach React handlers).

   Run: pnpm build && node scripts/e2e-sweep.mjs [--url http://127.0.0.1:4519]
   Serves dist itself when --url is absent. Exit 1 on any failure. */
import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const argv = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : fallback
}
const PORT = Number(argv('port', '4523'))
const CDP_PORT = Number(argv('cdp', '9285'))
let BASE = argv('url', '')

/* ── the static server (only when --url absent) ────────────────────────────── */
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.webp': 'image/webp', '.txt': 'text/plain', '.xml': 'application/xml', '.mp4': 'video/mp4', '.webm': 'video/webm', '.gif': 'image/gif', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' }
let server = null
if (!BASE) {
  server = createServer((req, res) => {
    const url = new URL(req.url, 'http://x').pathname
    for (const t of [url, url.replace(/\/$/, '') + '/index.html', url + '/index.html']) {
      const p = join(DIST, t)
      if (existsSync(p) && extname(t)) {
        res.writeHead(200, { 'content-type': MIME[extname(t)] ?? 'application/octet-stream' })
        return res.end(readFileSync(p))
      }
    }
    res.writeHead(404).end('not found')
  })
  await new Promise((r) => server.listen(PORT, r))
  BASE = `http://127.0.0.1:${PORT}`
}

/* ── routes · derived from the sitemap the build already emits ─────────────── */
const sitemap = readFileSync(join(DIST, 'sitemap.xml'), 'utf8')
const ROUTES = [...sitemap.matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map((m) => m[1] || '/')
if (ROUTES.length < 10) {
  console.error(`suspiciously few routes from sitemap: ${ROUTES.length}`)
  process.exit(1)
}

/* ── chrome + CDP plumbing (the shoot-scroll family pattern) ─────────────────
   CHROME_BIN overrides the binary (CI · linux); --no-sandbox rides only there
   (containers), never locally. */
const chrome = execFile(
  process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new', `--remote-debugging-port=${CDP_PORT}`, '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars', '--window-size=1600,1000', '--no-first-run', '--no-default-browser-check', ...(process.env.CHROME_BIN ? ['--no-sandbox'] : []), `--user-data-dir=/tmp/e2e-sweep-${CDP_PORT}`, 'about:blank'],
  () => {},
)
process.on('exit', () => { chrome.kill(); server?.close() })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function wsUrl() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)
      const page = (await res.json()).find((t) => t.type === 'page' && !t.url.includes('background'))
      if (page) return page.webSocketDebuggerUrl
    } catch { /* booting */ }
    await sleep(250)
  }
  throw new Error('chrome did not come up')
}
const ws = new WebSocket(await wsUrl())
await new Promise((r) => (ws.onopen = r))
let mid = 0
const pending = new Map()
const consoleErrs = []
const pageErrs = []
const failedReqs = []
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data)
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id)
    pending.delete(m.id)
    m.error ? reject(new Error(m.error.message)) : resolve(m.result)
    return
  }
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
    consoleErrs.push(m.params.args?.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 200))
  } else if (m.method === 'Runtime.exceptionThrown') {
    pageErrs.push((m.params.exceptionDetails?.exception?.description ?? m.params.exceptionDetails?.text ?? '').slice(0, 200))
  } else if (m.method === 'Network.responseReceived') {
    const { response } = m.params
    if (response.status >= 400 && response.url.startsWith(BASE)) failedReqs.push(`${response.status} ${response.url.slice(BASE.length)}`)
  } else if (m.method === 'Network.loadingFailed' && !m.params.canceled) {
    failedReqs.push(`FAILED ${m.params.errorText}`)
  }
}
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++mid
  pending.set(id, { resolve, reject })
  ws.send(JSON.stringify({ id, method, params }))
})
const evaluate = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 300))
  return r.result.value
}
await send('Page.enable')
await send('Runtime.enable')
if (process.env.E2E_THROTTLE) await send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.E2E_THROTTLE) })
await send('Network.enable')
await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false })

const failures = []
const fail = (route, kind, detail) => {
  failures.push({ route, kind, detail })
  console.log(`  ✗ ${kind} · ${detail}`)
}

/* ── PASS 0 · static integrity (dist, no browser) ───────────────────────────
   The share/feed surfaces break SILENTLY: a dead og:image renders a blank
   card on every social share (six posts shipped that way before this belt),
   a stale rss/llms drops posts for readers and models. All fs — free. */
{
  const { existsSync: ex } = await import('node:fs')
  /* og:image — every prerendered page's card must exist as a file */
  const seen = new Set()
  let ogMissing = 0
  for (const route of ROUTES) {
    const html = readFileSync(join(DIST, route === '/' ? 'index.html' : `${route.replace(/^\//, '')}/index.html`), 'utf8')
    for (const m of html.matchAll(/og:image" content="https:\/\/nika\.sh(\/[^"]+)"/g)) {
      if (seen.has(m[1])) continue
      seen.add(m[1])
      if (!ex(join(DIST, m[1]))) {
        ogMissing++
        fail(route, 'og:image', `${m[1]} does not exist in dist`)
      }
    }
  }
  /* rss — every /blog/<slug> route rides the feed (same-date order is the
     feed's own law; presence is the contract) */
  const rss = ex(join(DIST, 'rss.xml')) ? readFileSync(join(DIST, 'rss.xml'), 'utf8') : ''
  const llms = ex(join(DIST, 'llms-full.txt')) ? readFileSync(join(DIST, 'llms-full.txt'), 'utf8') : ''
  const posts = ROUTES.filter((r) => /^\/blog\/.+/.test(r))
  let rssMiss = 0
  let llmsMiss = 0
  for (const r of posts) {
    if (!rss.includes(`<link>https://nika.sh${r}</link>`)) { rssMiss++; fail(r, 'rss', `${r} missing from rss.xml`) }
    if (!llms.includes(r)) { llmsMiss++; fail(r, 'llms-full', `${r} missing from llms-full.txt`) }
  }
  console.log(`static integrity · og:image ${seen.size - ogMissing}/${seen.size} · rss ${posts.length - rssMiss}/${posts.length} posts · llms-full ${posts.length - llmsMiss}/${posts.length}\n`)
}

/* deterministic settle — NEVER a fixed sleep before interacting: scrollTo
   issued before hydration lands gets clobbered by the router's scroll
   restoration (cost this belt its first two calibration rounds). RootLayout
   stamps data-hydrated (the index.html watchdog handshake) — poll it, then
   fonts, then one settle beat. */
const settle = async (maxMs = 15000) => {
  const t0 = Date.now()
  while (Date.now() - t0 < maxMs) {
    const ok = await evaluate(
      `document.documentElement.hasAttribute('data-hydrated') && document.readyState === 'complete'`,
    ).catch(() => false)
    if (ok) break
    await sleep(250)
  }
  await evaluate(`document.fonts?.ready.then(() => true)`).catch(() => {})
  await sleep(300)
}

/* ── PASS 1 · every route: console/network clean + harvest ids/links ─────────
   The 50 /errors/<code> pages are template-identical — CDP-load a SAMPLE
   (first per namespace) for console/network; link integrity (pass 2) still
   fetches every one over HTTP (cheap). */
const errDetail = ROUTES.filter((r) => /^\/errors\/.+/.test(r))
const errSample = new Set()
{
  const seen = new Set()
  for (const r of errDetail) {
    const ns = r.split('/')[2].split('-').slice(0, 2).join('-')
    if (!seen.has(ns)) { seen.add(ns); errSample.add(r) }
  }
}
/* the other registers (tools · providers · templates) are template-identical
   too — CDP-load the FIRST TWO of each (one row shape + one with the opened
   skeleton/args variety); pass 2 still fetches every page over HTTP, and
   pass 3 pins each register's deep-link behavior explicitly. */
const regDetail = ROUTES.filter((r) => /^\/(tools|providers|templates)\/.+/.test(r))
const regSample = new Set()
{
  const perReg = new Map()
  for (const r of regDetail) {
    const reg = r.split('/')[1]
    const n = perReg.get(reg) ?? 0
    if (n < 2) { perReg.set(reg, n + 1); regSample.add(r) }
  }
}
const NAV_ROUTES = ROUTES.filter(
  (r) =>
    (!/^\/errors\/.+/.test(r) || errSample.has(r)) &&
    (!/^\/(tools|providers|templates)\/.+/.test(r) || regSample.has(r)),
)
const idsByRoute = new Map()
const links = new Map() // href -> [fromRoutes]
console.log(`e2e-sweep · ${ROUTES.length} routes (${NAV_ROUTES.length} CDP-loaded · errors sampled ${errSample.size}/${errDetail.length} · registers sampled ${regSample.size}/${regDetail.length}) · ${BASE}\n`)
for (const route of NAV_ROUTES) {
  consoleErrs.length = 0
  pageErrs.length = 0
  failedReqs.length = 0
  await send('Page.navigate', { url: `${BASE}${route}` })
  await sleep(route === '/' ? 3500 : 1800) /* home mounts the lazy 3D field */
  /* a transient page-context exception racing the evaluate must be a ROUTE
     finding, never a process crash (round 4 died in 57s on an "Uncaught
     object" mid-harvest — one flaky context invalidation killed the belt) */
  let harvest = null
  for (let attempt = 0; attempt < 3 && !harvest; attempt++) {
    harvest = await evaluate(`(() => {
      const ids = [...document.querySelectorAll('[id]')].map((el) => el.id)
      const hrefs = [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'))
        .filter((h) => h && (h.startsWith('/') || h.startsWith('#')) && !h.startsWith('//'))
      return { ids, hrefs, frames: document.querySelectorAll('[data-edge-aurora]').length }
    })()`).catch(() => null)
    if (!harvest) await sleep(1000)
  }
  if (!harvest) {
    fail(route, 'harvest', 'evaluate failed 3× (page context)')
    continue
  }
  idsByRoute.set(route, new Set(harvest.ids))
  for (const h of harvest.hrefs) {
    const abs = h.startsWith('#') ? `${route}${h}` : h
    if (!links.has(abs)) links.set(abs, [])
    links.get(abs).push(route)
  }
  for (const e of consoleErrs) fail(route, 'console.error', e)
  for (const e of pageErrs) fail(route, 'page error', e)
  for (const e of failedReqs) fail(route, 'request', e)
  /* the machined frame contract (post frame-nuke): ONE fixed frame element,
     site-wide, on every route. The frame mounts with the shell — but a slow
     env can race the read (the old tone check's lesson). Poll, never
     fixed-sleep (the belt's own law). */
  let frames = harvest.frames
  for (let i = 0; i < 20 && frames !== 1; i++) {
    await sleep(400)
    frames = await evaluate(`document.querySelectorAll('[data-edge-aurora]').length`)
  }
  if (frames !== 1) fail(route, 'machined frame', `expected 1 frame element, got ${frames}`)
  if (consoleErrs.length + pageErrs.length + failedReqs.length === 0) console.log(`  ✓ ${route}`)
}

/* ── PASS 2 · link integrity (routes + anchors) ────────────────────────────── */
console.log('\nlink integrity')
const routeSet = new Set(ROUTES)
let linkFails = 0
for (const [href, froms] of links) {
  const [path, hash] = href.split('#')
  const target = path || froms[0] /* '#x' → same page */
  /* non-sitemap internal paths must still be served (rss, llms, install.sh…) */
  if (!routeSet.has(target)) {
    const res = await fetch(`${BASE}${target}`, { method: 'GET' })
    if (!res.ok) { fail(froms[0], 'dead link', `${href} → ${res.status}`); linkFails++; continue }
    if (hash) continue /* anchors on non-route files: nothing to check */
  }
  if (hash) {
    const ids = idsByRoute.get(target)
    if (ids && !ids.has(hash)) {
      /* VERIFY before failing: the PASS-1 id harvest is one snapshot and a
         heavy page (the /spec machine) hydrates its sections late on a slow
         runner — 6 phantom "dead anchors" on a 2-core CI runner while a fast
         local run saw them all. Re-visit the target and POLL for the id. */
      await send('Page.navigate', { url: `${BASE}${target}` })
      let live = false
      for (let i = 0; i < 20 && !live; i++) {
        await sleep(400)
        live = await evaluate(`!!document.getElementById(${JSON.stringify(hash)})`).catch(() => false)
      }
      if (live) { ids.add(hash) /* future hrefs to the same anchor skip the re-visit */ }
      else { fail(froms[0], 'dead anchor', `${href} (no #${hash} on ${target})`); linkFails++ }
    }
  }
}
if (linkFails === 0) console.log(`  ✓ ${links.size} internal links resolve (anchors included)`)

/* ── PASS 3 · the interaction battery ──────────────────────────────────────── */
console.log('\ninteraction battery')
const check = async (name, fn) => {
  try {
    const ok = await fn()
    if (ok === true) console.log(`  ✓ ${name}`)
    else fail('battery', name, ok === false ? 'assertion false' : `observed: ${JSON.stringify(ok).slice(0, 140)}`)
  } catch (e) {
    fail('battery', name, String(e).slice(0, 160))
  }
}
/* THE BELT'S LAW, as a helper: on a slow environment every one-shot read
   races a React commit — poll the assertion until it holds (returns true)
   or the budget runs out (returns the LAST observation, which becomes the
   finding's diagnostics). Rounds 1-5 on the CI runner each converted one
   more fixed-sleep single-read into this shape; new checks start here. */
const until = async (fn, tries = 12, gap = 400) => {
  let last = null
  for (let i = 0; i < tries; i++) {
    last = await fn()
    if (last === true) return true
    await sleep(gap)
  }
  return last
}

/* 3-reg · the register deep links: prerendered landing → the row is ACTIVE,
   HIGHLIGHTED and IN VIEW (the scroll effect is a client behavior that can
   break silently — pass 1's static loads never see it). One pin per
   register; the templates pin also asserts the opened skeleton panel. */
const REGISTER_PINS = [
  { route: '/errors/NIKA-SEC-001', row: '.er-row--active', extra: null },
  { route: '/tools/fetch', row: '.tp-row--active', extra: null },
  { route: '/providers/ollama', row: '.pv-row--active', extra: null },
  { route: '/templates/fanout', row: '.tm-row--active', extra: '.tm-row--active .cf-panel' },
]
for (const pin of REGISTER_PINS) {
  await send('Page.navigate', { url: `${BASE}${pin.route}` })
  await settle()
  await check(`register · ${pin.route} → active row highlighted + scrolled into view`, () =>
    until(() =>
      evaluate(`(() => {
        const row = document.querySelector('${pin.row}')
        if (!row) return { err: 'no active row' }
        const r = row.getBoundingClientRect()
        const inView = r.bottom > 0 && r.top < innerHeight
        ${pin.extra ? `const extra = !!document.querySelector('${pin.extra}')` : 'const extra = true'}
        return inView && extra ? true : { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight, extra }
      })()`),
    ),
  )
}

/* 3a · the film's done frame: triangle + drag-seek + handoff */
await send('Page.navigate', { url: `${BASE}/?it=99` })
await settle()
/* content-visibility re-layouts drift a one-shot target (the re-aim law) —
   re-aim + POLL until the phase settles (fixed sleeps mis-time under load) */
/* parks are behavior:'instant' — the scroll-rail's html{scroll-behavior:smooth}
   hijacks option-less scrollTo, and a starved runner freezes a smooth park
   mid-flight (the throttle-8 {p:-0.297} finding) */
await check('film · done frame reached (phase=done)', async () => {
  let last = null
  for (let i = 0; i < 10; i++) {
    await evaluate(`(() => { const s = document.querySelector('.morphsec'); const r = s.getBoundingClientRect(); window.scrollTo({ top: r.top + scrollY + (r.height - innerHeight), behavior: 'instant' }); })()`)
    await sleep(500)
    last = await evaluate(`(() => { const st = document.querySelector('.morph-stage'); const s = document.querySelector('.morphsec'); const r = s.getBoundingClientRect(); return { phase: st?.dataset.phase, p: st?.style.getPropertyValue('--morph-p'), armed: s?.dataset.armed ?? null, top: Math.round(r.top), h: Math.round(r.height), sy: Math.round(scrollY) } })()`)
    if (last.phase === 'done') return true
  }
  return last
})
await check('film · log hover lights node + file lines (the triangle)', async () => {
  /* re-dispatch per attempt (the hover handler itself can land late), then
     poll the lit state — two commits (node + file) may land a beat apart */
  let last = null
  for (let attempt = 0; attempt < 3; attempt++) {
    await evaluate(`[...document.querySelectorAll('.morph-line[data-task]')].pop()?.dispatchEvent(new PointerEvent('pointerover', { bubbles: true }))`)
    last = await until(
      () =>
        evaluate(`(() => {
          const line = [...document.querySelectorAll('.morph-line[data-task]')].pop()
          if (!line) return { err: 'no task line' }
          const id = line.dataset.task
          const nodeHi = !!document.querySelector('.morph-node[data-task="' + id + '"][data-hi]')
          const fileLit = document.querySelectorAll('.morph-done-code .cf-line.morph-hi').length > 0
          return (nodeHi && fileLit) || { nodeHi, fileLit }
        })()`),
      6,
      350,
    )
    if (last === true) break
  }
  await evaluate(`[...document.querySelectorAll('.morph-line[data-task]')].pop()?.dispatchEvent(new PointerEvent('pointerout', { bubbles: true }))`)
  return last
})
await check('film · playground handoff href carries the file', async () =>
  until(
    () =>
      evaluate(
        `(() => { const h = document.querySelector('.morph-done-open')?.getAttribute('href') ?? ''; return (h.startsWith('/play?y=') && h.length > 200) || h.slice(0, 60) })()`,
      ),
    10,
    400,
  ))
await check('film · drag-seek scrubs (the 1:1 pointer path)', async () => {
  /* isPrimary: true — the constructor default is false and React/our slop
     logic must see a primary pointer; the drag path calls seek() → scrollTo
     directly (no self-chaining rAF), so it works headless. Assert on the
     SCROLL position (the store) — --morph-p follows via a one-shot rAF that
     may lag a beat under swiftshader. RETRIED ×3: the pointer handler is
     attached during hydration and a starved runner can miss the first
     attempt entirely (dy:0 — flipped between two CI runs · then {p:1}
     three PRs in one day, strike 3 → the handler-proof below); a real
     break fails all three. */
  /* the assertion is the POSITION, not the delta: the film sits at p≈1
     when this check starts, so p∈[0.2,0.4] can ONLY result from the seek
     landing where the pointer pointed (a slow runner applies the scroll
     whenever it applies it — poll the position, re-drag per attempt) */
  let last = null
  for (let attempt = 0; attempt < 3; attempt++) {
    /* RE-ANCHOR per attempt: the drag's own handler re-reads the track
       rect (trackFrac) — under a content-visibility re-layout that rect
       can be degenerate for a beat and seek(NaN) is a silent no-op (the
       {p:1} CI finding: three drags, zero motion). Park the scroll on the
       done frame, then WAIT until the track rect is real before
       dispatching; carry the rect in the diagnostics. */
    await evaluate(`(() => { const s = document.querySelector('.morphsec'); const r = s.getBoundingClientRect(); window.scrollTo({ top: r.top + scrollY + (r.height - innerHeight), behavior: 'instant' }) })()`)
    const rect = await until(
      () =>
        evaluate(`(() => {
          const tr = document.querySelector('.morph-track')?.getBoundingClientRect()
          return (tr && tr.width > 50 && Number.isFinite(tr.left)) || { w: tr?.width ?? null }
        })()`),
      6,
      400,
    )
    if (rect !== true) {
      last = { attempt, trackRect: rect }
      continue
    }
    /* down and move on SEPARATE ticks (separate evaluates) — the same-tick
       triple worked locally but a starved runner can land the move before
       the down's state settles */
    await evaluate(`(() => {
      const track = document.querySelector('.morph-track')
      const tr = track.getBoundingClientRect()
      window.__e2eBase = { clientY: tr.top + tr.height / 2, bubbles: true, pointerId: 7, isPrimary: true, pointerType: 'mouse', button: 0, buttons: 1 }
      track.dispatchEvent(new PointerEvent('pointerdown', { ...window.__e2eBase, clientX: tr.left + tr.width * 0.98 }))
    })()`)
    /* PROVE THE HANDLER RAN before spending the move: onTrackDown writes
       data-scrub DOM-direct (no reconcile), so its absence after the down
       means React's listeners aren't attached yet (starved hydration) —
       the third-strike {p:1} class: three well-formed drags into a deaf
       DOM. Re-dispatch the down per poll tick; a dead track after ~2.4s
       fails THIS attempt (re-park + retry), not the whole check. */
    const armed = await until(
      () =>
        evaluate(`(() => {
          const track = document.querySelector('.morph-track')
          if (track.dataset.scrub === '1') return true
          const tr = track.getBoundingClientRect()
          track.dispatchEvent(new PointerEvent('pointerdown', { ...window.__e2eBase, clientX: tr.left + tr.width * 0.98 }))
          return { scrub: track.dataset.scrub ?? null }
        })()`),
      6,
      400,
    )
    if (armed !== true) {
      last = { attempt, handler: armed }
      continue
    }
    await evaluate(`(() => {
      const track = document.querySelector('.morph-track')
      const tr = track.getBoundingClientRect()
      track.dispatchEvent(new PointerEvent('pointermove', { ...window.__e2eBase, clientX: tr.left + tr.width * 0.3 }))
      track.dispatchEvent(new PointerEvent('pointerup', { ...window.__e2eBase, clientX: tr.left + tr.width * 0.3, buttons: 0 }))
    })()`)
    last = await until(
      () =>
        evaluate(`(() => {
          const s = document.querySelector('.morphsec')
          const runway = s.getBoundingClientRect().height - document.querySelector('.morph-stage').offsetHeight
          const p = -s.getBoundingClientRect().top / runway
          return (p > 0.2 && p < 0.4) || { p: +p.toFixed(3) }
        })()`),
      6,
      500,
    )
    if (last === true) return true
  }
  return last
})

/* 3b · the ?y= share round-trip · 3a proved ENCODE (the handoff href);
   navigating that same href proves DECODE lands in the editor — the full
   see→touch loop, end to end (the page still holds the done frame) */
{
  const link = await evaluate(`document.querySelector('.morph-done-open')?.getAttribute('href') ?? ''`)
  await send('Page.navigate', { url: `${BASE}${link}` })
  await settle()
  await check('play · the handoff ?y= decodes into the editor', async () => {
    /* the editor is a lazy chunk behind hydration — poll, never fixed-sleep */
    for (let i = 0; i < 20; i++) {
      await sleep(600)
      const t = await evaluate(`document.querySelector('.cm-content')?.textContent ?? ''`)
      if (t.includes('daily-brief') && t.includes('./notes/today.md')) return true
    }
    return false
  })
}

/* 3b-ter · the run-sim beats the frame drum (one run grammar site-wide) +
   the abort-on-route-change pin (the immortal-ring class: the frame is site
   chrome and survives SPA navigation — a surface that runStart()s MUST
   runStop() on unmount or the lit ring outlives the page forever).
   Ground truth = MutationObserver on the frame (attribute timeline — no
   dependence on the starved frame pipeline); clicks = trusted CDP Input
   (React 19 ignores synthetic dispatchEvent clicks). The sim is
   setInterval-driven, so it advances fine under runner starvation. */
await check('play · simulate beats the frame drum (start → draw → verdict)', async () => {
  /* the plan must be parsed (button enabled) — poll, never fixed-sleep */
  const ready = await until(
    () => evaluate(`!!document.querySelector('.play-sim-btn:not([disabled])')`),
    12,
    500,
  )
  if (ready !== true) return { btn: 'never enabled' }
  await evaluate(`(() => { const f = document.querySelector('[data-edge-aurora]'); window.__drum = []; new MutationObserver((ms) => { for (const m of ms) window.__drum.push({ run: f.hasAttribute('data-run'), p: f.style.getPropertyValue('--run-p') }) }).observe(f, { attributes: true, attributeFilter: ['data-run', 'style'] }) })()`)
  const at = await evaluate(
    `(() => { const b = document.querySelector('.play-sim-btn'); b.scrollIntoView({ behavior: 'instant', block: 'center' }); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } })()`,
  )
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: at.x, y: at.y, button: 'left', clickCount: 1 })
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: at.x, y: at.y, button: 'left', clickCount: 1 })
  /* the whole choreography lands in the log: run-on → a mid draw → the
     success verdict (run off at p=1) — poll the log, not the pipeline */
  return until(
    () =>
      evaluate(`(() => {
        const log = window.__drum ?? []
        const on = log.some((e) => e.run)
        const draw = log.some((e) => { const v = Number(e.p); return v > 0 && v < 1 })
        const verdict = log.some((e) => !e.run && Number(e.p) === 1)
        return (on && draw && verdict) || JSON.stringify({ on, draw, verdict, n: log.length })
      })()`),
    24,
    600,
  )
})
await check('play · route change mid-sim aborts the drum (no immortal ring)', async () => {
  /* restart the sim (post-verdict the button reads ■ stop — clear it first) */
  const press = async () => {
    const at = await evaluate(
      `(() => { const b = document.querySelector('.play-sim-btn'); b.scrollIntoView({ behavior: 'instant', block: 'center' }); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } })()`,
    )
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: at.x, y: at.y, button: 'left', clickCount: 1 })
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: at.x, y: at.y, button: 'left', clickCount: 1 })
  }
  await press() /* ■ stop (the completed sim is still displayed) */
  /* wait for React to re-render the toggle — a starved runner can lag the
     state flip and the second press would hit the OLD onClick (stop again) */
  const rearmed = await until(
    () => evaluate(`document.querySelector('.play-sim-btn')?.textContent.includes('simulate')`),
    10,
    400,
  )
  if (rearmed !== true) return { toggle: 'never flipped back to simulate' }
  await press() /* ▶ simulate — a fresh run */
  const running = await until(
    () => evaluate(`document.querySelector('[data-edge-aurora]').hasAttribute('data-run')`),
    10,
    400,
  )
  if (running !== true) return { restart: 'drum never armed' }
  /* client-side navigation AWAY mid-sim — the SPA route change is the
     regression path (a full reload would remount the frame clean and
     prove nothing). The nav link is a trusted click too. */
  const nav = await evaluate(
    `(() => { const a = document.querySelector('.v4nav a[href="/blog"]'); if (!a) return null; a.scrollIntoView({ behavior: 'instant', block: 'nearest' }); const r = a.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } })()`,
  )
  if (!nav) return { nav: 'blog link not found' }
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: nav.x, y: nav.y, button: 'left', clickCount: 1 })
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: nav.x, y: nav.y, button: 'left', clickCount: 1 })
  return until(
    () =>
      evaluate(`(() => {
        const f = document.querySelector('[data-edge-aurora]')
        const here = location.pathname
        const run = f.hasAttribute('data-run')
        const p = f.style.getPropertyValue('--run-p')
        return (here === '/blog' && !run && p === '0.0000') || JSON.stringify({ here, run, p })
      })()`),
    12,
    500,
  )
})

/* 3b-bis · the blog register filter (deep-link + click round-trip). The
   assertions are SELF-CONSISTENT: the shelf must match the pressed chip's
   own count (no hardcoded totals — the belt survives every future post). */
await send('Page.navigate', { url: `${BASE}/blog?tag=Engine` })
await settle()
await check('blog · ?tag= deep-link filters the shelf to the chip count', async () =>
  until(
    () =>
      evaluate(`(() => {
        const pressed = document.querySelector('.blog-tag[aria-pressed="true"]')
        if (!pressed || !pressed.textContent.startsWith('Engine')) return 'chip not pressed'
        const want = Number(pressed.querySelector('.blog-tag-n')?.textContent)
        const cards = document.querySelectorAll('.blog-card').length
        const lead = !!document.querySelector('.blog-lead')
        return (cards === want && !lead) || JSON.stringify({ want, cards, lead })
      })()`),
    10,
    400,
  ))
await check('blog · All restores the lead + the whole shelf', async () => {
  /* re-click per attempt — a click dispatched before the listener hydrates
     is swallowed whole (idempotent: All is already All) */
  let last = null
  for (let attempt = 0; attempt < 3; attempt++) {
    await evaluate(
      `[...document.querySelectorAll('.blog-tag')].find((b) => b.textContent.startsWith('All'))?.click()`,
    )
    last = await until(
      () =>
        evaluate(`(() => {
          const all = Number(document.querySelector('.blog-tag .blog-tag-n')?.textContent)
          const cards = document.querySelectorAll('.blog-card').length
          const lead = !!document.querySelector('.blog-lead')
          return (lead && cards === all - 1 && location.search === '') ||
            JSON.stringify({ all, cards, lead, search: location.search })
        })()`),
      6,
      400,
    )
    if (last === true) break
  }
  return last
})

/* 3b-ter · a post fence hands off to the playground (arc 13 W1): the
   build-time ?y= link on a workflow fence must DECODE into the editor —
   the film's see→touch loop, extended to the journal's exact yaml. */
{
  await send('Page.navigate', { url: `${BASE}/blog/the-run-that-waits` })
  await settle()
  const fenceHref = await until(
    () => evaluate(`document.querySelector('.bp-open-play')?.getAttribute('href') || false`),
    10,
    400,
  )
  if (typeof fenceHref === 'string' && fenceHref.startsWith('/play?y=')) {
    await send('Page.navigate', { url: `${BASE}${fenceHref}` })
    await settle()
    await check('blog · a fence run-it link decodes into the playground', async () =>
      until(
        () =>
          evaluate(
            `(document.querySelector('.cm-content')?.textContent ?? '').includes('gated-release') || false`,
          ),
        20,
        600,
      ))
  } else {
    fail('battery', 'blog · a fence run-it link decodes into the playground', `no .bp-open-play href (${JSON.stringify(fenceHref).slice(0, 60)})`)
  }
}

/* 3b-quater · the ⌘K palette (arc 13 W2): open with the nav trigger (the
   shell listens for ck:open — same path as the button), type, Enter →
   navigation. The lazy chunk + React commits each get their poll. */
await check('palette · ⌘K opens, types, Enter navigates', async () => {
  let last = null
  for (let attempt = 0; attempt < 3; attempt++) {
    await evaluate(`window.dispatchEvent(new Event('ck:open'))`)
    last = await until(() => evaluate(`!!document.querySelector('.ck-input') || false`), 8, 400)
    if (last === true) break
  }
  if (last !== true) return 'palette never opened'
  /* type via the native setter so React's onChange sees it */
  await evaluate(`(() => {
    const input = document.querySelector('.ck-input')
    const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    set.call(input, 'resume story')
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })()`)
  last = await until(
    () =>
      evaluate(
        `(document.querySelector('.ck-opt[aria-selected="true"] .ck-opt-label')?.textContent ?? '').includes('resume') || (document.querySelector('.ck-opt-label')?.textContent ?? 'none')`,
      ),
    8,
    400,
  )
  if (last !== true) return last
  await evaluate(`document.querySelector('.ck-input').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))`)
  return until(() => evaluate(`location.pathname === '/blog/the-resume-story' || location.pathname`), 10, 400)
})

/* 3c · the eggs (global key listeners — synthetic keydown works; re-type the
   word per attempt — keys swallowed pre-hydration never assemble the egg) */
await check('egg · agpl toast (any page)', async () => {
  let last = null
  for (let attempt = 0; attempt < 3; attempt++) {
    await evaluate(`for (const k of 'agpl') window.dispatchEvent(new KeyboardEvent('keydown', { key: k }))`)
    last = await until(() => evaluate(`!!document.querySelector('.agpl-toast[data-on]') || false`), 5, 300)
    if (last === true) break
  }
  return last
})
await send('Page.navigate', { url: `${BASE}/manifesto` })
await settle()
await check('egg · drum (manifesto)', async () => {
  let last = null
  for (let attempt = 0; attempt < 3; attempt++) {
    await evaluate(`for (const k of 'drum') window.dispatchEvent(new KeyboardEvent('keydown', { key: k }))`)
    last = await until(() => evaluate(`!!document.querySelector('[data-egg]') || false`), 5, 300)
    if (last === true) break
  }
  return last
})

/* 3d · the palette closes clean (Escape → dialog gone; the page it opened
   over is still the manifesto from the egg check above) */
await check('palette · Escape closes and the page keeps focus', async () => {
  let last = null
  for (let attempt = 0; attempt < 3; attempt++) {
    await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))`)
    last = await until(() => evaluate(`!!document.querySelector('.ck-input')`), 5, 300)
    if (last === true) break
  }
  if (last !== true) return 'palette never opened'
  await evaluate(`document.querySelector('.ck-input').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`)
  return until(
    () =>
      evaluate(`(() => {
        const gone = !document.querySelector('.ck-input')
        const focusSane = document.activeElement === document.body || !document.activeElement?.closest?.('.ck')
        return (gone && focusSane) || JSON.stringify({ gone, focusSane })
      })()`),
    6,
    300,
  )
})

/* 3e · the manifesto language rail — real navigation, trusted click (the
   links are crawlable <a>; the SPA route change must land the FR page) */
await check('manifesto · the language rail navigates (EN → FR)', async () => {
  const at = await evaluate(
    `(() => { const a = document.querySelector('.mf-langs a[href="/fr/manifesto"]'); if (!a) return null; a.scrollIntoView({ behavior: 'instant', block: 'center' }); const r = a.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } })()`,
  )
  if (!at) return 'FR link not found'
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: at.x, y: at.y, button: 'left', clickCount: 1 })
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: at.x, y: at.y, button: 'left', clickCount: 1 })
  return until(
    () =>
      evaluate(`(() => {
        const here = location.pathname === '/fr/manifesto'
        const lang = document.documentElement.lang
        return (here && lang === 'fr') || JSON.stringify({ path: location.pathname, lang })
      })()`),
    10,
    400,
  )
})

/* 3d · THE SPEC MACHINE (/spec) · the voyage's own belt: the canvas takes
   the stage (desktop + GL — this runner qualifies), the reading assembles
   the ship (the DOM ticks and the machine can never disagree — assert the
   DOM side), the helm answers (trusted clicks), the chapter keys sail. */
await send('Page.navigate', { url: `${BASE}/spec` })
await settle()
await check('spec · the machine takes the stage ([data-machine] + canvas)', async () =>
  until(
    () =>
      evaluate(`(() => {
        const stage = document.querySelector('.spec-rail-stage')
        const live = !!stage?.dataset.machine
        const canvas = !!stage?.querySelector('.smw canvas')
        return (live && canvas) || { live, canvas }
      })()`),
    20,
    600,
  ))
await check('spec · the reading assembles the ship (9 ticks · 8/8 tally)', async () => {
  /* sail the reading: jump each block past the ignition line (the hook's
     rAF sweep catches instant jumps — its own documented law), then poll
     the DOM truth: every INDEX tick lit + the ASSEMBLED tally full */
  const n = await evaluate(`document.querySelectorAll('.spec-block[data-stratum]').length`)
  if (n !== 9) return { blocks: n }
  for (let i = 0; i < n; i++) {
    /* behavior:'instant' — the site's smooth-scroll law (arc 14b): a bare
       scrollTo under html{scroll-behavior:smooth} ANIMATES, and a starved
       runner never finishes the glide (lived: lit:0, the page never moved) */
    await evaluate(`(() => {
      const el = document.querySelectorAll('.spec-block[data-stratum]')[${i}]
      window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - innerHeight * 0.4, behavior: 'instant' })
    })()`)
    await sleep(250)
  }
  /* the last block's target can drift under a content-visibility re-layout
     (the harness re-aim law) — anchor at the page BOTTOM per poll tick: the
     hook's rAF jump-catch (bottom < 0) ignites everything passed, so the
     bottom is the one scroll position that cannot under-read */
  return until(
    () =>
      evaluate(`(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' })
        /* a scrollTo that is ALREADY at the bottom moves nothing → fires no
           scroll event → the hook's rAF sweep never re-runs (lived: lit
           stuck at 7 for the full poll budget). Force one sweep per tick. */
        window.dispatchEvent(new Event('scroll'))
        const lit = document.querySelectorAll('.spec-chip2.is-lit').length
        const tally = document.querySelector('.spec-rail-hud--bl')?.textContent ?? ''
        return (lit === 9 && tally.includes('8/8')) || { lit, tally }
      })()`),
    10,
    500,
  )
})
await check('spec · the helm answers (EXPLODE aria-pressed round-trip)', async () => {
  /* the helm lives at the DOCK (hidden on the poster + finale) — park the
     reading mid-ship first. Trusted CDP clicks (React 19 ignores synthetic
     clicks — the /play trusted-click law). THE MOVING-TARGET TRAP (lived,
     run 2): arriving from the page bottom the chassis flips finale → dock
     and its 0.7s width transition TRAVELS the helm across the screen — a
     click aimed mid-flight lands on empty space ({pressed:false}). Two
     rect reads 300ms apart must agree before a press spends; the whole
     press → assert round retries ×4. */
  const rect = () =>
    evaluate(`(() => {
      const b = [...document.querySelectorAll('.spec-helm-btn')].find((x) => x.textContent === 'EXPLODE')
      if (!b) return null
      const r = b.getBoundingClientRect()
      const vis = r.width > 0 && r.top > 0 && r.bottom < innerHeight
      return vis ? { x: +(r.left + r.width / 2).toFixed(1), y: +(r.top + r.height / 2).toFixed(1) } : null
    })()`)
  const press = async (r) => {
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: r.x, y: r.y, button: 'left', buttons: 1, clickCount: 1 })
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: r.x, y: r.y, button: 'left', buttons: 0, clickCount: 1 })
  }
  const aria = (want) =>
    until(
      () =>
        evaluate(
          `[...document.querySelectorAll('.spec-helm-btn')].find((x) => x.textContent === 'EXPLODE')?.getAttribute('aria-pressed') === ${JSON.stringify(want)} || false`,
        ),
      6,
      400,
    )
  let last = null
  for (let attempt = 0; attempt < 4; attempt++) {
    /* RE-ANCHOR PER ATTEMPT (the belt's law — lived here too: anchored
       once outside the loop, a stage stuck in its finale→dock transition
       kept the helm display:none through every retry, r1:null ×4): park
       the reading on S.3, then REQUIRE the dock before spending a press */
    await evaluate(`(() => {
      const el = document.querySelector('#permits')
      window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - innerHeight * 0.4, behavior: 'instant' })
    })()`)
    const staged = await until(
      () => evaluate(`document.querySelector('.spec-rail')?.dataset.stage === 'dock' || document.querySelector('.spec-rail')?.dataset.stage`),
      6,
      300,
    )
    if (staged !== true) {
      last = { attempt, staged }
      continue
    }
    const r1 = await rect()
    await sleep(300)
    const r2 = await rect()
    if (!r1 || !r2 || Math.abs(r1.x - r2.x) > 1 || Math.abs(r1.y - r2.y) > 1) {
      last = { attempt, r1, r2, stage: await evaluate(`document.querySelector('.spec-rail')?.dataset.stage`) }
      continue
    }
    await press(r2)
    const on = await aria('true')
    if (on !== true) {
      last = { attempt, pressed: on }
      continue
    }
    const r3 = await rect() /* toggle back — leave the stage as found */
    if (r3) await press(r3)
    return aria('false')
  }
  return last
})
await check('spec · Shift+← sails to the previous station (the chapter keys)', async () => {
  /* the reading sits at S.3 (parked above) — the chapter key must land a
     REAL hash (the handler owns window keydown; synthetic keys reach it,
     the eggs' own precedent; re-type per attempt) */
  let last = null
  for (let attempt = 0; attempt < 3; attempt++) {
    await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', shiftKey: true }))`)
    last = await until(() => evaluate(`location.hash.length > 1 || false`), 5, 300)
    if (last === true) return true
  }
  return last
})

/* 3f · THE MOBILE BATTERY — everything above ran at 1600×1000; the burger,
   the sheet and its focus contract only EXIST under the mobile breakpoint.
   Device flips to 390×844 for the rest of the run (exit follows). */
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })
consoleErrs.length = 0
pageErrs.length = 0
await send('Page.navigate', { url: `${BASE}/` })
await settle()
await check('mobile · burger opens the sheet, Escape returns focus', async () => {
  const at = await evaluate(
    `(() => { const b = document.querySelector('.v4nav-burger'); if (!b || !b.offsetParent) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } })()`,
  )
  if (!at) return 'burger not visible at 390px'
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: at.x, y: at.y, button: 'left', clickCount: 1 })
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: at.x, y: at.y, button: 'left', clickCount: 1 })
  const open = await until(
    () => evaluate(`!!document.querySelector('.v4sheet[role="dialog"]') && document.querySelector('.v4nav-burger')?.getAttribute('aria-expanded') === 'true'`),
    8,
    300,
  )
  if (open !== true) return { open }
  await evaluate(`document.querySelector('.v4sheet').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`)
  return until(
    () =>
      evaluate(`(() => {
        const gone = !document.querySelector('.v4sheet[role="dialog"]')
        const focusBack = document.activeElement === document.querySelector('.v4nav-burger')
        return (gone && focusBack) || JSON.stringify({ gone, focusBack })
      })()`),
    6,
    300,
  )
})
await check('mobile · a sheet link navigates (→ /blog)', async () => {
  /* reopen, then trusted-click the Blog link inside the sheet */
  const at = await evaluate(
    `(() => { const b = document.querySelector('.v4nav-burger'); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } })()`,
  )
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: at.x, y: at.y, button: 'left', clickCount: 1 })
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: at.x, y: at.y, button: 'left', clickCount: 1 })
  const open = await until(() => evaluate(`!!document.querySelector('.v4sheet[role="dialog"]')`), 8, 300)
  if (open !== true) return 'sheet never reopened'
  /* the sheet ARRIVES by a css slide-in (v4sheet-in · translateX(100%) → 0)
     and a starved headless runner never advances it — the link's rect sits
     OFF-VIEWPORT at the from-frame forever (found live: x=558 in a 390px
     viewport). Pump frames until the geometry LANDS, then click where it
     actually is. On real devices the animation is 260ms — product is fine;
     the belt must not click a moving (or parked-off-screen) target. */
  let link = null
  for (let i = 0; i < 10 && !link; i++) {
    await evaluate(`(async () => { for (let f = 0; f < 12; f++) await new Promise((r) => requestAnimationFrame(r)) })()`)
    link = await evaluate(
      `(() => { const a = [...document.querySelectorAll('.v4sheet a[href="/blog"]')][0]; if (!a) return null; a.scrollIntoView({ behavior: 'instant', block: 'center' }); const r = a.getBoundingClientRect(); const w = document.documentElement.clientWidth; return r.left >= 0 && r.right <= w + 1 ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null })()`,
    )
    if (!link) await sleep(200)
  }
  if (!link) return 'blog link never landed in the viewport (sheet slide-in stuck)'
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: link.x, y: link.y, button: 'left', clickCount: 1 })
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: link.x, y: link.y, button: 'left', clickCount: 1 })
  return until(
    () =>
      evaluate(`(() => {
        const here = location.pathname === '/blog'
        const closed = !document.querySelector('.v4sheet[role="dialog"]')
        return (here && closed) || JSON.stringify({ path: location.pathname, closed })
      })()`),
    10,
    400,
  )
})
/* the mobile leg rode /, the sheet and /blog — its console must be as clean
   as the desktop pass (mobile-only crashes hid here before this belt) */
await check('mobile · console clean across the battery', async () => {
  const errs = [...consoleErrs, ...pageErrs]
  return errs.length === 0 || errs.slice(0, 3).join(' | ')
})

/* ── verdict ───────────────────────────────────────────────────────────────── */
console.log('')
if (failures.length) {
  console.log(`E2E FAIL · ${failures.length} finding(s)`)
  process.exit(1)
}
console.log('E2E PASS · routes clean · links whole · interactions live')
process.exit(0)

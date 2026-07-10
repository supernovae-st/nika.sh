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
         round-trip, the route tones on <html>, and the agpl + drum eggs.

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
await send('Network.enable')
await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false })

const failures = []
const fail = (route, kind, detail) => {
  failures.push({ route, kind, detail })
  console.log(`  ✗ ${kind} · ${detail}`)
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

/* the aurora route-tone contract (aurora-context toneForRoute) — spot checks.
   Deliberately a COPY, not an import: the sweep is the second accountant.
   Keep in step with ROUTE_TONES (src/fx/aurora-context.ts) — manifesto went
   warm→blue at the arc-9j socratic pass (the tone follows THE BACKGROUND,
   not the page's mood: coral edge-light on the blue drum read as a mismatch). */
const TONE_EXPECT = { '/play': 'deep', '/blog': 'light', '/learn': 'light', '/install': 'blue', '/manifesto': 'blue', '/spec': 'cool' }

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
const NAV_ROUTES = ROUTES.filter((r) => !/^\/errors\/.+/.test(r) || errSample.has(r))
const idsByRoute = new Map()
const links = new Map() // href -> [fromRoutes]
console.log(`e2e-sweep · ${ROUTES.length} routes (${NAV_ROUTES.length} CDP-loaded · errors sampled ${errSample.size}/${errDetail.length}) · ${BASE}\n`)
for (const route of NAV_ROUTES) {
  consoleErrs.length = 0
  pageErrs.length = 0
  failedReqs.length = 0
  await send('Page.navigate', { url: `${BASE}${route}` })
  await sleep(route === '/' ? 3500 : 1800) /* home mounts the lazy 3D field */
  const harvest = await evaluate(`(() => {
    const ids = [...document.querySelectorAll('[id]')].map((el) => el.id)
    const hrefs = [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'))
      .filter((h) => h && (h.startsWith('/') || h.startsWith('#')) && !h.startsWith('//'))
    return { ids, hrefs, tone: document.documentElement.dataset.auroraTone ?? '' }
  })()`)
  idsByRoute.set(route, new Set(harvest.ids))
  for (const h of harvest.hrefs) {
    const abs = h.startsWith('#') ? `${route}${h}` : h
    if (!links.has(abs)) links.set(abs, [])
    links.get(abs).push(route)
  }
  for (const e of consoleErrs) fail(route, 'console.error', e)
  for (const e of pageErrs) fail(route, 'page error', e)
  for (const e of failedReqs) fail(route, 'request', e)
  const expected = TONE_EXPECT[route]
  if (expected && harvest.tone !== expected) fail(route, 'route tone', `expected ${expected}, got "${harvest.tone}"`)
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
    if (ids && !ids.has(hash)) { fail(froms[0], 'dead anchor', `${href} (no #${hash} on ${target})`); linkFails++ }
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

/* 3a · the film's done frame: triangle + drag-seek + handoff */
await send('Page.navigate', { url: `${BASE}/?it=99` })
await settle()
/* content-visibility re-layouts drift a one-shot target (the re-aim law) —
   re-aim + POLL until the phase settles (fixed sleeps mis-time under load) */
await check('film · done frame reached (phase=done)', async () => {
  let last = null
  for (let i = 0; i < 10; i++) {
    await evaluate(`(() => { const s = document.querySelector('.morphsec'); const r = s.getBoundingClientRect(); window.scrollTo(0, r.top + scrollY + (r.height - innerHeight)); })()`)
    await sleep(500)
    last = await evaluate(`(() => { const st = document.querySelector('.morph-stage'); const s = document.querySelector('.morphsec'); const r = s.getBoundingClientRect(); return { phase: st?.dataset.phase, p: st?.style.getPropertyValue('--morph-p'), armed: s?.dataset.armed ?? null, top: Math.round(r.top), h: Math.round(r.height), sy: Math.round(scrollY) } })()`)
    if (last.phase === 'done') return true
  }
  return last
})
await check('film · log hover lights node + file lines (the triangle)', async () => {
  const r = await evaluate(`(() => {
    const line = [...document.querySelectorAll('.morph-line[data-task]')].pop()
    if (!line) return { err: 'no task line' }
    line.dispatchEvent(new PointerEvent('pointerover', { bubbles: true }))
    return new Promise((res) => setTimeout(() => {
      const id = line.dataset.task
      res({
        nodeHi: !!document.querySelector('.morph-node[data-task="' + id + '"][data-hi]'),
        fileLit: document.querySelectorAll('.morph-done-code .cf-line.morph-hi').length > 0,
      })
    }, 350))
  })()`)
  await evaluate(`[...document.querySelectorAll('.morph-line[data-task]')].pop()?.dispatchEvent(new PointerEvent('pointerout', { bubbles: true }))`)
  return r.nodeHi === true && r.fileLit === true
})
await check('film · playground handoff href carries the file', async () => {
  const href = await evaluate(`document.querySelector('.morph-done-open')?.getAttribute('href') ?? ''`)
  return href.startsWith('/play?y=') && href.length > 200
})
await check('film · drag-seek scrubs (the 1:1 pointer path)', async () => {
  /* isPrimary: true — the constructor default is false and React/our slop
     logic must see a primary pointer; the drag path calls seek() → scrollTo
     directly (no self-chaining rAF), so it works headless. Assert on the
     SCROLL position (the store) — --morph-p follows via a one-shot rAF that
     may lag a beat under swiftshader. */
  const r = await evaluate(`(() => {
    const track = document.querySelector('.morph-track')
    const tr = track.getBoundingClientRect()
    const y0 = window.scrollY
    const base = { clientY: tr.top + tr.height / 2, bubbles: true, pointerId: 7, isPrimary: true, pointerType: 'mouse', button: 0, buttons: 1 }
    track.dispatchEvent(new PointerEvent('pointerdown', { ...base, clientX: tr.left + tr.width * 0.98 }))
    track.dispatchEvent(new PointerEvent('pointermove', { ...base, clientX: tr.left + tr.width * 0.3 }))
    track.dispatchEvent(new PointerEvent('pointerup', { ...base, clientX: tr.left + tr.width * 0.3, buttons: 0 }))
    return new Promise((res) => setTimeout(() => {
      const s = document.querySelector('.morphsec')
      const r2 = s.getBoundingClientRect()
      const runway = r2.height - document.querySelector('.morph-stage').offsetHeight
      const p = -r2.top / runway
      res({ moved: Math.abs(window.scrollY - y0) > 100, p: +p.toFixed(3), dy: Math.round(window.scrollY - y0) })
    }, 500))
  })()`)
  return (r.moved && r.p > 0.2 && r.p < 0.4) || r
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

/* 3b-bis · the blog register filter (deep-link + click round-trip). The
   assertions are SELF-CONSISTENT: the shelf must match the pressed chip's
   own count (no hardcoded totals — the belt survives every future post). */
await send('Page.navigate', { url: `${BASE}/blog?tag=Engine` })
await settle()
await check('blog · ?tag= deep-link filters the shelf to the chip count', async () => {
  return await evaluate(`(() => {
    const pressed = document.querySelector('.blog-tag[aria-pressed="true"]')
    if (!pressed || !pressed.textContent.startsWith('Engine')) return 'chip not pressed'
    const want = Number(pressed.querySelector('.blog-tag-n')?.textContent)
    const cards = document.querySelectorAll('.blog-card').length
    const lead = !!document.querySelector('.blog-lead')
    return cards === want && !lead ? true : JSON.stringify({ want, cards, lead })
  })()`)
})
await check('blog · All restores the lead + the whole shelf', async () => {
  await evaluate(
    `[...document.querySelectorAll('.blog-tag')].find((b) => b.textContent.startsWith('All'))?.click()`,
  )
  await sleep(400)
  return await evaluate(`(() => {
    const all = Number(document.querySelector('.blog-tag .blog-tag-n')?.textContent)
    const cards = document.querySelectorAll('.blog-card').length
    const lead = !!document.querySelector('.blog-lead')
    return lead && cards === all - 1 && location.search === ''
      ? true
      : JSON.stringify({ all, cards, lead, search: location.search })
  })()`)
})

/* 3c · the eggs (global key listeners — synthetic keydown works) */
await check('egg · agpl toast (any page)', async () => {
  await evaluate(`for (const k of 'agpl') window.dispatchEvent(new KeyboardEvent('keydown', { key: k }))`)
  await sleep(300)
  return await evaluate(`!!document.querySelector('.agpl-toast[data-on]')`)
})
await send('Page.navigate', { url: `${BASE}/manifesto` })
await settle()
await check('egg · drum (manifesto)', async () => {
  await evaluate(`for (const k of 'drum') window.dispatchEvent(new KeyboardEvent('keydown', { key: k }))`)
  await sleep(300)
  return await evaluate(`!!document.querySelector('[data-egg]')`)
})

/* ── verdict ───────────────────────────────────────────────────────────────── */
console.log('')
if (failures.length) {
  console.log(`E2E FAIL · ${failures.length} finding(s)`)
  process.exit(1)
}
console.log('E2E PASS · routes clean · links whole · interactions live')
process.exit(0)

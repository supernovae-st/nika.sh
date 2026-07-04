/* shoot-scroll · headless screenshot sweep through a scroll-linked section.
   Complements the ?it=N intro freeze (AGENTS.md scene rules): scroll scenes
   (ScrollMorph) are verified by scrolling the REAL page and capturing frames
   at chosen progress fractions. Zero deps — Node 22 global WebSocket + CDP
   against Chrome headless on swiftshader (same GL truth as CI screenshots).

   Usage:
     pnpm build && python3 -m http.server 4517 -d dist &
     node scripts/shoot-scroll.mjs \
       --url http://127.0.0.1:4517/?it=99 \
       --section .morphsec \
       --out shots \
       --ps 0.02,0.1,0.18,0.24,0.3,0.38,0.46,0.54,0.6,0.66,0.74,0.84,0.9,0.94,0.97,1 \
       --seam 0.15,0.35,0.55,0.8 \
       --reverse            # optional: replay the sweep backward (scrub-down truth)

   Frames land in --out as 00-rest, 01-seam-qNN (section top crossing the
   viewport, q = 1 - rect.top/vh) and 02-p0NN (fraction of the section's
   scroll runway). `?it=99` freezes the hero intro so frames are deterministic. */
import { execFile } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : fallback
}
const has = (name) => process.argv.includes(`--${name}`)

const URL_BASE = arg('url', 'http://127.0.0.1:4517/?it=99')
const OUT = arg('out', 'shots')
const SECTION = arg('section', '.morphsec')
const PS = arg('ps', '0.02,0.1,0.18,0.24,0.3,0.38,0.46,0.54,0.6,0.66,0.74,0.84,0.9,0.94,0.97,1')
  .split(',')
  .map(Number)
const SEAM_QS = arg('seam', '0.15,0.35,0.55,0.8').split(',').filter(Boolean).map(Number)
const REVERSE = has('reverse')
const WIDTH = Number(arg('width', '1600'))
const HEIGHT = Number(arg('height', '1000'))
const PORT = Number(arg('port', '9223'))
const CHROME = arg(
  'chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
)
mkdirSync(OUT, { recursive: true })

const chrome = execFile(
  CHROME,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--hide-scrollbars',
    `--window-size=${WIDTH},${HEIGHT}`,
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=/tmp/shoot-scroll-profile-${PORT}`,
    'about:blank',
  ],
  () => {},
)
process.on('exit', () => chrome.kill())

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getWsUrl() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`)
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

async function shot(name) {
  const r = await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(r.data, 'base64'))
  console.log('shot', name)
}

await send('Page.enable')
await send('Runtime.enable')
await send('Emulation.setDeviceMetricsOverride', {
  width: WIDTH,
  height: HEIGHT,
  deviceScaleFactor: 1,
  mobile: WIDTH < 700,
})
await send('Page.navigate', { url: URL_BASE })
await sleep(6000) /* load + fonts + lazy 3D chunk */

const geo = await evaluate(`(() => {
  const s = document.querySelector(${JSON.stringify(SECTION)})
  if (!s) return null
  const r = s.getBoundingClientRect()
  return { top: r.top + window.scrollY, height: r.height, vh: innerHeight }
})()`)
if (!geo) {
  console.error(`NO ${SECTION} FOUND`)
  process.exit(1)
}
console.log(SECTION, geo)
const runway = geo.height - geo.vh

/* frames carry the FORMULA, not a baked y: content-visibility sections
   above the target re-layout as they render, so the section's top/height
   at load time can be stale by whole viewports. Each frame re-measures the
   live rect right before its scroll (found on the use-cases sweep: three
   frames "inside" the section all showed the section above it). */
const frames = []
frames.push({ name: '00-rest', q: null, p: null })
for (const q of SEAM_QS) {
  frames.push({ name: `01-seam-q${String(q).replace('.', '')}`, q, p: null })
}
for (const p of PS) {
  frames.push({ name: `02-p${p.toFixed(2).replace('.', '')}`, q: null, p })
}
if (REVERSE) frames.reverse()

for (const f of frames) {
  const calcY = async () =>
    f.q === null && f.p === null
      ? 0
      : await evaluate(`(() => {
          const s = document.querySelector(${JSON.stringify(SECTION)})
          const r = s.getBoundingClientRect()
          const top = r.top + window.scrollY
          return ${f.q !== null ? `top - (1 - ${f.q}) * innerHeight` : `top + ${f.p} * (r.height - innerHeight)`}
        })()`)
  await evaluate(`window.scrollTo(0, ${await calcY()})`)
  await sleep(400) /* let content-visibility render + layout settle… */
  await evaluate(`window.scrollTo(0, ${await calcY()})`) /* …re-aim on the settled layout */
  await sleep(800) /* rAF applies + 3D settles */
  await shot(REVERSE ? `r-${f.name}` : f.name)
}

console.log('DONE ·', frames.length, 'frames →', OUT)
process.exit(0)

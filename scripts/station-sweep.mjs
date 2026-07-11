/* station-sweep · one SETTLED shot per /spec dock station (S.0 … S.8).
   The station-audit eye: scrolls each .spec-block[data-stratum] to the
   reading line (top at 45% — the block IS the current section), waits the
   full pose glide + spin settle + lit wash (~3.2s at k≈2.2 — an 800ms
   settle judges MID-GLIDES, not poses: the arc 12-nuit-5 lesson), shoots,
   and drains the console (an error would invalidate the judging).

   Usage:
     pnpm build && python3 -m http.server 4527 -d dist &
     node scripts/station-sweep.mjs <outDir> [url] [onlyIdx,...] [--port N]
     node scripts/station-sweep.mjs shots http://127.0.0.1:4527/spec/ 1,3,6

   Frames land as station-<idx>-<FIG>.png (the FIG read from the live
   position plate — a mismatch means the scroll under-shot). Zero deps —
   Node 22 WebSocket + CDP on swiftshader (the shoot-scroll family; ports
   must be FRESH per run — a zombie chrome on the port is the classic
   « chrome did not come up »). */
import { execFile } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const OUT = process.argv[2] ?? 'station-shots'
const BASE = process.argv[3] ?? 'http://127.0.0.1:4527/spec/'
const ONLY = process.argv[4] && !process.argv[4].startsWith('--') ? process.argv[4].split(',').map(Number) : null
const portIdx = process.argv.indexOf('--port')
const PORT = portIdx === -1 ? 9239 : Number(process.argv[portIdx + 1]) || 9239
const CHROME = process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
mkdirSync(OUT, { recursive: true })

const chrome = execFile(
  CHROME,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--hide-scrollbars',
    '--window-size=1600,1000',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=/tmp/station-sweep-${PORT}`,
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
    } catch {}
    await sleep(250)
  }
  throw new Error('chrome did not come up')
}

const ws = new WebSocket(await getWsUrl())
await new Promise((r) => (ws.onopen = r))
let mid = 0
const pending = new Map()
const consoleLines = []
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data)
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id)
    pending.delete(msg.id)
    msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result)
  }
  if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error')
    consoleLines.push(msg.params.args.map((a) => a.value ?? a.description).join(' '))
  if (msg.method === 'Runtime.exceptionThrown')
    consoleLines.push(msg.params.exceptionDetails.text)
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
async function shot(name) {
  const r = await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(r.data, 'base64'))
  console.log('shot', name)
}

await send('Page.enable')
await send('Runtime.enable')
await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false })
await send('Page.navigate', { url: BASE })
await sleep(6500) /* load + fonts + lazy 3D chunk */

const n = await evaluate(`document.querySelectorAll('.spec-block[data-stratum]').length`)
console.log('blocks:', n)

for (let i = 0; i < n; i++) {
  if (ONLY && !ONLY.includes(i)) continue
  /* the block's top at 45% of the viewport → it IS the current section
     (the reading line sits at 62%); instant scroll, then the long settle */
  const y = await evaluate(`(() => {
    const el = document.querySelectorAll('.spec-block[data-stratum]')[${i}]
    return el.getBoundingClientRect().top + window.scrollY - innerHeight * 0.45
  })()`)
  await evaluate(`window.scrollTo({ top: ${y}, behavior: 'instant' })`)
  await sleep(600) /* content-visibility layout settle */
  await evaluate(`window.scrollTo({ top: ${y}, behavior: 'instant' })`) /* re-aim */
  await sleep(3200) /* pose glide (k≈2.2) + spin settle + lit wash */
  const cur = await evaluate(`document.querySelector('.spec-rail-pos-fig')?.textContent ?? '?'`)
  await shot(`station-${String(i).padStart(2, '0')}-${cur.replace(/[^A-Za-z0-9.]+/g, '')}`)
}

if (consoleLines.length) {
  console.log('CONSOLE ERRORS:')
  for (const l of consoleLines) console.log(' ·', l)
} else console.log('console clean')
process.exit(0)

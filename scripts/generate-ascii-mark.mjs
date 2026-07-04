/* generate-ascii-mark · bake public/nika.svg into the CTA's ASCII plate.
   The Cursor-CLI close idiom, in the nika register: the butterfly silhouette
   rendered as an ordered-dither character field — per-cell alpha COVERAGE
   maps onto a light→dense ramp that spells the product's own letters
   (i · n · k · a) at its mid densities, and the canonical Bayer-8 table
   (glyph-points.ts, verbatim from Maxime Heckel's dithering article) jitters
   the quantization so the interior reads as printed texture, not flat fill.

   Deterministic bake → src/sections/cta-mark.generated.ts (committed, the
   canon.generated.ts idiom): the mark is real prerendered HTML — crawlable,
   no-JS-true, zero runtime sampling cost.

   Usage:  node scripts/generate-ascii-mark.mjs
   Cell aspect is 0.5 (w:h) — the CSS renders with line-height 1.2 on a mono
   face whose advance is ~0.6em, so 0.6/1.2 = 0.5 keeps the glyph round. */
import { execFile } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const PORT = 9226
const COLS = 56
const CELL_W = 12 /* raster px per cell (subsampled 4×4) */
const CELL_H = CELL_W * 2 /* aspect 0.5 */
/* light → dense · the mid ramp spells the mark's own letters */
const RAMP = [' ', '.', ':', '=', 'i', 'n', 'k', 'a', '#', '@']

const BAYER8 = [
  0, 48, 12, 60, 3, 51, 15, 63, 32, 16, 44, 28, 35, 19, 47, 31, 8, 56, 4, 52, 11, 59, 7, 55, 40,
  24, 36, 20, 43, 27, 39, 23, 2, 50, 14, 62, 1, 49, 13, 61, 34, 18, 46, 30, 33, 17, 45, 29, 10, 58,
  6, 54, 9, 57, 5, 53, 42, 26, 38, 22, 41, 25, 37, 21,
]

const svg = readFileSync(new URL('../public/nika.svg', import.meta.url), 'utf8')
const svgUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`

const chrome = execFile(
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=/tmp/ascii-mark-profile-${PORT}`,
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

await send('Runtime.enable')
const r = await send('Runtime.evaluate', {
  expression: `(async () => {
    const img = new Image()
    await new Promise((res, rej) => {
      img.onload = res
      img.onerror = () => rej(new Error('svg load failed'))
      img.src = ${JSON.stringify(svgUri)}
    })
    const W = ${COLS * CELL_W}
    const rows = Math.round((${COLS} * img.height / img.width) * 0.5)
    const H = rows * ${CELL_H}
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(img, 0, 0, W, H)
    const data = ctx.getImageData(0, 0, W, H).data
    /* per-cell coverage · 4×4 alpha subsamples */
    const cov = []
    for (let cy = 0; cy < rows; cy++) {
      const row = []
      for (let cx = 0; cx < ${COLS}; cx++) {
        let acc = 0
        for (let sy = 0; sy < 4; sy++) {
          for (let sx = 0; sx < 4; sx++) {
            const x = cx * ${CELL_W} + Math.floor((sx + 0.5) * ${CELL_W / 4})
            const y = cy * ${CELL_H} + Math.floor((sy + 0.5) * ${CELL_H / 4})
            acc += data[(y * W + x) * 4 + 3] / 255
          }
        }
        row.push(acc / 16)
      }
      cov.push(row)
    }
    return JSON.stringify(cov)
  })()`,
  returnByValue: true,
  awaitPromise: true,
})
if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails))
const cov = JSON.parse(r.result.value)

/* quantize with the Bayer-8 jitter · outside stays hard space (no halo) */
const lines = cov.map((row, cy) =>
  row
    .map((c, cx) => {
      if (c < 0.04) return ' '
      const jitter = (BAYER8[(cy % 8) * 8 + (cx % 8)] / 64 - 0.5) * 1.6
      const idx = Math.max(1, Math.min(RAMP.length - 1, Math.round(c * (RAMP.length - 1) + jitter)))
      return RAMP[idx]
    })
    .join(''),
)

/* trim empty margins (rows + columns) */
while (lines.length && lines[0].trim() === '') lines.shift()
while (lines.length && lines[lines.length - 1].trim() === '') lines.pop()
const left = Math.min(...lines.filter((l) => l.trim()).map((l) => l.length - l.trimStart().length))
const trimmed = lines.map((l) => l.slice(left).trimEnd())

const out = `/* generated by scripts/generate-ascii-mark.mjs — do not edit.
   The butterfly as an ordered-dither character field (Bayer-8 jittered
   coverage ramp · the mid densities spell i·n·k·a). Rendered by the
   FinalCTA close with line-height 1.2 (cell aspect 0.5). */
export const CTA_MARK = ${JSON.stringify(trimmed.join('\n'))}
`
writeFileSync(new URL('../src/sections/cta-mark.generated.ts', import.meta.url), out)
console.log(trimmed.join('\n'))
console.log(`→ src/sections/cta-mark.generated.ts · ${trimmed.length} rows × ≤${COLS} cols`)
process.exit(0)

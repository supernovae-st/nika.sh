import nikaRaw from '../assets/nika.svg?raw'

/* ─── butterfly sampler ────────────────────────────────────────────────────
   Rasterizes the REAL nika.svg offscreen and samples its opaque pixels into
   particle target positions — the galaxy's 26k stars BECOME the logo during
   the intro, then disperse into the spiral ("le papillon forme la galaxie").

   The targets are tilt-compensated: GalaxyDisk lives inside the Rig group
   (rotation.x ≈ −0.46), so we pre-rotate by +0.46 around X so the butterfly
   faces the camera dead-on despite the group tilt. */

const TILT = 0.46
const HEIGHT = 3.4 // world height of the butterfly
const CENTER_Y = 0.45 // world y of its center (slightly above the core)

/** synchronous fallback while the raster loads — a faint sphere shell
    (invisible in practice: uBflyA is still 0 during the first ~350ms) */
function fillFallback(out: Float32Array, count: number) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2
    const b = Math.acos(2 * Math.random() - 1)
    const r = 1.6
    const x = r * Math.sin(b) * Math.cos(a)
    const y = r * Math.cos(b)
    const z = 0
    out[i * 3] = x
    out[i * 3 + 1] = CENTER_Y + y * Math.cos(TILT) - z * Math.sin(TILT)
    out[i * 3 + 2] = y * Math.sin(TILT) + z * Math.cos(TILT)
  }
}

/** rasterize the svg → sample alpha>128 pixels → world targets (tilt-compensated) */
export function sampleButterfly(
  out: Float32Array,
  count: number,
  onReady: () => void,
): void {
  fillFallback(out, count)
  const img = new Image()
  img.onload = () => {
    try {
      const S = 420
      const cv = document.createElement('canvas')
      cv.width = S
      cv.height = S
      const ctx = cv.getContext('2d', { willReadFrequently: true })!
      ctx.drawImage(img, 0, 0, S, S)
      const data = ctx.getImageData(0, 0, S, S).data
      const px: number[] = []
      for (let y = 0; y < S; y++)
        for (let x = 0; x < S; x++) if (data[(y * S + x) * 4 + 3] > 128) px.push(x, y)
      const n = px.length / 2
      if (n < 50) return // degenerate raster — keep fallback
      const scale = HEIGHT / S
      const cosT = Math.cos(TILT)
      const sinT = Math.sin(TILT)
      for (let i = 0; i < count; i++) {
        const k = (Math.random() * n) | 0
        // sub-pixel jitter + a breath of depth so the wing has body
        const lx = (px[k * 2] + Math.random() - S / 2) * scale
        const ly = (S / 2 - (px[k * 2 + 1] + Math.random())) * scale
        const lz = (Math.random() - 0.5) * 0.16
        // pre-rotate +TILT around X (cancels the Rig's −TILT)
        out[i * 3] = lx
        out[i * 3 + 1] = CENTER_Y + ly * cosT - lz * sinT
        out[i * 3 + 2] = ly * sinT + lz * cosT
      }
      onReady()
    } catch {
      /* raster blocked — fallback stays */
    }
  }
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(nikaRaw)
}

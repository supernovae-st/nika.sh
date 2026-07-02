/* ─── glyph-points · sample the butterfly SVG into a point cloud ──────────────
   Shared sampler for the dither→logo reveals (footer signature · nav mark).
   Runtime sampling (the SVG is one small path — build-time baking would add a
   codegen step for zero gain at these point counts). Browser-only: callers
   invoke from effects/events, never at render. Results cached per key. */

export interface GlyphPoint {
  /** target position (the glyph), canvas space */
  x: number
  y: number
  /** start position (the Bayer-field scatter ring) */
  sx: number
  sy: number
  /** normalized distance-to-centre 0..1 (stagger key · inner lands first) */
  d: number
  /** Bayer 8×8 index 0..63 (the ordered-dither shimmer key) */
  b: number
}

/* the canonical Bayer 8×8 order table (Maxime's article, verbatim) */
const BAYER8 = [
  0, 48, 12, 60, 3, 51, 15, 63, 32, 16, 44, 28, 35, 19, 47, 31, 8, 56, 4, 52, 11, 59, 7, 55, 40,
  24, 36, 20, 43, 27, 39, 23, 2, 50, 14, 62, 1, 49, 13, 61, 34, 18, 46, 30, 33, 17, 45, 29, 10, 58,
  6, 54, 9, 57, 5, 53, 42, 26, 38, 22, 41, 25, 37, 21,
]

/** deterministic 32-bit hash (FNV-1a) — the scatter ring never flickers */
function hash32(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

const cache = new Map<string, Promise<GlyphPoint[]>>()

/** Sample `svgUrl` into a point grid. size = canvas CSS px · step = sample
    pitch in px (2 → ~1.5-2k points at 220). Cached per (url, size, step). */
export function sampleGlyphPoints(
  svgUrl: string,
  size: number,
  step: number,
): Promise<GlyphPoint[]> {
  const key = `${svgUrl}|${size}|${step}`
  const hit = cache.get(key)
  if (hit) return hit

  const p = new Promise<GlyphPoint[]>((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) {
        reject(new Error('2d context unavailable'))
        return
      }
      ctx.drawImage(img, 0, 0, size, size)
      const data = ctx.getImageData(0, 0, size, size).data
      const pts: GlyphPoint[] = []
      const c = size / 2
      let maxD = 1
      for (let y = 0; y < size; y += step) {
        for (let x = 0; x < size; x += step) {
          const alpha = data[(y * size + x) * 4 + 3]
          if (alpha <= 128) continue
          const dist = Math.hypot(x - c, y - c)
          maxD = Math.max(maxD, dist)
          const h = hash32(`${x}:${y}`)
          const angle = ((h % 3600) / 3600) * Math.PI * 2
          const radius = (0.35 + ((h >>> 12) % 1000) / 5000) * size // 0.35–0.55 × size
          pts.push({
            x,
            y,
            sx: c + Math.cos(angle) * radius,
            sy: c + Math.sin(angle) * radius,
            d: dist,
            b: BAYER8[((x / step) % 8) * 8 + ((y / step) % 8)],
          })
        }
      }
      for (const pt of pts) pt.d /= maxD
      resolve(pts)
    }
    img.onerror = () => reject(new Error(`failed to load ${svgUrl}`))
    img.src = svgUrl
  })
  /* a rejection must NOT stay cached — one transient SVG fetch failure would
     otherwise kill the signature until a full reload. Drop the entry so the
     next in-view attempt can retry. */
  p.catch(() => cache.delete(key))
  cache.set(key, p)
  return p
}

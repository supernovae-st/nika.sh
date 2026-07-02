import { useCallback, useEffect, useRef } from 'react'
import { sampleGlyphPoints, type GlyphPoint } from './glyph-points'
import './footer-signature.css'

/* ─── FooterSignature · the CONTINUOUS living butterfly (wave F · F3) ─────────
   Operator override: the one-shot converge + ↺ replay button are GONE. The
   signature is a perpetual particle stream (the Maxime ∞ register): particles
   forever CRAWL along the butterfly glyph — each one drifts from a glyph
   point to a nearby glyph point, so the silhouette holds while the surface
   permanently flows. A small stray fraction escapes to the scatter ring and
   returns: the noise keeps becoming the file, forever.

   Recognizability at rest (the F3 root-cause fix): the old device converged
   EVERY sampled point into 2px dots → a solid featureless fill (blob), and
   any mid-flight glance showed the orbit ring. Now TWO layers: a cached
   GHOST body (every glyph point at low alpha — the butterfly always reads)
   + a bounded particle set streaming over it (the living surface). No
   transient ring state exists to catch.

   Interactions: pointer/touch within ~48px repels locally (the thumb smears
   the noise, the glyph reforms through it). No buttons.

   Degradation: the assembled SVG + caption ship in the prerendered HTML
   (no-JS complete); reduced-motion keeps the static butterfly img; the
   canvas only takes over on motion-allowed clients. Off-view = zero work
   (IntersectionObserver gates the rAF loop both ways).

   Perf: ~1.1k particles × 2 fillRect on a 280px 2D canvas · <1ms/frame on a
   2020 phone · lazy-mounted (React.lazy) so it never rides the home bundle. */

const SIZE = 280
const SAMPLE_STEP = 3
const N_PARTICLES = 1500
const STRAY_RATE = 0.06 // fraction of hops that escape to the ring and back
const REPEL_R = 48
const INK = '#cfe6ff'
const GHOST_ALPHA = 0.15 // the always-there body — recognition floor

interface Particle {
  x: number
  y: number
  /** hop start / end (canvas space) */
  ax: number
  ay: number
  bx: number
  by: number
  /** hop timing */
  t0: number
  dur: number
  /** Bayer twinkle key of the CURRENT target glyph point */
  b: number
  /** true while hopping through off-glyph space (stray) */
  stray: boolean
}

/** deterministic PRNG (mulberry32) — the swarm never flickers across mounts */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const easeInOut = (k: number) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2)

export default function FooterSignature() {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const ptsRef = useRef<GlyphPoint[] | null>(null)
  /* the cached ghost body — every glyph point at low alpha, drawn once */
  const ghostRef = useRef<HTMLCanvasElement | null>(null)
  /* spatial hash of glyph points (16px cells) — neighbor hops stay O(1) */
  const gridRef = useRef<Map<number, number[]> | null>(null)
  const particlesRef = useRef<Particle[] | null>(null)
  const rafRef = useRef<number | null>(null)
  const runningRef = useRef(false)
  const startedRef = useRef(false)
  const pointerRef = useRef<{ x: number; y: number } | null>(null)
  const offsetsRef = useRef<Float32Array | null>(null)
  const rngRef = useRef(mulberry32(0x6e696b61)) // "nika"
  const drawRef = useRef<(now: number) => void>(() => {})

  const cellOf = (x: number, y: number) => ((x >> 4) << 8) | (y >> 4)

  /** pick the next home for a particle: a glyph point near (x,y) — or, for a
      stray hop, a ring point out in the noise (it returns next hop). */
  const nextHop = useCallback((p: Particle, now: number) => {
    const pts = ptsRef.current
    const grid = gridRef.current
    const rng = rngRef.current
    if (!pts || !grid) return
    p.ax = p.bx
    p.ay = p.by
    if (!p.stray && rng() < STRAY_RATE) {
      /* escape to the scatter ring (the noise) */
      const a = rng() * Math.PI * 2
      const r = (0.38 + rng() * 0.16) * SIZE
      p.bx = SIZE / 2 + Math.cos(a) * r
      p.by = SIZE / 2 + Math.sin(a) * r
      p.stray = true
    } else {
      /* crawl: a glyph point within ~2 cells of here (falls back to any) */
      const candidates: number[] = []
      const cx = Math.max(0, Math.min(SIZE - 1, Math.round(p.stray ? SIZE / 2 : p.ax)))
      const cy = Math.max(0, Math.min(SIZE - 1, Math.round(p.stray ? SIZE / 2 : p.ay)))
      for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -2; dy <= 2; dy++) {
          const bucket = grid.get(cellOf(cx + (dx << 4), cy + (dy << 4)))
          if (bucket) candidates.push(...bucket)
        }
      }
      const pool = p.stray || candidates.length === 0 ? null : candidates
      const idx = pool
        ? pool[(rng() * pool.length) | 0]
        : (rng() * pts.length) | 0
      const target = pts[idx]
      p.bx = target.x
      p.by = target.y
      p.b = target.b
      p.stray = false
    }
    p.t0 = now
    p.dur = 1100 + rngRef.current() * 1500
  }, [])

  const draw = useCallback(
    (now: number) => {
      const canvas = canvasRef.current
      const particles = particlesRef.current
      if (!canvas || !particles) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      if (canvas.width !== SIZE * dpr) {
        canvas.width = SIZE * dpr
        canvas.height = SIZE * dpr
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      /* the ghost body first — the butterfly is recognizable every frame */
      const ghost = ghostRef.current
      if (ghost) ctx.drawImage(ghost, 0, 0, canvas.width, canvas.height)
      ctx.fillStyle = INK

      let offs = offsetsRef.current
      if (!offs || offs.length !== particles.length * 2) {
        offs = new Float32Array(particles.length * 2)
        offsetsRef.current = offs
      }
      const px = pointerRef.current
      const dot = 2 * dpr
      const wave = (now / 3600) % 1 // the ordered-dither twinkle sweep

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        let k = (now - p.t0) / p.dur
        if (k >= 1) {
          nextHop(p, now)
          k = 0
        }
        const e = easeInOut(Math.min(1, Math.max(0, k)))
        p.x = p.ax + (p.bx - p.ax) * e
        p.y = p.ay + (p.by - p.ay) * e

        /* pointer repel · local smear, lerp-recovered */
        if (px) {
          const dx = p.x - px.x
          const dy = p.y - px.y
          const dd = Math.hypot(dx, dy)
          if (dd < REPEL_R && dd > 0.01) {
            const f = (1 - dd / REPEL_R) * 12
            offs[i * 2] += (dx / dd) * f * 0.14
            offs[i * 2 + 1] += (dy / dd) * f * 0.14
          }
        }
        offs[i * 2] *= 0.9
        offs[i * 2 + 1] *= 0.9

        /* alpha · in-transit particles dim; settled ones carry the Bayer
           twinkle (ordered, never random sparkle) */
        const moving = Math.abs(k - 0.5) < 0.5 ? Math.sin(Math.PI * Math.min(1, k)) : 0
        const tw = wave * 64 > p.b ? 0.2 : 0
        ctx.globalAlpha = Math.min(1, (p.stray ? 0.28 : 0.78) - moving * 0.3 + tw)
        ctx.fillRect((p.x + offs[i * 2]) * dpr, (p.y + offs[i * 2 + 1]) * dpr, dot, dot)
      }
      ctx.globalAlpha = 1

      if (runningRef.current) rafRef.current = requestAnimationFrame(drawRef.current)
      else rafRef.current = null
    },
    [nextHop],
  )

  useEffect(() => {
    drawRef.current = draw
  }, [draw])

  /** boot the swarm (samples the glyph once, seeds particles ON the ring so
      the first seconds stream the noise into the file — then it never stops) */
  const start = useCallback(async () => {
    if (startedRef.current) return
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const canvas = canvasRef.current
    if (!canvas) return
    let pts: GlyphPoint[]
    try {
      pts = await sampleGlyphPoints('/nika.svg', SIZE, SAMPLE_STEP)
    } catch {
      return // sampler failed → the static img stays (honest fallback)
    }
    if (pts.length === 0) return
    startedRef.current = true
    ptsRef.current = pts

    /* bake the ghost body once (device-pixel resolution) */
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const ghost = document.createElement('canvas')
    ghost.width = SIZE * dpr
    ghost.height = SIZE * dpr
    const gctx = ghost.getContext('2d')
    if (gctx) {
      gctx.fillStyle = INK
      gctx.globalAlpha = GHOST_ALPHA
      for (const pt of pts) gctx.fillRect(pt.x * dpr, pt.y * dpr, 2 * dpr, 2 * dpr)
      ghostRef.current = ghost
    }

    const grid = new Map<number, number[]>()
    for (let i = 0; i < pts.length; i++) {
      const key = cellOf(pts[i].x, pts[i].y)
      const bucket = grid.get(key)
      if (bucket) bucket.push(i)
      else grid.set(key, [i])
    }
    gridRef.current = grid

    const rng = rngRef.current
    const now = performance.now()
    const particles: Particle[] = Array.from({ length: N_PARTICLES }, () => {
      const home = pts[(rng() * pts.length) | 0]
      return {
        x: home.sx,
        y: home.sy,
        ax: home.sx,
        ay: home.sy,
        bx: home.x,
        by: home.y,
        t0: now - rng() * 900, // staggered arrivals — no synchronized snap
        dur: 1400 + rng() * 1600,
        b: home.b,
        stray: false,
      }
    })
    particlesRef.current = particles

    imgRef.current?.setAttribute('data-hidden', 'true')
    canvas.setAttribute('data-live', 'true')
    runningRef.current = true
    if (rafRef.current == null) rafRef.current = requestAnimationFrame(drawRef.current)
  }, [])

  /* the loop runs ONLY while the stage is on screen — but it always runs
     there (idle = alive · the operator's ask). Off-view = zero work. */
  useEffect(() => {
    const el = rootRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            if (!startedRef.current) void start()
            runningRef.current = true
            if (startedRef.current && rafRef.current == null) {
              rafRef.current = requestAnimationFrame(drawRef.current)
            }
          } else {
            runningRef.current = false
          }
        }
      },
      { threshold: 0.15 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      runningRef.current = false
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [start])

  /* pointer smear · move/leave on the stage (mouse + touch drag) */
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const r = canvas.getBoundingClientRect()
    pointerRef.current = { x: e.clientX - r.left, y: e.clientY - r.top }
  }, [])
  const onPointerLeave = useCallback(() => {
    pointerRef.current = null
  }, [])

  return (
    <div className="fsig" ref={rootRef}>
      <div
        className="fsig-stage"
        role="presentation"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        <canvas className="fsig-canvas" ref={canvasRef} width={SIZE} height={SIZE} aria-hidden />
        {/* the no-JS / reduced-motion truth · the assembled butterfly */}
        <img
          ref={imgRef}
          src="/nika.svg"
          alt=""
          className="fsig-fallback"
          width={170}
          height={170}
          loading="lazy"
        />
      </div>
      <p className="fsig-caption">the noise becomes the file.</p>
    </div>
  )
}

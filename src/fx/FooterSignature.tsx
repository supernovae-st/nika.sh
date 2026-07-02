import { useCallback, useEffect, useRef } from 'react'
import { sampleGlyphPoints, type GlyphPoint } from './glyph-points'
import './footer-signature.css'

/* ─── FooterSignature · the dither field converges into the butterfly ─────────
   THE SIGNATURE (beat 13): disordered pixels — the chat noise — assemble into
   the durable form. Plays ONCE in view, tap/↺ replays, the pointer smears the
   swarm and the glyph reforms through it (the thesis acted out).

   Degradation contract: the assembled SVG + caption ship in the prerendered
   HTML (no-JS complete); reduced-motion keeps the static butterfly; the
   canvas only takes over on motion-allowed clients. Off-view = zero work
   (the rAF loop runs only while intersecting AND animating/shimmering).

   Perf: ~1.5k points × fillRect on a 220px 2D canvas · <1ms/frame · lazy
   sampling on first in-view · no GL (by footer depth the field is faded). */

const SIZE = 220
const DRIFT_MS = 1100
const CONVERGE_MS = 1600
const INK = '#cfe6ff'

export default function FooterSignature() {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const ptsRef = useRef<GlyphPoint[] | null>(null)
  const rafRef = useRef<number | null>(null)
  const t0Ref = useRef(0)
  const pointerRef = useRef<{ x: number; y: number } | null>(null)
  const offsetsRef = useRef<Float32Array | null>(null)
  const playedRef = useRef(false)
  /* the frame fn re-schedules itself through a ref (no self-reference TDZ) */
  const drawRef = useRef<(now: number) => void>(() => {})

  const draw = useCallback((now: number) => {
    const canvas = canvasRef.current
    const pts = ptsRef.current
    if (!canvas || !pts) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    if (canvas.width !== SIZE * dpr) {
      canvas.width = SIZE * dpr
      canvas.height = SIZE * dpr
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = INK

    const t = now - t0Ref.current
    const px = pointerRef.current
    let offs = offsetsRef.current
    if (!offs || offs.length !== pts.length * 2) {
      offs = new Float32Array(pts.length * 2)
      offsetsRef.current = offs
    }
    const dot = 2 * dpr
    let settled = t > DRIFT_MS + CONVERGE_MS + 600

    for (let i = 0; i < pts.length; i++) {
      const p = pts[i]
      let x: number
      let y: number
      let alpha: number
      if (t < DRIFT_MS) {
        /* phase 1 · the swarm orbits its ring ("qui tourne") */
        const a = t * 0.00035 + p.b * 0.1
        x = p.sx + Math.cos(a) * 4
        y = p.sy + Math.sin(a) * 4
        alpha = 0.35
      } else {
        /* phase 2 · converge, inner points first · ease-out */
        const delay = p.d * 500
        const k = Math.min(1, Math.max(0, (t - DRIFT_MS - delay) / CONVERGE_MS))
        const e = 1 - Math.pow(1 - k, 3)
        x = p.sx + (p.x - p.sx) * e
        y = p.sy + (p.y - p.sy) * e
        /* phase 3 · hold + ordered-dither shimmer (Bayer order, never random) */
        const wave = (t / 4000) % 1
        const tw = k >= 1 ? (wave * 64 > p.b ? 0.18 : 0) : 0
        alpha = 0.35 + 0.55 * e + tw
      }
      /* pointer repel · the thumb smears the noise, the glyph reforms */
      if (px) {
        const dx = x - px.x
        const dy = y - px.y
        const dd = Math.hypot(dx, dy)
        if (dd < 44 && dd > 0.01) {
          const f = (1 - dd / 44) * 10
          offs[i * 2] += (dx / dd) * f * 0.12
          offs[i * 2 + 1] += (dy / dd) * f * 0.12
        }
      }
      offs[i * 2] *= 0.9
      offs[i * 2 + 1] *= 0.9
      if (Math.abs(offs[i * 2]) > 0.05 || Math.abs(offs[i * 2 + 1]) > 0.05) settled = false
      ctx.globalAlpha = Math.min(1, alpha)
      ctx.fillRect((x + offs[i * 2]) * dpr, (y + offs[i * 2 + 1]) * dpr, dot, dot)
    }
    ctx.globalAlpha = 1

    /* keep ticking while animating / shimmering-with-pointer; settle to a
       gentle 3rd-frame shimmer cadence once assembled */
    if (!settled || px) {
      rafRef.current = requestAnimationFrame(drawRef.current)
    } else {
      /* assembled + idle · tick the shimmer at ~20fps */
      rafRef.current = null
      setTimeout(() => {
        if (rafRef.current == null && playedRef.current) {
          rafRef.current = requestAnimationFrame(drawRef.current)
        }
      }, 150)
    }
  }, [])

  useEffect(() => {
    drawRef.current = draw
  }, [draw])

  const play = useCallback(async () => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const canvas = canvasRef.current
    if (!canvas) return
    try {
      ptsRef.current = await sampleGlyphPoints('/nika.svg', SIZE, 2)
    } catch {
      return // sampler failed → the static img stays (honest fallback)
    }
    playedRef.current = true
    imgRef.current?.setAttribute('data-hidden', 'true')
    canvas.setAttribute('data-live', 'true')
    t0Ref.current = performance.now()
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(draw)
  }, [draw])

  /* play ONCE on first in-view (motion only) */
  useEffect(() => {
    const el = rootRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !playedRef.current) {
            void play()
            io.disconnect()
          }
        }
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [play])

  /* pointer smear · move/leave on the stage (mouse + touch drag) */
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const r = canvas.getBoundingClientRect()
    pointerRef.current = { x: e.clientX - r.left, y: e.clientY - r.top }
    if (rafRef.current == null && playedRef.current) {
      rafRef.current = requestAnimationFrame(draw)
    }
  }, [draw])
  const onPointerLeave = useCallback(() => {
    pointerRef.current = null
  }, [])

  return (
    <div className="fsig" ref={rootRef}>
      <div
        className="fsig-stage"
        role="presentation"
        onClick={() => void play()}
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
          width={150}
          height={150}
          loading="lazy"
        />
      </div>
      <button
        type="button"
        className="fsig-replay"
        aria-label="Replay the signature animation"
        onClick={() => void play()}
      >
        <span aria-hidden>↺</span> replay
      </button>
      <p className="fsig-caption">the noise becomes the file.</p>
    </div>
  )
}

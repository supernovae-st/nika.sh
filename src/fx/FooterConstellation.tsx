import { useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { FOOTER_COLS } from '../content/lens-nav.generated'
import './footer-constellation.css'

/* ─── FooterConstellation · « every page, one graph », literally ──────────────
   The map's thesis as a living scene: the SPEC node feeds six world clusters
   (one per footer column), every internal door is a star. Hairline edges,
   Bayer-ordered twinkle (the site's dither register), slow drift, pointer
   repel. Hovering a world column below ignites its cluster (and hovering a
   cluster ignites nothing else — the columns stay the readable index; the
   scene is the same graph seen from above). Stars are REAL doors: the
   pointer hit-tests them (cursor flips, a mono label names the page) and a
   click navigates — while the canvas stays aria-hidden, because every one
   of these doors already exists as a link right below (the HUD is a second
   projection, never the only door).

   Lazy chunk (the FooterSignature precedent): zero entry bytes; mounts
   post-hydration in a height-reserved stage (no CLS). Off-view = zero work
   (IntersectionObserver gates the rAF both ways). Reduced-motion = the
   settled register: one static draw, state floors only (ignition redraws,
   no drift, no twinkle). Lite-data keeps the empty grained sky. */

const INK = '#cfe6ff'
const ACCENT = '#4f86ff'
const CLUSTER_R = 0.085 // of stage width
const REPEL_R = 42

interface Star {
  /** home position (relative 0-1 stage space) */
  hx: number
  hy: number
  /** live position (px) */
  x: number
  y: number
  /** drift phase + bayer twinkle key */
  ph: number
  b: number
  world: number
  label: string
  to: string
}

interface Cluster {
  cx: number
  cy: number
  label: string
  idx: string
}

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

/* the six clusters ride an arc from the spec sun — hand-placed for the HUD
   read (left → right = the columns' order), not force-simulated: the layout
   must be IDENTICAL every visit (a map that reshuffles is not a map) */
const CLUSTER_SEATS: [number, number][] = [
  [0.24, 0.3],
  [0.38, 0.68],
  [0.52, 0.26],
  [0.66, 0.62],
  [0.8, 0.3],
  [0.91, 0.66],
]
const SPEC_SEAT: [number, number] = [0.055, 0.48]

function buildGraph(): { stars: Star[]; clusters: Cluster[] } {
  const stars: Star[] = []
  const clusters: Cluster[] = []
  FOOTER_COLS.forEach((col, w) => {
    const [cx, cy] = CLUSTER_SEATS[w] ?? [0.5, 0.5]
    clusters.push({ cx, cy, label: col.kick.toUpperCase(), idx: String(w + 1).padStart(2, '0') })
    const rng = mulberry32(0x6e696b61 ^ (w * 2654435761))
    for (const item of col.items) {
      if (!item.to) continue // external doors stay in the columns
      const a = rng() * Math.PI * 2
      const r = (0.35 + rng() * 0.65) * CLUSTER_R
      stars.push({
        hx: cx + Math.cos(a) * r,
        hy: cy + Math.sin(a) * r * 1.45, // compact band — a tighter breath
        x: 0,
        y: 0,
        ph: rng() * Math.PI * 2,
        b: (rng() * 64) | 0,
        world: w,
        label: item.label,
        to: item.to,
      })
    }
  })
  return { stars, clusters }
}

export default function FooterConstellation() {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const navigate = useNavigate()
  const graphRef = useRef(buildGraph())
  const rafRef = useRef<number | null>(null)
  const runningRef = useRef(false)
  const reducedRef = useRef(false)
  const pointerRef = useRef<{ x: number; y: number } | null>(null)
  const hotWorldRef = useRef<number>(-1)
  const hotStarRef = useRef<Star | null>(null)
  const monoRef = useRef('ui-monospace, monospace')
  const drawRef = useRef<(now: number) => void>(() => {})

  const draw = useCallback((now: number) => {
    const canvas = canvasRef.current
    const root = rootRef.current
    if (!canvas || !root) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const W = root.clientWidth
    const H = root.clientHeight
    if (W === 0 || H === 0) return
    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
      canvas.width = W * dpr
      canvas.height = H * dpr
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)
    const { stars, clusters } = graphRef.current
    const t = reducedRef.current ? 0 : now / 1000
    const hot = hotWorldRef.current
    const px = pointerRef.current
    const [sx0, sy0] = SPEC_SEAT
    const specX = sx0 * W
    const specY = sy0 * H

    /* star positions first (edges need them) */
    for (const s of stars) {
      let x = s.hx * W + Math.sin(t * 0.5 + s.ph) * 3
      let y = s.hy * H + Math.cos(t * 0.4 + s.ph * 1.7) * 3
      if (px) {
        const dx = x - px.x
        const dy = y - px.y
        const dd = Math.hypot(dx, dy)
        if (dd < REPEL_R && dd > 0.01) {
          const f = ((REPEL_R - dd) / REPEL_R) * 10
          x += (dx / dd) * f
          y += (dy / dd) * f
        }
      }
      s.x = x
      s.y = y
    }

    /* edges · spec → clusters (the doctrine line: every claim derives) */
    for (let w = 0; w < clusters.length; w++) {
      const c = clusters[w]
      const lit = w === hot
      ctx.strokeStyle = lit ? ACCENT : INK
      ctx.globalAlpha = lit ? 0.36 : 0.13
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(specX, specY)
      /* one soft elbow — a straight fan reads as spokes, the elbow reads
         as a route */
      const mx = (specX + c.cx * W) / 2
      ctx.quadraticCurveTo(mx, c.cy * H, c.cx * W, c.cy * H)
      ctx.stroke()
    }
    /* edges · cluster hub → its stars */
    for (const s of stars) {
      const c = clusters[s.world]
      const lit = s.world === hot
      ctx.strokeStyle = lit ? ACCENT : INK
      ctx.globalAlpha = lit ? 0.24 : 0.075
      ctx.beginPath()
      ctx.moveTo(c.cx * W, c.cy * H)
      ctx.lineTo(s.x, s.y)
      ctx.stroke()
    }

    /* the spec sun · a diamond, the source mark */
    ctx.globalAlpha = 1
    ctx.fillStyle = INK
    ctx.save()
    ctx.translate(specX, specY)
    ctx.rotate(Math.PI / 4)
    ctx.fillRect(-3.2, -3.2, 6.4, 6.4)
    ctx.restore()
    ctx.font = `9px ${monoRef.current}`
    ctx.globalAlpha = 0.55
    ctx.fillText('SPEC', specX - 12, specY + 18)

    /* cluster hubs + HUD labels */
    const wave = ((now / 3600) % 1) * 64
    for (let w = 0; w < clusters.length; w++) {
      const c = clusters[w]
      const lit = w === hot
      ctx.globalAlpha = lit ? 1 : 0.6
      ctx.fillStyle = lit ? ACCENT : INK
      ctx.fillRect(c.cx * W - 2, c.cy * H - 2, 4, 4)
      ctx.font = `9px ${monoRef.current}`
      ctx.globalAlpha = lit ? 0.95 : 0.42
      const text = `${c.idx} ${c.label}`
      const tw = ctx.measureText(text).width
      const ty = c.cy * H + (c.cy < 0.5 ? -14 : 20)
      ctx.fillText(text, Math.min(Math.max(c.cx * W - tw / 2, 4), W - tw - 4), ty)
    }

    /* stars · 2px dots, Bayer twinkle, the hot world in accent */
    for (const s of stars) {
      const lit = s.world === hot
      const tw = !reducedRef.current && wave > s.b ? 0.25 : 0
      ctx.fillStyle = lit ? ACCENT : INK
      ctx.globalAlpha = Math.min(1, (lit ? 0.95 : 0.62) + tw)
      ctx.fillRect(s.x - 1, s.y - 1, 2, 2)
    }

    /* the pointed star · named in mono, its dot grown to a door */
    const hs = hotStarRef.current
    if (hs) {
      ctx.fillStyle = ACCENT
      ctx.globalAlpha = 1
      ctx.fillRect(hs.x - 2, hs.y - 2, 4, 4)
      ctx.font = `10px ${monoRef.current}`
      const tw2 = ctx.measureText(hs.label).width
      const lx = Math.min(Math.max(hs.x - tw2 / 2, 4), W - tw2 - 4)
      const ly = hs.y - 10 < 12 ? hs.y + 18 : hs.y - 10
      ctx.globalAlpha = 0.95
      ctx.fillText(hs.label, lx, ly)
    }
    ctx.globalAlpha = 1

    if (runningRef.current && !reducedRef.current) {
      rafRef.current = requestAnimationFrame(drawRef.current)
    } else {
      rafRef.current = null
    }
  }, [])

  useEffect(() => {
    drawRef.current = draw
  }, [draw])

  /* one redraw for state floors (reduced-motion ignition, resize) */
  const still = useCallback(() => {
    if (rafRef.current == null) rafRef.current = requestAnimationFrame(drawRef.current)
  }, [])

  useEffect(() => {
    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    monoRef.current =
      getComputedStyle(document.documentElement).getPropertyValue('--mono').trim() ||
      'ui-monospace, monospace'

    const root = rootRef.current
    if (!root) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          runningRef.current = e.isIntersecting
          if (e.isIntersecting) still()
        }
      },
      { threshold: 0.1 },
    )
    io.observe(root)
    const ro = new ResizeObserver(() => still())
    ro.observe(root)

    /* the columns ignite their cluster · one delegated listener, the
       column carries data-world (SSR markup — no wiring props) */
    const onOver = (e: PointerEvent) => {
      const col = (e.target as Element).closest?.<HTMLElement>('[data-world]')
      const w = col ? Number(col.dataset.world) : -1
      if (w !== hotWorldRef.current) {
        hotWorldRef.current = w
        still()
      }
    }
    document.addEventListener('pointerover', onOver, { passive: true })
    return () => {
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('pointerover', onOver)
      runningRef.current = false
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [still])

  const hitStar = (e: React.PointerEvent | React.MouseEvent): Star | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const r = canvas.getBoundingClientRect()
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    let best: Star | null = null
    let bd = 12
    for (const s of graphRef.current.stars) {
      const d = Math.hypot(s.x - x, s.y - y)
      if (d < bd) {
        bd = d
        best = s
      }
    }
    return best
  }

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const r = canvas.getBoundingClientRect()
    pointerRef.current = { x: e.clientX - r.left, y: e.clientY - r.top }
    const hs = hitStar(e)
    if (hs !== hotStarRef.current) {
      hotStarRef.current = hs
      canvas.style.cursor = hs ? 'pointer' : ''
      still()
    } else if (reducedRef.current) {
      still()
    }
  }, [still])

  const onPointerLeave = useCallback(() => {
    pointerRef.current = null
    hotStarRef.current = null
    const canvas = canvasRef.current
    if (canvas) canvas.style.cursor = ''
    still()
  }, [still])

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      const hs = hitStar(e)
      if (hs) void navigate(hs.to, { viewTransition: true })
    },
    [navigate],
  )

  return (
    <div className="sitefoot-sky-stage" ref={rootRef}>
      <canvas
        ref={canvasRef}
        aria-hidden
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onClick={onClick}
      />
    </div>
  )
}

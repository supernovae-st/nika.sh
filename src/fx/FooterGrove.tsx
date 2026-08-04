import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { FOOTER_COLS } from '../content/lens-nav.generated'
import './footer-grove.css'

/* ─── FooterGrove · LES BOIS — the map as a neural tree ──────────────────────
   The operator's drawing, built: a ROOT at the bottom center (✦ SPEC — the
   file), antler branches rising AROUND the living butterfly (the canopy),
   and every internal door a LABELED leaf on its world's stem. The whole
   graph reads without a pointer; the tree IS the index on wide screens
   (phones keep plain lists — a grove is a wide-screen instrument).

   Division of labor (the a11y law): every leaf, every stem head, the root
   door are REAL DOM links — native focus, hover, SEO, screen readers. The
   canvas draws only what DOM cannot: branches, stars, the one orchestrated
   GROWTH on first view, the upward current, the hover blaze. Both sides
   share ONE geometry module (computeGrove) so the stars sit exactly under
   the labels at every width.

   Laws carried: lazy chunk (zero entry bytes) · height-reserved stage ·
   IO-gated rAF · reduced-motion = the grown tree, still (ignition floors
   redraw once) · background-size restated nowhere (no backgrounds here) ·
   raw ink hexes (the --v4-accent-soft idiom · the footer is pinned dark). */

const INK = '#cfe6ff'
const ACCENT = '#4f86ff'
const GROW_MS = 950

interface Leaf {
  x: number
  y: number
  side: -1 | 1
  label: string
  to: string
  world: number
  /** growth timing · when along the branch this leaf lights (0-1) */
  at: number
}
interface Stem {
  world: number
  idx: string
  kick: string
  hub: string
  side: -1 | 1
  /** the polyline root → tip, relative coords */
  path: [number, number][]
  topY: number
  x: number
}

interface GroveLayout {
  leaves: Leaf[]
  stems: Stem[]
  root: [number, number]
}

/* the six stems' seats · outer worlds ride higher (the antler silhouette).
   x = the stem's vertical rail; topY = where its leaf column starts.
   Left side hosts 02·01·03 (outside-in), right hosts 04·05·06 (inside-out)
   — the COLUMN ORDER of the old index preserved left→right at the rails:
   02 01 03 | 04 05 06 reads 1..6 by proximity pairs; simpler: keep world
   order left→right outside-in as the ASCII locked. */
const STEM_SEATS: { world: number; x: number; topY: number; side: -1 | 1 }[] = [
  { world: 1, x: 0.075, topY: 0.1, side: -1 }, // 02 the language · 9 leaves
  { world: 0, x: 0.225, topY: 0.17, side: -1 }, // 01 how it works · 6
  { world: 2, x: 0.355, topY: 0.27, side: -1 }, // 03 workflows · 6 (under the wing)
  { world: 3, x: 0.63, topY: 0.24, side: 1 }, // 04 what it knows · 8
  { world: 4, x: 0.8, topY: 0.16, side: 1 }, // 05 get it running · 6
  { world: 5, x: 0.93, topY: 0.08, side: 1 }, // 06 the project · 10
]
const ROOT: [number, number] = [0.5, 0.805]
/** px per leaf row (the rhythm the labels breathe on) */
const LEAF_STEP = 24

function computeGrove(): GroveLayout {
  const leaves: Leaf[] = []
  const stems: Stem[] = []
  for (const seat of STEM_SEATS) {
    const col = FOOTER_COLS[seat.world]
    if (!col) continue
    const doors = col.items.filter((i) => i.to)
    /* the branch · root → an elbow → the stem's foot (a light antler bend).
       The elbow bows OUTWARD (side * bow) at mid-height. */
    const footY = seat.topY + (doors.length * LEAF_STEP) / 520 /* rel-ish; resolved at draw via px */
    const path: [number, number][] = [
      ROOT,
      [ROOT[0] + seat.side * Math.abs(seat.x - ROOT[0]) * 0.42, 0.62],
      [seat.x - seat.side * 0.012, Math.min(0.56, footY + 0.1)],
      [seat.x, footY],
    ]
    stems.push({
      world: seat.world,
      idx: String(seat.world + 1).padStart(2, '0'),
      kick: col.kick,
      hub: doors[0]?.to ?? '/map',
      side: seat.side,
      path,
      topY: seat.topY,
      x: seat.x,
    })
    doors.forEach((d, i) => {
      leaves.push({
        x: seat.x,
        y: seat.topY + (i * LEAF_STEP) / 460,
        side: seat.side,
        label: d.label,
        to: d.to as string,
        world: seat.world,
        at: 0.55 + (i / Math.max(1, doors.length - 1)) * 0.4,
      })
    })
  }
  return { leaves, stems, root: ROOT }
}

const easeOut = (k: number) => 1 - Math.pow(1 - k, 3)

/** point at parameter t (0-1) along a polyline (uniform by segment length) */
function pointAt(path: [number, number][], t: number, W: number, H: number): [number, number] {
  const pts = path.map(([x, y]) => [x * W, y * H] as [number, number])
  const lens: number[] = []
  let total = 0
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
    lens.push(l)
    total += l
  }
  let d = t * total
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i] || i === lens.length - 1) {
      const k = lens[i] === 0 ? 0 : Math.min(1, d / lens[i])
      return [
        pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k,
        pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k,
      ]
    }
    d -= lens[i]
  }
  return pts[pts.length - 1]
}

export default function FooterGrove() {
  const layout = useMemo(() => computeGrove(), [])
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)
  const runningRef = useRef(false)
  const reducedRef = useRef(false)
  const grownRef = useRef<number | null>(null) // growth start timestamp
  const hotRef = useRef<number>(-1)
  const drawRef = useRef<(now: number) => void>(() => {})
  /* hover state · React owns the labels' lit class; the canvas reads the
     mirrored ref (never a ref during render) */
  const [hot, setHot] = useState(-1)

  const draw = useCallback(
    (now: number) => {
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

      const hot = hotRef.current
      /* growth progress · 1 when reduced or done */
      let g = 1
      if (!reducedRef.current) {
        if (grownRef.current == null) grownRef.current = now
        g = easeOut(Math.min(1, (now - grownRef.current) / GROW_MS))
      }
      const t = reducedRef.current ? 0 : now / 1000

      for (const s of layout.stems) {
        const lit = s.world === hot
        /* the branch · drawn to its growth parameter */
        ctx.strokeStyle = lit ? ACCENT : INK
        ctx.globalAlpha = lit ? 0.5 : 0.14
        ctx.lineWidth = 1
        ctx.beginPath()
        const steps = 26
        for (let i = 0; i <= steps; i++) {
          const tt = (i / steps) * Math.min(1, g * 1.15)
          const [x, y] = pointAt(s.path, tt, W, H)
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()

        /* the leaf twigs + stars (once the branch has reached them) */
        const doors = layout.leaves.filter((l) => l.world === s.world)
        for (const leaf of doors) {
          if (g < leaf.at) continue
          const lx = leaf.x * W
          const ly = leaf.y * H
          const litLeaf = lit
          ctx.globalAlpha = (litLeaf ? 0.5 : 0.12) * Math.min(1, (g - leaf.at) * 8)
          ctx.beginPath()
          ctx.moveTo(s.x * W, ly)
          ctx.lineTo(lx + leaf.side * 6, ly)
          ctx.stroke()
          const tw = !reducedRef.current && ((t * 17 + leaf.y * 64) % 64) < 9 ? 0.3 : 0
          ctx.fillStyle = litLeaf ? ACCENT : INK
          ctx.globalAlpha = Math.min(1, (litLeaf ? 0.95 : 0.6) + tw) * Math.min(1, (g - leaf.at) * 8)
          ctx.fillRect(lx + leaf.side * 6 - 1.5, ly - 1.5, 3, 3)
        }

        /* the upward current · two motes per branch climbing root → tip */
        if (!reducedRef.current && g >= 1) {
          ctx.fillStyle = lit ? ACCENT : INK
          for (let m = 0; m < 2; m++) {
            const mt = ((t * 0.12 + m * 0.5 + s.world * 0.13) % 1)
            const [mx, my] = pointAt(s.path, mt, W, H)
            ctx.globalAlpha = (lit ? 0.8 : 0.35) * Math.sin(Math.PI * mt)
            ctx.fillRect(mx - 1, my - 1, 2, 2)
          }
        }
      }

      /* the root diamond · the spec, where the noise becomes the file */
      const [rx, ry] = [layout.root[0] * W, layout.root[1] * H]
      ctx.globalAlpha = 1
      ctx.fillStyle = INK
      ctx.save()
      ctx.translate(rx, ry)
      ctx.rotate(Math.PI / 4)
      const pulse = reducedRef.current ? 0 : Math.sin(t * 1.4) * 0.6
      ctx.fillRect(-3.4 - pulse, -3.4 - pulse, 6.8 + pulse * 2, 6.8 + pulse * 2)
      ctx.restore()
      /* the root's name · engraved under the diamond, HUD ink */
      ctx.font = `9px ui-monospace, monospace`
      ctx.globalAlpha = 0.55
      const sw = ctx.measureText('SPEC').width
      ctx.fillText('SPEC', rx - sw / 2, ry + 17)

      const alive = (!reducedRef.current && runningRef.current) || g < 1
      if (alive) rafRef.current = requestAnimationFrame(drawRef.current)
      else rafRef.current = null
    },
    [layout],
  )

  useEffect(() => {
    drawRef.current = draw
  }, [draw])

  const still = useCallback(() => {
    if (rafRef.current == null) rafRef.current = requestAnimationFrame(drawRef.current)
  }, [])

  useEffect(() => {
    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          runningRef.current = e.isIntersecting
          if (e.isIntersecting) still()
        }
      },
      { threshold: 0.12 },
    )
    io.observe(el)
    const ro = new ResizeObserver(() => still())
    ro.observe(el)
    return () => {
      io.disconnect()
      ro.disconnect()
      runningRef.current = false
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [still])

  /* hover blaze · state drives the labels, the mirrored ref drives paint */
  useEffect(() => {
    hotRef.current = hot
    still()
  }, [hot, still])

  return (
    <div className="grove" ref={rootRef} onMouseLeave={() => setHot(-1)}>
      <canvas ref={canvasRef} aria-hidden />
      {layout.stems.map((s) => (
        <Link
          key={s.world}
          to={s.hub}
          className="grove-head"
          data-lit={hot === s.world || undefined}
          style={{
            left: `${s.x * 100}%`,
            top: `calc(${s.topY * 100}% - 22px)`,
            ['--side' as string]: s.side,
          }}
          onMouseEnter={() => setHot(s.world)}
          onFocus={() => setHot(s.world)}
        >
          {s.idx} {s.kick.toUpperCase()}
        </Link>
      ))}
      {layout.leaves.map((leaf) => (
        <Link
          key={leaf.to}
          to={leaf.to}
          className="grove-leaf"
          data-side={leaf.side === -1 ? 'l' : 'r'}
          data-lit={hot === leaf.world || undefined}
          style={{ left: `${leaf.x * 100}%`, top: `${leaf.y * 100}%` }}
          onMouseEnter={() => setHot(leaf.world)}
          onFocus={() => setHot(leaf.world)}
        >
          {leaf.label}
        </Link>
      ))}
    </div>
  )
}

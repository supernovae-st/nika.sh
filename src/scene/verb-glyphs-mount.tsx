import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import type { NikaVerb } from '../components/codefile-highlight'
import './verb-glyphs-tile.css'

/* ─── verb-glyphs-mount · the capability gate + lazy mount for the glyphs ─────
   The STATIC side of the verb-glyph specimens (Verbs.tsx imports this — no
   three.js in the import graph until the gate opens). The tile itself is a
   hairline specimen plate carrying the verb's mono glyph char at specimen
   size: THAT is the truth on mobile / reduced-motion / no-WebGL, and the SSR
   output (zero layout shift when the 3D arrives — the canvas covers it).

   Gate (the use-plan3d contract): desktop ≥1024px + motion allowed + a real
   WebGL context. Mount: an IntersectionObserver keeps the Canvas mounted ONLY
   while the chapter is near the viewport (±35%), so at most the 1-2 visible
   chapters hold a GL context at any time — leave, and the context is
   released; the char takes back over. */

const VerbGlyph3D = lazy(() => import('./verb-glyphs-three'))

/* the same monochrome-safe chars the kicker uses (codefile-highlight) — kept
   local so this file adds zero imports beyond the type */
const CHAR: Record<NikaVerb, string> = { infer: '◇', exec: '▷', invoke: '◆', agent: '✦' }

/* ── the floor pictograms · the verb glyphs PRINTED in the dither register ────
   The static plate used to hold a lone 42px char — sparse next to the live 3D
   field (W7 survey). Each glyph is now a coverage field quantized through the
   canonical Bayer-8 table (the Wedge/W9 recipe): SOLID core, ~1-cell dithered
   edge halo, baked at module scope. Same silhouettes as the chars: the infer
   diamond stays a ring, exec a triangle ring, invoke prints solid, the agent
   star is an astroid fill. */
const BAYER8 = [
  0, 48, 12, 60, 3, 51, 15, 63, 32, 16, 44, 28, 35, 19, 47, 31, 8, 56, 4, 52, 11, 59, 7, 55, 40,
  24, 36, 20, 43, 27, 39, 23, 2, 50, 14, 62, 1, 49, 13, 61, 34, 18, 46, 30, 33, 17, 45, 29, 10, 58,
  6, 54, 9, 57, 5, 53, 42, 26, 38, 22, 41, 25, 37, 21,
]
const G_N = 27
const G_PITCH = 76 / G_N
const covOf = (d: number, half: number, f: number) =>
  Math.max(0, Math.min(1, (half + f - d) / f))

function verbCells(verb: NikaVerb) {
  const cells: { x: number; y: number; o: number }[] = []
  for (let cy = 0; cy < G_N; cy++) {
    for (let cx = 0; cx < G_N; cx++) {
      const dx = (cx + 0.5) / G_N - 0.5
      const dy = (cy + 0.5) / G_N - 0.5
      let c: number
      if (verb === 'infer') {
        /* ◇ · the diamond ring (L1 annulus) */
        c = covOf(Math.abs(Math.abs(dx) + Math.abs(dy) - 0.3), 0.05, 0.035)
      } else if (verb === 'exec') {
        /* ▷ · the run triangle, as a ring (signed max of 3 half-planes) */
        const sdf = Math.max(-0.26 - dx, (dx + 0.34) / 2 + Math.abs(dy) - 0.35)
        c = covOf(Math.abs(sdf), 0.045, 0.035)
      } else if (verb === 'invoke') {
        /* ◆ · the claimed diamond, solid */
        c = covOf(Math.abs(dx) + Math.abs(dy), 0.3, 0.05)
      } else {
        /* ✦ · the four-point star (astroid fill) */
        const d = (Math.abs(dx) ** (2 / 3) + Math.abs(dy) ** (2 / 3)) ** 1.5
        c = covOf(d, 0.34, 0.06)
      }
      if (c <= 0.03) continue
      const t = (BAYER8[(cy % 8) * 8 + (cx % 8)] + 0.5) / 64
      if (c < 1 && c < t) continue /* the ordered-dither edge halo */
      cells.push({ x: cx, y: cy, o: c >= 1 ? 1 : 0.42 })
    }
  }
  return cells
}
const VERB_CELLS: Record<NikaVerb, { x: number; y: number; o: number }[]> = {
  infer: verbCells('infer'),
  exec: verbCells('exec'),
  invoke: verbCells('invoke'),
  agent: verbCells('agent'),
}

function VerbPictogram({ verb }: { verb: NikaVerb }) {
  return (
    <svg
      className="vg-picto"
      viewBox="0 0 76 76"
      aria-hidden
      focusable="false"
      shapeRendering="crispEdges"
    >
      <g fill="currentColor">
        {VERB_CELLS[verb].map((c, i) => (
          <rect
            key={i}
            x={(c.x * G_PITCH).toFixed(2)}
            y={(c.y * G_PITCH).toFixed(2)}
            width={(G_PITCH * 0.62).toFixed(2)}
            height={(G_PITCH * 0.62).toFixed(2)}
            opacity={c.o}
          />
        ))}
      </g>
    </svg>
  )
}

let webglCache: boolean | null = null
function hasWebGL(): boolean {
  if (webglCache !== null) return webglCache
  try {
    const c = document.createElement('canvas')
    webglCache = !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    webglCache = false
  }
  return webglCache
}

export function VerbGlyphTile({ verb }: { verb: NikaVerb }) {
  const ref = useRef<HTMLDivElement>(null)
  const [able, setAble] = useState(false)
  const [live, setLive] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const wide = window.matchMedia('(min-width: 1024px)')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const decide = () => setAble(wide.matches && !reduced.matches && hasWebGL())
    decide()
    wide.addEventListener('change', decide)
    reduced.addEventListener('change', decide)
    return () => {
      wide.removeEventListener('change', decide)
      reduced.removeEventListener('change', decide)
    }
  }, [])

  /* mounted only while near — scrolling away RELEASES the GL context */
  useEffect(() => {
    const el = ref.current
    if (!el || !able || typeof IntersectionObserver === 'undefined') {
      setLive(false)
      return
    }
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting), {
      rootMargin: '35% 0px',
    })
    io.observe(el)
    return () => {
      io.disconnect()
      setLive(false)
    }
  }, [able])

  return (
    <div ref={ref} className="vg-tile" data-live={able && live ? '1' : '0'} aria-hidden>
      <span className="vg-char">
        <VerbPictogram verb={verb} />
        <span className="sr-only">{CHAR[verb]}</span>
      </span>
      {able && live && (
        <Suspense fallback={null}>
          <VerbGlyph3D verb={verb} />
        </Suspense>
      )}
    </div>
  )
}

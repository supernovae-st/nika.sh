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
      <span className="vg-char">{CHAR[verb]}</span>
      {able && live && (
        <Suspense fallback={null}>
          <VerbGlyph3D verb={verb} />
        </Suspense>
      )}
    </div>
  )
}

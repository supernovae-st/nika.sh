import { useEffect, useState } from 'react'
import { prefersLiteData } from '../lib/save-data'

/* ─── usePlan3D · the capability gate for the 3D DAG layer (wave H) ───────────
   True ONLY when the moment can be worth its cost: desktop (≥1024px), motion
   allowed, a real WebGL context available, no lite-data request (W-H: a
   Save-Data visitor never pulls the three.js chunk), AND the morph section
   has come near the viewport once (so the lazy chunk never loads for a
   visitor who stays above the fold). Everywhere else the DOM story stays
   the one truth. */

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

export function usePlan3D(sectionRef: React.RefObject<HTMLElement | null>): boolean {
  const [able, setAble] = useState(false)
  const [near, setNear] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const wide = window.matchMedia('(min-width: 1024px)')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const decide = () => setAble(wide.matches && !reduced.matches && !prefersLiteData() && hasWebGL())
    decide()
    wide.addEventListener('change', decide)
    reduced.addEventListener('change', decide)
    return () => {
      wide.removeEventListener('change', decide)
      reduced.removeEventListener('change', decide)
    }
  }, [])

  /* one-shot mount trigger — a viewport ahead, then the layer stays mounted
     (its own frameloop gate handles off-screen cost) */
  useEffect(() => {
    const el = sectionRef.current
    if (!el || near || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true)
          io.disconnect()
        }
      },
      { rootMargin: '100% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [sectionRef, near])

  return able && near
}

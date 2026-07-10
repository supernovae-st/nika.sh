import { useEffect, useState } from 'react'
import type { StratumKey } from '../../scene/spec-machine-data'

/* ─── useSpecReading · the reading assembles the machine (DOM register) ───────
   The manifesto drum's STRUCK mechanic, repurposed for /spec: the page's
   spec blocks are queried from the real DOM at mount, and each block the
   reader crosses IGNITES its stratum — monotonic for the visit (the accrued-
   liberation pattern, TheDrumSphere.tsx:125). Consumed by the lit TOC ticks,
   the 2D schematic and the stage HUD (and, W1, mirrored by the 3D machine's
   own observer). Two extra reads on the same rAF sweep:
     · current — the scrollspy stratum (the block under the reading line),
       driving the HUD pose readout
     · lit     — the monotonic read set, driving ticks + strata ignition
   The -38% bottom margin means a block ignites when its top clears the lower
   third of the viewport — the reader is actually reading it. An INSTANT jump
   (anchor · End key) can move a block past the boundary without an observer
   callback: the rAF scroll sweep catches it (the drum's jump-sweep law).
   SSR-safe (effects only; the static page renders unlit — the truth). */

export interface SpecReading {
  lit: ReadonlySet<StratumKey>
  current: StratumKey | null
  total: number
}

const EMPTY: SpecReading = { lit: new Set(), current: null, total: 0 }

export function useSpecReading(): SpecReading {
  const [reading, setReading] = useState<SpecReading>(EMPTY)

  useEffect(() => {
    const blocks = Array.from(
      document.querySelectorAll<HTMLElement>('.spec-block[data-stratum]'),
    )
    const total = blocks.length
    if (total === 0) return
    const stratumOf = (el: Element) =>
      (el as HTMLElement).dataset.stratum as StratumKey

    /* dev-only capture override · /spec?lit=N pins the first N strata lit so a
       headless screenshot can prove the ignition states without scrolling */
    let floor = 0
    if (import.meta.env.DEV) {
      const q = new URLSearchParams(window.location.search).get('lit')
      if (q !== null) floor = Math.min(total, Math.max(0, Number(q) || 0))
    }

    const litEls = new Set<Element>()
    let current: StratumKey | null = null
    const publish = () => {
      const lit = new Set<StratumKey>()
      blocks.slice(0, floor).forEach((el) => lit.add(stratumOf(el)))
      litEls.forEach((el) => lit.add(stratumOf(el)))
      setReading((prev) => {
        /* skip the re-render when nothing actually changed (scroll-hot path) */
        if (
          prev.current === current &&
          prev.lit.size === lit.size &&
          prev.total === total
        )
          return prev
        return { lit, current, total }
      })
    }

    /* the ignition observer · crossing the -38% line strikes once, forever */
    let announced = false
    const io = new IntersectionObserver(
      (entries) => {
        let grew = false
        for (const e of entries) {
          const crossed = e.isIntersecting || e.boundingClientRect.bottom < 0
          if (!crossed || litEls.has(e.target)) continue
          litEls.add(e.target)
          io.unobserve(e.target)
          grew = true
        }
        if (!grew && announced) return
        announced = true
        publish()
      },
      { rootMargin: '0px 0px -38% 0px' },
    )
    blocks.forEach((el) => io.observe(el))

    /* the rAF sweep · jump-catch (bottom above viewport = crossed) + the
       scrollspy current (the last block whose top passed the reading line) */
    let raf = 0
    const sweep = () => {
      raf = 0
      const line = window.innerHeight * 0.62
      let grew = false
      let cur: StratumKey | null = null
      for (const el of blocks) {
        const r = el.getBoundingClientRect()
        if (r.top <= line) cur = stratumOf(el)
        if (!litEls.has(el) && r.bottom < 0) {
          litEls.add(el)
          io.unobserve(el)
          grew = true
        }
      }
      if (grew || cur !== current) {
        current = cur
        publish()
      }
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(sweep)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    onScroll()
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      io.disconnect()
    }
  }, [])

  return reading
}

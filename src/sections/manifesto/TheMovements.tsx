import { useEffect, useRef, useState } from 'react'
import type { ManifestoCopy, MfSeg } from '../../content/manifesto-copy'

/* ─── §02 · the movements (W3 pure-move · logic verbatim from Manifesto.tsx)
   Scroll-revealed prose + big statements under the ACID layer (W10c): the
   body warps under FAST scroll and resolves still when the reader settles —
   instability under haste, clarity at rest (the BeyondChat pattern:
   scroll-velocity → feDisplacementMap scale, zero re-renders, reduced-motion
   never references the filter). The svg filter travels with its consumer. */

/* inline emphasis renderer · the copy module's segment idiom ({fg} bright,
   {em} italic) — the manifesto's whole formatting vocabulary. */
const seg = (segs: MfSeg[]) =>
  segs.map((x, i) =>
    typeof x === 'string' ? (
      x
    ) : 'fg' in x ? (
      <span key={i} className="text-[var(--fg)]">{x.fg}</span>
    ) : (
      <em key={i}>{x.em}</em>
    ),
  )

export function TheMovements({ c }: { c: ManifestoCopy }) {
  const acidRef = useRef<HTMLDivElement>(null)
  const acidDispRef = useRef<SVGFEDisplacementMapElement>(null)
  const acidTurbRef = useRef<SVGFETurbulenceElement>(null)
  const [acid, setAcid] = useState<'off' | 'live'>('off')
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const host = acidRef.current
    if (!host) return
    setAcid('live')
    let onScreen = false
    let warp = 0
    let lastY = window.scrollY
    let raf = 0
    let wasStill = false
    const vis = new IntersectionObserver(
      (es) => {
        onScreen = es[0]?.isIntersecting ?? false
        if (onScreen && !raf) raf = requestAnimationFrame(tick)
      },
      { threshold: 0 },
    )
    vis.observe(host)
    const tick = () => {
      const y = window.scrollY
      const vel = Math.abs(y - lastY)
      lastY = y
      warp = Math.max(Math.min(1, vel / 46), warp * 0.87)
      if (warp < 0.004) warp = 0
      const still = warp === 0
      if (!(still && wasStill)) {
        acidDispRef.current?.setAttribute('scale', (warp * 22).toFixed(2))
        acidTurbRef.current?.setAttribute(
          'baseFrequency',
          `${(0.006 + 0.016 * warp).toFixed(4)} ${(0.006 + 0.016 * warp).toFixed(4)}`,
        )
      }
      wasStill = still
      raf = onScreen || warp > 0 ? requestAnimationFrame(tick) : 0
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      vis.disconnect()
    }
  }, [])

  return (
    <>
      {/* the acid filter · inert until data-acid=live (motion-gated above) */}
      <svg width="0" height="0" aria-hidden focusable="false" style={{ position: 'absolute' }}>
        <filter id="mf-acid-warp" x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB">
          <feTurbulence ref={acidTurbRef} type="fractalNoise" baseFrequency="0.006 0.006" numOctaves={2} seed={11} result="noise" />
          <feDisplacementMap ref={acidDispRef} in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      {/* ─── the movements · scroll-revealed prose + big statements — the
          acid layer: unstable under fast scroll, still when read ─── */}
      <div ref={acidRef} data-acid={acid} className="mf-acid mf-prose mx-auto px-6 pt-14 pb-16">
        <div className="rv mf-secreg" aria-hidden>
          <span className="mf-secno">02</span>
          <span className="mf-secrule" />
        </div>
        <p className="rv text-[17.5px] leading-relaxed text-[var(--fg-mute)]">{seg(c.friday)}</p>

        <p className="rv mf-statement mf-grad mf-pull my-20">{c.statement1}</p>

        <p className="rv text-[17.5px] leading-relaxed text-[var(--fg-mute)]">{seg(c.realProblem)}</p>

        <div className="rv my-8 flex flex-wrap justify-center gap-2.5">
          {c.stack.map((s) => (
            <span key={s} className="mf-token">
              {s}
            </span>
          ))}
        </div>

        <p className="rv text-[17.5px] leading-relaxed text-[var(--fg-mute)]">{seg(c.rented)}</p>

        <p className="rv mf-statement mf-grad mf-pull my-20">{c.statement2}</p>

        <p className="rv text-[17.5px] leading-relaxed text-[var(--fg-mute)]">{seg(c.agent)}</p>

        <p className="rv mt-8 text-[17.5px] leading-relaxed text-[var(--fg-mute)]">{seg(c.openSource)}</p>

        <p className="rv mf-statement mf-grad mf-pull my-20">{c.statement3}</p>
      </div>
    </>
  )
}

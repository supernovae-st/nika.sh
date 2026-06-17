import { useEffect, useRef, useState } from 'react'
import { VERSUS } from '../content'
import './v4-home.css'

/* ─── FIG 3.0 · Beyond the chat (theme-dark · THE ACID MOMENT) ─────────────────
   Design doc §3.3 + §6 (FIG 3.0). The "file vs chat / API / platform" comparison
   (reuses the VERSUS copy from content.ts). This is the ONE place the dosed acid
   effect lives (§3.3 EffectBudget): a fluid SVG turbulence/displacement warp that
   INTENSIFIES on fast scroll, then settles to still. Single strong effect, no
   clutter — and gated:

     • prefers-reduced-motion → the filter is NEVER referenced; the layer is a
       plain, still comparison grid. (The `data-acid` flag stays 'off'.)
     • at rest (slow / no scroll) the displacement scale eases to 0 → pixel-still.
     • only fast scroll arms it; a small mono read-out shows it arming/settling so
       it reads as a SYSTEM reacting (an instrument), not a random glitch.

   The warp is driven by a rAF loop that measures scroll VELOCITY and writes the
   filter's <feDisplacementMap scale> + <feTurbulence baseFrequency> directly on
   the SVG nodes (no React re-render per frame). SSR-safe: the SVG filter is inert
   markup until the layer opts into `data-acid="live"` on mount. */

/* warp tuning — kept deliberately subtle (tasteful, not a funhouse). */
const MAX_SCALE = 26 // peak displacement (px) at top scroll velocity
const VEL_FULL = 42 // px/frame of scroll that maps to full warp
const DECAY = 0.86 // per-frame ease of the warp back toward 0 (settles to still)
const BASE_FREQ_REST = 0.006
const BASE_FREQ_PEAK = 0.022

export default function BeyondChat() {
  const ref = useRef<HTMLElement>(null)
  const dispRef = useRef<SVGFEDisplacementMapElement>(null)
  const turbRef = useRef<SVGFETurbulenceElement>(null)
  const acidRef = useRef<HTMLDivElement>(null)
  const readoutRef = useRef<HTMLDivElement>(null)
  /* 'off' = reduced-motion / pre-mount (filter never referenced). 'live' = armed. */
  const [acid, setAcid] = useState<'off' | 'live'>('off')

  /* reveal the rows once (motion-safe; content visible by default). */
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add('v4-in')
            io.disconnect()
            break
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -10% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  /* the acid warp · a scroll-velocity-driven displacement that decays to still.
     Only runs while the section is on-screen (IntersectionObserver gate) and
     motion is allowed. Writes the SVG filter nodes directly — zero re-renders. */
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const section = ref.current
    if (!section) return

    setAcid('live') // opt the layer into filter: url(#…) (motion allowed)

    let onScreen = false
    let warp = 0 // current warp 0..1 (eased)
    let lastY = window.scrollY
    let raf = 0
    let liveShown = false

    const vis = new IntersectionObserver(
      (entries) => {
        onScreen = entries[0]?.isIntersecting ?? false
        if (onScreen && !raf) raf = requestAnimationFrame(tick)
      },
      { threshold: 0 },
    )
    vis.observe(section)

    const setReadout = (live: boolean) => {
      if (live === liveShown) return
      liveShown = live
      readoutRef.current?.setAttribute('data-live', String(live))
    }

    const tick = () => {
      const y = window.scrollY
      const vel = Math.abs(y - lastY)
      lastY = y
      // map this frame's scroll velocity to a target warp, then ease toward it.
      const target = Math.min(1, vel / VEL_FULL)
      warp = Math.max(target, warp * DECAY) // attack fast, release on DECAY
      if (warp < 0.004) warp = 0

      const disp = dispRef.current
      const turb = turbRef.current
      if (disp) disp.setAttribute('scale', (warp * MAX_SCALE).toFixed(2))
      if (turb) {
        const f = (BASE_FREQ_REST + (BASE_FREQ_PEAK - BASE_FREQ_REST) * warp).toFixed(4)
        turb.setAttribute('baseFrequency', `${f} ${f}`)
      }
      // a faint chromatic split rides the warp (diegetic colour, earned by motion)
      acidRef.current?.style.setProperty('--acid', warp.toFixed(3))
      setReadout(warp > 0.08)

      // keep ticking while on-screen OR while still settling back to still
      if (onScreen || warp > 0) {
        raf = requestAnimationFrame(tick)
      } else {
        raf = 0
      }
    }

    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      vis.disconnect()
    }
  }, [])

  return (
    <section ref={ref} id="beyond" aria-labelledby="beyond-title" className="theme-dark v4sec scroll-mt-24">
      {/* the acid filter · inert SVG markup, only referenced once data-acid=live.
          feTurbulence → feDisplacementMap gives the fluid warp; scale/baseFreq are
          written by the rAF loop. aria-hidden + zero size (it's a filter def). */}
      <svg width="0" height="0" aria-hidden focusable="false" style={{ position: 'absolute' }}>
        <filter id="v4-acid-warp" x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB">
          <feTurbulence ref={turbRef} type="fractalNoise" baseFrequency="0.006 0.006" numOctaves={2} seed={7} result="noise" />
          <feDisplacementMap ref={dispRef} in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      <div className="v4sec-wrap">
        <p className="v4sec-fig" data-rise>
          FIG 3.0
        </p>
        <h2 id="beyond-title" className="v4sec-title" data-rise style={{ ['--rise-delay' as string]: '60ms' }}>
          Beyond the chat.
        </h2>
        <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
          A chat, an API call, a platform run — each gives you an <b>answer</b>. A
          file gives you the <b>workflow</b>: the same steps, in the same order, that
          you can read, run again, and diff. Here is what each alternative trades away.
        </p>

        <div className="v4beyond-stage">
          {/* the warp layer wraps the comparison grid · `--acid` rides the warp */}
          <div ref={acidRef} className="v4acid" data-acid={acid}>
            <div className="v4versus-grid" data-rise style={{ ['--rise-delay' as string]: '160ms' }}>
              {VERSUS.map((v) => (
                <article key={v.them} className="v4versus-card">
                  <span className="v4versus-fate" aria-hidden>
                    {v.fate}
                  </span>
                  <p className="v4versus-them">{v.them}</p>
                  <ul className="v4versus-themlist">
                    {v.themLines.map((l) => (
                      <li key={l}>
                        <span className="v4versus-dash" aria-hidden>
                          —
                        </span>
                        {l}
                      </li>
                    ))}
                  </ul>
                  <div className="v4versus-foot">
                    <p className="v4versus-nika">
                      <img src="/nika.svg" alt="" aria-hidden />
                      {v.nika}
                    </p>
                    <ul className="v4versus-nikalist">
                      {v.nikaLines.map((l) => (
                        <li key={l}>
                          <span className="v4versus-tick" aria-hidden>
                            ✓
                          </span>
                          {l}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* the acid read-out · shows the warp arming/settling (systemic, not random) */}
          <div ref={readoutRef} className="v4acid-readout" data-live="false" aria-hidden>
            <span className="v4acid-readout-dot" />
            <span className="v4acid-readout-label">scroll fast — the frame warps, then settles still</span>
          </div>
        </div>
      </div>
    </section>
  )
}

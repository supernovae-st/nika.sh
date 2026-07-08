import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { AuroraContext, type AuroraContextValue } from './aurora-context'
import './edge-aurora.css'

/* ─── EdgeAurora · the intelligence weather (v9 · the soft law) ───────────────
   A soft iridescent light (the Siri-glow palette — violet · pink · periwinkle
   · coral · peach, anchored on the site blue) that hugs the screen frame
   while the center stays transparent. It is THE DRUM of the manifesto: every
   run = a beat of the frame. At rest it is a whisper (CSS breath).

   E7 · RUN MODE (v6 ring law): while a run replays, `data-run` widens the band
   + bloom, speeds the spectrum's travel, and the recorded progress swells the
   rim — the frame IS run visualization. Every task_started beats a brighter
   pulse (the per-verb tint of v5 was retired by the v6 full-spectrum ring).
   The verdict sweeps one bright arc (success) or flashes danger (failure /
   permits denial) INSIDE a ~1.2s hold, then the frame decays back to the
   idle spectrum — idle is byte-identical to pre-E7.

   Every API call mutates CSS custom properties / data attributes on the
   aurora element DIRECTLY (via ref) — NO React re-render per event.

   SSR-safe: the visual is pure CSS; browser access lives in effects and
   event-time callbacks only. */

const REST_INTENSITY = 0.13 /* the resting PRESENCE (arc 9 · reverses « pas tout
    le temps là ») · the iridescence is quietly ALWAYS on, living on the dark
    bezel below it — a physical dark screen-edge that catches light. Still a
    diffuse glow, never a hard border; the run floor (0.26) + pulses (0.38)
    clearly rise above it. Matches the CSS fallback so post-pulse decay lands
    where the prerender started. */
/** run mode raises the resting floor — the frame must clearly speak while a
    run plays (the drum), yet stay a diffuse glow, never a hard border: the
    presence comes from opacity on a blur-melted rim, not from sharpness. */
const RUN_REST_INTENSITY = 0.26
/** Peak the halo jumps to on a pulse before it decays. Calibrated for wide-
    gamut displays: P3 renders these hues far more vivid than headless
    captures — every ceiling here deliberately undershoots what sRGB
    screenshots suggest. */
const PULSE_INTENSITY = 0.38
/** Decay back to rest takes ~450ms (the sharper v5 beat). */
const DECAY_MS = 450
/** after workflow_completed the bloom HOLDS ~1.2s (the verdict sweep plays
    inside it), then the frame decays back to the quiet blue rest */
const RUN_HOLD_MS = 1200
const DANGER_MS = 650
/** the HELLO · one soft spectral breath on first paint, then the frame goes
    quiet — « pas tout le temps là » : it announces itself once and only
    returns when events speak. */
const HELLO_INTENSITY = 0.32
const HELLO_DELAY_MS = 400

export function AuroraProvider({ children }: { children: ReactNode }) {
  const elRef = useRef<HTMLDivElement | null>(null)

  /* Live decay state, kept in refs so the API mutates the DOM (not React). */
  const intensityRef = useRef(REST_INTENSITY)
  const restRef = useRef(REST_INTENSITY)
  const rafRef = useRef<number | null>(null)
  const lastTsRef = useRef(0)
  const tickRef = useRef<(ts: number) => void>(() => {})
  const sweepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dangerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* the HELLO breath · once per mount, motion-gated */
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return
    const t = setTimeout(() => {
      const el = elRef.current
      if (!el) return
      intensityRef.current = HELLO_INTENSITY
      el.style.setProperty('--aurora-intensity', String(HELLO_INTENSITY))
      lastTsRef.current = 0
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(tickRef.current)
    }, HELLO_DELAY_MS)
    return () => clearTimeout(t)
  }, [])

  /* Tab hidden → park the ambient animations (data-idle). The ring's slow
     drift is a feature while WATCHED; it composits for nobody when hidden. */
  useEffect(() => {
    const onVis = () => {
      const el = elRef.current
      if (!el) return
      if (document.hidden) el.dataset.idle = 'on'
      else delete el.dataset.idle
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  /* Install the decay-loop frame fn once on mount. */
  useEffect(() => {
    const tick = (ts: number) => {
      const el = elRef.current
      const last = lastTsRef.current || ts
      const dt = ts - last
      lastTsRef.current = ts

      // exponential ease toward the CURRENT rest floor (idle 0.04 · run 0.36)
      const rest = restRef.current
      const k = 1 - Math.exp((-dt / DECAY_MS) * 4)
      intensityRef.current += (rest - intensityRef.current) * k

      if (el) {
        el.style.setProperty('--aurora-intensity', intensityRef.current.toFixed(4))
      }

      if (Math.abs(intensityRef.current - rest) > 0.002) {
        rafRef.current = requestAnimationFrame(tickRef.current)
      } else {
        if (el) el.style.setProperty('--aurora-intensity', String(rest))
        rafRef.current = null
        lastTsRef.current = 0
      }
    }
    tickRef.current = tick

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      if (sweepTimerRef.current != null) clearTimeout(sweepTimerRef.current)
      if (dangerTimerRef.current != null) clearTimeout(dangerTimerRef.current)
    }
  }, [])

  /* (re)start the decay loop toward the current rest floor */
  const arm = useCallback(() => {
    lastTsRef.current = 0
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(tickRef.current)
    }
  }, [])

  const pulse = useCallback(() => {
    if (typeof window === 'undefined') return
    intensityRef.current = PULSE_INTENSITY
    const el = elRef.current
    if (el) el.style.setProperty('--aurora-intensity', String(PULSE_INTENSITY))
    arm()
  }, [arm])

  const runStart = useCallback(() => {
    if (typeof window === 'undefined') return
    const el = elRef.current
    if (!el) return
    if (sweepTimerRef.current != null) clearTimeout(sweepTimerRef.current)
    el.dataset.run = 'on'
    el.style.setProperty('--aurora-progress', '0')
    restRef.current = RUN_REST_INTENSITY
    arm()
  }, [arm])

  /* v6 ring law: the spectrum frame carries no per-verb tint — a verb tick IS
     the pulse (the beat still lands per task_started; the `verb` argument
     stays in the API so a verb-tinted surface can return without changing
     every caller). */
  const verbTick = useCallback<AuroraContextValue['verbTick']>(() => {
    pulse()
  }, [pulse])

  const runProgress = useCallback((p: number) => {
    const el = elRef.current
    if (!el) return
    el.style.setProperty('--aurora-progress', String(Math.min(1, Math.max(0, p))))
  }, [])

  const flashDanger = useCallback(() => {
    if (typeof window === 'undefined') return
    const el = elRef.current
    if (!el) return
    el.dataset.flash = 'danger'
    if (dangerTimerRef.current != null) clearTimeout(dangerTimerRef.current)
    dangerTimerRef.current = setTimeout(() => {
      delete el.dataset.flash
    }, DANGER_MS)
  }, [])

  const runEnd = useCallback(
    (verdict: 'success' | 'failure') => {
      if (typeof window === 'undefined') return
      const el = elRef.current
      if (!el) return
      /* the bloom HOLDS through the verdict beat — the four-verb frame stays
         bright while the sweep (or the danger flash) plays inside it, THEN
         decays back to the quiet blue rest (~1.2s after workflow_completed) */
      if (verdict === 'failure') {
        flashDanger()
      } else {
        el.dataset.run = 'sweep'
      }
      if (sweepTimerRef.current != null) clearTimeout(sweepTimerRef.current)
      sweepTimerRef.current = setTimeout(() => {
        delete el.dataset.run
        restRef.current = REST_INTENSITY
        arm()
      }, RUN_HOLD_MS)
    },
    [arm, flashDanger],
  )

  /* ABORT · leave run mode with NO verdict beat (scrub-back out of the run
     window · unmount mid-replay · route change). Only run-mode state resets —
     an in-flight danger flash keeps its own timer (TheBoundary's beat is not
     run-scoped and must not be cut). */
  const runStop = useCallback(() => {
    if (typeof window === 'undefined') return
    const el = elRef.current
    if (!el) return
    if (sweepTimerRef.current != null) clearTimeout(sweepTimerRef.current)
    sweepTimerRef.current = null
    delete el.dataset.run
    el.style.setProperty('--aurora-progress', '0')
    restRef.current = REST_INTENSITY
    arm()
  }, [arm])

  const value = useMemo<AuroraContextValue>(
    () => ({ pulse, runStart, verbTick, runProgress, flashDanger, runEnd, runStop }),
    [pulse, runStart, verbTick, runProgress, flashDanger, runEnd, runStop],
  )

  return (
    <AuroraContext.Provider value={value}>
      {children}
      <EdgeAurora ref={elRef} />
    </AuroraContext.Provider>
  )
}

/* ─── the visual element ──────────────────────────────────────────────────────
   A position:fixed; inset:0; pointer-events:none layer (z-index 60: above
   content, below any modal). The ring + center-mask live in edge-aurora.css. */
export function EdgeAurora({
  ref,
}: {
  ref?: React.Ref<HTMLDivElement>
}) {
  return (
    <>
    {/* arc 9 · THE BEZEL — the « dark skeuo » material: a STATIC dark physical
        screen-edge (deep inner-shadow body + a hairline bevel: top catch-light,
        bottom shade) that is ALWAYS on, below the iridescence (z-59 < the
        aurora's z-60), so the coloured light blooms ON a dark bezel. No
        animation → deterministic under reduced-motion (goldens). */}
    <div className="edge-bezel" aria-hidden="true" />
    <div ref={ref} className="edge-aurora" aria-hidden="true" data-edge-aurora>
      {/* v8 · THE DEPTH SHEET — a third, much deeper ring behind the bloom:
          same canonical atomic ring mask, huge padding + heavy blur, counter-
          sloshing slowly. It reads as the aurora having a body BEHIND the
          viewport edge, not just a rim ON it. Same intensity law (CSS var). */}
      <span className="edge-aurora-depth" />
      {/* v10 · THE LINING — the one near-crisp element (the Apple read: the
          colours stay diffuse, a faint WHITE line owns the definition). Same
          canonical atomic ring mask, hairline padding, tiny blur. */}
      <span className="edge-aurora-lining" />
    </div>
    </>
  )
}

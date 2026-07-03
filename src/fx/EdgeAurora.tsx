import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { AuroraContext, type AuroraContextValue, type AuroraVerb } from './aurora-context'
import './edge-aurora.css'

/* ─── EdgeAurora · the reactive frame halo (v5 · ONE blue · E7 run mode) ──────
   A blurred blue ring that hugs the screen frame while the center stays
   transparent. It is THE DRUM of the manifesto: every run = a beat of the
   frame. At rest it is almost extinguished (single blue family · CSS breath).

   E7 · RUN MODE · THE VERB BLOOM (H2 retune, oryzo ask): while a run replays,
   the frame becomes run visualization — `data-run` is the runActive switch
   that swaps the ::before conic into the 4-verb wheel (slow rotation) and a
   sharper ::after arc carries the ACTIVE verb's hue (the one sanctioned
   verb-hue surface, design doc §3.4 · the oryzo two-ring composition: wide
   haze + crisp rim). Every task_started beats a brighter pulse. The verdict
   sweeps one bright arc (success) or flashes danger (failure / permits
   denial) INSIDE a ~1.2s hold, then the frame decays back to the idle blue —
   idle is byte-identical to pre-E7.

   Every API call mutates CSS custom properties / data attributes on the
   aurora element DIRECTLY (via ref) — NO React re-render per event.

   SSR-safe: the visual is pure CSS; browser access lives in effects and
   event-time callbacks only. */

const REST_INTENSITY = 0.2 /* the ambient spectrum frame · clearly present at rest
    (v6 ring law · matches the CSS fallback so post-pulse decay lands where
    the prerender started — the frame never fades below its resting voice) */
/** run mode raises the resting floor — the VERB BLOOM. The four-hue frame must
    be unmistakable at 1440 while a run plays (operator's oryzo ask), so the
    floor sits at ~0.36 (the run.css mask keeps the center readable). */
const RUN_REST_INTENSITY = 0.36
/** Peak the halo jumps to on a pulse before it decays. */
const PULSE_INTENSITY = 0.75
/** Decay back to rest takes ~450ms (the sharper v5 beat). */
const DECAY_MS = 450
/** after workflow_completed the bloom HOLDS ~1.2s (the verdict sweep plays
    inside it), then the frame decays back to the quiet blue rest */
const RUN_HOLD_MS = 1200
const DANGER_MS = 650

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
  /* the verb hues, read once from the live token surface (tokens.css) */
  const huesRef = useRef<Record<AuroraVerb, string> | null>(null)

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

  const verbTick = useCallback(
    (verb: AuroraVerb) => {
      if (typeof window === 'undefined') return
      const el = elRef.current
      if (!el) return
      if (!huesRef.current) {
        const cs = getComputedStyle(document.documentElement)
        huesRef.current = {
          infer: cs.getPropertyValue('--verb-infer').trim() || '#5b8cff',
          exec: cs.getPropertyValue('--verb-exec').trim() || '#ff7a3c',
          invoke: cs.getPropertyValue('--verb-invoke').trim() || '#22d3ee',
          agent: cs.getPropertyValue('--verb-agent').trim() || '#b07bff',
        }
      }
      el.style.setProperty('--aurora-verb', huesRef.current[verb])
      pulse()
    },
    [pulse],
  )

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

  const value = useMemo<AuroraContextValue>(
    () => ({ pulse, runStart, verbTick, runProgress, flashDanger, runEnd }),
    [pulse, runStart, verbTick, runProgress, flashDanger, runEnd],
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
  return <div ref={ref} className="edge-aurora" aria-hidden="true" data-edge-aurora />
}

import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { AuroraContext, type AuroraContextValue } from './aurora-context'
import './edge-aurora.css'

/* ─── EdgeAurora · the v4 signature (the reactive frame halo) ─────────────────
   A blurred cyan→violet→cyan ring that hugs the screen frame while the center
   stays transparent (the "Siri / Oryzo" effect · design doc §3.2). It is THE
   DRUM of the manifesto: every run = a beat of the frame.

   - At rest (~99% of the time) the halo is almost extinguished and breathes
     slowly (CSS keyframes · §3.2). Under prefers-reduced-motion it is static.
   - On a workflow event, `pulse()` briefly intensifies the halo then lets it
     decay back to rest (~700ms). Future code wires pulse() to run-node
     completion; this task only exposes it.

   pulse() mutates the `--aurora-intensity` CSS custom property on the aurora
   element DIRECTLY (via a ref) — there is NO React re-render per pulse, so it
   stays cheap even when beaten many times per second.

   SSR-safe: the visual is pure CSS, so it renders during the Node prerender
   (vite-plugin-react-ssg) untouched. The only browser access (matchMedia, the
   rAF decay loop) lives in useEffect / event-time callbacks, never at render. */

const REST_INTENSITY = 0.06
/** Peak the halo jumps to on a pulse before it decays. */
const PULSE_INTENSITY = 0.85
/** Decay back to rest takes ~700ms (design §3.2). */
const DECAY_MS = 700

export function AuroraProvider({ children }: { children: ReactNode }) {
  const elRef = useRef<HTMLDivElement | null>(null)

  /* Live decay state, kept in refs so pulse() mutates the DOM (not React).
     `intensityRef` is the live intensity; the rAF loop eases it toward REST.
     `tickRef` holds the frame fn so the loop can re-schedule itself without a
     useCallback self-reference (which trips react-hooks/immutability). */
  const intensityRef = useRef(REST_INTENSITY)
  const rafRef = useRef<number | null>(null)
  const lastTsRef = useRef(0)
  const tickRef = useRef<(ts: number) => void>(() => {})

  /* Install the decay-loop frame fn + the stable pulse() once on mount.
     Browser-only work (rAF, DOM writes) lives here, never at render. */
  useEffect(() => {
    const tick = (ts: number) => {
      const el = elRef.current
      const last = lastTsRef.current || ts
      const dt = ts - last
      lastTsRef.current = ts

      // exponential ease toward rest; reaches ~rest within ~DECAY_MS
      const k = 1 - Math.exp((-dt / DECAY_MS) * 4)
      intensityRef.current += (REST_INTENSITY - intensityRef.current) * k

      if (el) {
        el.style.setProperty('--aurora-intensity', intensityRef.current.toFixed(4))
      }

      // stop the loop once we've settled back to rest (within a hair)
      if (Math.abs(intensityRef.current - REST_INTENSITY) > 0.002) {
        rafRef.current = requestAnimationFrame(tickRef.current)
      } else {
        if (el) el.style.setProperty('--aurora-intensity', String(REST_INTENSITY))
        rafRef.current = null
        lastTsRef.current = 0
      }
    }
    tickRef.current = tick

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  /* The stable pulse(): jump intensity to the peak, (re)start the decay loop.
     Guards on window so it is inert if ever called during prerender. */
  const pulse = useCallback(() => {
    if (typeof window === 'undefined') return
    intensityRef.current = PULSE_INTENSITY
    const el = elRef.current
    if (el) el.style.setProperty('--aurora-intensity', String(PULSE_INTENSITY))
    if (rafRef.current == null) {
      lastTsRef.current = 0
      rafRef.current = requestAnimationFrame(tickRef.current)
    }
  }, [])

  const value = useMemo<AuroraContextValue>(() => ({ pulse }), [pulse])

  return (
    <AuroraContext.Provider value={value}>
      {children}
      <EdgeAurora ref={elRef} />
    </AuroraContext.Provider>
  )
}

/* ─── the visual element ──────────────────────────────────────────────────────
   A position:fixed; inset:0; pointer-events:none layer (z-index 60: above
   content, below any modal). The ring + center-mask live in edge-aurora.css.
   Exported standalone too, so a caller may render it themselves and place the
   provider elsewhere; AuroraProvider renders one for the common case. */
export function EdgeAurora({
  ref,
}: {
  ref?: React.Ref<HTMLDivElement>
}) {
  return <div ref={ref} className="edge-aurora" aria-hidden="true" data-edge-aurora />
}

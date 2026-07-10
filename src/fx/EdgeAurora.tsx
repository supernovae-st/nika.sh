import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { AuroraContext, type AuroraContextValue } from './aurora-context'
import './edge-aurora.css'

/* ─── THE MACHINED FRAME · provider (v10 · the nuke) ──────────────────────────
   The frame is static hardware (edge-aurora.css); this provider keeps the
   SAME 7-method drum API the run surfaces already speak (TheRun ·
   ScrollMorph · TheBoundary — zero caller changes) and drives exactly TWO
   custom properties + one data attribute on the frame element, via ref:

     --run-glow  0..1 · the lining's presence (0 at rest — no lining)
     --run-p     0..1 · how far around the frame the ring has drawn
     data-danger       · flips the ring to the danger coral while set

   One rAF decay loop eases the glow toward its floor (run: 0.8 · idle: 0).
   ⚠ the loop is ALWAYS scheduled through the fire-time wrapper `tickNow`,
   never `tickRef.current` by value — the arc-10a law: scheduling the value
   captures the initial no-op forever and the decay dies for the session.

   Every API call mutates the DOM directly — NO React re-render per event.
   SSR-safe: browser access lives in callbacks only. */

/** run mode's resting glow — the ring clearly present while a run plays */
const RUN_FLOOR = 0.8
/** a task beat kicks the glow above the floor, then it decays back */
const BEAT_GLOW = 1
/** decay back toward the floor takes ~380ms (the drum's sharp beat) */
const DECAY_MS = 380
/** after runEnd the full ring HOLDS ~1.2s (the verdict reads), then fades */
const HOLD_MS = 1200
const DANGER_MS = 650

export function AuroraProvider({ children }: { children: ReactNode }) {
  const elRef = useRef<HTMLDivElement | null>(null)

  const glowRef = useRef(0)
  const floorRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const lastTsRef = useRef(0)
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dangerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const tickRef = useRef<(ts: number) => void>(() => {})
  const tickNow = useCallback((ts: number) => tickRef.current(ts), [])

  /* the decay body installs in an effect (assigning a ref during render
     trips the compiler rule; the wrapper reads it at fire time anyway) */
  useEffect(() => {
    tickRef.current = (ts: number) => {
      const el = elRef.current
      if (!el) {
        rafRef.current = null
        return
      }
      const dt = lastTsRef.current ? ts - lastTsRef.current : 16
      lastTsRef.current = ts
      const floor = floorRef.current
      const g = glowRef.current
      const next = floor + (g - floor) * Math.exp(-dt / (DECAY_MS / 3))
      glowRef.current = Math.abs(next - floor) < 0.005 ? floor : next
      el.style.setProperty('--run-glow', glowRef.current.toFixed(3))
      if (glowRef.current !== floor) {
        rafRef.current = requestAnimationFrame(tickNow)
      } else {
        rafRef.current = null
        lastTsRef.current = 0
      }
    }
  }, [tickNow])

  const kick = useCallback(
    (to: number) => {
      glowRef.current = Math.max(glowRef.current, to)
      elRef.current?.style.setProperty('--run-glow', glowRef.current.toFixed(3))
      lastTsRef.current = 0
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(tickNow)
    },
    [tickNow],
  )

  const api = useMemo<AuroraContextValue>(() => {
    const setP = (p: number) =>
      elRef.current?.style.setProperty('--run-p', Math.min(1, Math.max(0, p)).toFixed(4))
    const clearHold = () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
    const fadeOut = () => {
      floorRef.current = 0
      kick(glowRef.current) /* arm the loop; it decays to the new floor */
      /* reset the ring AFTER the fade so the next run draws from zero */
      holdTimerRef.current = setTimeout(() => setP(0), 400)
    }
    return {
      pulse: () => kick(0.5),
      runStart: () => {
        clearHold()
        floorRef.current = RUN_FLOOR
        setP(0)
        elRef.current?.setAttribute('data-run', 'on')
        kick(RUN_FLOOR)
      },
      verbTick: () => kick(BEAT_GLOW),
      runProgress: (p: number) => setP(p),
      flashDanger: () => {
        const el = elRef.current
        if (!el) return
        el.setAttribute('data-danger', 'on')
        kick(BEAT_GLOW)
        if (dangerTimerRef.current) clearTimeout(dangerTimerRef.current)
        dangerTimerRef.current = setTimeout(() => el.removeAttribute('data-danger'), DANGER_MS)
      },
      runEnd: (verdict: 'success' | 'failure') => {
        clearHold()
        const el = elRef.current
        if (!el) return
        /* the verdict · the ring completes (success sweeps it full; failure
           flashes danger on whatever drew), holds a beat, then fades */
        if (verdict === 'success') setP(1)
        else {
          el.setAttribute('data-danger', 'on')
          if (dangerTimerRef.current) clearTimeout(dangerTimerRef.current)
          dangerTimerRef.current = setTimeout(() => el.removeAttribute('data-danger'), DANGER_MS)
        }
        kick(BEAT_GLOW)
        el.removeAttribute('data-run')
        holdTimerRef.current = setTimeout(fadeOut, HOLD_MS)
      },
      runStop: () => {
        clearHold()
        elRef.current?.removeAttribute('data-run')
        elRef.current?.removeAttribute('data-danger')
        fadeOut()
      },
    }
  }, [kick])

  return (
    <AuroraContext.Provider value={api}>
      {children}
      {/* the frame · fixed hardware (the slab floods to the viewport edge);
          [data-edge-aurora] is the harness hook (shoot-routes run states) */}
      <div ref={elRef} className="frame" data-edge-aurora aria-hidden>
        <span className="frame-lining" />
      </div>
    </AuroraContext.Provider>
  )
}

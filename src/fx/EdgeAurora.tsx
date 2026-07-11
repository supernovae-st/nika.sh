import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { AuroraContext, type AuroraContextValue } from './aurora-context'
import './edge-aurora.css'

/* ─── THE MACHINED FRAME · provider (v10 · the nuke) ──────────────────────────
   The frame is static hardware (edge-aurora.css); this provider keeps the
   drum API the run surfaces already speak (TheRun · ScrollMorph ·
   TheBoundary — zero caller changes; the caller-less pulse() died in the
   polish pass) and drives exactly TWO custom properties + one data
   attribute on the frame element, via ref:

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
  /* reduced-motion = the settled register: the ring stays INFO (present
     during a run, coral on danger, gone after) but never eases and never
     beats — every write snaps straight to the state's floor. */
  const reducedRef = useRef(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => {
      reducedRef.current = mq.matches
    }
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

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
      /* settled register: no transient — the glow IS the state's floor */
      if (reducedRef.current) {
        glowRef.current = floorRef.current
        elRef.current?.style.setProperty('--run-glow', glowRef.current.toFixed(3))
        return
      }
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
      /* reset the ring AFTER the fade so the next run draws from zero — and
         drop a held failure coral here too (glow ≈ 0: both are invisible) */
      holdTimerRef.current = setTimeout(() => {
        setP(0)
        elRef.current?.removeAttribute('data-danger')
      }, 400)
    }
    return {
      runStart: () => {
        clearHold()
        /* a stale wall flash must not leak coral into a fresh run */
        if (dangerTimerRef.current) clearTimeout(dangerTimerRef.current)
        dangerTimerRef.current = null
        elRef.current?.removeAttribute('data-danger')
        floorRef.current = RUN_FLOOR
        elRef.current?.setAttribute('data-run', 'on')
        setP(0)
        kick(RUN_FLOOR)
      },
      verbTick: () => kick(BEAT_GLOW),
      runProgress: (p: number) => setP(p),
      flashDanger: () => {
        const el = elRef.current
        if (!el) return
        el.setAttribute('data-danger', 'on')
        /* outside a run --run-p is 0 and the conic paints NOTHING — the
           permits wall flashes the FULL ring instead (inside a run, the
           partially-drawn ring flashes as-is: « how far it got » reads) */
        if (!el.hasAttribute('data-run')) setP(1)
        kick(BEAT_GLOW)
        if (dangerTimerRef.current) clearTimeout(dangerTimerRef.current)
        dangerTimerRef.current = setTimeout(() => {
          el.removeAttribute('data-danger')
          /* glow has decayed to ~0.006 by now — the reset is invisible */
          if (!el.hasAttribute('data-run')) setP(0)
        }, DANGER_MS)
      },
      runEnd: (verdict: 'success' | 'failure') => {
        clearHold()
        const el = elRef.current
        if (!el) return
        /* the verdict · success completes the ring full; failure turns
           whatever drew coral and HOLDS it coral through the whole verdict
           beat (a pending wall-flash timer must not strip it mid-hold — the
           fade's invisible reset clears it instead). */
        el.removeAttribute('data-run')
        if (verdict === 'success') setP(1)
        else {
          if (dangerTimerRef.current) clearTimeout(dangerTimerRef.current)
          dangerTimerRef.current = null
          el.setAttribute('data-danger', 'on')
        }
        kick(BEAT_GLOW)
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

import { createContext, useContext } from 'react'

/* ─── the machined frame · drum context ───────────────────────────────────────
   Shares the frame's run-drum API with the whole tree. Every call mutates CSS
   custom properties / data attributes on the frame element directly (via ref)
   — there is NO React re-render per event, so the drum stays cheap under
   rapid beats.

   The frame itself is static hardware (edge-aurora.css); the ONE dynamic
   signal is the run: while a replay plays, the lining ring DRAWS around the
   screen with the recorded progress and beats brighter on each task.

   Split out of EdgeAurora.tsx so that file exports only components (keeps the
   react-refresh/only-export-components lint clean under --max-warnings 0). */

/** the 4 canonical verbs — kept in the API for a future verb-tinted surface
    (the machined frame renders no per-verb tint: one ink, one ring) */
export type AuroraVerb = 'infer' | 'exec' | 'invoke' | 'agent'

/** Stable no-op defaults so the hooks are safe outside a provider (e.g. during
    isolated prerender of a subtree) — calls are then inert. */
const noop = (): void => {}

export type AuroraContextValue = {
  /** Enter run mode: the lining appears at its run floor, the ring rewinds. */
  runStart: () => void
  /** A task started — the ring beats brighter, then decays to the floor (the
      verb argument is kept for a future verb-tinted surface). */
  verbTick: (verb: AuroraVerb) => void
  /** 0..1 · the ring draws with the RUN's recorded progress, not a timer. */
  runProgress: (p: number) => void
  /** The permits-wall beat: one danger flash (~650ms) — the full ring in
      coral at rest, the partially-drawn ring in coral during a run. */
  flashDanger: () => void
  /** Leave run mode: success SWEEPS the ring full · failure flashes danger on
      whatever drew; the verdict holds ~1.2s, then the lining fades out. */
  runEnd: (verdict: 'success' | 'failure') => void
  /** ABORT run mode with no verdict beat — the replay was interrupted (scrubbed
      back above the run window · surface unmounted · route change). The lining
      fades straight out; without this the lit ring would outlive the run it
      visualized. */
  runStop: () => void
}

const NOOP_VALUE: AuroraContextValue = {
  runStart: noop,
  verbTick: noop,
  runProgress: noop,
  flashDanger: noop,
  runEnd: noop,
  runStop: noop,
}

export const AuroraContext = createContext<AuroraContextValue>(NOOP_VALUE)

/** Returns the run-drum API the run surfaces speak. */
export function useAurora(): AuroraContextValue {
  return useContext(AuroraContext)
}

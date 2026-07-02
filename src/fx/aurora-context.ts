import { createContext, useContext } from 'react'

/* ─── EdgeAurora context ──────────────────────────────────────────────────────
   Shares the frame-halo API with the whole tree. Every call mutates CSS custom
   properties / data attributes on the aurora element directly (via ref) — there
   is NO React re-render per event, so the drum stays cheap under rapid beats.

   v5 run mode (E7): while a run replays, the frame IS run visualization — the
   one surface where the 4 verb hues are sanctioned (design doc §3.4). Idle
   chrome stays single-blue and byte-identical to the rest state.

   Split out of EdgeAurora.tsx so that file exports only components (keeps the
   react-refresh/only-export-components lint clean under --max-warnings 0). */

/** the 4 canonical verb hues — sanctioned ONLY inside live-run visualization */
export type AuroraVerb = 'infer' | 'exec' | 'invoke' | 'agent'

/** Stable no-op defaults so the hooks are safe outside a provider (e.g. during
    isolated prerender of a subtree) — calls are then inert. */
const noop = (): void => {}

export type AuroraContextValue = {
  /** Briefly intensify the halo, then decay back to rest. Cheap · no re-render. */
  pulse: () => void
  /** Enter run mode: the frame becomes the 4-verb wheel, rest floor rises. */
  runStart: () => void
  /** The active verb changed — the highlight arc takes its hue (+ a pulse). */
  verbTick: (verb: AuroraVerb) => void
  /** 0..1 · the frame breathes with the RUN, not a timer. */
  runProgress: (p: number) => void
  /** The permits-wall beat: one danger flash (600ms), then back. */
  flashDanger: () => void
  /** Leave run mode: success sweeps one bright arc then decays; failure flashes. */
  runEnd: (verdict: 'success' | 'failure') => void
}

const NOOP_VALUE: AuroraContextValue = {
  pulse: noop,
  runStart: noop,
  verbTick: noop,
  runProgress: noop,
  flashDanger: noop,
  runEnd: noop,
}

export const AuroraContext = createContext<AuroraContextValue>(NOOP_VALUE)

/** Returns a stable `pulse()` that beats the edge aurora. */
export function useAuroraPulse(): AuroraContextValue['pulse'] {
  return useContext(AuroraContext).pulse
}

/** Returns the full run-visualization API (E7). */
export function useAurora(): AuroraContextValue {
  return useContext(AuroraContext)
}

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
  /** A task started — the frame beats a brighter pulse (v6 spectrum: no
      per-verb tint; the verb argument is kept for a future tinted surface). */
  verbTick: (verb: AuroraVerb) => void
  /** 0..1 · the frame breathes with the RUN, not a timer. */
  runProgress: (p: number) => void
  /** The permits-wall beat: one danger flash (600ms), then back. */
  flashDanger: () => void
  /** Leave run mode: the bloom HOLDS ~1.2s (success sweeps one bright arc ·
      failure flashes danger inside it), then decays to the quiet blue rest. */
  runEnd: (verdict: 'success' | 'failure') => void
  /** ABORT run mode with no verdict beat — the replay was interrupted (scrubbed
      back above the run window · surface unmounted · route change). The frame
      decays straight back to the idle rest; without this the loud run frame
      would outlive the run it visualized. */
  runStop: () => void
}

const NOOP_VALUE: AuroraContextValue = {
  pulse: noop,
  runStart: noop,
  verbTick: noop,
  runProgress: noop,
  flashDanger: noop,
  runEnd: noop,
  runStop: noop,
}

export const AuroraContext = createContext<AuroraContextValue>(NOOP_VALUE)

/* ── the ROUTE tone (arc 9i · UX socratic) · « selon où on est », site-wide ────
   Off the home, no [data-aurora] section owns the viewport — the contour used
   to sit on a static cool default everywhere. Each route now declares the
   register its contour reads: reading surfaces go light (a quiet frame),
   the playground goes deep (an app), reference stays cool, the on-ramps go
   blue, the manifesto warms. Pure — RootLayout stamps it on <html>, the
   EdgeAurora scroll-spy reads it as the fallback tone. */
const ROUTE_TONES: [RegExp, string][] = [
  [/^\/(blog|learn)(\/|$)/, 'light'],
  [/^\/play(\/|$)/, 'deep'],
  [/^\/(spec|errors|changelog)(\/|$)/, 'cool'],
  [/^\/(install|convert|use-cases)(\/|$)/, 'blue'],
  [/^\/([a-z-]+\/)?manifesto(\/|$)/, 'warm'],
]

/** the contour tone a route declares (null → the neutral default) */
export function toneForRoute(pathname: string): string | null {
  for (const [re, tone] of ROUTE_TONES) if (re.test(pathname)) return tone
  return null
}

/** Returns a stable `pulse()` that beats the edge aurora. */
export function useAuroraPulse(): AuroraContextValue['pulse'] {
  return useContext(AuroraContext).pulse
}

/** Returns the full run-visualization API (E7). */
export function useAurora(): AuroraContextValue {
  return useContext(AuroraContext)
}

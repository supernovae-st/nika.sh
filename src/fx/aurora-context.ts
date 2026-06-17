import { createContext, useContext } from 'react'

/* ─── EdgeAurora context ──────────────────────────────────────────────────────
   Shares a single stable `pulse()` with the whole tree. `pulse()` briefly
   intensifies the edge halo then lets it decay back to rest (~700ms) — it does
   this by mutating the `--aurora-intensity` CSS custom property on the aurora
   element directly (no React re-render per pulse · design doc §3.2). Future
   code calls `pulse()` when a run node completes (the "drum" beat).

   Split out of EdgeAurora.tsx so that file exports only components (keeps the
   react-refresh/only-export-components lint clean under --max-warnings 0). */

/** Stable no-op default so `useAuroraPulse()` is safe outside a provider (e.g.
    during isolated prerender of a subtree) — calling pulse() is then inert. */
const noop = (): void => {}

export type AuroraContextValue = {
  /** Briefly intensify the halo, then decay back to rest. Cheap · no re-render. */
  pulse: () => void
}

export const AuroraContext = createContext<AuroraContextValue>({ pulse: noop })

/** Returns a stable `pulse()` that beats the edge aurora. */
export function useAuroraPulse(): AuroraContextValue['pulse'] {
  return useContext(AuroraContext).pulse
}

/* ─── adrs-access · the ONLY door to the engine's decision record ────────────
   (the lessons-access recipe) adrs.generated.ts is ~25KB: 71 decisions with
   their titles, dates, layers and edge counts. One page renders it, so it
   reaches the client as an async chunk — SSG reads it through the SSR-only
   await, the register prerenders whole, and a SPA hop pulls the chunk once.

   Without this door the record lands in the entry bundle, where it cost
   6.6KB gz and left 200 bytes of headroom under the size budget.

   The bundle-safety gate lives in adrs.test.ts: no static import of
   adrs.generated outside this module (and its own judge). */
import type { Adr } from '../content/adrs.generated'

type Record_ = { adrs: Adr[]; pin: { release_tag: string; commit: string }; counts: Record<string, number> }

let SSR: Record_ | null = null
if (import.meta.env.SSR) {
  const m = await import('../content/adrs.generated')
  SSR = { adrs: m.ADRS, pin: m.ADRS_PIN, counts: m.ADR_STATUS_COUNTS }
}

/** the whole record at SSG time (null on the client · ride the island) */
export const ssrAdrs = (): Record_ | null => SSR

/** the record on the client · the async chunk, once */
export const loadAdrs = async (): Promise<Record_> => {
  const m = await import('../content/adrs.generated')
  return { adrs: m.ADRS, pin: m.ADRS_PIN, counts: m.ADR_STATUS_COUNTS }
}

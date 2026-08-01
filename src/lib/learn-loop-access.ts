/* ─── learn-loop-access · the ONLY door to the loop transcripts ──────────────
   (the anatomy-access recipe · register diet) learn-loop.ts carries five
   verbatim terminal captures — real bytes, and bytes do not compress into
   nothing: importing it directly put 2.1 KB gz of /learn into the bundle
   EVERY page pays, and the size budget refused (407.0 over 406). It reaches
   the client only as an async chunk: SSG reads it through the SSR-only
   await, so the prerendered HTML carries every transcript (crawlers and
   no-JS readers see them all); the hydrating page rides its byte island and
   a SPA hop pulls the chunk once.

   The bundle-safety gate lives in learn-loop.test.ts: no static import of
   learn-loop outside this module. */

import type { LoopDoor } from '../content/learn-loop'

let SSR_DOORS: LoopDoor[] | null = null
if (import.meta.env.SSR) {
  const m = await import('../content/learn-loop')
  SSR_DOORS = m.LOOP_DOORS
}

/** the five doors at SSG time (null on the client — ride the island) */
export const ssrLoopDoors = (): LoopDoor[] | null => SSR_DOORS

/** the five doors on the client — the async chunk, once */
export const loadLoopDoors = async (): Promise<LoopDoor[]> =>
  (await import('../content/learn-loop')).LOOP_DOORS

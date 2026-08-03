/* ─── releases-access · the ONLY door to the engine's release record ─────────
   (the adrs-access recipe) releases.generated.ts carries 22 releases with
   their asset lists and digests — register weight the entry bundle must not
   pay. Two pages render it, so it reaches the client as an async chunk: SSG
   reads it through the SSR-only await, both pages prerender whole, and a SPA
   hop pulls the chunk once.

   site.config.ts imports ONLY the RELEASE_TAGS names (tree-shaken slugs for
   RELEASE_PATHS) — the record itself stays behind this door. The
   bundle-safety gate lives in releases.test.ts. */
import type { EngineRelease } from '../content/releases.generated'

type Record_ = { releases: EngineRelease[] }

let SSR: Record_ | null = null
if (import.meta.env.SSR) {
  const m = await import('../content/releases.generated')
  SSR = { releases: m.RELEASES }
}

/** the whole record at SSG time (null on the client · ride the island) */
export const ssrReleases = (): Record_ | null => SSR

/** the record on the client · the async chunk, once */
export const loadReleases = async (): Promise<Record_> => {
  const m = await import('../content/releases.generated')
  return { releases: m.RELEASES }
}

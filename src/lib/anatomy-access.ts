/* ─── anatomy-access · the ONLY doors to the vendored engine graphs ──────────
   (the showcase-yaml-access recipe · register diet) anatomy.generated.ts is
   ~60K of vendored `nika inspect` output — it reaches the client ONLY as an
   async chunk. SSG reads it through the SSR-only await; a room's first
   render rides its byte island; a SPA hop pulls the chunk once. The
   bundle-safety gate in anatomy.test pins "no static import outside this
   module". */

import type { Anatomy } from '../content/anatomy.generated'

let SSR_ANATOMY: Record<string, Anatomy> | null = null
let SSR_ENGINE = ''
if (import.meta.env.SSR) {
  const m = await import('../content/anatomy.generated')
  SSR_ANATOMY = m.ANATOMY
  SSR_ENGINE = m.ANATOMY_ENGINE
}

/** the whole vendored dictionary at SSG time (null on the client) */
export const ssrAnatomy = (): Record<string, Anatomy> | null => SSR_ANATOMY

/** the engine stamp at SSG time ('' on the client — ride the island) */
export const ssrAnatomyEngine = (): string => SSR_ENGINE

/** one room's graph on the client — the async chunk, once */
export const loadAnatomy = async (): Promise<{
  graphs: Record<string, Anatomy>
  engine: string
}> => {
  const m = await import('../content/anatomy.generated')
  return { graphs: m.ANATOMY, engine: m.ANATOMY_ENGINE }
}

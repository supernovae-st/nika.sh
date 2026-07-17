/* ─── atlas-access · the ONLY door to the full graph (bundle-safety law) ─────
   The 80K graph module is lazy-only: pages, sections and the shell never
   import it statically (the atlas.test gate scans them). Consumers that
   need the whole graph (the Inspector · future living-map hooks) load it
   through THIS door — one async chunk, fetched at first use, cached. */

export type AtlasModule = typeof import('../content/atlas.generated')

let once: Promise<AtlasModule> | null = null
export const loadAtlas = (): Promise<AtlasModule> => {
  once ??= import('../content/atlas.generated')
  return once
}

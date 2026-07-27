/* ─── lens-access · the ONLY door to the full graph (bundle-safety law) ─────
   The 80K graph module is lazy-only: pages, sections and the shell never
   import it statically (the lens.test gate scans them). Consumers that
   need the whole graph (the Inspector · future living-map hooks) load it
   through THIS door — one async chunk, fetched at first use, cached. */

export type LensModule = typeof import('../content/lens.generated')

let once: Promise<LensModule> | null = null
export const loadLens = (): Promise<LensModule> => {
  once ??= import('../content/lens.generated')
  return once
}

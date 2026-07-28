/* ─── showcase-yaml-access · the ONLY doors to the yaml dictionary ────────────
   (WO-12 register diet) The projector emission (usecases-yaml.generated ·
   spec-owned, untouchable) must reach the client ONLY as an async chunk —
   the namespace-retention law: one static import anywhere and every page
   pays the 79K again. These two doors are the whole contract:

   · ssrShowcaseYaml() — the dictionary during SSG (the SSR-only top-level
     await keeps the module out of the client graph);
   · loadShowcaseYaml() — the dictionary on the client, as the async chunk
     (fetched once at the first interaction/SPA-nav that needs it).

   Pages feed their FIRST render from a byte island (ssg-island.tsx) whose
   payload they compute via ssrShowcaseYaml(). The bundle-safety gate in
   lens.test pins "no static import of usecases-yaml.generated outside
   this module" so the law cannot silently regress.

   One clock (0.106 flag-day): the ratified pin and the released binary
   speak the SAME grammar, so the projector emission IS the served corpus —
   the w1-to-w2 door retired with the flip (its own retirement clause). */

let SSR_YAMLS: Record<string, string> | null = null
if (import.meta.env.SSR) {
  SSR_YAMLS = (await import('./usecases-yaml.generated')).SHOWCASE_YAML
}

/** the whole dictionary at SSG time (null on the client by construction) */
export const ssrShowcaseYaml = (): Record<string, string> | null => SSR_YAMLS

let clientCache: Record<string, string> | null = null

/** the whole dictionary on the client — the async chunk, once */
export const loadShowcaseYaml = async (): Promise<Record<string, string>> =>
  (clientCache ??= (await import('./usecases-yaml.generated')).SHOWCASE_YAML)

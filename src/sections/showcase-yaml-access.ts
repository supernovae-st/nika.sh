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
   atlas.test pins "no static import of usecases-yaml.generated outside
   this module" so the law cannot silently regress.

   W2 at the door (0.104 shipped flip): the projector emission cites the
   ratified spec showcase VERBATIM (W1 · the pin's grammar), but everything
   a visitor copy-pastes must pass `nika check` on the RELEASED binary,
   which speaks W2. The doors apply the mechanical w1-to-w2 pass on the way
   out — the generated module stays byte-pure (the ratified clock), the
   rendered corpus speaks the shipped grammar. showcase-dag.generated
   carries the SAME pass's line map, so the choreography still points at
   the exact rendered lines. Retires with the pass (see w1-to-w2.ts). */

import { serveW2 } from '../lib/w1-to-w2'

const toW2 = (dict: Record<string, string>): Record<string, string> =>
  Object.fromEntries(Object.entries(dict).map(([k, y]) => [k, serveW2(y)]))

let SSR_YAMLS: Record<string, string> | null = null
if (import.meta.env.SSR) {
  SSR_YAMLS = toW2((await import('./usecases-yaml.generated')).SHOWCASE_YAML)
}

/** the whole dictionary at SSG time (null on the client by construction) */
export const ssrShowcaseYaml = (): Record<string, string> | null => SSR_YAMLS

let clientCache: Record<string, string> | null = null

/** the whole dictionary on the client — the async chunk, once */
export const loadShowcaseYaml = async (): Promise<Record<string, string>> =>
  (clientCache ??= toW2((await import('./usecases-yaml.generated')).SHOWCASE_YAML))

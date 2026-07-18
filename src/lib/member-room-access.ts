/* ─── member-room-access · the generic room's graph door ─────────────────────
   (the anatomy-access recipe) The member rooms render the inspector's own
   readout (readoutFor · one renderer, never a fork) FULL-PAGE — the graph
   module stays a lazy chunk on the client; SSG reads it through the
   SSR-only await so every room prerenders its whole readout (the point of
   « chaque élément a sa page » is bytes IN the HTML). */

import { readoutFor, type Readout } from '../shell/inspector-readout'

type Graph = Parameters<typeof readoutFor>[1]

let SSR_GRAPH: Graph | null = null
if (import.meta.env.SSR) {
  SSR_GRAPH = (await import('../content/atlas.generated')) as unknown as Graph
}

/** the readout at SSG time (null on the client — ride the island) */
export const ssrReadout = (nodeId: string): Readout | null =>
  SSR_GRAPH ? readoutFor(nodeId, SSR_GRAPH) : null

/** the readout on the client — the lazy graph chunk, once */
export const loadReadout = async (nodeId: string): Promise<Readout | null> => {
  const graph = (await import('../content/atlas.generated')) as unknown as Graph
  return readoutFor(nodeId, graph)
}


/* ─── ssg-island · the byte island, as a recipe (WO-12 register diet) ─────────
   The Map constellation proved the mechanism; this generalizes it so heavy
   generated data can leave the initial bundle WITHOUT changing its source
   module (rolldown tree-shakes un-imported const exports; the emission
   stays the one projector output — the neutrality bar):

   · the PAGE keeps the data out of its client graph by importing it only
     inside an `if (import.meta.env.SSR)` top-level-await branch — the
     module becomes an async chunk the client never fetches at load;
   · SSG renders <Island> with the payload: a TEXTAREA is RCDATA, so
     renderToString escapes it, the parser decodes it back, and .value IS
     the exact source bytes (a script tag can never hydrate — React's
     walker skips DOM scripts · probe-proven, see Map.tsx);
   · at hydration, useIslandPayload's lazy initializer reads the island's
     .value BEFORE first paint — the client's value prop equals the DOM's,
     hydration stays byte-true with the data itself never bundled;
   · on SPA navigation the island is absent: the loader dynamic-imports
     the SAME module (the async chunk, fetched once, cached).

   The payload is an opaque string (JSON.stringify your dict). Keep one
   island id per page. */

export function Island({ id, payload }: { id: string; payload: string }) {
  return (
    <textarea
      id={id}
      value={payload}
      readOnly
      hidden
      tabIndex={-1}
      aria-hidden
      style={{ display: 'none' }}
    />
  )
}

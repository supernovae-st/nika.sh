
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

/* ── the dollar hazard ────────────────────────────────────────────────────────
   vite-plugin-react-ssg assembles a page with

     template.replace('<div id="app"></div>', `<div id="app">${appHtml}</div>`)

   and a plain string replacement INTERPRETS `$&`, `` $` ``, `$'` and `$1`.
   So any page whose rendered HTML contains one of those sequences gets a
   silent injection — ours arrived the day an error code's refusal read
   « workflow: id violates ^[a-z][a-z0-9-]*$ » and the JSON quote right after
   it made `$&`, which the replace expanded into a literal
   `<div id="app"></div>` inside the payload. /errors then threw at
   JSON.parse, and it would have kept throwing for any future `$&` in any
   island on any page.

   The dependency lives under the monorepo's pnpm root, so patching it is not
   this repo's to do. The island removes the hazard at its own source instead,
   as a TRANSPORT encoding: every `$` ships as ISLAND_DOLLAR, and
   use-island-payload — the single reader of every island on this site — puts
   it back before any caller sees the bytes.

   A transport encoding, NOT a JSON escape. The first attempt shipped `\\u0024`,
   which is correct for the JSON islands and would have silently corrupted the
   ones carrying raw YAML (`${{ … }}`) or an inline SVG — the gate caught it
   within the minute. Encode on write, decode on read, and the payload's own
   grammar never enters into it. */
export const ISLAND_DOLLAR = '\uE000'
const encode = (payload: string) => payload.split('$').join(ISLAND_DOLLAR)

export function Island({ id, payload }: { id: string; payload: string }) {
  return (
    <textarea
      id={id}
      value={encode(payload)}
      readOnly
      hidden
      tabIndex={-1}
      aria-hidden
      style={{ display: 'none' }}
    />
  )
}

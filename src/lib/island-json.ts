/* ─── island-json · the JSON payload the SSG assembly cannot misread ──────────
   vite-plugin-react-ssg builds a page with

     template.replace('<div id="app"></div>', `<div id="app">${appHtml}</div>`)

   and a STRING replacement still interprets `$&`, `` $` ``, `$'` and `$$` (there
   are no capture groups on a string search, so `$1` is left alone). Rendered
   HTML routinely puts a `$` right before an entity — `$` then `&quot;` IS
   `$&` — and the replace then pastes the matched placeholder into the page.

   Observed 2026-07-27: NIKA-PARSE-004 reads « workflow: id violates
   ^[a-z][a-z0-9-]*$ », the JSON quote after it escaped to `&quot;`, and
   /errors shipped with `<div id="app"></div>` inside its byte island. It threw
   at JSON.parse in the built output, having passed every other gate.

   A JSON payload can defuse this at its source, because `\u0024` parses back
   to `$` and a `$` can only appear inside a string literal there. A RAW-text
   island (YAML · SVG) cannot — two earlier attempts proved it: a blanket JSON
   escape corrupts them, and a transport sentinel broke hydration on every
   /use-cases page (React #418). So this helper is for JSON islands only, and
   src/test/ssg-island.test.ts judges the built pages for the rest. */

/** JSON.stringify for an island payload, with the dollars defused */
export const islandJson = (value: unknown): string =>
  JSON.stringify(value).replace(/\$/g, '\\u0024')

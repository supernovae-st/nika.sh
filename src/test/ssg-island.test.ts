import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/* ── the dollar hazard, gated ─────────────────────────────────────────────────
   vite-plugin-react-ssg assembles every page with

     template.replace('<div id="app"></div>', `<div id="app">${appHtml}</div>`)

   and a STRING replacement interprets `$&`, `` $` ``, `$'` and `$1`. A page
   whose rendered HTML carries one of those gets a silent injection at the
   exact spot — ours was an error code reading « ^[a-z][a-z0-9-]*$ » followed
   by a JSON quote, which made `$&` and pasted a literal `<div id="app"></div>`
   into the island. /errors threw at JSON.parse, in prod, on a page that had
   passed every other gate.

   ssg-island.tsx now ships every `$` as its JSON escape, so no island payload
   can contain a replacement pattern. This proves it on the BUILT output —
   the only place the plugin's replace has actually run. */

const DIST = join(__dirname, '../../dist')

const pages: string[] = []
/* the suite runs BEFORE the build in CI's check-lint-build job, so dist/ may
   not exist — this gate judges built output and skips honestly when there is
   none rather than exploding at module load. */
if (existsSync(DIST))
  (function walk(dir: string) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p)
    else if (name === 'index.html') pages.push(p)
  }
})(DIST)

describe.skipIf(pages.length === 0)('ssg islands · no replacement pattern survives to the page', () => {
  it('the build produced pages to judge', () => {
    expect(pages.length).toBeGreaterThan(100)
  })

  /* The general fingerprint, and the one that matters: the expansion pastes
     the matched needle wherever the `$&` sat, which is NOT necessarily an
     island. Three pages shipped a second app root in the middle of a
     syntax-highlighted jq expression — `gsub("^-|-$"; "")` renders as `-$`
     then `&quot;`, and `$&` fired there. The island-only cases below missed
     it for a day; a duplicated root is also a guaranteed React #418, so the
     e2e sweep and the integrity sweep went red together without either
     naming the cause.

     Since 2026-07-30 the plugin is patched to replace with a FUNCTION
     (patches/vite-plugin-react-ssg@0.2.0.patch), which never interprets a
     replacement pattern, so this case guards a class that can no longer
     occur by construction. It stays because the patch is a dependency
     override: an upgrade that drops it must fail here, loudly. */
  it('no page carries the app root twice', () => {
    const hit = pages.filter((p) => {
      const m = readFileSync(p, 'utf8').match(/id="app"/g)
      return (m?.length ?? 0) > 1
    })
    expect(hit.map((p) => p.slice(DIST.length)).slice(0, 6),
      'the ssg replacement expanded a $ pattern — is the plugin patch still applied?').toEqual([])
  })

  /* the injection's fingerprint: the app root appearing INSIDE an island,
     which can only happen when a `$&` expanded during assembly */
  it('no island payload contains the app root', () => {
    const hit = pages.filter((p) => {
      const html = readFileSync(p, 'utf8')
      for (const m of html.matchAll(/<textarea[^>]*id="[^"]*"[^>]*>([\s\S]*?)<\/textarea>/g)) {
        if (m[1].includes('<div id="app">')) return true
      }
      return false
    })
    expect(hit.map((p) => p.slice(DIST.length)), 'an island swallowed the app root').toEqual([])
  })

  it('no island payload carries a replacement pattern', () => {
    const hit: string[] = []
    for (const p of pages) {
      const html = readFileSync(p, 'utf8')
      for (const m of html.matchAll(/<textarea[^>]*id="([^"]*)"[^>]*>([\s\S]*?)<\/textarea>/g)) {
        /* a STRING search carries no capture groups, so `$1` is left literal —
           the patterns that actually fire are `$&`, `` $` ``, `$'` and `$$`.
           A JSON island defuses them at the source (island-json.ts); a raw one
           is judged here. */
        if (/\$[&`'$]/.test(m[2])) hit.push(`${p.slice(DIST.length)}#${m[1]}`)
      }
    }
    expect(hit.slice(0, 6), 'a replacement pattern reached an island payload').toEqual([])
  })

})

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ISLAND_DOLLAR } from '../lib/ssg-island'

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
;(function walk(dir: string) {
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

  it('no island payload carries a bare $ at all', () => {
    const hit: string[] = []
    for (const p of pages) {
      const html = readFileSync(p, 'utf8')
      for (const m of html.matchAll(/<textarea[^>]*id="([^"]*)"[^>]*>([\s\S]*?)<\/textarea>/g)) {
        /* the escape ships as the two characters $, so a LONE $ means an
           island wrote its payload without going through <Island> */
        if (/\$/.test(m[2])) hit.push(`${p.slice(DIST.length)}#${m[1]}`)
      }
    }
    expect(hit.slice(0, 6), 'a raw $ reached an island payload').toEqual([])
  })

  /* AND THE ENCODING MUST BE REVERSIBLE · a payload the reader cannot restore
     is worse than the bug it replaced. Not every island carries JSON (some
     ship raw YAML, one an inline SVG), so the check is ROUND-TRIP, not parse:
     decoding must give back a `$` wherever the source had one. */
  it('the encoding round-trips for JSON, YAML and SVG payloads alike', () => {
    const cases = ['{"a":"^[a-z]*$"}', 'nika: v1\nx: ${{ tasks.a.output }}', '<svg>$&</svg>', '']
    for (const c of cases) {
      expect(c.split('$').join(ISLAND_DOLLAR).split(ISLAND_DOLLAR).join('$'), c).toBe(c)
    }
  })
})

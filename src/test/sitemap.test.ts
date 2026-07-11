import { describe, expect, it } from 'vitest'
import { SITE_MAP, sitemapInternalHrefs } from '../content/sitemap'
import { PATHS } from '../../site.config'

/* ── the map coverage gate · the promise, enforced both ways ──────────────────
   /sitemap claims to list everything the site serves. This gate makes the
   claim structural:

     1 · COVERAGE — every prerendered route (site.config PATHS) appears on
         the map. A page shipped without joining the map goes red HERE,
         never silently undiscoverable.
     2 · INTEGRITY — every internal PAGE link on the map is a prerendered
         route (no dead links; file twins like /llms.txt and /rss.xml are
         served from public/, not prerendered — they get an extension-based
         carve-out, checked to actually look like files).

   The map itself is the one route it needn't list (the foot line names it). */

describe('/sitemap · the map covers the territory, and only the territory', () => {
  const hrefs = new Set(sitemapInternalHrefs())

  it('every prerendered route is on the map', () => {
    const missing = PATHS.filter((p) => p !== '/sitemap' && !hrefs.has(p))
    expect(missing, `routes missing from the map: ${missing.join(', ')}`).toEqual([])
  })

  it('every internal page link is a prerendered route (no dead links)', () => {
    const routes = new Set(PATHS)
    const dead = [...hrefs].filter((h) => {
      const isFileTwin = /\.[a-z]+$/.test(h) || h.startsWith('/.well-known/')
      return !isFileTwin && !routes.has(h)
    })
    expect(dead, `map links to non-routes: ${dead.join(', ')}`).toEqual([])
  })

  it('external links are marked external (the ↗ is honest)', () => {
    for (const g of SITE_MAP) {
      for (const l of g.links) {
        expect(l.external ?? false, l.href).toBe(!l.href.startsWith('/'))
      }
    }
  })

  it('hrefs are unique across the whole map (one place per page)', () => {
    const all = sitemapInternalHrefs()
    expect(new Set(all).size).toBe(all.length)
  })
})

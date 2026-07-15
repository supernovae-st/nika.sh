import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SITE_MAP, sitemapInternalHrefs } from '../content/sitemap'
import { MAP_LAYERS, MAP_OPENER } from '../pages/map-data.generated'
import { PATHS } from '../../site.config'
import { layoutConstellation } from '../../scripts/atlas/lib/radial-layout.mjs'

/* ── /map · the mother page's gates ───────────────────────────────────────────
   The coverage promise moved here whole from the old /sitemap gate (§0.12b:
   the page died, the registry and its gate live on): every prerendered
   route appears on the map, every internal map link prerenders. Plus the
   /map-specific truths: the two constellation copies are byte-equal (the
   page inlines what agents fetch), and the radial layout holds its
   geometric invariants for the real twin. */

const ROOT = join(__dirname, '../..')

describe('/map · the map covers the territory, and only the territory', () => {
  const hrefs = new Set(sitemapInternalHrefs())

  it('every prerendered route is on the map', () => {
    // /sitemap is the moved stub (301 → /map) — the one route the map
    // needn't list; everything else must join or go red here.
    const missing = PATHS.filter((p) => p !== '/sitemap' && !hrefs.has(p))
    expect(missing, `routes missing from the map: ${missing.join(', ')}`).toEqual([])
  })

  it('every internal page link is a prerendered route (no dead links)', () => {
    const routes = new Set(PATHS)
    const dead = [...hrefs].filter((h) => {
      const page = h.split('#')[0] // anchored rows (providers) judge their page
      const isFileTwin = /\.[a-z]+$/.test(page) || page.startsWith('/.well-known/')
      return !isFileTwin && !routes.has(page)
    })
    expect(dead, `map links to nowhere: ${dead.join(', ')}`).toEqual([])
  })

  it('the registry keeps its editorial shape (groups · glosses · hints)', () => {
    expect(SITE_MAP.length).toBeGreaterThanOrEqual(5)
    for (const g of SITE_MAP) {
      expect(g.kick).toBeTruthy()
      expect(g.gloss).toBeTruthy()
      expect(g.links.length).toBeGreaterThan(0)
    }
  })
})

describe('/map · the anatomy list is the derived truth', () => {
  it('seven layers in reading order, every set carrying a real url', () => {
    expect(MAP_LAYERS.map((l) => l.id)).toEqual([
      'shape', 'flow', 'acts', 'reach', 'boundary', 'refusals', 'proof',
    ])
    for (const l of MAP_LAYERS) {
      expect(l.opener.length).toBeGreaterThan(40)
      for (const s of l.sets) {
        expect(s.url.startsWith('/'), `${s.id} url`).toBe(true)
        if (!s.slot) expect(s.count, `${s.id} count`).toBeGreaterThan(0)
      }
    }
    expect(MAP_OPENER).toContain('workflow language')
  })

  it('a landing hub never renders as a link target from the list', () => {
    for (const l of MAP_LAYERS.filter((x) => !x.exists)) {
      expect(l.lands, `${l.id} must name its landing WO`).toMatch(/^wo-\d+$/)
    }
  })

  it('a set chip only links a served page (the dead-link catch, structural)', () => {
    const routeSet = new Set(PATHS)
    for (const l of MAP_LAYERS) {
      for (const s of l.sets) {
        if (s.slot) continue
        if (s.exists) {
          const served = routeSet.has(s.url) || PATHS.some((p) => p !== '/' && s.url.startsWith(`${p}/`))
          expect(served, `${s.id} claims exists but ${s.url} is not served`).toBe(true)
        } else {
          expect(s.lands, `${s.id} not served: must name its landing WO`).toMatch(/^wo-\d+$/)
        }
      }
    }
  })
})

describe('/map · the constellation is one drawing, twice served', () => {
  it('the inlined asset and the public file are byte-equal', () => {
    const inlined = readFileSync(join(ROOT, 'src/assets/constellation.generated.svg'), 'utf8')
    const served = readFileSync(join(ROOT, 'public/map/constellation.svg'), 'utf8')
    expect(served).toBe(inlined)
  })

  it('member anchors are crawlable but out of the tab order (the list is the keyboard path)', () => {
    const svg = readFileSync(join(ROOT, 'public/map/constellation.svg'), 'utf8')
    const anchors = svg.match(/<a [^>]*href="[^"]+"[^>]*>/g) ?? []
    // rooms + the providers hub link today (soon stars are plain points ·
    // every enrichment WO grows this — the floor only rises)
    expect(anchors.length).toBeGreaterThan(50)
    for (const a of anchors) expect(a, a).toContain('tabindex="-1"')
    // the drawing is a LENS: aria-hidden for assistive tech (the anatomy
    // list is the AT truth · axe nested-interactive forbids role=img over
    // interactive children) · crawlers ignore aria-hidden, the seo holds
    expect(svg).toContain('aria-hidden="true"')
    expect(svg).not.toContain('role="img"')
    expect(svg).toContain('prefers-reduced-motion')
  })

  it('the bytes stay island-safe (no closing-script sequence · the hydration parity law)', () => {
    const svg = readFileSync(join(ROOT, 'public/map/constellation.svg'), 'utf8')
    expect(/<\/script/i.test(svg)).toBe(false)
  })

  it('a fragment anchor in the drawing only exists where the section does (the sweep crawls fragments)', () => {
    const svg = readFileSync(join(ROOT, 'public/map/constellation.svg'), 'utf8')
    const twin = JSON.parse(readFileSync(join(ROOT, 'public/ontology/language.json'), 'utf8')) as {
      nodes: { id: string; kind: string; surface?: string; url?: string | null; anchors_exist?: boolean }[]
    }
    const twinSets = twin.nodes.filter((n) => n.kind === 'set' && n.surface === 'anchors')
    const liveByPage = new Map<string, boolean>()
    for (const n of twinSets) {
      if (!n.url) continue
      const page = n.url.split('#')[0]
      liveByPage.set(page, (liveByPage.get(page) ?? false) || n.anchors_exist === true)
    }
    // providers was live pre-atlas · WO-4 lit its hubs' sections — each
    // enrichment WO widens this by descriptor, the gate follows the twin
    expect(liveByPage.get('/providers')).toBe(true)
    const fragments = [...svg.matchAll(/<a href="([^"]+)#[^"]+"/g)].map((m) => m[1])
    for (const page of fragments) {
      expect(liveByPage.get(page), `${page}: fragment link on a page with no living sections`).toBe(true)
    }
  })
})

describe('radial layout · geometric invariants on the real twin', () => {
  const twin = JSON.parse(readFileSync(join(ROOT, 'public/ontology/language.json'), 'utf8'))
  const geo = layoutConstellation(twin)

  it('seven sectors tile the full circle in reading order, no overlap', () => {
    expect(geo.layers.map((l: { id: string }) => l.id)).toEqual([
      'shape', 'flow', 'acts', 'reach', 'boundary', 'refusals', 'proof',
    ])
    for (let i = 0; i < geo.layers.length; i++) {
      const l = geo.layers[i]
      expect(l.a1).toBeGreaterThan(l.a0)
      if (i > 0) expect(l.a0).toBeCloseTo(geo.layers[i - 1].a1, 1)
    }
    const span = geo.layers[6].a1 - geo.layers[0].a0
    expect(span).toBeCloseTo(Math.PI * 2, 1)
  })

  it('every set dot sits on its ring and inside its layer sector', () => {
    for (const s of geo.sets) {
      const d = Math.hypot(s.x - geo.center, s.y - geo.center)
      expect(d).toBeCloseTo(geo.ring.sets, 0)
      const sector = geo.layers.find((l: { id: string }) => l.id === s.layer)!
      expect(s.angle).toBeGreaterThanOrEqual(sector.a0)
      expect(s.angle).toBeLessThanOrEqual(sector.a1)
    }
  })

  it('members ride the member ring; links only join distinct sets with weight', () => {
    for (const m of geo.members) {
      const d = Math.hypot(m.x - geo.center, m.y - geo.center)
      expect(d).toBeCloseTo(geo.ring.members, 0)
    }
    for (const lk of geo.links) {
      expect(lk.from).not.toBe(lk.to)
      expect(lk.weight).toBeGreaterThan(0)
      expect(['names', 'grants', 'accepts', 'carries']).toContain(lk.kind)
    }
  })

  it('the same twin bytes produce the same geometry bytes (determinism)', () => {
    const again = layoutConstellation(JSON.parse(readFileSync(join(ROOT, 'public/ontology/language.json'), 'utf8')))
    expect(JSON.stringify(again)).toBe(JSON.stringify(geo))
  })
})

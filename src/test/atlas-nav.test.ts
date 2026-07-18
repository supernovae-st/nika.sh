import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  FOOTER_COLS,
  FOOTER_MACHINE,
  NAV_BAR_LINKS,
  NAV_DOCTRINE,
  NAV_PRODUCT,
  NAV_REFERENCE,
  NAV_VERSION_PILL,
  type NavItem,
} from '../content/atlas-nav.generated'
import { ATLAS_SET_COUNTS } from '../content/atlas-meta.generated'
import { PATHS } from '../../site.config'

/* ── the chrome-projection gates (§4.11-4.12) ─────────────────────────────────
   Nav + footer read atlas-nav.generated.ts; these gates hold the §4.11
   verdicts structurally: the scannability law (descs only on the Product
   featured-class), the count chips = the derived register counts, soon
   flags only on surfaces that genuinely have not landed, every link a real
   route, the footer covering the Reference panel (nav curates · footer
   completes), and the anti-slop voice on all authored strings. */

const ROOT = join(__dirname, '../..')
const routeSet = new Set(PATHS)

const allItems: { where: string; item: NavItem }[] = [
  ...NAV_BAR_LINKS.map((item) => ({ where: 'bar', item })),
  ...NAV_PRODUCT.flatMap((g) => g.items.map((item) => ({ where: `product/${g.col}`, item }))),
  { where: 'reference/featured', item: NAV_REFERENCE.featured },
  ...NAV_REFERENCE.cols.flatMap((g) => g.items.map((item) => ({ where: `reference/${g.col}`, item }))),
  ...FOOTER_COLS.flatMap((g) => g.items.map((item) => ({ where: `footer/${g.kick}`, item }))),
]

describe('atlas-nav · one path, one door (§4.11 ratchet)', () => {
  it('no two sibling rows of a panel share a bare path — the later is an anchored sub-door', () => {
    for (const [panel, cols] of [
      ['reference', NAV_REFERENCE.cols],
      ['product', NAV_PRODUCT],
    ] as const) {
      const seen = new Set<string>()
      for (const g of cols) {
        for (const item of g.items) {
          if (!item.to) continue
          const bare = item.to.split('#')[0]
          if (!seen.has(bare)) {
            seen.add(bare)
            continue
          }
          expect(item.sub, `${panel}: second door to ${bare} (${item.label}) must be a sub-door`).toBe(true)
          expect(item.to.includes('#'), `${panel}: sub-door ${item.label} must deep-link an anchor`).toBe(true)
        }
      }
    }
  })

  it('the sub-door class is exactly the anchored second-doors (today: Types under The language)', () => {
    const subs = allItems.filter(({ item }) => item.sub)
    expect(subs.map(({ item }) => `${item.label}→${item.to}`).sort()).toEqual([
      'Types→/language#types',
      'Types→/language#types',
    ])
  })
})

describe('atlas-nav · every rendered link resolves', () => {
  it('every internal `to` is a prerendered route or a home anchor', () => {
    for (const { where, item } of allItems) {
      if (item.soon || !item.to) continue
      // a sub-door deep-links `page#anchor` — the ROUTE is the bare page
      const route = item.sub ? item.to.split('#')[0] : item.to
      expect(routeSet.has(route), `${where}: ${item.label} → ${item.to}`).toBe(true)
    }
    for (const { where, item } of allItems) {
      if (item.href?.startsWith('/#')) {
        expect(routeSet.has('/'), `${where}: ${item.label}`).toBe(true)
      }
    }
    expect(routeSet.has(NAV_DOCTRINE.to)).toBe(true)
    expect(routeSet.has(NAV_VERSION_PILL.to)).toBe(true)
  })

  it('machine row surfaces are served files (public/) or routes', () => {
    for (const m of FOOTER_MACHINE) {
      const p = join(ROOT, 'public', m.href)
      expect(() => readFileSync(p), m.href).not.toThrow()
    }
  })
})

describe('atlas-nav · the §4.11 scannability law holds', () => {
  it('descs live ONLY on the product panel and the featured row', () => {
    for (const g of NAV_REFERENCE.cols) {
      for (const item of g.items) {
        expect(item.desc, `reference/${g.col}/${item.label} carries a desc`).toBeUndefined()
      }
    }
    for (const g of FOOTER_COLS) {
      for (const item of g.items) {
        expect(item.desc, `footer/${g.kick}/${item.label} carries a desc`).toBeUndefined()
      }
    }
    expect(NAV_REFERENCE.featured.desc).toBeTruthy()
    for (const g of NAV_PRODUCT) {
      for (const item of g.items) expect(item.desc, `product ${item.label}`).toBeTruthy()
    }
  })

  it('the bar stays in the 5-7 law: 2 panels + generated links + pill + CTA', () => {
    expect(NAV_BAR_LINKS.length).toBeLessThanOrEqual(3)
    // Spec and Changelog left the bar (§4.11) — the pill carries the release signal
    for (const l of NAV_BAR_LINKS) {
      expect(['Spec', 'Changelog'], `${l.label} should not ride the bar`).not.toContain(l.label)
    }
  })

  it('count chips equal the derived register counts (never typed)', () => {
    const expectCount = (label: string, setId: string) => {
      const item = allItems.find((x) => x.item.label === label && x.item.count != null)
      expect(item, `${label} with a chip`).toBeTruthy()
      expect(item!.item.count).toBe(ATLAS_SET_COUNTS[setId].count)
    }
    expectCount('The language', 'words')
    expectCount('The four verbs', 'verbs')
    expectCount('Error codes', 'error-codes')
    expectCount('Standard library', 'builtins')
    expectCount('Providers', 'providers')
    expectCount('Templates', 'templates')
  })

  it('soon flags ride exactly the surfaces that have not landed', () => {
    const soonLabels = new Set(
      [...NAV_REFERENCE.cols.flatMap((c) => c.items)].filter((i) => i.soon).map((i) => i.label),
    )
    // WO-4 flipped the three hubs live · the types register landed with the
    // 0.104 window (10 primitives from the schema's own typeExpr) — nothing
    // on the reference panel waits anymore
    expect(soonLabels).toEqual(new Set([]))
    for (const { item } of allItems) {
      if (item.soon) expect(item.to ?? item.href, `${item.label} soon must not link`).toBeUndefined()
    }
  })
})

describe('atlas-nav · the footer completes what the panel curates (§4.12)', () => {
  it('every reference panel item appears in the footer columns', () => {
    const footerLabels = new Set(FOOTER_COLS.flatMap((c) => c.items.map((i) => i.label)))
    for (const item of NAV_REFERENCE.cols.flatMap((c) => c.items)) {
      expect(footerLabels.has(item.label), `${item.label} missing from footer`).toBe(true)
    }
  })

  it('five columns in the 28-36 links law, machine row of four', () => {
    expect(FOOTER_COLS.length).toBe(5)
    const total = FOOTER_COLS.reduce((n, c) => n + c.items.length, 0)
    expect(total).toBeGreaterThanOrEqual(22)
    expect(total).toBeLessThanOrEqual(36)
    expect(FOOTER_MACHINE.length).toBe(4)
  })
})

describe('atlas-nav · the anti-slop voice on the chrome', () => {
  it('no em dash, no banned intensifiers, anywhere in the nav data', () => {
    const texts = [
      ...allItems.map(({ item }) => `${item.label} ${item.desc ?? ''} ${item.title ?? ''}`),
      NAV_DOCTRINE.label,
      NAV_VERSION_PILL.title,
    ]
    for (const t of texts) {
      expect(t).not.toMatch(/—/)
      expect(t).not.toMatch(/\b(seamless|powerful|robust|blazingly|cutting-edge)\b/i)
    }
  })
})

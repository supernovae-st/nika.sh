import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  FOOTER_COLS,
  FOOTER_MACHINE,
  NAV_BAR_LINKS,
  NAV_VERSION_PILL,
  type NavItem,
} from '../content/lens-nav.generated'
import { PATHS } from '../../site.config'

/* ── the chrome-projection gates (§4.11-4.12, after the 2026-08-02 table rase)
   Nav + footer read lens-nav.generated.ts. The two mega-panels died with the
   rase — the bar is six flat WORLD links and the footer is the complete card,
   one column per world — so the gates that judged panel-only properties
   (descs on the featured class, count chips, soon flags, the panel-covers-
   footer law) went with them. What survives is what still has a subject:
   one path one door, every link a real route, the machine row served, the
   bar inside the 5-7 law, the footer's link budget, and the anti-slop voice
   on every authored string. */

const ROOT = join(__dirname, '../..')
const routeSet = new Set(PATHS)

const allItems: { where: string; item: NavItem }[] = [
  ...NAV_BAR_LINKS.map((item) => ({ where: 'bar', item })),
  /* the panels died with the nav table rase (2026-08-02): the bar is six
     flat world links and the footer carries its own rows. */
  ...FOOTER_COLS.flatMap((g) => g.items.map((item) => ({ where: `footer/${g.kick}`, item }))),
]

describe('lens-nav · one path, one door (§4.11 ratchet)', () => {
  it('one path, one door: the footer never lists the same page twice', () => {
    /* the panels are gone, so the law moves to the surface that survived —
       the complete card. A page listed in two world columns teaches two
       homes for one thing, which is the drift the §4.11 ratchet refuses. */
    const seen = new Map<string, string>()
    for (const col of FOOTER_COLS) {
      for (const item of col.items) {
        if (!item.to) continue
        const bare = item.to.split('#')[0]
        const first = seen.get(bare)
        expect(first, `${bare} is listed in both « ${first} » and « ${col.kick} »`).toBeUndefined()
        seen.set(bare, col.kick)
      }
    }
  })
  it('no door deep-links an anchor any more (the sub-door class is empty)', () => {
    const subs = allItems.filter(({ item }) => item.sub)
    expect(subs.map(({ item }) => `${item.label}→${item.to}`)).toEqual([])
  })
})

describe('lens-nav · every rendered link resolves', () => {
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
    expect(routeSet.has(NAV_VERSION_PILL.to)).toBe(true)
  })

  it('machine row surfaces are served files (public/ or build-emitted)', () => {
    /* sitemap.xml is EMITTED at build (vite closeBundle derives it from
       PATHS) — served in every deploy, never a public/ file. The allowlist
       names the build-emitted twins explicitly; anything else must exist
       in public/ at test time. */
    const BUILD_EMITTED = new Set(['/sitemap.xml'])
    for (const m of FOOTER_MACHINE) {
      if (BUILD_EMITTED.has(m.href)) continue
      const p = join(ROOT, 'public', m.href)
      expect(() => readFileSync(p), m.href).not.toThrow()
    }
  })
})

describe('lens-nav · the §4.11 scannability law holds', () => {
  /* SUPERSEDED 2026-07-27, and deliberately so. This gate used to assert the
     OPPOSITE: descs on the Product panel only, none in Reference, on the
     reading that a dense index scans faster naked. Shipped, it did not — the
     operator's verdict on the rendered panel was that it is « moche et pas
     compréhensible », and looking at it as a visitor rather than as its author
     makes the reason plain:

       · the heads named our ontology (« The reach »), not the reader's question
       · eight of eleven labels open with « The », so the word that
         distinguishes them never leads
       · the counts carried no unit — 62 what?
       · one row had a second line and ten did not, which reads as broken
         rather than as restraint

     A two-word abstract label is not scannable, it is unguessable. So the law
     inverts: every Reference row carries its second line, and the FOOTER keeps
     none, because the footer is the complete card where the panel is the
     curated one. The original reading is preserved above rather than deleted. */
  it('the bar stays in the 5-7 law: the worlds, the pill and the CTA', () => {
    /* six WORLDS + the pill + the CTA + ⌘K + GitHub · the 5-7 law counts
       the DOORS a reader chooses between, and six flat worlds is the whole
       map (it was 3 links plus two panels hiding eleven more). */
    expect(NAV_BAR_LINKS.length).toBeLessThanOrEqual(7)
    // Spec and Changelog left the bar (§4.11) — the pill carries the release signal
    for (const l of NAV_BAR_LINKS) {
      expect(['Spec', 'Changelog'], `${l.label} should not ride the bar`).not.toContain(l.label)
    }
  })

  it('six columns in the 30-52 links law, machine row of six', () => {
    /* §4.12 window re-anchored 2026-08-02 (the complete-card mandate): the
       catalog world lands its own column (8 doors) and the truth system its
       two extras — six columns, 30-52 links, still one screen. The FLOOR of
       completeness is footer-coverage.test.ts (every world head has a
       door); this law bounds the CEILING so the card stays scannable.
       Machine row: 5 → 6 on 2026-08-03 — the release record's catalog joins
       its register sisters (every register ships its machine twin, the
       /errors/catalog.json law · world ⑦). */
    expect(FOOTER_COLS.length).toBe(6)
    const total = FOOTER_COLS.reduce((n, c) => n + c.items.length, 0)
    expect(total).toBeGreaterThanOrEqual(30)
    expect(total).toBeLessThanOrEqual(52)
    expect(FOOTER_MACHINE.length).toBe(6)
  })
})

describe('lens-nav · the anti-slop voice on the chrome', () => {
  it('no em dash, no banned intensifiers, anywhere in the nav data', () => {
    const texts = [
      ...allItems.map(({ item }) => `${item.label} ${item.desc ?? ''} ${item.title ?? ''}`),
      NAV_VERSION_PILL.title,
    ]
    for (const t of texts) {
      expect(t).not.toMatch(/—/)
      expect(t).not.toMatch(/\b(seamless|powerful|robust|blazingly|cutting-edge)\b/i)
    }
  })
})

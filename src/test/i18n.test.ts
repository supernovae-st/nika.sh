import { describe, expect, it } from 'vitest'
import {
  LOCALES,
  LOCALIZED,
  baseOf,
  hreflangLinks,
  localeForLanguages,
  localeOf,
  localizedPaths,
  variantsFor,
} from '../lib/i18n'
import { MANIFESTO_LOCALES } from '../content/manifesto-copy'
import { SUGGEST } from '../shell/locale-suggest-lines'
import { MANIFESTO_PATHS, PATHS } from '../../site.config'

/* ── the locale-coverage gate (WO-9a · §4bis anti-slop law, armed) ────────────
   The i18n seam is a REGISTRY + pure derivations; these gates hold the three
   declarations together: LOCALIZED (the seam) ⇔ PATHS (what serves — the
   site.config literal stays import-free by contract) ⇔ manifesto-copy (the
   content). A page announced but not served, a locale route with no registry
   row, or a cluster that lost a sibling goes red HERE naming the path —
   hreflang can never lie. L1 rows join at WO-10 and are judged by the same
   gates, zero new tests. */

describe('i18n · the registry and the served routes agree (both ways)', () => {
  it('every registry row derives routes that PATHS serves', () => {
    for (const base of Object.keys(LOCALIZED)) {
      expect(PATHS, `base ${base}`).toContain(base)
      for (const p of localizedPaths(base)) expect(PATHS, `variant of ${base}`).toContain(p)
    }
  })

  it('every locale-prefixed route in PATHS traces back to a registry row', () => {
    const prefixes = new Set(LOCALES.filter((l) => l.prefix).map((l) => l.prefix))
    for (const p of PATHS) {
      const seg = p.split('/')[1]
      if (!prefixes.has(seg)) continue
      const base = baseOf(p)
      expect(LOCALIZED[base], `${p} served without a registry row`).toBeDefined()
      expect(LOCALIZED[base], `${p} prefix missing from its row`).toContain(seg)
    }
  })

  it('registry prefixes are real locales and never duplicate', () => {
    const known = new Set(LOCALES.filter((l) => l.prefix).map((l) => l.prefix))
    for (const [base, prefixes] of Object.entries(LOCALIZED)) {
      expect(base.startsWith('/'), base).toBe(true)
      expect(new Set(prefixes).size, base).toBe(prefixes.length)
      for (const pref of prefixes) expect(known.has(pref), `${base}: ${pref}`).toBe(true)
    }
  })
})

describe('i18n · the hreflang cluster is bidirectional, self-inclusive and honest', () => {
  it('every variant of a localized page emits the SAME cluster (self + siblings + x-default)', () => {
    for (const base of Object.keys(LOCALIZED)) {
      const cluster = hreflangLinks(base)
      const hrefs = cluster.map((l) => l.href)
      expect(hrefs).toContain(base) // self
      expect(cluster.find((l) => l.hreflang === 'x-default')?.href).toBe(base)
      for (const v of variantsFor(base)) {
        expect(hrefs, `${base} cluster lists ${v.path}`).toContain(v.path)
        // bidirectional: the sibling's own cluster is identical
        expect(hreflangLinks(v.path), `${v.path} cluster`).toEqual(cluster)
      }
    }
  })

  it('a page without variants announces NOTHING (the anti-slop law)', () => {
    expect(hreflangLinks('/learn')).toEqual([])
    expect(hreflangLinks('/')).toEqual([])
    expect(variantsFor('/convert')).toHaveLength(1)
    // /install GAINED its cluster at the WO-10 wiring — 8 voices, announced
    expect(variantsFor('/install')).toHaveLength(8)
  })

  it('the manifesto cluster equals the in-page registry cluster (two producers, one gate)', () => {
    /* Manifesto.tsx builds its head links from MANIFESTO_LOCALES (PATHS must
       not enter the client graph); the sitemap builds from THIS seam — the
       two derivations must name the same URLs per tag, forever */
    const seam = hreflangLinks('/manifesto')
    const page = [
      ...MANIFESTO_LOCALES.map((l) => ({ hreflang: l.bcp47, href: l.path })),
      { hreflang: 'x-default', href: '/manifesto' },
    ]
    expect(seam).toEqual(page)
  })

  it('site.config MANIFESTO_PATHS equals the seam derivation (import-free contract held by gate)', () => {
    expect([...MANIFESTO_PATHS]).toEqual(localizedPaths('/manifesto'))
  })
})

describe('i18n · locale resolution', () => {
  it('localeOf/baseOf round-trip every registered variant', () => {
    for (const base of Object.keys(LOCALIZED)) {
      for (const v of variantsFor(base)) {
        expect(localeOf(v.path).bcp47).toBe(v.locale.bcp47)
        expect(baseOf(v.path)).toBe(base)
      }
    }
    expect(localeOf('/errors').prefix).toBe('') // a root page is EN
    expect(baseOf('/fr/manifesto')).toBe('/manifesto')
  })

  it('Accept-Language maps into the locked set by primary subtag', () => {
    expect(localeForLanguages(['fr-CA', 'en-US'])?.bcp47).toBe('fr')
    expect(localeForLanguages(['pt-PT'])?.bcp47).toBe('pt-BR')
    expect(localeForLanguages(['zh-TW'])?.bcp47).toBe('zh-Hans')
    expect(localeForLanguages(['ja'])?.bcp47).toBe('ja')
    expect(localeForLanguages(['nl', 'sv'])).toBeUndefined()
    expect(localeForLanguages([])).toBeUndefined()
  })

  it('the locked set: en + 7, unique prefixes, canonical tags, native suggest lines', () => {
    expect(LOCALES).toHaveLength(8)
    expect(LOCALES[0]).toMatchObject({ bcp47: 'en', prefix: '' })
    const prefixes = LOCALES.map((l) => l.prefix)
    expect(new Set(prefixes).size).toBe(prefixes.length)
    for (const l of LOCALES) {
      expect(l.bcp47).toMatch(/^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$/)
      expect(l.label.length).toBeGreaterThan(0)
      // the lazy banner speaks every locked locale in its own voice
      expect(SUGGEST[l.bcp47], `suggest line for ${l.bcp47}`).toBeTruthy()
    }
  })
})

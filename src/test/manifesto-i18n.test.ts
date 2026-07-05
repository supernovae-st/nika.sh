import { describe, expect, it } from 'vitest'
import { MANIFESTO_LOCALES, manifestoCopyFor } from '../content/manifesto-copy'
import { MANIFESTO_PATHS, PATHS } from '../../site.config'

/* ── the manifesto i18n parity gates ──────────────────────────────────────────
   Four hand-written variants of one essay: every locale must carry the same
   SHAPE as EN (same fields, same list lengths, nothing empty), the URL
   cluster must prerender (LOCALES ⊆ PATHS), and the BCP 47 tags must be
   well-formed — a missing translation or a dropped PATHS line goes red here,
   never silently 404s in prod. */

const [EN, ...ALTS] = MANIFESTO_LOCALES

describe('/manifesto · the BCP 47 cluster holds parity', () => {
  it('ships EN + fr + es + zh-Hans with canonical tags', () => {
    expect(MANIFESTO_LOCALES.map((l) => l.bcp47)).toEqual(['en', 'fr', 'es', 'zh-Hans'])
    for (const l of MANIFESTO_LOCALES)
      expect(l.bcp47).toMatch(/^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$/)
  })

  it('every locale path prerenders (LOCALES ⊆ PATHS · EN is x-default)', () => {
    expect(EN.path).toBe('/manifesto')
    expect(PATHS).toContain('/manifesto')
    expect([...MANIFESTO_PATHS].sort()).toEqual(
      ALTS.map((l) => l.path).sort(),
    )
    for (const p of MANIFESTO_PATHS) expect(PATHS).toContain(p)
  })

  it('every locale carries the full copy shape · no empty field, EN-parity lists', () => {
    for (const l of MANIFESTO_LOCALES) {
      expect(Object.keys(l).sort()).toEqual(Object.keys(EN).sort())
      expect(l.stack).toHaveLength(EN.stack.length)
      expect(l.promises).toHaveLength(EN.promises.length)
      expect(l.promises.map((p) => p.n)).toEqual(EN.promises.map((p) => p.n))
      for (const [k, v] of Object.entries(l)) {
        if (typeof v === 'string') expect(v.length, `${l.bcp47}.${k}`).toBeGreaterThan(0)
        if (Array.isArray(v)) expect(v.length, `${l.bcp47}.${k}`).toBeGreaterThan(0)
      }
      /* segment arrays stay non-degenerate: at least one bright span where EN has one */
      for (const key of ['friday', 'rented', 'agent', 'openSource'] as const) {
        const bright = l[key].filter((x) => typeof x !== 'string' && 'fg' in x)
        expect(bright.length, `${l.bcp47}.${key} fg`).toBeGreaterThan(0)
      }
    }
  })

  it('the resolver maps paths to their locale and defaults to EN', () => {
    expect(manifestoCopyFor('/manifesto').bcp47).toBe('en')
    expect(manifestoCopyFor('/fr/manifesto').bcp47).toBe('fr')
    expect(manifestoCopyFor('/es/manifesto/').bcp47).toBe('es')
    expect(manifestoCopyFor('/zh-hans/manifesto').bcp47).toBe('zh-Hans')
    expect(manifestoCopyFor('/de/manifesto').bcp47).toBe('en')
  })
})

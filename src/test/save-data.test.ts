import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { prefersLiteData } from '../lib/save-data'

const ROOT = join(__dirname, '../..')

/* ── the lite-data signal (W-H · WO-12) ───────────────────────────────────────
   Injectable deps make the truth table testable without stubbing globals:
   the Save-Data client hint wins, the reduced-data media query backs it up,
   absence of both (or a throwing matchMedia) means false — never a crash. */

const mq = (matches: boolean) => () => ({ matches })

describe('prefersLiteData · the truth table', () => {
  it('Save-Data hint on → true (regardless of the media query)', () => {
    expect(prefersLiteData({ connection: { saveData: true } }, mq(false))).toBe(true)
    expect(prefersLiteData({ connection: { saveData: true } }, undefined)).toBe(true)
  })

  it('prefers-reduced-data → true when the hint is absent', () => {
    expect(prefersLiteData({}, mq(true))).toBe(true)
    expect(prefersLiteData({ connection: { saveData: false } }, mq(true))).toBe(true)
  })

  it('neither signal → false', () => {
    expect(prefersLiteData({}, mq(false))).toBe(false)
    expect(prefersLiteData({ connection: {} }, mq(false))).toBe(false)
    expect(prefersLiteData({}, undefined)).toBe(false)
  })

  it('a throwing matchMedia (unknown query in an old engine) → false, never a crash', () => {
    expect(
      prefersLiteData({}, () => {
        throw new Error('unsupported')
      }),
    ).toBe(false)
  })
})

/* ── the law reaches every GL surface (structural) ────────────────────────────
   lib/save-data's header states the contract: consumers gate the HEAVY LAZY
   layers — « the three.js scenes » — on this signal. VerbGlyphTile did not:
   it had hand-rolled the capability check (wide + reduced + hasWebGL) and
   simply never grew the prefersLiteData clause, so a Save-Data visitor on the
   HOME page pulled the three.js chunk anyway. A pure-function gate could not
   see that; the miss was in who called it.

   So the capability check has exactly one home (use-plan3d · use3dCapable),
   and a second copy is what goes red here. The tell is a private hasWebGL(). */
describe('save-data · one capability gate, no private copies', () => {
  const sceneFiles: string[] = []
  const walk = (dir: string) => {
    for (const name of readdirSync(join(ROOT, dir))) {
      const rel = join(dir, name)
      if (statSync(join(ROOT, rel)).isDirectory()) walk(rel)
      else if (/\.(ts|tsx)$/.test(name)) sceneFiles.push(rel)
    }
  }
  walk('src/scene')

  it('only use-plan3d probes for a WebGL context', () => {
    const owners = sceneFiles.filter((f) => /function\s+hasWebGL\s*\(/.test(readFileSync(join(ROOT, f), 'utf8')))
    expect(owners, `a second capability gate drifts: ${owners.join(', ')}`).toEqual([
      'src/scene/use-plan3d.ts',
    ])
  })

  it('every scene that gates a GL mount reads the shared hook', () => {
    for (const f of sceneFiles) {
      const src = readFileSync(join(ROOT, f), 'utf8')
      if (!/prefers-reduced-motion/.test(src)) continue
      if (f.endsWith('use-plan3d.ts')) continue
      /* a surface may own its motion read for a NON-mount reason (DitherField
         swaps loop mode, GalaxyEgg short-circuits an intro) — what it may not
         do is decide a lazy three.js MOUNT without the shared contract */
      if (!/lazy\(\s*\(\)\s*=>\s*import\(/.test(src)) continue
      expect(src, `${f} gates a lazy GL mount without use3dCapable/usePlan3D`).toMatch(
        /use3dCapable|usePlan3D/,
      )
    }
  })
})

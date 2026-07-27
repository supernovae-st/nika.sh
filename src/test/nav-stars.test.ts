import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { NAV_STARS, STAR_LAYERS } from '../content/nav-stars.generated'

/* ── the rail's constellation · gates ─────────────────────────────────────────
   The Reference rail draws the site's own graph: the same stars /map serves,
   read out of the compiled SVG, lifted into depth by their layer. Three things
   must hold, and the third is the one that keeps it honest.

   The geometry is DERIVED (from the drawing) and the palette is BORROWED (from
   the CSS custom properties the design SSOT projects). Neither is authored
   here, so neither can drift into a private second opinion about what the
   ontology looks like. */

const ROOT = join(__dirname, '../..')

describe('nav stars · the rail draws the site, not a decoration', () => {
  it('the geometry is exactly what the compiler emits today', () => {
    const path = join(ROOT, 'src/content/nav-stars.generated.ts')
    const committed = readFileSync(path, 'utf8')
    execFileSync('node', [join(ROOT, 'scripts/build-nav-stars.mjs')], { stdio: 'pipe' })
    expect(readFileSync(path, 'utf8')).toBe(committed)
  })

  it('every layer of the ontology is in the sky', () => {
    expect(STAR_LAYERS.length).toBe(7)
    const seen = new Set(NAV_STARS.map(([, , layer]) => layer))
    for (let i = 0; i < STAR_LAYERS.length; i += 1) {
      expect(seen.has(i), `no star carries layer ${STAR_LAYERS[i]}`).toBe(true)
    }
    expect(NAV_STARS.length).toBeGreaterThan(120)
  })

  it('the stars sit in the unit box the renderer expects', () => {
    for (const [x, y, layer] of NAV_STARS) {
      expect(Math.abs(x), 'x outside the unit box').toBeLessThanOrEqual(1.001)
      expect(Math.abs(y), 'y outside the unit box').toBeLessThanOrEqual(1.001)
      expect(layer).toBeGreaterThanOrEqual(0)
      expect(layer).toBeLessThan(STAR_LAYERS.length)
    }
  })

  /* THE PALETTE IS BORROWED, NEVER COPIED. Seven hues hard-coded in the canvas
     would be a second opinion about the ontology's colours, and it would drift
     the day a layer's token moved. The renderer reads --layer-* off the root,
     which is what the design projection writes. */
  it('the renderer takes its hues from the CSS custom properties', () => {
    const src = readFileSync(join(ROOT, 'src/shell/NavConstellation.tsx'), 'utf8')
    expect(src, 'the canvas stopped reading --layer-*').toContain('--layer-')
    const hexes = [...src.matchAll(/#[0-9a-fA-F]{6}\b/g)].map((m) => m[0])
    /* one fallback is allowed (a hue for the impossible case where the var is
       missing); a palette is not */
    expect(hexes.length, `hard-coded hues in the canvas: ${hexes.join(' ')}`).toBeLessThanOrEqual(1)
  })

  /* it must stay OUT of the entry: a menu that fetches geometry before anyone
     opens it is the register-diet law broken in the chrome */
  it('the canvas is reached lazily, never imported into the shell', () => {
    const nav = readFileSync(join(ROOT, 'src/shell/Nav.tsx'), 'utf8')
    expect(nav).toContain("lazy(() => import('./NavConstellation'))")
    expect(
      /import\s+NavConstellation\s+from/.test(nav),
      'the shell imports the canvas eagerly',
    ).toBe(false)
  })

  /* and it must ask before it moves */
  it('the canvas honours reduced motion and Save-Data', () => {
    const src = readFileSync(join(ROOT, 'src/shell/NavConstellation.tsx'), 'utf8')
    expect(src, 'Save-Data is not consulted').toContain('prefersLiteData')
    expect(src, 'reduced motion is not consulted').toContain('prefers-reduced-motion')
  })
})

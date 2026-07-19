import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { LAYER_HEX, LAYER_RGB, PAPER, MOTION_DUR_MS, MOTION_EASE } from '../content/design.generated'

/* ─── design-graph.test · fenêtre A gates (LENS_DESIGN_GRAPH §4) ─────────────
   Three laws, none about specific VALUES (values change spec-first and the
   byte-diff in atlas.test already judges the emissions):

   1. FOLD LAW — a file folded into the graph can never grow a raw hex
      back (each folded file's hex census ⊆ its explicit local-assumed
      allowlist · comments excluded).
   2. CSS RATCHET — the organic hex population across src css only ever
      shrinks (law 5: each var either consumes the graph or declares
      itself local — the ceiling pins today's measured count).
   3. COHERENCE — the three emissions carry the SAME resolution (css vars
      == ts exports == palette json), so no consumer can disagree. */

const ROOT = join(__dirname, '../..')
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8')

/** hex literals in CODE (line-comment & block-comment prose stripped) */
const hexCensus = (src: string) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    .match(/#[0-9a-fA-F]{6}\b/g) ?? []

describe('design graph · the fold law (folded files stay folded)', () => {
  const FOLDED: Record<string, string[]> = {
    'scripts/atlas/lib/render-constellation.mjs': [],
    'scripts/build-og-card.mjs': [],
    'src/pages/Map3dScene.tsx': ['#8fa3bf', '#3d4f6b'],
    'src/pages/map-page.css': ['#e8eefc', '#34d399', '#22d3ee', '#5b8cff', '#b07bff', '#ff7a3c', '#ff5d5d'],
  }
  for (const [file, allow] of Object.entries(FOLDED)) {
    it(`${file} declares no hex outside its local-assumed allowlist`, () => {
      const found = [...new Set(hexCensus(read(file)))]
      const strays = found.filter((h) => !allow.includes(h.toLowerCase()))
      expect(strays, `${file} grew raw hex back: ${strays.join(' ')}`).toEqual([])
    })
  }
})

describe('design graph · the css ratchet (law 5 · only ever shrinks)', () => {
  it('src css hex population stays at or under the pinned ceiling', () => {
    const cssFiles: string[] = []
    const walk = (dir: string) => {
      for (const name of readdirSync(join(ROOT, dir))) {
        const rel = join(dir, name)
        if (statSync(join(ROOT, rel)).isDirectory()) walk(rel)
        else if (name.endsWith('.css') && !name.endsWith('.generated.css')) cssFiles.push(rel)
      }
    }
    walk('src')
    const total = cssFiles.reduce((n, f) => n + hexCensus(read(f)).length, 0)
    /* measured 2026-07-19 (fenêtre A pin, after the map-page fold — the
       organic population of the 8 css families). A PR that adds a hex to
       authored css must either consume the graph or lower elsewhere —
       raising the ceiling is a design-graph decision, not a drive-by. */
    const CEILING = 228
    expect(total, `src css hex count ${total} > ceiling ${CEILING}`).toBeLessThanOrEqual(CEILING)
  })
})

describe('design graph · cross-emission coherence (one resolution, three files)', () => {
  const css = read('src/design.generated.css')
  const cssVar = (name: string) => {
    const m = css.match(new RegExp(`--${name}: ([^;]+);`))
    if (!m) throw new Error(`design.generated.css: --${name} missing`)
    return m[1]
  }
  const palette = JSON.parse(read('public/design-palette.json'))

  it('layers agree across css, ts and json', () => {
    for (const [layer, hex] of Object.entries(LAYER_HEX)) {
      expect(cssVar(`layer-${layer}`)).toBe(hex)
      expect(palette.layers[layer]).toBe(hex)
    }
  })

  it('paper agrees across css, ts and json', () => {
    for (const [k, v] of Object.entries(PAPER)) {
      expect(cssVar(`paper-${k}`)).toBe(v)
      expect(palette.paper[k]).toBe(v)
    }
  })

  it('motion agrees across css, ts and json', () => {
    for (const [k, ms] of Object.entries(MOTION_DUR_MS)) {
      expect(cssVar(`dur-${k}`)).toBe(`${ms}ms`)
      expect(palette.motion.dur[k]).toBe(ms)
    }
    for (const [k, ease] of Object.entries(MOTION_EASE)) {
      expect(cssVar(`ease-${k}`)).toBe(ease)
      expect(palette.motion.ease[k]).toBe(ease)
    }
  })

  it('layer RGB triples are the hex, normalized (the 3D seam cannot skew)', () => {
    for (const [layer, hex] of Object.entries(LAYER_HEX)) {
      const triple = LAYER_RGB[layer as keyof typeof LAYER_RGB]
      ;[1, 3, 5].forEach((at, i) => {
        expect(Math.abs(triple[i] - parseInt(hex.slice(at, at + 2), 16) / 255)).toBeLessThan(1e-4)
      })
    }
  })

  it('the map surfaces consume the graph (no local hue map can return)', () => {
    expect(read('src/pages/Map3dScene.tsx')).toContain("from '../content/design.generated'")
    for (const layer of Object.keys(LAYER_HEX))
      expect(read('src/pages/map-page.css')).toContain(`var(--layer-${layer})`)
    expect(read('src/index.css')).toContain("@import './design.generated.css'")
  })
})

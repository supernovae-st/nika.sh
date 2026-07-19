import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { LAYER_HEX, LAYER_RGB, KIND_HEX, KIND_RGB, KIND_GLYPH, PAPER, MOTION_DUR_MS, MOTION_EASE } from '../content/design.generated'

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

  it('the status recipe is emitted and the three surfaces consume it (law 2)', () => {
    const css = read('src/design.generated.css')
    for (const status of ['ratified', 'shipped', 'both'])
      expect(css).toContain(`.st-mark[data-status='${status}']::before`)
    for (const [file, cls] of [
      ['src/shell/Inspector.tsx', 'insp-status st-mark'],
      ['src/shell/HoverCard.tsx', 'hovercard-status st-mark'],
      ['src/pages/MemberRoom.tsx', 'hub-authority st-mark'],
    ])
      expect(read(file), `${file} lost the st-mark`).toContain(cls)
  })

  it('inline ms population only ever shrinks (law 3 ratchet)', () => {
    const cssFiles: string[] = []
    const walk = (dir: string) => {
      for (const name of readdirSync(join(ROOT, dir))) {
        const rel = join(dir, name)
        if (statSync(join(ROOT, rel)).isDirectory()) walk(rel)
        else if (name.endsWith('.css') && !name.endsWith('.generated.css')) cssFiles.push(rel)
      }
    }
    walk('src')
    const total = cssFiles.reduce(
      (n, f) => n + (read(f).match(/[0-9]+ms\b/g) ?? []).length,
      0,
    )
    /* measured 2026-07-19 (fenêtre B pin, after the touched-surface fold).
       New animation cites a token (var(--dur-*) / var(--ease-*)); legacy
       numbers convert window by window — the ceiling only descends. */
    const CEILING = 97
    expect(total, `inline ms count ${total} > ceiling ${CEILING}`).toBeLessThanOrEqual(CEILING)
  })

  it('kinds agree across css, ts, json and dtcg — glyph carried, RGB exact (fenêtre C)', () => {
    const dtcg = JSON.parse(read('public/design-tokens.dtcg.json'))
    for (const [kind, hex] of Object.entries(KIND_HEX)) {
      expect(cssVar(`kind-${kind}`)).toBe(hex)
      expect(palette.kinds[kind].hex).toBe(hex)
      expect(palette.kinds[kind].glyph).toBe(KIND_GLYPH[kind as keyof typeof KIND_GLYPH])
      expect(dtcg.kind[kind].$value).toBe(hex)
      const triple = KIND_RGB[kind as keyof typeof KIND_RGB]
      ;[1, 3, 5].forEach((at, i) => {
        expect(Math.abs(triple[i] - parseInt(hex.slice(at, at + 2), 16) / 255)).toBeLessThan(1e-4)
      })
    }
  })

  it('the sota values are emitted (§7a) and the elevation ladder is ONE declaration', () => {
    const css = read('src/design.generated.css')
    for (const v of ['--focus-ring-w', '--pressed-dur', '--phosphor-tight', '--grain-opacity', '--surface-0'])
      expect(css, `${v} missing`).toContain(v)
    expect(css).toContain('--surface-1: oklch(from var(--surface-0)')
    expect(css).toContain("[data-verb-scope='infer'] ::selection")
    expect(css).toContain('@media (color-gamut: p3)')
  })

  it('the tailwind seam derives from the graph (§7c) without shadowing defaults', () => {
    const css = read('src/design.generated.css')
    expect(css).toContain('@theme inline')
    expect(css).toContain('--color-kind-error: var(--kind-error)')
    expect(css).toContain('--ease-snap: var(--ease-snap)')
    expect(css.match(/@theme inline \{[^}]*\}/s)?.[0]).not.toContain('--ease-out')
  })

  it('the forced-colors theme is emitted from the same descriptor (§7b)', () => {
    const fc = read('src/design.forced-colors.generated.css')
    expect(fc).toContain('@media (forced-colors: active)')
    for (const kind of Object.keys(KIND_HEX)) expect(fc).toContain(`--kind-${kind}: CanvasText`)
    expect(fc).toContain('outline: 1px solid transparent')
    expect(fc).toContain('forced-color-adjust: none')
    expect(read('src/index.css')).toContain("@import './design.forced-colors.generated.css'")
  })

  it('the dtcg export types its tokens (§7b · the site↔studio bridge)', () => {
    const dtcg = JSON.parse(read('public/design-tokens.dtcg.json'))
    expect(dtcg.$description).toContain('Apache-2.0')
    for (const group of ['verb', 'severity', 'paper', 'layer', 'kind'])
      for (const tok of Object.values<{ $type: string; $value: string }>(dtcg[group]))
        expect(tok.$type).toBe('color')
    for (const tok of Object.values<{ $type: string }>(dtcg.duration)) expect(tok.$type).toBe('duration')
  })

  it('kinds reach the surfaces THROUGH the graph (no local family map · fenêtre C+)', () => {
    const readout = read('src/shell/inspector-readout.ts')
    expect(readout).toContain("from '../content/design.generated'")
    expect(readout).toContain('NODE_GLYPH')
    const css = read('src/design.generated.css')
    for (const kind of Object.keys(KIND_HEX))
      expect(css).toContain(`.k-glyph[data-kind='${kind}'] { color: var(--kind-${kind}); }`)
    for (const f of ['src/pages/MemberRoom.tsx', 'src/shell/HoverCard.tsx', 'src/shell/Inspector.tsx'])
      expect(read(f), `${f} lost the k-glyph voice`).toContain('k-glyph')
    const ts = read('src/content/design.generated.ts')
    expect(ts).toContain('KIND_OF_SET')
  })

  it('the 3D scene speaks the kinds seam (member stars resolve through KIND_OF_SET)', () => {
    const scene = read('src/pages/Map3dScene.tsx')
    expect(scene).toContain('KIND_HEX')
    expect(scene).toContain('KIND_OF_SET[m.set]')
  })

  it('the palette speaks the graph for every declared family (⌘K fold)', () => {
    const ck = read('src/shell/CommandK.tsx')
    expect(ck).toContain("from '../content/design.generated'")
    expect(ck).toContain('PALETTE_GLYPH')
    for (const kind of Object.keys(KIND_HEX))
      expect(ck, `palette keeps a local glyph for the declared kind '${kind}'`).not.toMatch(
        new RegExp(`PALETTE_GLYPH[^}]*${kind}:`, 's'),
      )
  })

  it('/brand projects the graph (every family rendered from the emission)', () => {
    const brand = read('src/pages/Brand.tsx')
    expect(brand).toContain("from '../content/design.generated'")
    for (const name of ['LAYER_HEX', 'KIND_HEX', 'PAPER', 'MOTION_DUR_MS', 'STATUS_RECIPE'])
      expect(brand, `/brand lost the ${name} projection`).toContain(name)
  })

  it('the map surfaces consume the graph (no local hue map can return)', () => {
    expect(read('src/pages/Map3dScene.tsx')).toContain("from '../content/design.generated'")
    for (const layer of Object.keys(LAYER_HEX))
      expect(read('src/pages/map-page.css')).toContain(`var(--layer-${layer})`)
    expect(read('src/index.css')).toContain("@import './design.generated.css'")
  })
})

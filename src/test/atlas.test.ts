import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ATLAS_NODES, ATLAS_EDGES, ATLAS_INDEX } from '../content/atlas.generated'
import { ATLAS_PROVENANCE, ATLAS_SET_COUNTS, ATLAS_HUBS, ATLAS_SCORE } from '../content/atlas-meta.generated'
import { JSONLD_TERMSETS } from '../content/jsonld.generated'
import { HUBS } from '../pages/hub-data.generated'
import { hubJsonldSets } from '../pages/hub-lib'
import { MARKET_VOCAB } from '../content/market-vocab.generated'
import { SNIPPETS, SNIPPET_REGISTRY, CAPTURES } from '../content/snippets.generated'
import { PATHS } from '../../site.config'

/* ── the atlas compiler gates ─────────────────────────────────────────────────
   build-atlas.mjs is the ONE compiler of the language atlas; these gates make
   its whole output surface un-driftable: recompile + byte-diff every emission
   (the errors.test.ts pattern, ×6), pin the twin to the module, cross-check
   counts against the census (two independent readers of the same sources must
   agree), and hold the §6.1 score at GREEN — a canonical member without a
   surface goes red HERE with its name in the diff. */

const ROOT = join(__dirname, '../..')
const OUTPUTS = [
  'src/content/atlas.generated.ts',
  'src/content/atlas-meta.generated.ts',
  'src/content/jsonld.generated.ts',
  'src/content/market-vocab.generated.ts',
  'src/content/snippets.generated.ts',
  'src/content/atlas-nav.generated.ts',
  'src/content/room-rails.generated.ts',
  'src/content/showcase-dag.generated.ts',
  'src/pages/map-data.generated.ts',
  'src/pages/hub-data.generated.ts',
  'src/assets/constellation.generated.svg',
  'public/map/constellation.svg',
  'public/ontology/language.json',
  'public/redirects.json',
  // the in-place ATLAS_PATHS block + the moved-row 301 stubs are emissions too
  'site.config.ts',
  ...JSON.parse(readFileSync(join(__dirname, '../../public/redirects.json'), 'utf8'))
    .redirects.filter((r: { from: string }) => r.from.startsWith('/providers/'))
    .map((r: { from: string }) => `public${r.from}/index.html`),
]

describe('atlas · the compiler is idempotent and the score is green', () => {
  it('every emission is exactly what the compiler emits today (and the score exits green)', () => {
    const before = OUTPUTS.map((p) => readFileSync(join(ROOT, p), 'utf8'))
    // exits 2 on any armed §6.1 violation — a red score fails right here
    execFileSync('node', [join(ROOT, 'scripts/atlas/build-atlas.mjs')])
    OUTPUTS.forEach((p, i) => {
      expect(readFileSync(join(ROOT, p), 'utf8'), `${p} drifted`).toBe(before[i])
    })
  })

  it('the committed score is 100 with every waiver written', () => {
    expect(ATLAS_SCORE.score).toBe(100)
    for (const w of ATLAS_SCORE.waived) expect(w).toMatch(/lands in WO-\d|waiver dies/i)
  })
})

describe('atlas · the twin is the module, byte-level', () => {
  it('public/ontology/language.json carries the same provenance, nodes and edges', () => {
    const twin = JSON.parse(readFileSync(join(ROOT, 'public/ontology/language.json'), 'utf8'))
    expect(twin.language_graph).toBe(1)
    expect(twin.spec_pin).toBe(ATLAS_PROVENANCE.spec_pin)
    expect(twin.engine_version).toBe(ATLAS_PROVENANCE.engine_version)
    expect(twin.nodes).toEqual(ATLAS_NODES)
    expect(twin.edges).toEqual(ATLAS_EDGES)
  })
})

describe('atlas · two independent readers agree (census cross-check)', () => {
  const census = JSON.parse(
    execFileSync('node', [join(ROOT, 'scripts/atlas/census.mjs'), '--json'], { encoding: 'utf8' }),
  ) as { sets: { id: string; count: number }[] }
  const censusCount = (id: string) => census.sets.find((s) => s.id === id)?.count

  it.each([
    ['verbs', 'verbs'],
    ['namespaces', 'namespaces'],
    ['templates', 'templates'],
    ['extract-modes', 'extract-modes'],
    ['mcp.tools', 'mcp-tools'],
    ['errors.codes', 'error-codes'],
    ['providers.shipped', 'providers'],
  ])('census %s == atlas %s', (censusId, atlasId) => {
    expect(ATLAS_SET_COUNTS[atlasId].count).toBe(censusCount(censusId))
  })

  it('builtins cover the shipped catalog (union with ratified)', () => {
    expect(ATLAS_SET_COUNTS.builtins.count).toBeGreaterThanOrEqual(censusCount('builtins.shipped')!)
  })

  it('the words register covers every schema word (task + envelope are subsets)', () => {
    expect(ATLAS_SET_COUNTS.words.count).toBeGreaterThanOrEqual(
      censusCount('words.task')! + censusCount('words.envelope')!,
    )
  })
})

describe('atlas · rooms and routes cover each other', () => {
  const pathSet = new Set(PATHS)
  it('every room member the atlas declares is a served route', () => {
    for (const n of ATLAS_NODES) {
      if (n.kind !== 'member' || !n.url || n.anchor) continue
      // room members only (anchored members point at pages judged below)
      const set = ATLAS_INDEX[`set:${n.set}`]
      if (set?.surface !== 'rooms') continue
      expect(pathSet.has(n.url), `${n.id} → ${n.url} missing from PATHS`).toBe(true)
    }
  })

  it('every anchored member points at a page that exists or is landing', () => {
    const landing = new Set(['/flow', '/boundary', '/proof', '/sources', '/map'])
    for (const n of ATLAS_NODES) {
      if (n.kind !== 'member' || !n.anchor || !n.url) continue
      const page = n.url.split('#')[0]
      expect(
        pathSet.has(page) || landing.has(page),
        `${n.id} anchors on ${page} (neither served nor landing)`,
      ).toBe(true)
    }
  })

  it('every atlas route in PATHS resolves to an atlas node or a declared move (no orphan registry)', () => {
    const atlasUrls = new Set(ATLAS_NODES.filter((n) => n.url).map((n) => n.url!.split('#')[0]))
    const moved = new Set(
      (
        JSON.parse(readFileSync(join(ROOT, 'public/redirects.json'), 'utf8')) as {
          redirects: { from: string }[]
        }
      ).redirects.map((r) => r.from),
    )
    const atlasRoots = ['/language/', '/verbs/', '/tools/', '/templates/', '/errors/', '/providers/']
    for (const p of PATHS) {
      if (!atlasRoots.some((r) => p.startsWith(r))) continue
      expect(
        atlasUrls.has(p) || moved.has(p),
        `${p} served but unknown to the atlas (neither a node nor a declared move)`,
      ).toBe(true)
    }
  })
})

describe('atlas · the graph is referentially whole', () => {
  it('every edge endpoint resolves and kinds stay in the closed enum', () => {
    const kinds = new Set([
      'member-of', 'belongs-to', 'names', 'grants', 'accepts',
      'carries', 'defined-by', 'witnesses', 'projects-to', 'mentions',
    ])
    for (const e of ATLAS_EDGES) {
      expect(ATLAS_INDEX[e.from], `missing from: ${e.from}`).toBeDefined()
      expect(ATLAS_INDEX[e.to], `missing to: ${e.to}`).toBeDefined()
      expect(kinds.has(e.kind), e.kind).toBe(true)
    }
  })

  it('the clock diff is computed, never written: builtin statuses partition', () => {
    for (const n of ATLAS_NODES.filter((x) => x.kind === 'member' && x.set === 'builtins')) {
      expect(['ratified', 'shipped', 'both']).toContain(n.status)
    }
  })

  it('the seven hubs chain the reading order', () => {
    expect(ATLAS_HUBS.map((h) => h.id)).toEqual([
      'shape', 'flow', 'acts', 'reach', 'boundary', 'refusals', 'proof',
    ])
  })
})

describe('atlas · the register diet holds (the namespace-retention law)', () => {
  it('nothing imports usecases-yaml.generated statically except the access doors and tests', () => {
    const offenders: string[] = []
    const walk = (dir: string) => {
      for (const name of readdirSync(join(ROOT, dir))) {
        const rel = `${dir}/${name}`
        const full = join(ROOT, rel)
        if (statSync(full).isDirectory()) {
          walk(rel)
          continue
        }
        if (!/\.(ts|tsx)$/.test(name) || /\.test\.tsx?$/.test(name)) continue
        if (rel.endsWith('sections/showcase-yaml-access.ts')) continue
        if (rel.endsWith('sections/usecases-yaml.generated.ts')) continue
        const src = readFileSync(full, 'utf8')
        if (/^import[^\n]*from ['"].*usecases-yaml\.generated['"]/m.test(src)) offenders.push(rel)
      }
    }
    walk('src')
    expect(offenders, `static import re-pins the 79K to the initial chunk: ${offenders.join(', ')}`).toEqual([])
  })

  it('nothing imports blog-rails.generated statically except its access doors and tests', () => {
    const offenders: string[] = []
    const walk = (dir: string) => {
      for (const name of readdirSync(join(ROOT, dir))) {
        const rel = `${dir}/${name}`
        const full = join(ROOT, rel)
        if (statSync(full).isDirectory()) {
          walk(rel)
          continue
        }
        if (!/\.(ts|tsx)$/.test(name) || /\.test\.tsx?$/.test(name)) continue
        if (rel.endsWith('lib/blog-rails-access.ts')) continue
        if (rel.endsWith('content/blog-rails.generated.ts')) continue
        const src = readFileSync(full, 'utf8')
        if (/^import[^\n]*from ['"].*blog-rails\.generated['"]/m.test(src)) offenders.push(rel)
      }
    }
    walk('src')
    expect(offenders, `static import re-pins the rails to the initial chunk: ${offenders.join(', ')}`).toEqual([])
  })
})

describe('atlas · the derived DAG module IS the projector export', () => {
  it('showcase-dag.generated toEqual usecases-yaml.generated SHOWCASE_DAG (value-equal, both directions)', async () => {
    const source = (await import('../sections/usecases-yaml.generated')).SHOWCASE_DAG
    const derived = (await import('../content/showcase-dag.generated')).SHOWCASE_DAG
    expect(derived).toEqual(source)
  })
})

describe('atlas · jsonld and market vocab stay lawful', () => {
  /* the derived-inverses law: the hubs rebuild their DefinedTermSets from
     bundle-resident HubData (never a second shipped copy of the 80K corpus)
     — this gate holds the derivation equal to the twin's ANCHORED sets (a
     room set — showcases — catalogs terms living on their own pages; its
     JSON-LD mounts with those pages at WO-7, not in the hub head) */
  it('the hub head derivation IS the twin, for every set anchored on the page', () => {
    for (const h of Object.values(HUBS)) {
      const anchoredHere = (JSONLD_TERMSETS[h.hub] ?? []).filter((t) => {
        const terms = (t as { hasDefinedTerm: { '@id': string }[] }).hasDefinedTerm
        return terms.every((term) => term['@id'].includes(`${h.hub}#`))
      })
      expect(hubJsonldSets(h), h.hub).toEqual(anchoredHere)
    }
  })


  it('every DefinedTermSet carries license + version and unique termCodes', () => {
    for (const [page, sets] of Object.entries(JSONLD_TERMSETS)) {
      expect(page.startsWith('/'), page).toBe(true)
      for (const ts of sets as { hasDefinedTerm: { termCode: string }[]; license: string }[]) {
        expect(ts.license).toContain('apache')
        const codes = ts.hasDefinedTerm.map((t) => t.termCode)
        expect(new Set(codes).size, `${page} termCodes collide`).toBe(codes.length)
        expect(codes.length).toBeGreaterThan(0)
      }
    }
  })

  it('market vocab carries the four §0.10 locked EN terms, nodes resolved', () => {
    expect(Object.keys(MARKET_VOCAB).sort()).toEqual([
      'layer:acts', 'layer:flow', 'layer:reach', 'surface:home',
    ])
    for (const [node, v] of Object.entries(MARKET_VOCAB)) {
      expect(ATLAS_INDEX[node], `vocab node ${node} not in atlas`).toBeDefined()
      expect(v.volume_mo).toBeGreaterThan(0)
      expect(v.observed).toBe('2026-07')
    }
  })

  it('market phrases never leak into page prose (the copy-drift grep gate)', () => {
    const phrases = Object.values(MARKET_VOCAB).map((v) => v.term)
    const dirs = ['src/pages', 'src/sections']
    for (const dir of dirs) {
      for (const f of readdirSync(join(ROOT, dir), { recursive: true }) as string[]) {
        if (!/\.(tsx?|css)$/.test(f) || f.includes('.generated.')) continue
        const body = readFileSync(join(ROOT, dir, f), 'utf8').toLowerCase()
        for (const p of phrases) {
          expect(body.includes(p.toLowerCase()), `${dir}/${f} hand-writes "${p}"`).toBe(false)
        }
      }
    }
  })
})

describe('atlas · the snippet manifest (§2bis · no floating code)', () => {
  it('templates and showcases are manifest-covered with their pins and shas', () => {
    const templates = SNIPPETS.filter((s) => s.source.kind === 'spec-template')
    const catalog = JSON.parse(readFileSync(join(ROOT, 'public/templates/catalog.json'), 'utf8')) as {
      templates: { name: string; sha256: string }[]
    }
    expect(templates.length).toBe(catalog.templates.length)
    for (const t of catalog.templates) {
      const snip = SNIPPETS.find((s) => s.id === `snip:template:${t.name}`)
      expect(snip?.source.sha256, t.name).toBe(t.sha256)
    }
    expect(SNIPPETS.filter((s) => s.source.kind === 'spec-showcase').length).toBeGreaterThanOrEqual(26)
  })

  it('all seven heroes are classed with a legal §2bis class and a badge', () => {
    const heroes = SNIPPETS.filter((s) => s.id.startsWith('snip:hero:'))
    expect(heroes.length).toBe(7)
    for (const h of heroes) {
      expect(['spec-vendored', 'crafted-room']).toContain(h.source.kind)
      expect(h.badge.length).toBeGreaterThan(10)
      expect(h.gates.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('every registered inline-yaml file exists and names its gate', () => {
    for (const r of SNIPPET_REGISTRY) {
      expect(() => readFileSync(join(ROOT, r.file), 'utf8'), r.file).not.toThrow()
      expect(r.gate.length, r.file).toBeGreaterThan(8)
    }
  })

  it('every registered capture surface exists, exports its transcript and names its gate (§2bis law 4)', () => {
    expect(CAPTURES.length).toBeGreaterThanOrEqual(4)
    for (const c of CAPTURES) {
      const body = readFileSync(join(ROOT, c.surface), 'utf8')
      expect(body.includes(c.export), `${c.id}: ${c.export} not exported by ${c.surface}`).toBe(true)
      expect(c.command.startsWith('nika '), c.id).toBe(true)
      expect(c.gate.length, c.id).toBeGreaterThan(8)
    }
  })

  it('THE LINT: no nika-yaml literal outside the registry and generated modules', () => {
    const registered = new Set(SNIPPET_REGISTRY.map((r) => r.file))
    const dirs = ['src/pages', 'src/sections', 'src/shell', 'src/content', 'src/flagships', 'src/components']
    const offenders: string[] = []
    for (const dir of dirs) {
      for (const f of readdirSync(join(ROOT, dir), { recursive: true }) as string[]) {
        if (!/\.(tsx?|mts)$/.test(f)) continue
        const rel = `${dir}/${f}`
        if (rel.includes('.generated.') || rel.includes('.test.')) continue
        const body = readFileSync(join(ROOT, rel), 'utf8')
        if (body.includes('nika: v1') && !registered.has(rel)) offenders.push(rel)
      }
    }
    expect(offenders, `unregistered inline nika-yaml: ${offenders.join(' · ')} — register it in sets.yaml snippet_registry with its gate, or move it behind a generated module`).toEqual([])
  })
})

describe('atlas · the palette covers every living room (⌘K parity)', () => {
  it('every member of an existing rooms-set has a palette entry at its href', async () => {
    const { PALETTE } = await import('../content/palette.generated')
    const hrefs = new Set(PALETTE.map((p: { href: string }) => p.href))
    for (const n of ATLAS_NODES) {
      if (n.kind !== 'member' || !n.url || n.anchor) continue
      const set = ATLAS_INDEX[`set:${n.set}`]
      if (set?.surface !== 'rooms' || (set as { page_exists?: boolean }).page_exists === false) continue
      expect(hrefs.has(n.url), `${n.id} room ${n.url} missing from the palette`).toBe(true)
    }
  })

  it('provenance sanity: the vendored catalog vintage never exceeds the release', () => {
    const v = (s: string) => s.replace(/^v/, '').split('.').map(Number)
    const [cat, eng] = [v(ATLAS_PROVENANCE.catalogs.tools), v(ATLAS_PROVENANCE.engine_version)]
    const le = cat[0] < eng[0] || (cat[0] === eng[0] && (cat[1] < eng[1] || (cat[1] === eng[1] && cat[2] <= eng[2])))
    expect(le, `catalogs ${ATLAS_PROVENANCE.catalogs.tools} newer than displayed release ${ATLAS_PROVENANCE.engine_version}?`).toBe(true)
  })
})

describe('atlas · bundle safety (the register island law)', () => {
  it('no page, section or shell imports the full graph statically', () => {
    const dirs = ['src/pages', 'src/sections', 'src/shell']
    for (const dir of dirs) {
      for (const f of readdirSync(join(ROOT, dir), { recursive: true }) as string[]) {
        if (!/\.tsx?$/.test(f)) continue
        const body = readFileSync(join(ROOT, dir, f), 'utf8')
        const staticImport = /import\s[^;]*from\s+'[^']*content\/atlas\.generated'/.test(body)
        expect(staticImport, `${dir}/${f} imports atlas.generated statically (use atlas-meta or a lazy island)`).toBe(false)
      }
    }
  })
})

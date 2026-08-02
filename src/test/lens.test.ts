import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SITE } from '../content'
import { LENS_NODES, LENS_EDGES, LENS_INDEX } from '../content/lens.generated'
import { LENS_PROVENANCE, LENS_SET_COUNTS, LENS_HUBS, LENS_SCORE , TRUTH_WORDS } from '../content/lens-meta.generated'
import { JSONLD_TERMSETS } from '../content/jsonld.generated'
import { HUBS } from '../pages/hub-data.generated'
import { hubJsonldSets, sourcesJsonldSets } from '../pages/hub-lib'
import { MARKET_VOCAB } from '../content/market-vocab.generated'
import { SNIPPETS, SNIPPET_REGISTRY, CAPTURES } from '../content/snippets.generated'
import { PATHS, PENDING_ERROR_CODES } from '../../site.config'

/* ── the lens compiler gates ─────────────────────────────────────────────────
   build-lens.mjs is the ONE compiler of the language lens; these gates make
   its whole output surface un-driftable: recompile + byte-diff every emission
   (the errors.test.ts pattern, ×6), pin the twin to the module, cross-check
   counts against the census (two independent readers of the same sources must
   agree), and hold the §6.1 score at GREEN — a canonical member without a
   surface goes red HERE with its name in the diff. */

const ROOT = join(__dirname, '../..')
const OUTPUTS = [
  'src/content/lens.generated.ts',
  'src/content/lens-meta.generated.ts',
  'src/content/jsonld.generated.ts',
  'src/content/market-vocab.generated.ts',
  'src/content/snippets.generated.ts',
  'src/content/lens-nav.generated.ts',
  'src/content/room-rails.generated.ts',
  'src/content/showcase-dag.generated.ts',
  'src/pages/map-data.generated.ts',
  'src/pages/hub-data.generated.ts',
  'src/assets/constellation.generated.svg',
  'src/design.generated.css',
  'src/design.forced-colors.generated.css',
  'src/content/design.generated.ts',
  'public/design-palette.json',
  'public/design-tokens.dtcg.json',
  'public/map/constellation.svg',
  'public/ontology/language.json',
  'public/redirects.json',
  // the in-place LENS_PATHS block + the moved-row 301 stubs are emissions too
  'site.config.ts',
  ...JSON.parse(readFileSync(join(__dirname, '../../public/redirects.json'), 'utf8'))
    .redirects.filter((r: { from: string }) => r.from.startsWith('/providers/'))
    .map((r: { from: string }) => `public${r.from}/index.html`),
]

describe('lens · the compiler is idempotent and the score is green', () => {
  it('every emission is exactly what the compiler emits today (and the score exits green)', () => {
    const before = OUTPUTS.map((p) => readFileSync(join(ROOT, p), 'utf8'))
    // exits 2 on any armed §6.1 violation — a red score fails right here
    execFileSync('node', [join(ROOT, 'scripts/lens/graph/build-lens.mjs')])
    OUTPUTS.forEach((p, i) => {
      expect(readFileSync(join(ROOT, p), 'utf8'), `${p} drifted`).toBe(before[i])
    })
  })

  it('the committed score is 100 with every waiver written', () => {
    expect(LENS_SCORE.score).toBe(100)
    for (const w of LENS_SCORE.waived) expect(w).toMatch(/lands in WO-\d|waiver dies/i)
  })
})

describe('lens · the twin is the module, byte-level', () => {
  it('public/ontology/language.json carries the same provenance, nodes and edges', () => {
    const twin = JSON.parse(readFileSync(join(ROOT, 'public/ontology/language.json'), 'utf8'))
    expect(twin.language_graph).toBe(1)
    expect(twin.spec_pin).toBe(LENS_PROVENANCE.spec_pin)
    expect(twin.engine_version).toBe(LENS_PROVENANCE.engine_version)
    expect(twin.nodes).toEqual(LENS_NODES)
    expect(twin.edges).toEqual(LENS_EDGES)
  })
})

describe('lens · two independent readers agree (census cross-check)', () => {
  const census = JSON.parse(
    execFileSync('node', [join(ROOT, 'scripts/lens/graph/census.mjs'), '--json'], { encoding: 'utf8' }),
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
  ])('census %s == lens %s', (censusId, lensId) => {
    expect(LENS_SET_COUNTS[lensId].count).toBe(censusCount(censusId))
  })

  it('builtins cover the shipped catalog (union with ratified)', () => {
    expect(LENS_SET_COUNTS.builtins.count).toBeGreaterThanOrEqual(censusCount('builtins.shipped')!)
  })

  it('the words register covers every schema word (task + envelope are subsets)', () => {
    expect(LENS_SET_COUNTS.words.count).toBeGreaterThanOrEqual(
      censusCount('words.task')! + censusCount('words.envelope')!,
    )
  })
})

describe('lens · rooms and routes cover each other', () => {
  const pathSet = new Set(PATHS)
  it('every room member the lens declares is a served route', () => {
    for (const n of LENS_NODES) {
      if (n.kind !== 'member' || !n.url || n.anchor) continue
      // room members only (anchored members point at pages judged below)
      const set = LENS_INDEX[`set:${n.set}`]
      if (set?.surface !== 'rooms') continue
      expect(pathSet.has(n.url), `${n.id} → ${n.url} missing from PATHS`).toBe(true)
    }
  })

  it('every anchored member points at a page that exists or is landing', () => {
    const landing = new Set(['/how/flow', '/how/boundary', '/how/proof', '/truth', '/map'])
    for (const n of LENS_NODES) {
      if (n.kind !== 'member' || !n.anchor || !n.url) continue
      const page = n.url.split('#')[0]
      expect(
        pathSet.has(page) || landing.has(page),
        `${n.id} anchors on ${page} (neither served nor landing)`,
      ).toBe(true)
    }
  })

  it('every lens route in PATHS resolves to an lens node or a declared move (no orphan registry)', () => {
    const lensUrls = new Set(LENS_NODES.filter((n) => n.url).map((n) => n.url!.split('#')[0]))
    const moved = new Set(
      (
        JSON.parse(readFileSync(join(ROOT, 'public/redirects.json'), 'utf8')) as {
          redirects: { from: string }[]
        }
      ).redirects.map((r) => r.from),
    )
    /* the pending rooms (pending-error-codes.ts, re-exported by site.config ·
       minted in the canon, awaiting the resync pin) are served AHEAD of
       their lens membership: the member node is born the day the pin lands
       the code in the catalog (build-lens derives members from it), so
       until then the pending declaration is the room's known-to-the-graph
       proof — served with a gated declaration, never an orphan. */
    const pending = new Set(PENDING_ERROR_CODES.map((c) => `/errors/${c}`))
    const lensRoots = ['/language/', '/verbs/', '/tools/', '/workflows/skeletons/', '/errors/', '/providers/']
    for (const p of PATHS) {
      if (!lensRoots.some((r) => p.startsWith(r))) continue
      expect(
        lensUrls.has(p) || moved.has(p) || pending.has(p),
        `${p} served but unknown to the lens (neither a node nor a declared move)`,
      ).toBe(true)
    }
  })
})

describe('lens · the graph is referentially whole', () => {
  it('every edge endpoint resolves and kinds stay in the closed enum', () => {
    const kinds = new Set([
      'member-of', 'belongs-to', 'names', 'grants', 'accepts',
      'carries', 'defined-by', 'witnesses', 'projects-to', 'mentions',
    ])
    for (const e of LENS_EDGES) {
      expect(LENS_INDEX[e.from], `missing from: ${e.from}`).toBeDefined()
      expect(LENS_INDEX[e.to], `missing to: ${e.to}`).toBeDefined()
      expect(kinds.has(e.kind), e.kind).toBe(true)
    }
  })

  it('the clock diff is computed, never written: builtin statuses partition', () => {
    for (const n of LENS_NODES.filter((x) => x.kind === 'member' && x.set === 'builtins')) {
      expect(['ratified', 'shipped', 'both']).toContain(n.status)
    }
  })

  it('the seven hubs chain the reading order', () => {
    expect(LENS_HUBS.map((h) => h.id)).toEqual([
      'shape', 'flow', 'acts', 'reach', 'boundary', 'refusals', 'proof',
    ])
  })
})

describe('lens · the register diet holds (the namespace-retention law)', () => {
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

describe('lens · the derived DAG module IS the projector export', () => {
  it('showcase-dag.generated toEqual SHOWCASE_DAG modulo the served line remap', async () => {
    /* one clock (0.106 flag-day): the projector's own line0/line1 point at
       the SERVED rendering — the derived module is a value-equal copy (the
       w1-to-w2 remap retired with the pin flip). */
    const { SHOWCASE_DAG: source } = await import('../sections/usecases-yaml.generated')
    const derived = (await import('../content/showcase-dag.generated')).SHOWCASE_DAG
    expect(derived).toEqual(source)
  })
})

describe('lens · jsonld and market vocab stay lawful', () => {
  /* the derived-inverses law: the hubs rebuild their DefinedTermSets from
     bundle-resident HubData (never a second shipped copy of the 80K corpus)
     — this gate holds the derivation equal to the twin's ANCHORED sets (a
     room set — showcases — catalogs terms living on their own pages; its
     JSON-LD mounts with those pages at WO-7, not in the hub head) */
  it('the hub head derivation IS the twin, for every set anchored on the page', () => {
    for (const h of Object.values(HUBS)) {
      const headSetIds = new Set(h.sets.map((set) => `${SITE}${h.hub}#set-${set.id}`))
      const anchoredHere = (JSONLD_TERMSETS[h.hub] ?? []).filter((t) =>
        /* SET IDENTITY decides the head: the hub mounts exactly its anchored
           sets (hub-data's list); their TERMS may point at their own rooms
           (rooms universelles · the richest linked-data form). A rooms-
           surface set on the same page (showcases) keeps the WO-7 law —
           its JSON-LD mounts with its pages, never in the hub head. */
        headSetIds.has(String((t as { '@id': string })['@id'])),
      )
      expect(hubJsonldSets(h), h.hub).toEqual(anchoredHere)
    }
  })

  it('the /truth head derivation IS the twin (truth-words · derived-inverses law)', () => {
    expect(sourcesJsonldSets(TRUTH_WORDS)).toEqual(JSONLD_TERMSETS['/truth'])
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
      expect(LENS_INDEX[node], `vocab node ${node} not in lens`).toBeDefined()
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

describe('lens · the snippet manifest (§2bis · no floating code)', () => {
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

describe('lens · the palette covers every living room (⌘K parity)', () => {
  it('every member of an existing rooms-set has a palette entry at its href', async () => {
    const { PALETTE } = await import('../content/palette.generated')
    const hrefs = new Set(PALETTE.map((p: { href: string }) => p.href))
    for (const n of LENS_NODES) {
      if (n.kind !== 'member' || !n.url || n.anchor) continue
      const set = LENS_INDEX[`set:${n.set}`]
      if (set?.surface !== 'rooms' || (set as { page_exists?: boolean }).page_exists === false) continue
      expect(hrefs.has(n.url), `${n.id} room ${n.url} missing from the palette`).toBe(true)
    }
  })

  it('provenance sanity: the vendored catalog vintage never exceeds the release', () => {
    const v = (s: string) => s.replace(/^v/, '').split('.').map(Number)
    const [cat, eng] = [v(LENS_PROVENANCE.catalogs.tools), v(LENS_PROVENANCE.engine_version)]
    const le = cat[0] < eng[0] || (cat[0] === eng[0] && (cat[1] < eng[1] || (cat[1] === eng[1] && cat[2] <= eng[2])))
    expect(le, `catalogs ${LENS_PROVENANCE.catalogs.tools} newer than displayed release ${LENS_PROVENANCE.engine_version}?`).toBe(true)
  })
})

describe('lens · bundle safety (the register island law)', () => {
  it('no page, section or shell imports the full graph statically', () => {
    const dirs = ['src/pages', 'src/sections', 'src/shell']
    for (const dir of dirs) {
      for (const f of readdirSync(join(ROOT, dir), { recursive: true }) as string[]) {
        if (!/\.tsx?$/.test(f)) continue
        const body = readFileSync(join(ROOT, dir, f), 'utf8')
        /* type-only imports are erased at build — the law is about BYTES
           reaching the entry, and a type adds none (the readout renderer
           types itself against the graph it will lazy-load) */
        const staticImport = /import\s(?!type\b)[^;]*from\s+'[^']*content\/lens\.generated'/.test(body)
        expect(staticImport, `${dir}/${f} imports lens.generated statically (use lens-meta or a lazy island)`).toBe(false)
      }
    }
  })
})

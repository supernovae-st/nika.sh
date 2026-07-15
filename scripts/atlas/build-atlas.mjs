/* ─── build-atlas · the language-graph compiler (WO-2 of the atlas plan) ─────
   ONE compiler over the descriptor table (scripts/atlas/sets.yaml — the one
   AUTHORED input) plus the gated sources census.mjs already proved. It emits
   the atlas surfaces; nothing downstream re-declares a set, a count, a rail
   or a redirect.

   Outputs (each idempotent · vitest recompiles + byte-diffs):
     1  src/content/atlas.generated.ts        nodes + edges (lazy consumers)
     1b src/content/atlas-meta.generated.ts   provenance + counts (chrome-safe)
     2  public/ontology/language.json         the served twin (agents read this)
     8  src/content/jsonld.generated.ts       DefinedTermSet/Term per page
     9  src/content/market-vocab.generated.ts market bridge (metas only)
     13 public/redirects.json                 moved → 301 data (e2e replays)
     12 stdout                                 the coverage SCORE (§6.1 ·
                                               exit 2 on armed violations)

   Laws: no dates, no randomness, stable sort everywhere · counts come from
   sources, never literals · members without a surface or evidence either
   carry a WRITTEN waiver in the descriptor or the build goes red naming
   them. Edge derivation is mechanical only — the usage twins
   (word/tool-usage-refs) are consumed as-is, never re-derived here.

   Run: node scripts/atlas/build-atlas.mjs            (write + report)
        node scripts/atlas/build-atlas.mjs --report   (report only · no writes) */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readSources } from './lib/read-sources.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')
const REPORT_ONLY = process.argv.includes('--report')
const S = readSources(ROOT)

/* ─── vocabulary ────────────────────────────────────────────────────────────*/
const VERBS = new Set(S.canon.verbNames)
const MEMBER_PREFIX = {
  words: 'word',
  namespaces: 'ns',
  types: 'type',
  'edge-kinds': 'edgekind',
  'gate-predicates': 'predicate',
  verbs: 'verb',
  builtins: 'tool',
  'tool-families': 'family',
  providers: 'provider',
  'extract-modes': 'mode',
  templates: 'template',
  'permit-families': 'permit',
  'secret-sources': 'secret',
  'error-codes': 'code',
  'error-namespaces': 'errns',
  'error-categories': 'errcat',
  'conformance-levels': 'level',
  'mcp-tools': 'mcp',
  showcases: 'showcase',
  'truth-words': 'truth',
}
const nid = (setId, member) => `${MEMBER_PREFIX[setId]}:${member}`

/* ─── member resolution per set (source → [{member, title, opener?, url,
       anchor?, status}]) · the clock diff is computed, never written ───────*/
const ratifiedBuiltins = new Set(S.canon.builtinNames)
const shippedBuiltins = new Set(S.tools.tools.map((t) => t.bare))
const ratifiedProviders = new Set([
  ...S.canon.providerIdsLocal,
  ...S.canon.providerIdsCloud,
  ...S.canon.providerIdsTest,
])
const shippedProviders = new Set(S.providers.providers.map((p) => p.id))

function membersOf(set) {
  const A = set.anchor_prefix ?? ''
  const page = set.anchor_page
  const anchor = (m) => ({ url: page, anchor: `${A}${m}` })
  switch (set.id) {
    case 'words':
      return S.words.map((w) => ({
        member: w.word,
        title: w.word,
        opener: w.decls[0]?.desc ?? null,
        url: `/language/${w.word}`,
        status: 'ratified',
        meta: { scopes: w.decls.map((d) => d.scope), verb: w.verb },
      }))
    case 'namespaces':
      return S.canon.namespaceNames.map((m) => ({
        member: m, title: m, opener: null, ...anchor(m), status: 'ratified',
      }))
    case 'types':
      return [] // W3 slot · fills when the resync brings $defs.typeExpr
    case 'edge-kinds':
    case 'gate-predicates':
    case 'permit-families':
    case 'secret-sources':
    case 'conformance-levels':
    case 'truth-words':
      return set.members.map((m) => ({
        member: m.id,
        title: m.id,
        opener: m.one_liner,
        ...anchor(m.id),
        status: 'ratified',
        meta: m.slot ? { slot: m.slot } : undefined,
      }))
    case 'verbs':
      return S.canon.verbNames.map((m) => ({
        member: m, title: m, opener: null, url: `/verbs/${m}`, status: 'ratified',
      }))
    case 'builtins': {
      const all = [...new Set([...ratifiedBuiltins, ...shippedBuiltins])].sort()
      return all.map((bare) => {
        const row = S.tools.tools.find((t) => t.bare === bare)
        const status = ratifiedBuiltins.has(bare)
          ? (shippedBuiltins.has(bare) ? 'both' : 'ratified')
          : 'shipped'
        return {
          member: bare,
          title: `nika:${bare}`,
          opener: row?.description ?? null,
          url: `/tools/${bare}`,
          status,
          meta: { family: row?.category ?? null },
        }
      })
    }
    case 'tool-families': {
      const fams = [...new Set(S.tools.tools.map((t) => t.category))].sort()
      return fams.map((m) => ({ member: m, title: m, opener: null, ...anchor(m), status: 'shipped' }))
    }
    case 'providers':
      return S.providers.providers.map((p) => ({
        member: p.id,
        title: p.name,
        opener: p.description ?? null,
        ...anchor(p.id),
        status: ratifiedProviders.has(p.id) ? (shippedProviders.has(p.id) ? 'both' : 'ratified') : 'shipped',
        meta: { kind: p.kind, dialect: p.api_dialect ?? null },
      }))
    case 'extract-modes':
      return S.canon.extractModeNames.map((m) => ({
        member: m, title: m, opener: null, url: page, anchor: `${A}${m}`, status: 'ratified',
      }))
    case 'templates':
      return S.templates.templates.map((t) => ({
        member: t.name,
        title: t.name,
        opener: t.intent,
        url: `/templates/${t.name}`,
        status: 'ratified',
        meta: { sha256: t.sha256, file: t.file },
      }))
    case 'error-codes':
      return S.errors.codes.map((c) => ({
        member: c.code,
        title: c.code,
        opener: c.failure,
        url: `/errors/${c.code}`,
        status: 'ratified',
        meta: { category: c.category, transient: c.transient === 'true' || c.transient === true },
      }))
    case 'error-namespaces': {
      const declared = Object.keys(S.errors.namespaces).sort()
      const witnessed = new Set(S.errors.codes.map((c) => c.code.match(/^NIKA-[A-Z]+/)[0]))
      return declared.map((m) => ({
        member: m,
        title: m,
        opener: S.errors.namespaces[m]?.scope ?? null,
        ...anchor(m),
        status: 'ratified',
        meta: { witnessed: witnessed.has(m) },
      }))
    }
    case 'error-categories': {
      const witnessed = new Set(S.errors.codes.map((c) => c.category))
      return S.errors.categories.map((m) => ({
        member: m, title: m, opener: null, ...anchor(m), status: 'ratified',
        meta: { witnessed: witnessed.has(m) },
      }))
    }
    case 'mcp-tools':
      return S.canon.mcpToolNames.map((m) => ({
        member: m, title: m, opener: null, ...anchor(m), status: 'ratified',
      }))
    case 'showcases':
      return Object.keys(S.dag).sort().map((slug) => ({
        member: slug,
        title: slug.replace(/^t\d-/, ''),
        opener: null, // authored at WO-5 with the rooms
        url: `/use-cases/${slug}`,
        status: 'ratified',
        meta: { tier: slug.match(/^t(\d)-/)?.[1] ?? null, waves: S.dag[slug].waves },
      }))
    default:
      throw new Error(`membersOf: unmapped set ${set.id}`)
  }
}

/* ─── nodes + edges ─────────────────────────────────────────────────────────*/
const nodes = []
const edges = []
const addEdge = (from, to, kind) => edges.push({ from, to, kind })

for (const layer of S.sets.layers) {
  nodes.push({
    id: `layer:${layer.id}`,
    kind: 'layer',
    title: layer.title,
    url: layer.hub,
    status: 'both',
    opener: layer.opener.trim(),
    exists: layer.hub_exists,
    lands: layer.lands ?? null,
    ...(layer.sibling_hubs ? { sibling_hubs: layer.sibling_hubs } : {}),
  })
}

/* which PAGES exist today (set nodes carry page_exists so consumers — the
   a11y sweep, nav — never point at a hub that has not landed yet) */
const existingPages = new Set()
for (const l of S.sets.layers) {
  if (l.hub_exists) {
    existingPages.add(l.hub)
    for (const sib of l.sibling_hubs ?? []) existingPages.add(sib)
  }
}
for (const surf of S.sets.surfaces) if (surf.exists) existingPages.add(surf.url)
for (const set of S.sets.sets) {
  if (set.surface === 'rooms' && set.rooms_exist) {
    existingPages.add(`/${set.rooms_url.split('/')[1]}`)
  }
}

const chapterFiles = [...new Set(S.sets.sets.flatMap((s) => s.defined_by))].sort()
for (const ch of chapterFiles) {
  if (ch.startsWith('site:')) continue
  nodes.push({
    id: `chapter:${ch}`,
    kind: 'chapter',
    title: ch,
    url: `https://github.com/supernovae-st/nika-spec/blob/main/${ch}`,
    status: 'both',
    opener: null,
  })
}

for (const surf of S.sets.surfaces) {
  nodes.push({
    id: `surface:${surf.id}`,
    kind: 'surface',
    title: surf.title ?? surf.id,
    url: surf.url,
    status: 'both',
    opener: null,
    exists: surf.exists ?? false,
    lands: surf.lands ?? null,
  })
}

for (const set of S.sets.sets) {
  const setNode = `set:${set.id}`
  const setPage = (set.surface === 'rooms' ? `/${(set.rooms_url ?? '/x').split('/')[1]}` : set.anchor_page ?? '').split('#')[0]
  nodes.push({
    id: setNode,
    kind: 'set',
    layer: set.layer,
    title: set.title,
    url: set.surface === 'rooms' ? (set.rooms_url ?? null) : set.anchor_page,
    status: set.clock === 'release' ? 'shipped' : 'ratified',
    opener: set.opener.trim(),
    closed: set.closed,
    counted_in_canon: set.counted_in_canon,
    surface: set.surface,
    clock: set.clock,
    page_exists: existingPages.has(setPage) || [...existingPages].some((p) => setPage.startsWith(`${p}/`)),
  })
  addEdge(setNode, `layer:${set.layer}`, 'member-of')
  for (const ch of set.defined_by) {
    if (!ch.startsWith('site:')) {
      addEdge(setNode, `chapter:${ch}`, 'defined-by')
      addEdge(`chapter:${ch}`, `layer:${set.layer}`, 'projects-to')
    }
  }

  for (const m of membersOf(set)) {
    nodes.push({
      id: nid(set.id, m.member),
      kind: 'member',
      set: set.id,
      layer: set.layer,
      title: m.title,
      url: m.url,
      ...(m.anchor ? { anchor: m.anchor } : {}),
      status: m.status,
      opener: m.opener ? String(m.opener).trim() : null,
      ...(m.meta ? { meta: m.meta } : {}),
    })
    addEdge(nid(set.id, m.member), setNode, 'member-of')
  }
}

/* ─── mechanical edges (consumed from the gated twins · never re-derived) ──*/
/* names: code → word / tool · carries/grants: template → word / tool */
for (const [word, refs] of Object.entries(S.wordRefs)) {
  for (const code of refs.codes ?? []) addEdge(`code:${code}`, `word:${word}`, 'names')
  for (const t of refs.templates ?? []) addEdge(`template:${t}`, `word:${word}`, 'carries')
}
for (const [bare, refs] of Object.entries(S.toolRefs)) {
  for (const code of refs.errorCodes ?? []) addEdge(`code:${code}`, `tool:${bare}`, 'names')
  for (const t of refs.templates ?? []) addEdge(`template:${t}`, `tool:${bare}`, 'grants')
}

/* belongs-to: tool → family · code → namespace + category */
for (const t of S.tools.tools) addEdge(`tool:${t.bare}`, `family:${t.category}`, 'belongs-to')
for (const c of S.errors.codes) {
  addEdge(`code:${c.code}`, `errns:${c.code.match(/^NIKA-[A-Z]+/)[0]}`, 'belongs-to')
  addEdge(`code:${c.code}`, `errcat:${c.category}`, 'belongs-to')
}

/* accepts: verb → word (schema scopes) */
for (const w of S.words) {
  for (const d of w.decls) {
    if (VERBS.has(d.scope)) addEdge(`verb:${d.scope}`, `word:${w.word}`, 'accepts')
  }
}

/* carries: fetch → extract modes */
for (const m of S.canon.extractModeNames) addEdge('tool:fetch', `mode:${m}`, 'carries')

/* witnesses: showcase → verbs + tools it exercises (DAG model + glosses) */
for (const [slug, model] of Object.entries(S.dag)) {
  const seenV = new Set()
  const seenT = new Set()
  for (const t of model.tasks) {
    if (!seenV.has(t.verb)) {
      seenV.add(t.verb)
      addEdge(`showcase:${slug}`, `verb:${t.verb}`, 'witnesses')
    }
    const tool = /`nika:([a-z_]+)`/.exec(t.gloss)?.[1]
    if (tool && !seenT.has(tool) && shippedBuiltins.has(tool)) {
      seenT.add(tool)
      addEdge(`showcase:${slug}`, `tool:${tool}`, 'witnesses')
    }
  }
}

/* mentions: blog post → member · backtick spans only, typed forms only:
   exact NIKA codes · nika:tool · `word:` (the colon marks the key form) */
const wordSet = new Set(S.words.map((w) => w.word))
const codeSet = new Set(S.errors.codes.map((c) => c.code))
for (const post of S.posts) {
  const spans = post.md.match(/`[^`\n]+`/g) ?? []
  const hit = new Set()
  for (const span of spans) {
    const body = span.slice(1, -1)
    for (const m of body.matchAll(/NIKA-[A-Z]+(?:-[A-Z][A-Z0-9_]*)?-\d{3}/g)) {
      if (codeSet.has(m[0])) hit.add(`code:${m[0]}`)
    }
    for (const m of body.matchAll(/nika:([a-z_]+)/g)) {
      if (shippedBuiltins.has(m[1])) hit.add(`tool:${m[1]}`)
    }
    const keyForm = /^([a-z_]+):$/.exec(body.trim())
    if (keyForm && wordSet.has(keyForm[1])) hit.add(`word:${keyForm[1]}`)
  }
  if (hit.size === 0) continue
  nodes.push({
    id: `post:${post.slug}`,
    kind: 'surface',
    title: post.slug,
    url: `/blog/${post.slug}`,
    status: 'both',
    opener: null,
    exists: true,
  })
  for (const target of [...hit].sort()) addEdge(`post:${post.slug}`, target, 'mentions')
}

/* dedupe (projects-to repeats per set) + stable sort */
const edgeKey = (e) => `${e.kind} ${e.from} ${e.to}`

const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, (i + 1) * size),
  )
const uniqEdges = [...new Map(edges.map((e) => [edgeKey(e), e])).values()]
uniqEdges.sort((a, b) => (a.kind + ' ' + a.from + ' ' + a.to).localeCompare(b.kind + ' ' + b.from + ' ' + b.to))
nodes.sort((a, b) => a.id.localeCompare(b.id))

/* referential integrity: every edge endpoint is a node (build error, not score) */
const nodeIds = new Set(nodes.map((n) => n.id))
for (const e of uniqEdges) {
  for (const end of [e.from, e.to]) {
    if (!nodeIds.has(end)) throw new Error(`edge ${e.kind} references missing node: ${end}`)
  }
}

/* ─── provenance + counts ──────────────────────────────────────────────────*/
const provenance = {
  language_graph: 1,
  spec_pin: S.specPin,
  canon_schema_version: S.canon.schemaVersion,
  engine_version: S.engineVersion,
  catalogs: { tools: S.tools.version, providers: S.providers.version },
}
function hubOf(set) {
  return S.sets.layers.find((l) => l.id === set.layer).hub
}
const setCounts = Object.fromEntries(
  S.sets.sets
    .map((s) => [
      s.id,
      {
        count: nodes.filter((x) => x.kind === 'member' && x.set === s.id).length,
        url: s.surface === 'anchors' ? (s.anchor_page ?? hubOf(s)).split('#')[0] : hubOf(s),
        title: s.title,
      },
    ])
    .sort((a, b) => a[0].localeCompare(b[0])),
)

/* ─── the score (§6.1 · explicable · armed classes only deduct) ────────────*/
const deductions = []
const waived = []
const unarmed = [
  'capture-stamps → arms at wo-4 (TermCapture)',
  'count-links (CanonCount deployment) → arms at wo-3',
  'keyboard+touch verdicts → arm at wo-12',
  'hreflang coverage → arms at wo-9',
]
/* heroes-class ARMED (wo2b): an unclassed hero deducts −5 by name */
for (const h of S.sets.library_heroes ?? []) {
  if (!h.class) deductions.push({ points: 5, why: `${h.file}: library hero unclassed (§2bis)` })
  else if (!['spec-vendored', 'crafted-room'].includes(h.class))
    deductions.push({ points: 5, why: `${h.file}: illegal class ${h.class} (a third class does not exist)` })
}
for (const set of S.sets.sets) {
  if (set.slot) continue // W3/W-DEC slots resolve when their wave ships
  if (set.surface === 'rooms' && set.rooms_exist === false) {
    if (set.surface_waiver) waived.push(`${set.id}: ${set.surface_waiver}`)
    else deductions.push({ points: 3, why: `${set.id}: rooms declared but absent, no waiver` })
    continue
  }
  if (set.lands && set.surface_waiver) {
    waived.push(`${set.id}: ${set.surface_waiver}`)
    continue
  }
  for (const m of nodes.filter((x) => x.kind === 'member' && x.set === set.id)) {
    if (!m.url) deductions.push({ points: 3, why: `${m.id}: no surface (room or anchor)` })
  }
  if (set.surface === 'rooms' && !set.unique_data && !set.evidence_waiver) {
    deductions.push({ points: 3, why: `${set.id}: rooms without unique_data or waiver` })
  }
}
/* reachability (structural until nav.generated lands at WO-3/4): every member
   page hangs off a declared hub, a sibling hub, or a landing surface */
const knownPages = new Set([
  ...S.sets.layers.map((l) => l.hub),
  ...S.sets.layers.flatMap((l) => l.sibling_hubs ?? []),
  ...S.sets.surfaces.map((s) => s.url),
  '/use-cases',
])
for (const n of nodes) {
  if (n.kind !== 'member' || !n.url) continue
  const page = n.url.split('#')[0]
  const root = `/${page.split('/')[1] ?? ''}`
  if (!knownPages.has(page) && !knownPages.has(root)) {
    deductions.push({ points: 2, why: `${n.id}: page ${page} hangs off no hub` })
  }
}

const score = Math.max(0, 100 - deductions.reduce((a, d) => a + d.points, 0))

/* ─── emissions ────────────────────────────────────────────────────────────*/
const GEN = (name, body) =>
  `// ${name} — AUTO-GENERATED by scripts/atlas/build-atlas.mjs from\n// scripts/atlas/sets.yaml (the authored descriptor) + the gated sources.\n// DO NOT EDIT · regenerate: node scripts/atlas/build-atlas.mjs\n// Drift gate: src/test/atlas.test.ts recompiles and byte-diffs.\n\n${body}`

const twin = { ...provenance, nodes, edges: uniqEdges }

const atlasTs = GEN(
  'atlas.generated.ts',
  `export interface AtlasNode {
  id: string
  kind: 'layer' | 'set' | 'member' | 'chapter' | 'surface'
  title: string
  /** room or anchor page (null only while a slot awaits its wave) */
  url: string | null
  anchor?: string
  status: 'ratified' | 'shipped' | 'both'
  /** the quotable definitional voice (sets + layers · derived for members) */
  opener: string | null
  set?: string
  layer?: string
  closed?: boolean
  counted_in_canon?: boolean
  surface?: string
  clock?: string
  exists?: boolean
  lands?: string | null
  /** set nodes: their page is served today (consumers never point at a hub
   * that has not landed yet) */
  page_exists?: boolean
  /** layer nodes: register hubs that share the layer (reach: providers ·
   * templates) */
  sibling_hubs?: string[]
  meta?: Record<string, unknown>
}

export interface AtlasEdge {
  from: string
  to: string
  kind:
    | 'member-of'
    | 'belongs-to'
    | 'names'
    | 'grants'
    | 'accepts'
    | 'carries'
    | 'defined-by'
    | 'witnesses'
    | 'projects-to'
    | 'mentions'
}

export const ATLAS_NODES: AtlasNode[] = ${JSON.stringify(nodes, null, 2)}

${
  // tsc (TS2590) caps inference on very large array literals — past ~1k
  // elements the single-literal form stops type-checking. Chunked consts
  // keep per-element checking at any graph size.
  chunk(uniqEdges, 400)
    .map(
      (part, i) =>
        `const ATLAS_EDGES_${i}: AtlasEdge[] = ${JSON.stringify(part, null, 2)}`,
    )
    .join('\n\n')
}

export const ATLAS_EDGES: AtlasEdge[] = [
${chunk(uniqEdges, 400)
  .map((_, i) => `  ...ATLAS_EDGES_${i},`)
  .join('\n')}
]

export const ATLAS_INDEX: Record<string, AtlasNode> = Object.fromEntries(
  ATLAS_NODES.map((n) => [n.id, n]),
)
`,
)

const metaTs = GEN(
  'atlas-meta.generated.ts',
  `/** chrome-safe: provenance + counts only — the full graph stays lazy
 * (atlas.generated.ts) so the initial bundle never pays for it. */
export const ATLAS_PROVENANCE: {
  language_graph: 1
  /** stamped by the resync cron from its fresh spec clone · null until then */
  spec_pin: string | null
  canon_schema_version: number
  engine_version: string
  catalogs: { tools: string; providers: string }
} = ${JSON.stringify(provenance, null, 2)}

export const ATLAS_SET_COUNTS: Record<string, { count: number; url: string; title: string }> =
  ${JSON.stringify(setCounts, null, 2)}

export const ATLAS_HUBS = ${JSON.stringify(
    S.sets.layers.map((l) => ({ id: l.id, title: l.title, hub: l.hub, exists: l.hub_exists, lands: l.lands ?? null })),
    null,
    2,
  )} as const

export const ATLAS_SCORE = ${JSON.stringify({ score, waived, unarmed }, null, 2)} as const

/** flips when /sources ships (WO-7) — TruthLine withholds the link until then */
export const SOURCES_LIVE = false
`,
)

/* jsonld: one DefinedTermSet per set, placed on its page (§0.9) */
const ORIGIN = 'https://nika.sh'
const termsetsByPage = {}
for (const set of S.sets.sets) {
  const members = nodes.filter((x) => x.kind === 'member' && x.set === set.id && x.url)
  if (members.length === 0) continue
  const page = set.surface === 'rooms' ? hubOf(set) : (set.anchor_page ?? hubOf(set)).split('#')[0]
  const termset = {
    '@type': 'DefinedTermSet',
    '@id': `${ORIGIN}${page}#set-${set.id}`,
    name: `Nika ${set.title.toLowerCase()}`,
    description: set.opener.trim(),
    license: 'https://www.apache.org/licenses/LICENSE-2.0',
    version: S.engineVersion,
    hasDefinedTerm: members.map((m) => ({
      '@type': 'DefinedTerm',
      '@id': `${ORIGIN}${m.url}${m.anchor ? `#${m.anchor}` : ''}`,
      termCode: m.title,
      name: m.title,
      ...(m.opener ? { description: m.opener } : {}),
    })),
  }
  ;(termsetsByPage[page] ??= []).push(termset)
}
for (const page of Object.keys(termsetsByPage)) {
  termsetsByPage[page].sort((a, b) => a['@id'].localeCompare(b['@id']))
}
const jsonldTs = GEN(
  'jsonld.generated.ts',
  `/** DefinedTermSet/DefinedTerm per atlas page (§0.9: +version +license).
 * Pages mount these at WO-7 inside their single @graph. Data only. */
export const JSONLD_TERMSETS: Record<string, unknown[]> = ${JSON.stringify(termsetsByPage, null, 2)}
`,
)

/* market vocab (metas only · the grep-gate keeps prose clean) */
const vocab = Object.fromEntries(
  (S.marketVocab.terms ?? [])
    .map((t) => [t.node, { term: t.term, volume_mo: t.volume_mo, kd: t.kd, observed: t.observed }])
    .sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
)
const vocabTs = GEN(
  'market-vocab.generated.ts',
  `/** the market-language bridge (scripts/atlas/market-vocab.yaml · authored ·
 * quarterly review). Consumed by metas/titles ONLY — the taught nomenclature
 * stays the house voice; the grep-gate refuses these phrases in page prose. */
export const MARKET_VOCAB: Record<string, { term: string; volume_mo: number; kd: number; observed: string }> =
  ${JSON.stringify(vocab, null, 2)}
`,
)

/* snippets manifest (output 14 · §2bis: the lineage of every code block) */
const snippets = []
for (const t of S.templates.templates) {
  snippets.push({
    id: `snip:template:${t.name}`,
    source: { kind: 'spec-template', artifact: `templates/${t.file}`, pin: S.specPin, sha256: t.sha256 },
    gates: ['templates catalog byte-diff (vitest)', 'sha-pinned at the catalog'],
    badge: 're-proven at every push',
    rendered_on: [`/templates/${t.name}`],
  })
}
for (const slug of Object.keys(S.dag).sort()) {
  snippets.push({
    id: `snip:showcase:${slug}`,
    source: { kind: 'spec-showcase', artifact: `examples/showcase/${slug}.nika.yaml`, pin: S.specPin },
    gates: ['showcase-projector --check (byte parity)', 'spec conformance gate upstream'],
    badge: 're-proven at every push',
    rendered_on: ['/use-cases'],
  })
}
for (const h of S.sets.library_heroes) {
  if (!h.class) throw new Error(`library hero unclassed: ${h.file} (the §2bis audit owes a verdict)`)
  snippets.push({
    id: `snip:hero:${h.file.replace(/^public\/library\//, '').replace(/\.nika\.yaml$/, '')}`,
    source: { kind: h.class, artifact: h.file, pin: null },
    gates: S.sets.library_heroes_gates.split(' · '),
    badge: 'checked against the binary (release-gated: pre-W2 released binary refuses the W2 envelope)',
    rendered_on: ['/', `/${h.file.replace(/^public\//, '')}`],
  })
}
snippets.sort((a, b) => a.id.localeCompare(b.id))
const registry = [...S.sets.snippet_registry].sort((a, b) => a.file.localeCompare(b.file))
const snippetsTs = GEN(
  'snippets.generated.ts',
  `/** the snippet manifest (§2bis « no floating code ») — every code block
 * rendered anywhere resolves here or lives in a registered file below.
 * The lint (atlas.test.ts) refuses a nika-yaml literal outside this map. */
export interface SnippetRef {
  id: string
  source: { kind: string; artifact: string; pin: string | null; sha256?: string }
  gates: string[]
  /** the §2bis gate badge — the confidence said in a few words */
  badge: string
  rendered_on: string[]
}

export const SNIPPETS: SnippetRef[] = ${JSON.stringify(snippets, null, 2)}

/** non-generated source files legally carrying inline nika-yaml, each with
 * the gate that judges it (from the descriptor's snippet_registry). */
export const SNIPPET_REGISTRY: { file: string; kind: string; gate: string; dies?: string; note?: string }[] =
  ${JSON.stringify(registry, null, 2)}
`,
)

/* redirects (moved → data · e2e replays live entries) */
const redirects = []
for (const set of S.sets.sets) {
  for (const mv of set.moved ?? []) {
    redirects.push({
      from: mv.from,
      to: mv.to,
      status: 301,
      live: set.moved_live === true,
      applies: set.moved_applies ?? null,
    })
  }
}
for (const surf of S.sets.surfaces) {
  if (surf.moved) {
    redirects.push({
      from: surf.moved.from,
      to: surf.moved.to,
      status: 301,
      live: surf.moved_live === true,
      applies: surf.moved.applied ?? null,
    })
  }
}
redirects.sort((a, b) => a.from.localeCompare(b.from))
const redirectsJson = JSON.stringify({ redirects_format: 1, redirects }, null, 2) + '\n'

/* ─── write + report ───────────────────────────────────────────────────────*/
if (!REPORT_ONLY) {
  writeFileSync(join(ROOT, 'src/content/atlas.generated.ts'), atlasTs)
  writeFileSync(join(ROOT, 'src/content/atlas-meta.generated.ts'), metaTs)
  writeFileSync(join(ROOT, 'src/content/jsonld.generated.ts'), jsonldTs)
  writeFileSync(join(ROOT, 'src/content/market-vocab.generated.ts'), vocabTs)
  writeFileSync(join(ROOT, 'src/content/snippets.generated.ts'), snippetsTs)
  mkdirSync(join(ROOT, 'public/ontology'), { recursive: true })
  writeFileSync(join(ROOT, 'public/ontology/language.json'), JSON.stringify(twin, null, 2) + '\n')
  writeFileSync(join(ROOT, 'public/redirects.json'), redirectsJson)
}

const memberCount = nodes.filter((n) => n.kind === 'member').length
console.log(`atlas score · ${score}`)
console.log(`  graph: ${nodes.length} nodes (${memberCount} members) · ${uniqEdges.length} edges`)
console.log(
  `  provenance: spec_pin ${provenance.spec_pin ?? 'NOT STAMPED (resync stamps public/spec/v1/PIN from its next run)'} · engine ${provenance.engine_version} · catalogs tools@${provenance.catalogs.tools} providers@${provenance.catalogs.providers}`,
)
if (provenance.catalogs.tools !== provenance.engine_version.replace(/^v/, '')) {
  console.log(
    `  named lag: release-time catalogs vendored at ${provenance.catalogs.tools} · released ${provenance.engine_version} · refresh is RELEASE-GATED (pre-W2 binary has no tools dump · catalog shapes diverged)`,
  )
}
for (const w of waived) console.log(`  waived: ${w}`)
for (const u of unarmed) console.log(`  unarmed: ${u}`)
if (deductions.length) {
  for (const d of deductions) console.log(`  -${d.points} · ${d.why}`)
  console.log(`atlas: RED (${score})`)
  process.exit(2)
}
console.log('atlas: GREEN (100)')

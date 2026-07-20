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
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readSources } from './lib/read-sources.mjs'
import { serveW105WithMap } from '../lib/w1-to-w2.mjs'
import { layoutConstellation } from './lib/radial-layout.mjs'
import { renderConstellation } from './lib/render-constellation.mjs'

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

/* a code's namespace, by grammar — dies naming the drifting code, never an
   anonymous null-deref (a resynced catalog is allowed to surprise us) */
const errNs = (code) => {
  const m = /^NIKA-[A-Z]+(?=-)/.exec(code)
  if (!m) throw new Error(`error code outside the NIKA-<NS>- grammar: ${code}`)
  return m[0]
}

/* ─── member resolution per set (source → [{member, title, opener?, url,
       anchor?, status}]) · the clock diff is computed, never written ───────*/
const ratifiedBuiltins = new Set(S.canon.builtinNames)
const shippedBuiltins = new Set(S.tools.tools.filter((t) => !t.ratified_only).map((t) => t.bare))
const ratifiedProviders = new Set([
  ...S.canon.providerIdsLocal,
  ...S.canon.providerIdsCloud,
  ...S.canon.providerIdsTest,
])
const shippedProviders = new Set(S.providers.providers.map((p) => p.id))

function membersOf(set) {
  const A = set.anchor_prefix ?? ''
  const page = set.anchor_page
  /* verdict 2026-07-18 (« chaque élément a sa page ») : un set à ancres qui
     porte rooms_url flippe l'url canonique du membre vers SA ROOM — l'ancre
     de la vue registre reste portée (le hub garde ses deep-links) */
  const anchor = set.rooms_url
    ? (m) => ({ url: `${set.rooms_url}/${m}`, anchor: `${A}${m}`, own_page: true })
    : (m) => ({ url: page, anchor: `${A}${m}` })
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
    case 'types': {
      /* the closed v1 primitive grammar, read from the SERVED schema (the
         set's own declared source) — the pattern's first alternation IS
         the register; PascalCase refs are authored, not members */
      const pattern = S.schema?.$defs?.typeExpr?.oneOf?.find((o) => o.pattern)?.pattern ?? ''
      const prims = pattern.match(/\(([a-z|]+)\|\[A-Z\]/)?.[1]?.split('|') ?? []
      return prims.map((m) => ({
        member: m, title: m, opener: null, ...anchor(m), status: 'ratified',
      }))
    }
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
        member: m, title: m, opener: null, ...anchor(m), status: 'ratified',
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
      const witnessed = new Set(S.errors.codes.map((c) => errNs(c.code)))
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

S.sets.layers.forEach((layer, i) => {
  nodes.push({
    id: `layer:${layer.id}`,
    kind: 'layer',
    title: layer.title,
    url: layer.hub,
    status: 'both',
    opener: layer.opener.trim(),
    exists: layer.hub_exists,
    lands: layer.lands ?? null,
    /* the anatomy's reading order (node sort is alphabetical · consumers
       that need the book order — the constellation, the hub chain — read
       this, never the array position) */
    order: i,
    ...(layer.sibling_hubs ? { sibling_hubs: layer.sibling_hubs } : {}),
  })
})

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
    ...(set.surface === 'anchors' ? { anchors_exist: set.anchors_exist === true } : {}),
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
      ...(m.own_page ? { own_page: true } : {}),
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
  addEdge(`code:${c.code}`, `errns:${errNs(c.code)}`, 'belongs-to')
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
    title: post.title,
    url: `/blog/${post.slug}`,
    status: 'both',
    opener: null,
    exists: true,
  })
  for (const target of [...hit].sort()) addEdge(`post:${post.slug}`, target, 'mentions')
}

/* the cross-rails (D5) · the mentions edges rendered both ways — pure
   inversion, no new derivation: rooms gain « from the blog », posts gain
   « the register behind this ». Caps + stable sorts keep the slices lean. */
const fromBlog = {}
const postMentions = {}
const MEMBER_ROOM = {
  tool: (id) => ({ label: `nika:${id}`, url: `/tools/${id}` }),
  word: (id) => ({ label: id, url: `/language/${id}` }),
  code: (id) => ({ label: id, url: `/errors/${id}` }),
}
for (const e of edges) {
  if (e.kind !== 'mentions' || !e.from.startsWith('post:')) continue
  const slug = e.from.slice(5)
  const post = S.posts.find((p) => p.slug === slug)
  if (!post) continue
  const [memberKind, memberId] = [e.to.slice(0, e.to.indexOf(':')), e.to.slice(e.to.indexOf(':') + 1)]
  ;(fromBlog[e.to] ??= []).push({ slug, title: post.title, date: post.date })
  ;(postMentions[slug] ??= []).push({ kind: memberKind, id: memberId, ...MEMBER_ROOM[memberKind](memberId) })
}
for (const k of Object.keys(fromBlog)) {
  fromBlog[k].sort((a, b) => (a.date === b.date ? (a.slug < b.slug ? -1 : 1) : a.date < b.date ? 1 : -1))
  fromBlog[k] = fromBlog[k].slice(0, 3)
}
for (const k of Object.keys(postMentions)) {
  postMentions[k].sort((a, b) => (a.kind === b.kind ? (a.id < b.id ? -1 : 1) : a.kind < b.kind ? -1 : 1))
}

/* related posts (D6) · two posts that mention the same members are closer
   than any tag says — score = |shared members|, date breaks ties, cap 3.
   Derived-only: a post with no mentions gets no rail (never a tag filler). */
const postMembers = {}
for (const e of edges) {
  if (e.kind === 'mentions' && e.from.startsWith('post:')) (postMembers[e.from.slice(5)] ??= new Set()).add(e.to)
}
const relatedPosts = {}
for (const a of Object.keys(postMembers)) {
  const scored = []
  for (const b of Object.keys(postMembers)) {
    if (b === a) continue
    let shared = 0
    for (const m of postMembers[b]) if (postMembers[a].has(m)) shared += 1
    if (shared > 0) scored.push({ slug: b, shared })
  }
  const dateOf = (slug) => S.posts.find((p) => p.slug === slug)?.date ?? ''
  scored.sort((x, y) =>
    x.shared !== y.shared
      ? y.shared - x.shared
      : dateOf(x.slug) !== dateOf(y.slug)
        ? (dateOf(x.slug) < dateOf(y.slug) ? 1 : -1)
        : x.slug < y.slug ? -1 : 1,
  )
  if (scored.length > 0) {
    relatedPosts[a] = scored.slice(0, 3).map(({ slug, shared }) => {
      const post = S.posts.find((p) => p.slug === slug)
      return { slug, title: post.title, date: post.date, shared }
    })
  }
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
  'hreflang coverage → ARMED in src/test/i18n.test.ts (wo-9a · registry⇔PATHS⇔cluster judged test-side; PATHS is not compiler-readable)',
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
  /* rooms universelles (verdict 2026-07-18): a roomed anchor set's family
     root IS a hub door — every member room hangs off its set's register
     (the hub rows link the rooms · prev/next chains them) */
  ...S.sets.sets.filter((x) => x.rooms_url).map((x) => x.rooms_url),
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
  /** the member OWNS its page (rooms universelles) — url is the room */
  own_page?: boolean
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
  /** layer nodes: the anatomy's reading order (node sort is alphabetical) */
  order?: number
  /** set nodes: their page is served today (consumers never point at a hub
   * that has not landed yet) */
  page_exists?: boolean
  /** anchor sets: the member section anchors exist on the page today
   * (each enrichment WO flips its sets · renders gate on this) */
  anchors_exist?: boolean
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

/* the two-clock diff, computed (never written): what the spec ratifies vs
   what the shipped catalogs witness — /map renders this line */
const clockDiff = {
  builtins: {
    ratified_only: [...ratifiedBuiltins].filter((b) => !shippedBuiltins.has(b)).sort(),
    shipped_only: [...shippedBuiltins].filter((b) => !ratifiedBuiltins.has(b)).sort(),
  },
  providers: {
    ratified_only: [...ratifiedProviders].filter((p) => !shippedProviders.has(p)).sort(),
    shipped_only: [...shippedProviders].filter((p) => !ratifiedProviders.has(p)).sort(),
  },
  /* the 0.104 flip: the released binary speaks W2 while the public spec (the
     pin) still teaches W1 — the biggest ratified↔shipped gap the site has
     ever rendered. The corpus follows the SHIPPED grammar (the visitor's
     binary); the pin stays the ratified clock. Empties at the pin flip. */
  grammar: {
    ratified_only: ['W1 envelope (workflow object · tasks map)'],
    shipped_only: ['W2 envelope (workflow scalar · tasks sequence · declared depends_on)'],
  },
}

/* the untranslatables lexicon (WO-10 · mega-plan item 7): every name the
   language OWNS, derived from the graph — the fixed-values contract injected
   into the localization workflow (the AI fills prose, the locked tokens are
   EXPLICIT) and the lint floor for content/i18n/** (a translated `after:`
   cannot exist · i18n-lexicon.test names the drift). Sorted, deduped,
   deterministic. */
const untranslatables = [...new Set([
  ...S.canon.verbNames,
  ...S.words.map((w) => w.word),
  ...S.canon.namespaceNames,
  ...S.canon.builtinNames.map((b) => `nika:${b}`),
  ...S.errors.codes.map((c) => c.code),
  ...S.providers.providers.map((p) => p.id),
  ...S.templates.templates.map((t) => t.name),
  ...S.canon.extractModeNames,
  'nika', '.nika.yaml', 'nika check', 'nika run', 'AGPL-3.0', 'Apache-2.0',
])].sort()

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

/** the two clocks diffed (computed at compile · /map renders the line) */
export const ATLAS_CLOCK_DIFF: Record<'builtins' | 'providers' | 'grammar', { ratified_only: string[]; shipped_only: string[] }> =
  ${JSON.stringify(clockDiff, null, 2)}

/** flips when /sources ships (WO-7) — TruthLine withholds the link until then */
export const SOURCES_LIVE = ${JSON.stringify(S.sets.surfaces.find((x) => x.id === 'sources')?.exists === true)}

/** the truth-words register (chrome-safe · /sources renders it anchored and
 * derives its DefinedTermSet from THIS — gate-pinned equal to the twin) */
export const TRUTH_WORDS: { title: string; opener: string; members: { id: string; one_liner: string; url?: string }[] } = ${JSON.stringify(
    (() => {
      const set = S.sets.sets.find((x) => x.id === 'truth-words')
      return {
        title: set.title,
        opener: set.opener.trim(),
        members: set.members.map((m) => ({
          id: m.id,
          one_liner: m.one_liner,
          ...(set.rooms_url ? { url: `${set.rooms_url}/${m.id}` } : {}),
        })),
      }
    })(),
  )}
`,
)

/* the map page data (sortie 5 · chrome-lean: the layers with their sets and
   counts, ready to render — the page never imports the full graph) */
const pageServed = (page) =>
  existingPages.has(page) || [...existingPages].some((p) => p !== '/' && page.startsWith(`${p}/`))
const mapLayers = S.sets.layers.map((l) => ({
  id: l.id,
  title: l.title,
  hub: l.hub,
  exists: l.hub_exists,
  lands: l.lands ?? null,
  opener: l.opener.trim(),
  sets: S.sets.sets
    .filter((s) => s.layer === l.id)
    .map((s) => {
      const url = s.surface === 'rooms' ? `/${(s.rooms_url ?? '/x').split('/')[1]}` : (s.anchor_page ?? l.hub).split('#')[0]
      return {
        id: s.id,
        title: s.title,
        url,
        count: nodes.filter((x) => x.kind === 'member' && x.set === s.id).length,
        surface: s.surface,
        slot: s.slot ?? null,
        closed: s.closed,
        /* a chip only LINKS when its page is served today (the sweep's
           dead-link catch: /flow /boundary /proof /sources land later —
           their chips render soon until their WO flips this) */
        exists: pageServed(url),
        lands: s.lands ?? l.lands ?? null,
      }
    }),
}))
const mapSurface = S.sets.surfaces.find((s) => s.id === 'map')
const mapDataTs = GEN(
  'map-data.generated.ts',
  `export interface MapSet {
  id: string
  title: string
  url: string
  count: number
  surface: string
  slot: string | null
  closed: boolean
  /** the page is served today — a chip only links when true */
  exists: boolean
  lands: string | null
}
export interface MapLayer {
  id: string
  title: string
  hub: string
  exists: boolean
  lands: string | null
  opener: string
  sets: MapSet[]
}

export const MAP_OPENER = ${JSON.stringify(mapSurface?.opener?.trim() ?? '')}

export const MAP_LAYERS: MapLayer[] = ${JSON.stringify(mapLayers, null, 2)}
`,
)

/* ─── the design graph (fenêtre A · LENS_DESIGN_GRAPH §1) ────────────────────
   ONE resolution: layer refs cite SPINE tokens by name (S.tokens — parsed
   from design-tokens.generated.ts, values change SPEC-FIRST); paper/motion/
   status are site-side facts the descriptor owns. Three emissions, all
   byte-diffed by atlas.test; the measured forks consume them and the
   design-graph gate refuses a raw hex in a folded file. */
const DSN = S.sets.design
if (!DSN?.paper || !DSN?.layers || !DSN?.motion || !DSN?.status)
  throw new Error('sets.yaml design: section incomplete (paper/layers/motion/status)')
if (!DSN.kinds || !DSN.sota) throw new Error('sets.yaml design: kinds/sota missing (fenêtre C)')
const kindHex = Object.fromEntries(
  Object.entries(DSN.kinds).map(([kind, spec]) => {
    if (!S.tokens[spec.hue]) throw new Error(`design.kinds.${kind}: unknown spine token '${spec.hue}'`)
    return [kind, S.tokens[spec.hue]]
  }),
)
const kindGlyph = Object.fromEntries(Object.entries(DSN.kinds).map(([kind, spec]) => [kind, spec.glyph]))
const kindOfSet = {}
for (const [kind, spec] of Object.entries(DSN.kinds))
  for (const setId of spec.sets ?? []) {
    if (kindOfSet[setId]) throw new Error(`design.kinds: set '${setId}' claimed twice`)
    kindOfSet[setId] = kind
  }
const SOTA = DSN.sota
const layerHex = Object.fromEntries(
  Object.entries(DSN.layers).map(([layer, ref]) => {
    if (!S.tokens[ref]) throw new Error(`design.layers.${layer}: unknown spine token '${ref}'`)
    return [layer, S.tokens[ref]]
  }),
)
const rgb01 = (hex) => [1, 3, 5].map((i) => Math.round((parseInt(hex.slice(i, i + 2), 16) / 255) * 1e4) / 1e4)

const designCss = `/* design.generated.css — AUTO-GENERATED by scripts/atlas/build-atlas.mjs from
   scripts/atlas/sets.yaml design: (site facts) + the spec spine (verb/mark
   tokens · values change SPEC-FIRST). DO NOT EDIT · regenerate:
   node scripts/atlas/build-atlas.mjs · gate: atlas.test byte-diff +
   design-graph.test (fold law · ratchet · coherence). */
:root {
${Object.entries(DSN.paper).map(([k, v]) => `  --paper-${k}: ${v};`).join('\n')}
${Object.entries(layerHex).map(([k, v]) => `  --layer-${k}: ${v};`).join('\n')}
${Object.entries(DSN.motion.dur).map(([k, v]) => `  --dur-${k}: ${v}ms;`).join('\n')}
${Object.entries(DSN.motion.ease).map(([k, v]) => `  --ease-${k}: ${v};`).join('\n')}
${Object.entries(kindHex).map(([k, v]) => `  --kind-${k}: ${v};`).join('\n')}
  /* §7a · the researched values (R16-R19 · ratified §7) */
  --focus-ring-w: ${SOTA.focus.ring_w};
  --focus-ring-offset: ${SOTA.focus.ring_offset};
  --pressed-dur: ${SOTA.pressed.dur_ms}ms;
  --pressed-scale: ${SOTA.pressed.scale};
  --phosphor-tight: ${SOTA.phosphor.tight} color-mix(in srgb, var(--v4-accent) ${SOTA.phosphor.tight_pct}%, transparent);
  --phosphor-wide: ${SOTA.phosphor.wide} color-mix(in srgb, var(--v4-accent) ${SOTA.phosphor.wide_pct}%, transparent);
  --grain-opacity: ${SOTA.grain.opacity};
  /* the elevation ladder — ONE base, generated steps (oklch relative) */
  --surface-0: ${SOTA.elevation.base};
${Array.from({ length: SOTA.elevation.steps }, (_, i) => `  --surface-${i + 1}: oklch(from var(--surface-0) calc(l + ${((i + 1) * SOTA.elevation.step_l).toFixed(2)}) c h);`).join('\n')}
}

/* §7a · selection takes the LOCAL verb's colour (per-verb-section law) */
${Object.keys(S.tokens).filter((t) => ['infer', 'exec', 'invoke', 'agent'].includes(t)).map((verb) => `[data-verb-scope='${verb}'] ::selection { background: color-mix(in srgb, ${S.tokens[verb]} ${SOTA.selection.mix_pct}%, transparent); }`).join('\n')}

/* §7a · P3 accents step up GENERATED (never written twice) */
@supports (color: oklch(from red l c h)) {
  @media (color-gamut: p3) {
    :root {
${['accent', 'accentBright'].map((t) => `      --v4-${t === 'accent' ? 'accent' : 'accent-bright'}: oklch(from ${S.tokens[t]} l calc(c * ${SOTA.gamut.chroma_mul}) h);`).join('\n')}
    }
  }
}

/* §7c · the Tailwind v4 seam — utilities derive from the graph (the house
   springs only: out/linear would shadow Tailwind's own defaults) */
@theme inline {
${Object.keys(kindHex).map((k) => `  --color-kind-${k}: var(--kind-${k});`).join('\n')}
${Object.keys(layerHex).map((k) => `  --color-layer-${k}: var(--layer-${k});`).join('\n')}
  --ease-snap: var(--ease-snap);
  --ease-settle: var(--ease-settle);
}

/* the two-clocks mark (law 2: the ontology drives the pixel) — ONE recipe,
   every status surface consumes it (Inspector · hover card · rooms). The
   GEOMETRY carries the meaning, currentColor keeps each register's voice:
   ${Object.entries(DSN.status).map(([k, v]) => `${k}=${v}`).join(' · ')} */
.st-mark::before {
  content: '';
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-right: 7px;
  vertical-align: 1px;
}
/* the family glyph's voice — every surface that renders a member glyph
   (Inspector · hover card · rooms) speaks the kind's own hue */
${Object.keys(kindHex).map((k) => `.k-glyph[data-kind='${k}'] { color: var(--kind-${k}); }`).join('\n')}

${Object.entries(DSN.status)
  .map(([status, recipe]) => {
    const RECIPES = {
      stroke: '  border: 1.5px solid currentColor;',
      filled: '  background: currentColor;',
      'filled-ring':
        '  background: currentColor;\n  box-shadow: 0 0 0 2.5px color-mix(in srgb, currentColor 40%, transparent);',
    }
    if (!RECIPES[recipe]) throw new Error(`design.status.${status}: unknown recipe '${recipe}'`)
    return `.st-mark[data-status='${status}']::before {\n${RECIPES[recipe]}\n}`
  })
  .join('\n')}
`

const designTs = GEN(
  'design.generated.ts',
  `/** the seven floors' hues — resolved from the SPINE layer refs (ONE
 *  resolution: the constellation svg, the map css and the 3D scene all
 *  read THIS · never a local hue map) */
export const LAYER_HEX = ${JSON.stringify(layerHex, null, 2)} as const
export type AtlasLayerId = keyof typeof LAYER_HEX

/** normalized 0..1 triples — the three.js seam, extended to layers */
export const LAYER_RGB: Record<AtlasLayerId, readonly [number, number, number]> = {
${Object.entries(layerHex).map(([k, v]) => `  ${k}: [${rgb01(v).join(', ')}],`).join('\n')}
}

/** family signatures (fenêtre C · --kind-<family> flat, operator-locked):
 *  hue resolved from the SPINE ref, glyph declared at the descriptor */
export const KIND_HEX = ${JSON.stringify(kindHex, null, 2)} as const
export type AtlasKind = keyof typeof KIND_HEX

export const KIND_GLYPH = ${JSON.stringify(kindGlyph, null, 2)} as const

/** twin set id → its design kind (declared ON each kind at the descriptor ·
 *  the readout resolves members through THIS — no surface keeps a local map) */
export const KIND_OF_SET: Record<string, AtlasKind> = ${JSON.stringify(kindOfSet, null, 2)}

/** normalized 0..1 triples — the three.js seam, extended to kinds */
export const KIND_RGB: Record<AtlasKind, readonly [number, number, number]> = {
${Object.entries(kindHex).map(([k, v]) => `  ${k}: [${rgb01(v).join(', ')}],`).join('\n')}
}

/** the shared dark chrome (og cards · redirect stubs · the svg's css) */
export const PAPER = ${JSON.stringify(DSN.paper, null, 2)} as const

/** motion tokens (law 3: tokens, never numbers) · ms + easing strings */
export const MOTION_DUR_MS = ${JSON.stringify(DSN.motion.dur, null, 2)} as const
export const MOTION_EASE = ${JSON.stringify(DSN.motion.ease, null, 2)} as const

/** two-clocks → rendering recipe (law 2: the ontology drives the pixel) */
export const STATUS_RECIPE = ${JSON.stringify(DSN.status, null, 2)} as const
`,
)

const designPalette = JSON.stringify(
  {
    design_palette: 1,
    _generated: 'scripts/atlas/build-atlas.mjs — DO NOT EDIT (sets.yaml design: + the spec spine)',
    verbs: { infer: S.tokens.infer, exec: S.tokens.exec, invoke: S.tokens.invoke, agent: S.tokens.agent },
    severity: { ok: S.tokens.ok, fail: S.tokens.fail },
    accents: { accent: S.tokens.accent, accentBright: S.tokens.accentBright, markIce: S.tokens.markIce },
    paper: DSN.paper,
    layers: layerHex,
    kinds: Object.fromEntries(Object.entries(kindHex).map(([k, hex]) => [k, { hex, glyph: kindGlyph[k] }])),
    motion: DSN.motion,
    status: DSN.status,
    sota: SOTA,
  },
  null,
  2,
) + '\n'

/* the constellation (sorties 5+6 · pure layout → static svg · two byte-equal
   copies: the page inlines the src asset, agents fetch the public one) */
const geometry = layoutConstellation(twin)
const constellationSvg = renderConstellation(geometry, S.tokens, DSN.paper)

/* §7b · design-tokens.dtcg.json — the W3C Design Tokens interchange (the
   site↔studio bridge: Style Dictionary v4 · Tokens Studio · Figma read
   this). Colors + durations are typed; the linear() springs ride as
   documented strings (the format has no easing type yet). */
const dtcgColor = (hex) => ({ $type: 'color', $value: hex })
const dtcg = JSON.stringify(
  {
    $description:
      'nika.sh design tokens — AUTO-GENERATED by scripts/atlas/build-atlas.mjs from sets.yaml design: + the nika-spec spine. License: Apache-2.0 (machine artifact).',
    verb: Object.fromEntries(['infer', 'exec', 'invoke', 'agent'].map((v) => [v, dtcgColor(S.tokens[v])])),
    severity: { ok: dtcgColor(S.tokens.ok), fail: dtcgColor(S.tokens.fail) },
    accent: { default: dtcgColor(S.tokens.accent), bright: dtcgColor(S.tokens.accentBright), markIce: dtcgColor(S.tokens.markIce) },
    paper: Object.fromEntries(Object.entries(DSN.paper).map(([k, v]) => [k, dtcgColor(v)])),
    layer: Object.fromEntries(Object.entries(layerHex).map(([k, v]) => [k, dtcgColor(v)])),
    kind: Object.fromEntries(Object.entries(kindHex).map(([k, v]) => [k, dtcgColor(v)])),
    duration: Object.fromEntries(
      Object.entries(DSN.motion.dur).map(([k, ms]) => [k, { $type: 'duration', $value: `${ms}ms` }]),
    ),
    ease: Object.fromEntries(
      Object.entries(DSN.motion.ease).map(([k, v]) => [
        k,
        { $type: 'string', $value: v, $description: 'css easing (linear() springs have no DTCG type yet)' },
      ]),
    ),
  },
  null,
  2,
) + '\n'

/* §7b · design.forced-colors.css — the WHCM theme EMITTED from the same
   descriptor: system keywords by ROLE · the transparent-outline trick
   (WHCM draws outlines the normal theme never shows) · forced-color-adjust
   only where a swatch IS the datum. The box-drawn brand already thinks
   like WHCM — this makes the mode a system theme OF the brand. */
const forcedColorsCss = `/* design.forced-colors.css — AUTO-GENERATED by scripts/atlas/build-atlas.mjs
   (sets.yaml design: · §7b). DO NOT EDIT · regenerate: node scripts/atlas/build-atlas.mjs */
@media (forced-colors: active) {
  /* roles → system keywords (the WHCM contract) */
  :root {
${Object.keys(kindHex).map((k) => `    --kind-${k}: CanvasText;`).join('\n')}
${Object.keys(layerHex).map((k) => `    --layer-${k}: CanvasText;`).join('\n')}
    --focus-ring: Highlight;
    --phosphor-tight: none;
    --phosphor-wide: none;
  }
  /* the transparent-outline trick: invisible in the normal theme, WHCM
     paints it — every st-mark stays legible without its fill */
  .st-mark::before {
    outline: 1px solid transparent;
  }
  /* swatches ARE the datum (the /brand chips · the two-clocks mark):
     keep their author colors, everything else follows the system */
  .brand-swatch-chip,
  .st-mark[data-status]::before {
    forced-color-adjust: none;
  }
}
`

/* the chrome (sortie 4 · §4.11-4.12: nav + footer as projections). Authored
   intent comes from the descriptor's nav: section; every `ref` item resolves
   AGAINST THE GRAPH — url from the node, count from the set, soon from
   page_exists / hub existence / slot. WO-4 flips hub_exists and the chrome
   gains its links in the same compile, zero nav edits. */
const NAV_ICONS = new Set(['run', 'verbs', 'shield', 'tiles', 'terminal', 'book', 'butterfly'])
const nodeById = new Map(nodes.map((n) => [n.id, n]))
function resolveNavItem(item) {
  for (const k of ['label', 'icon']) {
    if (k === 'icon' && item.icon == null) continue
    if (!item[k] && k === 'label') throw new Error(`nav item without label: ${JSON.stringify(item)}`)
  }
  if (item.icon && !NAV_ICONS.has(item.icon)) throw new Error(`nav icon unknown: ${item.icon}`)
  if (!item.ref) {
    const out = { label: item.label }
    if (item.icon) out.icon = item.icon
    if (item.desc) out.desc = item.desc
    if (item.to) out.to = item.to
    if (item.href) out.href = item.href
    if (item.external) out.external = true
    if (item.slot) out.slot = true
    if (item.title) out.title = item.title
    return out
  }
  const node = nodeById.get(item.ref)
  if (!node) throw new Error(`nav ref not in the atlas: ${item.ref}`)
  const out = { label: item.label }
  if (item.icon) out.icon = item.icon
  if (node.kind === 'set') {
    const setDecl = S.sets.sets.find((s) => `set:${s.id}` === item.ref)
    const page = setDecl.surface === 'rooms'
      ? `/${(setDecl.rooms_url ?? '/x').split('/')[1]}`
      : (setDecl.anchor_page ?? hubOf(setDecl)).split('#')[0]
    const soon = Boolean(setDecl.slot) || node.page_exists === false
    if (soon) {
      out.soon = true
      out.slot_wave = setDecl.slot ?? null
    } else {
      out.to = page
      out.count = nodes.filter((x) => x.kind === 'member' && x.set === setDecl.id).length
      out._set = setDecl.id
    }
  } else if (node.kind === 'layer') {
    if (node.exists) out.to = node.url
    else {
      out.soon = true
      out.lands = node.lands
    }
  } else {
    throw new Error(`nav ref must be a set or layer: ${item.ref}`)
  }
  return out
}
const navProduct = S.sets.nav.product.cols.map((c) => ({ col: c.col, items: c.items.map(resolveNavItem) }))
const navReference = {
  featured: resolveNavItem(S.sets.nav.reference.featured),
  cols: S.sets.nav.reference.cols.map((c) => ({ col: c.col, items: c.items.map(resolveNavItem) })),
}

/* ONE PATH, ONE DOOR (§4.11 ratchet · 2026-07-18): a panel never shows two
   sibling rows resolving to the same bare path — the visitor reads two doors
   and lands in one place (the Types/The-language confusion, operator-named).
   A LATER row on an already-doored path must be an ANCHORED SUB-DOOR: its
   set's landing section (a `sections:` entry whose anchor equals the set id,
   on the page-owner set) gives the deep link, and the row renders as a child
   of the door above it. No resolvable section anchor = the build goes red
   naming the row — a second blank door cannot ship. */
const sectionAnchors = new Set(
  [...S.sets.sets, ...S.sets.layers].flatMap((owner) =>
    (owner.sections ?? []).map(
      (sec) => `${((owner.anchor_page ?? owner.hub) ?? '').split('#')[0]}#${sec.anchor}`,
    ),
  ),
)
function subordinateCollidingDoors(panel, cols) {
  const seen = new Set()
  for (const c of cols) {
    for (const item of c.items) {
      const bare = (item.to ?? '').split('#')[0]
      if (!bare) continue
      if (!seen.has(bare)) {
        seen.add(bare)
        continue
      }
      const deep = item._set ? `${bare}#${item._set}` : null
      if (!deep || !sectionAnchors.has(deep)) {
        throw new Error(
          `${panel}: second door to ${bare} (${item.label}) has no landing section anchor — one path, one door`,
        )
      }
      item.to = deep
      item.sub = true
    }
  }
  for (const c of cols) for (const item of c.items) delete item._set
}
subordinateCollidingDoors('nav.reference', navReference.cols)
subordinateCollidingDoors('nav.product', navProduct)
const footerCols = [
  ...navReference.cols.map((c) => ({
    kick: c.col,
    items: [
      ...c.items,
      ...S.sets.nav.footer.extras.filter((e) => e.col === c.col).map((e) => resolveNavItem(e.item)),
    ],
  })),
  ...S.sets.nav.footer.authored.map((c) => ({ kick: c.col, items: c.items.map(resolveNavItem) })),
]
const navTs = GEN(
  'atlas-nav.generated.ts',
  `/** the chrome as projection (§4.11-4.12): the Reference panel, the Product
 * panel (authored in the descriptor) and the footer's five columns. Soon
 * flags and counts are RESOLVED against the graph — a hub landing flips
 * them here, never in Nav.tsx. Docs/GitHub hrefs stay content.ts consts
 * (external: true marks them). */
export interface NavItem {
  label: string
  to?: string
  href?: string
  external?: boolean
  icon?: string
  /** anchored sub-door of the row above (one path, one door — §4.11) */
  sub?: boolean
  /** the derived register count (a one-token receipt · rendered as a chip) */
  count?: number
  /** the surface has not landed yet (wave slot or a WO ahead) */
  soon?: boolean
  slot_wave?: string | null
  lands?: string | null
  slot?: boolean
  title?: string
  desc?: string
}

export const NAV_BAR_LINKS: NavItem[] = ${JSON.stringify(S.sets.nav.bar.links.map(resolveNavItem), null, 2)}

export const NAV_VERSION_PILL = ${JSON.stringify(S.sets.nav.bar.version_pill, null, 2)} as const

export const NAV_PRODUCT: { col: string; items: NavItem[] }[] = ${JSON.stringify(navProduct, null, 2)}

export const NAV_DOCTRINE = ${JSON.stringify(S.sets.nav.product.doctrine_line, null, 2)} as const

export const NAV_REFERENCE: { featured: NavItem; cols: { col: string; items: NavItem[] }[] } =
  ${JSON.stringify(navReference, null, 2)}

export const FOOTER_COLS: { kick: string; items: NavItem[] }[] = ${JSON.stringify(footerCols, null, 2)}

export const FOOTER_MACHINE: { label: string; href: string }[] =
  ${JSON.stringify(S.sets.nav.footer.machine_row, null, 2)}
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
      /* a roomed member's @id IS its page (rooms universelles) — the
         fragment form stays for anchor-only members */
      '@id': `${ORIGIN}${m.url}${m.anchor && !m.own_page ? `#${m.anchor}` : ''}`,
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
/* these structures land inside <script type=application/ld+json> via
   innerHTML (unhead, escaping off) — a '</script' in any opener would
   close the tag mid-JSON (the render-constellation guard, same class) */
if (JSON.stringify(termsetsByPage).includes('</script'))
  throw new Error('jsonld: an opener contains </script — refuse at the source')
const jsonldTs = GEN(
  'jsonld.generated.ts',
  `/** DefinedTermSet/DefinedTerm per atlas page (§0.9: +version +license).
 * Hub heads mount these (hub-lib.ts); pages join at WO-7. Data only. */
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

/* room rails (WO-5b): the per-room slices of the graph, chrome-lean —
   rooms never import the 344-node module (our own bundle-safety law).
   Everything below is a REGROUPING of edges already derived above from
   the gated twins; the scope→chapter table routes to chapters that exist
   (presentation routing, not new facts). */
const wordAccepts = {}
const verbAccepts = {}
for (const e of uniqEdges) {
  if (e.kind !== 'accepts') continue
  const verb = e.from.slice(5)
  const word = e.to.slice(5)
  ;(wordAccepts[word] ??= []).push(verb)
  ;(verbAccepts[verb] ??= []).push(word)
}
for (const k of Object.keys(wordAccepts)) wordAccepts[k].sort()
for (const k of Object.keys(verbAccepts)) verbAccepts[k].sort()

/* scope → normative chapter (the descriptor's defined_by, member-level:
   envelope→01 · task/leashes→03 · a verb block→02 · namespaces→04) */
const SCOPE_CHAPTER = { envelope: '01', workflow: '01', task: '03', vars: '04', env: '04', secrets: '04' }
const wordChapters = {}
for (const w of S.words) {
  const set = new Set()
  for (const d of w.decls) set.add(VERBS.has(d.scope) ? '02' : SCOPE_CHAPTER[d.scope] ?? '03')
  wordChapters[w.word] = [...set].sort()
}

const templateGrants = {}
const templateCarries = {}
for (const [bare, refs] of Object.entries(S.toolRefs)) {
  for (const t of refs.templates ?? []) (templateGrants[t] ??= []).push(bare)
}
for (const [word, refs] of Object.entries(S.wordRefs)) {
  for (const t of refs.templates ?? []) (templateCarries[t] ??= []).push(word)
}
for (const k of Object.keys(templateGrants)) templateGrants[k].sort()
for (const k of Object.keys(templateCarries)) templateCarries[k].sort()

/* a verb's error namespace exists only if the catalog declares it */
const declaredNs = new Set(Object.keys(S.errors.namespaces))
const verbErrNs = Object.fromEntries(
  S.canon.verbNames
    .map((v) => [v, `NIKA-${v.toUpperCase()}`])
    .filter(([, ns]) => declaredNs.has(ns)),
)

const roomRailsTs = GEN(
  'room-rails.generated.ts',
  `/** the per-room graph slices (WO-5b) — regroupings of the atlas edges,
 * lean enough for the room pages (the full graph stays lazy). */
export const WORD_ACCEPTS: Record<string, string[]> = ${JSON.stringify(wordAccepts)}

/** word → the normative chapters its scopes live in (member-level
 * defined_by · SHORT keys — CHAPTER_FILES resolves · the bundle stays lean) */
export const WORD_CHAPTERS: Record<string, string[]> = ${JSON.stringify(wordChapters)}

export const CHAPTER_FILES: Record<string, string> = {
  '01': 'spec/01-envelope.md',
  '02': 'spec/02-verbs.md',
  '03': 'spec/03-dag.md',
  '04': 'spec/04-variables.md',
}

export const VERB_ACCEPTS: Record<string, string[]> = ${JSON.stringify(verbAccepts)}

/** verb → its declared error namespace (catalog-checked · absent = none declared) */
export const VERB_ERR_NS: Record<string, string> = ${JSON.stringify(verbErrNs)}

/** template → the nika tools its whitelist grants (usage-refs inverse) */
export const TEMPLATE_GRANTS: Record<string, string[]> = ${JSON.stringify(templateGrants)}

/** template → the notable words its skeleton carries (usage-refs inverse) */
export const TEMPLATE_CARRIES: Record<string, string[]> = ${JSON.stringify(templateCarries)}

/** the fetch extract modes (canon order · anchors on the fetch room) */
export const FETCH_MODES: string[] = ${JSON.stringify(S.canon.extractModeNames)}

`,
)

/* the blog cross-rails ride their OWN module (the register-diet law: this
   data reaches the client only as an async chunk via the access doors —
   src/lib/blog-rails-access.ts; pages feed their first render from a byte
   island. A static import outside the doors goes red in atlas.test). */
const blogRailsTs = GEN(
  'blog-rails.generated.ts',
  `/** member node id → the posts that mention it (D5 · mentions inverted ·
 * date desc · cap 3) — the room's « from the blog » rail */
export const FROM_BLOG: Record<string, { slug: string; title: string; date: string }[]> = ${JSON.stringify(fromBlog)}

/** post slug → the members it mentions (D5 · same edges, other direction) —
 * the post's « the register behind this » chips */
export const POST_MENTIONS: Record<string, { kind: string; id: string; label: string; url: string }[]> = ${JSON.stringify(postMentions)}

/** post slug → its closest posts by SHARED mentioned members (D6 · score
 * desc · date breaks ties · cap 3 · derived-only, no tag filler) */
export const RELATED_POSTS: Record<string, { slug: string; title: string; date: string; shared: number }[]> = ${JSON.stringify(relatedPosts)}
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

/** the capture registry (§2bis law 4): every terminal capture surface, its
 * command and the gate that pins it — all recorded at the DISPLAYED release
 * (old pin declared) · new captures are release-gated. */
export const CAPTURES: { id: string; surface: string; export: string; command: string; gate: string }[] =
  ${JSON.stringify([...S.sets.capture_registry].sort((a, b) => a.id.localeCompare(b.id)), null, 2)}
`,
)

/* ATLAS_PATHS (output 3 · §7 WO-4): the routes the atlas introduced, written
   IN PLACE between the site.config.ts markers (the file stays import-free ·
   the rest stays hand-owned). Reading order; only served surfaces emit. */
const ROOMED_ANCHOR_SETS = new Set(
  S.sets.sets.filter((x) => x.rooms_url && x.surface === 'anchors').map((x) => x.id),
)
const atlasPaths = [
  ...S.sets.surfaces.filter((x) => x.atlas_route && x.exists).map((x) => x.url),
  ...S.sets.layers.filter((l) => l.atlas_route && l.hub_exists).map((l) => l.hub),
  /* rooms universelles (verdict 2026-07-18): every member of a roomed
     anchor set is a SERVED page — derived from the graph, never listed */
  ...nodes
    .filter((n) => n.kind === 'member' && ROOMED_ANCHOR_SETS.has(n.set))
    .map((n) => n.url)
    .sort(),
  /* atlas-born ROOM sets (the showcases · §4.13): every member url joins
     the prerender the day rooms_exist flips — never listed by hand */
  ...(S.sets.sets.find((x) => x.id === 'showcases')?.rooms_exist
    ? Object.keys(S.dag).sort().map((slug) => `/use-cases/${slug}`)
    : []),
]
const siteConfigPath = join(ROOT, 'site.config.ts')
const siteConfig = readFileSync(siteConfigPath, 'utf8')
const MARK_A = 'export const ATLAS_PATHS = '
const MARK_B = '\n/* ── ATLAS PATHS END ── */'
const a = siteConfig.indexOf(MARK_A)
const b = siteConfig.indexOf(MARK_B)
if (a === -1 || b === -1) throw new Error('site.config.ts: ATLAS PATHS markers missing')
const nextSiteConfig =
  siteConfig.slice(0, a) + MARK_A + JSON.stringify(atlasPaths).replaceAll('","', "', '").replace('["', "['").replace('"]', "']") + siteConfig.slice(b)

/* hub data (the atlas-born hubs' render module · chrome-lean: pages never
   import the 344-node graph — the bundle-safety law applied to ourselves) */
const hubSets = (layerId, hubUrl) =>
  S.sets.sets
    /* anchored ON the hub page only — a proof-layer set anchored elsewhere
       (truth-words lives on /sources) belongs to ITS page's head, mirroring
       the twin's per-anchor_page law */
    .filter((x) => x.layer === layerId && x.surface === 'anchors' && x.anchors_exist
      && (x.anchor_page ?? hubUrl).split('#')[0] === hubUrl)
    .map((x) => ({
      id: x.id,
      title: x.title,
      opener: x.opener.trim(),
      anchor_prefix: x.anchor_prefix ?? '',
      node_prefix: MEMBER_PREFIX[x.id],
      defined_by: x.defined_by.filter((c) => !c.startsWith('site:')),
      closed: x.closed,
      /* membersOf covers canon-sourced sets too (mcp-tools) — inline sets
         resolve to the same rows they inlined before. Null fields are
         OMITTED (this module rides the initial bundle · consumers read
         truthiness) */
      members: membersOf(x)
        .map((m) => ({
          id: m.member,
          ...(m.opener ? { one_liner: m.opener } : {}),
          ...(m.meta?.slot ? { slot: m.meta.slot } : {}),
          /* rooms universelles: a roomed member carries ITS page — the hub
             head's DefinedTerm @id points at the room (the richest form:
             set anchored on the register, terms on their own pages) */
          ...(m.own_page ? { url: m.url } : {}),
        })),
    }))
    .filter((x) => x.members.length > 0)
const hubData = S.sets.layers
  .filter((l) => l.atlas_route && l.hub_exists)
  .map((l) => ({
    id: l.id,
    title: l.title,
    hub: l.hub,
    opener: l.opener.trim(),
    sections: (l.sections ?? []).map((sec) => ({
      id: sec.id,
      anchor: sec.anchor,
      title: sec.title,
      ...(sec.note ? { note: sec.note } : {}),
      ...(sec.slot ? { slot: sec.slot } : {}),
    })),
    sets: hubSets(l.id, l.hub),
  }))
/* the 40-cell verdict grid summary (tiny · the static face of I1 — the
   full matrix with yamls stays its own lazy chunk) */
const gateGrid = {
  producers: ['success', 'failure', 'skipped', 'cancelled'],
  forms: [
    'with-value', 'with-status', 'with-error', 'after-success', 'after-failure',
    'after-skipped', 'after-terminal', 'when-true', 'when-false', 'no-edge',
  ],
  cells: S.gateMatrix,
}
const hubDataTs = GEN(
  'hub-data.generated.ts',
  `export interface HubSetMember {
  id: string
  one_liner?: string
  slot?: string
  /** the member's own page (rooms universelles) — absent for anchor-only */
  url?: string
}
export interface HubSet {
  id: string
  title: string
  opener: string
  anchor_prefix: string
  /** the graph's node-id prefix (member id is prefix:member) — the
   * Inspector door */
  node_prefix: string
  defined_by: string[]
  closed: boolean
  members: HubSetMember[]
}
export interface HubSection {
  id: string
  anchor: string
  title: string
  note?: string
  slot?: string
}
export interface HubData {
  id: string
  title: string
  hub: string
  opener: string
  sections: HubSection[]
  sets: HubSet[]
}

export const HUBS: Record<string, HubData> = ${JSON.stringify(Object.fromEntries(hubData.map((h) => [h.id, h])), null, 2)}

/** the I1 grid axes (the verdict summary renders statically · the full
 * matrix with fixture yamls is its own lazy chunk: gate-matrix.generated) */
export interface GateGridCell {
  producer: string
  form: string
  verdict: string
  dead: boolean
  code: string | null
  fixture: string | null
}
export const GATE_GRID: { producers: string[]; forms: string[]; cells: GateGridCell[] } =
  ${JSON.stringify(gateGrid, null, 2)}
`,
)

/* the DERIVED DAG module (WO-12 register diet): the plan facts every
   first-render surface needs (home hero tallies · rooms · spec machine),
   re-emitted HERE so pages can import them WITHOUT touching
   usecases-yaml.generated — once no static import reaches that module,
   the 79K of yaml strings becomes an async chunk (the island recipe).
   The SOURCE stays the spec-owned projector emission (frontier law);
   this is a value-equal projection, gate-pinned toEqual in atlas.test. */
/* W2 at the door (0.104 shipped flip): the rendered YAML passes w1-to-w2 at
   the access doors (showcase-yaml-access · Play seeds), so the emitted plan
   facts must point at the RENDERED lines — the same pass's line map re-aims
   every line0/line1 (0-based in this projection). Value-equality in
   atlas.test applies the same remap to the ratified emission before
   comparing. Retires with the pass (see src/lib/w1-to-w2.ts). */
const showcaseSrc = readFileSync(join(ROOT, 'src/sections/usecases-yaml.generated.ts'), 'utf8')
const showcaseYamlOf = (slug) => {
  const m = new RegExp("'" + slug + "': `([\\s\\S]*?)`,\\n").exec(showcaseSrc)
  if (!m) throw new Error(`showcase yaml for ${slug} not found in usecases-yaml.generated.ts`)
  return m[1].replace(/\\([`$\\])/g, '$1')
}
const dagW2 = Object.fromEntries(
  Object.entries(S.dag).map(([slug, dag]) => {
    const { mapLine } = serveW105WithMap(showcaseYamlOf(slug))
    const tasks = dag.tasks.map((t) => ({
      ...t,
      line0: mapLine(t.line0 + 1) - 1,
      line1: mapLine(t.line1 + 1) - 1,
    }))
    return [slug, { ...dag, tasks }]
  }),
)

/* member rooms (verdict 2026-07-18 · rooms universelles): the generic
   MemberRoom route's chrome-safe registry — family segment → set identity +
   ordered members (prev/next · the readout works off the lazy graph). */
const memberRoomFamilies = Object.fromEntries(
  S.sets.sets
    .filter((x) => x.rooms_url && x.surface === 'anchors')
    .map((set) => [
      set.rooms_url.slice(1),
      {
        set: set.id,
        title: set.title,
        hub: (set.anchor_page ?? hubOf(set)).split('#')[0],
        members: nodes
          .filter((n) => n.kind === 'member' && n.set === set.id)
          .map((n) => ({ id: n.id.split(':').slice(1).join(':'), title: n.title, url: n.url, node: n.id })),
      },
    ]),
)
const memberRoomsTs = GEN(
  'member-rooms.generated.ts',
  `/** the generic member-room registry (rooms universelles · one route, every
 * family): family URL segment → set identity + ordered members. The room's
 * BODY comes from the lazy graph (readoutFor · the inspector's renderer) —
 * this module stays chrome-lean by law. */
export interface MemberRoomEntry {
  id: string
  title: string
  url: string
  /** the atlas node id (readoutFor's key · TruthLine's key) */
  node: string
}
export interface MemberRoomFamily {
  set: string
  title: string
  /** the register view this family's members anchor on (the parent door) */
  hub: string
  members: MemberRoomEntry[]
}
export const MEMBER_ROOM_FAMILIES: Record<string, MemberRoomFamily> = ${JSON.stringify(memberRoomFamilies, null, 2)}
`,
)

const showcaseDagTs = GEN(
  'showcase-dag.generated.ts',
  `/** the showcase plan facts (value-equal projection of SHOWCASE_DAG in
 * usecases-yaml.generated.ts — atlas.test pins the equality; import THIS
 * for first-render facts so the yaml strings can stay an async chunk). */
export interface ShowcaseTask {
  id: string
  verb: 'infer' | 'exec' | 'invoke' | 'agent'
  deps: string[]
  wave: number
  gate: 'default' | 'when' | 'always'
  gloss: string
  flags: string[]
  line0: number
  line1: number
}
export interface ShowcaseDag {
  tasks: ShowcaseTask[]
  outputs: string[]
  waves: number
}
export const SHOWCASE_DAG: Record<string, ShowcaseDag> = ${JSON.stringify(dagW2, null, 2)}
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

/* the 301 stubs (WO-6): every LIVE moved row under /providers/ becomes a
   STATIC meta-refresh file (the /docs pattern — a React stub hydrates
   during its own refresh and throws #418, the law paid at /sitemap).
   Emitted FROM redirects.json rows: the manifest and the files cannot
   drift apart. Static hosting has no server rules; the stub IS the 301. */
const stub = (to, label) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="robots" content="noindex" />
    <meta http-equiv="refresh" content="0; url=${to}" />
    <link rel="canonical" href="https://nika.sh${to.split('#')[0]}" />
    <title>${label} · Nika</title>
    <meta name="theme-color" content="${DSN.paper.bg}" />
    <link rel="icon" href="/favicon.ico" sizes="32x32" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <style>
      :root { color-scheme: dark; }
      body { margin: 0; display: grid; place-items: center; min-height: 100svh; background: ${DSN.paper.bg}; color: ${DSN.paper.ink}; font: 15px/1.6 ui-monospace, SFMono-Regular, Menlo, monospace; }
      a { color: ${S.tokens.accentBright}; }
    </style>
  </head>
  <body>
    <p>→ <a href="${to}">nika.sh${to}</a></p>
  </body>
</html>
`
const providerStubs = redirects.filter((r) => r.live && r.from.startsWith('/providers/'))

/* ─── write + report ───────────────────────────────────────────────────────*/
if (!REPORT_ONLY) {
  writeFileSync(join(ROOT, 'src/content/atlas.generated.ts'), atlasTs)
  writeFileSync(join(ROOT, 'src/content/atlas-meta.generated.ts'), metaTs)
  writeFileSync(join(ROOT, 'src/content/jsonld.generated.ts'), jsonldTs)
  writeFileSync(join(ROOT, 'src/content/market-vocab.generated.ts'), vocabTs)
  writeFileSync(join(ROOT, 'src/content/snippets.generated.ts'), snippetsTs)
  writeFileSync(join(ROOT, 'src/content/atlas-nav.generated.ts'), navTs)
  writeFileSync(join(ROOT, 'src/content/showcase-dag.generated.ts'), showcaseDagTs)
  writeFileSync(join(ROOT, 'src/content/member-rooms.generated.ts'), memberRoomsTs)
  writeFileSync(join(ROOT, 'src/content/room-rails.generated.ts'), roomRailsTs)
  writeFileSync(join(ROOT, 'src/content/blog-rails.generated.ts'), blogRailsTs)
  writeFileSync(join(ROOT, 'src/pages/map-data.generated.ts'), mapDataTs)
  writeFileSync(join(ROOT, 'src/pages/hub-data.generated.ts'), hubDataTs)
  if (nextSiteConfig !== siteConfig) writeFileSync(siteConfigPath, nextSiteConfig)
  writeFileSync(join(ROOT, 'src/assets/constellation.generated.svg'), constellationSvg)
  writeFileSync(join(ROOT, 'src/design.generated.css'), designCss)
  writeFileSync(join(ROOT, 'src/design.forced-colors.generated.css'), forcedColorsCss)
  writeFileSync(join(ROOT, 'src/content/design.generated.ts'), designTs)
  writeFileSync(join(ROOT, 'public/design-palette.json'), designPalette)
  writeFileSync(join(ROOT, 'public/design-tokens.dtcg.json'), dtcg)
  for (const r of providerStubs) {
    const dir = join(ROOT, 'public', r.from.slice(1))
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'index.html'), stub(r.to, r.from.split('/').pop()))
  }
  mkdirSync(join(ROOT, 'public/ontology'), { recursive: true })
  mkdirSync(join(ROOT, 'public/i18n'), { recursive: true })
  mkdirSync(join(ROOT, 'public/map'), { recursive: true })
  writeFileSync(join(ROOT, 'public/map/constellation.svg'), constellationSvg)
  writeFileSync(join(ROOT, 'public/ontology/language.json'), JSON.stringify(twin, null, 2) + '\n')
  writeFileSync(
    join(ROOT, 'public/i18n/untranslatables.json'),
    JSON.stringify({ lexicon: 1, derived_from: 'build-atlas (the language graph)', entries: untranslatables }, null, 2) + '\n',
  )
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

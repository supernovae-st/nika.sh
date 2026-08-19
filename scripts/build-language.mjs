/* ─── build-language · the language's words → the keyword register data ───────
   Every key an author can type in a .nika.yaml — the nine-key envelope, the
   task grammar, the four verb blocks, the leash (retry), the catch side
   (on_error) — projected from the ONE contract the engine already serves:
   public/schema/workflow.json (0.109 · the cleanup lane is a task on an
   `unwind` edge now, so it has no surface of its own). The
   /language register renders this; prose can never drift from the schema
   because there is no prose — descriptions are the schema's own.

   Shape: one entry per UNIQUE word, carrying every DECLARATION of that
   word (a word like `model` speaks at the envelope, in infer and in agent;
   `when` gates a task and a finally step). Scopes ride the schema's own
   structure, in reading order.

   Determinism: same schema → byte-identical output (words sorted, scopes
   in canonical order, no build stamps). The vitest drift gate
   (language.test.ts) recompiles and byte-diffs, and pins the verb set
   against CANON.verbNames.

   Run: node scripts/build-language.mjs
   Output: src/content/language.generated.ts */
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const schema = JSON.parse(readFileSync(join(ROOT, 'public/schema/workflow.json'), 'utf8'))

/* the reading order of the language's surfaces (the spec's own order) */
const SURFACES = [
  /* the nine keys: nika · model · inputs · const · secrets · permits · run ·
     tasks · outputs — `nika:` carries the name (no workflow: object) */
  { scope: 'envelope', node: schema, blurb: 'the file itself' },
  { scope: 'task', node: schema.$defs.task, blurb: 'one step of the plan' },
  { scope: 'infer', node: schema.$defs.infer, blurb: 'inside infer:' },
  { scope: 'exec', node: schema.$defs.exec, blurb: 'inside exec:' },
  { scope: 'invoke', node: schema.$defs.invoke, blurb: 'inside invoke:' },
  { scope: 'agent', node: schema.$defs.agent, blurb: 'inside agent:' },
  /* the task-level blocks that carry their own words (the leashes) —
     `for_each:` became ONE block in 0.109 (items · max_parallel · fail_fast),
     and `lift:` entries name the law they lift (law · from · because) */
  { scope: 'for_each', node: schema.$defs.task.properties.for_each, blurb: 'inside for_each:' },
  { scope: 'retry', node: schema.$defs.retry, blurb: 'inside retry:' },
  { scope: 'on_error', node: schema.$defs.onError, blurb: 'inside on_error:' },
  { scope: 'lift', node: schema.$defs.task.properties.lift.items, blurb: 'inside a lift entry' },
]
/* every surface must resolve on the served schema — a renamed $def is a
   loud red here, never a silent empty register */
for (const s of SURFACES) {
  if (!s.node || typeof s.node !== 'object') {
    throw new Error(`build-language: surface ${s.scope} has no node in public/schema/workflow.json`)
  }
}

/* a compact human label for a property's type — the schema's own facts,
   never invented: explicit type (string|array), a const, or an enum */
function typeLabel(prop) {
  if (prop.const !== undefined) return JSON.stringify(prop.const)
  if (typeof prop.type === 'string') return prop.type
  if (Array.isArray(prop.type)) return prop.type.join(' | ')
  if (prop.enum) return 'enum'
  if (prop.anyOf || prop.oneOf) {
    const arms = (prop.anyOf ?? prop.oneOf)
      .map((a) => (typeof a.type === 'string' ? a.type : Array.isArray(a.type) ? a.type.join('|') : null))
      .filter(Boolean)
    if (arms.length) return [...new Set(arms)].join(' | ')
  }
  return undefined
}

/* the deeper invariants the contract carries — a property's own format/
   pattern, or its ITEMS' (an array prop constrains each entry, not the list) */
function invariants(prop) {
  const own = (n) => ({
    ...(typeof n?.format === 'string' ? { format: n.format } : {}),
    ...(typeof n?.pattern === 'string' ? { pattern: n.pattern } : {}),
  })
  const direct = own(prop)
  if (direct.format || direct.pattern) return direct
  const viaItems = own(prop?.items)
  if (viaItems.format || viaItems.pattern) return viaItems
  /* output: {<name>: <jq>} — the annotation rides additionalProperties */
  const viaAP = own(prop?.additionalProperties)
  if (viaAP.format || viaAP.pattern) return viaAP
  for (const arm of prop?.anyOf ?? prop?.oneOf ?? []) {
    const a = own(arm)
    if (a.format || a.pattern) return a
  }
  return {}
}

const byWord = new Map()
for (const s of SURFACES) {
  const req = new Set(s.node.required ?? [])
  for (const [word, prop] of Object.entries(s.node.properties ?? {})) {
    if (!byWord.has(word)) byWord.set(word, [])
    byWord.get(word).push({
      scope: s.scope,
      required: req.has(word),
      ...(typeLabel(prop) ? { type: typeLabel(prop) } : {}),
      ...(prop.enum ? { enum: prop.enum } : {}),
      ...invariants(prop),
      ...(prop.description ? { desc: prop.description } : {}),
    })
  }
}

const VERBS = new Set(['infer', 'exec', 'invoke', 'agent'])
const words = [...byWord.keys()].sort().map((word) => ({
  word,
  verb: VERBS.has(word),
  decls: byWord.get(word),
}))

const scopes = SURFACES.map((s) => ({ scope: s.scope, blurb: s.blurb }))

/* ── the prose leaves the index (the register-diet law) ───────────────────────
   Every word's `desc` is the schema's own teaching sentence, and the rooms
   render it whole — but the five /language + /verbs pages are sync-routed for
   the prerenderer, so anything they import statically rides the ENTRY chunk.
   Measured 2026-07-27: the 59 descriptions cost 3.9 KB gz there, and the
   contract will keep minting more, so this was a permanent growth vector.

   The prose is therefore emitted as its OWN module, keyed word → per-decl
   sentence (index-aligned with `decls`, '' where a declaration has none). The
   rooms reach it through src/lib/language-prose-access.ts: present at SSG by
   a top-level SSR import, embedded in the prerendered HTML as a byte island,
   fetched as an async chunk only on SPA-nav. The index below keeps every
   structural field — scope · required · type · enum · format · pattern — so
   the map, the sitemap and the sources rows read it for free. */
const prose = Object.fromEntries(
  words
    .map((w) => [w.word, w.decls.map((d) => d.desc ?? '')])
    .filter(([, list]) => list.some(Boolean)),
)
const lightWords = words.map((w) => ({
  ...w,
  decls: w.decls.map(({ desc: _desc, ...rest }) => rest),
}))

const proseBanner = `// language-prose.generated.ts — AUTO-GENERATED by scripts/build-language.mjs
// from public/schema/workflow.json (the served contract). DO NOT EDIT ·
// regenerate: node scripts/build-language.mjs
// Drift gate: src/test/language.test.ts recompiles and byte-diffs.
//
// THE HEAVY HALF, DELIBERATELY SEPARATE. These are the schema's own teaching
// sentences — the thing /language/<word> exists to show. They are NOT in
// language.generated.ts because that module is entry-resident (sync-routed
// pages) and this prose grows every time the contract teaches another word.
// The door is src/lib/language-prose-access.ts; nothing should import this
// module directly except that door and the build scripts.

/** word → its sentence per declaration, index-aligned with \`decls\`; '' where
 *  that declaration carries none. A word with no sentence anywhere is absent. */
export const WORD_PROSE: Record<string, string[]> = ${JSON.stringify(prose, null, 2)}
`

writeFileSync(join(ROOT, 'src/content/language-prose.generated.ts'), proseBanner)

const banner = `// language.generated.ts — AUTO-GENERATED by scripts/build-language.mjs
// from public/schema/workflow.json (the served contract — the same file
// editors and the engine validate against). DO NOT EDIT · regenerate:
//   node scripts/build-language.mjs
// Drift gate: src/test/language.test.ts recompiles and byte-diffs, and
// pins the verb-flagged set against CANON.verbNames.

export interface WordDecl {
  /** where the word speaks (envelope · task · a verb block · the leashes) */
  scope: string
  /** required at that surface (a miss is a schema finding) */
  required: boolean
  /** the schema's own type label, when it declares one */
  type?: string
  /** closed value set, when the schema pins one */
  enum?: string[]
  /** value language annotation (cel-expression · jq) when the schema marks one */
  format?: string
  /** the schema's own regex (the word's, or its items') */
  pattern?: string
}

export interface LanguageWord {
  /** the key as an author types it */
  word: string
  /** one of the four verbs (its room lives at /verbs/:name) */
  verb: boolean
  /** every declaration of this word, surface reading order */
  decls: WordDecl[]
}

/** the language's surfaces, reading order (the register's groups) */
export const LANGUAGE_SCOPES = ${JSON.stringify(scopes, null, 2)} as const

/** every unique word the schema declares, sorted. */
export const LANGUAGE_WORDS: LanguageWord[] = ${JSON.stringify(lightWords, null, 2)}

/** word → entry (the /language/:word lookup). */
export const WORD_INDEX: Record<string, LanguageWord> = Object.fromEntries(
  LANGUAGE_WORDS.map((w) => [w.word, w]),
)
`

writeFileSync(join(ROOT, 'src/content/language.generated.ts'), banner)
console.log(
  `language → ${words.length} words · ${words.reduce((n, w) => n + w.decls.length, 0)} declarations over ${scopes.length} surfaces · ${Object.keys(prose).length} carry prose (separate module)`,
)

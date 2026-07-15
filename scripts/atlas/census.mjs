/* ─── atlas census · WO-1 of the language-atlas plan ──────────────────────────
   Reads every truth source the site already carries and prints the world:
   each canonical set, its members, and the ratified-vs-shipped diff (the
   two clocks made visible). READ-ONLY: writes nothing; it is the
   executable proof that the atlas compiler has everything it needs, and
   the first surface where a clock lag becomes a named fact.

   Sources (all gated upstream · plan §1):
     src/canon.generated.ts          spec-time   (canon.yaml projected)
     public/schema/workflow.json     spec-time   (the words · the shapes)
     public/tools/catalog.json       release-time (the shipped builtins)
     public/errors/catalog.json      spec-time   (codes · categories)
     public/templates/catalog.json   spec-time   (the ten skeletons)
     public/providers/catalog.json   release-time (the shipped catalog)

   Run: node scripts/atlas/census.mjs            table for humans
        node scripts/atlas/census.mjs --json     the same, machine-shaped */
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')
const read = (p) => readFileSync(join(ROOT, p), 'utf8')
const json = (p) => JSON.parse(read(p))

/* canon.generated.ts is emitted by canon-projectors.py in ONE style:
   `export const CANON = { bareKey: value, ... } as const;` with
   double-quoted strings and zero single quotes. Slice the literal,
   quote the bare keys, JSON.parse. No eval — and if the emission style
   ever drifts, this parse dies loudly and names the drift. */
function parseCanon(ts) {
  const start = ts.indexOf('{')
  const end = ts.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('canon.generated.ts: no object literal found')
  const body = ts
    .slice(start, end + 1)
    .replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":')
    .replace(/,(\s*[}\]])/g, '$1')
  try {
    return JSON.parse(body)
  } catch (e) {
    throw new Error(`canon.generated.ts: emission style drifted, census cannot parse (${e.message})`)
  }
}

const CANON = parseCanon(read('src/canon.generated.ts'))
const schema = json('public/schema/workflow.json')
const tools = json('public/tools/catalog.json')
const errors = json('public/errors/catalog.json')
const templates = json('public/templates/catalog.json')
const providers = json('public/providers/catalog.json')

/* ── the sets · one row per canonical set the atlas will carry ── */
const taskWords = Object.keys(schema.$defs?.task?.properties ?? {}).sort()
const envelopeWords = Object.keys(schema.properties ?? {}).sort()
const shippedBuiltins = (tools.tools ?? [])
  .map((t) => t.bare ?? String(t.name ?? '').replace('nika:', ''))
  .sort()
const errorCodes = (errors.codes ?? []).map((c) => c.code).sort()
const errorNamespaces = [...new Set(errorCodes.map((c) => c.split('-').slice(0, 2).join('-')))].sort()
const errorCategories = [...new Set((errors.codes ?? []).map((c) => c.category))].sort()
const shippedProviders = (providers.providers ?? []).map((p) => p.id ?? p.name).sort()

/* order: 'canon' = l'ordre du canon EST une donnée (les 4 verbes · local-first) · 'sorted' = dérivé, trié */
const sets = [
  { id: 'verbs', clock: 'spec', order: 'canon', members: CANON.verbNames ?? [] },
  { id: 'namespaces', clock: 'spec', order: 'canon', members: CANON.namespaceNames ?? [] },
  { id: 'words.task', clock: 'spec', members: taskWords },
  { id: 'words.envelope', clock: 'spec', members: envelopeWords },
  { id: 'builtins.ratified', clock: 'spec', order: 'canon', members: CANON.builtinNames ?? [] },
  { id: 'builtins.shipped', clock: 'release', members: shippedBuiltins },
  { id: 'errors.codes', clock: 'spec', members: errorCodes },
  { id: 'errors.namespaces', clock: 'spec', members: errorNamespaces },
  { id: 'errors.categories', clock: 'spec', members: errorCategories },
  { id: 'templates', clock: 'spec', order: 'canon', members: CANON.templateNames ?? [] },
  { id: 'providers.shipped', clock: 'release', members: shippedProviders },
  { id: 'extract-modes', clock: 'spec', order: 'canon', members: CANON.extractModeNames ?? [] },
  { id: 'mcp.tools', clock: 'spec', order: 'canon', members: CANON.mcpToolNames ?? [] },
]

/* ── the two clocks · ratified (canon) vs shipped (engine catalogs) ── */
const ratified = new Set(CANON.builtinNames ?? [])
const shipped = new Set(shippedBuiltins)
const clockDiff = {
  ratified_not_shipped: [...ratified].filter((b) => !shipped.has(b)).sort(),
  shipped_not_ratified: [...shipped].filter((b) => !ratified.has(b)).sort(),
}

const world = {
  engine_version: tools.engine ?? tools.version ?? null,
  canon_schema_version: CANON.schemaVersion ?? null,
  sets: sets.map((s) => ({ id: s.id, clock: s.clock, order: s.order ?? 'sorted', count: s.members.length, members: s.members })),
  clock_diff: clockDiff,
}

if (process.argv.includes('--json')) {
  process.stdout.write(JSON.stringify(world, null, 2) + '\n')
} else {
  console.log(`atlas census · engine ${world.engine_version} · canon v${world.canon_schema_version}`)
  for (const s of world.sets) {
    console.log(`  ${s.id.padEnd(20)} ${String(s.count).padStart(3)}  [${s.clock}]`)
  }
  const { ratified_not_shipped: r, shipped_not_ratified: sh } = clockDiff
  console.log(`  clock diff (builtins) · ratified-only: ${r.length ? r.join(' · ') : 'none'}`)
  console.log(`                        · shipped-only:  ${sh.length ? sh.join(' · ') : 'none'}`)
}

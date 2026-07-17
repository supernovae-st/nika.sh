/* ─── build-tools · the stdlib vocabulary → catalog + typed projection ────────
   Two stages, one convention (the errors pipeline's exact shape):

     1 · BINARY → public/tools/catalog.json — when a `nika` binary is
         reachable (PATH or NIKA_BIN), `nika catalog --tools --json` is the source of
         truth for the 27-builtin vocabulary (name · category · description ·
         args with per-arg descriptions + required). Absent binary → the
         committed catalog stands (capability-honest: CI builds never need
         the engine; regeneration is a dev-machine act).
     2 · catalog.json → src/content/tools.generated.ts — the compiled typed
         projection the /tools pages read (generated-module convention:
         canon.generated · errors.generated). Never fetched at runtime.

   Determinism: same catalog → byte-identical output (tools sorted by bare
   name, args in the binary's declared order, no build stamps). The vitest
   drift gate (tools.test.ts) recompiles and diffs, and pins the name set
   against CANON.builtinNames — the catalog can never drift from the spec.

   Run: node scripts/build-tools.mjs
   Output: public/tools/catalog.json + src/content/tools.generated.ts */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CATALOG = join(ROOT, 'public', 'tools', 'catalog.json')
const OUT = join(ROOT, 'src', 'content', 'tools.generated.ts')

/* ── stage 1 · binary → catalog (dev machines only) ──
   --from-catalog skips the binary probe entirely — the drift gate
   (tools.test.ts) uses it so the byte-diff is hermetic: catalog → ts,
   no engine-version noise. */
const bin = process.env.NIKA_BIN || 'nika'
let fromBinary
if (!process.argv.includes('--from-catalog')) {
  // New door first (`catalog --tools` · the 0.100 Rams fold), retired
  // `tools` as the older-binary fallback — mirrors the extension's ladder.
  for (const args of [['catalog', '--tools', '--json'], ['tools', '--json']]) {
    try {
      fromBinary = JSON.parse(
        execFileSync(bin, args, { encoding: 'utf8', timeout: 15000 }),
      )
      break
    } catch {
      fromBinary = undefined // try the next door — else the committed catalog stands
    }
  }
}

if (fromBinary && Array.isArray(fromBinary.tools)) {
  const tools = fromBinary.tools
    .map((t) => {
      const props = t.parameters?.properties ?? {}
      const required = new Set(t.required ?? t.parameters?.required ?? [])
      return {
        name: String(t.name),
        bare: String(t.name).replace(/^nika:/, ''),
        category: String(t.category),
        description: String(t.description ?? ''),
        args: (t.args ?? Object.keys(props)).map((a) => ({
          name: String(a),
          required: required.has(a),
          type: typeof props[a]?.type === 'string' ? props[a].type : undefined,
          desc: typeof props[a]?.description === 'string' ? props[a].description : '',
        })),
      }
    })
    .sort((a, b) => (a.bare < b.bare ? -1 : a.bare > b.bare ? 1 : 0))
  /* the two-clocks union (the register law): the page's vocabulary is the
     CANON set exactly — a ratified builtin the binary does not ship yet
     (decide, the 28th) keeps its row, carried from the previous committed
     catalog (its contract is spec-derived) and FLAGGED ratified_only so
     nothing downstream mistakes it for shipped. The old catalog carried
     such rows unflagged and the clocks agreed by lying. */
  const canonNames = new Set(
    /builtinNames: \[([^\]]+)\]/.exec(readFileSync(join(ROOT, 'src/canon.generated.ts'), 'utf8'))?.[1]
      .match(/"([a-z_]+)"/g)
      ?.map((m) => m.slice(1, -1)) ?? [],
  )
  const shippedBares = new Set(tools.map((t) => t.bare))
  const previous = existsSync(CATALOG) ? JSON.parse(readFileSync(CATALOG, 'utf8')) : { tools: [] }
  for (const name of canonNames) {
    if (shippedBares.has(name)) continue
    const carried = previous.tools.find((t) => t.bare === name)
    if (!carried) {
      console.error(`canon builtin '${name}' is neither shipped nor in the previous catalog — the register cannot invent a contract`)
      process.exit(1)
    }
    tools.push({ ...carried, ratified_only: true })
  }
  tools.sort((a, b) => (a.bare < b.bare ? -1 : a.bare > b.bare ? 1 : 0))
  const version = execFileSync(bin, ['--version'], { encoding: 'utf8', timeout: 5000 })
    .trim()
    .replace(/^nika\s+/, '')
  writeFileSync(CATALOG, `${JSON.stringify({ version, tools }, null, 2)}\n`)
  const flagged = tools.filter((t) => t.ratified_only).length
  console.log(`wrote public/tools/catalog.json (${tools.length} tools · ${flagged} ratified-only · engine ${version})`)
} else {
  console.log('no nika binary reachable — the committed catalog stands')
}

/* ── stage 2 · catalog → typed projection (always) ── */
if (!existsSync(CATALOG)) {
  console.error('public/tools/catalog.json missing and no binary to derive it — aborting')
  process.exit(1)
}
const catalog = JSON.parse(readFileSync(CATALOG, 'utf8'))

const ts = `// tools.generated.ts — AUTO-GENERATED by scripts/build-tools.mjs
// from public/tools/catalog.json (itself derived from the engine's own
// \`nika catalog --tools --json\` vocabulary). DO NOT EDIT · regenerate:
//   node scripts/build-tools.mjs
// Drift gate: src/test/tools.test.ts recompiles and byte-diffs, and pins
// the name set against CANON.builtinNames.

export interface ToolArgEntry {
  /** The arg key as the schema declares it. */
  name: string
  /** Required by the tool's contract (\`nika check\` teaches a miss). */
  required: boolean
  /** JSON-schema type when the schema declares one. */
  type?: string
  /** The binary's own one-line description. */
  desc: string
}

export interface ToolEntry {
  /** Full tool ref (\`nika:fetch\`). */
  name: string
  /** Bare name (\`fetch\`) — the /tools/:name slug. */
  bare: string
  /** Category (\`core\` · \`file\` · \`data\` · \`network\` · \`introspection\` · \`media\`). */
  category: string
  /** The binary's own description — the teaching voice. */
  description: string
  /** Declared args, schema order. */
  args: ToolArgEntry[]
  /** Canon-ratified but not in the shipped binary yet (the register carries
      the spec-derived contract · the clocks disagree on purpose). */
  ratified_only?: boolean
}

/** Every builtin, sorted by bare name. Engine version at generation: ${JSON.stringify(String(catalog.version ?? ''))}. */
export const TOOLS: ToolEntry[] = ${JSON.stringify(catalog.tools, null, 2)}

/** bare name → entry (the /tools/:name lookup). */
export const TOOL_INDEX: Record<string, ToolEntry> = Object.fromEntries(
  TOOLS.map((t) => [t.bare, t]),
)

/** The category order the register renders (the engine's own families). */
export const TOOL_CATEGORIES = ['core', 'file', 'data', 'network', 'introspection', 'media']
`
writeFileSync(OUT, ts)
console.log(`wrote src/content/tools.generated.ts (${catalog.tools.length} tools)`)

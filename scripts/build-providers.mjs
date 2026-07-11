/* ─── build-providers · the provider vocabulary → catalog + typed projection ──
   Two stages, one convention (the tools pipeline's exact shape):

     1 · BINARY → public/providers/catalog.json — when a `nika` binary is
         reachable (PATH or NIKA_BIN), `nika catalog --json` is the source
         for the SPEC-NAMED providers (the 16 of canon.yaml · ADR-104): the
         binary's embedded catalog carries a longer openai-compatible tail —
         those stay a COUNT here (embedded_extra), never rows, so the page
         and the sitewide CANON figures tell one story. Absent binary → the
         committed catalog stands (capability-honest).
     2 · catalog.json → src/content/providers.generated.ts — the compiled
         typed projection the /providers pages read.

   Presentation order IS the operator law (supernovae-alignment Rule 3 ·
   canon.yaml lock 2026-06-12): local/open-weight first, then cloud in the
   canon order (mistral leads · anthropic/openai never first), then the test
   harness. The order is read from src/canon.generated.ts (the site's spec
   projection) — never hand-typed here.

   Determinism: same catalog → byte-identical output. The vitest drift gate
   (providers.test.ts) recompiles hermetically (--from-catalog), byte-diffs,
   and pins the id set against CANON.providerIds{Local,Cloud,Test}.

   Run: node scripts/build-providers.mjs
   Output: public/providers/catalog.json + src/content/providers.generated.ts */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CATALOG = join(ROOT, 'public', 'providers', 'catalog.json')
const OUT = join(ROOT, 'src', 'content', 'providers.generated.ts')

/* the spec-named order, extracted from the canon projection (JSON-pure lines) */
const canonSrc = readFileSync(join(ROOT, 'src/canon.generated.ts'), 'utf8')
const idsOf = (key) => JSON.parse(canonSrc.match(new RegExp(`${key}: (\\[[^\\]]*\\])`))[1])
const LOCAL = idsOf('providerIdsLocal')
const CLOUD = idsOf('providerIdsCloud')
const TEST = idsOf('providerIdsTest')
const ORDER = [...LOCAL, ...CLOUD, ...TEST]

/* ── stage 1 · binary → catalog (dev machines only) ── */
const bin = process.env.NIKA_BIN || 'nika'
let fromBinary
if (!process.argv.includes('--from-catalog')) {
  try {
    fromBinary = JSON.parse(
      execFileSync(bin, ['catalog', '--json'], { encoding: 'utf8', timeout: 15000 }),
    )
  } catch {
    fromBinary = undefined // no binary here — the committed catalog stands
  }
}

if (fromBinary && Array.isArray(fromBinary.providers)) {
  const byId = new Map(fromBinary.providers.map((p) => [p.id, p]))
  const missing = ORDER.filter((id) => !byId.has(id))
  if (missing.length > 0) {
    console.error(`binary catalog is missing spec-named providers: ${missing.join(', ')}`)
    process.exit(1)
  }
  const providers = ORDER.map((id) => {
    const p = byId.get(id)
    return {
      id: p.id,
      name: String(p.name),
      kind: TEST.includes(id) ? 'test' : p.local ? 'local' : 'cloud',
      description: String(p.description ?? ''),
      env_var: p.env_var ? String(p.env_var) : undefined,
      requires_key: Boolean(p.requires_key),
      api_dialect: String(p.api_dialect ?? ''),
      default_model: p.default_model ? String(p.default_model) : undefined,
      cheap_model: p.cheap_model ? String(p.cheap_model) : undefined,
      aliases: (p.aliases ?? []).map(String),
      tags: (p.tags ?? []).map(String).sort(),
      models: (p.models ?? []).map((m) => ({
        id: String(m.id),
        model: String(m.model),
        context_window_tokens:
          typeof m.context_window_tokens === 'number' ? m.context_window_tokens : undefined,
        max_output_tokens:
          typeof m.max_output_tokens === 'number' ? m.max_output_tokens : undefined,
        capabilities: {
          reasoning: Boolean(m.capabilities?.reasoning),
          vision: Boolean(m.capabilities?.vision),
          json_mode: m.capabilities?.json_mode ? String(m.capabilities.json_mode) : undefined,
        },
      })),
    }
  })
  const version = execFileSync(bin, ['--version'], { encoding: 'utf8', timeout: 5000 })
    .trim()
    .replace(/^nika\s+/, '')
  const embedded_extra = fromBinary.providers.length - providers.length
  writeFileSync(
    CATALOG,
    `${JSON.stringify({ version, embedded_extra, providers }, null, 2)}\n`,
  )
  console.log(
    `wrote public/providers/catalog.json (${providers.length} spec-named · +${embedded_extra} embedded tail · engine ${version})`,
  )
} else {
  console.log('no nika binary reachable — the committed catalog stands')
}

/* ── stage 2 · catalog → typed projection (always) ── */
if (!existsSync(CATALOG)) {
  console.error('public/providers/catalog.json missing and no binary to derive it — aborting')
  process.exit(1)
}
const catalog = JSON.parse(readFileSync(CATALOG, 'utf8'))

const ts = `// providers.generated.ts — AUTO-GENERATED by scripts/build-providers.mjs
// from public/providers/catalog.json (itself derived from the engine's own
// \`nika catalog --json\`, filtered to the spec-named set and ordered by the
// operator presentation law: local first · mistral leads the cloud).
// DO NOT EDIT · regenerate: node scripts/build-providers.mjs
// Drift gate: src/test/providers.test.ts recompiles and byte-diffs, and
// pins the id set against CANON.providerIds{Local,Cloud,Test}.

export interface ProviderModelEntry {
  /** Short alias the workflow writes (\`model: sonnet\`). */
  id: string
  /** The pinned upstream model id. */
  model: string
  context_window_tokens?: number
  max_output_tokens?: number
  capabilities: { reasoning: boolean; vision: boolean; json_mode?: string }
}

export interface ProviderEntry {
  /** Provider id — the \`provider:\` value in a workflow. */
  id: string
  name: string
  /** local (sovereign path) · cloud (bring your own key) · test (the harness). */
  kind: 'local' | 'cloud' | 'test'
  /** The binary's own description — the teaching voice. */
  description: string
  /** The env var the key rides in (cloud) — never a config file. */
  env_var?: string
  requires_key: boolean
  /** Wire dialect the adapter speaks. */
  api_dialect: string
  default_model?: string
  cheap_model?: string
  aliases: string[]
  tags: string[]
  models: ProviderModelEntry[]
}

/** The spec-named providers, presentation-law order. Engine at generation: ${JSON.stringify(String(catalog.version ?? ''))}. */
export const PROVIDERS: ProviderEntry[] = ${JSON.stringify(catalog.providers, null, 2)}

/** id → entry (the /providers/:id lookup). */
export const PROVIDER_INDEX: Record<string, ProviderEntry> = Object.fromEntries(
  PROVIDERS.map((p) => [p.id, p]),
)

/** Beyond the named set, the engine embeds this many more OpenAI-compatible
 * endpoints (ask the binary: \`nika catalog\`). */
export const EMBEDDED_EXTRA = ${JSON.stringify(catalog.embedded_extra ?? 0)}
`
writeFileSync(OUT, ts)
console.log(`wrote src/content/providers.generated.ts (${catalog.providers.length} providers)`)

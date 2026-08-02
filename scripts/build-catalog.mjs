#!/usr/bin/env node
// build-catalog.mjs — the /catalog world's projection (engine-release clock).
//
// Inputs: the pinned-copy surfaces scripts/engine-resync.mjs vendored at the
// engine pin (public/engine/**) — the catalogue these pages show IS the
// catalogue of the downloadable binary (D1), joined the same way the graph
// compiler joins it (exact matches only · the engine resolves patterns, the
// site never guesses). Deterministic: codepoint sorts · zero timestamps ·
// same pin, same bytes.
//
//   node scripts/build-catalog.mjs           # write both modules
//   node scripts/build-catalog.mjs --check   # re-render + byte-compare · exit 5 on drift
//
// Outputs:
//   src/content/catalog.generated.ts        the page data (models · pricing ·
//                                           energy · mcp · embeddings ·
//                                           capabilities · clients)
//   src/content/catalog-paths.generated.ts  the slug lists site.config PATHS
//                                           derives room routes from

import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseToml } from 'smol-toml'
import { parse as parseYaml } from 'yaml'
import { byCp, slugRegistry } from './graph/lib.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(join(ROOT, p), 'utf8')

const pin = JSON.parse(read('.github/nika-engine-pin.json'))
const wire = parseToml(read('public/engine/catalog/llm-providers.toml'))
const pricing = parseToml(read('public/engine/catalog/model-pricing.toml'))
const mcp = parseToml(read('public/engine/catalog/mcp-servers.toml'))
const caps = parseToml(read('public/engine/catalog/model-capabilities.toml'))
const emb = parseToml(read('public/engine/catalog/embeddings.toml'))
const clientsDoc = parseYaml(read('public/engine/clients.registry.yaml'))

// the slug law is SHARED with the graph compiler (scripts/graph/lib.mjs
// slugRegistry) — one implementation, urls can never diverge.

// ── models: the union of wire models, joined with exact pricing/energy ──────
const modelMap = new Map()
for (const p of wire.providers) {
  for (const m of p.models ?? []) {
    if (!modelMap.has(m.model)) modelMap.set(m.model, { id: m.model, served_by: [] })
    modelMap.get(m.model).served_by.push({
      provider: p.id,
      provider_name: p.name,
      alias: m.id,
      context_window_tokens: m.context_window_tokens ?? null,
      max_output_tokens: m.max_output_tokens ?? null,
    })
  }
}
const providerServes = new Map(wire.providers.map((p) => [p.id, new Set((p.models ?? []).map((m) => m.model))]))
for (const r of pricing.rules) {
  const m = modelMap.get(r.model_pattern)
  if (!m || !providerServes.get(r.provider)?.has(r.model_pattern)) continue
  const row = {
    provider: r.provider,
    input_per_million: r.input_per_million ?? null,
    output_per_million: r.output_per_million ?? null,
    cache_read_per_million: r.cache_read_per_million ?? null,
    cache_write_per_million: r.cache_write_per_million ?? null,
    context_window_tokens: r.context_window_tokens ?? null,
    max_output_tokens: r.max_output_tokens ?? null,
    open_weights: r.open_weights ?? null,
  }
  ;(m.pricing ??= []).push(row)
  if (r.energy) (m.energy ??= []).push({ provider: r.provider, ...r.energy })
}
const modelSlug = slugRegistry()
const MODELS = [...modelMap.values()]
  .sort((a, b) => byCp(a.id, b.id))
  .map((m) => ({
    ...m,
    slug: modelSlug(m.id),
    served_by: m.served_by.sort((a, b) => byCp(a.provider, b.provider)),
    pricing: (m.pricing ?? []).sort((a, b) => byCp(a.provider, b.provider)),
    energy: (m.energy ?? []).sort((a, b) => byCp(a.provider, b.provider)),
  }))

// ── the market providers (the 38 · the released binary's catalog facet) ─────
const MARKET_PROVIDERS = wire.providers
  .map((p) => ({
    id: p.id,
    name: p.name,
    requires_key: p.requires_key ?? false,
    api_dialect: p.api_dialect ?? null,
    tags: p.tags ?? [],
    data_policy: p.data_policy ?? null,
    models: (p.models ?? []).map((m) => ({ alias: m.id, model: m.model })),
  }))
  .sort((a, b) => byCp(a.id, b.id))

// ── pricing table (all 633 rules · the engine resolves patterns) ────────────
const PRICING_RULES = pricing.rules.map((r) => ({
  provider: r.provider,
  model_pattern: r.model_pattern,
  input_per_million: r.input_per_million ?? null,
  output_per_million: r.output_per_million ?? null,
  cache_read_per_million: r.cache_read_per_million ?? null,
  context_window_tokens: r.context_window_tokens ?? null,
  open_weights: r.open_weights ?? null,
}))
const PRICING_META = { source: pricing.meta?.source ?? null, as_of: pricing.meta?.as_of ?? null }

// ── energy rows (verbatim provenance — the ml.energy/arXiv line ships) ──────
const ENERGY_ROWS = pricing.rules
  .filter((r) => r.energy)
  .map((r) => ({ provider: r.provider, model_pattern: r.model_pattern, ...r.energy }))
  .sort((a, b) => byCp(a.model_pattern, b.model_pattern) || byCp(a.provider, b.provider))

// ── MCP servers (105) ───────────────────────────────────────────────────────
const mcpSlug = slugRegistry()
const MCP_SERVERS = mcp.servers
  .map((s) => ({
    id: s.id,
    title: s.title ?? s.id,
    description: s.description ?? null,
    category: s.category ?? null,
    pricing: s.pricing ?? null,
    tags: s.tags ?? [],
    packages: (s.packages ?? []).map((p) => ({ registry: p.registry_type ?? p.registry ?? null, identifier: p.identifier ?? p.name ?? null })),
    remotes: (s.remotes ?? []).length,
    env_vars: (s.env_vars ?? []).map((e) => e.name).filter(Boolean),
  }))
  .sort((a, b) => byCp(a.id, b.id))
  .map((s) => ({ ...s, slug: mcpSlug(s.id) }))

// ── embeddings (13) · capability rules (49) ─────────────────────────────────
const EMBEDDINGS = emb.embeddings
  .map((e) => ({
    id: e.id,
    provider: e.provider ?? null,
    dimensions: e.dimensions,
    max_input_tokens: e.max_input_tokens,
    similarity: e.similarity ?? null,
    input_per_million: e.input_per_million ?? null,
    tags: e.tags ?? [],
  }))
  .sort((a, b) => byCp(a.id, b.id))

const CAPABILITY_RULES = caps.rules.map((r, i) => ({
  name: r.name ?? `rule-${i + 1}`,
  match_kind: r.match?.kind ?? null,
  providers: r.scope?.providers ?? [],
  api_dialect: r.scope?.api_dialect ?? null,
}))

// ── the 31 client doors (kit-native SSOT · statuses honest) ─────────────────
const CLIENTS = clientsDoc.clients
  .map((c) => ({
    id: c.id,
    name: c.name,
    class: c.class,
    status: c.status,
    install: c.install ?? null,
    wire: c.wire ?? null,
    components: Object.fromEntries(Object.entries(c.components ?? {}).sort((a, b) => byCp(a[0], b[0]))),
    gaps: Object.keys(c.gaps ?? {}).sort(byCp),
    class_gap: c.class_gap ?? null,
  }))
  .sort((a, b) => byCp(a.id, b.id))

const provenance = `${pin.repository}@${pin.engine_commit.slice(0, 12)} (${pin.release_tag})`
const header = (what) =>
  `// AUTO-GENERATED by scripts/build-catalog.mjs — ${what}\n` +
  `// from public/engine/** at the engine pin · ${provenance} · DO NOT EDIT\n` +
  `// Drift gate: node scripts/build-catalog.mjs --check (exit 5) — pnpm check\n\n`

const j = (v) => JSON.stringify(v, null, 1)

const dataModule =
  header('the /catalog world data (engine-release clock)') +
  `export const CATALOG_ENGINE = ${j({ release_tag: pin.release_tag, commit: pin.engine_commit, provenance })}\n\n` +
  `export interface CatalogModelServe { provider: string; provider_name: string; alias: string; context_window_tokens: number | null; max_output_tokens: number | null }\n` +
  `export interface CatalogModelPrice { provider: string; input_per_million: number | null; output_per_million: number | null; cache_read_per_million: number | null; cache_write_per_million: number | null; context_window_tokens: number | null; max_output_tokens: number | null; open_weights: boolean | null }\n` +
  `export interface CatalogModelEnergy { provider: string; wh_per_mtok_out?: number; provenance?: string; scope?: string; source?: string; measured_at?: string }\n` +
  `export interface CatalogModel { id: string; slug: string; served_by: CatalogModelServe[]; pricing: CatalogModelPrice[]; energy: CatalogModelEnergy[] }\n` +
  `export const MODELS: CatalogModel[] = ${j(MODELS)}\n\n` +
  `export const MARKET_PROVIDERS = ${j(MARKET_PROVIDERS)} as const\n\n` +
  `export const PRICING_META = ${j(PRICING_META)}\n` +
  `export interface PricingRule { provider: string; model_pattern: string; input_per_million: number | null; output_per_million: number | null; cache_read_per_million: number | null; context_window_tokens: number | null; open_weights: boolean | null }\n` +
  `export const PRICING_RULES: PricingRule[] = ${j(PRICING_RULES)}\n\n` +
  `export interface EnergyRow { provider: string; model_pattern: string; wh_per_mtok_out?: number; provenance?: string; scope?: string; source?: string; measured_at?: string }\n` +
  `export const ENERGY_ROWS: EnergyRow[] = ${j(ENERGY_ROWS)}\n\n` +
  `export interface McpServerEntry { id: string; slug: string; title: string; description: string | null; category: string | null; pricing: string | null; tags: string[]; packages: { registry: string | null; identifier: string | null }[]; remotes: number; env_vars: string[] }\n` +
  `export const MCP_SERVERS: McpServerEntry[] = ${j(MCP_SERVERS)}\n\n` +
  `export const EMBEDDINGS = ${j(EMBEDDINGS)} as const\n\n` +
  `export const CAPABILITY_RULES = ${j(CAPABILITY_RULES)} as const\n\n` +
  `export interface ClientDoor { id: string; name: string; class: string; status: string; install: string | null; wire: string | null; components: Record<string, string>; gaps: string[]; class_gap: string | null }\n` +
  `export const CLIENTS: ClientDoor[] = ${j(CLIENTS)}\n`

const pathsModule =
  header('the CHROME-LEAN half (register-diet law): slugs the prerender derives routes from, ids for the map, counts + the pin identity for hubs and nav — tiny by construction, eager-importable anywhere. The heavy data lives in catalog.generated.ts, reached ONLY through src/lib/catalog-access.ts (the async chunk + byte island).') +
  `export const MODEL_SLUGS: string[] = ${j(MODELS.map((m) => m.slug))}\n\n` +
  `export const MCP_SLUGS: string[] = ${j(MCP_SERVERS.map((s) => s.slug))}\n\n` +
  /* every vendor the binary can reach gets a room · the SPEC names 17 of
     them and the catalog names 38, and the other 21 used to land on « not a
     spec-named provider » with 39 model seats pointing at that page */
  `export const MARKET_PROVIDER_IDS: string[] = ${j(MARKET_PROVIDERS.map((p) => p.id))}\n\n` +
  `export const MODEL_IDS: string[] = ${j(MODELS.map((m) => m.id))}\n\n` +
  `export const MCP_IDS: string[] = ${j(MCP_SERVERS.map((s) => s.id))}\n\n` +
  `export const CATALOG_ENGINE = ${j({ release_tag: pin.release_tag, commit: pin.engine_commit, provenance })}\n\n` +
  `export const CATALOG_COUNTS = ${j({
    models: MODELS.length,
    market_providers: MARKET_PROVIDERS.length,
    pricing_rules: PRICING_RULES.length,
    energy_rows: ENERGY_ROWS.length,
    mcp_servers: MCP_SERVERS.length,
    embeddings: EMBEDDINGS.length,
    capability_rules: CAPABILITY_RULES.length,
    clients: CLIENTS.length,
    clients_proven: CLIENTS.filter((c) => c.status === 'proven').length,
  })}\n`

const OUT = [
  ['src/content/catalog.generated.ts', dataModule],
  ['src/content/catalog-paths.generated.ts', pathsModule],
]

const mode = process.argv[2] ?? '--write'
if (mode === '--check') {
  const bad = OUT.filter(([p, body]) => {
    try {
      return read(p) !== body
    } catch {
      return true
    }
  }).map(([p]) => p)
  if (bad.length) {
    console.error(`✗ catalog projection drift: ${bad.join(', ')} — run node scripts/build-catalog.mjs`)
    process.exit(5)
  }
  console.log(`✓ catalog projection in sync with the engine pin (${pin.release_tag})`)
} else {
  for (const [p, body] of OUT) writeFileSync(join(ROOT, p), body)
  console.log(
    `✓ catalog projection · ${MODELS.length} models · ${PRICING_RULES.length} pricing rules · ${ENERGY_ROWS.length} energy · ${MCP_SERVERS.length} mcp · ${EMBEDDINGS.length} embeddings · ${CAPABILITY_RULES.length} capability rules · ${CLIENTS.length} clients (${provenance})`,
  )
}

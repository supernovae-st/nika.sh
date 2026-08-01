// extractors/catalog.mjs — the engine@release market families (D1): market
// providers · models · MCP servers · pricing rules · energy rows ·
// capability rules · embeddings. Inputs are the pinned-copy TOMLs vendored
// by scripts/engine-resync.mjs (digest-receipted against the engine pin) —
// the catalogue the graph shows IS the catalogue of the downloadable binary.
//
// Join honesty (the ModelAxis law — the axis is the fact the data actually
// holds): pricing/energy edges exist ONLY on exact model_pattern matches to
// a model the same provider serves; pattern rules stay table-only, and
// capability rules emit ZERO per-model edges (their resolution is
// first-match-wins in file order — that semantics belongs to the engine,
// the graph does not re-implement it).

import { byCp, edge, node, readTomlFile } from '../lib.mjs'

export function extract({ engineRef }) {
  const nodes = []
  const edges = []

  const prov = (file) => `${engineRef} · public/engine/catalog/${file}`

  // ── market providers + wire models ───────────────────────────────────────
  const wire = readTomlFile('public/engine/catalog/llm-providers.toml')
  const modelSet = new Map() // model string → Set(provider ids that serve it)
  for (const p of wire.providers) {
    const data = {
      name: p.name,
      requires_key: p.requires_key ?? false,
      api_dialect: p.api_dialect ?? null,
      tags: p.tags ?? [],
    }
    if (p.data_policy) data.data_policy = p.data_policy
    nodes.push(
      node({
        id: `provider-market/${p.id}`,
        family: 'provider-market',
        title: p.name,
        data,
        evidence: `llm-providers.toml [[providers]] ${p.id} (env_var · dialect · tags · data_policy read verbatim)`,
        provenance: prov('llm-providers.toml'),
      }),
    )
    for (const m of p.models ?? []) {
      if (!modelSet.has(m.model)) modelSet.set(m.model, new Set())
      modelSet.get(m.model).add(p.id)
      edges.push(
        edge({
          from: `provider-market/${p.id}`,
          rel: 'serves',
          to: `model/${m.model}`,
          data: {
            alias: m.id,
            context_window_tokens: m.context_window_tokens ?? null,
            max_output_tokens: m.max_output_tokens ?? null,
          },
          evidence: `llm-providers.toml [[providers.models]] (${p.id} · ${m.id} → ${m.model})`,
          provenance: prov('llm-providers.toml'),
        }),
      )
    }
  }
  for (const [model, servedBy] of [...modelSet.entries()].sort((a, b) => byCp(a[0], b[0]))) {
    nodes.push(
      node({
        id: `model/${model}`,
        family: 'model',
        title: model,
        data: { served_by: [...servedBy].sort() },
        evidence: `derived set: the union of wire models (llm-providers.toml [[providers.models]])`,
        provenance: prov('llm-providers.toml'),
      }),
    )
  }

  // ── pricing rules (+ inline energy rows) ─────────────────────────────────
  const pricing = readTomlFile('public/engine/catalog/model-pricing.toml')
  const meta = pricing.meta ?? {}
  const seen = new Map()
  let ruleIndex = 0
  for (const r of pricing.rules) {
    ruleIndex += 1
    let id = `pricing-rule/${r.provider}/${r.model_pattern}`
    const n = (seen.get(id) ?? 0) + 1
    seen.set(id, n)
    if (n > 1) id = `${id}~${n}`
    const data = {}
    for (const k of [
      'provider',
      'model_pattern',
      'input_per_million',
      'output_per_million',
      'cache_read_per_million',
      'cache_write_per_million',
      'context_window_tokens',
      'max_output_tokens',
      'open_weights',
    ])
      if (r[k] !== undefined) data[k] = r[k]
    nodes.push(
      node({
        id,
        family: 'pricing-rule',
        title: `${r.provider} · ${r.model_pattern}`,
        data,
        evidence: `model-pricing.toml [[rules]] #${ruleIndex} (${r.provider} · ${r.model_pattern})`,
        provenance: prov('model-pricing.toml'),
      }),
    )
    const exactServed = modelSet.get(r.model_pattern)?.has(r.provider) ?? false
    if (exactServed) {
      edges.push(
        edge({
          from: `model/${r.model_pattern}`,
          rel: 'priced-by',
          to: id,
          evidence: `exact model_pattern match to a model ${r.provider} serves (model-pricing.toml #${ruleIndex}) — pattern rules stay table-only`,
          provenance: prov('model-pricing.toml'),
        }),
      )
    }
    if (r.energy) {
      const eid = `energy-row/${r.provider}/${r.model_pattern}`
      nodes.push(
        node({
          id: eid,
          family: 'energy-row',
          title: `${r.provider} · ${r.model_pattern}`,
          data: { ...r.energy },
          evidence: `model-pricing.toml [[rules]] #${ruleIndex} energy block — provenance carried verbatim (${r.energy.source ?? 'source in row'})`,
          provenance: prov('model-pricing.toml'),
        }),
      )
      if (exactServed) {
        edges.push(
          edge({
            from: `model/${r.model_pattern}`,
            rel: 'costs-energy',
            to: eid,
            evidence: `exact model_pattern match (model-pricing.toml #${ruleIndex})`,
            provenance: prov('model-pricing.toml'),
          }),
        )
      }
    }
  }

  // ── MCP servers ──────────────────────────────────────────────────────────
  const mcp = readTomlFile('public/engine/catalog/mcp-servers.toml')
  for (const s of mcp.servers) {
    nodes.push(
      node({
        id: `mcp-server/${s.name ?? s.id}`,
        family: 'mcp-server',
        title: s.name ?? s.id,
        data: {
          category: s.category ?? null,
          packages: (s.packages ?? []).length,
          remotes: (s.remotes ?? []).length,
          env_vars: (s.env_vars ?? []).length,
        },
        evidence: `mcp-servers.toml [[servers]] row (registry.modelcontextprotocol.io-aligned · packages/remotes/env_vars counted from the row)`,
        provenance: prov('mcp-servers.toml'),
      }),
    )
  }

  // ── capability rules (nodes only — resolution belongs to the engine) ─────
  const caps = readTomlFile('public/engine/catalog/model-capabilities.toml')
  let capIndex = 0
  for (const r of caps.rules) {
    capIndex += 1
    nodes.push(
      node({
        id: `capability-rule/${r.name ?? `rule-${capIndex}`}`,
        family: 'capability-rule',
        title: r.name ?? `rule #${capIndex}`,
        data: {
          match_kind: r.match?.kind ?? null,
          providers: r.scope?.providers ?? [],
          api_dialect: r.scope?.api_dialect ?? null,
        },
        evidence: `model-capabilities.toml [[rules]] #${capIndex} — first-match-wins in file order; per-model resolution is the engine's, never re-implemented here`,
        provenance: prov('model-capabilities.toml'),
      }),
    )
  }

  // ── embeddings ───────────────────────────────────────────────────────────
  const emb = readTomlFile('public/engine/catalog/embeddings.toml')
  for (const e of emb.embeddings) {
    nodes.push(
      node({
        id: `embedding/${e.id}`,
        family: 'embedding',
        title: e.id,
        data: {
          provider: e.provider ?? null,
          dimensions: e.dimensions,
          max_input_tokens: e.max_input_tokens,
          similarity: e.similarity ?? null,
          input_per_million: e.input_per_million ?? null,
        },
        evidence: `embeddings.toml [[embeddings]] ${e.id}`,
        provenance: prov('embeddings.toml'),
      }),
    )
    if (e.provider) {
      edges.push(
        edge({
          from: `provider-market/${e.provider}`,
          rel: 'serves',
          to: `embedding/${e.id}`,
          evidence: `embeddings.toml provider FK (${e.provider} → ${e.id}) — build.rs-enforced against llm-providers.toml`,
          provenance: prov('embeddings.toml'),
        }),
      )
    }
  }

  const lands = 'casse-wave (train 0.107 · the /catalog world · D2)'
  const energyCount = nodes.filter((n) => n.family === 'energy-row').length
  return {
    families: [
      { family: 'provider-market', count: wire.providers.length, rooms_exist: false, lands, source: 'public/engine/catalog/llm-providers.toml', clock: 'engine-release', note: 'the MARKET catalog — never conflate with the canonical set: each count names its facet' },
      { family: 'model', count: modelSet.size, rooms_exist: false, lands, source: 'public/engine/catalog/llm-providers.toml', clock: 'engine-release', note: 'derived set — the union of wire models; reach/capability facets join at the casse' },
      { family: 'mcp-server', count: mcp.servers.length, rooms_exist: false, lands, source: 'public/engine/catalog/mcp-servers.toml', clock: 'engine-release' },
      { family: 'pricing-rule', count: pricing.rules.length, rooms_exist: false, source: 'public/engine/catalog/model-pricing.toml', clock: 'engine-release', note: `rules are EDGES + one table, never pages (§I.2-4) · upstream snapshot: ${meta.source ?? 'models.dev'} as_of ${meta.as_of ?? '?'} · stale-but-true beats fresh-but-false: this is the RELEASED binary's table` },
      // energy joins the moment the released catalog carries it (the energy
      // arc landed on engine main AFTER v0.106.1 — at this pin the honest
      // count is zero, so the family does not exist yet; it lands with the
      // 0.107 train). An empty declared family would be an exit-3 hole.
      ...(energyCount > 0
        ? [{ family: 'energy-row', count: energyCount, rooms_exist: false, source: 'public/engine/catalog/model-pricing.toml', clock: 'engine-release', note: 'provenance (ml.energy · arXiv · measured_at) carried verbatim from the TOML rows' }]
        : []),
      { family: 'capability-rule', count: caps.rules.length, rooms_exist: false, source: 'public/engine/catalog/model-capabilities.toml', clock: 'engine-release' },
      { family: 'embedding', count: emb.embeddings.length, rooms_exist: false, lands, source: 'public/engine/catalog/embeddings.toml', clock: 'engine-release' },
    ],
    nodes,
    edges,
    inputs: [
      { path: '.github/nika-engine-pin.json' },
      { path: 'public/engine/catalog/llm-providers.toml' },
      { path: 'public/engine/catalog/mcp-servers.toml' },
      { path: 'public/engine/catalog/model-pricing.toml' },
      { path: 'public/engine/catalog/model-capabilities.toml' },
      { path: 'public/engine/catalog/embeddings.toml' },
    ],
  }
}

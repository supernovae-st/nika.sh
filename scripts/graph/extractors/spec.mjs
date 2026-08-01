// extractors/spec.mjs — the spec-clock families: errors · tools · canonical
// providers. Inputs are the pinned-resync catalogs already gated in-tree
// (class `generated`, chain-derived from the spec pin / the released binary)
// — the compiler never re-derives upstream truth, it JOINS what the lanes
// already proved.

import { node, readJson } from '../lib.mjs'

export function extract({ census, specRef, engineRef }) {
  const nodes = []
  const edges = []

  // ── errors (spec canon at the resync pin) ────────────────────────────────
  const errors = readJson('public/errors/catalog.json')
  const errProv = `${specRef} · public/errors/catalog.json (catalog v${errors.version})`
  for (const c of errors.codes) {
    const url = `/errors/${c.code}`
    nodes.push(
      node({
        id: `error/${c.code}`,
        family: 'error',
        title: c.code,
        url,
        served: census.has(url),
        data: { category: c.category, transient: c.transient },
        evidence: `public/errors/catalog.json codes[] row (generated from the pinned spec canon · spec/05-errors.md)`,
        provenance: errProv,
      }),
    )
  }

  // ── tools (the released binary's own tool catalog) ───────────────────────
  const tools = readJson('public/tools/catalog.json')
  for (const t of tools.tools) {
    const candidates = [`/tools/${t.bare}`, `/tools/${t.name}`]
    const url = candidates.find((u) => census.has(u)) ?? null
    nodes.push(
      node({
        id: `tool/${t.name}`,
        family: 'tool',
        title: t.name,
        url,
        served: url !== null,
        data: { bare: t.bare, category: t.category },
        evidence: `public/tools/catalog.json tools[] row (nika ${tools.version} · the released binary's own catalog)`,
        provenance: `${engineRef} · public/tools/catalog.json`,
      }),
    )
  }

  // ── canonical providers (the 17 — the STANDARD, not the market) ──────────
  const providers = readJson('public/providers/catalog.json')
  for (const p of providers.providers) {
    const url = `/providers/${p.id}`
    nodes.push(
      node({
        id: `provider-canonical/${p.id}`,
        family: 'provider-canonical',
        title: p.name,
        url,
        served: census.has(url),
        data: { kind: p.kind, requires_key: p.requires_key, api_dialect: p.api_dialect },
        evidence: `public/providers/catalog.json providers[] row (nika ${providers.version} · the canonical set per spec stdlib/providers-v0.1)`,
        provenance: `${engineRef} · public/providers/catalog.json`,
      }),
    )
  }

  return {
    families: [
      {
        family: 'error',
        count: errors.codes.length,
        rooms_exist: true,
        source: 'public/errors/catalog.json',
        clock: 'spec-pin',
        note: 'the pin-clock truth — codes minted after the pin land at the next train (the escrow list names them)',
      },
      {
        family: 'tool',
        count: tools.tools.length,
        rooms_exist: true,
        source: 'public/tools/catalog.json',
        clock: 'engine-release',
      },
      {
        family: 'provider-canonical',
        count: providers.providers.length,
        rooms_exist: true,
        source: 'public/providers/catalog.json',
        clock: 'engine-release',
        note: 'the STANDARD set (17) — never conflate with the market catalog (38): each count names its facet',
      },
    ],
    nodes,
    edges,
    inputs: [
      { path: 'public/errors/catalog.json' },
      { path: 'public/tools/catalog.json' },
      { path: 'public/providers/catalog.json' },
    ],
  }
}

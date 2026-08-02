// catalog.test.ts — the /catalog world's judge (engine-release clock).
//
// Three laws: (1) the projection is byte-stable against its generator
// (--check spawned, exit 0); (2) every count the pages render DERIVES —
// the module's arrays re-count against the vendored TOML/YAML bytes
// independently; (3) every room the world claims is a prerendered route
// (slugs unique · PATHS carries each one), so the map and the graph can
// never claim an unserved door.
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { CATALOG_PATHS, PATHS } from '../../site.config'
import { PROVIDERS } from '../content/providers.generated'
import {
  CAPABILITY_RULES,
  CATALOG_ENGINE,
  CLIENTS,
  EMBEDDINGS,
  ENERGY_ROWS,
  MARKET_PROVIDERS,
  MCP_SERVERS,
  MODELS,
  PRICING_RULES,
} from '../content/catalog.generated'

const ROOT = join(__dirname, '../..')
const raw = (p: string) => readFileSync(join(ROOT, p), 'utf8')

describe('catalog · the projection derives and every room is served', () => {
  it('is exactly what the generator emits today (byte-stable · exit 5 on drift)', () => {
    const r = spawnSync(process.execPath, [join(ROOT, 'scripts/build-catalog.mjs'), '--check'], {
      encoding: 'utf8',
    })
    expect(r.status, `build-catalog --check said:\n${r.stdout}\n${r.stderr}`).toBe(0)
  })

  it('speaks the pinned release (the module and the pin agree)', () => {
    const pin = JSON.parse(raw('.github/nika-engine-pin.json'))
    expect(CATALOG_ENGINE.release_tag).toBe(pin.release_tag)
    expect(CATALOG_ENGINE.commit).toBe(pin.engine_commit)
  })

  it('every count derives — recounted independently from the vendored bytes', () => {
    const providers = (raw('public/engine/catalog/llm-providers.toml').match(/^\[\[providers\]\]/gm) ?? []).length
    const wireModels = (raw('public/engine/catalog/llm-providers.toml').match(/^\[\[providers\.models\]\]/gm) ?? []).length
    const rules = (raw('public/engine/catalog/model-pricing.toml').match(/^\[\[rules\]\]/gm) ?? []).length
    const energy = (raw('public/engine/catalog/model-pricing.toml').match(/^energy = /gm) ?? []).length
    const servers = (raw('public/engine/catalog/mcp-servers.toml').match(/^\[\[servers\]\]/gm) ?? []).length
    const embeddings = (raw('public/engine/catalog/embeddings.toml').match(/^\[\[embeddings\]\]/gm) ?? []).length
    const caps = (raw('public/engine/catalog/model-capabilities.toml').match(/^\[\[rules\]\]/gm) ?? []).length
    const clients = (parseYaml(raw('public/engine/clients.registry.yaml')) as { clients: unknown[] }).clients.length

    expect(MARKET_PROVIDERS.length).toBe(providers)
    expect(MODELS.reduce((n, m) => n + m.served_by.length, 0)).toBe(wireModels)
    expect(PRICING_RULES.length).toBe(rules)
    expect(ENERGY_ROWS.length).toBe(energy)
    expect(MCP_SERVERS.length).toBe(servers)
    expect(EMBEDDINGS.length).toBe(embeddings)
    expect(CAPABILITY_RULES.length).toBe(caps)
    expect(CLIENTS.length).toBe(clients)
  })

  it('slugs are unique and every claimed room is a prerendered route', () => {
    const modelSlugs = MODELS.map((m) => m.slug)
    const mcpSlugs = MCP_SERVERS.map((s) => s.slug)
    expect(new Set(modelSlugs).size).toBe(modelSlugs.length)
    expect(new Set(mcpSlugs).size).toBe(mcpSlugs.length)
    const routes = new Set(PATHS)
    const missing = [
      ...modelSlugs.map((s) => `/catalog/models/${s}`),
      ...mcpSlugs.map((s) => `/catalog/mcp/${s}`),
      '/catalog',
      '/catalog/models',
      '/catalog/pricing',
      '/catalog/energy',
      '/catalog/mcp',
      '/catalog/embeddings',
      '/catalog/capabilities',
    ].filter((p) => !routes.has(p))
    expect(missing, `rooms not prerendered:\n${missing.join('\n')}`).toEqual([])
    /* 7 hubs + the model rooms + the mcp rooms + the MARKET-ONLY vendor
       rooms (2026-08-02): the 17 the spec names keep their richer rooms on
       LENS_PATHS, so only the other 21 are counted here. */
    const marketOnly = MARKET_PROVIDERS.filter(
      (m) => !PROVIDERS.some((p) => p.id === m.id),
    ).length
    expect(CATALOG_PATHS.length).toBe(7 + modelSlugs.length + mcpSlugs.length + marketOnly)
  })

  it('the doors matrix is whole — statuses in the closed vocabulary, installs on class A', () => {
    const STATUSES = new Set(['proven', 'wired', 'recon'])
    for (const c of CLIENTS) {
      expect(STATUSES.has(c.status), `${c.id}: status '${c.status}' outside the registry vocabulary`).toBe(true)
    }
    const classA = CLIENTS.filter((c) => c.class === 'A')
    expect(classA.length).toBeGreaterThan(0)
    for (const c of classA) expect(c.install, `${c.id}: class A without an install line`).toBeTruthy()
  })

  it('every catalog room is findable in the palette (⌘K knows the register)', async () => {
    // the operator's 2026-08-02 finding: 176 live rooms, zero palette entries
    // — « qwen » typed into ⌘K found nothing. This pins the teach: every
    // model and MCP-server room has a palette door, and the 7 hubs do too.
    const { PALETTE } = await import('../content/palette.generated')
    const hrefs = new Set(PALETTE.map((e) => e.href))
    const missing = [
      ...MODELS.map((m) => `/catalog/models/${m.slug}`),
      ...MCP_SERVERS.map((s) => `/catalog/mcp/${s.slug}`),
      ...CATALOG_PATHS.filter((p) => !p.split('/')[3]),
    ].filter((p) => !hrefs.has(p))
    expect(missing, `catalog rooms ⌘K cannot find:\n${missing.join('\n')}`).toEqual([])
  })

  it('register-diet holds: only catalog-access (and this judge) import the heavy module', () => {
    // the size budget regressed once (2026-08-01: +25KB gz over) because the
    // heavy catalog rode the main bundle — this pins the law structurally:
    // src/** reaches catalog.generated ONLY through the async-chunk door.
    // The needle is the MODULE BASENAME, never a relative prefix: a refuter
    // proved '../content/catalog.generated' only matched importers exactly
    // one level under src/ — './catalog.generated' from a sibling and
    // '../../content/…' from a deeper page both escaped the judge.
    const out = spawnSync(
      'grep',
      ['-rl', "catalog.generated'", join(ROOT, 'src'), '--include=*.ts', '--include=*.tsx'],
      { encoding: 'utf8' },
    )
    const offenders = out.stdout
      .split('\n')
      .filter(Boolean)
      .map((p) => p.slice(ROOT.length + 1))
      // TESTS never ship, so they may read the heavy module directly. The
      // exemption used to name ONE test file, so the next test that imported
      // it went red for no real reason (2026-08-02, the doors-cycle pair).
      // The diet is about the BUNDLE; the door is src/lib/catalog-access.
      .filter((p) => p !== 'src/lib/catalog-access.ts' && !p.startsWith('src/test/'))
    const real = offenders.filter((p) => {
      const src = readFileSync(join(ROOT, p), 'utf8')
      return src.split('\n').some((l) => {
        if (!l.includes("catalog.generated'")) return false
        // the CHROME-LEAN module is the one src/** may import eagerly
        if (l.includes("catalog-paths.generated'")) return false
        // type-only forms are erased at build: `import type {…}`,
        // `type X = (typeof )import('…')`, and the inline `import { type A }`
        // (every specifier type-prefixed — one value specifier keeps it real)
        if (/^\s*import type\b|^\s*(?:export )?type .*= (?:typeof )?import\(/.test(l)) return false
        // `typeof import(...)` ANYWHERE is a type expression, not a runtime
        // one: there is no runtime `typeof import()` in JS (runtime is
        // `await import()`), so it always erases. The named-form test above
        // only caught it at the head of a type alias, and an inline use
        // inside a generic read as an eager import (ProviderPage, 2026-08-02).
        if (/typeof import\(/.test(l)) return false
        const m = l.match(/import\s*\{([^}]*)\}/)
        if (m && m[1].split(',').every((s) => /^\s*type\s/.test(s))) return false
        return true
      })
    })
    expect(real, `eager heavy-catalog imports (use catalog-access):\n${real.join('\n')}`).toEqual([])
  })
})

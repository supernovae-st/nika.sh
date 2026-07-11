import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PROVIDERS, PROVIDER_INDEX, EMBEDDED_EXTRA } from '../content/providers.generated'
import { CANON } from '../canon.generated'
import { PROVIDER_PATHS, PATHS } from '../../site.config'

/* ── the provider-register drift gates ────────────────────────────────────────
   public/providers/catalog.json is the source (the engine's own `nika
   catalog --json`, filtered to the spec-named set); providers.generated.ts
   is the compiled projection the /providers register renders. The gate
   recompiles hermetically (--from-catalog), byte-diffs, and pins the id set
   against CANON.providerIds{Local,Cloud,Test} — site-vs-spec drift goes red,
   never silently stale. The presentation order is asserted as LAW: local
   first, mistral leads the cloud, anthropic/openai never first
   (supernovae-alignment Rule 3 · operator lock 2026-06-12). */

const ROOT = join(__dirname, '../..')

describe('/providers · the compiled projection matches the served catalog', () => {
  it('providers.generated.ts is exactly what the compiler emits today', () => {
    const committed = readFileSync(join(ROOT, 'src/content/providers.generated.ts'), 'utf8')
    execFileSync('node', [join(ROOT, 'scripts/build-providers.mjs'), '--from-catalog'])
    const fresh = readFileSync(join(ROOT, 'src/content/providers.generated.ts'), 'utf8')
    expect(fresh).toBe(committed)
  })

  it('the provider set IS the spec vocabulary (CANON ids, exactly)', () => {
    expect(PROVIDERS.length).toBe(CANON.providers)
    const ids = PROVIDERS.map((p) => p.id)
    expect(new Set(ids)).toEqual(
      new Set([...CANON.providerIdsLocal, ...CANON.providerIdsCloud, ...CANON.providerIdsTest]),
    )
    for (const p of PROVIDERS) {
      expect(PROVIDER_INDEX[p.id], p.id).toBe(p)
    }
  })

  it('presentation order is the operator law (local first · mistral leads the cloud)', () => {
    const ids = PROVIDERS.map((p) => p.id)
    expect(ids.slice(0, CANON.providersLocal)).toEqual(CANON.providerIdsLocal)
    expect(ids[CANON.providersLocal]).toBe('mistral')
    expect(ids.indexOf('anthropic')).toBeGreaterThan(ids.indexOf('mistral'))
    expect(ids.indexOf('openai')).toBeGreaterThan(ids.indexOf('mistral'))
  })

  it('kind partitions agree with the canon counts', () => {
    expect(PROVIDERS.filter((p) => p.kind === 'local').length).toBe(CANON.providersLocal)
    expect(PROVIDERS.filter((p) => p.kind === 'cloud').length).toBe(CANON.providersCloud)
    expect(PROVIDERS.filter((p) => p.kind === 'test').length).toBe(CANON.providersTest)
  })

  it('cloud providers name their env var (the key rides an env var, never a file)', () => {
    for (const p of PROVIDERS.filter((x) => x.kind === 'cloud' && x.requires_key)) {
      expect(p.env_var, p.id).toBeTruthy()
    }
  })

  it('the embedded tail is honest (a count, never invented rows)', () => {
    expect(EMBEDDED_EXTRA).toBeGreaterThanOrEqual(0)
  })

  it('/providers prerenders (PATHS carries the register page)', () => {
    expect(PATHS).toContain('/providers')
  })

  it('every provider prerenders its deep page (DO error_document beats the catchall)', () => {
    expect(new Set(PROVIDER_PATHS)).toEqual(new Set(PROVIDERS.map((p) => `/providers/${p.id}`)))
  })
})

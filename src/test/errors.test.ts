import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ERROR_CODES, ERROR_INDEX, ERROR_NAMESPACES } from '../content/errors.generated'
import { ERROR_PATHS, PATHS, PENDING_ERROR_CODES } from '../../site.config'

/* ── the error-register drift gates ───────────────────────────────────────────
   public/errors/catalog.json is the source (projected from the spec's
   canon.yaml); src/content/errors.generated.ts is the compiled projection the
   /errors register renders. The gate recompiles and byte-diffs — bumping the
   catalog without `node scripts/build-errors.mjs` goes red here, never
   silently stale to prod. The register page itself renders EVERY entry, so
   page-vs-wire drift is structurally impossible once this gate holds. */

const ROOT = join(__dirname, '../..')

describe('/errors · the compiled projection matches the served catalog', () => {
  it('errors.generated.ts is exactly what the compiler emits today', () => {
    const committed = readFileSync(join(ROOT, 'src/content/errors.generated.ts'), 'utf8')
    execFileSync('node', [join(ROOT, 'scripts/build-errors.mjs')])
    const fresh = readFileSync(join(ROOT, 'src/content/errors.generated.ts'), 'utf8')
    expect(fresh).toBe(committed)
  })

  it('every catalog code is in the module, uniquely indexed', () => {
    const catalog = JSON.parse(readFileSync(join(ROOT, 'public/errors/catalog.json'), 'utf8')) as {
      codes: { code: string }[]
    }
    expect(ERROR_CODES.length).toBe(catalog.codes.length)
    expect(Object.keys(ERROR_INDEX).length).toBe(catalog.codes.length)
    for (const c of catalog.codes) {
      expect(ERROR_INDEX[c.code], c.code).toBeDefined()
    }
  })

  it('codes match the spec grammar and namespaces derive from them', () => {
    const grammar = /^NIKA-[A-Z]{2,9}(-[A-Z][A-Z0-9_]{1,15})?-[0-9]{3}$/
    for (const e of ERROR_CODES) {
      expect(e.code, e.code).toMatch(grammar)
    }
    /* a pending code is not in the projection yet — judge its shape here or
       its prerendered room would anchor a malformed URL for a whole wave */
    for (const c of PENDING_ERROR_CODES) {
      expect(c, c).toMatch(grammar)
    }
    expect(ERROR_NAMESPACES.every((ns) => ns.startsWith('NIKA-'))).toBe(true)
  })

  it('/errors prerenders (PATHS carries the register page)', () => {
    expect(PATHS).toContain('/errors')
  })

  it('every code prerenders its deep page (the engine stamps docs_url on findings)', () => {
    /* ERROR_PATHS is DERIVED in site.config.ts (the catalog's byte-gated
       projection ∪ PENDING_ERROR_CODES) — this gate recomputes the union
       INDEPENDENTLY, straight from the served catalog bytes plus the pending
       literal, and demands exact equality, order included. A code added to
       the catalog without its static landing goes red HERE, never 404 in
       prod (the e2e-sweep catch: DO's error_document beats catchall_document,
       so un-prerendered deep links 404'd live); a code that vanished from
       BOTH sources (removed from the catalog AND from PENDING) leaves a
       stale path that fails this exact match. */
    const catalog = JSON.parse(readFileSync(join(ROOT, 'public/errors/catalog.json'), 'utf8')) as {
      codes: { code: string }[]
    }
    const expected = [
      ...new Set([
        ...catalog.codes.map((c) => `/errors/${c.code}`),
        ...PENDING_ERROR_CODES.map((c) => `/errors/${c}`),
      ]),
    ].sort()
    expect(ERROR_PATHS).toEqual(expected)
  })

  it('a pending code never duplicates a catalog code (the DELETE law)', () => {
    /* PENDING_ERROR_CODES exists for the mint→pin gap only: the day the
       resync pin lands a pending code in the catalog, its entry must be
       DELETEd — this gate goes red on the overlap, so the list can never
       accrete stale hand-typed codes (the SSOT the derivation leans on). */
    const inCatalog = new Set(ERROR_CODES.map((e) => e.code))
    for (const c of PENDING_ERROR_CODES) {
      expect(inCatalog.has(c), `${c} landed in the catalog — delete it from PENDING_ERROR_CODES`).toBe(false)
    }
  })
})

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ERROR_CODES, ERROR_INDEX, ERROR_NAMESPACES } from '../content/errors.generated'
import { PATHS } from '../../site.config'

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
    expect(ERROR_NAMESPACES.every((ns) => ns.startsWith('NIKA-'))).toBe(true)
  })

  it('/errors prerenders (PATHS carries the register page)', () => {
    expect(PATHS).toContain('/errors')
  })
})

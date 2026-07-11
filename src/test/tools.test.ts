import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { TOOLS, TOOL_INDEX, TOOL_CATEGORIES } from '../content/tools.generated'
import { CANON } from '../canon.generated'
import { TOOL_PATHS, PATHS } from '../../site.config'

/* ── the stdlib-register drift gates ──────────────────────────────────────────
   public/tools/catalog.json is the source (projected from the engine's own
   `nika tools --json`); src/content/tools.generated.ts is the compiled
   projection the /tools register renders. The gate recompiles FROM THE
   CATALOG (--from-catalog · hermetic, no engine-version noise) and
   byte-diffs — bumping the catalog without `node scripts/build-tools.mjs`
   goes red here, never silently stale to prod. The name set pins against
   CANON.builtinNames (spec canon.yaml) so site-vs-spec drift is caught even
   when the local binary and the spec disagree. */

const ROOT = join(__dirname, '../..')

describe('/tools · the compiled projection matches the served catalog', () => {
  it('tools.generated.ts is exactly what the compiler emits today', () => {
    const committed = readFileSync(join(ROOT, 'src/content/tools.generated.ts'), 'utf8')
    execFileSync('node', [join(ROOT, 'scripts/build-tools.mjs'), '--from-catalog'])
    const fresh = readFileSync(join(ROOT, 'src/content/tools.generated.ts'), 'utf8')
    expect(fresh).toBe(committed)
  })

  it('the tool set IS the spec vocabulary (CANON.builtinNames, exactly)', () => {
    expect(TOOLS.length).toBe(CANON.builtins)
    expect(new Set(TOOLS.map((t) => t.bare))).toEqual(new Set(CANON.builtinNames))
    for (const t of TOOLS) {
      expect(t.name, t.name).toBe(`nika:${t.bare}`)
      expect(TOOL_INDEX[t.bare], t.bare).toBe(t)
    }
  })

  it('every tool sits in a rendered category (the register renders ALL of them)', () => {
    for (const t of TOOLS) {
      expect(TOOL_CATEGORIES, `${t.name} category "${t.category}"`).toContain(t.category)
    }
  })

  it('args carry the teaching voice (descriptions from the binary, required flagged)', () => {
    for (const t of TOOLS) {
      for (const a of t.args) {
        expect(typeof a.desc, `${t.name}.${a.name}`).toBe('string')
        expect(typeof a.required, `${t.name}.${a.name}`).toBe('boolean')
      }
    }
  })

  it('/tools prerenders (PATHS carries the register page)', () => {
    expect(PATHS).toContain('/tools')
  })

  it('every tool prerenders its deep page (DO error_document beats the catchall)', () => {
    /* TOOL_PATHS is a literal (site.config stays import-free) — this gate is
       what keeps it honest: a tool added to the catalog without its static
       landing goes red HERE, never 404 in prod. Exact-set match: no stale
       path survives a removal either. */
    expect(new Set(TOOL_PATHS)).toEqual(new Set(TOOLS.map((t) => `/tools/${t.bare}`)))
  })
})

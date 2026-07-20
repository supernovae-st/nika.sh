import { describe, expect, it } from 'vitest'
import { TIMELINE } from '../content/timeline.generated'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/* The vendored timeline is a byte-stable projection of the spec repo's
   timeline/timeline.yaml — re-run the vendor script and diff. Skips
   when no spec checkout is reachable (CI without the sibling). */

const ROOT = join(__dirname, '..', '..')
const SPEC = [
  process.env.NIKA_SPEC_ROOT,
  join(ROOT, '..', 'spec', 'repo'),
  join(ROOT, '../../../../..', 'ventures/nika/02-engineering/repos/spec/repo'),
].find((p) => p && existsSync(join(p, 'timeline/timeline.yaml')))

describe.skipIf(!SPEC)('timeline projection', () => {
  it('is byte-stable against a re-vendor', () => {
    const committed = readFileSync(join(ROOT, 'src/content/timeline.generated.ts'), 'utf8')
    execFileSync('node', [join(ROOT, 'scripts/vendor-timeline.mjs')], {
      env: { ...process.env, NIKA_SPEC_ROOT: SPEC },
    })
    const fresh = readFileSync(join(ROOT, 'src/content/timeline.generated.ts'), 'utf8')
    expect(fresh).toBe(committed)
  })

  it('gates carry conditions, never dates', () => {
    for (const g of TIMELINE.gates) {
      expect(g.conditions.length).toBeGreaterThan(0)
      expect((g as Record<string, unknown>).date).toBeUndefined()
    }
  })
})

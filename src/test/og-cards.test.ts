import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/* ─── og-cards · every configured card is baked ──────────────────────────────
   The 404 class (caught 2026-07-22): the /timeline card CONFIG shipped
   without its bake — the meta pointed at a png that did not exist, and
   nothing went red. This gate parses the generator's own card table and
   holds every `out:` to a real file in public/. (The reference direction
   is deliberately NOT gated: hub pages build `og-${hubId}.png` in a
   template literal — a literal-grep gate would lie for exactly what it
   guards.) */

const ROOT = join(__dirname, '../..')

describe('og cards · the share images tell no 404', () => {
  it('every configured card has its baked png in public/', () => {
    const src = readFileSync(join(ROOT, 'scripts/build-og-card.mjs'), 'utf8')
    const outs = [...src.matchAll(/out: '(og[^']*\.png)'/g)].map((m) => m[1])
    expect(outs.length, 'the card table parsed empty — the generator moved?').toBeGreaterThan(10)
    const missing = outs.filter((o) => !existsSync(join(ROOT, 'public', o)))
    expect(missing, `configured but never baked: ${missing.join(', ')}`).toEqual([])
  })
})

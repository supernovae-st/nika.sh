/* ─── the family OG map · parity with the registry, cards on disk ────────────
   The 2026-08-04 incident: FAMILY_OG kept the PRE-move bare keys ('types')
   after the families moved inside their worlds ('language/types'), so every
   lookup missed and 149 rooms shipped the HOME card silently — the half-
   cascaded-rename class. This gate makes the drift loud in both directions:
     · every family in the generated registry has a card entry (a NEW family
       cannot ship home-carded), and every map key names a real family (a
       rename cannot leave a dead key behind)
     · every named card exists in public/ (a card cannot be cited that the
       baker never baked — the og-timeline 404 class) */
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { FAMILY_OG } from '../pages/family-og'
import { MEMBER_ROOM_FAMILIES } from '../content/member-rooms.generated'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pub = join(__dirname, '../../public')

describe('family OG · the register card carries its rooms', () => {
  it('key parity: the registry and the map name the same families', () => {
    const registry = Object.keys(MEMBER_ROOM_FAMILIES).sort()
    const mapped = Object.keys(FAMILY_OG).sort()
    expect(mapped).toEqual(registry)
  })

  it('every named card is a real file the baker baked', () => {
    const missing = [...new Set(Object.values(FAMILY_OG).map((o) => o.img))].filter(
      (img) => !existsSync(join(pub, `${img}.png`)),
    )
    expect(missing, `cards cited but never baked: ${missing.join(' · ')}`).toEqual([])
  })

  it('no alt text is empty or the home alt', () => {
    for (const [fam, o] of Object.entries(FAMILY_OG)) {
      expect(o.alt.length, `${fam} alt`).toBeGreaterThan(20)
      expect(o.img, `${fam} must not ride the home card`).not.toBe('og')
    }
  })
})

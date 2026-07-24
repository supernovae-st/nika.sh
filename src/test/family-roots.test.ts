import { describe, expect, it } from 'vitest'
import { MEMBER_ROOM_FAMILIES } from '../content/member-rooms.generated'
import { FAMILY_ROOT_PATHS, PATHS } from '../../site.config'

/* ── the family-roots drift gate ──────────────────────────────────────────────
   Every roomed family owns its ROOT page (the /types 404 class: rooms
   without a root are a trimmed-URL dead end). The literal list in
   site.config must mirror the generated registry exactly — a new family
   without its root goes red, never a silent 404. */

describe('/<family> · every roomed family owns its root', () => {
  it('EVERY registry family root is a served route (dedicated or generic)', () => {
    /* the invariant is « no family root 404s » — providers' root is its
       DEDICATED register page, the other thirteen ride FamilyRoot */
    for (const f of Object.keys(MEMBER_ROOM_FAMILIES)) {
      expect(PATHS, `/${f} has no served root`).toContain(`/${f}`)
    }
  })

  it('FAMILY_ROOT_PATHS is exactly the generic wing (registry minus the dedicated roots)', () => {
    const DEDICATED = new Set(['providers'])
    expect(new Set(FAMILY_ROOT_PATHS)).toEqual(
      new Set(
        Object.keys(MEMBER_ROOM_FAMILIES)
          .filter((f) => !DEDICATED.has(f))
          .map((f) => `/${f}`),
      ),
    )
  })
})

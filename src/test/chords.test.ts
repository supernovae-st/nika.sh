import { describe, expect, it } from 'vitest'
import { NAV_CHORDS, shortcutGroups } from '../lib/chords'
import { PATHS } from '../../site.config'

/* ── the chord gates (round-2A) ──────────────────────────────────────────────
   One written table: keys unique, every target a SERVED route (the palette's
   PATHS law), and the overlay renders from the same table — a chord the
   overlay teaches but the listener cannot speak is impossible by test. */

describe('chords · the one table stays lawful', () => {
  it('keys are unique', () => {
    const keys = NAV_CHORDS.map((c) => c.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('every chord target is a served route', () => {
    const routes = new Set(PATHS)
    for (const c of NAV_CHORDS) expect(routes.has(c.to), `${c.key} → ${c.to}`).toBe(true)
  })

  it('the overlay teaches exactly the table (never a second list)', () => {
    const nav = shortcutGroups().find((g) => g.id === 'navigation')!
    for (const c of NAV_CHORDS) {
      expect(nav.rows.some((r) => r.keys === `g ${c.key}` && r.does === c.label), `g ${c.key}`).toBe(true)
    }
  })

  it('every group carries rows (no dead section)', () => {
    for (const g of shortcutGroups()) expect(g.rows.length, g.id).toBeGreaterThan(0)
  })
})

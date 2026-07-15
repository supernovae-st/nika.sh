import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { BP } from '../lib/breakpoints'

/* ── the breakpoint census ratchet (WO-12 prerequisite · §4quater.10) ─────────
   ~29 distinct media-query widths accreted with zero tokens; the HUD pack
   must not add the 30th. This gate pins the EXACT inventory: a new distinct
   width goes red naming itself — remove one and the pin shrinks (edit the
   list downward, never upward; new responsive logic reads src/lib/
   breakpoints.ts and reuses a value already in the inventory). The size-
   budget bite-on-growth pattern, applied to the query surface. */

/* every width used in a (min|max)-width media condition across src (CSS
   files + inline matchMedia strings in TS/TSX) */
function census(): number[] {
  const values = new Set<number>()
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name)
      if (statSync(p).isDirectory()) {
        walk(p)
        continue
      }
      if (!/\.(css|tsx?)$/.test(name) || name.endsWith('.d.ts')) continue
      const src = readFileSync(p, 'utf8')
      for (const m of src.matchAll(/\((?:min|max)-width:\s*([0-9.]+)px\)/g)) {
        values.add(Number(m[1]))
      }
    }
  }
  walk(join(__dirname, '..'))
  return [...values].sort((a, b) => a - b)
}

/* the inventory as of 2026-07-15 (WO-12 opening state) — SHRINK ONLY */
const INVENTORY = [
  430, 480, 520, 560, 620, 639, 640, 719.98, 720, 760, 767, 768, 820, 860,
  880, 899, 900, 920, 940, 960, 980, 999, 1000, 1023, 1024, 1099, 1100,
  1120, 1280,
]

describe('breakpoints · the query surface only shrinks', () => {
  it('no media query uses a width outside the pinned inventory', () => {
    const now = census()
    const newcomers = now.filter((v) => !INVENTORY.includes(v))
    expect(newcomers, `new distinct width(s): ${newcomers.join(', ')} — reuse a BP token value`).toEqual([])
  })

  it('the pin itself stays honest (an inventory row no CSS uses anymore gets removed)', () => {
    const now = new Set(census())
    const stale = INVENTORY.filter((v) => !now.has(v))
    expect(stale, `inventory rows with zero uses left: ${stale.join(', ')} — shrink the pin`).toEqual([])
  })

  it('the three named thresholds are real values of the codebase', () => {
    const now = new Set(census())
    for (const [name, v] of Object.entries(BP)) {
      expect(now.has(v), `BP.${name} (${v}px) has no CSS witness`).toBe(true)
    }
  })
})

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { LENS_CLOCK_DIFF } from '../content/lens-meta.generated'
import { CLOCK_REGISTERS, clockDiffLine, clockDrift } from '../lib/clock-diff'

/* ── the two-clocks honesty gate ──────────────────────────────────────────────
   « the two clocks agree today » is the sentence the mother page stakes the
   site's honesty on. It is a claim about EVERY register, so it is a lie the
   moment one register goes unread. That happened twice with a hand-written
   register list — providers first (swarm-caught), then `grammar`, which sat
   in live disagreement while /map printed agreement and /sources printed the
   drift on the same build.

   These gates make the hand list unbuildable: the readers derive their keys
   from the emission, and no consumer may name registers itself. */

const ROOT = join(__dirname, '../..')
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8')

describe('two clocks · every emitted register is read', () => {
  it('CLOCK_REGISTERS is exactly the emission keys (no hand list can drift)', () => {
    expect(CLOCK_REGISTERS).toEqual(Object.keys(LENS_CLOCK_DIFF))
    expect(CLOCK_REGISTERS.length).toBeGreaterThan(0)
  })

  it('the agreement sentence appears ONLY when every register agrees', () => {
    const line = clockDiffLine()
    const agrees = clockDrift().length === 0
    expect(line.includes('the two clocks agree today')).toBe(agrees)
    /* and when they do NOT agree, every drifting register is named */
    if (!agrees) for (const r of clockDrift()) expect(line).toContain(r)
  })

  it('a drifting register names its members in the line (nothing summarised away)', () => {
    const line = clockDiffLine()
    for (const r of clockDrift()) {
      for (const m of [...LENS_CLOCK_DIFF[r].ratified_only, ...LENS_CLOCK_DIFF[r].shipped_only]) {
        expect(line, `${r} member not surfaced`).toContain(m)
      }
    }
  })

  /* the structural half: the two consumers may not re-introduce a literal
     register list. Both read the derived keys or this goes red naming them. */
  it('no consumer hand-lists the clock registers', () => {
    for (const file of ['src/pages/Map.tsx', 'src/pages/Sources.tsx']) {
      const src = read(file).replace(/\/\*[\s\S]*?\*\//g, '')
      for (const register of CLOCK_REGISTERS) {
        expect(src, `${file} hand-lists '${register}'`).not.toContain(`'${register}'`)
      }
    }
  })
})

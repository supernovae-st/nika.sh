import { describe, expect, it } from 'vitest'
import { TOOLS, TOOL_CATEGORIES } from '../../content/tools.generated'
import { aimDelta, layoutDrum, wrapDelta } from './slot-layout'

/* ── the drum's invariants · the geometry IS the editorial claim ──────────────
   27 slots (one per builtin, never an empty chamber), 6 family blades,
   33 equal positions; arcs contiguous in register order; aim math wraps
   shortest-way. All pure — the scene renders this, tests pin it. */

describe('slot-layout · the closed drum', () => {
  const layout = layoutDrum(TOOLS, TOOL_CATEGORIES)

  it('one slot per builtin, one blade per family, equal steps', () => {
    expect(layout.slots.length).toBe(TOOLS.length)
    expect(layout.dividers.length).toBe(TOOL_CATEGORIES.length)
    expect(layout.positions).toBe(TOOLS.length + TOOL_CATEGORIES.length)
    expect(layout.step * layout.positions).toBeCloseTo(Math.PI * 2, 12)
  })

  it('slots ride the register order (family buckets, alphabetical inside)', () => {
    const registerOrder = TOOL_CATEGORIES.flatMap((c) =>
      TOOLS.filter((t) => t.category === c).map((t) => t.bare),
    )
    expect(layout.slots.map((s) => s.bare)).toEqual(registerOrder)
    layout.slots.forEach((s, i) => expect(s.index).toBe(i))
  })

  it('angles are strictly increasing and gapped exactly one step at blades', () => {
    const all = [
      ...layout.slots.map((s) => ({ angle: s.angle, kind: 'slot' as const })),
      ...layout.dividers.map((d) => ({ angle: d.angle, kind: 'blade' as const })),
    ].sort((a, b) => a.angle - b.angle)
    all.forEach((p, i) => expect(p.angle).toBeCloseTo(i * layout.step, 12))
  })

  it('family arcs are contiguous spans whose counts sum to the drum', () => {
    let expectedStart = 0
    for (const arc of layout.arcs) {
      expect(arc.startAngle).toBeCloseTo(expectedStart, 12)
      expect(arc.endAngle).toBeCloseTo(expectedStart + (arc.count - 1) * layout.step, 12)
      expect(arc.midAngle).toBeCloseTo((arc.startAngle + arc.endAngle) / 2, 12)
      /* next family starts one blade past the arc's last slot */
      expectedStart = arc.endAngle + 2 * layout.step
    }
    expect(layout.arcs.reduce((n, a) => n + a.count, 0)).toBe(TOOLS.length)
    expect(layout.arcs.map((a) => a.category)).toEqual([...TOOL_CATEGORIES])
  })

  it('every slot can be found by bare name (the room aims by slug)', () => {
    for (const t of TOOLS) {
      expect(layout.slots.find((s) => s.bare === t.bare), t.bare).toBeDefined()
    }
  })
})

describe('slot-layout · shortest-way aim math', () => {
  it('wrapDelta lands in (-π, π]', () => {
    expect(wrapDelta(0)).toBe(0)
    expect(wrapDelta(Math.PI)).toBeCloseTo(Math.PI, 12)
    expect(wrapDelta(-Math.PI)).toBeCloseTo(Math.PI, 12)
    expect(wrapDelta(3 * Math.PI)).toBeCloseTo(Math.PI, 12)
    expect(wrapDelta(Math.PI * 2 + 0.25)).toBeCloseTo(0.25, 12)
    expect(wrapDelta(-0.25)).toBeCloseTo(-0.25, 12)
  })

  it('aimDelta never travels the long way round', () => {
    /* 350° → 10° is +20°, never −340° */
    const from = (350 / 180) * Math.PI
    const to = (10 / 180) * Math.PI
    expect(aimDelta(from, to)).toBeCloseTo((20 / 180) * Math.PI, 12)
    expect(Math.abs(aimDelta(0.1, 6.2))).toBeLessThanOrEqual(Math.PI)
    /* an aim of a full turn is no aim at all */
    expect(aimDelta(1.3, 1.3 + Math.PI * 2)).toBeCloseTo(0, 12)
  })
})

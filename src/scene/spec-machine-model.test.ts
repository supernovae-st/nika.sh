import { describe, expect, it } from 'vitest'
import { CANON } from '../canon.generated'
import { MACHINE_NODES, PLAN_TASKS } from './spec-machine-data'
import {
  MACHINE_R,
  POSES,
  STRATA_ORDER,
  buildSpecMachine,
  stratumIndex,
} from './spec-machine-model'
import { VERB_HEX } from '../sections/morph/plan-scene-model'

/* ─── spec-machine-model · the machine is pure, deterministic data ────────────
   78 instances (4 verbs · 4 slabs · 4 gates · 27 belt · 16 halo · 9 ports ·
   14 cells) + the wire harness, every value a pure function of the strata
   graph — no Math.random, no three import. These tests pin the build. */

/** rotate v by quaternion q (the shader's qrot, same math as the drum test) */
function qrot(q: number[], v: number[]): number[] {
  const [qx, qy, qz, qw] = q
  const cx = qy * v[2] - qz * v[1] + qw * v[0]
  const cy = qz * v[0] - qx * v[2] + qw * v[1]
  const cz = qx * v[1] - qy * v[0] + qw * v[2]
  return [
    v[0] + 2 * (qy * cz - qz * cy),
    v[1] + 2 * (qz * cx - qx * cz),
    v[2] + 2 * (qx * cy - qy * cx),
  ]
}

const hex = (h: string): [number, number, number] => [
  parseInt(h.slice(1, 3), 16) / 255,
  parseInt(h.slice(3, 5), 16) / 255,
  parseInt(h.slice(5, 7), 16) / 255,
]

describe('buildSpecMachine · the instance tables', () => {
  const m = buildSpecMachine()

  it('one instance per machine node, in node order · arrays sized', () => {
    expect(m.count).toBe(MACHINE_NODES.length)
    expect(m.nodeIds).toEqual(MACHINE_NODES.map((n) => n.id))
    expect(m.pos.length).toBe(m.count * 3)
    expect(m.quat.length).toBe(m.count * 4)
    expect(m.scale.length).toBe(m.count * 3)
    expect(m.seed.length).toBe(m.count * 2)
    expect(m.tint.length).toBe(m.count * 3)
  })

  it('deterministic · two builds are identical (no Math.random)', () => {
    const n = buildSpecMachine()
    expect(n.pos).toEqual(m.pos)
    expect(n.quat).toEqual(m.quat)
    expect(n.tint).toEqual(m.tint)
    expect(n.wirePos).toEqual(m.wirePos)
  })

  it('every quaternion unit · ring strata face radially out (the tholos law)', () => {
    const ringKinds = new Set(['gate', 'builtin', 'provider', 'errns'])
    for (let k = 0; k < m.count; k++) {
      const q = [m.quat[k * 4], m.quat[k * 4 + 1], m.quat[k * 4 + 2], m.quat[k * 4 + 3]]
      expect(Math.hypot(q[0], q[1], q[2], q[3])).toBeCloseTo(1, 4)
      if (!ringKinds.has(MACHINE_NODES[k].kind)) continue
      /* the block's +z must rotate onto the outward planar radial */
      const z = qrot(q, [0, 0, 1])
      const r = [m.pos[k * 3], 0, m.pos[k * 3 + 2]]
      const len = Math.hypot(r[0], r[2]) || 1
      const dot = (z[0] * r[0] + z[2] * r[2]) / len
      expect(dot).toBeGreaterThan(0.99)
    }
  })

  it('strata sit in their radius bands · centre → out in section order', () => {
    const BANDS: Record<string, [number, number]> = {
      verb: [0.1, 0.4],
      task: [0.4, 0.7],
      gate: [0.65, 0.95],
      builtin: [0.9, 1.15],
      extract: [1.15, 1.45],
      provider: [1.2, 1.75],
      errns: [1.7, MACHINE_R + 0.01],
    }
    for (let k = 0; k < m.count; k++) {
      const [lo, hi] = BANDS[MACHINE_NODES[k].kind]
      const r = Math.hypot(m.pos[k * 3], m.pos[k * 3 + 2])
      expect(r).toBeGreaterThanOrEqual(lo)
      expect(r).toBeLessThanOrEqual(hi)
    }
  })

  it('seeds carry the stratum index + a bounded deterministic jitter', () => {
    for (let k = 0; k < m.count; k++) {
      expect(m.seed[k * 2]).toBe(stratumIndex(MACHINE_NODES[k].stratum))
      expect(m.seed[k * 2 + 1]).toBeGreaterThanOrEqual(0)
      expect(m.seed[k * 2 + 1]).toBeLessThan(1)
    }
  })

  it('verb tint rides the tetrad + the plan slabs · everything else wire-blue', () => {
    for (let k = 0; k < m.count; k++) {
      const node = MACHINE_NODES[k]
      const t = [m.tint[k * 3], m.tint[k * 3 + 1], m.tint[k * 3 + 2]]
      if (node.verb) {
        const [r, g, b] = hex(VERB_HEX[node.verb])
        expect(t[0]).toBeCloseTo(r, 2)
        expect(t[1]).toBeCloseTo(g, 2)
        expect(t[2]).toBeCloseTo(b, 2)
      } else {
        /* the lit wire blue (#4f86ff) — the mock provider alone reads dimmer */
        expect(t[2]).toBeGreaterThan(t[0])
      }
    }
  })

  it('the wire harness · plan deps + slab→verb + belt→invoke + halo→infer + ports→fetch', () => {
    const expected =
      PLAN_TASKS.reduce((a, t) => a + t.deps.length, 0) +
      PLAN_TASKS.length +
      CANON.builtins +
      CANON.providers +
      CANON.extractModes
    expect(m.wireCount).toBe(expected)
    expect(m.wirePos.length).toBe(expected * 6)
    expect(m.wireSeed.length).toBe(expected * 2)
    for (const v of m.wirePos) {
      expect(Number.isFinite(v)).toBe(true)
      expect(Math.abs(v)).toBeLessThanOrEqual(MACHINE_R + 0.3)
    }
    for (const s of m.wireSeed) {
      expect(s).toBeGreaterThanOrEqual(0)
      expect(s).toBeLessThan(STRATA_ORDER.length)
    }
  })
})

describe('POSES · one camera preset per section, a single continuous turn', () => {
  it('covers all nine sections · yaw strictly increases with the reading', () => {
    expect(Object.keys(POSES).sort()).toEqual([...STRATA_ORDER].sort())
    let prev = -Infinity
    for (const k of STRATA_ORDER) {
      expect(POSES[k].yaw).toBeGreaterThan(prev)
      prev = POSES[k].yaw
      expect(POSES[k].dist).toBeGreaterThanOrEqual(2)
      expect(POSES[k].dist).toBeLessThanOrEqual(7)
      expect(POSES[k].focus).toBeGreaterThanOrEqual(-1)
      expect(POSES[k].focus).toBeLessThan(STRATA_ORDER.length)
    }
  })

  it('overview poses (frame · license) focus nothing · section poses focus their stratum', () => {
    expect(POSES.frame.focus).toBe(-1)
    expect(POSES.license.focus).toBe(-1)
    expect(POSES.stdlib.focus).toBe(stratumIndex('stdlib'))
    expect(POSES.providers.focus).toBe(stratumIndex('providers'))
  })
})

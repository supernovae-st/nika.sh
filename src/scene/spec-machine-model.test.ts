import { describe, expect, it } from 'vitest'
import { CANON } from '../canon.generated'
import {
  ENVELOPE_KEYS,
  MACHINE_NODES,
  PLAN_TASKS,
  type StratumKey,
} from './spec-machine-data'
import {
  BOW_X,
  MACHINE_R,
  POSES,
  STERN_X,
  STRATA_ORDER,
  buildSpecMachine,
  stratumIndex,
} from './spec-machine-model'
import { VERB_HEX } from '../sections/morph/plan-scene-model'

/* ─── spec-machine-model v2 · THE SHIP is pure, deterministic data ────────────
   Bow → stern along the spine: keel (envelope keys) · bridge (plan slabs) ·
   core (tetrad) · THE RING ⊥ spine (permits + structure) · hold (27) · array
   (9 off fetch) · engines (16) · shield skirt (14). These tests pin the axial
   layout, the orientations, the per-endpoint wire seeds and the one-exact-
   revolution pose table. */

/** rotate v by quaternion q (the shader's qrot) */
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

describe('buildSpecMachine v2 · the hull', () => {
  const m = buildSpecMachine()

  it('nodes lead, structure follows · arrays sized on the full count', () => {
    expect(m.nodeCount).toBe(MACHINE_NODES.length)
    expect(m.count).toBeGreaterThan(m.nodeCount) /* the ring + spokes exist */
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
    expect(n.wireSeed).toEqual(m.wireSeed)
  })

  it('the keel IS the envelope · 10 spine segments on the axis, bow → stern', () => {
    const keel = MACHINE_NODES.map((n, k) => ({ n, k })).filter(({ n }) => n.kind === 'key')
    expect(keel.length).toBe(ENVELOPE_KEYS.length)
    let prevX = Infinity
    for (const { n, k } of keel) {
      expect(m.pos[k * 3 + 1]).toBeCloseTo(0, 5)
      expect(m.pos[k * 3 + 2]).toBeCloseTo(0, 5)
      expect(m.pos[k * 3]).toBeLessThan(prevX) /* file order sails sternward */
      prevX = m.pos[k * 3]
      /* required keys lead the bow and read heavier */
      if (n.family === 'required') expect(m.scale[k * 3 + 1]).toBeGreaterThan(0.06)
    }
  })

  it('every quaternion unit · ring strata face radially out in the YZ plane', () => {
    const yzRadial = new Set(['verb', 'task', 'gate', 'builtin', 'extract'])
    for (let k = 0; k < m.count; k++) {
      const q = [m.quat[k * 4], m.quat[k * 4 + 1], m.quat[k * 4 + 2], m.quat[k * 4 + 3]]
      expect(Math.hypot(q[0], q[1], q[2], q[3])).toBeCloseTo(1, 4)
      const node = k < m.nodeCount ? MACHINE_NODES[k] : null
      if (!node || !yzRadial.has(node.kind)) continue
      const z = qrot(q, [0, 0, 1])
      const ry = m.pos[k * 3 + 1]
      const rz = m.pos[k * 3 + 2]
      const len = Math.hypot(ry, rz) || 1
      expect((z[1] * ry + z[2] * rz) / len).toBeGreaterThan(0.99)
      expect(Math.abs(z[0])).toBeLessThan(0.01)
    }
  })

  it('the engines thrust sternward (+z → -X) · the skirt flares off the plane', () => {
    for (let k = 0; k < m.nodeCount; k++) {
      const node = MACHINE_NODES[k]
      const q = [m.quat[k * 4], m.quat[k * 4 + 1], m.quat[k * 4 + 2], m.quat[k * 4 + 3]]
      const z = qrot(q, [0, 0, 1])
      if (node.kind === 'provider') expect(z[0]).toBeLessThan(-0.99)
      if (node.kind === 'errns') {
        expect(z[0]).toBeGreaterThan(0.3) /* the cone lean */
        expect(z[0]).toBeLessThan(0.8)
      }
    }
  })

  it('the sections sit in their spine bands, bow → stern in reading order', () => {
    const X_BAND: Record<string, [number, number]> = {
      key: [STERN_X, BOW_X],
      task: [0.85, BOW_X],
      verb: [0.55, 0.8],
      gate: [-0.01, 0.01],
      builtin: [-0.62, -0.42],
      extract: [-0.75, -0.55],
      provider: [-1.36, -1.1],
      errns: [-1.56, -1.44],
    }
    for (let k = 0; k < m.nodeCount; k++) {
      const [lo, hi] = X_BAND[MACHINE_NODES[k].kind]
      expect(m.pos[k * 3]).toBeGreaterThanOrEqual(lo)
      expect(m.pos[k * 3]).toBeLessThanOrEqual(hi)
    }
  })

  it('THE RING is the outermost radius · gates ride it at the cardinals', () => {
    for (let k = 0; k < m.count; k++) {
      const r = Math.hypot(m.pos[k * 3 + 1], m.pos[k * 3 + 2])
      expect(r).toBeLessThanOrEqual(MACHINE_R + 0.01)
      const node = k < m.nodeCount ? MACHINE_NODES[k] : null
      if (node?.kind === 'gate') expect(r).toBeGreaterThan(0.85)
    }
  })

  it('seeds carry the stratum index · verb tint on tetrad + bridge slabs', () => {
    for (let k = 0; k < m.nodeCount; k++) {
      const node = MACHINE_NODES[k]
      expect(m.seed[k * 2]).toBe(stratumIndex(node.stratum))
      expect(m.seed[k * 2 + 1]).toBeGreaterThanOrEqual(0)
      expect(m.seed[k * 2 + 1]).toBeLessThan(1)
      const t = [m.tint[k * 3], m.tint[k * 3 + 1], m.tint[k * 3 + 2]]
      if (node.verb) {
        const [r, g, b] = hex(VERB_HEX[node.verb])
        expect(t[0]).toBeCloseTo(r, 2)
        expect(t[1]).toBeCloseTo(g, 2)
        expect(t[2]).toBeCloseTo(b, 2)
      } else {
        expect(t[2]).toBeGreaterThan(t[0]) /* the wire-blue family */
      }
    }
    /* the structure lights with real strata only: THE RING (permits) · the
       keel truss (frame) · the engine pylons (providers) */
    const structStrata = new Set(
      ['permits', 'frame', 'providers'].map((k) => stratumIndex(k as StratumKey)),
    )
    for (let k = m.nodeCount; k < m.count; k++) {
      expect(structStrata.has(m.seed[k * 2])).toBe(true)
    }
  })

  it('the wire harness · per-ENDPOINT stratum seeds (gradient + explode-stretch)', () => {
    const expected =
      PLAN_TASKS.reduce((a, t) => a + t.deps.length, 0) +
      PLAN_TASKS.length +
      CANON.builtins +
      CANON.providers +
      CANON.extractModes
    expect(m.wireCount).toBe(expected)
    expect(m.wirePos.length).toBe(expected * 6)
    expect(m.wireSeed.length).toBe(expected * 2)
    for (const v of m.wirePos) expect(Number.isFinite(v)).toBe(true)
    for (const s of m.wireSeed) {
      expect(s).toBeGreaterThanOrEqual(0)
      expect(s).toBeLessThan(STRATA_ORDER.length)
    }
    /* a hold wire spans stdlib → verbs (two DIFFERENT endpoint strata) */
    const pairs = Array.from({ length: m.wireCount }, (_, i) => [m.wireSeed[i * 2], m.wireSeed[i * 2 + 1]])
    expect(
      pairs.some(([a, b]) => a === stratumIndex('stdlib') && b === stratumIndex('verbs')),
    ).toBe(true)
    expect(
      pairs.some(([a, b]) => a === stratumIndex('providers') && b === stratumIndex('verbs')),
    ).toBe(true)
  })

  it('callout anchors + explode table · one per stratum, the spine anchors hold', () => {
    expect(m.anchors.length).toBe(STRATA_ORDER.length * 3)
    expect(m.explode.length).toBe(STRATA_ORDER.length)
    /* the keel and THE RING anchor the explode (0) · bow slides +X · stern -X */
    expect(m.explode[stratumIndex('frame')]).toBe(0)
    expect(m.explode[stratumIndex('permits')]).toBe(0)
    expect(m.explode[stratumIndex('plan')]).toBeGreaterThan(m.explode[stratumIndex('verbs')])
    expect(m.explode[stratumIndex('verbs')]).toBeGreaterThan(0)
    expect(m.explode[stratumIndex('providers')]).toBeLessThan(m.explode[stratumIndex('stdlib')])
    expect(m.explode[stratumIndex('errors')]).toBeLessThan(m.explode[stratumIndex('providers')])
  })
})

describe('POSES v2 · one exact revolution, the close mirrors the open', () => {
  it('covers all nine sections · yaw strictly increases · x sails the spine', () => {
    expect(Object.keys(POSES).sort()).toEqual([...STRATA_ORDER].sort())
    let prev = -Infinity
    for (const k of STRATA_ORDER) {
      expect(POSES[k].yaw).toBeGreaterThan(prev)
      prev = POSES[k].yaw
      expect(POSES[k].dist).toBeGreaterThanOrEqual(2)
      expect(POSES[k].dist).toBeLessThanOrEqual(7)
      expect(POSES[k].x).toBeGreaterThanOrEqual(STERN_X)
      expect(POSES[k].x).toBeLessThanOrEqual(BOW_X)
    }
  })

  it('license = frame + 2π · same framing, one revolution later, all lit', () => {
    expect(POSES.license.yaw).toBeCloseTo(POSES.frame.yaw + Math.PI * 2, 6)
    expect(POSES.license.pitch).toBe(POSES.frame.pitch)
    expect(POSES.license.dist).toBe(POSES.frame.dist)
    expect(POSES.license.x).toBe(POSES.frame.x)
    expect(POSES.frame.focus).toBe(-1)
    expect(POSES.license.focus).toBe(-1)
    expect(POSES.stdlib.focus).toBe(stratumIndex('stdlib'))
    expect(POSES.providers.focus).toBe(stratumIndex('providers'))
  })
})

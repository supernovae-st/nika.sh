import { describe, expect, it } from 'vitest'
import { RING_COUNT, SHELL_R, buildDrumSphere } from './drum-sphere-model'

/* ─── drum-sphere-model · the tholos shell is pure, deterministic data ────────
   16 latitude rings, blocks ∝ ring circumference (the tol.is signature),
   every center on the shell, +z of every instance pointing radially out,
   the drum-ripple phase 0 at the equator → 1 at the poles. */

/** rotate v by quaternion q (same math as the shader's qrot) */
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

describe('drum-sphere-model · the shell distribution', () => {
  const m = buildDrumSphere()

  it('16 latitude rings · total block count in the 500-700 band', () => {
    expect(m.ringCounts.length).toBe(RING_COUNT)
    expect(m.ringCounts.reduce((a, b) => a + b, 0)).toBe(m.count)
    expect(m.count).toBeGreaterThanOrEqual(500)
    expect(m.count).toBeLessThanOrEqual(700)
    expect(m.pos.length).toBe(m.count * 3)
    expect(m.quat.length).toBe(m.count * 4)
    expect(m.scale.length).toBe(m.count * 3)
    expect(m.seed.length).toBe(m.count * 2)
  })

  it('blocks per ring ∝ circumference · symmetric · widest at the equator', () => {
    for (let i = 0; i < RING_COUNT / 2; i++) {
      expect(m.ringCounts[i]).toBe(m.ringCounts[RING_COUNT - 1 - i])
    }
    for (let i = 1; i < RING_COUNT / 2; i++) {
      expect(m.ringCounts[i]).toBeGreaterThan(m.ringCounts[i - 1])
    }
  })

  it('every center on the shell · every quaternion unit · +z radial out', () => {
    for (let k = 0; k < m.count; k++) {
      const p = [m.pos[k * 3], m.pos[k * 3 + 1], m.pos[k * 3 + 2]]
      expect(Math.hypot(p[0], p[1], p[2])).toBeCloseTo(SHELL_R, 4)
      const q = [m.quat[k * 4], m.quat[k * 4 + 1], m.quat[k * 4 + 2], m.quat[k * 4 + 3]]
      expect(Math.hypot(q[0], q[1], q[2], q[3])).toBeCloseTo(1, 4)
      /* the box's +z must rotate onto the outward radial */
      const z = qrot(q, [0, 0, 1])
      expect(z[0]).toBeCloseTo(p[0] / SHELL_R, 3)
      expect(z[1]).toBeCloseTo(p[1] / SHELL_R, 3)
      expect(z[2]).toBeCloseTo(p[2] / SHELL_R, 3)
    }
  })

  it('ripple phase · struck at the equator (≈0) · washes to the poles (1)', () => {
    let k = 0
    for (let i = 0; i < RING_COUNT; i++) {
      const phase = m.seed[k * 2]
      if (i === 0 || i === RING_COUNT - 1) expect(phase).toBeCloseTo(1, 5)
      if (i === RING_COUNT / 2 - 1 || i === RING_COUNT / 2) expect(phase).toBeLessThan(0.07)
      /* jitter stays a bounded, deterministic hash */
      expect(m.seed[k * 2 + 1]).toBeGreaterThanOrEqual(0)
      expect(m.seed[k * 2 + 1]).toBeLessThan(1)
      k += m.ringCounts[i]
    }
  })

  it('deterministic · two builds are identical (no Math.random)', () => {
    const n = buildDrumSphere()
    expect(n.pos).toEqual(m.pos)
    expect(n.quat).toEqual(m.quat)
    expect(n.seed).toEqual(m.seed)
  })
})

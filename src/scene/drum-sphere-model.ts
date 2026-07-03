/* ─── drum-sphere-model · the tholos shell as pure data (wave I) ──────────────
   The manifesto hero's drum of liberation as a tholos block-sphere: 16
   latitude rings of wireframe blocks on a unit shell (the tol.is signature),
   blocks per ring ∝ ring circumference, every instance a center + orientation
   quaternion (+z radial out) + box dims + the drum-ripple phase. Pure (no
   three import) so the distribution is testable: centers on the shell, ring
   counts symmetric and widest at the equator, ripple phase 0 where the drum
   is struck (the equator) → 1 at the poles. */

export const RING_COUNT = 16
/** blocks on the widest (equator) ring — ring i gets ~K·sin(φᵢ) ≈ 650 total */
const K = 64
/** shell radius in world units — the camera frames this */
export const SHELL_R = 1

/* box dims · a ring band is π/16 ≈ 0.196 tall; blocks fill ~47% of it and
   ~66% of their arc — the GAPS between blocks are the tholos read */
const BLOCK_H = 0.084
const WIDTH_FILL = 0.72
/** radial thickness at rest — the breathing extrusion scales this in-shader */
export const BLOCK_D = 0.075

export interface DrumSphereModel {
  count: number
  /** blocks per latitude ring, pole → pole */
  ringCounts: number[]
  /** xyz center per instance (on the shell) */
  pos: Float32Array
  /** xyzw orientation per instance (+z = radial out) */
  quat: Float32Array
  /** box dims per instance (w · h · d) */
  scale: Float32Array
  /** per instance: (ripple phase 0..1 equator→pole · deterministic jitter 0..1) */
  seed: Float32Array
}

/** deterministic hash — the shell must build identically every mount */
const hash = (a: number, b: number): number => {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453
  return s - Math.floor(s)
}

/** quaternion from the orthonormal basis columns (east · north · radial) */
function quatFromBasis(
  e: readonly number[],
  n: readonly number[],
  r: readonly number[],
  out: Float32Array,
  o: number,
): void {
  const m00 = e[0]
  const m01 = n[0]
  const m02 = r[0]
  const m10 = e[1]
  const m11 = n[1]
  const m12 = r[1]
  const m20 = e[2]
  const m21 = n[2]
  const m22 = r[2]
  const tr = m00 + m11 + m22
  let x: number
  let y: number
  let z: number
  let w: number
  if (tr > 0) {
    const s = Math.sqrt(tr + 1) * 2
    w = 0.25 * s
    x = (m21 - m12) / s
    y = (m02 - m20) / s
    z = (m10 - m01) / s
  } else if (m00 > m11 && m00 > m22) {
    const s = Math.sqrt(1 + m00 - m11 - m22) * 2
    w = (m21 - m12) / s
    x = 0.25 * s
    y = (m01 + m10) / s
    z = (m02 + m20) / s
  } else if (m11 > m22) {
    const s = Math.sqrt(1 + m11 - m00 - m22) * 2
    w = (m02 - m20) / s
    x = (m01 + m10) / s
    y = 0.25 * s
    z = (m12 + m21) / s
  } else {
    const s = Math.sqrt(1 + m22 - m00 - m11) * 2
    w = (m10 - m01) / s
    x = (m02 + m20) / s
    y = (m12 + m21) / s
    z = 0.25 * s
  }
  out[o] = x
  out[o + 1] = y
  out[o + 2] = z
  out[o + 3] = w
}

export function buildDrumSphere(): DrumSphereModel {
  const ringCounts: number[] = []
  for (let i = 0; i < RING_COUNT; i++) {
    const phi = (Math.PI * (i + 0.5)) / RING_COUNT
    ringCounts.push(Math.max(4, Math.round(K * Math.sin(phi))))
  }
  const count = ringCounts.reduce((a, b) => a + b, 0)

  const pos = new Float32Array(count * 3)
  const quat = new Float32Array(count * 4)
  const scale = new Float32Array(count * 3)
  const seed = new Float32Array(count * 2)

  const mid = (RING_COUNT - 1) / 2
  let k = 0
  for (let i = 0; i < RING_COUNT; i++) {
    const phi = (Math.PI * (i + 0.5)) / RING_COUNT
    const sinP = Math.sin(phi)
    const cosP = Math.cos(phi)
    const n = ringCounts[i]
    const phase = Math.abs(i - mid) / mid
    const w = ((2 * Math.PI * SHELL_R * sinP) / n) * WIDTH_FILL
    for (let j = 0; j < n; j++) {
      /* alternate rings offset half a block — the brick-course stagger */
      const theta = (2 * Math.PI * (j + (i % 2) * 0.5)) / n
      const cosT = Math.cos(theta)
      const sinT = Math.sin(theta)
      /* radial out · ring tangent (east) · latitude tangent (north) */
      const r = [sinP * cosT, cosP, sinP * sinT]
      const e = [-sinT, 0, cosT]
      const nn = [cosP * cosT, -sinP, cosP * sinT]
      pos[k * 3] = r[0] * SHELL_R
      pos[k * 3 + 1] = r[1] * SHELL_R
      pos[k * 3 + 2] = r[2] * SHELL_R
      quatFromBasis(e, nn, r, quat, k * 4)
      scale[k * 3] = w
      scale[k * 3 + 1] = BLOCK_H
      scale[k * 3 + 2] = BLOCK_D
      seed[k * 2] = phase
      seed[k * 2 + 1] = hash(i + 1, j + 1)
      k++
    }
  }

  return { count, ringCounts, pos, quat, scale, seed }
}

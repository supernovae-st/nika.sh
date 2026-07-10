import {
  BUILTIN_GROUPS,
  MACHINE_NODES,
  PLAN_TASKS,
  SPEC_SECTIONS,
  type StratumKey,
} from './spec-machine-data'
import { VERB_HEX } from '../sections/morph/plan-scene-model'
import { CANON } from '../canon.generated'

/* ─── spec-machine-model · THE SPEC MACHINE as pure data (W1) ─────────────────
   The whole language as one machined instrument: concentric strata read
   centre → out in section order — the core tetrad (S.1 verbs), the plan ring
   (S.2 · the standup-digest slabs + their depends_on wires), the gate collar
   (S.3 · 4 cardinals), the tool belt (S.4 · 27 blocks in 5 family arcs), the
   fetch manifold (S.6 · 9 ports fanned off the fetch block), the provider
   halo (S.5 · 5 locals docked · 10 cloud distant · 1 mock dim) and the
   containment shell (S.7 · 14 arc cells). Every instance derives from the
   strata graph (spec-machine-data · CANON projections); every placement is a
   pure function — no Math.random, no three import, testable.
   The wire harness routes every stratum back to its verb: slabs → their
   verb, belt → invoke, halo → infer, ports → fetch — and every outbound run
   crosses the collar radius: the boundary is IN the geometry.
   POSES: one camera preset per /spec section — a single continuous turn
   (yaw strictly increases with the reading) so the machine revolves once as
   the contract assembles. */

export const STRATA_ORDER: StratumKey[] = SPEC_SECTIONS.map((s) => s.key)
export const stratumIndex = (k: StratumKey): number => STRATA_ORDER.indexOf(k)

/** outer shell radius — the camera frames this */
export const MACHINE_R = 1.85

/* the strata radii · centre → out (the section order made spatial) */
const R_TETRAD = 0.24
const R_PLAN = 0.55
const R_COLLAR = 0.8
const R_BELT = 1.02
const R_MANIFOLD = 1.3
const R_LOCAL = 1.32
const R_CLOUD = 1.56
const R_SHELL = MACHINE_R

/* the belt's family arcs · same grammar as the 2D schematic */
const FAMILY_GAP = (9 * Math.PI) / 180
const BELT_SLOT = (2 * Math.PI - BUILTIN_GROUPS.length * FAMILY_GAP) / CANON.builtins
/* the manifold fan · 9 ports off the fetch block */
const MANIFOLD_SPREAD = (52 * Math.PI) / 180

export interface SpecMachineModel {
  count: number
  /** xyz center per instance */
  pos: Float32Array
  /** xyzw orientation per instance (+z = planar radial out on ring strata) */
  quat: Float32Array
  /** box dims per instance (w · h · d) */
  scale: Float32Array
  /** per instance: (stratum index · deterministic jitter 0..1) */
  seed: Float32Array
  /** per instance rgb · the LIT target colour (verb hue on tetrad + slabs) */
  tint: Float32Array
  /** instance i ↔ MACHINE_NODES[i].id (raycast + tests) */
  nodeIds: string[]
  /** wire segment endpoints · xyz per vertex, 2 vertices per wire */
  wirePos: Float32Array
  /** per wire VERTEX: the owning stratum index (wires ignite with strata) */
  wireSeed: Float32Array
  wireCount: number
  /** the group yaw that brings the fetch block to the front (extract pose) */
  fetchYaw: number
}

export interface MachinePose {
  yaw: number
  pitch: number
  dist: number
  y: number
  /** the focused stratum index · -1 = overview (nothing x-rayed) */
  focus: number
}

/** deterministic hash — the machine must build identically every mount */
const hash = (a: number, b: number): number => {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453
  return s - Math.floor(s)
}

const hexRgb = (h: string): [number, number, number] => [
  parseInt(h.slice(1, 3), 16) / 255,
  parseInt(h.slice(3, 5), 16) / 255,
  parseInt(h.slice(5, 7), 16) / 255,
]
const LIT_BLUE = hexRgb('#4f86ff')
const DIM_BLUE = hexRgb('#2a4470')

/** quaternion from the orthonormal basis columns (east · north · radial) —
    the same construction the drum-sphere model uses */
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

/** planar-radial orientation at angle a (+z out · +x tangent) — n points -y
    so the basis stays right-handed (e × n = r · the drum's equator basis);
    the boxes are y-symmetric, so the flip is invisible */
function radialQuat(a: number, out: Float32Array, o: number): void {
  const r = [Math.cos(a), 0, Math.sin(a)]
  const e = [-Math.sin(a), 0, Math.cos(a)]
  const n = [0, -1, 0]
  quatFromBasis(e, n, r, out, o)
}

const IDENTITY_Q: readonly number[] = [0, 0, 0, 1]

export function buildSpecMachine(): SpecMachineModel {
  const count = MACHINE_NODES.length
  const pos = new Float32Array(count * 3)
  const quat = new Float32Array(count * 4)
  const scale = new Float32Array(count * 3)
  const seed = new Float32Array(count * 2)
  const tint = new Float32Array(count * 3)
  const nodeIds = MACHINE_NODES.map((n) => n.id)

  /* per-kind running indices (placement is per-stratum, node order is the
     data module's — the two never disagree because both iterate MACHINE_NODES) */
  const centers = new Map<string, [number, number, number]>()
  const kindIdx: Record<string, number> = {}

  /* the belt's family angles, precomputed (fetch anchors the manifold) */
  const beltAngle = new Map<string, number>()
  {
    let a = -Math.PI / 2 + FAMILY_GAP / 2
    for (const f of BUILTIN_GROUPS) {
      for (const n of f.names) {
        beltAngle.set(n, a + BELT_SLOT / 2)
        a += BELT_SLOT
      }
      a += FAMILY_GAP
    }
  }
  const fetchA = beltAngle.get('fetch') ?? Math.PI / 2

  const put = (
    k: number,
    p: [number, number, number],
    s: [number, number, number],
    t: [number, number, number],
    jitterSeed: number,
  ): void => {
    pos[k * 3] = p[0]
    pos[k * 3 + 1] = p[1]
    pos[k * 3 + 2] = p[2]
    scale[k * 3] = s[0]
    scale[k * 3 + 1] = s[1]
    scale[k * 3 + 2] = s[2]
    tint[k * 3] = t[0]
    tint[k * 3 + 1] = t[1]
    tint[k * 3 + 2] = t[2]
    seed[k * 2] = stratumIndex(MACHINE_NODES[k].stratum)
    seed[k * 2 + 1] = hash(jitterSeed + 1, k + 1)
    centers.set(MACHINE_NODES[k].id, p)
  }

  for (let k = 0; k < count; k++) {
    const node = MACHINE_NODES[k]
    const i = (kindIdx[node.kind] = (kindIdx[node.kind] ?? -1) + 1)
    switch (node.kind) {
      case 'verb': {
        /* the core tetrad · 4 blocks on flattened tetrahedron vertices */
        const a = -Math.PI / 2 + (2 * Math.PI * i) / CANON.verbs
        const y = i % 2 === 0 ? 0.09 : -0.05
        put(
          k,
          [Math.cos(a) * R_TETRAD, y, Math.sin(a) * R_TETRAD],
          [0.15, 0.11, 0.11],
          hexRgb(VERB_HEX[node.verb!]),
          11,
        )
        radialQuat(a, quat, k * 4)
        break
      }
      case 'task': {
        /* the plan ring · standup-digest slabs, verb tint riding each */
        const a = -Math.PI / 2 + (2 * Math.PI * i) / Math.max(1, PLAN_TASKS.length)
        put(
          k,
          [Math.cos(a) * R_PLAN, 0, Math.sin(a) * R_PLAN],
          [0.22, 0.13, 0.05],
          hexRgb(VERB_HEX[node.verb!]),
          23,
        )
        radialQuat(a, quat, k * 4)
        break
      }
      case 'gate': {
        /* the gate collar · 4 portal plates at the cardinals */
        const a = -Math.PI / 2 + (2 * Math.PI * i) / 4
        put(k, [Math.cos(a) * R_COLLAR, 0.02, Math.sin(a) * R_COLLAR], [0.17, 0.21, 0.03], LIT_BLUE, 37)
        radialQuat(a, quat, k * 4)
        break
      }
      case 'builtin': {
        /* the tool belt · 27 blocks in 5 family arcs (fetch reads bigger) */
        const a = beltAngle.get(node.label) ?? 0
        const fetch = node.label === 'fetch'
        put(
          k,
          [Math.cos(a) * R_BELT, 0, Math.sin(a) * R_BELT],
          fetch ? [0.1, 0.09, 0.07] : [0.07, 0.06, 0.05],
          LIT_BLUE,
          41,
        )
        radialQuat(a, quat, k * 4)
        break
      }
      case 'provider': {
        /* the halo · locals docked on the inner ring, cloud distant with a
           slight elevation stagger, the mock dim on the outer ring */
        const local = node.family === 'local'
        const nOuter = CANON.providersCloud + CANON.providersTest
        const a = local
          ? fetchA + Math.PI / CANON.providersLocal + (2 * Math.PI * i) / CANON.providersLocal
          : fetchA + Math.PI / nOuter + (2 * Math.PI * (i - CANON.providersLocal)) / nOuter
        const mock = node.family === 'test'
        const y = local ? -0.03 : (i % 2 === 0 ? 0.09 : -0.09)
        put(
          k,
          [Math.cos(a) * (local ? R_LOCAL : R_CLOUD), y, Math.sin(a) * (local ? R_LOCAL : R_CLOUD)],
          local ? [0.085, 0.075, 0.06] : mock ? [0.05, 0.045, 0.04] : [0.06, 0.055, 0.045],
          mock ? DIM_BLUE : LIT_BLUE,
          53,
        )
        radialQuat(a, quat, k * 4)
        break
      }
      case 'extract': {
        /* the fetch manifold · 9 ports fanned off the fetch block */
        const spread =
          CANON.extractModes > 1 ? (MANIFOLD_SPREAD * i) / (CANON.extractModes - 1) : 0
        const a = fetchA - MANIFOLD_SPREAD / 2 + spread
        const y = 0.05 * ((i % 3) - 1)
        put(k, [Math.cos(a) * R_MANIFOLD, y, Math.sin(a) * R_MANIFOLD], [0.036, 0.036, 0.03], LIT_BLUE, 67)
        radialQuat(a, quat, k * 4)
        break
      }
      case 'errns': {
        /* the containment shell · 14 long arc cells, tangent-oriented */
        const a = -Math.PI / 2 + (2 * Math.PI * i) / CANON.errorNamespaces
        const arc = ((2 * Math.PI * R_SHELL) / CANON.errorNamespaces) * 0.6
        put(k, [Math.cos(a) * R_SHELL, 0, Math.sin(a) * R_SHELL], [arc, 0.17, 0.028], LIT_BLUE, 79)
        radialQuat(a, quat, k * 4)
        break
      }
      default: {
        put(k, [0, 0, 0], [0.05, 0.05, 0.05], LIT_BLUE, 97)
        quat.set(IDENTITY_Q, k * 4)
      }
    }
  }

  /* ── the wire harness · every stratum routes back to its verb ─────────────── */
  const wires: { a: [number, number, number]; b: [number, number, number]; s: number }[] = []
  const c = (id: string): [number, number, number] | undefined => centers.get(id)
  const trim = (
    a: [number, number, number],
    b: [number, number, number],
    ta: number,
    tb: number,
  ): [[number, number, number], [number, number, number]] => {
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
    const len = Math.hypot(d[0], d[1], d[2]) || 1
    const u = [d[0] / len, d[1] / len, d[2] / len]
    return [
      [a[0] + u[0] * ta, a[1] + u[1] * ta, a[2] + u[2] * ta],
      [b[0] - u[0] * tb, b[1] - u[1] * tb, b[2] - u[2] * tb],
    ]
  }
  const wire = (fromId: string, toId: string, stratum: StratumKey, ta = 0.08, tb = 0.08): void => {
    const a = c(fromId)
    const b = c(toId)
    if (!a || !b) return
    const [ta3, tb3] = trim(a, b, ta, tb)
    wires.push({ a: ta3, b: tb3, s: stratumIndex(stratum) })
  }
  /* plan deps · dep → task (the DAG's own edges) */
  for (const t of PLAN_TASKS) for (const d of t.deps) wire(`task:${d}`, `task:${t.id}`, 'plan', 0.12, 0.12)
  /* each slab → its verb block (the plan binds verbs) */
  for (const t of PLAN_TASKS) wire(`task:${t.id}`, `verb:${t.verb}`, 'plan', 0.12, 0.1)
  /* the belt → invoke (every builtin is reached under invoke:) */
  for (const g of BUILTIN_GROUPS) for (const n of g.names) wire(`builtin:${n}`, 'verb:invoke', 'stdlib', 0.05, 0.1)
  /* the halo → infer (every provider serves the model verb) */
  for (const p of [...CANON.providerIdsLocal, ...CANON.providerIdsCloud, ...CANON.providerIdsTest])
    wire(`provider:${p}`, 'verb:infer', 'providers', 0.05, 0.1)
  /* the manifold → fetch (nine ports on one builtin) */
  for (const m of CANON.extractModeNames) wire(`extract:${m}`, 'builtin:fetch', 'extract', 0.03, 0.07)

  const wireCount = wires.length
  const wirePos = new Float32Array(wireCount * 6)
  const wireSeed = new Float32Array(wireCount * 2)
  wires.forEach((w, i) => {
    wirePos.set(w.a, i * 6)
    wirePos.set(w.b, i * 6 + 3)
    wireSeed[i * 2] = w.s
    wireSeed[i * 2 + 1] = w.s
  })

  /* the group yaw that brings the fetch block to the camera front — rotY(g)
     maps planar angle a → a - g, and the camera sits at +z (angle +π/2), so
     g = fetchA - π/2 centres the fetch block on the near side */
  const fetchYaw = fetchA - Math.PI / 2

  return { count, pos, quat, scale, seed, tint, nodeIds, wirePos, wireSeed, wireCount, fetchYaw }
}

/* ── POSES · one preset per section · a single continuous turn ────────────────
   yaw strictly increases in section order (the machine revolves once as the
   contract assembles); pitch/dist frame each stratum; focus x-rays the rest. */
function buildPoses(): Record<StratumKey, MachinePose> {
  const { fetchYaw } = buildSpecMachine()
  /* lift fetchYaw into the (providers, errors) yaw window by whole turns */
  let extractYaw = fetchYaw
  while (extractYaw < 4.6) extractYaw += 2 * Math.PI
  while (extractYaw >= 4.6 + 2 * Math.PI) extractYaw -= 2 * Math.PI
  const f = (k: StratumKey): number => stratumIndex(k)
  return {
    frame: { yaw: 0.6, pitch: 0.42, dist: 4.9, y: 0, focus: -1 },
    verbs: { yaw: 1.1, pitch: 0.5, dist: 3.15, y: 0.04, focus: f('verbs') },
    plan: { yaw: 1.95, pitch: 0.55, dist: 3.1, y: 0, focus: f('plan') },
    permits: { yaw: 2.7, pitch: 0.24, dist: 3.6, y: 0.05, focus: f('permits') },
    stdlib: { yaw: 3.45, pitch: 0.48, dist: 4.1, y: 0, focus: f('stdlib') },
    providers: { yaw: 4.25, pitch: 0.6, dist: 5.2, y: 0, focus: f('providers') },
    extract: { yaw: extractYaw, pitch: 0.34, dist: 3.3, y: 0, focus: f('extract') },
    errors: { yaw: extractYaw + 0.75, pitch: 0.78, dist: 5.6, y: 0, focus: f('errors') },
    license: { yaw: extractYaw + 1.4, pitch: 0.42, dist: 4.7, y: 0, focus: -1 },
  }
}
export const POSES: Record<StratumKey, MachinePose> = buildPoses()

import {
  BUILTIN_GROUPS,
  MACHINE_NODES,
  PLAN_TASKS,
  SPEC_SECTIONS,
  type StratumKey,
} from './spec-machine-data'
import { NIKA_BRAND, NIKA_VERB_HEX } from '../design-tokens.generated'
import { CANON } from '../canon.generated'

/* ─── spec-machine-model · THE SPEC MACHINE as pure data (v2 · THE SHIP) ──────
   The whole language as one vessel, read bow → stern along the spine — the
   reading IS the journey (S.0 → S.8):

     BOW  S.2 the bridge     the plan · standup-digest slabs clustered by wave,
                             depends_on wires flowing INTO the core
          S.1 the core       the verb tetrad around the spine · the reactor
          S.3 THE RING       the permits boundary ⊥ the spine — one great
                             habitat ring (the station register: ring + spokes
                             + hub), its 4 SPOKES = the 4 gates: everything
                             outbound crosses this plane
          S.4 the hold       27 builtin blocks drummed around the spine in 5
                             family arcs · the cargo racks
          S.6 the array      9 extract ports fanned off the fetch block — the
                             antenna boom on the flank
     STERN S.5 the engines   16 provider nozzles: 5 local DOCKED tight on the
                             spine (the thrust you own) · 10 cloud outboard ·
                             1 mock dim
          S.7 the shield     14 error-namespace plates flared as the stern
                             skirt — failures come back typed: the hull
     S.0  the keel           the envelope's 10 top-level keys ARE the spine
                             segments everything mounts on — it lights FIRST.

   Every node derives from the strata graph (spec-machine-data · CANON
   projections); STRUCTURE instances (ring arc segments · spokes) are craft
   geometry in the permits stratum, never counted as canon. Pure functions
   only — no Math.random, no three import, testable.
   The wire harness routes every stratum to its verb; wire SEEDS are
   per-ENDPOINT stratum, so a wire lights as a gradient between its two
   strata and STRETCHES connected under the axial explode.
   POSES: one camera preset per section — yaw strictly increases and the
   license pose lands at frame.yaw + 2π: one exact revolution, the close
   mirrors the open, now lit. */

export const STRATA_ORDER: StratumKey[] = SPEC_SECTIONS.map((s) => s.key)
export const stratumIndex = (k: StratumKey): number => STRATA_ORDER.indexOf(k)

/* ── the hull dimensions · spine along X, bow at +X ─────────────────────────── */
export const BOW_X = 1.42
export const STERN_X = -1.68
/** outermost radius (the ring) — the camera frames this */
export const MACHINE_R = 0.95

const X_BRIDGE = 1.22 /* wave-0 slabs · later waves step toward the core */
const X_CORE = 0.68
const X_RING = 0
const X_HOLD = -0.52
const X_ENGINES = -1.18
const X_SKIRT = -1.5

const R_RING = 0.92
const R_HUB = 0.1
const R_HOLD = 0.4
const R_ARRAY = 0.78
const R_LOCAL = 0.15
const R_CLOUD = 0.35
const R_SKIRT = 0.46
const SKIRT_TILT = 0.55 /* the flare · radians the plates lean off the ring plane */

/* the hold's family arcs + the array fan (same grammar as the elevation) */
const FAMILY_GAP = (16 * Math.PI) / 180
const HOLD_SLOT = (2 * Math.PI - BUILTIN_GROUPS.length * FAMILY_GAP) / CANON.builtins
const ARRAY_SPREAD = (64 * Math.PI) / 180

/* craft structure counts (geometry, NEVER spoken as canon counts) */
const RING_SEGS = 36
const SPOKE_SEGS = 5
const TRUSS_SEGS = 26

export interface SpecMachineModel {
  /** total instances · nodes first, then structure */
  count: number
  /** the pickable prefix · MACHINE_NODES.length */
  nodeCount: number
  pos: Float32Array
  quat: Float32Array
  scale: Float32Array
  /** per instance: (stratum index · deterministic jitter 0..1) */
  seed: Float32Array
  /** per instance rgb · the LIT target colour (verb hue on tetrad + slabs) */
  tint: Float32Array
  /** instance i ↔ MACHINE_NODES[i].id for i < nodeCount */
  nodeIds: string[]
  /** wire segment endpoints · xyz per vertex, 2 vertices per wire */
  wirePos: Float32Array
  /** per wire VERTEX: its OWN endpoint's stratum (gradient lit · explode) */
  wireSeed: Float32Array
  wireCount: number
  /** per-stratum representative point (callout leader-line anchors) · 9×3 */
  anchors: Float32Array
  /** per-stratum X shift at full explode (the axial exploded drawing) */
  explode: Float32Array
}

export interface MachinePose {
  yaw: number
  pitch: number
  dist: number
  y: number
  /** the spine point the camera centres (group eases to -x) */
  x: number
  /** the focused stratum index · -1 = overview (nothing x-rayed) */
  focus: number
}

/** deterministic hash — the ship must build identically every mount */
const hash = (a: number, b: number): number => {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453
  return s - Math.floor(s)
}

const hexRgb = (h: string): [number, number, number] => [
  parseInt(h.slice(1, 3), 16) / 255,
  parseInt(h.slice(3, 5), 16) / 255,
  parseInt(h.slice(5, 7), 16) / 255,
]
const LIT_BLUE = hexRgb(NIKA_BRAND.accent)
const DIM_BLUE = hexRgb('#2a4470')

/* THE HULL HUES · every station wears the hue of the verb it serves (the
   site's own 4-hue family — never an invented colour): the hold + array
   are invoke's tools (cyan) · the engines serve infer (blue) · THE RING
   bounds exec-and-everything (the boundary orange) · the shield speaks
   agent's typed failures (violet) · the keel is the struck structure. */
const HUE: Record<string, [number, number, number]> = {
  frame: hexRgb('#8db4ff'),
  permits: hexRgb(NIKA_VERB_HEX.exec),
  stdlib: hexRgb(NIKA_VERB_HEX.invoke),
  extract: hexRgb(NIKA_VERB_HEX.invoke),
  providers: hexRgb(NIKA_VERB_HEX.infer),
  errors: hexRgb(NIKA_VERB_HEX.agent),
}

/** quaternion from orthonormal basis columns (e · n · r), e×n = r */
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

/** ring orientation in the YZ plane (⊥ spine) · +z = radial out · e×n=r */
function yzRadialQuat(a: number, out: Float32Array, o: number): void {
  quatFromBasis([0, -Math.sin(a), Math.cos(a)], [1, 0, 0], [0, Math.cos(a), Math.sin(a)], out, o)
}
/** engine orientation · +z faces the STERN (-X · the thrust axis) */
function sternQuat(a: number, out: Float32Array, o: number): void {
  quatFromBasis([0, -Math.sin(a), Math.cos(a)], [0, Math.cos(a), Math.sin(a)], [-1, 0, 0], out, o)
}
/** skirt-plate orientation · radial-out leaned +X by tilt t (the cone flare) */
function coneQuat(a: number, t: number, out: Float32Array, o: number): void {
  const cA = Math.cos(a)
  const sA = Math.sin(a)
  const cT = Math.cos(t)
  const sT = Math.sin(t)
  quatFromBasis([0, -sA, cA], [cT, -sT * cA, -sT * sA], [sT, cT * cA, cT * sA], out, o)
}
const IDENTITY_Q: readonly number[] = [0, 0, 0, 1]

/* the axial explode · per-stratum X shift at uExplode=1 — the ring anchors
   (0), the keel stays (the spine everything separates along), bow strata
   slide forward, stern strata slide aft (the exploded drawing read) */
const EXPLODE_X: Record<StratumKey, number> = {
  frame: 0,
  verbs: 0.46,
  plan: 0.85,
  permits: 0,
  stdlib: -0.34,
  providers: -0.85,
  extract: -0.58,
  errors: -1.15,
  license: 0,
}

export function buildSpecMachine(): SpecMachineModel {
  const nodeCount = MACHINE_NODES.length

  /* structure instances (craft) · the ring's arc segments + the 4 spokes */
  interface Struct {
    p: [number, number, number]
    q: (out: Float32Array, o: number) => void
    s: [number, number, number]
  }
  const structs: Struct[] = []
  /* THE RING · a double rim (fore + aft) braced by cross-ties — the great
     habitat wheel (the station register: two hoops of blocks, tied) */
  const ringArc = ((2 * Math.PI * R_RING) / RING_SEGS) * 0.8
  for (const dx of [-0.07, 0.07]) {
    for (let i = 0; i < RING_SEGS; i++) {
      const a = ((2 * Math.PI) * (i + (dx > 0 ? 0.5 : 0))) / RING_SEGS
      structs.push({
        p: [X_RING + dx, Math.cos(a) * R_RING, Math.sin(a) * R_RING],
        q: (out, o) => yzRadialQuat(a, out, o),
        s: [ringArc, 0.085, 0.045],
      })
    }
  }
  /* the rim ties · one axial brace per segment, between the two hoops */
  for (let i = 0; i < RING_SEGS; i++) {
    const a = ((2 * Math.PI) * (i + 0.25)) / RING_SEGS
    structs.push({
      p: [X_RING, Math.cos(a) * (R_RING - 0.02), Math.sin(a) * (R_RING - 0.02)],
      q: (out, o) => yzRadialQuat(a, out, o),
      s: [0.03, 0.12, 0.03],
    })
  }
  /* the 4 spokes · hub → rim at the cardinals (the gates' feet) */
  for (let g = 0; g < 4; g++) {
    const a = -Math.PI / 2 + (2 * Math.PI * g) / 4
    for (let s = 0; s < SPOKE_SEGS; s++) {
      const r = R_HUB + ((R_RING - 0.09 - R_HUB) * (s + 0.5)) / SPOKE_SEGS
      structs.push({
        p: [X_RING, Math.cos(a) * r, Math.sin(a) * r],
        q: (out, o) => yzRadialQuat(a, out, o),
        s: [0.035, 0.035, (R_RING - R_HUB) / SPOKE_SEGS - 0.04],
      })
    }
  }
  /* the keel TRUSS · cross-braces marching the whole spine (the lattice
     mast every station hangs off — the frame stratum, it lights first) */
  for (let i = 0; i < TRUSS_SEGS; i++) {
    const x = BOW_X - 0.2 - ((BOW_X - 0.2 - (STERN_X + 0.3)) * (i + 0.5)) / TRUSS_SEGS
    const a = (i % 2) * (Math.PI / 2)
    structs.push({
      p: [x, 0, 0],
      q: (out, o) => yzRadialQuat(a + Math.PI / 4, out, o),
      s: [0.02, 0.11, 0.02],
    })
  }
  /* the engine pylons · 5 struts fanning the local block to the outboard bank */
  for (let g = 0; g < 5; g++) {
    const a = -Math.PI / 2 + (2 * Math.PI * g) / 5
    structs.push({
      p: [X_ENGINES + 0.06, Math.cos(a) * (R_CLOUD * 0.55), Math.sin(a) * (R_CLOUD * 0.55)],
      q: (out, o) => yzRadialQuat(a, out, o),
      s: [0.025, 0.025, R_CLOUD * 0.8],
    })
  }

  const count = nodeCount + structs.length
  const pos = new Float32Array(count * 3)
  const quat = new Float32Array(count * 4)
  const scale = new Float32Array(count * 3)
  const seed = new Float32Array(count * 2)
  const tint = new Float32Array(count * 3)
  const nodeIds = MACHINE_NODES.map((n) => n.id)

  const centers = new Map<string, [number, number, number]>()
  const kindIdx: Record<string, number> = {}

  /* the hold's family angles, precomputed (fetch anchors the array) */
  const holdAngle = new Map<string, number>()
  {
    let a = Math.PI / 2 + FAMILY_GAP / 2
    for (const f of BUILTIN_GROUPS) {
      for (const n of f.names) {
        holdAngle.set(n, a + HOLD_SLOT / 2)
        a += HOLD_SLOT
      }
      a += FAMILY_GAP
    }
  }
  const fetchA = holdAngle.get('fetch') ?? -Math.PI / 2

  const put = (
    k: number,
    stratum: StratumKey,
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
    seed[k * 2] = stratumIndex(stratum)
    seed[k * 2 + 1] = hash(jitterSeed + 1, k + 1)
  }

  const keelCount = MACHINE_NODES.filter((n) => n.kind === 'key').length
  const keelSpan = BOW_X - 0.12 - (STERN_X + 0.26)
  const keelSeg = keelSpan / Math.max(1, keelCount)

  for (let k = 0; k < nodeCount; k++) {
    const node = MACHINE_NODES[k]
    const i = (kindIdx[node.kind] = (kindIdx[node.kind] ?? -1) + 1)
    switch (node.kind) {
      case 'key': {
        /* THE KEEL · the envelope keys as spine segments, bow → stern —
           the 3 required keys lead, drawn heavier */
        const x = BOW_X - 0.12 - keelSeg * (i + 0.5)
        const req = node.family === 'required'
        put(k, 'frame', [x, 0, 0], [keelSeg * 0.74, req ? 0.075 : 0.05, req ? 0.075 : 0.05], HUE.frame, 7)
        quat.set(IDENTITY_Q, k * 4)
        centers.set(node.id, [x, 0, 0])
        break
      }
      case 'verb': {
        /* THE CORE · the tetrad around the spine at the reactor section */
        const a = -Math.PI / 2 + (2 * Math.PI * i) / CANON.verbs
        const x = X_CORE + (i % 2 === 0 ? 0.05 : -0.05)
        const p: [number, number, number] = [x, Math.cos(a) * 0.17, Math.sin(a) * 0.17]
        put(k, 'verbs', p, [0.13, 0.11, 0.11], hexRgb(NIKA_VERB_HEX[node.verb!]), 11)
        yzRadialQuat(a, quat, k * 4)
        centers.set(node.id, p)
        break
      }
      case 'task': {
        /* THE BRIDGE · slabs clustered at the bow by WAVE (wave 0 leads),
           spread around the spine — the command module cluster */
        const t = PLAN_TASKS[i]
        const wave = t?.wave ?? 0
        const inWave = PLAN_TASKS.filter((x) => x.wave === wave)
        const j = inWave.findIndex((x) => x.id === node.label)
        const n = Math.max(1, inWave.length)
        const a = wave * 0.9 + (2 * Math.PI * Math.max(0, j)) / n
        const x = X_BRIDGE - wave * 0.15
        const p: [number, number, number] = [x, Math.cos(a) * 0.15, Math.sin(a) * 0.15]
        put(k, 'plan', p, [0.15, 0.09, 0.05], hexRgb(NIKA_VERB_HEX[node.verb!]), 23)
        yzRadialQuat(a, quat, k * 4)
        centers.set(node.id, p)
        break
      }
      case 'gate': {
        /* THE RING's 4 gate stations at the cardinals — the spokes' feet */
        const a = -Math.PI / 2 + (2 * Math.PI * i) / 4
        const p: [number, number, number] = [X_RING, Math.cos(a) * R_RING, Math.sin(a) * R_RING]
        put(k, 'permits', p, [0.16, 0.2, 0.09], HUE.permits, 37)
        yzRadialQuat(a, quat, k * 4)
        centers.set(node.id, p)
        break
      }
      case 'builtin': {
        /* THE HOLD · 27 blocks drummed in 5 family arcs (fetch reads bigger) */
        const a = holdAngle.get(node.label) ?? 0
        const fetch = node.label === 'fetch'
        const p: [number, number, number] = [
          X_HOLD + (i % 2 === 0 ? 0.045 : -0.045),
          Math.cos(a) * R_HOLD,
          Math.sin(a) * R_HOLD,
        ]
        put(k, 'stdlib', p, fetch ? [0.1, 0.09, 0.08] : [0.068, 0.06, 0.052], HUE.stdlib, 41)
        yzRadialQuat(a, quat, k * 4)
        centers.set(node.id, p)
        break
      }
      case 'provider': {
        /* THE ENGINES · 5 local docked on the spine (the thrust you own) ·
           10 cloud outboard staggered · 1 mock dim on the rim */
        const local = node.family === 'local'
        const mock = node.family === 'test'
        const nOuter = CANON.providersCloud + CANON.providersTest
        const a = local
          ? -Math.PI / 2 + (2 * Math.PI * i) / CANON.providersLocal
          : -Math.PI / 2 + Math.PI / nOuter + (2 * Math.PI * (i - CANON.providersLocal)) / nOuter
        const r = local ? R_LOCAL : mock ? R_CLOUD + 0.14 : R_CLOUD
        const x = X_ENGINES - (local ? 0 : 0.08) - (i % 2 === 0 ? 0 : 0.05)
        const p: [number, number, number] = [x, Math.cos(a) * r, Math.sin(a) * r]
        put(
          k,
          'providers',
          p,
          local ? [0.085, 0.085, 0.13] : mock ? [0.05, 0.05, 0.07] : [0.062, 0.062, 0.1],
          mock ? DIM_BLUE : HUE.providers,
          53,
        )
        sternQuat(a, quat, k * 4)
        centers.set(node.id, p)
        break
      }
      case 'extract': {
        /* THE ARRAY · 9 ports fanned off the fetch flank — the antenna boom */
        const spread = CANON.extractModes > 1 ? (ARRAY_SPREAD * i) / (CANON.extractModes - 1) : 0
        const a = fetchA - ARRAY_SPREAD / 2 + spread
        const r = R_ARRAY - 0.1 * Math.abs(i - (CANON.extractModes - 1) / 2) * 0.4
        const p: [number, number, number] = [X_HOLD - 0.12 - 0.03 * (i % 3), Math.cos(a) * r, Math.sin(a) * r]
        put(k, 'extract', p, [0.036, 0.036, 0.05], HUE.extract, 67)
        yzRadialQuat(a, quat, k * 4)
        centers.set(node.id, p)
        break
      }
      case 'errns': {
        /* THE SHIELD · 14 namespace plates flared as the stern skirt */
        const a = -Math.PI / 2 + (2 * Math.PI * i) / CANON.errorNamespaces
        const arc = ((2 * Math.PI * R_SKIRT) / CANON.errorNamespaces) * 0.68
        const p: [number, number, number] = [X_SKIRT, Math.cos(a) * R_SKIRT, Math.sin(a) * R_SKIRT]
        put(k, 'errors', p, [arc, 0.2, 0.03], HUE.errors, 79)
        coneQuat(a, SKIRT_TILT, quat, k * 4)
        centers.set(node.id, p)
        break
      }
      default: {
        put(k, node.stratum, [0, 0, 0], [0.05, 0.05, 0.05], LIT_BLUE, 97)
        quat.set(IDENTITY_Q, k * 4)
      }
    }
  }

  /* the structure instances (not pickable) · ring+ties+spokes = permits ·
     the keel truss = frame · the pylons = providers */
  const ringStructs = RING_SEGS * 3 + 4 * SPOKE_SEGS
  structs.forEach((st, j) => {
    const k = nodeCount + j
    const stratum: StratumKey =
      j < ringStructs ? 'permits' : j < ringStructs + TRUSS_SEGS ? 'frame' : 'providers'
    put(k, stratum, st.p, st.s, HUE[stratum] ?? LIT_BLUE, 101)
    st.q(quat, k * 4)
  })

  /* ── the wire harness · per-ENDPOINT stratum seeds ─────────────────────────── */
  const wires: {
    a: [number, number, number]
    b: [number, number, number]
    sa: number
    sb: number
  }[] = []
  const c = (id: string): [number, number, number] | undefined => centers.get(id)
  const stratumOf = (id: string): number => {
    const n = MACHINE_NODES.find((x) => x.id === id)
    return n ? stratumIndex(n.stratum) : 0
  }
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
  const wire = (fromId: string, toId: string, ta = 0.07, tb = 0.07): void => {
    const a = c(fromId)
    const b = c(toId)
    if (!a || !b) return
    const [ta3, tb3] = trim(a, b, ta, tb)
    wires.push({ a: ta3, b: tb3, sa: stratumOf(fromId), sb: stratumOf(toId) })
  }
  /* plan deps · dep → task (the DAG's own edges, on the bridge) */
  for (const t of PLAN_TASKS) for (const d of t.deps) wire(`task:${d}`, `task:${t.id}`, 0.1, 0.1)
  /* each slab → its verb block (the plan flows INTO the core) */
  for (const t of PLAN_TASKS) wire(`task:${t.id}`, `verb:${t.verb}`, 0.1, 0.09)
  /* the hold → invoke (every builtin is reached under invoke:) */
  for (const g of BUILTIN_GROUPS) for (const n of g.names) wire(`builtin:${n}`, 'verb:invoke', 0.05, 0.09)
  /* the engines → infer (every provider serves the model verb) */
  for (const p of [...CANON.providerIdsLocal, ...CANON.providerIdsCloud, ...CANON.providerIdsTest])
    wire(`provider:${p}`, 'verb:infer', 0.06, 0.09)
  /* the array → fetch (nine ports on one builtin) */
  for (const m of CANON.extractModeNames) wire(`extract:${m}`, 'builtin:fetch', 0.03, 0.06)

  const wireCount = wires.length
  const wirePos = new Float32Array(wireCount * 6)
  const wireSeed = new Float32Array(wireCount * 2)
  wires.forEach((w, i) => {
    wirePos.set(w.a, i * 6)
    wirePos.set(w.b, i * 6 + 3)
    wireSeed[i * 2] = w.sa
    wireSeed[i * 2 + 1] = w.sb
  })

  /* per-stratum callout anchors (a top-side representative point each) */
  const anchors = new Float32Array(STRATA_ORDER.length * 3)
  const setA = (k: StratumKey, x: number, y: number, z: number) => {
    const i = stratumIndex(k) * 3
    anchors[i] = x
    anchors[i + 1] = y
    anchors[i + 2] = z
  }
  setA('frame', BOW_X - 0.3, 0.06, 0)
  setA('verbs', X_CORE, 0.22, 0)
  setA('plan', X_BRIDGE, 0.2, 0)
  setA('permits', X_RING, R_RING, 0)
  setA('stdlib', X_HOLD, R_HOLD + 0.05, 0)
  setA('providers', X_ENGINES, R_CLOUD + 0.06, 0)
  setA('extract', X_HOLD - 0.14, -R_ARRAY, 0)
  setA('errors', X_SKIRT, R_SKIRT + 0.1, 0)
  setA('license', 0, 0, 0)

  const explode = new Float32Array(STRATA_ORDER.map((k) => EXPLODE_X[k]))

  return {
    count,
    nodeCount,
    pos,
    quat,
    scale,
    seed,
    tint,
    nodeIds,
    wirePos,
    wireSeed,
    wireCount,
    anchors,
    explode,
  }
}

/* ── POSES · one preset per section · one exact revolution ────────────────────
   yaw strictly increases; the ship also travels under the camera (x eases to
   each section's spine point — the reading sails bow → stern); license.yaw =
   frame.yaw + 2π, the close mirrors the open. Landmark shots: plan ≈ bow-on
   through the ring (the docking approach) · providers = stern-on (the engine
   array face-on). */
function buildPoses(): Record<StratumKey, MachinePose> {
  const f = (k: StratumKey): number => stratumIndex(k)
  /* the beauty shot · the WHOLE vessel, bow to stern, with air for the
     callout labels (the canvas is portrait — length is the constraint) */
  const FRAME: MachinePose = { yaw: 1.12, pitch: 0.2, dist: 6.9, y: -0.02, x: -0.26, focus: -1 }
  return {
    frame: FRAME,
    /* S.1 · the reactor intimacy holds (the near fills dissolve now) —
       a touch wider + flatter so the tetrad reads against space */
    verbs: { yaw: 1.46, pitch: 0.18, dist: 2.75, y: 0.02, x: X_CORE, focus: f('verbs') },
    /* S.2 · angled off broadside, looking slightly down: the slab cluster
       clears the ring instead of hiding behind it */
    plan: { yaw: 1.95, pitch: 0.26, dist: 3.2, y: 0, x: X_BRIDGE - 0.15, focus: f('plan') },
    permits: { yaw: 2.45, pitch: 0.12, dist: 4.3, y: 0.05, x: X_RING, focus: f('permits') },
    stdlib: { yaw: 3.2, pitch: 0.34, dist: 2.9, y: 0, x: X_HOLD, focus: f('stdlib') },
    providers: { yaw: 4.05, pitch: 0.2, dist: 3.4, y: 0, x: X_ENGINES + 0.1, focus: f('providers') },
    /* S.6 · the old near-axial view flattened the fan into the face-on
       ring — quarter view from below, ship raised: the belly array centres */
    extract: { yaw: 5.05, pitch: -0.32, dist: 3.3, y: 0.3, x: X_HOLD - 0.1, focus: f('extract') },
    errors: { yaw: 5.6, pitch: 0.5, dist: 4.4, y: 0, x: X_SKIRT + 0.25, focus: f('errors') },
    license: { ...FRAME, yaw: FRAME.yaw + Math.PI * 2 },
  }
}
export const POSES: Record<StratumKey, MachinePose> = buildPoses()

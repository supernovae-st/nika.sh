import { TOOL_INDEX } from '../../content/tools.generated'
import { CHAPTERS } from '../../sections/verbs-data'
import { CANON } from '../../canon.generated'
import { NIKA_VERB_HEX, NIKA_BRAND } from '../../design-tokens.generated'

/* ─── part-model · THE PARTS CATALOG, pure data (no three import) ─────────────
   Every builtin and every verb owns a DISTINCT machine part — a component
   removed from the /spec ship and berthed on its page. One parametric
   generator, six family ARCHETYPES + four verb EMBLEMS, all in the tholos
   register (canonical statement: src/scene/drum-sphere-three.ts): the
   catalog stays coherent because every part is blocks-lines-fills in the
   same ink; every part stays distinct because its geometry is ITS OWN
   DATA — the archetype comes from the family, the ports from the REAL
   args (a tall port is a required arg — never invented), the proportions
   from a deterministic name hash. Two tools of one family read as
   siblings, never twins.

   ARCHETYPES (family → silhouette):
     core           the REGULATOR — a valve stack on a signal mast
     file           the CABINET — a drawer chest; required drawers sit OUT
     data           the PRISM BENCH — funnel → lens stack → nozzle
     network        the DISH — a mast carrying a ring array + feed horns
     introspection  the PERISCOPE — a folded sight over a gauge cluster
     media          the PROJECTOR — a lens barrel with aperture blades

   EMBLEMS (verb → machine):
     infer   the HALO — a crown ring with one spoke per spec provider
     exec    the PRESS — piston, rails, one exhaust fin per block key
     invoke  the CAROUSEL — the pin drum's echo: 6 family blades, a
             27-tooth ring (one per builtin — the closed namespace)
     agent   the GIMBAL — two budget rings (the leashes) around a core,
             satellites on the outer ring (the whitelist's shape)

   Pure functions only — no Math.random, no three import, testable. Every
   count is a catalog count; the hash jitters PROPORTIONS only, never
   quantities. Quats are single-axis about Z (roll) or identity — parts
   read head-on; the stage adds the presentation tilt. */

export interface PartModel {
  /** what the part documents (bare tool name or verb) */
  id: string
  kind: 'tool' | 'verb'
  archetype: string
  count: number
  pos: Float32Array
  quat: Float32Array
  scale: Float32Array
  /** (phase 0..1 for the rolling breath, portFlag 0|1 — ports flash on strike) */
  seed: Float32Array
  tint: Float32Array
  /** approximate world radius (the stage frames by this) */
  radius: number
}

function hexRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

const ACCENT = hexRgb(NIKA_BRAND.accent)
const BRIGHT = hexRgb(NIKA_BRAND.accentBright)
const INVOKE = hexRgb(NIKA_VERB_HEX.invoke)

/* deterministic name hash → k floats in [0,1) (the drum-sphere hash law) */
function hashSeq(name: string): (i: number) => number {
  let h = 2166136261
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (i: number) => {
    const x = Math.sin((h >>> 0) % 100000 + i * 127.1) * 43758.5453
    return x - Math.floor(x)
  }
}

interface Block {
  p: [number, number, number]
  /** roll about Z, radians (the builder's one rotation) */
  roll?: number
  s: [number, number, number]
  port?: boolean
  tint?: readonly [number, number, number]
}

function rotZ(a: number): [number, number, number, number] {
  return [0, 0, Math.sin(a / 2), Math.cos(a / 2)]
}

function pack(id: string, kind: 'tool' | 'verb', archetype: string, blocks: Block[]): PartModel {
  const count = blocks.length
  const pos = new Float32Array(count * 3)
  const quat = new Float32Array(count * 4)
  const scale = new Float32Array(count * 3)
  const seed = new Float32Array(count * 2)
  const tint = new Float32Array(count * 3)
  let radius = 0.6
  blocks.forEach((b, i) => {
    pos.set(b.p, i * 3)
    quat.set(rotZ(b.roll ?? 0), i * 4)
    scale.set(b.s, i * 3)
    /* breath phase rolls upward through the part (y-driven, the ship's
       bow→stern law in this part's own axis) */
    seed.set([(b.p[1] + 1.4) / 2.8, b.port ? 1 : 0], i * 2)
    tint.set(b.tint ?? ACCENT, i * 3)
    radius = Math.max(radius, Math.hypot(...b.p) + Math.max(...b.s) / 2)
  })
  return { id, kind, archetype, count, pos, quat, scale, seed, tint, radius }
}

/* ── the six family archetypes ── */

function regulator(args: { required: boolean }[], h: (i: number) => number): Block[] {
  const b: Block[] = []
  /* the valve stack — one body slab per arg, gaps jittered by the hash */
  let y = -0.52
  args.forEach((a, k) => {
    const w = 0.5 + 0.16 * h(k)
    const d = 0.34 + 0.1 * h(k + 7)
    const hh = a.required ? 0.17 : 0.1
    b.push({ p: [0, y + hh / 2, 0], s: [w, hh, d] })
    /* the port — required args carry the bright stub OUT the side */
    b.push({
      p: [w / 2 + (a.required ? 0.14 : 0.08), y + hh / 2, 0],
      s: a.required ? [0.2, 0.05, 0.05] : [0.1, 0.035, 0.035],
      port: true,
      tint: a.required ? BRIGHT : undefined,
    })
    y += hh + 0.05 + 0.04 * h(k + 13)
  })
  /* the signal mast + beacon */
  b.push({ p: [0, y + 0.3, 0], s: [0.045, 0.6, 0.045] })
  b.push({ p: [0, y + 0.66, 0], s: [0.12, 0.12, 0.12], port: true, tint: BRIGHT })
  /* the base */
  b.push({ p: [0, -0.62, 0], s: [0.7 + 0.1 * h(31), 0.08, 0.5], roll: 0 })
  return b.length > 2 ? b : [{ p: [0, 0, 0], s: [0.4, 0.4, 0.4] }, ...b]
}

function cabinet(args: { required: boolean }[], h: (i: number) => number): Block[] {
  const b: Block[] = []
  const n = Math.max(args.length, 1)
  const H = Math.min(0.24 * n, 1.5)
  const W = 0.9 + 0.2 * h(0)
  /* the chest shell */
  b.push({ p: [0, 0, -0.1], s: [W, H + 0.16, 0.42] })
  /* drawers — one per arg; REQUIRED drawers sit pulled OUT (the honesty
     read: what check demands is what sticks out at you) */
  args.forEach((a, k) => {
    const y = -H / 2 + (k + 0.5) * (H / n)
    const out = a.required ? 0.3 : 0.08 + 0.05 * h(k + 3)
    b.push({
      p: [0, y, 0.16 + out / 2],
      s: [W * 0.82, (H / n) * 0.62, 0.3],
      tint: a.required ? BRIGHT : undefined,
    })
    /* the handle */
    b.push({ p: [0, y, 0.16 + out + 0.17], s: [0.22, 0.035, 0.035], port: true })
  })
  /* feet */
  for (const x of [-W / 2 + 0.08, W / 2 - 0.08]) {
    b.push({ p: [x, -H / 2 - 0.14, 0], s: [0.09, 0.12, 0.4] })
  }
  return b
}

function prismBench(args: { required: boolean }[], h: (i: number) => number): Block[] {
  const b: Block[] = []
  const n = Math.max(args.length, 1)
  const L = Math.min(0.34 * n, 1.9)
  /* the optical bench rail */
  b.push({ p: [0, -0.34, 0], s: [L + 0.7, 0.07, 0.3] })
  /* the input funnel */
  b.push({ p: [-L / 2 - 0.42, 0, 0], s: [0.26, 0.5, 0.4], roll: Math.PI / 4 })
  /* the lens stack — one rotated prism per arg (45° = the diamond read) */
  args.forEach((a, k) => {
    const x = -L / 2 + (k + 0.5) * (L / n)
    const s = a.required ? 0.34 : 0.22 + 0.06 * h(k)
    b.push({
      p: [x, 0.02 + 0.06 * h(k + 5), 0],
      s: [s, s, 0.1 + 0.05 * h(k + 9)],
      roll: Math.PI / 4,
      tint: a.required ? BRIGHT : undefined,
      port: true,
    })
    /* the mount post */
    b.push({ p: [x, -0.24, 0], s: [0.04, 0.22, 0.04] })
  })
  /* the output nozzle */
  b.push({ p: [L / 2 + 0.4, 0, 0], s: [0.34, 0.14, 0.14] })
  b.push({ p: [L / 2 + 0.62, 0, 0], s: [0.08, 0.24, 0.24], roll: Math.PI / 4, port: true, tint: BRIGHT })
  return b
}

function dish(args: { required: boolean }[], h: (i: number) => number): Block[] {
  const b: Block[] = []
  /* the mast */
  b.push({ p: [0, -0.3, 0], s: [0.09, 1.1, 0.09] })
  b.push({ p: [0, -0.88, 0], s: [0.6, 0.08, 0.6], roll: Math.PI / 4 })
  /* the parabolic ring — a 10-segment block ring (craft count, structure);
     the hash leans the array so siblings aim differently */
  const R = 0.6 + 0.08 * h(1)
  const SEG = 10
  for (let i = 0; i < SEG; i++) {
    const a = (i / SEG) * Math.PI * 2
    b.push({
      p: [Math.cos(a) * R, 0.34 + Math.sin(a) * R, 0.05],
      roll: a,
      s: [0.3, 0.06, 0.06],
    })
  }
  /* the feed horns — ONE PER ARG on an inner arc, required horns long+bright */
  const n = Math.max(args.length, 1)
  args.forEach((a, k) => {
    const ang = Math.PI * 0.15 + (k / n) * Math.PI * 0.7
    const r = 0.34
    b.push({
      p: [Math.cos(ang) * r, 0.34 + Math.sin(ang) * r, 0.12],
      roll: ang,
      s: a.required ? [0.3, 0.05, 0.05] : [0.16, 0.04, 0.04],
      port: true,
      tint: a.required ? BRIGHT : undefined,
    })
  })
  /* the boresight emitter */
  b.push({ p: [0, 0.34, 0.3], s: [0.1, 0.1, 0.34], port: true, tint: BRIGHT })
  return b
}

function periscope(args: { required: boolean }[], h: (i: number) => number): Block[] {
  const b: Block[] = []
  /* the folded sight: column + two 45° mirrors + the eye */
  b.push({ p: [0, 0, 0], s: [0.16, 1.3, 0.16] })
  b.push({ p: [0, 0.72, 0.08], s: [0.22, 0.22, 0.3], roll: Math.PI / 4 })
  b.push({ p: [0.02, -0.72, -0.08], s: [0.22, 0.22, 0.3], roll: Math.PI / 4 })
  b.push({ p: [0.3, 0.72, 0.08], s: [0.3, 0.1, 0.1], port: true, tint: BRIGHT })
  /* the gauge cluster — one dial per arg, required dials larger */
  args.forEach((a, k) => {
    const x = -0.5 + (k % 3) * 0.42 + 0.04 * h(k)
    const y = -0.5 - Math.floor(k / 3) * 0.4
    const s = a.required ? 0.3 : 0.2
    b.push({
      p: [x - 0.35, y, 0.22],
      s: [s, s, 0.07],
      roll: Math.PI / 4,
      port: true,
      tint: a.required ? BRIGHT : undefined,
    })
  })
  return b
}

function projector(args: { required: boolean }[]): Block[] {
  const b: Block[] = []
  const n = Math.max(args.length, 1)
  /* the barrel — length scales with the contract */
  const L = Math.min(0.16 * n + 0.5, 1.7)
  b.push({ p: [-0.2, 0, 0], s: [L, 0.4, 0.4] })
  b.push({ p: [-0.2 - L / 2 - 0.1, 0, 0], s: [0.2, 0.55, 0.55] })
  /* aperture blades — one per arg around the lens mouth */
  const R = 0.34
  args.forEach((a, k) => {
    const ang = (k / n) * Math.PI * 2
    b.push({
      p: [L / 2 + 0.02, Math.cos(ang) * R, Math.sin(ang) * R],
      roll: ang,
      s: a.required ? [0.06, 0.3, 0.07] : [0.05, 0.18, 0.05],
      port: true,
      tint: a.required ? BRIGHT : undefined,
    })
  })
  /* the throw cone — three thinning frames */
  for (let i = 0; i < 3; i++) {
    const x = L / 2 + 0.28 + i * 0.26
    const s = 0.5 + i * 0.3
    b.push({ p: [x, 0, 0], s: [0.035, s, s], roll: Math.PI / 4 })
  }
  return b
}

/* ── the four verb emblems ── */

function emblem(verb: string): Block[] {
  const tint = hexRgb(NIKA_VERB_HEX[verb as keyof typeof NIKA_VERB_HEX])
  const b: Block[] = []
  if (verb === 'infer') {
    /* the HALO — one spoke per spec provider (the catalog's real count) */
    const R = 0.85
    const SEG = 14
    for (let i = 0; i < SEG; i++) {
      const a = (i / SEG) * Math.PI * 2
      b.push({ p: [Math.cos(a) * R, Math.sin(a) * R, 0], roll: a, s: [0.42, 0.07, 0.07], tint })
    }
    for (let i = 0; i < CANON.providers; i++) {
      const a = (i / CANON.providers) * Math.PI * 2
      b.push({
        p: [Math.cos(a) * (R - 0.3), Math.sin(a) * (R - 0.3), 0],
        roll: a + Math.PI / 2,
        s: [0.05, 0.34, 0.05],
        port: true,
        tint,
      })
    }
    b.push({ p: [0, 0, 0], s: [0.3, 0.3, 0.3], roll: Math.PI / 4, port: true, tint: BRIGHT })
  } else if (verb === 'exec') {
    /* the PRESS — piston + rails + captured output tray */
    b.push({ p: [0, 0.62, 0], s: [1.0, 0.22, 0.5], tint })
    b.push({ p: [0, 0.18, 0], s: [0.2, 0.7, 0.2], tint })
    b.push({ p: [0, -0.28, 0], s: [0.66, 0.18, 0.44], port: true, tint: BRIGHT })
    for (const x of [-0.44, 0.44]) b.push({ p: [x, 0.1, 0], s: [0.07, 1.26, 0.07], tint })
    b.push({ p: [0, -0.66, 0], s: [1.2, 0.09, 0.6], tint })
    /* exhaust fins — one per block key of the exec contract (5) */
    for (let k = 0; k < 5; k++) {
      b.push({ p: [0.66, -0.5 + k * 0.16, 0], roll: Math.PI / 5, s: [0.26, 0.05, 0.3], port: true, tint })
    }
  } else if (verb === 'invoke') {
    /* the CAROUSEL — the pin drum's echo: a 27-tooth ring (one per builtin)
       + the six family blades */
    const R = 0.8
    for (let i = 0; i < CANON.builtins; i++) {
      const a = (i / CANON.builtins) * Math.PI * 2
      b.push({
        p: [Math.cos(a) * R, Math.sin(a) * R, 0],
        roll: a + Math.PI / 2,
        s: [0.06, 0.2, 0.06],
        port: true,
        tint: INVOKE,
      })
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      b.push({ p: [Math.cos(a) * 0.42, Math.sin(a) * 0.42, 0], roll: a, s: [0.5, 0.05, 0.09], tint })
    }
    b.push({ p: [0, 0, 0], s: [0.26, 0.26, 0.26], roll: Math.PI / 4, port: true, tint: BRIGHT })
  } else {
    /* the GIMBAL — two budget rings (the agent's leashes) + satellites */
    for (const [R, n, s] of [
      [0.85, 12, 0.34],
      [0.55, 8, 0.26],
    ] as const) {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2
        b.push({ p: [Math.cos(a) * R, Math.sin(a) * R, 0], roll: a, s: [s, 0.06, 0.06], tint })
      }
    }
    /* satellites — the whitelist's shape (4 grants, the template's own) */
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4
      b.push({
        p: [Math.cos(a) * 0.85, Math.sin(a) * 0.85, 0],
        roll: Math.PI / 4,
        s: [0.14, 0.14, 0.14],
        port: true,
        tint,
      })
    }
    b.push({ p: [0, 0, 0], s: [0.3, 0.3, 0.3], roll: Math.PI / 4, port: true, tint: BRIGHT })
  }
  return b
}

const ARCHETYPES: Record<string, (a: { required: boolean }[], h: (i: number) => number) => Block[]> = {
  core: regulator,
  file: cabinet,
  data: prismBench,
  network: dish,
  introspection: periscope,
  media: projector,
}

/** build the part for a builtin (bare name) or a verb. */
export function buildPart(id: string): PartModel {
  const verb = CHAPTERS.find((c) => c.verb === id)
  if (verb) {
    return pack(id, 'verb', 'emblem', emblem(id))
  }
  const tool = TOOL_INDEX[id]
  if (!tool) throw new Error(`buildPart: unknown id "${id}"`)
  const h = hashSeq(id)
  const blocks = ARCHETYPES[tool.category](tool.args, h)
  return pack(id, 'tool', tool.category, blocks)
}

import { TOOLS, TOOL_CATEGORIES } from '../../content/tools.generated'
import { NIKA_VERB_HEX, NIKA_BRAND } from '../../design-tokens.generated'
import { layoutDrum, type DrumLayout } from './slot-layout'

/* ─── drum-model · THE PIN DRUM, pure data (no three import) ──────────────────
   The standard library as a music-box pinned cylinder: one axial ROW per
   builtin (27 · register order), ONE PIN PER REAL ARGUMENT (tall/bright =
   required, half-height = optional — counts come from tools.generated,
   never invented), six divider blades between the family arcs, a fixed
   COMB reading the apex row. The drum of liberation plays — and what it
   plays is the vocabulary.

   THEME DOCTRINE · the tholos register (canonical statement:
   src/scene/drum-sphere-three.ts) — wireframe blocks · facing-alpha lines ·
   black occluder fills · HUD mono whispers. This model feeds that register;
   the family grouping is the CATALOG's (TOOL_CATEGORIES — the register
   page's own truth; the spec machine's BUILTIN_GROUPS is a different
   surface's craft grouping and stays there).

   Pure functions only — no Math.random, no three import, testable. Quats
   are single-axis (about X): a slot at angle θ orients by rotX(θ − π/2),
   which maps the unit box's +Z to the slot's outward radial and keeps +X
   axial (the line shader reads +Z as the facing normal — the machine's
   convention). */

export const DRUM_R = 1.0
export const DRUM_L = 2.3
export const PIN_PITCH = 0.075
export const PIN_X0 = -0.97
export const PIN_H_REQ = 0.11
export const PIN_H_OPT = 0.055
export const PIN_CROSS = 0.028
/** the comb floats this far over the apex shell */
export const COMB_LIFT = 0.12

/* the neutral slot index for STRUCTURE instances (blades · rings · spokes ·
   axle): uFocusA[27] stays 1.0 forever — structure never dims under a read */
export const STRUCT_SLOT = TOOLS.length

function hexRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

/** pins ride the invoke hue — the stdlib IS invoke's vocabulary (data-true:
    the spec machine tints its stdlib stratum the same way) */
export const PIN_TINT = hexRgb(NIKA_VERB_HEX.invoke)
/** structure rides the brand accent family */
export const STRUCT_TINT = hexRgb(NIKA_BRAND.accent)
export const COMB_TINT = hexRgb(NIKA_BRAND.accentBright)

export interface DrumModel {
  layout: DrumLayout
  /** instanced blocks · shared by fills + edges */
  count: number
  pos: Float32Array
  quat: Float32Array
  scale: Float32Array
  /** (slotIndex | STRUCT_SLOT, anglePhase 0..1) — phase drives the rolling
      2.4s breath (the beat travels AROUND the drum, not along it) */
  seed: Float32Array
  tint: Float32Array
  /** the line harness · axial tracks (one per slot) + two rim polygons */
  harness: Float32Array
  harnessSlot: Float32Array
  /** the fixed comb (never rotates) · bar + one tooth per axial pin station */
  comb: Float32Array
  /** slot anchors for CPU picking/aiming · unit circle (cosθ, sinθ) at the
      row's mid-x — the scene projects these each frame */
  anchors: { bare: string; x: number; cos: number; sin: number }[]
  pinCount: number
}

/* quat for rotation about X by `a`, as [x,y,z,w] */
function rotX(a: number): [number, number, number, number] {
  return [Math.sin(a / 2), 0, 0, Math.cos(a / 2)]
}

export function buildToolsDrum(): DrumModel {
  const layout = layoutDrum(TOOLS, TOOL_CATEGORIES)
  const byBare = new Map(TOOLS.map((t) => [t.bare, t]))

  interface Block {
    p: [number, number, number]
    q: [number, number, number, number]
    s: [number, number, number]
    slot: number
    phase: number
    tint: readonly [number, number, number]
  }
  const blocks: Block[] = []

  /* radial frame at angle θ (about the X axis) · apex is θ=0 → +Y */
  const dir = (a: number): [number, number] => [Math.cos(a), Math.sin(a)]
  const at = (a: number, r: number, x: number): [number, number, number] => {
    const [cy, sz] = dir(a)
    return [x, cy * r, sz * r]
  }

  /* ── the pin rows · one pin per REAL argument ── */
  let pinCount = 0
  for (const slot of layout.slots) {
    const tool = byBare.get(slot.bare)
    if (!tool) continue
    const q = rotX(slot.angle - Math.PI / 2)
    tool.args.forEach((arg, k) => {
      const h = arg.required ? PIN_H_REQ : PIN_H_OPT
      blocks.push({
        p: at(slot.angle, DRUM_R + h / 2, PIN_X0 + k * PIN_PITCH),
        q,
        s: [PIN_CROSS, PIN_CROSS, h],
        slot: slot.index,
        phase: slot.angle / (Math.PI * 2),
        tint: PIN_TINT,
      })
      pinCount += 1
    })
  }

  /* ── the divider blades · the family gaps, continued as end spokes ── */
  for (const d of layout.dividers) {
    const q = rotX(d.angle - Math.PI / 2)
    blocks.push({
      p: at(d.angle, DRUM_R + 0.045, 0),
      q,
      s: [DRUM_L * 0.98, 0.012, 0.09],
      slot: STRUCT_SLOT,
      phase: d.angle / (Math.PI * 2),
      tint: STRUCT_TINT,
    })
    for (const x of [-DRUM_L / 2, DRUM_L / 2]) {
      blocks.push({
        p: at(d.angle, DRUM_R * 0.5, x),
        q,
        s: [0.03, 0.02, DRUM_R * 0.92],
        slot: STRUCT_SLOT,
        phase: d.angle / (Math.PI * 2),
        tint: STRUCT_TINT,
      })
    }
  }

  /* ── the shell wall · one near-black slat per angular position, just under
     the pin radius — the drum is CLOSED, literally: the occluder mass hides
     the far rows (tholos: black fills between the wires ARE the page). A
     slat under a pin row carries that row's slot, so the read row's wall
     lights with it; divider-position slats stay structure. ── */
  const slatW = (Math.PI * 2 * (DRUM_R - 0.04)) / layout.positions
  const slatSlotAt = new Map<number, number>()
  for (const s of layout.slots) slatSlotAt.set(Math.round(s.angle / layout.step), s.index)
  for (let i = 0; i < layout.positions; i++) {
    const a = i * layout.step
    blocks.push({
      p: at(a, DRUM_R - 0.05, 0),
      q: rotX(a - Math.PI / 2),
      s: [DRUM_L * 0.985, slatW * 0.96, 0.02],
      slot: slatSlotAt.get(i) ?? STRUCT_SLOT,
      phase: a / (Math.PI * 2),
      tint: STRUCT_TINT,
    })
  }

  /* ── the end rings · 33 machined segments per plate (the drum is CLOSED —
     the rim is built from exactly one segment per angular position) ── */
  const segLen = (Math.PI * 2 * DRUM_R) / layout.positions
  for (const x of [-DRUM_L / 2, DRUM_L / 2]) {
    for (let i = 0; i < layout.positions; i++) {
      const a = (i + 0.5) * layout.step
      blocks.push({
        p: at(a, DRUM_R, x),
        q: rotX(a - Math.PI / 2),
        s: [0.03, segLen * 0.82, 0.05],
        slot: STRUCT_SLOT,
        phase: a / (Math.PI * 2),
        tint: STRUCT_TINT,
      })
    }
  }

  /* ── the axle ── */
  blocks.push({
    p: [0, 0, 0],
    q: rotX(0),
    s: [DRUM_L + 0.34, 0.07, 0.07],
    slot: STRUCT_SLOT,
    phase: 0,
    tint: STRUCT_TINT,
  })

  const count = blocks.length
  const pos = new Float32Array(count * 3)
  const quat = new Float32Array(count * 4)
  const scale = new Float32Array(count * 3)
  const seed = new Float32Array(count * 2)
  const tint = new Float32Array(count * 3)
  blocks.forEach((b, i) => {
    pos.set(b.p, i * 3)
    quat.set(b.q, i * 4)
    scale.set(b.s, i * 3)
    seed.set([b.slot, b.phase], i * 2)
    tint.set(b.tint, i * 3)
  })

  /* ── the line harness (rotates with the drum) · one axial track per slot
     + two rim polylines, every vertex carrying its slot (or STRUCT_SLOT) ── */
  const hPts: number[] = []
  const hSlot: number[] = []
  const track = (a: number, slot: number) => {
    const [x0, y0, z0] = at(a, DRUM_R, -DRUM_L / 2)
    const [x1, y1, z1] = at(a, DRUM_R, DRUM_L / 2)
    hPts.push(x0, y0, z0, x1, y1, z1)
    hSlot.push(slot, slot)
  }
  for (const s of layout.slots) track(s.angle, s.index)
  const RIM_STEPS = layout.positions * 2
  for (const x of [-DRUM_L / 2, DRUM_L / 2]) {
    for (let i = 0; i < RIM_STEPS; i++) {
      const a0 = (i / RIM_STEPS) * Math.PI * 2
      const a1 = ((i + 1) / RIM_STEPS) * Math.PI * 2
      hPts.push(...at(a0, DRUM_R, x), ...at(a1, DRUM_R, x))
      hSlot.push(STRUCT_SLOT, STRUCT_SLOT)
    }
  }

  /* ── the comb · FIXED over the apex (never rotates) · the bar + one tooth
     per axial pin station (24 = the widest row the catalog ships — teeth
     derive from the real max, never a magic count) ── */
  const maxArgs = Math.max(...TOOLS.map((t) => t.args.length))
  const combY = DRUM_R + COMB_LIFT
  const cPts: number[] = [
    -DRUM_L * 0.53,
    combY,
    0,
    DRUM_L * 0.53,
    combY,
    0,
  ]
  for (let k = 0; k < maxArgs; k++) {
    const x = PIN_X0 + k * PIN_PITCH
    cPts.push(x, combY, 0, x, combY - COMB_LIFT * 0.45, 0)
  }

  const anchors = layout.slots.map((s) => ({
    bare: s.bare,
    x: PIN_X0 + (byBare.get(s.bare)!.args.length * PIN_PITCH) / 2,
    cos: Math.cos(s.angle),
    sin: Math.sin(s.angle),
  }))

  return {
    layout,
    count,
    pos,
    quat,
    scale,
    seed,
    tint,
    harness: new Float32Array(hPts),
    harnessSlot: new Float32Array(hSlot),
    comb: new Float32Array(cPts),
    anchors,
    pinCount,
  }
}

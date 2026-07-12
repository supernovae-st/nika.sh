import { describe, expect, it } from 'vitest'
import { TOOLS } from '../../content/tools.generated'
import { NIKA_VERB_HEX, NIKA_BRAND } from '../../design-tokens.generated'
import {
  buildToolsDrum,
  DRUM_L,
  DRUM_R,
  PIN_H_OPT,
  PIN_H_REQ,
  PIN_TINT,
  STRUCT_SLOT,
  STRUCT_TINT,
  COMB_TINT,
} from './drum-model'

/* ── the pin drum's honesty gates ─────────────────────────────────────────────
   Every number the drum renders must be a catalog number: one pin per REAL
   argument, required pins taller, one axial track per slot, teeth from the
   real widest row. Determinism pins the builder (no Math.random — two
   builds byte-agree); tints pin against the GENERATED tokens (never
   hand-typed hex — the design-tokens SSOT law). */

const hex = (h: string) => [
  ((parseInt(h.slice(1), 16) >> 16) & 255) / 255,
  ((parseInt(h.slice(1), 16) >> 8) & 255) / 255,
  (parseInt(h.slice(1), 16) & 255) / 255,
]

describe('drum-model · the pin drum tells catalog truth', () => {
  const m = buildToolsDrum()

  it('one pin per real argument — the count IS the catalog sum', () => {
    const argsTotal = TOOLS.reduce((n, t) => n + t.args.length, 0)
    expect(m.pinCount).toBe(argsTotal)
  })

  it('required pins are tall, optional pins are half — per tool, in order', () => {
    /* pins are emitted first, slot-major in register order */
    let i = 0
    for (const slot of m.layout.slots) {
      const tool = TOOLS.find((t) => t.bare === slot.bare)!
      for (const arg of tool.args) {
        const h = m.scale[i * 3 + 2]
        expect(h, `${slot.bare}.${arg.name}`).toBeCloseTo(arg.required ? PIN_H_REQ : PIN_H_OPT, 6)
        expect(m.seed[i * 2], `${slot.bare} pin slot`).toBe(slot.index)
        i += 1
      }
    }
  })

  it('pins sit ON the shell (radius + half height), inside the drum length', () => {
    for (let i = 0; i < m.pinCount; i++) {
      const y = m.pos[i * 3 + 1]
      const z = m.pos[i * 3 + 2]
      const h = m.scale[i * 3 + 2]
      expect(Math.hypot(y, z)).toBeCloseTo(DRUM_R + h / 2, 6)
      expect(Math.abs(m.pos[i * 3])).toBeLessThan(DRUM_L / 2)
    }
  })

  it('row-lit instances are exactly the pins + one wall slat per slot', () => {
    /* everything else (blades · rims · spokes · axle · gap slats) rides the
       neutral STRUCT slot — it never dims under a read; the wall slat UNDER
       a pin row carries that row's slot so the read lights its wall */
    let rowLit = 0
    for (let i = 0; i < m.count; i++) {
      const s = m.seed[i * 2]
      expect(s).toBeLessThanOrEqual(STRUCT_SLOT)
      if (s < STRUCT_SLOT) rowLit += 1
    }
    expect(rowLit).toBe(m.pinCount + m.layout.slots.length)
  })

  it('the harness carries one axial track per slot + two closed rims', () => {
    const trackVerts = m.layout.slots.length * 2
    const rimVerts = m.layout.positions * 2 * 2 * 2
    expect(m.harnessSlot.length).toBe(trackVerts + rimVerts)
    /* track vertices carry their slot; rim vertices are structure */
    for (let v = 0; v < trackVerts; v += 2) {
      expect(m.harnessSlot[v]).toBe(m.harnessSlot[v + 1])
      expect(m.harnessSlot[v]).toBeLessThan(STRUCT_SLOT)
    }
    for (let v = trackVerts; v < m.harnessSlot.length; v++) {
      expect(m.harnessSlot[v]).toBe(STRUCT_SLOT)
    }
  })

  it('the comb teeth derive from the real widest row', () => {
    const maxArgs = Math.max(...TOOLS.map((t) => t.args.length))
    /* bar (2 verts) + one 2-vert tooth per axial station */
    expect(m.comb.length / 3).toBe(2 + maxArgs * 2)
  })

  it('tints pin against the generated tokens (spec-first, never hand-typed)', () => {
    expect([...PIN_TINT]).toEqual(hex(NIKA_VERB_HEX.invoke))
    expect([...STRUCT_TINT]).toEqual(hex(NIKA_BRAND.accent))
    expect([...COMB_TINT]).toEqual(hex(NIKA_BRAND.accentBright))
    /* the first pin instance carries the invoke hue (float32 readback) */
    hex(NIKA_VERB_HEX.invoke).forEach((c, k) => expect(m.tint[k]).toBeCloseTo(c, 6))
  })

  it('two builds are identical — the builder is deterministic', () => {
    const n = buildToolsDrum()
    expect(n.count).toBe(m.count)
    expect(Array.from(n.pos)).toEqual(Array.from(m.pos))
    expect(Array.from(n.quat)).toEqual(Array.from(m.quat))
    expect(Array.from(n.seed)).toEqual(Array.from(m.seed))
    expect(Array.from(n.harness)).toEqual(Array.from(m.harness))
    expect(Array.from(n.comb)).toEqual(Array.from(m.comb))
  })

  it('anchors cover every slot, unit-circled', () => {
    expect(m.anchors.length).toBe(TOOLS.length)
    for (const a of m.anchors) {
      expect(Math.hypot(a.cos, a.sin)).toBeCloseTo(1, 9)
    }
  })
})

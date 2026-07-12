import { describe, expect, it } from 'vitest'
import { TOOLS } from '../../content/tools.generated'
import { CANON } from '../../canon.generated'
import { buildPart } from './part-model'

/* ── the parts catalog's laws ─────────────────────────────────────────────────
   COHERENT: every part is the same ink (blocks in instance tables — the
   tholos register renders them identically). DISTINCT: no two parts share
   a silhouette signature. HONEST: port counts are catalog counts — a
   required arg is a bright port, never an invented one. DETERMINISTIC:
   two builds byte-agree (no Math.random). */

const sig = (id: string) => {
  const m = buildPart(id)
  /* the silhouette signature: block count + quantized positions/scales */
  const q = (a: Float32Array) => Array.from(a, (v) => Math.round(v * 100)).join(',')
  return `${m.count}|${q(m.pos)}|${q(m.scale)}`
}

describe('part-model · the parts catalog', () => {
  it('every builtin and every verb builds a part', () => {
    for (const t of TOOLS) expect(() => buildPart(t.bare), t.bare).not.toThrow()
    for (const v of CANON.verbNames) expect(() => buildPart(v), v).not.toThrow()
    expect(() => buildPart('nonsense')).toThrow()
  })

  it('no two parts share a silhouette (distinct by construction)', () => {
    const ids = [...TOOLS.map((t) => t.bare), ...CANON.verbNames]
    const seen = new Map<string, string>()
    for (const id of ids) {
      const s = sig(id)
      expect(seen.has(s), `${id} collides with ${seen.get(s)}`).toBe(false)
      seen.set(s, id)
    }
  })

  it('tool ports tell catalog truth — one port marker per arg, plus fixtures', () => {
    for (const t of TOOLS) {
      const m = buildPart(t.bare)
      let ports = 0
      for (let i = 0; i < m.count; i++) ports += m.seed[i * 2 + 1]
      /* every archetype gives each arg exactly one port-flagged block; the
         fixed emitter/beacon fixtures add a small archetype-constant extra */
      expect(ports, t.bare).toBeGreaterThanOrEqual(t.args.length)
      expect(ports, t.bare).toBeLessThanOrEqual(t.args.length + 2)
      expect(m.kind).toBe('tool')
      expect(m.archetype).toBe(t.category)
    }
  })

  it('the invoke emblem carries the closed namespace — one tooth per builtin', () => {
    const m = buildPart('invoke')
    /* 27 teeth + 6 blades + hub = the drum's echo */
    expect(m.count).toBe(CANON.builtins + 6 + 1)
    expect(m.kind).toBe('verb')
  })

  it('the infer emblem carries one spoke per spec provider', () => {
    const m = buildPart('infer')
    let ports = 0
    for (let i = 0; i < m.count; i++) ports += m.seed[i * 2 + 1]
    /* providers spokes + the hub core */
    expect(ports).toBe(CANON.providers + 1)
  })

  it('two builds are identical — the builder is deterministic', () => {
    for (const id of ['fetch', 'write', 'jq', 'agent']) {
      const a = buildPart(id)
      const b = buildPart(id)
      expect(Array.from(a.pos)).toEqual(Array.from(b.pos))
      expect(Array.from(a.quat)).toEqual(Array.from(b.quat))
      expect(Array.from(a.scale)).toEqual(Array.from(b.scale))
      expect(Array.from(a.tint)).toEqual(Array.from(b.tint))
    }
  })

  it('parts stay in frame — radius bounded, blocks finite', () => {
    for (const t of TOOLS) {
      const m = buildPart(t.bare)
      expect(m.radius, t.bare).toBeLessThan(2.6)
      expect(m.count, t.bare).toBeLessThan(90)
      for (const v of m.pos) expect(Number.isFinite(v)).toBe(true)
    }
  })
})

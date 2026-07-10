import { describe, expect, it } from 'vitest'
import { RECORD } from '../content/manifesto-record'

/* the record's own permits block: every entry dated, sourced, sorted, sober.
   The lint IS the register law (see manifesto-record.ts header). */

describe('manifesto record · data lint', () => {
  it('has entries', () => {
    expect(RECORD.length).toBeGreaterThanOrEqual(15)
  })

  it('slugs are stable, unique, kebab-case', () => {
    const ids = RECORD.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('dates are ISO (YYYY[-MM[-DD]]) and sorted ascending', () => {
    for (const e of RECORD) expect(e.date).toMatch(/^\d{4}(-\d{2}){0,2}$/)
    const dates = RECORD.map((e) => e.date)
    const sorted = [...dates].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    expect(dates).toEqual(sorted)
  })

  it('every entry carries one primary https source (label + href)', () => {
    for (const e of RECORD) {
      expect(e.src.href).toMatch(/^https:\/\//)
      expect(e.src.label.length).toBeGreaterThan(3)
      if (e.src2) expect(e.src2.href).toMatch(/^https:\/\//)
    }
  })

  it('strands are the two-value enum', () => {
    for (const e of RECORD) expect(['cage', 'drum']).toContain(e.strand)
  })

  it('exactly one founding entry (the stamp target)', () => {
    expect(RECORD.filter((e) => e.founding).length).toBe(1)
  })

  it('copy law holds: no em-dash, lines stay one line', () => {
    for (const e of RECORD) {
      expect(e.title).not.toContain('—')
      expect(e.line).not.toContain('—')
      expect(e.title.length).toBeLessThanOrEqual(40)
      expect(e.line.length).toBeLessThanOrEqual(220)
      expect(e.line).not.toContain('\n')
    }
  })

  it('the drum gets louder: post-2026 drum beats outnumber cage advances', () => {
    const recent = RECORD.filter((e) => e.date >= '2026-03')
    const drum = recent.filter((e) => e.strand === 'drum').length
    const cage = recent.filter((e) => e.strand === 'cage').length
    expect(drum).toBeGreaterThanOrEqual(cage)
  })
})

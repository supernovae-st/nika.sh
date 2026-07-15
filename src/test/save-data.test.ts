import { describe, expect, it } from 'vitest'
import { prefersLiteData } from '../lib/save-data'

/* ── the lite-data signal (W-H · WO-12) ───────────────────────────────────────
   Injectable deps make the truth table testable without stubbing globals:
   the Save-Data client hint wins, the reduced-data media query backs it up,
   absence of both (or a throwing matchMedia) means false — never a crash. */

const mq = (matches: boolean) => () => ({ matches })

describe('prefersLiteData · the truth table', () => {
  it('Save-Data hint on → true (regardless of the media query)', () => {
    expect(prefersLiteData({ connection: { saveData: true } }, mq(false))).toBe(true)
    expect(prefersLiteData({ connection: { saveData: true } }, undefined)).toBe(true)
  })

  it('prefers-reduced-data → true when the hint is absent', () => {
    expect(prefersLiteData({}, mq(true))).toBe(true)
    expect(prefersLiteData({ connection: { saveData: false } }, mq(true))).toBe(true)
  })

  it('neither signal → false', () => {
    expect(prefersLiteData({}, mq(false))).toBe(false)
    expect(prefersLiteData({ connection: {} }, mq(false))).toBe(false)
    expect(prefersLiteData({}, undefined)).toBe(false)
  })

  it('a throwing matchMedia (unknown query in an old engine) → false, never a crash', () => {
    expect(
      prefersLiteData({}, () => {
        throw new Error('unsupported')
      }),
    ).toBe(false)
  })
})

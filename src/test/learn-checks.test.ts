import { describe, expect, it } from 'vitest'
import { STEPS } from '../content/learn'

/* ── the I7 discipline, held structurally ─────────────────────────────────────
   At most ONE check per step · every answer index valid · the WHY is real
   teaching (long enough to explain, never a one-word reward) · the
   anti-slop voice (no em dash · no intensifiers · no gamification
   vocabulary anywhere near the checks). */

const checks = STEPS.flatMap((s) => (s.check ? [{ n: s.n, ...s.check }] : []))

describe('/learn · the inline checks stay disciplined', () => {
  it('a handful of checks exist, never more than one per step', () => {
    expect(checks.length).toBeGreaterThanOrEqual(3)
    expect(checks.length).toBeLessThanOrEqual(STEPS.length)
  })

  it('every check is answerable and explains itself', () => {
    for (const c of checks) {
      expect(c.options.length, `step ${c.n}`).toBeGreaterThanOrEqual(2)
      expect(c.options.length, `step ${c.n}`).toBeLessThanOrEqual(4)
      expect(c.answer, `step ${c.n}`).toBeGreaterThanOrEqual(0)
      expect(c.answer, `step ${c.n}`).toBeLessThan(c.options.length)
      expect(c.why.length, `step ${c.n} why must teach`).toBeGreaterThan(60)
      expect(c.q.endsWith('?'), `step ${c.n} q asks`).toBe(true)
    }
  })

  it('zero gamification vocabulary, zero em dash (the anti-slop law)', () => {
    for (const c of checks) {
      const all = [c.q, c.why, ...c.options].join(' ')
      expect(all).not.toMatch(/—/)
      expect(all).not.toMatch(/\b(streak|points?|score|badge|level up)\b/i)
      expect(all).not.toMatch(/\b(seamless|powerful|robust)\b/i)
    }
  })
})

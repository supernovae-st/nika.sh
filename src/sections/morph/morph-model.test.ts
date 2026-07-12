import { describe, expect, it } from 'vitest'
import { FLAGSHIP_ENTRIES } from '../../flagships'
import { buildScript } from '../run/replay-model'
import {
  DRAIN_END,
  PH,
  SWEEP_W,
  aspireAt,
  condenseAt,
  drainRampAt,
  igniteAt,
  phaseAt,
  runFracAt,
  seedInAt,
  shellAt,
  taskInterval,
  termAt,
  timelineAt,
  travelAt,
  verdictFrontAt,
  verdictPulseAt,
  wireAt,
} from './morph-model'

/* ─── morph-model · the scroll morph is a pure function of p ──────────────────
   Every flagship must scrub cleanly: phases monotone, every aspiration beat
   completes inside the burst window, and the run timeline honest against the
   recorded trace. */

describe('phase windows', () => {
  it('shell holds at 1 through the file phase, reaches 0 before the burst ends', () => {
    expect(shellAt(0)).toBe(1)
    expect(shellAt(PH.burst0)).toBe(1)
    expect(shellAt(PH.burstEnd)).toBe(0)
    /* monotone non-increasing */
    let prev = 1
    for (let p = 0; p <= 1.0001; p += 0.01) {
      const s = shellAt(p)
      expect(s).toBeLessThanOrEqual(prev + 1e-9)
      prev = s
    }
  })

  it('every aspiration beat starts at 0 and lands by burstEnd', () => {
    for (const f of FLAGSHIP_ENTRIES) {
      const n = f.plan.tasks.length
      for (let i = 0; i < n; i++) {
        expect(aspireAt(PH.burst0 - 0.001, i, n)).toBe(0)
        expect(aspireAt(PH.burstEnd, i, n)).toBe(1)
        expect(igniteAt(aspireAt(PH.burstEnd, i, n))).toBe(1)
      }
      /* reading order: an earlier task is never behind a later one */
      for (let p = PH.burst0; p <= PH.burstEnd; p += 0.01) {
        for (let i = 1; i < n; i++) {
          expect(aspireAt(p, i - 1, n)).toBeGreaterThanOrEqual(aspireAt(p, i, n))
        }
      }
    }
  })

  it('a beat condenses fully before its seed lands, and ignition is the landing', () => {
    /* sub-phase contract: condense saturates at e=0.45 where travel begins;
       ignition opens only in the travel's final approach */
    expect(condenseAt(0.45)).toBe(1)
    expect(travelAt(0.45)).toBe(0)
    expect(travelAt(1)).toBe(1)
    expect(igniteAt(0.45)).toBe(0)
    expect(igniteAt(0.45 + 0.55 * 0.78)).toBe(0)
    expect(igniteAt(1)).toBe(1)
    /* monotone in e */
    let prevC = 0
    let prevT = 0
    let prevI = 0
    for (let e = 0; e <= 1.0001; e += 0.01) {
      expect(condenseAt(e)).toBeGreaterThanOrEqual(prevC)
      expect(travelAt(e)).toBeGreaterThanOrEqual(prevT)
      expect(igniteAt(e)).toBeGreaterThanOrEqual(prevI)
      prevC = condenseAt(e)
      prevT = travelAt(e)
      prevI = igniteAt(e)
    }
  })

  it('wires are done before the run starts · the monitor docks before the burst', () => {
    expect(wireAt(PH.wire0)).toBe(0)
    expect(wireAt(PH.run0)).toBe(1)
    expect(termAt(PH.term0)).toBe(0)
    expect(termAt(PH.run0)).toBe(1)
    /* the run monitor is STANDING before the first task condenses — the
       instrument panel precedes the tape (operator ask, the docked deck) */
    expect(termAt(PH.burst0)).toBe(1)
    expect(PH.term1).toBeLessThanOrEqual(PH.burst0)
    /* and only after the file's settle — never through the hero seam */
    expect(PH.term0).toBeGreaterThan(0)
    expect(runFracAt(PH.run0)).toBe(0)
    expect(runFracAt(PH.run1)).toBe(1)
  })

  it('phaseAt walks file → burst → run → flat → done and never regresses', () => {
    expect(phaseAt(0)).toBe('file')
    expect(phaseAt(PH.burst0 - 0.001)).toBe('file')
    expect(phaseAt(PH.burst0)).toBe('burst')
    expect(phaseAt(PH.run0 - 0.001)).toBe('burst')
    expect(phaseAt(PH.run0)).toBe('run')
    expect(phaseAt((PH.run0 + PH.run1) / 2)).toBe('run')
    /* the verdict window: the run saturates INTO the flat beat (the exit-0
       sweep + the 3D flatten live there), the crossfade lands at flat1 */
    expect(phaseAt(PH.run1)).toBe('flat')
    expect(phaseAt((PH.run1 + PH.flat1) / 2)).toBe('flat')
    expect(phaseAt(PH.flat1)).toBe('done')
    expect(phaseAt(1)).toBe('done')
    /* monotone: scrubbing forward can only advance the phase */
    const order = { file: 0, burst: 1, run: 2, flat: 3, done: 4 }
    let prev = 0
    for (let p = 0; p <= 1.0001; p += 0.005) {
      const rank = order[phaseAt(p)]
      expect(rank).toBeGreaterThanOrEqual(prev)
      prev = rank
    }
  })
})

describe('replay lines carry the recorded clock', () => {
  it('atMs is present and non-decreasing for every flagship', () => {
    for (const f of FLAGSHIP_ENTRIES) {
      const { lines } = buildScript(f)
      let prev = 0
      for (const l of lines) {
        expect(l.atMs).toBeGreaterThanOrEqual(0)
        expect(l.atMs).toBeGreaterThanOrEqual(prev)
        prev = l.atMs
      }
      expect(lines[lines.length - 1].atMs).toBe(f.trace.totalMs)
    }
  })

  it('every task line names its task — the log ⇄ node ⇄ file triangle', () => {
    for (const f of FLAGSHIP_ENTRIES) {
      const { lines } = buildScript(f)
      const ids = new Set(f.plan.tasks.map((t) => t.id))
      for (const l of lines) {
        if (l.kind === 'start' || l.kind === 'done' || l.kind === 'skip') {
          expect(l.task).toBeTruthy()
          expect(ids.has(l.task!)).toBe(true)
        } else {
          expect(l.task).toBeUndefined()
        }
      }
    }
  })
})

describe('taskInterval · real recorded running windows', () => {
  it('derives [completedAt − duration, completedAt] for completed tasks', () => {
    for (const f of FLAGSHIP_ENTRIES) {
      for (const t of f.plan.tasks) {
        const iv = taskInterval(f, t.id)
        expect(iv).not.toBeNull()
        if (iv && 'end' in iv) {
          expect(iv.start).toBeGreaterThanOrEqual(0)
          expect(iv.end).toBeGreaterThanOrEqual(iv.start)
          expect(iv.end).toBeLessThanOrEqual(f.trace.totalMs)
        }
      }
    }
  })

  it('parallel siblings really overlap (daily-brief triage ∥ agenda)', () => {
    const daily = FLAGSHIP_ENTRIES.find((f) => f.id === 'daily_brief')
    if (!daily) throw new Error('daily_brief flagship missing')
    const a = taskInterval(daily, 'triage')
    const b = taskInterval(daily, 'agenda')
    if (!a || !b || !('end' in a) || !('end' in b)) throw new Error('intervals missing')
    const overlap = Math.min(a.end, b.end) - Math.max(a.start, b.start)
    expect(overlap).toBeGreaterThan(0)
    /* and the timeline shows BOTH running at the overlap midpoint */
    const mid = (Math.max(a.start, b.start) + Math.min(a.end, b.end)) / 2
    const { lines } = buildScript(daily)
    const state = timelineAt(daily, lines, mid / daily.trace.totalMs)
    expect(state.nodes['triage']).toBe('running')
    expect(state.nodes['agenda']).toBe('running')
  })
})

describe('timelineAt · endpoints', () => {
  it('rf=0 · nothing has completed, no verdict', () => {
    for (const f of FLAGSHIP_ENTRIES) {
      const { lines } = buildScript(f)
      const s = timelineAt(f, lines, 0)
      expect(s.verdictOn).toBe(false)
      for (const t of f.plan.tasks) expect(['pending']).toContain(s.nodes[t.id])
      expect(s.reveal).toBe(0)
    }
  })

  it('rf=1 · full log, every node done or skipped, verdict on', () => {
    for (const f of FLAGSHIP_ENTRIES) {
      const { lines } = buildScript(f)
      const s = timelineAt(f, lines, 1)
      expect(s.verdictOn).toBe(true)
      expect(s.reveal).toBe(lines.length)
      const skipped = f.plan.tasks.filter((t) => s.nodes[t.id] === 'skipped')
      expect(skipped.length).toBe(f.trace.skipped)
      for (const t of f.plan.tasks) expect(['done', 'skipped']).toContain(s.nodes[t.id])
    }
  })

  it('reveal is monotone in rf and never precedes a line’s recorded time', () => {
    for (const f of FLAGSHIP_ENTRIES) {
      const { lines } = buildScript(f)
      let prev = 0
      for (let rf = 0; rf <= 1.0001; rf += 0.02) {
        const s = timelineAt(f, lines, Math.min(1, rf))
        expect(s.reveal).toBeGreaterThanOrEqual(prev)
        /* honesty: every revealed line's recorded clock has passed */
        const t = Math.min(1, rf) * f.trace.totalMs
        for (let i = 0; i < s.reveal; i++) expect(lines[i].atMs).toBeLessThanOrEqual(t)
        prev = s.reveal
      }
    }
  })

  describe('drainRampAt · the queue-slide completes before ANY first landing', () => {
    it('zero before its window, saturated at DRAIN_END, monotone inside', () => {
      expect(drainRampAt(PH.burst0)).toBe(0)
      expect(drainRampAt(PH.burst0 + DRAIN_END)).toBeCloseTo(1, 6)
      let prev = -1
      for (let p = PH.burst0; p <= PH.burst0 + DRAIN_END + 0.001; p += 0.005) {
        const d = drainRampAt(p)
        expect(d).toBeGreaterThanOrEqual(prev)
        prev = d
      }
    })

    it('for every flagship the ramp saturates before task 0 can ignite', () => {
      for (const f of FLAGSHIP_ENTRIES) {
        const n = f.plan.tasks.length
        /* first landing = task 0's ignition onset (travel ≈ done) */
        let pLand = PH.burst0
        while (pLand < PH.burstEnd && igniteAt(aspireAt(pLand, 0, n)) <= 0) {
          pLand += 0.001
        }
        expect(drainRampAt(pLand)).toBeCloseTo(1, 3)
      }
    })
  })

  describe('seedInAt · the chip is born FROM a still-readable block', () => {
    it('starts at ce 0.35 (block ≈ 0.8 opacity) and saturates by 0.75', () => {
      expect(seedInAt(0.34)).toBe(0)
      expect(seedInAt(0.35)).toBe(0)
      expect(seedInAt(0.55)).toBeCloseTo(0.5, 6)
      expect(seedInAt(0.75)).toBe(1)
      /* the block's line opacity at birth: 1 − (0.35−0.25)/0.5 = 0.8 —
         the overlap the causality needs */
      expect(1 - (0.35 - 0.25) / 0.5).toBeCloseTo(0.8, 6)
    })
  })

  describe('verdict sweep · the flat window has a real scene event (arc 20b)', () => {
    it('front is 0 through the run window, saturates before flat1, monotone', () => {
      expect(verdictFrontAt(PH.run1)).toBe(0)
      expect(verdictFrontAt(PH.run1 - 0.05)).toBe(0)
      expect(verdictFrontAt(PH.flat1 - 0.015)).toBe(1)
      let prev = 0
      for (let p = PH.run1; p <= PH.flat1; p += 0.002) {
        const f = verdictFrontAt(p)
        expect(f).toBeGreaterThanOrEqual(prev)
        prev = f
      }
    })
    it('every node rises AND falls fully — silent at both ends of the travel', () => {
      for (const xNorm of [0, 0.5, 1]) {
        expect(verdictPulseAt(0, xNorm)).toBe(0)
        expect(verdictPulseAt(1, xNorm)).toBe(0)
        let peak = 0
        for (let f = 0.001; f < 1; f += 0.002) {
          peak = Math.max(peak, verdictPulseAt(f, xNorm))
        }
        expect(peak).toBeGreaterThan(0.99)
      }
    })
    it('the pulse peaks exactly as the front crosses the node', () => {
      const xNorm = 0.5
      const fAtNode = (xNorm + SWEEP_W) / (1 + 2 * SWEEP_W)
      expect(verdictPulseAt(fAtNode, xNorm)).toBeCloseTo(1, 6)
    })
  })
})

import { describe, expect, it } from 'vitest'
import { FLAGSHIP_ENTRIES } from '../../flagships'
import { buildScript } from '../run/replay-model'
import {
  PH,
  flightAt,
  phaseAt,
  runFracAt,
  shellAt,
  taskInterval,
  termAt,
  timelineAt,
  wireAt,
} from './morph-model'

/* ─── morph-model · the scroll morph is a pure function of p ──────────────────
   Every flagship must scrub cleanly: phases monotone, flights complete inside
   the burst window, and the run timeline honest against the recorded trace. */

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

  it('every wave flight starts at 0 and lands by burstEnd', () => {
    for (const f of FLAGSHIP_ENTRIES) {
      for (let w = 0; w < f.plan.waveCount; w++) {
        expect(flightAt(PH.burst0 - 0.001, w, f.plan.waveCount)).toBe(0)
        expect(flightAt(PH.burstEnd, w, f.plan.waveCount)).toBe(1)
      }
      /* wave order: an earlier wave is never behind a later one */
      for (let p = PH.burst0; p <= PH.burstEnd; p += 0.01) {
        for (let w = 1; w < f.plan.waveCount; w++) {
          expect(flightAt(p, w - 1, f.plan.waveCount)).toBeGreaterThanOrEqual(
            flightAt(p, w, f.plan.waveCount),
          )
        }
      }
    }
  })

  it('wires and terminal are done before the run starts', () => {
    expect(wireAt(PH.wire0)).toBe(0)
    expect(wireAt(PH.run0)).toBe(1)
    expect(termAt(PH.term0)).toBe(0)
    expect(termAt(PH.run0)).toBe(1)
    expect(runFracAt(PH.run0)).toBe(0)
    expect(runFracAt(PH.run1)).toBe(1)
  })

  it('phaseAt walks file → burst → run → done and never regresses', () => {
    expect(phaseAt(0)).toBe('file')
    expect(phaseAt(PH.burst0 - 0.001)).toBe('file')
    expect(phaseAt(PH.burst0)).toBe('burst')
    expect(phaseAt(PH.run0 - 0.001)).toBe('burst')
    expect(phaseAt(PH.run0)).toBe('run')
    expect(phaseAt((PH.run0 + PH.run1) / 2)).toBe('run')
    expect(phaseAt(PH.run1)).toBe('done')
    expect(phaseAt(1)).toBe('done')
    /* monotone: scrubbing forward can only advance the phase */
    const order = { file: 0, burst: 1, run: 2, done: 3 }
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
})

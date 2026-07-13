import { describe, expect, it } from 'vitest'
import { FLAGSHIP_ENTRIES } from '../../flagships'
import { buildScript } from '../run/replay-model'
import {
  P_ARM,
  PH,
  RUNWAY_VH,
  SWEEP_W,
  bornAt,
  glideAt,
  litAt,
  phaseAt,
  runFracAt,
  seedFlightAt,
  taskInterval,
  termAt,
  timelineAt,
  unfoldAt,
  verdictFrontAt,
  verdictPulseAt,
  wireAt,
} from './morph-model'

/* ─── morph-model · the continuous film is a pure function of p ───────────────
   Every flagship must scrub cleanly: the windows ordered, every birth beat
   lands inside the approach (the hero geometry is only scroll-invariant
   there), every unfold seats before the wires draw, and the run timeline
   honest against the recorded trace. */

describe('phase windows · the beat sheet holds its order', () => {
  it('birth → glide → wires → run → flat, strictly ordered on the axis', () => {
    expect(PH.birth0).toBeGreaterThan(0)
    expect(PH.birth0).toBeLessThan(PH.birth1)
    /* the glide OVERLAPS the births (the geometry writes the sheet: the
       hero panel must be adopted while still on screen) — it only needs to
       start after the FIRST birth is under way */
    expect(PH.glide0).toBeGreaterThan(PH.birth0)
    expect(PH.glide0).toBeLessThanOrEqual(PH.glide1)
    /* the wires trust the flight's geometry — they may only start once
       every CARD is seated (the file's own glide may still be landing:
       the wires connect cards, not the file) */
    expect(PH.wire0).toBeGreaterThanOrEqual(PH.unfold1)
    expect(PH.wire0).toBeLessThan(PH.wire1)
    expect(PH.wire1).toBeLessThanOrEqual(PH.run0)
    expect(PH.run0).toBeLessThan(PH.run1)
    expect(PH.run1).toBeLessThan(PH.flat1)
    expect(PH.flat1).toBeLessThan(1)
  })

  it('THE SEAM INVARIANT · births inside the approach, the voyage ENJAMBS the dock', () => {
    /* the axis: p = (vh − section.top) / (runway + vh) — the stage docks at
       P_ARM = 1/(RUNWAY_VH+1). Hero-anchored geometry (the rail column, the
       yaml source lines) is scroll-invariant relative to the stage ONLY
       while both still scroll together, so every birth must land before the
       dock. The file's glide must START before the dock (the hero panel is
       adopted while still on screen) and END after it — the one voyage sews
       the two halves of the axis together. */
    expect(P_ARM).toBeCloseTo(1 / (RUNWAY_VH + 1), 12)
    expect(PH.birth1).toBeLessThan(P_ARM)
    expect(PH.glide0).toBeLessThan(P_ARM)
    /* every actor is stage-seated BEFORE the sticky freeze — the dock has
       nothing left to sew (a voyage still in flight at the dock chases its
       exiting hero anchor off-screen; swept empirically) */
    expect(PH.glide1).toBeLessThanOrEqual(P_ARM)
    expect(PH.unfold1).toBeLessThanOrEqual(P_ARM)
  })

  it('the run monitor docks during the glide — standing before the tape rolls', () => {
    expect(PH.term0).toBeGreaterThanOrEqual(PH.glide0)
    expect(PH.term1).toBeLessThanOrEqual(PH.run0)
    expect(termAt(PH.term0)).toBe(0)
    expect(termAt(PH.run0)).toBe(1)
  })

  it('wires are done before the run starts', () => {
    expect(wireAt(PH.wire0)).toBe(0)
    expect(wireAt(PH.run0)).toBe(1)
    expect(runFracAt(PH.run0)).toBe(0)
    expect(runFracAt(PH.run1)).toBe(1)
  })

  it('phaseAt walks hero → glide → wires → run → flat → done and never regresses', () => {
    expect(phaseAt(0)).toBe('hero')
    expect(phaseAt(PH.birth0)).toBe('hero')
    expect(phaseAt(PH.glide0 - 0.001)).toBe('hero')
    /* the birth tail plays INSIDE the glide phase now — the beats overlap
       (the caption speaks the file's voyage while the last cards seat) */
    expect(phaseAt(PH.glide0)).toBe('glide')
    expect(phaseAt(PH.wire0 - 0.001)).toBe('glide')
    expect(phaseAt(PH.wire0)).toBe('wires')
    expect(phaseAt(PH.run0 - 0.001)).toBe('wires')
    expect(phaseAt(PH.run0)).toBe('run')
    expect(phaseAt((PH.run0 + PH.run1) / 2)).toBe('run')
    /* the verdict window: the run saturates INTO the flat beat (the exit-0
       sweep lives there), the crossfade lands at flat1 */
    expect(phaseAt(PH.run1)).toBe('flat')
    expect(phaseAt((PH.run1 + PH.flat1) / 2)).toBe('flat')
    expect(phaseAt(PH.flat1)).toBe('done')
    expect(phaseAt(1)).toBe('done')
    /* monotone: scrubbing forward can only advance the phase */
    const order = { hero: 0, glide: 1, wires: 2, run: 3, flat: 4, done: 5 }
    let prev = 0
    for (let p = 0; p <= 1.0001; p += 0.005) {
      const rank = order[phaseAt(p)]
      expect(rank).toBeGreaterThanOrEqual(prev)
      prev = rank
    }
  })
})

describe('bornAt · the rail pays off wave by wave, inside the approach', () => {
  it('wave 0 is silent before birth0 · the LAST wave saturates exactly at birth1 (real corpus)', () => {
    for (const f of FLAGSHIP_ENTRIES) {
      const waveCount = f.plan.waves.length
      expect(bornAt(PH.birth0 - 0.001, 0, waveCount)).toBe(0)
      expect(bornAt(PH.birth1, waveCount - 1, waveCount)).toBe(1)
      /* and therefore every earlier wave too */
      for (let w = 0; w < waveCount; w++) {
        expect(bornAt(PH.birth1, w, waveCount)).toBe(1)
      }
    }
  })

  it('monotone in p, and waves rise in time order (an earlier wave is never behind)', () => {
    for (const f of FLAGSHIP_ENTRIES) {
      const waveCount = f.plan.waves.length
      for (let w = 0; w < waveCount; w++) {
        let prev = 0
        for (let p = 0; p <= PH.birth1 + 0.01; p += 0.002) {
          const b = bornAt(p, w, waveCount)
          expect(b).toBeGreaterThanOrEqual(prev - 1e-9)
          prev = b
        }
      }
      for (let p = PH.birth0; p <= PH.birth1; p += 0.005) {
        for (let w = 1; w < waveCount; w++) {
          expect(bornAt(p, w - 1, waveCount)).toBeGreaterThanOrEqual(
            bornAt(p, w, waveCount),
          )
        }
      }
    }
  })
})

describe('unfoldAt · every card is seated before the wires draw', () => {
  it('silent before its wave is born · EVERY wave seats exactly at unfold1 (real corpus)', () => {
    for (const f of FLAGSHIP_ENTRIES) {
      const waveCount = f.plan.waves.length
      /* a card cannot fly before it exists — wave 0's flight starts after
         its birth onset */
      expect(unfoldAt(PH.birth0, 0, waveCount)).toBe(0)
      for (let w = 0; w < waveCount; w++) {
        expect(unfoldAt(PH.unfold1, w, waveCount)).toBe(1)
      }
    }
  })

  it('monotone in p, waves dealt in order', () => {
    for (const f of FLAGSHIP_ENTRIES) {
      const waveCount = f.plan.waves.length
      for (let w = 0; w < waveCount; w++) {
        let prev = 0
        for (let p = PH.birth0 - 0.01; p <= PH.unfold1 + 0.01; p += 0.002) {
          const u = unfoldAt(p, w, waveCount)
          expect(u).toBeGreaterThanOrEqual(prev - 1e-9)
          prev = u
        }
      }
      for (let p = PH.glide0; p <= PH.glide1; p += 0.005) {
        for (let w = 1; w < waveCount; w++) {
          expect(unfoldAt(p, w - 1, waveCount)).toBeGreaterThanOrEqual(
            unfoldAt(p, w, waveCount),
          )
        }
      }
    }
  })
})

describe('glideAt · the file makes ONE voyage', () => {
  it('0 at glide0, 1 at glide1, monotone between', () => {
    expect(glideAt(PH.glide0)).toBe(0)
    expect(glideAt(0)).toBe(0)
    expect(glideAt(PH.glide1)).toBe(1)
    expect(glideAt(1)).toBe(1)
    let prev = 0
    for (let p = 0; p <= 1.0001; p += 0.005) {
      const g = glideAt(p)
      expect(g).toBeGreaterThanOrEqual(prev - 1e-9)
      prev = g
    }
  })
})

describe('the birth sub-beats · seed flight + the source lines’ glow', () => {
  it('the seed leaves early and lands as the card reaches ~80% grown', () => {
    expect(seedFlightAt(0)).toBe(0)
    expect(seedFlightAt(0.4)).toBeCloseTo(0.5, 6)
    expect(seedFlightAt(0.8)).toBe(1)
    expect(seedFlightAt(0.9)).toBe(1)
    expect(seedFlightAt(1)).toBe(1)
    let prev = 0
    for (let b = 0; b <= 1.0001; b += 0.01) {
      const s = seedFlightAt(b)
      expect(s).toBeGreaterThanOrEqual(prev - 1e-9)
      prev = s
    }
  })

  it('the lines light with the departure and release after the landing — read, never consumed', () => {
    expect(litAt(0)).toBe(0)
    expect(litAt(1)).toBe(0)
    expect(litAt(0.4)).toBeGreaterThan(0.5)
    /* fully lit through the flight's middle */
    expect(litAt(0.25)).toBeCloseTo(1, 6)
    expect(litAt(0.7)).toBeCloseTo(1, 6)
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

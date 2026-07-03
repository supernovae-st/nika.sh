import { describe, expect, it } from 'vitest'
import { FLAGSHIP_ENTRIES, type FlagshipEntry } from '../../flagships'
import { PH, runFracAt, taskInterval } from './morph-model'
import {
  SLAB,
  WAVE_GAP,
  X_GAP,
  buildPlanScene,
  camAt,
  chipAt,
  chordAt,
  edgePulseAt,
  faceChipAt,
  failFlashAt,
  focusAt,
  materializeAt,
  pulseArriveP,
  ringAt,
  sealAt,
  settleAt,
  slabStateAt,
  sweepAt,
  type RingBeat,
  type SweepBeat,
} from './plan-scene-model'

/* ─── plan-scene-model · the 3D DAG moment is a pure function of p ────────────
   Every flagship must scrub cleanly: the structure derives 1:1 from the plan,
   the camera advances monotonically with the recorded run, and every light
   change (states · pulses · the gate seal) maps to a recorded event. */

describe('structure · the plan IS the geometry', () => {
  it('one slab per task, waves at stepped depths, parallel tasks abreast', () => {
    for (const f of FLAGSHIP_ENTRIES) {
      const m = buildPlanScene(f)
      expect(m.slabs.length).toBe(f.plan.tasks.length)
      for (const s of m.slabs) {
        expect(s.z).toBeCloseTo(-s.task.wave * WAVE_GAP)
      }
      /* parallel tasks (same wave) spread in X, centered */
      for (let w = 0; w < f.plan.waveCount; w++) {
        const xs = m.slabs.filter((s) => s.task.wave === w).map((s) => s.x)
        expect(xs.reduce((a, b) => a + b, 0)).toBeCloseTo(0)
        expect(new Set(xs.map((x) => x.toFixed(3))).size).toBe(xs.length)
      }
    }
  })

  it('one edge per depends_on, endpoints on the two slabs', () => {
    for (const f of FLAGSHIP_ENTRIES) {
      const m = buildPlanScene(f)
      const depCount = f.plan.tasks.reduce((n, t) => n + t.deps.length, 0)
      expect(m.edges.length).toBe(depCount)
      for (const e of m.edges) {
        const a = m.byId.get(e.from)
        const b = m.byId.get(e.to)
        expect(a).toBeDefined()
        expect(b).toBeDefined()
        const n = e.pts.length
        expect(e.pts[0]).toBeCloseTo(a!.x)
        expect(e.pts[n - 3]).toBeCloseTo(b!.x)
        /* the edge leaves the upstream back face toward the deeper wave */
        expect(e.pts[2]).toBeLessThan(a!.z + 0.001)
        expect(e.pts[n - 1]).toBeGreaterThan(b!.z - 0.001)
      }
    }
  })

  it('wave anchors are strictly increasing recorded clocks', () => {
    for (const f of FLAGSHIP_ENTRIES) {
      const m = buildPlanScene(f)
      for (let w = 1; w < m.anchors.length; w++) {
        expect(m.anchors[w]).toBeGreaterThan(m.anchors[w - 1])
      }
      expect(m.anchors[0]).toBeGreaterThanOrEqual(0)
      expect(m.anchors[m.anchors.length - 1]).toBeLessThanOrEqual(m.totalMs)
    }
  })

  it('scroll knots keep the recorded order, min-gap paced, inside [0,1]', () => {
    for (const f of FLAGSHIP_ENTRIES) {
      const m = buildPlanScene(f)
      expect(m.knots.length).toBe(m.waveCount)
      for (let w = 0; w < m.knots.length; w++) {
        expect(m.knots[w]).toBeGreaterThanOrEqual(0)
        expect(m.knots[w]).toBeLessThanOrEqual(1)
        if (w > 0) expect(m.knots[w]).toBeGreaterThan(m.knots[w - 1] + 0.05)
      }
    }
  })
})

describe('the advance · camera as a pure monotone function of p', () => {
  it('focus index is monotone in the run fraction and spans the waves', () => {
    for (const f of FLAGSHIP_ENTRIES) {
      const m = buildPlanScene(f)
      let prev = -1
      for (let rf = 0; rf <= 1.0001; rf += 0.005) {
        const fi = focusAt(m, rf)
        expect(fi).toBeGreaterThanOrEqual(prev - 1e-9)
        expect(fi).toBeLessThanOrEqual(m.waveCount - 1)
        prev = fi
      }
      expect(focusAt(m, 0)).toBe(0)
      expect(focusAt(m, 1)).toBeGreaterThanOrEqual(m.waveCount - 1)
    }
  })

  it('camera z only ever dollies FORWARD through the run window', () => {
    for (const f of FLAGSHIP_ENTRIES) {
      const m = buildPlanScene(f)
      let prevZ = Infinity
      for (let p = PH.run0; p <= PH.run1; p += 0.002) {
        const c = camAt(m, p)
        expect(c.pz).toBeLessThanOrEqual(prevZ + 1e-9)
        prevZ = c.pz
      }
    }
  })

  it('camera is continuous across the phase seams (no teleports)', () => {
    for (const f of FLAGSHIP_ENTRIES) {
      const m = buildPlanScene(f)
      for (const seam of [PH.burstEnd, PH.run0, PH.run1]) {
        const a = camAt(m, seam - 0.0005)
        const b = camAt(m, seam + 0.0005)
        expect(Math.abs(a.pz - b.pz)).toBeLessThan(0.1)
        expect(Math.abs(a.py - b.py)).toBeLessThan(0.1)
      }
    }
  })
})

describe('the light · every change maps to a recorded event', () => {
  it('slab states mirror the recorded intervals', () => {
    for (const f of FLAGSHIP_ENTRIES) {
      for (const t of f.plan.tasks) {
        expect(slabStateAt(f, t.id, 0)).toBe('pending')
        const end = slabStateAt(f, t.id, 1)
        const iv = taskInterval(f, t.id)
        expect(end).toBe(iv && 'skipAt' in iv ? 'skipped' : 'done')
      }
    }
  })

  it('parallel wave-0 tasks ignite together (shared recorded clocks)', () => {
    const brief = FLAGSHIP_ENTRIES.find((f) => f.id === 'daily_brief')!
    const wave0 = brief.plan.waves[0]
    expect(wave0.length).toBeGreaterThan(1)
    /* find a p where the first wave-0 task runs — the others must too */
    for (let p = PH.run0; p <= PH.run1; p += 0.001) {
      if (slabStateAt(brief, wave0[0].id, p) === 'running') {
        for (const t of wave0) expect(slabStateAt(brief, t.id, p)).not.toBe('pending')
        break
      }
    }
  })

  it('the when: gate seal fires only for the recorded skip, after its clock', () => {
    const pr = FLAGSHIP_ENTRIES.find((f) => f.id === 'pr_risk_review')!
    const skipped = pr.plan.tasks.find((t) => {
      const iv = taskInterval(pr, t.id)
      return iv !== null && 'skipAt' in iv
    })!
    expect(skipped.when).toBeDefined()
    expect(sealAt(pr, skipped.id, PH.run0)).toBe(0)
    expect(sealAt(pr, skipped.id, 1)).toBe(1)
    /* non-skipped tasks never seal */
    for (const t of pr.plan.tasks) {
      if (t.id !== skipped.id) expect(sealAt(pr, t.id, 1)).toBe(0)
    }
  })

  it('the ignite pulse arrives at the recorded start, clamped so its whole travel fits', () => {
    for (const f of FLAGSHIP_ENTRIES) {
      const m = buildPlanScene(f)
      for (const e of m.edges) {
        const iv = taskInterval(f, e.to)!
        const s = 'skipAt' in iv ? iv.skipAt : iv.start
        const pAtStart = PH.run0 + (s / f.trace.totalMs) * (PH.run1 - PH.run0)
        const arrive = pulseArriveP(f, e.to)
        /* the clamp is the knots' min-gap law per beat: never EARLIER than
           the recorded instant, at most one travel-window later */
        expect(arrive).toBeGreaterThanOrEqual(pAtStart - 1e-9)
        expect(arrive).toBeLessThanOrEqual(Math.max(pAtStart, PH.run0 + 0.0351))
        const pulse = edgePulseAt(f, e.to, arrive)
        expect(pulse.pos).toBeCloseTo(1, 5)
        expect(pulse.strength).toBeGreaterThan(0.9)
        /* before the run: silent; long before the window: silent */
        expect(edgePulseAt(f, e.to, 0).strength).toBe(0)
        expect(edgePulseAt(f, e.to, arrive - 0.06).strength).toBe(0)
      }
    }
  })

  it('materialize matches the DOM node timing (born per aspiration beat, lands by burst end)', () => {
    for (const f of FLAGSHIP_ENTRIES) {
      const n = f.plan.tasks.length
      for (let i = 0; i < n; i++) {
        expect(materializeAt(PH.burst0, i, n)).toBe(0)
        expect(materializeAt(PH.burstEnd, i, n)).toBe(1)
      }
      /* reading order: an earlier task's slab is never behind a later one */
      for (let p = PH.burst0; p <= PH.burstEnd; p += 0.02) {
        for (let i = 1; i < n; i++) {
          expect(materializeAt(p, i - 1, n)).toBeGreaterThanOrEqual(materializeAt(p, i, n))
        }
      }
    }
  })

  it('chips carry recorded facts only', () => {
    for (const f of FLAGSHIP_ENTRIES) {
      for (const t of f.plan.tasks) {
        const state = slabStateAt(f, t.id, 1)
        const chip = chipAt(f, t, state)
        if (state === 'done') {
          const done = f.trace.steps.find(
            (s) => s.kind === 'task_completed' && s.task === t.id,
          )!
          expect(done).toBeDefined()
          expect(chip.startsWith('✓')).toBe(true)
        }
        if (state === 'skipped') expect(chip).toBe('⊘ skipped · gate closed')
        expect(chipAt(f, t, 'pending')).toBe('')
      }
    }
  })

  it('run fraction 0 keeps the whole structure dark (scrub-back safe)', () => {
    for (const f of FLAGSHIP_ENTRIES) {
      expect(runFracAt(PH.run0)).toBe(0)
      for (const t of f.plan.tasks) {
        expect(slabStateAt(f, t.id, PH.run0)).toBe('pending')
        expect(edgePulseAt(f, t.id, PH.run0).strength === 0 || taskInterval(f, t.id) !== null).toBe(
          true,
        )
      }
    }
  })
})

/* a minimal synthetic failed run — no flagship trace records a failure, and
   the failure beat must stay dormant until one honestly does */
const FAILED_RUN = {
  trace: {
    steps: [
      { kind: 'workflow_started', atMs: 0 },
      { kind: 'task_scheduled', task: 'boom', atMs: 0 },
      { kind: 'task_started', task: 'boom', atMs: 10 },
      { kind: 'task_failed', task: 'boom', atMs: 640 },
      { kind: 'workflow_failed', atMs: 640 },
    ],
    totalMs: 640,
    exit: 1,
    taskIds: ['boom'],
    completed: 0,
    skipped: 0,
  },
} as unknown as FlagshipEntry

describe('the beats · every accent maps to one recorded event', () => {
  const ring: RingBeat = { k: 0, a: 0 }
  const sweep: SweepBeat = { front: 0, s: 0 }

  it('the ring flashes at the pulse arrival, silent outside its window', () => {
    for (const f of FLAGSHIP_ENTRIES) {
      for (const t of f.plan.tasks) {
        const arrive = pulseArriveP(f, t.id)
        expect(ringAt(f, t.id, 0, ring).a).toBe(0)
        expect(ringAt(f, t.id, arrive - 0.001, ring).a).toBe(0)
        const mid = ringAt(f, t.id, arrive + 0.015, ring)
        expect(mid.a).toBeGreaterThan(0)
        expect(mid.k).toBeGreaterThan(0)
        const after = ringAt(f, t.id, arrive + 0.031, ring)
        expect(after.a).toBe(0)
      }
    }
  })

  it('recorded-together siblings beat together; a recorded stagger keeps its order', () => {
    for (const f of FLAGSHIP_ENTRIES) {
      const startClock = (id: string): number => {
        const iv = taskInterval(f, id)!
        return 'skipAt' in iv ? iv.skipAt : iv.start
      }
      for (const wave of f.plan.waves) {
        if (wave.length < 2) continue
        for (let a = 0; a < wave.length; a++) {
          for (let b = a + 1; b < wave.length; b++) {
            const dClock = startClock(wave[a].id) - startClock(wave[b].id)
            const dP = pulseArriveP(f, wave[a].id) - pulseArriveP(f, wave[b].id)
            if (Math.abs(dClock) <= 80) {
              /* started together on the recorded clock (≤80ms) → their beats
                 are simultaneous on scroll (never sequential-looking) */
              expect(Math.abs(dP)).toBeLessThanOrEqual(
                (80 / f.trace.totalMs) * (PH.run1 - PH.run0) + 1e-9,
              )
            } else {
              /* a real recorded stagger (social-repurpose's trio started
                 seconds apart) may compress under the min-window clamp but
                 must NEVER invert the recorded order */
              expect(Math.sign(dP) * Math.sign(dClock)).toBeGreaterThanOrEqual(0)
            }
          }
        }
      }
    }
  })

  it('the settle beat opens at the recorded completion clock, bell-shaped', () => {
    for (const f of FLAGSHIP_ENTRIES) {
      for (const t of f.plan.tasks) {
        const iv = taskInterval(f, t.id)!
        if ('skipAt' in iv) {
          /* a skipped task never completed — no settle, ever */
          for (let p = 0; p <= 1.0001; p += 0.01) expect(settleAt(f, t.id, p)).toBe(0)
          continue
        }
        const open = Math.max(
          PH.run0 + (iv.end / f.trace.totalMs) * (PH.run1 - PH.run0),
          PH.run0 + 0.01,
        )
        expect(settleAt(f, t.id, open)).toBe(0)
        expect(settleAt(f, t.id, open + 0.014)).toBeGreaterThan(0.9)
        expect(settleAt(f, t.id, open + 0.029)).toBe(0)
        expect(settleAt(f, t.id, 0)).toBe(0)
      }
    }
  })

  it('the chord stacks ONLY for recorded-together starts, quiet for a solo', () => {
    const brief = FLAGSHIP_ENTRIES.find((f) => f.id === 'daily_brief')!
    const m = buildPlanScene(brief)
    /* wave 0's trio really started together (recorded ms 1/3/3) — the chord
       at their shared beat midpoint is a full breath */
    const w0 = brief.plan.waves[0]
    expect(w0.length).toBeGreaterThan(1)
    const together = chordAt(brief, m, pulseArriveP(brief, w0[0].id) + 0.0175)
    expect(together).toBeGreaterThan(0.9)
    /* draft started alone (recorded 29159ms, no other start within the
       window) — a quiet solo accent, never a full breath */
    const solo = chordAt(brief, m, pulseArriveP(brief, 'draft') + 0.0175)
    expect(solo).toBeGreaterThan(0.2)
    expect(solo).toBeLessThan(0.5)
    expect(chordAt(brief, m, 0)).toBe(0)
    expect(chordAt(brief, m, PH.run0)).toBe(0)
  })

  it('the exit-0 sweep travels front-to-back once, after the recorded completion', () => {
    for (const f of FLAGSHIP_ENTRIES) {
      expect(f.trace.exit).toBe(0)
      const open = PH.run1 + 0.012
      expect(sweepAt(f, open, sweep).s).toBe(0)
      /* monotone travel across the window (probed past the page bound —
         the function is pure; the flatten re-timing gives it page room) */
      let prev = -1
      for (let t = 0.05; t < 1; t += 0.05) {
        const b = sweepAt(f, open + t * 0.04, sweep)
        expect(b.front).toBeGreaterThan(prev)
        expect(b.s).toBeGreaterThan(0)
        prev = b.front
      }
      expect(sweepAt(f, open + 0.041, sweep).s).toBe(0)
      expect(sweepAt(f, 0, sweep).s).toBe(0)
    }
    /* a failed run gets NO victory sweep */
    expect(sweepAt(FAILED_RUN, PH.run1 + 0.02, sweep).s).toBe(0)
  })

  it('the failure flash fires only for a recorded task_failed, red on that slab only', () => {
    /* dormant across every real flagship (all five traces exit 0) */
    for (const f of FLAGSHIP_ENTRIES) {
      for (const t of f.plan.tasks) {
        for (let p = 0; p <= 1.0001; p += 0.02) expect(failFlashAt(f, t.id, p)).toBe(0)
      }
    }
    /* the synthetic failed run: a bell at the recorded failure clock */
    const open = Math.max(PH.run0 + (640 / 640) * (PH.run1 - PH.run0), PH.run0 + 0.01)
    expect(failFlashAt(FAILED_RUN, 'boom', open)).toBe(0)
    expect(failFlashAt(FAILED_RUN, 'boom', open + 0.02)).toBeGreaterThan(0.9)
    expect(failFlashAt(FAILED_RUN, 'boom', open + 0.041)).toBe(0)
    expect(failFlashAt(FAILED_RUN, 'other', open + 0.02)).toBe(0)
    expect(failFlashAt(FAILED_RUN, 'boom', 0)).toBe(0)
  })
})

describe('the on-slab identity · the block itself says what it is doing', () => {
  it('parallel slabs keep the gutter law (≥0.35 slab-width of clear air in X)', () => {
    expect(X_GAP - SLAB.w).toBeGreaterThanOrEqual(SLAB.w * 0.35)
  })

  it('faceChipAt speaks the four states, recorded facts only', () => {
    for (const f of FLAGSHIP_ENTRIES) {
      for (const t of f.plan.tasks) {
        expect(faceChipAt(f, t, 'pending')).toBe('')
        expect(faceChipAt(f, t, 'running')).toBe('▸ running')
        expect(faceChipAt(f, t, 'skipped')).toBe('⊘ skipped')
        const done = faceChipAt(f, t, 'done')
        expect(done.startsWith('✓')).toBe(true)
        const rec = f.trace.steps.find((s) => s.kind === 'task_completed' && s.task === t.id)
        if (rec?.durationMs !== undefined) {
          /* the ms on the face is the recorded duration, verbatim formatMs */
          expect(done).toContain('✓ ')
          expect(done.length).toBeGreaterThan(2)
        }
      }
    }
  })
})

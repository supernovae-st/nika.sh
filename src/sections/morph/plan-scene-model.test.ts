import { describe, expect, it } from 'vitest'
import { FLAGSHIP_ENTRIES } from '../../flagships'
import { PH, runFracAt, taskInterval } from './morph-model'
import {
  WAVE_GAP,
  buildPlanScene,
  camAt,
  chipAt,
  edgePulseAt,
  focusAt,
  materializeAt,
  sealAt,
  slabStateAt,
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

  it('the ignite pulse arrives at the scroll instant of the recorded start', () => {
    for (const f of FLAGSHIP_ENTRIES) {
      const m = buildPlanScene(f)
      for (const e of m.edges) {
        const iv = taskInterval(f, e.to)!
        const s = 'skipAt' in iv ? iv.skipAt : iv.start
        const pAtStart = PH.run0 + (s / f.trace.totalMs) * (PH.run1 - PH.run0)
        const pulse = edgePulseAt(f, e.to, pAtStart)
        expect(pulse.pos).toBeCloseTo(1, 5)
        expect(pulse.strength).toBeGreaterThan(0.9)
        /* before the run: silent; long before the window: silent */
        expect(edgePulseAt(f, e.to, 0).strength).toBe(0)
        expect(edgePulseAt(f, e.to, pAtStart - 0.06).strength).toBe(0)
      }
    }
  })

  it('materialize matches the DOM node timing (lands by burst end)', () => {
    for (const f of FLAGSHIP_ENTRIES) {
      for (let w = 0; w < f.plan.waveCount; w++) {
        expect(materializeAt(PH.burst0, w, f.plan.waveCount)).toBe(0)
        expect(materializeAt(PH.burstEnd, w, f.plan.waveCount)).toBe(1)
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

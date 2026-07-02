import { describe, expect, it } from 'vitest'
import { DAG } from './living-data'
import { runStateAt } from './run-model'
import { buildMobilePlan, chipFor, formatDuration } from './mobile-model'

/* the vertical (mobile) plan mapping · the 2-up timeline the phone renders.
   The desktop choreography and the mobile flow MUST read the same DAG the same
   way — these tests pin the mapping to the run-model's deterministic order. */

describe('buildMobilePlan · the vertical plan', () => {
  const plan = buildMobilePlan(DAG)

  it('renders one wave per DAG wave, top→down in wave order', () => {
    expect(plan).toHaveLength(DAG.waves)
    expect(plan.map((w) => w.wave)).toEqual([...Array(DAG.waves).keys()])
  })

  it('keeps every task exactly once (nothing dropped, nothing doubled)', () => {
    const ids = plan.flatMap((w) => w.tasks.map((t) => t.id)).sort()
    expect(ids).toEqual(DAG.tasks.map((t) => t.id).sort())
  })

  it('chunks parallel waves into rows of at most 2 (the 2-up constraint)', () => {
    for (const wave of plan) {
      for (const row of wave.rows) expect(row.length).toBeLessThanOrEqual(2)
      expect(wave.rows.flat()).toEqual(wave.tasks)
    }
  })

  it('flags exactly the multi-task waves as parallel (the "run together" caption)', () => {
    for (const wave of plan) expect(wave.parallel).toBe(wave.tasks.length > 1)
    // the daily-brief fil-rouge: two 4-wide gather/read waves + a 4-step chain
    expect(plan.filter((w) => w.parallel)).toHaveLength(2)
    expect(plan[0].rows).toHaveLength(2) // 4 tasks → two 2-up rows
  })

  it('orders tasks within a wave by file position (line0) — run-model parity', () => {
    for (const wave of plan) {
      const lines = wave.tasks.map((t) => t.line0)
      expect(lines).toEqual([...lines].sort((a, b) => a - b))
    }
  })

  it('respects topology: every dep lives in a strictly earlier wave', () => {
    const waveOf = new Map(DAG.tasks.map((t) => [t.id, t.wave]))
    for (const task of DAG.tasks)
      for (const dep of task.deps) expect(waveOf.get(dep)!).toBeLessThan(task.wave)
  })
})

describe('chipFor · the inline telemetry chip', () => {
  const end = runStateAt(DAG, 1) // the fully-executed deterministic end state

  it('formats a settled node as "<dur>s · <output>"', () => {
    const chip = chipFor(end.nodes['inbox'])
    expect(chip).toMatch(/^\d+\.\d+s · .+$/)
  })

  it('collapses the bare "ok" output to the duration alone', () => {
    const okNode = { ...end.nodes['triage'], output: 'ok' }
    expect(chipFor(okNode)).toMatch(/^\d+\.\d+s$/)
  })

  it('returns null for pending / running nodes (no fabricated telemetry)', () => {
    const start = runStateAt(DAG, 0)
    expect(chipFor(start.nodes['inbox'])).toBeNull()
    expect(chipFor(undefined)).toBeNull()
  })

  it('is deterministic — same run state, same chips', () => {
    const again = runStateAt(DAG, 1)
    for (const t of DAG.tasks) expect(chipFor(again.nodes[t.id])).toBe(chipFor(end.nodes[t.id]))
  })
})

describe('formatDuration', () => {
  it('renders compact seconds with one decimal', () => {
    expect(formatDuration(1900)).toBe('1.9s')
    expect(formatDuration(180)).toBe('0.2s')
    expect(formatDuration(3500)).toBe('3.5s')
  })
})

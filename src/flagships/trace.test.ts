import { describe, expect, it } from 'vitest'
import { FLAGSHIP_ENTRIES } from './index'
import { formatMs, parseTrace } from './trace-parse'

/* ── trace · the recorded run must be REAL and must match ITS file ───────────
   The honesty gate behind the « recorded from a real nika run » caption:
   every flagship ships the verbatim NDJSON its own run streamed. This suite
   pins (a) the wire shape, (b) run success, and (c) trace↔file coherence —
   every task the engine scheduled exists in the YAML with the same verb, and
   every YAML task was scheduled. A flagship that cannot honestly claim its
   caption fails here, at build time, not in front of a visitor. */

describe.each(FLAGSHIP_ENTRIES.map((f) => [f.filename, f] as const))(
  'trace · %s',
  (_filename, entry) => {
    const { trace, plan } = entry

    it('is a completed real run (exit 0)', () => {
      expect(trace.exit).toBe(0)
      expect(trace.steps[0].kind).toBe('workflow_started')
      expect(trace.steps[trace.steps.length - 1].kind).toBe('workflow_completed')
      expect(trace.totalMs).toBeGreaterThan(0)
    })

    it('schedules exactly the file’s task set', () => {
      expect([...trace.taskIds].sort()).toEqual(plan.tasks.map((t) => t.id).sort())
    })

    it('every task settles: completed, or skipped by its declared when: gate', () => {
      for (const t of plan.tasks) {
        const settled = trace.steps.find(
          (s) => s.task === t.id && (s.kind === 'task_completed' || s.kind === 'task_skipped'),
        )
        expect(settled, `task ${t.id} never settled`).toBeDefined()
        // only a when:-gated task may be skipped
        if (settled?.kind === 'task_skipped') expect(t.when).toBeDefined()
      }
    })

    it('the engine’s note names the SAME verb the file declares (per task)', () => {
      for (const s of trace.steps) {
        if (s.kind !== 'task_started' || !s.task || !s.note) continue
        const declared = plan.tasks.find((t) => t.id === s.task)
        expect(declared, `trace task ${s.task} missing from the file`).toBeDefined()
        expect(s.note.startsWith(`${declared?.verb} ·`), `${s.task}: "${s.note}"`).toBe(true)
      }
    })

    it('the recorded clock is monotonic', () => {
      for (let i = 1; i < trace.steps.length; i++) {
        expect(trace.steps[i].atMs).toBeGreaterThanOrEqual(trace.steps[i - 1].atMs)
      }
    })

    it('real work happened (tokens where the file infers · completed effects)', () => {
      expect(trace.completed).toBeGreaterThanOrEqual(3)
      // token counts are the honesty signal of a model call — required exactly
      // when the file declares inference. A zero-model flagship (price-watch)
      // honestly records NO tokens: its real work is the completed effects.
      const infers = plan.tasks.some((t) => t.verb === 'infer' || t.verb === 'agent')
      expect(trace.steps.some((s) => (s.tokens ?? 0) > 0)).toBe(infers)
    })
  },
)

describe('parseTrace · wire shape', () => {
  it('rejects an empty trace', () => {
    expect(() => parseTrace('')).toThrow('empty trace')
  })
})

describe('formatMs', () => {
  it('renders the three duration registers', () => {
    expect(formatMs(480)).toBe('480ms')
    expect(formatMs(21308)).toBe('21.3s')
    expect(formatMs(125_000)).toBe('2m05s')
  })
})

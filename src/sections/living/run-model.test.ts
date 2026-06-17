import { describe, expect, it } from 'vitest'
import type { ShowcaseDag } from '../usecases-yaml.generated'
import { SHOWCASE_DAG } from '../usecases-yaml.generated'
import { CLI_GLYPH, NDJSON_KINDS, runStateAt } from './run-model'
import type { TaskStatus } from './run-model'

/* ── run-model · the deterministic heart of the Living File centerpiece ──
   PURE LOGIC, no UI. Given a ShowcaseDag + scroll progress t ∈ [0,1] it
   returns every node's state + the event log in BOTH the CLI pretty format
   AND real NDJSON. Tests written FIRST (TDD) — this drives 2D DAG, 3D
   corridor and the event stream, so it is unit-tested hard. */

/* A tiny hand-built diamond DAG · two parallel-then-merge branches.
   Mirrors the ShowcaseTask shape exactly. waves: 0 → {a} · 1 → {b,c} · 2 → {d}. */
const DIAMOND: ShowcaseDag = {
  tasks: [
    { id: 'a', verb: 'invoke', deps: [], wave: 0, gate: 'default', gloss: 'call `nika:fetch`', flags: [], line0: 1, line1: 4 },
    { id: 'b', verb: 'infer', deps: ['a'], wave: 1, gate: 'default', gloss: 'ask the model', flags: [], line0: 6, line1: 9 },
    { id: 'c', verb: 'exec', deps: ['a'], wave: 1, gate: 'default', gloss: 'run `git`', flags: [], line0: 11, line1: 13 },
    { id: 'd', verb: 'agent', deps: ['b', 'c'], wave: 2, gate: 'default', gloss: 'run an agent loop', flags: [], line0: 15, line1: 20 },
  ],
  outputs: ['result'],
  waves: 3,
}

const STANDUP = SHOWCASE_DAG['t1-standup-digest'] // a real spec workflow

const ALL_STATUSES: TaskStatus[] = ['pending', 'running', 'success', 'failure', 'skipped', 'cancelled']

describe('runStateAt · t=0 (nothing has started)', () => {
  it('marks every node pending and emits no cli/events', () => {
    const s = runStateAt(DIAMOND, 0)
    expect(Object.keys(s.nodes).sort()).toEqual(['a', 'b', 'c', 'd'])
    for (const id of Object.keys(s.nodes)) {
      expect(s.nodes[id].status).toBe('pending')
      expect(s.nodes[id].startedAtMs).toBeNull()
      expect(s.nodes[id].endedAtMs).toBeNull()
      expect(s.nodes[id].durationMs).toBeNull()
    }
    expect(s.cli).toEqual([])
    expect(s.events).toEqual([])
    expect(s.exitCode).toBeNull()
    expect(s.progress).toBe(0)
  })
})

describe('runStateAt · t=1 (the whole run is done)', () => {
  const s = runStateAt(DIAMOND, 1)

  it('marks every node success with a real duration', () => {
    for (const id of Object.keys(s.nodes)) {
      expect(s.nodes[id].status).toBe('success')
      expect(s.nodes[id].startedAtMs).not.toBeNull()
      expect(s.nodes[id].endedAtMs).not.toBeNull()
      expect(s.nodes[id].durationMs).toBeGreaterThan(0)
      // ended after started · duration is the difference
      expect(s.nodes[id].endedAtMs! - s.nodes[id].startedAtMs!).toBe(s.nodes[id].durationMs)
    }
  })

  it('exit code is 0 and the last event is workflow.completed (success)', () => {
    expect(s.exitCode).toBe(0)
    const last = s.events[s.events.length - 1]
    expect(last.kind).toBe('workflow.completed')
    expect(last.payload.status).toBe('success')
    expect(last.payload.exit).toBe(0)
  })

  it('begins with workflow.started', () => {
    expect(s.events[0].kind).toBe('workflow.started')
  })

  it('cli ends with the stdout outputs block + exit 0', () => {
    const joined = s.cli.join('\n')
    expect(joined).toMatch(/outputs \(stdout\)/)
    expect(s.cli[s.cli.length - 1]).toMatch(/exit 0/)
  })
})

describe('runStateAt · topological invariant (no node ahead of its deps)', () => {
  const advanced = (st: TaskStatus) => st === 'running' || st === 'success'

  for (const dag of [DIAMOND, STANDUP]) {
    it(`holds across 50 sampled t for ${dag.tasks.map((t) => t.id).join(',')}`, () => {
      for (let i = 0; i <= 50; i++) {
        const t = i / 50
        const s = runStateAt(dag, t)
        for (const task of dag.tasks) {
          const node = s.nodes[task.id]
          if (advanced(node.status)) {
            // every dependency MUST already be success
            for (const dep of task.deps) {
              expect(s.nodes[dep].status).toBe('success')
            }
          }
          // a node is never success before it was running's time window — i.e.
          // a success node has both timestamps; a pending node has neither
          if (node.status === 'success') {
            expect(node.startedAtMs).not.toBeNull()
            expect(node.endedAtMs).not.toBeNull()
          }
          if (node.status === 'pending') {
            expect(node.startedAtMs).toBeNull()
          }
        }
      }
    })
  }
})

describe('runStateAt · a parallel wave runs together', () => {
  it('there is a t where b and c are both running (same wave)', () => {
    let foundBoth = false
    for (let i = 0; i <= 200; i++) {
      const s = runStateAt(DIAMOND, i / 200)
      if (s.nodes.b.status === 'running' && s.nodes.c.status === 'running') {
        foundBoth = true
        // and their dep `a` is already success
        expect(s.nodes.a.status).toBe('success')
        break
      }
    }
    expect(foundBoth).toBe(true)
  })

  it('the two same-wave nodes share the same wave time window', () => {
    const s = runStateAt(DIAMOND, 1)
    // both started after `a` ended, both within wave-1 slice
    expect(s.nodes.b.startedAtMs).toBe(s.nodes.c.startedAtMs)
  })
})

describe('NDJSON event stream · shape + closed kind set', () => {
  const s = runStateAt(DIAMOND, 1)

  it('every event has the exact Event shape { id, run_id, kind, timestamp_ms, payload }', () => {
    for (const e of s.events) {
      expect(typeof e.id).toBe('string')
      expect(e.id.length).toBeGreaterThan(0)
      expect(typeof e.run_id).toBe('string')
      expect(typeof e.kind).toBe('string')
      expect(typeof e.timestamp_ms).toBe('number')
      expect(typeof e.payload).toBe('object')
      expect(e.payload).not.toBeNull()
    }
  })

  it('all kinds come from the closed canonical set', () => {
    for (const e of s.events) {
      expect(NDJSON_KINDS).toContain(e.kind)
    }
  })

  it('event ids are unique and deterministic across runs', () => {
    const ids = s.events.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    const s2 = runStateAt(DIAMOND, 1)
    expect(s2.events.map((e) => e.id)).toEqual(ids)
  })

  it('timestamps are monotonically non-decreasing', () => {
    for (let i = 1; i < s.events.length; i++) {
      expect(s.events[i].timestamp_ms).toBeGreaterThanOrEqual(s.events[i - 1].timestamp_ms)
    }
  })

  it('emits task.started → task.completed per task, with duration_ms on completed', () => {
    for (const task of DIAMOND.tasks) {
      const started = s.events.find((e) => e.kind === 'task.started' && e.payload.task_id === task.id)
      const completed = s.events.find((e) => e.kind === 'task.completed' && e.payload.task_id === task.id)
      expect(started).toBeTruthy()
      expect(completed).toBeTruthy()
      expect(typeof completed!.payload.duration_ms).toBe('number')
      expect(completed!.payload.duration_ms as number).toBeGreaterThan(0)
    }
  })

  it('emits verb-specific sub-events (infer.delta, exec.output, invoke.result, agent turn)', () => {
    const kinds = new Set(s.events.map((e) => e.kind))
    expect(kinds.has('infer.delta')).toBe(true) // b is infer
    expect(kinds.has('exec.output')).toBe(true) // c is exec
    expect(kinds.has('invoke.result')).toBe(true) // a is invoke
    // d is agent → an agent turn event exists
    const agentEv = s.events.find((e) => e.payload.task_id === 'd' && e.kind.startsWith('task') === false)
    expect(agentEv).toBeTruthy()
  })
})

describe('CLI pretty format', () => {
  const s = runStateAt(DIAMOND, 1)

  it('a completed line matches "✓ <id>  T+mm:ss.ms  <result>"', () => {
    const doneLines = s.cli.filter((l) => l.startsWith(CLI_GLYPH.done))
    expect(doneLines.length).toBeGreaterThan(0)
    for (const l of doneLines) {
      // ✓ a  T+00:00.21  <something>
      expect(l).toMatch(/^✓ \w+\s+T\+\d{2}:\d{2}\.\d+/)
    }
  })

  it('a running line shows the verb and a → target', () => {
    // sample mid-run so a node is running
    let runLine: string | undefined
    for (let i = 0; i <= 200; i++) {
      const st = runStateAt(DIAMOND, i / 200)
      runLine = st.cli.find((l) => l.startsWith(CLI_GLYPH.run))
      if (runLine) break
    }
    expect(runLine).toBeTruthy()
    expect(runLine).toMatch(/▶ \w+\s+\w+\s+→ /)
  })

  it('infer running line targets a model; invoke targets nika:<tool>', () => {
    // at t=1 nothing is running; build a mid-wave sample to inspect targets via the run line
    // instead assert via the deterministic full happy stream by scanning all sampled run lines
    const targets = new Set<string>()
    for (let i = 0; i <= 300; i++) {
      const st = runStateAt(DIAMOND, i / 300)
      for (const l of st.cli) {
        if (l.startsWith(CLI_GLYPH.run)) targets.add(l)
      }
    }
    const joined = [...targets].join('\n')
    expect(joined).toMatch(/b\s+infer\s+→ \S+\/\S+/) // model id like ollama/qwen2.5 or mock/echo
    expect(joined).toMatch(/a\s+invoke\s+→ nika:\w+/) // nika:<tool>
  })
})

describe('runStateAt · failure path (opts.failAt)', () => {
  // fail the infer node `b` (wave 1) → `d` depends on b (default gate) → cancelled
  const s = runStateAt(DIAMOND, 1, { failAt: 'b' })

  it('the failed node has status failure + a TypedError from the catalog', () => {
    expect(s.nodes.b.status).toBe('failure')
    const err = s.nodes.b.error
    expect(err).toBeTruthy()
    expect(err!.code).toMatch(/^NIKA-[A-Z]+-\d{3}$/)
    expect(err!.task_id).toBe('b')
    expect(typeof err!.transient).toBe('boolean')
    expect(typeof err!.attempt).toBe('number')
    expect(err!.category.length).toBeGreaterThan(0)
    expect(err!.message.length).toBeGreaterThan(0)
  })

  it('downstream dependents (default gate) become cancelled', () => {
    // d depends on b → cancelled
    expect(s.nodes.d.status).toBe('cancelled')
  })

  it('a sibling on the same wave that does NOT depend on the victim still succeeds', () => {
    // c is wave 1 too but depends only on a → unaffected → success
    expect(s.nodes.c.status).toBe('success')
  })

  it('events end with task.failed then workflow.completed(failure) · exit 1', () => {
    expect(s.exitCode).toBe(1)
    const failed = s.events.find((e) => e.kind === 'task.failed')
    expect(failed).toBeTruthy()
    expect(failed!.payload.task_id).toBe('b')
    const last = s.events[s.events.length - 1]
    expect(last.kind).toBe('workflow.completed')
    expect(last.payload.status).toBe('failure')
    expect(last.payload.exit).toBe(1)
  })

  it('cli shows ✗ <id> <CODE> and ⊘ <id> cancelled', () => {
    const joined = s.cli.join('\n')
    expect(joined).toMatch(/✗ b\s+NIKA-[A-Z]+-\d{3}/)
    expect(joined).toMatch(/⊘ d\s+cancelled/)
    expect(s.cli[s.cli.length - 1]).toMatch(/exit 1/)
  })

  it('no task.completed is emitted for the failed node', () => {
    const completed = s.events.find((e) => e.kind === 'task.completed' && e.payload.task_id === 'b')
    expect(completed).toBeUndefined()
  })

  it('a cancelled node never DISPATCHES: no task.started event, no ▶ row before its ⊘', () => {
    // d is cancelled (depends on failed b · default gate). In real engine
    // semantics a cancelled task is never dispatched, so it must NOT emit a
    // task.started, and the CLI must NOT show a ▶ d row.
    const started = s.events.find((e) => e.kind === 'task.started' && e.payload.task_id === 'd')
    expect(started).toBeUndefined()
    // the cancellation IS surfaced as a task.cancelled event though
    const cancelled = s.events.find((e) => e.kind === 'task.cancelled' && e.payload.task_id === 'd')
    expect(cancelled).toBeTruthy()
    // CLI: no `▶ d` row, and the only d row is its `⊘ d cancelled`
    const dRows = s.cli.filter((l) => /(^|\s)d(\s|$)/.test(l) && (l.startsWith(CLI_GLYPH.run) || l.startsWith(CLI_GLYPH.cancel)))
    const runRowForD = s.cli.find((l) => l.startsWith(`${CLI_GLYPH.run} `) && /\bd\b/.test(l.slice(0, 12)))
    expect(runRowForD).toBeUndefined()
    expect(dRows.some((l) => l.startsWith(CLI_GLYPH.cancel) && /\bd\b/.test(l))).toBe(true)
  })

  it('a cancelled node carries a null startedAtMs (it never got a start time)', () => {
    expect(s.nodes.d.status).toBe('cancelled')
    expect(s.nodes.d.startedAtMs).toBeNull()
    expect(s.nodes.d.endedAtMs).toBeNull()
    expect(s.nodes.d.durationMs).toBeNull()
  })
})

describe('runStateAt · skipped node (when gate) never dispatches', () => {
  // a `when`-gated downstream of a failed node becomes `skipped` — and like
  // cancelled, it never dispatches: no task.started, no ▶ row, null start time.
  const WHEN_DAG: ShowcaseDag = {
    tasks: [
      { id: 'a', verb: 'invoke', deps: [], wave: 0, gate: 'default', gloss: 'call `nika:fetch`', flags: [], line0: 1, line1: 4 },
      { id: 'g', verb: 'exec', deps: ['a'], wave: 1, gate: 'when', gloss: 'run `git`', flags: [], line0: 6, line1: 9 },
    ],
    outputs: ['result'],
    waves: 2,
  }
  const s = runStateAt(WHEN_DAG, 1, { failAt: 'a' })

  it('the when-gated downstream is skipped with a null start time and no task.started', () => {
    expect(s.nodes.g.status).toBe('skipped')
    expect(s.nodes.g.startedAtMs).toBeNull()
    const started = s.events.find((e) => e.kind === 'task.started' && e.payload.task_id === 'g')
    expect(started).toBeUndefined()
    const runRow = s.cli.find((l) => l.startsWith(`${CLI_GLYPH.run} `) && /\bg\b/.test(l.slice(0, 12)))
    expect(runRow).toBeUndefined()
    expect(s.cli.join('\n')).toMatch(/skipped · when gate not met/)
  })
})

describe('runStateAt · permits denial override (opts.deny)', () => {
  // the ENFORCE beat: an out-of-bounds effect is denied with NIKA-SEC-004
  // (effect outside the declared permits boundary) instead of the verb-default.
  const SEC = {
    code: 'NIKA-SEC-004',
    category: 'security_error',
    transient: false,
    message: 'effect outside the declared permits: capability boundary (fs/net/exec/tool)',
  }
  const s = runStateAt(DIAMOND, 1, { failAt: 'd', deny: SEC })

  it('the denied node surfaces the SECURITY code, not the verb-default', () => {
    expect(s.nodes.d.status).toBe('failure')
    const err = s.nodes.d.error
    expect(err).toBeTruthy()
    expect(err!.code).toBe('NIKA-SEC-004')
    expect(err!.category).toBe('security_error')
    expect(err!.transient).toBe(false)
    expect(err!.task_id).toBe('d')
  })

  it('the pretty CLI shows ✗ <id> NIKA-SEC-004', () => {
    expect(s.cli.join('\n')).toMatch(/✗ d\s+NIKA-SEC-004/)
  })

  it('deny only applies to the failAt node (others keep verb-default behaviour)', () => {
    // failing `a` with deny → `a` carries SEC-004; downstream b/c/d cancel (default gate)
    const s2 = runStateAt(DIAMOND, 1, { failAt: 'a', deny: SEC })
    expect(s2.nodes.a.error!.code).toBe('NIKA-SEC-004')
    // no other node carries an error code (they're cancelled, not failed)
    for (const id of ['b', 'c', 'd']) {
      expect(s2.nodes[id].error).toBeUndefined()
    }
  })
})

describe('runStateAt · determinism', () => {
  it('same inputs → byte-identical state (no Date.now / Math.random)', () => {
    const a = runStateAt(STANDUP, 0.5, { runId: 'fixed-seed' })
    const b = runStateAt(STANDUP, 0.5, { runId: 'fixed-seed' })
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('runId changes the event ids + timings, but not the per-node STATUS', () => {
    // durations are seeded by runId (so the virtual ms timeline shifts), but the
    // scroll-clock STATUS of each node at a given t is runId-independent.
    const a = runStateAt(STANDUP, 0.5, { runId: 'seed-1' })
    const b = runStateAt(STANDUP, 0.5, { runId: 'seed-2' })
    const statusOf = (s: typeof a) =>
      Object.fromEntries(Object.entries(s.nodes).map(([k, v]) => [k, v.status]))
    expect(statusOf(a)).toEqual(statusOf(b))
    expect(a.events[0]?.id).not.toBe(b.events[0]?.id)
  })

  it('every status produced is a member of the closed TaskStatus enum', () => {
    for (let i = 0; i <= 30; i++) {
      const s = runStateAt(STANDUP, i / 30, { failAt: 'digest' })
      for (const id of Object.keys(s.nodes)) {
        expect(ALL_STATUSES).toContain(s.nodes[id].status)
      }
    }
  })
})

describe('runStateAt · the Living File fil-rouge t3-resume-screener', () => {
  const T3 = SHOWCASE_DAG['t3-resume-screener']

  it('exists with a terminal `save` node (the permits-boundary write)', () => {
    const save = T3.tasks.find((t) => t.id === 'save')
    expect(save).toBeTruthy()
    // nothing depends on `save` → denying it shows ONE denial, no cascade
    const dependents = T3.tasks.filter((t) => t.deps.includes('save'))
    expect(dependents).toHaveLength(0)
  })

  it('the within-bounds run completes successfully (exit 0, shortlist output)', () => {
    const s = runStateAt(T3, 1)
    expect(s.exitCode).toBe(0)
    expect(Object.keys(s.outputs ?? {})).toContain('shortlist')
  })

  it('denying the terminal write surfaces NIKA-SEC-004 with no cascade', () => {
    const s = runStateAt(T3, 1, {
      failAt: 'save',
      deny: { code: 'NIKA-SEC-004', category: 'security_error', transient: false, message: 'x' },
    })
    expect(s.nodes.save.status).toBe('failure')
    expect(s.nodes.save.error!.code).toBe('NIKA-SEC-004')
    // every OTHER node still succeeded (no cancel cascade from a terminal node)
    for (const t of T3.tasks) {
      if (t.id === 'save') continue
      expect(s.nodes[t.id].status).toBe('success')
    }
  })
})

describe('runStateAt · real spec workflow t1-standup-digest', () => {
  it('t=1 completes successfully with the note output present', () => {
    const s = runStateAt(STANDUP, 1)
    expect(s.exitCode).toBe(0)
    expect(s.outputs).toBeTruthy()
    expect(Object.keys(s.outputs!)).toContain('note')
    for (const id of Object.keys(s.nodes)) {
      expect(s.nodes[id].status).toBe('success')
    }
  })

  it('the two wave-0 tasks (today, history) run in parallel', () => {
    let parallel = false
    for (let i = 0; i <= 200; i++) {
      const s = runStateAt(STANDUP, i / 200)
      if (s.nodes.today.status === 'running' && s.nodes.history.status === 'running') {
        parallel = true
        break
      }
    }
    expect(parallel).toBe(true)
  })
})

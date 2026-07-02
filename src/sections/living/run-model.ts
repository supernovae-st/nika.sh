/* ─── run-model · the deterministic heart of "The Living File" ──────────────
   PURE LOGIC, no UI. Given a ShowcaseDag + a scroll progress t ∈ [0,1] it
   returns every node's state + the event log in BOTH the canonical CLI pretty
   format AND real NDJSON. It drives the 2D DAG, the 3D corridor and the live
   event stream (design doc §5.1/§5.4/§5.5).

   DETERMINISM CONTRACT · no Date.now, no Math.random, no I/O. Everything is a
   pure function of (dag, t, runId). Same inputs → byte-identical output, so
   unit tests AND headless screenshots are reproducible.

   TWO CLOCKS (the trick):
   • the SCROLL clock — `t` over the wave timeline decides each node's STATUS
     (pending/running/success). Wave W owns the slice [W/waves, (W+1)/waves];
     within a wave every node shares the window, so same-wave nodes run in
     PARALLEL. Because the projector guarantees deps live in strictly-earlier
     waves, wave order == topological order (asserted in the tests).
   • the VIRTUAL-MS clock — a deterministic absolute timeline (derived from
     per-node seeded durations) stamps events/CLI with `timestamp_ms` and the
     `T+mm:ss.ms` elapsed marker. It is independent of `t`; we only emit the
     prefix of it that the scroll has revealed. */

import type { ShowcaseDag, ShowcaseTask } from '../usecases-yaml.generated'

export type TaskStatus = 'pending' | 'running' | 'success' | 'failure' | 'skipped' | 'cancelled'

export interface TypedError {
  /** the NIKA-XXX code (verbatim from public/errors/catalog.json) */
  code: string
  category: string
  transient: boolean
  message: string
  task_id: string
  attempt: number
}

export interface NodeState {
  status: TaskStatus
  startedAtMs: number | null
  endedAtMs: number | null
  durationMs: number | null
  /** a short, plausible result string surfaced on success (CLI tail) */
  output?: string
  error?: TypedError
}

export interface NdjsonEvent {
  id: string
  run_id: string
  trace_id?: string
  kind: string
  timestamp_ms: number
  payload: Record<string, unknown>
}

export interface RunState {
  nodes: Record<string, NodeState>
  /** the pretty `nika run` lines revealed so far */
  cli: string[]
  /** the NDJSON event log revealed so far, in order */
  events: NdjsonEvent[]
  /** the workflow outputs object (present once the run reaches completion) */
  outputs?: Record<string, string>
  /** 0 success · non-zero failure/cancelled · null while still running */
  exitCode: number | null
  /** the scroll progress this state was computed at (clamped to [0,1]) */
  progress: number
}

/* ── the closed NDJSON kind set (design doc §5.4b · spec 05-errors / events) ─ */
export const NDJSON_KINDS = [
  'workflow.started',
  'workflow.completed',
  'task.started',
  'task.completed',
  'task.failed',
  'task.cancelled',
  'infer.delta',
  'infer.usage',
  'exec.output',
  'invoke.result',
  'agent.turn',
] as const

/* ── CLI glyphs (design doc §5.4) ─────────────────────────────────────────── */
export const CLI_GLYPH = {
  run: '▶',
  done: '✓',
  sub: '·',
  fail: '✗',
  cancel: '⊘',
} as const

/* ── real catalog rows · verbatim from public/errors/catalog.json (v3) ───────
   The failure path pulls a real, verb-appropriate NIKA-XXX code. Kept inline
   (the catalog lives in public/ · not importable as a module) — these four
   rows are copied 1:1 from the catalog `codes[]`. */
const CATALOG: Record<ShowcaseTask['verb'], { code: string; category: string; transient: boolean; failure: string }> = {
  exec: { code: 'NIKA-EXEC-001', category: 'process_error', transient: false, failure: 'non-zero exit code (default capture modes)' },
  infer: { code: 'NIKA-INFER-001', category: 'provider_error', transient: false, failure: 'provider call failed (HTTP error · provider refusal)' },
  invoke: { code: 'NIKA-INVOKE-001', category: 'validation_error', transient: false, failure: 'unknown tool (unresolvable nika:/mcp: id)' },
  agent: { code: 'NIKA-AGENT-001', category: 'budget_error', transient: false, failure: 'max_turns exhausted before completion' },
}

/* ── deterministic seeding ──────────────────────────────────────────────────
   A tiny FNV-1a-ish string hash → a stable 32-bit unsigned int. No crypto,
   pure + fast, identical in every environment. */
function hash32(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** a deterministic [lo, hi) integer derived from a seed string */
function seededInt(seed: string, lo: number, hi: number): number {
  return lo + (hash32(seed) % (hi - lo))
}

/** ULID-ish, deterministic, sortable-enough id: `<runId>-<index padded>` */
function eventId(runId: string, index: number): string {
  return `${runId}-${String(index).padStart(6, '0')}`
}

const DEFAULT_RUN_ID = '01J8KQRUNLIVINGFILE0000000'
const WORKFLOW_START_MS = 0

/* per-node deterministic duration (ms) · seeded by runId + node id + verb so
   it never depends on the wall clock. Bounded to a readable 0.2s–3.5s band. */
function nodeDurationMs(runId: string, task: ShowcaseTask): number {
  return seededInt(`${runId}:${task.id}:${task.verb}:dur`, 180, 3500)
}

/* ── a plausible "→ target" per verb, derived from the task's gloss/flags ──── */
function verbTarget(task: ShowcaseTask, dag: ShowcaseDag): string {
  switch (task.verb) {
    case 'infer': {
      // the sim's one local-first model id (constant by design — the run sim
      // doesn't parse model ids out of glosses)
      return 'ollama/qwen2.5'
    }
    case 'exec': {
      // pull the tool name out of the gloss e.g. "run `git`" → git
      const m = task.gloss.match(/run `([^`]+)`/)
      return m ? m[1] : 'sh'
    }
    case 'invoke': {
      const m = task.gloss.match(/`(nika:[a-z_]+)`/)
      return m ? m[1] : 'nika:fetch'
    }
    case 'agent': {
      const maxTurns = seededInt(`${dag.tasks.length}:${task.id}:turns`, 4, 9)
      const turn = Math.max(1, maxTurns - 1)
      return `turn ${turn}/${maxTurns}`
    }
  }
}

/* a short, plausible success result per verb (the CLI tail + invoke payload) */
function verbResult(task: ShowcaseTask): string {
  switch (task.verb) {
    case 'infer':
      return task.flags.includes('typed output') ? '{ ranked: 14 }' : 'ok'
    case 'exec':
      return `${seededInt(`${task.id}:lines`, 3, 40)} lines`
    case 'invoke':
      return `${seededInt(`${task.id}:items`, 1, 24)} items`
    case 'agent':
      return 'done'
  }
}

/* the verb-specific sub-events emitted between task.started and task.completed */
function subEvents(task: ShowcaseTask): { kind: string; payload: Record<string, unknown> }[] {
  switch (task.verb) {
    case 'infer':
      return [
        { kind: 'infer.delta', payload: { task_id: task.id, text: '1. …' } },
        { kind: 'infer.usage', payload: { task_id: task.id, tokens: seededInt(`${task.id}:tok`, 120, 1800) } },
      ]
    case 'exec':
      return [{ kind: 'exec.output', payload: { task_id: task.id, stream: 'stdout', bytes: seededInt(`${task.id}:bytes`, 32, 4096) } }]
    case 'invoke':
      return [{ kind: 'invoke.result', payload: { task_id: task.id, items: seededInt(`${task.id}:items`, 1, 24) } }]
    case 'agent': {
      const maxTurns = seededInt(`${task.id}:turns`, 4, 9)
      const turn = Math.max(1, maxTurns - 1)
      return [{ kind: 'agent.turn', payload: { task_id: task.id, turn, max_turns: maxTurns } }]
    }
  }
}

/* ── elapsed formatter · T+mm:ss.ms (centiseconds, matching the design doc) ── */
function elapsed(ms: number): string {
  const totalCs = Math.round(ms / 10) // centiseconds
  const mm = Math.floor(totalCs / 6000)
  const ss = Math.floor((totalCs % 6000) / 100)
  const cs = totalCs % 100
  const pad2 = (n: number) => String(n).padStart(2, '0')
  return `T+${pad2(mm)}:${pad2(ss)}.${pad2(cs)}`
}

/* a single padded column helper for the pretty CLI (id width 7) */
function col(s: string, w: number): string {
  return s.length >= w ? `${s} ` : s.padEnd(w)
}

/* ── the virtual schedule ────────────────────────────────────────────────────
   Build, deterministically, the absolute-ms timeline: waves are sequential;
   within a wave, all tasks START together (parallel) and the wave ends when its
   longest task ends. This yields per-node {startMs, endMs} used for events +
   the T+ marker. Independent of `t`. */
interface Sched {
  byWave: ShowcaseTask[][]
  startMs: Record<string, number>
  endMs: Record<string, number>
  durMs: Record<string, number>
}

function buildSchedule(dag: ShowcaseDag, runId: string): Sched {
  const byWave: ShowcaseTask[][] = Array.from({ length: dag.waves }, () => [])
  for (const t of dag.tasks) byWave[t.wave].push(t)
  // stable order within a wave: by line0 then id (deterministic, matches file order)
  for (const w of byWave) w.sort((a, b) => a.line0 - b.line0 || (a.id < b.id ? -1 : 1))

  const startMs: Record<string, number> = {}
  const endMs: Record<string, number> = {}
  const durMs: Record<string, number> = {}
  let cursor = WORKFLOW_START_MS
  for (const wave of byWave) {
    let waveEnd = cursor
    for (const t of wave) {
      const d = nodeDurationMs(runId, t)
      durMs[t.id] = d
      startMs[t.id] = cursor
      endMs[t.id] = cursor + d
      waveEnd = Math.max(waveEnd, cursor + d)
    }
    cursor = waveEnd
  }
  return { byWave, startMs, endMs, durMs }
}

/* ── status from the SCROLL clock ────────────────────────────────────────────
   Wave W owns [W/waves, (W+1)/waves]. Inside the wave, a node is `running`
   while the local progress is below its activation fraction, then `success`.
   Same-wave nodes share the window → parallelism. (Failure/skip handled by the
   caller's plan; this returns the happy-path topological status only.) */
function scrollStatus(task: ShowcaseTask, t: number, waves: number): TaskStatus {
  const lo = task.wave / waves
  const hi = (task.wave + 1) / waves
  if (t <= lo) return 'pending'
  if (t >= hi) return 'success'
  // within the slice: first ~70% running, last ~30% settled to success
  const local = (t - lo) / (hi - lo)
  return local < 0.7 ? 'running' : 'success'
}

/* ── the failure plan (design doc §5.4d · spec 05-errors gate propagation) ────
   The victim → failure. Any task with the victim (transitively) in its dep
   closure that is NOT done before the failure → cancelled (default gate) or
   skipped (when gate). Mirrors RunSim chaos semantics. Pure. */
function failurePlan(dag: ShowcaseDag, failAt: string): Record<string, 'failure' | 'cancelled' | 'skipped'> {
  const out: Record<string, 'failure' | 'cancelled' | 'skipped'> = {}
  const poisoned = new Set<string>([failAt])
  // process in wave order so poison propagates forward
  const ordered = [...dag.tasks].sort((a, b) => a.wave - b.wave || a.line0 - b.line0)
  for (const t of ordered) {
    if (t.id === failAt) {
      out[t.id] = 'failure'
      continue
    }
    const tainted = t.deps.some((d) => poisoned.has(d))
    if (tainted) {
      out[t.id] = t.gate === 'when' ? 'skipped' : 'cancelled'
      poisoned.add(t.id)
    }
  }
  return out
}

/* an explicit error override for the failed node — used to surface a SECURITY
   denial (`NIKA-SEC-004` · effect outside the declared `permits:` boundary)
   instead of the verb-default code. Real catalog rows (public/errors/catalog.json). */
export interface DenyOverride {
  code: string
  category: string
  transient: boolean
  message: string
}

function buildTypedError(task: ShowcaseTask, override?: DenyOverride): TypedError {
  if (override) {
    return { ...override, task_id: task.id, attempt: 1 }
  }
  const row = CATALOG[task.verb]
  return {
    code: row.code,
    category: row.category,
    transient: row.transient,
    message: row.failure,
    task_id: task.id,
    attempt: 1,
  }
}

/* ── the public entry point ─────────────────────────────────────────────────*/
export function runStateAt(
  dag: ShowcaseDag,
  t: number,
  opts: { failAt?: string; runId?: string; deny?: DenyOverride } = {},
): RunState {
  const progress = Math.min(1, Math.max(0, t))
  const runId = opts.runId ?? DEFAULT_RUN_ID
  const sched = buildSchedule(dag, runId)
  const plan = opts.failAt ? failurePlan(dag, opts.failAt) : null
  const traceId = `${runId}-trace`

  // ── 1 · per-node status (scroll clock) + timestamps (virtual clock) ──
  const nodes: Record<string, NodeState> = {}
  for (const task of dag.tasks) {
    const happy = scrollStatus(task, progress, dag.waves)
    const planned = plan?.[task.id]

    // a planned non-success outcome only applies once the scroll has reached
    // (or passed) the node's wave start — before that it's still pending.
    const reached = happy !== 'pending'
    let status: TaskStatus = happy
    if (planned && reached) status = planned

    // a node only DISPATCHES (gets a start time) when it actually ran —
    // running/success/failure. cancelled/skipped never dispatch in real engine
    // semantics, so they carry no startedAtMs (the gate refused them upfront).
    const dispatched = status === 'running' || status === 'success' || status === 'failure'
    const finished = status === 'success' || status === 'failure'

    nodes[task.id] = {
      status,
      startedAtMs: dispatched ? sched.startMs[task.id] : null,
      endedAtMs: finished ? sched.endMs[task.id] : null,
      durationMs: finished ? sched.durMs[task.id] : null,
      ...(status === 'success' ? { output: verbResult(task) } : {}),
      ...(status === 'failure'
        ? { error: buildTypedError(task, opts.failAt === task.id ? opts.deny : undefined) }
        : {}),
    }
  }

  // ── 2 · the event log (NDJSON) + the pretty CLI ──
  // Events are buffered with their virtual-ms timestamp + a stable sub-order,
  // then sorted onto one monotonic timeline and id'd LAST (so ids follow the
  // final wire order). The CLI is emitted task-by-task in start order (how a
  // human watches a terminal scroll).
  interface Raw {
    kind: string
    timestamp_ms: number
    /** intra-timestamp ordering: 0 started · 1 sub-events · 2 completed/failed */
    rank: number
    seq: number
    payload: Record<string, unknown>
  }
  const raw: Raw[] = []
  const cli: string[] = []
  let seq = 0
  const emit = (kind: string, timestamp_ms: number, rank: number, payload: Record<string, unknown>) => {
    raw.push({ kind, timestamp_ms, rank, seq: seq++, payload })
  }

  // workflow.started fires as soon as anything has begun (progress > 0)
  const anyStarted = dag.tasks.some((task) => nodes[task.id].status !== 'pending')
  if (anyStarted) {
    emit('workflow.started', WORKFLOW_START_MS, -1, { run_id: runId })
  }

  // CLI is rendered in start-of-task order (the terminal scroll a human sees)
  const ordered = [...dag.tasks].sort(
    (a, b) => sched.startMs[a.id] - sched.startMs[b.id] || a.line0 - b.line0,
  )

  let failedSeen = false
  for (const task of ordered) {
    const node = nodes[task.id]
    if (node.status === 'pending') continue
    const start = sched.startMs[task.id]
    const end = sched.endMs[task.id]
    const mid = Math.floor((start + end) / 2) // sub-events sit between start & end

    // cancelled/skipped never DISPATCH — the gate refused them before they ran,
    // so they get NO task.started + NO `▶` row (only the terminal ⊘/↷). Render
    // those rows here and move on, before the dispatch path below.
    if (node.status === 'cancelled' || node.status === 'skipped') {
      if (node.status === 'cancelled') {
        emit('task.cancelled', start, 2, { task_id: task.id, reason: 'default gate needs an upstream success' })
        cli.push(`${CLI_GLYPH.cancel} ${col(task.id, 7)} cancelled · ${task.gate} gate needs an upstream success`)
      } else {
        // skipped (when gate) — render in cli, no event surfaced (stays out of the closed set)
        cli.push(`${CLI_GLYPH.cancel} ${col(task.id, 7)} skipped · when gate not met`)
      }
      continue
    }

    // the node DISPATCHED (running/success/failure) → task.started + the ▶ row
    emit('task.started', start, 0, { task_id: task.id, verb: task.verb })
    cli.push(`${CLI_GLYPH.run} ${col(task.id, 7)} ${col(task.verb, 7)} → ${verbTarget(task, dag)}`)

    if (node.status === 'running') continue // mid-flight · no terminal event yet

    if (node.status === 'failure' && node.error) {
      // sub-events still streamed before the failure surfaces (a failure node
      // always carries its TypedError — the && narrows instead of a lone `!`)
      for (const se of subEvents(task)) {
        cli.push(`  ${CLI_GLYPH.sub} ${se.kind} …`)
        emit(se.kind, mid, 1, se.payload)
      }
      const err = node.error
      emit('task.failed', end, 2, {
        task_id: task.id,
        code: err.code,
        category: err.category,
        transient: err.transient,
        attempt: err.attempt,
      })
      cli.push(`${CLI_GLYPH.fail} ${col(task.id, 7)} ${err.code}   transient:${err.transient}`)
      failedSeen = true
      continue
    }

    // success · stream the verb sub-events, then task.completed
    for (const se of subEvents(task)) {
      cli.push(`  ${CLI_GLYPH.sub} ${se.kind} …`)
      emit(se.kind, mid, 1, se.payload)
    }
    emit('task.completed', end, 2, {
      task_id: task.id,
      verb: task.verb,
      duration_ms: sched.durMs[task.id],
    })
    cli.push(`${CLI_GLYPH.done} ${col(task.id, 7)} ${elapsed(end)}  ${node.output ?? ''}`.trimEnd())
  }

  // ── 3 · terminal state · workflow.completed + outputs block + exit code ──
  const allTerminal = dag.tasks.every((task) => {
    const st = nodes[task.id].status
    return st === 'success' || st === 'failure' || st === 'cancelled' || st === 'skipped'
  })

  let exitCode: number | null = null
  let outputs: Record<string, string> | undefined

  if (allTerminal && anyStarted) {
    const anyFailure = dag.tasks.some(
      (task) => nodes[task.id].status === 'failure' || nodes[task.id].status === 'cancelled',
    )
    const workflowEndMs = Math.max(...dag.tasks.map((task) => sched.endMs[task.id]))

    if (anyFailure || failedSeen) {
      exitCode = 1
      emit('workflow.completed', workflowEndMs, 9, { status: 'failure', exit: 1 })
      cli.push('── error (stderr) ──')
      cli.push(`exit ${exitCode}`)
    } else {
      exitCode = 0
      outputs = Object.fromEntries(
        dag.outputs.map((name) => [name, `<${name}>`]),
      )
      emit('workflow.completed', workflowEndMs, 9, { status: 'success', exit: 0 })
      cli.push('── outputs (stdout) ─────────────────')
      cli.push(JSON.stringify(outputs))
      cli.push(`exit ${exitCode}`)
    }
  }

  // ── 4 · onto one monotonic timeline · id LAST (ids follow wire order) ──
  // workflow.started pinned first (rank -1), workflow.completed pinned last
  // (rank 9); everything else sorts by (timestamp_ms, rank, emission seq).
  raw.sort((a, b) => a.timestamp_ms - b.timestamp_ms || a.rank - b.rank || a.seq - b.seq)
  const events: NdjsonEvent[] = raw.map((r, i) => ({
    id: eventId(runId, i),
    run_id: runId,
    trace_id: traceId,
    kind: r.kind,
    timestamp_ms: r.timestamp_ms,
    payload: r.payload,
  }))

  return {
    nodes,
    cli,
    events,
    ...(outputs ? { outputs } : {}),
    exitCode,
    progress,
  }
}

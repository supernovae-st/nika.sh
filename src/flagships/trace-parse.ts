/* ─── trace-parse · the flight recorder → the replay model ────────────────────
   Parses the VERBATIM NDJSON a real `nika run <file> --json` streamed (the
   engine's flight-recorder wire shape: uuid id · ns timestamp · kind ·
   fields[{key,value}]) into the model the run-replay section plays back.

   HONESTY CONTRACT: nothing here invents data — every step, note, duration
   and token count comes 1:1 from the recorded run. The replay's PACING is
   presentational (reading speed), but everything DISPLAYED is recorded fact.

   PURE LOGIC, no UI, SSR-safe (string ops only). Trace↔file coherence is
   enforced in src/flagships/trace.test.ts. */

export interface TraceStep {
  /** the engine event kind, verbatim (workflow_started · task_scheduled ·
      task_started · task_completed · task_failed · task_skipped ·
      task_cancelled · workflow_completed · workflow_failed) */
  kind: string
  /** the task id, when the event is task-scoped */
  task?: string
  /** the engine's note, verbatim — e.g. "invoke · nika:read" */
  note?: string
  /** the engine's detail, verbatim — e.g. "when: gate closed" */
  detail?: string
  /** recorded task duration (ms) on completion events */
  durationMs?: number
  /** recorded token count on infer completions */
  tokens?: number
  /** ms since workflow_started (real recorded clock) */
  atMs: number
}

export interface RunTrace {
  steps: TraceStep[]
  /** real wall time of the whole run (ms) */
  totalMs: number
  /** 0 = workflow_completed · 1 = workflow_failed */
  exit: 0 | 1
  /** distinct scheduled task ids, in schedule order */
  taskIds: string[]
  completed: number
  skipped: number
}

interface WireEvent {
  timestamp: number
  kind: string
  fields: { key: string; value: unknown }[]
}

/** parse one recorded NDJSON trace (verbatim engine output) */
export function parseTrace(ndjson: string): RunTrace {
  const events: WireEvent[] = ndjson
    .split('\n')
    .filter((l) => l.trim() !== '')
    .map((l) => JSON.parse(l) as WireEvent)

  if (events.length === 0) throw new Error('empty trace')
  const t0 = events[0].timestamp

  const steps: TraceStep[] = events.map((e) => {
    const f = new Map(e.fields.map((kv) => [kv.key, kv.value]))
    const task = f.get('task')
    const note = f.get('note')
    const detail = f.get('detail')
    const dur = f.get('duration_ms')
    const tok = f.get('tokens')
    return {
      kind: e.kind,
      ...(typeof task === 'string' ? { task } : {}),
      ...(typeof note === 'string' ? { note } : {}),
      ...(typeof detail === 'string' ? { detail } : {}),
      ...(typeof dur === 'number' ? { durationMs: dur } : {}),
      ...(typeof tok === 'number' ? { tokens: tok } : {}),
      /* ns → ms since the first event (the real recorded clock) */
      atMs: Math.round((e.timestamp - t0) / 1e6),
    }
  })

  const last = steps[steps.length - 1]
  const taskIds = steps.filter((s) => s.kind === 'task_scheduled' && s.task).map((s) => s.task as string)

  return {
    steps,
    totalMs: last.atMs,
    exit: steps.some((s) => s.kind === 'workflow_failed') ? 1 : 0,
    taskIds,
    completed: steps.filter((s) => s.kind === 'task_completed').length,
    skipped: steps.filter((s) => s.kind === 'task_skipped').length,
  }
}

/** "1.9s" / "480ms" — compact human duration for telemetry chips */
export function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 90_000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60_000)}m${String(Math.round((ms % 60_000) / 1000)).padStart(2, '0')}s`
}

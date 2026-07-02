/* ─── morph-model · scroll progress → the morph's whole state ─────────────────
   PURE LOGIC, no UI. The scroll morph (F2) is a pure function of
   (flagship, p): the phase windows, each task's burst flight, and the run
   timeline (node states + terminal reveal) all derive from the one scroll
   progress. No timers, no accumulated state — scrubbing backward replays
   the scene in reverse for free and nothing can ever teleport.

   HONESTY: node intervals come from the RECORDED trace. The engine flushes
   task_started/task_completed together at completion time, so a task's real
   running interval is [completedAt − durationMs, completedAt] — durations are
   recorded fact. The terminal reveals lines in verbatim recorded order; only
   the PACING maps the recorded clock onto scroll progress. */

import type { FlagshipEntry } from '../../flagships'
import type { ReplayLine } from '../run/replay-model'

/* ── the phase windows (fractions of the section's scroll runway) ──────────────
   FILE   0.00–0.22  the selected file travels in and holds (sticky)
   BURST  0.22–0.55  task blocks fly to their DAG positions, wave-staggered
   WIRES  0.50–0.60  dependency wires draw between the landed nodes
   RUN    0.60–0.97  the recorded trace chains through the DAG + terminal
   HOLD   0.97–1.00  verdict settles before the stage unsticks              */
export const PH = {
  settleEnd: 0.08,
  burst0: 0.22,
  burstFlight: 0.17,
  burstEnd: 0.55,
  wire0: 0.5,
  wire1: 0.6,
  term0: 0.5,
  term1: 0.58,
  run0: 0.6,
  run1: 0.97,
} as const

export const clamp01 = (v: number): number => Math.min(1, Math.max(0, v))

export const easeInOut = (k: number): number =>
  k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2

/** the file card's shell (chrome · gutter · non-task lines) 1→0 across the
    burst window — the file dissolves while its tasks fly */
export function shellAt(p: number): number {
  return 1 - clamp01((p - PH.burst0) / 0.14)
}

/** a task's burst flight 0..1 (raw, un-eased) — waves lift off in dependency
    order so the DAG assembles the way it will run */
export function flightAt(p: number, wave: number, waveCount: number): number {
  const stagger = (PH.burstEnd - PH.burstFlight - PH.burst0) / Math.max(1, waveCount - 1)
  const start = PH.burst0 + wave * stagger
  return clamp01((p - start) / PH.burstFlight)
}

/** wire draw progress 0..1 */
export function wireAt(p: number): number {
  return clamp01((p - PH.wire0) / (PH.wire1 - PH.wire0))
}

/** terminal strip entrance 0..1 */
export function termAt(p: number): number {
  return clamp01((p - PH.term0) / (PH.term1 - PH.term0))
}

/** position inside the run window 0..1 (the recorded trace maps onto this) */
export function runFracAt(p: number): number {
  return clamp01((p - PH.run0) / (PH.run1 - PH.run0))
}

/** the scene's phase — drives the head captions + the narration rail (H2).
    `done` begins when the run window saturates (the verdict has settled). */
export type MorphPhase = 'file' | 'burst' | 'run' | 'done'

export function phaseAt(p: number): MorphPhase {
  if (p < PH.burst0) return 'file'
  if (p < PH.run0) return 'burst'
  return runFracAt(p) >= 1 ? 'done' : 'run'
}

export type MorphNodeState = 'pending' | 'running' | 'done' | 'skipped'

export interface MorphTimeline {
  /** number of terminal lines revealed (verbatim recorded order) */
  reveal: number
  nodes: Record<string, MorphNodeState>
  verdictOn: boolean
  /** cheap change-detection key (one setState per real change) */
  sig: string
}

/** a task's REAL recorded running interval (see module doc) */
export function taskInterval(
  entry: FlagshipEntry,
  taskId: string,
): { start: number; end: number } | { skipAt: number } | null {
  const done = entry.trace.steps.find((s) => s.kind === 'task_completed' && s.task === taskId)
  if (done) {
    const start = done.durationMs !== undefined ? done.atMs - done.durationMs : done.atMs
    return { start: Math.max(0, start), end: done.atMs }
  }
  const skip = entry.trace.steps.find((s) => s.kind === 'task_skipped' && s.task === taskId)
  if (skip) return { skipAt: skip.atMs }
  const started = entry.trace.steps.find((s) => s.kind === 'task_started' && s.task === taskId)
  if (started) return { start: started.atMs, end: entry.trace.totalMs }
  return null
}

/** the whole run state at a run fraction — nodes light in recorded order
    (parallel tasks share their real overlapping intervals), the terminal
    reveals recorded lines, capped to reading pace across the scroll */
export function timelineAt(
  entry: FlagshipEntry,
  lines: ReplayLine[],
  runFrac: number,
): MorphTimeline {
  const t = runFrac * entry.trace.totalMs

  /* reveal: never before a line's recorded time; the index cap smooths the
     burst of near-time-zero preamble lines over the early scroll (pacing is
     presentational, the ORDER is verbatim) */
  const byClock = lines.filter((l) => l.atMs <= t).length
  const byPace = runFrac >= 1 ? lines.length : Math.ceil(runFrac * 1.25 * lines.length)
  const reveal = Math.min(byClock, byPace)

  const nodes: Record<string, MorphNodeState> = {}
  for (const task of entry.plan.tasks) {
    const iv = taskInterval(entry, task.id)
    if (!iv) {
      nodes[task.id] = 'pending'
    } else if ('skipAt' in iv) {
      nodes[task.id] = t >= iv.skipAt ? 'skipped' : 'pending'
    } else if (t >= iv.end && runFrac > 0) {
      nodes[task.id] = 'done'
    } else if (t >= iv.start && runFrac > 0) {
      nodes[task.id] = 'running'
    } else {
      nodes[task.id] = 'pending'
    }
  }

  const verdictOn = runFrac >= 1
  const sig = `${reveal}|${verdictOn ? 1 : 0}|${entry.plan.tasks.map((x) => nodes[x.id][0]).join('')}`
  return { reveal, nodes, verdictOn, sig }
}

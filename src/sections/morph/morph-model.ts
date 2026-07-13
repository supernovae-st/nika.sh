/* ─── morph-model · scroll progress → the morph's whole state ─────────────────
   PURE LOGIC, no UI. The scroll morph (F2) is a pure function of
   (flagship, p): the phase windows, each task's aspiration beat (condense →
   travel → ignite), and the run timeline (node states + terminal reveal) all
   derive from the one scroll progress. No timers, no accumulated state —
   scrubbing backward replays the scene in reverse for free and nothing can
   ever teleport.

   HONESTY: node intervals come from the RECORDED trace. The engine flushes
   task_started/task_completed together at completion time, so a task's real
   running interval is [completedAt − durationMs, completedAt] — durations are
   recorded fact. The terminal reveals lines in verbatim recorded order; only
   the PACING maps the recorded clock onto scroll progress. */

import type { FlagshipEntry } from '../../flagships'
import type { ReplayLine } from '../run/replay-model'

/* ── the phase windows (fractions of the section's scroll runway) ──────────────
   FILE   0.00–0.13  the selected file travels in and holds (sticky) — SHORT:
                     the visitor just read this file in the hero (« the same
                     file you just read »); holding it a fifth of the runway
                     read as dead scroll (operator, arc 20)
   BURST  0.13–0.60  one task at a time (reading order) CONDENSES into its
                     seed chip, then the chip is drawn along a curve INTO its
                     DAG slot — the slot ignites on arrival (per-task
                     aspiration, wave I; the per-line scatter is gone). The
                     earlier open WIDENS the window: each beat gets more
                     scroll room, so the relay reads softer AND starts sooner
   WIRES  0.56–0.66  dependency wires draw between the landed nodes
   RUN    0.66–0.86  the recorded trace chains through the DAG + terminal
   FLAT   0.86–0.94  the verdict beat: the exit-0 sweep crosses the graph,
                     then the camera rises to top-down while the slabs lie
                     face-up — the 3D plan WATCHED lying down into the map
                     (wave K; scrub back and it stands up again)
   DONE   0.94–1.00  the flat 2D DAG takes over as the closing frame        */
export const PH = {
  /* THE FRONT-LOADED GESTURE (operator 2026-07-13) · the visitor just read
     this file in the hero, so the film spends the scroll on the TRANSFORM,
     not the recap: the burst opens at 0.08 and lands by 0.42, the wires
     draw as the last chips settle, and the RUN — terminal tape, node
     ticks, the whole instrument story — starts at HALF the gesture
     (run0 0.50, was 0.66). The verdict window keeps its widened sweep. */
  settleEnd: 0.05,
  burst0: 0.08,
  burstEnd: 0.42,
  wire0: 0.4,
  wire1: 0.5,
  /* the run monitor DOCKS with the file's settle — real software shows its
     instrument panel before the tape rolls: empty log well, plan facts in
     the status row, the tick map already on the rail. The log then streams
     into the standing window at run0. */
  term0: 0.03,
  term1: 0.07,
  run0: 0.5,
  run1: 0.8,
  flat1: 0.94,
} as const

export const clamp01 = (v: number): number => Math.min(1, Math.max(0, v))

export const easeInOut = (k: number): number =>
  k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2

/** the file card's shell (chrome · gutter · panel floor) 1→0 across the top
    of the burst — the frame steps aside, the task blocks stay readable. 0.16
    window (was 0.1): the frame dissolving faster than the first beat could
    land read as a hard cut into the burst (operator, arc 20) */
export function shellAt(p: number): number {
  return 1 - clamp01((p - PH.burst0) / 0.16)
}

/* ── the aspiration · one beat per task, reading order ─────────────────────────
   File order IS topological order (deps live strictly earlier in the file),
   so the plan assembles the way the file reads: transcript → extract → save.
   Beats overlap 50% (a readable relay: at most two seeds in the air), and the
   LAST beat lands exactly at burstEnd. */

/* saturation must be EXACT at the beat boundaries (the DOM clears inline
   transforms at 1) — snap the float dust the divisions leave behind */
const snap01 = (v: number): number => (v >= 1 - 1e-9 ? 1 : v <= 1e-9 ? 0 : v)

/** a task's aspiration beat 0..1 (raw, un-eased) — index in file order */
export function aspireAt(p: number, index: number, count: number): number {
  const window = PH.burstEnd - PH.burst0
  const beat = window / (1 + 0.5 * Math.max(0, count - 1))
  const start = PH.burst0 + index * beat * 0.5
  return snap01(clamp01((p - start) / beat))
}

/** CONDENSE sub-phase 0..1 — the block's lines converge into the seed chip */
export const condenseAt = (e: number): number => snap01(clamp01(e / 0.45))

/** TRAVEL sub-phase 0..1 — the seed rides its curve into the DAG slot */
export const travelAt = (e: number): number => snap01(clamp01((e - 0.45) / 0.55))

/** IGNITION 0..1 — the slot is BORN as its seed lands (the causality beat) */
export const igniteAt = (e: number): number => snap01(clamp01((travelAt(e) - 0.78) / 0.22))

/* ── THE DRAIN · a uniform queue-slide, geometric, order-preserving (wave M) ──
   The un-consumed remainder of the file slides DOWN as ONE block — its own
   layout intact (a per-line weighted sag at clearance amplitude made lines
   cross into an unreadable pile — found empirically, wave M sweep) — so the
   next task always reads at the top of the queue, below the slab band.
   The driver computes the offset D = (bandBottom + margin − remTop(p)) from
   MEASURED block tops; remTop lerps between successive tops as each block
   condenses, so D is continuous in p. This ramp gates D's onset: it
   saturates at burst0 + 0.085, BEFORE the first slot can ignite — ignition
   onset is 0.879 × beat past burst0 (travelAt 0.78 · condense 0.45), and
   the widest corpus beat (n = 7, window 0.34 since the front-loaded
   gesture) puts that at burst0 + 0.074.
   The model test sweeps the REAL corpus and fails if a future flagship's
   task count ever breaks this bound. Pure function of p — scrubbing
   reverses it. */
export const DRAIN_END = 0.06
export function drainRampAt(p: number): number {
  return easeInOut(clamp01((p - (PH.burst0 + 0.02)) / (DRAIN_END - 0.02)))
}

/** the seed chip's birth 0..1 — starts while the block is still readable
    (ce 0.35 → block opacity ≈ 0.8): the chip is visibly born FROM its block,
    never popping in a void after it (wave M causality) */
export const seedInAt = (ce: number): number => clamp01((ce - 0.35) / 0.4)

/** wire draw progress 0..1 */
export function wireAt(p: number): number {
  return clamp01((p - PH.wire0) / (PH.wire1 - PH.wire0))
}

/* ── THE VERDICT SWEEP (arc 20b) · the flat window's scene event ───────────────
   Post-#207 nothing lies down in the flat beat — the window's real content
   is the VERDICT. The confirmation front crosses the plan left→right (the
   drum's verdict-sweep register, on the DAG), each node flashing its ring
   as the front passes. Front + pulse are pure functions of p so the beat
   scrubs in reverse like everything else. */

/** the sweep front's travel 0..1 across the flat window (eased; done a
    touch before flat1 so the done frame opens on a settled graph) */
export function verdictFrontAt(p: number): number {
  return easeInOut(clamp01((p - PH.run1) / (PH.flat1 - PH.run1 - 0.015)))
}

/** the pulse half-width, in normalized graph x (wide enough that a 2-column
    plan still reads as a traveling wash, not a per-node blink) */
export const SWEEP_W = 0.42

/** a node's ring intensity 0..1 as the front passes its normalized x —
    the front travels −w → 1+w so every node rises AND falls fully */
export function verdictPulseAt(front: number, xNorm: number): number {
  if (front <= 0 || front >= 1) return 0
  const pos = -SWEEP_W + front * (1 + 2 * SWEEP_W)
  return clamp01(1 - Math.abs(pos - xNorm) / SWEEP_W)
}

/** the run monitor's dock 0..1 — the window is standing (empty, honest)
    long before the run streams into it */
export function termAt(p: number): number {
  return clamp01((p - PH.term0) / (PH.term1 - PH.term0))
}

/** the recorded clock at a scroll progress (ms, 0 before the run window) —
    the deck's timecode + the scrub tip both read it */
export function runMsAt(p: number, totalMs: number): number {
  return runFracAt(p) * totalMs
}

/** position inside the run window 0..1 (the recorded trace maps onto this) */
export function runFracAt(p: number): number {
  return clamp01((p - PH.run0) / (PH.run1 - PH.run0))
}

/** the scene's phase — drives the head captions + the narration rail (H2).
    `flat` opens as the run window saturates: the verdict beat (the exit-0
    sweep) plays there; `done` at flat1, when the settled map is the closing
    frame. */
export type MorphPhase = 'file' | 'burst' | 'run' | 'flat' | 'done'

export function phaseAt(p: number): MorphPhase {
  if (p < PH.burst0) return 'file'
  if (p < PH.run0) return 'burst'
  if (runFracAt(p) < 1) return 'run'
  return p < PH.flat1 ? 'flat' : 'done'
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

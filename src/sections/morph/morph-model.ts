/* ─── morph-model · scroll progress → the morph's whole state ─────────────────
   PURE LOGIC, no UI. The scroll morph (F2) is a pure function of
   (flagship, p): the phase windows, each wave's birth beat, the file's
   glide, the column unfold and the run timeline (node states + terminal
   reveal) all derive from the one scroll progress. No timers, no
   accumulated state — scrubbing backward replays the scene in reverse for
   free and nothing can ever teleport.

   THE CONTINUOUS AXIS (operator 2026-07-13 · the film starts in the hero):
   p spans the APPROACH + the sticky runway as ONE number:

     p = (vh − section.top) / (runway + vh)

   p=0 the section's top touches the viewport bottom (the hero still fully
   on screen) · p=P_ARM the stage docks (section top hits 0 — the sticky
   physics defines the seam) · p=1 the sticky releases. During the approach
   the stage and the hero scroll TOGETHER, so hero-anchored geometry is
   scroll-invariant relative to the stage — measured once, never per frame.

   THE BEAT SHEET (why each window sits where it does):
   BIRTH   0.02–0.12  while the hero is STILL READABLE each rail pip GROWS
                      into its real task card — a seed flies from the
                      task's own yaml lines (they light) into the growing
                      card. The file never shreds (the early-burst law).
   UNFOLD  →0.30      a standing card immediately FLIES toward its DAG seat
                      (the birth column never parks — the hero is leaving
                      the screen under it); the flight crosses the dock.
   GLIDE   0.08–0.20  the card adopts the hero panel at 0.08 (two-thirds
                      still on screen) and flies it to its LEFT berth,
                      SEATED before the dock — the sticky freeze finds
                      every actor already stage-fixed.
   WIRES   0.30–0.40  dependency wires draw between the seated cards.
   RUN     0.44–0.78  the recorded trace chains through the DAG + terminal.
   FLAT    0.78–0.94  the verdict: the exit-0 sweep crosses the plan.
   DONE    0.94–1.00  the settled comprehension frame (file ⟷ DAG pairing).

   HONESTY: node intervals come from the RECORDED trace. The engine flushes
   task_started/task_completed together at completion time, so a task's real
   running interval is [completedAt − durationMs, completedAt] — durations are
   recorded fact. The terminal reveals lines in verbatim recorded order; only
   the PACING maps the recorded clock onto scroll progress. */

import type { FlagshipEntry } from '../../flagships'
import type { ReplayLine } from '../run/replay-model'

export const PH = {
  /* the approach share of the axis is vh/(runway+vh) — with the 320vh
     runway that is ≈ 0.238 (P_ARM). The geometry writes the beat sheet
     (swept empirically): the hero's RAIL leaves the top of the screen by
     p≈0.12 and its FILE PANEL by p≈0.19 — so the births complete by 0.12,
     the card adopts the panel at 0.10 (still two-thirds on screen) and its
     glide ENJAMBS the dock (glide1 > P_ARM > glide0): the one voyage sews
     approach and runway together, no dead frame on either side. */
  birth0: 0.02,
  birth1: 0.12,
  /* the flight pip→seat must BEAT the hero's exit (the page climbs ~4.2vh
     per unit p on this axis — a slow flight rides its pip off-screen and
     yo-yos back, swept empirically): every card is seated by 0.18 */
  unfold1: 0.18,
  /* the file's voyage obeys the same law (its hero anchor also exits at
     ~4.2vh/p): adopted at 0.08 while two-thirds on screen, SEATED in its
     berth by 0.20 — before the dock, so the sticky freeze finds the card
     already stage-fixed and the seam has nothing left to sew */
  glide0: 0.08,
  glide1: 0.2,
  wire0: 0.22,
  wire1: 0.32,
  /* the run monitor DOCKS during the glide — real software shows its
     instrument panel before the tape rolls: empty log well, plan facts in
     the status row, the tick map already on the rail. */
  term0: 0.24,
  term1: 0.32,
  run0: 0.38,
  run1: 0.78,
  flat1: 0.94,
} as const

/* the sticky runway in viewport-heights (morph.css sets the armed section
   height to RUNWAY_VH + 100vh of stage) — the model owns the number so the
   axis math and the CSS can be pinned together by test */
export const RUNWAY_VH = 3.2

/** where the stage docks on the continuous axis (section top hits 0) */
export const P_ARM = 1 / (RUNWAY_VH + 1)

export const clamp01 = (v: number): number => Math.min(1, Math.max(0, v))

export const easeInOut = (k: number): number =>
  k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2

/* saturation must be EXACT at the beat boundaries (the DOM clears inline
   transforms at 1) — snap the float dust the divisions leave behind */
const snap01 = (v: number): number => (v >= 1 - 1e-9 ? 1 : v <= 1e-9 ? 0 : v)

/* ── BIRTH · one beat per WAVE, time order ─────────────────────────────────────
   The rail is the DAG folded into a column; birth unfolds it card by card.
   Wave beats overlap 40% (a readable relay), the LAST wave lands exactly
   at birth1 — every card stands before the glide can start. */
export function bornAt(p: number, wave: number, waveCount: number): number {
  const window = PH.birth1 - PH.birth0
  const beat = window / (1 + 0.6 * Math.max(0, waveCount - 1))
  const start = PH.birth0 + wave * beat * 0.6
  return snap01(easeInOut(clamp01((p - start) / beat)))
}

/** the seed's flight inside a birth beat — it leaves the yaml lines early
    and lands as the card reaches ~80% grown (causality: the line feeds
    the card) */
export const seedFlightAt = (b: number): number => snap01(clamp01(b / 0.8))

/** the source lines' glow — up with the seed's departure, released after
    the card lands (the file is read, never consumed) */
export const litAt = (b: number): number =>
  b <= 0 ? 0 : b >= 1 ? 0 : clamp01(b / 0.25) * (1 - clamp01((b - 0.7) / 0.3))

/* ── GLIDE · the file's one voyage, hero pose → left berth ────────────────────
   It STARTS while the hero panel is still two-thirds on screen and ENDS
   after the dock — the voyage itself is the seam. */
export function glideAt(p: number): number {
  return snap01(easeInOut(clamp01((p - PH.glide0) / (PH.glide1 - PH.glide0))))
}

/* ── UNFOLD · pip → seat, wave by wave ─────────────────────────────────────────
   A card flies toward its DAG seat as soon as it stands (the birth column
   never parks — the hero is leaving the screen under it); every card is
   seated by unfold1 — the wires can trust the geometry. */
export function unfoldAt(p: number, wave: number, waveCount: number): number {
  const start =
    PH.birth0 + wave * ((PH.birth1 - PH.birth0) / Math.max(1, waveCount)) + 0.02
  return snap01(easeInOut(clamp01((p - start) / (PH.unfold1 - start))))
}

/** wire draw progress 0..1 */
export function wireAt(p: number): number {
  return clamp01((p - PH.wire0) / (PH.wire1 - PH.wire0))
}

/* ── THE VERDICT SWEEP (arc 20b) · the flat window's scene event ───────────────
   The confirmation front crosses the plan left→right (the drum's
   verdict-sweep register, on the DAG), each node flashing its ring as the
   front passes. Front + pulse are pure functions of p so the beat scrubs
   in reverse like everything else. */

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
    `hero` while the visitor is still reading the pitch (birth plays there);
    `flat` opens as the run window saturates: the verdict beat (the exit-0
    sweep) plays there; `done` at flat1, when the settled map is the closing
    frame. */
export type MorphPhase = 'hero' | 'glide' | 'wires' | 'run' | 'flat' | 'done'

export function phaseAt(p: number): MorphPhase {
  if (p < PH.glide0) return 'hero'
  if (p < PH.wire0) return 'glide'
  if (p < PH.run0) return 'wires'
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

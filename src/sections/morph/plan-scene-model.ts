/* ─── plan-scene-model · the 3D DAG moment, as pure functions of scroll ───────
   PURE LOGIC, no three.js, no UI. ThePlanScene (the desktop WebGL layer over
   the morph's DAG beat) derives EVERYTHING here from (flagship, p):

   · the STRUCTURE — each task is a slab; waves sit at stepped Z depths and
     parallel tasks stand abreast in X (depth = time, the wave G thesis)
   · the ADVANCE — a head-on camera dollies forward through the waves as the
     RECORDED trace plays; the focus index is anchored to the real per-wave
     start clocks, so the camera arrives on a wave when the run does
   · the LIGHT — slab states, ignite pulses on incoming edges and the when:
     gate seal all read the recorded intervals (morph-model.taskInterval)

   Shares PH / aspireAt / runFracAt with the DOM morph so the 3D layer and the
   DOM story can never disagree about timing. HONESTY: every state change maps
   to a recorded event; nothing here invents data. */

import type { FlagshipEntry, FlagshipTask, NikaVerb } from '../../flagships'
import { formatMs } from '../../flagships'
import { PH, aspireAt, clamp01, easeInOut, igniteAt, runFracAt, taskInterval } from './morph-model'

/* ── layout constants (world units) ──────────────────────────────────────────
   A slab is a wide flat plate facing the camera — the engineering-die look.
   Waves recede along -Z; the camera looks down -Z slightly elevated so depth
   reads as a road ahead. */
export const SLAB = { w: 2.05, h: 1.12, d: 0.16 } as const
/** the gutter law · parallel slabs keep ≥0.35 slab-width of clear air in X —
    abreast must never read as touching */
export const X_GAP = 2.9
export const WAVE_GAP = 3.7
/** each deeper wave rises — the amphitheater read: the road ahead is visible
    OVER the nearer waves, and the advance feels like ascending */
export const Y_STEP = 0.62
/** the camera keeps MORE distance on the focused wave (operator: « on doit
    moins étouffer ») — smaller slabs, more void, the register breathes */
export const FOCUS_DIST = 10
export const FOCUS_HEIGHT = 2.5
export const EDGE_SEGS = 24

export interface PlanSlab {
  task: FlagshipTask
  x: number
  y: number
  z: number
}

export interface PlanEdge {
  from: string
  to: string
  /** subdivided gentle arc, (EDGE_SEGS+1) × xyz */
  pts: Float32Array
}

export interface PlanSceneModel {
  slabs: PlanSlab[]
  byId: Map<string, PlanSlab>
  edges: PlanEdge[]
  waveZ: number[]
  /** recorded per-wave first-activity clock (ms), strictly increasing —
      the camera's dolly anchors */
  anchors: number[]
  /** the anchors mapped into run-window scroll fractions, min-gap paced —
      PACING is presentational (a 20ms wave must not teleport the camera),
      the ORDER and every event stay verbatim (the terminal's byPace law) */
  knots: number[]
  /** widest |x| across the slabs — the flatten camera's vertical fit */
  spanX: number
  totalMs: number
  waveCount: number
}

/** a task's recorded first-activity clock: interval start, or the gate-close
    instant for a skipped task (the when: WAS evaluated then) */
function startOf(entry: FlagshipEntry, taskId: string): number {
  const iv = taskInterval(entry, taskId)
  if (!iv) return 0
  return 'skipAt' in iv ? iv.skipAt : iv.start
}

export function buildPlanScene(entry: FlagshipEntry): PlanSceneModel {
  const { plan, trace } = entry
  const waveZ = plan.waves.map((_, w) => -w * WAVE_GAP)

  const slabs: PlanSlab[] = []
  for (let w = 0; w < plan.waves.length; w++) {
    const wave = plan.waves[w]
    for (let i = 0; i < wave.length; i++) {
      slabs.push({
        task: wave[i],
        x: (i - (wave.length - 1) / 2) * X_GAP,
        y: w * Y_STEP,
        z: waveZ[w],
      })
    }
  }
  const byId = new Map(slabs.map((s) => [s.task.id, s]))

  /* dependency edges · a gentle arc from the upstream slab's back face to the
     downstream slab's front face (the pulse's runway) */
  const edges: PlanEdge[] = []
  for (const s of slabs) {
    for (const d of s.task.deps) {
      const from = byId.get(d)
      if (!from) continue
      /* leave the upstream slab's top-back edge, land on the downstream
         slab's lower-front edge — the trace enters from below, never
         crossing the face it lights */
      const ax = from.x
      const ay = from.y + SLAB.h * 0.24
      const az = from.z - SLAB.d / 2
      const bx = s.x
      const by = s.y - SLAB.h * 0.32
      const bz = s.z + SLAB.d / 2
      const mx = (ax + bx) / 2
      const my = (ay + by) / 2 + 0.42 // the arc lifts a touch
      const mz = (az + bz) / 2
      const pts = new Float32Array((EDGE_SEGS + 1) * 3)
      for (let k = 0; k <= EDGE_SEGS; k++) {
        const u = k / EDGE_SEGS
        const v = 1 - u
        pts[k * 3] = v * v * ax + 2 * v * u * mx + u * u * bx
        pts[k * 3 + 1] = v * v * ay + 2 * v * u * my + u * u * by
        pts[k * 3 + 2] = v * v * az + 2 * v * u * mz + u * u * bz
      }
      edges.push({ from: d, to: s.task.id, pts })
    }
  }

  /* per-wave recorded anchors (strictly increasing — topological order holds
     in a real trace; the epsilon guards identical clocks) */
  const anchors: number[] = []
  for (let w = 0; w < plan.waves.length; w++) {
    const first = Math.min(...plan.waves[w].map((t) => startOf(entry, t.id)))
    anchors.push(w === 0 ? Math.max(0, first) : Math.max(anchors[w - 1] + 1, first))
  }

  /* scroll-paced knots · a real run front-loads instant invokes (wave 0 can
     occupy 0.1% of the clock) and can close its gate on the last recorded ms.
     The camera must still GLIDE — so each wave holds a minimum share of the
     run window. Forward pass enforces the min gap, backward pass keeps the
     tail inside 1. Recorded order is untouched. */
  const minGap = Math.min(0.22, 0.9 / plan.waveCount)
  const knots = anchors.map((a) => a / Math.max(1, trace.totalMs))
  for (let w = 1; w < knots.length; w++) knots[w] = Math.max(knots[w], knots[w - 1] + minGap)
  knots[knots.length - 1] = Math.min(knots[knots.length - 1], 1)
  for (let w = knots.length - 2; w >= 0; w--) knots[w] = Math.min(knots[w], knots[w + 1] - minGap)

  return {
    slabs,
    byId,
    edges,
    waveZ,
    anchors,
    knots,
    spanX: slabs.reduce((m, s) => Math.max(m, Math.abs(s.x)), 0),
    totalMs: trace.totalMs,
    waveCount: plan.waveCount,
  }
}

/* ── the advance · run-window scroll fraction → continuous focus index ─────── */
export function focusAt(model: PlanSceneModel, rf: number): number {
  const k = model.knots
  const last = k.length - 1
  if (rf <= k[0]) return 0
  for (let w = 0; w < last; w++) {
    if (rf < k[w + 1]) return w + (rf - k[w]) / (k[w + 1] - k[w])
  }
  return last
}

export interface CamPose {
  px: number
  py: number
  pz: number
  tx: number
  ty: number
  tz: number
  /** the camera's up vector — (0,1,0) everywhere except the flatten, where
      it rolls to (-1,0,0) so the flat map reads left→right like the 2D DAG */
  ux: number
  uy: number
  uz: number
  /** the continuous focus wave index driving fades + the field focal */
  f: number
}

const lerp = (a: number, b: number, k: number): number => a + (b - a) * k

/* ── the flatten · the 3D plan lies down into the 2D map (wave K) ─────────────
   As the verdict settles the camera RISES to top-down while it ROLLS a
   quarter turn (up → -X), so the flattened plan reads exactly like the flat
   DOM DAG that crossfades in at PH.flat1: waves left→right, parallel tasks
   stacked. The slabs lie face-up in place (ThePlanScene drives their pitch +
   yaw from the same flattenAt), so "the same plan, flat" is WATCHED
   happening — and scrubbing back stands the whole room up again. */

/** the flatten's apex — the crane's two beats join here: pull-back BELOW,
    dive-and-roll ABOVE (fraction of the flat window) */
export const FLAT_APEX = 0.55

export function flattenAt(p: number): number {
  return easeInOut(clamp01((p - PH.run1) / (PH.flat1 - PH.run1)))
}

/** the flatten's LEAD track — the slab lie-down and the whole-graph relight
    run ~1.5× ahead of the crane, so the plan lies down WATCHED from the
    rising camera's best seat and the exit-0 sweep crosses a lit map */
export function flattenLeadAt(p: number): number {
  return easeInOut(clamp01(((p - PH.run1) / (PH.flat1 - PH.run1)) * 1.5))
}

/** the flatten's ROLL track — 0 through the pull-back, turning only during
    the dive. The slabs' yaw rides this SAME curve, so a face and the camera
    roll together and the labels stay upright through the whole turn. */
export function flattenRollAt(p: number): number {
  const kr = clamp01((p - PH.run1) / (PH.flat1 - PH.run1))
  return easeInOut(clamp01((kr - FLAT_APEX) / (1 - FLAT_APEX)))
}

/** a slab's X-pitch through the flatten: its pass-by lean k→0, face-up at 1 */
export const flatPitch = (base: number, k: number): number =>
  base + (-Math.PI / 2 - base) * k

/** a slab's Y-yaw through the flatten: a quarter turn so the face's reading
    direction matches the rolled camera (labels stay upright on screen) */
export const flatYaw = (k: number): number => (k * Math.PI) / 2

const TAN_HALF_FOV = Math.tan((35 / 2) * (Math.PI / 180))

/** the camera as a pure function of scroll progress — overview through the
    burst, glide onto wave 0 while the wires draw, dolly forward with the
    recorded run, then the flatten: rise + roll to top-down over the plan
    center for the verdict (the 3D→2D metaphor made literal) */
export function camAt(model: PlanSceneModel, p: number): CamPose {
  const depth = (model.waveCount - 1) * WAVE_GAP
  const rise = (model.waveCount - 1) * Y_STEP
  /* overview · pulled back + elevated, the whole plan rising ahead */
  const ov = {
    px: 0,
    py: 3.6,
    pz: 12,
    tx: 0,
    ty: rise * 0.42 - 0.1,
    tz: -depth * 0.45,
  }
  const f = focusAt(model, runFracAt(p))
  const fz = -f * WAVE_GAP
  const fy = f * Y_STEP
  const fo = {
    px: 0,
    py: FOCUS_HEIGHT + fy,
    pz: fz + FOCUS_DIST,
    tx: 0,
    ty: fy - 0.15,
    tz: fz - WAVE_GAP * 0.5,
  }

  if (p <= PH.burstEnd) return { ...ov, ux: 0, uy: 1, uz: 0, f: -0.4 }
  if (p < PH.run0) {
    /* the glide · overview → wave-0 focus while the wires draw */
    const k = easeInOut(clamp01((p - PH.burstEnd) / (PH.run0 - PH.burstEnd)))
    return {
      px: lerp(ov.px, fo.px, k),
      py: lerp(ov.py, fo.py, k),
      pz: lerp(ov.pz, fo.pz, k),
      tx: lerp(ov.tx, fo.tx, k),
      ty: lerp(ov.ty, fo.ty, k),
      tz: lerp(ov.tz, fo.tz, k),
      ux: 0,
      uy: 1,
      uz: 0,
      f: lerp(-0.4, 0, k),
    }
  }
  if (p <= PH.run1) return { ...fo, ux: 0, uy: 1, uz: 0, f }

  /* the flatten · a CRANE in two beats, joined at the apex (film grammar:
     one idea per move).
       BEAT 1 · the pull-back — up and BACK to a high overview behind the
       front wave, gaze settling on the plan center: the whole amphitheater
       swings into frame ("behold the plan") and the exit-0 sweep crosses it
       in full view while the slabs lie face-up on the lead track.
       BEAT 2 · the dive — from the apex straight over the plan center,
       rolling a quarter turn (up → -X) so the lying map reads left→right
       like the 2D DAG about to crossfade in. The slabs' yaw rides the SAME
       roll curve, so labels stay upright through the whole turn.
     The top height fits the rolled frame: screen-vertical = the X span,
     screen-horizontal = the Z span (the wave road, aspect-assisted). */
  const kr = clamp01((p - PH.run1) / (PH.flat1 - PH.run1))
  const cz = -depth / 2
  const halfV = model.spanX + SLAB.h / 2 + 0.9
  const halfZ = depth / 2 + SLAB.w / 2 + 1.2
  const top = Math.max(halfV, halfZ * 0.62) / TAN_HALF_FOV
  /* the apex pose · high + far enough back that the whole graph sits inside
     the vertical fov with the gaze on center */
  const apexY = Math.max(fo.py + 4.2, top * 0.62)
  const apexZ = 11.5
  if (kr <= FLAT_APEX) {
    const kA = easeInOut(kr / FLAT_APEX)
    return {
      px: fo.px,
      py: lerp(fo.py, apexY, kA),
      pz: lerp(fo.pz, apexZ, kA),
      tx: fo.tx,
      ty: lerp(fo.ty, 0.5, kA),
      tz: lerp(fo.tz, cz, kA),
      ux: 0,
      uy: 1,
      uz: 0,
      f,
    }
  }
  const kB = easeInOut((kr - FLAT_APEX) / (1 - FLAT_APEX))
  const ux = -kB
  const uy = 1 - kB
  const ul = Math.hypot(ux, uy) || 1
  return {
    px: 0,
    py: lerp(apexY, top, kB),
    pz: lerp(apexZ, cz, kB),
    tx: 0,
    ty: lerp(0.5, 0.4, kB),
    tz: cz,
    ux: ux / ul,
    uy: uy / ul,
    uz: 0,
    f,
  }
}

/* ── the light · recorded run states projected on the structure ────────────── */
export type SlabRunState = 'pending' | 'running' | 'done' | 'skipped'

/** mirror of the DOM morph's node states (timelineAt) for one task */
export function slabStateAt(entry: FlagshipEntry, taskId: string, p: number): SlabRunState {
  const rf = runFracAt(p)
  const t = rf * entry.trace.totalMs
  const iv = taskInterval(entry, taskId)
  if (!iv) return 'pending'
  if ('skipAt' in iv) return t >= iv.skipAt && rf > 0 ? 'skipped' : 'pending'
  if (t >= iv.end && rf > 0) return 'done'
  if (t >= iv.start && rf > 0) return 'running'
  return 'pending'
}

/** the slab's materialize amount 0..1 — the same timing the DOM nodes use:
    the slab is BORN when its seed chip lands (per-task aspiration, reading
    order — `index` is the task's file-order index, not its wave) */
export function materializeAt(p: number, index: number, count: number): number {
  return igniteAt(aspireAt(p, index, count))
}

/** the scroll progress at which a recorded clock (ms) lands in the run window */
function pOfClock(entry: FlagshipEntry, ms: number): number {
  return PH.run0 + (ms / Math.max(1, entry.trace.totalMs)) * (PH.run1 - PH.run0)
}

/** the when: gate seal 0..1 — the honestly-closed task flattens + dims across
    a short SCROLL window opening at the recorded gate-close instant (the gate
    can close on the run's last recorded ms — the seal must still be seen) */
export function sealAt(entry: FlagshipEntry, taskId: string, p: number): number {
  const iv = taskInterval(entry, taskId)
  if (!iv || !('skipAt' in iv)) return 0
  if (runFracAt(p) <= 0) return 0
  /* 0.03 of scroll: even a gate closing on the run's final recorded ms
     finishes sealing well inside the flat window (run1 → flat1 = 0.07) */
  return easeInOut(clamp01((p - pOfClock(entry, iv.skipAt)) / 0.03))
}

/* ── the beats · each recorded event, one distinct legible accent ─────────────
   Every beat OPENS at a recorded clock mapped into the run window (pOfClock)
   and plays across a short SCROLL window — the same presentational-pacing law
   the camera knots follow: the INSTANT and the ORDER are recorded fact, the
   window is the reading time. A clock at ms≈0 is clamped so its beat still
   gets its full window inside the run (the knots' min-gap law, per beat).
   All envelopes are pure functions of p — scrubbing back replays every beat
   in reverse and nothing can teleport. */

const PULSE_WIN = 0.035
const RING_WIN = 0.03
const SETTLE_WIN = 0.028
const CHORD_WIN = 0.035
const SWEEP_WIN = 0.024
const FAIL_WIN = 0.04

/** sin-π bell · the beat family's accent envelope (zero at both ends) */
const bell = (t: number): number => (t <= 0 || t >= 1 ? 0 : Math.sin(Math.PI * t))

export interface EdgePulse {
  /** pulse head position along the edge 0..1 */
  pos: number
  /** 0..1 envelope (0 = no pulse visible) */
  strength: number
}

/** the scroll instant a task's start beat lands — its recorded first-activity
    clock, clamped so the pulse's whole travel fits inside the run window
    (parallel tasks share clocks → their beats stay simultaneous) */
export function pulseArriveP(entry: FlagshipEntry, taskId: string): number {
  return Math.max(pOfClock(entry, startOf(entry, taskId)), PH.run0 + PULSE_WIN)
}

/** the ignite pulse traveling an incoming edge — it ARRIVES at the scroll
    instant of the downstream task's recorded start (parallel tasks share
    clocks, so their pulses travel together); the travel is a short scroll
    window, so scrubbing back replays it in reverse */
export function edgePulseAt(entry: FlagshipEntry, toTaskId: string, p: number): EdgePulse {
  if (runFracAt(p) <= 0) return { pos: 0, strength: 0 }
  const arriveP = pulseArriveP(entry, toTaskId)
  const phase = (p - (arriveP - PULSE_WIN)) / PULSE_WIN
  if (phase <= 0 || phase >= 1.6) return { pos: clamp01(phase), strength: 0 }
  const pos = clamp01(phase)
  const tail = phase <= 1 ? phase : 1 - (phase - 1) / 0.6
  return { pos, strength: Math.sin((Math.PI / 2) * clamp01(tail)) }
}

export interface RingBeat {
  /** expansion 0..1 (easeOut — the flash is an energy release) */
  k: number
  /** alpha envelope 0..1 */
  a: number
}

/** task_started, ON the slab · a verb-hued frame flash expanding off the slab
    the instant its pulse arrives (wave-0 tasks have no incoming edge — the
    ring alone announces their start). For a skipped task the same beat fires
    at the recorded gate-close instant: the when: acted HERE.
    `out` is a caller-owned scratch — the frame loop must not allocate. */
export function ringAt(entry: FlagshipEntry, taskId: string, p: number, out: RingBeat): RingBeat {
  out.k = 0
  out.a = 0
  if (runFracAt(p) <= 0) return out
  const t = (p - pulseArriveP(entry, taskId)) / RING_WIN
  if (t <= 0 || t >= 1) return out
  const inv = 1 - t
  out.k = 1 - inv * inv * inv
  out.a = inv * inv
  return out
}

/** task_completed · the ✓ + recorded ms land WITH a body beat (a soft
    press-in on the slab, a brief lift of its settled light) — never a bare
    texture swap. Bell envelope at the recorded completion clock. */
export function settleAt(entry: FlagshipEntry, taskId: string, p: number): number {
  if (runFracAt(p) <= 0) return 0
  const iv = taskInterval(entry, taskId)
  if (!iv || 'skipAt' in iv) return 0
  const open = Math.max(pOfClock(entry, iv.end), PH.run0 + 0.01)
  return bell(clamp01((p - open) / SETTLE_WIN))
}

/** the run-together chord · one shared breath of the scene per task start,
    STACKING when recorded starts share a clock — N tasks that really started
    together breathe N× as deep (the run-together moment, unmistakable), a
    solo start stays quiet. Honest by construction: the plan may declare a
    wave parallel, but the chord only deepens when the RECORDED clocks agree
    (social-repurpose's trio really started seconds apart — it gets three
    quiet breaths, not one deep one). */
export function chordAt(entry: FlagshipEntry, model: PlanSceneModel, p: number): number {
  if (runFracAt(p) <= 0) return 0
  let sum = 0
  for (const s of model.slabs) {
    const t = (p - pulseArriveP(entry, s.task.id)) / CHORD_WIN
    if (t <= 0 || t >= 1) continue
    sum += bell(t)
  }
  return clamp01(sum * 0.4)
}

export interface SweepBeat {
  /** the light front's travel 0..1 (front of the graph → back) */
  front: number
  /** 0..1 strength envelope */
  s: number
}

/** workflow_completed, exit 0 · ONE light wave travels the whole graph
    front-to-back — the run finished clean, recapped in the direction it
    flowed. Opens as the verdict crane nears its apex (a beat after the
    recorded completion instant — the whole graph must be IN FRAME when the
    light crosses it); silent on a failed run.
    `out` is a caller-owned scratch — the frame loop must not allocate. */
export function sweepAt(entry: FlagshipEntry, p: number, out: SweepBeat): SweepBeat {
  out.front = 0
  out.s = 0
  if (entry.trace.exit !== 0 || runFracAt(p) <= 0) return out
  const open = pOfClock(entry, entry.trace.totalMs) + 0.028
  const t = (p - open) / SWEEP_WIN
  if (t <= 0 || t >= 1) {
    out.front = clamp01(t)
    return out
  }
  out.front = t
  out.s = bell(t)
  return out
}

/** task_failed · a red flash on the failing slab only, at its recorded
    failure clock. Dormant for every current flagship (all five traces exit
    0) — the beat exists so a future recorded failure needs zero new code. */
export function failFlashAt(entry: FlagshipEntry, taskId: string, p: number): number {
  if (runFracAt(p) <= 0) return 0
  const rec = entry.trace.steps.find((s) => s.kind === 'task_failed' && s.task === taskId)
  if (!rec) return 0
  const open = Math.max(pOfClock(entry, rec.atMs), PH.run0 + 0.01)
  return bell(clamp01((p - open) / FAIL_WIN))
}

/* ── the chips · recorded facts on the tooltip card (mirrors the DOM nodes) ── */
export function chipAt(entry: FlagshipEntry, task: FlagshipTask, state: SlabRunState): string {
  if (state === 'running') return '● running'
  if (state === 'skipped') return '⊘ skipped · gate closed'
  if (state === 'done') {
    const done = entry.trace.steps.find(
      (st) => st.kind === 'task_completed' && st.task === task.id,
    )
    return done?.durationMs !== undefined ? `✓ ${formatMs(done.durationMs)}` : '✓ done'
  }
  return ''
}

/** the ON-SLAB status line (the face-compact form of chipAt) — the block
    itself says what the recorded run did to it: '' idle · ▸ running ·
    ✓ done + recorded ms · ⊘ skipped. Same recorded facts, never invented. */
export function faceChipAt(entry: FlagshipEntry, task: FlagshipTask, state: SlabRunState): string {
  if (state === 'running') return '▸ running'
  if (state === 'skipped') return '⊘ skipped'
  if (state === 'done') {
    const done = entry.trace.steps.find(
      (st) => st.kind === 'task_completed' && st.task === task.id,
    )
    return done?.durationMs !== undefined ? `✓ ${formatMs(done.durationMs)}` : '✓ done'
  }
  return ''
}

/* ── palette (tokens.css values baked, the DitherField convention) ─────────── */
export const VERB_HUE: Record<NikaVerb, [number, number, number]> = {
  infer: [0.357, 0.549, 1.0], // #5b8cff
  exec: [1.0, 0.478, 0.235], // #ff7a3c
  invoke: [0.133, 0.827, 0.933], // #22d3ee
  agent: [0.69, 0.482, 1.0], // #b07bff
}
/** the same verb hues as hex — canvas-label ink (the label atlas draws with
    2D canvas, which wants CSS colors) */
export const VERB_HEX: Record<NikaVerb, string> = {
  infer: '#5b8cff',
  exec: '#ff7a3c',
  invoke: '#22d3ee',
  agent: '#b07bff',
}
export const RAMP_LO: [number, number, number] = [0.031, 0.035, 0.043] // #08090b
export const RAMP_MID: [number, number, number] = [0.086, 0.137, 0.247] // #16233f
export const RAMP_HI: [number, number, number] = [0.31, 0.525, 1.0] // #4f86ff
export const EDGE_BLUE: [number, number, number] = [0.553, 0.706, 1.0] // #8db4ff
/** the failure red — same ink the verdict line's `✗ exit 1` uses (#ff5d5d) */
export const FAIL_RED: [number, number, number] = [1.0, 0.365, 0.365]

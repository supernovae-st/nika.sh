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

   Shares PH / flightAt / runFracAt with the DOM morph so the 3D layer and the
   DOM story can never disagree about timing. HONESTY: every state change maps
   to a recorded event; nothing here invents data. */

import type { FlagshipEntry, FlagshipTask, NikaVerb } from '../../flagships'
import { formatMs } from '../../flagships'
import { PH, clamp01, easeInOut, flightAt, runFracAt, taskInterval } from './morph-model'

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
export const FOCUS_DIST = 8.2
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
  /** the continuous focus wave index driving fades + the field focal */
  f: number
}

const lerp = (a: number, b: number, k: number): number => a + (b - a) * k

/** the camera as a pure function of scroll progress — overview through the
    burst, glide onto wave 0 while the wires draw, dolly forward with the
    recorded run, a small pull-back as the verdict settles */
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

  if (p <= PH.burstEnd) return { ...ov, f: -0.4 }
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
      f: lerp(-0.4, 0, k),
    }
  }
  if (p <= PH.run1) return { ...fo, f }

  /* the hold · recede, the settled structure back in view for the verdict */
  const k = easeInOut(clamp01((p - PH.run1) / (1 - PH.run1)))
  return {
    px: fo.px,
    py: lerp(fo.py, fo.py + 1.9, k),
    pz: lerp(fo.pz, fo.pz + 4.2, k),
    tx: fo.tx,
    ty: fo.ty,
    tz: fo.tz,
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

/** the slab's materialize amount 0..1 — the same timing the DOM nodes use
    (they appear where their file lines land, at 55% of the wave's flight) */
export function materializeAt(p: number, wave: number, waveCount: number): number {
  return clamp01((flightAt(p, wave, waveCount) - 0.55) / 0.4)
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
  /* 0.03 = the widest window that still completes when the gate closes on
     the run's final recorded ms (run1 → 1 leaves 0.03 of scroll) */
  return easeInOut(clamp01((p - pOfClock(entry, iv.skipAt)) / 0.03))
}

export interface EdgePulse {
  /** pulse head position along the edge 0..1 */
  pos: number
  /** 0..1 envelope (0 = no pulse visible) */
  strength: number
}

/** the ignite pulse traveling an incoming edge — it ARRIVES at the scroll
    instant of the downstream task's recorded start (parallel tasks share
    clocks, so their pulses travel together); the travel is a short scroll
    window, so scrubbing back replays it in reverse */
export function edgePulseAt(entry: FlagshipEntry, toTaskId: string, p: number): EdgePulse {
  if (runFracAt(p) <= 0) return { pos: 0, strength: 0 }
  const arriveP = pOfClock(entry, startOf(entry, toTaskId))
  const win = 0.035
  const phase = (p - (arriveP - win)) / win
  if (phase <= 0 || phase >= 1.6) return { pos: clamp01(phase), strength: 0 }
  const pos = clamp01(phase)
  const tail = phase <= 1 ? phase : 1 - (phase - 1) / 0.6
  return { pos, strength: Math.sin((Math.PI / 2) * clamp01(tail)) }
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

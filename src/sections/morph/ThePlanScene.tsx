import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { FlagshipEntry, FlagshipTask } from '../../flagships'
import { PH, clamp01, easeInOut, wireAt } from './morph-model'
import {
  EDGE_BLUE,
  EDGE_SEGS,
  FAIL_RED,
  FOCUS_DIST,
  RAMP_HI,
  SLAB,
  TAN_HALF_FOV,
  VERB_HUE,
  WAVE_GAP,
  Y_STEP,
  buildPlanScene,
  camAt,
  chipAt,
  chordAt,
  edgePulseAt,
  faceChipAt,
  failFlashAt,
  flatFrame,
  flatPitch,
  flatYaw,
  flattenLeadAt,
  flattenRollAt,
  materializeAt,
  ringAt,
  sealAt,
  settleAt,
  slabStateAt,
  sweepAt,
  type PlanSceneModel,
  type RingBeat,
  type SweepBeat,
} from './plan-scene-model'
import {
  makeDepLayer,
  makeEdgeLayer,
  makeFieldLayer,
  makeFillLayer,
  makeFloorLayer,
  makeGlowLayer,
  makeHorizonLayer,
  makeLabelAtlas,
} from './plan-scene-three'
import { DEPENDS_WORDS, VERB_WORDS, WHEN_WORDS } from './plain-words'
import './plan-scene.css'

/* ─── ThePlanScene · the 3D DAG moment (wave H) ───────────────────────────────
   Desktop-only WebGL layer over the morph's DAG beat: each task of the
   SELECTED flagship is a dither-lit wireframe slab, waves at stepped depths,
   parallel tasks abreast. The camera reads the SAME scroll progress the DOM
   morph computes (progressRef — scroll is time, nothing hijacked) and dollies
   head-on through the waves as the recorded run plays: pulses travel the
   dependency edges, slabs ignite in their verb hue, the honestly-closed
   when: gate seals. Through the `flat` phase (wave K) the camera rises and
   rolls to top-down while every slab lies face-up — the 3D plan is WATCHED
   lying down into the flat map — and at `done` the DOM DAG (the mobile /
   reduced-motion / no-WebGL truth, kept in layout underneath via
   [data-plan3d], set HERE) crossfades in as the closing frame: the same
   plan, flat, now literally so.

   IDENTITY LIVES ON THE SLAB: each face carries its task id + verb word (in
   the verb hue) + a status zone (▸ running · ✓ recorded ms · ⊘ skipped) via
   a per-task label-atlas tile, repainted only on status change — a label can
   never detach from its block. The DOM buttons over the canvas are invisible
   hit-rects (hover + keyboard focus + AT names), re-projected every frame.

   HONESTY: everything derives from the flagship corpus + recorded traces via
   plan-scene-model (pure, tested); the face status zone shows the same
   recorded facts the DOM chips show. */

interface Props {
  flagship: FlagshipEntry
  /** the ONE scroll progress ScrollMorph.apply() writes each frame */
  progressRef: React.MutableRefObject<number>
  stageRef: React.RefObject<HTMLDivElement | null>
  cardRef: React.RefObject<HTMLDivElement | null>
  /** OUT · per-task slab REST-pose screen centers + relative projected width
      (ps-layer px) — the seed chips' landing targets while the slabs are the
      visible DAG (written every frame; the camera never leaves them stale) */
  slabTargetsRef?: React.MutableRefObject<Map<string, [number, number, number]>>
}

interface HoverUi {
  /** hovered task id — read by the frame loop (glow) + tooltip positioning */
  hoverRef: React.MutableRefObject<string | null>
  /** 'bill' anchors the tooltip to the billboard; 'yaml' to the pointer */
  sourceRef: React.MutableRefObject<'bill' | 'yaml'>
  billRefs: React.MutableRefObject<Map<string, HTMLButtonElement | null>>
  tipRef: React.RefObject<HTMLDivElement | null>
  layerRef: React.RefObject<HTMLDivElement | null>
}

const smoothstep = (a: number, b: number, x: number): number => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

/* scratch objects — zero per-frame allocation */
const M = new THREE.Matrix4()
const MY = new THREE.Matrix4()
const V = new THREE.Vector3()
const W = new THREE.Vector3()
const SCL = new THREE.Vector3()
const RING: RingBeat = { k: 0, a: 0 }
const SWEEP: SweepBeat = { front: 0, s: 0 }

const GREY: [number, number, number] = [0.36, 0.4, 0.48]

/* the pass-by window (world units of camera-to-slab distance): a wave is
   fully lit through its OWN beat (prox ≥ 7.6), half-quiet already while the
   camera glides to the next one, and a ≤0.25-alpha ghost exiting via the
   sides before it can crowd the frame's bottom — past = quieter, the
   focused wave owns the air */
const PASS_NEAR = 5.0
const PASS_FAR = 7.6
/* passing slabs lean their face up toward the elevated camera (X-pitch, up
   to ~26°) — the just-done wave must stay READABLE (id · verb · ✓ ms) while
   it recedes, never a foreshortened anonymous sliver */
const PITCH_MAX = 0.46

/* ── the frame loop · every visual is a pure function of progressRef ───────── */
function Advance({
  entry,
  model,
  progressRef,
  ui,
  slabTargetsRef,
  stageRef,
}: {
  entry: FlagshipEntry
  model: PlanSceneModel
  progressRef: React.MutableRefObject<number>
  ui: HoverUi
  slabTargetsRef?: React.MutableRefObject<Map<string, [number, number, number]>>
  stageRef: React.RefObject<HTMLDivElement | null>
}) {
  const camera = useThree((s) => s.camera)
  /* the landing map (W10) · for each task, the world pose that projects
     EXACTLY onto its DOM card through the flatten's final camera (flatFrame)
     — measured lazily from the real `.morph-node` rects (they keep layout
     under [data-plan3d]) and re-derived when the canvas resizes. The dive
     lerps every slab toward these targets, so at roll=1 the flat 3D map is
     pixel-aligned with the 2D DAG and the crossfade never teleports. */
  const flatMapRef = useRef<{
    key: string
    map: Map<string, { x: number; z: number; w: number; h: number }>
  } | null>(null)
  /* file-order index per task — the aspiration beat (reading order) */
  const order = useMemo(
    () => new Map(entry.plan.tasks.map((t, i) => [t.id, i])),
    [entry],
  )
  const layers = useMemo(() => {
    const n = model.slabs.length
    const atlas = makeLabelAtlas(model.slabs.map((s) => s.task))
    return {
      atlas,
      fills: makeFillLayer(n, atlas),
      edges: makeEdgeLayer(n * 4),
      deps: makeDepLayer(model),
      field: makeFieldLayer(),
      glow: makeGlowLayer(),
      floor: makeFloorLayer(model.waveCount),
      horizon: makeHorizonLayer(model.waveCount),
    }
  }, [model])
  useEffect(
    () => () => {
      layers.atlas.dispose()
      layers.fills.dispose()
      layers.edges.dispose()
      layers.deps.dispose()
      layers.field.dispose()
      layers.glow.dispose()
      layers.floor.dispose()
      layers.horizon.dispose()
    },
    [layers],
  )

  /* the label tiles are painted lazily by the frame loop (chipSig misses) —
     once the real mono font lands, void the signatures so every tile repaints
     with the face it was designed for */
  const chipSig = useRef<Record<string, string>>({})
  useEffect(() => {
    let live = true
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready
        .then(() => {
          if (live) chipSig.current = {}
        })
        .catch(() => {})
    }
    return () => {
      live = false
    }
  }, [])

  /* per-vertex t params along each dependency edge (static) */
  const depT = useMemo(() => {
    const t = new Float32Array(EDGE_SEGS * 2)
    for (let s = 0; s < EDGE_SEGS; s++) {
      t[s * 2] = s / EDGE_SEGS
      t[s * 2 + 1] = (s + 1) / EDGE_SEGS
    }
    return t
  }, [])
  /* per-edge midpoint z (static) — the exit-0 sweep's distance to each wire */
  const depMidZ = useMemo(
    () => Float32Array.from(model.edges, (e) => e.pts[Math.floor(EDGE_SEGS / 2) * 3 + 2]),
    [model],
  )

  useFrame((state) => {
    const p = progressRef.current
    const cam = camAt(model, p)
    camera.up.set(cam.ux, cam.uy, cam.uz)
    camera.position.set(cam.px, cam.py, cam.pz)
    camera.lookAt(cam.tx, cam.ty, cam.tz)

    const gFade = clamp01((p - PH.burst0) / 0.08)
    const runEnv = clamp01((p - PH.term0) / 0.1)
    const hovered = ui.hoverRef.current

    /* ── the shared beats (computed once per frame, scratch out-params) ── */
    /* the run-together chord · the whole scene takes one breath when tasks
       start together on the recorded clock — the rings carry the WHERE */
    const chord = chordAt(entry, model, p)
    /* the exit-0 sweep · one light front crossing the graph front-to-back */
    const sweep = sweepAt(entry, p, SWEEP)
    /* the flatten · slabs lie face-up + the whole graph relights on the
       LEAD track (ahead of the crane — the lie-down is watched, the sweep
       crosses a lit map) while the room stands down (floor grid · horizon ·
       glow read wrong from above). The slab YAW rides the camera's ROLL
       curve — face and lens turn together, labels stay upright. */
    const flat = flattenLeadAt(p)
    const roll = flattenRollAt(p)
    const yaw = flatYaw(roll)
    const depth = (model.waveCount - 1) * WAVE_GAP

    /* the landing map · measured on first dive frame (or after a resize) */
    let landing: Map<string, { x: number; z: number; w: number; h: number }> | null = null
    if (roll > 0) {
      const cr = state.gl.domElement.getBoundingClientRect()
      const key = `${Math.round(cr.width)}x${Math.round(cr.height)}`
      if ((!flatMapRef.current || flatMapRef.current.key !== key) && cr.width > 0) {
        const stage = stageRef.current
        if (stage) {
          const { top, cz } = flatFrame(model)
          const worldPerPx = (2 * top * TAN_HALF_FOV) / cr.height
          const aspect = cr.width / cr.height
          const map = new Map<string, { x: number; z: number; w: number; h: number }>()
          for (const el of stage.querySelectorAll<HTMLElement>('.morph-node[data-task]')) {
            const id = el.dataset.task
            if (!id) continue
            const r = el.getBoundingClientRect()
            /* inverse-project the card center through the FINAL pose: the
               rolled top-down camera maps screen-right → world −Z and
               screen-down → world +X (see plan-scene-model camAt) */
            const ndcX = ((r.left + r.width / 2 - cr.left) / cr.width) * 2 - 1
            const ndcY = 1 - ((r.top + r.height / 2 - cr.top) / cr.height) * 2
            map.set(id, {
              x: -ndcY * top * TAN_HALF_FOV,
              z: cz - ndcX * top * TAN_HALF_FOV * aspect,
              w: r.width * worldPerPx,
              h: r.height * worldPerPx,
            })
          }
          if (map.size > 0) flatMapRef.current = { key, map }
        }
      }
      landing = flatMapRef.current?.map ?? null
    }
    /* the front starts a slab ahead of wave 0 and exits past the last wave —
       every slab sees the full rise AND fall of the passing light */
    const sweepZ = 2.2 - sweep.front * (depth + 4.4)

    /* the fond profond follows the current wave */
    const focalZ = -cam.f * WAVE_GAP
    const focalY = cam.f * Y_STEP
    layers.field.uniforms.uTime.value = state.clock.elapsedTime
    layers.field.uniforms.uFocal.value.set(0, focalY + 0.1, focalZ)
    layers.field.uniforms.uAmp.value =
      gFade * (0.55 + 0.45 * runEnv + 0.22 * chord) * (1 - 0.75 * flat)
    layers.glow.mesh.position.set(0, focalY - 0.4, focalZ - 1.6)
    layers.glow.mesh.quaternion.copy(camera.quaternion)
    layers.glow.uniforms.uOpacity.value =
      gFade * (0.2 * (0.4 + 0.6 * runEnv) + 0.14 * chord) * (1 - flat)
    /* the room · grid + horizon ground the dolly (world-fixed — the camera's
       advance is what moves; they brighten a touch as the run plays) and
       stand down through the flatten (a room makes no sense on a map) */
    layers.floor.uniforms.uFade.value = gFade * (0.55 + 0.45 * runEnv) * (1 - flat)
    layers.horizon.uniforms.uFade.value = gFade * (0.45 + 0.55 * runEnv) * (1 - flat)

    /* ── slabs ── */
    const fT = layers.fills.tint.array as Float32Array
    const fF = layers.fills.fade.array as Float32Array
    const eP = layers.edges.pos.array as Float32Array
    const eS = layers.edges.scale.array as Float32Array
    const eC = layers.edges.color.array as Float32Array
    const eA = layers.edges.alpha.array as Float32Array
    const eR = layers.edges.rot.array as Float32Array
    const eY = layers.edges.yaw.array as Float32Array

    const alphas: Record<string, number> = {}
    const centers: Record<string, [number, number, number, number, number]> = {}

    /* the seed→slab landing targets · REST-pose projection (mat = 1, no
       drift) so a chip can aim at a slab that hasn't materialized yet —
       width vs the front wave gives the chip its depth scale */
    if (slabTargetsRef) {
      const w = state.size.width
      const h = state.size.height
      let w0 = 0
      for (const slab of model.slabs) {
        V.set(slab.x, slab.y, slab.z).project(camera)
        const bx = (V.x * 0.5 + 0.5) * w
        const by = (-V.y * 0.5 + 0.5) * h
        W.set(slab.x + SLAB.w / 2, slab.y, slab.z).project(camera)
        const hw = Math.abs((W.x * 0.5 + 0.5) * w - bx)
        if (w0 === 0) w0 = Math.max(1, hw)
        slabTargetsRef.current.set(slab.task.id, [bx, by, hw / w0])
      }
    }

    for (let i = 0; i < model.slabs.length; i++) {
      const slab = model.slabs[i]
      const id = slab.task.id
      const st = slabStateAt(entry, id, p)
      const mat = easeInOut(
        materializeAt(p, order.get(id) ?? 0, entry.plan.tasks.length),
      )
      const seal = sealAt(entry, id, p)
      const ignite = edgePulseAt(entry, id, p).strength
      /* the per-event beats · task_started ring, task_completed settle,
         task_failed flash (dormant — no flagship trace records one), and
         this slab's share of the exit-0 sweep as the front passes its wave */
      const ring = ringAt(entry, id, p, RING)
      const settle = settleAt(entry, id, p)
      const fail = failFlashAt(entry, id, p)
      const swD = (sweepZ - slab.z) / 2.4
      const swB = sweep.s * Math.exp(-swD * swD)
      const prox = cam.pz - slab.z
      /* the flatten relights every slab evenly — pass-by dimming and the
         depth fade belong to the road view, not the map */
      const passedK = Math.max(smoothstep(PASS_NEAR, PASS_FAR, prox), flat)
      const farBase = Math.min(
        1,
        Math.max(0.25, 1 - (Math.max(0, prox - (FOCUS_DIST + WAVE_GAP * 0.8)) / (WAVE_GAP * 2.4)) * 0.75),
      )
      const farK = farBase + (1 - farBase) * flat
      const isHover = hovered === id

      let stateA = st === 'running' ? 1 : st === 'done' ? 0.82 : st === 'skipped' ? 0.42 : 0.55
      if (isHover) stateA = 1
      const alpha = gFade * mat * passedK * farK * Math.min(1, stateA + ignite * 0.5)
      alphas[id] = alpha

      /* the on-slab label · repaint ONLY when the recorded state changes */
      if (chipSig.current[id] !== st) {
        chipSig.current[id] = st
        layers.atlas.draw(i, slab.task, st, faceChipAt(entry, slab.task, st))
      }

      /* position · burst rise-in + the pass-by exit (sideways + a lift AWAY
         from the terminal band, never down into it) */
      const drift = 1 - passedK
      let px = slab.x + drift * Math.sign(slab.x || 0.6) * 2.2
      let py = slab.y - (1 - mat) * 0.5 + drift * 0.55
      let pz = slab.z

      /* scale · grow-in, the gate seal flattens, the pass-by shrinks hard,
         the completion settle presses the slab in for one beat (the ✓ lands
         WITH a body movement, never a bare texture swap) */
      const grow = (0.7 + 0.3 * mat) * (0.3 + 0.7 * passedK) * (1 - 0.045 * settle)
      let sx = SLAB.w * grow
      let sy = SLAB.h * grow * (1 - 0.45 * seal)
      const sz = SLAB.d * (1 - 0.4 * seal)

      /* the dive's landing (W10) · every slab migrates to the world pose
         that projects onto ITS DOM card at the final frame — position AND
         footprint — so the 2D map it becomes is the 2D map that fades in */
      const land = landing ? landing.get(id) : undefined
      if (land) {
        px += (land.x - px) * roll
        py += (0 - py) * roll
        pz += (land.z - pz) * roll
        sx += (land.w - sx) * roll
        sy += (land.h - sy) * roll
      }
      centers[id] = [px, py, pz, sx, sy]

      /* the pass pitch · 0 at focus distance, full lean by PASS_NEAR — and
         through the flatten every slab lies face-up (pitch → -90°) while it
         quarter-turns (yaw) so its label reads upright under the rolled
         camera: Ry(yaw)·Rx(pitch), the edge shader composes the same */
      const pitch = flatPitch(
        -PITCH_MAX *
          Math.min(1, Math.max(0, (FOCUS_DIST - prox) / (FOCUS_DIST - PASS_NEAR))),
        flat,
      )
      M.makeRotationX(pitch)
      if (yaw > 0) M.premultiply(MY.makeRotationY(yaw))
      M.scale(SCL.set(sx, sy, sz))
      M.setPosition(px, py, pz)
      layers.fills.mesh.setMatrixAt(i, M)

      /* fill tint · verb hue while running, settled blue when done; the
         settle beat lifts the fresh ✓ for one breath; the sweep front adds
         its passing light; a recorded failure overrides in the verdict red */
      const hue = VERB_HUE[slab.task.verb]
      let tr = 0
      let tg = 0
      let tb = 0
      let ta = 0
      if (st === 'running') [tr, tg, tb, ta] = [hue[0], hue[1], hue[2], 0.95]
      else if (st === 'done') [tr, tg, tb, ta] = [RAMP_HI[0], RAMP_HI[1], RAMP_HI[2], 0.3]
      else if (st === 'skipped') [tr, tg, tb, ta] = [GREY[0], GREY[1], GREY[2], 0.6]
      if (ignite > 0 && st !== 'skipped') {
        ;[tr, tg, tb] = [hue[0], hue[1], hue[2]]
        ta = Math.max(ta, ignite * 0.85)
      }
      if (settle > 0) ta = Math.max(ta, 0.3 + 0.35 * settle)
      if (swB > 0) {
        tr += (RAMP_HI[0] - tr) * swB * 0.5
        tg += (RAMP_HI[1] - tg) * swB * 0.5
        tb += (RAMP_HI[2] - tb) * swB * 0.5
        ta = Math.max(ta, 0.45 * swB)
      }
      if (fail > 0) {
        tr += (FAIL_RED[0] - tr) * fail
        tg += (FAIL_RED[1] - tg) * fail
        tb += (FAIL_RED[2] - tb) * fail
        ta = Math.max(ta, 0.9 * fail)
      }
      if (isHover) ta = Math.max(ta, 0.35)
      fT[i * 4] = tr
      fT[i * 4 + 1] = tg
      fT[i * 4 + 2] = tb
      fT[i * 4 + 3] = ta
      fF[i] = gFade * mat * passedK * (0.35 + 0.65 * farK)

      /* edge color per state · the sealing gate flashes its verb hue for one
         beat (the when: acted on data HERE) then settles to the skipped grey;
         the sweep brightens each cage as its light passes; failure goes red */
      let er = EDGE_BLUE[0] * 0.62
      let eg = EDGE_BLUE[1] * 0.62
      let eb = EDGE_BLUE[2] * 0.62
      if (st === 'running') [er, eg, eb] = hue
      else if (st === 'done') [er, eg, eb] = RAMP_HI
      else if (st === 'skipped') [er, eg, eb] = GREY
      if (ignite > 0 && st !== 'skipped') {
        er += (hue[0] - er) * ignite
        eg += (hue[1] - eg) * ignite
        eb += (hue[2] - eb) * ignite
      }
      const gateK = seal > 0 && seal < 1 ? Math.sin(Math.PI * seal) : 0
      if (gateK > 0) {
        er += (hue[0] - er) * gateK
        eg += (hue[1] - eg) * gateK
        eb += (hue[2] - eb) * gateK
      }
      if (swB > 0) {
        er += (RAMP_HI[0] * 1.2 - er) * swB * 0.6
        eg += (RAMP_HI[1] * 1.2 - eg) * swB * 0.6
        eb += (RAMP_HI[2] * 1.2 - eb) * swB * 0.6
      }
      if (fail > 0) {
        er += (FAIL_RED[0] - er) * fail
        eg += (FAIL_RED[1] - eg) * fail
        eb += (FAIL_RED[2] - eb) * fail
      }
      if (isHover) {
        er = Math.min(1, er * 1.25)
        eg = Math.min(1, eg * 1.25)
        eb = Math.min(1, eb * 1.25)
      }

      /* four instances per slab: outer frame · inset die detail (framing the
         face label, quiet) · the running-state glow cage in the verb hue —
         a screenshot mid-run shows WHICH block works without any motion —
         · the task_started RING: a verb-hued frame flash expanding off the
         slab the instant its recorded start lands, settling into the lit
         cage (the ignition has an attack, not just a color change) */
      const o = i * 4
      eP[o * 3] = px
      eP[o * 3 + 1] = py
      eP[o * 3 + 2] = pz
      eS[o * 3] = sx
      eS[o * 3 + 1] = sy
      eS[o * 3 + 2] = sz
      eC[o * 3] = er
      eC[o * 3 + 1] = eg
      eC[o * 3 + 2] = eb
      eA[o] = Math.min(1, alpha + swB * 0.35)
      eR[o] = pitch
      eY[o] = yaw
      const n = o + 1
      eP[n * 3] = px
      eP[n * 3 + 1] = py
      eP[n * 3 + 2] = pz + sz * 0.22
      eS[n * 3] = sx * 0.9
      eS[n * 3 + 1] = sy * 0.74
      eS[n * 3 + 2] = sz * 0.6
      eC[n * 3] = er
      eC[n * 3 + 1] = eg
      eC[n * 3 + 2] = eb
      eA[n] = alpha * 0.28
      eR[n] = pitch
      eY[n] = yaw
      const g = o + 2
      eP[g * 3] = px
      eP[g * 3 + 1] = py
      eP[g * 3 + 2] = pz
      eS[g * 3] = sx * 1.1
      eS[g * 3 + 1] = sy * 1.2
      eS[g * 3 + 2] = sz * 2.0
      eC[g * 3] = hue[0]
      eC[g * 3 + 1] = hue[1]
      eC[g * 3 + 2] = hue[2]
      eA[g] = alpha * (st === 'running' ? 0.55 : ignite * 0.3)
      eR[g] = pitch
      eY[g] = yaw
      const r4 = o + 3
      const ringGrow = 1 + 0.6 * ring.k
      eP[r4 * 3] = px
      eP[r4 * 3 + 1] = py
      eP[r4 * 3 + 2] = pz
      eS[r4 * 3] = sx * ringGrow
      eS[r4 * 3 + 1] = sy * ringGrow
      eS[r4 * 3 + 2] = sz
      eC[r4 * 3] = fail > 0 ? FAIL_RED[0] : hue[0]
      eC[r4 * 3 + 1] = fail > 0 ? FAIL_RED[1] : hue[1]
      eC[r4 * 3 + 2] = fail > 0 ? FAIL_RED[2] : hue[2]
      eA[r4] = gFade * mat * passedK * ring.a * 0.85
      eR[r4] = pitch
      eY[r4] = yaw
    }
    layers.fills.mesh.instanceMatrix.needsUpdate = true
    layers.fills.tint.needsUpdate = true
    layers.fills.fade.needsUpdate = true
    layers.edges.pos.needsUpdate = true
    layers.edges.scale.needsUpdate = true
    layers.edges.color.needsUpdate = true
    layers.edges.alpha.needsUpdate = true
    layers.edges.rot.needsUpdate = true
    layers.edges.yaw.needsUpdate = true

    /* ── dependency edges · draw-on + state + the traveling ignite pulse ── */
    const draw = wireAt(p)
    const dC = layers.deps.color.array as Float32Array
    const dA = layers.deps.alpha.array as Float32Array
    const vpe = layers.deps.vertsPerEdge
    for (let e = 0; e < model.edges.length; e++) {
      const edge = model.edges[e]
      const stTo = slabStateAt(entry, edge.to, p)
      const lit = stTo === 'running' || stTo === 'done' ? 1 : 0
      const seal = sealAt(entry, edge.to, p)
      const pulse = edgePulseAt(entry, edge.to, p)
      const hue = VERB_HUE[model.byId.get(edge.to)!.task.verb]
      const aFrom = alphas[edge.from] ?? 0
      const aTo = alphas[edge.to] ?? 0
      /* the dive retires the baked wires (their endpoints stay at the DAG
         rest pose while the slabs migrate to the landing map) — the flat
         DOM wires ink in with the crossfade right after (W10) */
      const eVis = gFade * Math.min(1, (aFrom + aTo) * 1.2) * (1 - 0.6 * seal) * (1 - roll)
      /* the exit-0 sweep crosses the wires too — the light travels the
         GRAPH, not just its blocks */
      const swE = (sweepZ - depMidZ[e]) / 2.6
      const swW = sweep.s * Math.exp(-swE * swE)
      for (let vi = 0; vi < vpe; vi++) {
        const tv = depT[vi]
        /* draw-on with a soft head (fully on once the wires finish) */
        const on = clamp01((draw * 1.05 - tv) / 0.05)
        const g = pulse.strength * Math.exp(-Math.pow((tv - pulse.pos) * 7.0, 2))
        const k = e * vpe + vi
        dC[k * 3] = EDGE_BLUE[0] * (0.5 + 0.3 * lit + 0.4 * swW) + hue[0] * g
        dC[k * 3 + 1] = EDGE_BLUE[1] * (0.5 + 0.3 * lit + 0.4 * swW) + hue[1] * g
        dC[k * 3 + 2] = EDGE_BLUE[2] * (0.5 + 0.3 * lit + 0.4 * swW) + hue[2] * g
        dA[k] = eVis * on * (0.24 + 0.2 * lit + g * 0.9 + swW * 0.45)
      }
    }
    layers.deps.color.needsUpdate = true
    layers.deps.alpha.needsUpdate = true

    /* ── hit-rects · invisible DOM buttons glued to the projected slab rect
       (hover + keyboard focus + AT names — the visible identity lives ON the
       slab face). Re-projected EVERY frame: they can never trail the camera. */
    {
      const w = state.size.width
      const h = state.size.height
      for (const slab of model.slabs) {
        const id = slab.task.id
        const el = ui.billRefs.current.get(id)
        if (!el) continue
        const c = centers[id]
        V.set(c[0], c[1], c[2]).project(camera)
        /* the flatten retires the hit-rects (their extents no longer track a
           lying slab; the flat DOM DAG takes the interaction over at done) */
        const vis = alphas[id] > 0.3 && V.z < 1 && flat < 0.15
        el.dataset.vis = vis ? '1' : '0'
        if (vis) {
          const bx = (V.x * 0.5 + 0.5) * w
          const by = (-V.y * 0.5 + 0.5) * h
          W.set(c[0] + c[3] / 2, c[1] + c[4] / 2, c[2]).project(camera)
          const hw = Math.abs((W.x * 0.5 + 0.5) * w - bx)
          const hh = Math.abs((-W.y * 0.5 + 0.5) * h - by)
          el.style.transform = `translate3d(${(bx - hw).toFixed(1)}px, ${(by - hh).toFixed(1)}px, 0)`
          el.style.width = `${(hw * 2).toFixed(1)}px`
          el.style.height = `${(hh * 2).toFixed(1)}px`
          /* the tooltip rides the slab's top edge (flipping below near the
             top of the section so it never covers the title) */
          if (ui.hoverRef.current === id && ui.sourceRef.current === 'bill' && ui.tipRef.current) {
            const topY = by - hh
            const flip = topY < Math.min(400, h * 0.58)
            ui.tipRef.current.dataset.flip = flip ? '1' : '0'
            ui.tipRef.current.style.left = `${Math.round(Math.min(Math.max(bx, 180), w - 180))}px`
            ui.tipRef.current.style.top = `${Math.round(flip ? by + hh + 10 : topY - 8)}px`
          }
        }
      }
    }
  })

  return (
    <group>
      <primitive object={layers.floor.mesh} />
      <primitive object={layers.horizon.mesh} />
      <primitive object={layers.field.points} />
      <primitive object={layers.glow.mesh} />
      <primitive object={layers.fills.mesh} />
      <primitive object={layers.deps.lines} />
      <primitive object={layers.edges.lines} />
      {/* one directional + hemisphere → the faces land on 3 luma plateaus */}
      <directionalLight position={[-4, 7, 6]} intensity={2.2} />
      <hemisphereLight args={[0x93a7d8, 0x0a0c12, 0.85]} />
    </group>
  )
}

/* ── the tooltip card · plain words + the verbatim YAML lines (H6) ─────────── */
function TipCard({ entry, task }: { entry: FlagshipEntry; task: FlagshipTask }) {
  const endState = slabStateAt(entry, task.id, 1)
  const fact = chipAt(entry, task, endState)
  const raw = entry.yaml.split('\n').slice(task.line0 - 1, task.line1)
  const excerpt = raw.length > 7 ? [...raw.slice(0, 6), '  …'] : raw
  return (
    <>
      <p className="ps-tip-title">
        <span className="ps-tip-id">{task.id}</span>
        <span className="ps-tip-verb" data-verb={task.verb}>
          {task.verb}
        </span>
      </p>
      <p className="ps-tip-words">{VERB_WORDS[task.verb]}</p>
      {task.deps.length > 0 && (
        <p className="ps-tip-row">
          <span className="ps-tip-key">depends_on</span> {DEPENDS_WORDS}: {task.deps.join(', ')}
        </p>
      )}
      {task.when && (
        <p className="ps-tip-row">
          <span className="ps-tip-key">when:</span> {WHEN_WORDS}
        </p>
      )}
      {fact && (
        <p className="ps-tip-fact" data-state={endState}>
          {fact} <span className="ps-tip-rec">· recorded</span>
        </p>
      )}
      <pre className="ps-tip-yaml">{excerpt.join('\n')}</pre>
    </>
  )
}

export default function ThePlanScene({
  flagship,
  progressRef,
  stageRef,
  cardRef,
  slabTargetsRef,
}: Props) {
  const model = useMemo(() => buildPlanScene(flagship), [flagship])
  const layerRef = useRef<HTMLDivElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const billRefs = useRef(new Map<string, HTMLButtonElement | null>())
  const hoverRef = useRef<string | null>(null)
  const sourceRef = useRef<'bill' | 'yaml'>('bill')
  const [tipId, setTipId] = useState<string | null>(null)
  const ui = useMemo<HoverUi>(
    () => ({ hoverRef, sourceRef, billRefs, tipRef, layerRef }),
    [],
  )

  /* the DOM DAG steps aside ONLY once this layer is really mounted */
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    stage.dataset.plan3d = '1'
    return () => {
      delete stage.dataset.plan3d
    }
  }, [stageRef])

  /* frame loop gate · in-view + tab visible, else zero GPU work */
  const [inView, setInView] = useState(false)
  const [docHidden, setDocHidden] = useState(false)
  useEffect(() => {
    const el = layerRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting))
    io.observe(el)
    const onVis = () => setDocHidden(document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  const setHover = (id: string | null, source: 'bill' | 'yaml') => {
    if (hoverRef.current === id && sourceRef.current === source) return
    hoverRef.current = id
    sourceRef.current = source
    setTipId(id)
    /* cross-highlight the task's YAML lines while the card is visible */
    const card = cardRef.current
    if (!card) return
    for (const el of card.querySelectorAll<HTMLElement>('.cf-line.ps-hi')) {
      el.classList.remove('ps-hi')
    }
    if (id) {
      const task = flagship.plan.tasks.find((t) => t.id === id)
      if (!task) return
      for (const el of card.querySelectorAll<HTMLElement>('.cf-line')) {
        const ln = Number(el.dataset.ln)
        if (ln >= task.line0 && ln <= task.line1) el.classList.add('ps-hi')
      }
    }
  }

  /* H6 · hovering the file's YAML lines lights the matching slab + tooltip
     (armed only in the file beat — later the lines are mid-flight) */
  useEffect(() => {
    const card = cardRef.current
    const layer = layerRef.current
    const stage = stageRef.current
    if (!card || !layer || !stage) return
    let cur: string | null = null
    const onMove = (e: PointerEvent) => {
      if (stage.dataset.phase !== 'file') {
        if (cur) setHover((cur = null), 'yaml')
        return
      }
      const line = (e.target as HTMLElement).closest<HTMLElement>('.cf-line')
      const ln = line ? Number(line.dataset.ln) : NaN
      const task = Number.isNaN(ln)
        ? undefined
        : flagship.plan.tasks.find((t) => ln >= t.line0 && ln <= t.line1)
      const id = task?.id ?? null
      if (id !== cur) setHover((cur = id), 'yaml')
      if (id && tipRef.current) {
        const r = layer.getBoundingClientRect()
        const x = e.clientX - r.left
        const y = e.clientY - r.top
        const flip = y < Math.min(400, r.height * 0.58)
        tipRef.current.dataset.flip = flip ? '1' : '0'
        tipRef.current.style.left = `${Math.round(Math.min(Math.max(x, 180), r.width - 180))}px`
        tipRef.current.style.top = `${Math.round(flip ? y + 22 : y - 16)}px`
      }
    }
    const onLeave = () => {
      if (cur) setHover((cur = null), 'yaml')
    }
    card.addEventListener('pointermove', onMove, { passive: true })
    card.addEventListener('pointerleave', onLeave)
    return () => {
      card.removeEventListener('pointermove', onMove)
      card.removeEventListener('pointerleave', onLeave)
      onLeave()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flagship, cardRef, stageRef])

  const tipTask = tipId ? flagship.plan.tasks.find((t) => t.id === tipId) : undefined

  return (
    <>
      <div className="ps-layer" ref={layerRef}>
        {/* the canvas is decorative for AT — the ps-bills hit-rects (siblings,
            never inside the hidden subtree) carry the names + keyboard focus */}
        <Canvas
          className="ps-canvas"
          aria-hidden
          frameloop={inView && !docHidden ? 'always' : 'never'}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', stencil: false }}
          camera={{ fov: 35, near: 0.1, far: 90, position: [0, 2.7, 8.4] }}
          onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        >
          <Advance
            key={flagship.id}
            entry={flagship}
            model={model}
            progressRef={progressRef}
            ui={ui}
            slabTargetsRef={slabTargetsRef}
            stageRef={stageRef}
          />
        </Canvas>

        {/* invisible hit-rects glued to the projected slabs · hover + keyboard
            focus drive the same highlights; the visible label lives ON the
            slab face (label atlas) so it can never float away from its block */}
        <div className="ps-bills">
          {model.slabs.map((s) => (
            <button
              key={s.task.id}
              type="button"
              ref={(el) => {
                billRefs.current.set(s.task.id, el)
              }}
              className="ps-hit"
              data-vis="0"
              aria-label={`task ${s.task.id} · ${s.task.verb} · ${s.task.target}`}
              onPointerOver={() => setHover(s.task.id, 'bill')}
              onPointerOut={() => setHover(null, 'bill')}
              onFocus={() => setHover(s.task.id, 'bill')}
              onBlur={() => setHover(null, 'bill')}
            />
          ))}
        </div>
      </div>

      {/* the closing frame's legend · at `done` the 3D advance recedes, the
          flat DOM DAG returns, and this line names what the reader sees
          (decorative: the head captions carry the meaning for AT) */}
      <p className="ps-flat-note" aria-hidden="true">
        the same plan, flat · every arrow is a wait
      </p>

      {/* one tooltip · plain words + the task's verbatim YAML lines. A SIBLING
          layer above the traveling card: .ps-layer sits at z-1 BELOW the card
          (z-2), so a child tooltip could never rise above the YAML it
          annotates — this twin box (same geometry) carries z-4. */}
      <div className="ps-layer ps-tiplayer" aria-hidden={tipTask ? undefined : true}>
        <div
          className="ps-tip"
          ref={tipRef}
          data-on={tipTask ? '1' : '0'}
          data-verb={tipTask?.verb}
          role="status"
        >
          {tipTask && <TipCard entry={flagship} task={tipTask} />}
        </div>
      </div>
    </>
  )
}

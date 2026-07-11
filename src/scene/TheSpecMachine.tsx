import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { MACHINE_NODES, SPEC_SECTIONS, nodeById, type StratumKey } from './spec-machine-data'
import {
  POSES,
  STRATA_ORDER,
  buildSpecMachine,
  stratumIndex,
  type MachinePose,
} from './spec-machine-model'
import { makeMachineLayers } from './spec-machine-three'
import './spec-machine.css'

/* ─── TheSpecMachine · THE SHIP on the /spec stage (v2) ───────────────────────
   The whole language as one vessel, sailed by the reading: on mount it is a
   GHOST breathing on the drum's 2.4s heartbeat (the beat travels bow →
   stern); each spec section the reader crosses IGNITES its stratum (~1s
   wash, monotonic for the visit — state passed down from the page's own
   useSpecReading so the DOM ticks and the ship can never disagree); and
   crossing a section boundary eases the camera to that stratum's POSE — one
   eased glide on the one clock: the ship makes ONE exact revolution over
   the reading (license = frame + 2π) while sailing bow → stern under the
   camera. By S.8 the whole contract stands assembled, back at the opening
   frame, now lit.
   THE HELM (v2): drag = orbit (spring-returns to the pose when released) ·
   wheel = zoom (clamped) · EXPLODE separates the strata along the spine
   (wires stretch connected — per-endpoint seeds) · RESET zeroes all three.
   The helm state lives in refs the page's buttons drive (the buttons are
   real DOM outside this aria-hidden stage).
   Desktop-only WebGL layer (gated by usePlan3D: ≥1024px + motion + WebGL +
   stage-near, lazy chunk); the 2D elevation + lit TOC stay the mobile /
   reduced-motion / no-WebGL truth. Four draw calls, zero per-frame
   attribute uploads. Frameloop only while in view and the tab visible.
   Dev capture params (DEV only): ?lit=N pins strata lit (page hook) ·
   ?pose=sN pins the camera pose · ?explode=1 pins the exploded drawing. */

interface Pointer {
  x: number
  y: number
}

/** the helm · one mutable bag both the page buttons and the canvas drive */
interface HelmState {
  /** user orbit offsets (radians) · decay to 0 when released */
  yaw: number
  pitch: number
  /** release momentum (rad/frame@60) · coasts then hands off to the spring */
  vel: number
  dragging: boolean
  /** wheel zoom multiplier on the pose distance · eased, clamped */
  zoom: number
  /** the exploded-drawing toggle */
  explode: boolean
}
const helmDefaults = (): HelmState => ({
  yaw: 0,
  pitch: 0,
  vel: 0,
  dragging: false,
  zoom: 1,
  explode: false,
})

interface CalloutRig {
  wrap: HTMLDivElement | null
  items: {
    line: SVGLineElement | null
    dot: SVGCircleElement | null
    label: HTMLSpanElement | null
    /** per-item eased opacity — the CURRENT section's callout stays lit */
    o?: number
  }[]
  /** THE LIVE WIRES (the poster) · per-stratum TEXT anchors: the hero
      copy's own terms (« .nika.yaml » · « four verbs » · « permits »)
      become the labels — the leader's far end pins to the term's rect,
      the near end sails with the hull. */
  terms?: Partial<Record<number, HTMLElement | null>>
  /** the term under the pointer/focus (stratum index · -1 none) — its
      wire brightens, the others whisper */
  hot?: number
  /** THE UMBILICAL (the dock) · per-stratum SECTION blocks — the section
      being read wires to its station across the column seam */
  docks?: Partial<Record<number, HTMLElement | null>>
  /** eased viewport-y of the umbilical's column end (a section change
      GLIDES the anchor, never teleports it) */
  uy?: number
  /** the umbilical's own ink · a bézier core + a soft halo + THE SPARK
      (the ignition travelling the wire INTO the hull — the one effect
      that crosses the DOM/GL seam on the one clock) */
  upath?: SVGPathElement | null
  uhalo?: SVGPathElement | null
  spark?: SVGCircleElement | null
  ugrad?: SVGLinearGradientElement | null
}

function Machine({
  pointer,
  litRef,
  poseRef,
  strikeRef,
  hiRef,
  helmRef,
  calloutRef,
  flightRef,
  onHover,
}: {
  pointer: React.MutableRefObject<Pointer>
  litRef: React.MutableRefObject<ReadonlySet<StratumKey>>
  poseRef: React.MutableRefObject<MachinePose>
  strikeRef: React.MutableRefObject<number>
  hiRef: React.MutableRefObject<number>
  helmRef: React.MutableRefObject<HelmState>
  calloutRef: React.MutableRefObject<CalloutRig>
  flightRef?: React.MutableRefObject<{ state: string; progress: number }>
  onHover: (id: string | null) => void
}) {
  const model = useMemo(() => buildSpecMachine(), [])
  const layers = useMemo(() => makeMachineLayers(model), [model])
  useEffect(() => () => layers.dispose(), [layers])

  /* nested groups · the INNER slides the ship along its spine so the read
     section sits at the origin; the OUTER orbits around that point — the
     camera always revolves around the section it is reading */
  const group = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Group>(null)
  const spin = useRef(0)
  /* the last approach progress — the scroll turn folds into spin as a
     DELTA, so scrubbing back unwinds it and the dock flip subtracts nothing */
  const heroP = useRef(0)
  const { camera, gl } = useThree()

  /* ── the pick bus + THE HELM's drag — one pointer state machine ───────────
     No raycaster: node instance centres projected to screen space, nearest
     within reach wins. pointerdown starts a potential orbit; >4px of travel
     commits it (click suppressed, cursor grabs); release springs back. */
  useEffect(() => {
    const el = gl.domElement
    const v = new THREE.Vector3()
    const pick = (e: PointerEvent): number => {
      const g = inner.current /* full transform: outer orbit × inner sail */
      if (!g) return -1
      const rect = el.getBoundingClientRect()
      const px = e.clientX - rect.left
      const py = e.clientY - rect.top
      let best = -1
      let bestD = 26 * 26 /* px² reach */
      const ex = layers.uniforms.uExplode.value
      for (let i = 0; i < model.nodeCount; i++) {
        v.set(
          model.pos[i * 3] + model.explode[model.seed[i * 2]] * ex,
          model.pos[i * 3 + 1],
          model.pos[i * 3 + 2],
        )
        v.applyMatrix4(g.matrixWorld).project(camera)
        if (v.z > 1) continue
        const sx = ((v.x + 1) / 2) * rect.width
        const sy = ((1 - v.y) / 2) * rect.height
        const d = (sx - px) * (sx - px) + (sy - py) * (sy - py)
        if (d < bestD) {
          bestD = d
          best = i
        }
      }
      return best
    }
    let downAt: { x: number; y: number } | null = null
    let orbiting = false
    const onDown = (e: PointerEvent) => {
      downAt = { x: e.clientX, y: e.clientY }
      orbiting = false
      el.setPointerCapture(e.pointerId)
    }
    const onMove = (e: PointerEvent) => {
      if (downAt) {
        const dx = e.clientX - downAt.x
        const dy = e.clientY - downAt.y
        if (!orbiting && dx * dx + dy * dy > 16) {
          orbiting = true
          helmRef.current.dragging = true
          el.style.cursor = 'grabbing'
          if (hiRef.current >= 0) {
            hiRef.current = -1
            onHover(null)
          }
        }
        if (orbiting) {
          const dxm = (e.movementX || 0) * 0.006
          helmRef.current.yaw += dxm
          helmRef.current.vel = Math.max(-0.045, Math.min(0.045, dxm))
          helmRef.current.pitch = Math.max(
            -0.9,
            Math.min(0.9, helmRef.current.pitch + (e.movementY || 0) * 0.005),
          )
          return
        }
      }
      const i = pick(e)
      if (i === hiRef.current) return
      hiRef.current = i
      /* the empty hull invites the hand — grab at rest, pointer on a node */
      el.style.cursor = i >= 0 ? 'pointer' : 'grab'
      onHover(i >= 0 ? model.nodeIds[i] : null)
    }
    const onUp = (e: PointerEvent) => {
      const wasOrbit = orbiting
      downAt = null
      orbiting = false
      helmRef.current.dragging = false
      el.style.cursor = hiRef.current >= 0 ? 'pointer' : 'grab'
      if (wasOrbit) return /* an orbit is never a click */
      const i = pick(e)
      if (i < 0) return
      const node = nodeById(model.nodeIds[i])
      if (!node) return
      /* the hash IS the navigation: native scroll (the page's smooth law),
         :target lights the row, the address stays shareable */
      window.location.hash = node.anchor
    }
    const onLeave = () => {
      if (hiRef.current < 0) return
      hiRef.current = -1
      el.style.cursor = 'grab'
      onHover(null)
    }
    const onWheel = (e: WheelEvent) => {
      /* THE SCROLL LAW · a bare wheel over the canvas SCROLLS THE PAGE
         (half the viewport is ship — capturing it hijacked the read);
         zoom is deliberate: ctrl/cmd + wheel (the maps convention) */
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      helmRef.current.zoom = Math.max(
        0.55,
        Math.min(2.1, helmRef.current.zoom * Math.exp(e.deltaY * 0.0011)),
      )
    }
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove, { passive: true })
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointerleave', onLeave, { passive: true })
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointerleave', onLeave)
      el.removeEventListener('wheel', onWheel)
      el.style.cursor = ''
    }
  }, [gl, camera, model, layers, hiRef, helmRef, onHover])

  useFrame((state, delta) => {
    const u = layers.uniforms
    /* the one clock — the document timeline, shared with every CSS beat */
    const doc = document.timeline?.currentTime
    u.uTime.value = typeof doc === 'number' ? doc / 1000 : state.clock.elapsedTime
    u.uFade.value = Math.min(1, u.uFade.value + delta * 0.7)
    /* the hover bus · either side of the page may have written it */
    u.uHi.value = hiRef.current

    const flight = flightRef?.current

    /* a pending ignition stamped by the prop effect plays from now
       (-1 = idle · 0..8 = one stratum · -2 = the ASSEMBLED full-ship surge) */
    if (strikeRef.current !== -1) {
      u.uStrike.value = u.uTime.value
      u.uStrikeStratum.value = strikeRef.current
      strikeRef.current = -1
    }

    /* per-stratum washes · lit eases toward its target over ~a second (the
       drum's band wash), focus eases a touch faster. ONE array carries two
       signals (operator pass 2026-07-11: dim the rest, push the read zone):
       ≤1 is the x-ray dim on the siblings, the overflow ABOVE 1 is the
       spotlight on the stratum being read — the shaders split it back. */
    const pose = poseRef.current
    const lit = litRef.current
    const kLit = Math.min(1, delta * 2.4)
    const kFoc = Math.min(1, delta * 2.6)
    for (let i = 0; i < STRATA_ORDER.length; i++) {
      const litT = lit.has(STRATA_ORDER[i]) ? 1 : 0
      u.uLit.value[i] += (litT - u.uLit.value[i]) * kLit
      const focT = pose.focus < 0 ? 1 : pose.focus === i ? 1.3 : 0.22
      u.uFocusA.value[i] += (focT - u.uFocusA.value[i]) * kFoc
    }

    /* THE HELM · user orbit spring-returns once released · zoom eases ·
       the explode washes in/out like a stratum */
    const helm = helmRef.current
    if (!helm.dragging) {
      /* the coast · release momentum carries the turn, braking into the
         spring-return — the drag has weight now */
      helm.yaw += helm.vel * delta * 60
      helm.vel *= Math.exp(-delta * 3.2)
      const decay = Math.exp(-delta * 2.4)
      helm.yaw *= decay
      helm.pitch *= decay
    } else {
      helm.vel *= Math.exp(-delta * 8) /* a held-still pointer sheds momentum */
    }
    const exT = helm.explode ? 1 : 0
    u.uExplode.value += (exT - u.uExplode.value) * Math.min(1, delta * 2.6)
    /* THE SHOWCASE ease · hero + finale wear the full hull hues, the mass
       plate light and the blooming starfield; the dock reads by ignition.
       (Regression #119: the flight rewrite dropped this write — uHero sat
       at 0 forever and the whole colour pass was dead.) */
    const st0 = flight?.state
    const heroT = st0 === 'hero' || st0 === 'finale' ? 1 : 0
    u.uHero.value += (heroT - u.uHero.value) * Math.min(1, delta * 2.4)

    /* the pose glide · one eased move per section boundary: the ship sails
       under the camera (inner x → -pose.x, explode-compensated so the
       focused section stays centred) while the outer group orbits it */
    const g = group.current
    const inn = inner.current
    if (!g || !inn) return
    /* scroll-steered flight tracks tight; poses glide soft */
    const kBase = flight?.state === 'full' ? 4.6 : 2.2
    const k = Math.min(1, delta * kBase)
    const breathe = Math.sin(u.uTime.value * 0.11) * 0.02
    /* THE FLIGHT · while the takeover runway crosses the viewport the ship
       owns the screen: its progress steers ONE full revolution, diving
       toward the hull mid-turn and rising out again — landing exactly on
       the opening yaw as S.0 docks (2π ≡ 0: perfect continuity) */
    let tYaw = pose.yaw
    let tPitch = pose.pitch
    let tDist = pose.dist
    let lookX = pose.x
    /* THE TURN · at the hero the whole vessel revolves on its own (the
       showcase idle); the FINALE spins a touch faster — the assembled
       flyover. Between them the accumulated turn eases to the nearest
       full revolution so every dock pose lands on its exact framing. */
    const st = flight?.state
    if (st === 'hero' || st === 'finale') {
      spin.current += delta * (st === 'finale' ? 0.17 : 0.11)
      if (st === 'finale') tDist = Math.min(tDist, 5.6) /* the flyover fills */
      if (st === 'hero') {
        /* THE FULL-BLEED POSTER (operator pass 2026-07-11) · the ground is
           the whole viewport, so the hero framing overrides the reading's
           beauty shot: closer (bigger vessel). The rightward carry rides
           g.position.x below — SCREEN space; pose.x/lookX would travel the
           SPINE (the inner group lives in the rotating frame).
           THE APPROACH IS SCROLL-STEERED, precisely (operator pass 2):
           - the turn folds into spin.current as a DELTA (p−prevP), so the
             rotation the scroll added is simply part of the accumulated
             turn — at the dock flip nothing is subtracted back (the old
             additive form un-wound ~1.2 rad on arrival: a visible wobble);
             the settle then rounds to the nearest full revolution as ever.
           - the dive is gentle (the dock's own S.0 pose pulls back to 6.9
             right after — diving hard just to zoom out again read as a
             pump). */
        const p = flight?.progress ?? 0
        spin.current += (p - heroP.current) * 1.2
        heroP.current = p
        tDist = 6.1 - p * 0.3
      } else {
        heroP.current = flight?.progress ?? heroP.current
      }
    } else {
      const settle = Math.round(spin.current / (Math.PI * 2)) * Math.PI * 2
      spin.current += (settle - spin.current) * Math.min(1, delta * 2.2)
    }
    tYaw += spin.current
    /* THE EXPLODED DRAWING must FIT · while the strata stand apart the
       camera pulls back to the overview and centres the spine — zooming
       into one station of an exploded ship showed only fragments */
    const ex = u.uExplode.value
    if (ex > 0.02) {
      tDist = tDist + (Math.max(tDist, 7.2) - tDist) * ex
      lookX = lookX + (-0.15 - lookX) * ex
      tPitch = tPitch + (0.24 - tPitch) * ex
    }
    g.rotation.y += (tYaw + helm.yaw + breathe + pointer.current.x * 0.06 - g.rotation.y) * k
    g.rotation.x += (tPitch + helm.pitch + pointer.current.y * 0.06 - g.rotation.x) * k
    g.position.y += (pose.y - g.position.y) * k
    /* the poster's rightward carry (SCREEN x — the outer group never turns):
       the full-bleed hero parks the vessel right of the copy column. THE
       PRECISE HANDOFF: as the approach completes, the carry flies the
       vessel's centre to where the DOCK will hold it — the dock chassis is
       the right 46vw (centre ≈ 77vw) while the hero centre sits ≈ 64vw, so
       carry grows 1.35 → ~2.5 world units with p. At the flip the canvas
       narrows and the carry eases to 0, and both project the SAME screen
       point: the vessel does not jump, the bay closes around it. */
    const hp = st === 'hero' ? (flight?.progress ?? 0) : 0
    /* ease-in (p²): the vessel HOLDS its poster mark through most of the
       approach and slides bay-ward only as the dock becomes imminent —
       the final mark is exact, the mid-approach never crowds the edge */
    const heroCarry = 1.35 + hp * hp * 1.15
    g.position.x += ((st === 'hero' ? heroCarry : 0) - g.position.x) * k
    const exOff = pose.focus >= 0 ? model.explode[pose.focus] * u.uExplode.value : 0
    inn.position.x += (-(lookX + exOff) - inn.position.x) * k
    state.camera.position.z += (tDist * helm.zoom - state.camera.position.z) * k

    /* THE CALLOUTS · per-item leaders: at the overview every stratum is
       labelled (the plate's labelled-drawing read); at a SECTION pose only
       the section being read keeps its leader — the label follows the ship
       and points at where you are. Orbit-drag hides them all. */
    const rig = calloutRef.current
    if (rig.wrap && inner.current) {
      const el = gl.domElement
      const rect = el.getBoundingClientRect()
      const v = new THREE.Vector3()
      const st2 = flight?.state
      const hero = st2 === 'hero'
      const full = st2 === 'finale'
      /* depth cue during the turn · far-side stations whisper (project the
         hull centre once; anchors deeper than it are behind the ship) */
      let centreZ = 0.5
      if (full || hero) {
        v.set(0, 0, 0).applyMatrix4(inner.current.matrixWorld).project(camera)
        centreZ = v.z
      }
      let umbDrawn = false
      for (let si = 0; si < rig.items.length; si++) {
        const it = rig.items[si]
        if (!it?.line || !it.dot || !it.label) continue
        /* the poster's live wires · a stratum whose TERM is registered keeps
           its leader at the hero — quiet by default, loud under the hot
           term, whispering while a sibling is hot */
        const term = hero ? rig.terms?.[si] : undefined
        const hot = rig.hot ?? -1
        const target =
          helm.dragging ? 0
          : term ? (hot === -1 ? 0.55 : hot === si ? 1 : 0.18)
          : hero ? 0
          : full || pose.focus === si ? 1 : pose.focus < 0 ? 0 : 0
        it.o = (it.o ?? 0) + (target - (it.o ?? 0)) * Math.min(1, delta * 3)
        const op = it.o.toFixed(3)
        it.label.style.opacity = op
        it.line.style.opacity = op
        it.dot.style.opacity = op
        it.label.style.pointerEvents = it.o > 0.5 ? 'auto' : 'none'
        it.label.classList.toggle('is-cur', pose.focus === si)
        if (it.o < 0.02) continue
        v.set(
          model.anchors[si * 3] + model.explode[si] * u.uExplode.value,
          model.anchors[si * 3 + 1],
          model.anchors[si * 3 + 2],
        )
        v.applyMatrix4(inner.current.matrixWorld).project(camera)
        const px = ((v.x + 1) / 2) * rect.width
        const py = ((1 - v.y) / 2) * rect.height
        if (full) {
          const far = v.z > centreZ + 0.0004
          const base = it.o ?? 0
          /* the depth cue fades the LEADER (line + dot); the label itself
             floors at readable — a plate slot must never go illegible */
          const dLine = (base * (far ? 0.28 : 1)).toFixed(3)
          it.label.style.opacity = (base * (far ? 0.62 : 1)).toFixed(3)
          it.line.style.opacity = dLine
          it.dot.style.opacity = dLine
        }
        /* the poster's live wires · the far-side cue rides the same rule as
           the finale: a station behind the hull whispers its wire */
        if (term) {
          const far = v.z > centreZ + 0.0004
          if (far && hot !== si) {
            const dim = ((it.o ?? 0) * 0.3).toFixed(3)
            it.line.style.opacity = dim
            it.dot.style.opacity = dim
          }
          it.label.style.opacity = '0'
          it.label.style.pointerEvents = 'none'
          /* the near end rides the TERM's line, but STARTS past the copy
             column's edge (a wire must never cross the prose): y from the
             term's FIRST client rect (a wrapped term like « four verbs »
             pins to its first fragment, not the two-line bounding box),
             x at the column boundary (~44% of the full-bleed canvas). */
          const tr = term.getClientRects()[0] ?? term.getBoundingClientRect()
          it.line.setAttribute('x1', (rect.width * 0.44).toFixed(1))
          it.line.setAttribute('y1', (tr.top + tr.height / 2 - rect.top).toFixed(1))
          it.line.setAttribute('x2', px.toFixed(1))
          it.line.setAttribute('y2', py.toFixed(1))
          it.dot.setAttribute('cx', px.toFixed(1))
          it.dot.setAttribute('cy', py.toFixed(1))
          continue
        }
        /* THE UMBILICAL · at the DOCK the floating label stands down (the
           position plate is the one text source) and the leader becomes
           the seam-crossing wire: its column end rides the stage's LEFT
           EDGE at the read section's on-screen height (eased — a section
           change glides the anchor), its far end sails with the hull. The
           ignition strike travels it — width + brightness on the same
           clock as the hull swell: one effect crossing the boundary. */
        if (!hero && !full && pose.focus === si) {
          const blk = rig.docks?.[si]
          if (blk && rig.upath && rig.uhalo && rig.spark) {
            const br = blk.getBoundingClientRect()
            const yT = Math.min(Math.max(br.top - rect.top + 96, 96), rect.height - 130)
            rig.uy = (rig.uy ?? yT) + (yT - (rig.uy ?? yT)) * Math.min(1, delta * 4)
            const ts = Math.max(u.uTime.value - u.uStrike.value, 0)
            const pulse = u.uStrikeStratum.value === si ? Math.exp(-ts * 2.2) : 0
            it.label.style.opacity = '0'
            it.label.style.pointerEvents = 'none'
            it.line.style.opacity = '0'
            /* the seam curve · out of the column horizontally, a lazy S
               into the station (control points at 35% of the run) */
            const x0 = 12
            const y0 = rig.uy
            const cx = (px - x0) * 0.35
            const d = `M ${x0} ${y0.toFixed(1)} C ${(x0 + cx).toFixed(1)} ${y0.toFixed(1)}, ${(px - cx).toFixed(1)} ${py.toFixed(1)}, ${px.toFixed(1)} ${py.toFixed(1)}`
            rig.upath.setAttribute('d', d)
            rig.uhalo.setAttribute('d', d)
            if (rig.ugrad) {
              rig.ugrad.setAttribute('x1', String(x0))
              rig.ugrad.setAttribute('y1', y0.toFixed(1))
              rig.ugrad.setAttribute('x2', px.toFixed(1))
              rig.ugrad.setAttribute('y2', py.toFixed(1))
            }
            rig.upath.style.opacity = (it.o * (0.66 + 0.34 * pulse)).toFixed(3)
            rig.upath.style.strokeWidth = (1.2 + pulse * 1.2).toFixed(2)
            rig.uhalo.style.opacity = (it.o * (0.16 + 0.3 * pulse)).toFixed(3)
            umbDrawn = true
            /* THE SPARK · the ignition travels the wire INTO the hull over
               the strike's first ~0.9s (the hull swell + wire pulses read
               the same clock — one event, both worlds) */
            const tt = u.uStrikeStratum.value === si ? ts / 0.9 : 2
            if (tt < 1) {
              const w = tt * tt * (3 - 2 * tt) /* smoothstep ease */
              const omw = 1 - w
              const sx2 =
                omw * omw * omw * x0 + 3 * omw * omw * w * (x0 + cx) + 3 * omw * w * w * (px - cx) + w * w * w * px
              const sy2 = omw * omw * omw * y0 + 3 * omw * omw * w * y0 + 3 * omw * w * w * py + w * w * w * py
              rig.spark.setAttribute('cx', sx2.toFixed(1))
              rig.spark.setAttribute('cy', sy2.toFixed(1))
              rig.spark.setAttribute('r', (2 + Math.sin(Math.PI * tt) * 2.4).toFixed(2))
              rig.spark.style.opacity = Math.sin(Math.PI * tt).toFixed(3)
            } else {
              rig.spark.style.opacity = '0'
            }
            it.dot.setAttribute('cx', px.toFixed(1))
            it.dot.setAttribute('cy', py.toFixed(1))
            it.dot.setAttribute('r', (2.2 + pulse * 1.8).toFixed(2))
            it.dot.style.opacity = op
            continue
          }
        }
        const left = it.label.dataset.side === 'l'
        /* the labels hold their PLATE SLOTS (left/right columns) — the
           engineering-plate read at the finale, one clean leader at the
           dock; only the line's far end sails with the hull */
        it.dot.setAttribute('r', '2.2') /* undo the umbilical's swell */
        it.line.style.strokeWidth = ''
        const lw = it.label.offsetWidth
        const lh = it.label.offsetHeight
        const x1 = it.label.offsetLeft + (left ? lw + 6 : -6)
        const y1 = it.label.offsetTop + lh / 2
        it.line.setAttribute('x1', x1.toFixed(1))
        it.line.setAttribute('y1', y1.toFixed(1))
        it.line.setAttribute('x2', px.toFixed(1))
        it.line.setAttribute('y2', py.toFixed(1))
        it.dot.setAttribute('cx', px.toFixed(1))
        it.dot.setAttribute('cy', py.toFixed(1))
      }
      /* off the dock (poster · finale · drag) the umbilical stands down */
      if (!umbDrawn && rig.upath && rig.uhalo && rig.spark) {
        rig.upath.style.opacity = '0'
        rig.uhalo.style.opacity = '0'
        rig.spark.style.opacity = '0'
      }
    }

    /* the reactor + engine glows track their spine points through sail +
       explode — inner-local X projected through the outer yaw/pitch */
    const cY = Math.cos(g.rotation.y)
    const sY = Math.sin(g.rotation.y)
    const cX = Math.cos(g.rotation.x)
    const sX = Math.sin(g.rotation.x)
    const track = (mesh: THREE.Mesh, localX: number) => {
      const a = localX + inn.position.x
      mesh.position.set(a * cY, g.position.y + a * sX * sY, -a * cX * sY)
    }
    track(layers.glow, 0.68 + model.explode[stratumIndex('verbs')] * u.uExplode.value)
    track(layers.thrust, -1.34 + model.explode[stratumIndex('providers')] * u.uExplode.value)
  })

  return (
    <>
      <group ref={group} rotation={[0.3, 0.55, 0]}>
        {/* the starfield rides the OUTER group: the sky sweeps as the view
            orbits — a camera flight, never a turntable */}
        <primitive object={layers.stars} />
        <group ref={inner}>
          <primitive object={layers.fills} />
          <primitive object={layers.wires} />
          <primitive object={layers.lines} />
        </group>
      </group>
      {/* the reactor + engine glows stay camera-facing OUTSIDE the group */}
      <primitive object={layers.glow} />
      <primitive object={layers.thrust} />
    </>
  )
}

export default function TheSpecMachine({
  stageRef,
  lit,
  current,
  highlight = null,
  explode = false,
  resetSignal = 0,
  flightRef,
  onHover = () => {},
}: {
  stageRef: React.RefObject<HTMLDivElement | null>
  lit: ReadonlySet<StratumKey>
  current: StratumKey | null
  /** W2 · a node id the DOM side is hovering/focusing (chips · stamp · TOC) */
  highlight?: string | null
  /** the helm · exploded-drawing toggle (page button) */
  explode?: boolean
  /** the helm · bump to spring everything home (page button) */
  resetSignal?: number
  /** THE FLIGHT · the chassis stage + takeover progress (page scroll rig):
      'full' steers one revolution + a dive over the runway */
  flightRef?: React.MutableRefObject<{ state: string; progress: number }>
  /** W2 · the machine's own hover, reported back for the MR readout + chips */
  onHover?: (id: string | null) => void
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const pointer = useRef<Pointer>({ x: 0, y: 0 })
  const [inView, setInView] = useState(false)
  const [hidden, setHidden] = useState(false)

  /* the hover bus · one slot, either side writes (pick wins on move,
     the DOM prop wins on change) — the frame loop reads it each frame */
  const hiRef = useRef(-1)
  useEffect(() => {
    hiRef.current = highlight ? MACHINE_NODES.findIndex((n) => n.id === highlight) : -1
  }, [highlight])

  /* the helm · page buttons + canvas gestures share this bag */
  const helmRef = useRef<HelmState>(helmDefaults())

  /* THE CALLOUTS · 8 leader lines (S.0…S.7) the frame loop projects; labels
     are pointer-only decoration (the INDEX chips are the accessible twin) */
  const calloutRef = useRef<CalloutRig>({ wrap: null, items: [] })
  const CALLOUTS = SPEC_SECTIONS.filter((x) => x.key !== 'license')
  const setCallout = (
    si: number,
    part: 'line' | 'dot' | 'label',
    el: SVGLineElement | SVGCircleElement | HTMLSpanElement | null,
  ) => {
    const items = calloutRef.current.items
    if (!items[si]) items[si] = { line: null, dot: null, label: null }
    // @ts-expect-error narrow by construction
    items[si][part] = el
  }
  useEffect(() => {
    helmRef.current.explode = explode
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      if (new URLSearchParams(window.location.search).get('explode') === '1')
        helmRef.current.explode = true
    }
  }, [explode])

  /* THE LIVE WIRES · the hero copy's own terms ([data-ship-term]) register
     as per-stratum text anchors: the poster wires the PROSE to the hull
     (the frame loop pins each leader's near end to the term's rect).
     Hover/focus on a term makes its wire loud, the siblings whisper.
     Self-contained: the machine queries the page's stable DOM on mount. */
  useEffect(() => {
    const rig = calloutRef.current
    rig.terms = {}
    rig.hot = -1
    const els = [...document.querySelectorAll<HTMLElement>('[data-ship-term]')]
    const offs: (() => void)[] = []
    for (const el of els) {
      const si = stratumIndex(el.dataset.shipTerm as StratumKey)
      if (si < 0) continue
      rig.terms[si] = el
      const on = () => {
        rig.hot = si
      }
      const off = () => {
        rig.hot = -1
      }
      el.addEventListener('pointerenter', on)
      el.addEventListener('pointerleave', off)
      el.addEventListener('focus', on)
      el.addEventListener('blur', off)
      offs.push(() => {
        el.removeEventListener('pointerenter', on)
        el.removeEventListener('pointerleave', off)
        el.removeEventListener('focus', on)
        el.removeEventListener('blur', off)
      })
    }
    return () => {
      offs.forEach((f) => f())
      rig.terms = {}
      rig.hot = -1
    }
  }, [])
  /* THE UMBILICAL's anchors · the page's own section blocks, by stratum
     (stable SSG DOM — queried once; license maps too but the overview
     pose never focuses it) */
  useEffect(() => {
    const rig = calloutRef.current
    rig.docks = {}
    for (const el of document.querySelectorAll<HTMLElement>('.spec-block[data-stratum]')) {
      const si = stratumIndex(el.dataset.stratum as StratumKey)
      if (si >= 0) rig.docks[si] = el
    }
    return () => {
      rig.docks = {}
    }
  }, [])
  useEffect(() => {
    if (resetSignal === 0) return
    helmRef.current.yaw = 0
    helmRef.current.pitch = 0
    helmRef.current.zoom = 1
  }, [resetSignal])

  /* dev-only capture override · /spec?pose=sN pins the section pose */
  const devPose = useMemo<StratumKey | null>(() => {
    if (!import.meta.env.DEV || typeof window === 'undefined') return null
    const q = new URLSearchParams(window.location.search).get('pose')
    if (q === null) return null
    return SPEC_SECTIONS[Number(q.replace(/^s/, ''))]?.key ?? null
  }, [])

  /* the reading state rides refs into the frame loop (no re-render churn);
     a NEWLY lit stratum stamps one ignition beat for the swell + core flash */
  const litRef = useRef<ReadonlySet<StratumKey>>(lit)
  const poseRef = useRef<MachinePose>(POSES[devPose ?? current ?? 'frame'])
  const strikeRef = useRef(-1)
  const prevLit = useRef<ReadonlySet<StratumKey>>(new Set())
  useEffect(() => {
    litRef.current = lit
    for (const k of lit) {
      if (!prevLit.current.has(k)) strikeRef.current = stratumIndex(k)
    }
    /* THE ASSEMBLED SURGE · the 8th reading stratum completes the contract:
       one full-ship beat — every wire fires, the whole hull swells (-2 =
       the all-strata sentinel in the strike shaders) */
    const done = (x: ReadonlySet<StratumKey>) =>
      [...x].filter((k) => k !== 'license').length >= 8
    if (done(lit) && !done(prevLit.current)) strikeRef.current = -2
    prevLit.current = lit
  }, [lit])
  useEffect(() => {
    poseRef.current = POSES[devPose ?? current ?? 'frame']
  }, [current, devPose])

  /* the elevation steps aside ONLY once this layer is really mounted */
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    stage.dataset.machine = '1'
    return () => {
      delete stage.dataset.machine
    }
  }, [stageRef])

  /* frame loop gate · stage in view + tab visible, else zero GPU work */
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting))
    io.observe(el)
    const onVis = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', onVis)
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  return (
    <div className="smw" ref={wrapRef} aria-hidden>
      <Canvas
        frameloop={inView && !hidden ? 'always' : 'never'}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', stencil: false }}
        camera={{ fov: 38, near: 0.1, far: 30, position: [0, 0, 4.6] }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        <Machine
          pointer={pointer}
          litRef={litRef}
          poseRef={poseRef}
          strikeRef={strikeRef}
          hiRef={hiRef}
          helmRef={helmRef}
          calloutRef={calloutRef}
          flightRef={flightRef}
          onHover={onHover}
        />
      </Canvas>
      {/* THE CALLOUTS · the labelled-drawing layer (overview poses only) —
          fixed label slots, projected line ends; clicks land on the section */}
      <div
        className="smc"
        ref={(el) => {
          calloutRef.current.wrap = el
        }}
        onClick={(e) => {
          const t = (e.target as Element).closest?.('[data-anchor]')
          const a = t?.getAttribute('data-anchor')
          if (a) window.location.hash = a
        }}
      >
        <svg className="smc-lines">
          {/* THE UMBILICAL · the seam-crossing wire (halo under core) + THE
              SPARK — attribute-driven by the frame loop, zero re-renders.
              The gradient runs the wire's own span (userSpaceOnUse — the
              loop feeds it the endpoints): a whisper at the column, the
              struck bright at the hull — the read flows INTO the ship. */}
          <defs>
            <linearGradient
              id="smcUmb"
              gradientUnits="userSpaceOnUse"
              ref={(el) => {
                calloutRef.current.ugrad = el
              }}
            >
              <stop offset="0" stopColor="#4f86ff" stopOpacity="0.3" />
              <stop offset="0.55" stopColor="#4f86ff" stopOpacity="0.8" />
              <stop offset="1" stopColor="#8db4ff" stopOpacity="1" />
            </linearGradient>
          </defs>
          <path
            className="smc-uhalo"
            ref={(el) => {
              calloutRef.current.uhalo = el
            }}
          />
          <path
            className="smc-umbilical"
            ref={(el) => {
              calloutRef.current.upath = el
            }}
          />
          <circle
            className="smc-spark"
            r="2.4"
            ref={(el) => {
              calloutRef.current.spark = el
            }}
          />
          {CALLOUTS.map((c) => {
            const si = STRATA_ORDER.indexOf(c.key)
            return (
              <g key={c.key}>
                <line ref={(el) => setCallout(si, 'line', el)} className="smc-line" />
                <circle ref={(el) => setCallout(si, 'dot', el)} className="smc-dot" r="2.2" />
              </g>
            )
          })}
        </svg>
        {CALLOUTS.map((c, i) => {
          const si = STRATA_ORDER.indexOf(c.key)
          const left = i < 4
          return (
            <span
              key={c.key}
              ref={(el) => setCallout(si, 'label', el)}
              className="smc-label mono"
              data-side={left ? 'l' : 'r'}
              data-node={c.key}
              data-anchor={c.anchor}
              /* the 4th right rung used to land ON the helm (errors label
                  904-951 vs EXPLODE/RESET 912-942 — rect-probed at the S.7
                  dock) — the ladder tightens so the last rung clears it */
              style={{ ['--slot' as string]: `${16 + (i % 4) * 19}%` }}
            >
              <b>
                {/* the fig hides at the DOCK (the plate + the rail chip
                    already say S.N — three occurrences read as noise) and
                    returns at the FINALE, where the labelled drawing wants
                    every slot numbered */}
                <i className="smc-fig">{c.fig} · </i>
                {c.title.toUpperCase()}
              </b>
              {c.count} {c.countLabel.toLowerCase()}
            </span>
          )
        })}
      </div>
    </div>
  )
}

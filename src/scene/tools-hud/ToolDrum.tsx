import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { buildToolsDrum, STRUCT_SLOT, type DrumModel } from './drum-model'
import { makeDrumLayers } from './drum-three'
import { aimDelta } from './slot-layout'

/* ─── ToolDrum · THE PIN DRUM's mount shell (lazy chunk — three lives here) ───
   One machine, two scales (the MiniDag/PlanMap law):
     · register (/tools) — the full instrument: idle roll, the scroll wash,
       row-hover aims the drum, pin-row pick scrolls the page to its row
       (hash navigation IS the click action — the machine's law).
     · room (/tools/:name) — the berth: the drum holds AIMED at this tool's
       row under the comb; prev/next between rooms turns ONE persistent
       machine exactly one notch (the module-level spin carry below — the
       walk survives the route remount).
   The chambering: when an aim settles after real travel, the row lifts to
   the comb and the strike flashes (the frame drum's verdict attack, in the
   machine's own grammar).

   All laws inherited from the spec machine shell: one clock
   (document.timeline), refs into the loop (zero re-renders), delta-not-
   additive scroll folds, exponential eases, frameloop only in-view+visible,
   aria-hidden stage (the DOM register/args are the accessible truth). */

/* the walk's memory · survives route remounts (module scope, room mode) */
const CARRY: { spin: number | null } = { spin: null }

interface Rig {
  mode: 'register' | 'room'
  focusIdx: number
  hoverIdx: number
  sail: number
  stage: HTMLElement | null
}

function Shell({
  model,
  rig,
  mode,
}: {
  model: DrumModel
  rig: React.MutableRefObject<Rig>
  mode: 'register' | 'room'
}) {
  const layers = useMemo(() => makeDrumLayers(model), [model])
  const { gl, camera } = useThree()
  const inner = useRef<THREE.Group>(null)
  const spin = useRef<number>(0)
  const fade = useRef(0)
  const painted = useRef(false)
  /* the chambering arms when an aim has real travel to do, fires on settle */
  const strikeArmed = useRef(false)
  const clockBase = useRef<number | null>(null)

  /* initial pose · PRE-AIMED (the poster law: no entrance travel) — except
     a carried walk (room→room), which starts where the last room left off */
  useEffect(() => {
    const r = rig.current
    const target = r.focusIdx >= 0 ? -model.layout.slots[r.focusIdx].angle : 0
    if (r.mode === 'room' && CARRY.spin !== null) {
      spin.current = CARRY.spin
      if (Math.abs(aimDelta(spin.current, target)) > model.layout.step * 0.45) {
        strikeArmed.current = true
      }
    } else {
      spin.current = target
    }
    if (inner.current) inner.current.rotation.x = spin.current
  }, [model, rig])

  useEffect(() => () => layers.dispose(), [layers])

  /* the pin-row pick · project slot anchors, nearest within 26px wins;
     a click is ≤4px of travel (an aim-drag is never a click — the helm law);
     hash navigation IS the action: the register rows own the ids */
  useEffect(() => {
    const r = rig.current
    if (r.mode !== 'register') return
    const el = gl.domElement
    const v = new THREE.Vector3()
    const pick = (e: PointerEvent): number => {
      const rect = el.getBoundingClientRect()
      let best = -1
      let bestD = 26 * 26
      for (let i = 0; i < model.anchors.length; i++) {
        const a = model.anchors[i]
        const ang = Math.atan2(a.sin, a.cos) + spin.current
        v.set(a.x, Math.cos(ang) * 1.06, Math.sin(ang) * 1.06)
        v.applyEuler(new THREE.Euler(0.1, -0.32, 0))
        v.project(camera)
        /* rows on the camera-far side never pick */
        if (v.z > 1) continue
        const sx = rect.left + ((v.x + 1) / 2) * rect.width
        const sy = rect.top + ((1 - v.y) / 2) * rect.height
        const d = (sx - e.clientX) ** 2 + (sy - e.clientY) ** 2
        if (d < bestD) {
          bestD = d
          best = i
        }
      }
      return best
    }
    let downAt: [number, number] | null = null
    const onMove = (e: PointerEvent) => {
      const hit = pick(e)
      rig.current.hoverIdx = hit
      el.style.cursor = hit >= 0 ? 'pointer' : ''
    }
    const onDown = (e: PointerEvent) => {
      downAt = [e.clientX, e.clientY]
    }
    const onUp = (e: PointerEvent) => {
      if (!downAt) return
      const travel = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1])
      downAt = null
      if (travel > 4) return
      const hit = pick(e)
      if (hit >= 0) window.location.hash = model.anchors[hit].bare
    }
    const onLeave = () => {
      rig.current.hoverIdx = -1
      el.style.cursor = ''
    }
    el.addEventListener('pointermove', onMove, { passive: true })
    el.addEventListener('pointerdown', onDown, { passive: true })
    el.addEventListener('pointerup', onUp, { passive: true })
    el.addEventListener('pointerleave', onLeave, { passive: true })
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointerleave', onLeave)
      el.style.cursor = ''
    }
  }, [gl, camera, model, rig])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1)
    /* one clock · GL beats share the CSS timeline (the machine's law) */
    const doc = document.timeline?.currentTime
    const t = typeof doc === 'number' ? doc / 1000 : state.clock.elapsedTime
    if (clockBase.current === null) clockBase.current = t
    const u = layers.uniforms
    u.uTime.value = t - clockBase.current

    fade.current += (1 - fade.current) * Math.min(1, dt * 2.8)
    u.uFade.value = fade.current

    const r = rig.current
    const aimIdx = r.mode === 'room' ? r.focusIdx : r.hoverIdx
    if (aimIdx >= 0) {
      /* the aim · shortest-way, critically damped (~350ms) */
      const target = -model.layout.slots[aimIdx].angle
      const d = aimDelta(spin.current, target)
      spin.current += d * Math.min(1, dt * 6)
      if (r.mode === 'room' && strikeArmed.current && Math.abs(d) < 0.02) {
        strikeArmed.current = false
        u.uStrike.value = u.uTime.value
        u.uStrikeSlot.value = aimIdx
      }
    } else {
      /* the idle roll + the scroll wash — both fold as DELTAS (never an
         additive target · the wobble law); the wash decays like the sail */
      spin.current += (0.045 + r.sail) * dt
      r.sail *= Math.exp(-dt * 2.6)
      if (Math.abs(r.sail) < 0.003) r.sail = 0
    }
    if (inner.current) inner.current.rotation.x = spin.current
    if (r.mode === 'room') CARRY.spin = spin.current

    /* per-slot focus · read 1.3, siblings 0.22, idle all-1 (the machine's
       CPU targets), eased ~2.6 — structure channel stays pinned at 1 */
    const focus = u.uFocusA.value
    for (let i = 0; i < STRUCT_SLOT; i++) {
      const target = aimIdx < 0 ? 1 : i === aimIdx ? 1.3 : 0.22
      focus[i] += (target - focus[i]) * Math.min(1, dt * 2.6)
    }
    focus[STRUCT_SLOT] = 1

    if (!painted.current) {
      painted.current = true
      if (r.stage) r.stage.dataset.drumPainted = '1'
    }
  })

  /* the room berth frames a smaller machine (0.72) — same drum, at rest */
  const s = mode === 'room' ? 0.72 : 1
  return (
    <group rotation={[0.1, -0.32, 0]} scale={[s, s, s]}>
      <group ref={inner}>
        <primitive object={layers.group} />
      </group>
      <primitive object={layers.fixed} />
    </group>
  )
}

export default function ToolDrum({
  mode,
  focus,
  stageRef,
}: {
  mode: 'register' | 'room'
  focus?: string
  stageRef: React.RefObject<HTMLDivElement | null>
}) {
  const model = useMemo(() => buildToolsDrum(), [])
  const [inView, setInView] = useState(false)
  const [hidden, setHidden] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const rig = useRef<Rig>({
    mode,
    focusIdx: -1,
    hoverIdx: -1,
    sail: 0,
    stage: null,
  })

  /* prop → rig bridge (the loop reads refs, never captured values) */
  useEffect(() => {
    rig.current.mode = mode
    rig.current.focusIdx = focus
      ? (model.layout.slots.find((s) => s.bare === focus)?.index ?? -1)
      : -1
    rig.current.stage = stageRef.current
  }, [mode, focus, model, stageRef])

  /* the schematic steps aside ONLY once this layer is really mounted */
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    stage.dataset.drum3d = '1'
    return () => {
      delete stage.dataset.drum3d
      delete stage.dataset.drumPainted
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
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  /* register wirings · the page's rows aim the drum (fine pointers), the
     wheel feeds the wash — motion-gated AT the listener (the sail law;
     usePlan3D already refused reduced-motion, the guard is belt + braces) */
  useEffect(() => {
    if (mode !== 'register') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const offs: (() => void)[] = []
    if (fine) {
      const rows = Array.from(document.querySelectorAll<HTMLElement>('.tp-list .tp-row[id]'))
      const byBare = new Map(model.layout.slots.map((s) => [s.bare, s.index]))
      for (const row of rows) {
        const idx = byBare.get(row.id)
        if (idx === undefined) continue
        const enter = () => {
          rig.current.hoverIdx = idx
        }
        const leave = () => {
          if (rig.current.hoverIdx === idx) rig.current.hoverIdx = -1
        }
        row.addEventListener('pointerenter', enter, { passive: true })
        row.addEventListener('pointerleave', leave, { passive: true })
        offs.push(() => {
          row.removeEventListener('pointerenter', enter)
          row.removeEventListener('pointerleave', leave)
        })
      }
    }
    const onWheel = (e: WheelEvent) => {
      rig.current.sail = Math.max(-0.5, Math.min(0.5, rig.current.sail + e.deltaY * 0.00045))
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    offs.push(() => window.removeEventListener('wheel', onWheel))
    return () => offs.forEach((f) => f())
  }, [mode, model])

  return (
    <div className="tdw" ref={wrapRef}>
      <Canvas
        className="tdw-canvas"
        frameloop={inView && !hidden ? 'always' : 'never'}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', stencil: false }}
        camera={
          mode === 'register'
            ? { fov: 30, near: 0.1, far: 20, position: [2.6, 0.62, 5.1] }
            : { fov: 30, near: 0.1, far: 20, position: [1.95, 0.55, 3.6] }
        }
        onCreated={({ gl, camera }) => {
          gl.setClearColor(0x000000, 0)
          camera.lookAt(0, 0, 0)
        }}
      >
        <Shell model={model} rig={rig} mode={mode} />
      </Canvas>
      {/* HUD whispers · the tholos register (decoration; wrapper stage is
          aria-hidden — the dot leaders are the tol.is label grammar) */}
      <span className="tdw-hud tdw-hud-tl">TOOLS·····{model.layout.slots.length}</span>
      <span className="tdw-hud tdw-hud-tr">ARCS·····{model.layout.arcs.length}</span>
      <span className="tdw-hud tdw-hud-bl">PINS·····{model.pinCount}</span>
      <span className="tdw-hud tdw-hud-br">BEAT·····2.4s</span>
    </div>
  )
}

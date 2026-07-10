import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SPEC_SECTIONS, type StratumKey } from './spec-machine-data'
import {
  POSES,
  STRATA_ORDER,
  buildSpecMachine,
  stratumIndex,
  type MachinePose,
} from './spec-machine-model'
import { makeMachineLayers } from './spec-machine-three'
import './spec-machine.css'

/* ─── TheSpecMachine · the /spec rail machine (W1) ────────────────────────────
   The whole language as one machined instrument, living in the sticky rail
   the W0 stage reserved: on mount it is a GHOST (all strata faint, idle
   drift + pointer parallax); each spec section the reader crosses IGNITES
   its stratum (~1s wash to the lit blue, monotonic for the visit — the
   drum's accrued-liberation mechanic, state passed down from the page's own
   useSpecReading so the DOM ticks and the machine can never disagree); and
   crossing a section boundary eases the camera to that stratum's POSE — one
   eased glide on the one clock, other strata dropping to x-ray alpha. By
   S.8 the whole contract stands assembled, one full revolution made.
   Desktop-only WebGL layer (gated by usePlan3D in Spec.tsx: ≥1024px +
   motion + WebGL + rail-near, lazy chunk); the 2D schematic + lit TOC stay
   the mobile / reduced-motion / no-WebGL truth. Four draw calls, zero
   per-frame attribute uploads (per-stratum state = two 9-float uniform
   arrays eased on the CPU). Frameloop only while the rail is in view and
   the tab visible.
   Dev capture params (DEV only · the drum's ?struck precedent):
   /spec?lit=N pins the first N strata lit (page hook) · ?pose=sN pins the
   camera pose so a headless screenshot can prove any stratum's framing. */

interface Pointer {
  x: number
  y: number
}

function Machine({
  pointer,
  litRef,
  poseRef,
  strikeRef,
}: {
  pointer: React.MutableRefObject<Pointer>
  litRef: React.MutableRefObject<ReadonlySet<StratumKey>>
  poseRef: React.MutableRefObject<MachinePose>
  strikeRef: React.MutableRefObject<number>
}) {
  const model = useMemo(() => buildSpecMachine(), [])
  const layers = useMemo(() => makeMachineLayers(model), [model])
  useEffect(() => () => layers.dispose(), [layers])

  const group = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    const u = layers.uniforms
    /* the one clock — the document timeline, shared with every CSS beat */
    const doc = document.timeline?.currentTime
    u.uTime.value = typeof doc === 'number' ? doc / 1000 : state.clock.elapsedTime
    u.uFade.value = Math.min(1, u.uFade.value + delta * 0.7)

    /* a pending ignition stamped by the prop effect plays from now */
    if (strikeRef.current >= 0) {
      u.uStrike.value = u.uTime.value
      u.uStrikeStratum.value = strikeRef.current
      strikeRef.current = -1
    }

    /* per-stratum washes · lit eases toward its target over ~a second (the
       drum's band wash), focus x-ray eases a touch faster */
    const pose = poseRef.current
    const lit = litRef.current
    const kLit = Math.min(1, delta * 2.4)
    const kFoc = Math.min(1, delta * 3)
    for (let i = 0; i < STRATA_ORDER.length; i++) {
      const litT = lit.has(STRATA_ORDER[i]) ? 1 : 0
      u.uLit.value[i] += (litT - u.uLit.value[i]) * kLit
      const focT = pose.focus < 0 ? 1 : pose.focus === i ? 1 : 0.3
      u.uFocusA.value[i] += (focT - u.uFocusA.value[i]) * kFoc
    }

    /* the pose glide · one eased camera/group move per section boundary,
       pointer parallax (±0.06 rad · drum values) + a quiet idle breath */
    const g = group.current
    if (!g) return
    const k = Math.min(1, delta * 2.2)
    const breathe = Math.sin(u.uTime.value * 0.11) * 0.02
    g.rotation.y += (pose.yaw + breathe + pointer.current.x * 0.06 - g.rotation.y) * k
    g.rotation.x += (pose.pitch + pointer.current.y * 0.06 - g.rotation.x) * k
    g.position.y += (pose.y - g.position.y) * k
    state.camera.position.z += (pose.dist - state.camera.position.z) * k
  })

  return (
    <>
      <group ref={group} rotation={[0.42, 0.6, 0]}>
        <primitive object={layers.fills} />
        <primitive object={layers.wires} />
        <primitive object={layers.lines} />
      </group>
      {/* the ignition glow stays camera-facing OUTSIDE the turning group */}
      <primitive object={layers.glow} />
    </>
  )
}

export default function TheSpecMachine({
  stageRef,
  lit,
  current,
}: {
  stageRef: React.RefObject<HTMLDivElement | null>
  lit: ReadonlySet<StratumKey>
  current: StratumKey | null
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const pointer = useRef<Pointer>({ x: 0, y: 0 })
  const [inView, setInView] = useState(false)
  const [hidden, setHidden] = useState(false)

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
    prevLit.current = lit
  }, [lit])
  useEffect(() => {
    poseRef.current = POSES[devPose ?? current ?? 'frame']
  }, [current, devPose])

  /* the schematic steps aside ONLY once this layer is really mounted */
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    stage.dataset.machine = '1'
    return () => {
      delete stage.dataset.machine
    }
  }, [stageRef])

  /* frame loop gate · rail in view + tab visible, else zero GPU work */
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
        camera={{ fov: 38, near: 0.1, far: 30, position: [0, 0, 4.9] }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        <Machine pointer={pointer} litRef={litRef} poseRef={poseRef} strikeRef={strikeRef} />
      </Canvas>
    </div>
  )
}

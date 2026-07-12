import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import type * as THREE from 'three'
import { buildPart } from './part-model'
import { makePartLayers } from './part-three'

/* ─── PartViewer · a catalog part on its berth (lazy chunk — three here) ──────
   The room's dedicated machine: THE part this page documents, removed from
   the ship and held under the shop light. Laws inherited whole from the
   spec-machine shell: one clock (document.timeline), refs into the loop,
   frameloop only in-view+visible, the paint stamp for the outer watchdog,
   aria-hidden stage (the DOM contract is the accessible truth).

   Motion: the part idles a slow inspection turn (yaw only — the lathe
   read), breathes on the 2.4s heartbeat, and IGNITES once on berth (the
   strike; ports flash hardest — the ports are the data). Reduced-motion
   never mounts this (usePlan3D upstream). */

function Shell({
  id,
  stage,
}: {
  id: string
  stage: React.RefObject<HTMLDivElement | null>
}) {
  const model = useMemo(() => buildPart(id), [id])
  const layers = useMemo(() => makePartLayers(model), [model])
  const inner = useRef<THREE.Group>(null)
  const fade = useRef(0)
  const struck = useRef(false)
  const painted = useRef(false)
  const clockBase = useRef<number | null>(null)

  useEffect(() => () => layers.dispose(), [layers])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1)
    const doc = document.timeline?.currentTime
    const t = typeof doc === 'number' ? doc / 1000 : state.clock.elapsedTime
    if (clockBase.current === null) clockBase.current = t
    const u = layers.uniforms
    u.uTime.value = t - clockBase.current

    fade.current += (1 - fade.current) * Math.min(1, dt * 2.8)
    u.uFade.value = fade.current

    /* the berth ignition — once, just after the fade takes hold */
    if (!struck.current && fade.current > 0.35) {
      struck.current = true
      u.uStrike.value = u.uTime.value
    }

    /* the inspection turn — slow yaw, the lathe read (delta-folded) */
    if (inner.current) inner.current.rotation.y += dt * 0.22

    if (!painted.current) {
      painted.current = true
      if (stage.current) stage.current.dataset.partPainted = '1'
    }
  })

  /* frame the part by its own radius — every archetype fills its berth */
  const s = 1.15 / model.radius
  return (
    <group rotation={[0.12, 0, 0]} scale={[s, s, s]}>
      <group ref={inner}>
        <primitive object={layers.group} />
      </group>
    </group>
  )
}

export default function PartViewer({
  id,
  stageRef,
}: {
  id: string
  stageRef: React.RefObject<HTMLDivElement | null>
}) {
  const [inView, setInView] = useState(false)
  const [hidden, setHidden] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  /* the schematic steps aside ONLY once this layer is really mounted */
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    stage.dataset.part3d = '1'
    return () => {
      delete stage.dataset.part3d
      delete stage.dataset.partPainted
    }
  }, [stageRef])

  /* frame loop gate · berth in view + tab visible, else zero GPU work */
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

  return (
    <div className="ptw" ref={wrapRef}>
      <Canvas
        className="ptw-canvas"
        frameloop={inView && !hidden ? 'always' : 'never'}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', stencil: false }}
        camera={{ fov: 32, near: 0.1, far: 20, position: [0.6, 0.35, 3.4] }}
        onCreated={({ gl, camera }) => {
          gl.setClearColor(0x000000, 0)
          camera.lookAt(0, 0, 0)
        }}
      >
        <Shell id={id} stage={stageRef} />
      </Canvas>
    </div>
  )
}

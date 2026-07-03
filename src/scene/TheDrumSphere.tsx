import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RING_COUNT, buildDrumSphere, type DrumSphereModel } from './drum-sphere-model'
import { makeShellLayers } from './drum-sphere-three'
import './drum-sphere.css'

/* ─── TheDrumSphere · the manifesto hero drum as a tholos sphere (wave I) ─────
   A slowly-turning shell of wireframe blocks that BREATHES on the page's
   2.4s heartbeat — the drum of liberation, struck from within. Desktop-only
   WebGL layer behind the hero title (gated by usePlan3D in Manifesto.tsx:
   ≥1024px + motion + WebGL + hero-near, lazy chunk); the CSS drum rings in
   index.css stay the untouched mobile / reduced-motion / no-WebGL truth.
   They step aside ONLY once this layer actually mounted ([data-drum3d] on
   .mf-drum, the ThePlanScene pattern) — the .mf-core glow stays ON TOP as
   the beating heart. ONE canvas, TWO draw calls (instanced fills + instanced
   edge lines), zero per-frame attribute uploads (the breath is in-shader),
   frameloop only while the hero is in view and the tab visible. */

interface Pointer {
  x: number
  y: number
}

function Shell({
  model,
  pointer,
}: {
  model: DrumSphereModel
  pointer: React.MutableRefObject<Pointer>
}) {
  const layers = useMemo(() => makeShellLayers(model), [model])
  useEffect(() => () => layers.dispose(), [layers])

  const group = useRef<THREE.Group>(null)
  const spin = useRef(0)

  useFrame((state, delta) => {
    /* the beat clock rides the document timeline — the same clock the CSS
       mfBeat core pulses on, so the sphere and the heart breathe together */
    const doc = document.timeline?.currentTime
    layers.uniforms.uTime.value =
      typeof doc === 'number' ? doc / 1000 : state.clock.elapsedTime
    layers.uniforms.uFade.value = Math.min(1, layers.uniforms.uFade.value + delta * 0.7)

    const g = group.current
    if (!g) return
    /* idle turn (~0.0006 rad/frame at 60fps) + pointer parallax (±0.06 rad) */
    spin.current += delta * 0.036
    g.rotation.y += (spin.current + pointer.current.x * 0.06 - g.rotation.y) * 0.05
    g.rotation.x += (0.26 + pointer.current.y * 0.06 - g.rotation.x) * 0.05
  })

  return (
    <>
      <group ref={group} rotation={[0.26, 0, 0]}>
        <primitive object={layers.fills} />
        <primitive object={layers.lines} />
      </group>
      {/* the strike glow stays camera-facing OUTSIDE the spinning group */}
      <primitive object={layers.glow} />
    </>
  )
}

export default function TheDrumSphere({
  drumRef,
}: {
  drumRef: React.RefObject<HTMLDivElement | null>
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const pointer = useRef<Pointer>({ x: 0, y: 0 })
  const [inView, setInView] = useState(false)
  const [hidden, setHidden] = useState(false)
  const model = useMemo(() => buildDrumSphere(), [])

  /* the CSS rings step aside ONLY once this layer is really mounted */
  useEffect(() => {
    const drum = drumRef.current
    if (!drum) return
    drum.dataset.drum3d = '1'
    return () => {
      delete drum.dataset.drum3d
    }
  }, [drumRef])

  /* frame loop gate · hero in view + tab visible, else zero GPU work */
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
    <div className="mfd" ref={wrapRef} aria-hidden>
      <Canvas
        className="mfd-canvas"
        frameloop={inView && !hidden ? 'always' : 'never'}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', stencil: false }}
        camera={{ fov: 38, near: 0.1, far: 20, position: [0, 0, 3.9] }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        <Shell model={model} pointer={pointer} />
      </Canvas>
      {/* HUD whisper · the tholos register (pure decoration, wrapper is
          aria-hidden; the dot leaders are the tol.is label grammar) */}
      <span className="mfd-hud mfd-hud-tl">RINGS·····{RING_COUNT}</span>
      <span className="mfd-hud mfd-hud-tr">BLOCKS·····{model.count}</span>
      <span className="mfd-hud mfd-hud-bl">BEAT·····2.4s</span>
      <span className="mfd-hud mfd-hud-br">AGPL·····forever</span>
    </div>
  )
}

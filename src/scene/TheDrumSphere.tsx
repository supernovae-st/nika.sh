import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  RING_COUNT,
  buildDrumSphere,
  struckPhaseThreshold,
  type DrumSphereModel,
} from './drum-sphere-model'
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
   frameloop only while the hero is in view and the tab visible.
   THE DRUM BEATS WITH THE READING (wave I·2): the manifesto's top-level
   sections are queried from the real DOM at mount, and each section boundary
   the reader crosses STRIKES the drum once — a harder swell + core flash,
   and one latitude band ignites to the bright blue AND STAYS LIT for the
   visit (usePlan3D keeps this layer mounted once loaded, so the observer
   keeps counting while the sphere is off-screen and the shell shows the
   accrued blue when the reader scrolls back). By the end of the page the
   sphere reads more blue than black: liberation spread through the shell.
   The STRUCK·····N/M HUD whisper is the live tally. */

interface Pointer {
  x: number
  y: number
}

interface Strikes {
  struck: number
  total: number
}

function Shell({
  model,
  pointer,
  strikes,
}: {
  model: DrumSphereModel
  pointer: React.MutableRefObject<Pointer>
  strikes: Strikes
}) {
  const layers = useMemo(() => makeShellLayers(model), [model])
  useEffect(() => () => layers.dispose(), [layers])

  const group = useRef<THREE.Group>(null)
  const spin = useRef(0)

  /* a strike is a MOMENT · when the struck count rises, stamp the beat clock
     so the shader plays the harder hit + core flash from now */
  const prevStruck = useRef(strikes.struck)
  useEffect(() => {
    if (strikes.struck > prevStruck.current)
      layers.uniforms.uStrike.value = layers.uniforms.uTime.value
    prevStruck.current = strikes.struck
  }, [strikes.struck, layers])

  useFrame((state, delta) => {
    /* the beat clock rides the document timeline — the same clock the CSS
       mfBeat core pulses on, so the sphere and the heart breathe together */
    const doc = document.timeline?.currentTime
    layers.uniforms.uTime.value =
      typeof doc === 'number' ? doc / 1000 : state.clock.elapsedTime
    layers.uniforms.uFade.value = Math.min(1, layers.uniforms.uFade.value + delta * 0.7)

    /* the struck front eases toward its band threshold — a strike washes the
       new band on over ~a second instead of popping it */
    const target = struckPhaseThreshold(strikes.struck, strikes.total)
    layers.uniforms.uStruck.value +=
      (target - layers.uniforms.uStruck.value) * Math.min(1, delta * 2.4)

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
  const [strikes, setStrikes] = useState<Strikes>({ struck: 0, total: 0 })
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

  /* THE READING STRIKES THE DRUM · the manifesto's top-level sections come
     from the real DOM (no hardcoded count); crossing a boundary strikes once
     and the section stays struck for the visit (unobserved after the hit).
     The -38% bottom margin means a section strikes when its top clears the
     lower third of the viewport — the reader is actually reading it. */
  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('.mf-scope main > *'),
    )
    const total = sections.length
    if (total === 0) return
    /* dev-only capture override · /manifesto?struck=N pins the tally so a
       headless screenshot can prove the band states without scrolling */
    let floor = 0
    if (import.meta.env.DEV) {
      const q = new URLSearchParams(window.location.search).get('struck')
      if (q !== null) floor = Math.min(total, Math.max(0, Number(q) || 0))
    }
    const struckEls = new Set<Element>()
    const tally = () =>
      setStrikes((s) => ({ total, struck: Math.max(s.struck, struckEls.size, floor) }))
    /* the observer's initial async batch covers every target, so the first
       callback also announces total (+ the dev floor) — no sync setState */
    let announced = false
    const io = new IntersectionObserver(
      (entries) => {
        let grew = false
        for (const e of entries) {
          /* crossed = reading it now, OR already fully above the viewport
             (a deep-link mount lands with earlier sections already passed —
             their boundaries were still crossed) */
          const crossed = e.isIntersecting || e.boundingClientRect.bottom < 0
          if (!crossed || struckEls.has(e.target)) continue
          struckEls.add(e.target)
          io.unobserve(e.target)
          grew = true
        }
        if (!grew && announced) return
        announced = true
        tally()
      },
      { rootMargin: '0px 0px -38% 0px' },
    )
    sections.forEach((el) => io.observe(el))
    /* an INSTANT jump (End key · anchor) moves a section from below-viewport
       to above-viewport with the intersection ratio pinned at 0 — no observer
       callback ever fires. A cheap rAF-throttled scroll sweep catches any
       unstruck section whose bottom passed above the viewport. */
    let raf = 0
    const sweep = () => {
      raf = 0
      let grew = false
      for (const el of sections) {
        if (struckEls.has(el) || el.getBoundingClientRect().bottom >= 0) continue
        struckEls.add(el)
        io.unobserve(el)
        grew = true
      }
      if (grew) tally()
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(sweep)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      io.disconnect()
    }
  }, [])

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
        <Shell model={model} pointer={pointer} strikes={strikes} />
      </Canvas>
      {/* HUD whisper · the tholos register (pure decoration, wrapper is
          aria-hidden; the dot leaders are the tol.is label grammar) */}
      <span className="mfd-hud mfd-hud-tl">RINGS·····{RING_COUNT}</span>
      <span className="mfd-hud mfd-hud-tr">BLOCKS·····{model.count}</span>
      <span className="mfd-hud mfd-hud-bl">BEAT·····2.4s</span>
      <span className="mfd-hud mfd-hud-br">AGPL·····forever</span>
      {strikes.total > 0 ? (
        <span className="mfd-hud mfd-hud-mr">
          STRUCK·····{strikes.struck}/{strikes.total}
        </span>
      ) : null}
    </div>
  )
}

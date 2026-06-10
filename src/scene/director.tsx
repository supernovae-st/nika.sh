import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Noise,
  Scanline,
  Vignette,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import type { BloomEffect, ChromaticAberrationEffect } from 'postprocessing'
import * as THREE from 'three'
import { intro, scroll, mouse, journey, IT_FREEZE } from './state'
import { LensEffect } from './lens'

/* ─── clock-driven cinematic intro (GSAP-free: rAF tickers stall headless) ───
   The film: black → the ELECTRIC BUTTERFLY (the logo, made of the galaxy's
   own particles) → "SUPERNOVAE presents / NIKA" titles → supernova burst →
   the butterfly SCATTERS into the spiral → site reveal.

   ONE CLOCK: the DOM title cards are driven from THIS useFrame, not CSS
   keyframes — CSS time starts at parse but the scene clock starts at the
   first GL frame (seconds later on slow/soft-GL machines), and the
   generique must wait for the butterfly, always. */
const REDUCED =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

interface IntroDom {
  root: HTMLElement
  black: HTMLElement
  superC: HTMLElement
  nika: HTMLElement
  word: HTMLElement
  burst: HTMLElement
  nav: HTMLElement | null
  hero: HTMLElement | null
}

export function Intro() {
  const dom = useRef<IntroDom | null>(null)
  const done = useRef(false)
  const skip = useRef(0) // time offset — a click/scroll jumps the film to the burst
  useEffect(() => {
    if (REDUCED || IT_FREEZE != null) return
    const onSkip = () => {
      skip.current = -1 // sentinel: resolve against the live clock next frame
    }
    const evs = ['pointerdown', 'wheel', 'touchstart', 'keydown'] as const
    evs.forEach((e) => window.addEventListener(e, onSkip, { passive: true }))
    return () => evs.forEach((e) => window.removeEventListener(e, onSkip))
  }, [])
  useFrame((s) => {
    if (done.current) return
    // impatient visitor? jump straight to the supernova (never backwards)
    if (skip.current === -1) {
      const now = s.clock.elapsedTime
      skip.current = now < 3.38 ? 3.38 - now : 0
    }
    // lazy DOM lookup (overlay mounts alongside the canvas)
    if (!dom.current) {
      const root = document.getElementById('intro')
      if (!root) return
      dom.current = {
        root,
        black: root.querySelector('.intro-black') as HTMLElement,
        superC: root.querySelector('.intro-super') as HTMLElement,
        nika: root.querySelector('.intro-nika') as HTMLElement,
        word: root.querySelector('.intro-nika-word') as HTMLElement,
        burst: root.querySelector('.intro-burst') as HTMLElement,
        nav: document.querySelector('.nav-in'),
        hero: document.querySelector('.hero-in'),
      }
    }
    const d = dom.current
    if (REDUCED) {
      intro.reveal = intro.born = intro.dolly = 1
      intro.bfly = intro.bflyA = 0
      intro.bloom = 1.0
      d.root.style.display = 'none'
      if (d.nav) d.nav.style.opacity = '1'
      if (d.hero) d.hero.style.opacity = '1'
      done.current = true
      return
    }
    const t = IT_FREEZE ?? s.clock.elapsedTime + skip.current
    const seg = (a: number, b: number) => THREE.MathUtils.clamp((t - a) / (b - a), 0, 1)
    const easeOut = (x: number) => 1 - Math.pow(1 - x, 3)
    const easeInOut = (x: number) => x * x * (3 - 2 * x)
    const back = (x: number) => 1 - Math.pow(1 - x, 4)

    // ── canvas phases
    intro.bflyA = easeOut(seg(0.35, 1.0)) // butterfly flickers alive
    intro.bfly = 1 - easeInOut(seg(3.45, 4.7)) // the supernova scatters it
    intro.reveal = easeOut(seg(3.45, 4.9)) // cosmos born FROM the burst
    intro.born = back(seg(3.45, 5.7))
    intro.dolly = easeOut(seg(3.45, 5.3))
    const spike = Math.sin(seg(3.3, 4.15) * Math.PI) * 2.4
    intro.bloom = THREE.MathUtils.lerp(1.5, 1.0, seg(3.6, 5.0)) + spike

    // ── DOM phases (same clock) · KUBRICK GRAMMAR: titles FADE — they never
    //    zoom, blur or tear. The restraint IS the cinema (2001 · Interstellar).
    d.black.style.opacity = String(1 - seg(0.55, 1.15))
    // card 1 · SUPERNOVAE presents — slow in, hold, slow out
    {
      const a = easeInOut(seg(0.9, 1.5)) * (1 - easeInOut(seg(2.0, 2.4)))
      d.superC.style.opacity = String(a)
    }
    // card 2 · NIKA · Intent as Code — fades with the burst, no crush
    {
      const a = easeInOut(seg(2.5, 3.1)) * (1 - easeInOut(seg(3.35, 3.6)))
      d.nika.style.opacity = String(a)
      d.word.style.textShadow = 'none'
    }
    // the supernova burst — a hard flash, not a lingering veil
    {
      const bp = seg(3.38, 4.15)
      d.burst.style.opacity = String(Math.sin(bp * Math.PI) * 0.92)
      d.burst.style.transform = `scale(${0.12 + bp * 6})`
    }
    // nav + hero rise once the cosmos settles
    {
      const r = easeOut(seg(4.15, 5.1))
      if (d.nav) d.nav.style.opacity = String(r)
      if (d.hero) {
        d.hero.style.opacity = String(r)
        d.hero.style.transform = `translateY(${(1 - r) * 14}px)`
      }
    }
    if (t > 5.8 && IT_FREEZE == null) {
      d.root.style.display = 'none'
      done.current = true // film over — stop touching the DOM
    }
  })
  return null
}

/* ─── scroll-driven curved camera journey (stargate) + mouse parallax ─── */
export function Rig({ children }: { children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null!)
  const { camera } = useThree()
  const roll = useRef(0)
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 1.5, 11),
        new THREE.Vector3(4.6, 0.4, 7),
        new THREE.Vector3(3.2, -1.1, 2.6),
        new THREE.Vector3(-3.4, 0.7, 6),
        new THREE.Vector3(0, 2.3, 9.6),
      ]),
    [],
  )
  const prevY = useRef(0)
  useFrame((_, dt) => {
    // scroll velocity in screens/second (drives the CRT chromatic) — pixel-based,
    // so the feel is identical however long the page grows
    const v = Math.min(
      1,
      (Math.abs(scroll.y - prevY.current) / Math.max(scroll.vh, 1) / Math.max(dt, 0.001)) * 0.55,
    )
    prevY.current = scroll.y
    journey.vel = THREE.MathUtils.damp(journey.vel, v, 5, dt)
    // stargate dive peaks during the warp spacer (~1.25 screens in), done by ~2.5
    journey.stargate = Math.sin(THREE.MathUtils.clamp(scroll.y / (scroll.vh * 2.5), 0, 1) * Math.PI)
    // the camera flies the whole-page film — front-loaded so the dive lives
    // in the first sections and the tail relaxes into a slow reading orbit
    const p = Math.pow(scroll.progress, 0.8)
    const pos = curve.getPoint(p)
    // intro camera: starts CLOSE to the butterfly (z≈8.8), pulls back as the
    // supernova births the galaxy (dolly 0→1 ⇒ offset −2.2→0)
    const introZ = (intro.dolly - 1) * 2.2
    const tx = pos.x + mouse.x * 1.25
    const ty = pos.y + mouse.y * 0.6
    camera.position.x = THREE.MathUtils.damp(camera.position.x, tx, 3, dt)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, ty, 3, dt)
    camera.position.z = THREE.MathUtils.damp(camera.position.z, pos.z + introZ, 3, dt)
    // VERTIGO dolly-zoom · fast scroll WIDENS the lens (Hitchcock vertigo) ·
    // the stargate dive narrows it slightly — the frame breathes like a film
    const cam = camera as THREE.PerspectiveCamera
    const fovT = 50 + journey.vel * 11 - journey.stargate * 3.5
    if (Math.abs(cam.fov - fovT) > 0.01) {
      cam.fov = THREE.MathUtils.damp(cam.fov, fovT, 4, dt)
      cam.updateProjectionMatrix()
    }
    camera.lookAt(0, 0.1, 0)
    const ahead = curve.getPoint(Math.min(1, p + 0.03))
    const targetRoll = THREE.MathUtils.clamp((ahead.x - pos.x) * -0.16, -0.3, 0.3)
    roll.current = THREE.MathUtils.damp(roll.current, targetRoll, 3, dt)
    camera.rotateZ(roll.current)
    g.current.rotation.x = THREE.MathUtils.damp(g.current.rotation.x, -0.46 + mouse.y * 0.1, 2, dt)
    g.current.rotation.z = THREE.MathUtils.damp(g.current.rotation.z, mouse.x * 0.04, 2, dt)
  })
  return <group ref={g}>{children}</group>
}

/* ─── post stack · bloom + CRT chromatic (velocity-driven) + scanline + grain ─── */
export function Fx() {
  const bloom = useRef<BloomEffect>(null!)
  const ca = useRef<ChromaticAberrationEffect>(null!)
  const lens = useMemo(() => new LensEffect(), [])
  useFrame((_, dt) => {
    if (bloom.current) bloom.current.intensity = intro.bloom + journey.stargate * 0.7
    // the glass BLOOPS · base curvature + warp flex + supernova-burst surge
    // (intro.bloom spikes ~3.4 at the burst — reuse it as the energy signal)
    const surge = Math.max(0, intro.bloom - 1.6) * 0.028
    lens.k.value = 0.115 + journey.stargate * 0.055 + journey.vel * 0.03 + surge
    // the acid trip · fast scroll + deep warp = liquid hue 5th dimension
    lens.t.value += dt
    const acidTarget = Math.min(1, journey.vel * 1.6 + Math.pow(journey.stargate, 1.4) * 0.75)
    lens.acid.value = THREE.MathUtils.damp(lens.acid.value as number, acidTarget, 3, dt)
    // old-TV chromatic split that grows with scroll velocity (version-safe write)
    const eff = ca.current as unknown as {
      offset?: { set?: (x: number, y: number) => void }
      uniforms?: { get?: (k: string) => { value?: { set?: (x: number, y: number) => void } } }
    } | null
    if (eff) {
      const o = 0.0006 + journey.vel * 0.006 + journey.stargate * 0.0014
      if (typeof eff.offset?.set === 'function') eff.offset.set(o, o)
      else eff.uniforms?.get?.('offset')?.value?.set?.(o, o)
    }
  })
  return (
    <EffectComposer>
      <Bloom
        ref={bloom}
        intensity={1.0}
        luminanceThreshold={0.26}
        luminanceSmoothing={0.32}
        mipmapBlur
        radius={0.68}
      />
      <ChromaticAberration ref={ca} offset={[0.0006, 0.0006]} radialModulation modulationOffset={0.5} />
      <primitive object={lens} />
      <Scanline blendFunction={BlendFunction.OVERLAY} density={1.25} opacity={0.032} />
      <Noise premultiply blendFunction={BlendFunction.ADD} opacity={0.26} />
      <Vignette eskil={false} offset={0.16} darkness={0.9} />
    </EffectComposer>
  )
}

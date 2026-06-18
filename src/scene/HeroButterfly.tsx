import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import nikaRaw from '../assets/nika.svg?raw'

/* ─── Hero butterfly · the standalone v4 centerpiece ──────────────────────────
   A self-contained r3f particle system that REUSES the v3 butterfly sampler
   idea (src/scene/butterfly.ts) + the v3 glowing-mote shader (src/scene/
   particles.tsx · Sparks): it rasterizes the REAL nika.svg offscreen, samples
   its opaque pixels into particle target positions, and spins the whole cloud
   fast + continuously around its vertical axis — a 3D spinning logo made of
   white→cyan glowing particles, floating on the deep blue.

   Unlike the v3 Galaxy3D (a persistent full-page scene with an intro film,
   scroll rig, postprocessing), this is a SMALL isolated canvas: no scroll
   coupling, no intro state, no postprocessing chain. It mounts lazily (the
   parent code-splits it via React.lazy) so the hero's first paint stays instant,
   and it short-circuits the spin under prefers-reduced-motion (a gentle drift
   only). Pure additive · the v3 scene is untouched. */

const COUNT = 9000
const SPHERE = 0.62 // build-up shell radius before the shape forms

/* the butterfly's white→cyan family (on blue) — a touch cooler than the v3 mix */
const TINTS = [
  new THREE.Color('#ffffff'),
  new THREE.Color('#dff3ff'),
  new THREE.Color('#a9deff'),
  new THREE.Color('#7fe9ff'),
]

/** fill `out` with a faint sphere shell — the synchronous fallback so the first
    frames are never empty while the raster loads (and the final form if the
    raster is ever blocked). Pure · no refs · safe to call during render. */
function fillSphere(out: Float32Array, count: number): void {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2
    const b = Math.acos(2 * Math.random() - 1)
    out[i * 3] = SPHERE * Math.sin(b) * Math.cos(a)
    out[i * 3 + 1] = SPHERE * Math.cos(b)
    out[i * 3 + 2] = SPHERE * Math.sin(b) * Math.sin(a) * 0.5
  }
}

/** rasterize nika.svg offscreen → sample alpha>128 pixels → write centered XY
    targets (z≈0, with a breath of depth) into `out`, then call `onReady`. Runs
    from an EFFECT (not render), so reading/writing module state here is safe. */
function sampleButterflyInto(out: Float32Array, count: number, onReady: () => void): void {
  if (typeof document === 'undefined') return
  const img = new Image()
  img.onload = () => {
    try {
      const S = 440
      const cv = document.createElement('canvas')
      cv.width = S
      cv.height = S
      const ctx = cv.getContext('2d', { willReadFrequently: true })
      if (!ctx) return
      ctx.drawImage(img, 0, 0, S, S)
      const data = ctx.getImageData(0, 0, S, S).data
      const px: number[] = []
      for (let y = 0; y < S; y++)
        for (let x = 0; x < S; x++) if (data[(y * S + x) * 4 + 3] > 128) px.push(x, y)
      const n = px.length / 2
      if (n < 50) return // degenerate raster — keep the sphere fallback
      const HEIGHT = 2.0 // world height of the butterfly
      const scale = HEIGHT / S
      for (let i = 0; i < count; i++) {
        const k = (Math.random() * n) | 0
        const lx = (px[k * 2] + Math.random() - S / 2) * scale
        const ly = (S / 2 - (px[k * 2 + 1] + Math.random())) * scale
        const lz = (Math.random() - 0.5) * 0.14 // a breath of depth so it has body
        out[i * 3] = lx
        out[i * 3 + 1] = ly
        out[i * 3 + 2] = lz
      }
      onReady()
    } catch {
      /* raster blocked (e.g. tainted canvas) — the sphere fallback stays */
    }
  }
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(nikaRaw)
}

function ButterflyPoints({ reduced }: { reduced: boolean }) {
  const ready = useRef(false)
  const group = useRef<THREE.Group>(null!)
  const born = useRef(0) // 0→1 morph: sphere shell → the butterfly shape
  const snapped = useRef(false) // positions locked to targets (stop the lerp loop)

  const { geom, material, targets } = useMemo(() => {
    // the butterfly target positions — start as the sphere shell; the effect
    // below rasterizes nika.svg and overwrites them with the wing shape.
    const targets = new Float32Array(COUNT * 3)
    fillSphere(targets, COUNT)

    // the live positions start ON the sphere shell, then ease toward targets
    const pos = new Float32Array(COUNT * 3)
    const start = new Float32Array(COUNT * 3) // the sphere build-up positions
    const seed = new Float32Array(COUNT)
    const size = new Float32Array(COUNT)
    const tint = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      const a = Math.random() * Math.PI * 2
      const b = Math.acos(2 * Math.random() - 1)
      const r = SPHERE * (0.7 + Math.random() * 0.6)
      start[i * 3] = r * Math.sin(b) * Math.cos(a)
      start[i * 3 + 1] = r * Math.cos(b)
      start[i * 3 + 2] = r * Math.sin(b) * Math.sin(a)
      pos[i * 3] = start[i * 3]
      pos[i * 3 + 1] = start[i * 3 + 1]
      pos[i * 3 + 2] = start[i * 3 + 2]
      seed[i] = Math.random()
      size[i] = 26 + Math.random() * 70
      const c = TINTS[(Math.random() * TINTS.length) | 0]
      tint.set([c.r, c.g, c.b], i * 3)
    }

    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    g.setAttribute('aTint', new THREE.BufferAttribute(tint, 3))

    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uReveal: { value: 0 } },
      vertexShader: /* glsl */ `
        attribute float aSeed; attribute float aSize; attribute vec3 aTint;
        uniform float uTime; uniform float uReveal;
        varying float vTw; varying vec3 vTint;
        void main(){
          vTint = aTint;
          vec3 p = position;
          // a faint living shimmer so the cloud breathes (not a rigid plate)
          p.x += sin(uTime * 0.6 + aSeed * 24.0) * 0.012;
          p.y += cos(uTime * 0.5 + aSeed * 18.0) * 0.012;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          // a slow twinkle on each particle (firefly cadence)
          float blink = 0.55 + 0.45 * sin(uTime * (1.1 + aSeed * 2.4) + aSeed * 40.0);
          vTw = (0.34 + 0.66 * blink) * uReveal;
          gl_PointSize = clamp(aSize * (0.6 + blink * 0.5) * (1.0 / -mv.z), 1.0, 64.0);
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying float vTw; varying vec3 vTint;
        void main(){
          vec2 q = gl_PointCoord - 0.5;
          float d = length(q);
          if (d > 0.5) discard;
          float core = smoothstep(0.18, 0.0, d);   // bright firefly core
          float halo = exp(-d * 3.6);               // soft glow
          float a = clamp(core * 0.95 + halo * 0.5, 0.0, 1.0) * vTw;
          if (a < 0.01) discard;
          gl_FragColor = vec4(mix(vTint, vec3(1.0), core * 0.6) * 1.2, a);
        }
      `,
    })
    return { geom: g, material: m, targets }
  }, [])

  /* rasterize the butterfly into `targets` once (from an effect, off the render
     path) → flip `ready` so the frame loop starts the sphere→shape morph. */
  useEffect(() => {
    sampleButterflyInto(targets, COUNT, () => {
      ready.current = true
    })
  }, [targets])

  /* free the GPU buffers + shader on unmount (the parent unmounts the canvas) */
  useEffect(() => {
    return () => {
      geom.dispose()
      material.dispose()
    }
  }, [geom, material])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    material.uniforms.uTime.value = t

    // born: 0→1 over ~1.3s once the raster is ready → the shape assembles
    if (ready.current) born.current = Math.min(1, born.current + dt / 1.3)
    const ease = born.current * born.current * (3 - 2 * born.current) // smoothstep
    material.uniforms.uReveal.value = Math.max(0.12, ease) // never fully dark

    // lerp live positions from the sphere shell toward the butterfly targets,
    // then snap exactly once and stop touching the array (cheap idle after that)
    if (!snapped.current) {
      const pos = geom.getAttribute('position') as THREE.BufferAttribute
      const arr = pos.array as Float32Array
      if (born.current >= 1) {
        arr.set(targets)
        snapped.current = true
      } else {
        const k = Math.min(1, dt * (1.6 + ease * 4))
        for (let i = 0; i < arr.length; i++) arr[i] += (targets[i] - arr[i]) * k
      }
      pos.needsUpdate = true
    }

    // THE SPIN — fast, continuous, around the vertical axis (a spinning logo).
    // Reduced motion → a gentle, near-still drift instead of the fast spin.
    const speed = reduced ? 0.12 : 1.5
    if (group.current) {
      group.current.rotation.y = t * speed
      // a faint nod so it reads as a 3D object, not a flat decal
      group.current.rotation.x = Math.sin(t * 0.4) * (reduced ? 0.04 : 0.1)
    }
  })

  return (
    <group ref={group}>
      <points geometry={geom} material={material} frustumCulled={false} />
    </group>
  )
}

export default function HeroButterfly() {
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <Canvas
      // aria-hidden: the butterfly is decorative — the headline carries meaning
      aria-hidden
      gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 3.4], fov: 50 }}
      // the canvas surface is transparent — the CSS blue gradient shows through
      style={{ width: '100%', height: '100%', display: 'block' }}
      // never block the page: the canvas paints on its own, behind the copy
      frameloop="always"
    >
      <ButterflyPoints reduced={reduced} />
    </Canvas>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* ─── The depth tunnel · the full-bleed Three.js background ─────────────────────
   A wireframe SQUARE tunnel that recedes into −Z toward a centre vanishing point
   and TWISTS as it goes (each depth ring rotated a touch more than the last) —
   the operator's reference (a square wireframe vortex), but DARK/black + a blue
   tache instead of the flat-blue original.

   GEOMETRY · one LineSegments mesh:
   • the cross-section is a square of half-size R, its perimeter sampled into
     4·CELLS points (a grid of cells per wall).
   • RINGS rings recede at z = −i·DZ, each rotated θ = i·TWIST about the tunnel
     axis → the twist.
   • LONGITUDINAL lines connect each perimeter point across consecutive rings
     (they spiral with the twist); LATERAL lines close each ring's square.
   • per-vertex colour fades near→far (bright ice-blue → deep blue) and additive
     blending makes the dense centre GLOW (the blue tache).

   MOTION (rest) · the whole tunnel flows toward the camera by one ring-cycle and
   counter-rotates by one TWIST so the loop is seamless (ring i takes ring i−1's
   place exactly) → an endless dive. A subtle mouse parallax tilts the camera.
   Cheap: ~3k line segments, transform-only animation (no per-frame rebuild). */

const R = 1.0 // half-size of the square cross-section
const CELLS = 10 // grid cells per wall side → 4·CELLS perimeter points
const RINGS = 46 // depth rings
const DZ = 0.6 // depth between consecutive rings
const TWIST = (Math.PI * 1.15) / RINGS // radians of twist per ring (~207° total)
const P = CELLS * 4 // perimeter point count

/** smoothstep(a,b,x) ∈ [0,1] — eased ramp (used for the scroll fade). */
function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** a point on the (unrotated) square perimeter, parametrised by p ∈ [0, 4·CELLS). */
function squarePerim(p: number): [number, number] {
  const side = Math.floor(p / CELLS) % 4
  const frac = (p % CELLS) / CELLS
  const s = 2 * R
  switch (side) {
    case 0:
      return [-R + s * frac, -R] // bottom edge, L→R
    case 1:
      return [R, -R + s * frac] // right edge, B→T
    case 2:
      return [R - s * frac, R] // top edge, R→L
    default:
      return [-R, R - s * frac] // left edge, T→B
  }
}

function buildTunnel(): THREE.BufferGeometry {
  // precompute every ring's rotated perimeter
  const ring: [number, number][][] = []
  for (let i = 0; i <= RINGS; i++) {
    const t = i * TWIST
    const cos = Math.cos(t)
    const sin = Math.sin(t)
    const arr: [number, number][] = []
    for (let p = 0; p < P; p++) {
      const [x, y] = squarePerim(p)
      arr.push([x * cos - y * sin, x * sin + y * cos])
    }
    ring.push(arr)
  }

  const near = new THREE.Color('#dbe9ff') // ice-blue at the mouth
  const far = new THREE.Color('#3358d8') // deep blue toward the vanishing point
  const pos: number[] = []
  const col: number[] = []
  const push = (i: number, x: number, y: number) => {
    pos.push(x, y, -i * DZ)
    const c = near.clone().lerp(far, i / RINGS)
    col.push(c.r, c.g, c.b)
  }

  // longitudinal lines (spiral with the twist)
  for (let p = 0; p < P; p++) {
    for (let i = 0; i < RINGS; i++) {
      push(i, ring[i][p][0], ring[i][p][1])
      push(i + 1, ring[i + 1][p][0], ring[i + 1][p][1])
    }
  }
  // lateral lines (close each ring's square)
  for (let i = 0; i <= RINGS; i++) {
    for (let p = 0; p < P; p++) {
      const a = ring[i][p]
      const b = ring[i][(p + 1) % P]
      push(i, a[0], a[1])
      push(i, b[0], b[1])
    }
  }

  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  return g
}

/** the soft blue glow at the vanishing point (the tache) — an additive radial
    sprite sitting deep in the tunnel. Drawn from a canvas gradient (client-only). */
function useGlowTexture(): THREE.Texture {
  return useMemo(() => {
    const s = 128
    const cv = document.createElement('canvas')
    cv.width = cv.height = s
    const ctx = cv.getContext('2d')!
    const grd = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
    grd.addColorStop(0, 'rgba(120,165,255,0.95)')
    grd.addColorStop(0.4, 'rgba(80,120,255,0.35)')
    grd.addColorStop(1, 'rgba(40,70,200,0)')
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, s, s)
    const tex = new THREE.CanvasTexture(cv)
    return tex
  }, [])
}

function Tunnel({
  scroll,
  reduced,
}: {
  scroll: React.MutableRefObject<number>
  reduced: boolean
}) {
  const geom = useMemo(buildTunnel, [])
  const mat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  )
  const glowTex = useGlowTexture()
  const flow = useRef<THREE.Group>(null!) // carries the seamless dive (z + twist)
  const mouse = useRef({ x: 0, y: 0 })

  useFrame((state, dt) => {
    // ambient flow toward the camera (a seamless ring-cycle) → rest life
    const o = (state.clock.elapsedTime * (reduced ? 0.03 : 0.08)) % 1
    if (flow.current) {
      flow.current.position.z = o * DZ
      flow.current.rotation.z = -o * TWIST
    }
    const k = 1 - Math.exp(-6 * dt)
    // THE DIVE · scroll drives the camera DEEP into the tunnel (selon le scroll)
    const targetZ = 2.4 - scroll.current * 26 // mouth (2.4) → deep near the glow
    const mx = reduced ? 0 : mouse.current.x
    const my = reduced ? 0 : mouse.current.y
    state.camera.position.z += (targetZ - state.camera.position.z) * k
    state.camera.position.x += (mx * 0.3 - state.camera.position.x) * k
    state.camera.position.y += (-my * 0.3 - state.camera.position.y) * k
    state.camera.lookAt(0, 0, state.camera.position.z - 10)
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onMove = (e: PointerEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return (
    <group ref={flow}>
      <lineSegments geometry={geom} material={mat} frustumCulled={false} />
      {/* the blue tache at the vanishing point */}
      <sprite position={[0, 0, -RINGS * DZ * 0.78]} scale={[5.5, 5.5, 1]}>
        <spriteMaterial
          map={glowTex}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.9}
        />
      </sprite>
    </group>
  )
}

export default function DepthTunnel() {
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const wrap = useRef<HTMLDivElement>(null)
  const scroll = useRef(0)
  const [active, setActive] = useState(true)

  /* the scene is FIXED + full-screen and CHANGES WITH SCROLL: window scroll over
     the first ~1.3 screens drives `scroll` 0→1 (the camera dive), and the canvas
     fades out as it ends so the opaque sections below take over (the loop pauses
     off-screen for perf). */
  useEffect(() => {
    if (typeof window === 'undefined') return
    let on = true
    const onScroll = () => {
      const p = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 1.3)))
      scroll.current = p
      if (wrap.current) wrap.current.style.opacity = `${1 - smoothstep(0.72, 1, p)}`
      const a = p < 1
      if (a !== on) {
        on = a
        setActive(a)
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div ref={wrap} className="depth-fixed" aria-hidden>
      <Canvas
        aria-hidden
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 2.4], fov: 78 }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
        frameloop={active ? 'always' : 'never'}
      >
        <Tunnel scroll={scroll} reduced={reduced} />
      </Canvas>
    </div>
  )
}

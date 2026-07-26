import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { layoutConstellation } from '../../scripts/atlas/lib/radial-layout.mjs'
import { LAYER_HEX, KIND_HEX, KIND_OF_SET, PAPER } from '../content/design.generated'

/* ─── Map3dScene · the constellation in depth (WO-13 · flagged) ──────────────
   The SAME geometry the SVG draws — layoutConstellation over the SERVED
   twin (/ontology/language.json · the twin-servi law: no second source) —
   lifted into three.js with ONE new axis: z is the layer's reading order,
   so the seven layers become seven floors and the rings become a spiral
   you can orbit. Three instanced families (layer beacons · set dots ·
   member stars) + two LineSegments (the set-level link bundles · the seven
   floor rings): five draw calls for the whole language.

   THE FLOORS ARE DRAWN. A scatter of flat-lit points carries no depth: the
   first cut rendered all seven layers at one brightness and the thesis of
   the whole lens — « seven floors » — was unreadable. Two marks fix it and
   no more: one hairline ring per layer AT its own z (the floor's edge, in
   the floor's hue) and linear fog so the far floors recede. Basic materials
   both — they take fog, and software GL renders them honestly.

   THE FIT IS DERIVED. The camera distance is computed from the geometry's
   own bounding radius at the WORST tilt the drag allows (√(R²+H²)) and the
   live canvas aspect — so the drawing never crops, at any viewport, at any
   angle. The first cut hard-coded z=7.2 and clipped the top ring off the
   canvas on a desktop viewport.

   Deliberately still: frameloop="demand" renders exactly twice per
   interaction (drag rotates the group, wheel zooms — each invalidates).
   The gate in Map.tsx refuses to mount under prefers-reduced-motion and
   without the localStorage flag (⌘K carries the door); this chunk never
   loads for anyone who didn't ask for it. The canvas is decorative
   (aria-hidden): the SVG figure above it carries the semantics and the
   links. */

/** scene units per svg unit · the layout is 1200² (svg space) */
const S = 1 / 170
/** the gap between two floors, scene units */
const FLOOR = 0.62
/** the camera never crops: a margin over the worst-tilt bounding radius */
const FIT_MARGIN = 1.08

interface Geo {
  layers: { id: string; mid: number }[]
  sets: { id: string; layer: string; x: number; y: number; r: number }[]
  members: { id: string; layer: string; set: string; x: number; y: number }[]
  links: { from: string; to: string; weight: number }[]
  center: number
  ring: { layers: number; members: number }
}

/** svg space (1200²) → scene space, z = layer floor */
function toScene(geo: Geo) {
  const s = S
  const zOf = Object.fromEntries(geo.layers.map((l, i) => [l.id, (i - (geo.layers.length - 1) / 2) * FLOOR])) as Record<string, number>
  const pt = (x: number, y: number, layer: string): [number, number, number] => [
    (x - geo.center) * s,
    -(y - geo.center) * s,
    zOf[layer] ?? 0,
  ]
  return {
    zOf,
    beacons: geo.layers.map((l) => ({
      id: l.id,
      p: pt(
        geo.center + Math.cos(l.mid) * geo.ring.layers,
        geo.center + Math.sin(l.mid) * geo.ring.layers,
        l.id,
      ),
    })),
    dots: geo.sets.map((d) => ({ id: d.id, layer: d.layer, r: d.r, p: pt(d.x, d.y, d.layer) })),
    /* a member star speaks its FAMILY when its set declares one (the kinds
       seam · fenêtre C's promise: the ontology colours the node — the same
       KIND_OF_SET resolution every 2D surface reads), its floor's hue
       otherwise · beacons and set dots stay the layer voice */
    stars: geo.members.map((m) => ({
      layer: m.layer,
      kind: KIND_OF_SET[m.set] ?? null,
      p: pt(m.x, m.y, m.layer),
    })),
    wires: geo.links
      .map((l) => {
        const a = geo.sets.find((d) => d.id === l.from)
        const b = geo.sets.find((d) => d.id === l.to)
        return a && b ? ([pt(a.x, a.y, a.layer), pt(b.x, b.y, b.layer)] as const) : null
      })
      .filter((w): w is NonNullable<typeof w> => w !== null),
  }
}

function Instanced({
  items,
  geom,
  scaleOf,
}: {
  items: { p: [number, number, number]; layer?: string; id?: string; r?: number; kind?: string | null }[]
  geom: THREE.BufferGeometry
  scaleOf: (it: { r?: number }) => number
}) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const { invalidate } = useThree()
  useEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    const c = new THREE.Color()
    items.forEach((it, i) => {
      const k = scaleOf(it)
      m.makeScale(k, k, k)
      m.setPosition(...it.p)
      mesh.setMatrixAt(i, m)
      mesh.setColorAt(
        i,
        c.set(
          (it.kind && (KIND_HEX as Record<string, string>)[it.kind]) ||
            ((LAYER_HEX as Record<string, string>)[it.layer ?? it.id ?? ''] ?? '#8fa3bf'),
        ),
      )
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    invalidate()
  }, [items, scaleOf, invalidate])
  return (
    <instancedMesh ref={ref} args={[geom, undefined, Math.max(items.length, 1)]}>
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}

/* ─── the seven floors, drawn ─────────────────────────────────────────────────
   One hairline circle per layer at ITS z, at the members-ring radius (the
   floor's own edge — everything on that floor falls inside it), coloured by
   the layer's hue. All seven merged into ONE LineSegments: the structure
   becomes literal for the cost of a single draw call. */
const RING_SEGMENTS = 128

function useFloorRings(geo: Geo, zOf: Record<string, number>) {
  return useMemo(() => {
    const r = geo.ring.members * S
    const n = RING_SEGMENTS
    const pos = new Float32Array(geo.layers.length * n * 6)
    const col = new Float32Array(geo.layers.length * n * 6)
    const c = new THREE.Color()
    let o = 0
    for (const l of geo.layers) {
      const z = zOf[l.id] ?? 0
      c.set((LAYER_HEX as Record<string, string>)[l.id] ?? '#8fa3bf')
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * Math.PI * 2
        const a1 = ((i + 1) / n) * Math.PI * 2
        pos.set([Math.cos(a0) * r, Math.sin(a0) * r, z, Math.cos(a1) * r, Math.sin(a1) * r, z], o)
        col.set([c.r, c.g, c.b, c.r, c.g, c.b], o)
        o += 6
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    return g
  }, [geo, zOf])
}

/* ─── the fit · never crop, at any viewport, at any tilt ──────────────────────
   The drag tilts between 0 and -90°, so the drawing's screen half-height
   sweeps R·|cos θ| + H·|sin θ| — maximal at √(R² + H²). Fit THAT (and the
   width against the live aspect) and no angle can ever clip. Zoom rides the
   same number as a multiplier, so the clamps stay meaningful. */
function useFit(geo: Geo) {
  const { camera, size, invalidate } = useThree()
  const zoom = useRef(1)
  const base = useMemo(() => {
    const R = geo.ring.members * S
    const H = ((geo.layers.length - 1) / 2) * FLOOR
    return Math.hypot(R, H) * FIT_MARGIN
  }, [geo])
  /* the distance is STATE, not a camera read: the fog is rendered from it
     (declarative <fog args>) instead of being mutated behind React's back */
  const [dist, setDist] = useState(base * 3)

  const apply = useCallback(() => {
    const cam = camera as THREE.PerspectiveCamera
    const half = THREE.MathUtils.degToRad(cam.fov) / 2
    const aspect = size.width / Math.max(size.height, 1)
    /* the binding constraint is whichever axis runs out of frustum first */
    const d = Math.max(base / Math.tan(half), base / (Math.tan(half) * aspect)) * zoom.current
    cam.position.set(0, 0, d)
    cam.updateProjectionMatrix()
    setDist(d)
    invalidate()
  }, [camera, size, base, invalidate])

  useEffect(apply, [apply])
  /* the fog RIDES the camera. A fixed near/far reads as depth at exactly one
     distance: zoom in and the cue vanishes, zoom out and the whole drawing
     sinks into the fog colour. Anchored to d ± the bounding radius, the far
     floors recede by the same amount at every zoom. */
  return { zoom, apply, fogRange: [dist - base, dist + base * 1.25] as const }
}

function Constellation({ geo }: { geo: Geo }) {
  const scene = useMemo(() => toScene(geo), [geo])
  const group = useRef<THREE.Group>(null)
  const { invalidate, gl } = useThree()
  const sphere = useMemo(() => new THREE.SphereGeometry(1, 12, 10), [])
  const octa = useMemo(() => new THREE.OctahedronGeometry(1, 0), [])
  const rings = useFloorRings(geo, scene.zOf)
  const { zoom, apply, fogRange } = useFit(geo)
  const wireGeom = useMemo(() => {
    const pos = new Float32Array(scene.wires.length * 6)
    scene.wires.forEach(([a, b], i) => {
      pos.set(a, i * 6)
      pos.set(b, i * 6 + 3)
    })
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [scene])

  /* wheel zooms — the interaction this header promised from day one and the
     first cut never wired. passive:false + preventDefault or the page
     scrolls out from under the drawing. */
  useEffect(() => {
    const el = gl.domElement
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      zoom.current = Math.min(1.6, Math.max(0.45, zoom.current * Math.exp(e.deltaY * 0.0012)))
      apply()
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [gl, zoom, apply])

  /* drag-to-orbit by hand: rotate the group, invalidate per move — the
     whole interaction model in ~20 lines, no controls dependency */
  useEffect(() => {
    const el = gl.domElement
    let down: { x: number; y: number; rx: number; ry: number } | null = null
    const g = group.current
    if (!g) return
    g.rotation.x = -0.9
    invalidate()
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY, rx: g.rotation.x, ry: g.rotation.z }
      el.setPointerCapture(e.pointerId)
    }
    const onMove = (e: PointerEvent) => {
      if (!down) return
      g.rotation.x = Math.min(0, Math.max(-Math.PI / 2, down.rx + (e.clientY - down.y) * 0.006))
      g.rotation.z = down.ry + (e.clientX - down.x) * 0.006
      invalidate()
    }
    const onUp = () => {
      down = null
    }
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
    }
  }, [gl, invalidate])

  return (
    <group ref={group}>
      {/* the depth cue · far floors recede into the panel's own ink. Linear
          fog, anchored to the fitted distance: basic materials take it, and
          software GL renders it honestly. */}
      <fog attach="fog" args={[PAPER.bg, fogRange[0], fogRange[1]]} />
      {/* the floors first — everything else reads as standing ON them */}
      <lineSegments geometry={rings}>
        <lineBasicMaterial vertexColors transparent opacity={0.22} toneMapped={false} />
      </lineSegments>
      <Instanced items={scene.beacons} geom={octa} scaleOf={() => 0.085} />
      <Instanced items={scene.dots} geom={sphere} scaleOf={(it) => 0.014 + (it.r ?? 4) * 0.0042} />
      <Instanced items={scene.stars} geom={sphere} scaleOf={() => 0.016} />
      <lineSegments geometry={wireGeom}>
        {/* the bundles read louder than the first cut — through OPACITY, not
            a new ink: this file is folded, its palette is the graph's */}
        <lineBasicMaterial color="#3d4f6b" transparent opacity={0.5} toneMapped={false} />
      </lineSegments>
    </group>
  )
}

export default function Map3dScene() {
  const [geo, setGeo] = useState<Geo | null>(null)
  useEffect(() => {
    let alive = true
    fetch('/ontology/language.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((twin) => {
        if (alive && twin) setGeo(layoutConstellation(twin) as Geo)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])
  if (!geo) return null
  return (
    <div className="mp-3d" aria-hidden data-testid="map-3d">
      <Canvas
        frameloop="demand"
        dpr={[1, 2]}
        /* z is a placeholder — useFit derives the real distance from the
           geometry and the live aspect on mount */
        camera={{ position: [0, 0, 9], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      >
        <Constellation geo={geo} />
      </Canvas>
      <p className="mp-3d-hint">drag to orbit · scroll to zoom · seven floors, one graph</p>
    </div>
  )
}

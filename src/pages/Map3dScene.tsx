import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { layoutConstellation } from '../../scripts/atlas/lib/radial-layout.mjs'

/* ─── Map3dScene · the constellation in depth (WO-13 · flagged) ──────────────
   The SAME geometry the SVG draws — layoutConstellation over the SERVED
   twin (/ontology/language.json · the twin-servi law: no second source) —
   lifted into three.js with ONE new axis: z is the layer's reading order,
   so the seven layers become seven floors and the rings become a spiral
   you can orbit. Three instanced families (layer beacons · set dots ·
   member stars) + one LineSegments for the set-level link bundles: four
   draw calls for the whole language.

   Deliberately still: frameloop="demand" renders exactly twice per
   interaction (drag rotates the group, wheel zooms — each invalidates).
   The gate in Map.tsx refuses to mount under prefers-reduced-motion and
   without the localStorage flag, so this chunk never loads for anyone
   who didn't ask for it. The canvas is decorative (aria-hidden): the SVG
   figure above it carries the semantics and the links. */

/* the SVG's own layer hues (map-page.css) — one voice, two renderers */
const LAYER_HUE: Record<string, string> = {
  shape: '#9fd0ff',
  flow: '#5b8cff',
  acts: '#b07bff',
  reach: '#22d3ee',
  boundary: '#ff7a3c',
  refusals: '#ff5d5d',
  proof: '#34d399',
}

interface Geo {
  layers: { id: string; mid: number }[]
  sets: { id: string; layer: string; x: number; y: number; r: number }[]
  members: { id: string; layer: string; x: number; y: number }[]
  links: { from: string; to: string; weight: number }[]
  center: number
  ring: { layers: number }
}

/** svg space (1200²) → scene space: ±3.5 wide, z = layer floor */
function toScene(geo: Geo) {
  const s = 1 / 170
  const zOf = Object.fromEntries(geo.layers.map((l, i) => [l.id, (i - (geo.layers.length - 1) / 2) * 0.62]))
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
    stars: geo.members.map((m) => ({ layer: m.layer, p: pt(m.x, m.y, m.layer) })),
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
  items: { p: [number, number, number]; layer?: string; id?: string; r?: number }[]
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
      mesh.setColorAt(i, c.set(LAYER_HUE[it.layer ?? it.id ?? ''] ?? '#8fa3bf'))
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

function Constellation({ geo }: { geo: Geo }) {
  const scene = useMemo(() => toScene(geo), [geo])
  const group = useRef<THREE.Group>(null)
  const { invalidate, gl } = useThree()
  const sphere = useMemo(() => new THREE.SphereGeometry(1, 12, 10), [])
  const octa = useMemo(() => new THREE.OctahedronGeometry(1, 0), [])
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
      <Instanced items={scene.beacons} geom={octa} scaleOf={() => 0.085} />
      <Instanced items={scene.dots} geom={sphere} scaleOf={(it) => 0.014 + (it.r ?? 4) * 0.0042} />
      <Instanced items={scene.stars} geom={sphere} scaleOf={() => 0.016} />
      <lineSegments geometry={wireGeom}>
        <lineBasicMaterial color="#3d4f6b" transparent opacity={0.38} toneMapped={false} />
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
        camera={{ position: [0, 0, 7.2], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      >
        <Constellation geo={geo} />
      </Canvas>
      <p className="mp-3d-hint">drag to orbit · the same twin, in depth</p>
    </div>
  )
}

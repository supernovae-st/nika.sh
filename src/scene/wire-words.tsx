import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import helvetiker from 'three/examples/fonts/helvetiker_bold.typeface.json'
import { journey, mouse, scroll } from './state'

/* ─── BEYOND THE CHAT · REAL extruded 3D type (the Shopify depth room) ──────
   True TextGeometry letters — black faces that OCCLUDE the galaxy + thin
   white edges (EdgesGeometry). Each letter floats at its own depth and
   rotation; the camera flies THROUGH the words during the stargate dive.
   Real scene, real parallax — not a CSS trick. */

const LINES = ['BEYOND', 'THE CHAT']
const SIZE = 0.62
const DEPTH = 0.34

interface Letter {
  fill: THREE.BufferGeometry
  edges: THREE.EdgesGeometry
  x: number
  y: number
  z: number
  rotY: number
  rotX: number
  seed: number
}

function buildLetters(): { letters: Letter[]; width: number } {
  const font = new FontLoader().parse(helvetiker as unknown as Parameters<FontLoader['parse']>[0])
  const letters: Letter[] = []
  const lineWidths: number[] = []
  // measure line widths first (letter advance via bounding boxes)
  const widthOf = (ch: string) => {
    if (ch === ' ') return SIZE * 0.52
    const g = new TextGeometry(ch, { font, size: SIZE, depth: DEPTH, curveSegments: 5 })
    g.computeBoundingBox()
    const w = (g.boundingBox?.max.x ?? 0) - (g.boundingBox?.min.x ?? 0)
    g.dispose()
    return w
  }
  const TRACK = SIZE * 0.14
  for (const line of LINES) {
    let w = 0
    for (const ch of line) w += widthOf(ch) + TRACK
    lineWidths.push(w - TRACK)
  }
  const maxW = Math.max(...lineWidths)
  let seed = 1
  const rnd = () => {
    // deterministic jitter (stable between reloads · no hydration drift)
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647 - 0.5
  }
  LINES.forEach((line, li) => {
    let x = -lineWidths[li] / 2
    const y = (LINES.length / 2 - li - 0.5) * SIZE * 1.5
    for (const ch of line) {
      if (ch === ' ') {
        x += SIZE * 0.52 + TRACK
        continue
      }
      const g = new TextGeometry(ch, { font, size: SIZE, depth: DEPTH, curveSegments: 5 })
      g.computeBoundingBox()
      const w = (g.boundingBox?.max.x ?? 0) - (g.boundingBox?.min.x ?? 0)
      letters.push({
        fill: g,
        edges: new THREE.EdgesGeometry(g, 9),
        x: x + rnd() * 0.05,
        y: y + rnd() * 0.16,
        z: rnd() * 1.7, // the DEPTH scatter — letters live at different planes
        rotY: rnd() * 0.5,
        rotX: rnd() * 0.22,
        seed: Math.abs(rnd()) * 20,
      })
      x += w + TRACK
    }
  })
  return { letters, width: maxW }
}

export function WireWords() {
  const group = useRef<THREE.Group>(null!)
  const { letters, fillMat, edgeMat } = useMemo(() => {
    const built = buildLetters()
    return {
      letters: built.letters,
      // near-bg fill: the letter OCCLUDES the stars behind it (solid body)
      fillMat: new THREE.MeshBasicMaterial({ color: '#040818', transparent: true, opacity: 0 }),
      edgeMat: new THREE.LineBasicMaterial({ color: '#cfdcf6', transparent: true, opacity: 0 }),
    }
  }, [])
  useFrame((s, dt) => {
    const g = group.current
    // exit gate: the story beats own the screen past ~1.8 screens — the
    // letters bow out completely before the first sentence writes itself
    const yv = scroll.y / scroll.vh
    const exit = 1 - THREE.MathUtils.smoothstep(yv, 1.5, 1.82)
    const a = journey.stargate * exit // the warp bell · 0 → 1 → 0
    g.visible = a > 0.04
    fillMat.opacity = Math.min(1, a * 1.6) * 0.96
    edgeMat.opacity = Math.min(1, a * 1.8) * 0.95
    // the room drifts toward the camera as you dive — flying THROUGH the words
    g.position.z = 3.9 + (1 - a) * 1.6
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, mouse.x * 0.1, 4, dt)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -mouse.y * 0.06, 4, dt)
    // per-letter idle float (alive, slow)
    const t = s.clock.elapsedTime
    g.children.forEach((c, i) => {
      const L = letters[i]
      if (!L) return
      c.position.y = L.y + Math.sin(t * 0.6 + L.seed) * 0.045
      c.rotation.y = L.rotY + Math.sin(t * 0.4 + L.seed) * 0.05
    })
  })
  return (
    <group ref={group} position={[0, 0.55, 4.2]}>
      {letters.map((L, i) => (
        <group key={i} position={[L.x, L.y, L.z]} rotation={[L.rotX, L.rotY, 0]}>
          <mesh geometry={L.fill} material={fillMat} renderOrder={6} />
          <lineSegments geometry={L.edges} material={edgeMat} renderOrder={7} />
        </group>
      ))}
    </group>
  )
}

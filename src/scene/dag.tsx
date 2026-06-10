import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mouse } from './state'
import {
  DAG_NODES,
  DAG_EDGES,
  VERB_COLOR,
  NODE_T,
  EDGE_T,
  T_RUN_START,
  tw,
  type DagNode,
} from '../sections/transform-data'

/* ── timing helpers ── */
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const easeOutBack = (x: number) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
}
const runT = () => clamp01((tw.t - T_RUN_START) / (1 - T_RUN_START))
const nodeRun = (depth: number) => clamp01((runT() - depth * 0.26) / 0.34)

/* ── node card texture · the real Martian Mono, drawn once ── */
function makeNodeTexture(node: DagNode) {
  const W = 384
  const H = 144
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  const ctx = cv.getContext('2d')!
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  const draw = () => {
    ctx.clearRect(0, 0, W, H)
    const r = 26
    ctx.beginPath()
    ctx.moveTo(r, 2)
    ctx.lineTo(W - r, 2)
    ctx.arcTo(W - 2, 2, W - 2, r, r)
    ctx.lineTo(W - 2, H - r)
    ctx.arcTo(W - 2, H - 2, W - r, H - 2, r)
    ctx.lineTo(r, H - 2)
    ctx.arcTo(2, H - 2, 2, H - r, r)
    ctx.lineTo(2, r)
    ctx.arcTo(2, 2, r, 2, r)
    ctx.closePath()
    ctx.fillStyle = 'rgba(10, 15, 30, 0.94)'
    ctx.fill()
    ctx.lineWidth = 3.5
    ctx.strokeStyle = VERB_COLOR[node.verb]
    ctx.stroke()
    ctx.font = '600 42px "Martian Mono", ui-monospace, monospace'
    ctx.fillStyle = '#e9f0fc'
    ctx.textBaseline = 'middle'
    ctx.fillText(node.id, 30, 56)
    ctx.font = '400 25px "Martian Mono", ui-monospace, monospace'
    ctx.fillStyle = VERB_COLOR[node.verb]
    ctx.fillText(node.verb, 30, 108)
    // verb dot, right side
    ctx.beginPath()
    ctx.arc(W - 38, 108, 9, 0, Math.PI * 2)
    ctx.fill()
    tex.needsUpdate = true
  }
  draw()
  document.fonts?.ready.then(draw).catch(() => {})
  return tex
}

/* radial glow material (shared shape, per-color instance) */
function makeGlowMaterial(hex: string) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color(hex) }, uOp: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform vec3 uColor; uniform float uOp;
      varying vec2 vUv;
      void main(){
        float d = length(vUv - 0.5) * 2.0;
        float a = exp(-d * 3.2) * uOp;
        gl_FragColor = vec4(uColor * a, a);
      }
    `,
  })
}

function NodeCard({ node }: { node: DagNode }) {
  const g = useRef<THREE.Group>(null!)
  const mat = useRef<THREE.MeshBasicMaterial>(null!)
  const glow = useMemo(() => makeGlowMaterial(VERB_COLOR[node.verb]), [node.verb])
  const tex = useMemo(() => makeNodeTexture(node), [node])
  useEffect(
    () => () => {
      tex.dispose()
      glow.dispose()
    },
    [tex, glow],
  )
  useFrame(() => {
    const age = clamp01((tw.t - NODE_T[node.id]) / 0.045)
    const pop = age <= 0 ? 0 : easeOutBack(age)
    const pulse = Math.sin(nodeRun(node.depth) * Math.PI)
    const done = nodeRun(node.depth) >= 1 ? 0.18 : 0
    g.current.scale.setScalar(Math.max(0.0001, pop))
    g.current.visible = age > 0
    if (mat.current) mat.current.color.setScalar(1 + pulse * 0.9 + done)
    glow.uniforms.uOp.value = (0.16 + (1 - age) * 0.85 + pulse * 0.85 + done) * (age > 0 ? 1 : 0)
  })
  return (
    <group ref={g} position={[node.x, node.y, 0]}>
      <mesh material={glow} renderOrder={1}>
        <planeGeometry args={[2.9, 1.65]} />
      </mesh>
      <mesh renderOrder={2}>
        <planeGeometry args={[1.7, 0.6375]} />
        <meshBasicMaterial ref={mat} map={tex} transparent toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  )
}

const nodeById = (id: string) => DAG_NODES.find((n) => n.id === id)!

function Edge({ index }: { index: number }) {
  const e = DAG_EDGES[index]
  const PTS = 48
  const FLOW = 10
  const { curve, lineObj, lineGeom, flowGeom, flowMat } = useMemo(() => {
    const a = nodeById(e.from)
    const b = nodeById(e.to)
    const p0 = new THREE.Vector3(a.x + 0.92, a.y, 0)
    const p3 = new THREE.Vector3(b.x - 0.92, b.y, 0)
    const c = new THREE.CubicBezierCurve3(
      p0,
      new THREE.Vector3(p0.x + 0.75, p0.y, 0),
      new THREE.Vector3(p3.x - 0.75, p3.y, 0),
      p3,
    )
    const lg = new THREE.BufferGeometry().setFromPoints(c.getPoints(PTS))
    const lm = new THREE.LineBasicMaterial({
      color: new THREE.Color('#4f7adf'),
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const lo = new THREE.Line(lg, lm)
    lo.frustumCulled = false
    const fg = new THREE.BufferGeometry()
    fg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(FLOW * 3), 3))
    const fm = new THREE.PointsMaterial({
      color: new THREE.Color('#9fd8ff'),
      size: 0.055,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    return { curve: c, lineObj: lo, lineGeom: lg, flowGeom: fg, flowMat: fm }
  }, [e])
  useEffect(
    () => () => {
      lineGeom.dispose()
      if (lineObj.material instanceof THREE.Material) lineObj.material.dispose()
      flowGeom.dispose()
      flowMat.dispose()
    },
    [lineObj, lineGeom, flowGeom, flowMat],
  )
  const tRef = useRef(0)
  useFrame((_, dt) => {
    const reveal = clamp01((tw.t - EDGE_T[index]) / 0.05)
    lineGeom.setDrawRange(0, Math.max(0, Math.floor(reveal * PTS)) + (reveal > 0 ? 1 : 0))
    // particles flow along the revealed portion · the run wave accelerates them
    const srcDepth = nodeById(e.from).depth
    const boost = 1 + Math.sin(nodeRun(srcDepth) * Math.PI) * 5 + runT() * 2
    tRef.current += dt * 0.1 * boost
    const pos = flowGeom.attributes.position.array as Float32Array
    const v = new THREE.Vector3()
    for (let i = 0; i < FLOW; i++) {
      const ph = ((tRef.current + i / FLOW) % 1) * reveal
      curve.getPoint(ph, v)
      pos[i * 3] = v.x
      pos[i * 3 + 1] = v.y
      pos[i * 3 + 2] = 0.01
    }
    flowGeom.attributes.position.needsUpdate = true
    flowMat.opacity = reveal * (0.35 + Math.min(1, boost - 1) * 0.6)
  })
  return (
    <group>
      <primitive object={lineObj} />
      <points geometry={flowGeom} material={flowMat} frustumCulled={false} />
    </group>
  )
}

function Scene() {
  const g = useRef<THREE.Group>(null!)
  useFrame((s, dt) => {
    // subtle living parallax — the diagram is an object in space, not a flat svg
    g.current.rotation.y = THREE.MathUtils.damp(g.current.rotation.y, mouse.x * 0.16, 4, dt)
    g.current.rotation.x = THREE.MathUtils.damp(g.current.rotation.x, -mouse.y * 0.1, 4, dt)
    g.current.position.y = Math.sin(s.clock.elapsedTime * 0.5) * 0.04
  })
  return (
    <group ref={g}>
      {DAG_EDGES.map((_, i) => (
        <Edge key={i} index={i} />
      ))}
      {DAG_NODES.map((n) => (
        <NodeCard key={n.id} node={n} />
      ))}
    </group>
  )
}

/* ── the scoped canvas · transparent, sits inside the section card ── */
export default function DagCanvas() {
  return (
    <Canvas
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 5.6], fov: 45 }}
      style={{ width: '100%', height: '100%' }}
    >
      <Scene />
    </Canvas>
  )
}

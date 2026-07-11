import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { NikaVerb } from '../components/codefile-highlight'
import { NIKA_VERB_RGB } from '../design-tokens.generated'

/* ─── verb-glyphs-three · the four verb glyphs in the tholos register ─────────
   One SMALL (~136px) WebGL specimen per verb chapter (Verbs.tsx), speaking the
   site's shared 3D language (drum-sphere-three header · the tholos register):
     · WIREFRAME BLOCKS       box/icosa edge cages
     · FACING-ALPHA LINES     edge ink alpha follows how squarely a face meets
                              the camera (normal ≈ normalize(position) — exact
                              for the convex, origin-centred solids used here)
     · BLACK OCCLUDER FILLS   opaque near-black fills, polygonOffset pushed
                              back, Bayer-4 quantized so the pulse dithers in
                              (the DitherField signature at fill scale)
   Each glyph MOVES its verb's meaning (D-2026-05-22-N18 · a verb is a distinct
   native execution model):
     infer  ◇ a breathing icosa cluster — thinks (the drum heartbeat period)
     exec   ▷ a cube that emits a shard tick — does
     invoke ◆ a cube orbited by two satellites — uses a tool
     agent  ✦ a parent block spawns a child that returns — delegates, leashed
   Edges carry the verb hue (design-tokens NIKA_VERB_HEX values, baked); the
   leash/tick accents reuse the same hue at low alpha. DECORATIVE ONLY: the
   mount (verb-glyphs-mount.tsx) gates on desktop + motion + WebGL and mounts
   at most the in-view chapters; the kicker's static glyph char stays the
   truth everywhere else. Lazy chunk — three.js is already on the page via
   the other scenes' shared vendor chunk. */

/* the 4 verb hues · design-tokens.generated (tokens.css --verb-*) */
const HUE: Record<NikaVerb, readonly [number, number, number]> = NIKA_VERB_RGB

/* ── shaders · facing-alpha edge ink + Bayer-quantized occluder fill ───────── */
const EDGE_VERT = /* glsl */ `
varying float vFacing;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  /* convex origin-centred solids: the outward normal IS the position ray */
  vec3 nrm = normalize(normalMatrix * normalize(position));
  vFacing = clamp(dot(nrm, normalize(-mv.xyz)), 0.0, 1.0);
}
`
const EDGE_FRAG = /* glsl */ `
precision mediump float;
uniform vec3 uColor;
uniform float uAlpha;
varying float vFacing;
void main() {
  gl_FragColor = vec4(uColor, uAlpha * (0.16 + 0.84 * vFacing));
}
`
const FILL_VERT = /* glsl */ `
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`
/* the occluder ink · near-black page tone; the pulse lifts a whisper of hue
   through a Bayer-4 quantizer (the dither signature at fill scale) */
const FILL_FRAG = /* glsl */ `
precision mediump float;
uniform vec3 uHue;
uniform float uPulse;
float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
void main() {
  vec2 cell = floor(gl_FragCoord.xy / 2.0);
  float b4 = bayer2(0.5 * cell) * 0.25 + bayer2(cell);
  float q = floor(clamp(uPulse, 0.0, 1.0) * 3.0 + b4) / 3.0;
  vec3 col = mix(vec3(0.031, 0.035, 0.043), uHue * 0.34, q);
  gl_FragColor = vec4(col, 1.0);
}
`

function edgeMat(hue: readonly [number, number, number], alpha = 0.9): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: EDGE_VERT,
    fragmentShader: EDGE_FRAG,
    uniforms: {
      uColor: { value: new THREE.Color(hue[0], hue[1], hue[2]) },
      uAlpha: { value: alpha },
    },
    transparent: true,
    depthWrite: false,
  })
}

function fillMat(hue: readonly [number, number, number]): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: FILL_VERT,
    fragmentShader: FILL_FRAG,
    uniforms: {
      uHue: { value: new THREE.Color(hue[0], hue[1], hue[2]) },
      uPulse: { value: 0 },
    },
    polygonOffset: true,
    polygonOffsetFactor: 2,
    polygonOffsetUnits: 2,
  })
}

/* one wire block · black occluder fill + facing-alpha edge cage */
interface Block {
  group: THREE.Group
  fill: THREE.ShaderMaterial
  edge: THREE.ShaderMaterial
  dispose(): void
}
function makeBlock(geom: THREE.BufferGeometry, hue: readonly [number, number, number], edgeAlpha = 0.9): Block {
  const fill = fillMat(hue)
  const edge = edgeMat(hue, edgeAlpha)
  const edges = new THREE.EdgesGeometry(geom)
  const mesh = new THREE.Mesh(geom, fill)
  const lines = new THREE.LineSegments(edges, edge)
  lines.renderOrder = 1
  const group = new THREE.Group()
  group.add(mesh, lines)
  return {
    group,
    fill,
    edge,
    dispose() {
      geom.dispose()
      edges.dispose()
      fill.dispose()
      edge.dispose()
    },
  }
}

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x))
const sstep = (a: number, b: number, x: number): number => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
/* the drum heartbeat · 2.4s period, sharp attack then a long decay (the shared
   tholos pulse — the CSS mfBeat / drum-sphere drumEnv shape) */
const beat = (t: number, period = 2.4): number => {
  const w = (t / period) % 1
  return sstep(0, 0.05, w) * Math.exp(-w * 5)
}

/* ── infer ◇ · a breathing icosa cluster — the step that thinks ────────────── */
function InferGlyph() {
  const parts = useMemo(() => {
    const outer = makeBlock(new THREE.IcosahedronGeometry(1.08, 0), HUE.infer, 0.85)
    const inner = makeBlock(new THREE.IcosahedronGeometry(0.5, 0), HUE.infer, 1)
    return {
      outer,
      inner,
      dispose() {
        outer.dispose()
        inner.dispose()
      },
    }
  }, [])
  useEffect(() => () => parts.dispose(), [parts])
  const root = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const env = beat(t)
    const g = root.current
    if (!g) return
    g.rotation.set(0.42 + Math.sin(t * 0.21) * 0.08, t * 0.24, 0)
    const s = 1 + env * 0.09
    parts.outer.group.scale.setScalar(s)
    parts.inner.group.scale.setScalar(1 + env * 0.2)
    parts.inner.group.rotation.y = -t * 0.55
    parts.inner.group.rotation.x = t * 0.18
    parts.outer.edge.uniforms.uAlpha.value = 0.62 + env * 0.38
    parts.outer.fill.uniforms.uPulse.value = 0.16 + env * 0.7
    parts.inner.fill.uniforms.uPulse.value = 0.3 + env * 0.7
  })

  return (
    <group ref={root}>
      <primitive object={parts.outer.group} />
      <primitive object={parts.inner.group} />
    </group>
  )
}

/* ── exec ▷ · a cube that emits a shard tick — the step that does ──────────── */
function ExecGlyph() {
  const parts = useMemo(() => {
    const cube = makeBlock(new THREE.BoxGeometry(1.42, 1.42, 1.42), HUE.exec, 0.9)
    const shard = makeBlock(new THREE.BoxGeometry(0.24, 0.24, 0.24), HUE.exec, 1)
    return {
      cube,
      shard,
      dispose() {
        cube.dispose()
        shard.dispose()
      },
    }
  }, [])
  useEffect(() => () => parts.dispose(), [parts])
  const root = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const env = beat(t)
    const w = (t / 2.4) % 1
    const g = root.current
    if (!g) return
    g.rotation.set(0.35, t * 0.22, 0)
    parts.cube.group.scale.setScalar(1 + env * 0.08)
    parts.cube.edge.uniforms.uAlpha.value = 0.6 + env * 0.4
    parts.cube.fill.uniforms.uPulse.value = 0.14 + env * 0.75
    /* the tick · one shard shoots out on the beat, fading as it travels
       (world space — the tick always exits screen-right, the cube spins) */
    const p = clamp01(w / 0.45)
    const out = 1 - (1 - p) * (1 - p) // easeOut
    parts.shard.group.position.set(1.0 + out * 1.55, 0.12 - out * 0.18, 0.2)
    parts.shard.group.rotation.set(t * 1.4, t * 1.1, 0)
    parts.shard.group.visible = p < 1
    parts.shard.edge.uniforms.uAlpha.value = (1 - p) * 0.95
    parts.shard.fill.uniforms.uPulse.value = (1 - p) * 0.8
  })

  return (
    <group>
      <group ref={root}>
        <primitive object={parts.cube.group} />
      </group>
      <primitive object={parts.shard.group} />
    </group>
  )
}

/* ── invoke ◆ · a cube orbited by two satellites — the step that uses tools ── */
function InvokeGlyph() {
  const parts = useMemo(() => {
    const cube = makeBlock(new THREE.BoxGeometry(0.98, 0.98, 0.98), HUE.invoke, 0.9)
    const sat1 = makeBlock(new THREE.BoxGeometry(0.26, 0.26, 0.26), HUE.invoke, 1)
    const sat2 = makeBlock(new THREE.BoxGeometry(0.2, 0.2, 0.2), HUE.invoke, 1)
    /* the two orbit rings · faint hue circles (the tool paths, declared) */
    const ringGeom = new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: 65 }, (_, i) => {
        const a = (i / 64) * Math.PI * 2
        return new THREE.Vector3(Math.cos(a), 0, Math.sin(a))
      }),
    )
    const ringMat1 = edgeMat(HUE.invoke, 0.3)
    const ringMat2 = edgeMat(HUE.invoke, 0.24)
    const ring1 = new THREE.Line(ringGeom, ringMat1)
    const ring2 = new THREE.Line(ringGeom, ringMat2)
    ring1.scale.setScalar(1.5)
    ring2.scale.setScalar(1.14)
    const plane1 = new THREE.Group()
    plane1.rotation.set(0.5, 0, 0.24)
    plane1.add(ring1, sat1.group)
    const plane2 = new THREE.Group()
    plane2.rotation.set(-0.62, 0, -0.4)
    plane2.add(ring2, sat2.group)
    return {
      cube,
      sat1,
      sat2,
      plane1,
      plane2,
      dispose() {
        cube.dispose()
        sat1.dispose()
        sat2.dispose()
        ringGeom.dispose()
        ringMat1.dispose()
        ringMat2.dispose()
      },
    }
  }, [])
  useEffect(() => () => parts.dispose(), [parts])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const env = beat(t)
    parts.cube.group.rotation.set(0.4, t * 0.28, 0)
    parts.cube.group.scale.setScalar(1 + env * 0.06)
    parts.cube.edge.uniforms.uAlpha.value = 0.6 + env * 0.4
    parts.cube.fill.uniforms.uPulse.value = 0.14 + env * 0.6
    const a1 = t * 0.9
    parts.sat1.group.position.set(Math.cos(a1) * 1.5, 0, Math.sin(a1) * 1.5)
    parts.sat1.group.rotation.set(t * 0.8, t * 1.2, 0)
    parts.sat1.fill.uniforms.uPulse.value = 0.4
    const a2 = -t * 0.62 + 2.1
    parts.sat2.group.position.set(Math.cos(a2) * 1.14, 0, Math.sin(a2) * 1.14)
    parts.sat2.group.rotation.set(-t * 1.1, t * 0.7, 0)
    parts.sat2.fill.uniforms.uPulse.value = 0.36
  })

  return (
    <group>
      <primitive object={parts.cube.group} />
      <primitive object={parts.plane1} />
      <primitive object={parts.plane2} />
    </group>
  )
}

/* ── agent ✦ · a parent block spawns a child that returns — delegation ─────── */
function AgentGlyph() {
  const parts = useMemo(() => {
    const parent = makeBlock(new THREE.BoxGeometry(1.16, 1.16, 1.16), HUE.agent, 0.9)
    const child = makeBlock(new THREE.BoxGeometry(0.42, 0.42, 0.42), HUE.agent, 1)
    /* the leash · one live line parent → child (the loop stays readable) */
    const leashGeom = new THREE.BufferGeometry()
    leashGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3))
    const leashMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(HUE.agent[0], HUE.agent[1], HUE.agent[2]),
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
    const leash = new THREE.Line(leashGeom, leashMat)
    leash.renderOrder = 2
    return {
      parent,
      child,
      leash,
      leashGeom,
      leashMat,
      dispose() {
        parent.dispose()
        child.dispose()
        leashGeom.dispose()
        leashMat.dispose()
      },
    }
  }, [])
  useEffect(() => () => parts.dispose(), [parts])

  const P = useMemo(() => new THREE.Vector3(-0.42, 0.1, 0), [])
  const O = useMemo(() => new THREE.Vector3(1.28, -0.42, 0.35), [])
  const ease = (x: number): number => x * x * (3 - 2 * x)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const w = (t / 4.8) % 1
    parts.parent.group.position.copy(P)
    parts.parent.group.rotation.set(0.38, t * 0.2, 0)

    /* the delegation cycle · out (0-0.3) · work (0.3-0.55) · back (0.55-0.85)
       · absorbed (0.85-1, the parent pulses once on the return) */
    let k = 0 // 0 at the parent · 1 at the work point
    let vis = 1
    let spin = 0.6
    if (w < 0.3) k = ease(w / 0.3)
    else if (w < 0.55) {
      k = 1
      spin = 3.2 // the child works
    } else if (w < 0.85) k = 1 - ease((w - 0.55) / 0.3)
    else vis = 0

    const absorbed = w >= 0.85 ? Math.exp(-(w - 0.85) * 14) : 0
    parts.parent.group.scale.setScalar(1 + absorbed * 0.1)
    parts.parent.edge.uniforms.uAlpha.value = 0.62 + absorbed * 0.38
    parts.parent.fill.uniforms.uPulse.value = 0.16 + absorbed * 0.7

    parts.child.group.position.lerpVectors(P, O, k)
    parts.child.group.rotation.set(t * spin, t * spin * 1.3, 0)
    parts.child.group.visible = vis > 0
    parts.child.edge.uniforms.uAlpha.value = vis * (0.55 + Math.min(k, 1) * 0.45)
    parts.child.fill.uniforms.uPulse.value = vis * (0.2 + k * 0.5)

    /* the leash rides parent → child while the child is out */
    const pos = parts.leashGeom.attributes.position.array as Float32Array
    pos[0] = P.x
    pos[1] = P.y
    pos[2] = P.z
    pos[3] = parts.child.group.position.x
    pos[4] = parts.child.group.position.y
    pos[5] = parts.child.group.position.z
    parts.leashGeom.attributes.position.needsUpdate = true
    parts.leashMat.opacity = vis * k * 0.34
  })

  return (
    <group>
      <primitive object={parts.parent.group} />
      <primitive object={parts.child.group} />
      <primitive object={parts.leash} />
    </group>
  )
}

const GLYPH: Record<NikaVerb, () => React.JSX.Element> = {
  infer: InferGlyph,
  exec: ExecGlyph,
  invoke: InvokeGlyph,
  agent: AgentGlyph,
}

/* ── the canvas host · one tiny scene per mounted chapter ─────────────────────
   The mount (verb-glyphs-mount.tsx) only renders this while the chapter is in
   view, so 'always' here means « animate while visible, zero GPU otherwise ».
   DPR capped at 1.5 · low-power · alpha (the page black IS the background). */
export default function VerbGlyph3D({ verb }: { verb: NikaVerb }) {
  const Scene = GLYPH[verb]
  return (
    <Canvas
      className="vg-canvas"
      dpr={[1, 1.5]}
      frameloop="always"
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power', stencil: false }}
      camera={{ fov: 30, near: 0.1, far: 20, position: [0, 0, 5.9] }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <Scene />
    </Canvas>
  )
}

import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* ─── verb forms · the ACTION of each verb as living geometry ───────────────
   Four scoped wireframe scenes — each loops its verb's gesture:
     infer   · a mind breathing — icosahedron + thought rings rippling out
     exec    · a stamp striking — octahedron pulses, shards burst
     invoke  · tools in orbit — satellites circling a core
     agent   · delegation — a parent spawning children that fly out
   Pure analytic clock animation · additive wireframes · transparent canvas. */

type Kind = 'infer' | 'exec' | 'invoke' | 'agent'
const COLOR: Record<Kind, string> = {
  infer: '#5b8cff',
  exec: '#ff7a3c',
  invoke: '#22d3ee',
  agent: '#b07bff',
}

const wire = (color: string, opacity = 0.85) =>
  new THREE.MeshBasicMaterial({
    color,
    wireframe: true,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })

/* infer · the thinking mind — breath + ripple rings */
function InferForm({ c }: { c: string }) {
  const mind = useRef<THREE.Mesh>(null!)
  const rings = useRef<THREE.Mesh[]>([])
  const mats = useMemo(
    () => ({
      mind: wire(c, 0.8),
      rings: [0, 1].map(() => wire(c, 0)),
      ringGeo: new THREE.TorusGeometry(1, 0.014, 6, 72),
    }),
    [c],
  )
  useFrame((s) => {
    const t = s.clock.elapsedTime
    mind.current.rotation.y = t * 0.4
    mind.current.rotation.x = Math.sin(t * 0.3) * 0.25
    const breath = 1 + Math.sin(t * 1.5) * 0.06
    mind.current.scale.setScalar(breath)
    // two thought ripples · half a cycle apart
    rings.current.forEach((r, i) => {
      if (!r) return
      const p = ((t / 2.6 + i * 0.5) % 1 + 1) % 1
      r.scale.setScalar(0.55 + p * 1.7)
      mats.rings[i].opacity = (1 - p) * 0.5
    })
  })
  return (
    <group>
      <mesh ref={mind} material={mats.mind}>
        <icosahedronGeometry args={[1.05, 1]} />
      </mesh>
      {[0, 1].map((i) => (
        <mesh
          key={i}
          ref={(m) => {
            if (m) rings.current[i] = m
          }}
          geometry={mats.ringGeo}
          material={mats.rings[i]}
          rotation={[Math.PI / 2.4, 0, 0]}
        />
      ))}
    </group>
  )
}

/* exec · the strike — octahedron stamps, shards burst out */
function ExecForm({ c }: { c: string }) {
  const body = useRef<THREE.Mesh>(null!)
  const shards = useRef<THREE.Mesh[]>([])
  const N = 9
  const { dirs, bodyMat, shardMats } = useMemo(() => {
    const ds: THREE.Vector3[] = []
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2
      ds.push(new THREE.Vector3(Math.cos(a), Math.sin(a) * 0.7, Math.sin(a * 1.7) * 0.4))
    }
    return { dirs: ds, bodyMat: wire(c, 0.9), shardMats: ds.map(() => wire(c, 0)) }
  }, [c])
  useFrame((s) => {
    const t = s.clock.elapsedTime
    const p = (t % 1.9) / 1.9
    // the stamp · sharp hit then settle (easeOutExpo)
    const hit = p < 0.18 ? 1 - Math.pow(2, -10 * (p / 0.18)) : 1
    body.current.scale.setScalar(1.28 - hit * 0.28)
    body.current.rotation.y = t * 0.5
    // shards fly during the strike
    shards.current.forEach((m, i) => {
      if (!m) return
      const sp = Math.min(1, Math.max(0, (p - 0.04) / 0.65))
      m.position.copy(dirs[i]).multiplyScalar(0.6 + sp * 1.5)
      m.rotation.x = t * 2 + i
      shardMats[i].opacity = sp > 0 ? (1 - sp) * 0.85 : 0
    })
  })
  return (
    <group>
      <mesh ref={body} material={bodyMat}>
        <octahedronGeometry args={[0.95]} />
      </mesh>
      {dirs.map((_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            if (m) shards.current[i] = m
          }}
          material={shardMats[i]}
        >
          <tetrahedronGeometry args={[0.09]} />
        </mesh>
      ))}
    </group>
  )
}

/* invoke · tools in orbit — satellites circling the core */
function InvokeForm({ c }: { c: string }) {
  const sats = useRef<THREE.Mesh[]>([])
  const core = useRef<THREE.Mesh>(null!)
  const orbit = useRef<THREE.Group>(null!)
  const mats = useMemo(
    () => ({ core: wire(c, 0.9), sat: wire(c, 0.8), ring: wire(c, 0.22) }),
    [c],
  )
  useFrame((s) => {
    const t = s.clock.elapsedTime
    core.current.rotation.y = t * 0.6
    orbit.current.rotation.z = t * 0.12
    sats.current.forEach((m, i) => {
      if (!m) return
      const a = t * (0.8 + i * 0.14) + (i * Math.PI * 2) / 3
      m.position.set(Math.cos(a) * 1.3, Math.sin(a) * 1.3 * 0.42, Math.sin(a) * 0.5)
      m.rotation.y = t * 1.4 + i
    })
  })
  return (
    <group ref={orbit} rotation={[0.5, 0, -0.15]}>
      <mesh ref={core} material={mats.core}>
        <icosahedronGeometry args={[0.55, 0]} />
      </mesh>
      <mesh material={mats.ring} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.3, 0.008, 6, 80]} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          ref={(m) => {
            if (m) sats.current[i] = m
          }}
          material={mats.sat}
        >
          <boxGeometry args={[0.24, 0.24, 0.24]} />
        </mesh>
      ))}
    </group>
  )
}

/* agent · delegation — the parent spawns children that fly out on their own */
function AgentForm({ c }: { c: string }) {
  const parent = useRef<THREE.Mesh>(null!)
  const kids = useRef<THREE.Mesh[]>([])
  const { targets, parentMat, kidMats } = useMemo(() => {
    const ts = [0, 1, 2].map(
      (i) =>
        new THREE.Vector3(
          Math.cos((i / 3) * Math.PI * 2 + 0.6) * 1.55,
          Math.sin((i / 3) * Math.PI * 2 + 0.6) * 0.85,
          (i - 1) * 0.4,
        ),
    )
    return { targets: ts, parentMat: wire(c, 0.9), kidMats: ts.map(() => wire(c, 0)) }
  }, [c])
  useFrame((s) => {
    const t = s.clock.elapsedTime
    parent.current.rotation.y = t * 0.5
    parent.current.rotation.z = Math.sin(t * 0.4) * 0.2
    kids.current.forEach((m, i) => {
      if (!m) return
      const p = ((t / 2.8 + i * 0.18) % 1 + 1) % 1
      const e = 1 - Math.pow(1 - Math.min(1, p * 1.4), 3) // easeOut launch
      m.position.copy(targets[i]).multiplyScalar(e)
      m.rotation.x = t * 1.2 + i * 2
      m.rotation.y = t * 0.9
      kidMats[i].opacity = p < 0.12 ? p / 0.12 : (1 - p) * 0.95
      m.scale.setScalar(0.6 + e * 0.4)
    })
  })
  return (
    <group>
      <mesh ref={parent} material={parentMat}>
        <tetrahedronGeometry args={[0.75]} />
      </mesh>
      {targets.map((_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            if (m) kids.current[i] = m
          }}
          material={kidMats[i]}
        >
          <tetrahedronGeometry args={[0.34]} />
        </mesh>
      ))}
    </group>
  )
}

const FORMS: Record<Kind, (p: { c: string }) => React.JSX.Element> = {
  infer: InferForm,
  exec: ExecForm,
  invoke: InvokeForm,
  agent: AgentForm,
}

export function VerbForm({ kind }: { kind: Kind }) {
  const Form = FORMS[kind]
  const c = COLOR[kind]
  return (
    <div className="verb-form pointer-events-none" aria-hidden>
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        camera={{ position: [0, 0, 5.2], fov: 38 }}
        style={{ background: 'transparent' }}
      >
        <Form c={c} />
      </Canvas>
    </div>
  )
}

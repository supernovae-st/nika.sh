import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { intro } from './state'

/* ─── volumetric nebula haze · slow-drifting fbm clouds behind the galaxy ─── */
export function Nebula() {
  const SHEETS = useMemo(
    () =>
      [
        { pos: [-5.5, 0.6, -6], size: 22, a: '#1b2f74', b: '#27418f', op: 0.16, seed: 1.7 },
        { pos: [6.2, 1.8, -8], size: 26, a: '#241a55', b: '#3c2a7e', op: 0.14, seed: 4.2 },
        { pos: [0.5, -1.4, -9], size: 30, a: '#0e2a4f', b: '#1f5f8a', op: 0.1, seed: 8.9 },
        { pos: [-2.5, 2.6, -12], size: 24, a: '#172a66', b: '#2a6e96', op: 0.09, seed: 13.3 },
      ] as { pos: [number, number, number]; size: number; a: string; b: string; op: number; seed: number }[],
    [],
  )
  const mats = useMemo(
    () =>
      SHEETS.map(
        (s) =>
          new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            uniforms: {
              uTime: { value: 0 },
              uReveal: { value: 0 },
              uSeed: { value: s.seed },
              uOp: { value: s.op },
              uColA: { value: new THREE.Color(s.a) },
              uColB: { value: new THREE.Color(s.b) },
            },
            vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
            fragmentShader: /* glsl */ `
              precision highp float;
              uniform float uTime; uniform float uReveal; uniform float uSeed; uniform float uOp;
              uniform vec3 uColA; uniform vec3 uColB;
              varying vec2 vUv;
              float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
              float noise(vec2 p){
                vec2 i = floor(p), f = fract(p);
                f = f * f * (3.0 - 2.0 * f);
                return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x),
                           mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
              }
              float fbm(vec2 p){
                float v = 0.0, a = 0.5;
                for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
                return v;
              }
              void main(){
                vec2 q = vUv * 3.0 + uSeed;
                float n = fbm(q + 0.04 * uTime + 0.7 * fbm(q * 0.6 - 0.02 * uTime));
                float m = smoothstep(0.38, 0.86, n);
                float r = length(vUv - 0.5) * 2.0;
                float fall = smoothstep(1.0, 0.25, r);
                vec3 col = mix(uColA, uColB, n);
                gl_FragColor = vec4(col, m * fall * uOp * uReveal);
              }
            `,
          }),
      ),
    [SHEETS],
  )
  useFrame((_, dt) => {
    for (const m of mats) {
      m.uniforms.uTime.value += dt
      m.uniforms.uReveal.value = intro.reveal
    }
  })
  return (
    <group>
      {SHEETS.map((s, i) => (
        <mesh key={s.seed} material={mats[i]} position={s.pos} renderOrder={-2}>
          <planeGeometry args={[s.size, s.size * 0.7]} />
        </mesh>
      ))}
    </group>
  )
}

/* ─── warped spacetime grid · gravity well sheet (Ghost-in-the-Shell / Interstellar) ─── */
export function SpaceGrid() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: { uTime: { value: 0 }, uReveal: { value: 0 } },
        vertexShader: /* glsl */ `
          uniform float uTime;
          varying vec2 vUv; varying float vWell;
          void main(){
            vUv = uv;
            vec3 p = position;
            float r = length(p.xy);
            float well = -3.4 / (r * 0.5 + 0.8);
            vWell = well;
            p.z += well;
            // energy ripples radiating out of the well (GitS)
            p.z += sin(r * 1.9 - uTime * 1.6) * 0.11 * smoothstep(10.0, 1.2, r);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          precision highp float;
          uniform float uTime; uniform float uReveal;
          varying vec2 vUv; varying float vWell;
          float gl(vec2 uv, float n){
            vec2 g = abs(fract(uv * n) - 0.5) / fwidth(uv * n);
            return 1.0 - min(min(g.x, g.y), 1.0);
          }
          void main(){
            vec2 uv = vUv * 46.0;
            float l = gl(uv, 1.0);
            float fade = smoothstep(0.0, 0.35, vUv.x) * smoothstep(1.0, 0.65, vUv.x)
                       * smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.65, vUv.y);
            float energy = clamp(-vWell * 0.5, 0.0, 1.0);
            vec3 col = mix(vec3(0.18, 0.30, 0.85), vec3(0.4, 0.9, 1.0), energy);
            gl_FragColor = vec4(col, l * fade * (0.10 + energy * 0.5) * uReveal);
          }
        `,
      }),
    [],
  )
  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt
    mat.uniforms.uReveal.value = intro.reveal
  })
  return (
    <mesh material={mat} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.4, 0]}>
      <planeGeometry args={[44, 44, 90, 90]} />
    </mesh>
  )
}

/* ─── shooting stars · rare meteor streaks crossing the deep background ─── */
export function Meteors({ count = 7 }: { count?: number }) {
  const data = useMemo(() => {
    const spawn = (init: boolean) => ({
      pos: new THREE.Vector3(
        (Math.random() - 0.5) * 70,
        (Math.random() - 0.25) * 34,
        -20 - Math.random() * 24,
      ),
      dir: new THREE.Vector3(Math.random() < 0.5 ? -1 : 1, -(0.15 + Math.random() * 0.4), 0).normalize(),
      speed: 16 + Math.random() * 22,
      life: init ? Math.random() : 0,
      dur: 1.1 + Math.random() * 1.8,
    })
    const ms = Array.from({ length: count }, () => spawn(true))
    const positions = new Float32Array(count * 2 * 3)
    const colors = new Float32Array(count * 2 * 3)
    return { ms, positions, colors, spawn }
  }, [count])
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(data.positions, 3))
    g.setAttribute('color', new THREE.BufferAttribute(data.colors, 3))
    return g
  }, [data])
  useFrame((_, dt) => {
    const { ms, positions, colors, spawn } = data
    for (let i = 0; i < ms.length; i++) {
      const m = ms[i]
      m.life += dt / m.dur
      if (m.life > 1) Object.assign(m, spawn(false))
      const t = m.life * m.dur * m.speed
      const hx = m.pos.x + m.dir.x * t
      const hy = m.pos.y + m.dir.y * t
      const tail = 2.2 + m.speed * 0.09
      const b = Math.pow(Math.sin(Math.min(1, m.life) * Math.PI), 1.5) * intro.reveal
      positions.set([hx, hy, m.pos.z, hx - m.dir.x * tail, hy - m.dir.y * tail, m.pos.z], i * 6)
      colors.set([0.85 * b, 0.92 * b, b, 0, 0, 0], i * 6) // bright head → black tail (additive)
    }
    geom.attributes.position.needsUpdate = true
    geom.attributes.color.needsUpdate = true
  })
  return (
    <lineSegments geometry={geom} frustumCulled={false} renderOrder={-3}>
      <lineBasicMaterial vertexColors blending={THREE.AdditiveBlending} transparent depthWrite={false} />
    </lineSegments>
  )
}

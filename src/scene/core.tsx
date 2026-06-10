import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { intro, scroll } from './state'

/* ─── supernova core · hot center + lensed accretion ring (Gargantua nod) ─── */
export function Core() {
  const ring = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uReveal: { value: 0 } },
        vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `
          precision highp float;
          uniform float uTime; uniform float uReveal;
          varying vec2 vUv;
          void main(){
            vec2 p = vUv - 0.5;
            float r = length(p) * 2.0;
            float a = atan(p.y, p.x);
            float ring = exp(-pow((r - 0.52) * 7.0, 2.0));
            float doppler = 0.55 + 0.45 * cos(a - 0.6 - uTime * 0.22); // orbiting hotspot
            float disk = ring * doppler;
            float rays = pow(abs(sin(a * 9.0 + uTime * 0.6)), 8.0) * exp(-r * 1.6) * 0.5;
            float core = smoothstep(0.16, 0.0, r);
            float i = (core * 1.05 + disk * 1.0 + rays * 0.8) * uReveal;
            vec3 cy = vec3(0.55, 0.85, 1.0);
            vec3 col = mix(vec3(0.32, 0.55, 1.0), vec3(0.78, 0.9, 1.0), clamp(core * 1.1, 0.0, 1.0));
            col = mix(col, cy, disk * 0.5);
            gl_FragColor = vec4(col * i, i);
          }
        `,
      }),
    [],
  )
  const core = useRef<THREE.Mesh>(null!)
  const coreMat = useRef<THREE.MeshBasicMaterial>(null!)
  useFrame((s, dt) => {
    ring.uniforms.uTime.value += dt
    // dim the blazing center while the hero copy sits in front of it —
    // full Gargantua brightness returns as you dive past the first screen
    const calm = 0.42 + 0.58 * THREE.MathUtils.smoothstep(scroll.y / Math.max(scroll.vh, 1), 0.15, 0.9)
    ring.uniforms.uReveal.value = intro.reveal * calm
    if (coreMat.current) coreMat.current.color.setRGB(0.85 * calm, 1.35 * calm, 2.6 * calm)
    // the ball is BORN with the cosmos — invisible during the butterfly film
    // (it used to poke through the wings as a hard white disc)
    core.current.visible = intro.reveal > 0.02
    core.current.scale.setScalar(
      Math.max(0.0001, intro.reveal) * (1 + Math.sin(s.clock.elapsedTime * 1.5) * 0.06),
    )
  })
  return (
    <group>
      <mesh ref={core}>
        <icosahedronGeometry args={[0.2, 5]} />
        <meshBasicMaterial ref={coreMat} color={new THREE.Color(0.85, 1.35, 2.6)} toneMapped={false} />
      </mesh>
      <mesh material={ring}>
        <planeGeometry args={[4.6, 4.6]} />
      </mesh>
    </group>
  )
}

/* ─── anamorphic lens flare · horizontal light streak through the core ─── */
export function Flare() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uReveal: { value: 0 } },
        vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `
          precision highp float;
          uniform float uTime; uniform float uReveal;
          varying vec2 vUv;
          void main(){
            float ax = abs(vUv.x - 0.5) * 2.0;
            float ay = abs(vUv.y - 0.5) * 2.0;
            float streak = exp(-ax * 3.4) * exp(-ay * ay * 26.0);
            float hot = exp(-ax * ax * 42.0) * exp(-ay * ay * 30.0);
            vec3 col = mix(vec3(0.38, 0.62, 1.0), vec3(0.8, 0.91, 1.0), hot);
            float i = (streak * 0.5 + hot * 0.65) * uReveal * (0.86 + 0.14 * sin(uTime * 2.1));
            gl_FragColor = vec4(col * i, i);
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
    <Billboard position={[0, 0, 0]}>
      <mesh material={mat} renderOrder={4}>
        <planeGeometry args={[8.5, 1.1]} />
      </mesh>
    </Billboard>
  )
}

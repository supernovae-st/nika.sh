import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { intro, journey } from './state'
import { CYAN } from './palette'

/* ─── warp dust · flying THROUGH space · speeds up with the stargate (scroll) ─── */
export function WarpDust({ count = 1100 }: { count?: number }) {
  const { geom, material } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2
      const r = 1.5 + Math.random() * 11
      pos[i * 3] = Math.cos(a) * r
      pos[i * 3 + 1] = (Math.random() - 0.5) * 14
      pos[i * 3 + 2] = Math.random() * 40 - 30
      seed[i] = Math.random()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uReveal: { value: 0 }, uWarp: { value: 0 }, uCyan: { value: CYAN } },
      vertexShader: /* glsl */ `
        attribute float aSeed; uniform float uTime; uniform float uReveal; uniform float uWarp;
        varying float vF; varying float vWarp;
        void main(){
          vWarp = uWarp;
          vec3 p = position;
          float speed = 3.0 + uWarp * 22.0;
          float z = mod(p.z + uTime * speed, 40.0) - 12.0;
          p.z = z;
          // streak: stretch toward camera as warp rises
          p.xy *= 1.0 - uWarp * 0.12;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          float near = smoothstep(8.0, 2.0, -mv.z) * smoothstep(-14.0, -2.0, mv.z);
          vF = near;
          gl_PointSize = clamp((1.0 + aSeed * 2.5) * (260.0 / -mv.z) * (1.0 + uWarp * 1.5), 0.5, 40.0);
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform float uReveal; uniform vec3 uCyan;
        varying float vF; varying float vWarp;
        void main(){
          vec2 q = gl_PointCoord - 0.5;
          // elongate vertically into a streak as warp rises
          q.y *= 1.0 - vWarp * 0.7;
          float d = length(q);
          if (d > 0.5) discard;
          float a = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(mix(vec3(0.7,0.8,1.0), uCyan, 0.5), a * vF * uReveal * (0.8 + vWarp));
        }
      `,
    })
    return { geom: g, material: m }
  }, [count])
  useFrame((_, dt) => {
    material.uniforms.uTime.value += dt
    material.uniforms.uReveal.value = intro.reveal
    material.uniforms.uWarp.value = journey.stargate
  })
  /* renderOrder 10 → dust draws AFTER the headline plane = flies in FRONT of the title */
  return <points geometry={geom} material={material} frustumCulled={false} renderOrder={10} />
}

/* ─── ambiguous luminous motes · atom / star / spark · they BLINK (not butterflies) ─── */
export function Sparks({ count = 140 }: { count?: number }) {
  const { geom, material } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    const sz = new Float32Array(count)
    const tint = new Float32Array(count * 3)
    const pal = [
      new THREE.Color('#cfeeff'),
      new THREE.Color('#7fb4ff'),
      new THREE.Color('#ffffff'),
      new THREE.Color('#86f0ff'),
    ]
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2
      const r = Math.pow(Math.random(), 0.55) * 8.5
      pos[i * 3] = Math.cos(a) * r + THREE.MathUtils.randFloatSpread(1.4)
      pos[i * 3 + 1] = THREE.MathUtils.randFloatSpread(4.5)
      pos[i * 3 + 2] = Math.sin(a) * r + THREE.MathUtils.randFloatSpread(1.4)
      seed[i] = Math.random()
      sz[i] = 50 + Math.random() * 150
      const c = pal[(Math.random() * pal.length) | 0]
      tint.set([c.r, c.g, c.b], i * 3)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    g.setAttribute('aSize', new THREE.BufferAttribute(sz, 1))
    g.setAttribute('aTint', new THREE.BufferAttribute(tint, 3))
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uReveal: { value: 0 } },
      vertexShader: /* glsl */ `
        attribute float aSeed; attribute float aSize; attribute vec3 aTint;
        uniform float uTime; uniform float uReveal;
        varying float vTw; varying vec3 vTint; varying float vSpin;
        void main(){
          vTint = aTint;
          vec3 p = position;
          p.y += sin(uTime * 0.3 + aSeed * 20.0) * 0.6;
          p.x += cos(uTime * 0.22 + aSeed * 14.0) * 0.4;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          float blink = pow(0.5 + 0.5 * sin(uTime * (1.4 + aSeed * 3.2) + aSeed * 40.0), 4.0);
          vTw = (0.12 + 0.88 * blink) * uReveal;
          vSpin = uTime * (0.6 + aSeed) + aSeed * 6.28;
          gl_PointSize = clamp(aSize * (0.55 + blink * 0.7) * (1.0 / -mv.z), 1.0, 96.0);
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying float vTw; varying vec3 vTint; varying float vSpin;
        void main(){
          vec2 p = gl_PointCoord - 0.5;
          float d = length(p);
          // rotate the cross-flare (ambiguous: atom / star / spark)
          float c = cos(vSpin), s = sin(vSpin);
          vec2 rp = mat2(c, -s, s, c) * p;
          float core = smoothstep(0.16, 0.0, d);              // bright firefly core
          float halo = exp(-d * 3.4);                          // soft glow
          float cross = max(
            smoothstep(0.03, 0.0, abs(rp.x)) * smoothstep(0.45, 0.0, abs(rp.y)),
            smoothstep(0.03, 0.0, abs(rp.y)) * smoothstep(0.45, 0.0, abs(rp.x))
          );
          float a = clamp(core * 0.9 + halo * 0.55 + cross * 0.3, 0.0, 1.0) * vTw;
          if (a < 0.008) discard;
          gl_FragColor = vec4(mix(vTint, vec3(1.0), core * 0.6) * 1.25, a);
        }
      `,
    })
    return { geom: g, material: m }
  }, [count])
  useFrame((_, dt) => {
    material.uniforms.uTime.value += dt
    material.uniforms.uReveal.value = intro.reveal
  })
  return <points geometry={geom} material={material} frustumCulled={false} />
}

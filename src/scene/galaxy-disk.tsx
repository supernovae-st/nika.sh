import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { intro, egg } from './state'
import { C_IN, C_MID, C_OUT } from './palette'
import { sampleButterfly } from './butterfly'

/* ─── spiral galaxy · ~26k points · differential rotation · born from center ───
   The SAME particles open the film as the nika butterfly (aBfly targets sampled
   from the real logo · electric blue flicker) — then the supernova scatters
   them into the spiral. One particle system, two incarnations. */
export function GalaxyDisk({ count = 26000 }: { count?: number }) {
  const { geom, material } = useMemo(() => {
    const branches = 4
    const radiusMax = 11
    const spin = 0.95
    const pow = 3.2
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const rad = new Float32Array(count)
    const rnd = new Float32Array(count)
    const scl = new Float32Array(count)
    const tmp = new THREE.Color()
    for (let i = 0; i < count; i++) {
      const radius = Math.pow(Math.random(), 1.6) * radiusMax
      const branch = ((i % branches) / branches) * Math.PI * 2
      const spinA = radius * spin
      const sread = (p: number) =>
        Math.pow(Math.random(), pow) * (Math.random() < 0.5 ? 1 : -1) * (0.18 + 0.05 * radius) * p
      pos[i * 3] = Math.cos(branch + spinA) * radius + sread(1)
      pos[i * 3 + 1] = sread(0.35)
      pos[i * 3 + 2] = Math.sin(branch + spinA) * radius + sread(1)
      const t = radius / radiusMax
      tmp.copy(C_IN).lerp(C_MID, Math.min(1, t * 1.7))
      if (t > 0.55) tmp.lerp(C_OUT, (t - 0.55) / 0.45)
      col[i * 3] = tmp.r
      col[i * 3 + 1] = tmp.g
      col[i * 3 + 2] = tmp.b
      rad[i] = radius
      rnd[i] = Math.random()
      scl[i] = 1 + Math.pow(Math.random(), 4) * 5
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3))
    g.setAttribute('aRadius', new THREE.BufferAttribute(rad, 1))
    g.setAttribute('aRand', new THREE.BufferAttribute(rnd, 1))
    g.setAttribute('aScale', new THREE.BufferAttribute(scl, 1))
    // butterfly incarnation targets — sampled async from the real nika.svg
    const bfly = new Float32Array(count * 3)
    const bflyAttr = new THREE.BufferAttribute(bfly, 3)
    g.setAttribute('aBfly', bflyAttr)
    sampleButterfly(bfly, count, () => {
      bflyAttr.needsUpdate = true
    })
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uReveal: { value: 0 },
        uBorn: { value: 0 },
        uSize: { value: 26 },
        uBfly: { value: 0 },
        uBflyA: { value: 0 },
      },
      vertexShader: /* glsl */ `
        attribute vec3 aColor; attribute float aRadius; attribute float aRand; attribute float aScale;
        attribute vec3 aBfly;
        uniform float uTime; uniform float uReveal; uniform float uBorn; uniform float uSize;
        uniform float uBfly; uniform float uBflyA;
        varying vec3 vCol; varying float vTw; varying float vA;
        void main(){
          // ── the galaxy incarnation (differential rotation · big-bang scale)
          float ang = uTime * (0.10 + 0.9 / (aRadius + 0.7));
          float c = cos(ang), s = sin(ang);
          vec3 gp = position;
          gp.xz = mat2(c, -s, s, c) * gp.xz;
          gp *= uBorn;
          gp.y *= 1.0 + (1.0 - uBorn) * 4.0;
          // ── the butterfly incarnation (the logo · breathing wings)
          vec3 bp = aBfly;
          bp.x *= 1.0 + sin(uTime * 1.7) * 0.035;            // wingbeat
          bp += 0.02 * vec3(sin(uTime * 3.0 + aRand * 50.0),  // shimmer drift
                            cos(uTime * 2.3 + aRand * 70.0), 0.0);
          // morph: supernova scatters the butterfly into the spiral
          float k = uBfly * uBfly * (3.0 - 2.0 * uBfly);
          vec3 p = mix(gp, bp, k);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          // twinkle — galactic slow vs ELECTRIC flicker on the butterfly
          float twG = 0.65 + 0.35 * sin(uTime * 2.5 + aRand * 40.0);
          float twE = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(uTime * (16.0 + aRand * 26.0) + aRand * 90.0), 3.0);
          vTw = mix(twG, twE, k);
          // electric blue tint on the butterfly — saturated, lightning-like
          vec3 electric = mix(vec3(0.16, 0.45, 1.0), vec3(0.55, 0.9, 1.0), twE) * (0.9 + twE * 0.9);
          vCol = mix(aColor, electric, k * 0.9);
          vA = mix(uReveal, uBflyA, k);
          float sz = aScale * uSize * vTw * (1.0 + k * 0.6) * (1.0 / -mv.z);
          gl_PointSize = clamp(sz, 0.6, 8.0);
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying vec3 vCol; varying float vTw; varying float vA;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float a = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(vCol * (0.7 + vTw * 0.6), a * vA);
        }
      `,
    })
    return { geom: g, material: m }
  }, [count])
  const eggK = useRef(0)
  useFrame((_, dt) => {
    material.uniforms.uTime.value += dt
    material.uniforms.uReveal.value = intro.reveal
    material.uniforms.uBorn.value = intro.born
    // easter egg · typing « nika » re-forms the butterfly for a few seconds
    const want = Date.now() < egg.bflyUntil ? 1 : 0
    eggK.current = THREE.MathUtils.damp(eggK.current, want, 2.2, dt)
    material.uniforms.uBfly.value = Math.max(intro.bfly, eggK.current)
    material.uniforms.uBflyA.value = Math.max(intro.bflyA, eggK.current)
  })
  return <points geometry={geom} material={material} frustumCulled={false} />
}

/* ─── plan-scene-three · the GPU side of the 3D DAG moment ────────────────────
   Builders for ThePlanScene's five draw calls (wave-H recipe budget):
     1 · instanced slab FILLS — Lambert + Bayer-8 quantized lighting injected
         via onBeforeCompile: 3 luma plateaus mapped onto the nika ramp
         (lo #08090b · mid #16233f · hi #4f86ff), verb tint riding the hi
         plateau. Opaque; fade = mix toward the page black (zero sorting).
     2 · instanced slab EDGES — one InstancedBufferGeometry over the unit-box
         EdgesGeometry (outer + inset detail instance per slab), per-instance
         pos/scale/color/alpha. The engineering-drawing line work.
     3 · dependency EDGES — one LineSegments with per-vertex color+alpha the
         frame loop repaints (draw-on, state, traveling ignite pulses).
     4 · the FLOW FIELD — stateless curl-advected Points (the fond profond).
         Chosen tier: the dossier's FALLBACK (per-point alpha fade, no
         accumulation FBO) — SwiftShader-safe and cheap; noted in the plan.
     5 · the FOCAL GLOW — one billboarded radial quad under the current wave.

   No drei — this chunk stays lean; three itself ships in the shared vendor
   chunk the DitherField already pays for. */

import * as THREE from 'three'
import { EDGE_SEGS, RAMP_HI, RAMP_LO, RAMP_MID, SLAB, type PlanSceneModel } from './plan-scene-model'

const v3 = (c: readonly [number, number, number]) => `vec3(${c[0]}, ${c[1]}, ${c[2]})`

/* ── 1 · slab fills · Lambert + Bayer-8 quantized lighting ─────────────────── */
export function makeFillMaterial(): THREE.MeshLambertMaterial {
  const mat = new THREE.MeshLambertMaterial({ color: new THREE.Color('#8195c2') })
  /* the edges layer draws coplanar over the fills — push the fill back */
  mat.polygonOffset = true
  mat.polygonOffsetFactor = 2
  mat.polygonOffsetUnits = 2
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nattribute vec4 iTint;\nattribute float iFade;\nvarying vec4 vTint;\nvarying float vFade;',
      )
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvTint = iTint;\nvFade = iFade;')
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec4 vTint;
varying float vFade;
float psB2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
#define psB4(a) (psB2(0.5 * (a)) * 0.25 + psB2(a))
#define psB8(a) (psB4(0.5 * (a)) * 0.25 + psB2(a))
const vec3 PS_LO = ${v3(RAMP_LO)};
const vec3 PS_MID = ${v3(RAMP_MID)};
const vec3 PS_HI = ${v3(RAMP_HI)};`,
      )
      .replace(
        '#include <dithering_fragment>',
        `{
  float psLuma = dot(gl_FragColor.rgb, vec3(0.2126, 0.7152, 0.0722));
  /* the ignite lift · a tinted slab (running) pushes more cells onto the hi
     plateau, so the verb hue visibly takes the face */
  psLuma += vTint.a * 0.22;
  /* stable ~2-device-px dither cells (the DitherField convention) */
  float psTh = psB8(floor(gl_FragCoord.xy / 2.0));
  /* 3 plateaus · lo / mid / hi — flat print facets, never gloss */
  float psQ = clamp(floor(psLuma * 2.0 + psTh) / 2.0, 0.0, 1.0);
  vec3 psHi = mix(PS_HI, vTint.rgb, vTint.a);
  vec3 psCol = mix(PS_LO, PS_MID, clamp(psQ * 2.0, 0.0, 1.0));
  psCol = mix(psCol, psHi, clamp(psQ * 2.0 - 1.0, 0.0, 1.0));
  /* passing/materializing slabs dissolve toward the page black */
  gl_FragColor.rgb = mix(PS_LO, psCol, vFade);
}
#include <dithering_fragment>`,
      )
  }
  return mat
}

export interface FillLayer {
  mesh: THREE.InstancedMesh
  tint: THREE.InstancedBufferAttribute
  fade: THREE.InstancedBufferAttribute
  dispose: () => void
}

export function makeFillLayer(count: number): FillLayer {
  const geo = new THREE.BoxGeometry(1, 1, 1)
  const tint = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4)
  const fade = new THREE.InstancedBufferAttribute(new Float32Array(count), 1)
  tint.setUsage(THREE.DynamicDrawUsage)
  fade.setUsage(THREE.DynamicDrawUsage)
  geo.setAttribute('iTint', tint)
  geo.setAttribute('iFade', fade)
  const mat = makeFillMaterial()
  const mesh = new THREE.InstancedMesh(geo, mat, count)
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  mesh.frustumCulled = false
  mesh.renderOrder = 1
  return {
    mesh,
    tint,
    fade,
    dispose: () => {
      geo.dispose()
      mat.dispose()
    },
  }
}

/* ── 2 · slab edges · instanced unit-box wireframe ─────────────────────────── */
const EDGE_VERT = /* glsl */ `
attribute vec3 iPos;
attribute vec3 iScale;
attribute vec3 iColor;
attribute float iAlpha;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vColor = iColor;
  vAlpha = iAlpha;
  vec3 p = position * iScale + iPos;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`
const EDGE_FRAG = /* glsl */ `
precision mediump float;
varying vec3 vColor;
varying float vAlpha;
void main() {
  if (vAlpha < 0.004) discard;
  gl_FragColor = vec4(vColor, vAlpha);
}
`

export interface EdgeLayer {
  lines: THREE.LineSegments
  pos: THREE.InstancedBufferAttribute
  scale: THREE.InstancedBufferAttribute
  color: THREE.InstancedBufferAttribute
  alpha: THREE.InstancedBufferAttribute
  dispose: () => void
}

/** count = instances (2 per slab: the outer frame + the inset die detail) */
export function makeEdgeLayer(count: number): EdgeLayer {
  const box = new THREE.BoxGeometry(1, 1, 1)
  const base = new THREE.EdgesGeometry(box)
  box.dispose()
  const geo = new THREE.InstancedBufferGeometry()
  geo.setAttribute('position', base.attributes.position)
  geo.instanceCount = count
  const mk = (n: number) => {
    const a = new THREE.InstancedBufferAttribute(new Float32Array(count * n), n)
    a.setUsage(THREE.DynamicDrawUsage)
    return a
  }
  const pos = mk(3)
  const scale = mk(3)
  const color = mk(3)
  const alpha = mk(1)
  geo.setAttribute('iPos', pos)
  geo.setAttribute('iScale', scale)
  geo.setAttribute('iColor', color)
  geo.setAttribute('iAlpha', alpha)
  const mat = new THREE.ShaderMaterial({
    vertexShader: EDGE_VERT,
    fragmentShader: EDGE_FRAG,
    transparent: true,
    depthWrite: false,
  })
  const lines = new THREE.LineSegments(geo, mat)
  lines.frustumCulled = false
  lines.renderOrder = 3
  return {
    lines,
    pos,
    scale,
    color,
    alpha,
    dispose: () => {
      base.dispose()
      geo.dispose()
      mat.dispose()
    },
  }
}

/* ── 3 · dependency edges · one LineSegments, frame-painted verts ──────────── */
const DEP_VERT = /* glsl */ `
attribute vec3 aColor;
attribute float aAlpha;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vColor = aColor;
  vAlpha = aAlpha;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export interface DepLayer {
  lines: THREE.LineSegments
  color: THREE.BufferAttribute
  alpha: THREE.BufferAttribute
  /** vertex span of edge e: [e * EDGE_SEGS * 2, (e + 1) * EDGE_SEGS * 2) */
  vertsPerEdge: number
  dispose: () => void
}

export function makeDepLayer(model: PlanSceneModel): DepLayer {
  const vertsPerEdge = EDGE_SEGS * 2
  const total = model.edges.length * vertsPerEdge
  const positions = new Float32Array(total * 3)
  let o = 0
  for (const e of model.edges) {
    for (let s = 0; s < EDGE_SEGS; s++) {
      positions.set(e.pts.subarray(s * 3, s * 3 + 3), o)
      positions.set(e.pts.subarray((s + 1) * 3, (s + 1) * 3 + 3), o + 3)
      o += 6
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const color = new THREE.BufferAttribute(new Float32Array(total * 3), 3)
  const alpha = new THREE.BufferAttribute(new Float32Array(total), 1)
  color.setUsage(THREE.DynamicDrawUsage)
  alpha.setUsage(THREE.DynamicDrawUsage)
  geo.setAttribute('aColor', color)
  geo.setAttribute('aAlpha', alpha)
  const mat = new THREE.ShaderMaterial({
    vertexShader: DEP_VERT,
    fragmentShader: EDGE_FRAG,
    transparent: true,
    depthWrite: false,
  })
  const lines = new THREE.LineSegments(geo, mat)
  lines.frustumCulled = false
  lines.renderOrder = 2
  return {
    lines,
    color,
    alpha,
    vertsPerEdge,
    dispose: () => {
      geo.dispose()
      mat.dispose()
    },
  }
}

/* ── 4 · the flow field · stateless curl-advected points ───────────────────────
   The dossier's fallback tier (noted): no accumulation FBO — 12k points whose
   whole path is a pure function of (seed, uTime), per-point alpha envelope.
   5 unrolled advection steps: attract toward the focal + orbit + curl from 3
   offset simplex fields. Additive over the black, tinted #16233f → #4f86ff. */
const FIELD_VERT = /* glsl */ `
uniform float uTime;
uniform vec3 uFocal;
uniform float uAmp;
uniform float uSize;
attribute float aSeed;
varying float vA;
varying vec3 vC;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
/* pseudo-curl · 3 independent fields (dossier recipe: offsets +123.4 / -91.7) */
vec3 curl(vec3 p) {
  return vec3(snoise(p), snoise(p + 123.4), snoise(p - 91.7));
}
float hash1(float n) { return fract(sin(n * 127.1) * 43758.5453); }

vec3 fieldStep(vec3 p) {
  vec3 toF = uFocal - p;
  float d2 = dot(toF, toF);
  vec3 attract = toF * (1.0 / (1.0 + d2)) * 1.6;
  vec3 orbit = normalize(cross(toF, vec3(0.0, 1.0, 0.0)) + 1e-4) * 0.55;
  return attract + orbit + curl(p * 0.35) * 0.5;
}

void main() {
  float h1 = hash1(aSeed);
  float h2 = hash1(aSeed + 17.0);
  float life = fract(uTime * 0.05 + h1);
  /* spawn · a wide volume biased behind the focal wave */
  vec3 spawn = uFocal + (position - 0.5) * vec3(17.0, 9.0, 16.0) + vec3(0.0, 0.4, -5.5);
  vec3 p = spawn;
  float dt = (0.55 + 0.5 * h2) * life;
  p += fieldStep(p) * dt;
  p += fieldStep(p) * dt;
  p += fieldStep(p) * dt;
  p += fieldStep(p) * dt;
  p += fieldStep(p) * dt;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float dist = length(uFocal - p);
  float near = 1.0 - smoothstep(1.5, 8.0, dist);
  vC = mix(${v3(RAMP_MID)}, ${v3(RAMP_HI)}, near * 0.75);
  /* vignette toward the canvas bounds — the additive haze must never draw the
     canvas rectangle over the page black */
  vec2 ndc = gl_Position.xy / max(1e-4, gl_Position.w);
  float edgeK = 1.0 - smoothstep(0.62, 0.96, max(abs(ndc.x), abs(ndc.y)));
  vA = sin(3.14159 * life) * uAmp * (0.22 + 0.38 * near) * edgeK;
  gl_PointSize = clamp(uSize / max(1.0, -mv.z), 1.0, 3.0);
}
`
const FIELD_FRAG = /* glsl */ `
precision mediump float;
varying float vA;
varying vec3 vC;
void main() {
  if (vA < 0.004) discard;
  vec2 d = gl_PointCoord - 0.5;
  float r = 1.0 - smoothstep(0.1, 0.5, length(d));
  gl_FragColor = vec4(vC, vA * r);
}
`

export interface FieldLayer {
  points: THREE.Points
  uniforms: {
    uTime: { value: number }
    uFocal: { value: THREE.Vector3 }
    uAmp: { value: number }
    uSize: { value: number }
  }
  dispose: () => void
}

export function makeFieldLayer(count = 12000): FieldLayer {
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  const seed = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    pos[i * 3] = Math.random()
    pos[i * 3 + 1] = Math.random()
    pos[i * 3 + 2] = Math.random()
    seed[i] = Math.random() * 1000
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
  const uniforms = {
    uTime: { value: 0 },
    uFocal: { value: new THREE.Vector3(0, 0, 0) },
    uAmp: { value: 0 },
    uSize: { value: 26 },
  }
  const mat = new THREE.ShaderMaterial({
    vertexShader: FIELD_VERT,
    fragmentShader: FIELD_FRAG,
    uniforms,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
  })
  const points = new THREE.Points(geo, mat)
  points.frustumCulled = false
  points.renderOrder = 0
  return {
    points,
    uniforms,
    dispose: () => {
      geo.dispose()
      mat.dispose()
    },
  }
}

/* ── 5 · the focal glow · one billboarded radial quad under the wave ───────── */
const GLOW_FRAG = /* glsl */ `
precision mediump float;
uniform float uOpacity;
varying vec2 vUv;
void main() {
  float d = length(vUv - 0.5) * 2.0;
  float g = exp(-d * d * 3.2) * uOpacity;
  if (g < 0.004) discard;
  gl_FragColor = vec4(${v3(RAMP_HI)} * 0.55 + ${v3(RAMP_MID)} * 0.45, g);
}
`
const GLOW_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export interface GlowLayer {
  mesh: THREE.Mesh
  uniforms: { uOpacity: { value: number } }
  dispose: () => void
}

export function makeGlowLayer(): GlowLayer {
  const geo = new THREE.PlaneGeometry(9, 6.5)
  const uniforms = { uOpacity: { value: 0 } }
  const mat = new THREE.ShaderMaterial({
    vertexShader: GLOW_VERT,
    fragmentShader: GLOW_FRAG,
    uniforms,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.frustumCulled = false
  mesh.renderOrder = 0
  return {
    mesh,
    uniforms,
    dispose: () => {
      geo.dispose()
      mat.dispose()
    },
  }
}

/** slab dims shorthand the frame loop scales instances with */
export const SLAB_DIMS = new THREE.Vector3(SLAB.w, SLAB.h, SLAB.d)

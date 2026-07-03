/* ─── plan-scene-three · the GPU side of the 3D DAG moment ────────────────────
   Builders for ThePlanScene's five draw calls (wave-H recipe budget):
     1 · instanced slab FILLS — Lambert + Bayer-8 quantized lighting injected
         via onBeforeCompile: 3 luma plateaus mapped onto the nika ramp
         (lo #08090b · mid #16233f · hi #4f86ff), verb tint riding the hi
         plateau, and the LABEL-ATLAS decal (task id · verb word · status
         zone) composited crisp over the dithered front face — the slab's
         identity is part of the slab. Opaque; fade = mix toward the page
         black (zero sorting).
     2 · instanced slab EDGES — one InstancedBufferGeometry over the unit-box
         EdgesGeometry (outer + inset detail instance per slab), per-instance
         pos/scale/color/alpha. The engineering-drawing line work.
     3 · dependency EDGES — one LineSegments with per-vertex color+alpha the
         frame loop repaints (draw-on, state, traveling ignite pulses).
     4 · the FLOW FIELD — stateless curl-advected Points (the fond profond).
         Chosen tier: the dossier's FALLBACK (per-point alpha fade, no
         accumulation FBO) — SwiftShader-safe and cheap; noted in the plan.
     5 · the FOCAL GLOW — one billboarded radial quad under the current wave.
     6 · the FLOOR GRID — one world-fixed plane under the amphitheater whose
         hairlines dissolve into Bayer dither dots with distance (wave I ·
         the shopify.design wireframe-room register, spoken in tholos): the
         camera's dolly reads against it — lines sweeping past ARE the speed.
     7 · the HORIZON HINT — one faint additive rule far behind the last wave,
         the room's vanishing anchor.

   No drei — this chunk stays lean; three itself ships in the shared vendor
   chunk the DitherField already pays for.

   THEME DOCTRINE · this scene speaks the shared tholos register (wireframe
   blocks · facing-alpha lines · black occluder fills · HUD mono whispers) —
   the canonical statement lives in src/scene/drum-sphere-three.ts; new
   nika.sh 3D scenes reuse that register rather than inventing one. */

import * as THREE from 'three'
import type { FlagshipTask } from '../../flagships'
import {
  EDGE_SEGS,
  RAMP_HI,
  RAMP_LO,
  RAMP_MID,
  SLAB,
  VERB_HEX,
  WAVE_GAP,
  Y_STEP,
  type PlanSceneModel,
  type SlabRunState,
} from './plan-scene-model'

const v3 = (c: readonly [number, number, number]) => `vec3(${c[0]}, ${c[1]}, ${c[2]})`

/* ── 1a · the label atlas · on-slab identity (task id + verb + status) ────────
   One shared CanvasTexture; each task owns a tile painted on its slab's FRONT
   face by the fill shader. The block itself says WHICH task, WHICH verb and
   WHAT the recorded run did to it — an identity that can never detach from
   its geometry. Tiles redraw ONLY on a status change (never per frame); the
   Bayer-quantized lighting keeps dithering the face around the crisp glyphs. */
const TILE_W = 384
const TILE_H = 208

const FACE_INK = '#e2eaff'
const FACE_DIM = '#89909f'
const CHIP_INK: Record<SlabRunState, string> = {
  pending: 'rgb(226 234 255 / 0.4)',
  running: FACE_INK, // overridden by the verb hue at draw time
  done: '#9bd29a', // --cf-str · same green the DOM chips use
  skipped: '#e6b873', // --cf-num · same amber the DOM chips use
}

function monoStack(): string {
  const v =
    typeof window === 'undefined'
      ? ''
      : getComputedStyle(document.documentElement).getPropertyValue('--mono').trim()
  return v || "'Martian Mono', ui-monospace, monospace"
}

export interface LabelAtlas {
  texture: THREE.CanvasTexture
  uvScale: [number, number]
  /** uv offset of task i's tile (flipY-aware: lower-left corner) */
  uvOffset: (i: number) => [number, number]
  /** repaint task i's tile — call ONLY when its run state changes */
  draw: (i: number, task: FlagshipTask, state: SlabRunState, chip: string) => void
  dispose: () => void
}

export function makeLabelAtlas(tasks: readonly FlagshipTask[]): LabelAtlas {
  const cols = Math.min(4, Math.max(1, tasks.length))
  const rows = Math.max(1, Math.ceil(tasks.length / cols))
  const canvas = document.createElement('canvas')
  canvas.width = cols * TILE_W
  canvas.height = rows * TILE_H
  const ctx = canvas.getContext('2d')
  const texture = new THREE.CanvasTexture(canvas)
  /* no mipmaps: tiles must not bleed into neighbors at minification, and a
     status repaint must not pay a mip chain rebuild */
  texture.generateMipmaps = false
  texture.minFilter = THREE.LinearFilter
  const mono = monoStack()
  /* every glyph gets a soft dark halo so it separates from ANY face plateau —
     a running face is nearly the verb hue itself, so its verb + status lines
     switch to white ink (the face already carries the hue, loudly) */
  const ink = (text: string, cx: number, cy: number, font: string, fill: string): void => {
    if (!ctx) return
    ctx.font = font
    ctx.shadowColor = 'rgb(4 6 10 / 0.9)'
    ctx.shadowBlur = 9
    ctx.fillStyle = fill
    ctx.fillText(text, cx, cy)
    ctx.shadowBlur = 0
    ctx.fillText(text, cx, cy)
  }
  const draw = (i: number, task: FlagshipTask, state: SlabRunState, chip: string): void => {
    if (!ctx) return
    const x = (i % cols) * TILE_W
    const y = Math.floor(i / cols) * TILE_H
    ctx.clearRect(x, y, TILE_W, TILE_H)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    const cx = x + TILE_W / 2
    const dim = state === 'skipped'
    const lit = state === 'running'
    /* task id · mono 600 · shrink-to-fit the tile */
    let px = 52
    ctx.font = `600 ${px}px ${mono}`
    const maxW = TILE_W - 44
    const w = ctx.measureText(task.id).width
    if (w > maxW) {
      px = Math.max(24, Math.floor((px * maxW) / w))
    }
    ink(task.id, cx, y + 82, `600 ${px}px ${mono}`, dim ? FACE_DIM : FACE_INK)
    /* the verb word · its hue IS the identity (white while the face is lit) */
    ink(
      task.verb,
      cx,
      y + 128,
      `500 30px ${mono}`,
      dim ? FACE_DIM : lit ? FACE_INK : VERB_HEX[task.verb],
    )
    /* status zone · '' idle · ▸ running · ✓ done ms · ⊘ skipped */
    if (chip) {
      ink(chip, cx, y + 184, `600 33px ${mono}`, lit ? '#ffffff' : CHIP_INK[state])
    }
    texture.needsUpdate = true
  }
  return {
    texture,
    uvScale: [1 / cols, 1 / rows],
    uvOffset: (i) => [(i % cols) / cols, 1 - (Math.floor(i / cols) + 1) / rows],
    draw,
    dispose: () => texture.dispose(),
  }
}

/* ── 1b · slab fills · Lambert + Bayer-8 quantized lighting + label decal ──── */
export function makeFillMaterial(label: LabelAtlas): THREE.MeshLambertMaterial {
  const mat = new THREE.MeshLambertMaterial({ color: new THREE.Color('#8195c2') })
  /* the edges layer draws coplanar over the fills — push the fill back */
  mat.polygonOffset = true
  mat.polygonOffsetFactor = 2
  mat.polygonOffsetUnits = 2
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uLabels = { value: label.texture }
    shader.uniforms.uUvScale = { value: new THREE.Vector2(label.uvScale[0], label.uvScale[1]) }
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nattribute vec4 iTint;\nattribute float iFade;\nattribute vec2 iUvOff;\nuniform vec2 uUvScale;\nvarying vec4 vTint;\nvarying float vFade;\nvarying vec3 vLbl;',
      )
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvTint = iTint;\nvFade = iFade;\n/* label uv (atlas tile) + front-face gate (unit box: z = +0.5) */\nvLbl = vec3(iUvOff + uv * uUvScale, step(0.499, position.z));',
      )
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform sampler2D uLabels;
varying vec4 vTint;
varying float vFade;
varying vec3 vLbl;
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
  /* the on-slab label (crisp over the dithered face, front face only) —
     it rides psCol so it dissolves WITH its slab, never orphaned */
  vec4 psLbl = texture2D(uLabels, vLbl.xy);
  psCol = mix(psCol, psLbl.rgb, psLbl.a * vLbl.z);
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

export function makeFillLayer(count: number, label: LabelAtlas): FillLayer {
  const geo = new THREE.BoxGeometry(1, 1, 1)
  const tint = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4)
  const fade = new THREE.InstancedBufferAttribute(new Float32Array(count), 1)
  tint.setUsage(THREE.DynamicDrawUsage)
  fade.setUsage(THREE.DynamicDrawUsage)
  geo.setAttribute('iTint', tint)
  geo.setAttribute('iFade', fade)
  /* static per-instance atlas tile (instance i = task i, model order) */
  const uvOff = new Float32Array(count * 2)
  for (let i = 0; i < count; i++) {
    const [ox, oy] = label.uvOffset(i)
    uvOff[i * 2] = ox
    uvOff[i * 2 + 1] = oy
  }
  geo.setAttribute('iUvOff', new THREE.InstancedBufferAttribute(uvOff, 2))
  const mat = makeFillMaterial(label)
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

/* ── 2 · slab edges · instanced unit-box wireframe ───────────────────────────
   iRot = the slab's X-pitch (radians, same signed angle the fill matrix
   uses): passing slabs lean their face toward the elevated camera, and the
   line cage must lean WITH the face it frames. iYaw = the flatten's Y-yaw
   (wave K): the lying-down slab quarter-turns so its face reads upright
   under the rolled top-down camera — composed Ry(yaw)·Rx(pitch), the same
   order the fill matrices use. */
const EDGE_VERT = /* glsl */ `
attribute vec3 iPos;
attribute vec3 iScale;
attribute vec3 iColor;
attribute float iAlpha;
attribute float iRot;
attribute float iYaw;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vColor = iColor;
  vAlpha = iAlpha;
  vec3 p = position * iScale;
  float rc = cos(iRot);
  float rs = sin(iRot);
  p.yz = vec2(rc * p.y - rs * p.z, rs * p.y + rc * p.z);
  float yc = cos(iYaw);
  float ys = sin(iYaw);
  p.xz = vec2(yc * p.x + ys * p.z, yc * p.z - ys * p.x);
  p += iPos;
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
  rot: THREE.InstancedBufferAttribute
  yaw: THREE.InstancedBufferAttribute
  dispose: () => void
}

/** count = instances (4 per slab: the outer frame + the inset die detail +
    the running-state verb-hue glow cage + the task_started ring flash) */
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
  const rot = mk(1)
  const yaw = mk(1)
  geo.setAttribute('iPos', pos)
  geo.setAttribute('iScale', scale)
  geo.setAttribute('iColor', color)
  geo.setAttribute('iAlpha', alpha)
  geo.setAttribute('iRot', rot)
  geo.setAttribute('iYaw', yaw)
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
    rot,
    yaw,
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

/* ── 6 · the floor grid · the wireframe room's ground (wave I) ────────────────
   One world-fixed plane under the slab amphitheater. Hairlines in the wire
   blue; the DISTANCE fade is quantized through the same Bayer-8 threshold
   the slab faces use, so a receding line dissolves into dither dots (the
   drum-sphere doctrine) instead of greying out — and it is GONE past
   mid-distance. The camera dollies over it: the lines sweeping past are the
   speed cue. Quiet by law: alpha ceiling 0.13 (≤0.16 operator cap · P3
   displays render hotter than headless sRGB), an NDC vignette keeps the
   canvas rectangle invisible (the field layer's own convention). */
const FLOOR_Y = -1.1
const FLOOR_CELL = 2.05 // one slab-width per tile — the room rhymes with its blocks

const FLOOR_VERT = /* glsl */ `
varying vec3 vWorld;
varying vec2 vNdc;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
  vNdc = gl_Position.xy / max(1e-4, gl_Position.w);
}
`
const FLOOR_FRAG = /* glsl */ `
precision mediump float;
uniform float uFade;
varying vec3 vWorld;
varying vec2 vNdc;
float psB2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
#define psB4(a) (psB2(0.5 * (a)) * 0.25 + psB2(a))
#define psB8(a) (psB4(0.5 * (a)) * 0.25 + psB2(a))
void main() {
  /* hairline grid · fwidth-normalized so the line stays ~1px at any depth.
     The CROSSING lines (constant z) carry the dolly's speed — they read a
     touch stronger than the receding ones */
  vec2 cell = vWorld.xz / ${FLOOR_CELL.toFixed(2)};
  vec2 fw = max(fwidth(cell), vec2(1e-5));
  vec2 d = abs(fract(cell) - 0.5) / fw;
  float lineX = 1.0 - min(d.x * 1.1, 1.0); /* receding, along the road */
  float lineZ = 1.0 - min(d.y * 0.9, 1.0); /* crossing — the speed cue */
  float line = max(lineZ, lineX * 0.72);
  if (line <= 0.0) discard;
  /* the distance envelope · full only near the camera's ground, NOTHING past
     mid-distance — quantized by the Bayer threshold: the fade IS the dissolve
     (2-device-px cells, the DitherField convention) */
  float dist = length(vWorld.xz - cameraPosition.xz);
  float fadeK = (1.0 - smoothstep(7.0, 18.0, dist)) * smoothstep(2.0, 4.2, dist);
  float gate = step(psB8(floor(gl_FragCoord.xy / 2.0)), fadeK);
  /* the canvas edge must never print its rectangle — a NARROW feather (the
     grid may run to the frame's lower corners; only the cut line hides) */
  float edgeK = 1.0 - smoothstep(0.78, 0.97, max(abs(vNdc.x), abs(vNdc.y)));
  float a = line * gate * edgeK * uFade * 0.15;
  if (a < 0.004) discard;
  vec3 col = mix(${v3(RAMP_MID)}, ${v3(RAMP_HI)}, 0.42);
  gl_FragColor = vec4(col, a);
}
`

export interface FloorLayer {
  mesh: THREE.Mesh
  uniforms: { uFade: { value: number } }
  dispose: () => void
}

export function makeFloorLayer(waveCount: number): FloorLayer {
  /* the ground spans the whole dolly: ahead of the overview camera down to
     well past the last wave (the far half dissolves anyway) */
  const depth = waveCount * WAVE_GAP + 56
  const geo = new THREE.PlaneGeometry(76, depth)
  const uniforms = { uFade: { value: 0 } }
  const mat = new THREE.ShaderMaterial({
    vertexShader: FLOOR_VERT,
    fragmentShader: FLOOR_FRAG,
    uniforms,
    transparent: true,
    depthWrite: false,
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.set(0, FLOOR_Y, 16 - depth / 2)
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

/* ── 7 · the horizon hint · the room's vanishing anchor ──────────────────────
   One faint additive rule far behind the last wave, at the amphitheater's
   mid-rise — the fixed point the dolly advances toward. */
const HORIZON_FRAG = /* glsl */ `
precision mediump float;
uniform float uFade;
varying vec2 vUv;
void main() {
  vec2 c = (vUv - 0.5) * 2.0;
  float g = exp(-c.x * c.x * 2.6) * exp(-c.y * c.y * 3.0) * uFade * 0.07;
  if (g < 0.004) discard;
  gl_FragColor = vec4(mix(${v3(RAMP_MID)}, ${v3(RAMP_HI)}, 0.5), g);
}
`

export interface HorizonLayer {
  mesh: THREE.Mesh
  uniforms: { uFade: { value: number } }
  dispose: () => void
}

export function makeHorizonLayer(waveCount: number): HorizonLayer {
  const geo = new THREE.PlaneGeometry(58, 2.6)
  const uniforms = { uFade: { value: 0 } }
  const mat = new THREE.ShaderMaterial({
    vertexShader: GLOW_VERT,
    fragmentShader: HORIZON_FRAG,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(0, ((waveCount - 1) * Y_STEP) / 2, -(waveCount - 1) * WAVE_GAP - 10)
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

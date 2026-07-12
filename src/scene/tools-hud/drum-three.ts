import * as THREE from 'three'
import { COMB_TINT, STRUCT_SLOT, type DrumModel } from './drum-model'

/* ─── drum-three · the GPU side of THE PIN DRUM ───────────────────────────────
   Four draw calls over the drum model (the wave-H budget law):
     1 · pin/structure FILLS — black occluder blocks (tholos doctrine),
         opaque, polygonOffset pushed back, Bayer near screen-door.
     2 · pin/structure EDGES — one InstancedBufferGeometry over the unit-box
         EdgesGeometry, facing-alpha ink, the hull hue floor.
     3 · the LINE HARNESS — axial tracks (one per slot) + the two rims,
         per-vertex slot so a read dims siblings track-by-track.
     4 · the COMB — the fixed reader over the apex (never rotates) + the
         CORE GLOW quad on the 2.4s heartbeat (one material each; the comb
         and glow are tiny non-instanced draws).
   Per-slot state rides ONE uniform array (uFocusA[28] — 27 slots + the
   neutral STRUCT slot), eased on the CPU each frame — zero per-frame
   attribute uploads (the drum law, literally this time).

   THEME DOCTRINE · the tholos register (canonical statement:
   src/scene/drum-sphere-three.ts) — this scene reuses it, per the law.
   Breath phase comes from the instance's ANGLE (iSeed.y): the 2.4s
   heartbeat rolls AROUND the drum — the beat is the turn's own direction,
   the way the ship's beat sails bow → stern. */

const N_SLOTS = STRUCT_SLOT + 1

const DRUM_COMMON = /* glsl */ `
attribute vec3 iPos;
attribute vec4 iQuat;
attribute vec3 iScale;
attribute vec2 iSeed;
attribute vec3 iTint;
uniform float uTime;
uniform float uFade;
uniform float uStrike;
uniform float uStrikeSlot;
uniform float uFocusA[${N_SLOTS}];
varying float vFocusA;
varying vec3 vTint;
varying float vPulse;

vec3 qrot(vec4 q, vec3 v) { return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }

/* the chambering hit · one harder swell when a row settles under the comb */
float strikeEnv() {
  float t = max(uTime - uStrike, 0.0);
  return smoothstep(0.0, 0.04, t) * exp(-t * 3.0);
}

/* the 2.4s heartbeat, rolled AROUND the drum (phase = the slot's angle) */
float breathEnv() {
  float w = fract(uTime / 2.4 - iSeed.y);
  return smoothstep(0.0, 0.05, w) * exp(-w * 5.0);
}

vec3 drumVertex(vec3 p) {
  int si = int(iSeed.x + 0.5);
  vFocusA = uFocusA[si];
  vTint = iTint;
  float hit = strikeEnv() * step(abs(iSeed.x - uStrikeSlot), 0.25);
  float breath = breathEnv();
  vPulse = breath + hit;
  /* the focus overflow above 1 (CPU target 1.3) is the spotlight channel;
     the read row also LIFTS toward the comb — the pin rises to be read */
  float foc = clamp((vFocusA - 1.0) * 3.4, 0.0, 1.0);
  vec3 s = iScale * (1.0 + hit * 0.16 + breath * 0.04 + foc * 0.06);
  vec3 w = qrot(iQuat, p * s) + iPos;
  /* the lift rides the block's own outward radial (+Z locally) */
  w += qrot(iQuat, vec3(0.0, 0.0, 1.0)) * foc * 0.05 * step(iSeed.x, ${STRUCT_SLOT}.0 - 0.5);
  return w;
}
`

const FILL_VERT = /* glsl */ `
${DRUM_COMMON}
varying float vNearF;
void main() {
  vec4 mv = modelViewMatrix * vec4(drumVertex(position), 1.0);
  gl_Position = projectionMatrix * mv;
  /* the fills join the lines' near-plane law (the spec machine's lesson):
     a block brushing the camera dissolves instead of printing a murk */
  vNearF = smoothstep(0.5, 0.95, length(mv.xyz));
}
`

const FILL_FRAG = /* glsl */ `
precision mediump float;
varying float vFocusA;
varying vec3 vTint;
varying float vPulse;
varying float vNearF;
void main() {
  /* ordered 4x4 Bayer near screen-door — the site's own dotmatrix language,
     never random noise (tholos: fills never go transparent) */
  vec2 b1 = mod(gl_FragCoord.xy, 2.0);
  vec2 b2 = mod(floor(gl_FragCoord.xy * 0.5), 2.0);
  float m1 = b1.x * 3.0 + b1.y * 2.0 - b1.x * b1.y * 4.0;
  float m2 = b2.x * 3.0 + b2.y * 2.0 - b2.x * b2.y * 4.0;
  if ((m1 * 4.0 + m2 + 0.5) / 16.0 > vNearF) discard;
  float spot = clamp((vFocusA - 1.0) * 3.4, 0.0, 1.0);
  vec3 deep = mix(vec3(0.043, 0.075, 0.18), vTint * 0.26, 0.4);
  vec3 col = mix(vec3(0.039, 0.047, 0.063), deep, 0.3 + 0.2 * vFocusA);
  /* the plate light wears the hue — the mass carries the colour (the hull
     law): a floor stays on always, the spotlight lifts the read row */
  vec3 plate = mix(vec3(0.05, 0.085, 0.2), vTint * 0.52, 0.6);
  col = mix(col, plate, 0.3 + 0.34 * spot);
  col += vec3(0.02, 0.034, 0.075) * vPulse;
  gl_FragColor = vec4(col, 1.0);
}
`

const LINE_VERT = /* glsl */ `
${DRUM_COMMON}
varying float vFacing;
varying float vKey;
varying float vNear;
void main() {
  vec4 mv = modelViewMatrix * vec4(drumVertex(position), 1.0);
  gl_Position = projectionMatrix * mv;
  vec3 nrm = normalize(normalMatrix * qrot(iQuat, vec3(0.0, 0.0, 1.0)));
  vFacing = clamp(dot(nrm, normalize(-mv.xyz)), 0.0, 1.0);
  /* screen-fixed key · upper-left, where the page field glows */
  vKey = clamp(dot(nrm, normalize(vec3(-0.45, 0.4, 0.8))), 0.0, 1.0);
  vNear = smoothstep(0.55, 1.2, length(mv.xyz));
}
`

const LINE_FRAG = /* glsl */ `
precision mediump float;
varying float vFocusA;
varying vec3 vTint;
varying float vFacing;
varying float vKey;
varying float vNear;
varying float vPulse;
uniform float uFade;
void main() {
  /* the tol.is line law · THE FOCUS SPLIT (the machine's grammar): ≤1 dims
     sibling rows under a read, the overflow above 1 is the spotlight */
  float dim = min(vFocusA, 1.0);
  float spot = clamp((vFocusA - 1.0) * 3.4, 0.0, 1.0);
  float a = (0.46 + 0.44 * vFacing) * (0.30 + 0.70 * dim)
    * (0.86 + 0.6 * vPulse) * uFade * vNear * (1.0 + spot * 0.45);
  if (a < 0.01) discard;
  /* the hull hue floor — every row keeps its tint; the spotlight pushes
     the read row toward its bright */
  float hue = max(0.62 * vKey + 0.2, 0.52 + 0.26 * spot);
  vec3 col = mix(vec3(0.086, 0.188, 0.478), vTint, hue);
  col += vTint * spot * 0.3;
  gl_FragColor = vec4(col, min(a, 1.0));
}
`

/* the harness · per-vertex slot, static positions inside the rotating group */
const HARNESS_VERT = /* glsl */ `
attribute float aSlot;
uniform float uFocusA[${N_SLOTS}];
varying float vFocusA;
varying float vNear;
void main() {
  int si = int(aSlot + 0.5);
  vFocusA = uFocusA[si];
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  vNear = smoothstep(0.55, 1.2, length(mv.xyz));
}
`

const HARNESS_FRAG = /* glsl */ `
precision mediump float;
varying float vFocusA;
varying float vNear;
uniform float uFade;
uniform vec3 uHarnessTint;
void main() {
  float dim = min(vFocusA, 1.0);
  float spot = clamp((vFocusA - 1.0) * 3.4, 0.0, 1.0);
  float a = 0.24 * (0.30 + 0.70 * dim) * (1.0 + spot * 1.3) * uFade * vNear;
  if (a < 0.01) discard;
  vec3 col = mix(vec3(0.086, 0.188, 0.478), uHarnessTint, 0.52 + 0.4 * spot);
  gl_FragColor = vec4(col, min(a, 1.0));
}
`

/* the comb · the fixed reader; flashes on the chambering strike */
const COMB_VERT = /* glsl */ `
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const COMB_FRAG = /* glsl */ `
precision mediump float;
uniform float uFade;
uniform vec3 uCombTint;
/* highp: shared with the vertex stage's default — the precision law */
uniform highp float uTime;
uniform float uStrike;
void main() {
  float t = max(uTime - uStrike, 0.0);
  float hit = smoothstep(0.0, 0.04, t) * exp(-t * 2.6);
  gl_FragColor = vec4(uCombTint, (0.5 + 0.5 * hit) * uFade);
}
`

/* the core glow · the 2.4s heartbeat + the chambering flash, from within */
const GLOW_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const GLOW_FRAG = /* glsl */ `
precision mediump float;
uniform highp float uTime;
uniform float uFade;
uniform float uStrike;
varying vec2 vUv;
void main() {
  float w = fract(uTime / 2.4);
  float beat = smoothstep(0.0, 0.05, w) * exp(-w * 5.0);
  float t = max(uTime - uStrike, 0.0);
  float hit = smoothstep(0.0, 0.04, t) * exp(-t * 2.6);
  float d = length(vUv - 0.5) * 2.0;
  float g = exp(-d * d * 4.2) * (0.05 + 0.16 * beat + 0.55 * hit) * uFade;
  if (g < 0.004) discard;
  gl_FragColor = vec4(vec3(0.36, 0.56, 1.0), g);
}
`

export interface DrumLayers {
  /** everything that rotates (fills · edges · harness) */
  group: THREE.Group
  /** the fixed reader + the core glow (never rotate) */
  fixed: THREE.Group
  uniforms: {
    uTime: { value: number }
    uFade: { value: number }
    /** uTime of the last chambering · the swell + comb/core flash */
    uStrike: { value: number }
    /** slot index of the last chambering (drives the swell's target) */
    uStrikeSlot: { value: number }
    /** per-slot focus · CPU-eased (read 1.3 · sibling 0.22 · idle 1);
        index STRUCT_SLOT is the neutral structure channel, pinned 1 */
    uFocusA: { value: Float32Array }
  }
  dispose: () => void
}

export function makeDrumLayers(m: DrumModel): DrumLayers {
  const iPos = new THREE.InstancedBufferAttribute(m.pos, 3)
  const iQuat = new THREE.InstancedBufferAttribute(m.quat, 4)
  const iScale = new THREE.InstancedBufferAttribute(m.scale, 3)
  const iSeed = new THREE.InstancedBufferAttribute(m.seed, 2)
  const iTint = new THREE.InstancedBufferAttribute(m.tint, 3)

  const box = new THREE.BoxGeometry(1, 1, 1)
  const edges = new THREE.EdgesGeometry(box)

  const fillGeo = new THREE.InstancedBufferGeometry()
  fillGeo.index = box.index
  fillGeo.setAttribute('position', box.attributes.position)
  fillGeo.instanceCount = m.count

  const lineGeo = new THREE.InstancedBufferGeometry()
  lineGeo.setAttribute('position', edges.attributes.position)
  lineGeo.instanceCount = m.count

  for (const g of [fillGeo, lineGeo]) {
    g.setAttribute('iPos', iPos)
    g.setAttribute('iQuat', iQuat)
    g.setAttribute('iScale', iScale)
    g.setAttribute('iSeed', iSeed)
    g.setAttribute('iTint', iTint)
  }

  const uniforms = {
    uTime: { value: 0 },
    uFade: { value: 0 },
    uStrike: { value: -1e3 },
    uStrikeSlot: { value: -1 },
    uFocusA: { value: new Float32Array(N_SLOTS).fill(1) },
  }

  const fillMat = new THREE.ShaderMaterial({
    vertexShader: FILL_VERT,
    fragmentShader: FILL_FRAG,
    uniforms,
  })
  /* the lines draw coplanar over the fills — push the fill back */
  fillMat.polygonOffset = true
  fillMat.polygonOffsetFactor = 2
  fillMat.polygonOffsetUnits = 2

  const lineMat = new THREE.ShaderMaterial({
    vertexShader: LINE_VERT,
    fragmentShader: LINE_FRAG,
    uniforms,
    transparent: true,
    depthWrite: false,
  })

  const fills = new THREE.Mesh(fillGeo, fillMat)
  const lines = new THREE.LineSegments(lineGeo, lineMat)

  const harnessGeo = new THREE.BufferGeometry()
  harnessGeo.setAttribute('position', new THREE.BufferAttribute(m.harness, 3))
  harnessGeo.setAttribute('aSlot', new THREE.BufferAttribute(m.harnessSlot, 1))
  const harnessMat = new THREE.ShaderMaterial({
    vertexShader: HARNESS_VERT,
    fragmentShader: HARNESS_FRAG,
    uniforms: {
      ...uniforms,
      uHarnessTint: { value: new THREE.Vector3(0.31, 0.525, 1.0) },
    },
    transparent: true,
    depthWrite: false,
  })
  const harness = new THREE.LineSegments(harnessGeo, harnessMat)

  const combGeo = new THREE.BufferGeometry()
  combGeo.setAttribute('position', new THREE.BufferAttribute(m.comb, 3))
  const combMat = new THREE.ShaderMaterial({
    vertexShader: COMB_VERT,
    fragmentShader: COMB_FRAG,
    uniforms: {
      ...uniforms,
      uCombTint: { value: new THREE.Vector3(...COMB_TINT) },
    },
    transparent: true,
    depthWrite: false,
  })
  const comb = new THREE.LineSegments(combGeo, combMat)

  const glowMat = new THREE.ShaderMaterial({
    vertexShader: GLOW_VERT,
    fragmentShader: GLOW_FRAG,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), glowMat)

  const group = new THREE.Group()
  for (const o of [fills, lines, harness]) {
    o.frustumCulled = false
    group.add(o)
  }
  fills.renderOrder = 1
  glow.renderOrder = 2
  harness.renderOrder = 3
  lines.renderOrder = 4
  comb.renderOrder = 5

  const fixed = new THREE.Group()
  glow.frustumCulled = false
  comb.frustumCulled = false
  fixed.add(glow)
  fixed.add(comb)

  return {
    group,
    fixed,
    uniforms,
    dispose: () => {
      box.dispose()
      edges.dispose()
      fillGeo.dispose()
      lineGeo.dispose()
      harnessGeo.dispose()
      combGeo.dispose()
      glow.geometry.dispose()
      for (const mat of [fillMat, lineMat, harnessMat, combMat, glowMat]) mat.dispose()
    },
  }
}

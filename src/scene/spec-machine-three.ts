import * as THREE from 'three'
import { SPEC_SECTIONS } from './spec-machine-data'
import type { SpecMachineModel } from './spec-machine-model'

/* ─── spec-machine-three · the GPU side of THE SPEC MACHINE (W1) ──────────────
   Four draw calls over the machine model (≤5 · the wave-H budget):
     1 · block FILLS — the black occluder layer (tholos doctrine): opaque
         near-black, polygonOffset pushed back; an ignited stratum deepens
         toward its blue-black; the fills NEVER go transparent (zero sorting).
     2 · block EDGES — one InstancedBufferGeometry over the unit-box
         EdgesGeometry: facing-alpha ink (the tol.is line law), shadow wire
         blue → the instance's LIT tint (wire blue everywhere · verb hue on
         the core tetrad + plan slabs — the film's slab precedent), stratum
         ignition washing in over ~a second, focus x-ray on the rest.
     3 · the WIRE HARNESS — one LineSegments over the model's wire table
         (slabs → verbs · belt → invoke · halo → infer · ports → fetch ·
         plan deps): per-vertex stratum seed, ignites with its stratum.
     4 · the CORE GLOW — one additive quad inside the machine that flashes
         on each stratum ignition (the drum's strike glow, repurposed).
   Per-stratum state rides TWO small uniform arrays (uLit · uFocusA), eased
   on the CPU each frame — zero per-frame attribute uploads, the drum law.

   THEME DOCTRINE · the tholos register (canonical statement:
   src/scene/drum-sphere-three.ts) — this scene reuses it, per the law. */

const N_STRATA = SPEC_SECTIONS.length

/* the shared vertex chunk · per-stratum lit/focus lookup + the strike swell */
const MACHINE_COMMON = /* glsl */ `
attribute vec3 iPos;
attribute vec4 iQuat;
attribute vec3 iScale;
attribute vec2 iSeed;
attribute vec3 iTint;
uniform float uTime;
uniform float uFade;
uniform float uStrike;
uniform float uStrikeStratum;
uniform float uLit[${N_STRATA}];
uniform float uFocusA[${N_STRATA}];
varying float vLit;
varying float vFocusA;
varying vec3 vTint;

vec3 qrot(vec4 q, vec3 v) { return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }

/* the ignition hit · one harder swell when a stratum strikes (drum grammar) */
float strikeEnv() {
  float t = max(uTime - uStrike, 0.0);
  return smoothstep(0.0, 0.04, t) * exp(-t * 3.0);
}

vec3 machineVertex(vec3 p) {
  int si = int(iSeed.x + 0.5);
  vLit = uLit[si];
  vFocusA = uFocusA[si];
  vTint = iTint;
  /* the struck stratum swells on its ignition beat, then settles lit */
  float hit = strikeEnv() * step(abs(iSeed.x - uStrikeStratum), 0.25);
  vec3 s = iScale * (1.0 + hit * 0.16 + vLit * 0.02);
  return qrot(iQuat, p * s) + iPos;
}
`

const FILL_VERT = /* glsl */ `
${MACHINE_COMMON}
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(machineVertex(position), 1.0);
}
`

/* the occluder ink · the page near-black; an ignited stratum deepens toward
   its blue-black whisper (never transparent — the theme's black IS the page) */
const FILL_FRAG = /* glsl */ `
precision mediump float;
varying float vLit;
varying float vFocusA;
varying vec3 vTint;
void main() {
  vec3 deep = mix(vec3(0.043, 0.075, 0.18), vTint * 0.26, 0.4);
  vec3 col = mix(vec3(0.039, 0.047, 0.063), deep, vLit * (0.35 + 0.35 * vFocusA));
  gl_FragColor = vec4(col, 1.0);
}
`

const LINE_VERT = /* glsl */ `
${MACHINE_COMMON}
varying float vFacing;
varying float vKey;
varying float vNear;
void main() {
  vec4 mv = modelViewMatrix * vec4(machineVertex(position), 1.0);
  gl_Position = projectionMatrix * mv;
  /* the block's outward radial in view space (the group turn rides along) */
  vec3 nrm = normalize(normalMatrix * qrot(iQuat, vec3(0.0, 0.0, 1.0)));
  vFacing = clamp(dot(nrm, normalize(-mv.xyz)), 0.0, 1.0);
  /* screen-fixed key · upper-left, where the page field glows */
  vKey = clamp(dot(nrm, normalize(vec3(-0.45, 0.4, 0.8))), 0.0, 1.0);
  /* a cell brushing the camera would print a giant stray rectangle — the
     near plane dissolves instead of cropping (close poses stay clean) */
  vNear = smoothstep(0.55, 1.2, length(mv.xyz));
}
`

const LINE_FRAG = /* glsl */ `
precision mediump float;
varying float vLit;
varying float vFocusA;
varying vec3 vTint;
varying float vFacing;
varying float vKey;
varying float vNear;
uniform float uFade;
void main() {
  /* the tol.is line law · alpha from facing; a ghost stratum whispers, an
     ignited one reads, the focused one carries the frame */
  float a = (0.14 + 0.72 * vFacing) * (0.3 + 0.7 * vLit) * (0.28 + 0.72 * vFocusA) * uFade * vNear;
  if (a < 0.01) discard;
  /* shadow wire blue → the instance's lit tint (verb hue on tetrad + slabs) */
  vec3 col = mix(vec3(0.086, 0.188, 0.478), vTint, vLit * (0.45 + 0.55 * vKey));
  gl_FragColor = vec4(col, min(a, 1.0));
}
`

/* the wire harness · per-vertex stratum seed, static positions */
const WIRE_VERT = /* glsl */ `
attribute float aSeed;
uniform float uLit[${N_STRATA}];
uniform float uFocusA[${N_STRATA}];
varying float vLit;
varying float vFocusA;
varying float vNear;
void main() {
  int si = int(aSeed + 0.5);
  vLit = uLit[si];
  vFocusA = uFocusA[si];
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNear = smoothstep(0.55, 1.2, length(mv.xyz));
  gl_Position = projectionMatrix * mv;
}
`
const WIRE_FRAG = /* glsl */ `
precision mediump float;
varying float vLit;
varying float vFocusA;
varying float vNear;
uniform float uFade;
void main() {
  float a = (0.07 + 0.5 * vLit) * (0.22 + 0.78 * vFocusA) * uFade * vNear;
  if (a < 0.008) discard;
  vec3 col = mix(vec3(0.086, 0.188, 0.478), vec3(0.31, 0.525, 1.0), vLit);
  gl_FragColor = vec4(col, min(a, 1.0));
}
`

/* the core glow · a faint blue heart that flashes on each ignition — drawn
   after the fills (depth-tested) so the near blocks occlude it: light from
   within (the drum's strike glow, verbatim grammar) */
const GLOW_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`
const GLOW_FRAG = /* glsl */ `
precision mediump float;
uniform float uTime;
uniform float uFade;
uniform float uStrike;
varying vec2 vUv;
void main() {
  float t = max(uTime - uStrike, 0.0);
  float hit = smoothstep(0.0, 0.04, t) * exp(-t * 2.6);
  float d = length(vUv - 0.5) * 2.0;
  float g = exp(-d * d * 4.2) * (0.05 + 0.6 * hit) * uFade;
  if (g < 0.004) discard;
  gl_FragColor = vec4(vec3(0.36, 0.56, 1.0), g);
}
`

export interface MachineLayers {
  fills: THREE.Mesh
  lines: THREE.LineSegments
  wires: THREE.LineSegments
  glow: THREE.Mesh
  uniforms: {
    uTime: { value: number }
    uFade: { value: number }
    /** uTime of the last ignition · the swell + core flash */
    uStrike: { value: number }
    /** stratum index of the last ignition (drives the swell's target) */
    uStrikeStratum: { value: number }
    /** per-stratum ignition level · CPU-eased toward 0/1 (~1s wash) */
    uLit: { value: Float32Array }
    /** per-stratum x-ray alpha · CPU-eased (focused 1 · others 0.3) */
    uFocusA: { value: Float32Array }
  }
  dispose: () => void
}

export function makeMachineLayers(m: SpecMachineModel): MachineLayers {
  /* static instance attributes, SHARED by both instanced geometries */
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
    uStrikeStratum: { value: -1 },
    uLit: { value: new Float32Array(N_STRATA) },
    uFocusA: { value: new Float32Array(N_STRATA).fill(1) },
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

  const wireGeo = new THREE.BufferGeometry()
  wireGeo.setAttribute('position', new THREE.BufferAttribute(m.wirePos, 3))
  wireGeo.setAttribute('aSeed', new THREE.BufferAttribute(m.wireSeed, 1))
  const wireMat = new THREE.ShaderMaterial({
    vertexShader: WIRE_VERT,
    fragmentShader: WIRE_FRAG,
    uniforms,
    transparent: true,
    depthWrite: false,
  })

  const glowGeo = new THREE.PlaneGeometry(2.3, 2.3)
  const glowMat = new THREE.ShaderMaterial({
    vertexShader: GLOW_VERT,
    fragmentShader: GLOW_FRAG,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })

  const fills = new THREE.Mesh(fillGeo, fillMat)
  fills.frustumCulled = false
  fills.renderOrder = 1
  const glow = new THREE.Mesh(glowGeo, glowMat)
  glow.frustumCulled = false
  glow.renderOrder = 2
  const wires = new THREE.LineSegments(wireGeo, wireMat)
  wires.frustumCulled = false
  wires.renderOrder = 3
  const lines = new THREE.LineSegments(lineGeo, lineMat)
  lines.frustumCulled = false
  lines.renderOrder = 4

  return {
    fills,
    lines,
    wires,
    glow,
    uniforms,
    dispose: () => {
      box.dispose()
      edges.dispose()
      fillGeo.dispose()
      lineGeo.dispose()
      wireGeo.dispose()
      glowGeo.dispose()
      fillMat.dispose()
      lineMat.dispose()
      wireMat.dispose()
      glowMat.dispose()
    },
  }
}

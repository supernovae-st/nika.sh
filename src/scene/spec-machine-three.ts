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
attribute float iId;
uniform float uTime;
uniform float uFade;
uniform float uStrike;
uniform float uStrikeStratum;
uniform float uHi;
uniform float uExplode;
uniform float uLit[${N_STRATA}];
uniform float uFocusA[${N_STRATA}];
uniform float uExplodeOff[${N_STRATA}];
varying float vLit;
varying float vFocusA;
varying vec3 vTint;
varying float vHi;
varying float vPulse;

vec3 qrot(vec4 q, vec3 v) { return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }

/* the ignition hit · one harder swell when a stratum strikes (drum grammar) */
float strikeEnv() {
  float t = max(uTime - uStrike, 0.0);
  return smoothstep(0.0, 0.04, t) * exp(-t * 3.0);
}

/* THE SHIP BREATHES · the drum's 2.4s heartbeat, transplanted: the front
   travels BOW → STERN along the spine (phase from the instance's X — the
   beat sails the reading's own direction), sharp attack, long decay */
float breathEnv() {
  float w = fract(uTime / 2.4 - (1.42 - iPos.x) * 0.085 - iSeed.y * 0.03);
  return smoothstep(0.0, 0.05, w) * exp(-w * 5.0);
}

vec3 machineVertex(vec3 p) {
  int si = int(iSeed.x + 0.5);
  vLit = uLit[si];
  vFocusA = uFocusA[si];
  vTint = iTint;
  /* the highlighted node (W2 wiring · hover on either side of the bus) */
  vHi = step(abs(iId - uHi), 0.25);
  /* the struck stratum swells on its ignition beat, then settles lit —
     the ASSEMBLED surge (uStrikeStratum = -2) swells the whole ship */
  float mAll = step(uStrikeStratum, -1.5);
  float hit = strikeEnv() * max(mAll, step(abs(iSeed.x - uStrikeStratum), 0.25));
  float breath = breathEnv();
  vPulse = breath + hit;
  vec3 s = iScale * (1.0 + hit * 0.16 + breath * 0.05 + vLit * 0.02 + vHi * 0.06);
  vec3 w = qrot(iQuat, p * s) + iPos;
  /* the axial explode · strata separate along the spine, keel + ring anchor */
  w.x += uExplodeOff[si] * uExplode;
  return w;
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
varying float vPulse;
uniform float uHero;
void main() {
  vec3 deep = mix(vec3(0.043, 0.075, 0.18), vTint * 0.26, 0.4);
  vec3 col = mix(vec3(0.039, 0.047, 0.063), deep, vLit * (0.18 + 0.2 * vFocusA));
  /* the breath lifts a lit face a whisper (the drum's fill law); at the
     OVERVIEW the faces carry the night-blue plate light — mass reads at a
     distance where hairlines cannot (the engineering-plate look) */
  col = mix(col, vec3(0.07, 0.12, 0.28), uHero * (0.4 + 0.18 * vLit));
  col += vec3(0.02, 0.034, 0.075) * vPulse * (0.3 + 0.7 * vLit) * (1.0 + uHero * 0.8);
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
varying float vHi;
varying float vPulse;
uniform float uFade;
uniform float uHero;
/* highp: the vertex stage declares uTime highp (its default) — a shared
   uniform must agree across stages or the program fails to validate */
uniform highp float uTime;
void main() {
  /* the tol.is line law · alpha from facing; a ghost stratum whispers, an
     ignited one reads, the focused one carries the frame; the breath
     brightens the front as it sails past (the drum's line law). At the
     OVERVIEW poses (uHero) the ghost hull glows up and the heartbeat
     becomes a visible sweep — the beauty idle. */
  float a = (0.34 + 0.52 * vFacing) * (0.52 + 0.48 * vLit) * (0.3 + 0.7 * vFocusA)
    * (0.86 + (0.5 + 1.15 * uHero) * vPulse) * uFade * vNear
    * (1.0 + uHero * 0.55 * (1.0 - vLit));
  /* the hovered node pulses over everything (the W2 bus highlight) */
  a = min(a * (1.0 + vHi * 1.4) + vHi * 0.22, 1.0);
  if (a < 0.01) discard;
  /* shadow wire blue → the instance's lit tint (verb hue on tetrad + slabs);
     the hero showcase lifts the ghost ink toward the lit family */
  vec3 col = mix(vec3(0.086, 0.188, 0.478), vTint, vLit * (0.45 + 0.55 * vKey));
  col = mix(col, vec3(0.31, 0.525, 1.0), uHero * 0.3 * (1.0 - vLit));
  col += vec3(0.06, 0.1, 0.2) * vPulse * vLit;
  col = mix(col, vec3(0.553, 0.706, 1.0), vHi * (0.55 + 0.35 * sin(uTime * 7.0)));
  gl_FragColor = vec4(col, a);
}
`

/* the wire harness · per-vertex stratum seed, static positions */
const WIRE_VERT = /* glsl */ `
attribute float aSeed;
attribute float aT;
attribute float aFrom;
attribute float aTo;
uniform float uExplode;
uniform float uLit[${N_STRATA}];
uniform float uFocusA[${N_STRATA}];
uniform float uExplodeOff[${N_STRATA}];
varying float vLit;
varying float vFocusA;
varying float vNear;
varying float vT;
varying float vFrom;
varying float vTo;
void main() {
  /* per-ENDPOINT stratum: the wire gradient-lights between its two strata
     and STRETCHES connected under the axial explode */
  int si = int(aSeed + 0.5);
  vLit = uLit[si];
  vFocusA = uFocusA[si];
  vT = aT;
  vFrom = aFrom;
  vTo = aTo;
  vec3 p = position;
  p.x += uExplodeOff[si] * uExplode;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vNear = smoothstep(0.55, 1.2, length(mv.xyz));
  gl_Position = projectionMatrix * mv;
}
`
const WIRE_FRAG = /* glsl */ `
precision mediump float;
varying float vLit;
varying float vFocusA;
varying float vNear;
varying float vT;
varying float vFrom;
varying float vTo;
uniform float uFade;
uniform float uHero;
uniform highp float uTime;
uniform float uStrike;
uniform float uStrikeStratum;
void main() {
  /* the full-wire ghost: at the overview the whole harness reads */
  float a = (0.06 + 0.3 * vLit) * (0.18 + 0.82 * vFocusA) * uFade * vNear
    * (1.0 + uHero * 0.6);
  vec3 col = mix(vec3(0.086, 0.188, 0.478), vec3(0.31, 0.525, 1.0), vLit);
  /* THE IGNITION PULSE · when a stratum strikes, its energy TRAVELS the
     harness (the film's ignite-pulse law): a bright front sweeps from the
     striking end toward the other, decaying over the beat. The ASSEMBLED
     surge (uStrikeStratum = -2) fires every wire at once. */
  float t = max(uTime - uStrike, 0.0);
  float all = step(uStrikeStratum, -1.5);
  float mFrom = max(all, 1.0 - step(0.25, abs(vFrom - uStrikeStratum)));
  float mTo = max(all, 1.0 - step(0.25, abs(vTo - uStrikeStratum)));
  float front = t * 1.5;
  float d = min(
    mFrom > 0.5 ? abs(vT - front) : 1e3,
    mTo > 0.5 ? abs((1.0 - vT) - front) : 1e3
  );
  float pulse = exp(-d * d * 34.0) * exp(-t * 1.9);
  a = min(a + pulse * 0.85, 1.0);
  col = mix(col, vec3(0.553, 0.706, 1.0), pulse);
  if (a < 0.008) discard;
  gl_FragColor = vec4(col, a);
}
`

/* THE STARFIELD · the space the boarding sails through. Deterministic
   points on a far shell INSIDE the turning group (they revolve with the
   hull's world — on screen the sky sweeps while the ship holds centre:
   the orbit reads as a real camera flight, not a turntable). Additive,
   deep wire blue, blooming during the boarding (uHero), whispering at
   the dock. Twinkle rides the one clock. */
const STAR_VERT = /* glsl */ `
attribute float aSeed;
uniform float uTime;
uniform float uFade;
uniform float uHero;
varying float vA;
varying float vWarm;
float hash1(float n) { return fract(sin(n * 127.1) * 43758.5453); }
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float tw = 0.72 + 0.28 * sin(uTime * 0.9 + aSeed * 37.0);
  vA = (0.14 + 0.72 * uHero) * tw * uFade;
  vWarm = hash1(aSeed + 3.0);
  gl_PointSize = (1.4 + 2.2 * hash1(aSeed)) * clamp(15.0 / max(1.0, -mv.z), 1.0, 3.6);
}
`
const STAR_FRAG = /* glsl */ `
precision mediump float;
varying float vA;
varying float vWarm;
void main() {
  if (vA < 0.01) discard;
  vec2 d = gl_PointCoord - 0.5;
  float r = 1.0 - smoothstep(0.12, 0.5, length(d));
  vec3 col = mix(vec3(0.14, 0.25, 0.55), vec3(0.31, 0.525, 1.0), vWarm * 0.6);
  gl_FragColor = vec4(col, vA * r);
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
  /* the reactor heart · the idle 2.4s beat (the drum's core) + a harder
     flash on each stratum ignition — light from within the hull */
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

/* the engine wash · the stern idles a breath of thrust on the heartbeat —
   never a flame, a readiness (depth-tested: the hull occludes it) */
const THRUST_FRAG = /* glsl */ `
precision mediump float;
uniform float uTime;
uniform float uFade;
varying vec2 vUv;
void main() {
  float w = fract(uTime / 2.4);
  float beat = smoothstep(0.0, 0.08, w) * exp(-w * 3.2);
  vec2 c = vUv - 0.5;
  float d = length(c) * 2.0;
  float g = exp(-d * d * 5.5) * (0.06 + 0.1 * beat) * uFade;
  if (g < 0.004) discard;
  gl_FragColor = vec4(vec3(0.31, 0.525, 1.0), g);
}
`

export interface MachineLayers {
  fills: THREE.Mesh
  lines: THREE.LineSegments
  wires: THREE.LineSegments
  glow: THREE.Mesh
  thrust: THREE.Mesh
  stars: THREE.Points
  uniforms: {
    uTime: { value: number }
    uFade: { value: number }
    /** uTime of the last ignition · the swell + core flash */
    uStrike: { value: number }
    /** stratum index of the last ignition (drives the swell's target) */
    uStrikeStratum: { value: number }
    /** the hovered node's instance index · -1 = none (the W2 hover bus) */
    uHi: { value: number }
    /** the axial explode 0..1 (CPU-eased toward the toggle) */
    uExplode: { value: number }
    /** the overview showcase 0..1 (1 at frame/license poses) */
    uHero: { value: number }
    /** per-stratum ignition level · CPU-eased toward 0/1 (~1s wash) */
    uLit: { value: Float32Array }
    /** per-stratum x-ray alpha · CPU-eased (focused 1 · others 0.3) */
    uFocusA: { value: Float32Array }
    /** per-stratum X shift at full explode (static · from the model) */
    uExplodeOff: { value: Float32Array }
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

  /* nodes carry their pick index; STRUCTURE instances (the ring's arc
     segments + spokes) get -1 — never highlighted, never picked */
  const ids = new Float32Array(m.count)
  for (let i = 0; i < m.count; i++) ids[i] = i < m.nodeCount ? i : -1
  const iId = new THREE.InstancedBufferAttribute(ids, 1)

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
    g.setAttribute('iId', iId)
  }

  const uniforms = {
    uTime: { value: 0 },
    uFade: { value: 0 },
    uStrike: { value: -1e3 },
    uStrikeStratum: { value: -1 },
    /** the hovered node's instance index · -1 = none (W2 bus) */
    uHi: { value: -1 },
    /** the axial explode 0..1 · strata separate along the spine */
    uExplode: { value: 0 },
    /** the overview showcase 0..1 · ghost glow-up + amplified breath sweep */
    uHero: { value: 0 },
    uLit: { value: new Float32Array(N_STRATA) },
    uFocusA: { value: new Float32Array(N_STRATA).fill(1) },
    uExplodeOff: { value: m.explode },
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
  /* per-vertex pulse rig · t along the wire + BOTH endpoint strata
     (duplicated on the pair) so the fragment knows the striking end */
  {
    const n = m.wireCount
    const aT = new Float32Array(n * 2)
    const aFrom = new Float32Array(n * 2)
    const aTo = new Float32Array(n * 2)
    for (let i = 0; i < n; i++) {
      aT[i * 2] = 0
      aT[i * 2 + 1] = 1
      aFrom[i * 2] = m.wireSeed[i * 2]
      aFrom[i * 2 + 1] = m.wireSeed[i * 2]
      aTo[i * 2] = m.wireSeed[i * 2 + 1]
      aTo[i * 2 + 1] = m.wireSeed[i * 2 + 1]
    }
    wireGeo.setAttribute('aT', new THREE.BufferAttribute(aT, 1))
    wireGeo.setAttribute('aFrom', new THREE.BufferAttribute(aFrom, 1))
    wireGeo.setAttribute('aTo', new THREE.BufferAttribute(aTo, 1))
  }
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
  /* the starfield · deterministic far shell (hash-placed, no Math.random) */
  const STAR_N = 900
  const starGeo = new THREE.BufferGeometry()
  {
    const pos = new Float32Array(STAR_N * 3)
    const seed = new Float32Array(STAR_N)
    const h = (a: number, b: number) => {
      const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453
      return x - Math.floor(x)
    }
    for (let i = 0; i < STAR_N; i++) {
      const u = h(i + 1, 7) * 2 - 1
      const th = h(i + 1, 13) * Math.PI * 2
      const r = 3.6 + 7.5 * h(i + 1, 29)
      const s2 = Math.sqrt(Math.max(0, 1 - u * u))
      pos[i * 3] = r * s2 * Math.cos(th)
      pos[i * 3 + 1] = r * u * 0.7
      pos[i * 3 + 2] = r * s2 * Math.sin(th)
      seed[i] = h(i + 1, 43) * 100
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    starGeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
  }
  const starMat = new THREE.ShaderMaterial({
    vertexShader: STAR_VERT,
    fragmentShader: STAR_FRAG,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })

  const thrustGeo = new THREE.PlaneGeometry(1.5, 1.5)
  const thrustMat = new THREE.ShaderMaterial({
    vertexShader: GLOW_VERT,
    fragmentShader: THRUST_FRAG,
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
  const thrust = new THREE.Mesh(thrustGeo, thrustMat)
  thrust.frustumCulled = false
  thrust.renderOrder = 2
  const stars = new THREE.Points(starGeo, starMat)
  stars.frustumCulled = false
  stars.renderOrder = 0
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
    thrust,
    stars,
    uniforms,
    dispose: () => {
      starGeo.dispose()
      starMat.dispose()
      box.dispose()
      edges.dispose()
      fillGeo.dispose()
      lineGeo.dispose()
      wireGeo.dispose()
      glowGeo.dispose()
      thrustGeo.dispose()
      fillMat.dispose()
      lineMat.dispose()
      wireMat.dispose()
      glowMat.dispose()
      thrustMat.dispose()
    },
  }
}

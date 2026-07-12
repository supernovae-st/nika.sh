import * as THREE from 'three'
import type { PartModel } from './part-model'

/* ─── part-three · the GPU side of a catalog part ─────────────────────────────
   Two instanced draw calls over a part model + one glow quad — the compact
   tholos recipe (canonical statement: src/scene/drum-sphere-three.ts):
     1 · FILLS — opaque near-black occluders, polygonOffset pushed back,
         ordered-Bayer near screen-door (never transparent, never noise).
     2 · EDGES — facing-alpha ink over the unit-box EdgesGeometry, the
         hull hue floor; PORTS flash on the mount strike (a part arrives
         like a stratum ignites — the ship's grammar).
     3 · the CORE GLOW — the 2.4s heartbeat + the arrival flash.
   One uniforms object shared by every material (the desync-proof law);
   per-part state is just uTime/uFade/uStrike — no arrays, a part is ONE
   focused subject. */

const PART_COMMON = /* glsl */ `
attribute vec3 iPos;
attribute vec4 iQuat;
attribute vec3 iScale;
attribute vec2 iSeed;
attribute vec3 iTint;
uniform float uTime;
uniform float uStrike;
varying vec3 vTint;
varying float vPulse;
varying float vPort;

vec3 qrot(vec4 q, vec3 v) { return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }

/* the arrival hit · the part ignites when it berths (the strike grammar) */
float strikeEnv() {
  float t = max(uTime - uStrike, 0.0);
  return smoothstep(0.0, 0.04, t) * exp(-t * 3.0);
}

/* the 2.4s heartbeat · rolls upward through the part (phase = iSeed.x) */
float breathEnv() {
  float w = fract(uTime / 2.4 - iSeed.x * 0.25);
  return smoothstep(0.0, 0.05, w) * exp(-w * 5.0);
}

vec3 partVertex(vec3 p) {
  vTint = iTint;
  vPort = iSeed.y;
  float hit = strikeEnv();
  float breath = breathEnv();
  vPulse = breath + hit * (0.6 + 0.8 * vPort);
  vec3 s = iScale * (1.0 + hit * 0.1 + breath * 0.03);
  return qrot(iQuat, p * s) + iPos;
}
`

const FILL_VERT = /* glsl */ `
${PART_COMMON}
varying float vNearF;
void main() {
  vec4 mv = modelViewMatrix * vec4(partVertex(position), 1.0);
  gl_Position = projectionMatrix * mv;
  /* the near screen-door joins the lines' dissolve (the machine's lesson) */
  vNearF = smoothstep(0.5, 0.95, length(mv.xyz));
}
`

const FILL_FRAG = /* glsl */ `
precision mediump float;
varying vec3 vTint;
varying float vPulse;
varying float vNearF;
void main() {
  vec2 b1 = mod(gl_FragCoord.xy, 2.0);
  vec2 b2 = mod(floor(gl_FragCoord.xy * 0.5), 2.0);
  float m1 = b1.x * 3.0 + b1.y * 2.0 - b1.x * b1.y * 4.0;
  float m2 = b2.x * 3.0 + b2.y * 2.0 - b2.x * b2.y * 4.0;
  if ((m1 * 4.0 + m2 + 0.5) / 16.0 > vNearF) discard;
  /* the plate light wears the hue — the mass carries the colour, a floor
     always on (the hull law at the berth) */
  vec3 col = mix(vec3(0.039, 0.047, 0.063), mix(vec3(0.05, 0.085, 0.2), vTint * 0.52, 0.6), 0.34);
  col += vec3(0.02, 0.034, 0.075) * vPulse;
  gl_FragColor = vec4(col, 1.0);
}
`

const LINE_VERT = /* glsl */ `
${PART_COMMON}
varying float vFacing;
varying float vKey;
varying float vNear;
void main() {
  vec4 mv = modelViewMatrix * vec4(partVertex(position), 1.0);
  gl_Position = projectionMatrix * mv;
  vec3 nrm = normalize(normalMatrix * qrot(iQuat, vec3(0.0, 0.0, 1.0)));
  vFacing = clamp(dot(nrm, normalize(-mv.xyz)), 0.0, 1.0);
  vKey = clamp(dot(nrm, normalize(vec3(-0.45, 0.4, 0.8))), 0.0, 1.0);
  vNear = smoothstep(0.55, 1.2, length(mv.xyz));
}
`

const LINE_FRAG = /* glsl */ `
precision mediump float;
varying vec3 vTint;
varying float vFacing;
varying float vKey;
varying float vNear;
varying float vPulse;
varying float vPort;
uniform float uFade;
void main() {
  /* the tol.is line law · ports read brighter (they are the data) */
  float a = (0.46 + 0.44 * vFacing) * (0.86 + 0.6 * vPulse) * uFade * vNear
    * (1.0 + vPort * 0.35);
  if (a < 0.01) discard;
  float hue = max(0.62 * vKey + 0.22, 0.52 * vPort);
  vec3 col = mix(vec3(0.086, 0.188, 0.478), vTint, hue);
  col += vTint * vPulse * 0.18;
  gl_FragColor = vec4(col, min(a, 1.0));
}
`

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
  float g = exp(-d * d * 4.2) * (0.05 + 0.14 * beat + 0.5 * hit) * uFade;
  if (g < 0.004) discard;
  gl_FragColor = vec4(vec3(0.36, 0.56, 1.0), g);
}
`

export interface PartLayers {
  group: THREE.Group
  uniforms: {
    uTime: { value: number }
    uFade: { value: number }
    /** uTime of the berth ignition (stamped once on mount) */
    uStrike: { value: number }
  }
  dispose: () => void
}

export function makePartLayers(m: PartModel): PartLayers {
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

  const glowMat = new THREE.ShaderMaterial({
    vertexShader: GLOW_VERT,
    fragmentShader: GLOW_FRAG,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })

  const fills = new THREE.Mesh(fillGeo, fillMat)
  const lines = new THREE.LineSegments(lineGeo, lineMat)
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(m.radius * 3, m.radius * 3), glowMat)
  glow.position.z = -0.4

  const group = new THREE.Group()
  fills.renderOrder = 1
  glow.renderOrder = 2
  lines.renderOrder = 4
  for (const o of [fills, lines, glow]) {
    o.frustumCulled = false
    group.add(o)
  }

  return {
    group,
    uniforms,
    dispose: () => {
      box.dispose()
      edges.dispose()
      fillGeo.dispose()
      lineGeo.dispose()
      glow.geometry.dispose()
      for (const mat of [fillMat, lineMat, glowMat]) mat.dispose()
    },
  }
}

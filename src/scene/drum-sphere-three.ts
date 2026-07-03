/* ─── drum-sphere-three · the GPU side of the manifesto drum sphere (wave I) ──
   Two draw calls over the tholos shell model (wave-H recipe §1):
     1 · block FILLS — one instanced box mesh in the page near-black
         (#0a0c10), polygonOffset pushed back: the self-occlusion layer that
         hides the far hemisphere's lines behind the near blocks.
     2 · block EDGES — one InstancedBufferGeometry over the unit-box
         EdgesGeometry, alpha from facing (0.12 + 0.74·facing, the tol.is
         line law), near-white ink with the blue accent on the lit side.
   THE DRUM BEHAVIOR lives in the shared vertex chunk: a 2.4s heartbeat
   (the CSS mfBeat period) whose front washes from the equator to the poles
   (per-instance phase from the ring index) — radial extrusion + a subtle
   shell swell, computed in-shader from iSeed + uTime, zero per-frame
   attribute uploads. Both layers share the SAME instance attributes and the
   SAME uniforms object, so breath can never desync fills from lines. */

import * as THREE from 'three'
import type { DrumSphereModel } from './drum-sphere-model'

/* the drum heartbeat · shared by both layers (fills must breathe WITH lines) */
const SHELL_COMMON = /* glsl */ `
attribute vec3 iPos;
attribute vec4 iQuat;
attribute vec3 iScale;
attribute vec2 iSeed;
uniform float uTime;
uniform float uAmp;
varying float vPulse;

vec3 qrot(vec4 q, vec3 v) { return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }

/* struck from within · 2.4s period (the CSS mfBeat), the front travels
   equator → poles (iSeed.x), sharp skin-hit attack then a long decay */
float drumEnv() {
  float w = fract(uTime / 2.4 - iSeed.x * 0.22 - iSeed.y * 0.03);
  return smoothstep(0.0, 0.05, w) * exp(-w * 5.0) * uAmp;
}

vec3 shellVertex(vec3 p) {
  float env = drumEnv();
  vPulse = env;
  vec3 s = iScale;
  s.z *= 1.0 + env * 1.4;                              /* extrusion breath */
  return qrot(iQuat, p * s) + iPos * (1.0 + env * 0.045); /* radial swell */
}
`

const FILL_VERT = /* glsl */ `
${SHELL_COMMON}
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(shellVertex(position), 1.0);
}
`

/* the occluder ink · the page near-black, a whisper of lift on the pulse */
const FILL_FRAG = /* glsl */ `
precision mediump float;
varying float vPulse;
void main() {
  vec3 col = mix(vec3(0.039, 0.047, 0.063), vec3(0.075, 0.10, 0.16), vPulse * 0.5);
  gl_FragColor = vec4(col, 1.0);
}
`

const LINE_VERT = /* glsl */ `
${SHELL_COMMON}
varying float vFacing;
varying float vLit;
void main() {
  vec4 mv = modelViewMatrix * vec4(shellVertex(position), 1.0);
  gl_Position = projectionMatrix * mv;
  /* the block's outward radial, in view space (the group spin rides along) */
  vec3 nrm = normalize(normalMatrix * qrot(iQuat, vec3(0.0, 0.0, 1.0)));
  vFacing = clamp(dot(nrm, normalize(-mv.xyz)), 0.0, 1.0);
  /* screen-fixed key · upper-left, where the page field glows */
  vLit = clamp(dot(nrm, normalize(vec3(-0.45, 0.4, 0.8))), 0.0, 1.0);
}
`

const LINE_FRAG = /* glsl */ `
precision mediump float;
varying float vPulse;
varying float vFacing;
varying float vLit;
uniform float uFade;
void main() {
  /* the tol.is line law · alpha from facing, the beat brightens the front */
  float a = (0.12 + 0.74 * vFacing) * (0.72 + 0.5 * vPulse) * uFade;
  if (a < 0.01) discard;
  vec3 col = mix(vec3(0.87, 0.91, 0.98), vec3(0.553, 0.706, 1.0), vLit * 0.6);
  col = mix(col, vec3(0.31, 0.525, 1.0), vPulse * 0.5);
  gl_FragColor = vec4(col, min(a, 1.0));
}
`

export interface ShellLayers {
  fills: THREE.Mesh
  lines: THREE.LineSegments
  uniforms: {
    uTime: { value: number }
    uAmp: { value: number }
    uFade: { value: number }
  }
  dispose: () => void
}

export function makeShellLayers(m: DrumSphereModel): ShellLayers {
  /* static instance attributes, SHARED by both geometries */
  const iPos = new THREE.InstancedBufferAttribute(m.pos, 3)
  const iQuat = new THREE.InstancedBufferAttribute(m.quat, 4)
  const iScale = new THREE.InstancedBufferAttribute(m.scale, 3)
  const iSeed = new THREE.InstancedBufferAttribute(m.seed, 2)

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
  }

  const uniforms = {
    uTime: { value: 0 },
    uAmp: { value: 1 },
    uFade: { value: 0 },
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
  fills.frustumCulled = false
  fills.renderOrder = 1
  const lines = new THREE.LineSegments(lineGeo, lineMat)
  lines.frustumCulled = false
  lines.renderOrder = 2

  return {
    fills,
    lines,
    uniforms,
    dispose: () => {
      box.dispose()
      edges.dispose()
      fillGeo.dispose()
      lineGeo.dispose()
      fillMat.dispose()
      lineMat.dispose()
    },
  }
}

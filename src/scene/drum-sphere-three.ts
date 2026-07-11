/* ─── drum-sphere-three · the GPU side of the manifesto drum sphere (wave I) ──

   ★ THEME DOCTRINE · THE THOLOS REGISTER ★
   This scene and src/scene/spec-machine-three.ts (the /spec ship) speak
   ONE shared geometric language, and future nika.sh 3D scenes reuse it
   rather than inventing a new one (the home's mid-scroll plan scene retired
   2026-07-11 — hero-contained scenes are the register's home):
     · WIREFRAME BLOCKS       instanced boxes, the tol.is block signature
     · FACING-ALPHA LINES     edge ink whose alpha follows how squarely a
                              block faces the camera (the tol.is line law)
     · BLACK OCCLUDER FILLS   opaque near-black box fills, polygonOffset
                              pushed back: the theme's black, and the
                              self-occlusion that keeps the read legible
     · HUD MONO WHISPERS      dot-leader mono labels pinned at scene edges
   The ink is the site's blue-and-black: deep wire blue in shadow, the
   #4f86ff accent family on the lit side, black fills between.

   Two instanced draw calls over the tholos shell model (wave-H recipe §1):
     1 · block FILLS — the black occluder layer (see register above).
     2 · block EDGES — one InstancedBufferGeometry over the unit-box
         EdgesGeometry · alpha 0.12 + 0.74·facing · shadow side deep wire
         blue #16307a → lit side #4f86ff → struck bands #8db4ff.
   THE DRUM BEHAVIOR lives in the shared vertex chunk: a 2.4s heartbeat
   (the CSS mfBeat period) whose front washes from the equator to the poles
   (per-instance phase from the ring index) — radial extrusion + a subtle
   shell swell, computed in-shader from iSeed + uTime, zero per-frame
   attribute uploads. Both layers share the SAME instance attributes and the
   SAME uniforms object, so breath can never desync fills from lines.
   THE READING drives two more uniforms (wave I·2, TheDrumSphere.tsx):
     · uStruck — the struck-front threshold (struckPhaseThreshold in the
       model): each manifesto section crossed strikes the drum once and one
       latitude band ignites to the bright blue AND STAYS LIT — liberation
       spreading through the shell as you read.
     · uStrike — the uTime of the last strike: a harder swell + a core
       flash on the moment itself, over the idle heartbeat. */

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
uniform float uStruck;
uniform float uStrike;
varying float vPulse;
varying float vStruck;

vec3 qrot(vec4 q, vec3 v) { return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }

/* struck from within · 2.4s period (the CSS mfBeat), the front travels
   equator → poles (iSeed.x), sharp skin-hit attack then a long decay */
float drumEnv() {
  float w = fract(uTime / 2.4 - iSeed.x * 0.22 - iSeed.y * 0.03);
  return smoothstep(0.0, 0.05, w) * exp(-w * 5.0) * uAmp;
}

/* the section strike · ONE harder hit when the reading crosses a boundary,
   riding over the idle heartbeat (uStrike = uTime of the last strike) */
float strikeEnv() {
  float t = max(uTime - uStrike, 0.0);
  return smoothstep(0.0, 0.04, t) * exp(-t * 3.0);
}

vec3 shellVertex(vec3 p) {
  float env = drumEnv();
  float hit = strikeEnv();
  /* the struck front · bands with ripple phase below uStruck are lit and
     stay lit (0.14 = STRUCK_SOFT, the model's soft leading edge) */
  vStruck = 1.0 - smoothstep(uStruck - 0.14, uStruck, iSeed.x);
  vPulse = env + hit * (0.5 + 0.5 * vStruck);
  vec3 s = iScale;
  s.z *= 1.0 + env * 1.4 + hit * 0.9;                  /* extrusion breath */
  return qrot(iQuat, p * s) + iPos * (1.0 + (env + hit * 0.8) * 0.045);
}
`

const FILL_VERT = /* glsl */ `
${SHELL_COMMON}
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(shellVertex(position), 1.0);
}
`

/* the occluder ink · the page near-black stays the theme's black — struck
   bands deepen toward a blue-black whisper, the pulse lifts it a touch */
const FILL_FRAG = /* glsl */ `
precision mediump float;
varying float vPulse;
varying float vStruck;
void main() {
  vec3 col = mix(vec3(0.039, 0.047, 0.063), vec3(0.043, 0.075, 0.18), vStruck * 0.55);
  col = mix(col, vec3(0.075, 0.12, 0.24), vPulse * 0.5);
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
varying float vStruck;
uniform float uFade;
void main() {
  /* the tol.is line law · alpha from facing, the beat brightens the front,
     a struck band reads brighter through both hemispheres */
  float a = (0.12 + 0.74 * vFacing) * (0.82 + 0.55 * vPulse) * (1.0 + 0.4 * vStruck) * uFade;
  if (a < 0.01) discard;
  /* the blue-and-black ink · shadow side deep wire blue #16307a, lit side
     the accent #4f86ff, struck bands the brightest blue #8db4ff */
  vec3 col = mix(vec3(0.086, 0.188, 0.478), vec3(0.31, 0.525, 1.0), vLit);
  col = mix(col, vec3(0.553, 0.706, 1.0), vStruck * (0.6 + 0.3 * vLit));
  col += vec3(0.09, 0.15, 0.28) * vPulse;
  gl_FragColor = vec4(col, min(a, 1.0));
}
`

/* the strike glow · a faint blue core INSIDE the shell that flashes on the
   beat — drawn after the fills (depth-tested), so the near hemisphere's
   blocks occlude it and it washes over the far ones: light from within */
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
  float w = fract(uTime / 2.4);
  float beat = smoothstep(0.0, 0.05, w) * exp(-w * 5.0);
  /* the section strike flashes the core harder than the idle beat */
  float t = max(uTime - uStrike, 0.0);
  float hit = smoothstep(0.0, 0.04, t) * exp(-t * 3.0);
  float d = length(vUv - 0.5) * 2.0;
  float g = exp(-d * d * 4.5) * (0.10 + 0.30 * beat + 0.55 * hit) * uFade;
  if (g < 0.004) discard;
  gl_FragColor = vec4(vec3(0.36, 0.56, 1.0), g);
}
`

export interface ShellLayers {
  fills: THREE.Mesh
  lines: THREE.LineSegments
  glow: THREE.Mesh
  uniforms: {
    uTime: { value: number }
    uAmp: { value: number }
    uFade: { value: number }
    /** struck-front threshold · struckPhaseThreshold(struck, total) */
    uStruck: { value: number }
    /** uTime of the last section strike · drives the harder hit + core flash */
    uStrike: { value: number }
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
    uStruck: { value: -0.25 },
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

  const glowGeo = new THREE.PlaneGeometry(1.7, 1.7)
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
  const lines = new THREE.LineSegments(lineGeo, lineMat)
  lines.frustumCulled = false
  lines.renderOrder = 3

  return {
    fills,
    lines,
    glow,
    uniforms,
    dispose: () => {
      box.dispose()
      edges.dispose()
      fillGeo.dispose()
      lineGeo.dispose()
      glowGeo.dispose()
      fillMat.dispose()
      lineMat.dispose()
      glowMat.dispose()
    },
  }
}

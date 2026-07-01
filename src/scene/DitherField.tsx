import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/* ─── The dither field · the full-bleed WebGL background (BRAND-11) ────────────
   ONE fullscreen quad + an ordered-dither fragment shader — the v5 signature
   texture. A slow-moving blue-on-black luminance field (the square-tunnel depth
   motif + one off-axis radial pointe) is QUANTIZED through a Bayer 8×8 matrix
   into visible dither dots: premium print-grain, never noise static.

   THE FIELD (composed in the shader, then dithered):
   • the square tunnel — concentric SQUARE rings (Chebyshev distance metric ·
     the "carré" echo of the old wireframe tunnel) receding toward a vanishing
     point, log-spaced so they compress with perspective, twisting slightly
     with depth. Scroll drives the dive (the rings flow outward), exactly on
     the old DepthTunnel scroll model.
   • the pointe — ONE localized radial blue bloom, off-axis upper-right (the
     v3 cinematic accent). Never a full wash.
   • an edge vignette so the field recedes under the content.

   Colors are the v5 tokens (tokens.css) baked as shader constants — keep in
   sync by hand: #050507 (bg-deep) · #08090b (bg) · #2f6bff (accent-strong) ·
   #8db4ff (accent-bright).

   MOUNT (unchanged from DepthTunnel): fixed + full-screen behind the page
   (z-0 · .depth-fixed), lazy client-only, aria-hidden. Window scroll over the
   first ~3.4 screens drives the dive and fades the canvas out so the opaque
   sections take over (the loop pauses off-screen for perf). Reduced-motion →
   a STATIC dithered frame (time frozen, no dive, no parallax). Dev params kept:
   `?notunnel` disables the canvas (headless capture), `?dag=<0..1>` freezes
   the scroll beat. */

/** smoothstep(a,b,x) ∈ [0,1] — eased ramp (used for the scroll fade). */
function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

const VERT = /* glsl */ `
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

const FRAG = /* glsl */ `
precision highp float;

uniform vec2 uRes;      // drawing buffer size (device px)
uniform float uTime;    // seconds · frozen at 0 under reduced motion
uniform float uScroll;  // 0..1 · the page dive
uniform vec2 uMouse;    // -1..1 pointer parallax (0 under reduced motion)

/* ── Bayer ordered-dither thresholds (2→4→8 recursion · values in [0,1)) ── */
float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
#define bayer4(a) (bayer2(0.5 * (a)) * 0.25 + bayer2(a))
#define bayer8(a) (bayer4(0.5 * (a)) * 0.25 + bayer2(a))

/* the v5 palette (tokens.css) · black ladder → blue accent family */
const vec3 BG_DEEP = vec3(0.020, 0.020, 0.027); // #050507
const vec3 BG_BODY = vec3(0.031, 0.035, 0.043); // #08090b
const vec3 BLUE_DIM = vec3(0.086, 0.188, 0.478); // deep wire blue
const vec3 BLUE_CORE = vec3(0.184, 0.420, 1.0);  // #2f6bff accent-strong
const vec3 BLUE_BRIGHT = vec3(0.553, 0.706, 1.0); // #8db4ff accent-bright

void main() {
  /* DITHER CELLS · quantize the fragment into ~2-device-px cells; the luma is
     sampled at the CELL, the Bayer threshold indexes the cell — so the dots
     read as a printed lattice, stable under DPR. */
  float cellPx = 2.0;
  vec2 cell = floor(gl_FragCoord.xy / cellPx);
  vec2 uv = (cell * cellPx + cellPx * 0.5) / uRes; // cell-centre uv (0..1)

  /* centred, aspect-true coordinates · the tunnel sits a touch below centre
     and leans with the pointer (subtle parallax). */
  vec2 p = uv - vec2(0.5, 0.46);
  p.x *= uRes.x / uRes.y;
  p -= uMouse * 0.03;

  /* ── the square tunnel · Chebyshev rings receding to the vanishing point ──
     log-spaced square rings; scroll + time drive the dive (rings flow toward
     the camera). A slight twist with depth echoes the old tunnel's spiral. */
  float dive = uTime * 0.05 + uScroll * 2.6;
  float twist = -0.35 * uScroll - 0.06 * uTime * 0.05;
  float ca = cos(twist), sa = sin(twist);
  vec2 q = mat2(ca, -sa, sa, ca) * p;
  float d = max(abs(q.x), abs(q.y));          // square (carré) distance
  float depth = log(max(d, 1e-4)) * 2.2 - dive; // ring phase · log = perspective
  float ring = fract(depth);
  // a thin bright edge per ring, easing off toward the ring body
  float line = smoothstep(0.0, 0.08, ring) * (1.0 - smoothstep(0.08, 0.55, ring));
  // fog: rings dissolve toward the vanishing point + fade past the mid-field
  float fog = smoothstep(0.015, 0.16, d) * (1.0 - smoothstep(0.35, 1.05, d));
  float tunnel = line * fog * 0.5;

  /* the vanishing-point glow · the tunnel mouth breathes faintly */
  float mouth = exp(-d * d * 90.0) * (0.30 + 0.06 * sin(uTime * 0.5));

  /* ── the pointe · ONE off-axis blue bloom (upper-right band) ── */
  vec2 b = uv - vec2(0.62, 0.38);
  b.x *= uRes.x / uRes.y;
  float pointe = exp(-dot(b, b) * 7.5) * 0.32;

  /* compose the luminance field + edge vignette */
  float luma = tunnel + mouth + pointe;
  vec2 e = uv - 0.5;
  luma *= 1.0 - smoothstep(0.35, 0.75, dot(e, e) * 2.0);

  /* ── ORDERED DITHER · quantize the field through Bayer 8×8 ──
     4 tone levels; the Bayer threshold decides each cell's step → the visible
     dot lattice. The result maps onto the black→blue ramp. */
  float threshold = bayer8(cell);
  float levels = 4.0;
  float qz = floor(luma * levels + threshold) / levels;

  vec3 col = BG_DEEP;
  col = mix(col, BG_BODY, smoothstep(0.0, 0.10, uv.y));      // barely-there lift
  col = mix(col, BLUE_DIM, clamp(qz * 1.4, 0.0, 1.0));
  col = mix(col, BLUE_CORE, clamp((qz - 0.4) * 1.8, 0.0, 1.0));
  col = mix(col, BLUE_BRIGHT, clamp((qz - 0.8) * 2.2, 0.0, 1.0));

  gl_FragColor = vec4(col, 1.0);
}
`

function FieldQuad({
  scroll,
  reduced,
}: {
  scroll: React.MutableRefObject<number>
  reduced: boolean
}) {
  const gl = useThree((s) => s.gl)
  const uniforms = useMemo(
    () => ({
      uRes: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
    }),
    [],
  )
  const mouse = useRef({ x: 0, y: 0 })
  const bufSize = useMemo(() => new THREE.Vector2(), [])

  /* seed the resolution before the first paint (the 'demand' static frame under
     reduced motion renders once — it must not draw at the 1×1 default). */
  useEffect(() => {
    uniforms.uRes.value.copy(gl.getDrawingBufferSize(bufSize))
  }, [gl, uniforms, bufSize])

  useFrame((state) => {
    uniforms.uRes.value.copy(gl.getDrawingBufferSize(bufSize))
    uniforms.uTime.value = reduced ? 0 : state.clock.elapsedTime
    // reduced motion: no dive — the beat stays a static frame
    uniforms.uScroll.value = reduced ? 0 : scroll.current
    const k = 0.06
    const mx = reduced ? 0 : mouse.current.x
    const my = reduced ? 0 : mouse.current.y
    uniforms.uMouse.value.x += (mx - uniforms.uMouse.value.x) * k
    uniforms.uMouse.value.y += (-my - uniforms.uMouse.value.y) * k
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onMove = (e: PointerEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  )
}

export default function DitherField() {
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // dev/capture · ?notunnel disables the WebGL background so the DOM sections
  // (e.g. the Living File DAG) can be screenshotted headless — a continuous rAF
  // otherwise blocks virtual-time from ever settling.
  const disabled = useMemo(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('notunnel'),
    [],
  )
  const wrap = useRef<HTMLDivElement>(null)
  const scroll = useRef(0)
  const [active, setActive] = useState(true)

  /* the scene is FIXED + full-screen and CHANGES WITH SCROLL: window scroll over
     the first ~3.4 screens drives `scroll` 0→1 (the dive), and the canvas fades
     out as it ends so the opaque sections below take over (the loop pauses
     off-screen for perf). Identical scroll model to the old DepthTunnel. */
  useEffect(() => {
    if (typeof window === 'undefined') return
    // dev/test · ?dag=<0..1> freezes the scroll so a headless capture can see the
    // in-scene beat at a given point (the scroll itself isn't visible headless).
    const dag = new URLSearchParams(window.location.search).get('dag')
    if (dag !== null) {
      scroll.current = Math.min(1, Math.max(0, parseFloat(dag) || 0))
      return
    }
    let on = true
    const onScroll = () => {
      // persist across the whole experience region (hero → DAG → run → verdict),
      // then fade just before the B&W sections take over
      const p = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 3.4)))
      scroll.current = p
      if (wrap.current) wrap.current.style.opacity = `${1 - smoothstep(0.82, 1, p)}`
      const a = p < 1
      if (a !== on) {
        on = a
        setActive(a)
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  if (disabled) return null

  return (
    <div ref={wrap} className="depth-fixed" aria-hidden>
      <Canvas
        aria-hidden
        gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
        /* reduced motion → 'demand': the static dithered frame renders once
           (and on resize) without a continuous loop; past the fade → 'never' */
        frameloop={!active ? 'never' : reduced ? 'demand' : 'always'}
      >
        <FieldQuad scroll={scroll} reduced={reduced} />
      </Canvas>
    </div>
  )
}

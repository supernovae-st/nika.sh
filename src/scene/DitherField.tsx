import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/* ─── The dither field · the full-bleed WebGL background (BRAND-11) ────────────
   ONE fullscreen quad + an ordered-dither fragment shader — the v5 signature
   texture. WAVE F (operator override F1): the square-tunnel rings are GONE
   from Home — the depth motif belongs to frames now, not the page. The field
   is the Maxime register: ONE LARGE saturated blue radial ANCHORED LEFT,
   diffusing into the engineered black toward the right and bottom, with the
   faint survey grid living ONLY inside the glow. The Bayer 8×8 quantizer
   turns the falloff into the dithered dissolve — the signature move.

   THE FIELD (composed in the shader, then dithered):
   • the glow — a deep saturated radial (#0F53B7 family) anchored at the
     upper-LEFT (« le bleu sur la gauche qui diffuse »), its hot heart mostly
     off-canvas above the nav so the on-page core stays deep enough for the
     white H1 (AAA-large). A wider low-alpha lobe diffuses it toward the
     top-centre; a vertical taper dissolves it before the body-text zone.
   • the grid — faint survey hairlines that ride the glow term (they exist
     only inside the blue, never on the black).
   • the wake — the pointer drags a faint lit trail through the field (the
     quantizer dithers it like everything else). Zero under reduced motion.
   • the loupe — the field RESOLVES under the pointer: inside a ~180px
     falloff the Bayer threshold bias shifts up (max +12%) so cells fire one
     tone level earlier — the drawing reads finer/brighter under the glass,
     never a spotlight. Desktop fine-pointer only; amp eases in/out on the
     EXISTING frame loop (no new loops); zero under reduced motion.

   Colors are the v5 tokens (tokens.css) baked as shader constants — keep in
   sync by hand: #050507 (bg-deep) · #08090b (bg) · #16307a (dim) · #0F53B7
   (deep core) · #2f6bff (accent-strong) · #8db4ff (accent-bright).

   MOUNT: fixed + full-screen behind the page (z-0 · .depth-fixed), lazy
   client-only, aria-hidden. The glow belongs to the HEADER: window scroll
   over the first ~1.9 screens eases it out and fades the canvas so the
   opaque sections take over (the loop pauses off-screen for perf).
   Reduced-motion → a STATIC dithered frame (glow at full, no wake). Dev
   params kept: `?notunnel` disables the canvas (headless capture),
   `?dag=<0..1>` freezes the scroll beat. */

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
uniform vec4 uLens;     // the loupe · xy pointer (-1..1, y down) · z radius (device px) · w amp

/* ── Bayer ordered-dither thresholds (2→4→8 recursion · values in [0,1)) ── */
float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
#define bayer4(a) (bayer2(0.5 * (a)) * 0.25 + bayer2(a))
#define bayer8(a) (bayer4(0.5 * (a)) * 0.25 + bayer2(a))

/* the v5 palette (tokens.css) · black ladder → blue accent family */
const vec3 BG_DEEP = vec3(0.020, 0.020, 0.027); // #050507
const vec3 BG_BODY = vec3(0.031, 0.035, 0.043); // #08090b
const vec3 BLUE_DIM = vec3(0.086, 0.188, 0.478); // #16307a deep wire blue
const vec3 BLUE_DEEP = vec3(0.059, 0.325, 0.718); // #0F53B7 · the Maxime core
const vec3 BLUE_CORE = vec3(0.184, 0.420, 1.0);  // #2f6bff accent-strong
const vec3 BLUE_BRIGHT = vec3(0.553, 0.706, 1.0); // #8db4ff accent-bright

void main() {
  /* DITHER CELLS · quantize the fragment into ~2-device-px cells; the luma is
     sampled at the CELL, the Bayer threshold indexes the cell — so the dots
     read as a printed lattice, stable under DPR. */
  float cellPx = 2.0;
  vec2 cell = floor(gl_FragCoord.xy / cellPx);
  vec2 uv = (cell * cellPx + cellPx * 0.5) / uRes; // cell-centre uv (0..1)

  /* design space · y grows DOWNWARD from the top (gl_FragCoord is bottom-up) */
  vec2 st = vec2(uv.x, 1.0 - uv.y);
  float aspect = uRes.x / uRes.y;
  float portrait = step(aspect, 1.0);

  /* the header glow eases out as the page dives (scroll hands the field back
     to the sections) — the pointer lean stays a whisper. */
  float glowAmp = 1.0 - smoothstep(0.35, 0.95, uScroll);

  /* ── F1 · THE GLOW · one deep saturated radial anchored LEFT ──────────────
     Hot heart off-canvas above the nav; the visible core is the #0F53B7
     family (white H1 = AAA-large on it). On phones the field re-centres
     ABOVE the stacked type, tighter. */
  vec2 ctr = mix(vec2(0.16, -0.10), vec2(0.50, -0.14), portrait);
  vec2 g = st - ctr;
  g -= uMouse * 0.02;
  g.x *= mix(aspect * 0.72, aspect * 1.05, portrait); // spread across the left 2/3
  float core = exp(-dot(g, g) * mix(2.6, 3.4, portrait));

  /* the diffusion lobe · wider, dimmer, pushed toward the top-centre — the
     smooth hand-off from the core into the black */
  vec2 s = st - mix(vec2(0.44, 0.02), vec2(0.52, 0.02), portrait);
  s.x *= mix(aspect * 0.9, aspect * 1.1, portrait);
  float spread = exp(-dot(s, s) * 1.5) * 0.30;

  float glow = (core * mix(0.94, 0.90, portrait) + spread) * glowAmp;

  /* the vertical taper · the field belongs to the HEADER — it dissolves
     before the body-text zone so prose always sits on the black. */
  glow *= 1.0 - smoothstep(0.34, 0.72, st.y) * 0.82;

  /* ── the survey grid · FAINT · exists ONLY inside the glow core (glow²
     masking keeps it out of the dissolve zone — Maxime runs his at 2%) ── */
  vec2 gridUv = gl_FragCoord.xy / (uRes.y * 0.072); // ~7% viewport-height pitch
  vec2 gl2 = abs(fract(gridUv) - 0.5);
  float gridLine = 1.0 - smoothstep(0.0, 0.022, min(gl2.x, gl2.y));
  glow += gridLine * glow * glow * 0.055;

  /* ── the pointer wake · a faint lit trail dragged through the field ── */
  vec2 pu = st - (vec2(uMouse.x, -uMouse.y) * 0.5 + 0.5);
  pu.x *= aspect;
  float wake = exp(-dot(pu, pu) * 38.0) * 0.09;

  /* a slow breath so the static-looking field is never dead (±2%) */
  float breath = 1.0 + 0.02 * sin(uTime * 0.35);

  /* CONTRAST CLAMP · the ramp may never overdrive past the CORE family —
     white nav/H1 ink needs ≥4.5:1 on the brightest on-canvas band. */
  float luma = min(glow * breath + wake, 1.0);

  /* ── ORDERED DITHER · quantize the field through Bayer 8×8 ──
     5 tone levels; the Bayer threshold decides each cell's step → the visible
     dot lattice at every band edge. The result maps onto the black→blue ramp;
     the ramp tops out in the DEEP family — the bright notes stay tiny. */
  float threshold = bayer8(cell);

  /* ── the LOUPE · the field resolves under the reader's pointer ──
     Inside the falloff the threshold bias shifts UP (max +12%) so cells step
     one tone level earlier — held glass over the drawing, not a spotlight. */
  vec2 lpx = (st - (uLens.xy * 0.5 + 0.5)) * uRes;
  threshold += (1.0 - smoothstep(0.0, uLens.z, length(lpx))) * uLens.w * 0.12;
  float levels = 5.0;
  float qz = min(floor(luma * levels + threshold) / levels, 1.0);

  vec3 col = BG_DEEP;
  col = mix(col, BG_BODY, smoothstep(0.0, 0.10, uv.y));      // barely-there lift
  col = mix(col, BLUE_DIM, clamp(qz * 1.35, 0.0, 1.0));
  col = mix(col, BLUE_DEEP, clamp((qz - 0.30) * 1.7, 0.0, 1.0));
  col = mix(col, BLUE_CORE, clamp((qz - 0.78) * 1.8, 0.0, 1.0));
  col = mix(col, BLUE_BRIGHT, clamp((qz - 0.96) * 2.2, 0.0, 1.0));

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
  const invalidate = useThree((s) => s.invalidate)
  const uniforms = useMemo(
    () => ({
      uRes: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      /* z (radius px) seeds >0 — smoothstep(0,0,x) is undefined GLSL and a
         frame could theoretically draw before the first useFrame writes it */
      uLens: { value: new THREE.Vector4(0, 0, 180, 0) },
    }),
    [],
  )
  const mouse = useRef({ x: 0, y: 0 })
  /* the loupe's target amp · 1 only for a fine hover pointer at desktop width
     (set by the pointer listener below) · eased on the existing frame loop */
  const lensAmp = useRef(0)
  const bufSize = useMemo(() => new THREE.Vector2(), [])

  /* seed the resolution before the first paint (the 'demand' static frame under
     reduced motion renders once — it must not draw at the 1×1 default), then
     request a frame so demand mode repaints AFTER the seed (without the
     invalidate, the one-and-only demand frame can land pre-seed at 1×1). */
  useEffect(() => {
    uniforms.uRes.value.copy(gl.getDrawingBufferSize(bufSize))
    invalidate()
  }, [gl, uniforms, bufSize, invalidate])

  /* THE PAINT WATCHDOG · in demand mode the field gets ONE frame — under a
     starved GPU init (heavy load · slow swiftshader) that frame can be
     dropped and nothing ever re-requests it: the canvas stays BLANK for the
     whole session (a real reduced-motion user bug — and the goldens' exact
     13.66% hero bistable, isolated by the no-canvas probe). useFrame marks
     the first PROCESSED frame on the canvas (`data-painted` — the harness
     gates on it); until it lands, staggered invalidates re-request the
     demand frame. Idempotent: the rest frame is pure (uTime 0), extra
     paints change nothing. */
  const paintedRef = useRef(false)
  useEffect(() => {
    gl.domElement.dataset.paints = '1'
    if (paintedRef.current) return
    const timers = [500, 1500, 3000, 6000].map((ms) =>
      setTimeout(() => {
        if (!paintedRef.current) invalidate()
      }, ms),
    )
    return () => timers.forEach(clearTimeout)
  }, [gl, invalidate])

  /* GPU context loss: preventDefault on `lost` so the browser is ALLOWED to
     restore (three re-inits its GL state on `restored`); the invalidate then
     repaints — otherwise a demand/paused canvas stays blank after a GPU reset. */
  useEffect(() => {
    const canvas = gl.domElement
    const onLost = (e: Event) => e.preventDefault()
    const onRestored = () => invalidate()
    canvas.addEventListener('webglcontextlost', onLost)
    canvas.addEventListener('webglcontextrestored', onRestored)
    return () => {
      canvas.removeEventListener('webglcontextlost', onLost)
      canvas.removeEventListener('webglcontextrestored', onRestored)
    }
  }, [gl, invalidate])

  /* reduced-motion flips at runtime (OS toggle) swap the frameloop — request
     one frame so the new mode paints its state immediately. */
  useEffect(() => {
    invalidate()
  }, [reduced, invalidate])

  useFrame((state) => {
    if (!paintedRef.current) {
      paintedRef.current = true
      gl.domElement.dataset.painted = '1'
    }
    uniforms.uRes.value.copy(gl.getDrawingBufferSize(bufSize))
    uniforms.uTime.value = reduced ? 0 : state.clock.elapsedTime
    // reduced motion: no dive — the beat stays a static frame
    uniforms.uScroll.value = reduced ? 0 : scroll.current
    const k = 0.06
    const mx = reduced ? 0 : mouse.current.x
    const my = reduced ? 0 : mouse.current.y
    uniforms.uMouse.value.x += (mx - uniforms.uMouse.value.x) * k
    uniforms.uMouse.value.y += (-my - uniforms.uMouse.value.y) * k
    /* the loupe · faster follow than the parallax (a lens tracks the hand),
       amp eases so the emulsion develops rather than snapping. All on THIS
       loop — the lens adds zero listeners and zero frames of its own. */
    const lens = uniforms.uLens.value
    lens.x += (mouse.current.x - lens.x) * 0.25
    lens.y += (mouse.current.y - lens.y) * 0.25
    lens.z = 180 * (uniforms.uRes.value.x / Math.max(1, window.innerWidth))
    /* reduced motion SNAPS to zero (never eases): the demand loop renders ONE
       frame on the OS toggle — an eased w would bake a ~92%-amp lens circle
       into that static frame. Exact zero, always. */
    if (reduced) lens.w = 0
    else lens.w += (lensAmp.current - lens.w) * 0.08
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    /* the loupe's gate · a real hover cursor at desktop width (matches the
       CSS cursor-effect gates) — coarse pointers and phones never see it */
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    const onMove = (e: PointerEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1
      lensAmp.current = fine.matches && window.innerWidth >= 1024 ? 1 : 0
    }
    /* pointer leaves the page → the loupe sets down (amp eases to 0) */
    const onOut = (e: PointerEvent) => {
      if (e.relatedTarget === null) lensAmp.current = 0
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerout', onOut, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerout', onOut)
    }
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
  /* reduced-motion as STATE with a change listener — the old one-shot read
     meant toggling the OS setting mid-visit kept the previous behaviour until
     a full reload. Client-only component (lazy) → window exists at init. */
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  // dev/capture · ?notunnel disables the WebGL background so the DOM sections
  // (e.g. the Living File DAG) can be screenshotted headless — a continuous rAF
  // otherwise blocks virtual-time from ever settling.
  const disabled = useMemo(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('notunnel'),
    [],
  )
  const wrap = useRef<HTMLDivElement>(null)

  /* THE INIT WATCHDOG · under a starved GPU (heavy load · slow swiftshader)
     the r3f <Canvas> can fail to initialize AT ALL — the element stays at
     the 300×150 default for the whole session and the field is a blank
     rectangle (a real reduced-motion/slow-GPU user bug, and the goldens'
     13.66% hero bistable: probe sessions showed the flake state IS the
     uninitialized canvas). The inner demand watchdog can't fire there (its
     component never mounts), so the recovery lives OUTSIDE: if the canvas
     hasn't marked `data-painted` after a grace, remount the whole Canvas
     (a fresh context attempt) — 3 tries with backoff, then leave it be
     (no WebGL → the page's own background carries the register). */
  const [glTry, setGlTry] = useState(0)
  useEffect(() => {
    if (disabled || glTry >= 3) return
    const t = setTimeout(
      () => {
        const c = wrap.current?.querySelector('canvas')
        if (c && !c.dataset.painted) setGlTry((n) => n + 1)
      },
      2500 * (glTry + 1),
    )
    return () => clearTimeout(t)
  }, [disabled, glTry])
  const scroll = useRef(0)
  const [active, setActive] = useState(true)

  /* the scene is FIXED + full-screen and CHANGES WITH SCROLL: window scroll over
     the first ~1.9 screens eases the header glow out and fades the canvas so
     the opaque sections below take over (the loop pauses off-screen for perf).
     The glow belongs to the header — past the hero the page is the sections'. */
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
      // the glow eases off across the hero, then the canvas fades entirely
      const p = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 1.9)))
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
        key={glTry}
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

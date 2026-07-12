import { useEffect, useMemo, useRef, useState } from 'react'

/* ─── The dither field · the full-bleed WebGL background (BRAND-11) ────────────
   ONE fullscreen quad + an ordered-dither fragment shader — the v5 signature
   texture. WAVE F (operator override F1): the square-tunnel rings are GONE
   from Home — the depth motif belongs to frames now, not the page. The field
   is the Maxime register: ONE LARGE saturated blue radial ANCHORED LEFT,
   diffusing into the engineered black toward the right and bottom, with the
   faint survey grid living ONLY inside the glow. The Bayer 8×8 quantizer
   turns the falloff into the dithered dissolve — the signature move.

   VANILLA WEBGL (arc 20d) · this was an r3f <Canvas> — the ONLY r3f consumer
   on the default home path, and LH billed the whole fiber+three chunk to it:
   227 KB gz transferred · 994 ms bootup · 128 KB unused, all for one quad.
   The rewrite keeps the FRAGMENT SOURCE byte-identical (raw gl_FragColor —
   three's ShaderMaterial injected no tonemap/colorspace chunk, so the bytes
   match) and re-implements the six hard-won mechanisms explicitly:
   paint watchdog (data-painted · the harness gates on it) · init watchdog
   (remount ×3 · the 300×150 blank-canvas flake) · context loss/restore ·
   reduced-motion demand mode (ONE static frame, uTime 0, lens.w SNAPPED 0) ·
   the scroll fade + loop pause · the loupe/wake pointer state.

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
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
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

/** compile + link the one program — returns null on any compile/link failure
    (the outer init watchdog owns recovery; a shader that fails here would
    fail identically on a remount, so 3 tries then the page's own background
    carries the register) */
function buildProgram(gl: WebGLRenderingContext): WebGLProgram | null {
  const sh = (type: number, src: string): WebGLShader | null => {
    const s = gl.createShader(type)
    if (!s) return null
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS) && !gl.isContextLost()) {
      console.warn('dither-field shader:', gl.getShaderInfoLog(s))
      gl.deleteShader(s)
      return null
    }
    return s
  }
  const v = sh(gl.VERTEX_SHADER, VERT)
  const f = sh(gl.FRAGMENT_SHADER, FRAG)
  if (!v || !f) return null
  const p = gl.createProgram()
  if (!p) return null
  gl.attachShader(p, v)
  gl.attachShader(p, f)
  gl.linkProgram(p)
  /* the shaders are owned by the program now — flag for deletion either way */
  gl.deleteShader(v)
  gl.deleteShader(f)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS) && !gl.isContextLost()) {
    console.warn('dither-field link:', gl.getProgramInfoLog(p))
    gl.deleteProgram(p)
    return null
  }
  return p
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

  /* the frame loop reads these by REF — mode flips never rebuild the GL world */
  const reducedRef = useRef(reduced)
  const scrollRef = useRef(0)
  const activeRef = useRef(true)
  /* the demand kick · request ONE frame (resize · mode flip · watchdog retry ·
     scroll reactivation). Owned by the GL effect; null while torn down. */
  const kickRef = useRef<(() => void) | null>(null)

  /* reduced-motion flips at runtime (OS toggle) swap the loop's mode — kick
     one frame so the new mode paints its state immediately (the continuous
     loop re-arms itself from inside draw() when motion returns). */
  useEffect(() => {
    reducedRef.current = reduced
    kickRef.current?.()
  }, [reduced])

  /* THE INIT WATCHDOG · under a starved GPU (heavy load · slow swiftshader)
     the context can fail to produce a first frame AT ALL — historically the
     canvas sat at its default size for the whole session and the field was a
     blank rectangle (a real reduced-motion/slow-GPU user bug, and the
     goldens' 13.66% hero bistable: probe sessions showed the flake state IS
     the uninitialized canvas). If the canvas hasn't marked `data-painted`
     after a grace, rebuild the whole GL world (a fresh context attempt) —
     3 tries with backoff, then leave it be (no WebGL → the page's own
     background carries the register). */
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
      scrollRef.current = Math.min(1, Math.max(0, parseFloat(dag) || 0))
      return
    }
    const onScroll = () => {
      // the glow eases off across the hero, then the canvas fades entirely
      const p = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 1.9)))
      scrollRef.current = p
      if (wrap.current) wrap.current.style.opacity = `${1 - smoothstep(0.82, 1, p)}`
      const a = p < 1
      if (a !== activeRef.current) {
        activeRef.current = a
        /* scrolled back INTO the field → restart the paused loop */
        if (a) kickRef.current?.()
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

  /* ── THE GL WORLD · canvas + context + program + the one frame loop ──────────
     Rebuilt only by the init watchdog (glTry). Everything the loop reads at
     frame rate lives in refs/locals — pointer moves and scroll never touch
     React state. */
  useEffect(() => {
    if (disabled) return
    const host = wrap.current
    if (typeof window === 'undefined' || !host) return

    const canvas = document.createElement('canvas')
    canvas.setAttribute('aria-hidden', 'true')
    canvas.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;display:block'
    /* the harness contract (visual-regress): `data-paints` = a live field is
       expected on this page · `data-painted` = the first frame REACHED the
       canvas (set from inside draw, never optimistically) */
    canvas.dataset.paints = '1'
    host.appendChild(canvas)

    const gl = canvas.getContext('webgl', {
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
    }) as WebGLRenderingContext | null

    let raf = 0
    let dead = false
    let painted = false
    let program: WebGLProgram | null = null
    let uRes: WebGLUniformLocation | null = null
    let uTime: WebGLUniformLocation | null = null
    let uScroll: WebGLUniformLocation | null = null
    let uMouse: WebGLUniformLocation | null = null
    let uLens: WebGLUniformLocation | null = null

    /* the eased pointer state — SURVIVES mode flips (same object across
       frames, exactly like the old uniforms ref) */
    const mouse = { x: 0, y: 0 }
    let lensAmp = 0
    const eased = { mx: 0, my: 0, lx: 0, ly: 0, lw: 0 }
    const t0 = performance.now()

    const build = (): boolean => {
      if (!gl) return false
      program = buildProgram(gl)
      if (!program) return false
      const quad = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, quad)
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW,
      )
      gl.useProgram(program)
      const aPos = gl.getAttribLocation(program, 'aPos')
      gl.enableVertexAttribArray(aPos)
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)
      uRes = gl.getUniformLocation(program, 'uRes')
      uTime = gl.getUniformLocation(program, 'uTime')
      uScroll = gl.getUniformLocation(program, 'uScroll')
      uMouse = gl.getUniformLocation(program, 'uMouse')
      uLens = gl.getUniformLocation(program, 'uLens')
      gl.disable(gl.DEPTH_TEST)
      gl.clearColor(0, 0, 0, 1)
      return true
    }

    const resize = () => {
      /* r3f parity: dpr capped at 1.5 · buffer follows the CSS box */
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr))
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        gl?.viewport(0, 0, w, h)
      }
    }

    const draw = () => {
      raf = 0
      if (dead || !gl || !program || gl.isContextLost()) return
      resize()
      const rm = reducedRef.current
      /* uniform easing — the same per-frame constants the r3f loop ran */
      const k = 0.06
      const mx = rm ? 0 : mouse.x
      const my = rm ? 0 : mouse.y
      eased.mx += (mx - eased.mx) * k
      eased.my += (-my - eased.my) * k
      /* the loupe · faster follow than the parallax (a lens tracks the hand),
         amp eases so the emulsion develops rather than snapping. Reduced
         motion SNAPS w to zero (never eases): the demand mode renders ONE
         frame on the OS toggle — an eased w would bake a ~92%-amp lens
         circle into that static frame. Exact zero, always. */
      eased.lx += (mouse.x - eased.lx) * 0.25
      eased.ly += (mouse.y - eased.ly) * 0.25
      if (rm) eased.lw = 0
      else eased.lw += (lensAmp - eased.lw) * 0.08

      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.uniform1f(uTime, rm ? 0 : (performance.now() - t0) / 1000)
      // reduced motion: no dive — the beat stays a static frame
      gl.uniform1f(uScroll, rm ? 0 : scrollRef.current)
      gl.uniform2f(uMouse, eased.mx, eased.my)
      gl.uniform4f(
        uLens,
        eased.lx,
        eased.ly,
        180 * (canvas.width / Math.max(1, window.innerWidth)),
        eased.lw,
      )
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      if (!painted) {
        painted = true
        canvas.dataset.painted = '1'
      }
      /* continuous only while the field is on screen AND motion is allowed —
         demand mode (reduced) and the scrolled-past state stop here; the
         kick (scroll back · OS toggle · resize) re-requests. */
      if (!rm && activeRef.current) schedule()
    }
    const schedule = () => {
      if (!raf && !dead) raf = requestAnimationFrame(draw)
    }

    if (gl && build()) {
      kickRef.current = schedule
      schedule()
    }

    /* THE PAINT WATCHDOG · under a starved GPU the first frame can be dropped
       with nothing re-requesting it — the canvas stays BLANK for the whole
       session (the goldens' exact 13.66% hero bistable). Staggered retries
       until the first frame lands; idempotent (the rest frame is pure). */
    const wds = [500, 1500, 3000, 6000].map((ms) =>
      setTimeout(() => {
        if (!painted) schedule()
      }, ms),
    )

    /* GPU context loss: preventDefault on `lost` so the browser is ALLOWED to
       restore; on `restored` the program/buffers are gone — rebuild the GL
       state and repaint (otherwise a demand/paused canvas stays blank after
       a GPU reset). */
    const onLost = (e: Event) => {
      e.preventDefault()
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    }
    const onRestored = () => {
      if (build()) schedule()
    }
    canvas.addEventListener('webglcontextlost', onLost)
    canvas.addEventListener('webglcontextrestored', onRestored)

    /* the loupe's gate · a real hover cursor at desktop width (matches the
       CSS cursor-effect gates) — coarse pointers and phones never see it */
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    const onMove = (e: PointerEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1
      lensAmp = fine.matches && window.innerWidth >= 1024 ? 1 : 0
    }
    /* pointer leaves the page → the loupe sets down (amp eases to 0) */
    const onOut = (e: PointerEvent) => {
      if (e.relatedTarget === null) lensAmp = 0
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerout', onOut, { passive: true })

    /* demand-mode resize truth: the reduced static frame must re-render at
       the new buffer size (the continuous loop resizes itself every frame) */
    const onResize = () => {
      kickRef.current?.()
    }
    window.addEventListener('resize', onResize, { passive: true })

    return () => {
      dead = true
      kickRef.current = null
      if (raf) cancelAnimationFrame(raf)
      wds.forEach(clearTimeout)
      canvas.removeEventListener('webglcontextlost', onLost)
      canvas.removeEventListener('webglcontextrestored', onRestored)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerout', onOut)
      window.removeEventListener('resize', onResize)
      /* release the context politely (three's dispose did) — the next try
         (init watchdog) gets a fresh slot instead of racing the GC */
      gl?.getExtension('WEBGL_lose_context')?.loseContext()
      canvas.remove()
    }
  }, [disabled, glTry])

  if (disabled) return null

  return <div ref={wrap} className="depth-fixed" aria-hidden />
}

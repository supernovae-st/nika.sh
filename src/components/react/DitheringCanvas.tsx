import { useEffect, useRef } from 'react';

// ─── Shaders ────────────────────────────────────────────────────────────────

const VERT = /* glsl */ `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// Fragment shader: 5-octave FBM with domain warp → Bayer 4×4 ordered dither.
// The domain warp (two FBM passes feeding the UV of a third) creates organic
// fluid patterns — cellular automata feel without the complexity.
// Mouse proximity adds a softbox spotlight that brightens the field locally.
const FRAG = /* glsl */ `
  precision mediump float;

  uniform float u_time;
  uniform vec2  u_resolution;
  uniform vec2  u_mouse;      // in CSS pixels, Y-down

  // Gradient noise (Perlin-style, no texture lookup)
  vec2 grad(vec2 p) {
    vec2 k = vec2(0.3183099, 0.3678794);
    p = p * k + k.yx;
    return -1.0 + 2.0 * fract(16.0 * k * fract(p.x * p.y * (p.x + p.y)));
  }
  float gnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    return mix(
      mix(dot(grad(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
          dot(grad(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
      mix(dot(grad(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
          dot(grad(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
      u.y);
  }

  // 5-octave FBM with 30° rotation per octave (breaks axis alignment)
  float fbm(vec2 p) {
    const mat2 rot = mat2(0.86602540, 0.5, -0.5, 0.86602540);
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * (gnoise(p) * 0.5 + 0.5);
      p  = rot * p * 2.02 + vec2(3.137, 7.421);
      a *= 0.5;
    }
    return v / 0.96875; // normalise to [0,1]
  }

  // 4×4 Bayer ordered-dither threshold in pixel space
  float bayer(vec2 px) {
    int x = int(mod(px.x, 4.0));
    int y = int(mod(px.y, 4.0));
    // Matrix: [ 0,8,2,10 / 12,4,14,6 / 3,11,1,9 / 15,7,13,5 ] / 16
    if (y == 0) {
      if (x == 0) return  0.0/16.0;
      if (x == 1) return  8.0/16.0;
      if (x == 2) return  2.0/16.0;
                  return 10.0/16.0;
    } else if (y == 1) {
      if (x == 0) return 12.0/16.0;
      if (x == 1) return  4.0/16.0;
      if (x == 2) return 14.0/16.0;
                  return  6.0/16.0;
    } else if (y == 2) {
      if (x == 0) return  3.0/16.0;
      if (x == 1) return 11.0/16.0;
      if (x == 2) return  1.0/16.0;
                  return  9.0/16.0;
    } else {
      if (x == 0) return 15.0/16.0;
      if (x == 1) return  7.0/16.0;
      if (x == 2) return 13.0/16.0;
                  return  5.0/16.0;
    }
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    uv.y = 1.0 - uv.y; // flip: CSS Y-down → GL Y-up

    float t = u_time * 0.055;

    // Domain warp: feed two FBM slices as UV distortion
    vec2 q = vec2(
      fbm(uv * 2.8 + t),
      fbm(uv * 2.8 + vec2(5.2, 1.3) + t)
    );
    float field = fbm(uv * 2.8 + 1.6 * q + t * 0.28);

    // Mouse spotlight — softbox falloff in UV space
    vec2 mouseUV = u_mouse / u_resolution;
    mouseUV.y = 1.0 - mouseUV.y;
    float md = length(uv - mouseUV);
    field = clamp(field + smoothstep(0.38, 0.0, md) * 0.38, 0.0, 1.0);

    // Radial vignette (edges go dark)
    vec2 vc = uv * 2.0 - 1.0;
    vc.x *= u_resolution.x / u_resolution.y; // aspect-correct
    field *= smoothstep(1.5, 0.4, length(vc));

    // Ordered dither: compare field to Bayer threshold
    float threshold = bayer(gl_FragCoord.xy);
    float dithered  = step(threshold, field * 0.88);

    // Brand palette: near-black bg → blue-500 dots
    vec3 bg    = vec3(0.047, 0.051, 0.071); // --color-bg
    vec3 brand = vec3(0.231, 0.510, 0.965); // --color-brand

    gl_FragColor = vec4(mix(bg, brand, dithered), 1.0);
  }
`;

// ─── WebGL helpers ───────────────────────────────────────────────────────────

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.warn('[DitheringCanvas] shader error:', gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

function buildProgram(gl: WebGLRenderingContext): WebGLProgram | null {
  const vert = compileShader(gl, gl.VERTEX_SHADER, VERT);
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vert || !frag) return null;

  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vert);
  gl.attachShader(prog, frag);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('[DitheringCanvas] link error:', gl.getProgramInfoLog(prog));
    return null;
  }
  return prog;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface DitheringCanvasProps {
  className?: string;
  /** CSS height of the section in px (default: 480) */
  height?: number;
}

/**
 * DitheringCanvas — raw WebGL fullscreen dither field.
 *
 * Renders a 5-octave domain-warped FBM noise field quantized through a 4×4
 * Bayer ordered-dither matrix. Output: crisp 1px blue dots on near-black,
 * flowing like a living circuit board.
 *
 * Mouse moves a softbox spotlight that brightens the field locally.
 * No library dependency — 100% raw WebGL1 / GLSL ES 1.0.
 *
 * Guardrails:
 * - Falls back to a dark gradient if WebGL is unavailable
 * - IntersectionObserver pauses rAF when off-screen
 * - prefers-reduced-motion: single static frame, no loop
 * - ResizeObserver + window resize rebuffer the canvas
 */
export function DitheringCanvas({ className = '', height = 480 }: DitheringCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = (canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;

    if (!gl) return; // graceful: CSS bg-color fallback shows instead

    const prog = buildProgram(gl);
    if (!prog) return;

    gl.useProgram(prog);

    // Fullscreen quad (two triangles covering clip space -1..1)
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    const posLoc = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes  = gl.getUniformLocation(prog, 'u_resolution');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    // Canvas sizing (1× DPR — intentional: dither dots are CSS pixels)
    let W = 0;
    let H = 0;
    const resize = () => {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width  = W;
      canvas.height = H;
      gl.viewport(0, 0, W, H);
    };
    resize();

    // Mouse — track in CSS coordinates
    let mx = W * 0.5;
    let my = H * 0.5;
    const onPointer = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    // Pause when off-screen or tab hidden
    let visible = true;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
    io.observe(canvas);
    const onVis = () => { if (document.hidden) visible = false; };
    document.addEventListener('visibilitychange', onVis);

    // Resize listener
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const prefersReduced =
      typeof matchMedia !== 'undefined' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Draw one frame
    const draw = (t: number) => {
      gl.uniform1f(uTime, t * 0.001);
      gl.uniform2f(uRes, W, H);
      gl.uniform2f(uMouse, mx, my);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    if (prefersReduced) {
      draw(2000); // static mid-time frame
      io.disconnect();
      return () => {
        window.removeEventListener('pointermove', onPointer);
        document.removeEventListener('visibilitychange', onVis);
        ro.disconnect();
      };
    }

    let rafId = 0;
    const loop = (t: number) => {
      rafId = requestAnimationFrame(loop);
      if (!visible) return;
      draw(t);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVis);
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`dither-canvas ${className}`}
      style={{ display: 'block', width: '100%', height: `${height}px` }}
      aria-hidden="true"
    />
  );
}

export default DitheringCanvas;

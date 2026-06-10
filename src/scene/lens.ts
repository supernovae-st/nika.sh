import { Effect } from 'postprocessing'
import { Uniform } from 'three'

/* ─── curved-glass lens · barrel distortion ─────────────────────────────────
   The whole scene reads like it lives behind a bulged CRT/anamorphic glass:
   center slightly magnified, edges curving away. uK breathes — it BLOOPS
   with the supernova burst and flexes during the stargate warp. */

const frag = /* glsl */ `
  uniform float uK;
  uniform float uAcid;
  uniform float uT;

  // rotate color around the grey axis — the acid hue trip
  vec3 hueShift(vec3 color, float a) {
    const vec3 k = vec3(0.57735);
    float c = cos(a);
    return color * c + cross(k, color) * sin(a) + k * dot(k, color) * (1.0 - c);
  }

  void mainUv(inout vec2 uv) {
    vec2 c = uv - 0.5;
    float r2 = dot(c, c);
    uv = 0.5 + c * (1.0 + uK * r2);
    // liquid glass — the lens ripples like fluid when the trip is on
    uv += vec2(
      sin(uv.y * 18.0 + uT * 2.6),
      cos(uv.x * 16.0 + uT * 2.2)
    ) * 0.009 * uAcid;
    // second harmonic — the surface boils, not just waves
    uv += vec2(
      sin((uv.x + uv.y) * 34.0 - uT * 4.1),
      cos((uv.x - uv.y) * 30.0 + uT * 3.4)
    ) * 0.0035 * uAcid;
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    // ── DOME CHROMA · radial aberration (Interstellar glass) — red sampled
    //    outward, blue inward · fringes grow toward the rim of the dome
    vec2 dc = uv - 0.5;
    float rr = dot(dc, dc);
    float ca = (0.0042 + uAcid * 0.005) * rr * 3.2;
    vec3 col;
    col.r = texture2D(inputBuffer, uv + dc * ca).r;
    col.g = inputColor.g;
    col.b = texture2D(inputBuffer, uv - dc * ca).b;
    // the 5th-dimension pass · 2001 stargate acid — hue sweeps across the
    // frame, saturation lifts · only when the journey moves fast
    if (uAcid > 0.003) {
      float r = distance(uv, vec2(0.5));
      vec3 trip = hueShift(col, (uv.x + uv.y - 1.0) * 3.2 + r * 7.0 + uT * 1.3);
      float g = dot(col, vec3(0.299, 0.587, 0.114));
      trip = mix(vec3(g), trip, 1.65); // saturation push
      // SPECTRAL RING · the tunnel walls cycle through the rainbow (2001 corridor)
      vec3 ring = hueShift(vec3(0.30, 0.45, 1.0), r * 9.0 - uT * 2.2);
      trip += ring * smoothstep(0.32, 0.62, r) * 0.5;
      // tunnel banding · faint concentric energy rings sweeping inward
      trip *= 1.0 + 0.10 * sin(r * 44.0 - uT * 6.0) * smoothstep(0.18, 0.5, r);
      col = mix(col, trip, min(0.85, uAcid * 0.9));
    }
    // faint glass sheen — a specular breath near the top of the bulge
    float sheen = exp(-distance(uv, vec2(0.5, 0.12)) * 2.6) * 0.035;
    outputColor = vec4(col + sheen, inputColor.a);
  }
`

export class LensEffect extends Effect {
  constructor() {
    super('LensEffect', frag, {
      uniforms: new Map<string, Uniform>([
        ['uK', new Uniform(0.07)],
        ['uAcid', new Uniform(0)],
        ['uT', new Uniform(0)],
      ]),
    })
  }
  get k(): Uniform {
    return this.uniforms.get('uK') as Uniform
  }
  get acid(): Uniform {
    return this.uniforms.get('uAcid') as Uniform
  }
  get t(): Uniform {
    return this.uniforms.get('uT') as Uniform
  }
}

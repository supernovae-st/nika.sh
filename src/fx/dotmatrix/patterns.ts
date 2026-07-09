/* ─── nika dot-matrix patterns · original house engine ────────────────────
   A pattern is pure data: for each cell of the N×N grid it answers
   (1) does the cell belong to the figure (`on`), and (2) at which beat it
   fires (`delay`, in steps). The CSS engine (dotmatrix.css) does the rest —
   opacity-only keyframes, compositor-cheap, zero per-frame JS.

   These are SEMANTIC, not decorative: each verb's pattern is its execution
   model (per the icon ontology, design/icons.yaml `anim/*` entities).
   Concept lineage: dot-matrix loading grids are a decades-old display idiom;
   this implementation is written from scratch for the nika design system. */

export const GRID = 9
const C = (GRID - 1) / 2 // the center cell

export interface DotSpec {
  /** cell belongs to the resting figure (holds ink when the loop settles) */
  on: boolean
  /** firing beat, in steps (drives animation-delay) */
  delay: number
}

export type PatternId = 'sample' | 'scanline' | 'roundtrip' | 'orbit' | 'wave' | 'emerge'

/* deterministic PRNG — same swarm on every mount (no hydration flicker) */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* the sparkle figure · infer's resting shape (a 4-ray star, the think mark) */
const sparkleOn = (x: number, y: number) =>
  (x === C && Math.abs(y - C) <= 2) || (y === C && Math.abs(x - C) <= 2) || (Math.abs(x - C) === 1 && Math.abs(y - C) === 1)

/* the butterfly figure · the brand glyph resolved onto the 9×9 grid
   (wings off a center body — the same 4-lobe reading as nika-glyph-16) */
const BUTTERFLY = [
  '.X.....X.',
  'XXX...XXX',
  'XXXX.XXXX',
  '.XXXXXXX.',
  '...XXX...',
  '..XXXXX..',
  '.XX.X.XX.',
  '.X..X..X.',
  '....X....',
]
const butterflyOn = (x: number, y: number) => BUTTERFLY[y]?.[x] === 'X'

/** perimeter walk order (clockwise from the top-left corner) → step index */
function ringStep(x: number, y: number): number | null {
  const m = GRID - 1
  if (y === 0) return x
  if (x === m) return m + y
  if (y === m) return 2 * m + (m - x)
  if (x === 0) return 3 * m + (m - y)
  return null
}

export function pattern(id: PatternId, x: number, y: number): DotSpec {
  switch (id) {
    /* infer · the model SAMPLES: cells fire in seeded shuffle order, then the
       sparkle holds while the noise decays (two CSS keyframes pick the fate). */
    case 'sample': {
      const r = mulberry32(x * 31 + y * 17 + 7)()
      return { on: sparkleOn(x, y), delay: Math.floor(r * 14) }
    }
    /* exec · stdout SCANLINE: rows light top→bottom, carriage-return quick. */
    case 'scanline':
      return { on: true, delay: y * 2 + x * 0.12 }
    /* invoke · request/response ROUNDTRIP: a radial pulse leaves the center
       and (animation-direction: alternate) comes back. */
    case 'roundtrip': {
      const d = Math.hypot(x - C, y - C)
      return { on: d <= C + 0.5, delay: d * 2.2 }
    }
    /* agent · the bounded LOOP: a tail orbits the perimeter; the core ticks
       once per lap (the tool call inside the loop). */
    case 'orbit': {
      const s = ringStep(x, y)
      if (s !== null) return { on: true, delay: s * 0.75 }
      const core = Math.abs(x - C) <= 1 && Math.abs(y - C) <= 1
      return { on: core, delay: Math.hypot(x - C, y - C) * 1.5 }
    }
    /* neutral loading · the diagonal wave (the generic register). */
    case 'wave':
      return { on: true, delay: (x + y) * 1.1 }
    /* the logo · the butterfly EMERGES from the body outward, and
       (alternate) folds back — the wings beat. */
    case 'emerge':
      return { on: butterflyOn(x, y), delay: Math.abs(x - C) * 2 + y * 0.25 }
  }
}

/** total loop length per pattern, in steps (keeps trails proportionate) */
export const LOOP_STEPS: Record<PatternId, number> = {
  sample: 22,
  scanline: 22,
  roundtrip: 16,
  orbit: 26,
  wave: 22,
  emerge: 14,
}

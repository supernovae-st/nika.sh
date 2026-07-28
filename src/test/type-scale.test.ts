import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/* ── the type scale · a closed set, and a debt that only shrinks ─────────────
   The site already owned a type scale — named, commented, deliberate — and
   bypassed it 673 times against 13 uses. 241 of those bypasses landed on HALF
   pixels: 10.5 · 11.5 · 12.5 · 13.5 · 14.5 · 15.5. Nobody perceives 11px
   against 11.5px as hierarchy. That is accretion, and it is precisely what
   makes a page read as assembled rather than composed — the difference
   between this site and the ones whose restraint we admire is not their
   effects, it is that they run on eight sizes and three weights.

   Two shapes of gate, because the debt is too large to forbid outright:

     ABSOLUTE — the scale itself. It may never gain a half step and may never
     say the same size twice. This can hold from day one because the scale is
     ours to keep clean.

     RATCHET — the bypasses. A ceiling that only ever descends, plus a list of
     files already cleared that may never regress. The per-file list is the
     load-bearing half: a global count can be gamed by moving debt around,
     whereas a cleared file is cleared forever.

   Lower the ceilings when you clear a file. Never raise them. If a change
   needs a size the scale does not have, the answer is to argue for a step —
   in tokens.css, once, for everyone — not to write a number here. */

const ROOT = join(__dirname, '../..')

const cssFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? cssFiles(join(dir, e.name))
      : e.name.endsWith('.css')
        ? [join(dir, e.name)]
        : [],
  )

const SHEETS = cssFiles(join(ROOT, 'src'))
const LITERAL = /font-size:\s*[0-9.]+(?:px|rem)/g
const HALF = /font-size:\s*[0-9]+\.5px/g

/** files whose type is fully on the scale · this list only grows */
const CLEAN = ['src/sections/v4-home.css']

/** the debt, as measured 2026-07-28 · these only descend */
const CEILING_LITERALS = 570
const CEILING_HALF = 229
const CEILING_RELATIVE = 23

const rel = (p: string) => p.slice(ROOT.length + 1)
const count = (re: RegExp, src: string) => (src.match(re) ?? []).length

describe('type scale · closed set, shrinking debt', () => {
  /* ABSOLUTE · the scale is ours, so it stays clean */
  it('every fixed step is a whole pixel', () => {
    const tokens = readFileSync(join(ROOT, 'src/styles/tokens.css'), 'utf8')
    const steps = [...tokens.matchAll(/--type-([a-z0-9-]+):\s*([^;]+);/g)]
    expect(steps.length, 'the scale vanished from tokens.css').toBeGreaterThan(6)
    for (const [, name, value] of steps) {
      if (value.includes('clamp(')) continue /* the fluid steps scale by viewport */
      expect(value.trim(), `--type-${name} is not a whole pixel`).toMatch(/^\d+px$/)
    }
  })

  it('no two steps say the same size', () => {
    const tokens = readFileSync(join(ROOT, 'src/styles/tokens.css'), 'utf8')
    const fixed = [...tokens.matchAll(/--type-([a-z0-9-]+):\s*(\d+px);/g)]
    const seen = new Map<string, string>()
    for (const [, name, value] of fixed) {
      const prior = seen.get(value)
      expect(prior, `--type-${name} duplicates --type-${prior} at ${value}`).toBeUndefined()
      seen.set(value, name)
    }
  })

  /* RATCHET · the load-bearing half — a cleared file is cleared forever */
  it('every cleared file stays on the scale', () => {
    for (const path of CLEAN) {
      const src = readFileSync(join(ROOT, path), 'utf8')
      const found = src.match(LITERAL) ?? []
      expect(found, `${path} regressed: ${found.join(' · ')}`).toHaveLength(0)
      expect(count(/font-size:\s*var\(--type-/g, src), `${path} sets no type at all`)
        .toBeGreaterThan(0)
    }
  })

  /* RATCHET · the global debt, so untouched files cannot quietly grow */
  it('the hard-coded size count only descends', () => {
    const worst: [string, number][] = []
    let total = 0
    for (const file of SHEETS) {
      const n = count(LITERAL, readFileSync(file, 'utf8'))
      total += n
      if (n > 20) worst.push([rel(file), n])
    }
    worst.sort((a, b) => b[1] - a[1])
    expect(
      total,
      `hard-coded font sizes rose to ${total} (ceiling ${CEILING_LITERALS}). `
        + `Heaviest: ${worst.slice(0, 4).map(([f, n]) => `${f} ${n}`).join(' · ')}`,
    ).toBeLessThanOrEqual(CEILING_LITERALS)
  })

  it('the half-pixel count only descends', () => {
    let total = 0
    for (const file of SHEETS) total += count(HALF, readFileSync(file, 'utf8'))
    expect(
      total,
      `half-pixel font sizes rose to ${total} (ceiling ${CEILING_HALF}). `
        + 'A half step is never a hierarchy — take the nearest whole one.',
    ).toBeLessThanOrEqual(CEILING_HALF)
  })

  /* THE LOOPHOLE, CLOSED THE DAY IT WAS FOUND. The three gates above read
     DECLARATIONS; the truth is in the render. Asking the built home page what
     it actually computes turned up sizes no stylesheet contains — 7.33 ·
     10.65 · 15.64 · 16.99 · 27.34 · 69.55 — because a relative unit inherits
     whatever its parent happens to be and lands wherever the multiplication
     falls. Those are half-pixels by another route, and a ratchet blind to
     them would report a shrinking debt while the page kept drifting.

     Relative units are not banned: 0.9em inside a code run is a reasonable
     thing to write. But they are counted, because 23 is small enough to
     shrink and large enough to hide behind. */
  it('the relative-unit count only descends', () => {
    const RELATIVE = /font-size:\s*[0-9.]+(?:em|%|ch)/g
    const where: string[] = []
    let total = 0
    for (const file of SHEETS) {
      const n = count(RELATIVE, readFileSync(file, 'utf8'))
      total += n
      if (n) where.push(`${rel(file)} ${n}`)
    }
    expect(
      total,
      `relative font sizes rose to ${total} (ceiling ${CEILING_RELATIVE}): ${where.join(' · ')}`,
    ).toBeLessThanOrEqual(CEILING_RELATIVE)
  })
})

/* ── the weights · four, because the display face owns exactly three ─────────
   Clash Display ships as three static cuts (500 · 600 · 700). Ask a browser
   for any other weight on it and you do not get that weight — you get a
   SYNTHESISED one, the glyphs mechanically smeared by the rasteriser. It is a
   real defect and it is invisible in review, so the token set is pinned to the
   cuts the file physically provides, plus 400 for the variable faces.

   These are ABSOLUTE, not ratchets: the whole site landed on the four in one
   pass (141 declarations, 28 of them snapped off 450 · 560 · 590 · 650), so
   there is no debt left to ratchet down — only a floor to defend. */
describe('type weights · pinned to the cuts that exist', () => {
  const TOKENS = readFileSync(join(ROOT, 'src/styles/tokens.css'), 'utf8')

  it('the set is exactly four, and they are the canonical steps', () => {
    const steps = [...TOKENS.matchAll(/--fw-([a-z]+):\s*(\d+);/g)].map(([, n, v]) => [n, +v] as const)
    expect(steps.map(([n]) => n)).toEqual(['regular', 'medium', 'semibold', 'bold'])
    expect(steps.map(([, v]) => v)).toEqual([400, 500, 600, 700])
  })

  /* the clause worth having: the tokens are not four numbers someone liked,
     they are what the display face can actually render */
  it('every non-regular step is a cut Clash Display really ships', () => {
    const css = readFileSync(join(ROOT, 'src/index.css'), 'utf8')
    const cuts = [...css.matchAll(/@font-face\s*\{[^}]*\}/g)]
      .filter((m) => /font-family:\s*'Clash Display'/.test(m[0]))
      .map((m) => Number(m[0].match(/font-weight:\s*(\d+)\s*;/)?.[1]))
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b)
    expect(cuts, 'Clash Display declares no static cuts — did the @font-face set move?')
      .toHaveLength(3)
    const tokens = [...TOKENS.matchAll(/--fw-(?:medium|semibold|bold):\s*(\d+);/g)]
      .map((m) => Number(m[1])).sort((a, b) => a - b)
    expect(tokens, `tokens ${tokens.join('/')} do not match Clash's cuts ${cuts.join('/')} `
      + '— a weight the face does not ship gets synthesised, never rendered').toEqual(cuts)
  })

  it('no stylesheet writes a raw weight outside an @font-face', () => {
    const offenders: string[] = []
    for (const file of SHEETS) {
      const src = readFileSync(file, 'utf8')
      let inFace = false
      src.split('\n').forEach((line, i) => {
        if (line.includes('@font-face')) inFace = true
        if (inFace) { if (line.includes('}')) inFace = false; return }
        const m = line.match(/font-weight:\s*(\d+)\s*;/)
        if (m) offenders.push(`${rel(file)}:${i + 1} → ${m[1]}`)
      })
    }
    expect(offenders, `raw weights: ${offenders.join(' · ')}`).toHaveLength(0)
  })
})

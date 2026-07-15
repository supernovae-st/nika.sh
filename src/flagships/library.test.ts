import { describe, expect, it } from 'vitest'
import { LIBRARY_TABS, buildLibrary, verbsOf } from './library'
import { FLAGSHIP_ENTRIES } from './index'
import { SHOWCASE_DAG, SHOWCASE_YAML } from '../sections/usecases-yaml.generated'

/* the tests build the library with the REAL dictionary (node-side import
   is not the client bundle — the diet law binds the bundle, not vitest) */
const LIBRARY = buildLibrary(SHOWCASE_YAML)

/* ── the library · honesty + coherence gates (wave K) ─────────────────────────
   The picker's corpus must stay structurally honest:
   (a) recorded items ARE the flagship entries (same objects — the trace suite
       already guards their honesty; nothing here re-verifies what it pins);
   (b) browse-only items show the pack corpus VERBATIM (the projected showcase
       bytes — the drift gate to the spec repo lives in the projector);
   (c) the derive parity: our deriveWorkflow and the spec projector's
       independent derivation must agree on every structural fact of a browse
       plan (id · verb · deps · wave · when-gate · task anchor line);
   (d) the hero panel-height law: every library file exceeds the editor's
       20-line cap, so switching files can never change the panel height. */

describe('library · corpus shape', () => {
  it('serves 10 files: 7 recorded + 3 browse-only', () => {
    expect(LIBRARY).toHaveLength(10)
    expect(LIBRARY.filter((x) => x.flagship)).toHaveLength(7)
  })

  it('the recorded items are the flagship entries themselves (no forks)', () => {
    for (const item of LIBRARY.filter((x) => x.flagship)) {
      const f = item.flagship!
      expect(FLAGSHIP_ENTRIES).toContain(f)
      expect(item.yaml).toBe(f.yaml)
      expect(item.plan).toBe(f.plan)
      expect(item.filename).toBe(f.filename)
    }
  })

  it('the strip carries the WHOLE corpus (operator 2026-07-13 · the picker died)', () => {
    expect(LIBRARY_TABS).toHaveLength(LIBRARY.length)
    /* reading order: the recorded seven lead (their traces replay), the
       browse wing closes the strip */
    for (const item of LIBRARY.slice(0, 7)) {
      expect(item.flagship, item.id).toBeDefined()
    }
  })

  it('ids, labels and filenames are unique · blurb and gloss are present', () => {
    const ids = LIBRARY.map((x) => x.id)
    expect(new Set(ids).size).toBe(LIBRARY.length)
    const files = LIBRARY.map((x) => x.filename)
    expect(new Set(files).size).toBe(LIBRARY.length)
    for (const item of LIBRARY) {
      expect(item.blurb.length, item.id).toBeGreaterThan(10)
      expect(item.gloss.length, item.id).toBeGreaterThan(10)
      expect(item.label.length, item.id).toBeGreaterThan(0)
    }
  })
})

describe('library · browse-only honesty', () => {
  const browse = LIBRARY.filter((x) => !x.flagship)

  it('every browse yaml is the projected pack corpus, verbatim', () => {
    for (const item of browse) {
      expect(item.yaml, item.id).toBe(SHOWCASE_YAML[item.id])
    }
  })

  it('derive parity: our plan agrees with the spec projector’s derivation', () => {
    for (const item of browse) {
      const ref = SHOWCASE_DAG[item.id]
      expect(ref, `${item.id} must exist in SHOWCASE_DAG`).toBeDefined()
      expect(item.plan.tasks.length).toBe(ref.tasks.length)
      for (let i = 0; i < ref.tasks.length; i++) {
        const mine = item.plan.tasks[i]
        const spec = ref.tasks[i]
        const at = `${item.id} · ${spec.id}`
        expect(mine.id, at).toBe(spec.id)
        expect(mine.verb, at).toBe(spec.verb)
        expect(mine.deps, at).toEqual(spec.deps)
        expect(mine.wave, at).toBe(spec.wave)
        /* the projector counts lines 0-based · ours are 1-based editor lines */
        expect(mine.line0, at).toBe(spec.line0 + 1)
        /* our block runs to the line before the next head (trailing blanks
           included — the hover surface); the projector stops at content */
        expect(mine.line1, at).toBeGreaterThanOrEqual(spec.line1 + 1)
        expect(mine.when !== undefined, at).toBe(spec.gate === 'when')
      }
      expect(item.plan.waveCount).toBe(ref.waves)
    }
  })

  it('verb glyph rows derive from the plan (never hand-typed)', () => {
    for (const item of browse) {
      const fromSpec = [...new Set(SHOWCASE_DAG[item.id].tasks.map((t) => t.verb))]
      expect(verbsOf(item.plan), item.id).toEqual(fromSpec)
    }
  })
})

describe('library · the hero panel-height law', () => {
  it('every file exceeds the 20-line editor cap (constant panel height)', () => {
    for (const item of LIBRARY) {
      const lines = item.yaml.replace(/\n$/, '').split('\n').length
      expect(lines, `${item.filename} must exceed the cap`).toBeGreaterThan(20)
    }
  })

  it('every highlight range points at real, non-empty evidence lines', () => {
    for (const item of LIBRARY) {
      const [lo, hi] = item.highlight
      const lines = item.yaml.split('\n')
      expect(lo, item.id).toBeGreaterThanOrEqual(1)
      expect(hi, item.id).toBeGreaterThanOrEqual(lo)
      expect(lines[hi - 1], `${item.filename} line ${hi}`).toBeDefined()
      for (let n = lo; n <= hi; n++) {
        expect(lines[n - 1].trim(), `${item.filename} line ${n} is empty`).not.toBe('')
      }
    }
  })
})

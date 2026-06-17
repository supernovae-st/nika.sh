import { describe, expect, it } from 'vitest'
import { SHOWCASE_YAML } from '../usecases-yaml.generated'
import { sliceExcerpt, TRIM } from './excerpt'

/* ── sliceExcerpt · the hero is a TRUE slice of the real projected YAML ──
   These tests pin the contract that the hero excerpt is verbatim source (never
   hand-typed) and that the `permits:` block is locatable for emphasis. */

const YAML = SHOWCASE_YAML['t3-resume-screener']

describe('sliceExcerpt', () => {
  it('lifts the requested ranges verbatim from the source', () => {
    const { text } = sliceExcerpt(YAML, [[1, 3]])
    const src = YAML.split('\n').slice(0, 3).join('\n')
    expect(text).toBe(src)
  })

  it('inserts exactly one … marker between non-adjacent ranges', () => {
    const { text } = sliceExcerpt(YAML, [
      [1, 2],
      [7, 8],
    ])
    const lines = text.split('\n')
    expect(lines.filter((l) => l === TRIM)).toHaveLength(1)
    // marker sits BETWEEN the two slices
    expect(lines[2]).toBe(TRIM)
  })

  it('every non-… line appears verbatim in the source string', () => {
    const { text } = sliceExcerpt(YAML, [
      [1, 11],
      [86, 88],
    ])
    for (const line of text.split('\n')) {
      if (line === TRIM) continue
      expect(YAML).toContain(line)
    }
  })

  it('locates the permits block (1-based span within the excerpt)', () => {
    // permits header through the tools list, lifted as one contiguous slice
    const { text, highlight } = sliceExcerpt(YAML, [[1, 11]], /permits:|^\s*(fs|read|write|tools):/)
    expect(highlight).toBeDefined()
    const lines = text.split('\n')
    const [lo, hi] = highlight!
    expect(lines[lo - 1]).toMatch(/^permits:/)
    expect(lines[hi - 1]).toMatch(/^\s*tools:/)
  })

  it('clamps out-of-range line numbers without throwing', () => {
    const { text } = sliceExcerpt(YAML, [[10_000, 10_010]])
    expect(text).toBe('')
  })

  it('handles an empty range list: empty text, no highlight, no throw', () => {
    const { text, highlight } = sliceExcerpt(YAML, [])
    expect(text).toBe('')
    expect(highlight).toBeUndefined()
    // even with a highlight tag, an empty range yields no highlight
    const withTag = sliceExcerpt(YAML, [], /permits:/)
    expect(withTag.text).toBe('')
    expect(withTag.highlight).toBeUndefined()
  })

  it('the real t3 file carries a permits block with no net category', () => {
    // the story depends on this: fs read/write + tools, and crucially NO net:
    expect(YAML).toMatch(/permits:/)
    expect(YAML).toMatch(/tools: \[/)
    expect(YAML).not.toMatch(/^\s*net:/m)
  })
})

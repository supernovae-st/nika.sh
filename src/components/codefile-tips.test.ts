import { describe, expect, it } from 'vitest'
import { tipFor } from './codefile-tips'
import { KEY_WORDS, VERB_WORDS, WHEN_WORDS } from '../sections/morph/plain-words'

/* ── the smart-hover resolver · curated, one vocabulary source ──
   Written FIRST (TDD). The resolver must (a) speak the plain-words glossary
   verbatim, (b) survive the glyph a verb span carries, and (c) stay SILENT on
   everything uncurated — silence is the feature that keeps the layer calm. */
describe('tipFor', () => {
  it('resolves the high-signal keys from the shared glossary', () => {
    expect(tipFor('key', 'permits')).toEqual({ term: 'permits', words: KEY_WORDS.permits })
    expect(tipFor('key', 'when')?.words).toBe(WHEN_WORDS)
    expect(tipFor('key', 'depends_on')?.words).toBe(KEY_WORDS.depends_on)
    expect(tipFor('key', 'schema')?.term).toBe('schema')
  })

  it('resolves the 4 verbs even with the leading glyph in the span text', () => {
    expect(tipFor('verb', '◇infer')).toEqual({
      term: 'infer',
      words: VERB_WORDS.infer,
      verb: 'infer',
    })
    expect(tipFor('verb', '▷ exec')?.verb).toBe('exec')
    expect(tipFor('verb', 'invoke')?.words).toBe(VERB_WORDS.invoke)
    expect(tipFor('verb', '✦agent')?.verb).toBe('agent')
  })

  it('speaks the ${{ … }} wiring once, never anchors/aliases', () => {
    expect(tipFor('tref', '${{ tasks.diff.output }}')?.term).toBe('${{ … }}')
    expect(tipFor('tref', '&shared')).toBeNull()
    expect(tipFor('tref', '*shared')).toBeNull()
  })

  it('stays silent on uncurated tokens (noise is the failure mode)', () => {
    expect(tipFor('key', 'path')).toBeNull() // schema/args plumbing
    expect(tipFor('key', 'type')).toBeNull()
    expect(tipFor('key', 'id')).toBeNull()
    expect(tipFor('string', 'permits')).toBeNull() // wrong kind
    expect(tipFor('verb', 'INFER')).toBeNull() // case-sensitive canon
    expect(tipFor('key', '')).toBeNull()
  })
})

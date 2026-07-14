import { describe, expect, it } from 'vitest'
import { tipFor, tipHref } from './codefile-tips'
import { KEY_WORDS, VERB_WORDS, WHEN_WORDS } from '../sections/morph/plain-words'

/* ── the smart-hover resolver · curated, one vocabulary source ──
   Written FIRST (TDD). The resolver must (a) speak the plain-words glossary
   verbatim, (b) survive the glyph a verb span carries, and (c) stay SILENT on
   everything uncurated — silence is the feature that keeps the layer calm. */
describe('tipFor', () => {
  it('resolves the high-signal keys from the shared glossary', () => {
    expect(tipFor('key', 'permits')).toEqual({ term: 'permits', words: KEY_WORDS.permits })
    expect(tipFor('key', 'when')?.words).toBe(WHEN_WORDS)
    expect(tipFor('key', 'with')?.words).toBe(KEY_WORDS.with)
    expect(tipFor('key', 'after')?.words).toBe(KEY_WORDS.after)
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

/* ── the spec links · every curated term points at ITS /spec block ── */
describe('tipHref', () => {
  it('routes concepts to the /spec blocks that own them', () => {
    expect(tipHref('permits')).toBe('/spec#permits')
    expect(tipHref('when')).toBe('/spec#s2')
    expect(tipHref('invoke')).toBe('/spec#s1')
    expect(tipHref('model')).toBe('/spec#s4')
    expect(tipHref('${{ … }}')).toBe('/spec#s0')
  })

  it('every curated tip term carries a link (the card never dead-ends)', () => {
    for (const key of Object.keys(KEY_WORDS)) {
      expect(tipHref(key), key).not.toBeNull()
    }
    for (const verb of ['infer', 'exec', 'invoke', 'agent']) {
      expect(tipHref(verb), verb).toBe('/spec#s1')
    }
  })

  it('returns null for unknown terms', () => {
    expect(tipHref('nope')).toBeNull()
  })
})

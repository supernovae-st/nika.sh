import { readFileSync } from 'node:fs'
import { join } from 'node:path'
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

  /* THE SILENCE RULE CHANGED ITS MECHANISM, not its intent (2026-07-27).
     It used to mean "only the 21 keys somebody curated speak", which left 38
     declared words — `after`, `retry`, `for_each`, `outputs`, `on_error` —
     hovering blank on the surface built to teach the language. It now means
     "only DECLARED words speak", read from the contract itself. Every piece
     of real plumbing below is not a nika word, so it stays silent exactly as
     before; the difference is that the rule is now derived instead of typed,
     and a word cannot be forgotten into silence. `id` IS declared, and having
     it explain itself is the point of the change. */
  it('stays silent on everything the contract does not declare', () => {
    expect(tipFor('key', 'path')).toBeNull() // args plumbing
    expect(tipFor('key', 'type')).toBeNull() // json-schema plumbing
    expect(tipFor('key', 'required')).toBeNull()
    expect(tipFor('key', 'properties')).toBeNull()
    expect(tipFor('key', 'url')).toBeNull()
    expect(tipFor('key', 'egress')).toBeNull()
    expect(tipFor('string', 'permits')).toBeNull() // wrong kind
    expect(tipFor('verb', 'INFER')).toBeNull() // case-sensitive canon
    expect(tipFor('key', '')).toBeNull()
  })
})

/* ── the doors · a WORD goes to its room, a BLOCK to its /spec anchor ──
   Every declared word owns a prerendered room (/language/<word>) carrying its
   full opener, its chapters, the verbs that accept it and the skeletons that
   use it. That is strictly more than a /spec anchor, and it needs no hand-kept
   map — SPEC_AT survives only for the concepts that are BLOCKS rather than
   words, which have no room to go to. */
describe('tipHref', () => {
  it('a declared word goes to its own room', () => {
    expect(tipHref('permits')).toBe('/language/permits')
    expect(tipHref('when')).toBe('/language/when')
    expect(tipHref('invoke')).toBe('/language/invoke')
    expect(tipHref('model')).toBe('/language/model')
  })

  it('a concept that is a BLOCK, not a word, keeps its /spec anchor', () => {
    expect(tipHref('${{ … }}')).toBe('/language/spec#s0')
  })

  it('every curated tip term carries a link (the card never dead-ends)', () => {
    for (const key of Object.keys(KEY_WORDS)) {
      expect(tipHref(key), key).not.toBeNull()
    }
    for (const verb of ['infer', 'exec', 'invoke', 'agent']) {
      expect(tipHref(verb), verb).toBe(`/language/${verb}`)
    }
  })

  it('returns null for unknown terms', () => {
    expect(tipHref('nope')).toBeNull()
  })

  /* THE HAND MAP MAY NOT HOLD A CORPSE. A word that gains a teaching sentence
     in the contract gains a room, and the room wins in tipHref — so its /spec
     anchor stops being reachable without anyone editing this file. That is how
     27 of the original 28 entries died silently. This re-derives reachability
     from the shipping resolver: an entry nobody can reach is deleted, not kept
     as decoration. */
  it('every SPEC_AT anchor is still REACHABLE (no entry a room now shadows)', () => {
    const src = readFileSync(join(__dirname, 'codefile-tips.ts'), 'utf8')
    const block = src.match(/const SPEC_AT[^=]*=\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''
    const keys = [...block.matchAll(/^\s*(?:'([^']+)'|([A-Za-z_$][\w$]*))\s*:/gm)].map(
      (m) => m[1] ?? m[2],
    )
    expect(keys.length, 'the SPEC_AT literal was not readable').toBeGreaterThan(0)
    const shadowed = keys.filter((k) => !String(tipHref(k)).startsWith('/language/spec'))
    expect(
      shadowed,
      `these anchors are unreachable — a room already owns the word, so delete them:\n  ${shadowed.join(' ')}`,
    ).toEqual([])
  })
})

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { WORD_OPENER, WORDS_WITHOUT_WORDS } from '../content/word-openers.generated'
import { tipFor, tipHref } from '../components/codefile-tips'
import { LANGUAGE_PATHS } from '../../site.config'

/* ── the teaching-coverage gates ──────────────────────────────────────────────
   The panel is the surface built to TEACH the language, and it hovered blank
   on more than half of it: 21 of 59 declared words had a line. The contract
   already carries a sentence for 32 — the same opener the /language rooms
   render — and nothing was joining them.

   These gates hold three things: the carry cannot drift from the twin, every
   word that has a tip also has a door to its own room, and the words the
   CONTRACT still has no sentence for are named out loud with a count that can
   only fall. Writing those sentences is the spec's job; publishing the debt
   is this site's. */

const ROOT = join(__dirname, '../..')

describe('word openers · carried from the contract, never invented', () => {
  it('the carry is exactly what the twin yields (drift gate)', () => {
    const before = readFileSync(join(ROOT, 'src/content/word-openers.generated.ts'), 'utf8')
    execFileSync('node', [join(ROOT, 'scripts/build-word-openers.mjs')], { stdio: 'pipe' })
    expect(readFileSync(join(ROOT, 'src/content/word-openers.generated.ts'), 'utf8')).toBe(before)
  })

  it('an opener is card-length and never cut mid-thought', () => {
    for (const [w, o] of Object.entries(WORD_OPENER)) {
      expect(o.length, `${w} is a paragraph, not a card`).toBeLessThanOrEqual(151)
      expect(o.trim(), `${w} is empty`).not.toBe('')
      /* the abbreviation trap: splitting on a bare period cut "e.g." and the
         "..." inside a ${{ … }} example mid-thought */
      expect(o, `${w} ends on an abbreviation`).not.toMatch(/\b(e\.g|i\.e)\.$/)
    }
  })

  it('a word with a tip always has a door to its own room', () => {
    for (const w of Object.keys(WORD_OPENER)) {
      const tip = tipFor('key', w)
      expect(tip, `${w} has an opener but no tip`).not.toBeNull()
      const href = tipHref(w)
      expect(href, `${w} has a tip but no door`).toBe(`/language/${w}`)
      expect(LANGUAGE_PATHS, `${w}'s room is not served`).toContain(`/language/${w}`)
    }
  })
})

describe('word openers · the coverage debt is published, not papered over', () => {
  /* CLOSED 2026-07-27 · nika-spec#209 wrote the missing `description` fields
     into schemas/workflow.schema.json, which is where a teaching sentence
     belongs, and the count went 19 → 0 with no website code at all.
     The ceiling stays as a RATCHET, not a trophy: a word added to the
     contract without a sentence re-opens the debt on the next build. */
  const CEILING = 0

  it('the wordless list only ever shrinks', () => {
    expect(
      WORDS_WITHOUT_WORDS.length,
      `words with no sentence anywhere (${WORDS_WITHOUT_WORDS.length} > ${CEILING}):\n  ${WORDS_WITHOUT_WORDS.join(' ')}`,
    ).toBeLessThanOrEqual(CEILING)
  })

  it('every wordless entry is a real declared word (the debt stays honest)', () => {
    const twin = JSON.parse(readFileSync(join(ROOT, 'public/ontology/language.json'), 'utf8'))
    const declared = new Set(
      twin.nodes
        .filter((n: { id?: string }) => String(n.id ?? '').startsWith('word:'))
        .map((n: { title: string }) => n.title),
    )
    for (const w of WORDS_WITHOUT_WORDS) expect(declared.has(w), `${w} is not declared`).toBe(true)
    for (const w of WORDS_WITHOUT_WORDS) expect(WORD_OPENER[w], `${w} is both listed and carried`).toBeUndefined()
  })
})

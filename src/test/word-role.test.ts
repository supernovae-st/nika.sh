import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { roleOf, ROLE_FAMILIES } from '../lib/word-role'
import { NIKA_ROLE_WORDS } from '../design-tokens.generated'
import { LANGUAGE_WORDS } from '../content/language.generated'
import { LANGUAGE_PATHS } from '../../site.config'

/* ── the role wave's gates ────────────────────────────────────────────────────
   The spec owns the classification (nika-spec design/tokens.yaml, derived by
   its projector from workflow.schema.json). Three surfaces read it — the code
   panel's tokenizer, the word room, the register — and the only failure mode
   worth guarding is two of them naming DIFFERENT families for one word.

   So these gates bind the reader-facing layer back to the projection, and
   pin the two things a hand-written voice map can get wrong: a family with no
   words, and a word with two families. */

const ROOT = join(__dirname, '../..')

describe('word roles · the register says what the panel colours', () => {
  it('every role in the projection has a reader-facing voice', () => {
    const projected = Object.keys(NIKA_ROLE_WORDS).sort()
    expect(ROLE_FAMILIES.map((f) => f.role).sort()).toEqual(projected)
    for (const f of ROLE_FAMILIES) {
      expect(f.label, `${f.role} has no label`).toBeTruthy()
      expect(f.words.length, `${f.role} has no members`).toBeGreaterThan(0)
    }
  })

  it('roleOf agrees with the projection, word for word', () => {
    for (const [role, joined] of Object.entries(NIKA_ROLE_WORDS)) {
      for (const word of joined.split(' ')) {
        expect(roleOf(word)?.role, `${word} should be ${role}`).toBe(role)
      }
    }
  })

  it('a word carries at most ONE family', () => {
    const all = Object.values(NIKA_ROLE_WORDS).flatMap((j) => j.split(' '))
    expect(all.length, `a word claims two roles: ${all.join(' ')}`).toBe(new Set(all).size)
  })

  it('a word outside every family has no role (silence is the default)', () => {
    const classified = new Set(Object.values(NIKA_ROLE_WORDS).flatMap((j) => j.split(' ')))
    const plain = LANGUAGE_WORDS.map((w) => w.word).filter((w) => !classified.has(w))
    expect(plain.length, 'every declared word got a family — that cannot be right').toBeGreaterThan(
      20,
    )
    for (const w of plain.slice(0, 12)) expect(roleOf(w), w).toBeNull()
  })

  /* THE ROOM IS WHERE A READER MEETS THIS, so every classified word must have
     one. A role naming a word with no room would tint a page that does not
     exist. */
  it('every classified word owns a room', () => {
    for (const word of Object.values(NIKA_ROLE_WORDS).flatMap((j) => j.split(' '))) {
      expect(LANGUAGE_PATHS, `${word} is classified but has no room`).toContain(
        `/language/${word}`,
      )
    }
  })

  /* the hues are the PANEL's, never new ones — the same fact must wear the
     same colour in a YAML file and in the room that teaches the word */
  it('the room reuses the panel tokens rather than inventing hues', () => {
    const css = readFileSync(join(ROOT, 'src/pages/tool-detail.css'), 'utf8')
    const block = css.slice(css.indexOf('.wd-role'))
    for (const token of ['--cf-key', '--cf-ref', '--danger']) {
      expect(block, `the role line stopped using ${token}`).toContain(token)
    }
    const hexes = [...block.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0])
    expect(hexes, `a raw hex appeared in the role styling: ${hexes.join(' ')}`).toEqual([])
  })
})

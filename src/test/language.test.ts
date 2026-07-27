import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { LANGUAGE_SCOPES, LANGUAGE_WORDS, WORD_INDEX } from '../content/language.generated'
import { WORD_GLOSS } from '../content/language-meta'
import { WORD_PROSE } from '../content/language-prose.generated'
import { CHAPTERS } from '../sections/verbs-data'
import { CANON } from '../canon.generated'
import { LANGUAGE_PATHS, VERB_PATHS, PATHS } from '../../site.config'

/* ── the language-register drift gates ────────────────────────────────────────
   public/schema/workflow.json is the source (the served contract);
   src/content/language.generated.ts is the compiled projection the
   /language register and the /verbs rooms render. The gate recompiles and
   byte-diffs — editing the schema without `node scripts/build-language.mjs`
   goes red here, never silently stale to prod. The verb-flagged set pins
   against CANON.verbNames (spec canon.yaml). */

const ROOT = join(__dirname, '../..')

describe('/language · the compiled projection matches the served schema', () => {
  /* BOTH halves, or the gate guards the half that cannot grow. The compiler
     emits the light index AND the prose module; gating only the index would
     let every teaching sentence drift unwatched — which is precisely the half
     that changes every time the contract teaches another word. */
  it('both emitted modules are exactly what the compiler emits today', () => {
    const paths = [
      join(ROOT, 'src/content/language.generated.ts'),
      join(ROOT, 'src/content/language-prose.generated.ts'),
    ]
    const committed = paths.map((p) => readFileSync(p, 'utf8'))
    execFileSync('node', [join(ROOT, 'scripts/build-language.mjs')])
    for (const [i, p] of paths.entries()) {
      expect(readFileSync(p, 'utf8'), p).toBe(committed[i])
    }
  })

  /* THE INDEX STAYS LIGHT. It rides the entry chunk for every visitor, so a
     `desc` creeping back into a declaration is a 3.9 KB regression nobody
     would notice until the budget bit. */
  it('the entry-resident index carries NO prose', () => {
    const src = readFileSync(join(ROOT, 'src/content/language.generated.ts'), 'utf8')
    expect(src.includes('"desc"'), 'a description leaked back into the light index').toBe(false)
  })

  it('the verb-flagged words ARE the canon verbs (exactly)', () => {
    const verbs = LANGUAGE_WORDS.filter((w) => w.verb).map((w) => w.word)
    expect(new Set(verbs)).toEqual(new Set(CANON.verbNames))
    /* and the four rooms exist for exactly those */
    expect(new Set(VERB_PATHS)).toEqual(new Set(CANON.verbNames.map((v) => `/verbs/${v}`)))
    /* the rooms' chapters cover every verb */
    expect(new Set(CHAPTERS.map((c) => c.verb))).toEqual(new Set(CANON.verbNames))
  })

  it('every word row can speak — a schema desc or the editorial gloss', () => {
    for (const w of LANGUAGE_WORDS) {
      const spoken = (WORD_PROSE[w.word] ?? []).some(Boolean) || Boolean(WORD_GLOSS[w.word])
      expect(spoken, `${w.word} has neither a schema description nor a gloss`).toBe(true)
    }
  })

  it('declarations ride known surfaces, reading order', () => {
    const order: string[] = LANGUAGE_SCOPES.map((s) => s.scope)
    for (const w of LANGUAGE_WORDS) {
      expect(w.decls.length, w.word).toBeGreaterThan(0)
      const idx = w.decls.map((d) => order.indexOf(d.scope))
      expect(idx.includes(-1), `${w.word} scope set`).toBe(false)
      expect([...idx].sort((a, b) => a - b), `${w.word} scope order`).toEqual(idx)
      expect(WORD_INDEX[w.word], w.word).toBe(w)
    }
  })

  it('/language and /verbs prerender, and every word owns its deep page', () => {
    expect(PATHS).toContain('/language')
    expect(PATHS).toContain('/verbs')
    expect(new Set(LANGUAGE_PATHS)).toEqual(
      new Set(LANGUAGE_WORDS.map((w) => `/language/${w.word}`)),
    )
  })

  it('no gloss shadows a schema-described word, and none is orphaned', () => {
    /* a gloss exists ONLY for words the schema leaves silent — the schema's
       voice wins the row the moment it speaks (never two voices) */
    for (const [word, gloss] of Object.entries(WORD_GLOSS)) {
      const entry = WORD_INDEX[word]
      expect(entry, `gloss for unknown word "${word}"`).toBeDefined()
      expect(typeof gloss).toBe('string')
      expect(
        !(WORD_PROSE[word] ?? []).some(Boolean),
        `"${word}" carries a schema description — drop its gloss (one voice)`,
      ).toBe(true)
    }
  })
})

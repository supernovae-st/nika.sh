import { describe, expect, it } from 'vitest'
import { NIKA_ROLE_WORDS, type NikaRoleName } from '../design-tokens.generated'
import { roleOf } from '../lib/word-role'
import { tokenize } from '../components/codefile-highlight'
import { nikaSpansOf } from '../pages/play-editor-voice'

/* ─── the three-way role parity gate ──────────────────────────────────────────
   The language classifies every declared word into at most one semantic role,
   and THREE surfaces on this site paint that classification: the static code
   panel (tokenize · the FILE pass, which carries an indent stack), the live
   editor (the mark regex), and the register (word-role, read by /language).

   Until 2026-07-28 only two of the three did. The editor's marks covered verbs,
   refs and bare values and stopped there, so `permits:` was the boundary in a
   panel and an ordinary key in the playground. Nobody could see it because the
   two never appeared on the same page — and the moment every file on this site
   becomes editable, that difference lands under the reader's cursor.

   Discipline was never going to hold this. So it is a gate: every word the
   projection declares must be classified identically by all three, and adding a
   role upstream fails here until every surface has learned it. */

const WORDS: ReadonlyArray<readonly [NikaRoleName, string]> = (
  Object.keys(NIKA_ROLE_WORDS) as NikaRoleName[]
).flatMap((role) => NIKA_ROLE_WORDS[role].split(' ').map((w) => [role, w] as const))

/** what the LIVE EDITOR makes of `word` in a document — the role name its
    span carries, read off nikaSpansOf (the editor's one seam over tokenize) */
function editorRoleOf(doc: string, word: string): string | null {
  const at = doc.indexOf(word)
  for (const s of nikaSpansOf(doc).spans) {
    if (s.from > at || s.to < at + word.length) continue
    const m = s.cls.match(/cm-nika-role--(\w+)/)
    if (m) return m[1]
  }
  return null
}

/** what the STATIC PANEL makes of the same line.
    tokenize(), never tokenizeLine(): the line pass is deliberately local and
    assigns no role at all — the classification lives in the file pass, which
    walks an indent stack. Asking the wrong one returns undefined for every
    word on earth, which is a very convincing way to fail. */
function panelRoleOf(word: string): string | undefined {
  const [line] = tokenize(`${word}: value`)
  return line.tokens.find((t) => t.text.trim() === word)?.role
}

describe('semantic roles · the same word, the same family, on all three surfaces', () => {
  it('has words to judge (an empty projection would pass every test below)', () => {
    expect(WORDS.length).toBeGreaterThan(10)
  })

  it.each(WORDS)('%s · %s reads the same in panel, editor and register', (role, word) => {
    expect(panelRoleOf(word), `the static panel lost ${word}`).toBe(role)
    expect(editorRoleOf(`${word}: value`, word), `the live editor lost ${word}`).toBe(role)
    expect(roleOf(word)?.role, `the register lost ${word}`).toBe(role)
  })

  it('leaves a word the contract gives no role alone, on every surface', () => {
    /* `prompt` is declared but carries no family — a surface that tinted it
       would be inventing a classification the spec did not make */
    expect(panelRoleOf('prompt')).toBeUndefined()
    expect(editorRoleOf('prompt: value', 'prompt')).toBeNull()
    expect(roleOf('prompt')).toBeNull()
  })

  it('does not mistake a role word for a role in VALUE position', () => {
    /* `retry` is failure grammar as a KEY. As a value it is just a word. */
    expect(editorRoleOf('retry: 3', 'retry')).toBe('fail')
    const doc = 'on_error: retry'
    const valueAt = doc.indexOf('retry')
    const valueSpans = nikaSpansOf(doc).spans.filter((s) => s.from >= valueAt)
    expect(
      valueSpans.some((s) => s.cls.includes('cm-nika-role')),
      'a value must not read as a role key',
    ).toBe(false)
  })

  it('CONVERGED · position overrules spelling on BOTH surfaces now', () => {
    /* This test used to RECORD a divergence: the panel demoted `exec:` under
       `permits:` (a permit category, not the act) while the editor's regex —
       knowing only spelling — kept painting it as the orange verb. The regex
       is dead; both surfaces are tokenize(). What was a named gap is now a
       held law, and this asserts it can never quietly reopen. */
    const doc = 'permits:\n  exec: ["git"]\n'
    const inside = tokenize(doc)
    const execKey = inside[1].tokens.find((t) => t.text.trim() === 'exec')
    expect(execKey?.kind, 'the panel demotes a verb-spelled permit category').toBe('key')
    expect(execKey?.role, 'and gives it the boundary').toBe('boundary')

    expect(editorRoleOf(doc, 'exec'), 'the editor demotes it identically').toBe('boundary')
    const execAt = doc.indexOf('exec')
    const verbSpan = nikaSpansOf(doc).spans.some(
      (s) => s.from <= execAt && s.to >= execAt + 4 && s.cls.includes('cm-nika-verb'),
    )
    expect(verbSpan, 'and never paints it as the verb').toBe(false)
  })
})

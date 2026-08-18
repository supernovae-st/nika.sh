import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { NIKA_ROLE_WORDS } from '../design-tokens.generated'
import { tokenize } from '../components/codefile-highlight'

/* ── the semantic layer's gates ───────────────────────────────────────────────
   The panel colours by CONTRACT: every declared word's legal scopes come from
   the served language twin, and the tokenizer resolves the role from the
   PARENT CHAIN. Three things must hold, and the third is the one that makes
   the whole idea worth having.

   PROMOTED 2026-07-27, as the note here promised: the role memberships now
   live in nika-spec design/tokens.yaml and are DERIVED by its projector from
   schemas/workflow.schema.json — the same module the vscode extension reads,
   so an editor and this panel cannot disagree about what a word MEANS.

   That moved the drift gate too, and made it STRONGER. A byte-diff against a
   local script only proved the script had been re-run. This re-derives the
   closure from the served twin — an independent second opinion on the spec's
   own derivation — so the two can never quietly disagree. The spec-side pin
   (spec-resync.contract.json · generator `spec-design`) covers the emission
   itself. */

const ROOT = join(__dirname, '../..')
const words = (role: keyof typeof NIKA_ROLE_WORDS) => NIKA_ROLE_WORDS[role].split(' ')
const BOUNDARY_WORDS = words('boundary')
const WIRE_WORDS = words('wire')
const FAIL_WORDS = words('fail')

/** the served twin's word → its declared scopes */
const twinScopes = (): Record<string, string[]> => {
  const twin = JSON.parse(readFileSync(join(ROOT, 'public/ontology/language.json'), 'utf8'))
  return Object.fromEntries(
    twin.nodes
      .filter((n: { id?: string }) => String(n.id ?? '').startsWith('word:'))
      .map((n: { title: string; meta?: { scopes?: string[] } }) => [n.title, n.meta?.scopes ?? []]),
  )
}

describe('code roles · derived in the spec, re-derived here', () => {
  it('every role word is a word the contract actually declares', () => {
    const declared = new Set(Object.keys(twinScopes()))
    expect(declared.size).toBeGreaterThan(40)
    for (const w of [...BOUNDARY_WORDS, ...WIRE_WORDS, ...FAIL_WORDS]) {
      expect(declared.has(w), `${w} is not a declared word`).toBe(true)
    }
  })

  it('the failure closure re-derives from the twin, exactly', () => {
    /* the spec's rule, applied independently: a word whose ONLY scopes are
       recovery scopes IS failure grammar, plus the three authored heads
       (0.109 · on_finally left the grammar: cleanup is a task on an unwind
       edge, and fail_workflow left on_error — failing loudly is the default) */
    const RECOVERY = new Set(['on_error', 'retry'])
    const derived = new Set(['on_error', 'retry', 'recover'])
    for (const [word, scopes] of Object.entries(twinScopes())) {
      if (scopes.length && scopes.every((s) => RECOVERY.has(s))) derived.add(word)
    }
    expect([...derived].sort()).toEqual([...FAIL_WORDS].sort())
  })

  it('a word carries at most ONE role (the roles never overlap)', () => {
    const all = [...BOUNDARY_WORDS, ...WIRE_WORDS, ...FAIL_WORDS]
    expect(all.length, `a word claims two roles: ${all.join(' ')}`).toBe(new Set(all).size)
  })
})

describe('code roles · POSITION overrules spelling', () => {
  /** the resolved role (or the kind) of the first key/verb token on a line */
  const head = (yaml: string, line: number) => {
    const t = tokenize(yaml)[line - 1].tokens.find((x) => x.kind === 'key' || x.kind === 'verb')
    return t ? { kind: t.kind, role: t.role, text: t.text.trim() } : null
  }

  /* THE CASE THIS EXISTS FOR. `exec` is spelled identically in both places and
     means opposite things: under `permits:` it names a program the plan may
     launch (the boundary), under a task it IS the act. A word-list highlighter
     gets exactly one of these right. */
  const both = [
    'nika: v1',
    'permits:',
    '  exec: [ git ]',
    '  tools: [ "nika:read" ]',
    'tasks:',
    '  diff:',
    '    exec: { command: [ git, diff ] }',
  ].join('\n')

  it('`exec` under permits is the BOUNDARY, not the act', () => {
    expect(head(both, 3)).toMatchObject({ kind: 'key', role: 'boundary', text: 'exec' })
  })

  it('`exec` under a task is still the act, with its verb identity intact', () => {
    expect(head(both, 7)).toMatchObject({ kind: 'verb', text: 'exec' })
    expect(head(both, 7)?.role).toBeUndefined()
  })

  it('`tools` inherits the boundary from its parent, not from its spelling', () => {
    expect(head(both, 4)).toMatchObject({ role: 'boundary', text: 'tools' })
    const underAgent = ['tasks:', '  t:', '    agent:', '      tools: [ "nika:read" ]'].join('\n')
    expect(head(underAgent, 4)?.role).toBeUndefined()
  })

  it('the wiring keys carry the ref role (the binding IS the edge)', () => {
    const y = ['tasks:', '  b:', '    with:', '      x: 1', '    after: { a: succeeded }'].join('\n')
    expect(head(y, 3)).toMatchObject({ role: 'wire', text: 'with' })
    expect(head(y, 5)).toMatchObject({ role: 'wire', text: 'after' })
  })

  it('the failure grammar reads as refusals', () => {
    const y = ['tasks:', '  t:', '    on_error:', '      recover: { value: 1 }'].join('\n')
    expect(head(y, 3)).toMatchObject({ role: 'fail', text: 'on_error' })
  })

  it('a plain envelope key keeps frame ink (colour is spent, not sprayed)', () => {
    const y = ['nika: v1', 'workflow:', '  id: x', '  description: y'].join('\n')
    for (const l of [1, 2, 3, 4]) expect(head(y, l)?.role).toBeUndefined()
  })
})

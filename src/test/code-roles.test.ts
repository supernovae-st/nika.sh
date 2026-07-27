import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { BOUNDARY_WORDS, WIRE_WORDS, FAIL_WORDS, DECLARED_COUNT } from '../content/code-roles.generated'
import { tokenize } from '../components/codefile-highlight'

/* ── the semantic layer's gates ───────────────────────────────────────────────
   The panel colours by CONTRACT: every declared word's legal scopes come from
   the served language twin, and the tokenizer resolves the role from the
   PARENT CHAIN. Three things must hold, and the third is the one that makes
   the whole idea worth having.

   Promotion note: when design/tokens.yaml carries the roles, the derivation
   moves to the spec's projector and only the first gate changes source. */

const ROOT = join(__dirname, '../..')

describe('code roles · derived from the twin, never authored', () => {
  it('the generated table is exactly what the deriver emits (drift gate)', () => {
    const before = readFileSync(join(ROOT, 'src/content/code-roles.generated.ts'), 'utf8')
    execFileSync('node', [join(ROOT, 'scripts/build-code-roles.mjs')], { stdio: 'pipe' })
    const after = readFileSync(join(ROOT, 'src/content/code-roles.generated.ts'), 'utf8')
    expect(after).toBe(before)
  })

  it('every role word is a word the contract actually declares', () => {
    const twin = JSON.parse(readFileSync(join(ROOT, 'public/ontology/language.json'), 'utf8'))
    const declared = new Set(
      twin.nodes
        .filter((n: { id?: string }) => String(n.id ?? '').startsWith('word:'))
        .map((n: { title: string }) => n.title),
    )
    expect(declared.size).toBe(DECLARED_COUNT)
    for (const w of [...BOUNDARY_WORDS, ...WIRE_WORDS, ...FAIL_WORDS]) {
      expect(declared.has(w), `${w} is not a declared word`).toBe(true)
    }
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

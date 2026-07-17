import { describe, expect, it } from 'vitest'
import { ACTIONS, actionEntries, blogSlugOf, snippetWithProvenance } from '../lib/palette-actions'
import { variantsFor } from '../lib/i18n'
import { parseQuery } from '../lib/palette-query'

/* ── the action gates (round-2B) ─────────────────────────────────────────────
   Every when() is pure and proven · the locale rows equal variantsFor (the
   i18n gate extends — never a hand list) · copy-snippet emits EXACTLY the
   yaml + the provenance header. */

const ctx = (path: string, hasSnippet = false) => ({ path, hasSnippet })

describe('palette actions · pure whens, derived rows', () => {
  it('action ids are unique', () => {
    const ids = ACTIONS.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('copy-twin-url fires everywhere', () => {
    const a = ACTIONS.find((x) => x.id === 'copy-twin-url')!
    expect(a.when(ctx('/'))).toBe(true)
    expect(a.when(ctx('/errors/NIKA-PARSE-001'))).toBe(true)
  })

  it('copy-snippet fires only where a CodeFile is visible', () => {
    const a = ACTIONS.find((x) => x.id === 'copy-snippet')!
    expect(a.when(ctx('/tools/fetch', true))).toBe(true)
    expect(a.when(ctx('/errors', false))).toBe(false)
  })

  it('copy-post-md fires only on a post (§2c made it legal)', () => {
    const a = ACTIONS.find((x) => x.id === 'copy-post-md')!
    expect(a.when(ctx('/blog/intent-as-code'))).toBe(true)
    expect(a.when(ctx('/blog'))).toBe(false)
    expect(a.when(ctx('/tools/fetch'))).toBe(false)
    expect(blogSlugOf('/blog/four-verbs')).toBe('four-verbs')
    expect(blogSlugOf('/blog/four-verbs/x')).toBeNull()
  })

  it('locale rows equal variantsFor, self excluded (the i18n gate extends)', () => {
    const path = '/manifesto'
    const rows = actionEntries(ctx(path)).filter((e) => e.id.startsWith('locale:'))
    const expected = variantsFor(path).filter((v) => v.path !== path)
    expect(rows.length).toBe(expected.length)
    for (const v of expected) {
      expect(rows.some((r) => r.id === `locale:${v.locale.bcp47}` && r.hint.includes(v.path))).toBe(true)
    }
    expect(actionEntries(ctx('/errors')).filter((e) => e.id.startsWith('locale:'))).toEqual([])
  })

  it('copy-snippet emits EXACTLY the yaml + the provenance header (byte-tested)', () => {
    const doc = {
      querySelector: (sel: string) =>
        sel === '.cf-pre'
          ? { textContent: 'nika: v1\nworkflow:\n  id: demo' }
          : { href: 'https://github.com/supernovae-st/nika-spec/blob/main/templates/x.yaml' },
    } as unknown as Document
    expect(snippetWithProvenance(doc, '/tools/fetch')).toBe(
      '# from nika.sh/tools/fetch\n# source: https://github.com/supernovae-st/nika-spec/blob/main/templates/x.yaml\nnika: v1\nworkflow:\n  id: demo\n',
    )
  })

  it('the > prefix scopes to actions (the VS Code precedent)', () => {
    expect(parseQuery('>copy')).toEqual({ kind: 'action', needle: 'copy' })
    expect(parseQuery('> copy')).toEqual({ kind: 'action', needle: 'copy' })
    expect(parseQuery('copy')).toEqual({ needle: 'copy' })
  })
})

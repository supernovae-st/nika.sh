import { describe, expect, it } from 'vitest'
import { parseQuery, KIND_PREFIX, mergePageHits, normalizePagePath } from '../lib/palette-query'
import { PALETTE } from '../content/palette.generated'

/* ── the ⌘K prefix grammar (WO-12) ────────────────────────────────────────────
   The parse is pure; these gates pin the grammar's three laws: a known
   prefix scopes, an unknown prefix NEVER narrows (a colon in a real query
   stays a plain query), and every alias points at a kind the corpus
   actually carries (a palette regeneration that drops a kind goes red). */

describe('palette-query · the prefix grammar', () => {
  it('a known prefix scopes and hands back the needle', () => {
    expect(parseQuery('e:timeout')).toEqual({ kind: 'error', needle: 'timeout' })
    expect(parseQuery('t:fetch')).toEqual({ kind: 'tool', needle: 'fetch' })
    expect(parseQuery('E: DAG')).toEqual({ kind: 'error', needle: 'DAG' })
    expect(parseQuery('blog:drum')).toEqual({ kind: 'post', needle: 'drum' })
    expect(parseQuery('v:')).toEqual({ kind: 'verb', needle: '' })
    expect(parseQuery('s:edge')).toEqual({ kind: 'set', needle: 'edge' })
  })

  it('an unknown prefix is NOT a filter — the query stays whole', () => {
    expect(parseQuery('re:try')).toEqual({ needle: 're:try' })
    expect(parseQuery('nika:fetch')).toEqual({ needle: 'nika:fetch' })
    expect(parseQuery('x:')).toEqual({ needle: 'x:' })
  })

  it('no colon → no scope', () => {
    expect(parseQuery('timeout')).toEqual({ needle: 'timeout' })
    expect(parseQuery('')).toEqual({ needle: '' })
  })

  it('every alias lands on a kind the corpus really carries', () => {
    const kinds = new Set(PALETTE.map((e) => e.kind))
    for (const [alias, kind] of Object.entries(KIND_PREFIX)) {
      expect(kinds.has(kind), `${alias}: → ${kind} has no corpus entries`).toBe(true)
    }
  })
})

describe('palette stage 2 · the pagefind merge stays lawful', () => {
  it('normalizes every url form pagefind can return', () => {
    expect(normalizePagePath('https://nika.sh/blog/foo/')).toBe('/blog/foo')
    expect(normalizePagePath('/tools/fetch/index.html')).toBe('/tools/fetch')
    expect(normalizePagePath('/')).toBe('/')
  })

  it('dedups against the register stage, strips marks, honors the cap', () => {
    const taken = new Set(['/tools/fetch'])
    const rows = mergePageHits(
      taken,
      [
        { url: '/tools/fetch/', title: 'fetch', excerpt: 'already <mark>taken</mark>' },
        { url: '/blog/foo/', title: 'Foo', excerpt: 'a <mark>hit</mark>  with   marks' },
        { url: '/blog/foo/index.html', title: 'Foo dup', excerpt: 'same page twice' },
        { url: '/blog/bar/', title: 'Bar', excerpt: 'second' },
      ],
      1,
    )
    expect(rows).toEqual([{ kind: 'pagetext', label: 'Foo', href: '/blog/foo', hint: 'a hit with marks' }])
  })
})

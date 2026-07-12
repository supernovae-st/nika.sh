import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  ECOSYSTEM,
  SPEC_CHAPTERS,
  TOOL_SOURCES,
  VERB_SOURCES,
  SOURCE_GLYPH,
  sourcesForWord,
  type SourceLink,
} from '../content/sources'
import { LANGUAGE_WORDS } from '../content/language.generated'
import { PATHS } from '../../site.config'

/* ── the sources-map drift gates ──────────────────────────────────────────────
   sources.ts is the ONE map of where the language lives; these gates keep
   it honest: internal hrefs must be prerendered routes or served files,
   external hrefs must live at the verified homes (the supernovae-st org ·
   docs.nika.sh), the chapter list pins the spec repo's REAL tree (verified
   2026-07-13 via `gh api repos/supernovae-st/nika-spec/contents/spec` —
   re-verify the same way before editing), and every word resolves a
   non-empty rail whose first link is normative prose. */

const ROOT = join(__dirname, '../..')

const ALL_RAILS: [string, SourceLink[]][] = [
  ['ECOSYSTEM', ECOSYSTEM],
  ['TOOL_SOURCES', TOOL_SOURCES],
  ['VERB_SOURCES', VERB_SOURCES],
  ...LANGUAGE_WORDS.map((w): [string, SourceLink[]] => [`word:${w.word}`, sourcesForWord(w)]),
]

describe('sources.ts · where the language lives, kept honest', () => {
  it('the chapter list IS the spec repo tree (00→08, nine files)', () => {
    expect([...SPEC_CHAPTERS]).toEqual([
      '00-overview.md',
      '01-envelope.md',
      '02-verbs.md',
      '03-dag.md',
      '04-variables.md',
      '05-errors.md',
      '06-stdlib-contract.md',
      '07-conformance.md',
      '08-out-of-scope.md',
    ])
  })

  it('every internal href is a prerendered route or a served public file', () => {
    for (const [rail, links] of ALL_RAILS) {
      for (const l of links) {
        if (l.href.startsWith('http')) continue
        const ok =
          PATHS.includes(l.href) ||
          existsSync(join(ROOT, 'public', ...l.href.replace(/^\//, '').split('/')))
        expect(ok, `${rail} → ${l.href} is neither a route nor a public file`).toBe(true)
      }
    }
  })

  it('every external href lives at a verified home', () => {
    const HOMES = ['https://github.com/supernovae-st/', 'https://docs.nika.sh']
    for (const [rail, links] of ALL_RAILS) {
      for (const l of links) {
        if (!l.href.startsWith('http')) continue
        expect(
          HOMES.some((h) => l.href.startsWith(h)),
          `${rail} → ${l.href} is off the verified homes`,
        ).toBe(true)
      }
    }
  })

  it('spec-chapter links cite real chapter files only', () => {
    const files = new Set<string>(SPEC_CHAPTERS)
    for (const [rail, links] of ALL_RAILS) {
      for (const l of links) {
        const m = l.href.match(/\/blob\/main\/spec\/(.+)$/)
        if (m) expect(files.has(m[1]), `${rail} → phantom chapter ${m[1]}`).toBe(true)
      }
    }
  })

  it('every word resolves a rail — normative prose first, no duplicate hrefs', () => {
    for (const w of LANGUAGE_WORDS) {
      const rail = sourcesForWord(w)
      expect(rail.length, w.word).toBeGreaterThanOrEqual(4)
      expect(rail[0].kind, `${w.word} leads with its spec chapter`).toBe('spec')
      const hrefs = rail.map((l) => l.href + l.label)
      expect(new Set(hrefs).size, `${w.word} rail duplicates`).toBe(hrefs.length)
    }
  })

  it('every kind carries its glyph and every link its hint', () => {
    for (const [rail, links] of ALL_RAILS) {
      for (const l of links) {
        expect(SOURCE_GLYPH[l.kind], `${rail} → ${l.label} kind`).toBeTruthy()
        expect(l.hint.length, `${rail} → ${l.label} hint`).toBeGreaterThan(10)
      }
    }
  })
})

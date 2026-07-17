import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { LOCALES, LOCALIZED } from '../lib/i18n'

/* ── content/i18n · the translation-corpus gates (WO-10) ─────────────────────
   Three laws from content/i18n/README.md, held structurally:

   1 · PARITY — every locale file carries exactly the EN twin's key shape
       (a missing gloss or an invented section cannot ship silently);
   2 · LEXICON — public/i18n/untranslatables.json (derived from the language
       graph by build-atlas) is the floor: a lexicon token present in an EN
       value survives byte-verbatim in every translation of that value
       (a translated `after:` cannot exist · the drift is NAMED);
   3 · ANTI-SLOP — drafts exist ≠ pages ship: a locale dir here NOT yet in
       the LOCALIZED registry is legal (parked for review); a LOCALIZED row
       whose content file is missing is NOT (announced page must exist).

   The em-dash voice law (G.5) extends to translations: authored copy in any
   locale never uses the em dash (CJK punctuation has its own registers —
   the dash-of-attribution stays out of all of them). */

const ROOT = join(__dirname, '../..')
const I18N = join(ROOT, 'content/i18n')

const LEXICON = (
  JSON.parse(readFileSync(join(ROOT, 'public/i18n/untranslatables.json'), 'utf8')) as {
    entries: string[]
  }
).entries

/* word-ish lexicon tokens can collide with prose ("run", "workflow") —
   the verbatim law binds tokens as they appear in CODE POSITION (inside
   backticks) in the EN twin; bare-prose occurrences are voice, not vocab. */
const codeTokens = (value: string): string[] => {
  const out: string[] = []
  for (const m of value.matchAll(/`([^`]+)`/g)) {
    const inner = m[1]
    if (LEXICON.some((t) => inner === t || inner.startsWith(`${t} `) || inner.includes(t)))
      out.push(inner)
  }
  return out
}

type Tree = Record<string, unknown>

function* leaves(node: unknown, path: string[] = []): Generator<[string, string]> {
  if (typeof node === 'string') yield [path.join('.'), node]
  else if (Array.isArray(node))
    for (let i = 0; i < node.length; i++) yield* leaves(node[i], [...path, String(i)])
  else if (node && typeof node === 'object')
    for (const [k, v] of Object.entries(node as Tree)) yield* leaves(v, [...path, k])
}

const shapeOf = (node: unknown): unknown => {
  if (typeof node === 'string') return 's'
  if (Array.isArray(node)) return node.map(shapeOf)
  if (node && typeof node === 'object')
    return Object.fromEntries(
      Object.entries(node as Tree)
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([k, v]) => [k, shapeOf(v)]),
    )
  return typeof node
}

const localeDirs = readdirSync(I18N, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort()

describe('content/i18n · the corpus structure', () => {
  it('the en twin exists and every locale dir is a registered locale', () => {
    expect(localeDirs).toContain('en')
    const known = new Set(LOCALES.map((l) => l.prefix || 'en'))
    for (const dir of localeDirs) expect(known.has(dir), `unknown locale dir ${dir}`).toBe(true)
  })

  it('every LOCALIZED registry row whose page has an i18n file here is covered per locale', () => {
    /* law 3 · the announced direction: a registry row must have its content.
       (manifesto predates this tree — its copy lives in manifesto-copy.ts,
       exempted by name until it migrates.) */
    for (const [base, prefixes] of Object.entries(LOCALIZED)) {
      if (base === '/manifesto') continue
      const name = `${base.replace(/^\//, '')}.yaml`
      for (const p of prefixes) {
        expect(
          existsSync(join(I18N, p, name)),
          `${base} announces ${p} but content/i18n/${p}/${name} is missing`,
        ).toBe(true)
      }
    }
  })
})

const pages = localeDirs.includes('en')
  ? readdirSync(join(I18N, 'en')).filter((f) => f.endsWith('.yaml'))
  : []

describe.each(pages.map((p) => [p] as const))('content/i18n · %s', (page) => {
  const en = parse(readFileSync(join(I18N, 'en', page), 'utf8')) as Tree
  const enLeaves = new Map([...leaves(en)])
  const translated = localeDirs.filter((d) => d !== 'en' && existsSync(join(I18N, d, page)))

  it('the en twin is non-trivial', () => {
    expect(enLeaves.size).toBeGreaterThan(10)
  })

  it.each(translated.map((l) => [l] as const))('%s · key parity with the en twin', (locale) => {
    const doc = parse(readFileSync(join(I18N, locale, page), 'utf8')) as Tree
    expect(shapeOf(doc), `${locale}/${page} shape != en/${page}`).toEqual(shapeOf(en))
  })

  it.each(translated.map((l) => [l] as const))(
    '%s · lexicon tokens survive byte-verbatim',
    (locale) => {
      const doc = parse(readFileSync(join(I18N, locale, page), 'utf8')) as Tree
      const locLeaves = new Map([...leaves(doc)])
      for (const [key, enValue] of enLeaves) {
        const tokens = codeTokens(enValue)
        if (tokens.length === 0) continue
        const locValue = locLeaves.get(key)
        expect(locValue, `${locale}/${page} missing leaf ${key}`).toBeTypeOf('string')
        for (const t of tokens) {
          expect(
            (locValue as string).includes(`\`${t}\``),
            `${locale}/${page} · ${key}: lexicon token \`${t}\` was translated or dropped`,
          ).toBe(true)
        }
      }
    },
  )

  it.each(translated.map((l) => [l] as const))('%s · every leaf is authored (non-empty)', (locale) => {
    const doc = parse(readFileSync(join(I18N, locale, page), 'utf8')) as Tree
    for (const [key, v] of leaves(doc)) {
      expect(v.trim().length, `${locale}/${page} · ${key} is empty`).toBeGreaterThan(0)
    }
  })

  it.each([...translated, 'en'].map((l) => [l] as const))('%s · no em dash in authored copy', (locale) => {
    const raw = readFileSync(join(I18N, locale, page), 'utf8')
    expect(raw.includes('—'), `${locale}/${page} carries an em dash`).toBe(false)
  })
})

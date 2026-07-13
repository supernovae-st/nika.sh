import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { WORD_USAGE } from '../content/language-usage.generated'
import { WORD_USAGE_REFS } from '../content/language-usage-refs.generated'
import { LANGUAGE_WORDS } from '../content/language.generated'
import { TEMPLATE_INDEX } from '../content/templates.generated'
import { ERROR_CODES } from '../content/errors.generated'

/* ── the word-room drift gates ────────────────────────────────────────────────
   Every /language/<word> room shows the word inside a real file
   (language-usage.generated.ts). The tool-usage laws, applied to the
   language itself:

   1 · REGEN — the module is exactly what the compiler emits from today's
       inputs (pack + crafted files + registries).
   2 · FIDELITY — a template excerpt is a VERBATIM slice of its donor at
       the line it claims; a crafted excerpt re-slices from its file.
   3 · HONESTY — coverage is exact-set over the schema words; a usage
       panel always CONTAINS its word as a key; cross-refs point at
       registered templates/codes only; verbs carry no usage (their rooms
       own the complete file). */

const ROOT = join(__dirname, '../..')

describe('/language/:word · the usage projection matches its sources', () => {
  it('language-usage.generated.ts (and its refs twin) is exactly what the compiler emits today', () => {
    const path = join(ROOT, 'src/content/language-usage.generated.ts')
    const refsPath = join(ROOT, 'src/content/language-usage-refs.generated.ts')
    const committed = readFileSync(path, 'utf8')
    const committedRefs = readFileSync(refsPath, 'utf8')
    execFileSync('node', [join(ROOT, 'scripts/build-language-usage.mjs')])
    expect(readFileSync(path, 'utf8')).toBe(committed)
    expect(readFileSync(refsPath, 'utf8')).toBe(committedRefs)
  })

  it('the refs twin IS the registry projected (graph.ts inverts the twin)', () => {
    expect(WORD_USAGE_REFS).toEqual(
      Object.fromEntries(
        Object.entries(WORD_USAGE).map(([k, e]) => [
          k,
          { templates: e.templates, codes: e.codes },
        ]),
      ),
    )
  })

  it('every schema word owns an entry (exact set, both ways)', () => {
    expect(new Set(Object.keys(WORD_USAGE))).toEqual(new Set(LANGUAGE_WORDS.map((w) => w.word)))
  })

  it('template excerpts are verbatim slices of their donor at the claimed line', () => {
    for (const e of Object.values(WORD_USAGE)) {
      if (e.usage?.source.kind !== 'template') continue
      const donor = TEMPLATE_INDEX[e.usage.source.name]
      expect(donor, `${e.word} cites skeleton "${e.usage.source.name}"`).toBeDefined()
      const lines = e.usage.yaml.split('\n')
      const slice = donor.yaml
        .split('\n')
        .slice(e.usage.source.firstLine - 1, e.usage.source.firstLine - 1 + lines.length)
        .join('\n')
      expect(slice, `${e.word} excerpt drifted from ${donor.file}`).toBe(e.usage.yaml)
    }
  })

  it('crafted excerpts re-slice from their checked-in file', () => {
    for (const e of Object.values(WORD_USAGE)) {
      if (e.usage?.source.kind !== 'crafted') continue
      const disk = readFileSync(join(ROOT, 'content/tool-usage', e.usage.source.file), 'utf8')
      const lines = e.usage.yaml.split('\n')
      const slice = disk
        .replace(/\n$/, '')
        .split('\n')
        .slice(e.usage.source.firstLine - 1, e.usage.source.firstLine - 1 + lines.length)
        .join('\n')
      expect(slice, `${e.word} excerpt drifted from ${e.usage.source.file}`).toBe(e.usage.yaml)
    }
  })

  it('every usage panel actually carries its word as a key', () => {
    for (const e of Object.values(WORD_USAGE)) {
      if (!e.usage) continue
      expect(
        new RegExp(`^\\s*(?:- )?${e.word}:`, 'm').test(e.usage.yaml),
        `${e.word} panel does not key its word`,
      ).toBe(true)
    }
  })

  it('cross-refs point at registered templates and codes only', () => {
    const codeSet = new Set(ERROR_CODES.map((c) => c.code))
    for (const e of Object.values(WORD_USAGE)) {
      for (const t of e.templates) expect(TEMPLATE_INDEX[t], `${e.word} → template ${t}`).toBeDefined()
      for (const c of e.codes) expect(codeSet.has(c), `${e.word} → ${c}`).toBe(true)
    }
  })

  it('the verbs carry no usage panel — their rooms own the complete file', () => {
    for (const w of LANGUAGE_WORDS.filter((x) => x.verb)) {
      expect(WORD_USAGE[w.word].usage, w.word).toBeUndefined()
    }
  })
})

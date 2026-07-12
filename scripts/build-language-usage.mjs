/* ─── build-language-usage · every word shown in a REAL file ──────────────────
   The word rooms (/language/:word) show each key inside a working workflow —
   the tool-rooms recipe, applied to the language itself. This compiler
   assembles that evidence per schema word, from sources that are already
   gated elsewhere (it never invents YAML):

     1 · the spec template pack (public/templates/catalog.json — complete
         valid skeletons, conformance-gated upstream, sha256-pinned by the
         templates drift gate)
     2 · the crafted tool-usage files (content/tool-usage/*.nika.yaml —
         check-green, schema-re-proven by the tool-usage drift gate)

   The excerpt keeps the word IN ITS HABITAT: an envelope-scope word slices
   its top-level section (vars: … through the next top-level key); every
   other word slices the enclosing task item (the tool-usage walker's law).
   firstLine keeps the excerpt's real position — the same body, partially
   shown, never a second version of the file (CodeFile's law).

   Cross-refs ride along: every skeleton that carries the key (chips), and
   every registered error code whose failure line NAMES the word (a
   word-boundary match over the catalog — mechanical, never curated).

   HONEST COVERAGE: a word no gated source speaks gets NO usage panel (the
   room says so plainly) — the compiler logs the uncovered set instead of
   inventing evidence.

   Determinism: same inputs → byte-identical output. Drift gate:
   src/test/language-usage.test.ts recompiles, byte-diffs, re-slices every
   excerpt from its donor and re-greps every code.

   Run: node scripts/build-language-usage.mjs
   Output: src/content/language-usage.generated.ts */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'src', 'content', 'language-usage.generated.ts')

const templates = JSON.parse(
  readFileSync(join(ROOT, 'public/templates/catalog.json'), 'utf8'),
).templates
const errors = JSON.parse(readFileSync(join(ROOT, 'public/errors/catalog.json'), 'utf8')).codes
const CRAFTED_DIR = join(ROOT, 'content', 'tool-usage')
const crafted = readdirSync(CRAFTED_DIR)
  .filter((f) => f.endsWith('.nika.yaml'))
  .sort()
  .map((f) => ({ file: f, yaml: readFileSync(join(CRAFTED_DIR, f), 'utf8').replace(/\n$/, '') }))

/* the language projection is the word list's SSOT (never re-derive here) */
const lang = readFileSync(join(ROOT, 'src/content/language.generated.ts'), 'utf8')
const WORDS = JSON.parse(
  lang.slice(lang.indexOf('LANGUAGE_WORDS: LanguageWord[] = ') + 33, lang.indexOf('/** word → entry')).trim(),
)

/* ── the key matcher · the word used AS A KEY (list-item or mapping) ── */
const keyRe = (w) => new RegExp(`^\\s*(?:- )?${w}:`, 'm')
const keyLineIdx = (lines, w) => {
  const re = new RegExp(`^\\s*(?:- )?${w}:`)
  return lines.findIndex((l) => re.test(l))
}

/* ── the walkers ── */
function envelopeSlice(yaml, word) {
  const lines = yaml.split('\n')
  const at = lines.findIndex((l) => new RegExp(`^${word}:`).test(l))
  if (at === -1) return null
  let end = at + 1
  while (end < lines.length && !/^[a-z_#]/.test(lines[end])) end++
  /* `tasks:` would swallow the whole plan — keep its first item only */
  if (word === 'tasks') {
    let seen = 0
    for (let i = at + 1; i < end; i++) {
      if (/^  - /.test(lines[i])) {
        seen += 1
        if (seen === 2) {
          end = i
          break
        }
      }
    }
  }
  while (end > at + 1 && (/^\s*$/.test(lines[end - 1]) || /^  #/.test(lines[end - 1]))) end--
  return { yaml: lines.slice(at, end).join('\n'), firstLine: at + 1 }
}

function taskSlice(yaml, word) {
  const lines = yaml.split('\n')
  const at = keyLineIdx(lines, word)
  if (at === -1) return null
  let start = at
  while (start > 0 && !/^  - id:\s/.test(lines[start])) start--
  if (!/^  - id:\s/.test(lines[start])) return null
  while (start > 0 && /^  #/.test(lines[start - 1])) start--
  let end = Math.max(at + 1, start + 1)
  while (end < lines.length && !/^  - id:\s/.test(lines[end]) && !/^[a-z_#]/.test(lines[end])) end++
  while (end > at + 1 && (/^\s*$/.test(lines[end - 1]) || /^  #/.test(lines[end - 1]))) end--
  return { yaml: lines.slice(start, end).join('\n'), firstLine: start + 1 }
}

/* codes whose registered failure line NAMES the word — mechanical, with a
   PRECISION rule for English collisions: a short plain word («with» in
   «no declared edge with…») only counts in TOKEN form (word: · word. ·
   `word`); underscored or ≥5-letter words match on the plain boundary. */
function codesFor(word) {
  const boundary = new RegExp(`(^|[^a-z0-9_])${word}([^a-z0-9_]|$)`, 'i')
  const tokenish = new RegExp('(`' + word + '`|(^|[^a-z0-9_])' + word + '[:.])', 'i')
  const strong = word.includes('_') || word.length >= 5
  return errors
    .filter((e) => (strong ? boundary.test(e.failure) : tokenish.test(e.failure)))
    .map((e) => e.code)
}

const entries = []
const uncovered = []
for (const w of WORDS) {
  const word = w.word
  const isEnvelope = w.decls.some((d) => d.scope === 'envelope')
  const slice = (yaml) => (isEnvelope ? envelopeSlice(yaml, word) : taskSlice(yaml, word))

  /* the donor chain: skeleton pack first (README order), crafted files next.
     THE VERBS OPT OUT — their rooms (/verbs/:name) own a complete file;
     a verb's word room hands over instead of duplicating the shape. */
  let usage
  if (w.verb) {
    const inTemplates = templates.filter((t) => keyRe(word).test(t.yaml)).map((t) => t.name)
    entries.push({ word, templates: inTemplates, codes: codesFor(word) })
    continue
  }
  for (const t of templates) {
    if (!keyRe(word).test(t.yaml)) continue
    const cut = slice(t.yaml)
    if (!cut) continue
    usage = {
      yaml: cut.yaml,
      source: { kind: 'template', name: t.name, file: t.file, firstLine: cut.firstLine },
    }
    break
  }
  if (!usage) {
    for (const c of crafted) {
      if (!keyRe(word).test(c.yaml)) continue
      const cut = slice(c.yaml)
      if (!cut) continue
      usage = { yaml: cut.yaml, source: { kind: 'crafted', file: c.file, firstLine: cut.firstLine } }
      break
    }
  }
  if (!usage) uncovered.push(word)

  const inTemplates = templates.filter((t) => keyRe(word).test(t.yaml)).map((t) => t.name)
  entries.push({ word, ...(usage ? { usage } : {}), templates: inTemplates, codes: codesFor(word) })
}

const banner = `// language-usage.generated.ts — AUTO-GENERATED by scripts/build-language-usage.mjs
// from public/templates/catalog.json (verbatim skeleton excerpts · real
// line numbers), content/tool-usage/*.nika.yaml (crafted check-green
// files) and public/errors/catalog.json (codes naming the word).
// DO NOT EDIT · regenerate: node scripts/build-language-usage.mjs
// Drift gate: src/test/language-usage.test.ts recompiles and byte-diffs,
// re-slices every excerpt from its donor, and re-greps every code.

export interface WordUsage {
  /** the key as an author types it */
  word: string
  /** the word inside a real file (absent = no gated source speaks it yet) */
  usage?: {
    yaml: string
    source:
      | { kind: 'template'; name: string; file: string; firstLine: number }
      | { kind: 'crafted'; file: string; firstLine: number }
  }
  /** skeletons that carry the key (README routing order) */
  templates: string[]
  /** registered error codes whose failure line names the word */
  codes: string[]
}

/** usage evidence per schema word, keyed by word. */
export const WORD_USAGE: Record<string, WordUsage> = `

writeFileSync(OUT, `${banner}${JSON.stringify(Object.fromEntries(entries.map((e) => [e.word, e])), null, 2)}\n`)
const covered = entries.filter((e) => e.usage).length
console.log(
  `language-usage → ${covered}/${entries.length} words shown in a real file (${entries.filter((e) => e.usage?.source.kind === 'template').length} skeleton · ${entries.filter((e) => e.usage?.source.kind === 'crafted').length} crafted)`,
)
if (uncovered.length) console.log(`  honest misses: ${uncovered.join(' · ')}`)

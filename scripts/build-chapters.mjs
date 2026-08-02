/* ─── build-chapters · the spec pack's 18 chapters → catalog + projection ─────
   /spec was ONE page for a whole specification: eighteen chapters flattened
   into a single scroll with no citable address for any of them. The target
   sitemap explodes it into /language/spec/:chapter, which is what a reference
   is for — you cite the chapter, not the document.

   Same law as build-lessons: read AT THE PIN with `git show <sha>:path`, so a
   moving sibling HEAD can never leak in. No sibling → the committed catalog
   stands, and CI never needs one.

   Run:   node scripts/build-chapters.mjs
   Check: node scripts/build-chapters.mjs --check   (exit 5 on drift) */
import { createHash } from 'node:crypto'
import { marked } from 'marked'
import { applyCanonMarkers } from './build-blog.mjs'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CATALOG = join(ROOT, 'public', 'spec', 'chapters.json')
const OUT = join(ROOT, 'src', 'content', 'chapters.generated.ts')
const OUT_BODY = join(ROOT, 'src', 'content', 'chapters-body.generated.ts')
const PIN = JSON.parse(readFileSync(join(ROOT, '.github/nika-spec-pin.json'), 'utf8'))
/* the canon numbers the markers are checked against (the spec's own SSOT,
   projected into src/canon.generated.ts by the canon projector) */
const CANON = Object.fromEntries(
  [...readFileSync(join(ROOT, 'src/canon.generated.ts'), 'utf8').matchAll(/(\w+):\s*(\d+)/g)].map(
    (m) => [m[1], Number(m[2])],
  ),
)
const SPEC_ROOT = process.env.NIKA_SPEC_ROOT ?? join(ROOT, '..', 'spec', 'repo')

const sha256 = (s) => createHash('sha256').update(s).digest('hex')
const byCp = (a, b) => (a < b ? -1 : a > b ? 1 : 0)


/* the block vocabulary is the blog's (BlogToken in src/content/blog.generated):
   p · h · code · quote · list · hr. A chapter that uses anything else fails
   LOUDLY rather than silently dropping prose from the specification. */
const flatText = (toks) => toks.map((t) => t.raw ?? t.text ?? '').join('')
function inlineOf(toks) {
  const out = []
  for (const t of toks ?? []) {
    if (t.type === 'strong') out.push({ k: 'strong', text: flatText(t.tokens) })
    else if (t.type === 'em') out.push({ k: 'em', text: flatText(t.tokens) })
    else if (t.type === 'codespan') out.push({ k: 'code', text: t.text })
    else if (t.type === 'link') out.push({ k: 'link', text: flatText(t.tokens), href: t.href })
    else if (t.type === 'br') out.push({ k: 'text', text: ' ' })
    else out.push({ k: 'text', text: t.text ?? t.raw ?? '' })
  }
  return out
}
/* GITHUB's slugger, not the blog's. The spec is authored as GitHub markdown
   and its own cross-references are written against GitHub anchors: strip
   punctuation (an apostrophe VANISHES, it does not become a dash), then turn
   each remaining space into one dash — which is why « outputs (optional) ·
   the workflow's return value » anchors as `outputs--optional--the-workflows-
   return-value` with the doubles intact. Using the blog's collapsing slugger
   broke every internal link the specification makes to itself.
   Repeats get GitHub's -1 · -2 suffix, per chapter (the spec reuses « Fields »
   and « Syntax » under different parents). */
function makeSlugger() {
  const seen = new Map()
  return (s) => {
    const base = s
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s/g, '-')
    const n = seen.get(base) ?? 0
    seen.set(base, n + 1)
    return n === 0 ? base : `${base}-${n}`
  }
}
function lex(body, file) {
  const anchorOf = makeSlugger()
  const tokens = []
  for (const t of marked.lexer(body)) {
    if (t.type === 'space') continue
    else if (t.type === 'paragraph') tokens.push({ k: 'p', inline: inlineOf(t.tokens) })
    else if (t.type === 'heading')
      tokens.push({ k: 'h', depth: t.depth, text: flatText(t.tokens), id: anchorOf(flatText(t.tokens)) })
    else if (t.type === 'code')
      tokens.push({ k: 'code', lang: (t.lang ?? '').split(/\s+/)[0] || 'text', text: t.text })
    else if (t.type === 'blockquote')
      tokens.push({
        k: 'quote',
        inline: (t.tokens ?? []).filter((x) => x.type === 'paragraph').flatMap((p) => inlineOf(p.tokens)),
      })
    else if (t.type === 'list')
      tokens.push({
        k: 'list',
        ordered: Boolean(t.ordered),
        items: t.items.map((it) => inlineOf((it.tokens ?? []).flatMap((x) => x.tokens ?? [x]))),
      })
    else if (t.type === 'hr') tokens.push({ k: 'hr' })
    else if (t.type === 'table') {
      /* the spec uses tables the blog never did · rendered as a list of rows
         rather than dropped: losing a normative table would be a lie. */
      const rows = [t.header.map((c) => flatText(c.tokens)), ...t.rows.map((r) => r.map((c) => flatText(c.tokens)))]
      tokens.push({ k: 'list', ordered: false, items: rows.map((r) => [{ k: 'text', text: r.filter(Boolean).join(' · ') }]) })
    } else throw new Error(`${file}: unsupported block token "${t.type}"`)
  }
  return tokens
}

function chaptersAtPin() {
  if (!existsSync(join(SPEC_ROOT, '.git'))) return null
  const git = (...args) =>
    execFileSync('git', ['-C', SPEC_ROOT, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  try {
    git('cat-file', '-e', PIN.spec_commit)
  } catch {
    return null
  }
  const names = git('ls-tree', '-r', '--name-only', PIN.spec_commit, 'spec/')
    .split('\n')
    .filter(Boolean)
    .map((p) => p.replace(/^spec\//, ''))
    .filter((n) => /^\d\d-.+\.md$/.test(n))
    .sort(byCp)
  return names.map((name) => {
    /* the spec carries CANON MARKERS (<!-- canon:providers -->17<!-- /canon -->)
       exactly as the blog does, and the same function resolves them: the
       number is re-verified against canon.yaml, so a stale figure in the
       specification fails the build instead of shipping. */
    const body = applyCanonMarkers(git('show', `${PIN.spec_commit}:spec/${name}`), CANON, name)
    const slug = name.replace(/^\d\d-/, '').replace(/\.md$/, '')
    /* the chapter's own H1 and its opening blockquote · the spec writes both,
       so the site never invents a title or a summary for a chapter. */
    const h1 = body.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? slug
    const quote = body
      .split('\n')
      .filter((l) => l.startsWith('> '))
      .map((l) => l.slice(2).trim())
    const lede = quote.length ? quote.join(' ').split(/(?<=\.)\s/)[0] : null
    /* the citable sections come FROM THE TOKENS, never from a second regex
       over the raw markdown: the renderer stamps heading ids from the token,
       so a TOC built any other way drifts the moment a heading carries
       backticks or an em dash (it did — nine anchors on chapter 01 alone). */
    const tokens = lex(body, name)
    const sections = tokens
      .filter((tk) => tk.k === 'h' && tk.depth === 2)
      .map((tk) => ({ title: tk.text, anchor: tk.id }))
    return {
      slug,
      file: name,
      n: Number(name.slice(0, 2)),
      title: h1.replace(/^\d\d\s*·\s*/, ''),
      lede,
      sections,
      words: body.split(/\s+/).filter(Boolean).length,
      sha256: sha256(body),
      /* LEXED here, into the site's own token vocabulary — never HTML.
         The markdown parser stays a devDependency and the client receives
         data, not markup (the build-blog law, and the reason this page can
         render a yaml fence as the product's editor panel). */
      tokens,
      body,
    }
  })
}

function render(chapters) {
  return (
    JSON.stringify(
      { chapters_format: 1, spec_commit: PIN.spec_commit, spec_tree: PIN.spec_tree, chapters },
      null,
      2,
    ) + '\n'
  )
}

function project(catalog) {
  const rows = catalog.chapters.map(({ body, tokens, ...rest }) => rest)
  return `// chapters.generated.ts — AUTO-GENERATED by scripts/build-chapters.mjs
// from the nika-spec pack AT THE PIN (${PIN.spec_commit.slice(0, 12)}), read with
// \`git show <pin>:spec/<file>\` — never from a moving checkout.
// DO NOT EDIT · regenerate: node scripts/build-chapters.mjs
// Drift gate: src/test/chapters.test.ts recompiles and byte-diffs.

/** one chapter of the specification · the prose lives in the body module */
export interface Chapter {
  slug: string
  file: string
  /** the leading number · the reading order of the pack */
  n: number
  /** the chapter's own H1, with its figure stripped */
  title: string
  /** the first sentence of its opening blockquote, when it has one */
  lede: string | null
  /** every ## heading · the citable anchors inside the chapter */
  sections: { title: string; anchor: string }[]
  words: number
  sha256: string
}

export const CHAPTERS_PIN = ${JSON.stringify({ spec_commit: catalog.spec_commit, spec_tree: catalog.spec_tree }, null, 1)} as const

export const CHAPTERS: Chapter[] = ${JSON.stringify(rows, null, 1)}
`
}

function projectBody(catalog) {
  const entries = catalog.chapters
    .map((c) => `  ${JSON.stringify(c.slug)}: ${JSON.stringify(c.tokens)},`)
    .join('\n')
  return `// chapters-body.generated.ts — AUTO-GENERATED by scripts/build-chapters.mjs
// The whole specification, LEXED at build time into the site's own token
// vocabulary (no markdown parser and no raw HTML ever rides the client).
// HEAVY: src/** reaches it ONLY
// through src/lib/chapters-access.ts.
// DO NOT EDIT · regenerate: node scripts/build-chapters.mjs
import type { BlogToken } from './blog.generated'

export const CHAPTER_TOKENS: Record<string, BlogToken[]> = {
${entries}
}
`
}

const check = process.argv.includes('--check')
const fresh = chaptersAtPin()

if (!fresh) {
  if (!existsSync(CATALOG)) {
    console.error('✗ no nika-spec checkout at the pin AND no committed catalog')
    process.exit(5)
  }
  console.log('○ chapters · no reachable spec checkout at the pin · the committed catalog stands')
  if (!check) {
    const c = JSON.parse(readFileSync(CATALOG, 'utf8'))
    writeFileSync(OUT, project(c))
    writeFileSync(OUT_BODY, projectBody(c))
  }
  process.exit(0)
}

const catalogText = render(fresh)
const projected = project(JSON.parse(catalogText))
const projectedBody = projectBody(JSON.parse(catalogText))

if (check) {
  const drift = []
  if (!existsSync(CATALOG) || readFileSync(CATALOG, 'utf8') !== catalogText) drift.push('public/spec/chapters.json')
  if (!existsSync(OUT) || readFileSync(OUT, 'utf8') !== projected) drift.push('src/content/chapters.generated.ts')
  if (!existsSync(OUT_BODY) || readFileSync(OUT_BODY, 'utf8') !== projectedBody) drift.push('src/content/chapters-body.generated.ts')
  if (drift.length) {
    console.error(`✗ chapters drift · run node scripts/build-chapters.mjs\n  ${drift.join('\n  ')}`)
    process.exit(5)
  }
  console.log(`✓ chapters in sync with nika-spec@${PIN.spec_commit.slice(0, 9)} · ${fresh.length} chapters`)
  process.exit(0)
}

mkdirSync(dirname(CATALOG), { recursive: true })
writeFileSync(CATALOG, catalogText)
writeFileSync(OUT, projected)
writeFileSync(OUT_BODY, projectedBody)
console.log(`wrote ${fresh.length} chapters at nika-spec@${PIN.spec_commit.slice(0, 9)}`)

/* ─── build-blog · content/blog/*.md → src/content/blog.generated.ts + RSS ────
   The blog IS the markdown folder (GitHub-readable, PR-able); the site ships a
   COMPILED projection of it, following the repo's generated-module convention
   (canon.generated.ts · usecases-yaml.generated.ts): posts are lexed ONCE here
   with marked (a devDependency — no markdown parser ever rides the client),
   emitted as plain serializable tokens the React renderer maps to elements.

   Two laws the compiler enforces:
   - canon markers: `<!-- canon:KEY -->N<!-- /canon -->` must equal the value
     derived from src/canon.generated.ts — the build FAILS on drift (counts are
     never hand-typed, per the repo contract).
   - determinism: same sources → byte-identical outputs (the vitest drift gate
     recompiles and diffs; RSS uses fixed-noon UTC pubDates, no build stamps).

   Run: node scripts/build-blog.mjs        (regenerates BOTH outputs)
   Outputs: src/content/blog.generated.ts · public/blog/rss.xml (committed) */
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'
import { marked } from 'marked'
import lz from 'lz-string'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC_DIR = join(ROOT, 'content', 'blog')
const OUT_TS = join(ROOT, 'src', 'content', 'blog.generated.ts')
const OUT_BODIES = join(ROOT, 'src', 'content', 'blog-bodies.generated.ts')
const OUT_RSS = join(ROOT, 'public', 'rss.xml')
const SITE = 'https://nika.sh'
export const BLOG_GENERATED_MIRRORS = [
  'public/llms-full.txt',
  'public/rss.xml',
  'src/content/blog-bodies.generated.ts',
  'src/content/blog.generated.ts',
]

/* ── canon values (the site's own generated projection is the source) ──────── */
export function canonValues() {
  const src = readFileSync(join(ROOT, 'src', 'canon.generated.ts'), 'utf8')
  const num = (key) => {
    const m = src.match(new RegExp(`${key}:\\s*(\\d+)`))
    if (!m) throw new Error(`canon key not found: ${key}`)
    return Number(m[1])
  }
  const base = {
    verbs: num('verbs'),
    builtins: num('builtins'),
    providers: num('providers'),
    providersLocal: num('providersLocal'),
    providersCloud: num('providersCloud'),
    extractModes: num('extractModes'),
    mcpTools: num('mcpTools'),
  }
  return { ...base, 'builtins-4': base.builtins - 4 }
}

/* verify + strip the canon markers · returns clean text, throws on drift */
export function applyCanonMarkers(md, canon, file) {
  return md.replace(
    /<!--\s*canon:([a-zA-Z0-9-]+)\s*-->\s*(\d+)\s*<!--\s*\/canon\s*-->/g,
    (_, key, typed) => {
      const want = canon[key]
      if (want === undefined) throw new Error(`${file}: unknown canon key "${key}"`)
      if (Number(typed) !== want)
        throw new Error(`${file}: canon drift — marker canon:${key} says ${typed}, canon says ${want}`)
      return String(want)
    },
  )
}

/* ── inline tokens → the flat serializable shape the renderer maps ─────────── */
function flatText(tokens) {
  return (tokens ?? []).map((t) => ('tokens' in t && t.tokens ? flatText(t.tokens) : (t.text ?? ''))).join('')
}
function inlineOf(tokens, file) {
  const out = []
  for (const t of tokens ?? []) {
    if (t.type === 'text' || t.type === 'escape') out.push({ k: 'text', text: t.text })
    else if (t.type === 'strong') out.push({ k: 'strong', text: flatText(t.tokens) })
    else if (t.type === 'em') out.push({ k: 'em', text: flatText(t.tokens) })
    else if (t.type === 'codespan') out.push({ k: 'code', text: t.text })
    else if (t.type === 'link') out.push({ k: 'link', text: flatText(t.tokens), href: t.href })
    else if (t.type === 'br') out.push({ k: 'text', text: '\n' })
    else throw new Error(`${file}: unsupported inline token "${t.type}"`)
  }
  return out
}

/* ── one post · frontmatter + block tokens + reading time ──────────────────── */
export function compilePost(raw, file, canon) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n/)
  if (!m) throw new Error(`${file}: missing frontmatter`)
  const meta = parseYaml(m[1])
  for (const key of ['slug', 'title', 'tag', 'date', 'description'])
    if (!meta[key]) throw new Error(`${file}: frontmatter missing "${key}"`)
  const body = applyCanonMarkers(raw.slice(m[0].length), canon, file)

  const tokens = []
  for (const t of marked.lexer(body)) {
    if (t.type === 'space') continue
    if (t.type === 'paragraph') tokens.push({ k: 'p', inline: inlineOf(t.tokens, file) })
    else if (t.type === 'heading')
      tokens.push({
        k: 'h',
        depth: t.depth,
        text: flatText(t.tokens),
        id: flatText(t.tokens).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      })
    else if (t.type === 'code') {
      const [lang, ...rest] = (t.lang ?? '').split(/\s+/)
      /* a COMPLETE workflow fence (envelope-first yaml) gets its playground
         handoff precomputed at build time — the same lz ?y= the film's done
         frame hands off with, as pure SSG HTML (zero client JS). Console
         fences (text) and pedagogical yaml fragments carry no link. */
      const play =
        (lang || '') === 'yaml' && /^nika:\s*v1\b/.test(t.text.trimStart())
          ? lz.compressToEncodedURIComponent(t.text)
          : undefined
      tokens.push({ k: 'code', lang: lang || 'text', filename: rest.join(' ') || undefined, text: t.text, ...(play ? { play } : {}) })
    } else if (t.type === 'blockquote') {
      const inner = t.tokens.filter((x) => x.type === 'paragraph')
      tokens.push({ k: 'quote', inline: inner.flatMap((p) => inlineOf(p.tokens, file)) })
    } else if (t.type === 'list')
      tokens.push({ k: 'list', ordered: !!t.ordered, items: t.items.map((it) => inlineOf(it.tokens.flatMap((x) => x.tokens ?? [x]), file)) })
    else if (t.type === 'hr') tokens.push({ k: 'hr' })
    else throw new Error(`${file}: unsupported block token "${t.type}"`)
  }

  const words = body.replace(/```[\s\S]*?```/g, '').split(/\s+/).filter(Boolean).length
  return {
    slug: String(meta.slug),
    file,
    title: String(meta.title),
    tag: String(meta.tag),
    date: String(meta.date),
    description: String(meta.description),
    /* authorship (D8) · Person for E-E-A-T: a post without `author:` in its
       frontmatter inherits the house default — zero migration of the pack */
    author: String(meta.author ?? 'Thibaut Melen'),
    readingMin: Math.max(1, Math.ceil(words / 220)),
    /* optional reading-path membership · `series: <id>` (+ `series_stop: <label>`
       naming this post's station). Both-or-neither: the compiler gates below. */
    ...(meta.series ? { series: String(meta.series), seriesStop: String(meta.series_stop ?? '') } : {}),
    tokens,
  }
}

/* ── the series registry · id → display copy (a series is EDITORIAL: the id in
   frontmatter binds the posts; the title/claim live here, once). Adding a
   series = one row + `series:` lines in its posts — the gates below refuse
   half-wired states (unknown id · singleton series · missing stop label). */
export const SERIES = {
  'trace-family': {
    title: 'The trace family',
    claim: 'One recorded file, five jobs',
    /* the READING order — editorial (the custody post's canonical phrase),
       not chronological: a path is a curriculum, not a changelog */
    stops: ['evidence', 'replay', 'resume', 'forecast', 'custody'],
  },
}

export function readBlogSourceSnapshot(dir = SRC_DIR) {
  return readdirSync(dir)
    .filter((file) => file.endsWith('.md') && file !== 'README.md')
    .sort()
    .map((file) => ({ file, raw: readFileSync(join(dir, file), 'utf8') }))
}

function compileSourceSnapshot(sources, canon = canonValues()) {
  const posts = sources.map(({ file, raw }) => compilePost(raw, file, canon))
  /* newest-first; same-day posts by filename DESC — a comparator that never
     returns 0 is engine-defined order, and this one shipped that way (the
     tiebreak below pins the order it happened to produce). */
  posts.sort((a, b) => (a.date !== b.date ? (a.date < b.date ? 1 : -1) : a.file < b.file ? 1 : -1))
  const slugs = new Set()
  for (const p of posts) {
    if (slugs.has(p.slug)) throw new Error(`duplicate slug: ${p.slug}`)
    slugs.add(p.slug)
  }
  /* series gates · unknown id, singleton, or a member missing its stop label
     all fail the build (half-wired reading paths never ship) */
  const bySeries = new Map()
  for (const p of posts) {
    if (!p.series) continue
    const reg = SERIES[p.series]
    if (!reg) throw new Error(`${p.file}: unknown series "${p.series}"`)
    if (!reg.stops.includes(p.seriesStop))
      throw new Error(`${p.file}: stop "${p.seriesStop}" not in series "${p.series}" (${reg.stops.join(' · ')})`)
    if (!bySeries.has(p.series)) bySeries.set(p.series, new Map())
    const stops = bySeries.get(p.series)
    if (stops.has(p.seriesStop))
      throw new Error(`series "${p.series}" stop "${p.seriesStop}" claimed twice (${stops.get(p.seriesStop)} + ${p.file})`)
    stops.set(p.seriesStop, p.file)
  }
  /* the path ships COMPLETE: every declared stop has its post */
  for (const [id, stops] of bySeries)
    for (const stop of SERIES[id].stops)
      if (!stops.has(stop)) throw new Error(`series "${id}" missing its "${stop}" stop`)
  return posts
}

export function compileAll(dir = SRC_DIR) {
  return compileSourceSnapshot(readBlogSourceSnapshot(dir))
}

/* ── emit · the generated module + the feed ─────────────────────────────────── */
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function rssOf(posts) {
  const items = posts
    .map((p) => {
      const url = `${SITE}/blog/${p.slug}`
      const pub = new Date(`${p.date}T09:00:00Z`).toUTCString()
      return `    <item>\n      <title>${esc(p.title)}</title>\n      <link>${url}</link>\n      <guid isPermaLink="true">${url}</guid>\n      <pubDate>${pub}</pubDate>\n      <category>${esc(p.tag)}</category>\n      <description>${esc(p.description)}</description>\n    </item>`
    })
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n    <title>Nika · Notes from the source</title>\n    <link>${SITE}/blog</link>\n    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />\n    <description>Long-form pedagogy on Intent as Code: why useful AI work belongs in a file, why the language locks at four verbs, and what local-first actually buys you.</description>\n    <language>en</language>\n${items}\n  </channel>\n</rss>\n`
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  const sourceSnapshot = readBlogSourceSnapshot()
  const canon = canonValues()
  const posts = compileSourceSnapshot(sourceSnapshot, canon)
  /* THE SPLIT (the bundle diet · arc 13m): the metadata module rides the
     initial bundle (Blog · Sitemap · BlogPost's header need it on every
     page — routes are sync); the BODIES (the 29 full posts, ~85% of the
     mass) live in their own module, statically imported ONLY by the SSR
     branch + lazily by the client's SPA-navigation path. */
  const metas = posts.map(({ tokens: _tokens, ...meta }) => meta)
  const bodies = Object.fromEntries(posts.map((p) => [p.slug, p.tokens]))
  const ts = `/* AUTO-GENERATED by scripts/build-blog.mjs from content/blog/*.md — NEVER EDIT.
   Regenerate: node scripts/build-blog.mjs (the vitest drift gate recompiles + diffs). */

export interface BlogInline {
  k: 'text' | 'strong' | 'em' | 'code' | 'link'
  text: string
  href?: string
}

export type BlogToken =
  | { k: 'p'; inline: BlogInline[] }
  | { k: 'h'; depth: number; text: string; id: string }
  | { k: 'code'; lang: string; filename?: string; text: string; play?: string }
  | { k: 'quote'; inline: BlogInline[] }
  | { k: 'list'; ordered: boolean; items: BlogInline[][] }
  | { k: 'hr' }

export interface BlogPost {
  slug: string
  /** the source file under content/blog/ — the GitHub edit target */
  file: string
  title: string
  tag: string
  date: string
  description: string
  /** the writing Person (JSON-LD author) · frontmatter override, house default */
  author: string
  readingMin: number
  /** reading-path membership (optional) · id into BLOG_SERIES + this post's stop label */
  series?: string
  seriesStop?: string
}

export const BLOG_SERIES: Record<string, { title: string; claim: string; stops: string[] }> = ${JSON.stringify(SERIES, null, 2)}

/* newest first · metadata only — the bodies live in blog-bodies.generated.ts
   (initial-bundle diet: the token mass never rides a non-post page) */
export const BLOG_POSTS: BlogPost[] = ${JSON.stringify(metas, null, 2)}
`
  const tsBodies = `/* AUTO-GENERATED by scripts/build-blog.mjs from content/blog/*.md — NEVER EDIT.
   Regenerate: node scripts/build-blog.mjs (the vitest drift gate recompiles + diffs).

   The post BODIES, slug-keyed — deliberately its OWN module: BlogPost.tsx
   imports it statically in its SSR branch (resolved by the SSG module runner
   before render) and dynamically on the client's SPA-navigation path (its own
   chunk, cached for the session). It must NEVER be imported statically from
   client-reachable code — that would put every post back in the initial
   bundle (the size-budget three-leak detector's sibling trap). */
import type { BlogToken } from './blog.generated'

export const BLOG_BODIES: Record<string, BlogToken[]> = ${JSON.stringify(bodies, null, 2)}
`
  /* llms-full.txt · the llmstxt.org companion: the whole blog as raw
     markdown for agents (the posts ALREADY are markdown — serve the source).
     Canon markers are resolved (applyCanonMarkers ran), frontmatter kept as
     a simple header per post. Deterministic: no build stamps. */
  const full = [
    '# nika.sh · llms-full.txt',
    '# The complete blog, newest first, as raw markdown (source: content/blog in the site repo).',
    '# Companion to https://nika.sh/llms.txt · spec: https://llmstxt.org/',
    '',
    ...[...sourceSnapshot].reverse().map(({ file, raw }) => {
      const m = raw.match(/^---\n([\s\S]*?)\n---\n/)
      const meta = parseYaml(m[1])
      const body = applyCanonMarkers(raw.slice(m[0].length), canon, file).trim()
      return `---\n\n## ${meta.title}\nurl: https://nika.sh/blog/${meta.slug}\ndate: ${meta.date} · tag: ${meta.tag}\n\n${body}\n`
    }),
  ].join('\n')
  const projectionBytes = new Map([
    ['public/llms-full.txt', full],
    ['public/rss.xml', rssOf(posts)],
    ['src/content/blog-bodies.generated.ts', tsBodies],
    ['src/content/blog.generated.ts', ts],
  ])
  if (projectionBytes.size !== BLOG_GENERATED_MIRRORS.length
    || BLOG_GENERATED_MIRRORS.some((path) => !projectionBytes.has(path))) {
    throw new Error('blog generated mirror path set differs from the closed four-output contract')
  }
  /* the markdown twins (§2c · R5): every post serves its SOURCE beside the
     page — frontmatter kept (honest data), canon markers RESOLVED (the twin
     must say what the page says, never an unexpanded placeholder). A family
     of its own: the four-output contract above stays closed. */
  const twinProjections = sourceSnapshot.map(({ file, raw }) => {
    const slug = raw.match(/^---\n[\s\S]*?\bslug:\s*"?([a-z0-9-]+)"?/)?.[1] ?? file.replace(/\.md$/, '')
    return [`public/blog/${slug}.md`, applyCanonMarkers(raw, canon, file)]
  })
  const projections = [
    ...BLOG_GENERATED_MIRRORS.map((path) => [join(ROOT, path), projectionBytes.get(path)]),
    ...twinProjections.map(([path, bytes]) => [join(ROOT, path), bytes]),
  ]
  if (process.argv.includes('--check')) {
    for (const [path, expected] of projections) {
      if (!existsSync(path) || readFileSync(path, 'utf8') !== expected) {
        throw new Error(`blog generated mirror drift: ${path.replace(`${ROOT}/`, '')}`)
      }
    }
    console.log(`blog projections: ${projections.length}/${projections.length} byte-exact mirrors verified`)
  } else {
    for (const [path, bytes] of projections) {
      mkdirSync(dirname(path), { recursive: true })
      writeFileSync(path, bytes)
    }
    console.log(`wrote ${OUT_TS.replace(`${ROOT}/`, '')} + blog-bodies (${posts.length} posts) + ${OUT_RSS.replace(`${ROOT}/`, '')} + ${twinProjections.length} md twins`)
  }
}

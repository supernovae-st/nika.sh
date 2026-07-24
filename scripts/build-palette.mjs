/* ─── build-palette · the ⌘K corpus → src/content/palette.generated.ts ────────
   The command palette's entries, compiled at build time from the same solid
   sources the site already trusts (the generated-module convention:
   blog.generated · errors.generated):

     · CORE routes — hand-curated here (the ~dozen nav-worthy surfaces; the
       long tail of routes IS the posts + error codes below)
     · posts — content/blog/*.md frontmatter (slug · title · tag)
     · error codes — public/errors/catalog.json (code · one-line failure)

   Lean by design: labels + hrefs only (the palette chunk must stay small —
   never import blog.generated's full token trees into it).

   Determinism: same sources → byte-identical output (the vitest drift gate
   recompiles and diffs, the blog gate's pattern).

   Run: node scripts/build-palette.mjs */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'
import { discoverPrerenderPaths } from './lens-semantics-lib.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/* the nav-worthy core (label · href · hint) — curated, rarely moves */
const CORE = [
  ['Home', '/', 'the film · intent as code'],
  ['Playground', '/play', 'write Nika, checked live'],
  ['Spec', '/spec', 'the language reference'],
  ['Learn', '/learn', 'one file, line by line · 5 minutes'],
  ['Install', '/install', 'one binary · two minutes'],
  ['Use cases', '/use-cases', 'real files you would write'],
  ['Blog', '/blog', 'notes from the source'],
  ['Changelog', '/changelog', 'the ship log'],
  ['Timeline', '/timeline', 'the one verifiable record'],
  ['Manifesto', '/manifesto', 'the drum of liberation'],
  ['Convert', '/convert', 'send us a workflow'],
  ['Errors', '/errors', 'the typed error registry'],
  ['Tools', '/tools', 'the standard library'],
  ['The four verbs', '/verbs', 'infer · exec · invoke · agent'],
  ['The language', '/language', 'every word the schema declares'],
  ['Providers', '/providers', 'local first · your keys'],
  ['Templates', '/templates', 'instantiable skeletons'],
  ['The map', '/map', 'every page, one graph'],
  ['The flow', '/flow', 'two doors, one graph · the gate matrix'],
  ['The boundary', '/boundary', 'permits · secrets · the floor'],
  ['The proof', '/proof', 'run graph · conformance · machine surfaces'],
  ['Brand', '/brand', 'logos and the mark'],
]

export function compilePalette() {
  const entries = []
  for (const [label, href, hint] of CORE) entries.push({ kind: 'page', label, href, hint })

  /* atlas sets · the registers as first-class entries (G.8 · Q9 ratified).
     Fully derived from the descriptor: label = title · hint = opener · href =
     the set's own surface (rooms register root, or the hub page that anchors
     it). The point is the NAME: « edge kinds » or « permit families » typed
     into ⌘K now lands on the page that carries the register, even while it
     shares that page with a CORE row (the anchors differentiate the hrefs
     when they land post-contract). Two guards: a set whose page has not
     shipped stays out (it appears by itself at the first regen after the
     page lands) · an exact label+href twin of an existing row stays out. */
  const sets = parseYaml(readFileSync(join(ROOT, 'scripts/atlas/sets.yaml'), 'utf8')).sets
  const live = new Set(discoverPrerenderPaths(ROOT))
  const twin = new Set(entries.map((e) => `${e.label}\u0000${e.href}`))
  for (const set of sets) {
    const href = set.rooms_url ? set.rooms_url.replace(/\/:[^/]+$/, '') : set.anchor_page
    if (!href || !live.has(href) || twin.has(`${set.title}\u0000${href}`)) continue
    entries.push({ kind: 'set', label: set.title, href, hint: set.opener })
  }

  /* posts · newest-first (same comparator as build-blog: date desc, then
     filename desc — deterministic for same-day posts) */
  const dir = join(ROOT, 'content/blog')
  const files = readdirSync(dir).filter((f) => f.endsWith('.md') && f !== 'README.md')
  const posts = files.map((f) => {
    const src = readFileSync(join(dir, f), 'utf8')
    const m = src.match(/^---\n([\s\S]*?)\n---/)
    const meta = parseYaml(m[1])
    return { slug: String(meta.slug), title: String(meta.title), tag: String(meta.tag), date: String(meta.date), file: f }
  })
  posts.sort((a, b) => (a.date === b.date ? (a.file < b.file ? 1 : -1) : a.date < b.date ? 1 : -1))
  for (const p of posts)
    entries.push({ kind: 'post', label: p.title, href: `/blog/${p.slug}`, hint: `${p.tag} · ${p.date}` })

  /* the journal's tag registers + reading paths (citable pages since the
     projection sweep) — tags derive from the same frontmatter */
  const tags = [...new Set(posts.flatMap((p) => p.tag.split('|').map((t) => t.trim())))].sort()
  for (const t of tags)
    entries.push({
      kind: 'page',
      label: `tag: ${t}`,
      href: `/blog/tags/${t.toLowerCase()}`,
      hint: 'the journal, one register',
    })

  /* the library shelf + rooms — the ids ride site.config's literal list
     (the drift gate pins that list to the shelf itself) */
  const siteConfig = readFileSync(join(ROOT, 'site.config.ts'), 'utf8')
  const libraryBlock = siteConfig.match(/export const LIBRARY_PATHS = \[([\s\S]*?)\]/)?.[1] ?? ''
  for (const m of libraryBlock.matchAll(/'(\/library\/[^']+)'/g))
    entries.push({
      kind: 'page',
      label: m[1].slice('/library/'.length),
      href: m[1],
      hint: 'the workflow library · a real file',
    })
  const integrationsBlock = siteConfig.match(/export const INTEGRATION_PATHS = \[([\s\S]*?)\]/)?.[1] ?? ''
  for (const m of integrationsBlock.matchAll(/'(\/integrations\/[^']+)'/g))
    entries.push({
      kind: 'page',
      label: `integration: ${m[1].slice('/integrations/'.length)}`,
      href: m[1],
      hint: 'get Nika into your stack',
    })
  const seriesBlock = siteConfig.match(/export const BLOG_SERIES_PATHS = \[([\s\S]*?)\]/)?.[1] ?? ''
  for (const m of seriesBlock.matchAll(/'(\/blog\/series\/[^']+)'/g))
    entries.push({
      kind: 'page',
      label: `path: ${m[1].split('/').pop()}`,
      href: m[1],
      hint: 'a reading path through the journal',
    })

  /* error codes · the registry's flat list (code + its one-line failure) */
  const catalog = JSON.parse(readFileSync(join(ROOT, 'public/errors/catalog.json'), 'utf8'))
  for (const e of catalog.codes ?? [])
    entries.push({ kind: 'error', label: e.code, href: `/errors/${e.code}`, hint: e.failure })

  /* builtins · the stdlib register (full ref + the binary's one-liner) */
  const tools = JSON.parse(readFileSync(join(ROOT, 'public/tools/catalog.json'), 'utf8'))
  for (const t of tools.tools ?? [])
    entries.push({ kind: 'tool', label: t.name, href: `/tools/${t.bare}`, hint: t.description })

  /* templates · the skeleton pack (name + the routing phrase) */
  const tmpl = JSON.parse(readFileSync(join(ROOT, 'public/templates/catalog.json'), 'utf8'))
  for (const t of tmpl.templates ?? [])
    entries.push({
      kind: 'template',
      label: t.name,
      href: `/templates/${t.name}`,
      hint: t.intent,
    })

  /* providers · the named set (id + the binary's one-liner) — each entry
     opens the provider's OWN room (dedicated pages · the register keeps
     its citable #anchors for humans standing on it) */
  const providers = JSON.parse(readFileSync(join(ROOT, 'public/providers/catalog.json'), 'utf8'))
  for (const p of providers.providers ?? [])
    entries.push({
      kind: 'provider',
      label: `provider: ${p.id}`,
      href: `/providers/${p.id}`,
      hint: p.description,
    })

  /* the roomed register members (rooms universelles · « chaque élément a sa
     page ») — every member room the per-catalog loops above don't already
     carry joins the corpus from the ontology twin, so ⌘K can open any
     citable element's page directly */
  const ROOMED_SETS = {
    namespaces: 'namespace',
    types: 'type',
    'edge-kinds': 'edge',
    'gate-predicates': 'predicate',
    'tool-families': 'family',
    'extract-modes': 'mode',
    'permit-families': 'permit',
    'secret-sources': 'secret',
    'error-namespaces': 'error namespace',
    'error-categories': 'error category',
    'conformance-levels': 'conformance',
    'mcp-tools': 'mcp',
    'truth-words': 'truth',
  }
  const ontology = JSON.parse(readFileSync(join(ROOT, 'public/ontology/language.json'), 'utf8'))
  /* the family ROOTS (the /types 404 class · reborn 2026-07-24): one door
     per roomed family, straight from site.config's literal list */
  const rootsBlock = siteConfig.match(/export const FAMILY_ROOT_PATHS = \[([\s\S]*?)\]/)?.[1] ?? ''
  for (const m of rootsBlock.matchAll(/'(\/[a-z-]+)'/g))
    entries.push({
      kind: 'page',
      label: `${m[1].slice(1)} · the register root`,
      href: m[1],
      hint: 'every member, one room each',
    })
  for (const n of ontology.nodes ?? [])
    if (n.kind === 'member' && n.own_page && n.url && ROOMED_SETS[n.set])
      entries.push({
        kind: 'member',
        label: `${ROOMED_SETS[n.set]}: ${n.title}`,
        href: n.url,
        hint: n.opener ?? '',
      })

  /* verbs · the four rooms (curated one-liners — the CORE precedent: four
     locked-forever entries, they move when the language does, i.e. never) */
  const VERBS = [
    ['infer', 'Think. Ask any model · local or cloud.'],
    ['exec', 'Run. A shell command, captured and typed.'],
    ['invoke', 'Use a tool. Every tool explicit.'],
    ['agent', 'Delegate. An autonomous loop, on a leash you can read.'],
  ]
  for (const [v, hint] of VERBS)
    entries.push({ kind: 'verb', label: `verb: ${v}`, href: `/verbs/${v}`, hint })

  /* showcases · one room per conformance-gated workflow (slugs from the
     generated projection · regex like the words below — never an import) */
  const ucSrc = readFileSync(join(ROOT, 'src/sections/usecases-yaml.generated.ts'), 'utf8')
  const slugs = [...new Set([...ucSrc.matchAll(/'(t\d-[a-z0-9-]+)':/g)].map((m) => m[1]))].sort()
  for (const slug of slugs)
    entries.push({
      kind: 'usecase',
      label: slug.replace(/^t\d-/, '').replace(/-/g, ' '),
      href: `/use-cases/${slug}`,
      hint: 'a real workflow · the whole file, one room',
    })

  /* language words · the keyword register (read from the generated module —
     the vite.config blog-dates precedent: the projection is the source; a
     regex, not an import, keeps this script out of the app graph) */
  const lang = readFileSync(join(ROOT, 'src/content/language.generated.ts'), 'utf8')
  const words = JSON.parse(
    lang.slice(lang.indexOf('LANGUAGE_WORDS: LanguageWord[] = ') + 33, lang.indexOf('/** word → entry')).trim(),
  )
  for (const w of words) {
    const scopes = w.decls.map((d) => d.scope).join(' · ')
    const desc = w.decls.find((d) => d.desc)?.desc
    entries.push({
      kind: 'word',
      label: w.word,
      href: `/language/${w.word}`,
      hint: desc ? `${scopes} — ${desc}`.slice(0, 110) : scopes,
    })
  }

  return entries
}

const HEADER = `// palette.generated.ts — AUTO-GENERATED by scripts/build-palette.mjs
// from the curated core routes + the atlas descriptor sets + content/blog
// frontmatter + the error catalog + the tools catalog + the language
// projection. DO NOT EDIT · regenerate:
//   node scripts/build-palette.mjs
// Drift gate: src/test/palette.test.ts recompiles and byte-diffs.

export interface PaletteEntry {
  /** page (core surface) · post (journal) · error (registry code) · tool (stdlib builtin) · provider (catalog id) · template (skeleton) · verb (execution model) · word (language key) · set (atlas register) · member (roomed register member) */
  kind: 'page' | 'post' | 'error' | 'tool' | 'provider' | 'template' | 'verb' | 'word' | 'usecase' | 'set' | 'member'
  label: string
  href: string
  /** the dim second line — tag · date · one-line failure · … */
  hint: string
}

export const PALETTE: PaletteEntry[] = `

const isMain = process.argv[1] === fileURLToPath(import.meta.url)
if (isMain) {
  const entries = compilePalette()
  const out = HEADER + JSON.stringify(entries, null, 2) + '\n'
  writeFileSync(join(ROOT, 'src/content/palette.generated.ts'), out)
  console.log(`wrote src/content/palette.generated.ts (${entries.length} entries)`)
}

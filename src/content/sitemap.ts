import { BLOG_POSTS } from './blog.generated'
import { ERROR_CODES } from './errors.generated'
import { TOOLS } from './tools.generated'
import { LANGUAGE_WORDS } from './language.generated'
import { CHAPTERS } from '../sections/verbs-data'
import { PROVIDERS } from './providers.generated'
import { TEMPLATES } from './templates.generated'
import { UC_TABS } from '../sections/usecases-data'
import { DOCS, REPO, SPEC } from '../content'

/* ─── the site map registry · one labeled source, two consumers ───────────────
   /map's « every page » section renders THIS structure (the human sitemap
   the /map mother page absorbed at WO-3 · /sitemap 301s there);
   src/test/map.test.ts asserts it COVERS the prerender manifest (every
   route in site.config PATHS must appear here, and every internal href
   here must be a real route) — a page shipped without joining the map
   goes red in CI, never silently undiscoverable. The dense tails (posts ·
   tools · error codes) derive from the same generated modules the
   register pages render, so the map can never drift from the registers.

   Curated by hand ON PURPOSE: groups and glosses are editorial (what a
   sitemap is FOR); membership is what the gate enforces. */

export interface MapLink {
  label: string
  href: string
  /** the dim second line (top-level links only) */
  hint?: string
  external?: boolean
}

export interface MapGroup {
  /** the group's kick — lowercase, the register grammar */
  kick: string
  gloss: string
  links: MapLink[]
  /** the exhaustive mono grid under the group (deep pages · variants) */
  dense?: MapLink[]
}

/* the 7 translated variants — EN is the top-level /manifesto link itself */
const MANIFESTO_LOCALES: MapLink[] = [
  { label: 'FR', href: '/fr/manifesto' },
  { label: 'ES', href: '/es/manifesto' },
  { label: 'DE', href: '/de/manifesto' },
  { label: 'PT', href: '/pt-br/manifesto' },
  { label: '日本語', href: '/ja/manifesto' },
  { label: '한국어', href: '/ko/manifesto' },
  { label: '中文', href: '/zh-hans/manifesto' },
]

export const SITE_MAP: MapGroup[] = [
  {
    kick: 'start',
    gloss: 'from zero to a first run',
    links: [
      { label: 'Install', href: '/install', hint: 'one binary · two minutes' },
      { label: 'Playground', href: '/play', hint: 'write Nika in the browser, checked live' },
      { label: 'Learn it in 5 minutes', href: '/learn', hint: 'one file, line by line' },
      { label: 'Use cases', href: '/use-cases', hint: 'real files you would write' },
      { label: 'Send us a workflow', href: '/convert', hint: 'yours, converted' },
    ],
    dense: UC_TABS.flatMap((t) => t.cases.map((uc) => ({ label: uc.title, href: `/use-cases/${uc.slug}` }))),
  },
  {
    kick: 'product',
    gloss: 'what Nika is, and why',
    links: [
      { label: 'Home', href: '/', hint: 'the film · intent as code' },
      { label: 'The map', href: '/map', hint: 'every page, one graph · the anatomy' },
      { label: 'The flow', href: '/flow', hint: 'two doors, one graph · the gate matrix' },
      { label: 'The boundary', href: '/boundary', hint: 'permits · secrets · the always-on floor' },
      { label: 'The proof', href: '/proof', hint: 'run graph · conformance · machine surfaces' },
      { label: 'Spec', href: '/spec', hint: 'the language reference · nika: v1' },
      { label: 'Docs', href: DOCS, hint: 'guides · examples · the full reference', external: true },
      { label: 'Manifesto', href: '/manifesto', hint: 'the drum of liberation · 8 languages' },
    ],
    dense: MANIFESTO_LOCALES,
  },
  {
    kick: 'reference',
    gloss: 'the registers: projections of the binary and the spec, never prose',
    links: [
      {
        label: 'Standard library',
        href: '/tools',
        hint: `every nika: builtin, one closed namespace (${TOOLS.length})`,
      },
      {
        label: 'The four verbs',
        href: '/verbs',
        hint: 'infer · exec · invoke · agent; locked forever, one room each',
      },
      {
        label: 'The language',
        href: '/language',
        hint: `every schema-declared word (${LANGUAGE_WORDS.length})`,
      },
      {
        label: 'Error registry',
        href: '/errors',
        hint: `every typed check finding (${ERROR_CODES.length})`,
      },
      {
        label: 'Providers',
        href: '/providers',
        hint: `local first · your keys · no lock-in (${PROVIDERS.length})`,
      },
      {
        label: 'Templates',
        href: '/templates',
        hint: `instantiable skeletons: route · copy · fill (${TEMPLATES.length})`,
      },
      { label: 'Changelog', href: '/changelog', hint: 'the ship log, dated and tagged' },
      { label: 'Brand', href: '/brand', hint: 'the marks · icons · motion' },
    ],
    dense: [
      ...TOOLS.map((t) => ({ label: t.name, href: `/tools/${t.bare}` })),
      ...CHAPTERS.map((c) => ({ label: `verb: ${c.verb}`, href: `/verbs/${c.verb}` })),
      ...LANGUAGE_WORDS.map((w) => ({ label: w.word, href: `/language/${w.word}` })),
      ...ERROR_CODES.map((e) => ({ label: e.code, href: `/errors/${e.code}` })),
      ...PROVIDERS.map((p) => ({ label: `provider: ${p.id}`, href: `/providers#${p.id}` })),
      ...TEMPLATES.map((t) => ({ label: t.file, href: `/templates/${t.name}` })),
    ],
  },
  {
    kick: 'writing',
    gloss: 'notes from the source: long-form pedagogy, newest first',
    links: [{ label: 'Blog', href: '/blog', hint: 'the journal · rss + full text for machines' }],
    dense: BLOG_POSTS.map((p) => ({ label: p.title, href: `/blog/${p.slug}` })),
  },
  {
    kick: 'machines',
    gloss: 'the machine-readable twins: same facts the pages render',
    links: [
      { label: 'llms.txt', href: '/llms.txt', hint: 'the agent-facing summary' },
      { label: 'llms-full.txt', href: '/llms-full.txt', hint: 'every post, full text' },
      { label: 'rss.xml', href: '/rss.xml', hint: 'the journal feed' },
      { label: 'sitemap.xml', href: '/sitemap.xml', hint: 'this map, for crawlers' },
      { label: 'tools catalog', href: '/tools/catalog.json', hint: 'the stdlib vocabulary, JSON' },
      { label: 'error catalog', href: '/errors/catalog.json', hint: 'the typed registry, JSON' },
      {
        label: 'provider catalog',
        href: '/providers/catalog.json',
        hint: 'the named set + model pins, JSON',
      },
      {
        label: 'template catalog',
        href: '/templates/catalog.json',
        hint: 'the skeletons, sha256-pinned, JSON',
      },
      {
        label: 'workflow schema',
        href: '/schema/workflow.json',
        hint: 'the served contract: what editors validate against',
      },
      {
        label: 'spec/v1 schema',
        href: '/spec/v1/workflow.schema.json',
        hint: 'the versioned twin the yaml-language-server line points at',
      },
      { label: 'icon ontology', href: '/brand/icons.json', hint: 'every mark, with semantics' },
      { label: 'security.txt', href: '/.well-known/security.txt', hint: 'how to reach us, signed' },
    ],
  },
  {
    kick: 'studio',
    gloss: 'the source, and the people behind it',
    links: [
      { label: 'Engine on GitHub', href: REPO, hint: 'Rust · AGPL-3.0-or-later', external: true },
      { label: 'Language spec', href: SPEC, hint: 'Apache-2.0 · adopt freely', external: true },
      {
        label: 'VS Code extension',
        href: 'https://marketplace.visualstudio.com/items?itemName=supernovae.nika-lang',
        hint: 'the canvas in your editor',
        external: true,
      },
      {
        label: 'Homebrew tap',
        href: 'https://github.com/supernovae-st/homebrew-tap',
        hint: 'brew install supernovae-st/tap/nika',
        external: true,
      },
      {
        label: 'SuperNovae',
        href: 'https://supernovae.studio',
        hint: 'the studio · Paris',
        external: true,
      },
    ],
  },
]

/** Every internal href the map carries (the coverage gate's read side). */
export function sitemapInternalHrefs(): string[] {
  const out: string[] = []
  for (const g of SITE_MAP) {
    for (const l of [...g.links, ...(g.dense ?? [])]) {
      if (!l.external && l.href.startsWith('/')) {
        out.push(l.href)
      }
    }
  }
  return out
}

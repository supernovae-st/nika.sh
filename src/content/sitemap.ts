import { BLOG_POSTS, BLOG_SERIES } from './blog.generated'
import { INTEGRATION_TABS } from './integrations-tabs'
import { CLIENT_DOOR_IDS } from './client-doors'
import { ADR_ROOM_IDS } from './adr-ids.generated'
import { NEP_SLUGS } from './nep-ids.generated'
import { ERROR_CODES } from './errors.generated'
import { RELEASE_TAGS } from './release-tags.generated'
import { LESSONS } from './lessons.generated'
import { CHAPTERS as SPEC_CHAPTERS } from './chapters.generated'
import { MARKET_PROVIDER_IDS } from './catalog-paths.generated'
import { TOOLS } from './tools.generated'
import { LANGUAGE_WORDS } from './language.generated'
import { CHAPTERS } from '../sections/verbs-data'
import { PROVIDERS } from './providers.generated'
import { TEMPLATES } from './templates.generated'
import { UC_TABS } from '../sections/usecases-data'
import { MEMBER_ROOM_FAMILIES } from './member-rooms.generated'
import { MODEL_IDS, MODEL_SLUGS, MCP_IDS, MCP_SLUGS } from './catalog-paths.generated'
import { DOCS, REPO, SPEC } from '../content'
import { localizedPaths } from '../lib/i18n'
import { PENDING_ERROR_CODES } from '../../pending-error-codes'
import { wordRoom } from '../lib/rooms'

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
      { label: 'Use cases', href: '/workflows/jobs', hint: 'real files you would write' },
      { label: 'Send us a workflow', href: '/convert', hint: 'yours, converted' },
    ],
    dense: [
      ...UC_TABS.flatMap((t) => t.cases.map((uc) => ({ label: uc.title, href: `/workflows/jobs/${uc.slug}` }))),
      /* the install locale cluster (WO-10 wiring) — derived from the registry */
      ...localizedPaths('/install').map((p) => ({ label: `install · ${p.split('/')[1]}`, href: p })),
    ],
  },
  {
    kick: 'product',
    gloss: 'what Nika is, and why',
    links: [
      { label: 'Home', href: '/', hint: 'the film · intent as code' },
      { label: 'The map', href: '/map', hint: 'every page, one graph · the anatomy' },
      { label: 'The city', href: '/city', hint: 'which repo each piece lives in, at which pin' },
      { label: 'The decisions', href: '/city/decisions', hint: 'the 71 ADRs behind the engine, with their status' },
      /* the settled decisions each own a room · the map lists them the way it
         lists every other roomed family, from the record itself */
      ...ADR_ROOM_IDS.map((id) => ({ label: id, href: `/city/decisions/${id.toLowerCase()}` })),
      { label: 'Releases', href: '/releases', hint: 'every version, its assets, its digests' },
      /* one room per published release · from the vendored record (tags only,
         tree-shaken · the record itself stays behind releases-access) */
      ...RELEASE_TAGS.map((t) => ({ label: t, href: `/releases/${t}` })),
      { label: 'How it works', href: '/how', hint: 'the loop · try · new · check · run · trace' },
      { label: 'Workflows', href: '/workflows', hint: 'the path · the jobs · the skeletons' },
      { label: 'The router', href: '/how/router', hint: 'plain words in, a real workflow out · no model' },
      { label: 'The flow', href: '/how/flow', hint: 'two doors, one graph · the gate matrix' },
      { label: 'The boundary', href: '/how/boundary', hint: 'permits · secrets · the always-on floor' },
      { label: 'The proof', href: '/how/proof', hint: 'run graph · conformance · machine surfaces' },
      { label: 'The truth system', href: '/truth', hint: 'how this site tells the truth · verify it yourself' },
      { label: 'Spec', href: '/language/spec', hint: 'the language reference · the nine-key envelope' },
      { label: 'Governance', href: '/language/governance', hint: 'the 18 NEPs · how the standard changes' },
      { label: 'Timeline', href: '/timeline', hint: 'the one verifiable record · eras · releases · gates' },
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
        href: '/language/stdlib',
        hint: `every nika: builtin, one closed namespace (${TOOLS.length})`,
      },
      {
        label: 'The four verbs',
        href: '/language/verbs',
        hint: 'infer · exec · invoke · agent; locked forever, one room each',
      },
      {
        label: 'The language',
        href: '/language',
        hint: `every schema-declared word (${LANGUAGE_WORDS.length})`,
      },
      {
        label: 'Error registry',
        href: '/language/errors',
        hint: `every typed check finding (${ERROR_CODES.length})`,
      },
      {
        label: 'Providers',
        href: '/catalog/providers',
        hint: `local first · your keys · no lock-in (${PROVIDERS.length})`,
      },
      {
        label: 'Templates',
        href: '/workflows/skeletons',
        hint: `instantiable skeletons: route · copy · fill (${TEMPLATES.length})`,
      },
      { label: 'Changelog', href: '/changelog', hint: 'the ship log, dated and tagged' },
      { label: 'Brand', href: '/brand', hint: 'the marks · icons · motion' },
    ],
    dense: [
      ...TOOLS.map((t) => ({ label: t.name, href: `/language/stdlib/${t.bare}` })),
      /* the teaching path (V2 · 2026-08-02) · one room per numbered spec
         example, derived from the pin-sourced module */
      ...LESSONS.map((l) => ({ label: `path: ${l.slug}`, href: `/workflows/path/${l.slug}` })),
      /* the specification's chapter rooms (V3 · 2026-08-02) · derived from
         the pin-sourced module, so a chapter joins the map the day it lands */
      ...SPEC_CHAPTERS.map((c) => ({ label: `spec: ${c.slug}`, href: `/language/spec/${c.slug}` })),
      ...NEP_SLUGS.map((s) => ({ label: `NEP-${s.slice(4, 8)}`, href: `/language/governance/${s}` })),
      /* the market-only vendor rooms (2026-08-02) · the 17 the spec names are
         listed by the register-roots block above, so only the other 21 here */
      ...MARKET_PROVIDER_IDS.filter((id) => !PROVIDERS.some((p) => p.id === id)).map((id) => ({
        label: `provider: ${id}`,
        href: `/catalog/providers/${id}`,
      })),
      ...CHAPTERS.map((c) => ({ label: `verb: ${c.verb}`, href: `/language/verbs/${c.verb}` })),
      ...LANGUAGE_WORDS.map((w) => ({ label: w.word, href: wordRoom(w.word) })),
      ...ERROR_CODES.map((e) => ({ label: e.code, href: `/language/errors/${e.code}` })),
      /* the pending rooms (minted in the canon, awaiting the resync pin —
         pending-error-codes.ts, the leaf site.config derives ERROR_PATHS
         from): the room prerenders the day the code is minted, so the map
         lists it the same day. Deduped against the projection — when the
         pin lands the code, the ERROR_CODES row takes over and this filter
         yields nothing (the uniqueness gate stays single-voice: overlap is
         the errors gate's red, not this one's). */
      ...PENDING_ERROR_CODES.filter((c) => !ERROR_CODES.some((e) => e.code === c)).map((c) => ({
        label: c,
        href: `/language/errors/${c}`,
      })),
      ...TEMPLATES.map((t) => ({ label: t.file, href: `/workflows/skeletons/${t.name}` })),
      /* rooms universelles (verdict 2026-07-18): every member of every
         roomed register — derived from the SAME generated registry the
         generic room renders, so the map can never drift from the rooms
         (providers included: the anchors became pages) */
      /* every family's ROOT joins its rooms (the /types 404 class) —
         minus the dedicated doors already placed above (providers · truth:
         its root fused with the epistemology page, linked in product) */
      ...Object.keys(MEMBER_ROOM_FAMILIES)
        // the registry key is the whole path since the families moved inside
        // their worlds (catalog/providers · language/types), so the two that
        // are listed by hand above are named by their FULL key
        .filter((f) => f !== 'catalog/providers' && f !== 'truth')
        .map((f) => ({
          label: `${f} · the root`,
          href: `/${f}`,
        })),
      ...Object.values(MEMBER_ROOM_FAMILIES).flatMap((f) =>
        f.members.map((m) => ({ label: `${f.set}: ${m.id}`, href: m.url })),
      ),
    ],
  },
  {
    kick: 'writing',
    gloss: 'notes from the source: long-form pedagogy, newest first',
    links: [{ label: 'Blog', href: '/blog', hint: 'the journal · rss + full text for machines' }],
    dense: [
      ...BLOG_POSTS.map((p) => ({ label: p.title, href: `/blog/${p.slug}` })),
      /* the tag registers — derived from the same posts (a pipe-tagged
         post counts in every register it names) */
      ...[...new Set(BLOG_POSTS.flatMap((p) => p.tag.split('|').map((t) => t.trim())))]
        .sort()
        .map((t) => ({ label: `tag: ${t}`, href: `/blog/tags/${t.toLowerCase()}` })),
      /* the reading paths — one page per series */
      ...Object.entries(BLOG_SERIES).map(([sid, s]) => ({
        label: `path: ${s.title}`,
        href: `/blog/series/${sid}`,
      })),
    ],
  },
    {
    kick: 'the integrations',
    gloss: 'get Nika into your stack: your agent, your editor, your terminal',
    links: [
      {
        label: 'Integrations',
        href: '/integrations',
        hint: 'Claude Code · Codex · Cursor · VS Code · Hermes · MCP · the repos',
      },
    ],
    /* the authored lanes and surfaces, then every OTHER client door the
       binary knows: 26 of the 31 rows in the coverage matrix had no room
       until 2026-08-02, so the map could not list them either. */
    dense: [
      ...INTEGRATION_TABS.map((e) => ({ label: e.name, href: `/integrations/${e.id}` })),
      ...CLIENT_DOOR_IDS.map((id) => ({ label: id, href: `/integrations/${id}` })),
    ],
  },
  {
    kick: 'the catalog',
    gloss: 'what the released binary knows · vendored at the engine pin, digest-verified',
    links: [
      { label: 'The catalog', href: '/catalog', hint: 'models · pricing · energy · MCP · embeddings · every count derived' },
      { label: 'Models', href: '/catalog/models', hint: 'one room per model: seats, price, energy' },
      { label: 'Pricing', href: '/catalog/pricing', hint: 'the rule table the audit reads' },
      { label: 'Energy', href: '/catalog/energy', hint: 'measured Wh/Mtok · provenance verbatim' },
      { label: 'MCP servers', href: '/catalog/mcp', hint: 'the tool servers a workflow can wire' },
      { label: 'Embeddings', href: '/catalog/embeddings', hint: 'dimensions · windows · metrics' },
      { label: 'Capability rules', href: '/catalog/capabilities', hint: 'first match wins · the engine resolves' },
    ],
    dense: [
      ...MODEL_SLUGS.map((slug, i) => ({ label: MODEL_IDS[i], href: `/catalog/models/${slug}` })),
      ...MCP_SLUGS.map((slug, i) => ({ label: MCP_IDS[i], href: `/catalog/mcp/${slug}` })),
    ],
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

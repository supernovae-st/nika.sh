import type { RouteObject } from 'react-router'
import RootLayout from './shell/RootLayout'
import { Component as Home } from './pages/Home'
import { Component as Blog } from './pages/Blog'
import { Component as BlogTag } from './pages/BlogTag'
import { Component as BlogSeries } from './pages/BlogSeries'
import { Component as BlogPost } from './pages/BlogPost'
import { Component as Learn } from './pages/Learn'
import { Component as Play } from './pages/Play'
import { Component as Manifesto } from './pages/Manifesto'
import { Component as Changelog } from './pages/Changelog'
import { Component as UseCasesPage } from './pages/UseCasesPage'
import { Component as UseCaseRoom } from './pages/UseCaseRoom'
import { Component as SpecHub } from './pages/SpecHub'
import { Component as ChapterRoom } from './pages/ChapterRoom'
import { Component as Timeline } from './pages/Timeline'
import { Component as Install } from './pages/Install'
import { Component as Convert } from './pages/Convert'
import { Component as Brand } from './pages/Brand'
import { Component as NotFound } from './pages/NotFound'
import { Component as Errors } from './pages/Errors'
import { Component as ErrorPage } from './pages/ErrorPage'
import { Component as Tools } from './pages/Tools'
import { Component as ToolPage } from './pages/ToolPage'
import { Component as Verbs } from './pages/Verbs'
import { Component as VerbPage } from './pages/VerbPage'
import { Component as Language } from './pages/Language'
import { Component as WordPage } from './pages/WordPage'
import { Component as MapPage } from './pages/Map'
import { Component as How } from './pages/How'
import { Component as Workflows } from './pages/Workflows'
import { Component as LessonRoom } from './pages/LessonRoom'
import { Component as HowRouter } from './pages/HowRouter'
import { Component as FlowPage } from './pages/Flow'
import { Component as SourcesPage } from './pages/Sources'
import { Component as BoundaryPage } from './pages/Boundary'
import { Component as ProofPage } from './pages/Proof'
import { Component as Providers } from './pages/Providers'
import { Component as ProviderPage } from './pages/ProviderPage'
import { Component as MemberRoom } from './pages/MemberRoom'
import { Component as FamilyRoot } from './pages/FamilyRoot'
import { Component as Templates } from './pages/Templates'
import { Component as TemplatePage } from './pages/TemplatePage'
import { Component as Integrations } from './pages/Integrations'
import { Component as Catalog } from './pages/Catalog'
import { Component as CatalogModels } from './pages/CatalogModels'
import { Component as CatalogModelRoom } from './pages/CatalogModelRoom'
import { Component as CatalogPricing } from './pages/CatalogPricing'
import { Component as CatalogEnergy } from './pages/CatalogEnergy'
import { Component as CatalogMcp } from './pages/CatalogMcp'
import { Component as CatalogMcpRoom } from './pages/CatalogMcpRoom'
import { Component as CatalogEmbeddings } from './pages/CatalogEmbeddings'
import { Component as CatalogCapabilities } from './pages/CatalogCapabilities'
import { Component as IntegrationRoom } from './pages/IntegrationRoom'

/* ─── central route table · React Router v7 data router ──────────────────────
   Replaces the old hand-rolled hash navigation (#/blog, #/manifesto …) with
   real paths. In-page anchors (#language, #verbs, #install …) stay native
   scroll anchors INSIDE Home, not routes.

   Pages are referenced SYNCHRONOUSLY via `Component` (not RR `lazy`): the
   build-time prerenderer (vite-plugin-react-ssg, route mode) renders each route
   through React Router's static handler, which does NOT await `lazy` dynamic
   imports — a `lazy` route resolves after Vite's SSR module runner has closed
   and the route renders the default ErrorBoundary instead. Sync `Component`
   keeps the route table the single source of truth for both prerender and the
   browser router. Genuinely heavy leaves stay code-split where they're used
   (e.g. the three.js galaxy via React.lazy as <GalaxyEgg/> in Home). */

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, Component: Home },
      { path: 'blog', Component: Blog },
      /* the journal's tag registers — a citable page per tag (the ?tag=
         filter on /blog keeps the browsing job) — and its reading paths */
      { path: 'blog/tags/:tag', Component: BlogTag },
      { path: 'blog/series/:id', Component: BlogSeries },
      { path: 'blog/:slug', Component: BlogPost },
      { path: 'learn', Component: Learn },
      { path: 'play', Component: Play },
      { path: 'manifesto', Component: Manifesto },
      /* the manifesto's BCP 47 cluster · explicit locale routes, same page
         (the component reads the pathname; hreflang wires the family) */
      { path: 'fr/manifesto', Component: Manifesto },
      { path: 'es/manifesto', Component: Manifesto },
      { path: 'de/manifesto', Component: Manifesto },
      { path: 'pt-br/manifesto', Component: Manifesto },
      { path: 'ja/manifesto', Component: Manifesto },
      { path: 'ko/manifesto', Component: Manifesto },
      { path: 'zh-hans/manifesto', Component: Manifesto },
      /* the install cluster (WO-10 wiring · same page, locale from pathname) */
      { path: 'fr/install', Component: Install },
      { path: 'es/install', Component: Install },
      { path: 'de/install', Component: Install },
      { path: 'pt-br/install', Component: Install },
      { path: 'ja/install', Component: Install },
      { path: 'ko/install', Component: Install },
      { path: 'zh-hans/install', Component: Install },
      { path: 'changelog', Component: Changelog },
      /* the error register · the human twin of /errors/catalog.json — and
         one ROOM per code (ErrorPage: the refusal · named-by rails · the
         namespace walked). The engine's check findings stamp
         docs_url = /errors/<CODE>; every code page prerenders its own
         static landing (ERROR_PATHS in site.config.ts). */
      { path: 'errors', Component: Errors },
      { path: 'errors/:code', Component: ErrorPage },
      /* the stdlib register · the human twin of /tools/catalog.json — and one
         ROOM per builtin (ToolPage: contract · usage · cross-refs). Every
         room prerenders its own static landing (TOOL_PATHS in site.config.ts). */
      { path: 'tools', Component: Tools },
      { path: 'tools/:name', Component: ToolPage },
      /* the language surfaces · the four verb ROOMS + the keyword register
         (every schema-declared word, /errors-style anchored rows). All
         prerender (VERB_PATHS + LANGUAGE_PATHS in site.config.ts). */
      { path: 'language/verbs', Component: Verbs },
      { path: 'language/verbs/:name', Component: VerbPage },
      { path: 'language', Component: Language },
      { path: 'language/words/:word', Component: WordPage },
      /* the provider register · the human twin of /providers/catalog.json.
         Spec-named set only; the engine's embedded tail stays a count. */
      { path: 'catalog/providers', Component: Providers },
      /* rooms universelles (operator verdict 2026-07-18 · « chaque élément a
         sa page ») — ONE generic room route per roomed register family; the
         member registry + PATHS both derive from the descriptor, so a new
         family is a descriptor flip, never a route edit. Providers graduated
         to a DEDICATED room (the ToolPage/WordPage path): derived facts +
         authored meta + an audited donor file per provider. */
      { path: 'catalog/providers/:id', Component: ProviderPage },
      /* every roomed family owns its ROOT too (the /types 404 of
         2026-07-24: rooms without a root are a trimmed-URL dead end) —
         one generic component, the registry drives it */
      { path: 'language/namespaces', Component: FamilyRoot },
      { path: 'language/types', Component: FamilyRoot },
      { path: 'language/edges', Component: FamilyRoot },
      { path: 'language/predicates', Component: FamilyRoot },
      { path: 'language/families', Component: FamilyRoot },
      { path: 'language/modes', Component: FamilyRoot },
      { path: 'language/permits', Component: FamilyRoot },
      { path: 'language/secrets', Component: FamilyRoot },
      { path: 'language/conformance', Component: FamilyRoot },
      { path: 'language/error-namespaces', Component: FamilyRoot },
      { path: 'language/error-categories', Component: FamilyRoot },
      { path: 'how/oracle', Component: FamilyRoot },
      /* the truth hub IS the epistemology page (fused from /sources
         2026-08-02 · §1.3) — its member rows render inside it */
      { path: 'truth', Component: SourcesPage },
      { path: 'language/namespaces/:id', Component: MemberRoom },
      { path: 'language/types/:id', Component: MemberRoom },
      { path: 'language/edges/:id', Component: MemberRoom },
      { path: 'language/predicates/:id', Component: MemberRoom },
      { path: 'language/families/:id', Component: MemberRoom },
      { path: 'language/modes/:id', Component: MemberRoom },
      { path: 'language/permits/:id', Component: MemberRoom },
      { path: 'language/secrets/:id', Component: MemberRoom },
      { path: 'language/conformance/:id', Component: MemberRoom },
      { path: 'language/error-namespaces/:id', Component: MemberRoom },
      { path: 'language/error-categories/:id', Component: MemberRoom },
      { path: 'how/oracle/:id', Component: MemberRoom },
      { path: 'truth/:id', Component: MemberRoom },
      /* the skeleton register · the human twin of /templates/catalog.json —
         and one ROOM per skeleton (TemplatePage: the file whole ·
         sha-pinned · grants and carries rails). */
      { path: 'workflows/skeletons', Component: Templates },
      { path: 'workflows/skeletons/:name', Component: TemplatePage },
      /* the mother page · the anatomy of the language, one graph. The
         coverage gate (src/test/map.test.ts) keeps it exhaustive both
         ways; /sitemap meta-refreshes here via the STATIC stub
         public/sitemap/index.html (the /docs pattern · a React stub
         hydrated during its own refresh and threw #418). */
      { path: 'map', Component: MapPage },
      /* the lens-born hubs (WO-4) · their routes ride LENS_PATHS (the
         compiler's site.config section) — descriptor flip + recompile is
         how a hub is born */
      /* the /how world (V1 · the eight-worlds migration) · the RÉCIT world:
         the hub carries the loop (moved from /learn) and the router story
         that lived nowhere. A hub RECOUNTS how
         a subsystem works, which is what /how is for. The URLs moved by a
         descriptor flip (sets.yaml hub:) — these literals follow it, and the
         old paths live on as doorways (legacy_moves · zero-404.test). */
      { path: 'how', Component: How },
      { path: 'how/router', Component: HowRouter },
      { path: 'how/flow', Component: FlowPage },
      { path: 'how/boundary', Component: BoundaryPage },
      { path: 'how/proof', Component: ProofPage },
      /* the /workflows world (V2 · the eight-worlds migration) · the corpus:
         the PATH is new (13 spec lessons the site never rendered), the jobs
         and skeletons re-home under it (their old URLs live on as doorways). */
      { path: 'workflows', Component: Workflows },
      { path: 'workflows/path/:slug', Component: LessonRoom },
      { path: 'workflows/jobs', Component: UseCasesPage },
      /* one room per conformance-gated showcase (§4.13 · rooms_exist flip:
         LENS_PATHS prerenders all 26 · the gallery keeps the browse) */
      { path: 'workflows/jobs/:slug', Component: UseCaseRoom },
      /* the integrations · get Nika into your stack: one room per client
         lane (Claude Code · Codex · Cursor · VS Code · Hermes · MCP) and
         per public repo — install rituals verbatim from the READMEs */
      { path: 'integrations', Component: Integrations },
      { path: 'integrations/:id', Component: IntegrationRoom },
      /* the catalog world (D1 · engine-release clock) — what the released
         binary KNOWS: models, pricing, energy, MCP servers, embeddings,
         capability rules. Every page derives from the vendored engine
         surfaces at the pin (scripts/build-catalog.mjs); room routes ride
         CATALOG_PATHS in site.config.ts. */
      { path: 'catalog', Component: Catalog },
      { path: 'catalog/models', Component: CatalogModels },
      { path: 'catalog/models/:slug', Component: CatalogModelRoom },
      { path: 'catalog/pricing', Component: CatalogPricing },
      { path: 'catalog/energy', Component: CatalogEnergy },
      { path: 'catalog/mcp', Component: CatalogMcp },
      { path: 'catalog/mcp/:slug', Component: CatalogMcpRoom },
      { path: 'catalog/embeddings', Component: CatalogEmbeddings },
      { path: 'catalog/capabilities', Component: CatalogCapabilities },
      /* the specification EXPLODES (V3 · 2026-08-02): one page for eighteen
         chapters gave no citable address to any of them. The 3D machine that
         was its hero died with it (the operator's nuke mandate). */
      { path: 'language/spec', Component: SpecHub },
      { path: 'language/spec/:chapter', Component: ChapterRoom },
      { path: 'timeline', Component: Timeline },
      { path: 'install', Component: Install },
      { path: 'convert', Component: Convert },
      { path: 'brand', Component: Brand },
      /* the SPA catch-all — client-side navigations to a bad path render the
         crafted 404 register instead of React Router's default error boundary.
         Hard misses keep the static public/404.html (.do/app.yaml · unchanged);
         `*` is never prerendered (PATHS in site.config.ts stays the list). */
      { path: '*', Component: NotFound },
    ],
  },
]

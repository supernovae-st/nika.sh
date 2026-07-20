import type { RouteObject } from 'react-router'
import RootLayout from './shell/RootLayout'
import { Component as Home } from './pages/Home'
import { Component as Blog } from './pages/Blog'
import { Component as BlogPost } from './pages/BlogPost'
import { Component as Learn } from './pages/Learn'
import { Component as Play } from './pages/Play'
import { Component as Manifesto } from './pages/Manifesto'
import { Component as Changelog } from './pages/Changelog'
import { Component as UseCasesPage } from './pages/UseCasesPage'
import { Component as UseCaseRoom } from './pages/UseCaseRoom'
import { Component as Spec } from './pages/Spec'
import { Component as Timeline } from './pages/Timeline'
import { Component as Install } from './pages/Install'
import { Component as Convert } from './pages/Convert'
import { Component as Brand } from './pages/Brand'
import { Component as NotFound } from './pages/NotFound'
import { Component as Errors } from './pages/Errors'
import { Component as Tools } from './pages/Tools'
import { Component as ToolPage } from './pages/ToolPage'
import { Component as Verbs } from './pages/Verbs'
import { Component as VerbPage } from './pages/VerbPage'
import { Component as Language } from './pages/Language'
import { Component as WordPage } from './pages/WordPage'
import { Component as MapPage } from './pages/Map'
import { Component as FlowPage } from './pages/Flow'
import { Component as SourcesPage } from './pages/Sources'
import { Component as BoundaryPage } from './pages/Boundary'
import { Component as ProofPage } from './pages/Proof'
import { Component as Providers } from './pages/Providers'
import { Component as MemberRoom } from './pages/MemberRoom'
import { Component as Templates } from './pages/Templates'

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
      /* the error register · the human twin of /errors/catalog.json. The
         engine's check findings stamp docs_url = /errors/<CODE>; every code
         page prerenders to its own static landing (ERROR_PATHS in
         site.config.ts — deep links land on a real 200) and scrolls to its
         anchored row. */
      { path: 'errors', Component: Errors },
      { path: 'errors/:code', Component: Errors },
      /* the stdlib register · the human twin of /tools/catalog.json — and one
         ROOM per builtin (ToolPage: contract · usage · cross-refs). Every
         room prerenders its own static landing (TOOL_PATHS in site.config.ts). */
      { path: 'tools', Component: Tools },
      { path: 'tools/:name', Component: ToolPage },
      /* the language surfaces · the four verb ROOMS + the keyword register
         (every schema-declared word, /errors-style anchored rows). All
         prerender (VERB_PATHS + LANGUAGE_PATHS in site.config.ts). */
      { path: 'verbs', Component: Verbs },
      { path: 'verbs/:name', Component: VerbPage },
      { path: 'language', Component: Language },
      { path: 'language/:word', Component: WordPage },
      /* the provider register · the human twin of /providers/catalog.json.
         Spec-named set only; the engine's embedded tail stays a count. */
      { path: 'providers', Component: Providers },
      /* rooms universelles (operator verdict 2026-07-18 · « chaque élément a
         sa page ») — ONE generic room route per roomed register family; the
         member registry + PATHS both derive from the descriptor, so a new
         family is a descriptor flip, never a route edit. /providers/:id is
         REBORN as a real page here (the WO-6 meta-refresh stubs die). */
      { path: 'providers/:id', Component: MemberRoom },
      { path: 'namespaces/:id', Component: MemberRoom },
      { path: 'types/:id', Component: MemberRoom },
      { path: 'edges/:id', Component: MemberRoom },
      { path: 'predicates/:id', Component: MemberRoom },
      { path: 'families/:id', Component: MemberRoom },
      { path: 'modes/:id', Component: MemberRoom },
      { path: 'permits/:id', Component: MemberRoom },
      { path: 'secrets/:id', Component: MemberRoom },
      { path: 'conformance/:id', Component: MemberRoom },
      { path: 'error-namespaces/:id', Component: MemberRoom },
      { path: 'error-categories/:id', Component: MemberRoom },
      { path: 'mcp/:id', Component: MemberRoom },
      { path: 'truth/:id', Component: MemberRoom },
      /* the skeleton register · the human twin of /templates/catalog.json.
         Deep links open the full SLOT-marked workflow in the product panel. */
      { path: 'templates', Component: Templates },
      { path: 'templates/:name', Component: Templates },
      /* the mother page · the anatomy of the language, one graph. The
         coverage gate (src/test/map.test.ts) keeps it exhaustive both
         ways; /sitemap meta-refreshes here via the STATIC stub
         public/sitemap/index.html (the /docs pattern · a React stub
         hydrated during its own refresh and threw #418). */
      { path: 'map', Component: MapPage },
      /* the atlas-born hubs (WO-4) · their routes ride ATLAS_PATHS (the
         compiler's site.config section) — descriptor flip + recompile is
         how a hub is born */
      { path: 'sources', Component: SourcesPage },
      { path: 'flow', Component: FlowPage },
      { path: 'boundary', Component: BoundaryPage },
      { path: 'proof', Component: ProofPage },
      { path: 'use-cases', Component: UseCasesPage },
      /* one room per conformance-gated showcase (§4.13 · rooms_exist flip:
         ATLAS_PATHS prerenders all 26 · the gallery keeps the browse) */
      { path: 'use-cases/:slug', Component: UseCaseRoom },
      { path: 'spec', Component: Spec },
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

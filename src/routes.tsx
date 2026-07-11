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
import { Component as Spec } from './pages/Spec'
import { Component as Install } from './pages/Install'
import { Component as Convert } from './pages/Convert'
import { Component as Brand } from './pages/Brand'
import { Component as NotFound } from './pages/NotFound'
import { Component as Errors } from './pages/Errors'
import { Component as Tools } from './pages/Tools'
import { Component as Sitemap } from './pages/Sitemap'
import { Component as Providers } from './pages/Providers'

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
      { path: 'changelog', Component: Changelog },
      /* the error register · the human twin of /errors/catalog.json. The
         engine's check findings stamp docs_url = /errors/<CODE>; every code
         page prerenders to its own static landing (ERROR_PATHS in
         site.config.ts — deep links land on a real 200) and scrolls to its
         anchored row. */
      { path: 'errors', Component: Errors },
      { path: 'errors/:code', Component: Errors },
      /* the stdlib register · the human twin of /tools/catalog.json. Every
         builtin prerenders its own static landing (TOOL_PATHS in
         site.config.ts) and scrolls to its anchored row. */
      { path: 'tools', Component: Tools },
      { path: 'tools/:name', Component: Tools },
      /* the provider register · the human twin of /providers/catalog.json.
         Spec-named set only; the engine's embedded tail stays a count. */
      { path: 'providers', Component: Providers },
      { path: 'providers/:id', Component: Providers },
      /* the human map · the twin of sitemap.xml. The coverage gate
         (src/test/sitemap.test.ts) keeps it exhaustive both ways. */
      { path: 'sitemap', Component: Sitemap },
      { path: 'use-cases', Component: UseCasesPage },
      { path: 'spec', Component: Spec },
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

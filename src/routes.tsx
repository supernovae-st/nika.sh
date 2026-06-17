import type { RouteObject } from 'react-router'
import RootLayout from './shell/RootLayout'

/* ─── central route table · React Router v7 data router ──────────────────────
   Replaces the old hand-rolled hash navigation (#/blog, #/manifesto …) with
   real paths. Each page is code-split via RR `lazy` (the module exports a
   `Component`). Shared chrome (Nav/Footer/EdgeAurora) arrives in Task 0.6 —
   for now RootLayout is just an <Outlet />. In-page anchors (#language,
   #verbs, #install …) stay native scroll anchors INSIDE Home, not routes. */

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, lazy: () => import('./pages/Home') },
      { path: 'blog', lazy: () => import('./pages/Blog') },
      { path: 'learn', lazy: () => import('./pages/Learn') },
      { path: 'play', lazy: () => import('./pages/Play') },
      { path: 'manifesto', lazy: () => import('./pages/Manifesto') },
      // new pages added in Phase 4
    ],
  },
]

import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { createHead, UnheadProvider } from '@unhead/react/client'
import { createBrowserRouter, RouterProvider, type HydrationState } from 'react-router'
import './index.css'
import { routes } from './routes'

/* ─── client entry · hydrate the prerendered HTML ────────────────────────────
   Each route ships as static HTML built by vite-plugin-react-ssg (build-time
   prerender · see vite.config.ts + react-ssg.config.ts). At build the plugin
   injects `window.__staticRouterHydrationData` (React Router's static handler
   loader/action snapshot) into each page's <body>; we reuse it so the data
   router hydrates without re-running loaders. In `pnpm dev` the var is absent
   and #app is empty — hydrateRoot then just renders (no prerendered DOM to
   reconcile). @unhead/react drives the per-route <head> (useHead on each page),
   matching the UnheadProvider the prerenderer wraps the static render in. */

const hydrationData = (
  window as Window & { __staticRouterHydrationData?: HydrationState }
).__staticRouterHydrationData

const router = createBrowserRouter(routes, {
  ...(hydrationData ? { hydrationData } : {}),
})

const head = createHead()

hydrateRoot(
  document.getElementById('app')!,
  <StrictMode>
    <UnheadProvider head={head}>
      <RouterProvider router={router} />
    </UnheadProvider>
  </StrictMode>,
)

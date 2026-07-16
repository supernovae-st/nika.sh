import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { createHead, UnheadProvider } from '@unhead/react/client'
import { createBrowserRouter, RouterProvider, type HydrationState } from 'react-router'
import './index.css'
import { routes } from './routes'

/* ─── client entry · hydrate the prerendered HTML (or mount fresh in dev) ─────
   Each route ships as static HTML built by vite-plugin-react-ssg (build-time
   prerender · see vite.config.ts + react-ssg.config.ts). At build the plugin
   injects `window.__staticRouterHydrationData` (React Router's static handler
   loader/action snapshot) into each page's <body>; we reuse it so the data
   router hydrates without re-running loaders.

   In `pnpm dev` there is NO prerender: #app is empty and the hydration var is
   absent. `hydrateRoot` against an empty container throws a hydration mismatch
   on EVERY load (React then recovers via a full client re-render — loud, and
   doubled under StrictMode). So we branch on whether the container actually
   holds prerendered DOM: hydrate the static HTML in prod, create a fresh root
   in dev. The SAME element tree is rendered in both paths, so there is no
   render divergence — only the mount strategy differs.

   @unhead/react drives the per-route <head> (useHead on each page), matching the
   UnheadProvider the prerenderer wraps the static render in. */

const hydrationData = (
  window as Window & { __staticRouterHydrationData?: HydrationState }
).__staticRouterHydrationData

const router = createBrowserRouter(routes, {
  ...(hydrationData ? { hydrationData } : {}),
})

const head = createHead()

const container = document.getElementById('app')!

const tree = (
  <StrictMode>
    <UnheadProvider head={head}>
      <RouterProvider router={router} />
    </UnheadProvider>
  </StrictMode>
)

// A deploy can retire hashed chunks under a live tab; the next lazy import
// then dies. One reload against the new manifest heals it — the session flag
// keeps a genuinely broken deploy from reload-looping.
window.addEventListener('vite:preloadError', () => {
  if (sessionStorage.getItem('lens-chunk-reload') === '1') return
  sessionStorage.setItem('lens-chunk-reload', '1')
  window.location.reload()
})

// Prerendered HTML present (prod) → hydrate it. Empty container (dev) → mount fresh.
sessionStorage.removeItem('lens-chunk-reload')
if (container.firstChild) {
  hydrateRoot(container, tree)
} else {
  createRoot(container).render(tree)
}

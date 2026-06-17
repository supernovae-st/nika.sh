import { Outlet, ScrollRestoration, useLocation } from 'react-router'
import { AuroraProvider } from '../fx/EdgeAurora'
import Nav from './Nav'
import './skip-link.css'

/* ─── the app shell ─────────────────────────────────────────────────────────
   The routed outlet + scroll restoration (restores scroll on back/forward and
   scrolls to a #hash target after a cross-route navigation — e.g. the Learn
   page's "Install" CTA → /#install), wrapped in the EdgeAurora signature: a
   reactive cyan→violet halo that hugs the screen frame (design doc §3.2).
   AuroraProvider exposes useAuroraPulse().pulse() to the tree AND renders the
   <EdgeAurora/> visual itself (a fixed, pointer-events:none, z-60 frame layer).

   <Nav/> is the ONE shared v4 nav (monochrome blueprint) — mounted here so every
   route shares a single nav (no per-page duplicate). It is fixed/sticky and
   transparent over a hero, solid once scrolled. The Footer stays per-page for
   now (the SUPERNOVAE wordmark lives inside Home).

   Exception · /manifesto. The manifesto is a self-contained cinematic page in a
   different visual register (the cosmic cyan "drum", not the v4 monochrome
   blueprint) and ships its OWN centered glass mini-nav (brand · "Manifesto" ·
   ← Back to site) that belongs to that identity. So the shared monochrome Nav is
   suppressed there — exactly one nav on that route, no overlap. Deriving this
   from the path (not a route flag) keeps it identical on SSR + client, so it
   never introduces a hydration branch. */

const BARE_NAV_ROUTES = new Set(['/manifesto'])

export default function RootLayout() {
  const { pathname } = useLocation()
  const showNav = !BARE_NAV_ROUTES.has(pathname)

  return (
    <AuroraProvider>
      <ScrollRestoration />
      {/* the first focusable on every page · visually hidden until focused, then
          it reveals and jumps keyboard users past the nav straight to the routed
          content (#main). */}
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      {showNav ? <Nav /> : null}
      {/* the routed content target · the skip link lands here (id="main"); each
          page renders its own <main> landmark inside. tabindex=-1 so the link can
          move focus to it programmatically. */}
      <div id="main" tabIndex={-1} className="skip-target">
        <Outlet />
      </div>
    </AuroraProvider>
  )
}

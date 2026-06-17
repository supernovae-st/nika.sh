import { Outlet, ScrollRestoration } from 'react-router'
import { AuroraProvider } from '../fx/EdgeAurora'

/* ─── the app shell ─────────────────────────────────────────────────────────
   The routed outlet + scroll restoration (restores scroll on back/forward and
   scrolls to a #hash target after a cross-route navigation — e.g. the Learn
   page's "Install" CTA → /#install), wrapped in the EdgeAurora signature: a
   reactive cyan→violet halo that hugs the screen frame (design doc §3.2).
   AuroraProvider exposes useAuroraPulse().pulse() to the tree AND renders the
   <EdgeAurora/> visual itself (a fixed, pointer-events:none, z-60 frame layer).
   The shared Nav / Footer are not built yet — do not add them here. */

export default function RootLayout() {
  return (
    <AuroraProvider>
      <ScrollRestoration />
      <Outlet />
    </AuroraProvider>
  )
}

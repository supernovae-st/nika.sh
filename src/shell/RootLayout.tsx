import { Outlet, ScrollRestoration } from 'react-router'

/* ─── the app shell ─────────────────────────────────────────────────────────
   For NOW this is the routed outlet + scroll restoration (restores scroll on
   back/forward and scrolls to a #hash target after a cross-route navigation —
   e.g. the Learn page's "Install" CTA → /#install). The shared Nav / Footer /
   EdgeAurora land in Task 0.6 — do not add them here yet (visual parity: the
   v3 pages each carry their own nav/footer until the shell is built). */

export default function RootLayout() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  )
}

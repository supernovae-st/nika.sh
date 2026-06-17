import { Outlet } from 'react-router'

/* ─── the app shell ─────────────────────────────────────────────────────────
   For NOW this is just the routed outlet. The shared Nav / Footer / EdgeAurora
   land in Task 0.6 — do not add them here yet (visual parity: the v3 pages
   each carry their own nav/footer until the shell is built). */

export default function RootLayout() {
  return <Outlet />
}

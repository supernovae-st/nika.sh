import { Suspense, lazy, useSyncExternalStore } from 'react'

/* ─── client-only mount for the r3f galaxy canvas ────────────────────────────
   The galaxy is a WebGL <Canvas> (@react-three/fiber): creating it touches
   `window` / a GL context / requestAnimationFrame, none of which exist in the
   Node prerender (vite-plugin-react-ssg renders each route with renderToString).
   Rendering it there would throw and the route's HTML would be skipped.

   The fix is a hydration-aware flag: `useSyncExternalStore` returns the SERVER
   snapshot (`false`) during the Node prerender AND on the first client render
   (React always uses the server snapshot for that initial hydration pass), then
   the CLIENT snapshot (`true`) once committed. So the prerendered HTML and the
   initial hydrated tree are byte-identical (Canvas absent) → zero hydration
   mismatch. After hydration the real Canvas mounts, lazy-loaded so the heavy
   three.js chunk never enters the prerender or the critical path. The galaxy
   then appears in the browser exactly as before.

   (useSyncExternalStore is the idiom React provides for exactly this — distinct
   server/client values without a setState-in-effect.) */

const Galaxy3D = lazy(() => import('./Galaxy'))

const emptySubscribe = () => () => {}

/** false during prerender + first hydration pass, true once on the client. */
function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true, // client snapshot
    () => false, // server snapshot
  )
}

export default function ClientOnlyGalaxy() {
  const hydrated = useHydrated()
  if (!hydrated) return null
  return (
    <Suspense fallback={null}>
      <Galaxy3D />
    </Suspense>
  )
}

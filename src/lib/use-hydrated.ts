import { useSyncExternalStore } from 'react'

/* hydration-safe client detector · the canonical React 19 pattern (no
   setState-in-effect). getServerSnapshot returns false → SSR and the client's
   FIRST render agree (the static fallback shows), so hydration stays
   byte-identical; getSnapshot returns true on the client, so the very next
   render mounts the live surface. Shared by every lazy-behind-Suspense mount
   that would otherwise put a boundary in the SSG tree (the React #419 class —
   Play's editor, the footer signature). */
const subscribeNoop = () => () => {}

export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  )
}

import { useEffect, useState } from 'react'
import { ISLAND_DOLLAR } from './ssg-island'

/* the island ships every `$` as ISLAND_DOLLAR so no replacement pattern can
   survive the SSG plugin's `template.replace(…, string)` assembly · see
   ssg-island.tsx. This is the one place the bytes come back. */
const decode = (raw: string) => raw.split(ISLAND_DOLLAR).join('$')

/* the reader half of the ssg-island recipe (see ssg-island.tsx for the
   full mechanism note) — its own module per the react-refresh law */

/** the island's payload: SSR → the value the caller awaited in its SSR-only
    branch · hydration → the DOM island's exact bytes · SPA nav → '' then the
    caller's loader resolves the async chunk (setter returned for that). */
export function useIslandPayload(
  id: string,
  ssrPayload: string | null,
  load: () => Promise<string>,
): string {
  const [payload, setPayload] = useState<string>(() => {
    if (import.meta.env.SSR) return ssrPayload ?? ''
    return decode((document.getElementById(id) as HTMLTextAreaElement | null)?.value ?? '')
  })
  /* SPA-nav fallback · fires once when the island is absent (never on
     first load: the island always carries the bytes there) — an effect,
     the Map precedent (a loader in render is a side effect) */
  useEffect(() => {
    if (payload) return
    let live = true
    void load().then((p) => {
      if (live) setPayload((cur) => cur || p)
    })
    return () => {
      live = false
    }
  }, [payload, load])
  return payload
}

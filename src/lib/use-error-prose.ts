import { useCallback } from 'react'
import { useIslandPayload } from './use-island-payload'
import { islandJson } from './island-json'
import { ssrErrorProse, loadErrorProse, type ErrorProse } from './error-prose-access'

/* the ONE reader of the refusal-prose island. Two pages show these sentences —
   the register (/errors, all 96) and the room (/errors/:code, one) — and one
   hook serves both, so the island id cannot disagree between the page that
   writes it and the page that reads it. */

/** the island id for a page's prose payload — scoped, because the register
    ships the whole corpus while a room ships a single line */
export const errorProseIslandId = (scope: string) => `err-prose-${scope}`

/** the prose for this page: SSG → the SSR module · hydration → the island's
    bytes · SPA-nav → the async chunk. `null` only during that last beat. */
export function useErrorProse(scope: string, codes?: readonly string[]): ErrorProse | null {
  const pick = useCallback(
    (all: ErrorProse): ErrorProse =>
      codes ? Object.fromEntries(codes.filter((c) => all[c]).map((c) => [c, all[c]])) : all,
    [codes],
  )
  const load = useCallback(async () => islandJson(pick(await loadErrorProse())), [pick])
  const ssr = ssrErrorProse()
  const payload = useIslandPayload(
    errorProseIslandId(scope),
    ssr ? islandJson(pick(ssr)) : null,
    load,
  )
  return payload ? (JSON.parse(payload) as ErrorProse) : null
}

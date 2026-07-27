import { useCallback } from 'react'
import { useIslandPayload } from './use-island-payload'
import { ssrWordProse, loadWordProse, type WordProse } from './language-prose-access'

/* the ONE reader of the language prose island — three pages show the
   contract's sentences (/language · /language/:word · /verbs/:name) and one
   hook serves all three, so the second-producer gate stays quiet and the
   island id can never disagree between the page that writes it and the page
   that reads it. */

/** the island id for a page's prose payload — scoped, because /language ships
    every word while a room ships one */
export const proseIslandId = (scope: string) => `lang-prose-${scope}`

/** the prose for this page: SSG → the SSR module · hydration → the island's
    bytes · SPA-nav → the async chunk. `null` only during that last beat. */
export function useWordProse(scope: string, words?: readonly string[]): WordProse | null {
  const pick = useCallback(
    (all: WordProse): WordProse =>
      words ? Object.fromEntries(words.filter((w) => all[w]).map((w) => [w, all[w]])) : all,
    [words],
  )
  const load = useCallback(
    async () => JSON.stringify(pick(await loadWordProse())),
    [pick],
  )
  const ssr = ssrWordProse()
  const payload = useIslandPayload(
    proseIslandId(scope),
    ssr ? JSON.stringify(pick(ssr)) : null,
    load,
  )
  return payload ? (JSON.parse(payload) as WordProse) : null
}

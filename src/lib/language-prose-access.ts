/* ─── language-prose-access · the ONLY door to the schema's teaching prose ────
   (register-diet law · the provider-room-access precedent)

   THE PROSE IS THE POINT OF THE ROOMS AND THE WEIGHT OF THE ENTRY, both at
   once. /language/<word>, /language and /verbs/<name> exist to show the
   contract's own sentence for a word — and all three are sync-routed, because
   the prerenderer needs `Component` synchronous, so whatever they import
   statically rides the ENTRY chunk for every visitor including the ones who
   never open a room.

   Measured 2026-07-27: 3.9 KB gz, growing with every sentence the contract
   mints. So the sentences live in their own module and reach a page three
   ways, in this order:

     · at SSG        — the top-level SSR import below (prerender is synchronous,
                       so the HTML ships the prose, and the rooms stay readable
                       with JavaScript off)
     · on hydration  — the byte island the page embedded (no fetch, no flash,
                       no mismatch)
     · on SPA-nav    — loadWordProse(), one async chunk, once

   Nothing but this door and the build scripts should import
   language-prose.generated.ts. */

type ProseModule = typeof import('../content/language-prose.generated')

let SSR_PROSE: ProseModule | null = null
if (import.meta.env.SSR) {
  SSR_PROSE = await import('../content/language-prose.generated')
}

/** word → its sentence per declaration, index-aligned with `decls` */
export type WordProse = Record<string, string[]>

/** the prose at SSG time (null on the client by construction) */
export const ssrWordProse = (): WordProse | null => SSR_PROSE?.WORD_PROSE ?? null

/** the prose on the client — the async chunk, once */
export const loadWordProse = async (): Promise<WordProse> =>
  (await import('../content/language-prose.generated')).WORD_PROSE

/** the sentence for one declaration — '' and undefined both read as absent, so
    a caller can fall back to the curated gloss with a single `||`. */
export const declProse = (prose: WordProse | null, word: string, index: number): string =>
  prose?.[word]?.[index] || ''

/** the word's first sentence, whichever declaration carries it (the room's
    voice: `after` speaks once at the task surface, `model` speaks three times
    and the envelope's line is the one that teaches). */
export const wordVoice = (prose: WordProse | null, word: string): string =>
  prose?.[word]?.find(Boolean) || ''

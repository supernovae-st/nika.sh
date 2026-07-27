/* ─── error-prose-access · the ONLY door to the canon's refusal sentences ─────
   (register-diet law · the language-prose-access precedent)

   THE PROSE IS THE POINT OF /errors AND THE WEIGHT OF THE ENTRY, both at once.
   /errors and /errors/:code exist to show what a code refuses, and both are
   sync-routed because the prerenderer needs `Component` synchronous — so the
   whole 96-sentence corpus rode the entry chunk for every visitor, including
   the ones who never meet a diagnostic.

   Measured 2026-07-27 by emptying the strings and rebuilding: 4.4 KB gz, and
   it grows with every code the canon mints (thirteen arrived today alone).

   Three ways a page reaches it, in this order:
     · at SSG        — the top-level SSR import below, so the HTML ships the
                       sentence and a room reads with JavaScript off
     · on hydration  — the byte island the page embedded
     · on SPA-nav    — loadErrorProse(), one async chunk, once

   Nothing but this door and the build scripts should import
   error-prose.generated.ts. */

type ProseModule = typeof import('../content/error-prose.generated')

let SSR_PROSE: ProseModule | null = null
if (import.meta.env.SSR) {
  SSR_PROSE = await import('../content/error-prose.generated')
}

/** code → the one line the canon gives its refusal */
export type ErrorProse = Record<string, string>

/** the prose at SSG time (null on the client by construction) */
export const ssrErrorProse = (): ErrorProse | null => SSR_PROSE?.ERROR_PROSE ?? null

/** the prose on the client — the async chunk, once */
export const loadErrorProse = async (): Promise<ErrorProse> =>
  (await import('../content/error-prose.generated')).ERROR_PROSE

/** one code's sentence — '' while the chunk is still in flight, so a caller
    can render the row without a null branch */
export const failureOf = (prose: ErrorProse | null, code: string): string => prose?.[code] ?? ''

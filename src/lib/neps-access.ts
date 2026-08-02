import type { BlogToken } from '../content/blog.generated'
import type { Nep } from '../content/neps.generated'

/* ─── neps-access · the ONLY door to the governance corpus ───────────────────
   (the chapters-access recipe) neps-body.generated.ts is 18 whole proposals —
   the public process by which the language changes. It reaches the client
   only as an async chunk: SSG reads it through the SSR-only await so every
   proposal room prerenders with its text in the HTML, and a SPA hop pulls the
   chunk once.

   Tokens, never HTML: the markdown parser stays a devDependency and the
   client receives data it renders with its own components. */

let SSR_TOKENS: Record<string, BlogToken[]> | null = null
let SSR_REGISTER: { neps: Nep[]; pin: { spec_commit: string }; counts: Record<string, number> } | null = null
if (import.meta.env.SSR) {
  const m = await import('../content/neps-body.generated')
  SSR_TOKENS = m.NEP_TOKENS
  const r = await import('../content/neps.generated')
  SSR_REGISTER = { neps: r.NEPS, pin: r.NEPS_PIN, counts: r.NEP_STATUS_COUNTS }
}

/** the register at SSG time (null on the client · ride the island) */
export const ssrNeps = () => SSR_REGISTER

/** the register on the client · the async chunk, once */
export const loadNeps = async () => {
  const r = await import('../content/neps.generated')
  return { neps: r.NEPS, pin: r.NEPS_PIN, counts: r.NEP_STATUS_COUNTS }
}

/** the whole corpus at SSG time (null on the client · ride the island) */
export const ssrNepTokens = (): Record<string, BlogToken[]> | null => SSR_TOKENS

/** the corpus on the client · the async chunk, once */
export const loadNepTokens = async (): Promise<Record<string, BlogToken[]>> =>
  (await import('../content/neps-body.generated')).NEP_TOKENS

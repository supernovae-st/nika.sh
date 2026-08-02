import type { BlogToken } from '../content/blog.generated'

/* ─── adr-bodies-access · the ONLY door to the decision record's prose ───────
   (the chapters-access recipe) adr-bodies.generated.ts is 59 whole decisions
   — the settled half of the engine's architecture record, lexed at build time
   into the site's own token vocabulary. It reaches the client only as an
   async chunk: SSG reads it through the SSR-only await so every decision room
   prerenders with its text in the HTML, and a SPA hop pulls the chunk once.

   Tokens, never HTML: the markdown parser stays a devDependency and the
   client receives data it renders with its own components (the build-blog
   law), so a yaml fence inside a decision draws as the product's editor
   panel. */

let SSR_TOKENS: Record<string, BlogToken[]> | null = null
if (import.meta.env.SSR) {
  const m = await import('../content/adr-bodies.generated')
  SSR_TOKENS = m.ADR_TOKENS
}

/** the whole record at SSG time (null on the client · ride the island) */
export const ssrAdrTokens = (): Record<string, BlogToken[]> | null => SSR_TOKENS

/** the record on the client · the async chunk, once */
export const loadAdrTokens = async (): Promise<Record<string, BlogToken[]>> =>
  (await import('../content/adr-bodies.generated')).ADR_TOKENS

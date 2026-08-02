import type { BlogToken } from '../content/blog.generated'

/* ─── chapters-access · the ONLY door to the specification's tokens ──────────
   (the anatomy-access recipe) chapters-body.generated.ts is the WHOLE spec —
   53k words across eighteen chapters, lexed at build time into the site's own
   token vocabulary. It reaches the client only as an async chunk: SSG reads
   it through the SSR-only await so every chapter room prerenders with its
   text in the HTML, and a SPA hop pulls the chunk once.

   Tokens, never HTML: the markdown parser stays a devDependency and the
   client receives data it renders with its own components (the build-blog
   law), so a yaml fence in the spec draws as the product's editor panel. */

let SSR_TOKENS: Record<string, BlogToken[]> | null = null
if (import.meta.env.SSR) {
  const m = await import('../content/chapters-body.generated')
  SSR_TOKENS = m.CHAPTER_TOKENS
}

/** the whole pack at SSG time (null on the client · ride the island) */
export const ssrChapterTokens = (): Record<string, BlogToken[]> | null => SSR_TOKENS

/** the pack on the client · the async chunk, once */
export const loadChapterTokens = async (): Promise<Record<string, BlogToken[]>> =>
  (await import('../content/chapters-body.generated')).CHAPTER_TOKENS

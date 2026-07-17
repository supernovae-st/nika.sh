/* ─── blog-rails-access · the ONLY doors to the cross-rails data ──────────────
   (register-diet law · the showcase-yaml-access precedent) The D5/D6 rails
   (FROM_BLOG · POST_MENTIONS · RELATED_POSTS) must reach the client only as
   an async chunk — pages feed their FIRST render from a byte island
   (ssg-island.tsx) whose payload they compute via ssrBlogRails(). The
   bundle-safety gate in atlas.test pins "no static import of
   blog-rails.generated outside this module". */

type BlogRails = typeof import('../content/blog-rails.generated')

let SSR_RAILS: BlogRails | null = null
if (import.meta.env.SSR) {
  SSR_RAILS = await import('../content/blog-rails.generated')
}

/** the whole rails module at SSG time (null on the client by construction) */
export const ssrBlogRails = (): BlogRails | null => SSR_RAILS

/** the rails on the client — the async chunk, once */
export const loadBlogRails = async (): Promise<BlogRails> =>
  import('../content/blog-rails.generated')

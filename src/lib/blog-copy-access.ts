/* The journal's descriptions and source-file metadata live beside the post
   bodies, outside the initial route graph. SSG reads them here; hydration
   receives the exact slice in a byte island; SPA navigation loads the same
   generated chunk once. */

import type { BlogPostCopy } from '../content/blog-bodies.generated'

type BlogCopy = Record<string, BlogPostCopy>

let SSR_COPY: BlogCopy | null = null
if (import.meta.env.SSR) {
  SSR_COPY = (await import('../content/blog-bodies.generated')).BLOG_POST_COPY
}

export const ssrBlogCopy = (): BlogCopy | null => SSR_COPY

export const loadBlogCopy = async (): Promise<BlogCopy> =>
  (await import('../content/blog-bodies.generated')).BLOG_POST_COPY

import { describe, expect, it } from 'vitest'
import { BLOG_POSTS, BLOG_SERIES } from '../content/blog.generated'
import { BLOG_TAG_PATHS, BLOG_SERIES_PATHS, PATHS } from '../../site.config'

/* ── the tag-register drift gates (the library shelf died 2026-08-02 · D6) ───
   site.config.ts keeps its path lists literal (the file stays import-free
   for the browser bundle); these gates re-derive each set from its living
   source and fail on any divergence — a new tag without its path goes red,
   never a silently missing page. */

describe('/blog/tags/:tag · the tag registers mirror the posts', () => {
  it('BLOG_TAG_PATHS is exactly the derived tag set (lowercased, sorted)', () => {
    const tags = [
      ...new Set(BLOG_POSTS.flatMap((p) => p.tag.split('|').map((t) => t.trim().toLowerCase()))),
    ].sort()
    expect(BLOG_TAG_PATHS).toEqual(tags.map((t) => `/blog/tags/${t}`))
  })

  it('every tag page prerenders (PATHS carries the registers)', () => {
    for (const p of BLOG_TAG_PATHS) {
      expect(PATHS).toContain(p)
    }
  })

  it('BLOG_SERIES_PATHS is exactly the declared reading paths', () => {
    expect(BLOG_SERIES_PATHS).toEqual(
      Object.keys(BLOG_SERIES)
        .sort()
        .map((sid) => `/blog/series/${sid}`),
    )
    for (const p of BLOG_SERIES_PATHS) {
      expect(PATHS).toContain(p)
    }
  })
})


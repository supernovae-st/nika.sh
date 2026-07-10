import { describe, expect, it } from 'vitest'
// @ts-expect-error — the compiler is the untyped build script itself (the
// blog gate's pattern: same code path, recompile and diff)
import { compilePalette } from '../../scripts/build-palette.mjs'
import { PALETTE } from '../content/palette.generated'
import { BLOG_POSTS } from '../content/blog.generated'
import { ERROR_CODES } from '../content/errors.generated'
import { BLOG_PATHS, PATHS } from '../../site.config'

/* ── the palette drift gate ───────────────────────────────────────────────────
   palette.generated.ts is a projection of three sources (curated core ·
   blog frontmatter · the error catalog). Editing a post or landing an error
   registry bump without `node scripts/build-palette.mjs` goes red here —
   the ⌘K corpus can never silently lag the site. */

describe('/palette · the ⌘K corpus matches its sources', () => {
  it('palette.generated.ts is exactly what the compiler emits today', () => {
    expect(PALETTE).toEqual(compilePalette())
  })

  it('every post is reachable from the palette', () => {
    const hrefs = new Set(PALETTE.map((e) => e.href))
    for (const p of BLOG_POSTS) expect(hrefs.has(`/blog/${p.slug}`), p.slug).toBe(true)
  })

  it('every error code is reachable from the palette', () => {
    const hrefs = new Set(PALETTE.map((e) => e.href))
    for (const e of ERROR_CODES) expect(hrefs.has(`/errors/${e.code}`), e.code).toBe(true)
  })

  it('every palette href is a real route (prerender set)', () => {
    const routes = new Set([...PATHS, ...BLOG_PATHS])
    for (const e of PALETTE) expect(routes.has(e.href), e.href).toBe(true)
  })
})

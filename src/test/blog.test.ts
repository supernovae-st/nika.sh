import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error — the compiler is the untyped build script itself (the point: same code path)
import { compileAll } from '../../scripts/build-blog.mjs'
import { BLOG_POSTS } from '../content/blog.generated'
import { BLOG_PATHS } from '../../site.config'

/* ── the blog drift gates · sources and projections may never disagree ────────
   content/blog/*.md is the source; three projections ride the repo:
   src/content/blog.generated.ts (the site), public/rss.xml (the feed) and
   BLOG_PATHS in site.config.ts (prerender + sitemap). Each gate recomputes
   from source and diffs against the committed artifact — editing a post
   without `node scripts/build-blog.mjs` (or forgetting the PATHS line, or the
   README table row) goes red here, never silently stale to prod. */

describe('/blog · the compiled projection matches its markdown sources', () => {
  const fresh = compileAll() as typeof BLOG_POSTS

  it('blog.generated.ts is exactly what the compiler emits today', () => {
    expect(BLOG_POSTS).toEqual(fresh)
  })

  it('every post prerenders · BLOG_PATHS mirrors the slugs', () => {
    expect([...BLOG_PATHS].sort()).toEqual(fresh.map((p) => `/blog/${p.slug}`).sort())
  })

  it('the feed carries every post at its real URL', () => {
    const rss = readFileSync(join(__dirname, '../../public/rss.xml'), 'utf8')
    for (const p of fresh) {
      expect(rss).toContain(`<link>https://nika.sh/blog/${p.slug}</link>`)
      expect(rss).toContain(`<pubDate>${new Date(`${p.date}T09:00:00Z`).toUTCString()}</pubDate>`)
    }
  })

  it('the GitHub face (content/blog/README.md) lists every post file', () => {
    const readme = readFileSync(join(__dirname, '../../content/blog/README.md'), 'utf8')
    for (const p of fresh) expect(readme).toContain(p.file)
  })

  it('posts are newest-first with sane frontmatter', () => {
    const dates = fresh.map((p) => p.date)
    expect(dates).toEqual([...dates].sort().reverse())
    for (const p of fresh) {
      expect(p.slug).toMatch(/^[a-z0-9-]+$/)
      expect(p.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(p.readingMin).toBeGreaterThan(0)
      expect(p.tokens.length).toBeGreaterThan(2)
    }
  })
})

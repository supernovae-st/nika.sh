import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error — the compiler is the untyped build script itself (the point: same code path)
import { compileAll, SERIES } from '../../scripts/build-blog.mjs'
import { BLOG_POSTS } from '../content/blog.generated'
import { BLOG_BODIES } from '../content/blog-bodies.generated'
import { BLOG_PATHS } from '../../site.config'

/* ── the blog drift gates · sources and projections may never disagree ────────
   content/blog/*.md is the source; three projections ride the repo:
   src/content/blog.generated.ts (the site), public/rss.xml (the feed) and
   BLOG_PATHS in site.config.ts (prerender + sitemap). Each gate recomputes
   from source and diffs against the committed artifact — editing a post
   without `node scripts/build-blog.mjs` (or forgetting the PATHS line, or the
   README table row) goes red here, never silently stale to prod. */

describe('/blog · the compiled projection matches its markdown sources', () => {
  const fresh = compileAll() as (typeof BLOG_POSTS[number] & { tokens: unknown[] })[]
  const freshMetas = fresh.map((p) => {
    const meta = { ...p } as Partial<typeof p>
    delete meta.tokens
    return meta
  })

  it('blog.generated.ts is exactly what the compiler emits today (metadata)', () => {
    expect(BLOG_POSTS).toEqual(freshMetas)
  })

  it('blog-bodies.generated.ts is exactly what the compiler emits today (bodies)', () => {
    expect(BLOG_BODIES).toEqual(Object.fromEntries(fresh.map((p) => [p.slug, p.tokens])))
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
      expect(p.tokens.length).toBeGreaterThan(2) /* fresh — the compiler still carries tokens */
    }
  })
})

/* ── the series gates · a reading path can never ship half-wired ──────────────
   The compiler refuses every partial state; each test drives compileAll over a
   real fixture dir (same code path as the build) and asserts the REFUSAL —
   the error text names the offending file/stop, so a red gate is actionable. */
describe('/blog · series gates refuse half-wired reading paths', () => {
  const write = (dir: string, name: string, front: string) =>
    writeFileSync(
      join(dir, name),
      `---\nslug: ${name.replace(/\.md$/, '')}\ntitle: "T"\ntag: Engine\ndate: 2026-01-0${name.length % 9 || 1}\ndescription: "d"\n${front}---\n\nBody one.\n\nBody two.\n\nBody three.\n`,
    )
  const fixture = (fronts: Record<string, string>) => {
    const dir = mkdtempSync(join(tmpdir(), 'blog-gate-'))
    for (const [name, front] of Object.entries(fronts)) write(dir, name, front)
    return dir
  }

  it('members of the live trace-family cover its declared stops exactly once', () => {
    const members = (compileAll() as typeof BLOG_POSTS).filter((p) => p.series === 'trace-family')
    expect(members.map((p) => p.seriesStop).sort()).toEqual(
      [...SERIES['trace-family'].stops].sort(),
    )
  })

  it('an unknown series id is refused', () => {
    const dir = fixture({ 'a.md': 'series: no-such-line\nseries_stop: evidence\n', 'b.md': '' })
    expect(() => compileAll(dir)).toThrow(/unknown series "no-such-line"/)
  })

  it('a stop outside the registry line is refused', () => {
    const dir = fixture({ 'a.md': 'series: trace-family\nseries_stop: teleport\n', 'b.md': '' })
    expect(() => compileAll(dir)).toThrow(/stop "teleport" not in series/)
  })

  it('a stop claimed by two posts is refused', () => {
    const dir = fixture({
      'a.md': 'series: trace-family\nseries_stop: evidence\n',
      'b.md': 'series: trace-family\nseries_stop: evidence\n',
    })
    expect(() => compileAll(dir)).toThrow(/claimed twice/)
  })

  it('an incomplete path (declared stop with no post) is refused', () => {
    const dir = fixture({ 'a.md': 'series: trace-family\nseries_stop: evidence\n', 'b.md': '' })
    expect(() => compileAll(dir)).toThrow(/missing its "replay" stop/)
  })
})
